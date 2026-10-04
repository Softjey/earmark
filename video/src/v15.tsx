// v15: the animated "With Earmark" diagram, with real app / Explorer pages (2x screenshots in public/app2x/, real devnet
// transactions from scripts/video-state.ts) opening as a near full-screen browser window out of the node the narration
// is about. The window first shows the whole page, then a camera zooms to the spot that matters and highlights it.
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useScene } from "./cut";
import { WithEarmark } from "./Intro";
import { C } from "./theme";

const PAGE_W = 1920; // CSS width the pages were captured at (2x pixels)
const VIEW_W = 1560;
const VIEW_H = 860;
const BAR_H = 52;

type Box = { x: number; y: number; w: number; h: number };
type Key = { at: number; x: number; y: number; z: number }; // camera centred on page point (x, y) at zoom z
type Mark = { box: Box; at: number; color: string; label?: string; place?: "top" | "bottom" | "left" };

const ease = Easing.inOut(Easing.cubic);

function camera(frame: number, keys: Key[]): { x: number; y: number; z: number } {
  if (frame <= keys[0].at) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame <= b.at) {
      const t = ease((frame - a.at) / (b.at - a.at));
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
    }
  }
  return keys[keys.length - 1];
}

function Mark({ mark, s }: { mark: Mark; s: number }) {
  const frame = useCurrentFrame();
  if (frame < mark.at) return null;
  const t = interpolate(frame, [mark.at, mark.at + 10], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
  const pulse = 0.55 + 0.45 * Math.sin((frame - mark.at) / 5);
  const px = 1 / s; // one screen pixel in page units
  const pad = 6 * px;
  const place = mark.place ?? "top";
  return (
    <div
      style={{
        position: "absolute",
        left: mark.box.x - pad,
        top: mark.box.y - pad,
        width: mark.box.w + pad * 2,
        height: mark.box.h + pad * 2,
        border: `${4 * px}px solid ${mark.color}`,
        borderRadius: 10 * px,
        boxShadow: `0 0 ${(16 + 14 * pulse) * px}px ${mark.color}`,
        background: `${mark.color}12`,
        opacity: t,
        transform: `scale(${1.12 - 0.12 * t})`,
      }}
    >
      {mark.label && (
        <div
          style={{
            position: "absolute",
            whiteSpace: "nowrap",
            background: mark.color,
            color: "#fff",
            fontWeight: 700,
            fontSize: 24 * px,
            padding: `${5 * px}px ${14 * px}px`,
            borderRadius: 8 * px,
            ...(place === "left"
              ? { right: `calc(100% + ${14 * px}px)`, top: "50%", transform: "translateY(-50%)" }
              : place === "bottom"
                ? { right: -4 * px, top: `calc(100% + ${10 * px}px)` }
                : { right: -4 * px, bottom: `calc(100% + ${10 * px}px)` }),
          }}
        >
          {mark.label}
        </div>
      )}
    </div>
  );
}

type WindowProps = {
  from: number;
  to: number;
  anchor: [number, number];
  src: string; // in public/app2x/
  pageH: number; // CSS height of the captured page
  url: string;
  dark?: boolean; // explorer pages
  keys: Key[]; // absolute scene frames
  marks: Mark[];
};

function BrowserWindow({ from, to, anchor, src, pageH, url, dark, keys, marks }: WindowProps) {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const open = interpolate(frame, [from, from + 14], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const close = interpolate(frame, [to - 12, to], [0, 1], { extrapolateLeft: "clamp", easing: Easing.in(Easing.cubic) });
  const k = open * (1 - close);
  const cam = camera(frame, keys);
  const s = (VIEW_W / PAGE_W) * cam.z;
  const tx = Math.min(0, Math.max(VIEW_W - PAGE_W * s, VIEW_W / 2 - cam.x * s));
  const ty = Math.min(0, Math.max(VIEW_H - pageH * s, VIEW_H / 2 - cam.y * s));
  const cx = anchor[0] + (960 - anchor[0]) * k;
  const cy = anchor[1] + (540 - anchor[1]) * k;
  return (
    <>
      <AbsoluteFill style={{ background: "rgba(14,26,23,0.55)", opacity: k }} />
      <div
        style={{
          position: "absolute",
          left: cx - VIEW_W / 2,
          top: cy - (VIEW_H + BAR_H) / 2,
          width: VIEW_W,
          height: VIEW_H + BAR_H,
          borderRadius: 18,
          overflow: "hidden",
          background: dark ? "#111" : "#fff",
          boxShadow: "0 40px 120px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)",
          transform: `scale(${0.08 + 0.92 * k})`,
          opacity: Math.min(1, k * 1.6),
        }}
      >
        <div style={{ height: BAR_H, background: dark ? "#1E2422" : "#ECEFED", display: "flex", alignItems: "center", gap: 9, padding: "0 18px" }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
          ))}
          <div
            style={{
              marginLeft: 18,
              flex: 1,
              height: 32,
              borderRadius: 9,
              background: dark ? "#2B3330" : "#fff",
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              fontSize: 17,
              color: dark ? "#B9C3BF" : C.muted,
              fontFamily: "monospace",
            }}
          >
            {url}
          </div>
          <span style={{ marginLeft: 14, fontSize: 15, fontWeight: 700, color: "#3FBF8F", letterSpacing: 1 }}>● DEVNET</span>
        </div>
        <div style={{ position: "relative", width: VIEW_W, height: VIEW_H, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: PAGE_W, height: pageH, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
            <Img src={staticFile(`app2x/${src}`)} style={{ width: PAGE_W, height: pageH, display: "block" }} />
            {marks.map((m, i) => (
              <Mark key={i} mark={m} s={s} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

const DONORS: [number, number] = [360, 460];
const VAULT: [number, number] = [960, 460];
const RECIPIENT: [number, number] = [1560, 460];
const BLOCKED: [number, number] = [960, 644];
const short = (k: string) => `${k.slice(0, 4)}…${k.slice(-4)}`;

export function DiagramWithBrowser({ a, b, reject, payout }: { a: string; b: string; reject: string; payout: string }) {
  const { lines } = useScene("earmarkB");
  const [l0, l1, l2, l3] = lines.map((l) => l.from);
  const notOrganizer = l0 + Math.round(lines[0].frames * 0.78);
  const RED = "#E5483C";
  const GREEN = C.accent;
  const BLUE = C.info;
  const FULL = (at: number, h = 1080): Key => ({ at, x: 960, y: Math.min(540, h / 2), z: 1 });
  return (
    <AbsoluteFill>
      <WithEarmark id="earmarkB" notOrganizerAt={0.78} vaultSub="on Solana · nobody holds the key" onSolana />
      {/* 1. a new fundraiser: the money will sit in the vault, donations wait for the recipient */}
      <BrowserWindow
        from={l0 + 60}
        to={notOrganizer - 8}
        anchor={VAULT}
        src="a-pending.png"
        pageH={1080}
        url={`localhost:3100/fundraisers/${short(a)}`}
        keys={[FULL(l0 + 60), FULL(l0 + 95), { at: l0 + 125, x: 1346, y: 255, z: 2.1 }]}
        marks={[
          { box: { x: 1200, y: 150, w: 200, h: 46 }, at: l0 + 130, color: GREEN, label: "held by the program", place: "bottom" },
          { box: { x: 1201, y: 272, w: 290, h: 84 }, at: l0 + 150, color: BLUE },
        ]}
      />
      {/* 2. the organizer names their own wallet: rejected by the program */}
      <BrowserWindow
        from={notOrganizer + 24}
        to={l1 + 44}
        anchor={BLOCKED}
        src="ex-reject.png"
        pageH={3000}
        url={`explorer.solana.com/tx/${short(reject)}?cluster=devnet`}
        dark
        keys={[
          { at: notOrganizer + 24, x: 960, y: 430, z: 1 },
          { at: notOrganizer + 40, x: 960, y: 430, z: 1 },
          { at: notOrganizer + 68, x: 1430, y: 2010, z: 1.55 },
        ]}
        marks={[
          { box: { x: 694, y: 262, w: 262, h: 30 }, at: notOrganizer + 28, color: RED, label: "failed", place: "bottom" },
          { box: { x: 998, y: 2078, w: 870, h: 40 }, at: notOrganizer + 72, color: RED, label: "RecipientNotVerified" },
        ]}
      />
      {/* 3. only a verified recipient, who confirms the need on-chain */}
      <BrowserWindow
        from={l1 + 54}
        to={l2 - 2}
        anchor={RECIPIENT}
        src="a-active.png"
        pageH={1080}
        url={`localhost:3100/fundraisers/${short(a)}`}
        keys={[FULL(l1 + 54), FULL(l1 + 84), { at: l1 + 112, x: 775, y: 548, z: 1.9 }]}
        marks={[
          { box: { x: 971, y: 507, w: 148, h: 31 }, at: l1 + 116, color: GREEN, label: "verified" },
          { box: { x: 430, y: 566, w: 690, h: 40 }, at: l1 + 140, color: GREEN, label: "confirmed on-chain", place: "bottom" },
        ]}
      />
      {/* 4. target reached: paid automatically */}
      <BrowserWindow
        from={l2 + 10}
        to={l2 + 72}
        anchor={RECIPIENT}
        src="a-paid.png"
        pageH={1300}
        url={`localhost:3100/fundraisers/${short(a)}`}
        keys={[{ at: l2 + 10, x: 960, y: 540, z: 1 }, { at: l2 + 34, x: 1346, y: 255, z: 2.0 }]}
        marks={[{ box: { x: 1201, y: 272, w: 290, h: 84 }, at: l2 + 36, color: GREEN, label: "paid automatically" }]}
      />
      <BrowserWindow
        from={l2 + 74}
        to={l3 + 30}
        anchor={RECIPIENT}
        src="ex-payout.png"
        pageH={3000}
        url={`explorer.solana.com/tx/${short(payout)}?cluster=devnet`}
        dark
        keys={[{ at: l2 + 74, x: 960, y: 2280, z: 1.1 }, { at: l2 + 96, x: 1125, y: 2330, z: 1.45 }]}
        marks={[
          { box: { x: 1352, y: 2286, w: 100, h: 42 }, at: l2 + 98, color: BLUE, label: "vault 0", place: "left" },
          { box: { x: 1352, y: 2374, w: 100, h: 42 }, at: l2 + 108, color: GREEN, label: "clinic +1 000", place: "left" },
        ]}
      />
      {/* 5. target missed: every donor takes their own money back */}
      <BrowserWindow
        from={l3 + 34}
        to={l3 + lines[3].frames + 4}
        anchor={DONORS}
        src="b-refunded.png"
        pageH={1500}
        url={`localhost:3100/fundraisers/${short(b)}`}
        keys={[{ at: l3 + 34, x: 960, y: 540, z: 1 }, { at: l3 + 56, x: 775, y: 1150, z: 1.8 }]}
        marks={[{ box: { x: 428, y: 1184, w: 690, h: 40 }, at: l3 + 60, color: BLUE, label: "refund, no approval needed" }]}
      />
    </AbsoluteFill>
  );
}
