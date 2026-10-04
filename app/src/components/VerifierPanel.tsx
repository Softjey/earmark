"use client";

import { PublicKey } from "@solana/web3.js";
import { useState } from "react";
import { RegistryCheck } from "./RegistryCheck";
import { ArmedButton, ErrorAlert, Field, Notice, PageTitle, btnPrimary, inputCls } from "./ui";
import { configPda, fetchRecipients } from "@/lib/chain";
import { formatDate, shortKey } from "@/lib/format";
import { useAction, useLoad, useProgram } from "@/lib/hooks";

const NAME_MAX = 64;
const REGISTRY_MAX = 32;
const bytes = (s: string) => new TextEncoder().encode(s).length;

export function VerifierPanel() {
  const { program, wallet } = useProgram();
  const verify = useAction();
  const revoke = useAction();
  const [walletInput, setWalletInput] = useState("");
  const [name, setName] = useState("");
  const [registry, setRegistry] = useState("");
  const [problem, setProblem] = useState<{ title: string; message: string }>();
  const me = wallet?.publicKey;

  const { data, error, loading, reload } = useLoad(async () => {
    const [config, recipients] = await Promise.all([
      program.account.config.fetch(configPda(program.programId)),
      fetchRecipients(program),
    ]);
    return { config, recipients };
  }, [program]);

  const isVerifier = !!(me && data?.config.verifier.equals(me));

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setProblem(undefined);
    if (!me) return;
    let target: PublicKey;
    try {
      target = new PublicKey(walletInput.trim());
    } catch {
      return setProblem({ title: "Invalid wallet", message: "That is not a valid wallet address." });
    }
    if (bytes(name) > NAME_MAX || bytes(registry) > REGISTRY_MAX)
      return setProblem({ title: "Text is too long", message: `Name: up to ${NAME_MAX} bytes. Registry number: up to ${REGISTRY_MAX} bytes.` });
    await verify.run(async () => {
      await program.methods.verifyRecipient(name.trim(), registry.trim()).accountsPartial({ verifier: me, wallet: target }).rpc();
      setWalletInput("");
      setName("");
      setRegistry("");
      await reload();
    });
  };

  const onRevoke = (recipient: PublicKey) =>
    revoke.run(async () => {
      if (!me) return;
      await program.methods.revokeRecipient().accountsPartial({ verifier: me, recipient }).rpc();
      await reload();
    });

  if (error && !data) return <ErrorAlert error={error} />;
  if (loading || !data) return <Notice>Loading…</Notice>;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex max-w-[640px] flex-col gap-4">
        <PageTitle title="Verify a recipient">
          Check the organisation in an official public registry first (healthcare provider, charity, NGO, shelter, relief agency…). Verifying only marks a wallet as a real recipient; this role can never move funds.
        </PageTitle>
        {!isVerifier && (
          <Notice>
            {me
              ? "This wallet is not the verifier, so verifying and revoking are disabled."
              : "Connect the verifier wallet to verify recipients."}{" "}
            The verifier is <span className="font-mono">{shortKey(data.config.verifier.toBase58())}</span>.
          </Notice>
        )}
        <form onSubmit={onVerify} className="flex flex-col gap-5">
          <Field label="Recipient wallet" htmlFor="wallet">
            <input id="wallet" required disabled={!isVerifier} value={walletInput} onChange={(e) => setWalletInput(e.target.value)} className={`${inputCls} font-mono text-sm`} />
          </Field>
          <Field label="Name" htmlFor="name">
            <input id="name" required disabled={!isVerifier} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Registry number" htmlFor="reg" hint="Number in the official registry you checked, with its prefix (e.g. KRS-0000123456 for a Polish NGO, RPWDL-000000018572 for a healthcare provider), so donors can check it themselves.">
            <input id="reg" required disabled={!isVerifier} value={registry} onChange={(e) => setRegistry(e.target.value)} className={inputCls} />
          </Field>
          {problem && <ErrorAlert error={problem} />}
          <ErrorAlert error={verify.error} />
          <button type="submit" className={`${btnPrimary} self-start`} disabled={!isVerifier || verify.busy}>
            {verify.busy ? "Waiting for wallet…" : "Verify recipient"}
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Verified recipients</h2>
        <ErrorAlert error={revoke.error} />
        {data.recipients.length === 0 ? (
          <Notice>No recipients verified yet.</Notice>
        ) : (
          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full text-left text-[15px]">
              <thead className="border-b border-line text-sm text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Recipient</th>
                  <th className="px-5 py-3 font-medium">Wallet</th>
                  <th className="px-5 py-3 font-medium">Verified</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.recipients.map((r) => (
                  <tr key={r.pubkey.toBase58()} className="border-b border-[#e8ecea] last:border-0">
                    <td className="px-5 py-3">
                      {r.account.name}
                      <span className="block text-sm text-muted">{r.account.registryId}</span>
                      <RegistryCheck registryId={r.account.registryId} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{shortKey(r.account.wallet.toBase58())}</td>
                    <td className="px-5 py-3">{formatDate(r.account.verifiedAt.toNumber())}</td>
                    <td className="px-5 py-3 text-right">
                      {!r.account.active ? (
                        <span className="text-sm font-semibold text-warn">Revoked</span>
                      ) : (
                        isVerifier && <ArmedButton label="Revoke" confirmLabel="Yes, revoke" disabled={revoke.busy} onConfirm={() => onRevoke(r.pubkey)} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
