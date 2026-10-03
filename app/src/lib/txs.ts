import type { Connection } from "@solana/web3.js";

// Confirmed transactions never change, so their logs are cached (memory + localStorage) and only new
// signatures hit the RPC. The public devnet RPC rate-limits getTransaction hard ("Too many requests for a
// specific RPC call"), so the rest go in small chunks with retries and a failure only drops those chunks.

const STORE_KEY = "earmark:tx-logs:v1";
const STORE_MAX = 300;
const CHUNK = 3;
const ATTEMPTS = 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const cache = new Map<string, string[]>();
let restored = false;

function restore() {
  if (restored) return;
  restored = true;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) for (const [sig, logs] of Object.entries(JSON.parse(raw) as Record<string, string[]>)) cache.set(sig, logs);
  } catch {
    // Storage can be unavailable or corrupt; the in-memory cache still works.
  }
}

function persist() {
  try {
    const entries = [...cache.entries()].slice(-STORE_MAX);
    localStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Quota exceeded or storage blocked: ignore.
  }
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= ATTEMPTS) throw e;
      await sleep(800 * 2 ** (attempt - 1));
    }
  }
}

/**
 * Program logs of the given signatures. `failed` is true when some could not be read (they are simply
 * missing from `logs`); a later call retries only those.
 */
export async function fetchTxLogs(
  connection: Connection,
  signatures: string[],
): Promise<{ logs: Map<string, string[]>; failed: boolean }> {
  restore();
  const missing = signatures.filter((s) => !cache.has(s));
  let failed = false;
  for (let i = 0; i < missing.length; i += CHUNK) {
    const batch = missing.slice(i, i + CHUNK);
    try {
      const txs = await withRetry(() => connection.getTransactions(batch, { commitment: "confirmed", maxSupportedTransactionVersion: 0 }));
      txs.forEach((tx, j) => {
        const logs = tx?.meta?.logMessages;
        if (logs) cache.set(batch[j], logs);
      });
    } catch {
      failed = true;
      break; // The RPC is throttling us; stop and show what we have instead of hammering it.
    }
    if (i + CHUNK < missing.length) await sleep(150);
  }
  if (missing.length) persist();
  return { logs: new Map(signatures.filter((s) => cache.has(s)).map((s) => [s, cache.get(s)!])), failed };
}
