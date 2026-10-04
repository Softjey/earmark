"use client";

import { useState } from "react";
import { parseRegistryId } from "@/lib/registry";

/** "Check in KRS ↗": opens the official registry search and copies the number, so anyone can redo the verifier's check. */
export function RegistryCheck({ registryId }: { registryId: string }): React.ReactElement | null {
  const [copied, setCopied] = useState(false);
  const ref = parseRegistryId(registryId);
  if (!ref) return null;

  const copy = (): void => {
    navigator.clipboard?.writeText(ref.number).then(
      () => setCopied(true),
      () => {},
    );
  };

  return (
    <a
      href={ref.searchUrl}
      target="_blank"
      rel="noreferrer"
      onClick={copy}
      title={`Opens the official ${ref.name} search. Paste the number ${ref.number} there.`}
      className="text-sm font-semibold text-accent hover:underline"
    >
      {copied ? `Number copied · paste it in ${ref.short} ↗` : `Check in ${ref.short} yourself ↗`}
    </a>
  );
}
