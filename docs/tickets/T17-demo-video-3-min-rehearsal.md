# T17 — Demo video (≤ 3 min) + rehearsal

- **Priority:** P0
- **Area:** pitch
- **Depends on:** T08, T10–T12
- **Status:** in progress
- **Owner:** —

## Description

Rehearse DEMO.md three times on devnet, then record the backup video and upload it publicly.

> **⚠️ Devnet SOL budget warning.** Each rehearsal creates fundraisers, vaults and token accounts (a few
> cents of SOL) and drains the demo wallets' ~0.1 SOL. Check wallet balances with `solana balance <addr> --url devnet`
> before rehearsing, top up demo wallets from the deployer instead of requesting new faucet drops (2 per 8 h),
> and do **not** redeploy the program (locks ~1.8 SOL). Re-seed with `scripts/seed-demo.ts`.

Animated parts (intro, outro, role badges) are built with Remotion in [`video/`](../../video/README.md);
the screen-recorded part follows *Video cut* in [DEMO.md](../DEMO.md).

## Acceptance criteria

- [ ] Video ≤ 3 min, public link in README
- [x] Animated intro, outro and role badges rendered from `video/`
- [ ] Rehearsal checklist in DEMO.md fully ticked

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
