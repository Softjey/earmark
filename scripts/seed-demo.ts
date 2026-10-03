/**
 * Puts the chain into the state docs/DEMO.md expects:
 *  - Eye Clinic verified, all demo wallets funded with SOL and tPLN
 *  - Fundraiser B: target 1000 tPLN, 300 donated by Donor 1, deadline N seconds from now
 * Run it again for a fresh fundraiser B (every run creates a new one).
 * Usage: pnpm tsx scripts/seed-demo.ts [--deadline-in <seconds>]   (default 120)
 */
import { BN } from "@anchor-lang/core";
import { PublicKey } from "@solana/web3.js";
import { createHash, randomBytes } from "crypto";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { configPda, demoKeypair, ensureSol, explorer, setup, tpln } from "./lib";

function parseDeadline(): number {
  const i = process.argv.indexOf("--deadline-in");
  const v = i >= 0 ? Number(process.argv[i + 1]) : 120;
  if (!(v > 0)) throw new Error("--deadline-in needs a positive number of seconds");
  return v;
}

async function main() {
  const deadlineIn = parseDeadline();
  const { connection, deployer, program } = setup();
  const config = await program.account.config.fetchNullable(configPda(program.programId));
  if (!config) throw new Error("Program not configured: run scripts/create-mint.ts first");
  const mint = config.mint;

  const wallets = {
    verifier: demoKeypair("verifier"),
    clinic: demoKeypair("clinic"),
    organizer: demoKeypair("organizer"),
    donor1: demoKeypair("donor1"),
    donor2: demoKeypair("donor2"),
  };
  if (!wallets.verifier.publicKey.equals(config.verifier)) {
    throw new Error(
      `scripts/.keys/verifier.json (${wallets.verifier.publicKey.toBase58()}) is not the configured verifier (${config.verifier.toBase58()})`
    );
  }

  // SOL for fees + rent, tPLN for the donors.
  for (const w of Object.values(wallets)) await ensureSol(connection, deployer, w.publicKey, 0.2);
  for (const d of [wallets.donor1, wallets.donor2]) {
    const ata = await getOrCreateAssociatedTokenAccount(connection, deployer, mint, d.publicKey);
    if (Number(ata.amount) < tpln(2000))
      await mintTo(connection, deployer, mint, ata.address, deployer, tpln(2000) - Number(ata.amount));
  }

  // Verify the clinic (once).
  const recipientPda = PublicKey.findProgramAddressSync(
    [Buffer.from("recipient"), wallets.clinic.publicKey.toBuffer()],
    program.programId
  )[0];
  if (!(await program.account.recipient.fetchNullable(recipientPda))) {
    await program.methods
      .verifyRecipient("Eye Clinic", "RPWDL-0001")
      .accounts({ verifier: wallets.verifier.publicKey, wallet: wallets.clinic.publicKey })
      .signers([wallets.verifier])
      .rpc();
  }

  // Fundraiser B: created, confirmed, 300 tPLN from Donor 1.
  const id = Date.now();
  const quoteHash = Array.from(createHash("sha256").update(randomBytes(32)).digest());
  const deadline = Math.floor(Date.now() / 1000) + deadlineIn;
  await program.methods
    .createFundraiser(new BN(id), new BN(tpln(1000)), new BN(deadline), quoteHash, `/api/metadata/seed-${id}`)
    .accounts({ organizer: wallets.organizer.publicKey, recipientWallet: wallets.clinic.publicKey, mint })
    .signers([wallets.organizer])
    .rpc();
  const fundraiser = PublicKey.findProgramAddressSync(
    [Buffer.from("fundraiser"), wallets.organizer.publicKey.toBuffer(), new BN(id).toArrayLike(Buffer, "le", 8)],
    program.programId
  )[0];
  await program.methods
    .confirmFundraiser()
    .accounts({ recipientWallet: wallets.clinic.publicKey, fundraiser })
    .signers([wallets.clinic])
    .rpc();
  const donor1Ata = await getOrCreateAssociatedTokenAccount(connection, deployer, mint, wallets.donor1.publicKey);
  await program.methods
    .donate(new BN(tpln(300)))
    .accounts({
      donor: wallets.donor1.publicKey,
      fundraiser,
      donorToken: donor1Ata.address,
      recipientWallet: wallets.clinic.publicKey,
      mint,
    })
    .signers([wallets.donor1])
    .rpc();

  console.log("\nDemo state ready.\n");
  for (const [name, w] of Object.entries(wallets))
    console.log(`${name.padEnd(10)} ${w.publicKey.toBase58()}  ${explorer("address", w.publicKey.toBase58())}`);
  console.log(`\nFundraiser B ${fundraiser.toBase58()}`);
  console.log(`  ${explorer("address", fundraiser.toBase58())}`);
  console.log(`  target 1000 tPLN, 300 raised, deadline ${new Date(deadline * 1000).toISOString()} (in ${deadlineIn}s)`);
  console.log(`tPLN mint    ${mint.toBase58()}`);
  console.log(`Program      ${program.programId.toBase58()}`);
  console.log("Wallet keys are in scripts/.keys/ (git-ignored); import them into Phantom/Solflare.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
