import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { Check, LogoMark } from "./components/Icons";
import { C, fadeOut, fadeUp, pop, SANS } from "./theme";

const POINTS_FRAMES = 180;
const END_FRAMES = 150;
export const OUTRO_FRAMES = POINTS_FRAMES + END_FRAMES;

const POINTS = [
  "The organizer never touches the money.",
  "The verified recipient is paid the moment the target is hit.",
  "Refunds need nobody's permission.",
  "Every transfer is public and auditable.",
];

function Points() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{ background: C.ink, padding: "0 200px", justifyContent: "center", gap: 44, opacity: fadeOut(frame, POINTS_FRAMES - 12) }}
    >
      {POINTS.map((text, i) => (
        <div key={text} style={{ display: "flex", alignItems: "center", gap: 32, ...fadeUp(frame, 8 + i * 22) }}>
          <div
            style={{
              width: 64,
              height: 64,
              flex: "none",
              borderRadius: 32,
              background: C.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={36} color="#fff" stroke={3.2} />
          </div>
          <div style={{ fontSize: 54, fontWeight: 600, color: "#fff", letterSpacing: -0.8 }}>{text}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
}

function End() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, 0);
  return (
    <AbsoluteFill style={{ background: C.ground, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28, transform: `scale(${0.9 + 0.1 * s})`, opacity: s }}>
        <LogoMark size={128} />
        <div style={{ fontSize: 150, fontWeight: 700, color: C.ink, letterSpacing: -4 }}>Earmark</div>
      </div>
      <div style={{ fontSize: 54, fontWeight: 600, color: C.ink, marginTop: 40, letterSpacing: -0.8, ...fadeUp(frame, 14) }}>
        Only to the <span style={{ color: C.accent }}>recipient</span>. Or back to the <span style={{ color: C.info }}>donors</span>.
      </div>
      <div style={{ fontSize: 32, fontWeight: 500, color: C.muted, marginTop: 36, ...fadeUp(frame, 34) }}>
        Built on Solana · Superteam Poland · HackYeah 2026
      </div>
    </AbsoluteFill>
  );
}

export function Outro() {
  return (
    <AbsoluteFill style={{ fontFamily: SANS, background: C.ink }}>
      <Sequence durationInFrames={POINTS_FRAMES}>
        <Points />
      </Sequence>
      <Sequence from={POINTS_FRAMES} durationInFrames={END_FRAMES}>
        <End />
      </Sequence>
    </AbsoluteFill>
  );
}
