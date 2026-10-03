# T19 — Generalize beyond medical fundraisers

- **Priority:** P0
- **Area:** program, frontend, docs
- **Depends on:** T12
- **Status:** in progress
- **Owner:** —

## Description

Earmark started with medical fundraisers, but the rule (money only to one verified payee or back to the
donors) fits any cause: humanitarian aid, disaster relief, children's charities, animal shelters, schools.
Remove medical wording and assumptions from the program, app and docs.

- Program: `quote_hash` → `document_hash`, `QuoteLock` → `DocumentLock` (seed `"quote"` → `"document"`),
  `QuoteAlreadyUsed` → `DocumentAlreadyUsed`, neutral error text. Behaviour is unchanged.
- App: `/clinic` → `/recipient`, all "clinic" copy → "recipient", supporting document may be a PDF or an image,
  optional off-chain `category` on a fundraiser (browsing label + filter on `/`, never read by the program).
- Scripts: `seed-clinics.ts` → `seed-recipients.ts` with a mix of recipient types.
- Docs: PLAN, README, DEMO, AGENTS updated.

## Acceptance criteria

- [x] No "clinic" / "quote" / "medical" wording left in the program or in app UI copy (except examples)
- [x] `anchor test --validator legacy` passes (23 tests)
- [x] Category selectable on `/new`, shown on cards and the fundraiser page, filterable on `/`
- [ ] Devnet program upgraded to the renamed build (needs ~1.8 SOL temporarily; see AGENTS.md *Devnet budget*)
- [ ] Demo video intro and voice-over reworded (they still tell only the medical story)

## Docs to update when done

PLAN.md §5/§6, README.md, DEMO.md, tickets README (done in the same commit).
