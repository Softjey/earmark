# Judge Q&A

Prepared answers for the Q&A after the demo. Each answer has three parts:

- **Say:** one or two sentences to say out loud.
- **Today (MVP):** what the hackathon build does. Be honest about it.
- **In production:** the concrete mechanism a real system would use. Name it; don't argue "because".

The short versions of the most common questions are also in [DEMO.md](DEMO.md#expected-questions). Facts about the
build are in [PLAN.md](PLAN.md) and the *Trust model* and *Limitations* sections of [README.md](../README.md).

---

## 1. Trust: is there still an intermediary?

### Isn't the verifier just a new intermediary?

**Say:** An intermediary has two powers: deciding where the money goes, and deciding who is legitimate. The program
took away the first one completely. The verifier keeps only the second, it cannot move a single token, and in
production even that check is one anyone can repeat.

**Today (MVP):** One key held by the team. It can create or revoke a `Recipient` record (name and registry number).
It cannot move, freeze or redirect money, or create, confirm or cancel fundraisers. Every verification is a public
transaction, and the fundraiser page links to the official registry (*Check in KRS / RPWDL yourself*).

**In production:** Four layers, each removing a piece of trust:

1. **Proof anyone can check:** the organisation's board member signs the statement *"Organisation KRS X controls
   wallet Y"* with a **qualified electronic signature** (eIDAS) or a Polish *podpis zaufany*. The hash of the signed
   file goes on-chain with the `Recipient` record and the file is published. Anyone can validate the signature with the
   government's signature checker and see in KRS that the signer is on the board. The verifier stops being someone you
   trust and becomes someone whose work you can redo.
2. **Registry data fetched automatically:** the verifier panel reads the entry from the open KRS API (and RPWDL / EU
   registries) instead of a human typing it, so the name and number cannot be mistyped or invented.
3. **No single key:** `config.verifier` becomes an M-of-N multisig (e.g. Squads) of independent parties: an NGO
   federation, a law firm, a partner bank. One bribed or hacked member cannot verify anyone.
4. **Challenge window:** a new recipient becomes active only after e.g. 72 hours on a public list, during which anyone
   can object. Later, verification can come from parties that already check organisations for a living, for example a
   bank's KYB check, published as an attestation through the Solana Attestation Service.

### How do you know a wallet really belongs to the clinic?

**Say:** The organisation signs a message with that wallet, and we confirm it through the contact data in the official
registry, never through contacts the applicant gave us. Once per organisation, not per fundraiser.

**Today (MVP):** A written manual procedure (README, *Trust model*). Demo recipients use placeholder registry numbers.

**In production:** The qualified-signature statement above, plus a signed challenge from the wallet. Most clinics
would not run a wallet themselves: a regulated custodian or their bank holds it, and the custodian's KYB on the
organisation is a second, independent proof of ownership.

### What if the verifier key is stolen, or the verifier is bribed?

**Say:** The worst case is a fake recipient appearing, publicly, with a registry number anyone can check. Nobody can
take money that is already in a vault, because the verifier has no instruction that touches money.

**Today (MVP):** One key; the audit page flags recipients verified less than 7 days ago that already appear in a
fundraiser.

**In production:** M-of-N multisig, the 72-hour challenge window, and a public signed proof for every verification,
so a fake one needs several parties to sign something checkably false, under their own names.

### What stops a fake organisation that passes verification?

**Say:** It has to be a real entry in a state registry, with a registered address and a board. Faking that is a crime
with names attached, not an anonymous post.

**Today (MVP):** Registry number on-chain and a one-click check. Audit page red flags.

**In production:** Registry data fetched by API (no hand-typed entries), periodic re-checks (see *verification
expiry* below), bank KYB attestations, and a public objection window before a new recipient goes live.

### What if the organizer and the clinic collude, for example a fake invoice and a kickback?

**Say:** The program does not stop that, and we don't claim it does. What changes is who commits the fraud: a
registered organisation, signing an invoice on-chain under its own name, with a permanent public trail.

**Today (MVP):** Recipient's on-chain confirmation of the document hash; *Verify the document yourself* lets anyone
check an invoice they were shown; audit flags for unusual volume and repeated cancellations.

**In production:** The same, plus the recipient stays accountable after payout (see *After the payout* below), and
the public data lets journalists, regulators and the verifier council spot a clinic that confirms many fundraisers
for one organizer. Collusion detection becomes a public data problem instead of a platform's internal one.

### Can you, the team, change the rules or take the money?

**Say:** Once the upgrade authority is set to final, no. The program becomes code that nobody, including us, can change.

**Today (MVP):** The upgrade authority is still the deployer wallet, because we were still fixing bugs. Show it in
the explorer and say so; the plan is to freeze it after the last upgrade.

**In production:** One of two options, chosen in public: (a) a final, frozen program, with a new version deployed as a
separate program that new fundraisers opt into, so existing vaults can never be touched; or (b) upgrades only through a
multisig with a long timelock (e.g. 14 days), so every change is visible and donors can leave before it applies.

### You store the fundraiser stories. Can you change them?

**Say:** Not unnoticed. The story's SHA-256 is written on-chain when the fundraiser is created; our server accepts only
text that matches it, and the page recomputes the hash and warns if it differs.

**Today (MVP):** Implemented as described. We could still delete or withhold a story.

**In production:** The story lives in content-addressed storage (IPFS or Arweave), so the hash is also the address and
nobody can make it disappear either.

### What if your website disappears?

**Say:** The money and the rules are on Solana, not on our server. Anyone can call the program with any client.

**Today (MVP):** The IDL and source are public; refunds are permissionless.

**In production:** The same, plus the frontend published to IPFS and an open-source client, so others can host it.

### Isn't the keeper bot a central point?

**Say:** No. The keeper only pays the transaction fee for refunds that anyone is allowed to send. It cannot choose
where the money goes. If it is down, donors press *Get my money back* themselves.

**In production:** Several independent keepers (anyone can run `scripts/keeper.ts`), or the donor's wallet app.

---

## 2. Money flows

### What if the treatment doesn't happen after the payout?

**Say:** The program's guarantee ends when the money reaches the clinic. But the money is now held by a registered
organisation that confirmed the invoice on-chain, and every donor's wallet and amount is public, so returning it is
easy and enforceable.

**Today (MVP):** No on-chain way back after payout. Returning unspent money is the recipient's legal duty.

**In production:**
- A `return_to_donors` instruction the recipient signs: it sends any amount back **pro rata to the donors recorded
  on-chain**, so the clinic cannot choose who gets refunded.
- For long or uncertain treatments, **milestone payouts**: the money stays in the vault and is released in parts
  (e.g. 30 % on admission, 70 % after the procedure), each part confirmed by the recipient with a document hash. If
  treatment stops, the rest goes back to donors automatically.
- The recipient's terms of joining (signed once at verification) include the duty to return unused funds this way.

### Why all or nothing? 95 % raised and the patient gets nothing?

**Say:** We left partial payouts out of the MVP on purpose: one invoice has one price, and the safe default is that a
missed target refunds everyone. In production the recipient sets a minimum before anyone donates.

**Today (MVP):** Payout only when `raised == target`; otherwise refunds after the deadline.

**In production:** Two fields agreed when the recipient confirms the fundraiser:
- `min_target`: if the deadline passes with at least this much raised, the vault pays the recipient instead of
  refunding (e.g. the clinic accepts 80 % because the hospital fund covers the rest).
- **Co-funding:** a second funder (municipality, foundation, insurer) commits money to the same vault conditionally:
  "residents raise X and we add Y, otherwise everyone is refunded".

Both are rules fixed before the first donation, not decisions anyone makes later, so they keep the same guarantee.

### What if the price changes or the treatment is abroad in another currency?

**Say:** The target is the invoice amount in the vault's currency. A change of price is a new invoice, confirmed again
by the recipient.

**Today (MVP):** Fixed target in ePLN; cannot be changed.

**In production:** The vault holds the invoice currency (a EUR stablecoin for a clinic abroad), and the on-ramp
converts from PLN at donation time, so exchange-rate risk sits with the donor's payment, not the fundraiser. A higher
price means the recipient confirms an amended document hash and target; donors who disagree can refund before it applies.

### Can the organizer post the same invoice twice, or edit it slightly?

**Say:** The exact same file, no: its hash is locked to one fundraiser. An edited copy has a different hash, so then
the check is the clinic, which would have to confirm the same invoice twice under its own name.

**Today (MVP):** `DocumentLock` keyed by the file's SHA-256.

**In production:** The lock is keyed by **recipient + invoice number**, which the recipient signs when confirming. One
invoice number from one clinic can back only one fundraiser, however the PDF is edited. Other platforms can query the
same public lock, so a clinic's invoice cannot be used on Earmark and somewhere else at the same time.

### What about fundraisers with several payees (surgery plus travel plus rehab)?

**Say:** Out of scope for the MVP. In production one fundraiser can pay several verified recipients in fixed shares.

**In production:** The fundraiser stores a list of `(recipient, amount)` items, each confirmed by its recipient. On
payout the vault pays each one its share. Living costs paid to a private person stay out of scope, because there is no
verifiable payee.

### What if the clinic's key is lost or stolen?

**Say:** A clinic should not hold a raw key. In production its wallet is a multisig or a regulated custodian, and the
payout address can be rotated through the verifier council.

**Today (MVP):** A lost key means payouts to that wallet are lost; there is no key rotation, and a revoked wallet
cannot be re-verified.

**In production:**
- Recipient wallets are multisigs (e.g. 2-of-3 board members) or custodial accounts, so one lost or stolen key does nothing.
- `rotate_recipient_wallet`, signed by the verifier multisig after the same registry-contact procedure, with a
  timelock, so a hijacked rotation is visible before it applies. Fundraisers point to the `Recipient` record, not the raw
  wallet, so the new address applies everywhere.

### A verification never expires. What if the clinic closes or loses its licence?

**Say:** In the MVP the verifier has to notice and revoke. In production verifications expire and the registry is
re-checked automatically.

**Today (MVP):** `verified_at` is stored and shown; `revoke_recipient` blocks new fundraisers and donations, and
donors can refund after the deadline.

**In production:** `create_fundraiser` and `donate` reject a recipient whose verification is older than e.g. 12
months; a `reverify` instruction renews it. A job compares every recipient against the registry API daily, and a
liquidation or licence removal triggers revocation by the council.

### What if a donor loses their wallet?

**Say:** Refunds always go to the donor's own account, so recovery is a wallet question, which modern wallets solve
with email or passkey recovery.

**In production:** Embedded wallets (email or passkey login) with recovery, so a normal donor never handles a seed phrase.

### Can someone spam a clinic with fake fundraiser requests?

**Say:** Nothing happens until the clinic confirms, so spam cannot take money. It is only noise.

**In production:** The organizer pays a small refundable deposit to create a fundraiser, lost if the recipient rejects
it as spam.

---

## 3. The real world

### My grandmother has no crypto wallet. How does she donate?

**Say:** She shouldn't need to know it is crypto. She logs in with email, pays by card, and sees złoty.

**Today (MVP):** A browser wallet (Phantom) and devnet test tokens from the *Get test ePLN* button. The faucet panel
can also open Ramp Network's card widget (needs a host API key).

**In production:**
- **Embedded wallet** created on email or passkey login, no extension and no seed phrase.
- **On-ramp inside the donate button:** card, bank transfer, or BLIK through a provider that supports it. The
  on-ramp only converts currency; the destination is fixed by the program before she pays.
- **Fees sponsored:** the app pays the fraction-of-a-cent Solana fee (a paymaster such as Kora, or a fee payer the app
  runs). A fee payer can pay for a transaction but cannot change where its money goes, so it adds no trust.

### Doesn't the on-ramp bring the intermediary back?

**Say:** No. An intermediary decides where money goes. A card on-ramp only changes PLN into a stablecoin, and the
program has already fixed the destination before the donor pays.

### How does the clinic get złoty, and why would it bother?

**Say:** Its custodian or bank converts the stablecoin to złoty automatically. For the clinic it looks like an incoming
transfer, with no platform fee and the invoice number attached.

**In production:** A regulated custodian holds the clinic's wallet and pays out to its PLN bank account; the payout
carries the fundraiser and invoice reference, so accounting can match it. The clinic's work is one onboarding and one
*Confirm* click per invoice. What it gets: no platform fee, money that arrives only for its own invoices, and patients
whose fundraisers donors trust more.

### Is there a PLN stablecoin? Isn't ePLN fake money?

**Say:** ePLN is a devnet stand-in. The program takes any token, so production uses a regulated one.

**In production:** A euro e-money token (EURC) works today; a PLN e-money token from a licensed issuer under MiCA when
one is available. The token is one field (`config.mint`) set at deployment.

### Is this legal? MiCA, AML, public collection rules?

**Say:** The program itself never holds anyone's money; it is code. The regulated parts are at the edges, and in
production they are done by licensed partners.

**In production:**
- **Fiat in and out:** licensed on-ramp and custody providers (MiCA CASPs / payment institutions) do KYC, AML and the
  travel rule, as they already must.
- **Recipients:** verified organisations with a registry entry, which is stricter than the KYB most platforms do.
- **Public collections:** where a fundraiser counts as a public collection under Polish law, it is run by the recipient
  organisation or a partner foundation that registers it, with Earmark as the payment rail.
- Before launch: a legal opinion on the frontend operator's status and a pilot with one hospital or foundation.

### Can donors get a tax deduction?

**Say:** Every donation is already a permanent public record with the donor, amount, date and recipient, which is
exactly what a donation receipt needs.

**In production:** The recipient (an organisation that can accept deductible donations) issues a receipt per donation
from the on-chain record, and the app lets the donor download it with the transaction link. Paying through a PLN
on-ramp also leaves a normal payment record. Exact deductibility rules for token donations need tax advice before launch.

### Who checks that the patient agreed to the fundraiser?

**Say:** The clinic is the natural gate: it would not issue an invoice for a patient without the patient or guardian
involved, and it confirms the fundraiser on-chain.

**In production:** Confirming a fundraiser includes the clinic attesting that it has the patient's or guardian's
consent on file. The consent itself stays at the clinic, never on-chain.

### Medical data on a public blockchain, and GDPR?

**Say:** No personal or medical data goes on-chain, only hashes. The story is off-chain and can be deleted.

**Today (MVP):** On-chain: wallets, amounts, the document's SHA-256 and the story's SHA-256. The UI warns organizers
not to put medical details in the story.

**In production:** The same split, with off-chain stories removable on request (only the hash remains), and documents
never published, only their hashes, which reveal nothing without the file.

### Everyone can see my donations. What about privacy?

**Say:** On-chain there are wallet addresses, not names. Public amounts are what lets anyone audit where the money went.

**In production:** Embedded wallets are fresh per donor, so a donation is not linked to the rest of anyone's finances.
If amounts must be private, Solana's confidential-transfer token extension can hide them while keeping the rules enforced.

### Siepomaga / Zrzutka already exist, and some already pay clinics directly. Why this?

**Say:** On those platforms the platform still holds the money and decides about payouts and refunds, and donors have
to trust its internal records. Here nobody holds it: the rule is code, refunds need no one's permission, and every
movement is public.

**Details to mention:** a platform can change its terms, freeze funds, refund some donors and not others, or go
bankrupt with money in its accounts. None of that is possible with a program-owned vault. And the platform's fee
disappears with it.

### How do you make money without becoming the intermediary?

**Say:** Not from the money flow. The program has no fee and no exit to us, and we want to keep it that way.

**In production:** An optional tip donors can add (paid to us in a separate transfer, never from the vault); paid tools
for recipient organisations (accounting export, invoice integration, multi-user confirmation); grants from foundations
and ecosystem funds for public-good infrastructure.

### Why a blockchain and not a database?

**Say:** A database is controlled by its operator, who can edit balances, pay anyone or refund selectively, which is
exactly what happened in 2017. Here the rule is code that even its authors cannot bypass, and anyone can check it.

### Why Solana?

**Say:** A donation costs a fraction of a cent and confirms in under a second, which is what a payment for ordinary
people needs. Payout to the clinic happens in the same transaction as the last donation.

### What if Solana goes down?

**Say:** The money stays in the vault while the network is paused. When it resumes, the same rules apply: payout if
the target was hit, refund if the deadline passed.

### Has the code been audited?

**Say:** Not yet; it is a hackathon build covered by program tests. Real money needs an external audit first.

**In production:** An external audit of the program, a public bug bounty, and the program kept small: the only token
exits are `donate` (to the recipient) and `refund` (to the donor), which is what makes it auditable.
