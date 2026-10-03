# Earmark

**Medical fundraisers where the money can only go to a verified clinic, or back to the donors.**
Built on Solana for the Superteam Poland challenge *Finance Without Intermediaries* (HackYeah 2026).

> In 2017, ~6 500 people donated ~500 000 zł on a Polish crowdfunding platform to save the sight of a
> boy named Antoś. Antoś did not exist. The platform paid the money to the organizer, who spent it on
> himself. With Earmark he could still invent the story, but he could never receive the money.

**Status:** 🚧 work in progress. See [tickets](docs/tickets/README.md).

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

`programs/earmark/src/instructions/donate.rs` and `refund.rs` are the only code paths that move tokens
out of a fundraiser vault: to the recipient's token account or to the donor's own. The vault is owned
by a PDA, so no private key exists for it, and the program's upgrade authority is set to final before
the demo.

## Repo map

| Path | What |
|---|---|
| `programs/earmark/` | Anchor program: all money rules |
| `tests/` | Program tests |
| `app/` | Next.js frontend (App Router, Tailwind v4, wallet adapter; `cp app/.env.example app/.env.local`, then `pnpm --dir app dev`) |
| `assets/` | tPLN token logo and metadata JSON (served from GitHub raw) |
| `scripts/` | Deploy, mint, seed demo state |
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
Scripts (run with `pnpm exec tsx scripts/<name>.ts`): `deploy-devnet.sh`, `sync-idl.ts` (IDL → `app/src/idl`), `create-mint.ts`, `setup-faucet.ts` (devnet faucet key + mint authority handover, run once), `set-token-metadata.ts` (names the tPLN mint and sets its logo, from `assets/tpln/`), `airdrop.ts <wallet> <amount>`, `seed-demo.ts [--deadline-in <s>]`. Demo wallets are stored in git-ignored `scripts/.keys/`.

`anchor keys sync` regenerates the program ID from `target/deploy/earmark-keypair.json`; the keypair is
git-ignored, so on a fresh clone the ID in `declare_id!` and `Anchor.toml` is replaced by T07.

## Deployment

| | |
|---|---|
| Network | Solana devnet |
| Program ID | [`GWaY7mkSSwBzK6KfSGEJa9EriyvyE5k25yZQ9q4PCfMf`](https://explorer.solana.com/address/GWaY7mkSSwBzK6KfSGEJa9EriyvyE5k25yZQ9q4PCfMf?cluster=devnet) |
| tPLN mint | [`9ho3Zsfuzz5kxxLNs1U2Prmk2kYAgyvertDpe3NqzmYr`](https://explorer.solana.com/address/9ho3Zsfuzz5kxxLNs1U2Prmk2kYAgyvertDpe3NqzmYr?cluster=devnet) |
| Verifier | `4gWcjmyT4pwTL89nNym8z3UxAtXZeK6fajk3191suDc8` |
| Upgrade authority | deployer wallet `AAm3Sq5dWC7ZNr6wAidip51vKmupYKm4mXi5FuYwSmRg` (set to final before the demo) |
| Design | [Claude Design canvas](https://claude.ai/artifact/5wixJuW4EKfGg4tGmjYFVt) · mockups & tokens in [docs/design](docs/design/README.md) |
| Demo video | _TBD (T17)_ |

## Limitations

- A fake clinic that passes verification, or a clinic colluding with an organizer, is not stopped by
  the program; the audit page only flags it.
- Fundraisers without a single payee (e.g. living costs) are out of scope.
- tPLN is a devnet test token; production would use a stablecoin and a fiat on-ramp.
- The *Get test tPLN* faucet (`/api/faucet`) holds the tPLN mint-authority key on the server. That is test money and not part of the trust model; its rate limits are in memory, so they reset on restart.
- The audit page reads the 100 most recent program transactions and recomputes flags in the browser; it is a hint for humans, not a fraud verdict.
