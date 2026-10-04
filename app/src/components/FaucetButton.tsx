"use client";

import { useEffect, useRef, useState } from "react";
import { TxLink } from "./TxLink";
import { btnDark, btnOutline, inputCls } from "./ui";
import { useProgram } from "@/lib/hooks";
import { rampEnabled, rampUrl } from "@/lib/ramp";

type Result = { kind: "ok"; amount: number; signature: string } | { kind: "error"; message: string };

const PRESETS = [100, 1000, 10000];

/** Header button for judges and visitors: devnet test ePLN, no real value. Opens a small panel to pick the amount. */
export function FaucetButton() {
  const { wallet } = useProgram();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("100");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>();
  const root = useRef<HTMLDivElement>(null);
  const me = wallet?.publicKey;

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!me) return null;

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setBusy(true);
    setResult(undefined);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: me.toBase58(), amount: Number(amount) }),
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
    <div ref={root} className="relative">
      <button type="button" className={btnOutline} aria-expanded={open} onClick={() => setOpen((v) => !v)} title="Devnet test tokens, no real value">
        Get test ePLN
      </button>
      {open && (
        <form
          onSubmit={claim}
          className="absolute right-0 z-20 mt-2 flex w-[300px] flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-lg"
        >
          <label htmlFor="faucet-amount" className="text-sm font-semibold">
            Amount (ePLN)
          </label>
          <input
            id="faucet-amount"
            inputMode="numeric"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            className={inputCls}
          />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setAmount(String(p))}
                className="min-h-9 rounded-full border border-field bg-surface px-3 text-sm font-medium hover:bg-ground"
              >
                {p.toLocaleString("en-US")}
              </button>
            ))}
          </div>
          <button type="submit" className={btnDark} disabled={busy || !amount}>
            {busy ? "Minting…" : "Mint"}
          </button>
          <span role="status" className="text-sm">
            {result?.kind === "ok" && (
              <span className="text-accent">
                +{result.amount.toLocaleString("en-US")} ePLN <TxLink signature={result.signature} />
              </span>
            )}
            {result?.kind === "error" && <span className="text-error">{result.message}</span>}
          </span>
          {rampEnabled && (
            <div className="flex flex-col gap-1.5 border-t border-line pt-3">
              <a href={rampUrl(me.toBase58())} target="_blank" rel="noreferrer" className={`${btnOutline} justify-center`}>
                Buy with a card (Ramp) ↗
              </a>
              <span className="text-xs text-muted">
                Ramp&apos;s sandbox sells devnet SOL for network fees to this wallet with a test card. In production the same widget sells
                the stablecoin you donate with, so no exchange account is needed.
              </span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
