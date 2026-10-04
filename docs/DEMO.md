# Demo script & Q&A

## Setup (do before going on stage)

- [ ] 5 wallets in separate browser profiles (or Phantom accounts), each with devnet SOL + ePLN:
      **Verifier**, **Eye Clinic** (the demo recipient; any verified organisation behaves the same), **Organizer** (also plays the fraudster), **Donor 1**, **Donor 2**
- [ ] Recipient is already verified (`scripts/seed-demo.ts`); optionally add four more (a hospital, a relief fund, an animal shelter, a flood-recovery association) with `scripts/seed-recipients.ts` so the picker on `/new` looks populated
- [ ] Fundraiser **B** created by the seed script: target 1 000, 300 donated by Donor 1, deadline ≈ 2 min after the demo starts
- [ ] Two files on the desktop for the Q&A: the invoice you attach in step 2, and an edited copy of it
      (to show *Verify the document yourself*: original → ✓ match, edited → ✗ not this document)
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
| 1 | 124 s | **`intro-lewandowski-v12-sarah.mp4` (final)**: `pnpm --dir video render:intro-lewandowski-v12-sarah` (earlier cuts: see video/README.md) | Lewandowski hook → Antoś story → twist → fake fundraisers across causes → "Today" flow → "what if" → "With Earmark" flow → title |
| 2 | 15 s | screen + `role-organizer.mov` | `/new`, own wallet as recipient → `RecipientNotVerified` |
| 3 | 20 s | screen + `role-clinic.mov` | Create honest fundraiser → recipient **Confirm** → Active |
| 4 | 35 s | screen + `role-donor-1.mov`, `role-donor-2.mov` | 600 + 400 → payout in the same transaction; explorer: vault 0, recipient +1 000 |
| 5 | 20 s | screen + `role-donor-1.mov` | Fundraiser B, deadline passed → **Get my money back** → +300 |
| 6 | 11 s | `outro.mp4` | Four takeaways → logo |

Role badges are ProRes 4444 with alpha: place them on a track above the screen recording.

## Expected questions

Short versions. Full answers, each with what the MVP does and what a production system would do: [QA.md](QA.md).

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

**Who is the verifier? Isn't that just a new intermediary?**
Today it is one key we hold. But an intermediary has two powers: deciding *where the money goes* and
deciding *who is legitimate*. The verifier has only the second, and it is bounded: it cannot move,
freeze or redirect money, every verification is public with the registry number in it, and the
fundraiser page has a *Check in KRS / RPWDL yourself* link, so a donor repeats the check instead of
trusting us. Worst case (key stolen): a fake recipient, visible and flagged on `/audit`. In production
it should not be us: a multisig of independent parties (NGO federation, law firm, partner bank), later
attestations from parties that already verify organisations, such as a bank's KYB.

**How do you know the wallet really belongs to the clinic?**
Once per organisation: the organisation signs "KRS X controls wallet Y" with the wallet, and the verifier
confirms it **through the contact data in the official registry** (registered address, e-mail, ePUAP),
never through contacts the applicant supplied. A hospital does not have to run crypto software itself;
a custodial wallet with a regulated provider works.

**What can't it catch?**
A fake organisation that passed verification, or a recipient colluding with an organizer. We don't hide
it, but the cost of fraud changes: before, an anonymous person took the money and vanished; now a
registered legal entity, with a registry number, an address and a board, has to sign on-chain that the
document is theirs, and the trail is public forever. Anyone shown the invoice can drop it on the
fundraiser page (*Verify the document yourself*) and see whether it is exactly the confirmed one. `/audit` flags new recipients, unusual volume and
repeated cancellations. Fundraisers for living costs (no single payee) are out of scope.

**ePLN isn't real money. How does a donor pay with BLIK, and how does the clinic get złoty?**
ePLN stands in for a regulated stablecoin (EURC, or a PLN e-money token under MiCA); the program
takes any mint. A card/BLIK on-ramp is a payment rail, not an intermediary: it converts currency,
but the destination is fixed by the program before the donor pays. The clinic off-ramps through its
own bank *after* the money has arrived, like any incoming transfer.

**What if the treatment doesn't happen after the payout?**
The program's guarantee ends when the money reaches the recipient, and we say so. But now a registered organisation
that confirmed the invoice on-chain holds it, not an anonymous person, and every donor's wallet and amount is public.
Returning unspent money is its legal duty; an on-chain *return to donors* instruction is a next step.

**Why all or nothing? 95 % raised and the patient gets nothing?**
Left out of the MVP on purpose: one invoice has one price, so the safe default is refunding everyone. In production the
recipient sets a `min_target` when it confirms (e.g. it accepts 80 % because another fund covers the rest), and a
co-funder can commit the gap conditionally. Both are rules fixed before the first donation.

**Can the organizer post the same invoice twice?**
The same file, no: its hash is locked to one fundraiser. An edited copy has a new hash, so then the check is the
recipient, which would have to confirm the same invoice twice under its own name.

**You store the story. Can you change it?**
Not unnoticed: its SHA-256 is in the on-chain `metadata_uri`, the server accepts only matching text, and the
fundraiser page recomputes the hash and shows a warning if it differs. We could still take it offline.

**Is this only for medical fundraisers?**
No. The program knows only "verified recipient", "target", "deadline" and "document hash". Medical care,
humanitarian aid for a war zone, flood relief, a children's charity, an animal shelter: each needs one
identifiable payee that a verifier has checked. The category on a fundraiser is a browsing label stored off-chain.

**Next week?**
On-chain attestations (Solana Attestation Service) instead of a single verifier key; multi-sig
verifier council; registry integrations (KRS, RPWDL and EU equivalents); Polish UI translation;
milestone payouts for long treatments; municipality co-funding ("residents raise X **and** the
municipality adds Y, otherwise refund"); stablecoins (EURC/USDC); fiat on-ramp (cards / BLIK / SEPA).
