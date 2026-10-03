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
| `app/` | Next.js frontend |
| `scripts/` | Deploy, mint, seed demo state |
| `docs/` | Plan, demo script, tickets, design mockups |

## Getting started

_Filled in by ticket T00._

## Deployment

| | |
|---|---|
| Network | Solana devnet |
| Program ID | _TBD (T07)_ |
| tPLN mint | _TBD (T07)_ |
| Design | [docs/design](docs/design/README.md) |
| Demo video | _TBD (T17)_ |

## Limitations

- A fake clinic that passes verification, or a clinic colluding with an organizer, is not stopped by
  the program; the audit page only flags it.
- Fundraisers without a single payee (e.g. living costs) are out of scope.
- tPLN is a devnet test token; production would use a stablecoin and a fiat on-ramp.
