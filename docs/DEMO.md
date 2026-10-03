# Demo script & Q&A

## Setup (do before going on stage)

- [ ] 5 wallets in separate browser profiles (or Phantom accounts), each with devnet SOL + ePLN:
      **Verifier**, **Eye Clinic**, **Organizer** (also plays the fraudster), **Donor 1**, **Donor 2**
- [ ] Clinic is already verified (`scripts/seed-demo.ts`); optionally add four more with `scripts/seed-clinics.ts` so the picker on `/new` looks populated
- [ ] Fundraiser **B** created by the seed script: target 1 000, 300 donated by Donor 1, deadline ≈ 2 min after the demo starts
- [ ] Explorer tabs open: program account (upgrade authority = none), clinic token account
- [ ] Backup video recorded (T17)
- [ ] Reliable devnet RPC (Helius / QuickNode free tier): set `NEXT_PUBLIC_RPC_URL` in `app/.env.local`. The public endpoint
      rate-limits (429); the app caches transaction logs and retries, but the first load can still take 30 s+ on it.
      Open `/audit` and each demo fundraiser once before going on stage to warm the cache

## Script (~3 min)

| # | Time | Screen | Say |
|---|---|---|---|
| 0 | 15 s | Slide | "6 500 people, 500 000 zł, and Antoś never existed. The platform paid the money to the organizer; everything else was trust." |
| 1 | 30 s | `/new` as Organizer | Create "Therapy for Antoś": the clinic picker only offers verified clinics, so open *Use a different wallet address* and paste the **own wallet** as recipient → error `RecipientNotVerified`. "He can invent a story. He cannot send the money to himself." |
| 2 | 30 s | `/new` → `/clinic` | Create an honest fundraiser, 1 000 ePLN, for Eye Clinic, attach quote PDF. Status *awaiting clinic*. Switch to the clinic profile → **Confirm** → Active. |
| 3 | 45 s | `/fundraisers/[id]` | Donor 1 pays 600 (60 %). Donor 2 pays 400 → target hit → **payout in the same transaction**. Explorer: vault 0, clinic +1 000. "The organizer never touched the money. Nobody held it in between." |
| 4 | 30 s | Fundraiser B | Deadline passed, target missed. Donor 1 → **Get my money back** → +300. "The Lewandowskis got their money back. 6 500 others did not. Here the refund is the same for everyone and needs nobody's permission." |
| 5 | 20 s | `/audit` | All flows public + red flags (new recipient, unusual volume). |
| 6 | 10 s | Editor | `donate` and `refund` are the only ways tokens leave the vault. Upgrade authority is *none*. |

## Expected questions

**Where exactly does the intermediary disappear?**
`programs/earmark/src/instructions/donate.rs` (payout to the recipient's token account when
`raised == target`) and `refund.rs`. No other instruction moves tokens out of the vault, and the
vault's authority is a PDA, so no private key exists for it.

**What if a party disappears mid-way?**
- Organizer disappears → irrelevant, they never controlled the funds.
- Clinic never confirms → fundraiser stays `PendingConfirmation`, donations are impossible; organizer can cancel.
- Clinic disappears after confirming → deadline passes → every donor refunds on their own.

**Who can do what? Can you change anything after deployment?**
Verifier: only mark/unmark clinic wallets. Organizer: create and cancel. Clinic: confirm and cancel.
Donor: donate and refund their own donation. Us: nothing; the upgrade authority is set to final.

**Why blockchain and not a database?**
A database is controlled by its operator, who can edit balances, pay out to anyone, or refund
selectively (exactly what happened in 2017). Here the rule "only to the clinic or back to donors" is
enforced by code that even the operator cannot bypass, and every donor can verify it without asking
anyone.

**What can't it catch?**
A fake clinic that passed verification, or a clinic colluding with an organizer. Mitigation: the
registry check (RPWDL/KRS in Poland, national healthcare registries elsewhere) and the public audit
page, which flags new recipients and unusual volume. Fundraisers for living costs (no single payee)
are out of scope.

**Next week?**
On-chain attestations (Solana Attestation Service) instead of a single verifier key; multi-sig
verifier council; healthcare registry integrations (RPWDL and EU equivalents); Polish UI translation;
milestone payouts for long treatments; municipality co-funding ("residents raise X **and** the
municipality adds Y, otherwise refund"); stablecoins (EURC/USDC); fiat on-ramp (cards / BLIK / SEPA).
