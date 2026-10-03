# T00 — Toolchain & workspace setup

- **Priority:** P0
- **Area:** infra
- **Depends on:** —
- **Status:** done
- **Owner:** —

## Description

Initialize the Anchor workspace in the repo root (`anchor init` layout: `programs/earmark`, `tests/`, `Anchor.toml`), add `app/` (Next.js) and `scripts/` folders, a root `package.json` with pnpm workspaces, and verify `anchor build` + `anchor test` run on a local validator.

## Acceptance criteria

- [x] `anchor build` succeeds and produces `target/idl/earmark.json`
- [x] `anchor test` runs an empty test against the local validator
- [x] `Anchor.toml` has `localnet` and `devnet` clusters
- [x] README *Getting started* section lists the exact install + build commands

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
