import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Clinic, Heart, Person } from "./components/Icons";
import { C, SANS } from "./theme";

export const ROLE_FRAMES = 120;

const ROLES = {
  organizer: { icon: Person, color: C.warn, soft: C.warnSoft },
  clinic: { icon: Clinic, color: C.accent, soft: C.accentSoft },
  donor: { icon: Heart, color: C.info, soft: C.infoSoft },
} as const;

export type RoleBadgeProps = { role: keyof typeof ROLES; title: string; sub: string };

/** Lower-third "who is on screen now" badge, rendered on a transparent background. */
export function RoleBadge({ role, title, sub }: RoleBadgeProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 160 } });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const r = ROLES[role];
  const Icon = r.icon;
  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <div
        style={{
          position: "absolute",
          left: 64,
          bottom: 64,
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "20px 36px 20px 20px",
          background: C.surface,
          border: `2px solid ${C.line}`,
          borderRadius: 20,
          boxShadow: "0 16px 40px rgba(14,26,23,0.18)",
          opacity: enter * (1 - exit),
          transform: `translateX(${(1 - enter) * -60 - exit * 40}px)`,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            background: r.soft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={40} color={r.color} stroke={2.6} />
        </div>
        <div>
          <div style={{ fontSize: 38, fontWeight: 700, color: C.ink, letterSpacing: -0.5 }}>{title}</div>
          <div style={{ fontSize: 24, fontWeight: 500, color: C.muted }}>{sub}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
