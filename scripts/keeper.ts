/**
 * Refund keeper: sends `refund` for every donor of a cancelled / expired fundraiser, so donors get
 * their money back without clicking anything. It holds no power: `refund` is permissionless and the
 * program only pays the donor's own token account. The keeper just pays the transaction fee.
 * If it is not running, donors can still refund from the app.
 *
 * Usage: pnpm tsx scripts/keeper.ts [--once] [--interval <ms>]   (default: watch, every 1000 ms)
 */
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { configPda, explorer, setup } from "./lib";

const once = process.argv.includes("--once");
const intervalIdx = process.argv.indexOf("--interval");
const intervalMs = intervalIdx >= 0 ? Number(process.argv[intervalIdx + 1]) : 1000;

async function main() {
  const { connection, deployer, program } = setup();
  console.log(`Keeper ${deployer.publicKey.toBase58()} on ${connection.rpcEndpoint}`);
  const config = await program.account.config.fetch(configPda(program.programId));
  const mint = config.mint;
  const inFlight = new Set<string>();

  async function sweep() {
    const now = Math.floor(Date.now() / 1000);
    const [fundraisers, donations] = await Promise.all([
      program.account.fundraiser.all(),
      program.account.donation.all(),
    ]);
    const open = new Map(donations.filter((d) => !d.account.refunded).map((d) => [d.publicKey.toBase58(), d.account]));
    if (open.size === 0) return 0;

    const jobs: Promise<void>[] = [];
    for (const f of fundraisers) {
      const s = f.account.status;
      const expired = "active" in s && now >= f.account.deadline.toNumber();
      if (!("cancelled" in s) && !expired) continue;
      for (const donorKey of new Set(donations.map((d) => d.account.donor.toBase58()))) {
        const donor = new PublicKey(donorKey);
        const donation = PublicKey.findProgramAddressSync(
          [Buffer.from("donation"), f.publicKey.toBuffer(), donor.toBuffer()],
          program.programId
        )[0];
        const key = donation.toBase58();
        if (!open.has(key) || inFlight.has(key)) continue;
        inFlight.add(key);
        jobs.push(
          program.methods
            .refund()
            .accountsPartial({
              caller: deployer.publicKey,
              donor,
              fundraiser: f.publicKey,
              donorToken: getAssociatedTokenAddressSync(mint, donor),
            })
            .rpc()
            .then((sig) => {
              console.log(`refunded ${donorKey} from ${f.publicKey.toBase58()}\n  ${explorer("tx", sig)}`);
            })
            .catch((e) => console.error(`refund failed for ${donorKey}: ${e.message ?? e}`))
            .finally(() => inFlight.delete(key))
        );
      }
    }
    await Promise.all(jobs);
    return jobs.length;
  }

  do {
    try {
      await sweep();
    } catch (e) {
      console.error("sweep failed:", (e as Error).message ?? e);
    }
    if (!once) await new Promise((r) => setTimeout(r, intervalMs));
  } while (!once);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
