# Earmark — build plan

> **Earmark** — donations earmarked for one verified payee. Fundraisers for any cause (medical care,
> humanitarian aid, disaster relief, schools, animal shelters, …) where the money goes **directly** to a
> verified recipient organisation, never to the organizer. The rules live in a Solana program nobody
> can override.

## 1. Problem

The problem is the same for every cause: the donor pays an organizer they cannot check. The case that
motivated this project is a medical one, but nothing in the design is medical. In 2017 the "Boję się ciemności" fundraiser on Zrzutka.pl collected ~500 000 zł from ~6 500 people
for the eye therapy of a boy named Antoś. Antoś did not exist. The platform paid the money to the
organizer, who spent it on himself. Only the Lewandowskis (100 000 zł) got their money back.

Today a donor has to trust two parties:

| Who | What the donor trusts them to do |
|---|---|
| **Organizer** | that the story is true and the money will be spent on it |
| **Platform** (Zrzutka, Pomagam, SiePomaga) | that it verifies the story, holds the money safely, pays it out correctly and refunds when needed. It charges a fee for this |

## 2. What changes

| Before | With Earmark |
|---|---|
| Money is paid to the organizer | Money sits in a program-owned vault and can only go to the **verified recipient** (clinic, charity, relief agency, shelter, school, …) or **back to donors** |
| Platform staff check stories by hand | A fundraiser **cannot exist** without the recipient's on-chain confirmation of the supporting document (invoice, quote or budget) |
| Organizer decides about refunds | Refund is a rule: cancelled or deadline missed → every donor can take their money back alone |
| Surplus stays with organizer | Hard target: donations are capped and the payout happens automatically when the target is hit |
| Same need posted on many platforms | The document hash can be registered only once |

**Remaining trust (said openly):** someone has to confirm that a wallet belongs to a real organisation
(checked once against an official public registry: in Poland e.g. KRS for NGOs, RPWDL for healthcare providers). The verifier can only mark wallets
as verified. **It cannot move any money.**

## 3. Target user

*Donors and organizers of fundraisers for any cause with a single identifiable payee (a hospital paid for a treatment, an NGO buying aid, a shelter, a school, a flood-relief association), in Europe, piloting in Poland.* The UI is in English
(Polish translation is P1), uses plain language ("Donate", "Get my money back"), and the only crypto
concept the user sees is the wallet.

## 4. Architecture

```
┌───────────────────────────────────────────────┐
│ Frontend — Next.js + Wallet Adapter (app/)    │
│ list · fundraiser page · create · recipient ·    │
│ verifier · public audit page                  │
└───────┬─────────────────────────────┬─────────┘
        │ txs + reads via RPC         │ title, story, photos
        ▼                             ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ Anchor program           │  │ Metadata JSON            │
│ programs/earmark          │  │ Postgres `metadata` table│
│ ALL money rules          │  │ (no money logic, no      │
│                          │  │  personal data on-chain)  │
└───────┬──────────────────┘  └──────────────────────────┘
        ▼
┌──────────────────────────┐
│ SPL token ePLN (devnet)  │
└──────────────────────────┘
```

**Rule:** no server decides anything about money. If the metadata server is off, the funds and
rules keep working. Personal and medical data never go on-chain (RODO/GDPR); only the SHA-256 of the supporting document does.

## 5. On-chain spec

### Accounts (PDAs)

| Account | Seeds | Fields |
|---|---|---|
| `Config` | `["config"]` | `verifier: Pubkey`, `mint: Pubkey`, `bump` |
| `Recipient` | `["recipient", wallet]` | `wallet`, `name: String(64)`, `registry_id: String(32)` (number in the official registry the verifier checked, e.g. KRS or RPWDL), `verified_at: i64`, `active: bool`, `bump` |
| `Fundraiser` | `["fundraiser", organizer, id: u64]` | `organizer`, `recipient` (wallet), `id`, `target: u64`, `raised: u64`, `deadline: i64`, `document_hash: [u8;32]`, `metadata_uri: String(128)`, `status`, `created_at`, `bump`, `vault_bump` |
| `Vault` | `["vault", fundraiser]` | SPL token account, authority = `Fundraiser` PDA |
| `Donation` | `["donation", fundraiser, donor]` | `donor`, `amount: u64`, `refunded: bool`, `bump` |
| `DocumentLock` | `["document", document_hash]` | `fundraiser: Pubkey` (exists only to make each supporting document usable once) |

`status`: `PendingConfirmation → Active → Released` or `→ Cancelled`.

### Instructions

| Instruction | Signer | Rules enforced |
|---|---|---|
| `init_config(verifier, mint)` | deployer | once only |
| `verify_recipient(name, registry_id)` | `config.verifier` | creates `Recipient` for a wallet |
| `revoke_recipient()` *(P1)* | `config.verifier` | `active = false`; blocks new fundraisers/donations |
| `create_fundraiser(id, target, deadline, document_hash, metadata_uri)` | organizer | recipient must exist **and** be active → else `RecipientNotVerified`; `target > 0`; `deadline > now`; `DocumentLock` init fails if the document was reused → `DocumentAlreadyUsed` |
| `confirm_fundraiser()` | recipient wallet | status must be `PendingConfirmation` → `Active` |
| `donate(amount)` | donor | status `Active`; `now < deadline`; amount capped to `target - raised`; transfer donor → vault; **if `raised == target` → vault → recipient ATA, status `Released`** (same tx) |
| `cancel()` | recipient wallet **or** organizer | status `PendingConfirmation` or `Active` → `Cancelled` |
| `refund()` | **anyone** (`caller` pays the fee; `donor` is not a signer) | status `Cancelled`, **or** `Active && now >= deadline`; not yet refunded; `donation` must belong to `donor`; vault → `donor`'s own token account (token authority = donor); mark refunded |

**Automatic refunds:** a chain has no timers, so `refund` is permissionless and `scripts/keeper.ts` sends it
for every donor as soon as a fundraiser is cancelled or expired (polls every second). The keeper only pays
fees and cannot redirect money; if it is down, donors refund themselves from the app.

**The intermediary disappears in `donate` and `refund`:** there is no instruction that sends tokens
anywhere except the recipient's token account or the donor's own token account.

### Errors

`RecipientNotVerified`, `DocumentAlreadyUsed`, `InvalidTarget`, `DeadlineInPast`, `NotPending`,
`NotActive`, `DeadlinePassed`, `NotRefundable`, `AlreadyRefunded`, `Unauthorized`, plus
`FieldTooLong` (name > 64, registry id > 32 or metadata URI > 128 bytes), `InvalidAmount`
(donation of 0) and `NotCancellable` (cancel on a `Released`/`Cancelled` fundraiser).

### Events

`DonationMade { fundraiser, donor, amount (as accepted after the cap), raised }`,
`FundraiserReleased { fundraiser, recipient, amount }`, `Refunded { fundraiser, donor, amount }`.

### Implementation notes

- `DocumentLock` and the `Recipient` check in `create_fundraiser` are validated by hand (not with
  `init` / typed accounts) so that failures surface as `DocumentAlreadyUsed` / `RecipientNotVerified`.
- `donate` also requires the recipient to still be `active`; a revoked recipient therefore stops
  receiving donations, and existing donors can refund after the deadline.
- `verify_recipient` creates the `Recipient` account once; a revoked wallet cannot be re-verified
  (known limitation, fix would be an `activate` path).
- `donate` pays out the vault's whole token balance, so stray tokens sent to the vault go to the
  recipient, never to the organizer.

### Upgrade authority

Develop with an upgrade authority; before the final demo run
`solana program set-upgrade-authority <PROGRAM_ID> --final` so that nobody — including us — can change
the rules. Show this in the explorer during Q&A.

## 6. Frontend

Next.js (App Router) + `@solana/wallet-adapter-react` + `@coral-xyz/anchor` client generated from IDL.
English copy. **Design:** [Claude Design canvas](https://claude.ai/artifact/5wixJuW4EKfGg4tGmjYFVt); mockups per screen and design tokens
are in [docs/design/](design/README.md). The frontend must follow them.

| Route | Who | What |
|---|---|---|
| `/` | everyone | list of fundraisers with progress, status, verified badge, category filter |
| `/fundraisers/[pubkey]` | donor | story, progress, `Donate`, `Get my money back`, explorer links |
| `/new` | organizer | create fundraiser (category, recipient picker, target, deadline, supporting document → hash) |
| `/recipient` | recipient | pending fundraisers to confirm / cancel |
| `/verifier` | verifier | verify a recipient wallet (name + registry no.) |
| `/audit` *(P1)* | everyone | where the donated money is (paid / in vaults / refunded), red flags, per-fundraiser ledger, filterable money movements |

Metadata: `POST /api/metadata` writes the Postgres `metadata` table (`DATABASE_URL`; falls back to `app/data/metadata.json` when unset; write-once, keyed by fundraiser pubkey; holds `title`, `story` and an optional descriptive `category` (medical, humanitarian, disaster, children, animals, community, other) used only for browsing and filtering, never by the program; sent after the create tx confirms); `metadata_uri = /api/metadata/<fundraiser pubkey>`. `GET /api/metadata` returns all entries for the list page. `/recipient` and `/verifier` links appear in the header only for wallets that hold that role.
`/audit` reads accounts and the last 100 program transactions client-side. Red flags (all computed in the browser, thresholds in `app/src/lib/audit.ts`): recipient verified < 7 days ago and already in a fundraiser; recipient in > 3 fundraisers created within 7 days; target > 10× the median target; deadline passed or cancelled with ePLN still in the vault; organizer with ≥ 3 cancelled fundraisers. Each flag links to the fundraisers/accounts that triggered it.

**ePLN faucet (devnet only, not part of the trust model):** `POST /api/faucet {wallet}` mints `amount` whole ePLN (default 100 = `FAUCET_AMOUNT`, max 1 000 000 per request) to the wallet's ATA. The mint authority is a dedicated faucet key (`FAUCET_SECRET_KEY`, set up by `scripts/setup-faucet.ts`, funded with 0.1 SOL), never the deployer. Limits: no per-wallet or per-IP rate limit (devnet test money); at most 40 token accounts opened on the faucet's rent (in-memory counter; resets on restart). The header shows *Get test ePLN* for connected wallets; it opens a small panel to enter the amount.
Works when the app runs locally (the demo). On a serverless host the file is read-only → fine for P0.

## 7. Demo (~3 min) — details in [DEMO.md](DEMO.md)

1. Hook: Antoś story, then "the same problem exists for every cause" (15 s)
2. Fraud attempt: organizer sets **own wallet** as recipient → `RecipientNotVerified` (30 s)
3. Honest fundraiser: create → recipient confirms (30 s)
4. Two donors → target hit → **automatic payout in the same tx** → explorer (45 s)
5. Pre-made fundraiser past deadline → donor refunds alone (30 s)
6. Audit page (20 s, if done)
7. Code: `donate`/`refund` are the only token exits; upgrade authority is final (10 s)

## 8. Timeline (hackathon: Oct 3 → Oct 4, 23:00 submission)

| Block | Program | Frontend | Pitch / ops |
|---|---|---|---|
| H0–H2 | T00, T01 | T09 design + scaffold | T15 README skeleton |
| H2–H8 | T02–T05 | T10, T11 against local validator | T16 deck draft |
| H8–H11 | T06 tests | T12, T13 | — |
| H11–H14 | T07 devnet, T08 seed | wire to devnet | T14 audit page |
| H14–H18 | bugfix | polish | T17 rehearsal ×3, record backup video |
| H18–H20 | `--final` authority | — | T18 submit (well before 23:00) |

**Cut line if late:** drop T14 (audit page) and `revoke_recipient`; switch ePLN → native SOL only if
SPL transfers block progress.

## 9. Tickets

See [tickets/](tickets/). Each ticket has priority, dependencies, and acceptance criteria.
