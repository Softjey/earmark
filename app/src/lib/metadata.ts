/** Off-chain, non-financial fundraiser text. Keyed by fundraiser pubkey; served by app/api/metadata. */
export type Metadata = { title: string; story: string; category?: CategoryId };

/** Purely descriptive label for browsing. The program does not know about categories. */
export const CATEGORIES = [
  { id: "medical", label: "Medical" },
  { id: "humanitarian", label: "Humanitarian aid" },
  { id: "disaster", label: "Disaster relief" },
  { id: "children", label: "Children & education" },
  { id: "animals", label: "Animals" },
  { id: "community", label: "Community & environment" },
  { id: "other", label: "Other" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const isCategory = (v: unknown): v is CategoryId => CATEGORIES.some((c) => c.id === v);
export const categoryLabel = (id?: string) => CATEGORIES.find((c) => c.id === id)?.label;

export const TITLE_MAX = 120;
export const STORY_MAX = 4000;

/** Fixed field order, so the same text always gives the same fingerprint. */
const canonical = (m: Metadata): string => JSON.stringify({ title: m.title, story: m.story, category: m.category ?? null });

/** SHA-256 of the title, story and category as base64url (43 chars). Works in the browser and in Node. */
export async function metadataHash(m: Metadata): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(m))));
  return btoa(String.fromCharCode(...digest)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * The `metadata_uri` stored on-chain. It carries the text's fingerprint, so whoever runs the metadata server cannot
 * swap the story later without donors seeing it. 109 bytes, under the program's 128-byte limit.
 */
export const metadataUri = (fundraiser: string, hash: string): string => `/api/metadata/${fundraiser}?sha256=${hash}`;

/** The fingerprint in an on-chain `metadata_uri`, or undefined for fundraisers created before it was added. */
export const anchoredHash = (uri: string): string | undefined => /[?&]sha256=([A-Za-z0-9_-]{43})(?:&|$)/.exec(uri)?.[1];

export type StoryCheck = "match" | "mismatch" | "unanchored";

export async function checkStory(uri: string, meta: Metadata): Promise<StoryCheck> {
  const expected = anchoredHash(uri);
  if (!expected) return "unanchored";
  return (await metadataHash(meta)) === expected ? "match" : "mismatch";
}

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
