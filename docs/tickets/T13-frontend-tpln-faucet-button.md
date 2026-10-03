# T13 — Frontend: tPLN faucet button

- **Priority:** P1
- **Area:** frontend
- **Depends on:** T07, T09
- **Status:** in progress (code done; run `scripts/setup-faucet.ts` on devnet to finish)
- **Owner:** —
- **Design (read before coding):** header wallet button area in any mockup (match button style from `docs/design/README.md` tokens) in [docs/design/](../design/README.md) · [canvas](https://claude.ai/artifact/5wixJuW4EKfGg4tGmjYFVt)

## Description

A *Get test tPLN* button for judges/visitors. Implemented as a Next.js API route holding the mint-authority key **only on devnet** (this is test money and not part of the trust model — say so in README).

> **⚠️ Devnet SOL budget warning.** Devnet SOL is scarce (faucet: 2 requests per 8 h; see AGENTS.md
> *Devnet budget*). A public faucet route can drain it: every new recipient needs a token account (ATA,
> ~0.002 SOL rent) and whoever pays for it loses SOL. So:
> - Use a **dedicated faucet keypair** as tPLN mint authority and fee payer, **never** the deployer wallet
>   (`~/.config/solana/id.json`, upgrade authority). Move mint authority with `spl-token authorize`; keep the key in `.env`, never commit it.
> - Cap the amount per request (e.g. 100 tPLN) and rate-limit per wallet **and** per IP.
> - Prefer the user paying for their own ATA (user signs its creation); otherwise cap total faucet spending.
> - Fund the faucet key with only a small SOL amount (e.g. 0.2 SOL).

## Acceptance criteria

- [x] Rate-limited per wallet and per IP, with a per-request amount cap
- [ ] Uses a dedicated faucet key (not the deployer wallet); funded with ≤ 0.2 SOL
- [x] Clearly labelled as devnet-only

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
