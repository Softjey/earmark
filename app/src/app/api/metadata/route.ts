import { PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { STORY_MAX, TITLE_MAX, isCategory } from "@/lib/metadata";
import { addOnce, readAll } from "@/lib/metadata-store";

// Non-financial text only. Nothing here decides anything about money.
export async function GET() {
  return NextResponse.json(await readAll());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { fundraiser, title, story, category } = body ?? {};
  try {
    new PublicKey(fundraiser);
  } catch {
    return NextResponse.json({ error: "fundraiser must be a valid public key" }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim() || title.length > TITLE_MAX)
    return NextResponse.json({ error: `title is required (max ${TITLE_MAX} characters)` }, { status: 400 });
  if (typeof story !== "string" || story.length > STORY_MAX)
    return NextResponse.json({ error: `story must be at most ${STORY_MAX} characters` }, { status: 400 });

  if (category !== undefined && !isCategory(category))
    return NextResponse.json({ error: "category is not one of the known categories" }, { status: 400 });

  const created = await addOnce(fundraiser, { title: title.trim(), story: story.trim(), ...(category && { category }) });
  if (!created) return NextResponse.json({ error: "metadata already exists for this fundraiser" }, { status: 409 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
