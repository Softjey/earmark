import script from "../voiceover/script.json";
import durations from "./vo-durations.json";
import { FPS } from "./theme";

// Scene lengths follow the generated voice-over (voiceover/generate.py writes vo-durations.json).
const LEAD = 10; // frames before a scene's first line
const GAP = 8; // frames between lines
const TAIL: Record<string, number> = { story: 18, twist: 30, scale: 36, today: 24, question: 20, earmark: 45, title: 60 };

export type Line = { id: string; from: number; frames: number };
export type Scene = { id: string; from: number; frames: number; lines: Line[] };

const dur = durations as Record<string, number>;

export const SCENES: Scene[] = [];
let at = 0;
for (const s of script.scenes) {
  let t = LEAD;
  const lines = s.lines.map((l) => {
    const frames = Math.ceil(dur[l.id] * FPS);
    const line = { id: l.id, from: t, frames };
    t += frames + GAP;
    return line;
  });
  const frames = t - GAP + (TAIL[s.id] ?? 20);
  SCENES.push({ id: s.id, from: at, frames, lines });
  at += frames;
}

export const INTRO_FRAMES = at;

export function scene(id: string): Scene {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown scene ${id}`);
  return s;
}

/** Start frame (relative to its scene) of each voice-over line. */
export function beats(id: string): number[] {
  return scene(id).lines.map((l) => l.from);
}
