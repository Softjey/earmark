import { NextResponse } from "next/server";
import { FaucetError, claimTpln } from "@/lib/faucet";

// Devnet test tokens only; see lib/faucet.ts. Not part of the trust model: nothing here touches fundraiser money.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const wallet = body?.wallet;
  if (typeof wallet !== "string") return NextResponse.json({ error: "wallet is required" }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  try {
    return NextResponse.json(await claimTpln(wallet, ip));
  } catch (e) {
    if (e instanceof FaucetError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("faucet failed", e);
    return NextResponse.json({ error: "The faucet failed. Please try again in a moment." }, { status: 500 });
  }
}
