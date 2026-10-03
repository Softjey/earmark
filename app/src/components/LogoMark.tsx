export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M32 6 L54 19 V45 L32 58 L10 45 V19 Z" stroke="#0B6B55" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="6" fill="#0E1A17" />
    </svg>
  );
}
