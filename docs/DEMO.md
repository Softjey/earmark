# Demo script & Q&A

## Setup (do before going on stage)

- [ ] 5 wallets in separate browser profiles (or Phantom accounts), each with devnet SOL + ePLN:
      **Verifier**, **Eye Clinic** (the demo recipient; any verified organisation behaves the same), **Organizer** (also plays the fraudster), **Donor 1**, **Donor 2**
- [ ] Recipient is already verified (`scripts/seed-demo.ts`); optionally add four more (a hospital, a relief fund, an animal shelter, a flood-recovery association) with `scripts/seed-recipients.ts` so the picker on `/new` looks populated
- [ ] Fundraiser **B** created by the seed script: target 1 000, 300 donated by Donor 1, deadline ≈ 2 min after the demo starts
- [ ] Explorer tabs open: program account (upgrade authority = none), recipient token account
- [ ] Run the production build, not `dev` (dev compiles every page on first visit): `pnpm --dir app build && pnpm --dir app start`
- [ ] Backup video recorded (T17)
- [ ] Reliable devnet RPC (Helius / QuickNode free tier): set `NEXT_PUBLIC_RPC_URL` in `app/.env.local`. The public endpoint
      rate-limits (429); the app caches transaction logs and retries, but the first load can still take 30 s+ on it.
      Open `/audit` and each demo fundraiser once before going on stage to warm the cache

## Script (~3 min)

| # | Time | Screen | Say |
|---|---|---|---|
| 0 | 15 s | Slide | "6 500 people, 500 000 zł, and Antoś never existed. The platform paid the money to the organizer; everything else was trust." |
| 1 | 30 s | `/new` as Organizer | Create "Therapy for Antoś": the recipient picker only offers verified recipients, so open *Use a different wallet address* and paste the **own wallet** as recipient → error `RecipientNotVerified`. "He can invent a story. He cannot send the money to himself." |
| 2 | 30 s | `/new` → `/recipient` | Create an honest fundraiser, 1 000 ePLN, for Eye Clinic, category *Medical*, attach the supporting document. Status *awaiting recipient*. Switch to the recipient profile → **Confirm** → Active. |
| 3 | 45 s | `/fundraisers/[id]` | Donor 1 pays 600 (60 %). Donor 2 pays 400 → target hit → **payout in the same transaction**. Explorer: vault 0, recipient +1 000. "The organizer never touched the money. Nobody held it in between." |
| 4 | 30 s | Fundraiser B | Deadline passed, target missed. Keeper running (`pnpm exec tsx scripts/keeper.ts`): within ~2 s of the deadline Donor 1's page flips to **Refunded +300**, no click (the button is only a fallback). "The Lewandowskis got their money back. 6 500 others did not. Here the refund is the same for everyone and needs nobody's permission." |
| 5 | 20 s | `/audit` | All flows public + red flags (new recipient, unusual volume). |
| 6 | 10 s | Editor | `donate` and `refund` are the only ways tokens leave the vault. Upgrade authority is *none*. |

## Video cut (~3 min, recorded)

Shorter than the live script: no editor scene, explorer shown once, fundraiser B pre-seeded. Record each
screen scene as its own clip, cut out wallet pop-ups and spinners, record the voice-over afterwards.
Animated clips come from [`video/`](../video/README.md) (`pnpm --dir video render:all`).

| # | ~Time | Clip | Content |
|---|---|---|---|
| 1 | 89 s | `intro-voice.mp4` (or `intro-lewandowski-v12.mp4` / `intro-lewandowski-v12-sarah.mp4` (ElevenLabs voice), the latest edit; v11 = "This is... Earmark." ending; v10 = same with a "bruh" and the old ending; `intro-lewandowski-v9.mp4`, 102 s, documentary meme edit with real photos and footage and music that follows the story; v8 = same with the older score; `intro-lewandowski-v7.mp4`, animated; `intro-lewandowski-v5.mp4`, 110 s: Lewandowski opening + why a blockchain, continuous music, quiet effects; `intro-lewandowski-v6-dynamic.mp4`, 102 s, same but a bit faster voice; `intro-lewandowski-v5-dynamic.mp4`, 92 s, faster still; v4 = louder effects; v3 = per-scene music; `intro-lewandowski-v2.mp4`, no music; `intro-lewandowski.mp4`, 93 s; or silent `intro.mp4`) | Antoś story → twist → fake fundraisers across causes → "Today" flow → "what if" → "With Earmark" flow → title |
| 2 | 15 s | screen + `role-organizer.mov` | `/new`, own wallet as recipient → `RecipientNotVerified` |
| 3 | 20 s | screen + `role-clinic.mov` | Create honest fundraiser → recipient **Confirm** → Active |
| 4 | 35 s | screen + `role-donor-1.mov`, `role-donor-2.mov` | 600 + 400 → payout in the same transaction; explorer: vault 0, recipient +1 000 |
| 5 | 20 s | screen + `role-donor-1.mov` | Fundraiser B, deadline passed → **Get my money back** → +300 |
| 6 | 11 s | `outro.mp4` | Four takeaways → logo |

Role badges are ProRes 4444 with alpha: place them on a track above the screen recording.

## Expected questions

**Where exactly does the intermediary disappear?**
`programs/earmark/src/instructions/donate.rs` (payout to the recipient's token account when
`raised == target`) and `refund.rs`. No other instruction moves tokens out of the vault, and the
vault's authority is a PDA, so no private key exists for it.

**What if a party disappears mid-way?**
- Organizer disappears → irrelevant, they never controlled the funds.
- Recipient never confirms → fundraiser stays `PendingConfirmation`, donations are impossible; organizer can cancel.
- Recipient disappears after confirming → deadline passes → every donor refunds on their own.

**Who can do what? Can you change anything after deployment?**
Verifier: only mark/unmark recipient wallets. Organizer: create and cancel. Recipient: confirm and cancel.
Donor: donate; refunds go only to their own wallet and are triggered by anyone (keeper or donor). Us: nothing; the upgrade authority is set to final.

**Why blockchain and not a database?**
A database is controlled by its operator, who can edit balances, pay out to anyone, or refund
selectively (exactly what happened in 2017). Here the rule "only to the recipient or back to donors" is
enforced by code that even the operator cannot bypass, and every donor can verify it without asking
anyone.

**What can't it catch?**
A fake organisation that passed verification, or a recipient colluding with an organizer. Mitigation: the
registry check (KRS/RPWDL in Poland, national registries elsewhere) and the public audit
page, which flags new recipients and unusual volume. Fundraisers for living costs (no single payee)
are out of scope.

**Is this only for medical fundraisers?**
No. The program knows only "verified recipient", "target", "deadline" and "document hash". Medical care,
humanitarian aid for a war zone, flood relief, a children's charity, an animal shelter: each needs one
identifiable payee that a verifier has checked. The category on a fundraiser is a browsing label stored off-chain.

**Next week?**
On-chain attestations (Solana Attestation Service) instead of a single verifier key; multi-sig
verifier council; registry integrations (KRS, RPWDL and EU equivalents); Polish UI translation;
milestone payouts for long treatments; municipality co-funding ("residents raise X **and** the
municipality adds Y, otherwise refund"); stablecoins (EURC/USDC); fiat on-ramp (cards / BLIK / SEPA).
