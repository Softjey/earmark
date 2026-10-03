import {
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { RPC_URL, TPLN_DECIMALS, TPLN_MINT } from "./config";

// Devnet test money only. The faucet key is the ePLN mint authority and fee payer; it is NOT part of
// the trust model (docs/PLAN.md §6) and must hold only a few cents of SOL.

export const DEFAULT_AMOUNT_TPLN = Math.min(Number(process.env.FAUCET_AMOUNT) || 100, 1_000_000);
/** Largest whole-ePLN amount one request may ask for. */
export const MAX_AMOUNT_TPLN = 1_000_000;
/** Total token accounts the faucet will pay rent for (~0.002 SOL each) before it stops creating new ones. */
const MAX_NEW_ACCOUNTS = Number(process.env.FAUCET_MAX_NEW_ACCOUNTS) || 40;
/** Rent + fee headroom needed to create one token account and send the tx. */
const MIN_LAMPORTS = 3_000_000;

export class FaucetError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// In-memory counter: fine for a single demo server, resets on restart / not shared across serverless instances.
let newAccounts = 0;

function loadFaucetKey(): Keypair {
  const raw = process.env.FAUCET_SECRET_KEY;
  if (!raw) throw new FaucetError("The faucet is not configured on this server.", 503);
  try {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
  } catch {
    throw new FaucetError("The faucet key is invalid.", 503);
  }
}

export async function claimTpln(walletAddress: string, amount: number): Promise<{ signature: string; amount: number }> {
  if (!TPLN_MINT) throw new FaucetError("The ePLN mint is not configured.", 503);
  if (/mainnet/i.test(RPC_URL)) throw new FaucetError("The faucet works on devnet only.", 403);

  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_AMOUNT_TPLN)
    throw new FaucetError(`Enter a whole amount between 1 and ${MAX_AMOUNT_TPLN.toLocaleString("en-US")} ePLN.`, 400);

  let wallet: PublicKey;
  try {
    wallet = new PublicKey(walletAddress);
  } catch {
    throw new FaucetError("That is not a valid wallet address.", 400);
  }
  if (!PublicKey.isOnCurve(wallet.toBytes())) throw new FaucetError("Use a regular wallet address.", 400);

  const faucet = loadFaucetKey();
  const connection = new Connection(RPC_URL, "confirmed");
  const mint = await getMint(connection, TPLN_MINT);
  if (!mint.mintAuthority?.equals(faucet.publicKey))
    throw new FaucetError("The faucet is not the ePLN mint authority yet.", 503);
  if ((await connection.getBalance(faucet.publicKey)) < MIN_LAMPORTS)
    throw new FaucetError("The faucet is out of devnet SOL. Please tell the organizers.", 503);

  let createdAccount = false;
  try {
    const ata = getAssociatedTokenAddressSync(TPLN_MINT, wallet);
    const needsAccount = !(await connection.getAccountInfo(ata));
    if (needsAccount) {
      if (newAccounts >= MAX_NEW_ACCOUNTS)
        throw new FaucetError("The faucet cannot open new token accounts right now. Ask the organizers for ePLN.", 503);
      newAccounts++;
      createdAccount = true;
    }
    const tx = new Transaction();
    if (needsAccount)
      tx.add(createAssociatedTokenAccountIdempotentInstruction(faucet.publicKey, ata, wallet, TPLN_MINT));
    tx.add(createMintToInstruction(TPLN_MINT, ata, faucet.publicKey, BigInt(amount) * 10n ** BigInt(TPLN_DECIMALS)));
    const signature = await sendAndConfirmTransaction(connection, tx, [faucet]);
    return { signature, amount };
  } catch (e) {
    if (createdAccount) newAccounts--;
    throw e;
  }
}
