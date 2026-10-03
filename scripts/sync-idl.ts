// Copies the Anchor IDL and generated types into app/src/idl so the frontend never edits them by hand.
// Run after `anchor build` (the app's predev/prebuild hooks call it).
import * as fs from "fs";
import * as path from "path";

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "app", "src", "idl");
const files = [
  ["target/idl/earmark.json", "earmark.json"],
  ["target/types/earmark.ts", "earmark.ts"],
];

fs.mkdirSync(outDir, { recursive: true });
for (const [src, dest] of files) {
  const from = path.join(root, src);
  if (!fs.existsSync(from)) {
    console.warn(`sync-idl: ${src} not found, run \`anchor build\` first; keeping the committed copy`);
    continue;
  }
  fs.copyFileSync(from, path.join(outDir, dest));
  console.log(`sync-idl: ${src} -> app/src/idl/${dest}`);
}
