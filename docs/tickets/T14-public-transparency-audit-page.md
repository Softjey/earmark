# T14 — Public transparency & audit page

- **Priority:** P1
- **Area:** frontend
- **Depends on:** T10
- **Status:** done
- **Owner:** —
- **Design (read before coding):** `Audit.dc.html` (`/audit`) in [docs/design/](../design/README.md) · [canvas](https://claude.ai/artifact/5wixJuW4EKfGg4tGmjYFVt)

## Description

`/audit`: every fundraiser, donation, payout and refund from on-chain data, plus red-flag rules computed client-side.

## Acceptance criteria

- [x] Rules: recipient verified < 7 days ago; recipient with > 3 fundraisers in 7 days; target above 10× the median; past-deadline fundraisers with unrefunded funds; organizer with many cancelled fundraisers
- [x] Each flag links to the accounts/txs that triggered it

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
