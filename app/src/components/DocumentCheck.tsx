"use client";

import { useState } from "react";
import { hex, sha256 } from "@/lib/document";

type Check =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "match"; name: string }
  | { kind: "mismatch"; name: string; got: string };

/**
 * Lets anyone check that a document they were shown (e.g. the invoice an organizer posted) is exactly the one
 * fingerprinted on-chain. The file is hashed in the browser and never uploaded.
 */
export function DocumentCheck({ documentHash, confirmed }: { documentHash: number[]; confirmed: boolean }): React.ReactElement {
  const [check, setCheck] = useState<Check>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const expected = hex(documentHash);

  const onFile = async (file?: File): Promise<void> => {
    if (!file) return;
    setCheck({ kind: "busy" });
    const got = hex(await sha256(file));
    setCheck(got === expected ? { kind: "match", name: file.name } : { kind: "mismatch", name: file.name, got });
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="doc-check"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void onFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col gap-0.5 rounded-input border border-dashed px-4 py-3 text-sm ${
          dragging ? "border-accent bg-accent-soft" : "border-field bg-surface"
        }`}
      >
        <span className="font-semibold text-accent">Verify the document yourself</span>
        <span className="text-muted">
          Got the invoice or quote from the organizer? Drop it here (or click to choose it). Your browser compares its
          fingerprint with the one {confirmed ? "the recipient confirmed" : "stored"} on-chain. The file is not uploaded.
        </span>
        <input id="doc-check" type="file" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
      </label>

      {check.kind === "busy" && <p className="text-sm text-muted">Computing fingerprint…</p>}
      {check.kind === "match" && (
        <p role="status" className="rounded-input bg-accent-soft px-4 py-3 text-sm text-accent">
          <strong>✓ Match.</strong> “{check.name}” is exactly the document {confirmed ? "the recipient confirmed on-chain" : "registered on-chain"}.
        </p>
      )}
      {check.kind === "mismatch" && (
        <p role="alert" className="rounded-input bg-error-soft px-4 py-3 text-sm text-error-ink">
          <strong>✗ Not this document.</strong> “{check.name}” has fingerprint{" "}
          <span className="font-mono">{check.got.slice(0, 4)}…{check.got.slice(-4)}</span>, but the one on-chain is{" "}
          <span className="font-mono">{expected.slice(0, 4)}…{expected.slice(-4)}</span>. Even a one-byte change gives a
          different fingerprint, so this file was altered or is a different document.
        </p>
      )}
    </div>
  );
}
