export function VerifiedBadge({ label = "Verified recipient" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-white">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12l5 5L20 7" />
      </svg>
      {label}
    </span>
  );
}
