/** Off-chain, non-financial fundraiser text. Keyed by fundraiser pubkey; served by app/api/metadata. */
export type Metadata = { title: string; story: string };

export const TITLE_MAX = 120;
export const STORY_MAX = 4000;

export async function fetchAllMetadata(): Promise<Record<string, Metadata>> {
  try {
    const res = await fetch("/api/metadata", { cache: "no-store" });
    return res.ok ? await res.json() : {};
  } catch {
    // The chain keeps working without the metadata server.
    return {};
  }
}

export async function saveMetadata(fundraiser: string, meta: Metadata): Promise<void> {
  const res = await fetch("/api/metadata", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fundraiser, ...meta }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Could not save the story");
}
