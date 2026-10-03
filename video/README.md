# Demo video animations

Remotion project for the animated parts of the demo video (see *Video cut* in [docs/DEMO.md](../docs/DEMO.md)).
Colors and fonts follow [docs/design/](../docs/design/README.md).

| Composition | Length | Output | What |
|---|---|---|---|
| `Intro` | 33 s | `out/intro.mp4` | Antoś story, "Today" vs "With Earmark" money flow, title |
| `IntroVoice` | 33 s | `out/intro-voice.mp4` | Same, with the voice-over from `public/vo/` |
| `Outro` | 11 s | `out/outro.mp4` | Four takeaways, logo |
| `RoleOrganizer`, `RoleClinic`, `RoleDonor1`, `RoleDonor2` | 4 s each | `out/role-*.mov` | Lower-third badge on a transparent background (ProRes 4444) to overlay on screen recordings |

```bash
pnpm --dir video studio        # preview and tweak in the browser
pnpm --dir video render:all    # render everything into video/out/ (git-ignored)
pnpm --dir video render:intro  # or one at a time
```

Scene timings are constants at the top of `src/Intro.tsx` and `src/Outro.tsx`; role texts are in `src/Root.tsx`.

## Voice-over

`public/vo/*.mp3` is generated offline with [Kokoro TTS](https://github.com/thewh1teagle/kokoro-onnx) (voice `af_heart`)
by [`voiceover/generate.py`](voiceover/generate.py); setup steps are at the top of that file. After changing a line,
check it still fits its scene (start offsets are in `Intro()` in `src/Intro.tsx`).
