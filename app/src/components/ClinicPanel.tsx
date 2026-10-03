"use client";

import Link from "next/link";
import { fundraiserTitle } from "./FundraiserCard";
import { StatusBadge } from "./StatusBadge";
import { TxLink } from "./TxLink";
import { ArmedButton, ErrorAlert, Notice, PageTitle, btnDark, card } from "./ui";
import { fetchActivity, fetchFundraisers, recipientPda, statusOf, type FundraiserView } from "@/lib/chain";
import { formatDate, formatTpln, shortKey } from "@/lib/format";
import { useAction, useLoad, useNow, useProgram } from "@/lib/hooks";
import { fetchAllMetadata } from "@/lib/metadata";

export function ClinicPanel() {
  const { program, wallet } = useProgram();
  const now = useNow();
  const action = useAction();
  const me = wallet?.publicKey;

  const { data, error, loading, reload } = useLoad(
    async () => {
      if (!me) return null;
      const [fundraisers, recipient, metadata] = await Promise.all([
        fetchFundraisers(program, me),
        program.account.recipient.fetchNullable(recipientPda(program.programId, me)),
        fetchAllMetadata(),
      ]);
      // The payout tx of released fundraisers, for the "Paid to you" link.
      const payouts: Record<string, string> = {};
      await Promise.all(
        fundraisers
          .filter((v) => "released" in v.account.status)
          .map(async (v) => {
            const hit = (await fetchActivity(program, v.pubkey)).find((a) => a.kind === "released");
            if (hit) payouts[v.pubkey.toBase58()] = hit.signature;
          }),
      );
      return { fundraisers, recipient, metadata, payouts };
    },
    [program, me?.toBase58()],
  );

  const send = (kind: "confirm" | "cancel", v: FundraiserView) =>
    action.run(async () => {
      if (!me) return;
      const m = kind === "confirm" ? program.methods.confirmFundraiser() : program.methods.cancel();
      await m.accountsPartial(kind === "confirm" ? { recipientWallet: me, fundraiser: v.pubkey } : { signer: me, fundraiser: v.pubkey }).rpc();
      await reload();
    });

  const header = (
    <PageTitle title="Fundraisers naming your clinic">
      Confirm only quotes you actually issued. Until you confirm, no one can donate. Funds arrive in this wallet automatically when a target is reached.
    </PageTitle>
  );

  if (!me) return <div className="flex flex-col gap-8">{header}<Notice>Connect your clinic wallet to see fundraisers that name it.</Notice></div>;
  if (error && !data) return <ErrorAlert error={error} />;
  if (loading || !data) return <Notice>Loading…</Notice>;

  const { fundraisers, recipient, metadata, payouts } = data;
  const pending = fundraisers.filter((v) => "pendingConfirmation" in v.account.status);
  const others = fundraisers.filter((v) => !("pendingConfirmation" in v.account.status));
  const title = (v: FundraiserView) => fundraiserTitle(metadata[v.pubkey.toBase58()], recipient?.name);
  const hash = (v: FundraiserView) => Buffer.from(v.account.quoteHash).toString("hex");

  return (
    <div className="flex flex-col gap-8">
      {header}
      {!recipient?.active && (
        <Notice>
          This wallet is not a verified clinic, so no fundraiser can name it. Ask the verifier to verify it first.
        </Notice>
      )}
      <ErrorAlert error={action.error} />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Awaiting your confirmation</h2>
        {pending.length === 0 && <Notice>Nothing to confirm right now.</Notice>}
        {pending.map((v) => (
          <div key={v.pubkey.toBase58()} className={`${card} flex-row flex-wrap items-center justify-between gap-4`}>
            <div className="flex min-w-72 flex-1 flex-col gap-1">
              <Link href={`/fundraisers/${v.pubkey.toBase58()}`} className="text-lg font-semibold text-ink">
                {title(v)}
              </Link>
              <span className="text-sm text-[#2b3733]">
                Target {formatTpln(v.account.target)} ePLN · deadline {formatDate(v.account.deadline.toNumber())}
              </span>
              <span className="text-sm text-muted">
                Quote fingerprint <span className="font-mono">{hash(v).slice(0, 4)}…{hash(v).slice(-4)}</span> · compare with your file
                {" · "}organizer wallet <span className="font-mono">{shortKey(v.account.organizer.toBase58())}</span>
              </span>
            </div>
            <div className="flex gap-3">
              <ArmedButton label="Reject" confirmLabel="Yes, reject" disabled={action.busy} onConfirm={() => send("cancel", v)} />
              <button type="button" className={btnDark} disabled={action.busy} onClick={() => send("confirm", v)}>
                Confirm quote
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Active and completed</h2>
        {others.length === 0 ? (
          <Notice>No active or completed fundraisers yet.</Notice>
        ) : (
          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full text-left text-[15px]">
              <thead className="border-b border-line text-sm text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Fundraiser</th>
                  <th className="px-5 py-3 font-medium">Raised</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {others.map((v) => {
                  const key = v.pubkey.toBase58();
                  const status = statusOf(v.account, now);
                  return (
                    <tr key={key} className="border-b border-[#e8ecea] last:border-0">
                      <td className="px-5 py-3">
                        <Link href={`/fundraisers/${key}`}>{title(v)}</Link>
                      </td>
                      <td className="px-5 py-3">
                        {formatTpln(v.account.raised)} / {formatTpln(v.account.target)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        {status === "released" && payouts[key] && <TxLink signature={payouts[key]} />}
                        {status === "active" && (
                          <ArmedButton label="Cancel" confirmLabel="Yes, cancel" disabled={action.busy} onConfirm={() => send("cancel", v)} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
