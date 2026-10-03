"use client";

import { useState } from "react";
import { TxLink } from "./TxLink";
import { btnOutline } from "./ui";
import { useProgram } from "@/lib/hooks";

type Result = { kind: "ok"; amount: number; signature: string } | { kind: "error"; message: string };

/** Header button for judges and visitors: devnet test ePLN, no real value. */
export function FaucetButton() {
  const { wallet } = useProgram();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>();
  const me = wallet?.publicKey;
  if (!me) return null;

  async function claim() {
    if (!me) return;
    setBusy(true);
    setResult(undefined);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: me.toBase58() }),
      });
      const body = await res.json().catch(() => null);
      setResult(
        res.ok
          ? { kind: "ok", amount: body.amount, signature: body.signature }
          : { kind: "error", message: body?.error ?? "The faucet failed." },
      );
    } catch {
      setResult({ kind: "error", message: "Could not reach the faucet." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={btnOutline} disabled={busy} onClick={claim} title="Devnet test tokens, no real value">
        {busy ? "Minting…" : "Get test ePLN"}
      </button>
      <span role="status" className="text-sm">
        {result?.kind === "ok" && (
          <span className="text-accent">
            +{result.amount} ePLN <TxLink signature={result.signature} />
          </span>
        )}
        {result?.kind === "error" && <span className="text-error">{result.message}</span>}
      </span>
    </div>
  );
}
