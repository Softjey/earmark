# T14 — Public transparency & audit page

- **Priority:** P1
- **Area:** frontend
- **Depends on:** T10
- **Status:** todo
- **Owner:** —

## Description

`/audit`: every fundraiser, donation, payout and refund from on-chain data, plus red-flag rules computed client-side.

## Acceptance criteria

- [ ] Rules: recipient verified < 7 days ago; recipient with > 3 fundraisers in 7 days; target above 10× the median; past-deadline fundraisers with unrefunded funds; organizer with many cancelled fundraisers
- [ ] Each flag links to the accounts/txs that triggered it

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
