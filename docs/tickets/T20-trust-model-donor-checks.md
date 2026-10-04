# T20 — Trust model and donor-side checks

- **Priority:** P0
- **Area:** frontend, docs
- **Depends on:** T10, T15
- **Status:** done
- **Owner:** —

## Description

The money rules are on-chain, but two questions are still answered by trust: *is this recipient a real
organisation?* and *is this the document the recipient confirmed?* Let any donor re-check both without asking
us, and write down openly what remains trusted (verifier, collusion, real-money ramps).

- Fundraiser page and verifier panel: *Check in KRS / RPWDL yourself* opens the official registry search and
  copies the recipient's registry number (prefix in `registry_id` picks the registry).
- Fundraiser page: *Verify the document yourself*. A dropped file is hashed in the browser (never uploaded)
  and compared with the on-chain `document_hash`: ✓ match / ✗ different document.
- README *Trust model* section; DEMO Q&A answers for the verifier, wallet ownership, collusion and ePLN.

## Acceptance criteria

- [x] Registry link shown for `KRS-…` / `RPWDL-…` numbers, hidden for unknown prefixes
- [x] Document check shows a mismatch for any other file (checked in the browser on a devnet fundraiser)
- [ ] Match shown for the original file, checked live (same `sha256` helper as `/new`; needs a fundraiser created with a file we kept)
- [x] README, PLAN §2/§5/§6 and DEMO Q&A updated
- [ ] Production recipients verified with real registry numbers (demo ones are placeholders)

## Docs to update when done

README.md, PLAN.md, DEMO.md, tickets README (done in the same commit).
