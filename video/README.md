# Demo video animations

Remotion project for the animated parts of the demo video (see *Video cut* in [docs/DEMO.md](../docs/DEMO.md)).
Colors and fonts follow [docs/design/](../docs/design/README.md).

| Composition | Length | Output | What |
|---|---|---|---|
| `Intro` | 89 s | `out/intro.mp4` | Antoś story, the twist, fake fundraisers across causes (sourced stats), "Today" vs "With Earmark" money flow, title |
| `IntroLewandowski` | 93 s | `out/intro-lewandowski.mp4` | Voiced variant that opens with "In 2017, Robert Lewandowski got scammed" (the Lewandowskis gave 100 000 zł to the same fake fundraiser) |
| `IntroLewandowskiV4` | 110 s | `out/intro-lewandowski-v4.mp4` | v3 with one continuous track scored to the picture (no hard cut at the twist), no bells, music ~5 dB lower |
| `IntroLewandowskiV4Dynamic` | 92 s | `out/intro-lewandowski-v4-dynamic.mp4` | The dynamic cut with the same v4 sound |
| `IntroLewandowskiV3` | 110 s | `out/intro-lewandowski-v3.mp4` | v2 with background music (a mood per part of the story) and sound effects on the key beats; "2 years old" fix |
| `IntroLewandowskiV3Dynamic` | 92 s | `out/intro-lewandowski-v3-dynamic.mp4` | Experimental fast cut of v3: 15 % quicker voice, tighter gaps, punch-in transitions, camera shake on impacts, drum-driven music, an effect on every element |
| `IntroLewandowskiV2` | 110 s | `out/intro-lewandowski-v2.mp4` | Lewandowski opening plus Solana named in the vault scene and a "Why a blockchain?" scene (database vs blockchain) |
| `IntroVoice` | 89 s | `out/intro-voice.mp4` | Same, with the voice-over from `public/vo/` |
| `Outro` | 11 s | `out/outro.mp4` | Four takeaways, logo |
| `RoleOrganizer`, `RoleClinic`, `RoleDonor1`, `RoleDonor2` | 4 s each | `out/role-*.mov` | Lower-third badge on a transparent background (ProRes 4444) to overlay on screen recordings |

```bash
pnpm --dir video studio        # preview and tweak in the browser
pnpm --dir video render:all    # render everything into video/out/ (git-ignored)
pnpm --dir video render:intro  # or one at a time
```

Every new version gets its own composition and file name (`-v2`, `-v3`, …); never re-render a new cut over an older file.

Scene timings are constants at the top of `src/Intro.tsx` and `src/Outro.tsx`; role texts are in `src/Root.tsx`.

## Voice-over

The narration lives in [`voiceover/script.json`](voiceover/script.json), one entry per line, grouped by scene; `variants` lists which scenes each intro version plays.
[`voiceover/generate.py`](voiceover/generate.py) turns it into `public/vo/<line>.mp3` with
[Kokoro TTS](https://github.com/thewh1teagle/kokoro-onnx) (offline, voice `af_heart`) and writes `src/vo-durations.json`;
`src/timeline.ts` sizes every scene to its lines, so after editing the script just regenerate and re-render.
Setup steps are at the top of `generate.py`.

## Music and sound effects

Everything is synthesised by [`sound/generate.py`](sound/generate.py) (numpy + scipy, no samples or licences):
`public/music/<mood>.mp3` (calm, 84 BPM) and `<mood>-drive.mp3` (dynamic cut, 108 BPM with drums), and
`public/sfx/*.mp3`. Moods follow the story: `story` (the fundraiser) → `dark` (the scam, the stakes, today) →
`riser` (the question) → `hope` (Earmark, why a blockchain) → `resolve` (title). All stems are in A minor / C major
and loudness-matched, so the mood changes don't clash. `src/cut.tsx` places the effects: the calm cut plays only the
story beats (stamp, twist impact, blocked transfer, payout), the dynamic cut plays one on every element.

From v4 on, the music is one continuous track per cut: `generate.py score <variant>` reads the cut's scene timings
(`sound/export-timeline.ts`) and writes `public/music/score-<variant>[-dynamic].mp3`. The same A-minor motif runs
from the hook through the scam (it darkens instead of stopping), holds on E for the question, turns to C major for
Earmark and resolves on C for the title. v4 also replaces the bell-like effects with soft mallets
(`pay`, `confirm`, `uhoh`). Re-run `score` whenever the voice-over or scene list of a cut changes.

Sources for the on-screen facts: the 2017 case ([TVN24](https://tvn24.pl/wroclaw/chcieli-pomoc-choremu-antosiowi-lewandowscy-odzyskali-pieniadze-ra755931-ls2473202),
[TVN24, sentence](https://tvn24.pl/wroclaw/wroclaw-wyrok-za-akcje-bojesieciemnosci-ra878385-ls2336600)); 150 fake flood fundraisers
found by the police cybercrime bureau after the 2024 floods ([wartowiedziec.pl, citing CBZC](https://wartowiedziec.pl/serwis-glowny/aktualnosci/74020-150-falszywych-zbiorek-dla-powodzian-hakerzy-zeruja-na-ludzkiej-tragedii-czy-wiesz-jak-sie-przed-tym-uchronic),
[Prokuratura Krajowa](https://www.gov.pl/web/prokuratura-krajowa/aktualna-informacja-o-postepowaniach-prowadzonych-w-sprawie-falszywych-zbiorek-dla-powodzian));
$96 M reported lost to fraudulent charities, crowdfunding accounts and disaster relief campaigns in the US in 2024
([FBI IC3, PSA of 16 Jan 2025](https://ic3.gov/PSA/2025/PSA250116)).
