import { BN, EventParser, type Program } from "@anchor-lang/core";
import { AccountLayout } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { Earmark } from "./anchor";
import { fetchTxLogs } from "./txs";
import {
  fetchFundraisers,
  fetchRecipients,
  recipientPda,
  statusOf,
  type FundraiserView,
  type RecipientView,
} from "./chain";

/** Thresholds for the red-flag rules (docs/PLAN.md §5, T14). Flags are hints, not verdicts. */
export const NEW_RECIPIENT_DAYS = 7;
export const HIGH_VOLUME_COUNT = 3;
export const HIGH_VOLUME_DAYS = 7;
export const OUTLIER_FACTOR = 10;
export const MANY_CANCELLED = 3;
const DAY = 86_400;

export type FlagKind = "newRecipient" | "highVolume" | "targetOutlier" | "unclaimedRefunds" | "manyCancelled";

export type FlagLink = { label: string; kind: "fundraiser" | "address"; key: string };

export type Flag = {
  kind: FlagKind;
  text: string;
  links: FlagLink[];
};

export type MovementKind = "donation" | "payout" | "refund";

export type Movement = {
  signature: string;
  blockTime: number | null;
  kind: MovementKind;
  fundraiser: PublicKey;
  /** Donor for donation, recipient wallet for payout, donor for refund. */
  party: PublicKey;
  amount: BN;
};

export type AuditData = {
  fundraisers: FundraiserView[];
  recipients: RecipientView[];
  /** Token base units still held in each fundraiser's vault, keyed by fundraiser pubkey. */
  vaultBalances: Map<string, bigint>;
  totals: { held: bigint; paid: bigint; refunded: bigint };
};

export function vaultPda(programId: PublicKey, fundraiser: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("vault"), fundraiser.toBuffer()], programId)[0];
}

async function fetchVaultBalances(program: Program<Earmark>, fundraisers: FundraiserView[]) {
  const vaults = fundraisers.map((f) => vaultPda(program.programId, f.pubkey));
  const balances = new Map<string, bigint>();
  // getMultipleAccountsInfo accepts up to 100 keys per call.
  for (let i = 0; i < vaults.length; i += 100) {
    const infos = await program.provider.connection.getMultipleAccountsInfo(vaults.slice(i, i + 100));
    infos.forEach((info, j) => {
      const key = fundraisers[i + j].pubkey.toBase58();
      balances.set(key, info ? AccountLayout.decode(info.data).amount : 0n);
    });
  }
  return balances;
}

/** Most recent program transactions, decoded into donations, payouts and refunds. */
export async function fetchMovements(program: Program<Earmark>, limit = 100): Promise<{ movements: Movement[]; failed: boolean }> {
  const connection = program.provider.connection;
  const sigs = (await connection.getSignaturesForAddress(program.programId, { limit }, "confirmed")).filter(
    (s) => !s.err,
  );
  const { logs: logsBySig, failed } = await fetchTxLogs(connection, sigs.map((s) => s.signature));
  const parser = new EventParser(program.programId, program.coder);
  const out: Movement[] = [];
  for (const sig of sigs) {
    const logs = logsBySig.get(sig.signature);
    if (!logs) continue;
    const base = { signature: sig.signature, blockTime: sig.blockTime ?? null };
    for (const e of parser.parseLogs(logs)) {
      const d = e.data as { fundraiser: PublicKey; donor?: PublicKey; recipient?: PublicKey; amount: BN };
      const kind: MovementKind | undefined =
        e.name === "donationMade" ? "donation" : e.name === "fundraiserReleased" ? "payout" : e.name === "refunded" ? "refund" : undefined;
      const party = kind === "payout" ? d.recipient : d.donor;
      if (kind && party) out.push({ ...base, kind, fundraiser: d.fundraiser, party, amount: d.amount });
    }
  }
  // Payout is emitted in the same tx as the donation that completed the target; show the payout first.
  const rank: Record<MovementKind, number> = { payout: 0, refund: 1, donation: 2 };
  return { movements: out.sort((a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0) || rank[a.kind] - rank[b.kind]), failed };
}

export async function fetchAudit(program: Program<Earmark>): Promise<AuditData> {
  const [fundraisers, recipients, donations] = await Promise.all([
    fetchFundraisers(program),
    fetchRecipients(program),
    program.account.donation.all(),
  ]);
  const vaultBalances = await fetchVaultBalances(program, fundraisers);
  const sum = (xs: Iterable<bigint>) => [...xs].reduce((a, b) => a + b, 0n);
  return {
    fundraisers,
    recipients,
    vaultBalances,
    totals: {
      held: sum(vaultBalances.values()),
      paid: sum(fundraisers.filter((f) => "released" in f.account.status).map((f) => BigInt(f.account.raised.toString()))),
      refunded: sum(donations.filter((d) => d.account.refunded).map((d) => BigInt(d.account.amount.toString()))),
    },
  };
}

const fmt = (units: bigint) => (Number(units) / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 }).replace(/,/g, " ");

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Runs every red-flag rule over on-chain data. Pure: same data and clock, same flags. */
export function computeFlags(
  data: Pick<AuditData, "fundraisers" | "recipients" | "vaultBalances">,
  titleOf: (fundraiser: PublicKey) => string,
  programId: PublicKey,
  now: number,
): Flag[] {
  const flags: Flag[] = [];
  const { fundraisers, recipients, vaultBalances } = data;
  const fLink = (f: FundraiserView): FlagLink => ({ label: titleOf(f.pubkey), kind: "fundraiser", key: f.pubkey.toBase58() });

  const byRecipient = new Map<string, FundraiserView[]>();
  for (const f of fundraisers) {
    const k = f.account.recipient.toBase58();
    byRecipient.set(k, [...(byRecipient.get(k) ?? []), f]);
  }

  for (const r of recipients) {
    const wallet = r.account.wallet.toBase58();
    const theirs = byRecipient.get(wallet) ?? [];
    const accountLink: FlagLink = { label: `${r.account.name} (recipient account)`, kind: "address", key: recipientPda(programId, r.account.wallet).toBase58() };

    // 1. Recently verified and already named in a fundraiser.
    const age = now - r.account.verifiedAt.toNumber();
    if (r.account.active && theirs.length && age < NEW_RECIPIENT_DAYS * DAY) {
      const days = Math.floor(age / DAY);
      const when = days < 1 ? "less than a day ago" : `${days} day${days === 1 ? "" : "s"} ago`;
      flags.push({
        kind: "newRecipient",
        text: `${r.account.name} was verified ${when} and is already named in ${theirs.length === 1 ? `a ${fmt(BigInt(theirs[0].account.target.toString()))} ePLN fundraiser` : `${theirs.length} fundraisers`}.`,
        links: [accountLink, ...theirs.map(fLink)],
      });
    }

    // 2. Many fundraisers for one recipient in a short window.
    const recent = theirs.filter((f) => now - f.account.createdAt.toNumber() < HIGH_VOLUME_DAYS * DAY);
    if (recent.length > HIGH_VOLUME_COUNT) {
      flags.push({
        kind: "highVolume",
        text: `${r.account.name} appears in ${recent.length} new fundraisers within ${HIGH_VOLUME_DAYS} days.`,
        links: [accountLink, ...recent.map(fLink)],
      });
    }
  }

  // 3. Target far above the median.
  if (fundraisers.length >= 3) {
    const med = median(fundraisers.map((f) => f.account.target.toNumber()));
    for (const f of fundraisers) {
      const target = f.account.target.toNumber();
      if (med > 0 && target > OUTLIER_FACTOR * med)
        flags.push({
          kind: "targetOutlier",
          text: `${titleOf(f.pubkey)} asks for ${fmt(BigInt(target))} ePLN, more than ${OUTLIER_FACTOR}× the median target (${fmt(BigInt(Math.round(med)))} ePLN).`,
          links: [fLink(f)],
        });
    }
  }

  // 4. Refunds open but money still in the vault.
  for (const f of fundraisers) {
    const status = statusOf(f.account, now);
    const left = vaultBalances.get(f.pubkey.toBase58()) ?? 0n;
    if ((status === "deadlinePassed" || status === "cancelled") && left > 0n)
      flags.push({
        kind: "unclaimedRefunds",
        text: `${titleOf(f.pubkey)} ${status === "cancelled" ? "was cancelled" : "ended"} with ${fmt(left)} ePLN still in the vault. Donors can claim it.`,
        links: [fLink(f)],
      });
  }

  // 5. Organizers with many cancelled fundraisers.
  const byOrganizer = new Map<string, FundraiserView[]>();
  for (const f of fundraisers) {
    if (!("cancelled" in f.account.status)) continue;
    const k = f.account.organizer.toBase58();
    byOrganizer.set(k, [...(byOrganizer.get(k) ?? []), f]);
  }
  for (const [organizer, list] of byOrganizer)
    if (list.length >= MANY_CANCELLED)
      flags.push({
        kind: "manyCancelled",
        text: `One organizer has cancelled ${list.length} fundraisers.`,
        links: [{ label: "Organizer account", kind: "address", key: organizer }, ...list.map(fLink)],
      });

  return flags;
}
