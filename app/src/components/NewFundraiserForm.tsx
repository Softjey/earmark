"use client";

import { BN } from "@anchor-lang/core";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VerifiedBadge } from "./VerifiedBadge";
import { ErrorAlert, Field, Notice, PageTitle, btnPrimary, inputCls } from "./ui";
import { configPda, fetchRecipients, fundraiserPda } from "@/lib/chain";
import { useAction, useLoad, useProgram } from "@/lib/hooks";
import { formatDate, parseTpln } from "@/lib/format";
import { CATEGORIES, STORY_MAX, TITLE_MAX, saveMetadata, type CategoryId } from "@/lib/metadata";

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
  const [category, setCategory] = useState<CategoryId>("other");
  const [recipient, setRecipient] = useState("");
  const [custom, setCustom] = useState(false);
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState(() => localInput(new Date(Date.now() + 7 * 86400_000)));
  const [file, setFile] = useState<File>();
  const [fingerprint, setFingerprint] = useState<Uint8Array>();
  const [problem, setProblem] = useState<Problem>();
  const [warning, setWarning] = useState<string>();

  const { data: recipients } = useLoad(() => fetchRecipients(program), [program]);
  const verifiedList = recipients?.filter((r) => r.account.active) ?? [];

  const onFile = async (f?: File) => {
    setFile(f);
    setFingerprint(f ? await sha256(f) : undefined);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProblem(undefined);
    setWarning(undefined);
    if (!wallet) return setProblem({ title: "Connect your wallet", message: "Use the button in the top right corner first." });

    if (!recipient.trim()) return setProblem({ title: "Choose a recipient", message: "Pick the verified recipient that will be paid." });
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
    if (!fingerprint) return setProblem({ title: "Document missing", message: "Attach the supporting document (invoice, quote or budget)." });

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
        await saveMetadata(fundraiser.toBase58(), { title, story, category });
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
        Choose the verified recipient that will be paid. You never receive the money yourself, and the recipient must confirm the fundraiser before anyone can donate.
      </PageTitle>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <Field label="Title" htmlFor="title">
          <input id="title" required maxLength={TITLE_MAX} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Category" htmlFor="category" hint="Only helps donors browse. It has no effect on where the money can go.">
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value as CategoryId)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Story" htmlFor="story" hint="Shown to donors and stored off-chain. Don't include medical details or other personal data about people.">
          <textarea id="story" required rows={4} maxLength={STORY_MAX} value={story} onChange={(e) => setStory(e.target.value)} className={`${inputCls} py-3`} />
        </Field>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-semibold">Recipient to be paid</legend>
          {!recipients ? (
            <Notice>Loading verified recipients…</Notice>
          ) : verifiedList.length === 0 ? (
            <Notice>No verified recipients yet. A verifier has to approve a recipient first.</Notice>
          ) : (
            <div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {verifiedList.map((c) => {
                const wallet58 = c.account.wallet.toBase58();
                const selected = !custom && recipient === wallet58;
                return (
                  <label
                    key={c.pubkey.toBase58()}
                    className={`flex min-h-11 cursor-pointer flex-col gap-2 rounded-card border bg-surface p-4 hover:bg-ground ${
                      selected ? "border-accent ring-2 ring-accent-soft" : "border-field"
                    }`}
                  >
                    <input
                      type="radio"
                      name="recipient"
                      className="sr-only"
                      checked={selected}
                      onChange={() => {
                        setCustom(false);
                        setRecipient(wallet58);
                      }}
                    />
                    <span className="flex items-start justify-between gap-2">
                      <strong className="text-base">{c.account.name}</strong>
                      {selected && <VerifiedBadge label="Selected" />}
                    </span>
                    <span className="text-[13px] text-muted">Registry no. {c.account.registryId}</span>
                    <span className="text-[13px] text-muted">Verified {formatDate(c.account.verifiedAt.toNumber())}</span>
                  </label>
                );
              })}
            </div>
          )}
          <span className="text-[13px] text-muted">Only recipients verified on-chain can be chosen. The program rejects any other wallet.</span>
          <button
            type="button"
            className="self-start text-[13px] font-medium text-accent underline"
            onClick={() => {
              setCustom((v) => !v);
              setRecipient("");
            }}
          >
            {custom ? "Back to verified recipients" : "Use a different wallet address"}
          </button>
          {custom && (
            <input
              aria-label="Recipient wallet address"
              placeholder="Wallet address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={`${inputCls} font-mono text-sm`}
            />
          )}
        </fieldset>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Target (ePLN)" htmlFor="target">
            <input id="target" required inputMode="decimal" placeholder="1000" value={target} onChange={(e) => setTarget(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Deadline" htmlFor="deadline">
            <input id="deadline" type="datetime-local" required value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Supporting document" htmlFor="document" hint="An invoice, quote or budget from the recipient (PDF or image). The file stays on your device. Only its fingerprint (SHA-256) is stored on-chain.">
          <input id="document" type="file" accept="application/pdf,image/*" required onChange={(e) => onFile(e.target.files?.[0])} className={`${inputCls} py-2.5`} />
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
