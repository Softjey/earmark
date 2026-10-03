import { BN, EventParser, type Program } from "@anchor-lang/core";
import { PublicKey } from "@solana/web3.js";
import type { Earmark } from "./anchor";
import type { FundraiserStatus } from "@/components/StatusBadge";

const enc = (s: string) => Buffer.from(s);

export function configPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([enc("config")], programId)[0];
}
export function recipientPda(programId: PublicKey, wallet: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([enc("recipient"), wallet.toBuffer()], programId)[0];
}
export function fundraiserPda(programId: PublicKey, organizer: PublicKey, id: BN): PublicKey {
  return PublicKey.findProgramAddressSync(
    [enc("fundraiser"), organizer.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
    programId,
  )[0];
}
export function donationPda(programId: PublicKey, fundraiser: PublicKey, donor: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([enc("donation"), fundraiser.toBuffer(), donor.toBuffer()], programId)[0];
}

export type FundraiserAccount = Awaited<ReturnType<Program<Earmark>["account"]["fundraiser"]["fetch"]>>;
export type RecipientAccount = Awaited<ReturnType<Program<Earmark>["account"]["recipient"]["fetch"]>>;

export type FundraiserView = { pubkey: PublicKey; account: FundraiserAccount };
export type RecipientView = { pubkey: PublicKey; account: RecipientAccount };

/** Byte offset of `Fundraiser.recipient` (8-byte discriminator + organizer pubkey). */
const RECIPIENT_OFFSET = 8 + 32;

export async function fetchFundraisers(program: Program<Earmark>, recipient?: PublicKey): Promise<FundraiserView[]> {
  const filters = recipient ? [{ memcmp: { offset: RECIPIENT_OFFSET, bytes: recipient.toBase58() } }] : [];
  const all = await program.account.fundraiser.all(filters);
  return all
    .map((a) => ({ pubkey: a.publicKey, account: a.account }))
    .sort((a, b) => b.account.createdAt.cmp(a.account.createdAt));
}

export async function fetchRecipients(program: Program<Earmark>): Promise<RecipientView[]> {
  const all = await program.account.recipient.all();
  return all
    .map((a) => ({ pubkey: a.publicKey, account: a.account }))
    .sort((a, b) => b.account.verifiedAt.cmp(a.account.verifiedAt));
}

/** Recipients keyed by wallet address, for joining onto fundraisers. */
export function recipientsByWallet(recipients: RecipientView[]): Map<string, RecipientAccount> {
  return new Map(recipients.map((r) => [r.account.wallet.toBase58(), r.account]));
}

export function statusOf(f: FundraiserAccount, nowSec: number): FundraiserStatus {
  if ("released" in f.status) return "released";
  if ("cancelled" in f.status) return "cancelled";
  if ("pendingConfirmation" in f.status) return "pendingConfirmation";
  return nowSec >= f.deadline.toNumber() ? "deadlinePassed" : "active";
}

/** Mirrors the program's refund rule; the program stays the source of truth. */
export function isRefundable(status: FundraiserStatus): boolean {
  return status === "cancelled" || status === "deadlinePassed";
}

export type ActivityKind = "created" | "confirmed" | "donation" | "released" | "cancelled" | "refund";

export type ActivityItem = {
  signature: string;
  blockTime: number | null;
  kind: ActivityKind;
  /** Token base units, for donation / released / refund. */
  amount?: BN;
  /** Donor for donation and refund. */
  wallet?: PublicKey;
};

const INSTRUCTION_KIND: Record<string, ActivityKind> = {
  CreateFundraiser: "created",
  ConfirmFundraiser: "confirmed",
  Cancel: "cancelled",
};

/** Rebuilds the fundraiser's history from the transactions that touched it (logs and events). */
export async function fetchActivity(program: Program<Earmark>, fundraiser: PublicKey): Promise<ActivityItem[]> {
  const connection = program.provider.connection;
  const sigs = await connection.getSignaturesForAddress(fundraiser, { limit: 50 }, "confirmed");
  const ok = sigs.filter((s) => !s.err);
  const txs = await connection.getTransactions(
    ok.map((s) => s.signature),
    { commitment: "confirmed", maxSupportedTransactionVersion: 0 },
  );
  const parser = new EventParser(program.programId, program.coder);
  const items: ActivityItem[] = [];
  txs.forEach((tx, i) => {
    const logs = tx?.meta?.logMessages;
    if (!logs) return;
    const base = { signature: ok[i].signature, blockTime: ok[i].blockTime ?? null };
    const events = [...parser.parseLogs(logs)];
    for (const e of events) {
      const d = e.data as { donor?: PublicKey; amount: BN };
      if (e.name === "donationMade") items.push({ ...base, kind: "donation", amount: d.amount, wallet: d.donor });
      else if (e.name === "fundraiserReleased") items.push({ ...base, kind: "released", amount: d.amount });
      else if (e.name === "refunded") items.push({ ...base, kind: "refund", amount: d.amount, wallet: d.donor });
    }
    for (const line of logs) {
      const m = /^Program log: Instruction: (\w+)/.exec(line);
      const kind = m && INSTRUCTION_KIND[m[1]];
      if (kind) items.push({ ...base, kind });
    }
  });
  return items;
}
