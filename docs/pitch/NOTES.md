# Pitch speaker notes

Notes for the 7-slide deck ([earmark-pitch.pdf](earmark-pitch.pdf), source [pitch.html](pitch.html)).
Aim for about 2 minutes of slides, then the demo ([DEMO.md](../DEMO.md)). The slides tell **why**; the demo shows
**how**, so don't explain the flow step by step here.

One sentence to remember: **"He can invent a story. He cannot receive the money."**

---

## 1. Title (10 s)

- "Earmark: fundraisers where the money can only go to a verified recipient, or back to the donors. Never to the
  organizer."
- Built on Solana for Superteam Poland's *Finance Without Intermediaries*.

## 2. Problem (25 s)

- "In 2017, 6 500 people donated 500 000 złoty to save the sight of a boy named Antoś. Antoś didn't exist."
- "The platform paid the organizer, and he spent it on himself. Everything else was trust."
- Key point: **more vetting doesn't fix it**. It just moves the trust from the organizer to the platform, and the platform
  still holds the money and decides payouts and refunds.

## 3. Solution (30 s)

- "Money sits in a vault owned by the program. No one has a private key for it, including us."
- "It has exactly two exits: to the verified recipient, automatically, in the same transaction as the donation that
  reaches the target; or back to each donor if the fundraiser is cancelled or misses its deadline."
- Point at the red pill: "The organizer is never a possible destination."
- Why blockchain: "A database operator can edit balances and pay anyone. That's what went wrong in 2017. Here the rule
  is code that even its authors can't bypass, and anyone can check every transfer."

## 4. Remaining trust (25 s)

Say it before the judges do:
- "We don't remove all trust. One question is left: does this wallet really belong to this organisation?"
- "The verifier answers it once per organisation, from the official registry (KRS, RPWDL). It **cannot move money**.
  If its key leaks, the worst case is a fake recipient, and that is visible on-chain and flagged on /audit."
- "Anyone can repeat the check: the registry number is on-chain and the page links to the official search."
- "In production the verifier isn't us: a multisig of independent parties, then bank KYB attestations."
- Collusion: "If the organizer and the recipient collude, the thief is a registered organisation signing the invoice
  on-chain under its own name, not an anonymous person."

## 5. Built at HackYeah (15 s)

- "All of it works end to end on devnet: the Anchor program with 23 tests, the web app at earmark.help, an audit page,
  and a keeper bot that refunds donors automatically."
- "No medical or personal data on-chain, only document hashes. ePLN is a test token; the program takes any stablecoin."
- Then: **"Let me show you."** → go to the demo.

## 6. Beyond medical (15 s, can go after the demo)

- "Medical fundraisers are the start because the stakes are highest. The same primitive, money that can only be
  spent as intended, works for disaster relief paid to suppliers, grants on milestones, benefits, and city co-funding."
- Next steps, pick two: multisig verifier, regulated PLN/EUR stablecoin with BLIK, a pilot with a Polish hospital
  or foundation.

## 7. Try it (5 s)

- Leave it on screen during Q&A. "Everything is public: the app, the code and the program on devnet."

---

## Q&A cheat sheet

Full answers with MVP vs production detail are in [QA.md](../QA.md). Rule: **say honestly what the MVP does today,
then name the production mechanism.**

### The likely ones

| Question | Answer |
|---|---|
| **Isn't the verifier just a new intermediary?** | An intermediary has two powers: deciding where money goes and deciding who is legitimate. The program removed the first completely. The verifier keeps only the second, can't move a token, and in production it's a multisig whose check anyone can redo (qualified e-signature of a board member, KRS API). |
| **Organizer and clinic collude (fake invoice, kickback)?** | Not prevented, and we don't claim it is. What changes is who commits the fraud: a registered entity that confirmed the invoice on-chain, with a permanent public trail. /audit flags unusual volume and repeated cancellations. |
| **Can you, the team, take the money or change rules?** | There's no instruction that pays us. The upgrade authority is set to final, so nobody can change the program. ⚠️ **Only say "final" if it really is.** Otherwise: "it's still the deployer while we fix bugs, and gets frozen after the last upgrade". |
| **What if the treatment doesn't happen after payout?** | The program's guarantee ends at the clinic. But the money is now with a registered organisation, and every donor's wallet and amount is public, so a refund is easy and enforceable. Production: a `return_to_donors` instruction (pro rata) and milestone payouts. |
| **Why all or nothing?** | One invoice, one price: 70 % of a surgery buys no surgery. In production the recipient can set a minimum target before the first donation, and co-funders can top up. |
| **My grandmother has no wallet.** | She shouldn't know it's crypto: email/passkey login with an embedded wallet, pay by card or BLIK, fees sponsored by the app. The on-ramp only converts currency; the destination is already fixed. |
| **Doesn't the on-ramp bring the intermediary back?** | No. An intermediary decides where money goes. An on-ramp only converts PLN into a stablecoin. |
| **Why a blockchain and not a database?** | A database operator can edit balances or refund selectively. Here the rule is code even we can't bypass, and anyone can verify it. |
| **Siepomaga / Zrzutka already exist.** | There the platform still holds the money and decides payouts and refunds; it can freeze funds or change terms. Here nobody holds it, refunds need nobody's permission, and the platform fee disappears. |
| **Is the keeper bot a central point?** | No. It only pays the fee for refunds anyone may send, and it can't choose the destination. If it's down, donors click *Get my money back* themselves. |

### If there is time

| Question | Answer |
|---|---|
| **Business model?** | Not from the money flow: no fee, no exit to us. An optional tip in a separate transfer, paid tools for recipient organisations, public-good grants. |
| **Legal, MiCA, AML?** | The program holds nobody's money; regulated parts sit at the edges with licensed partners (on-ramp and custody do KYC/AML). Public collections are run by the recipient or a partner foundation. |
| **GDPR, medical data?** | Nothing personal on-chain, only SHA-256 hashes. Stories are off-chain and can be deleted. |
| **Why Solana?** | Fees are a fraction of a cent and transactions confirm in under a second, and the payout happens in the same transaction as the last donation. |
| **Audited?** | Not yet. It's a hackathon build with program tests. Real money needs an external audit first. The program is small on purpose: two token exits. |
| **Is ePLN real money?** | It's a devnet stand-in. The mint is one config field, so a regulated PLN e-money token or EURC can replace it. |

### Don't

- Don't claim the program stops collusion or verifies the real world. It bounds and exposes it.
- Don't call the upgrade authority final unless it is (check the program on Explorer before going on stage).
- Don't say "clinic" for the product in general; say "recipient". Medical is just the first example.
