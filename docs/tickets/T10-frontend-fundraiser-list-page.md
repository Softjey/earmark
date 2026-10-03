# T10 — Frontend: fundraiser list & page

- **Priority:** P0
- **Area:** frontend
- **Depends on:** T09, T04
- **Status:** todo
- **Owner:** —

## Description

`/` lists all fundraisers (getProgramAccounts). `/fundraisers/[pubkey]` shows story, progress, recipient with verified badge, Donate form, Get my money back button (when refundable), and explorer links for every tx.

## Acceptance criteria

- [ ] Program errors are shown in plain English (map error codes → messages)
- [ ] After a donation the page refreshes without reload
- [ ] Released fundraisers show the payout tx link

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
