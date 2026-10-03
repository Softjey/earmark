// Prints a cut's scene timings (in seconds) as JSON, so sound/generate.py can score music to the picture.
// Usage (from video/sound/): ../../node_modules/.bin/tsx export-timeline.ts <variant> <calm|dynamic>
import { FPS, sequence, type Pacing, type Variant } from "../src/timeline";

const [variant, pacing] = process.argv.slice(2) as [Variant, Pacing];
const scenes = sequence(variant, pacing).map((s) => ({ id: s.id, start: s.from / FPS, length: s.frames / FPS }));
console.log(JSON.stringify(scenes));
