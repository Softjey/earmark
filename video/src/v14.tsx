// v14: the animated "With Earmark" diagram stays, and real app screenshots (public/app/, real devnet transactions from
// scripts/video-state.ts) pop out of the node the narration is about, with the relevant spot highlighted, then fold
// back into the node while the money keeps moving.
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useScene } from "./cut";
import { WithEarmark } from "./Intro";
import { C } from "./theme";

type Box = { x: number; y: number; w: number; h: number };
type Place = "top" | "bottom" | "left";

/** A highlight rectangle (in the cropped image's own pixels) that draws itself in and then pulses. */
function Highlight({ box, at, color, label, place = "top" }: { box: Box; at: number; color: string; label?: string; place?: Place }) {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const t = interpolate(frame, [at, at + 10], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
  const pulse = 0.55 + 0.45 * Math.sin((frame - at) / 5);
  const pad = 8;
  return (
    <div
      style={{
        position: "absolute",
        left: box.x - pad,
        top: box.y - pad,
        width: box.w + pad * 2,
        height: box.h + pad * 2,
        border: `4px solid ${color}`,
        borderRadius: 10,
        boxShadow: `0 0 ${18 + 14 * pulse}px ${color}`,
        background: `${color}14`,
        opacity: t,
        transform: `scale(${1.15 - 0.15 * t})`,
      }}
    >
      {label && (
        <div
          style={{
            position: "absolute",
            ...(place === "left" ? { right: "calc(100% + 14px)", top: "50%", marginTop: -18 } : { right: -4, ...(place === "bottom" ? { bottom: -42 } : { top: -42 }) }),
            background: color,
            color: "#fff",
            fontSize: 22,
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: 8,
            whiteSpace: "nowrap",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

type CalloutProps = {
  from: number; // frame the window starts opening (relative to the scene)
  to: number; // frame it has folded back
  anchor: [number, number]; // node it grows out of (diagram coordinates)
  center: [number, number]; // where the window sits when open
  src: string;
  crop: Box; // region of the screenshot to show
  scale: number; // display scale of that region
  title: string; // window title bar
  highlights: { box: Box; delay: number; color: string; label?: string; place?: Place }[];
};

/** A browser-like window with a cropped screenshot that grows out of a diagram node and folds back into it. */
function Callout({ from, to, anchor, center, src, crop, scale, title, highlights }: CalloutProps) {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const open = interpolate(frame, [from, from + 12], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const close = interpolate(frame, [to - 10, to], [0, 1], { extrapolateLeft: "clamp", easing: Easing.in(Easing.cubic) });
  const k = open * (1 - close);
  const w = crop.w * scale;
  const h = crop.h * scale + 44;
  const cx = anchor[0] + (center[0] - anchor[0]) * k;
  const cy = anchor[1] + (center[1] - anchor[1]) * k;
  return (
    <>
      {/* the diagram steps back while a window is open */}
      <AbsoluteFill style={{ background: C.ground, opacity: 0.5 * k }} />
      {/* a thin line keeps the window tied to its node */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: k }}>
        <line x1={anchor[0]} y1={anchor[1]} x2={cx} y2={cy} stroke={C.accent} strokeWidth={3} strokeDasharray="8 8" />
        <circle cx={anchor[0]} cy={anchor[1]} r={9} fill={C.accent} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          borderRadius: 16,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 30px 80px rgba(14,26,23,0.35), 0 0 0 1px rgba(14,26,23,0.08)",
          transform: `scale(${0.12 + 0.88 * k})`,
          opacity: Math.min(1, k * 1.5),
        }}
      >
        <div style={{ height: 44, background: "#EEF1EF", display: "flex", alignItems: "center", gap: 8, padding: "0 16px", borderBottom: `1px solid ${C.line}` }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
          ))}
          <span style={{ marginLeft: 14, fontSize: 18, color: C.muted, fontWeight: 600 }}>{title}</span>
          <span style={{ marginLeft: "auto", fontSize: 15, fontWeight: 700, color: C.accent, letterSpacing: 1 }}>● LIVE ON DEVNET</span>
        </div>
        <div style={{ position: "relative", width: w, height: crop.h * scale, overflow: "hidden" }}>
          <Img src={staticFile(`app/${src}`)} style={{ position: "absolute", left: -crop.x * scale, top: -crop.y * scale, transformOrigin: "0 0", transform: `scale(${scale})` }} />
          <div style={{ position: "absolute", inset: 0, transformOrigin: "0 0", transform: `scale(${scale})` }}>
            <div style={{ position: "absolute", left: -crop.x, top: -crop.y }}>
              {highlights.map((hl, i) => (
                <Highlight key={i} box={hl.box} at={hl.delay} color={hl.color} label={hl.label} place={hl.place} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// diagram node positions (see WithEarmark in Intro.tsx)
const DONORS: [number, number] = [360, 460];
const VAULT: [number, number] = [960, 460];
const RECIPIENT: [number, number] = [1560, 460];
const BLOCKED: [number, number] = [960, 644];

export function DiagramWithApp() {
  const { lines } = useScene("earmarkB");
  const [l0, l1, l2, l3] = lines.map((l) => l.from);
  const notOrganizer = l0 + Math.round(lines[0].frames * 0.78);
  const RED = "#E5483C";
  const GREEN = C.accent;
  const BLUE = C.info;
  return (
    <AbsoluteFill>
      <WithEarmark id="earmarkB" notOrganizerAt={0.78} vaultSub="on Solana · nobody holds the key" onSolana />
      {/* 1. the money waits: the fundraiser can't take donations until the recipient confirms */}
      <Callout
        from={l0 + 75}
        to={notOrganizer - 12}
        anchor={VAULT}
        center={[960, 520]}
        src="01-a-pending.png"
        crop={{ x: 1177, y: 122, w: 340, h: 258 }}
        scale={2.0}
        title="earmark · Cataract surgery for Zosia, 7"
        highlights={[
          { box: { x: 1200, y: 152, w: 200, h: 44 }, delay: l0 + 95, color: GREEN, label: "held by the program", place: "bottom" },
          { box: { x: 1201, y: 272, w: 290, h: 84 }, delay: l0 + 135, color: BLUE },
        ]}
      />
      {/* 2. the organizer names their own wallet: the program rejects it */}
      <Callout
        from={notOrganizer + 26}
        to={l1 + 30}
        anchor={BLOCKED}
        center={[960, 440]}
        src="02b-reject-logs.png"
        crop={{ x: 0, y: 40, w: 960, h: 300 }}
        scale={1.55}
        title="Solana Explorer · the organizer's own wallet as recipient"
        highlights={[{ box: { x: 30, y: 254, w: 900, h: 42 }, delay: notOrganizer + 40, color: RED, label: "RecipientNotVerified" }]}
      />
      {/* 3. only a verified recipient, who confirms the need first */}
      <Callout
        from={l1 + 50}
        to={l2 - 4}
        anchor={RECIPIENT}
        center={[900, 480]}
        src="03-a-active.png"
        crop={{ x: 404, y: 430, w: 742, h: 236 }}
        scale={1.75}
        title="earmark · Who gets the money"
        highlights={[
          { box: { x: 971, y: 507, w: 148, h: 31 }, delay: l1 + 75, color: GREEN, label: "verified" },
          { box: { x: 430, y: 566, w: 690, h: 40 }, delay: l1 + 125, color: GREEN, label: "confirmed on-chain", place: "bottom" },
        ]}
      />
      {/* 4. target reached: paid automatically, in the same transaction */}
      <Callout
        from={l2 + 14}
        to={l2 + 70}
        anchor={RECIPIENT}
        center={[900, 470]}
        src="05-a-paid.png"
        crop={{ x: 1177, y: 122, w: 340, h: 258 }}
        scale={2.0}
        title="earmark · Cataract surgery for Zosia, 7"
        highlights={[{ box: { x: 1201, y: 272, w: 290, h: 84 }, delay: l2 + 24, color: GREEN, label: "paid automatically" }]}
      />
      <Callout
        from={l2 + 72}
        to={l3 + 22}
        anchor={RECIPIENT}
        center={[900, 470]}
        src="06b-payout-tokens.png"
        crop={{ x: 0, y: 40, w: 1000, h: 280 }}
        scale={1.45}
        title="Solana Explorer · payout transaction"
        highlights={[
          { box: { x: 880, y: 145, w: 100, h: 46 }, delay: l2 + 80, color: BLUE, label: "vault 0", place: "left" },
          { box: { x: 880, y: 232, w: 100, h: 46 }, delay: l2 + 92, color: GREEN, label: "+1 000", place: "left" },
        ]}
      />
      {/* 5. target missed: every donor takes their own money back */}
      <Callout
        from={l3 + 34}
        to={l3 + lines[3].frames + 2}
        anchor={DONORS}
        center={[1010, 470]}
        src="08-b-refunded.png"
        crop={{ x: 404, y: 975, w: 742, h: 145 }}
        scale={1.75}
        title="earmark · New roof for the Kowalski family"
        highlights={[{ box: { x: 428, y: 1066, w: 690, h: 40 }, delay: l3 + 50, color: BLUE, label: "refund, no approval needed" }]}
      />
    </AbsoluteFill>
  );
}
