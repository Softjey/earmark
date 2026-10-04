import { Connection, PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { getProgram } from "@/lib/anchor";
import { RPC_URL } from "@/lib/config";
import { STORY_MAX, TITLE_MAX, anchoredHash, isCategory, metadataHash, type Metadata } from "@/lib/metadata";
import { addOnce, readAll } from "@/lib/metadata-store";

/** The fundraiser's on-chain `metadata_uri`. Retries briefly: the create tx may not be visible to this RPC yet. */
async function onChainUri(fundraiser: PublicKey): Promise<string | null> {
  const program = getProgram(new Connection(RPC_URL, "confirmed"));
  for (let i = 0; i < 5; i++) {
    const f = await program.account.fundraiser.fetchNullable(fundraiser);
    if (f) return f.metadataUri;
    await new Promise((r) => setTimeout(r, 1_000));
  }
  return null;
}

// Non-financial text only. Nothing here decides anything about money.
export async function GET() {
  return NextResponse.json(await readAll());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { fundraiser, title, story, category } = body ?? {};
  let key: PublicKey;
  try {
    key = new PublicKey(fundraiser);
  } catch {
    return NextResponse.json({ error: "fundraiser must be a valid public key" }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim() || title.length > TITLE_MAX)
    return NextResponse.json({ error: `title is required (max ${TITLE_MAX} characters)` }, { status: 400 });
  if (typeof story !== "string" || story.length > STORY_MAX)
    return NextResponse.json({ error: `story must be at most ${STORY_MAX} characters` }, { status: 400 });

  if (category !== undefined && !isCategory(category))
    return NextResponse.json({ error: "category is not one of the known categories" }, { status: 400 });

  const meta: Metadata = { title: title.trim(), story: story.trim(), ...(category && { category }) };
  // Only text whose fingerprint the organizer put on-chain is accepted, so nobody else can claim the slot first
  // and we cannot store a different story than the one the organizer signed.
  const uri = await onChainUri(key);
  if (uri === null) return NextResponse.json({ error: "fundraiser not found on-chain" }, { status: 404 });
  const expected = anchoredHash(uri);
  if (expected && (await metadataHash(meta)) !== expected)
    return NextResponse.json({ error: "title and story do not match the fingerprint stored on-chain" }, { status: 400 });

  const created = await addOnce(fundraiser, meta);
  if (!created) return NextResponse.json({ error: "metadata already exists for this fundraiser" }, { status: 409 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
