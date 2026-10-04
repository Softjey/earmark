<p align="center"><img src="assets/brand/logo.svg" alt="Earmark" height="64"></p>

# Earmark

**Fundraisers for any cause where the money can only go to a verified recipient, or back to the donors.**
Medical care, humanitarian aid, disaster relief, children's charities, animal shelters: whoever the payee is, the organizer never touches the money.
Built on Solana for the Superteam Poland challenge *Finance Without Intermediaries* (HackYeah 2026).

> The case that started this project: in 2017, ~6 500 people donated ~500 000 zł on a Polish crowdfunding platform to save the sight of a
> boy named Antoś. Antoś did not exist. The platform paid the money to the organizer, who spent it on
> himself. With Earmark he could still invent the story, but he could never receive the money.

**Status:** program and web app work end to end on Solana devnet; pitch deck and demo video are in
progress. See [tickets](docs/tickets/README.md).

## Design rationale

| | |
|---|---|
| **Relationship redesigned** | Donor → fundraiser organizer → payee (clinic, NGO, shelter, relief agency, …) |
| **Target user** | Donors and organizers of fundraisers for any cause with one identifiable payee, in Europe, piloting in Poland |
| **Intermediaries today** | The crowdfunding platform, which holds the money, verifies stories by hand, decides payouts and refunds, and takes a fee; and the organizer, who receives the money and is trusted to spend it as promised |
| **What changes** | Money is held by a program-owned vault. It can be paid out **only** to the verified recipient named in the fundraiser, **automatically** when the target is reached, or returned to **each donor on their own** if the fundraiser is cancelled or misses its deadline. A fundraiser cannot start without the recipient's on-chain confirmation of its supporting document (invoice, quote or budget). |
| **Remaining trust** | A verifier confirms once that a wallet belongs to a real organisation (an official public registry, e.g. KRS or RPWDL in Poland). The verifier cannot move money. |

Full spec: [docs/PLAN.md](docs/PLAN.md) · Demo & Q&A: [docs/DEMO.md](docs/DEMO.md)

## Where the intermediary disappears

Only two code paths move tokens out of a fundraiser vault:

- [`donate.rs`](programs/earmark/src/instructions/donate.rs#L105-L125): when `raised == target`, the
  whole vault goes to the associated token account of the fundraiser's recipient wallet, in the same
  transaction as the donation that hit the target.
- [`refund.rs`](programs/earmark/src/instructions/refund.rs#L31-L64): after a cancel or a missed
  deadline, anyone (typically the keeper bot, or the donor) can trigger a refund, and the destination
  must be a token account owned by the donor. The caller only pays the fee.

The vault's authority is the fundraiser PDA, so no private key exists for it, and no other
instruction (`cancel`, `confirm_fundraiser`, `verify_recipient`, …) touches token balances. The
organizer is never a possible destination. A fundraiser can only name a recipient that the verifier
has marked as verified, and donations start only after that recipient confirms the document hash on-chain.

The program's upgrade authority is still the deployer wallet while we fix bugs, and will be set to
final (no one can change the program) before the demo.

## Who can do what

| Role | Can | Cannot |
|---|---|---|
| Verifier | mark a wallet as a verified recipient, revoke it | move any money, create or cancel fundraisers |
| Organizer | create a fundraiser for a verified recipient, cancel it before payout | receive any money, change the target, recipient or deadline |
| Recipient | confirm or cancel a fundraiser that names it | withdraw before the target is reached |
| Donor | donate; get a refund after a cancel or a missed deadline (sent automatically by the keeper, or on their own click) | receive anyone else's refund |
| Us (the deployer) | nothing once the upgrade authority is final | edit balances, pay out, block refunds |

## What if a party disappears mid-way?

- **Organizer disappears:** nothing changes. They never controlled the funds; the fundraiser either
  hits its target and pays the recipient, or expires and donors refund.
- **Recipient never confirms:** the fundraiser stays *waiting for recipient* and cannot accept donations; the
  organizer can cancel it.
- **Recipient disappears after confirming** (or the verifier revokes it): new donations are blocked, the
  deadline passes, and every donor is refunded automatically by the keeper (or on their own click), without asking anyone.
- **We disappear:** the program and the money stay on Solana. Anyone can call it with any client;
  the web app only reads chain data and stores the non-financial story text.

## Why a blockchain and not a database?

A database is controlled by its operator, who can edit balances, pay out to anyone or refund
selectively, which is what happened in 2017. Here the rule "only to the recipient or back to the donors"
is code that even its authors cannot bypass, and every donor can check it and every transfer on a
public explorer or on the app's `/audit` page without asking anyone.

## What it can't catch, and next steps

It does not stop a fake organisation that passed verification, or a recipient colluding with an organizer
(see [Limitations](#limitations)). Mitigations: the verifier checks an official public registry
(KRS / RPWDL in Poland, national registries elsewhere), and the audit page flags new recipients and
unusual volume.

Next: on-chain attestations (Solana Attestation Service) or a multi-sig verifier council instead of a
single verifier key; registry integrations; Polish UI; milestone payouts for long
treatments; municipality co-funding ("residents raise X **and** the city adds Y, otherwise refund");
stablecoins (EURC/USDC) with a fiat on-ramp (cards, BLIK, SEPA).

## Repo map

| Path | What |
|---|---|
| `programs/earmark/` | Anchor program: all money rules |
| `tests/` | Program tests |
| `app/` | Next.js frontend (App Router, Tailwind v4, wallet adapter; `cp app/.env.example app/.env.local`, then `pnpm --dir app dev`) |
| `assets/` | Brand logo (`assets/brand/`), ePLN token logo and metadata JSON (served from GitHub raw) |
| `scripts/` | Deploy, mint, faucet setup, token metadata, airdrop, seed demo state |
| `video/` | Remotion project for the demo video's animated intro, outro and role badges (`pnpm --dir video render:all` → `video/out/`) |
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
Scripts (run with `pnpm exec tsx scripts/<name>.ts`): `deploy-devnet.sh`, `sync-idl.ts` (IDL → `app/src/idl`), `create-mint.ts`, `setup-faucet.ts` (devnet faucet key + mint authority handover, run once), `set-token-metadata.ts` (names the ePLN mint and sets its logo, from `assets/epln/`), `airdrop.ts <wallet> <amount>`, `seed-demo.ts [--deadline-in <s>]`, `keeper.ts [--once] [--interval <ms>]` (sends permissionless refunds for cancelled / expired fundraisers; run it during the demo), `seed-recipients.ts` (verifies four extra demo recipients for the picker on `/new`), `key-to-phantom.ts <keypair.json>` (prints the base58 key for importing a demo wallet into Phantom), `video-state.ts <step>` (creates the real devnet fundraisers and transactions shown in the demo video's app footage). Demo wallets are stored in git-ignored `scripts/.keys/`.

### Run the web app

```bash
cp app/.env.example app/.env.local   # fill in NEXT_PUBLIC_PROGRAM_ID and NEXT_PUBLIC_TPLN_MINT from Deployment below
pnpm --dir app dev                   # http://localhost:3000
```

Connect a devnet wallet (Phantom, Solflare), press *Get test ePLN* (needs `FAUCET_SECRET_KEY`, see
`app/.env.example`), then: `/` lists fundraisers, `/new` creates one, `/recipient` and `/verifier` are
the recipient and verifier panels, `/audit` shows every money movement with red flags.

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

### Hosting the web app (Railway, Docker)

The root `Dockerfile` builds only `app/` (the program is already on devnet). In Railway set:

- Build-time (inlined by `next build`): `NEXT_PUBLIC_CLUSTER=devnet`, `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_TPLN_MINT`, and ideally `NEXT_PUBLIC_RPC_URL` (a Helius/QuickNode devnet URL; the public one rate-limits).
- Runtime secret: `FAUCET_SECRET_KEY` (never a build arg).
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`, a reference to the Railway Postgres service. Stories live in the `metadata` table (created on first use), so they survive redeploys. Without `DATABASE_URL` the app falls back to `app/data/metadata.json` (local dev only).

Local production-like stack (app image + Postgres, devnet chain, config from `app/.env.local`):

```bash
docker compose --env-file app/.env.local up -d --build   # http://localhost:3000, or APP_PORT=3200 to change the port
DATABASE_URL=postgresql://earmark:earmark@localhost:5433/earmark pnpm --dir app exec tsx ../scripts/seed-metadata.ts   # optional: copy app/data/metadata.json in
docker compose down        # keeps the pgdata volume; add -v to wipe it
```

## Limitations

- A fake organisation that passes verification, or a recipient colluding with an organizer, is not stopped by
  the program; the audit page only flags it.
- Fundraisers without a single payee (e.g. living costs, or aid split across many individuals) are out of scope.
- The fundraiser category (medical, humanitarian, …) is a browsing label in the off-chain metadata; the program neither knows nor enforces it.
- The devnet program must be upgraded before the document-hash rename (formerly *quote hash*) is live; until then new fundraisers cannot be created from the current app.
- ePLN is a devnet test token; production would use a stablecoin and a fiat on-ramp.
- The *Get test ePLN* faucet (`/api/faucet`) holds the ePLN mint-authority key on the server. That is test money and not part of the trust model; it has no per-wallet rate limit, and its cap on newly opened token accounts is in memory, so it resets on restart.
- Fundraiser titles and stories are stored by `/api/metadata` in Postgres (`DATABASE_URL`; a local JSON file in `app/data/` when it is unset), write-once per fundraiser; only the supporting document's SHA-256 is on-chain. Production would use content-addressed storage (IPFS/Arweave).
- The audit page reads the 100 most recent program transactions and recomputes flags in the browser; it is a hint for humans, not a fraud verdict.
