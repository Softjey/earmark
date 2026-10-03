# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Cursor, …) working in this repo.

## What this is

**Earmark** is a Solana program plus a web app for fundraisers of any cause (medical,
humanitarian, disaster relief, animals, education, …) in which donations can only go to a verified recipient
organisation or back to the donors, never to the organizer. Keep the program and UI copy cause-neutral: say
"recipient", not "clinic". Medical fundraising is only the demo example. Built for the Superteam Poland
"Finance Without Intermediaries" challenge (HackYeah 2026).

- Spec and architecture: [docs/PLAN.md](docs/PLAN.md). **This is the source of truth.**
- Demo script and judge Q&A: [docs/DEMO.md](docs/DEMO.md)
- Work items: [docs/tickets/](docs/tickets/README.md)
- **UI design: [docs/design/](docs/design/README.md)** (mockups per screen + design tokens; source canvas:
  https://claude.ai/artifact/5wixJuW4EKfGg4tGmjYFVt ). **Any frontend work must follow these mockups and tokens.** Read
  `docs/design/README.md` and the mockup named in your ticket before writing UI code.

## Repo map

| Path | What |
|---|---|
| `programs/earmark/` | Anchor program (Rust). **All money rules live here and nowhere else.** |
| `tests/` | Program tests (TypeScript) |
| `app/` | Next.js frontend (wallet connect, UI, metadata JSON API) |
| `scripts/` | Deploy, mint ePLN, airdrop, seed demo state |
| `video/` | Remotion project: animated intro, outro and role badges for the demo video |
| `assets/` | Brand logo (`assets/brand/`), ePLN token logo and metadata |
| `docs/` | Plan, demo script, tickets, design mockups |

## Hard rules

1. **Never move money logic off-chain.** Any rule about who can receive, donate, cancel or refund
   must be enforced in `programs/earmark`. The frontend and `app/api` may only read chain data and
   store non-financial metadata. If a backend enforced the terms, the intermediary would just be us.
2. **No medical or personal data on-chain.** Store only hashes (e.g. SHA-256 of the supporting document).
3. **Every token transfer out of a vault goes to the recipient's ATA or the donor's own token
   account.** Do not add any other exit.
4. All code, comments, docs, commit messages and UI copy are in **English**.
5. Commit messages follow Conventional Commits (`feat(program): …`, `fix(app): …`, `docs: …`).
   Commit automatically as soon as a task (or ticket) is done and verified; do not ask for permission first.
6. Never commit keypairs, `.env*`, `target/`, `node_modules/`, or the challenge PDFs folder.

## Commands

```bash
anchor build                      # build program + IDL
anchor test --validator legacy                       # run program tests on a local validator
anchor test --validator legacy -- --grep "refund"    # run a single test (prefer this over the full suite)
pnpm --dir app dev                # run the frontend
pnpm --dir video studio           # preview demo-video animations; `render:all` writes video/out/
```

`--validator legacy` uses `solana-test-validator`; the default Surfpool runner failed to start on the dev machine.
Toolchain: Rust, Solana CLI, Anchor 1.1.x (via `avm`), Node + pnpm. Use the `solana-dev` skill if available.

## Devnet budget and state (read before touching devnet)

The program is **already deployed** to devnet and `init_config` has been called (IDs in
[README.md](README.md#deployment)). Devnet SOL is free but the faucet allows only **2 requests per
8 hours**, so treat it as scarce (~1.96 SOL left after the permissionless-refund upgrade).

- **Do not redeploy** `scripts/deploy-devnet.sh` just to test; use the local validator
  (`anchor test --validator legacy`, or `solana-test-validator` plus `ANCHOR_PROVIDER_URL=http://127.0.0.1:8899`).
  A deploy or upgrade temporarily locks ~1.8 SOL of rent. An upgrade is only allowed while the new `.so`
  fits the deployed size (357 KB after the refund upgrade); a bigger one needs `solana program extend` (min 10 240 bytes, ~0.07 SOL).
- **Do not re-run `create-mint.ts`**: config can be initialised only once; it is idempotent and just rewrites `app/.env.local`.
- `seed-demo.ts` is safe to re-run (costs a few cents, creates a new fundraiser B each time).
- **Never delete `scripts/.keys/`** (git-ignored): `verifier.json` is the on-chain verifier key and cannot be
  replaced. The deployer wallet `~/.config/solana/id.json` is the upgrade authority and ePLN mint authority.
- Never run `set-upgrade-authority --final` without the user's explicit go-ahead; it is irreversible.
- Do not use `anchor deploy` (its IDL step needs npx and fails); the script uses `solana program deploy`.

## Keeping the docs alive (required)

Docs are part of the definition of done. In the **same commit** as the code change:

- **Changed an account, instruction, error, seed or rule?** Update the tables in
  [docs/PLAN.md §5](docs/PLAN.md) and, if the demo or an answer changes, [docs/DEMO.md](docs/DEMO.md).
- **Started or finished a ticket?** Update its `Status:` line *and* the table in
  [docs/tickets/README.md](docs/tickets/README.md). Tick the acceptance criteria you met.
- **Added, moved or removed a top-level folder or script?** Update the repo map here and in
  [README.md](README.md).
- **Found a limitation or cut scope?** Add it to *Limitations* in README.md and mark the ticket `cut`.
- **New work discovered?** Add a ticket file `docs/tickets/T<NN>-<slug>.md` using the existing
  template and add it to the index.

Before finishing a task, re-read the docs you touched and check that they match the code. If the
code and PLAN.md disagree and you are unsure which is right, ask instead of guessing.
