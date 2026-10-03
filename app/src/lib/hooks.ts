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

/** Loads async data; `reload()` refetches without clearing what is on screen. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[], pollMs?: number) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;
  const run = useCallback(async () => {
    try {
      setData(await loadRef.current());
      setError(undefined);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);
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
      if (!me) return { isVerifier: false, isClinic: false };
      const [config, recipient] = await Promise.all([
        program.account.config.fetchNullable(configPda(program.programId)),
        program.account.recipient.fetchNullable(recipientPda(program.programId, me)),
      ]);
      return { isVerifier: !!config?.verifier.equals(me), isClinic: !!recipient?.active };
    },
    [program, me?.toBase58()],
  );
  return data ?? { isVerifier: false, isClinic: false };
}
