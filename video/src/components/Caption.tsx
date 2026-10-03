import { useCurrentFrame } from "remotion";
import { C, fadeUp } from "../theme";

/** Large statement centred near the bottom of the frame. */
export function Caption({ start, children, color = C.ink }: { start: number; children: React.ReactNode; color?: string }) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom: 80,
        textAlign: "center",
        fontSize: 48,
        fontWeight: 600,
        letterSpacing: -0.6,
        lineHeight: 1.25,
        color,
        ...fadeUp(frame, start),
      }}
    >
      {children}
    </div>
  );
}

/** Small uppercase section label at the top left. */
export function Kicker({ children, color = C.muted }: { children: React.ReactNode; color?: string }) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        top: 96,
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: 4,
        textTransform: "uppercase",
        color,
        ...fadeUp(frame, 0, 12),
      }}
    >
      {children}
    </div>
  );
}
