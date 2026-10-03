# T01 — Program: state, errors, init_config

- **Priority:** P0
- **Area:** program
- **Depends on:** T00
- **Status:** todo
- **Owner:** —

## Description

Define all accounts from PLAN §5 (`Config`, `Recipient`, `Fundraiser`, `Donation`, `QuoteLock`, `FundraiserStatus` enum) with explicit `InitSpace` sizes, the error enum, and `init_config(verifier, mint)`.

## Acceptance criteria

- [ ] All account structs and seeds match PLAN §5 exactly
- [ ] `init_config` can be called only once (PDA init)
- [ ] Error enum contains every error listed in PLAN §5

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
