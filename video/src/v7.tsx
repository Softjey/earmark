// v7 look: the same story and voice-over as v6, told with more motion — words land with the voice, donations
// stream in, the fundraiser card itself is stamped FAKE, fake tiles flip on a wall, the camera pulls back from
// the vault, and the database is edited live. Older cuts keep the views in Intro.tsx.
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import script from "../voiceover/script.json";
import { Kicker } from "./components/Caption";
import { Check, Cross, Eye, Lock, Person } from "./components/Icons";
import { Sfx, useBeats, useScene } from "./cut";
import { C, fadeOut, fadeUp, MONO, pop } from "./theme";
import { D, fmt, grow } from "./util";

/** Frame (relative to the scene) at which `phrase` is spoken in line `lineIdx`, estimated from its position in the text. */
function useWordAt(sceneId: string, lineIdx: number, phrase: string): number {
  const line = useScene(sceneId).lines[lineIdx];
  const text = script.scenes.find((s) => s.id === sceneId)?.lines[lineIdx]?.text ?? "";
  const i = Math.max(0, text.indexOf(phrase));
  return line.from + Math.round((line.frames * i) / Math.max(1, text.length));
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** A word that lands: drops in slightly large and settles. */
function Slam({ at, children, color = "#fff" }: { at: number; children: React.ReactNode; color?: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, at);
  return (
    <span style={{ display: "inline-block", color, opacity: clamp01(s * 2), transform: `scale(${1.35 - 0.35 * s})`, transformOrigin: "left bottom" }}>
      {children}
    </span>
  );
}

export function Hook7() {
  const frame = useCurrentFrame();
  const { frames } = useScene("hook");
  const robert = useWordAt("hook", 0, "Robert");
  const lewandowski = useWordAt("hook", 0, "Lewandowski");
  const scammed = useWordAt("hook", 0, "got scammed");
  return (
    <AbsoluteFill style={{ background: C.ink, padding: "0 160px", justifyContent: "center", opacity: fadeOut(frame, frames - 8, 8) }}>
      <Sfx at={scammed} name="stamp" volume={0.8} beat />
      <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 4, color: D.muted, ...fadeUp(frame, 0) }}>2017</div>
      <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -4, lineHeight: 1.05, marginTop: 20, display: "flex", gap: 36 }}>
        <Slam at={robert}>Robert</Slam>
        <Slam at={lewandowski}>Lewandowski</Slam>
      </div>
      <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -4, lineHeight: 1.05 }}>
        <Slam at={scammed} color={D.error}>
          got scammed.
        </Slam>
      </div>
    </AbsoluteFill>
  );
}

/** The fundraiser as donors saw it. With `fakeAt`, it loses its colour and gets stamped FAKE. */
function FundraiserCard({ enterAt, pillsAt, progress, fakeAt }: { enterAt: number; pillsAt: number; progress: number; fakeAt?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grey = fakeAt === undefined ? 0 : interpolate(frame, [fakeAt - 6, fakeAt + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stamp = fakeAt === undefined ? 0 : pop(frame, fps, fakeAt);
  return (
    <div style={{ position: "absolute", left: 160, top: 240, width: 720, ...(enterAt > 0 ? fadeUp(frame, enterAt, 40) : {}) }}>
      <div
        style={{
          background: C.surface,
          borderRadius: 16,
          overflow: "hidden",
          color: C.ink,
          filter: `grayscale(${grey}) brightness(${1 - grey * 0.35})`,
        }}
      >
        <div style={{ height: 260, background: C.track, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Eye size={120} color={C.muted} stroke={1.6} />
        </div>
        <div style={{ padding: "32px 40px 40px" }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: C.muted, letterSpacing: 1 }}>ONLINE FUNDRAISER</div>
          <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: -1, marginTop: 6 }}>„Boję się ciemności”</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 2 }}>“I'm afraid of the dark”</div>
          <div style={{ display: "flex", gap: 12, marginTop: 22, ...(pillsAt > 0 ? fadeUp(frame, pillsAt, 12) : {}) }}>
            <span style={{ background: C.ground, border: `2px solid ${C.line}`, borderRadius: 999, padding: "6px 18px", fontSize: 24, fontWeight: 600 }}>
              Antoś, 2 years old
            </span>
            <span style={{ background: C.warnSoft, color: C.warn, borderRadius: 999, padding: "6px 18px", fontSize: 24, fontWeight: 600 }}>eye cancer</span>
          </div>
          <div style={{ height: 16, background: C.track, borderRadius: 8, marginTop: 30, overflow: "hidden" }}>
            <div style={{ width: `${progress * 100}%`, height: "100%", background: C.accent, borderRadius: 8 }} />
          </div>
        </div>
      </div>
      {fakeAt !== undefined && (
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 250,
            padding: "6px 40px",
            border: `10px solid ${C.error}`,
            borderRadius: 18,
            color: C.error,
            background: "rgba(251,231,228,0.92)",
            fontSize: 150,
            fontWeight: 700,
            letterSpacing: 8,
            opacity: clamp01(stamp * 3),
            transform: `rotate(-14deg) scale(${2 - stamp})`,
          }}
        >
          FAKE
        </div>
      )}
    </div>
  );
}

const DONORS = [
  ["Anna K.", 50],
  ["Marek W.", 20],
  ["Ola P.", 100],
  ["Tomasz B.", 30],
  ["Kasia M.", 15],
  ["Piotr Z.", 200],
  ["Ewa S.", 25],
  ["Jan D.", 50],
  ["Magda R.", 40],
  ["Bartek L.", 10],
  ["Zosia N.", 60],
  ["Adam C.", 35],
] as const;

/** Donations scrolling in, newest on top. */
function DonationFeed({ start, step = 10, top }: { start: number; step?: number; top: number }) {
  const frame = useCurrentFrame();
  const n = (frame - start) / step;
  if (n < 0) return null;
  const rows = [];
  for (let k = 0; k <= Math.floor(n) && k < 40; k++) {
    const age = n - k;
    const opacity = clamp01(age * 3) * clamp01(4 - age);
    if (opacity <= 0) continue;
    const [name, amount] = DONORS[k % DONORS.length];
    rows.push(
      <div
        key={k}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: top + age * 70,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.06)",
          opacity,
          fontSize: 28,
        }}
      >
        <span style={{ color: D.soft }}>{name}</span>
        <span style={{ color: D.accent, fontWeight: 700, fontFamily: MONO }}>+{amount} zł</span>
      </div>,
    );
  }
  return <div style={{ position: "absolute", left: 1000, width: 700, top: 0, bottom: 0 }}>{rows}</div>;
}

export function Story7() {
  const frame = useCurrentFrame();
  const id = "storyL";
  const [b0] = useBeats(id);
  const { frames } = useScene(id);
  const lewa = useWordAt(id, 0, "a hundred thousand");
  const antos = useWordAt(id, 0, "Antosh");
  const people = useWordAt(id, 1, "six thousand");
  const total = useWordAt(id, 1, "Half a million");
  return (
    <AbsoluteFill style={{ background: C.ink, color: "#fff", opacity: fadeOut(frame, frames - 8, 8) }}>
      <Sfx at={lewa} name="coin" volume={0.3} />
      <div style={{ position: "absolute", left: 160, top: 150, fontSize: 32, fontWeight: 700, letterSpacing: 4, color: D.muted, ...fadeUp(frame, b0) }}>
        POLAND, 2017
      </div>
      <FundraiserCard enterAt={b0 + 4} pillsAt={antos} progress={grow(frame, b0, frames - b0, 1)} />
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 858,
          width: 720,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: C.accentSoft,
          border: `2px solid ${C.accent}`,
          borderRadius: 16,
          padding: "18px 32px",
          color: C.ink,
          ...fadeUp(frame, lewa, 30),
        }}
      >
        <span style={{ fontSize: 30, fontWeight: 600 }}>Anna &amp; Robert Lewandowski</span>
        <span style={{ fontSize: 34, fontWeight: 700, color: C.accent }}>100 000 zł</span>
      </div>
      <div style={{ position: "absolute", left: 1000, top: 200, display: "flex", gap: 60 }}>
        <div style={fadeUp(frame, people)}>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {fmt(Math.round(grow(frame, people, 40, 650)) * 10)}+
          </div>
          <div style={{ fontSize: 28, color: D.soft, marginTop: 8 }}>people donated</div>
        </div>
        <div style={fadeUp(frame, total)}>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {fmt(Math.round(grow(frame, total, 40, 500)) * 1000)} zł
          </div>
          <div style={{ fontSize: 28, color: D.soft, marginTop: 8 }}>raised in weeks</div>
        </div>
      </div>
      <DonationFeed start={b0 + 10} top={420} />
    </AbsoluteFill>
  );
}

export function Twist7() {
  const frame = useCurrentFrame();
  const id = "twistL";
  const [b0, b1, b2] = useBeats(id);
  const { frames } = useScene(id);
  return (
    <AbsoluteFill style={{ background: C.ink, color: "#fff", opacity: fadeOut(frame, frames - 8, 8) }}>
      <div style={{ position: "absolute", left: 160, top: 150, fontSize: 32, fontWeight: 700, letterSpacing: 4, color: D.muted }}>POLAND, 2017</div>
      <FundraiserCard enterAt={0} pillsAt={0} progress={1} fakeAt={b0 + 4} />
      <div style={{ position: "absolute", left: 1000, top: 250, width: 780 }}>
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, ...fadeUp(frame, b0 + 6, 0) }}>Antoś did not exist.</div>
        <div style={{ fontSize: 36, fontWeight: 500, color: D.soft, marginTop: 30, lineHeight: 1.35, ...fadeUp(frame, b1) }}>
          The organizer made him up and spent the money on himself.
          <span style={{ color: D.muted }}> Later sentenced to six years.</span>
        </div>
        <div style={{ display: "flex", gap: 70, marginTop: 70 }}>
          <div style={fadeUp(frame, b2)}>
            <div style={{ fontSize: 96, fontWeight: 700, color: D.accent, lineHeight: 1 }}>1</div>
            <div style={{ fontSize: 28, color: D.soft, marginTop: 10 }}>refunded: the Lewandowskis</div>
          </div>
          <div style={fadeUp(frame, b2 + 36)}>
            <div style={{ fontSize: 96, fontWeight: 700, color: D.error, lineHeight: 1 }}>6 500+</div>
            <div style={{ fontSize: 28, color: D.soft, marginTop: 10 }}>others never were</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

const CAUSES = [
  "Medical treatment",
  "Flood relief",
  "War relief",
  "Animal shelter",
  "Clean water",
  "School supplies",
  "Wildfire relief",
  "Children's ward",
  "Food bank",
];

/** A wall of fundraiser tiles drifting up; some of them flip over to FAKE. */
function TileWall({ appearAt, flipFrom, flipTo }: { appearAt: number; flipFrom: number; flipTo: number }) {
  const frame = useCurrentFrame();
  const cols = 3;
  const rows = 8;
  const w = 250;
  const h = 118;
  const gap = 20;
  // which tiles turn out fake, and when (deterministic)
  const fakes = [4, 9, 1, 13, 7, 16, 11, 20, 2, 18];
  const drift = -frame * 0.7;
  const tiles = [];
  for (let i = 0; i < cols * rows; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const order = fakes.indexOf(i);
    const flipAt = flipFrom + ((flipTo - flipFrom) * order) / fakes.length;
    const flip = order < 0 ? 0 : interpolate(frame, [flipAt, flipAt + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const fake = flip >= 0.5;
    const appear = fadeUp(frame, appearAt + i * 2, 30);
    const progress = 0.25 + random(`p${i}`) * 0.7;
    tiles.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: c * (w + gap),
          top: r * (h + gap) + drift,
          width: w,
          height: h,
          boxSizing: "border-box",
          borderRadius: 14,
          padding: "18px 20px",
          background: fake ? C.errorSoft : C.surface,
          border: `2px solid ${fake ? C.error : C.line}`,
          opacity: appear.opacity,
          transform: `${appear.transform} scaleX(${Math.abs(1 - 2 * flip) || 0.02})`,
        }}
      >
        {fake ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: C.error, fontSize: 40, fontWeight: 700, letterSpacing: 4 }}>
            <Cross size={34} color={C.error} stroke={3.4} /> FAKE
          </div>
        ) : (
          <>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>{CAUSES[i % CAUSES.length]}</div>
            <div style={{ height: 10, background: C.track, borderRadius: 5, marginTop: 22, overflow: "hidden" }}>
              <div style={{ width: `${progress * 100}%`, height: "100%", background: C.accent }} />
            </div>
          </>
        )}
      </div>,
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        top: 180,
        width: cols * (w + gap),
        height: 820,
        overflow: "hidden",
        maskImage: "linear-gradient(to bottom, transparent, black 12%, black 85%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 12%, black 85%, transparent)",
      }}
    >
      {tiles}
    </div>
  );
}

function Stat({ start, kicker, value, text, source, children }: { start: number; kicker: string; value: string; text: string; source: string; children?: React.ReactNode }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...fadeUp(frame, start, 30) }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.muted, letterSpacing: 2 }}>{kicker}</div>
      <div style={{ fontSize: 132, fontWeight: 700, color: C.error, letterSpacing: -4, lineHeight: 1, marginTop: 8, whiteSpace: "nowrap" }}>{value}</div>
      <div style={{ fontSize: 32, color: C.ink, marginTop: 10, fontWeight: 500, maxWidth: 760 }}>{text}</div>
      {children}
      <div style={{ fontSize: 18, color: C.muted, marginTop: 10 }}>{source}</div>
    </div>
  );
}

export function Scale7() {
  const frame = useCurrentFrame();
  const [b0, b1, b2, b3] = useBeats("scale");
  const { frames } = useScene("scale");
  return (
    <AbsoluteFill style={{ background: C.ground, opacity: fadeOut(frame, frames - 8, 8) }}>
      <Kicker>Any good cause can be faked</Kicker>
      <TileWall appearAt={b0} flipFrom={b1} flipTo={b3} />
      <div style={{ position: "absolute", left: 1000, top: 200, display: "flex", flexDirection: "column", gap: 60 }}>
        <Stat
          start={b1}
          kicker="POLAND, 2024 FLOODS"
          value={String(Math.round(grow(frame, b1 + 8, 40, 150)))}
          text="fake fundraisers for flood victims found by the police"
          source="Source: Polish police cybercrime bureau (CBZC), 2024"
        />
        <Stat
          start={b2}
          kicker="USA, 2024"
          value={`$${Math.round(grow(frame, b2 + 8, 40, 96))} M`}
          text="lost to fake charities, fundraisers and disaster appeals"
          source="Source: FBI Internet Crime Complaint Center (IC3), Jan 2025"
        >
          <div
            style={{
              display: "inline-flex",
              marginTop: 14,
              background: C.warnSoft,
              color: C.warn,
              borderRadius: 999,
              padding: "6px 18px",
              fontSize: 24,
              fontWeight: 700,
              ...fadeUp(frame, b3, 10),
            }}
          >
            only what was reported
          </div>
        </Stat>
      </div>
    </AbsoluteFill>
  );
}

/** Starts close on a point and pulls back to the full frame. */
export function PullBack({ from, origin, start, duration, children }: { from: number; origin: string; start: number; duration: number; children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [start, start + duration], [from, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  return <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: origin }}>{children}</AbsoluteFill>;
}

export function EarmarkPullBack({ children }: { children: React.ReactNode }) {
  const [b0] = useBeats("earmarkB");
  return (
    <PullBack from={1.6} origin="50% 42.6%" start={b0 + 20} duration={70}>
      {children}
    </PullBack>
  );
}

/** Text typed over: deletes `from` and types `to`, between two frames. */
function retype(frame: number, from: string, to: string, start: number, perChar = 1.6): { text: string; editing: boolean } {
  const t = (frame - start) / perChar;
  if (t <= 0) return { text: from, editing: false };
  if (t < from.length) return { text: from.slice(0, from.length - Math.floor(t)), editing: true };
  const typed = Math.floor(t - from.length);
  if (typed < to.length) return { text: to.slice(0, typed), editing: true };
  return { text: to, editing: false };
}

function Caret({ on }: { on: boolean }) {
  const frame = useCurrentFrame();
  return <span style={{ display: "inline-block", width: 3, height: 36, marginLeft: 3, background: C.ink, verticalAlign: "middle", opacity: on && frame % 16 < 10 ? 1 : 0 }} />;
}

export function Why7() {
  const frame = useCurrentFrame();
  const [b0, b1] = useBeats("why");
  const { frames } = useScene("why");
  const numbersAt = useWordAt("why", 0, "change the numbers");
  const payAt = useWordAt("why", 0, "pay anyone");
  const overrideAt = useWordAt("why", 1, "Nobody can override");
  const checkAt = useWordAt("why", 1, "anyone can check");
  const raised = retype(frame, "500 000 zł", "50 000 zł", numbersAt, 1.4);
  const paid = retype(frame, "Verified recipient", "Organizer", payAt, 1.2);
  const row = (label: string, value: React.ReactNode, changed: boolean) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: `2px solid ${C.line}` }}>
      <span style={{ fontSize: 30, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 32, fontFamily: MONO, fontWeight: 500, color: changed ? C.error : C.ink }}>{value}</span>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: C.ground, opacity: fadeOut(frame, frames - 8, 8) }}>
      <Kicker>Why a blockchain?</Kicker>
      <div style={{ position: "absolute", left: 160, top: 250, width: 760, ...fadeUp(frame, b0 + 10, 40) }}>
        <div style={{ background: C.surface, border: `3px solid ${C.line}`, borderRadius: 16, padding: "36px 44px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 44, fontWeight: 700, color: C.ink }}>A normal database</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.warnSoft, color: C.warn, borderRadius: 999, padding: "6px 16px", fontSize: 24, fontWeight: 700 }}>
              <Person size={24} color={C.warn} stroke={2.6} /> owner
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            {row(
              "Raised",
              <>
                {raised.text}
                <Caret on={raised.editing} />
              </>,
              frame > numbersAt + 4,
            )}
            {row(
              "Paid to",
              <>
                {paid.text}
                <Caret on={paid.editing} />
              </>,
              frame > payAt + 4,
            )}
            {row("Refunds", "on request", false)}
          </div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 600, color: C.error, marginTop: 22, ...fadeUp(frame, payAt + 30, 10) }}>The owner can rewrite anything.</div>
      </div>
      <div style={{ position: "absolute", left: 1000, top: 250, width: 760, ...fadeUp(frame, b1, 40) }}>
        <div style={{ background: C.accentSoft, border: `3px solid ${C.accent}`, borderRadius: 16, padding: "36px 44px" }}>
          <div style={{ fontSize: 44, fontWeight: 700, color: C.ink }}>Solana blockchain</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 34 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", ...fadeUp(frame, b1 + 10 + i * 8, 14) }}>
                {i > 0 && <div style={{ width: 34, height: 4, background: C.accent }} />}
                <div
                  style={{
                    width: 118,
                    height: 118,
                    borderRadius: 14,
                    background: C.surface,
                    border: `3px solid ${C.accent}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Lock size={34} color={C.accent} stroke={2.6} />
                  <div style={{ fontFamily: MONO, fontSize: 16, color: C.muted }}>#{Math.floor(random(`h${i}`) * 0xfffff).toString(16)}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 30, ...fadeUp(frame, overrideAt, 10) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.errorSoft, color: C.error, borderRadius: 999, padding: "6px 16px", fontSize: 24, fontWeight: 700 }}>
              <Cross size={22} color={C.error} stroke={3} /> edit attempt rejected
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, ...fadeUp(frame, checkAt, 10) }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={24} color="#fff" stroke={3.2} />
            </div>
            <span style={{ fontSize: 30, fontWeight: 600, color: C.ink }}>Anyone can check every transfer</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** Subtle film grain and vignette over the whole cut. */
export function Grain() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, opacity: 0.06, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 30} />
        </filter>
        <rect width="1920" height="1080" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 70%, rgba(0,0,0,0.1) 100%)" }} />
    </AbsoluteFill>
  );
}
