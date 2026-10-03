import script from "../voiceover/script.json";
import durations from "./vo-durations.json";
import { FPS } from "./theme";

// Scene lengths follow the generated voice-over (voiceover/generate.py writes vo-durations.json).
const LEAD = 10; // frames before a scene's first line
const GAP = 8; // frames between lines
const TAIL: Record<string, number> = {
  hook: 24,
  story: 18,
  storyL: 18,
  twist: 30,
  twistL: 30,
  scale: 40,
  today: 24,
  question: 20,
  earmark: 45,
  title: 60,
};

export type Line = { id: string; from: number; frames: number };
export type Scene = { id: string; frames: number; lines: Line[] };
export type Variant = keyof typeof script.variants;

const dur = durations as Record<string, number>;

const SCENES: Record<string, Scene> = {};
for (const s of script.scenes) {
  let t = LEAD;
  const lines = s.lines.map((l) => {
    const frames = Math.ceil(dur[l.id] * FPS);
    const line = { id: l.id, from: t, frames };
    t += frames + GAP;
    return line;
  });
  SCENES[s.id] = { id: s.id, frames: t - GAP + (TAIL[s.id] ?? 20), lines };
}

/** The scenes of one intro variant, each with its start frame. */
export function sequence(variant: Variant): (Scene & { from: number })[] {
  let at = 0;
  return script.variants[variant].map((id) => {
    const s = { ...scene(id), from: at };
    at += s.frames;
    return s;
  });
}

export function introFrames(variant: Variant): number {
  return sequence(variant).reduce((sum, s) => sum + s.frames, 0);
}

export function scene(id: string): Scene {
  const s = SCENES[id];
  if (!s) throw new Error(`unknown scene ${id}`);
  return s;
}

/** Start frame (relative to its scene) of each voice-over line. */
export function beats(id: string): number[] {
  return scene(id).lines.map((l) => l.from);
}
