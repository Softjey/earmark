/**
 * Creates real devnet state for the demo video's app screenshots, one step at a time so a screenshot can be taken
 * between steps. Progress (pubkeys, signatures) is kept in scripts/.keys/video-state.json (git-ignored); titles and
 * stories go to app/data/metadata.json so the local app shows them.
 *
 * Usage: pnpm tsx scripts/video-state.ts <step>
 *   create   Fundraiser A (eye surgery, target 1000) awaiting the recipient, and fundraiser B (flood relief, deadline
 *            in 90 s) confirmed with 300 ePLN from Donor 1
 *   create-a only a fresh fundraiser A (to redo the confirm → donate → payout sequence)
 *   reject   the organizer tries to name their own wallet as the recipient: a failed transaction lands on-chain
 *   confirm  the clinic confirms fundraiser A
 *   donate   Donor 1 gives 600 to A
 *   payout   Donor 2 gives the last 400: the target is hit and the vault pays the clinic in the same transaction
 *   refund   Donor 1 takes their 300 back from B (after its deadline)
 *   show     print the saved state with explorer links
 */
import { BN } from "@anchor-lang/core";
import { PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { createHash, randomBytes } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { configPda, demoKeypair, ensureSol, explorer, mintAuthority, ROOT, setup, tpln } from "./lib";

const STATE = path.join(__dirname, ".keys", "video-state.json");
const METADATA = path.join(ROOT, "app", "data", "metadata.json");

type State = Record<string, string>;
const load = (): State => (fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : {});
const save = (s: State) => fs.writeFileSync(STATE, JSON.stringify(s, null, 2));

function addMetadata(pubkey: PublicKey, entry: { title: string; story: string; category: string }) {
  const all = fs.existsSync(METADATA) ? JSON.parse(fs.readFileSync(METADATA, "utf8")) : {};
  all[pubkey.toBase58()] = entry;
  fs.mkdirSync(path.dirname(METADATA), { recursive: true });
  fs.writeFileSync(METADATA, JSON.stringify(all, null, 2));
}

async function main() {
  const step = process.argv[2];
  const { connection, deployer, program } = setup();
  const config = await program.account.config.fetch(configPda(program.programId));
  const mint = config.mint;
  const w = {
    organizer: demoKeypair("organizer"),
    clinic: demoKeypair("clinic"), // Kraków Eye Clinic (verified by seed-demo.ts)
    donor1: demoKeypair("donor1"),
    donor2: demoKeypair("donor2"),
  };
  const s = load();
  const fundraiserPda = (id: number) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("fundraiser"), w.organizer.publicKey.toBuffer(), new BN(id).toArrayLike(Buffer, "le", 8)],
      program.programId
    )[0];
  const create = async (target: number, deadlineIn: number, recipient: PublicKey) => {
    const id = Date.now();
    const hash = Array.from(createHash("sha256").update(randomBytes(32)).digest());
    const sig = await program.methods
      .createFundraiser(new BN(id), new BN(tpln(target)), new BN(Math.floor(Date.now() / 1000) + deadlineIn), hash, `/api/metadata/video-${id}`)
      .accountsPartial({ organizer: w.organizer.publicKey, recipientWallet: recipient, mint })
      .signers([w.organizer])
      .rpc();
    return { fundraiser: fundraiserPda(id), sig };
  };
  const donate = async (donor: typeof w.donor1, fundraiser: string, amount: number) => {
    const ata = await getOrCreateAssociatedTokenAccount(connection, deployer, mint, donor.publicKey);
    return program.methods
      .donate(new BN(tpln(amount)))
      .accountsPartial({ donor: donor.publicKey, fundraiser: new PublicKey(fundraiser), donorToken: ata.address, recipientWallet: w.clinic.publicKey, mint })
      .signers([donor])
      .rpc();
  };

  switch (step) {
    case "create": {
      for (const k of Object.values(w)) await ensureSol(connection, deployer, k.publicKey, 0.15);
      for (const d of [w.donor1, w.donor2]) {
        const ata = await getOrCreateAssociatedTokenAccount(connection, deployer, mint, d.publicKey);
        if (Number(ata.amount) < tpln(1500)) await mintTo(connection, deployer, mint, ata.address, mintAuthority(deployer), tpln(1500));
      }
      const a = await create(1000, 30 * 24 * 3600, w.clinic.publicKey);
      addMetadata(a.fundraiser, {
        title: "Cataract surgery for Zosia, 7",
        story: "Zosia is losing her sight to a congenital cataract. Kraków Eye Clinic has quoted the operation and will confirm the quote on-chain before anyone can donate.",
        category: "medical",
      });
      const b = await create(1000, 90, w.clinic.publicKey);
      addMetadata(b.fundraiser, {
        title: "New roof for the Kowalski family after the flood",
        story: "The September flood destroyed the roof of the Kowalskis' house in Kłodzko. If the target is not reached by the deadline, every donor can take their money back.",
        category: "disaster",
      });
      await program.methods.confirmFundraiser().accountsPartial({ recipientWallet: w.clinic.publicKey, fundraiser: b.fundraiser }).signers([w.clinic]).rpc();
      const bDonation = await donate(w.donor1, b.fundraiser.toBase58(), 300);
      Object.assign(s, { a: a.fundraiser.toBase58(), aCreate: a.sig, b: b.fundraiser.toBase58(), bDonation, bDeadline: String(Date.now() + 90_000) });
      break;
    }
    case "create-a": {
      const a = await create(1000, 30 * 24 * 3600, w.clinic.publicKey);
      addMetadata(a.fundraiser, {
        title: "Cataract surgery for Zosia, 7",
        story: "Zosia is losing her sight to a congenital cataract. Kraków Eye Clinic has quoted the operation and will confirm the quote on-chain before anyone can donate.",
        category: "medical",
      });
      for (const k of ["aConfirm", "aDonate1", "aPayout"]) delete s[k];
      Object.assign(s, { a: a.fundraiser.toBase58(), aCreate: a.sig });
      break;
    }
    case "reject": {
      // Same instruction, but the organizer names their own wallet: the program rejects it.
      const id = Date.now();
      const hash = Array.from(createHash("sha256").update(randomBytes(32)).digest());
      const tx = await program.methods
        .createFundraiser(new BN(id), new BN(tpln(1000)), new BN(Math.floor(Date.now() / 1000) + 3600), hash, "/api/metadata/video-reject")
        .accountsPartial({ organizer: w.organizer.publicKey, recipientWallet: w.organizer.publicKey, mint })
        .transaction();
      tx.feePayer = w.organizer.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.sign(w.organizer);
      const raw = tx.serialize();
      // skipPreflight so the failed transaction is recorded on-chain and can be shown in the explorer
      const sig = await connection.sendRawTransaction(raw, { skipPreflight: true });
      await connection.confirmTransaction(sig, "confirmed");
      const info = await connection.getTransaction(sig, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
      console.log("logs:", info?.meta?.logMessages?.filter((l: string) => l.includes("Error")).join("\n"));
      s.reject = sig;
      break;
    }
    case "confirm":
      s.aConfirm = await program.methods.confirmFundraiser().accountsPartial({ recipientWallet: w.clinic.publicKey, fundraiser: new PublicKey(s.a) }).signers([w.clinic]).rpc();
      break;
    case "donate":
      s.aDonate1 = await donate(w.donor1, s.a, 600);
      break;
    case "payout":
      s.aPayout = await donate(w.donor2, s.a, 400);
      break;
    case "refund": {
      const wait = Number(s.bDeadline) + 5000 - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      const ata = await getOrCreateAssociatedTokenAccount(connection, deployer, mint, w.donor1.publicKey);
      s.bRefund = await program.methods
        .refund()
        .accountsPartial({ caller: w.donor1.publicKey, donor: w.donor1.publicKey, fundraiser: new PublicKey(s.b), donorToken: ata.address })
        .signers([w.donor1])
        .rpc();
      break;
    }
    case "show":
      break;
    default:
      throw new Error("step: create | reject | confirm | donate | payout | refund | show");
  }
  save(s);
  for (const [k, v] of Object.entries(s)) {
    if (k === "bDeadline") continue;
    const kind = k === "a" || k === "b" ? "address" : "tx";
    console.log(`${k.padEnd(10)} ${v}  ${explorer(kind, v)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
