# T04 — Program: donate with automatic payout

- **Priority:** P0
- **Area:** program
- **Depends on:** T03
- **Status:** done
- **Owner:** —

## Description

Core instruction. Transfers donor → vault, records `Donation` (init_if_needed), caps the amount at `target - raised`, and when `raised == target` transfers the whole vault to the recipient's ATA and sets `Released` in the same transaction.

## Acceptance criteria

- [x] Not `Active` → `NotActive`; `now >= deadline` → `DeadlinePassed`
- [x] Over-donation is capped, never rejected
- [x] Payout happens in the same tx that hits the target
- [x] Recipient ATA is created if missing (`init_if_needed`, payer = donor)
- [x] Emits `DonationMade` and `FundraiserReleased` events

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
