import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";
import type { Metadata } from "./metadata";

// Postgres when DATABASE_URL is set (hosted deploys, see README "Hosting"), otherwise a local JSON file
// for dev. Either way it holds only non-financial text (docs/PLAN.md §6).
const FILE = path.join(process.cwd(), "data", "metadata.json");

let pool: Pool | undefined;
let ready: Promise<unknown> | undefined;

function db(): Pool | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  pool ??= new Pool({ connectionString: url, max: 5 });
  ready ??= pool
    .query("CREATE TABLE IF NOT EXISTS metadata (key text PRIMARY KEY, data jsonb NOT NULL)")
    .catch((e) => {
      ready = undefined;
      throw e;
    });
  return pool;
}

let queue: Promise<unknown> = Promise.resolve();

export async function readAll(): Promise<Record<string, Metadata>> {
  const pg = db();
  if (pg) {
    await ready;
    const { rows } = await pg.query("SELECT key, data FROM metadata");
    return Object.fromEntries(rows.map((r) => [r.key, r.data as Metadata]));
  }
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

/** Write-once per fundraiser, so nobody can overwrite a story after the fact. Returns false if taken. */
export function addOnce(key: string, meta: Metadata): Promise<boolean> {
  const pg = db();
  if (pg) {
    return (async () => {
      await ready;
      const res = await pg.query(
        "INSERT INTO metadata (key, data) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
        [key, JSON.stringify(meta)],
      );
      return res.rowCount === 1;
    })();
  }
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
