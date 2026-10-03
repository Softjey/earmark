"use client";

import { BN } from "@anchor-lang/core";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorAlert, Field, Notice, PageTitle, btnPrimary, inputCls } from "./ui";
import { configPda, fetchRecipients, fundraiserPda } from "@/lib/chain";
import { useAction, useLoad, useProgram } from "@/lib/hooks";
import { parseTpln, shortKey } from "@/lib/format";
import { STORY_MAX, TITLE_MAX, saveMetadata } from "@/lib/metadata";

/** SHA-256 of the file, computed in the browser. The file itself never leaves the device. */
async function sha256(file: File): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
}

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

/** `datetime-local` value, in the user's timezone. */
function localInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

type Problem = { title: string; message: string };

export function NewFundraiserForm() {
  const { program, wallet } = useProgram();
  const router = useRouter();
  const create = useAction();
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [recipient, setRecipient] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState(() => localInput(new Date(Date.now() + 7 * 86400_000)));
  const [file, setFile] = useState<File>();
  const [fingerprint, setFingerprint] = useState<Uint8Array>();
  const [problem, setProblem] = useState<Problem>();
  const [warning, setWarning] = useState<string>();

  const { data: recipients } = useLoad(() => fetchRecipients(program), [program]);
  const clinics = recipients?.filter((r) => r.account.active) ?? [];

  const onFile = async (f?: File) => {
    setFile(f);
    setFingerprint(f ? await sha256(f) : undefined);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProblem(undefined);
    setWarning(undefined);
    if (!wallet) return setProblem({ title: "Connect your wallet", message: "Use the button in the top right corner first." });

    let recipientWallet: PublicKey;
    try {
      recipientWallet = new PublicKey(recipient.trim());
    } catch {
      return setProblem({ title: "Invalid recipient", message: "That is not a valid wallet address." });
    }
    const units = parseTpln(target);
    if (units === null) return setProblem({ title: "Invalid target", message: "Enter a target greater than zero, e.g. 1000." });
    const deadlineSec = Math.floor(new Date(deadline).getTime() / 1000);
    if (!Number.isFinite(deadlineSec) || deadlineSec <= Date.now() / 1000)
      return setProblem({ title: "Invalid deadline", message: "Choose a deadline that is still in the future." });
    if (!fingerprint) return setProblem({ title: "Quote missing", message: "Attach the clinic's quote as a PDF." });

    await create.run(async () => {
      const config = await program.account.config.fetch(configPda(program.programId));
      const id = new BN(Date.now());
      const fundraiser = fundraiserPda(program.programId, wallet.publicKey, id);
      // Only the hash and a link go on-chain; the title and story stay in the metadata JSON.
      await program.methods
        .createFundraiser(id, new BN(units.toString()), new BN(deadlineSec), Array.from(fingerprint), `/api/metadata/${fundraiser.toBase58()}`)
        .accountsPartial({ organizer: wallet.publicKey, recipientWallet, mint: config.mint })
        .rpc();
      try {
        await saveMetadata(fundraiser.toBase58(), { title, story });
      } catch (err) {
        // The fundraiser exists and works without its text; don't lose the user on a metadata hiccup.
        setWarning(`The fundraiser was created, but its title and story could not be saved (${(err as Error).message}).`);
        return;
      }
      router.push(`/fundraisers/${fundraiser.toBase58()}`);
    });
  };

  return (
    <div className="flex max-w-[720px] flex-col gap-8">
      <PageTitle title="Start a fundraiser">
        Choose the clinic that will be paid. You never receive the money yourself, and the clinic must confirm the quote before anyone can donate.
      </PageTitle>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <Field label="Title" htmlFor="title">
          <input id="title" required maxLength={TITLE_MAX} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Story" htmlFor="story" hint="Shown to donors and stored off-chain. Don't include medical details or other personal data.">
          <textarea id="story" required rows={4} maxLength={STORY_MAX} value={story} onChange={(e) => setStory(e.target.value)} className={`${inputCls} py-3`} />
        </Field>
        <Field label="Recipient wallet" htmlFor="recipient" hint="Pick a verified clinic below or paste a wallet address.">
          <input id="recipient" required value={recipient} onChange={(e) => setRecipient(e.target.value)} className={`${inputCls} font-mono text-sm`} />
          <div className="flex flex-wrap gap-2">
            {clinics.map((c) => (
              <button
                type="button"
                key={c.pubkey.toBase58()}
                onClick={() => setRecipient(c.account.wallet.toBase58())}
                className="min-h-11 rounded-full border border-field bg-surface px-4 text-sm font-medium hover:bg-ground"
                title={shortKey(c.account.wallet.toBase58())}
              >
                {c.account.name}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Target (tPLN)" htmlFor="target">
            <input id="target" required inputMode="decimal" placeholder="1000" value={target} onChange={(e) => setTarget(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Deadline" htmlFor="deadline">
            <input id="deadline" type="datetime-local" required value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Clinic's quote (PDF)" htmlFor="quote" hint="The file stays on your device. Only its fingerprint (SHA-256) is stored on-chain.">
          <input id="quote" type="file" accept="application/pdf" required onChange={(e) => onFile(e.target.files?.[0])} className={`${inputCls} py-2.5`} />
          {file && fingerprint && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-input bg-ground px-4 py-3 text-sm">
              <span>{file.name}</span>
              <span className="font-mono text-muted">
                fingerprint {hex(fingerprint).slice(0, 4)}…{hex(fingerprint).slice(-4)}
              </span>
            </div>
          )}
        </Field>

        {problem && <ErrorAlert error={problem} />}
        <ErrorAlert error={create.error} />
        {warning && <Notice>{warning}</Notice>}
        <button type="submit" className={btnPrimary} disabled={create.busy}>
          {create.busy ? "Waiting for wallet…" : "Create fundraiser"}
        </button>
      </form>
    </div>
  );
}
