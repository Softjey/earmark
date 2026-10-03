"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicKey } from "@solana/web3.js";
import { fundraiserTitle } from "./FundraiserCard";
import { TxLink } from "./TxLink";
import { ErrorAlert, Notice, PageTitle } from "./ui";
import {
  computeFlags,
  fetchAudit,
  fetchMovements,
  HIGH_VOLUME_COUNT,
  HIGH_VOLUME_DAYS,
  MANY_CANCELLED,
  NEW_RECIPIENT_DAYS,
  OUTLIER_FACTOR,
  type Flag,
  type FlagKind,
  type Movement,
  type MovementKind,
} from "@/lib/audit";
import { explorerUrl } from "@/lib/config";
import { formatTpln, shortKey, timeAgo } from "@/lib/format";
import { statusOf } from "@/lib/chain";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { useLoad, useNow, useProgram } from "@/lib/hooks";
import { fetchAllMetadata } from "@/lib/metadata";

const FLAG_STYLE: Record<FlagKind, { label: string; cls: string }> = {
  newRecipient: { label: "NEW RECIPIENT", cls: "bg-warn-soft text-warn" },
  highVolume: { label: "HIGH VOLUME", cls: "bg-warn-soft text-warn" },
  targetOutlier: { label: "UNUSUAL TARGET", cls: "bg-warn-soft text-warn" },
  unclaimedRefunds: { label: "UNCLAIMED REFUNDS", cls: "bg-info-soft text-info" },
  manyCancelled: { label: "MANY CANCELLED", cls: "bg-warn-soft text-warn" },
};

const MOVEMENT_STYLE = {
  donation: { label: "Donation", cls: "" },
  payout: { label: "Payout", cls: "font-semibold text-accent" },
  refund: { label: "Refund", cls: "font-semibold text-info" },
};

const PAGE_SIZE = 10;

const SEGMENTS = [
  { key: "paid", label: "Paid to recipients", bar: "bg-accent", dot: "bg-accent" },
  { key: "held", label: "Still in vaults", bar: "bg-field", dot: "bg-field" },
  { key: "refunded", label: "Refunded to donors", bar: "bg-info", dot: "bg-info" },
] as const;

const FILTERS: { key: MovementKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "donation", label: "Donations" },
  { key: "payout", label: "Payouts" },
  { key: "refund", label: "Refunds" },
];

const CHECKS = [
  `Recipient verified under ${NEW_RECIPIENT_DAYS} days ago and already in a fundraiser`,
  `Recipient in more than ${HIGH_VOLUME_COUNT} fundraisers created within ${HIGH_VOLUME_DAYS} days`,
  `Target more than ${OUTLIER_FACTOR}× the median target`,
  "Deadline passed or cancelled with ePLN still in the vault",
  `Organizer with ${MANY_CANCELLED} or more cancelled fundraisers`,
];

/** Where all donated money is right now: one stacked bar, every segment labelled with its amount. */
function MoneyFlow({ totals, counts }: { totals: { held: bigint; paid: bigint; refunded: bigint }; counts: string[] }) {
  const total = totals.held + totals.paid + totals.refunded;
  return (
    <section className="flex flex-col gap-5 rounded-card border border-line bg-surface p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div className="flex flex-col">
          <span className="text-sm text-muted">Donated through Earmark</span>
          <span className="text-[40px] font-bold leading-tight tracking-tight">{formatTpln(total)} ePLN</span>
        </div>
        <span className="text-sm text-muted">{counts.join(" · ")}</span>
      </div>
      {total > 0n ? (
        <div className="flex h-3 overflow-hidden rounded-full bg-track" role="img" aria-label="Split of donated ePLN">
          {SEGMENTS.map((s) => (
            <div key={s.key} className={s.bar} style={{ width: `${(Number(totals[s.key]) / Number(total)) * 100}%` }} />
          ))}
        </div>
      ) : (
        <p className="text-muted">No donations yet. Once money moves, you will see exactly where it went.</p>
      )}
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="flex flex-col gap-0.5">
            <dt className="flex items-center gap-2 text-sm text-muted">
              <span className={`size-2.5 rounded-full ${s.dot}`} />
              {s.label}
            </dt>
            <dd className="text-xl font-semibold">{formatTpln(totals[s.key])} ePLN</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The one rule the page exists to prove, stated once instead of as a permanent zero. */
function Guarantee() {
  return (
    <div className="flex gap-3 rounded-card bg-accent-soft px-5 py-4 text-accent">
      <span aria-hidden className="text-xl leading-snug">✓</span>
      <p className="text-ink">
        <strong className="text-accent">Organizers cannot withdraw.</strong> The program only lets a vault pay the verified
        recipient or return money to the donors, so there is no organizer payout to track.
      </p>
    </div>
  );
}

function FlagsSection({ flags }: { flags: Flag[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">
        Flags{!!flags.length && <span className="ml-2 rounded-full bg-warn-soft px-2.5 py-0.5 text-sm text-warn">{flags.length}</span>}
      </h2>
      {flags.map((f, i) => (
        <FlagRow key={i} flag={f} />
      ))}
      <details className="rounded-card border border-line bg-surface px-5 py-4">
        <summary className="cursor-pointer font-medium">
          {flags.length ? "What do flags check?" : "No flags right now. 5 automatic checks came back clean."}
        </summary>
        <ul className="mt-3 list-disc pl-5 text-sm text-muted">
          {CHECKS.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function FlagRow({ flag }: { flag: Flag }) {
  const { label, cls } = FLAG_STYLE[flag.kind];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] border border-line bg-surface px-5 py-4">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{label}</span>
      <span className="min-w-[260px] flex-1">{flag.text}</span>
      <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {flag.links.map((l) =>
          l.kind === "fundraiser" ? (
            <Link key={l.key} href={`/fundraisers/${l.key}`}>
              {l.label}
            </Link>
          ) : (
            <a key={l.key} href={explorerUrl("address", l.key)} target="_blank" rel="noreferrer">
              {l.label} ↗
            </a>
          ),
        )}
      </span>
    </div>
  );
}

function MovementRow({ m, titleOf, partyName, now }: { m: Movement; titleOf: (k: string) => string; partyName?: string; now: number }) {
  const { label, cls } = MOVEMENT_STYLE[m.kind];
  const who = partyName ?? shortKey(m.party.toBase58());
  const route = { donation: `${who} → vault`, payout: `vault → ${who}`, refund: `vault → ${who}` }[m.kind];
  return (
    <tr className="border-t border-[#e8ecea]">
      <td className="px-5 py-3.5 text-muted">{timeAgo(m.blockTime, now)}</td>
      <td className={`px-5 py-3.5 ${cls}`}>{label}</td>
      <td className="px-5 py-3.5">
        <Link href={`/fundraisers/${m.fundraiser.toBase58()}`}>{titleOf(m.fundraiser.toBase58())}</Link>
      </td>
      <td className="px-5 py-3.5 text-sm text-muted" title={m.party.toBase58()}>
        {route}
      </td>
      <td className="px-5 py-3.5 text-right font-semibold">{formatTpln(m.amount)}</td>
      <td className="px-5 py-3.5">
        <TxLink signature={m.signature} label="" />
      </td>
    </tr>
  );
}

export function AuditPage() {
  const { program } = useProgram();
  const now = useNow();
  const { data, error, loading } = useLoad(
    async () => {
      const [audit, metadata] = await Promise.all([fetchAudit(program), fetchAllMetadata()]);
      return { audit, metadata };
    },
    [program],
    30_000,
    "audit",
  );
  // The transaction history is the slow part; it loads on its own so totals and flags show up first.
  const { data: history, loading: historyLoading } = useLoad(() => fetchMovements(program), [program], 30_000, "audit:movements");
  const movements = history?.movements ?? [];

  const [filter, setFilter] = useState<MovementKind | "all">("all");
  const [showAll, setShowAll] = useState(false);

  const recipientOf = (wallet: string) => data?.audit.recipients.find((r) => r.account.wallet.toBase58() === wallet)?.account.name;
  const titleFor = (f?: { pubkey: PublicKey; account: { recipient: PublicKey } }) =>
    f ? fundraiserTitle(data?.metadata[f.pubkey.toBase58()], recipientOf(f.account.recipient.toBase58())) : "Fundraiser";
  const titleOf = (key: string) => titleFor(data?.audit.fundraisers.find((f) => f.pubkey.toBase58() === key));
  const flags = useMemo(
    () =>
      data
        ? computeFlags(data.audit, (k) => titleOf(k.toBase58()), program.programId, now)
        : [],
    [data, program.programId, now],
  );

  const visible = movements.filter((m) => filter === "all" || m.kind === filter);
  const shown = showAll ? visible : visible.slice(0, PAGE_SIZE);
  const countOf = (k: MovementKind | "all") => (k === "all" ? movements.length : movements.filter((m) => m.kind === k).length);

  return (
    <div className="flex flex-col gap-7">
      <PageTitle title="Every złoty, in public">
        Read straight from the blockchain, no login. Flags are automatic checks anyone can rerun; a flag is a reason to
        look closer, not proof of fraud.
      </PageTitle>

      {!!error && !data && <ErrorAlert error={error} />}
      {loading && <Notice>Reading the chain…</Notice>}

      {data && (
        <>
          <MoneyFlow
            totals={data.audit.totals}
            counts={[
              `${data.audit.fundraisers.length} fundraiser${data.audit.fundraisers.length === 1 ? "" : "s"}`,
              `${data.audit.recipients.filter((r) => r.account.active).length} verified recipients`,
            ]}
          />
          <Guarantee />

          <FlagsSection flags={flags} />

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Fundraisers</h2>
            <div className="overflow-x-auto rounded-card border border-line bg-surface">
              <table className="w-full min-w-[720px] border-collapse text-[15px]">
                <thead>
                  <tr className="text-left text-[13px] text-muted">
                    {["Fundraiser", "Status", "Raised", "In vault", "Recipient"].map((h, i) => (
                      <th key={h} className={`px-5 py-3.5 font-semibold ${i === 3 ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.audit.fundraisers.map((f) => {
                    const key = f.pubkey.toBase58();
                    const status = statusOf(f.account, now);
                    const raised = f.account.raised.toNumber();
                    const target = f.account.target.toNumber();
                    return (
                      <tr key={key} className="border-t border-[#e8ecea] align-top">
                        <td className="px-5 py-3.5">
                          <Link href={`/fundraisers/${key}`}>{titleOf(key)}</Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={status} />
                        </td>
                        <td className="min-w-[180px] px-5 py-3.5">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm">
                              <strong>{formatTpln(raised)}</strong> <span className="text-muted">of {formatTpln(target)} ePLN</span>
                            </span>
                            <ProgressBar raised={raised} target={target} muted={status === "deadlinePassed" || status === "cancelled"} />
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold">{formatTpln(data.audit.vaultBalances.get(key) ?? 0n)}</td>
                        <td className="px-5 py-3.5 text-sm text-muted">{recipientOf(f.account.recipient.toBase58()) ?? shortKey(f.account.recipient.toBase58())}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!data.audit.fundraisers.length && <p className="px-5 pb-5 text-muted">No fundraisers yet.</p>}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Money movements</h2>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter movements">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={filter === f.key}
                    onClick={() => {
                      setFilter(f.key);
                      setShowAll(false);
                    }}
                    className={`min-h-9 rounded-full border px-3.5 text-sm font-medium ${
                      filter === f.key ? "border-ink bg-ink text-white" : "border-line bg-surface text-muted hover:border-field"
                    }`}
                  >
                    {f.label} <span className="opacity-70">{countOf(f.key)}</span>
                  </button>
                ))}
              </div>
            </div>
            {!!history?.failed && (
              <Notice>Part of the transaction history could not be loaded (the RPC may be rate-limiting). Totals and flags above are still read from accounts; the rest fills in on the next refresh.</Notice>
            )}
            <div className="overflow-x-auto rounded-card border border-line bg-surface">
              <table className="w-full min-w-[720px] border-collapse text-[15px]">
                <thead>
                  <tr className="text-left text-[13px] text-muted">
                    {["When", "Type", "Fundraiser", "From → To", "Amount (ePLN)", ""].map((h, i) => (
                      <th key={i} className={`px-5 py-3.5 font-semibold ${i === 4 ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((m) => (
                    <MovementRow
                      key={`${m.signature}-${m.kind}`}
                      m={m}
                      titleOf={titleOf}
                      partyName={m.kind === "payout" ? recipientOf(m.party.toBase58()) : undefined}
                      now={now}
                    />
                  ))}
                </tbody>
              </table>
              {historyLoading && !movements.length && <p className="px-5 pb-5 text-muted">Reading the transaction history…</p>}
              {!historyLoading && !visible.length && !history?.failed && (
                <p className="px-5 pb-5 text-muted">{movements.length ? "Nothing of this type yet." : "No money has moved yet."}</p>
              )}
            </div>
            {visible.length > PAGE_SIZE && (
              <button type="button" onClick={() => setShowAll((v) => !v)} className="self-start text-sm font-medium text-accent hover:underline">
                {showAll ? "Show fewer" : `Show all ${visible.length}`}
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}
