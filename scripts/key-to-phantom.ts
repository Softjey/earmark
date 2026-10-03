/**
 * Converts a Solana CLI keypair file (JSON byte array) into the base58 private key that Phantom's
 * "Import Private Key" expects. Prints the public address and the key, and copies the key to the clipboard on macOS.
 * Usage: pnpm exec tsx scripts/key-to-phantom.ts scripts/.keys/clinic.json
 * Only use it with throwaway devnet keys; anyone who sees the output controls that wallet.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { Keypair } from "@solana/web3.js";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58(bytes: Uint8Array): string {
  let n = BigInt("0x" + Buffer.from(bytes).toString("hex"));
  let out = "";
  while (n > 0n) {
    out = ALPHABET[Number(n % 58n)] + out;
    n /= 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    out = "1" + out;
  }
  return out;
}

const path = process.argv[2]?.replace(/^~(?=\/)/, process.env.HOME ?? "~");
if (!path) {
  console.error("Usage: pnpm exec tsx scripts/key-to-phantom.ts <path to keypair .json>");
  process.exit(1);
}

let keypair: Keypair;
try {
  keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
} catch (e) {
  console.error(`Could not read a keypair from ${path}: ${(e as Error).message}`);
  process.exit(1);
}

const key = base58(keypair.secretKey);
console.log(`Address:     ${keypair.publicKey.toBase58()}`);
console.log(`Private key: ${key}`);
console.log("\nPhantom: Add / Connect Wallet → Import Private Key → paste. Switch Phantom to Solana Devnet.");

try {
  execFileSync("pbcopy", { input: key });
  console.log("(private key copied to the clipboard)");
} catch {
  // No pbcopy (not macOS): the key is printed above.
}
