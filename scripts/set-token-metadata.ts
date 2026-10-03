/**
 * Gives the ePLN mint a name, symbol and image (Metaplex Token Metadata) so wallets show "Earmark PLN"
 * instead of "Unknown Token". Signed by the faucet key (mint authority and update authority).
 * Creates the metadata account (~0.006 SOL rent) or updates it; safe to re-run.
 * The JSON at URI is assets/epln/epln.json and must be pushed to GitHub before wallets can read it.
 * Usage: pnpm tsx scripts/set-token-metadata.ts
 */
import { PublicKey, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { demoKeypair, explorer, readEnv, setup } from "./lib";

const METADATA_PROGRAM = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const NAME = "Earmark PLN";
const SYMBOL = "ePLN";
const URI = "https://raw.githubusercontent.com/Softjey/earmark/main/assets/epln/epln.json";

const str = (s: string) => {
  const b = Buffer.from(s);
  const len = Buffer.alloc(4);
  len.writeUInt32LE(b.length);
  return Buffer.concat([len, b]);
};

async function main() {
  const { connection } = setup();
  const mintAddress = process.env.TPLN_MINT ?? readEnv().NEXT_PUBLIC_TPLN_MINT;
  if (!mintAddress) throw new Error("ePLN mint unknown: run scripts/create-mint.ts first");
  const mint = new PublicKey(mintAddress);
  const faucet = demoKeypair("faucet");

  const [metadata] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM.toBuffer(), mint.toBuffer()],
    METADATA_PROGRAM
  );
  const exists = !!(await connection.getAccountInfo(metadata));
  // DataV2 without royalties, creators, collection or uses.
  const dataV2 = Buffer.concat([str(NAME), str(SYMBOL), str(URI), Buffer.from([0, 0]), Buffer.from([0, 0, 0])]);
  const ix = exists
    ? new TransactionInstruction({
        // UpdateMetadataAccountV2: discriminator 15, new data, no new update authority / primary sale / mutability change.
        programId: METADATA_PROGRAM,
        keys: [
          { pubkey: metadata, isSigner: false, isWritable: true },
          { pubkey: faucet.publicKey, isSigner: true, isWritable: false },
        ],
        data: Buffer.concat([Buffer.from([15, 1]), dataV2, Buffer.from([0, 0, 0])]),
      })
    : new TransactionInstruction({
        // CreateMetadataAccountV3: discriminator 33, is_mutable, no collection details.
        programId: METADATA_PROGRAM,
        keys: [
          { pubkey: metadata, isSigner: false, isWritable: true },
          { pubkey: mint, isSigner: false, isWritable: false },
          { pubkey: faucet.publicKey, isSigner: true, isWritable: false },
          { pubkey: faucet.publicKey, isSigner: true, isWritable: true },
          { pubkey: faucet.publicKey, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([Buffer.from([33]), dataV2, Buffer.from([1, 0])]),
      });
  const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [faucet]);
  console.log(`${exists ? "Updated" : "Set"} metadata ${NAME} (${SYMBOL}) on ${mint.toBase58()}`);
  console.log("tx:", explorer("tx", sig));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
