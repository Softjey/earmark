# T13 — Frontend: tPLN faucet button

- **Priority:** P1
- **Area:** frontend
- **Depends on:** T07, T09
- **Status:** todo
- **Owner:** —

## Description

A *Get test tPLN* button for judges/visitors. Implemented as a Next.js API route holding the mint-authority key **only on devnet** (this is test money and not part of the trust model — say so in README).

## Acceptance criteria

- [ ] Rate-limited per wallet
- [ ] Clearly labelled as devnet-only

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
