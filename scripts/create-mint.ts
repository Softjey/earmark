/**
 * Creates the ePLN SPL mint (6 decimals), calls `init_config` and writes app/.env.local.
 * Idempotent: if the program is already configured, only refreshes app/.env.local.
 * Usage: pnpm tsx scripts/create-mint.ts
 */
import { createMint } from "@solana/spl-token";
import { configPda, demoKeypair, explorer, setup, writeEnv } from "./lib";
import { TPLN_DECIMALS } from "./lib";

async function main() {
  const { connection, deployer, program } = setup();
  const verifier = demoKeypair("verifier");

  const existing = await program.account.config.fetchNullable(configPda(program.programId));
  let mint = existing?.mint;
  if (!mint) {
    mint = await createMint(connection, deployer, deployer.publicKey, null, TPLN_DECIMALS);
    await program.methods
      .initConfig(verifier.publicKey)
      .accounts({ deployer: deployer.publicKey, mint })
      .rpc();
    console.log("Created ePLN mint and initialised config");
  } else {
    console.log("Config already initialised, reusing mint");
  }

  writeEnv({
    NEXT_PUBLIC_PROGRAM_ID: program.programId.toBase58(),
    NEXT_PUBLIC_TPLN_MINT: mint.toBase58(),
  });
  console.log("Program ID:", program.programId.toBase58());
  console.log("ePLN mint :", mint.toBase58(), explorer("address", mint.toBase58()));
  console.log("Verifier  :", (existing?.verifier ?? verifier.publicKey).toBase58());
  console.log("Wrote app/.env.local");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
