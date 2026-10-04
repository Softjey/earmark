/**
 * Verifies a few extra demo recipients so the recipient picker on /new has something to choose from.
 * Safe to re-run: recipients that are already verified are skipped. Each new recipient costs ~0.002 SOL of rent,
 * paid by the verifier. The recipient wallets are throwaway keys stored in scripts/.keys/recipient-<n>.json.
 * Every recipient wallet is also topped up with 0.03 SOL (even if already verified): a recipient needs SOL for the
 * transaction fee to confirm or reject a fundraiser, and Phantom refuses to sign with a 0 SOL balance.
 * Usage: pnpm exec tsx scripts/seed-recipients.ts
 */
import { PublicKey } from "@solana/web3.js";
import { configPda, demoKeypair, ensureSol, setup } from "./lib";

const RECIPIENTS = [
  { key: "recipient-2", name: "Warsaw Children's Hospital", registry: "RPWDL-0002" },
  { key: "recipient-3", name: "Ukraine Relief Fund", registry: "KRS-0000003" },
  { key: "recipient-4", name: "Happy Paws Animal Shelter", registry: "KRS-0000004" },
  { key: "recipient-5", name: "Flood Recovery Association", registry: "KRS-0000005" },
];

async function main() {
  const { connection, deployer, program } = setup();
  const config = await program.account.config.fetch(configPda(program.programId));
  const verifier = demoKeypair("verifier");
  if (!verifier.publicKey.equals(config.verifier))
    throw new Error(`scripts/.keys/verifier.json is not the configured verifier (${config.verifier.toBase58()})`);
  await ensureSol(connection, deployer, verifier.publicKey, 0.05);

  for (const c of RECIPIENTS) {
    const wallet = demoKeypair(c.key).publicKey;
    await ensureSol(connection, deployer, wallet, 0.03);
    const pda = PublicKey.findProgramAddressSync([Buffer.from("recipient"), wallet.toBuffer()], program.programId)[0];
    if (await program.account.recipient.fetchNullable(pda)) {
      console.log(`skip   ${c.name} (already verified)`);
      continue;
    }
    await program.methods
      .verifyRecipient(c.name, c.registry)
      .accounts({ verifier: verifier.publicKey, wallet })
      .signers([verifier])
      .rpc();
    console.log(`added  ${c.name}  ${wallet.toBase58()}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
