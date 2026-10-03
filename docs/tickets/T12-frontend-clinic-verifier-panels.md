# T12 — Frontend: clinic & verifier panels

- **Priority:** P0
- **Area:** frontend
- **Depends on:** T09, T03
- **Status:** in progress (code done; wallet transactions not yet smoke-tested in a browser)
- **Owner:** —
- **Design (read before coding):** `Clinic.dc.html` (`/clinic`), `Verifier.dc.html` (`/verifier`) in [docs/design/](../design/README.md) · [canvas](https://claude.ai/artifact/5wixJuW4EKfGg4tGmjYFVt)

## Description

`/clinic`: fundraisers addressed to the connected wallet, with Confirm / Cancel. `/verifier`: form to verify a wallet (name, registry no.) and list of verified recipients.

## Acceptance criteria

- [x] Panels show only actions the connected wallet is allowed to do
- [x] Verifier panel hidden/disabled for non-verifier wallets

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
