# Earmark

**Medical fundraisers where the money can only go to a verified clinic, or back to the donors.**
Built on Solana for the Superteam Poland challenge *Finance Without Intermediaries* (HackYeah 2026).

> In 2017, ~6 500 people donated ~500 000 zł on a Polish crowdfunding platform to save the sight of a
> boy named Antoś. Antoś did not exist. The platform paid the money to the organizer, who spent it on
> himself. With Earmark he could still invent the story, but he could never receive the money.

**Status:** program and web app work end to end on Solana devnet; pitch deck and demo video are in
progress. See [tickets](docs/tickets/README.md).

## Design rationale

| | |
|---|---|
| **Relationship redesigned** | Donor → fundraiser organizer → payee (clinic) |
| **Target user** | Donors and organizers of medical fundraisers in Europe, piloting in Poland |
| **Intermediaries today** | The crowdfunding platform, which holds the money, verifies stories by hand, decides payouts and refunds, and takes a fee; and the organizer, who receives the money and is trusted to spend it as promised |
| **What changes** | Money is held by a program-owned vault. It can be paid out **only** to the verified clinic named in the fundraiser, **automatically** when the target is reached, or returned to **each donor on their own** if the fundraiser is cancelled or misses its deadline. A fundraiser cannot start without the clinic's on-chain confirmation of its quote. |
| **Remaining trust** | A verifier confirms once that a wallet belongs to a real clinic (public healthcare registry). The verifier cannot move money. |

Full spec: [docs/PLAN.md](docs/PLAN.md) · Demo & Q&A: [docs/DEMO.md](docs/DEMO.md)

## Where the intermediary disappears

Only two code paths move tokens out of a fundraiser vault:

- [`donate.rs`](programs/earmark/src/instructions/donate.rs#L105-L125): when `raised == target`, the
  whole vault goes to the associated token account of the fundraiser's recipient wallet, in the same
  transaction as the donation that hit the target.
- [`refund.rs`](programs/earmark/src/instructions/refund.rs#L31-L64): after a cancel or a missed
  deadline, a donor signs for their own refund, and the destination must be a token account owned by
  that donor.

The vault's authority is the fundraiser PDA, so no private key exists for it, and no other
instruction (`cancel`, `confirm_fundraiser`, `verify_recipient`, …) touches token balances. The
organizer is never a possible destination. A fundraiser can only name a recipient that the verifier
has marked as a clinic, and donations start only after that clinic confirms the quote hash on-chain.

The program's upgrade authority is still the deployer wallet while we fix bugs, and will be set to
final (no one can change the program) before the demo.

## Who can do what

| Role | Can | Cannot |
|---|---|---|
| Verifier | mark a wallet as a verified clinic, revoke it | move any money, create or cancel fundraisers |
| Organizer | create a fundraiser for a verified clinic, cancel it before payout | receive any money, change the target, recipient or deadline |
| Clinic | confirm or cancel a fundraiser that names it | withdraw before the target is reached |
| Donor | donate, refund their own donation after a cancel or a missed deadline | refund anyone else's donation |
| Us (the deployer) | nothing once the upgrade authority is final | edit balances, pay out, block refunds |

## What if a party disappears mid-way?

- **Organizer disappears:** nothing changes. They never controlled the funds; the fundraiser either
  hits its target and pays the clinic, or expires and donors refund.
- **Clinic never confirms:** the fundraiser stays *awaiting clinic* and cannot accept donations; the
  organizer can cancel it.
- **Clinic disappears after confirming** (or the verifier revokes it): new donations are blocked, the
  deadline passes, and every donor refunds on their own, without asking anyone.
- **We disappear:** the program and the money stay on Solana. Anyone can call it with any client;
  the web app only reads chain data and stores the non-financial story text.

## Why a blockchain and not a database?

A database is controlled by its operator, who can edit balances, pay out to anyone or refund
selectively, which is what happened in 2017. Here the rule "only to the clinic or back to the donors"
is code that even its authors cannot bypass, and every donor can check it and every transfer on a
public explorer or on the app's `/audit` page without asking anyone.

## What it can't catch, and next steps

It does not stop a fake clinic that passed verification, or a clinic colluding with an organizer
(see [Limitations](#limitations)). Mitigations: the verifier checks a public healthcare registry
(RPWDL / KRS in Poland, national registries elsewhere), and the audit page flags new recipients and
unusual volume.

Next: on-chain attestations (Solana Attestation Service) or a multi-sig verifier council instead of a
single verifier key; healthcare registry integrations; Polish UI; milestone payouts for long
treatments; municipality co-funding ("residents raise X **and** the city adds Y, otherwise refund");
stablecoins (EURC/USDC) with a fiat on-ramp (cards, BLIK, SEPA).

## Repo map

| Path | What |
|---|---|
| `programs/earmark/` | Anchor program: all money rules |
| `tests/` | Program tests |
| `app/` | Next.js frontend (App Router, Tailwind v4, wallet adapter; `cp app/.env.example app/.env.local`, then `pnpm --dir app dev`) |
| `assets/` | ePLN token logo and metadata JSON (served from GitHub raw) |
| `scripts/` | Deploy, mint, faucet setup, token metadata, airdrop, seed demo state |
| `migrations/` | Anchor's default deploy hook (unused; we deploy with `scripts/deploy-devnet.sh`) |
| `docs/` | Plan, demo script, tickets, design mockups |

## Getting started

Prerequisites: Rust, Solana CLI (Agave 3.1.x), Anchor 1.1.x via `avm`, Node 20+, pnpm. Make sure
`~/.cargo/bin`, `~/.avm/bin` and `~/.local/share/solana/install/active_release/bin` are on `PATH`.

```bash
pnpm install                                   # JS deps (tests, later app/ and scripts/)
solana-keygen new -o ~/.config/solana/id.json  # once, if you have no wallet yet
anchor build                                   # builds the program and target/idl/earmark.json
anchor test --validator legacy                 # runs tests/ against a local solana-test-validator
```

`--validator legacy` is used because Anchor's default Surfpool runner did not start on our machines.
Scripts (run with `pnpm exec tsx scripts/<name>.ts`): `deploy-devnet.sh`, `sync-idl.ts` (IDL → `app/src/idl`), `create-mint.ts`, `setup-faucet.ts` (devnet faucet key + mint authority handover, run once), `set-token-metadata.ts` (names the ePLN mint and sets its logo, from `assets/epln/`), `airdrop.ts <wallet> <amount>`, `seed-demo.ts [--deadline-in <s>]`, `seed-clinics.ts` (verifies four extra demo clinics for the picker on `/new`). Demo wallets are stored in git-ignored `scripts/.keys/`.

### Run the web app

```bash
cp app/.env.example app/.env.local   # fill in NEXT_PUBLIC_PROGRAM_ID and NEXT_PUBLIC_TPLN_MINT from Deployment below
pnpm --dir app dev                   # http://localhost:3000
```

Connect a devnet wallet (Phantom, Solflare), press *Get test ePLN* (needs `FAUCET_SECRET_KEY`, see
`app/.env.example`), then: `/` lists fundraisers, `/new` creates one, `/clinic` and `/verifier` are
the clinic and verifier panels, `/audit` shows every money movement with red flags.

`anchor keys sync` regenerates the program ID from `target/deploy/earmark-keypair.json`; the keypair is
git-ignored, so on a fresh clone the ID in `declare_id!` and `Anchor.toml` is replaced by T07.

## Deployment

| | |
|---|---|
| Network | Solana devnet |
| Program ID | [`GWaY7mkSSwBzK6KfSGEJa9EriyvyE5k25yZQ9q4PCfMf`](https://explorer.solana.com/address/GWaY7mkSSwBzK6KfSGEJa9EriyvyE5k25yZQ9q4PCfMf?cluster=devnet) |
| ePLN mint | [`9ho3Zsfuzz5kxxLNs1U2Prmk2kYAgyvertDpe3NqzmYr`](https://explorer.solana.com/address/9ho3Zsfuzz5kxxLNs1U2Prmk2kYAgyvertDpe3NqzmYr?cluster=devnet) |
| Verifier | `4gWcjmyT4pwTL89nNym8z3UxAtXZeK6fajk3191suDc8` |
| Upgrade authority | deployer wallet `AAm3Sq5dWC7ZNr6wAidip51vKmupYKm4mXi5FuYwSmRg` (set to final before the demo) |
| Design | [Claude Design canvas](https://claude.ai/artifact/5wixJuW4EKfGg4tGmjYFVt) · mockups & tokens in [docs/design](docs/design/README.md) |
| Demo video | _TBD (T17)_ |

## Limitations

- A fake clinic that passes verification, or a clinic colluding with an organizer, is not stopped by
  the program; the audit page only flags it.
- Fundraisers without a single payee (e.g. living costs) are out of scope.
- ePLN is a devnet test token; production would use a stablecoin and a fiat on-ramp.
- The *Get test ePLN* faucet (`/api/faucet`) holds the ePLN mint-authority key on the server. That is test money and not part of the trust model; it has no per-wallet rate limit, and its cap on newly opened token accounts is in memory, so it resets on restart.
- Fundraiser titles and stories are stored by `/api/metadata` in a local JSON file (`app/data/`), write-once per fundraiser; only the quote's SHA-256 is on-chain. Production would use content-addressed storage (IPFS/Arweave).
- The audit page reads the 100 most recent program transactions and recomputes flags in the browser; it is a hint for humans, not a fraud verdict.
