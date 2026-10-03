# T06 — Program tests

- **Priority:** P0
- **Area:** program
- **Depends on:** T05
- **Status:** todo
- **Owner:** —

## Description

TypeScript tests (`tests/earmark.ts`) covering every rule in PLAN §5. Use clock warping (LiteSVM/bankrun) or short deadlines for deadline cases.

## Acceptance criteria

- [ ] Happy path: verify → create → confirm → 2 donations → auto payout
- [ ] Fraud: unverified recipient rejected
- [ ] Duplicate quote rejected
- [ ] Refund after deadline and after cancel; double refund rejected
- [ ] Cancel by stranger rejected
- [ ] `anchor test` green

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
