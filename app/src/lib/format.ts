import { TPLN_DECIMALS } from "./config";

export function shortKey(key: string, n = 4): string {
  return key.length <= n * 2 + 1 ? key : `${key.slice(0, n)}…${key.slice(-n)}`;
}

/** Base units (bigint/number/BN-like) to a human tPLN string, e.g. 1 000. */
export function formatTpln(units: { toString(): string }): string {
  const v = Number(units.toString()) / 10 ** TPLN_DECIMALS;
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 }).replace(/,/g, " ");
}

/** Plain tPLN number (e.g. "400") to base units. Returns null for anything but a positive amount. */
export function parseTpln(input: string): bigint | null {
  const m = /^(\d+)(?:[.,](\d{1,6}))?$/.exec(input.replace(/\s/g, ""));
  if (!m) return null;
  const units = BigInt(m[1]) * 10n ** BigInt(TPLN_DECIMALS) + BigInt((m[2] ?? "").padEnd(TPLN_DECIMALS, "0") || "0");
  return units > 0n ? units : null;
}

export function formatDate(sec: number): string {
  return new Date(sec * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(sec: number): string {
  const d = new Date(sec * 1000);
  return `${formatDate(sec)}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export function timeLeft(deadlineSec: number, nowSec: number): string {
  const s = deadlineSec - nowSec;
  if (s <= 0) return "ended";
  if (s < 3600) return `${Math.max(1, Math.ceil(s / 60))} min left`;
  if (s < 86400) return `${Math.floor(s / 3600)} h left`;
  const d = Math.floor(s / 86400);
  return `${d} day${d === 1 ? "" : "s"} left`;
}

export function timeAgo(sec: number | null, nowSec: number): string {
  if (sec == null) return "";
  const s = Math.max(0, nowSec - sec);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return formatDate(sec);
}
