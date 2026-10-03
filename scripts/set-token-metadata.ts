/**
 * Gives the tPLN mint a name and symbol (Metaplex Token Metadata) so wallets show "Test PLN"
 * instead of "Unknown Token". Signed by the faucet key (mint authority); costs ~0.006 SOL rent.
 * Idempotent: does nothing if the metadata account already exists.
 * Usage: pnpm tsx scripts/set-token-metadata.ts
 */
import { PublicKey, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { demoKeypair, explorer, readEnv, setup } from "./lib";

const METADATA_PROGRAM = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const NAME = "Test PLN";
const SYMBOL = "tPLN";
const URI = "";

const str = (s: string) => {
  const b = Buffer.from(s);
  const len = Buffer.alloc(4);
  len.writeUInt32LE(b.length);
  return Buffer.concat([len, b]);
};

async function main() {
  const { connection } = setup();
  const mintAddress = process.env.TPLN_MINT ?? readEnv().NEXT_PUBLIC_TPLN_MINT;
  if (!mintAddress) throw new Error("tPLN mint unknown: run scripts/create-mint.ts first");
  const mint = new PublicKey(mintAddress);
  const faucet = demoKeypair("faucet");

  const [metadata] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM.toBuffer(), mint.toBuffer()],
    METADATA_PROGRAM
  );
  if (await connection.getAccountInfo(metadata)) {
    console.log("Metadata already exists:", metadata.toBase58());
    return;
  }

  // CreateMetadataAccountV3: discriminator 33, DataV2 (no royalties/creators/collection/uses), is_mutable, no collection details.
  const data = Buffer.concat([
    Buffer.from([33]),
    str(NAME),
    str(SYMBOL),
    str(URI),
    Buffer.from([0, 0]), // seller_fee_basis_points
    Buffer.from([0, 0, 0]), // creators, collection, uses = None
    Buffer.from([1]), // is_mutable
    Buffer.from([0]), // collection_details = None
  ]);
  const ix = new TransactionInstruction({
    programId: METADATA_PROGRAM,
    keys: [
      { pubkey: metadata, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: faucet.publicKey, isSigner: true, isWritable: false },
      { pubkey: faucet.publicKey, isSigner: true, isWritable: true },
      { pubkey: faucet.publicKey, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
  const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [faucet]);
  console.log(`Set metadata ${NAME} (${SYMBOL}) on ${mint.toBase58()}`);
  console.log("tx:", explorer("tx", sig));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
