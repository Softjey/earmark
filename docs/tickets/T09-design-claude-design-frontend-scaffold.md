# T09 — Design (Claude Design) + frontend scaffold

- **Priority:** P0
- **Area:** frontend
- **Depends on:** T00
- **Status:** todo
- **Owner:** —

## Description

Make the UI design in Claude Design (list, fundraiser page, create, clinic panel, verifier panel, audit page), then scaffold `app/` with Next.js App Router, Tailwind, wallet adapter (Phantom, Backpack), Anchor client from IDL, and design tokens from the design.

## Acceptance criteria

- [ ] Design link added to README
- [ ] Wallet connect works on localnet and devnet (cluster from env)
- [ ] IDL is copied/generated into `app/` by a script, not by hand
- [ ] Shared components: `ProgressBar`, `StatusBadge`, `VerifiedBadge`, `TxLink` (explorer)

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
