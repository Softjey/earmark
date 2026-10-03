import script from "../voiceover/script.json";
import durations from "./vo-durations.json";
import durationsFast from "./vo-durations-fast.json";

export const FPS = 30;

// Scene lengths follow the generated voice-over (voiceover/generate.py writes vo-durations*.json).
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
  earmarkB: 45,
  why: 40,
  title: 60,
  titleB: 60,
};

export type Pacing = "calm" | "dynamic";

const PACING: Record<Pacing, { lead: number; gap: number; tail: number; durations: Record<string, number>; vo: string }> = {
  // lead: frames before a scene's first line, gap: frames between lines, tail: share of TAIL kept after the last line
  calm: { lead: 10, gap: 8, tail: 1, durations, vo: "vo" },
  dynamic: { lead: 4, gap: 4, tail: 0.5, durations: durationsFast, vo: "vo-fast" },
};

export type Line = { id: string; from: number; frames: number };
export type Scene = { id: string; frames: number; lines: Line[] };
export type Variant = keyof typeof script.variants;

function build(pacing: Pacing): Record<string, Scene> {
  const p = PACING[pacing];
  const scenes: Record<string, Scene> = {};
  for (const s of script.scenes) {
    let t = p.lead;
    const lines = s.lines.map((l) => {
      const frames = Math.ceil(p.durations[l.id] * FPS);
      const line = { id: l.id, from: t, frames };
      t += frames + p.gap;
      return line;
    });
    scenes[s.id] = { id: s.id, frames: t - p.gap + Math.round((TAIL[s.id] ?? 20) * p.tail), lines };
  }
  return scenes;
}

const SCENES: Record<Pacing, Record<string, Scene>> = { calm: build("calm"), dynamic: build("dynamic") };

/** Folder under public/ that holds the voice-over for this pacing. */
export const voFolder = (pacing: Pacing) => PACING[pacing].vo;

/** The scenes of one intro variant, each with its start frame. */
export function sequence(variant: Variant, pacing: Pacing = "calm"): (Scene & { from: number })[] {
  let at = 0;
  return script.variants[variant].map((id) => {
    const s = { ...scene(id, pacing), from: at };
    at += s.frames;
    return s;
  });
}

export function introFrames(variant: Variant, pacing: Pacing = "calm"): number {
  return sequence(variant, pacing).reduce((sum, s) => sum + s.frames, 0);
}

export function scene(id: string, pacing: Pacing = "calm"): Scene {
  const s = SCENES[pacing][id];
  if (!s) throw new Error(`unknown scene ${id}`);
  return s;
}
