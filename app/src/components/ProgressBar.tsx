/** `muted` greys the fill for fundraisers that missed their deadline. */
export function ProgressBar({ raised, target, muted = false, thick = false }: { raised: number; target: number; muted?: boolean; thick?: boolean }) {
  const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`${thick ? "h-2.5" : "h-2"} overflow-hidden rounded-full bg-track`}
    >
      <div className={`h-full rounded-full ${muted ? "bg-field" : "bg-accent"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
