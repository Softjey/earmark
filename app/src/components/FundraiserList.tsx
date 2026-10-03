"use client";

import { FundraiserCard } from "./FundraiserCard";
import { ErrorAlert, Notice } from "./ui";
import {
  fetchFundraisers,
  fetchRecipients,
  recipientsByWallet,
} from "@/lib/chain";
import { useLoad, useNow, useProgram } from "@/lib/hooks";
import { useState } from "react";
import { CATEGORIES, fetchAllMetadata, type CategoryId } from "@/lib/metadata";

export function FundraiserList() {
  const { program } = useProgram();
  const now = useNow();
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const { data, error, loading } = useLoad(
    async () => {
      const [fundraisers, recipients, metadata] = await Promise.all([
        fetchFundraisers(program),
        fetchRecipients(program),
        fetchAllMetadata(),
      ]);
      return {
        fundraisers,
        recipients: recipientsByWallet(recipients),
        metadata,
      };
    },
    [program],
    20_000,
    "fundraisers"
  );

  if (error && !data) return <ErrorAlert error={error} />;
  if (loading) return <Notice>Loading fundraisers…</Notice>;
  if (!data?.fundraisers.length)
    return <Notice>No fundraisers yet. Be the first to start one.</Notice>;

  const shown = data.fundraisers.filter(
    (v) =>
      category === "all" ||
      data.metadata[v.pubkey.toBase58()]?.category === category
  );
  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm ${
      active
        ? "border-ink bg-ink text-white"
        : "border-line bg-surface text-ink hover:border-field"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by category"
      >
        <button
          type="button"
          className={chip(category === "all")}
          onClick={() => setCategory("all")}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={chip(category === c.id)}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      {shown.length === 0 && (
        <Notice>No fundraisers in this category yet.</Notice>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
        {shown.map((view) => (
          <FundraiserCard
            key={view.pubkey.toBase58()}
            view={view}
            meta={data.metadata[view.pubkey.toBase58()]}
            recipient={data.recipients.get(view.account.recipient.toBase58())}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}
