# T11 — Frontend: create fundraiser + metadata JSON

- **Priority:** P0
- **Area:** frontend
- **Depends on:** T09, T03
- **Status:** in progress (code done; wallet transactions not yet smoke-tested in a browser)
- **Owner:** —
- **Design (read before coding):** `New.dc.html` (`/new`, incl. the `RecipientNotVerified` error state) in [docs/design/](../design/README.md) · [canvas](https://claude.ai/artifact/5wixJuW4EKfGg4tGmjYFVt)

## Description

`/new`: pick recipient (verified list + free-text wallet so the fraud demo is possible), target, deadline, title, story, quote PDF. The PDF is hashed in the browser (SHA-256) — only the hash goes on-chain. `POST /api/metadata` stores title/story in `app/data/metadata.json`.

## Acceptance criteria

- [x] Fraud demo works: own wallet as recipient → clear `RecipientNotVerified` message
- [x] No medical data is sent on-chain
- [x] Metadata is keyed by fundraiser pubkey

## Docs to update when done

- Update **Status** above and in [README.md](README.md).
- If behaviour differs from [PLAN.md](../PLAN.md), update PLAN.md in the same commit.
