# T06 — Program tests

- **Priority:** P0
- **Area:** program
- **Depends on:** T05
- **Status:** done
- **Owner:** —

## Description

TypeScript tests (`tests/earmark.ts`) covering every rule in PLAN §5. Use clock warping (LiteSVM/bankrun) or short deadlines for deadline cases.

## Acceptance criteria

- [x] Happy path: verify → create → confirm → 2 donations → auto payout
- [x] Fraud: unverified recipient rejected
- [x] Duplicate quote rejected
- [x] Refund after deadline and after cancel; double refund rejected
- [x] Cancel by stranger rejected
- [x] `anchor test` green

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
