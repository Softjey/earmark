/**
 * Public registries a verifier checks a recipient against. Neither registry offers a stable deep link to one
 * entry, so the app opens the official search page and copies the number for the donor to paste.
 */
const REGISTRIES = [
  { prefix: "KRS", name: "KRS (National Court Register)", searchUrl: "https://wyszukiwarka-krs.ms.gov.pl/" },
  { prefix: "RPWDL", name: "RPWDL (healthcare providers)", searchUrl: "https://rpwdl.ezdrowie.gov.pl/" },
] as const;

export interface RegistryRef {
  /** Short label, e.g. "KRS". */
  short: string;
  name: string;
  searchUrl: string;
  number: string;
}

/** "KRS-0000123456", "KRS 0000123456" or "RPWDL-000000018572" → registry + bare number; unknown prefixes → null. */
export function parseRegistryId(registryId: string): RegistryRef | null {
  const m = registryId.trim().match(/^([A-Za-z]+)[\s:#-]*(.+)$/);
  if (!m) return null;
  const reg = REGISTRIES.find((r) => r.prefix === m[1].toUpperCase());
  return reg ? { short: reg.prefix, name: reg.name, searchUrl: reg.searchUrl, number: m[2].trim() } : null;
}
