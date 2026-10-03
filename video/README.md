# Demo video animations

Remotion project for the animated parts of the demo video (see *Video cut* in [docs/DEMO.md](../docs/DEMO.md)).
Colors and fonts follow [docs/design/](../docs/design/README.md).

| Composition | Length | Output | What |
|---|---|---|---|
| `Intro` | 88 s | `out/intro.mp4` | Antoś story, the twist, fake fundraisers across causes (sourced stats), "Today" vs "With Earmark" money flow, title |
| `IntroLewandowski` | 92 s | `out/intro-lewandowski.mp4` | Voiced variant that opens with "In 2017, Robert Lewandowski got scammed" (the Lewandowskis gave 100 000 zł to the same fake fundraiser) |
| `IntroVoice` | 88 s | `out/intro-voice.mp4` | Same, with the voice-over from `public/vo/` |
| `Outro` | 11 s | `out/outro.mp4` | Four takeaways, logo |
| `RoleOrganizer`, `RoleClinic`, `RoleDonor1`, `RoleDonor2` | 4 s each | `out/role-*.mov` | Lower-third badge on a transparent background (ProRes 4444) to overlay on screen recordings |

```bash
pnpm --dir video studio        # preview and tweak in the browser
pnpm --dir video render:all    # render everything into video/out/ (git-ignored)
pnpm --dir video render:intro  # or one at a time
```

Scene timings are constants at the top of `src/Intro.tsx` and `src/Outro.tsx`; role texts are in `src/Root.tsx`.

## Voice-over

The narration lives in [`voiceover/script.json`](voiceover/script.json), one entry per line, grouped by scene; `variants` lists which scenes each intro version plays.
[`voiceover/generate.py`](voiceover/generate.py) turns it into `public/vo/<line>.mp3` with
[Kokoro TTS](https://github.com/thewh1teagle/kokoro-onnx) (offline, voice `af_heart`) and writes `src/vo-durations.json`;
`src/timeline.ts` sizes every scene to its lines, so after editing the script just regenerate and re-render.
Setup steps are at the top of `generate.py`.

Sources for the on-screen facts: the 2017 case ([TVN24](https://tvn24.pl/wroclaw/chcieli-pomoc-choremu-antosiowi-lewandowscy-odzyskali-pieniadze-ra755931-ls2473202),
[TVN24, sentence](https://tvn24.pl/wroclaw/wroclaw-wyrok-za-akcje-bojesieciemnosci-ra878385-ls2336600)); 150 fake flood fundraisers
found by the police cybercrime bureau after the 2024 floods ([wartowiedziec.pl, citing CBZC](https://wartowiedziec.pl/serwis-glowny/aktualnosci/74020-150-falszywych-zbiorek-dla-powodzian-hakerzy-zeruja-na-ludzkiej-tragedii-czy-wiesz-jak-sie-przed-tym-uchronic),
[Prokuratura Krajowa](https://www.gov.pl/web/prokuratura-krajowa/aktualna-informacja-o-postepowaniach-prowadzonych-w-sprawie-falszywych-zbiorek-dla-powodzian));
GoFundMe's "< 0.1 % fraud" claim and the note that it is not substantiated ([Lee et al., Sensors 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9573152/));
$30 bn raised on GoFundMe since 2010 ([AP via Chronicle of Philanthropy, 2024](https://www.philanthropy.com/news/gofundme-says-30-billion-has-been-raised-on-its-crowdfunding-and-nonprofit-giving-platforms/)).
"≈ $30 M" is our own estimate (0.1 % × $30 bn) and is labelled as such on screen.
