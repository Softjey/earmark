"use client";

import { FundraiserCard } from "./FundraiserCard";
import { ErrorAlert, Notice } from "./ui";
import { fetchFundraisers, fetchRecipients, recipientsByWallet } from "@/lib/chain";
import { useLoad, useNow, useProgram } from "@/lib/hooks";
import { fetchAllMetadata } from "@/lib/metadata";

export function FundraiserList() {
  const { program } = useProgram();
  const now = useNow();
  const { data, error, loading } = useLoad(
    async () => {
      const [fundraisers, recipients, metadata] = await Promise.all([
        fetchFundraisers(program),
        fetchRecipients(program),
        fetchAllMetadata(),
      ]);
      return { fundraisers, recipients: recipientsByWallet(recipients), metadata };
    },
    [program],
    20_000,
  );

  if (error && !data) return <ErrorAlert error={error} />;
  if (loading) return <Notice>Loading fundraisers…</Notice>;
  if (!data?.fundraisers.length) return <Notice>No fundraisers yet. Be the first to start one.</Notice>;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
      {data.fundraisers.map((view) => (
        <FundraiserCard
          key={view.pubkey.toBase58()}
          view={view}
          meta={data.metadata[view.pubkey.toBase58()]}
          recipient={data.recipients.get(view.account.recipient.toBase58())}
          now={now}
        />
      ))}
    </div>
  );
}
