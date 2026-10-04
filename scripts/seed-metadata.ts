// Copies app/data/metadata.json into the Postgres table the app uses. Idempotent (existing keys are kept).
// Usage: DATABASE_URL=<public url> pnpm --dir app exec tsx ../scripts/seed-metadata.ts
import * as fs from "fs";
import * as path from "path";
import { addOnce } from "../app/src/lib/metadata-store";

const file = path.resolve(__dirname, "..", "app", "data", "metadata.json");
const all = JSON.parse(fs.readFileSync(file, "utf8"));
(async () => {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL");
  for (const [key, meta] of Object.entries(all)) {
    console.log(key, (await addOnce(key, meta as never)) ? "added" : "kept");
  }
  process.exit(0);
})();
