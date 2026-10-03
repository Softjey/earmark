import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { statusOf, type FundraiserView, type RecipientAccount } from "@/lib/chain";
import { formatTpln, shortKey, timeLeft } from "@/lib/format";
import type { Metadata } from "@/lib/metadata";

export function fundraiserTitle(meta: Metadata | undefined, pubkey: string): string {
  return meta?.title || `Fundraiser ${shortKey(pubkey)}`;
}

export function FundraiserCard({
  view,
  meta,
  recipient,
  now,
}: {
  view: FundraiserView;
  meta?: Metadata;
  recipient?: RecipientAccount;
  now: number;
}) {
  const f = view.account;
  const key = view.pubkey.toBase58();
  const status = statusOf(f, now);
  const deadline = f.deadline.toNumber();
  const footer =
    status === "active" || status === "pendingConfirmation"
      ? ` · ${timeLeft(deadline, now)}`
      : status === "released"
        ? " · paid to clinic"
        : " · ended";
  return (
    <Link
      href={`/fundraisers/${key}`}
      className="flex flex-col gap-2.5 rounded-card border border-line bg-surface p-5 text-ink no-underline hover:border-field"
    >
      <StatusBadge status={status} />
      <h2 className="text-xl font-semibold">{fundraiserTitle(meta, key)}</h2>
      {recipient?.active ? (
        <span className="flex items-center gap-1.5 text-sm text-[#2b3733]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B6B55" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12l5 5L20 7" />
          </svg>
          {recipient.name}
        </span>
      ) : (
        <span className="text-sm text-warn">Recipient no longer verified</span>
      )}
      <ProgressBar raised={f.raised.toNumber()} target={f.target.toNumber()} muted={status === "deadlinePassed" || status === "cancelled"} />
      <span className="text-sm text-muted">
        <strong className="text-ink">{formatTpln(f.raised)}</strong> of {formatTpln(f.target)} ePLN{footer}
      </span>
    </Link>
  );
}
