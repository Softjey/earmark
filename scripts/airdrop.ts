/**
 * Mints tPLN to a wallet's associated token account. The deployer wallet is the mint authority.
 * Usage: pnpm tsx scripts/airdrop.ts <wallet> <amount in whole tPLN>
 */
import { PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { readEnv, setup, tpln } from "./lib";

async function main() {
  const [walletArg, amountArg] = process.argv.slice(2);
  const amount = Number(amountArg);
  if (!walletArg || !(amount > 0)) {
    console.error("Usage: pnpm tsx scripts/airdrop.ts <wallet> <amount>");
    process.exit(1);
  }
  const mintAddress = process.env.TPLN_MINT ?? readEnv().NEXT_PUBLIC_TPLN_MINT;
  if (!mintAddress) throw new Error("tPLN mint unknown: run scripts/create-mint.ts first");

  const { connection, deployer } = setup();
  const mint = new PublicKey(mintAddress);
  const ata = await getOrCreateAssociatedTokenAccount(connection, deployer, mint, new PublicKey(walletArg));
  const sig = await mintTo(connection, deployer, mint, ata.address, deployer, tpln(amount));
  console.log(`Minted ${amount} tPLN to ${walletArg} (token account ${ata.address.toBase58()})`);
  console.log("tx:", sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
