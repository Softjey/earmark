# T16 — Pitch deck (≤ 10 slides, PDF)

- **Priority:** P0
- **Area:** pitch
- **Depends on:** T15
- **Status:** done
- **Owner:** —

## Description

Problem (Antoś), who trusts whom, redesign, live demo slot, where the intermediary disappears, why blockchain, limitations, next steps, team.

### Slide: "Who verifies the verifier?" (trust slide)

Answers the first question judges ask. Full text in [QA.md](../QA.md#isnt-the-verifier-just-a-new-intermediary).

- **Headline:** "The verifier decides who is real. It can never decide where the money goes."
- **Left, two columns:** *An intermediary today:* decides where money goes ✓, decides who is legitimate ✓.
  *Earmark verifier:* where money goes ✗ (no instruction touches tokens), who is legitimate ✓ (public, checkable).
- **Right, a ladder "from trust to proof"** (MVP at the bottom, production above):
  1. MVP: one key, registry number on-chain, *Check in KRS yourself* link
  2. Qualified e-signature by a board member: "KRS X controls wallet Y", hash on-chain, anyone can validate it
  3. Registry data from the open KRS API, not typed by hand
  4. M-of-N multisig of independent parties (NGO federation, law firm, bank) + 72 h public objection window
  5. Bank KYB attestations via Solana Attestation Service
- **Speaker line:** "We did not remove trust. We shrank it to one public yes/no question, and in production you won't
  have to trust our answer, you'll be able to check the signature yourself."

## Acceptance criteria

- [x] ≤ 10 slides, exported as PDF to `docs/pitch/earmark-pitch.pdf` (7 slides, source `docs/pitch/pitch.html`)

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
