import { NextResponse } from "next/server";
import { readAll } from "@/lib/metadata-store";

// The URI stored on-chain (`metadata_uri`) points here.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = (await readAll())[id];
  return meta ? NextResponse.json(meta) : NextResponse.json({ error: "not found" }, { status: 404 });
}
