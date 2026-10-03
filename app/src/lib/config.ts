import { clusterApiUrl, PublicKey } from "@solana/web3.js";

export type Cluster = "localnet" | "devnet";

export const CLUSTER: Cluster =
  process.env.NEXT_PUBLIC_CLUSTER === "localnet" ? "localnet" : "devnet";

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  (CLUSTER === "localnet" ? "http://127.0.0.1:8899" : clusterApiUrl("devnet"));

export const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID
  ? new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID)
  : undefined;

export const TPLN_MINT = process.env.NEXT_PUBLIC_TPLN_MINT
  ? new PublicKey(process.env.NEXT_PUBLIC_TPLN_MINT)
  : undefined;

export const TPLN_DECIMALS = 6;

/** Solana Explorer link; localnet points at the explorer with a custom RPC. */
export function explorerUrl(kind: "tx" | "address", value: string): string {
  const base = `https://explorer.solana.com/${kind}/${value}`;
  return CLUSTER === "localnet"
    ? `${base}?cluster=custom&customUrl=${encodeURIComponent(RPC_URL)}`
    : `${base}?cluster=devnet`;
}
