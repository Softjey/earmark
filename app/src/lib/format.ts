import { TPLN_DECIMALS } from "./config";

export function shortKey(key: string, n = 4): string {
  return key.length <= n * 2 + 1 ? key : `${key.slice(0, n)}…${key.slice(-n)}`;
}

/** Base units (bigint/number/BN-like) to a human tPLN string, e.g. 1 000. */
export function formatTpln(units: { toString(): string }): string {
  const v = Number(units.toString()) / 10 ** TPLN_DECIMALS;
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 }).replace(/,/g, " ");
}
