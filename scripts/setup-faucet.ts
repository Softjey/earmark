/**
 * One-time devnet faucet setup (T13): creates a dedicated faucet key, funds it with 0.1 SOL and
 * moves the tPLN mint authority from the deployer wallet to it, then writes FAUCET_SECRET_KEY to app/.env.local.
 * The faucet key is test-money only and never the upgrade authority. Spends ~0.1 SOL of devnet SOL.
 * Usage: pnpm tsx scripts/setup-faucet.ts
 */
import { AuthorityType, getMint, setAuthority } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { demoKeypair, ensureSol, readEnv, setup, writeEnv } from "./lib";

const FAUCET_SOL = 0.1;

async function main() {
  const { connection, deployer } = setup();
  const mintAddress = process.env.TPLN_MINT ?? readEnv().NEXT_PUBLIC_TPLN_MINT;
  if (!mintAddress) throw new Error("tPLN mint unknown: run scripts/create-mint.ts first");
  const mint = new PublicKey(mintAddress);
  const faucet = demoKeypair("faucet");

  await ensureSol(connection, deployer, faucet.publicKey, FAUCET_SOL);

  const info = await getMint(connection, mint);
  if (info.mintAuthority?.equals(faucet.publicKey)) {
    console.log("Faucet is already the mint authority");
  } else if (info.mintAuthority?.equals(deployer.publicKey)) {
    await setAuthority(connection, deployer, mint, deployer, AuthorityType.MintTokens, faucet.publicKey);
    console.log("Moved tPLN mint authority to the faucet key");
  } else {
    throw new Error(`Unexpected mint authority ${info.mintAuthority?.toBase58()}`);
  }

  writeEnv({ FAUCET_SECRET_KEY: JSON.stringify(Array.from(faucet.secretKey)) });
  const sol = (await connection.getBalance(faucet.publicKey)) / LAMPORTS_PER_SOL;
  console.log("Faucet key:", faucet.publicKey.toBase58(), `(${sol} SOL)`);
  console.log("Wrote FAUCET_SECRET_KEY to app/.env.local; set it on the host too. Keep scripts/.keys/faucet.json.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
