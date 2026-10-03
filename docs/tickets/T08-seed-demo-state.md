# T08 — Seed demo state

- **Priority:** P0
- **Area:** infra
- **Depends on:** T07
- **Status:** todo
- **Owner:** —

## Description

`scripts/seed-demo.ts` puts devnet in the exact state DEMO.md expects: verified Eye Clinic, funded wallets, fundraiser B with 300 donated and a deadline N seconds from now.

## Acceptance criteria

- [ ] One command resets the demo state
- [ ] `--deadline-in <seconds>` flag for fundraiser B
- [ ] Prints all wallet addresses and explorer links

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
