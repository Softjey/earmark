/**
 * Verifies a few extra demo clinics so the clinic picker on /new has something to choose from.
 * Safe to re-run: clinics that are already verified are skipped. Each new clinic costs ~0.002 SOL of rent,
 * paid by the verifier. The clinic wallets are throwaway keys stored in scripts/.keys/clinic-<n>.json.
 * Usage: pnpm exec tsx scripts/seed-clinics.ts
 */
import { PublicKey } from "@solana/web3.js";
import { configPda, demoKeypair, ensureSol, setup } from "./lib";

const CLINICS = [
  { key: "clinic-2", name: "Warsaw Children's Hospital", registry: "RPWDL-0002" },
  { key: "clinic-3", name: "Gdańsk Cardiology Center", registry: "RPWDL-0003" },
  { key: "clinic-4", name: "Wrocław Oncology Institute", registry: "RPWDL-0004" },
  { key: "clinic-5", name: "Poznań Rehabilitation Clinic", registry: "RPWDL-0005" },
];

async function main() {
  const { connection, deployer, program } = setup();
  const config = await program.account.config.fetch(configPda(program.programId));
  const verifier = demoKeypair("verifier");
  if (!verifier.publicKey.equals(config.verifier))
    throw new Error(`scripts/.keys/verifier.json is not the configured verifier (${config.verifier.toBase58()})`);
  await ensureSol(connection, deployer, verifier.publicKey, 0.05);

  for (const c of CLINICS) {
    const wallet = demoKeypair(c.key).publicKey;
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
