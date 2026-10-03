# Design

Source canvas (Claude Design, private to the owner): https://claude.ai/artifact/5wixJuW4EKfGg4tGmjYFVt

The `.dc.html` files here are exported copies of each artboard so agents can read them. They are
reference mockups, not production code: re-implement them as React components in `app/`.

| File | Screen | Route |
|---|---|---|
| `List.dc.html` | Home, all fundraisers | `/` |
| `Main.dc.html` | Fundraiser page (donor) | `/fundraisers/[pubkey]` |
| `Refund.dc.html` | Deadline passed, refund | `/fundraisers/[pubkey]` (refundable state) |
| `New.dc.html` | Start a fundraiser, incl. `RecipientNotVerified` error | `/new` |
| `Clinic.dc.html` | Recipient panel (mockup predates the rename from *clinic*; the app uses "recipient" copy and `/recipient`) | `/recipient` |
| `Verifier.dc.html` | Verifier panel | `/verifier` |
| `Audit.dc.html` | Public audit | `/audit` |

## Tokens

| Token | Value | Use |
|---|---|---|
| ground | `#F4F6F4` | page background |
| surface | `#FFFFFF` | cards |
| ink | `#0E1A17` | text, dark buttons |
| muted | `#4A5752` | secondary text |
| line | `#D9DFDC` | borders · input border `#B9C3BF` · track `#E4E9E6` |
| accent | `#0B6B55` | verified, primary action, progress · soft `#E3F1EC` |
| warn | `#8A4200` on `#FBEEDD` | deadline passed, flags |
| error | `#A3261B` / `#7E1C13` on `#FBE7E4` | program errors |
| info | `#24467A` on `#E9EEF7` | verifier role, refunds |

Type: IBM Plex Sans (UI), IBM Plex Mono (addresses, hashes, tx ids). Radii: 10 px inputs, 12 px buttons,
16 px cards, pill badges. Min touch target 44 px.
