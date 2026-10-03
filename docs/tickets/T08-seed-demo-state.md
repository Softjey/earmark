# T08 — Seed demo state

- **Priority:** P0
- **Area:** infra
- **Depends on:** T07
- **Status:** in progress
- **Owner:** —

## Description

`scripts/seed-demo.ts` puts devnet in the exact state DEMO.md expects: verified Eye Clinic, funded wallets, fundraiser B with 300 donated and a deadline N seconds from now.

## Acceptance criteria

- [x] One command resets the demo state
- [x] `--deadline-in <seconds>` flag for fundraiser B
- [x] Prints all wallet addresses and explorer links

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.

_Verified against a local validator only; re-run on devnet after T07._
