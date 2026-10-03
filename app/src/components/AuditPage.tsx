"use client";

import Link from "next/link";
import { useMemo } from "react";
import { fundraiserTitle } from "./FundraiserCard";
import { TxLink } from "./TxLink";
import { ErrorAlert, Notice, PageTitle } from "./ui";
import { computeFlags, fetchAudit, type Flag, type FlagKind, type Movement } from "@/lib/audit";
import { explorerUrl } from "@/lib/config";
import { formatTpln, shortKey, timeAgo } from "@/lib/format";
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

const mono = "font-mono text-[13px]";

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-[14px] border border-line bg-surface p-5">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-[28px] font-bold ${accent ? "text-accent" : ""}`}>{value}</span>
    </div>
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

function MovementRow({ m, titleOf, now }: { m: Movement; titleOf: (k: string) => string; now: number }) {
  const { label, cls } = MOVEMENT_STYLE[m.kind];
  const party = shortKey(m.party.toBase58());
  const route = { donation: `${party} → vault`, payout: "vault → clinic", refund: `vault → ${party}` }[m.kind];
  return (
    <tr className="border-t border-[#e8ecea]">
      <td className="px-5 py-3.5 text-muted">{timeAgo(m.blockTime, now)}</td>
      <td className={`px-5 py-3.5 ${cls}`}>{label}</td>
      <td className="px-5 py-3.5">
        <Link href={`/fundraisers/${m.fundraiser.toBase58()}`}>{titleOf(m.fundraiser.toBase58())}</Link>
      </td>
      <td className={`px-5 py-3.5 ${mono}`}>{route}</td>
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
  );

  const titleOf = (key: string) => fundraiserTitle(data?.metadata[key], key);
  const flags = useMemo(
    () =>
      data
        ? computeFlags(data.audit, (k) => fundraiserTitle(data.metadata[k.toBase58()], k.toBase58()), program.programId, now)
        : [],
    [data, program.programId, now],
  );

  return (
    <div className="flex flex-col gap-7">
      <PageTitle title="Every złoty, in public">
        Read straight from the blockchain, no login. Flags are automatic checks anyone can rerun; a flag is a reason to
        look closer, not proof of fraud.
      </PageTitle>

      {!!error && !data &&<ErrorAlert error={error} />}
      {loading && <Notice>Reading the chain…</Notice>}

      {data && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <Stat label="Held in vaults" value={`${formatTpln(data.audit.totals.held)} tPLN`} />
            <Stat label="Paid to clinics" value={`${formatTpln(data.audit.totals.paid)} tPLN`} />
            <Stat label="Refunded to donors" value={`${formatTpln(data.audit.totals.refunded)} tPLN`} />
            <Stat label="Paid to organizers" value="0 tPLN · always" accent />
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Flags</h2>
            {flags.length ? (
              flags.map((f, i) => <FlagRow key={i} flag={f} />)
            ) : (
              <Notice>No flags right now.</Notice>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">All money movements</h2>
            <div className="overflow-x-auto rounded-[14px] border border-line bg-surface">
              <table className="w-full min-w-[720px] border-collapse text-[15px]">
                <thead>
                  <tr className="text-left text-[13px] text-muted">
                    {["When", "Type", "Fundraiser", "From → To", "Amount (tPLN)", ""].map((h, i) => (
                      <th key={i} className={`px-5 py-3.5 font-semibold ${i === 4 ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.audit.movements.map((m) => (
                    <MovementRow key={`${m.signature}-${m.kind}`} m={m} titleOf={titleOf} now={now} />
                  ))}
                </tbody>
              </table>
              {!data.audit.movements.length && <p className="px-5 pb-5 text-muted">No money has moved yet.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
