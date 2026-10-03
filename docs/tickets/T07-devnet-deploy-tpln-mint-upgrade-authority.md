# T07 — Devnet deploy, tPLN mint, upgrade authority

- **Priority:** P0
- **Area:** infra
- **Depends on:** T06
- **Status:** todo
- **Owner:** —

## Description

Scripts to deploy to devnet, create the tPLN SPL mint (6 decimals), call `init_config`, and airdrop tPLN to demo wallets. Document the program ID and mint in README.

## Acceptance criteria

- [ ] `scripts/deploy-devnet.sh` deploys and prints the program ID
- [ ] `scripts/create-mint.ts` creates tPLN and writes the address to `app/.env.local`
- [ ] `scripts/airdrop.ts <wallet> <amount>` works
- [ ] Before the final demo: `solana program set-upgrade-authority <ID> --final` (documented, run manually)

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
