// v8 look: the problem half of the story is cut like a documentary meme edit — real photos and stock footage,
// hard cuts on the words, bold captions and meme sounds — before the clean product diagrams take over.
// Media comes from media/fetch.py (public/v8/, credits in media/CREDITS.md).
// The v10 look reuses these scenes with a few swaps (useV10): the sad hook photo is an edit of the happy one
// (media/sad-edit.py), every shot gets its own clip, and fewer, story-led sound effects.
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import script from "../voiceover/script.json";
import { Heart } from "./components/Icons";
import { useCut, useScene } from "./cut";
import { C, pop } from "./theme";
import { type Pacing, scene as sceneOf } from "./timeline";
import { fmt, grow } from "./util";

const YELLOW = "#FFD60A";
const media = (name: string) => staticFile(`v8/${name}`);

/** Frame (relative to its scene) at which `phrase` is spoken, estimated from its position in the line's text. */
function wordAt(sceneId: string, lineIdx: number, phrase: string, pacing: Pacing): number {
  const line = sceneOf(sceneId, pacing).lines[lineIdx];
  const text = script.scenes.find((s) => s.id === sceneId)?.lines[lineIdx]?.text ?? "";
  const i = Math.max(0, text.indexOf(phrase));
  return line.from + Math.round((line.frames * i) / Math.max(1, text.length));
}

const useV10 = () => useCut().look === "v10";

function useWordAt(sceneId: string, lineIdx: number, phrase: string): number {
  return wordAt(sceneId, lineIdx, phrase, useCut().pacing);
}

type Grade = "warm" | "doc" | "sad" | "dark" | "none";
const GRADES: Record<Grade, string> = {
  none: "none",
  warm: "contrast(1.05) saturate(1.15)",
  doc: "contrast(1.12) saturate(0.75) brightness(0.72)",
  sad: "grayscale(0.9) contrast(1.15) brightness(0.75)",
  dark: "contrast(1.1) saturate(0.6) brightness(0.45)",
};

/** A photo filling the frame with a slow push-in (Ken Burns). */
function Still({ src, from = 1, to = 1.1, position = "50% 50%", grade = "doc", frames }: { src: string; from?: number; to?: number; position?: string; grade?: Grade; frames: number }) {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, frames], [from, to], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <Img src={media(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: position, transform: `scale(${s})`, filter: GRADES[grade] }} />
      {grade === "sad" && <AbsoluteFill style={{ background: "rgba(25,55,120,0.35)", mixBlendMode: "multiply" }} />}
    </AbsoluteFill>
  );
}

/** A small photo shown sharp over a blurred, enlarged copy of itself (for low-resolution or portrait photos). */
function Portrait({ src, grade, frames, from = 1, to = 1.08 }: { src: string; grade: Grade; frames: number; from?: number; to?: number }) {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, frames], [from, to], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <Img src={media(src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `${GRADES[grade]} blur(40px)`, transform: "scale(1.2)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${s})` }}>
        <Img src={media(src)} style={{ height: "100%", filter: GRADES[grade], boxShadow: "0 0 80px rgba(0,0,0,0.6)" }} />
      </AbsoluteFill>
      {grade === "sad" && <AbsoluteFill style={{ background: "rgba(25,55,120,0.35)", mixBlendMode: "multiply" }} />}
    </AbsoluteFill>
  );
}

/** Stock footage filling the frame (muted; the cut has its own sound). */
function Footage({ src, grade = "doc", startFrom = 0, rate = 1, blur = 0 }: { src: string; grade?: Grade; startFrom?: number; rate?: number; blur?: number }) {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo
        src={media(src)}
        muted
        trimBefore={startFrom}
        playbackRate={rate}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: `${GRADES[grade]}${blur ? ` blur(${blur}px)` : ""}` }}
      />
    </AbsoluteFill>
  );
}

/** Shot: a piece of a scene between two frames (hard cut in, hard cut out). */
function Shot({ from, to, children }: { from: number; to: number; children: React.ReactNode }) {
  if (to <= from) return null;
  return (
    <Sequence from={from} durationInFrames={to - from} layout="none">
      <AbsoluteFill>{children}</AbsoluteFill>
    </Sequence>
  );
}

const CAPTION: React.CSSProperties = {
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#fff",
  letterSpacing: -1,
  lineHeight: 1.02,
  WebkitTextStroke: "14px #000",
  paintOrder: "stroke fill",
  textShadow: "0 10px 30px rgba(0,0,0,0.5)",
};

/** Bold meme-documentary caption that punches in at frame `at`. */
function Cap({
  at,
  children,
  size = 96,
  x = 120,
  y,
  bottom,
  center = false,
}: {
  at: number;
  children: React.ReactNode;
  size?: number;
  x?: number;
  y?: number;
  bottom?: number;
  center?: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = pop(frame, fps, at);
  return (
    <div
      style={{
        position: "absolute",
        left: center ? 0 : x,
        right: center ? 0 : undefined,
        top: y,
        bottom,
        textAlign: center ? "center" : "left",
        fontSize: size,
        ...CAPTION,
        transform: `scale(${1.25 - 0.25 * s})`,
        transformOrigin: center ? "center" : "left center",
      }}
    >
      {children}
    </div>
  );
}

const Y = ({ children }: { children: React.ReactNode }) => <span style={{ color: YELLOW }}>{children}</span>;
const R = ({ children }: { children: React.ReactNode }) => <span style={{ color: "#FF5A4E" }}>{children}</span>;

function Tag({ at, children, x = 120, y = 110 }: { at: number; children: React.ReactNode; x?: number; y?: number }) {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, background: YELLOW, color: "#000", fontWeight: 700, fontSize: 34, padding: "8px 20px", letterSpacing: 2, textTransform: "uppercase" }}>
      {children}
    </div>
  );
}

function Source({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "absolute", right: 60, bottom: 36, fontSize: 22, color: "rgba(255,255,255,0.75)", textShadow: "0 2px 6px #000" }}>{children}</div>;
}

export function Hook8() {
  const v10 = useV10();
  const { frames } = useScene("hook");
  const robert = useWordAt("hook", 0, "Robert");
  const scammed = useWordAt("hook", 0, "got scammed");
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Shot from={0} to={scammed}>
        <Still src="rl-happy.jpg" grade="warm" position="50% 30%" from={1.02} to={1.12} frames={scammed} />
        <Tag at={4}>2017</Tag>
        <Cap at={robert} bottom={110} size={120}>
          Robert Lewandowski
        </Cap>
      </Shot>
      <Shot from={scammed} to={frames}>
        {v10 ? (
          // same photo, same framing: the zoom carries on from the happy shot
          <Still src="rl-happy-sad.jpg" grade="none" position="50% 30%" from={1.12} to={1.2} frames={frames - scammed} />
        ) : (
          <Portrait src="rl-sad.jpg" grade="sad" frames={frames - scammed} from={1.12} to={1.22} />
        )}
        <Cap at={0} bottom={110} size={150} center>
          got <R>scammed.</R>
        </Cap>
      </Shot>
    </AbsoluteFill>
  );
}

function DonationToast({ at }: { at: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = pop(frame, fps, at);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 90,
        width: 1180,
        marginLeft: -590,
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "28px 36px",
        borderRadius: 32,
        background: "rgba(255,255,255,0.96)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        transform: `translateY(${(1 - s) * -160}px)`,
      }}
    >
      <div style={{ width: 84, height: 84, borderRadius: 20, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <Heart size={48} color="#fff" stroke={2.6} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>New donation · „Boję się ciemności”</div>
        <div style={{ fontSize: 40, color: C.ink, fontWeight: 700 }}>Anna &amp; Robert Lewandowski</div>
      </div>
      <div style={{ fontSize: 48, color: C.accent, fontWeight: 700, whiteSpace: "nowrap" }}>+100 000 zł</div>
    </div>
  );
}

function FundraiserCard8({ at }: { at: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, at);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 150,
        width: 820,
        marginLeft: -410,
        background: "#fff",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        opacity: Math.min(1, s * 2),
        transform: `scale(${0.85 + 0.15 * s}) rotate(${(1 - s) * -4}deg)`,
      }}
    >
      <div style={{ padding: "40px 48px" }}>
        <div style={{ fontSize: 24, fontWeight: 600, color: C.muted, letterSpacing: 1 }}>ONLINE FUNDRAISER</div>
        <div style={{ fontSize: 58, fontWeight: 700, color: C.ink, letterSpacing: -1, marginTop: 6 }}>„Boję się ciemności”</div>
        <div style={{ fontSize: 30, color: C.muted }}>“I'm afraid of the dark”</div>
        <div style={{ display: "flex", gap: 14, marginTop: 26 }}>
          <span style={{ background: C.ground, border: `2px solid ${C.line}`, borderRadius: 999, padding: "8px 22px", fontSize: 28, fontWeight: 600, color: C.ink }}>Antoś, 2 years old</span>
          <span style={{ background: C.warnSoft, color: C.warn, borderRadius: 999, padding: "8px 22px", fontSize: 28, fontWeight: 600 }}>eye cancer</span>
        </div>
        <div style={{ height: 18, background: C.track, borderRadius: 9, marginTop: 34, overflow: "hidden" }}>
          <div style={{ width: `${grow(frame, at, 120, 0.8) * 100}%`, height: "100%", background: C.accent }} />
        </div>
      </div>
    </div>
  );
}

export function Story8() {
  const frame = useCurrentFrame();
  const v10 = useV10();
  const id = "storyL";
  const { frames, lines } = useScene(id);
  const hundred = useWordAt(id, 0, "a hundred thousand");
  const antosh = useWordAt(id, 0, "Antosh");
  const people = useWordAt(id, 1, "six thousand");
  const total = useWordAt(id, 1, "Half a million");
  const crowdAt = lines[1].from - 4;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Shot from={0} to={antosh - 4}>
        <Footage src="phone.mp4" grade="doc" />
        <DonationToast at={hundred - 4} />
      </Shot>
      <Shot from={antosh - 4} to={crowdAt}>
        {v10 ? <Footage src="laptop-buy.mp4" grade="dark" blur={10} /> : <Footage src="phone.mp4" grade="dark" startFrom={90} blur={12} />}
        <FundraiserCard8 at={0} />
        <Cap at={10} bottom={90} size={78} center>
          to save a <Y>2-year-old</Y>'s sight
        </Cap>
      </Shot>
      <Shot from={crowdAt} to={frames}>
        <Footage src="crowd.mp4" grade="doc" />
        <Cap at={people - crowdAt} y={250} size={170} center>
          {fmt(Math.round(grow(frame - crowdAt, people - crowdAt, 30, 650)) * 10)}+ <span style={{ fontSize: 80 }}>people</span>
        </Cap>
        <Cap at={total - crowdAt} y={520} size={170} center>
          <Y>{fmt(Math.round(grow(frame - crowdAt, total - crowdAt, 30, 500)) * 1000)} zł</Y>
        </Cap>
      </Shot>
    </AbsoluteFill>
  );
}

function Banner({ color, title, text }: { color: string; title: string; text: string }) {
  return (
    <div style={{ position: "absolute", left: 40, right: 40, bottom: 60, background: color, padding: "22px 30px", color: "#fff" }}>
      <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, textTransform: "uppercase" }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 600, marginTop: 8 }}>{text}</div>
    </div>
  );
}

export function Twist8() {
  const frame = useCurrentFrame();
  const id = "twistL";
  const { frames, lines } = useScene(id);
  const [b0, b1, b2] = lines.map((l) => l.from);
  const spent = useWordAt(id, 1, "spent");
  const others = useWordAt(id, 2, "Thousands");
  const zoom = interpolate(frame, [0, b1], [1, 1.12], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Shot from={0} to={b1 - 2}>
        <AbsoluteFill style={{ background: "#000", alignItems: "center", justifyContent: "center", transform: `scale(${zoom})` }}>
          <Cap at={b0 + 2} y={330} size={170} center>
            Antoś
          </Cap>
          <Cap at={b0 + 16} y={530} size={130} center>
            <R>never existed.</R>
          </Cap>
        </AbsoluteFill>
      </Shot>
      <Shot from={b1 - 2} to={spent - 2}>
        <Footage src="cash-falling.mp4" grade="doc" />
        <Cap at={2} bottom={110} size={104} center>
          the organizer <Y>made him up</Y>
        </Cap>
      </Shot>
      <Shot from={spent - 2} to={b2 - 2}>
        <Footage src="cash-flip.mp4" grade="warm" />
        <Cap at={2} bottom={170} size={104} center>
          and spent it <Y>on himself</Y>
        </Cap>
        <Cap at={30} bottom={90} size={44} center>
          (later: 6 years in prison)
        </Cap>
      </Shot>
      <Shot from={b2 - 2} to={frames}>
        <AbsoluteFill style={{ flexDirection: "row" }}>
          <div style={{ position: "relative", width: "50%", height: "100%", overflow: "hidden" }}>
            <Img src={media("rl-happy.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "40% 30%", filter: GRADES.warm }} />
            <Banner color={C.accent} title="Refunded ✓" text="the Lewandowskis" />
          </div>
          <div style={{ position: "relative", width: "50%", height: "100%", overflow: "hidden", borderLeft: "8px solid #000" }}>
            {frame >= b2 - 2 + (others - b2) && (
              <>
                <OffthreadVideo src={media("empty-wallet.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: GRADES.doc }} />
                <Banner color={C.error} title="6 500+ others" text="got nothing back" />
              </>
            )}
          </div>
        </AbsoluteFill>
      </Shot>
    </AbsoluteFill>
  );
}

export function Scale8() {
  const frame = useCurrentFrame();
  const v10 = useV10();
  const id = "scale";
  const { frames, lines } = useScene(id);
  const floods = useWordAt(id, 0, "Floods");
  const wars = useWordAt(id, 0, "wars");
  const shelters = useWordAt(id, 0, "animal shelters");
  const faked = useWordAt(id, 0, "any good cause");
  const fifty = useWordAt(id, 1, "a hundred and fifty");
  const ninetySix = useWordAt(id, 2, "ninety-six");
  const [, l1, l2, l3] = lines.map((l) => l.from);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Shot from={0} to={floods}>
        {v10 ? <Footage src="rain-window.mp4" grade="doc" /> : <Footage src="hacker.mp4" grade="doc" />}
        <Cap at={4} bottom={110} size={110} center>
          it's not only <Y>medical</Y>
        </Cap>
      </Shot>
      <Shot from={floods} to={wars}>
        <Still src="flood-2.jpg" frames={wars - floods} from={1.05} to={1.12} grade="doc" />
        <Cap at={0} bottom={110} size={150} center>
          floods
        </Cap>
      </Shot>
      <Shot from={wars} to={shelters}>
        <Still src="war.jpg" frames={shelters - wars} from={1.05} to={1.12} grade="doc" />
        <Cap at={0} bottom={110} size={150} center>
          wars
        </Cap>
      </Shot>
      <Shot from={shelters} to={faked}>
        <Still src="shelter.jpg" frames={faked - shelters} from={1.05} to={1.12} position="60% 60%" grade="doc" />
        <Cap at={0} bottom={110} size={150} center>
          animal shelters
        </Cap>
      </Shot>
      <Shot from={faked} to={l1 - 2}>
        <Footage src="hacker.mp4" grade="doc" startFrom={60} />
        <Cap at={0} bottom={110} size={104} center>
          any good cause can be <R>faked</R>
        </Cap>
      </Shot>
      <Shot from={l1 - 2} to={l2 - 2}>
        <Still src="police-flood.jpg" frames={l2 - l1} from={1.02} to={1.14} position="40% 50%" grade="doc" />
        <Tag at={2}>Poland · 2024 floods</Tag>
        <Cap at={fifty - l1 + 2} y={300} size={260} center>
          <R>150</R>
        </Cap>
        <Cap at={fifty - l1 + 10} y={580} size={90} center>
          fake fundraisers for victims
        </Cap>
        <Source>Source: Polish police cybercrime bureau (CBZC), 2024 · Photo: Tabrus, CC0</Source>
      </Shot>
      <Shot from={l2 - 2} to={l3 - 2}>
        {v10 ? (
          <Footage src="cash-count.mp4" grade="doc" />
        ) : (
          <Footage src={frame < ninetySix ? "cash-flip.mp4" : "cash-falling.mp4"} grade="doc" startFrom={frame < ninetySix ? 120 : 60} />
        )}
        <Tag at={2}>USA · 2024</Tag>
        <Cap at={ninetySix - l2 + 2} y={300} size={200} center>
          <R>$96 000 000</R>
        </Cap>
        <Cap at={ninetySix - l2 + 12} y={540} size={84} center>
          lost to fake charities
          <br />
          &amp; fundraisers
        </Cap>
        <Source>Source: FBI Internet Crime Complaint Center (IC3), Jan 2025</Source>
      </Shot>
      <Shot from={l3 - 2} to={frames}>
        {v10 ? <Footage src="screens.mp4" grade="dark" /> : <Footage src="hacker.mp4" grade="dark" startFrom={150} />}
        <Cap at={4} y={340} size={110} center>
          and that's <Y>only</Y>
          <br />
          what was reported
        </Cap>
      </Shot>
    </AbsoluteFill>
  );
}

/** Sounds that cross scene boundaries live here, placed on the whole cut's timeline. */
export function V8Audio({ scenes }: { scenes: { id: string; from: number; frames: number }[] }) {
  const { pacing, look } = useCut();
  const at = (id: string) => scenes.find((s) => s.id === id)?.from ?? 0;
  const hit = (key: string, frame: number, file: string, volume: number | ((f: number) => number)) => (
    <Sequence key={key} from={Math.max(0, Math.round(frame))} layout="none">
      <Audio src={media(`${file}.norm.mp3`)} volume={volume} />
    </Sequence>
  );
  const scammed = at("hook") + wordAt("hook", 0, "got scammed", pacing);
  const hundred = at("storyL") + wordAt("storyL", 0, "a hundred thousand", pacing);
  const total = at("storyL") + wordAt("storyL", 1, "Half a million", pacing);
  const twist = at("twistL");
  const spentLine = sceneOf("twistL", pacing).lines[2].from;
  const fifty = at("scale") + wordAt("scale", 1, "a hundred and fifty", pacing);
  const policeShot = at("scale") + sceneOf("scale", pacing).lines[1].from;
  const ninetySix = at("scale") + wordAt("scale", 2, "ninety-six", pacing);
  if (look === "v10") {
    // fewer "drama" hits: one dun-dun-dun on the twist, one boom on the biggest number;
    // the refund split screen gets a happy / a losing sound
    const refunded = twist + spentLine;
    const others = twist + wordAt("twistL", 2, "Thousands", pacing);
    return (
      <>
        {hit("scratch", scammed - 3, "record-scratch", 0.5)}
        {hit("violin", scammed + 2, "sad-violin", (f) => 0.4 * interpolate(f, [0, 90, 150], [1, 1, 0], { extrapolateRight: "clamp" }))}
        {hit("kaching", hundred, "ka-ching", 0.35)}
        {hit("dun", twist + 3, "dun-dun-dun", 0.4)}
        {hit("bruh", twist + wordAt("twistL", 1, "on himself", pacing) + 20, "bruh", 0.35)}
        {hit("yay", refunded, "kids-yay", (f) => 0.3 * interpolate(f, [0, others - refunded - 4, others - refunded + 8], [1, 1, 0], { extrapolateRight: "clamp" }))}
        {hit("trombone", others, "sad-trombone", 0.35)}
        {hit("boom-96", ninetySix + 2, "vine-boom", 0.35)}
      </>
    );
  }
  return (
    <>
      {hit("scratch", scammed - 3, "record-scratch", 0.5)}
      {hit("violin", scammed + 2, "sad-violin", (f) => 0.4 * interpolate(f, [0, 90, 150], [1, 1, 0], { extrapolateRight: "clamp" }))}
      {hit("kaching", hundred, "ka-ching", 0.4)}
      {hit("boom-total", total + 2, "vine-boom", 0.35)}
      {hit("dun", twist + 3, "dun-dun-dun", 0.45)}
      {hit("bruh", twist + spentLine - 8, "bruh", 0.4)}
      {hit("siren", policeShot, "police-siren", 0.2)}
      {hit("boom-150", fifty + 2, "vine-boom", 0.4)}
      {hit("boom-96", ninetySix + 2, "vine-boom", 0.4)}
    </>
  );
}

/** Music level multiplier: the score steps back under the sad violin and the twist. */
export function v8MusicDuck(scenes: { id: string; from: number }[], pacing: Pacing): (frame: number) => number {
  const at = (id: string) => scenes.find((s) => s.id === id)?.from ?? 0;
  const scammed = at("hook") + wordAt("hook", 0, "got scammed", pacing);
  const twist = at("twistL");
  return (f) =>
    Math.min(
      interpolate(f, [scammed - 4, scammed, scammed + 130, scammed + 170], [1, 0.25, 0.25, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      interpolate(f, [twist - 4, twist, twist + 70, twist + 100], [1, 0.2, 0.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    );
}
