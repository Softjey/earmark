// Prints a cut's scene timings (in seconds) as JSON, so sound/generate.py can score music to the picture.
// Usage (from video/sound/): ../../node_modules/.bin/tsx export-timeline.ts <variant> <calm|dynamic>
import script from "../voiceover/script.json";
import { FPS, sequence, type Pacing, type Variant } from "../src/timeline";

const [variant, pacing] = process.argv.slice(2) as [Variant, Pacing];
const scenes = sequence(variant, pacing).map((s) => ({
  id: s.id,
  start: s.from / FPS,
  length: s.frames / FPS,
  // each voice-over line with its text, so the score can hit a word (see score_v9)
  lines: s.lines.map((l, i) => ({
    start: (s.from + l.from) / FPS,
    length: l.frames / FPS,
    text: script.scenes.find((x) => x.id === s.id)?.lines[i]?.text ?? "",
  })),
}));
console.log(JSON.stringify(scenes));
