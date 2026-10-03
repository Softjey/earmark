# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Cursor, …) working in this repo.

## What this is

**Earmark** is a Solana program plus a web app for medical fundraisers in which donations can only go
to a verified clinic or back to the donors, never to the organizer. Built for the Superteam Poland
"Finance Without Intermediaries" challenge (HackYeah 2026).

- Spec and architecture: [docs/PLAN.md](docs/PLAN.md). **This is the source of truth.**
- Demo script and judge Q&A: [docs/DEMO.md](docs/DEMO.md)
- Work items: [docs/tickets/](docs/tickets/README.md)

## Repo map

| Path | What |
|---|---|
| `programs/earmark/` | Anchor program (Rust). **All money rules live here and nowhere else.** |
| `tests/` | Program tests (TypeScript) |
| `app/` | Next.js frontend (wallet connect, UI, metadata JSON API) |
| `scripts/` | Deploy, mint tPLN, airdrop, seed demo state |
| `docs/` | Plan, demo script, tickets, design mockups |

## Hard rules

1. **Never move money logic off-chain.** Any rule about who can receive, donate, cancel or refund
   must be enforced in `programs/earmark`. The frontend and `app/api` may only read chain data and
   store non-financial metadata. If a backend enforced the terms, the intermediary would just be us.
2. **No medical or personal data on-chain.** Store only hashes (e.g. SHA-256 of the quote PDF).
3. **Every token transfer out of a vault goes to the recipient's ATA or the donor's own token
   account.** Do not add any other exit.
4. All code, comments, docs, commit messages and UI copy are in **English**.
5. Commit messages follow Conventional Commits (`feat(program): …`, `fix(app): …`, `docs: …`).
6. Never commit keypairs, `.env*`, `target/`, `node_modules/`, or the challenge PDFs folder.

## Commands

```bash
anchor build                      # build program + IDL
anchor test                       # run program tests on a local validator
anchor test -- --grep "refund"    # run a single test (prefer this over the full suite)
pnpm --dir app dev                # run the frontend
```

Toolchain: Rust, Solana CLI, Anchor (via `avm`). Use the `solana-dev` skill if available.

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
