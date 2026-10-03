import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, pop } from "../theme";

export type NodeVariant = "default" | "verified" | "vault" | "danger" | "disabled";

const STYLES: Record<NodeVariant, { bg: string; border: string; title: string; sub: string; icon: string }> = {
  default: { bg: C.surface, border: C.line, title: C.ink, sub: C.muted, icon: C.ink },
  verified: { bg: C.accentSoft, border: C.accent, title: C.ink, sub: C.accent, icon: C.accent },
  vault: { bg: C.ink, border: C.ink, title: "#FFFFFF", sub: "#B9C3BF", icon: "#FFFFFF" },
  danger: { bg: C.errorSoft, border: C.error, title: C.error, sub: C.error, icon: C.error },
  disabled: { bg: C.ground, border: C.line, title: C.muted, sub: C.muted, icon: C.muted },
};

/** A box on the money-flow diagram, centred on (x, y). */
export function Node({
  x,
  y,
  w = 340,
  h = 160,
  title,
  sub,
  icon,
  variant = "default",
  start,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  sub?: string;
  icon?: (color: string) => React.ReactNode;
  variant?: NodeVariant;
  start: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, start);
  const st = STYLES[variant];
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        background: st.bg,
        border: `3px solid ${st.border}`,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        opacity: Math.min(1, s * 1.5),
        transform: `scale(${0.85 + 0.15 * s})`,
        boxShadow: variant === "disabled" ? "none" : "0 12px 32px rgba(14,26,23,0.08)",
        transition: "none",
      }}
    >
      {icon && <div style={{ marginBottom: 2 }}>{icon(st.icon)}</div>}
      <div style={{ fontSize: 36, fontWeight: 700, color: st.title, letterSpacing: -0.5 }}>{title}</div>
      {sub && <div style={{ fontSize: 22, fontWeight: 500, color: st.sub }}>{sub}</div>}
    </div>
  );
}
