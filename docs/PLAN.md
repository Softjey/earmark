# Earmark — build plan

> **Earmark** — donations earmarked for one verified payee. Medical fundraisers where the money goes
> **directly** to a verified clinic, never to the organizer. The rules live in a Solana program nobody
> can override.

## 1. Problem

In 2017 the "Boję się ciemności" fundraiser on Zrzutka.pl collected ~500 000 zł from ~6 500 people
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
| Money is paid to the organizer | Money sits in a program-owned vault and can only go to the **verified recipient** (clinic) or **back to donors** |
| Platform staff check stories by hand | A fundraiser **cannot exist** without the clinic's on-chain signature on the quote |
| Organizer decides about refunds | Refund is a rule: cancelled or deadline missed → every donor can take their money back alone |
| Surplus stays with organizer | Hard target: donations are capped and the payout happens automatically when the target is hit |
| Same need posted on many platforms | The quote hash can be registered only once |

**Remaining trust (said openly):** someone has to confirm that a wallet belongs to a real clinic
(checked once against a public healthcare registry; in Poland RPWDL/KRS). The verifier can only mark wallets
as verified. **It cannot move any money.**

## 3. Target user

*Donors and organizers of medical fundraisers in Europe, piloting in Poland.* The UI is in English
(Polish translation is P1), uses plain language ("Donate", "Get my money back"), and the only crypto
concept the user sees is the wallet.

## 4. Architecture

```
┌───────────────────────────────────────────────┐
│ Frontend — Next.js + Wallet Adapter (app/)    │
│ list · fundraiser page · create · clinic ·    │
│ verifier · public audit page                  │
└───────┬─────────────────────────────┬─────────┘
        │ txs + reads via RPC         │ title, story, photos
        ▼                             ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ Anchor program           │  │ Metadata JSON            │
│ programs/earmark          │  │ app/data/metadata.json   │
│ ALL money rules          │  │ (no money logic, no      │
│                          │  │  medical data on-chain)  │
└───────┬──────────────────┘  └──────────────────────────┘
        ▼
┌──────────────────────────┐
│ SPL token tPLN (devnet)  │
└──────────────────────────┘
```

**Rule:** no server decides anything about money. If the metadata server is off, the funds and
rules keep working. Medical data never goes on-chain (RODO); only the SHA-256 of the quote PDF does.

## 5. On-chain spec

### Accounts (PDAs)

| Account | Seeds | Fields |
|---|---|---|
| `Config` | `["config"]` | `verifier: Pubkey`, `mint: Pubkey`, `bump` |
| `Recipient` | `["recipient", wallet]` | `wallet`, `name: String(64)`, `registry_id: String(32)` (healthcare registry no., e.g. RPWDL), `verified_at: i64`, `active: bool`, `bump` |
| `Fundraiser` | `["fundraiser", organizer, id: u64]` | `organizer`, `recipient` (wallet), `id`, `target: u64`, `raised: u64`, `deadline: i64`, `quote_hash: [u8;32]`, `metadata_uri: String(128)`, `status`, `created_at`, `bump`, `vault_bump` |
| `Vault` | `["vault", fundraiser]` | SPL token account, authority = `Fundraiser` PDA |
| `Donation` | `["donation", fundraiser, donor]` | `donor`, `amount: u64`, `refunded: bool`, `bump` |
| `QuoteLock` | `["quote", quote_hash]` | `fundraiser: Pubkey` (exists only to make each quote usable once) |

`status`: `PendingConfirmation → Active → Released` or `→ Cancelled`.

### Instructions

| Instruction | Signer | Rules enforced |
|---|---|---|
| `init_config(verifier, mint)` | deployer | once only |
| `verify_recipient(name, registry_id)` | `config.verifier` | creates `Recipient` for a wallet |
| `revoke_recipient()` *(P1)* | `config.verifier` | `active = false`; blocks new fundraisers/donations |
| `create_fundraiser(id, target, deadline, quote_hash, metadata_uri)` | organizer | recipient must exist **and** be active → else `RecipientNotVerified`; `target > 0`; `deadline > now`; `QuoteLock` init fails if quote reused → `QuoteAlreadyUsed` |
| `confirm_fundraiser()` | recipient wallet | status must be `PendingConfirmation` → `Active` |
| `donate(amount)` | donor | status `Active`; `now < deadline`; amount capped to `target - raised`; transfer donor → vault; **if `raised == target` → vault → recipient ATA, status `Released`** (same tx) |
| `cancel()` | recipient wallet **or** organizer | status `PendingConfirmation` or `Active` → `Cancelled` |
| `refund()` | donor | status `Cancelled`, **or** `Active && now >= deadline`; not yet refunded; vault → donor; mark refunded |

**The intermediary disappears in `donate` and `refund`:** there is no instruction that sends tokens
anywhere except the recipient's token account or the donor's own token account.

### Errors

`RecipientNotVerified`, `QuoteAlreadyUsed`, `InvalidTarget`, `DeadlineInPast`, `NotPending`,
`NotActive`, `DeadlinePassed`, `NotRefundable`, `AlreadyRefunded`, `Unauthorized`.

### Upgrade authority

Develop with an upgrade authority; before the final demo run
`solana program set-upgrade-authority <PROGRAM_ID> --final` so that nobody — including us — can change
the rules. Show this in the explorer during Q&A.

## 6. Frontend

Next.js (App Router) + `@solana/wallet-adapter-react` + `@coral-xyz/anchor` client generated from IDL.
English copy. Design is done in Claude Design (see ticket T09).

| Route | Who | What |
|---|---|---|
| `/` | everyone | list of fundraisers with progress, status, verified badge |
| `/fundraisers/[pubkey]` | donor | story, progress, `Donate`, `Get my money back`, explorer links |
| `/new` | organizer | create fundraiser (recipient picker, target, deadline, quote PDF → hash) |
| `/clinic` | recipient | pending fundraisers to confirm / cancel |
| `/verifier` | verifier | verify a clinic wallet (name + registry no.) |
| `/audit` *(P1)* | everyone | all flows + red flags |

Metadata: `POST /api/metadata` writes `app/data/metadata.json`; `metadata_uri = /api/metadata/<id>`.
Works when the app runs locally (the demo). On a serverless host the file is read-only → fine for P0.

## 7. Demo (~3 min) — details in [DEMO.md](DEMO.md)

1. Hook: Antoś story (15 s)
2. Fraud attempt: organizer sets **own wallet** as recipient → `RecipientNotVerified` (30 s)
3. Honest fundraiser: create → clinic confirms (30 s)
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

**Cut line if late:** drop T14 (audit page) and `revoke_recipient`; switch tPLN → native SOL only if
SPL transfers block progress.

## 9. Tickets

See [tickets/](tickets/). Each ticket has priority, dependencies, and acceptance criteria.
