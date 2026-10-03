# Tickets

| ID | Title | Priority | Area | Depends on | Status |
|---|---|---|---|---|---|
| [T00](T00-toolchain-workspace-setup.md) | Toolchain & workspace setup | P0 | infra | — | done |
| [T01](T01-program-state-errors-init_config.md) | Program: state, errors, init_config | P0 | program | T00 | done |
| [T02](T02-program-verify_recipient-revoke_recipient.md) | Program: verify_recipient / revoke_recipient | P0 (revoke: P1) | program | T01 | done |
| [T03](T03-program-create_fundraiser-confirm_fundraiser.md) | Program: create_fundraiser / confirm_fundraiser | P0 | program | T02 | done |
| [T04](T04-program-donate-with-automatic-payout.md) | Program: donate with automatic payout | P0 | program | T03 | done |
| [T05](T05-program-cancel-refund.md) | Program: cancel / refund | P0 | program | T04 | done |
| [T06](T06-program-tests.md) | Program tests | P0 | program | T05 | done |
| [T07](T07-devnet-deploy-tpln-mint-upgrade-authority.md) | Devnet deploy, ePLN mint, upgrade authority | P0 | infra | T06 | done |
| [T08](T08-seed-demo-state.md) | Seed demo state | P0 | infra | T07 | done |
| [T09](T09-design-claude-design-frontend-scaffold.md) | Design (Claude Design) + frontend scaffold | P0 | frontend | T00 | done |
| [T10](T10-frontend-fundraiser-list-page.md) | Frontend: fundraiser list & page | P0 | frontend | T09, T04 | done |
| [T11](T11-frontend-create-fundraiser-metadata-json.md) | Frontend: create fundraiser + metadata JSON | P0 | frontend | T09, T03 | done |
| [T12](T12-frontend-clinic-verifier-panels.md) | Frontend: recipient & verifier panels | P0 | frontend | T09, T03 | done |
| [T13](T13-frontend-tpln-faucet-button.md) | Frontend: ePLN faucet button | P1 | frontend | T07, T09 | done |
| [T14](T14-public-transparency-audit-page.md) | Public transparency & audit page | P1 | frontend | T10 | done |
| [T15](T15-readme-design-rationale.md) | README & design rationale | P0 | docs | — | done |
| [T16](T16-pitch-deck-10-slides-pdf.md) | Pitch deck (≤ 10 slides, PDF) | P0 | pitch | T15 | todo |
| [T17](T17-demo-video-3-min-rehearsal.md) | Demo video (≤ 3 min) + rehearsal | P0 | pitch | T08, T10–T12 | in progress |
| [T18](T18-submission-on-hacktribe.md) | Submission on HackTribe | P0 | pitch | T15–T17 | todo |
| [T19](T19-generalize-beyond-medical.md) | Generalize beyond medical fundraisers | P0 | program, frontend, docs | T12 | in progress |

Status values: `todo` · `in progress` · `done` · `cut`. Keep this table in sync with each ticket's **Status** line.
