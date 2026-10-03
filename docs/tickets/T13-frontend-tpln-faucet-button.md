# T13 — Frontend: tPLN faucet button

- **Priority:** P1
- **Area:** frontend
- **Depends on:** T07, T09
- **Status:** todo
- **Owner:** —
- **Design (read before coding):** header wallet button area in any mockup (match button style from `docs/design/README.md` tokens) in [docs/design/](../design/README.md) · [canvas](https://claude.ai/artifact/5wixJuW4EKfGg4tGmjYFVt)

## Description

A *Get test tPLN* button for judges/visitors. Implemented as a Next.js API route holding the mint-authority key **only on devnet** (this is test money and not part of the trust model — say so in README).

## Acceptance criteria

- [ ] Rate-limited per wallet
- [ ] Clearly labelled as devnet-only

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
