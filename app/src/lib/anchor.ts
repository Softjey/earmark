import { AnchorProvider, Program, type Wallet } from "@anchor-lang/core";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "@/idl/earmark.json";
import type { Earmark } from "@/idl/earmark";
import { PROGRAM_ID } from "./config";

export type { Earmark };

/** Read-only wallet so pages can fetch accounts before anyone connects. */
const READONLY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: () => Promise.reject(new Error("read-only")),
  signAllTransactions: () => Promise.reject(new Error("read-only")),
} as unknown as Wallet;

export function getProgram(connection: Connection, wallet?: Wallet): Program<Earmark> {
  const provider = new AnchorProvider(connection, wallet ?? READONLY_WALLET, {
    commitment: "confirmed",
  });
  // NEXT_PUBLIC_PROGRAM_ID overrides the address baked into the IDL.
  const withAddress = PROGRAM_ID ? { ...idl, address: PROGRAM_ID.toBase58() } : idl;
  return new Program<Earmark>(withAddress as Earmark, provider);
}
