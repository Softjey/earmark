"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { FaucetButton } from "./FaucetButton";
import { CLUSTER } from "@/lib/config";
import { useRole } from "@/lib/hooks";

// The button renders differently on the server (no wallet), so skip SSR.
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

const NAV = [
  { href: "/", label: "Fundraisers" },
  { href: "/new", label: "Start a fundraiser" },
  { href: "/audit", label: "Audit" },
];

export function Header() {
  const { isVerifier, isRecipient } = useRole();
  const nav = [
    ...NAV,
    ...(isRecipient ? [{ href: "/recipient", label: "Recipient panel" }] : []),
    ...(isVerifier ? [{ href: "/verifier", label: "Verifier panel" }] : []),
  ];
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#0B6B55" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 14 L14 5 L23 14 L14 23 Z" />
            <path d="M10 14 L13 17 L18 11" />
          </svg>
          <span className="text-xl font-bold tracking-tight">Earmark</span>
        </Link>
        <nav className="flex grow flex-wrap gap-5">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="font-medium text-muted no-underline hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        {CLUSTER === "localnet" && (
          <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">localnet</span>
        )}
        <FaucetButton />
        <WalletMultiButton />
      </div>
    </header>
  );
}
