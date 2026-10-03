import { createContext, useContext } from "react";
import { Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { type Pacing, scene, type Scene } from "./timeline";

/**
 * How an intro is cut: its pacing and how much sound design it carries.
 * sfx: "none" (voice only), "key" (only the story beats: stamp, twist, blocked transfer, payout, logo), "full" (every element).
 */
export type Cut = {
  pacing: Pacing;
  sfx: "none" | "key" | "full";
  sounds: "v3" | "v4" | "v5";
  /** dynamic cut only: punch-in transitions, camera shake and a whoosh per scene (v3/v4); v5 drops them */
  fx: boolean;
  /** overall level of the effects; v5 plays them at half volume */
  sfxGain: number;
  /** "v7": the more animated scenes from v7.tsx, a slow camera push on every scene, film grain */
  look: "classic" | "v7";
};

export const CutContext = createContext<Cut>({ pacing: "calm", sfx: "none", sounds: "v3", fx: true, sfxGain: 1, look: "classic" });

// v4 swapped the bell-like effects for soft mallets; v5 also replaces the twist impact (see TwistSwell)
const SOUND_FILES: Record<Cut["sounds"], Partial<Record<SfxName, string | null>>> = {
  v3: {},
  v4: { chime: "confirm", coin: "pay", doubt: "uhoh" },
  v5: { chime: "confirm", coin: "pay", doubt: "uhoh", impact: null },
};

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
  const { sfx, pacing, sounds, fx, sfxGain } = useCut();
  if (sfx === "none" || (sfx === "key" && !beat)) return null;
  const file = name in SOUND_FILES[sounds] ? SOUND_FILES[sounds][name] : name;
  if (!file) return null;
  // the v3/v4 dynamic cut stacks drums and more effects, so each effect sits a little lower to avoid clipping
  const gain = (pacing === "dynamic" && fx ? 0.8 : 1) * sfxGain;
  return (
    <Sequence from={Math.max(0, Math.round(at))} layout="none">
      <Audio src={staticFile(`sfx/${file}.mp3`)} volume={volume * gain} />
    </Sequence>
  );
}

/** Decaying camera shake that starts at frame `at` (dynamic cut only). */
export function useShake(at: number, strength = 14): string {
  const frame = useCurrentFrame();
  const { pacing, fx } = useCut();
  if (pacing !== "dynamic" || !fx || frame < at || frame > at + 14) return "none";
  const k = interpolate(frame, [at, at + 14], [1, 0]);
  const dx = Math.sin((frame - at) * 2.7) * strength * k;
  const dy = Math.cos((frame - at) * 3.3) * strength * 0.6 * k;
  return `translate(${dx}px, ${dy}px)`;
}
