export function ProgressBar({ raised, target }: { raised: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-2.5 overflow-hidden rounded-full bg-track"
    >
      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}
