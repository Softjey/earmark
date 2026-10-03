"use client";

import type { Wallet } from "@anchor-lang/core";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProgram } from "./anchor";
import { configPda, recipientPda } from "./chain";

/** Program bound to the connected wallet, or read-only when nobody is connected. */
export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const program = useMemo(() => getProgram(connection, wallet as unknown as Wallet | undefined), [connection, wallet]);
  return { program, wallet, connection };
}

// Last successful result per cacheKey, kept for the session so revisiting a page shows data instantly
// (stale-while-revalidate) instead of a loading screen. Memory only: values hold BN / PublicKey instances.
const loadCache = new Map<string, unknown>();

/** Loads async data; `reload()` refetches without clearing what is on screen. With `cacheKey`, the last result is shown immediately while a fresh one loads. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[], pollMs?: number, cacheKey?: string) {
  const [data, setData] = useState<T | undefined>(() => (cacheKey ? (loadCache.get(cacheKey) as T | undefined) : undefined));
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(() => !(cacheKey && loadCache.has(cacheKey)));
  const loadRef = useRef(load);
  loadRef.current = load;
  const keyRef = useRef(cacheKey);
  keyRef.current = cacheKey;
  const run = useCallback(async () => {
    const key = keyRef.current;
    try {
      const result = await loadRef.current();
      if (key) loadCache.set(key, result);
      if (key === keyRef.current) {
        setData(result);
        setError(undefined);
      }
    } catch (e) {
      if (key === keyRef.current) setError(e);
    } finally {
      if (key === keyRef.current) setLoading(false);
    }
  }, []);
  // Switching to another cached key (e.g. another fundraiser) shows its cached data right away.
  useEffect(() => {
    if (!cacheKey) return;
    setData(loadCache.get(cacheKey) as T | undefined);
    setLoading(!loadCache.has(cacheKey));
  }, [cacheKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void run(), deps);
  useEffect(() => {
    if (!pollMs) return;
    const t = setInterval(run, pollMs);
    return () => clearInterval(t);
  }, [run, pollMs]);
  return { data, error, loading, reload: run };
}

/** Current unix time in seconds, refreshed every `everyMs`. */
export function useNow(everyMs = 15_000): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

/** Runs a transaction-sending action, tracking busy state and a described error. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(undefined);
    try {
      return await fn();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, error, run, clear: () => setError(undefined) };
}

/** What the connected wallet is allowed to do, so the UI shows only matching panels. */
export function useRole() {
  const { program, wallet } = useProgram();
  const me = wallet?.publicKey;
  const { data } = useLoad(
    async () => {
      if (!me) return { isVerifier: false, isRecipient: false };
      const [config, recipient] = await Promise.all([
        program.account.config.fetchNullable(configPda(program.programId)),
        program.account.recipient.fetchNullable(recipientPda(program.programId, me)),
      ]);
      return { isVerifier: !!config?.verifier.equals(me), isRecipient: !!recipient?.active };
    },
    [program, me?.toBase58()],
  );
  return data ?? { isVerifier: false, isRecipient: false };
}
