# T05 — Program: cancel / refund

- **Priority:** P0
- **Area:** program
- **Depends on:** T04
- **Status:** todo
- **Owner:** —

## Description

`cancel` by recipient or organizer moves `PendingConfirmation | Active` → `Cancelled`. `refund` lets a donor withdraw their own donation if `Cancelled`, or if `Active && now >= deadline`.

## Acceptance criteria

- [ ] Anyone else calling cancel → `Unauthorized`
- [ ] Refund on `Released` or before deadline → `NotRefundable`
- [ ] Second refund → `AlreadyRefunded`
- [ ] Refund only ever goes to the donor's own token account
- [ ] Emits `Refunded` event

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
