# T09 — Design (Claude Design) + frontend scaffold

- **Priority:** P0
- **Area:** frontend
- **Depends on:** T00
- **Status:** done
- **Owner:** —
- **Design (read before coding):** all screens; tokens table in [docs/design/](../design/README.md) · [canvas](https://claude.ai/artifact/5wixJuW4EKfGg4tGmjYFVt)

## Description

Make the UI design in Claude Design (list, fundraiser page, create, clinic panel, verifier panel, audit page), then scaffold `app/` with Next.js App Router, Tailwind, wallet adapter (Phantom, Backpack), Anchor client from IDL, and design tokens from the design.

## Acceptance criteria

- [x] Design link added to README (mockups + tokens in `docs/design/`)
- [x] Wallet connect works on localnet and devnet (cluster from env: `NEXT_PUBLIC_CLUSTER`, `NEXT_PUBLIC_RPC_URL`); wallets are detected via Wallet Standard (Phantom, Backpack). Builds and type-checks; not yet clicked through with a real wallet extension
- [x] IDL is copied/generated into `app/src/idl` by `scripts/sync-idl.ts` (runs on `pnpm --dir app dev|build`), not by hand
- [x] Shared components: `ProgressBar`, `StatusBadge`, `VerifiedBadge`, `TxLink` (explorer) in `app/src/components`

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
