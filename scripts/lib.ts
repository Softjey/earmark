import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Earmark } from "../target/types/earmark";

export const ROOT = path.resolve(__dirname, "..");
export const ENV_FILE = path.join(ROOT, "app", ".env.local");
const KEYS_DIR = path.join(__dirname, ".keys");

export const RPC_URL =
  process.env.ANCHOR_PROVIDER_URL ?? "https://api.devnet.solana.com";
const WALLET_PATH = (
  process.env.ANCHOR_WALLET ?? "~/.config/solana/id.json"
).replace(/^~/, os.homedir());

export const TPLN_DECIMALS = 6;
export const tpln = (whole: number) => whole * 10 ** TPLN_DECIMALS;

export function loadKeypair(file: string): Keypair {
  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(file, "utf8")))
  );
}

/** Persistent demo wallet stored (git-ignored) in scripts/.keys/<name>.json. */
export function demoKeypair(name: string): Keypair {
  const file = path.join(KEYS_DIR, `${name}.json`);
  if (fs.existsSync(file)) return loadKeypair(file);
  fs.mkdirSync(KEYS_DIR, { recursive: true });
  const kp = Keypair.generate();
  fs.writeFileSync(file, JSON.stringify(Array.from(kp.secretKey)), { mode: 0o600 });
  return kp;
}

/** ePLN mint authority: the dedicated faucet key once `setup-faucet.ts` ran, the deployer before that. */
export function mintAuthority(deployer: Keypair): Keypair {
  const file = path.join(KEYS_DIR, "faucet.json");
  return fs.existsSync(file) ? loadKeypair(file) : deployer;
}

export function setup() {
  const connection = new Connection(RPC_URL, "confirmed");
  const deployer = loadKeypair(WALLET_PATH);
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(deployer),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);
  const idl = JSON.parse(
    fs.readFileSync(path.join(ROOT, "target", "idl", "earmark.json"), "utf8")
  );
  const program = new Program<Earmark>(idl, provider);
  return { connection, deployer, provider, program };
}

export function configPda(programId: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], programId)[0];
}

export function readEnv(): Record<string, string> {
  if (!fs.existsSync(ENV_FILE)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(ENV_FILE, "utf8")
      .split("\n")
      .filter((l) => l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
  );
}

export function writeEnv(values: Record<string, string>) {
  const merged = { ...readEnv(), ...values };
  fs.mkdirSync(path.dirname(ENV_FILE), { recursive: true });
  fs.writeFileSync(
    ENV_FILE,
    Object.entries(merged).map(([k, v]) => `${k}=${v}`).join("\n") + "\n"
  );
}

export function explorer(kind: "address" | "tx", id: string) {
  const cluster = RPC_URL.includes("devnet")
    ? "?cluster=devnet"
    : `?cluster=custom&customUrl=${encodeURIComponent(RPC_URL)}`;
  return `https://explorer.solana.com/${kind}/${id}${cluster}`;
}

/** Tops a wallet up with SOL from the deployer (airdrop if it is a local validator). */
export async function ensureSol(
  connection: Connection,
  deployer: Keypair,
  to: PublicKey,
  minSol: number
) {
  const have = await connection.getBalance(to);
  if (have >= minSol * LAMPORTS_PER_SOL) return;
  const missing = minSol * LAMPORTS_PER_SOL - have;
  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: deployer.publicKey, toPubkey: to, lamports: missing })
  );
  await anchor.getProvider().sendAndConfirm!(tx, [deployer]);
}
