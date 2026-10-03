import { createContext, useContext } from "react";
import { Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { type Pacing, scene, type Scene } from "./timeline";

/**
 * How an intro is cut: its pacing and how much sound design it carries.
 * sfx: "none" (voice only), "key" (only the story beats: stamp, twist, blocked transfer, payout, logo), "full" (every element).
 */
export type Cut = { pacing: Pacing; sfx: "none" | "key" | "full"; sounds: "v3" | "v4" };

export const CutContext = createContext<Cut>({ pacing: "calm", sfx: "none", sounds: "v3" });

// v4 swapped the bell-like effects for soft mallets
const V4_SOUNDS: Partial<Record<SfxName, string>> = { chime: "confirm", coin: "pay", doubt: "uhoh" };

export const useCut = () => useContext(CutContext);
export const useDynamic = () => useCut().pacing === "dynamic";

export function useScene(id: string): Scene {
  return scene(id, useCut().pacing);
}

/** Start frame (relative to its scene) of each voice-over line. */
export function useBeats(id: string): number[] {
  return useScene(id).lines.map((l) => l.from);
}

export type SfxName = "whoosh" | "impact" | "stamp" | "counter" | "pop" | "coin" | "chime" | "error" | "doubt" | "refund";

/** A sound effect at frame `at` of the current scene. `beat` effects play in both cuts, the rest only in "full". */
export function Sfx({ at, name, volume = 0.5, beat = false }: { at: number; name: SfxName; volume?: number; beat?: boolean }) {
  const { sfx, pacing, sounds } = useCut();
  if (sfx === "none" || (sfx === "key" && !beat)) return null;
  // the dynamic cut stacks drums and more effects, so each effect sits a little lower to avoid clipping
  const gain = pacing === "dynamic" ? 0.8 : 1;
  return (
    <Sequence from={Math.max(0, Math.round(at))} layout="none">
      <Audio src={staticFile(`sfx/${(sounds === "v4" && V4_SOUNDS[name]) || name}.mp3`)} volume={volume * gain} />
    </Sequence>
  );
}

/** Decaying camera shake that starts at frame `at` (dynamic cut only). */
export function useShake(at: number, strength = 14): string {
  const frame = useCurrentFrame();
  const dynamic = useDynamic();
  if (!dynamic || frame < at || frame > at + 14) return "none";
  const k = interpolate(frame, [at, at + 14], [1, 0]);
  const dx = Math.sin((frame - at) * 2.7) * strength * k;
  const dy = Math.cos((frame - at) * 3.3) * strength * 0.6 * k;
  return `translate(${dx}px, ${dy}px)`;
}
