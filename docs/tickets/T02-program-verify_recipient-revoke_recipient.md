# T02 — Program: verify_recipient / revoke_recipient

- **Priority:** P0 (revoke: P1)
- **Area:** program
- **Depends on:** T01
- **Status:** done
- **Owner:** —

## Description

`verify_recipient(name, registry_id)` signed by `config.verifier` creates `Recipient` for the given wallet. `revoke_recipient` sets `active = false`.

## Acceptance criteria

- [x] Non-verifier signer → `Unauthorized`
- [x] Name ≤ 64 bytes, registry_id ≤ 32 bytes enforced
- [x] Revoked recipient cannot get new fundraisers or donations

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
