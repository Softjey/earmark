# T03 — Program: create_fundraiser / confirm_fundraiser

- **Priority:** P0
- **Area:** program
- **Depends on:** T02
- **Status:** done
- **Owner:** —

## Description

Organizer creates a fundraiser for a recipient wallet; the clinic confirms it. The quote hash can be used once (`QuoteLock`).

## Acceptance criteria

- [x] Recipient without an active `Recipient` account → custom `RecipientNotVerified` (not a generic Anchor error; take the account as `UncheckedAccount` and validate owner/discriminator manually)
- [x] `target == 0` → `InvalidTarget`; `deadline <= now` → `DeadlineInPast`
- [x] Same `quote_hash` twice → `QuoteAlreadyUsed`
- [x] Vault token account (PDA, authority = fundraiser) is created here
- [x] Only the recipient wallet can confirm; status must be `PendingConfirmation`

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
