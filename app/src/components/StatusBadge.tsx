export type FundraiserStatus =
  | "pendingConfirmation"
  | "active"
  | "released"
  | "cancelled"
  | "deadlinePassed";

const STYLE: Record<FundraiserStatus, { label: string; cls: string }> = {
  pendingConfirmation: { label: "Waiting for clinic", cls: "bg-info-soft text-info" },
  active: { label: "Active", cls: "bg-accent-soft text-accent" },
  released: { label: "Paid to clinic", cls: "bg-accent text-white" },
  cancelled: { label: "Cancelled · refunds open", cls: "bg-error-soft text-error-ink" },
  deadlinePassed: { label: "Deadline passed · refunds open", cls: "bg-warn-soft text-warn" },
};

/** `detail` is appended after a dot, e.g. "ends 10 Oct 2026". */
export function StatusBadge({ status, detail }: { status: FundraiserStatus; detail?: string }) {
  const { label, cls } = STYLE[status];
  return (
    <span className={`inline-block self-start rounded-full px-2.5 py-1 text-[13px] font-semibold ${cls}`}>
      {label}
      {detail ? ` · ${detail}` : ""}
    </span>
  );
}
