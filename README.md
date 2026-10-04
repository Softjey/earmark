<p align="center"><img src="assets/brand/logo.svg" alt="Earmark" height="64"></p>

# Earmark

**Fundraisers for any cause where the money can only go to a verified recipient, or back to the donors.**
Medical care, humanitarian aid, disaster relief, children's charities, animal shelters: whoever the payee is, the organizer never touches the money.
Built on Solana for the Superteam Poland challenge *Finance Without Intermediaries* (HackYeah 2026).

> The case that started this project: in 2017, ~6 500 people donated ~500 000 zł on a Polish crowdfunding platform to save the sight of a
> boy named Antoś. Antoś did not exist. The platform paid the money to the organizer, who spent it on
> himself. With Earmark he could still invent the story, but he could never receive the money.

**Try it:** [earmark.help](https://earmark.help) (Solana devnet) · **Video:** [youtu.be/xNkNep-AmJg](https://youtu.be/xNkNep-AmJg) ·
**Pitch deck:** [docs/pitch/earmark-pitch.pdf](docs/pitch/earmark-pitch.pdf)

**Status:** the program and the web app work end to end on Solana devnet: create a fundraiser, recipient confirmation,
donations, automatic payout, and refunds. See [tickets](docs/tickets/README.md).

## Design rationale

| | |
|---|---|
| **Relationship redesigned** | Donor → fundraiser organizer → payee (clinic, NGO, shelter, relief agency, …) |
| **Target user** | Donors and organizers of fundraisers for any cause with one identifiable payee, in Europe, piloting in Poland |
| **Intermediaries today** | The crowdfunding platform, which holds the money, verifies stories by hand, decides payouts and refunds, and takes a fee; and the organizer, who receives the money and is trusted to spend it as promised |
| **What changes** | Money is held by a program-owned vault. It can be paid out **only** to the verified recipient named in the fundraiser, **automatically** when the target is reached, or returned to **each donor on their own** if the fundraiser is cancelled or misses its deadline. A fundraiser cannot start without the recipient's on-chain confirmation of its supporting document (invoice, quote or budget). |
| **Remaining trust** | A verifier confirms once that a wallet belongs to a real organisation (an official public registry, e.g. KRS or RPWDL in Poland). The verifier cannot move money, and anyone can repeat its check from the fundraiser page. See [Trust model](#trust-model-what-is-still-trusted-and-why-it-is-bounded). |

Full spec: [docs/PLAN.md](docs/PLAN.md) · Demo: [docs/DEMO.md](docs/DEMO.md) · Judge Q&A: [docs/QA.md](docs/QA.md)

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

## Trust model: what is still trusted, and why it is bounded

Earmark does not remove trust. It removes the party who **decides where the money goes**, and narrows what
is left to one question: *does this wallet belong to this registered organisation?* That answer is public and
anyone can check it again.

### Who is the verifier?

- **In this hackathon build:** one key held by the Earmark team (address under [Deployment](#deployment)).
- **What it can do:** create a `Recipient` record (name and registry number) for a wallet, or revoke one.
  Every verification is a public transaction with the registry number in it.
- **What it cannot do:** move, freeze or redirect money, or create, cancel or confirm fundraisers. If the key
  leaks, the worst case is a fake recipient. Any fundraiser naming it is visible, the audit page flags a
  recipient that was verified less than 7 days ago, and the registry number can be checked against the
  registry.
- **In production it should not be us.** The program checks only that `config.verifier` signed, so the
  key can be a multisig of independent parties (e.g. an NGO federation, a law firm, a partner bank) with
  M-of-N signatures. Later it can be replaced by attestations from parties that already verify organisations
  for a living, such as a bank's KYB check on the organisation's account, issued via the Solana Attestation
  Service.

### Check the verifier yourself

The fundraiser page and the verifier panel show the recipient's registry number with a
*Check in KRS / RPWDL yourself* link. The link opens the official public search
([KRS](https://wyszukiwarka-krs.ms.gov.pl/), [RPWDL](https://rpwdl.ezdrowie.gov.pl/)) and copies the
number. Neither registry offers a stable link to one entry, so the donor pastes the number. A donor does
not have to trust the verifier's word; they can repeat the check in ten seconds. (Demo recipients use
placeholder numbers such as `RPWDL-0001`, which are not real entries.)

### How a wallet is proven to belong to an organisation (verification procedure)

The program cannot check the off-chain world, so the verifier follows a fixed procedure before signing
`verify_recipient`:

1. The organisation signs a message with the wallet: *"Organisation with KRS 0000123456 controls wallet X"*.
2. The verifier looks the organisation up in the official registry and contacts it **through the contact data
   in the registry** (registered address, official e-mail or ePUAP), never through contact data the applicant
   supplied, and gets the signed message confirmed there.
3. Only then does the verifier sign `verify_recipient(name, "KRS-0000123456")`. The registry number goes
   on-chain so anyone can repeat step 2.

This is done **once per organisation**, not per fundraiser: one verified hospital serves every fundraiser for
its patients. The organisation's wallet can be custodial with a regulated provider (on the organisation's
side, not ours); a hospital does not need to run crypto software itself.

### Organizer and recipient colluding

Not prevented by the program, and we do not claim it is. What changes is the cost of the fraud:

| | Before (Antoś, 2017) | With Earmark |
|---|---|---|
| Who receives the money | an anonymous private person | a registered legal entity with a registry number, address and board |
| What they signed | nothing | an on-chain confirmation that this document is theirs and they expect this amount |
| Trace | the platform's internal records | public and permanent |

The document itself can be checked too: the fundraiser page has *Verify the document yourself*. Anyone who
was shown the invoice (in the organizer's post, or by a journalist) drops the file there; the browser
computes its SHA-256, without uploading it, and shows whether it is exactly the document the recipient
confirmed on-chain. A forged or edited invoice does not match.

To steal, a registered organisation has to commit fraud under its own name. The audit page flags new
recipients, unusual volume and repeated cancellations so that pattern is visible early.

### Real money: ePLN, on-ramps and off-ramps

- **ePLN is a devnet stand-in** for a regulated stablecoin (EURC, or a PLN e-money token under MiCA). The
  program is mint-agnostic: the token is one field (`config.mint`) set at deployment.
- **An on-ramp (card, BLIK, SEPA → stablecoin) does not bring the intermediary back.** An intermediary decides
  *where* money goes. An on-ramp only converts currency. The destination is fixed by the program before the
  donor pays, so the on-ramp has no say over it. The faucet panel already links Ramp Network's hosted widget
  (*Buy with a card*, needs `NEXT_PUBLIC_RAMP_API_KEY`), which sends the purchase to the donor's own wallet.
- **The off-ramp happens after** the money has reached the right organisation: the recipient converts it
  through its own bank or provider, as with any incoming transfer. By then the donor's question, *"did the
  money reach the clinic?"*, has already been answered on-chain.

### After the payout: what if the treatment does not happen?

The program's job ends when the money reaches the recipient. If the patient dies, moves to another clinic, or the
treatment turns out cheaper, there is no on-chain way back, and we do not claim one. The difference from 2017 is
**who holds the money**: a registered organisation that issued the invoice and confirmed it on-chain, not an
anonymous person. Unspent money is then the recipient's ordinary legal duty (return it to the donors, whose wallets
and amounts are public, or move it to another fundraiser with their consent), enforceable like any contract with a
registered entity. A later version can add a *return to donors* instruction the recipient signs, which would send
the money back pro rata to the donors recorded on-chain.

### Why all or nothing?

A fundraiser is backed by one invoice with one price. Paying 70 % of a surgery buys no surgery, so a missed target
means every donor gets their money back. Partial payouts (a minimum the recipient agrees to in advance) and milestone
payouts for long treatments are possible extensions; they would be new program rules, not decisions anyone makes later.

### Next steps

Multisig verifier council, then attestations (Solana Attestation Service); registry API integration so the
verifier panel fetches the entry automatically; a regulated stablecoin with a fiat on-ramp (cards, BLIK,
SEPA); Polish UI; milestone payouts for long treatments; municipality co-funding ("residents raise X
**and** the city adds Y, otherwise refund").

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
| Web app | [earmark.help](https://earmark.help) (mirror: [earmark-app-production.up.railway.app](https://earmark-app-production.up.railway.app)) |
| Program ID | [`GWaY7mkSSwBzK6KfSGEJa9EriyvyE5k25yZQ9q4PCfMf`](https://explorer.solana.com/address/GWaY7mkSSwBzK6KfSGEJa9EriyvyE5k25yZQ9q4PCfMf?cluster=devnet) |
| ePLN mint | [`9ho3Zsfuzz5kxxLNs1U2Prmk2kYAgyvertDpe3NqzmYr`](https://explorer.solana.com/address/9ho3Zsfuzz5kxxLNs1U2Prmk2kYAgyvertDpe3NqzmYr?cluster=devnet) |
| Verifier | `4gWcjmyT4pwTL89nNym8z3UxAtXZeK6fajk3191suDc8` |
| Upgrade authority | deployer wallet `AAm3Sq5dWC7ZNr6wAidip51vKmupYKm4mXi5FuYwSmRg` (set to final before the demo) |
| Design | [Claude Design canvas](https://claude.ai/artifact/5wixJuW4EKfGg4tGmjYFVt) · mockups & tokens in [docs/design](docs/design/README.md) |
| Demo video | [youtu.be/xNkNep-AmJg](https://youtu.be/xNkNep-AmJg) |
| Pitch deck | [docs/pitch/earmark-pitch.pdf](docs/pitch/earmark-pitch.pdf) (7 slides; speaker notes in [NOTES.md](docs/pitch/NOTES.md)) |

### Hosting the web app (Railway, Docker)

The root `Dockerfile` builds only `app/` (the program is already on devnet). In Railway set:

- Build-time (inlined by `next build`): `NEXT_PUBLIC_CLUSTER=devnet`, `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_TPLN_MINT`, and ideally `NEXT_PUBLIC_RPC_URL` (a Helius/QuickNode devnet URL; the public one rate-limits); optional `NEXT_PUBLIC_RAMP_API_KEY` for the card on-ramp.
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
  the program; the audit page only flags it (see [Trust model](#trust-model-what-is-still-trusted-and-why-it-is-bounded)).
- The verifier is a single key held by the team in this build; the wallet-ownership procedure in the trust model is
  a manual process, not automated.
- The *Check in KRS / RPWDL* link opens the registry search and copies the number; neither registry has a stable
  deep link to one entry. Demo recipients use placeholder numbers that are not real registry entries.
- Fundraisers without a single payee (e.g. living costs, or aid split across many individuals) are out of scope.
- The fundraiser category (medical, humanitarian, …) is a browsing label in the off-chain metadata; the program neither knows nor enforces it.
- ePLN is a devnet test token; production would use a regulated stablecoin and a fiat on-ramp (see *Real money* in the trust model).
- The *Get test ePLN* faucet (`/api/faucet`) holds the ePLN mint-authority key on the server. That is test money and not part of the trust model; it has no per-wallet rate limit, and its cap on newly opened token accounts is in memory, so it resets on restart.
- Fundraiser titles and stories are stored by `/api/metadata` in Postgres (`DATABASE_URL`; a local JSON file in `app/data/` when it is unset), write-once per fundraiser. Their SHA-256 is in the on-chain `metadata_uri`, so the server cannot change a story unnoticed (the page shows a mismatch), but it could still delete or withhold one. Production would use content-addressed storage (IPFS/Arweave). Fundraisers created before this have no story hash.
- The document lock stops the same file from backing two fundraisers, not an edited copy of the same invoice; that case relies on the recipient refusing to confirm it twice.
- After the payout there is no on-chain refund: if the treatment does not happen, returning the money is the recipient's legal duty, not a program rule (see *After the payout*).
- All or nothing: a fundraiser that misses its target pays the recipient nothing, even at 95 %.
- A verification does not expire. The fundraiser page shows when the recipient was verified, but a recipient that closed or lost its licence stays verified until the verifier revokes it, and a revoked wallet cannot be re-verified.
- *Buy with a card (Ramp)* appears only when `NEXT_PUBLIC_RAMP_API_KEY` is set (Ramp's widget refuses to open without a host key); in this build it sells devnet SOL for fees in Ramp's demo environment, not ePLN.
- The audit page reads the 100 most recent program transactions and recomputes flags in the browser; it is a hint for humans, not a fraud verdict.
