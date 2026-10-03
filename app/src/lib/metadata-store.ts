import { promises as fs } from "fs";
import path from "path";
import type { Metadata } from "./metadata";

// Local demo storage. Read-only on serverless hosts; fine for P0 (docs/PLAN.md §6).
const FILE = path.join(process.cwd(), "data", "metadata.json");

let queue: Promise<unknown> = Promise.resolve();

export async function readAll(): Promise<Record<string, Metadata>> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

/** Write-once per fundraiser, so nobody can overwrite a story after the fact. Returns false if taken. */
export function addOnce(key: string, meta: Metadata): Promise<boolean> {
  const task = queue.then(async () => {
    const all = await readAll();
    if (all[key]) return false;
    all[key] = meta;
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(all, null, 2));
    return true;
  });
  queue = task.catch(() => undefined);
  return task;
}
