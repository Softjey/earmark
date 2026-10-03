import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Kicker } from "./components/Caption";
import { Flow } from "./components/Flow";
import { Building, Check, Clinic, Cross, Lock, LogoMark, People, Person } from "./components/Icons";
import { Node } from "./components/Node";
import { C, fadeOut, fadeUp, MONO, pop, SANS } from "./theme";

// Scene lengths in frames (30 fps).
const STORY = 150;
const TWIST = 90;
const TODAY = 270;
const EARMARK = 330;
const TITLE = 90;
export const INTRO_FRAMES = STORY + TWIST + TODAY + EARMARK + TITLE;

const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");

function Story() {
  const frame = useCurrentFrame();
  const raised = interpolate(frame, [30, 95], [0, 500000], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const people = interpolate(frame, [30, 95], [0, 6500], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ background: C.ink, color: "#fff", padding: "0 160px", justifyContent: "center", opacity: fadeOut(frame, STORY - 10, 10) }}>
      <div style={{ fontSize: 34, fontWeight: 600, color: "#9FB3AC", letterSpacing: 4, ...fadeUp(frame, 0) }}>POLAND, 2017</div>
      <div style={{ display: "flex", gap: 80, marginTop: 28, ...fadeUp(frame, 15) }}>
        <div>
          <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -3, fontVariantNumeric: "tabular-nums" }}>{fmt(Math.round(people / 10) * 10)}</div>
          <div style={{ fontSize: 34, color: "#B9C3BF" }}>people donated</div>
        </div>
        <div>
          <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -3, fontVariantNumeric: "tabular-nums" }}>
            {fmt(Math.round(raised / 1000) * 1000)} zł
          </div>
          <div style={{ fontSize: 34, color: "#B9C3BF" }}>raised on a crowdfunding platform</div>
        </div>
      </div>
      <div style={{ fontSize: 52, fontWeight: 500, marginTop: 64, ...fadeUp(frame, 75) }}>
        to save the sight of a boy named Antoś.
      </div>
    </AbsoluteFill>
  );
}

function Twist() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.ink, alignItems: "center", justifyContent: "center", opacity: fadeOut(frame, TWIST - 10, 10) }}>
      <div style={{ fontSize: 110, fontWeight: 700, color: "#fff", letterSpacing: -2.5, ...fadeUp(frame, 6, 0) }}>
        Antoś did not exist.
      </div>
    </AbsoluteFill>
  );
}

const ROW = 500;

function Today() {
  const frame = useCurrentFrame();
  const scammed = frame >= 150;
  return (
    <AbsoluteFill style={{ background: C.ground, opacity: fadeOut(frame, TODAY - 10, 10) }}>
      <Kicker>Today</Kicker>
      <Flow from={{ x: 575, y: ROW }} to={{ x: 785, y: ROW }} start={50} color={C.muted} />
      <Flow from={{ x: 1135, y: ROW }} to={{ x: 1345, y: ROW }} start={80} color={C.muted} />
      <Node x={400} y={ROW} title="Donors" sub="6 500 people" icon={(c) => <People size={44} color={c} />} start={5} />
      <Node x={960} y={ROW} title="Platform" sub="holds the money" icon={(c) => <Building size={44} color={c} />} start={18} />
      <Node
        x={1520}
        y={ROW}
        title="Organizer"
        sub={scammed ? "spent it on himself" : "gets paid out"}
        variant={scammed ? "danger" : "default"}
        icon={(c) => <Person size={44} color={c} />}
        start={31}
      />
      <Caption start={175}>The platform paid the organizer. Everything else was trust.</Caption>
    </AbsoluteFill>
  );
}

const VAULT = { x: 960, y: 460 };

function WithEarmark() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const blocked = pop(frame, fps, 145);
  return (
    <AbsoluteFill style={{ background: C.ground, opacity: fadeOut(frame, EARMARK - 10, 10) }}>
      <Kicker color={C.accent}>With Earmark</Kicker>
      <Flow from={{ x: 535, y: VAULT.y }} to={{ x: 775, y: VAULT.y }} start={40} color={C.accent} />
      <Flow from={{ x: 1145, y: VAULT.y }} to={{ x: 1385, y: VAULT.y }} start={65} color={C.accent} />
      {/* Organizer route: blocked half-way */}
      <Flow from={{ x: VAULT.x, y: VAULT.y + 85 }} to={{ x: VAULT.x, y: 735 }} start={120} duration={25} stopAt={0.55} color={C.error} coins={false} />
      {/* Refund route: arcs back to the donors */}
      <Flow from={{ x: 880, y: VAULT.y - 85 }} via={{ x: 650, y: 200 }} to={{ x: 430, y: VAULT.y - 98 }} start={165} duration={30} color={C.info} />

      <Node x={360} y={VAULT.y} title="Donors" icon={(c) => <People size={44} color={c} />} start={5} />
      <Node
        x={VAULT.x}
        y={VAULT.y}
        w={370}
        title="Vault"
        sub="program-owned, no private key"
        variant="vault"
        icon={(c) => <Lock size={44} color={c} />}
        start={15}
      />
      <Node x={1560} y={VAULT.y} title="Clinic" sub="verified recipient" variant="verified" icon={(c) => <Clinic size={44} color={c} />} start={25} />
      <Node x={VAULT.x} y={830} h={130} title="Organizer" sub="cannot be paid" variant="disabled" icon={(c) => <Person size={36} color={c} />} start={110} />

      {/* ✕ on the organizer route */}
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
          ...fadeUp(frame, 150, 10),
        }}
      >
        RecipientNotVerified
      </div>
      <div
        style={{
          position: "absolute",
          left: 470,
          top: 228,
          fontSize: 28,
          fontWeight: 600,
          color: C.info,
          ...fadeUp(frame, 190, 10),
        }}
      >
        or back to each donor
      </div>
      <div
        style={{
          position: "absolute",
          left: 1440,
          top: 560,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 26,
          fontWeight: 600,
          color: C.accent,
          ...fadeUp(frame, 95, 10),
        }}
      >
        <Check size={28} color={C.accent} stroke={3} /> paid when the target is hit
      </div>
      <Caption start={215}>
        Money can only go to a <span style={{ color: C.accent }}>verified clinic</span>, or{" "}
        <span style={{ color: C.info }}>back to the donors</span>.
      </Caption>
    </AbsoluteFill>
  );
}

function Title() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, 0);
  return (
    <AbsoluteFill style={{ background: C.ground, alignItems: "center", justifyContent: "center", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28, transform: `scale(${0.9 + 0.1 * s})`, opacity: s }}>
        <LogoMark size={120} stroke={2.4} />
        <div style={{ fontSize: 150, fontWeight: 700, color: C.ink, letterSpacing: -4 }}>Earmark</div>
      </div>
      <div style={{ fontSize: 44, fontWeight: 500, color: C.muted, ...fadeUp(frame, 14) }}>
        Medical fundraisers without an intermediary
      </div>
    </AbsoluteFill>
  );
}

export function Intro() {
  return (
    <AbsoluteFill style={{ fontFamily: SANS, background: C.ink }}>
      <Sequence durationInFrames={STORY}>
        <Story />
      </Sequence>
      <Sequence from={STORY} durationInFrames={TWIST}>
        <Twist />
      </Sequence>
      <Sequence from={STORY + TWIST} durationInFrames={TODAY}>
        <Today />
      </Sequence>
      <Sequence from={STORY + TWIST + TODAY} durationInFrames={EARMARK}>
        <WithEarmark />
      </Sequence>
      <Sequence from={STORY + TWIST + TODAY + EARMARK} durationInFrames={TITLE}>
        <Title />
      </Sequence>
    </AbsoluteFill>
  );
}
