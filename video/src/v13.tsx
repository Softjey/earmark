// v13: the "With Earmark" scene as real app footage. The screenshots in public/app/ are of the running app and Solana
// Explorer showing real devnet transactions made by scripts/video-state.ts (no mock data).
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Sfx, useScene } from "./cut";
import { Cap, R, useWordAt, Y } from "./v8";

const BG = "radial-gradient(ellipse at center, #1B2B26 0%, #0B1411 75%)";

/** A full-page screenshot that slowly zooms into one point of interest. */
function Page({ src, frames, focus, zoom, pan = [0, 0] }: { src: string; frames: number; focus: [number, number]; zoom: [number, number]; pan?: [number, number] }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, frames], [0, 1], { extrapolateRight: "clamp" });
  const z = zoom[0] + (zoom[1] - zoom[0]) * t;
  const y = pan[0] + (pan[1] - pan[0]) * t;
  return (
    <AbsoluteFill style={{ background: "#F4F6F4", overflow: "hidden" }}>
      <Img
        src={staticFile(`app/${src}`)}
        style={{ width: 1920, position: "absolute", top: 0, left: 0, transformOrigin: `${focus[0]}px ${focus[1]}px`, transform: `translateY(${-y}px) scale(${z})` }}
      />
      {/* dark band behind the caption */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 62%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
}

/** A cropped detail (explorer logs, token balances) floating on a dark background. */
function Detail({ src, frames, width, glow }: { src: string; frames: number; width: number; glow: string }) {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, frames], [1, 1.06], { extrapolateRight: "clamp" });
  const enter = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center", paddingBottom: 140 }}>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3, color: "#9FB3AC", marginBottom: 22, opacity: enter }}>SOLANA EXPLORER · DEVNET</div>
      <Img
        src={staticFile(`app/${src}`)}
        style={{ width, borderRadius: 18, boxShadow: `0 0 0 3px ${glow}, 0 30px 90px rgba(0,0,0,0.6), 0 0 120px ${glow}55`, transform: `scale(${z * (0.94 + 0.06 * enter)})`, opacity: enter }}
      />
    </AbsoluteFill>
  );
}

function Shot({ from, to, children }: { from: number; to: number; children: (frames: number) => React.ReactNode }) {
  if (to <= from) return null;
  return (
    <Sequence from={from} durationInFrames={to - from} layout="none">
      <AbsoluteFill>{children(to - from)}</AbsoluteFill>
    </Sequence>
  );
}

export function AppShots() {
  const id = "earmarkB";
  const { frames, lines } = useScene(id);
  const notOrganizer = useWordAt(id, 0, "Not the organizer");
  const straight = useWordAt(id, 2, "goes straight");
  const everyDonor = useWordAt(id, 3, "every donor");
  const [, l1, l2, l3] = lines.map((l) => l.from);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Shot from={0} to={notOrganizer - 4}>
        {(f) => (
          <>
            <Page src="01-a-pending.png" frames={f} focus={[960, 300]} zoom={[1.0, 1.12]} />
            <Cap at={8} bottom={90} size={88} center>
              live on <Y>Solana devnet</Y>
            </Cap>
          </>
        )}
      </Shot>
      <Shot from={notOrganizer - 4} to={l1}>
        {(f) => (
          <>
            <Detail src="02b-reject-logs.png" frames={f} width={1500} glow="#FF5A4E" />
            <Sfx at={4} name="error" volume={0.35} beat />
            <Cap at={6} bottom={80} size={84} center>
              organizer's own wallet → <R>rejected</R>
            </Cap>
          </>
        )}
      </Shot>
      <Shot from={l1} to={l2}>
        {(f) => (
          <>
            <Page src="03-a-active.png" frames={f} focus={[770, 520]} zoom={[1.05, 1.3]} />
            <Cap at={8} bottom={90} size={88} center>
              recipient <Y>confirmed</Y> on-chain
            </Cap>
          </>
        )}
      </Shot>
      <Shot from={l2} to={straight - 2}>
        {(f) => (
          <>
            <Page src="05-a-paid.png" frames={f} focus={[1345, 260]} zoom={[1.1, 1.55]} />
            <Cap at={4} bottom={90} size={88} center>
              target hit → <Y>paid automatically</Y>
            </Cap>
          </>
        )}
      </Shot>
      <Shot from={straight - 2} to={l3}>
        {(f) => (
          <>
            <Detail src="06b-payout-tokens.png" frames={f} width={1400} glow="#3FBF8F" />
            <Sfx at={2} name="coin" volume={0.35} beat />
            <Cap at={4} bottom={80} size={84} center>
              vault 0 · clinic <Y>+1 000</Y>
            </Cap>
          </>
        )}
      </Shot>
      <Shot from={l3} to={everyDonor - 2}>
        {(f) => (
          <>
            <Page src="07-b-refundable.png" frames={f} focus={[480, 160]} zoom={[1.1, 1.35]} />
            <Cap at={4} bottom={90} size={88} center>
              target missed
            </Cap>
          </>
        )}
      </Shot>
      <Shot from={everyDonor - 2} to={frames}>
        {(f) => (
          <>
            <Page src="08-b-refunded.png" frames={f} focus={[380, 1080]} zoom={[1.0, 1.25]} pan={[200, 440]} />
            <Cap at={4} bottom={90} size={88} center>
              every donor <Y>refunded</Y>
            </Cap>
          </>
        )}
      </Shot>
    </AbsoluteFill>
  );
}
