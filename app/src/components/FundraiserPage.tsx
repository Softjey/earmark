"use client";

import { categoryLabel } from "@/lib/metadata";
import { BN } from "@anchor-lang/core";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";
import { fundraiserTitle } from "./FundraiserCard";
import { DocumentCheck } from "./DocumentCheck";
import { ProgressBar } from "./ProgressBar";
import { RegistryCheck } from "./RegistryCheck";
import { StatusBadge } from "./StatusBadge";
import { TxLink } from "./TxLink";
import { ArmedButton, ErrorAlert, Notice, btnDark, btnPrimary, card, inputCls } from "./ui";
import { VerifiedBadge } from "./VerifiedBadge";
import {
  configPda,
  donationPda,
  fetchActivity,
  isRefundable,
  recipientPda,
  statusOf,
  type ActivityItem,
} from "@/lib/chain";
import { useAction, useLoad, useNow, useProgram } from "@/lib/hooks";
import { formatDate, formatDateTime, formatTpln, parseTpln, shortKey, timeAgo, timeLeft } from "@/lib/format";
import { checkStory, fetchAllMetadata } from "@/lib/metadata";

const CODE_URL = "https://github.com/Softjey/earmark/blob/main/programs/earmark/src/instructions/donate.rs";

function ActivityRow({ item, now, me }: { item: ActivityItem; now: number; me?: PublicKey | null }) {
  const amount = item.amount ? <strong>{formatTpln(item.amount)} ePLN</strong> : null;
  const who = item.wallet ? (
    me?.equals(item.wallet) ? (
      "you"
    ) : (
      <>
        a donor <span className="font-mono text-xs text-muted">({shortKey(item.wallet.toBase58())})</span>
      </>
    )
  ) : null;
  const text = {
    created: <>Fundraiser created</>,
    confirmed: <>Recipient confirmed the fundraiser</>,
    donation: <>Donation · {amount} from {who}</>,
    released: <>Target reached · {amount} paid to the recipient</>,
    cancelled: <>Fundraiser cancelled</>,
    refund: <>Refund · {amount} to {who}</>,
  }[item.kind];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-[#e8ecea] py-3 last:border-0">
      <span className="min-w-60 flex-1">{text}</span>
      <span className="text-sm text-muted">{timeAgo(item.blockTime, now)}</span>
      <TxLink signature={item.signature} />
    </div>
  );
}

export function FundraiserPage({ pubkey }: { pubkey: string }) {
  const { program, wallet } = useProgram();
  const now = useNow();
  const donate = useAction();
  const refund = useAction();
  const respond = useAction();
  const [amount, setAmount] = useState("100");
  const [justDonated, setJustDonated] = useState<string>();

  const key = useMemo(() => {
    try {
      return new PublicKey(pubkey);
    } catch {
      return null;
    }
  }, [pubkey]);
  const me = wallet?.publicKey;

  const { data, error, loading, reload } = useLoad(
    async () => {
      if (!key) return null;
      const fundraiser = await program.account.fundraiser.fetchNullable(key);
      if (!fundraiser) return null;
      const [recipient, config, meta, donation] = await Promise.all([
        program.account.recipient.fetchNullable(recipientPda(program.programId, fundraiser.recipient)),
        program.account.config.fetch(configPda(program.programId)),
        fetchAllMetadata().then((all) => all[key.toBase58()]),
        me ? program.account.donation.fetchNullable(donationPda(program.programId, key, me)) : null,
      ]);
      const storyCheck = meta ? await checkStory(fundraiser.metadataUri, meta) : undefined;
      return { fundraiser, recipient, config, meta, donation, storyCheck };
    },
    [program, key?.toBase58(), me?.toBase58()],
    15_000,
    key ? `fundraiser:${key.toBase58()}:${me?.toBase58() ?? ""}` : undefined,
  );
  // The history needs many RPC calls; it loads on its own so the page does not wait for it.
  const { data: activityData, reload: reloadActivity } = useLoad(
    async () => (key ? fetchActivity(program, key) : []),
    [program, key?.toBase58()],
    15_000,
    key ? `activity:${key.toBase58()}` : undefined,
  );
  const activityReady = activityData !== undefined;
  const activity = activityData ?? [];

  // While the keeper is sending this donor's refund, check often so it shows up within seconds.
  const awaitingRefund = !!data && isRefundable(statusOf(data.fundraiser, now)) && !!data.donation && !data.donation.refunded;
  useEffect(() => {
    if (!awaitingRefund) return;
    const t = setInterval(() => void reload(), 3_000);
    return () => {
      clearInterval(t);
      void reloadActivity(); // history is heavy: refresh it once, when the refund has landed
    };
  }, [awaitingRefund, reload, reloadActivity]);

  if (!key) return <Notice>This is not a valid fundraiser address.</Notice>;
  if (error && !data) return <ErrorAlert error={error} />;
  if (loading) return <Notice>Loading fundraiser…</Notice>;
  if (!data) return <Notice>Fundraiser not found on this network.</Notice>;

  const { fundraiser: f, recipient, config, meta, donation, storyCheck } = data;
  const status = statusOf(f, now);
  const deadline = f.deadline.toNumber();
  const target = BigInt(f.target.toString());
  const raised = BigInt(f.raised.toString());
  const remaining = target - raised;
  const refundable = isRefundable(status);
  const sorted = [...activity].sort(
    (a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0) || Number(b.kind === "released") - Number(a.kind === "released"),
  );
  const donors = new Set(activity.filter((a) => a.kind === "donation").map((a) => a.wallet?.toBase58())).size;
  const payout = activity.find((a) => a.kind === "released");
  const myRefund = me && activity.find((a) => a.kind === "refund" && a.wallet?.equals(me));
  const refundedTotal = activity.filter((a) => a.kind === "refund").reduce((s, a) => s + BigInt(a.amount!.toString()), 0n);
  const recipientName = recipient?.name ?? "Unverified recipient";

  const units = parseTpln(amount);
  const accepted = units === null ? null : units > remaining ? remaining : units;

  const onDonate = () =>
    donate.run(async () => {
      if (!wallet || accepted === null) return;
      const donorToken = getAssociatedTokenAddressSync(config.mint, wallet.publicKey);
      const sig = await program.methods
        .donate(new BN(units!.toString()))
        .accountsPartial({ donor: wallet.publicKey, fundraiser: key, donorToken, recipientWallet: f.recipient, mint: config.mint })
        .rpc();
      setJustDonated(sig);
      await Promise.all([reload(), reloadActivity()]);
    });

  const onRefund = () =>
    refund.run(async () => {
      if (!wallet) return;
      const donorToken = getAssociatedTokenAddressSync(config.mint, wallet.publicKey);
      await program.methods.refund().accountsPartial({ caller: wallet.publicKey, donor: wallet.publicKey, fundraiser: key, donorToken }).rpc();
      await Promise.all([reload(), reloadActivity()]);
    });

  const isRecipient = !!me && me.equals(f.recipient);
  const onRespond = (kind: "confirm" | "cancel") =>
    respond.run(async () => {
      if (!me) return;
      const m = kind === "confirm" ? program.methods.confirmFundraiser() : program.methods.cancel();
      await m.accountsPartial(kind === "confirm" ? { recipientWallet: me, fundraiser: key } : { signer: me, fundraiser: key }).rpc();
      await Promise.all([reload(), reloadActivity()]);
    });

  return (
    <div className="flex flex-wrap items-start gap-8">
      <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <StatusBadge
            status={status}
            detail={status === "active" ? `ends ${formatDate(deadline)}` : status === "deadlinePassed" ? undefined : undefined}
          />
          <h1 className="text-[40px] font-bold leading-[1.15] tracking-tight">{fundraiserTitle(meta, recipient?.name)}</h1>
          <p className="text-muted">
            {refundable ? (
              <>
                {categoryLabel(meta?.category) && <>{categoryLabel(meta?.category)} · </>}For <strong>{recipientName}</strong> · {status === "cancelled" ? "cancelled" : `ended ${formatDateTime(deadline)}`}
              </>
            ) : (
              <>
                {categoryLabel(meta?.category) && <>{categoryLabel(meta?.category)} · </>}For <strong>{recipientName}</strong> · ends {formatDate(deadline)}
              </>
            )}
          </p>
        </div>

        {refundable && (
          <div className={card}>
            <h2 className="text-xl font-semibold">What happens now</h2>
            <p className="text-[#2b3733]">
              {status === "cancelled"
                ? "This fundraiser was cancelled, so the recipient will not be paid. "
                : `The fundraiser collected ${formatTpln(f.raised)} of ${formatTpln(f.target)} ePLN before its deadline, so the recipient will not be paid. `}
              Every donor can take their own donation back from the vault. Nobody has to approve it, and nobody can stop it.
            </p>
          </div>
        )}

        {meta?.story && (
          <div className={card}>
            <h2 className="text-xl font-semibold">Story</h2>
            <p className="whitespace-pre-wrap text-[#2b3733]">{meta.story}</p>
            {storyCheck === "match" && (
              <p className="text-xs text-muted">✓ This text matches the fingerprint the organizer stored on-chain, so nobody has edited it since.</p>
            )}
            {storyCheck === "mismatch" && (
              <p className="rounded-input bg-warn-soft px-3 py-2 text-sm font-semibold text-warn">
                This text does not match the fingerprint stored on-chain. It was changed after the fundraiser was created.
              </p>
            )}
            {storyCheck === "unanchored" && (
              <p className="text-xs text-muted">Created before stories were fingerprinted on-chain; this text cannot be checked.</p>
            )}
          </div>
        )}

        <div className={`${card} gap-4`}>
          <h2 className="text-xl font-semibold">Who gets the money</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-button bg-accent-soft">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0B6B55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M12 9v6" />
                <path d="M9 12h6" />
              </svg>
            </div>
            <div className="flex min-w-60 flex-1 flex-col gap-0.5">
              <span className="text-lg font-semibold">{recipientName}</span>
              <span className="text-sm text-muted">
                {recipient
                  ? `Registry no. ${recipient.registryId} · verified ${formatDate(recipient.verifiedAt.toNumber())}`
                  : "No verification record"}
              </span>
              {recipient && <RegistryCheck registryId={recipient.registryId} />}
            </div>
            {recipient?.active ? (
              <VerifiedBadge />
            ) : (
              <span className="rounded-full bg-warn-soft px-3 py-1.5 text-[13px] font-semibold text-warn">Verification revoked</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-input bg-ground px-4 py-3 text-sm text-[#2b3733]">
            <span>Supporting document · {status === "pendingConfirmation" ? "waiting for the recipient to confirm" : "confirmed by the recipient on-chain"}</span>
            <span className="font-mono text-muted">
              SHA-256 {Buffer.from(f.documentHash).toString("hex").slice(0, 4)}…{Buffer.from(f.documentHash).toString("hex").slice(-4)}
            </span>
          </div>
          <DocumentCheck documentHash={f.documentHash} confirmed={status !== "pendingConfirmation"} />
          <p className="text-xs text-muted">
            On-chain details: recipient wallet{" "}
            <a href={`https://explorer.solana.com/address/${f.recipient.toBase58()}`} target="_blank" rel="noreferrer" className="font-mono">
              {shortKey(f.recipient.toBase58())} ↗
            </a>{" "}
            · organizer wallet <span className="font-mono">{shortKey(f.organizer.toBase58())}</span>
          </p>
        </div>

        <div className={`${card} gap-1`}>
          <h2 className="mb-3 text-xl font-semibold">Activity</h2>
          {status === "deadlinePassed" && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-[#e8ecea] py-3">
              <span className="min-w-60 flex-1">
                Deadline passed · vault holds <strong>{activityReady ? `${formatTpln((raised - refundedTotal).toString())} ePLN` : "…"}</strong>
              </span>
              <span className="text-sm text-muted">{timeAgo(deadline, now)}</span>
            </div>
          )}
          {sorted.length ? sorted.map((a, i) => <ActivityRow key={`${a.signature}-${a.kind}-${i}`} item={a} now={now} me={me} />) : <span className="text-muted">{activityReady ? "No activity yet." : "Loading activity…"}</span>}
        </div>
      </section>

      <aside className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
        <div className={`${card} gap-4`}>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[32px] font-bold tracking-tight">{formatTpln(f.raised)}</span>
            <span className="text-muted">of {formatTpln(f.target)} ePLN</span>
          </div>
          <ProgressBar raised={f.raised.toNumber()} target={f.target.toNumber()} thick muted={refundable} />
          <div className="flex justify-between text-sm text-muted">
            <span>
              {activityReady ? `${donors} donor${donors === 1 ? "" : "s"}` : "…"}
            </span>
            <span>{status === "active" || status === "pendingConfirmation" ? timeLeft(deadline, now) : "ended"}</span>
          </div>

          {status === "active" && (
            <>
              <label htmlFor="amount" className="text-sm font-semibold">
                Amount
              </label>
              <div className="flex min-h-12 items-center rounded-input border border-field bg-surface px-3.5 focus-within:border-accent">
                <input
                  id="amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="min-w-0 flex-1 border-0 bg-transparent text-lg font-semibold outline-none"
                />
                <span className="text-muted">ePLN</span>
              </div>
              <p className="text-[13px] text-muted">
                {accepted === null
                  ? "Enter an amount greater than zero."
                  : units! >= remaining
                    ? `${formatTpln(remaining.toString())} ePLN completes the target${units! > remaining ? " (the program caps your donation there)" : ""}. The recipient is paid in the same transaction.`
                    : `${formatTpln((remaining - units!).toString())} ePLN would still be missing after your donation.`}
              </p>
              <button type="button" className={btnPrimary} disabled={!wallet || accepted === null || donate.busy} onClick={onDonate}>
                {!wallet ? "Connect a wallet to donate" : donate.busy ? "Waiting for wallet…" : `Donate ${accepted === null ? "" : formatTpln(accepted.toString())} ePLN`}
              </button>
              <ErrorAlert error={donate.error} />
              {justDonated && (
                <div className="rounded-input bg-accent-soft p-3 text-sm text-accent">
                  Thank you! Your donation is in. <TxLink signature={justDonated} />
                </div>
              )}
            </>
          )}

          {status === "pendingConfirmation" && (
            <p className="rounded-input bg-info-soft p-3 text-sm text-info">
              {isRecipient
                ? "This fundraiser names your wallet. Check the document fingerprint against your file, then confirm or reject it. Donations open after you confirm."
                : `Waiting for ${recipientName} to confirm the fundraiser. Donations open after the recipient confirms.`}
            </p>
          )}
          {status === "pendingConfirmation" && isRecipient && (
            <>
              <ErrorAlert error={respond.error} />
              <div className="flex flex-wrap gap-3">
                <button type="button" className={btnDark} disabled={respond.busy} onClick={() => onRespond("confirm")}>
                  Confirm fundraiser
                </button>
                <ArmedButton label="Reject" confirmLabel="Yes, reject" disabled={respond.busy} onConfirm={() => onRespond("cancel")} />
              </div>
            </>
          )}

          {status === "released" && (
            <p className="rounded-input bg-accent-soft p-3 text-sm text-accent">
              Target reached. {formatTpln(f.target)} ePLN was paid to {recipientName} automatically.
              {payout && (
                <>
                  {" "}
                  <TxLink signature={payout.signature} label="Payout transaction" />
                </>
              )}
            </p>
          )}

          {refundable && (
            <>
              <div className="flex items-center justify-between border-t border-line pt-4">
                <span className="text-sm text-muted">Your donation in the vault</span>
                <span className="font-semibold">
                  {donation && !donation.refunded ? `${formatTpln(donation.amount)} ePLN` : "0 ePLN"}
                </span>
              </div>
              {donation && !donation.refunded ? (
                <>
                  <p className="text-[13px] text-muted">
                    Your refund is being sent automatically, straight from the vault to your wallet. No click needed.
                  </p>
                  <button type="button" className={btnPrimary} disabled={refund.busy} onClick={onRefund}>
                    {refund.busy ? "Waiting for wallet…" : "Get it now myself"}
                  </button>
                  <p className="text-[13px] text-muted">Nobody can redirect it: only your own token account can receive it.</p>
                </>
              ) : (
                <p className="text-[13px] text-muted">
                  {!wallet ? "Connect the wallet you donated with to claim your refund." : donation?.refunded ? "You already took your donation back." : "This wallet has no donation in this fundraiser."}
                </p>
              )}
              <ErrorAlert error={refund.error} />
            </>
          )}
        </div>

        {myRefund && myRefund.amount && (
          <div className="flex items-start gap-3 rounded-card bg-accent-soft p-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B6B55" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden>
              <path d="M5 12l5 5L20 7" />
            </svg>
            <span>
              Refunded · <strong>+{formatTpln(myRefund.amount)} ePLN</strong> · <TxLink signature={myRefund.signature} />
            </span>
          </div>
        )}

        {!refundable && (
          <div className="flex flex-col gap-3.5 rounded-card bg-accent-soft p-6">
            <h2 className="text-[17px] font-semibold">Where your money can go</h2>
            <Rule icon="check">
              To <strong>{recipientName}</strong>, automatically, when the target is reached.
            </Rule>
            <Rule icon="back">
              <strong>Back to you</strong> if the fundraiser is cancelled or misses its deadline. You claim it yourself, no one can refuse.
            </Rule>
            <Rule icon="no">Never to the organizer, and never to us. These rules are in the program and cannot be changed.</Rule>
            <a href={CODE_URL} target="_blank" rel="noreferrer" className="text-sm font-medium">
              See the rule in the code ↗
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}

const ICON: Record<string, { stroke: string; paths: string[] }> = {
  check: { stroke: "#0B6B55", paths: ["M5 12l5 5L20 7"] },
  back: { stroke: "#0B6B55", paths: ["M9 14L4 9l5-5", "M4 9h11a5 5 0 0 1 0 10h-3"] },
  no: { stroke: "#A3261B", paths: ["M6 6l12 12", "M18 6L6 18"] },
};

function Rule({ icon, children }: { icon: keyof typeof ICON; children: React.ReactNode }) {
  const { stroke, paths } = ICON[icon];
  return (
    <div className="flex items-start gap-3">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden>
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
      <span className="text-[15px]">{children}</span>
    </div>
  );
}
