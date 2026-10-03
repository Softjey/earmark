import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Kicker } from "./components/Caption";
import { Flow } from "./components/Flow";
import { Building, Check, Cross, Eye, Heart, Lock, LogoMark, People, Person } from "./components/Icons";
import { Node } from "./components/Node";
import { C, fadeOut, fadeUp, MONO, pop, SANS } from "./theme";
import { CutContext, type Cut, Sfx, useBeats, useCut, useScene, useShake } from "./cut";
import { sequence, type Variant, voFolder } from "./timeline";

// Light tints for text on the dark (ink) scenes.
const D = { muted: "#9FB3AC", soft: "#B9C3BF", accent: "#7FD4B8", error: "#F2A99F" };

const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");

function grow(frame: number, start: number, duration: number, to: number) {
  return interpolate(frame, [start, start + duration], [0, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

function Story({ id = "story", lewandowski = false }: { id?: string; lewandowski?: boolean }) {
  const frame = useCurrentFrame();
  const [b0, b2] = useBeats(id);
  const { frames, lines } = useScene(id);
  const b1 = b0 + Math.round(lines[0].frames * (lewandowski ? 0.75 : 0.6));
  const progress = grow(frame, b2, 60, 1);
  return (
    <AbsoluteFill style={{ background: C.ink, color: "#fff", opacity: fadeOut(frame, frames - 10, 10) }}>
      <Sfx at={b0 + 12} name="pop" volume={0.35} />
      {lewandowski && <Sfx at={b0 + 30} name="coin" volume={0.3} />}
      <Sfx at={b1} name="pop" volume={0.3} />
      <Sfx at={b2} name="counter" volume={0.3} />
      <Sfx at={b2 + 25} name="counter" volume={0.3} />
      <div style={{ position: "absolute", left: 160, top: 150, fontSize: 32, fontWeight: 700, letterSpacing: 4, color: D.muted, ...fadeUp(frame, b0) }}>
        POLAND, 2017
      </div>
      {lewandowski && (
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
            ...fadeUp(frame, b0 + 30, 30),
          }}
        >
          <span style={{ fontSize: 30, fontWeight: 600 }}>Anna &amp; Robert Lewandowski</span>
          <span style={{ fontSize: 34, fontWeight: 700, color: C.accent }}>100 000 zł</span>
        </div>
      )}
      {/* The fundraiser, as donors saw it */}
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 240,
          width: 720,
          background: C.surface,
          borderRadius: 16,
          overflow: "hidden",
          color: C.ink,
          ...fadeUp(frame, b0 + 12, 40),
        }}
      >
        <div style={{ height: 260, background: C.track, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Eye size={120} color={C.muted} stroke={1.6} />
        </div>
        <div style={{ padding: "32px 40px 40px" }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: C.muted, letterSpacing: 1 }}>ONLINE FUNDRAISER</div>
          <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: -1, marginTop: 6 }}>„Boję się ciemności”</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 2 }}>“I'm afraid of the dark”</div>
          <div style={{ display: "flex", gap: 12, marginTop: 22, ...fadeUp(frame, b1, 12) }}>
            <span style={{ background: C.ground, border: `2px solid ${C.line}`, borderRadius: 999, padding: "6px 18px", fontSize: 24, fontWeight: 600 }}>
              Antoś, 2 years old
            </span>
            <span style={{ background: C.warnSoft, color: C.warn, borderRadius: 999, padding: "6px 18px", fontSize: 24, fontWeight: 600 }}>
              eye cancer
            </span>
          </div>
          <div style={{ height: 16, background: C.track, borderRadius: 8, marginTop: 30, overflow: "hidden" }}>
            <div style={{ width: `${progress * 100}%`, height: "100%", background: C.accent, borderRadius: 8 }} />
          </div>
        </div>
      </div>
      {/* Counters */}
      <div style={{ position: "absolute", left: 1000, top: 330, display: "flex", flexDirection: "column", gap: 56 }}>
        <div style={fadeUp(frame, b2)}>
          <div style={{ fontSize: 130, fontWeight: 700, letterSpacing: -3, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {fmt(Math.round(grow(frame, b2, 45, 650)) * 10)}+
          </div>
          <div style={{ fontSize: 34, color: D.soft, marginTop: 10 }}>people donated</div>
        </div>
        <div style={fadeUp(frame, b2 + 25)}>
          <div style={{ fontSize: 130, fontWeight: 700, letterSpacing: -3, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {fmt(Math.round(grow(frame, b2 + 25, 45, 500)) * 1000)} zł
          </div>
          <div style={{ fontSize: 34, color: D.soft, marginTop: 10 }}>raised in a few weeks</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Hook() {
  const frame = useCurrentFrame();
  const { frames } = useScene("hook");
  const [b0] = useBeats("hook");
  const { fps } = useVideoConfig();
  const stamp = pop(frame, fps, b0 + 40);
  const shake = useShake(b0 + 40);
  return (
    <AbsoluteFill
      style={{ background: C.ink, color: "#fff", padding: "0 160px", justifyContent: "center", opacity: fadeOut(frame, frames - 10, 10), transform: shake }}
    >
      <Sfx at={b0 + 38} name="stamp" volume={0.8} beat />
      <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 4, color: D.muted, ...fadeUp(frame, 0) }}>2017</div>
      <div style={{ fontSize: 140, fontWeight: 700, letterSpacing: -4, lineHeight: 1.05, marginTop: 20, ...fadeUp(frame, b0) }}>Robert Lewandowski</div>
      <div
        style={{
          fontSize: 140,
          fontWeight: 700,
          letterSpacing: -4,
          lineHeight: 1.05,
          color: D.error,
          opacity: stamp,
          transform: `scale(${1.15 - 0.15 * stamp})`,
          transformOrigin: "left center",
        }}
      >
        got scammed.
      </div>
    </AbsoluteFill>
  );
}

function Twist({ id = "twist", refunded = "famous donor got a refund" }: { id?: string; refunded?: string }) {
  const frame = useCurrentFrame();
  const [b0, b1, b2] = useBeats(id);
  const { frames } = useScene(id);
  const shake = useShake(b0, 18);
  return (
    <AbsoluteFill
      style={{ background: C.ink, color: "#fff", padding: "0 160px", justifyContent: "center", opacity: fadeOut(frame, frames - 10, 10), transform: shake }}
    >
      <Sfx at={b0 - 2} name="impact" volume={0.9} beat />
      <Sfx at={b2} name="pop" volume={0.3} />
      <Sfx at={b2 + 40} name="doubt" volume={0.3} />
      <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -3, ...fadeUp(frame, b0, 0) }}>Antoś did not exist.</div>
      <div style={{ fontSize: 46, fontWeight: 500, color: D.soft, marginTop: 28, maxWidth: 1400, ...fadeUp(frame, b1) }}>
        The organizer invented him and spent the money on himself.
        <span style={{ color: D.muted }}> Later sentenced to six years in prison.</span>
      </div>
      <div style={{ display: "flex", gap: 120, marginTop: 90 }}>
        <div style={fadeUp(frame, b2)}>
          <div style={{ fontSize: 110, fontWeight: 700, color: D.accent, lineHeight: 1 }}>1</div>
          <div style={{ fontSize: 32, color: D.soft, marginTop: 10 }}>{refunded}</div>
        </div>
        <div style={fadeUp(frame, b2 + 40)}>
          <div style={{ fontSize: 110, fontWeight: 700, color: D.error, lineHeight: 1 }}>6 500+</div>
          <div style={{ fontSize: 32, color: D.soft, marginTop: 10 }}>others did not</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function StatCard({ start, children, source }: { start: number; children: React.ReactNode; source: string }) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width: 760,
        height: 600,
        background: C.surface,
        border: `2px solid ${C.line}`,
        borderRadius: 16,
        padding: 48,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 12px 32px rgba(14,26,23,0.08)",
        ...fadeUp(frame, start, 40),
      }}
    >
      {children}
      <div style={{ marginTop: "auto", fontSize: 20, color: C.muted }}>{source}</div>
    </div>
  );
}

const CAUSES = ["Medical treatment", "Flood relief", "War relief", "Animal shelters", "Clean water"];

function Scale() {
  const frame = useCurrentFrame();
  const [b0, b1, b2, b3] = useBeats("scale");
  const { frames } = useScene("scale");
  return (
    <AbsoluteFill style={{ background: C.ground, opacity: fadeOut(frame, frames - 10, 10) }}>
      <Kicker>It keeps happening</Kicker>
      {CAUSES.map((c, i) => (
        <Sfx key={c} at={b0 + 25 + i * 8} name="pop" volume={0.2} />
      ))}
      <Sfx at={b1 + 10} name="counter" volume={0.3} />
      <Sfx at={b2 + 10} name="counter" volume={0.3} />
      <Sfx at={b3} name="doubt" volume={0.3} />
      <div style={{ position: "absolute", left: 160, top: 190, display: "flex", gap: 16 }}>
        {CAUSES.map((c, i) => (
          <span
            key={c}
            style={{
              background: C.surface,
              border: `2px solid ${C.line}`,
              borderRadius: 999,
              padding: "10px 26px",
              fontSize: 30,
              fontWeight: 600,
              color: C.ink,
              ...fadeUp(frame, b0 + 25 + i * 8, 16),
            }}
          >
            {c}
          </span>
        ))}
      </div>
      <div style={{ position: "absolute", left: 160, top: 310, display: "flex", gap: 80 }}>
        <StatCard start={b1} source="Source: Polish police cybercrime bureau (CBZC), 2024">
          <div style={{ fontSize: 30, fontWeight: 700, color: C.muted, letterSpacing: 2 }}>POLAND, 2024 FLOODS</div>
          <div style={{ fontSize: 150, fontWeight: 700, color: C.error, letterSpacing: -4, lineHeight: 1, marginTop: 16, fontVariantNumeric: "tabular-nums" }}>
            {Math.round(grow(frame, b1 + 10, 45, 150))}
          </div>
          <div style={{ fontSize: 34, color: C.ink, marginTop: 14, fontWeight: 500 }}>fake fundraisers for flood victims found by the police</div>
        </StatCard>
        <StatCard start={b2} source="Source: FBI Internet Crime Complaint Center (IC3), Jan 2025">
          <div style={{ fontSize: 30, fontWeight: 700, color: C.muted, letterSpacing: 2 }}>USA, 2024</div>
          <div style={{ fontSize: 150, fontWeight: 700, color: C.error, letterSpacing: -4, lineHeight: 1, marginTop: 16, whiteSpace: "nowrap" }}>
            ${Math.round(grow(frame, b2 + 10, 45, 96))} M
          </div>
          <div style={{ fontSize: 34, color: C.ink, marginTop: 14, fontWeight: 500 }}>lost to fake charities, fundraisers and disaster appeals</div>
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              marginTop: 22,
              background: C.warnSoft,
              color: C.warn,
              borderRadius: 999,
              padding: "6px 18px",
              fontSize: 26,
              fontWeight: 700,
              ...fadeUp(frame, b3, 10),
            }}
          >
            only what was reported
          </div>
        </StatCard>
      </div>
    </AbsoluteFill>
  );
}

function TrustTag({ x, y, start }: { x: number; y: number; start: number }) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: x - 70,
        top: y,
        width: 140,
        textAlign: "center",
        background: C.warnSoft,
        color: C.warn,
        borderRadius: 999,
        padding: "6px 0",
        fontSize: 26,
        fontWeight: 700,
        ...fadeUp(frame, start, 12),
      }}
    >
      trust?
    </div>
  );
}

const ROW = 500;

function Today() {
  const frame = useCurrentFrame();
  const [b0, b1, b2] = useBeats("today");
  const { frames, lines } = useScene("today");
  const half = b1 + Math.round(lines[1].frames * 0.45);
  return (
    <AbsoluteFill style={{ background: C.ground, opacity: fadeOut(frame, frames - 10, 10) }}>
      <Kicker>Today</Kicker>
      <Sfx at={b1} name="whoosh" volume={0.25} />
      <Sfx at={half} name="whoosh" volume={0.25} />
      <Sfx at={b2} name="doubt" volume={0.35} />
      <Flow from={{ x: 575, y: ROW }} to={{ x: 785, y: ROW }} start={b1} color={C.muted} />
      <Flow from={{ x: 1135, y: ROW }} to={{ x: 1345, y: ROW }} start={half} color={C.muted} />
      <Node x={400} y={ROW} title="Donors" icon={(c) => <People size={44} color={c} />} start={b0} />
      <Node x={960} y={ROW} title="Platform" sub="holds the money" icon={(c) => <Building size={44} color={c} />} start={b0 + 12} />
      <Node x={1520} y={ROW} title="Organizer" sub="own bank account" icon={(c) => <Person size={44} color={c} />} start={b0 + 24} />
      <TrustTag x={960} y={ROW - 140} start={b2} />
      <TrustTag x={1520} y={ROW - 140} start={b2 + 8} />
      <Caption start={b2 + 4}>After the payout, all you have is trust.</Caption>
    </AbsoluteFill>
  );
}

function Question() {
  const frame = useCurrentFrame();
  const [b0] = useBeats("question");
  const { frames } = useScene("question");
  return (
    <AbsoluteFill style={{ background: C.ink, alignItems: "center", justifyContent: "center", opacity: fadeOut(frame, frames - 10, 10) }}>
      <div style={{ fontSize: 100, fontWeight: 700, color: "#fff", letterSpacing: -2.5, textAlign: "center", lineHeight: 1.15, maxWidth: 1500, ...fadeUp(frame, b0) }}>
        What if the organizer could <span style={{ color: D.accent }}>never</span> touch the money?
      </div>
    </AbsoluteFill>
  );
}

const VAULT = { x: 960, y: 460 };

function WithEarmark({
  id = "earmark",
  notOrganizerAt = 0.62,
  vaultSub = "nobody holds the key",
  onSolana = false,
}: {
  id?: string;
  notOrganizerAt?: number;
  vaultSub?: string;
  onSolana?: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [b0, b1, b2, b3] = useBeats(id);
  const { frames, lines } = useScene(id);
  const notOrganizer = b0 + Math.round(lines[0].frames * notOrganizerAt);
  const blocked = pop(frame, fps, notOrganizer + 22);
  const shake = useShake(notOrganizer + 22, 8);
  return (
    <AbsoluteFill style={{ background: C.ground, opacity: fadeOut(frame, frames - 10, 10), transform: shake }}>
      <Kicker color={C.accent}>{onSolana ? "With Earmark · on Solana" : "With Earmark"}</Kicker>
      <Sfx at={b0 + 30} name="whoosh" volume={0.25} />
      <Sfx at={notOrganizer + 20} name="error" volume={0.4} beat />
      <Sfx at={b1 + 20} name="chime" volume={0.3} />
      <Sfx at={b2 + 22} name="coin" volume={0.45} beat />
      <Sfx at={b3} name="refund" volume={0.35} />
      <Flow from={{ x: 535, y: VAULT.y }} to={{ x: 775, y: VAULT.y }} start={b0 + 30} color={C.accent} />
      <Flow from={{ x: 1145, y: VAULT.y }} to={{ x: 1385, y: VAULT.y }} start={b2} color={C.accent} />
      <Flow from={{ x: VAULT.x, y: VAULT.y + 85 }} to={{ x: VAULT.x, y: 735 }} start={notOrganizer} duration={22} stopAt={0.55} color={C.error} coins={false} />
      <Flow from={{ x: 880, y: VAULT.y - 85 }} via={{ x: 650, y: 200 }} to={{ x: 430, y: VAULT.y - 98 }} start={b3} duration={30} color={C.info} />

      <Node x={360} y={VAULT.y} title="Donors" icon={(c) => <People size={44} color={c} />} start={b0} />
      <Node x={VAULT.x} y={VAULT.y} w={370} title="Vault" sub={vaultSub} variant="vault" icon={(c) => <Lock size={44} color={c} />} start={b0 + 12} />
      <Node x={1560} y={VAULT.y} title="Recipient" sub="clinic · shelter · charity" variant="verified" icon={(c) => <Heart size={44} color={c} />} start={b1} />
      <Node x={VAULT.x} y={830} h={130} title="Organizer" sub="cannot be paid" variant="disabled" icon={(c) => <Person size={36} color={c} />} start={notOrganizer - 8} />

      <div
        style={{
          position: "absolute",
          left: VAULT.x - 34,
          top: 610,
          width: 68,
          height: 68,
          borderRadius: 34,
          background: C.error,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${blocked})`,
        }}
      >
        <Cross size={38} color="#fff" stroke={3.2} />
      </div>
      <div
        style={{
          position: "absolute",
          left: VAULT.x + 60,
          top: 624,
          fontFamily: MONO,
          fontSize: 26,
          fontWeight: 500,
          color: C.error,
          background: C.errorSoft,
          padding: "6px 14px",
          borderRadius: 10,
          ...fadeUp(frame, notOrganizer + 26, 10),
        }}
      >
        RecipientNotVerified
      </div>
      <div style={{ position: "absolute", left: 1400, top: 300, display: "flex", alignItems: "center", gap: 8, fontSize: 26, fontWeight: 600, color: C.accent, ...fadeUp(frame, b1 + 20, 10) }}>
        <Check size={28} color={C.accent} stroke={3} /> confirmed the need
      </div>
      <div style={{ position: "absolute", left: 1400, top: 560, display: "flex", alignItems: "center", gap: 8, fontSize: 26, fontWeight: 600, color: C.accent, ...fadeUp(frame, b2 + 25, 10) }}>
        <Check size={28} color={C.accent} stroke={3} /> paid when the target is hit
      </div>
      <div style={{ position: "absolute", left: 470, top: 228, fontSize: 28, fontWeight: 600, color: C.info, ...fadeUp(frame, b3 + 25, 10) }}>
        or back to each donor
      </div>
      <Caption start={b3 + lines[3].frames}>
        Only to a <span style={{ color: C.accent }}>verified recipient</span>. Or <span style={{ color: C.info }}>back to the donors</span>.
      </Caption>
    </AbsoluteFill>
  );
}

function Title({ id = "title", second = "Just rules, written in code, that nobody can bend." }: { id?: string; second?: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [b0, b1] = useBeats(id);
  const s = pop(frame, fps, b1);
  const linesOut = fadeOut(frame, b1 - 8, 8);
  return (
    <AbsoluteFill style={{ background: C.ground, alignItems: "center", justifyContent: "center" }}>
      <Sfx at={b1 - 4} name="whoosh" volume={0.3} />
      {frame < b1 && (
        <div style={{ textAlign: "center", opacity: linesOut }}>
          <div style={{ fontSize: 76, fontWeight: 700, color: C.ink, letterSpacing: -1.5, ...fadeUp(frame, b0) }}>No middleman holding the money.</div>
          <div style={{ fontSize: 56, fontWeight: 500, color: C.muted, marginTop: 24, ...fadeUp(frame, b0 + 50) }}>{second}</div>
        </div>
      )}
      {frame >= b1 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 28, transform: `scale(${0.9 + 0.1 * s})`, opacity: s }}>
            <LogoMark size={128} />
            <div style={{ fontSize: 150, fontWeight: 700, color: C.ink, letterSpacing: -4 }}>Earmark</div>
          </div>
          <div style={{ fontSize: 44, fontWeight: 500, color: C.muted, marginTop: 28, ...fadeUp(frame, b1 + 14) }}>
            Fundraisers without an intermediary
          </div>
        </>
      )}
    </AbsoluteFill>
  );
}

const DATABASE = ["Has an owner", "Owner can change the numbers", "Owner decides who gets paid"];
const CHAIN = ["No owner of the money", "Rules are public code", "Anyone can check every transfer"];

function Why() {
  const frame = useCurrentFrame();
  const [b0, b1] = useBeats("why");
  const { frames, lines } = useScene("why");
  const column = (title: string, items: string[], start: number, good: boolean) => (
    <div
      style={{
        width: 760,
        background: good ? C.accentSoft : C.surface,
        border: `3px solid ${good ? C.accent : C.line}`,
        borderRadius: 16,
        padding: "44px 48px",
        boxSizing: "border-box",
        ...fadeUp(frame, start, 40),
      }}
    >
      <div style={{ fontSize: 46, fontWeight: 700, color: C.ink, letterSpacing: -1 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 34 }}>
        {items.map((item, i) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 18, ...fadeUp(frame, start + 18 + i * 14, 12) }}>
            <div
              style={{
                width: 48,
                height: 48,
                flex: "none",
                borderRadius: 24,
                background: good ? C.accent : C.errorSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {good ? <Check size={28} color="#fff" stroke={3.2} /> : <Cross size={26} color={C.error} stroke={3.2} />}
            </div>
            <div style={{ fontSize: 34, fontWeight: 500, color: C.ink }}>{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: C.ground, opacity: fadeOut(frame, frames - 10, 10) }}>
      <Kicker>Why a blockchain?</Kicker>
      {DATABASE.map((item, i) => (
        <Sfx key={item} at={b0 + Math.round(lines[0].frames * 0.3) + 18 + i * 14} name="pop" volume={0.2} />
      ))}
      <Sfx at={b1 + 18} name="chime" volume={0.25} />
      <div style={{ position: "absolute", left: 160, top: 330, display: "flex", gap: 80 }}>
        {column("A normal database", DATABASE, b0 + Math.round(lines[0].frames * 0.3), false)}
        {column("Solana blockchain", CHAIN, b1, true)}
      </div>
    </AbsoluteFill>
  );
}

const VIEWS: Record<string, () => React.ReactNode> = {
  hook: Hook,
  story: () => <Story />,
  storyL: () => <Story id="storyL" lewandowski />,
  twist: () => <Twist />,
  twistL: () => <Twist id="twistL" refunded="donor refunded: the Lewandowskis" />,
  scale: Scale,
  today: Today,
  question: Question,
  earmark: () => <WithEarmark />,
  earmarkB: () => <WithEarmark id="earmarkB" notOrganizerAt={0.78} vaultSub="on Solana · nobody holds the key" onSolana />,
  why: Why,
  title: () => <Title />,
  titleB: () => <Title id="titleB" second="Just rules that nobody can bend." />,
};

type Mood = "story" | "dark" | "riser" | "hope" | "resolve";

const MOOD: Record<string, Mood> = {
  hook: "story",
  story: "story",
  storyL: "story",
  twist: "dark",
  twistL: "dark",
  scale: "dark",
  today: "dark",
  question: "riser",
  earmark: "hope",
  earmarkB: "hope",
  why: "hope",
  title: "resolve",
  titleB: "resolve",
};

/** One music stem per run of scenes that share a mood, faded in and out at the edges. */
function Music({ scenes, dynamic }: { scenes: { id: string; from: number; frames: number }[]; dynamic: boolean }) {
  const runs: { mood: Mood; from: number; frames: number }[] = [];
  for (const s of scenes) {
    const mood = MOOD[s.id];
    const last = runs[runs.length - 1];
    if (last && last.mood === mood) last.frames += s.frames;
    else runs.push({ mood, from: s.from, frames: s.frames });
  }
  const level = dynamic ? 0.3 : 0.24;
  return (
    <>
      {runs.map((r) => {
        // the riser has to land exactly on the next scene, so it is aligned to its end
        const offset = r.mood === "riser" ? Math.max(0, 12 * 30 - r.frames) : 0;
        const gain = r.mood === "riser" ? level * 0.6 : level;
        return (
          <Sequence key={`${r.mood}-${r.from}`} from={r.from} durationInFrames={r.frames} layout="none">
            <Audio
              src={staticFile(`music/${r.mood}${dynamic ? "-drive" : ""}.mp3`)}
              trimBefore={offset}
              volume={(f) =>
                gain *
                interpolate(f, [0, 12, r.frames - 15, r.frames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
              }
            />
          </Sequence>
        );
      })}
    </>
  );
}

/** Dynamic cut: every scene punches in (scale + blur) and slowly pushes the camera. */
function SceneFrame({ frames, children }: { frames: number; children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const { pacing, fx } = useCut();
  if (pacing !== "dynamic" || !fx) return <>{children}</>;
  const enter = interpolate(frame, [0, 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const push = interpolate(frame, [0, frames], [1, 1.035]);
  return (
    <AbsoluteFill style={{ transform: `scale(${(1.08 - 0.08 * enter) * push})`, filter: `blur(${(1 - enter) * 10}px)` }}>
      <Sfx at={0} name="whoosh" volume={0.22} />
      {children}
    </AbsoluteFill>
  );
}

export interface IntroProps {
  voice?: boolean;
  variant?: Variant;
  pacing?: Cut["pacing"];
  sfx?: Cut["sfx"];
  /** v3: one music stem per mood, switched at scene boundaries */
  music?: boolean;
  /** v4+: one continuous track scored to this cut (public/music/<score>.mp3, from sound/generate.py score) */
  score?: string;
  sounds?: Cut["sounds"];
  fx?: boolean;
  sfxGain?: number;
}

/** v5: instead of a hit, a chord swells backwards into "did not exist" and lands on a soft low thud. */
function TwistSwell({ at }: { at: number }) {
  const { sfxGain } = useCut();
  return (
    <>
      <Sequence from={Math.max(0, at - 36)} layout="none">
        <Audio src={staticFile("sfx/swell.mp3")} volume={0.45 * sfxGain} />
      </Sequence>
      <Sequence from={at} layout="none">
        <Audio src={staticFile("sfx/thud.mp3")} volume={0.6 * sfxGain} />
      </Sequence>
    </>
  );
}

export function Intro({
  voice = false,
  variant = "default",
  pacing = "calm",
  sfx = "none",
  music = false,
  score,
  sounds = "v3",
  fx = true,
  sfxGain = 1,
}: IntroProps) {
  const scenes = sequence(variant, pacing);
  const twist = scenes.find((s) => s.id.startsWith("twist"));
  return (
    <CutContext.Provider value={{ pacing, sfx, sounds, fx, sfxGain }}>
      <AbsoluteFill style={{ fontFamily: SANS, background: C.ink }}>
        {scenes.map((s) => {
          const View = VIEWS[s.id];
          return (
            <Sequence key={s.id} from={s.from} durationInFrames={s.frames}>
              <SceneFrame frames={s.frames}>
                <View />
              </SceneFrame>
              {voice &&
                s.lines.map((l) => (
                  <Sequence key={l.id} from={l.from} layout="none">
                    <Audio src={staticFile(`${voFolder(pacing)}/${l.id}.mp3`)} />
                  </Sequence>
                ))}
            </Sequence>
          );
        })}
        {music && <Music scenes={scenes} dynamic={pacing === "dynamic"} />}
        {score && <Audio src={staticFile(`music/${score}.mp3`)} volume={sounds === "v5" ? 0.17 : pacing === "dynamic" ? 0.17 : 0.14} />}
        {sounds === "v5" && sfx !== "none" && twist && <TwistSwell at={twist.from + twist.lines[0].from} />}
      </AbsoluteFill>
    </CutContext.Provider>
  );
}
