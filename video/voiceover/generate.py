# Generates the intro voice-over with Kokoro TTS (open-source, runs offline).
#
# Setup (once):
#   brew install espeak-ng ffmpeg
#   uv venv .venv && uv pip install --python .venv/bin/python kokoro-onnx soundfile
#   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
#   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
#
# Run from video/voiceover/:  .venv/bin/python generate.py [voice]   (default af_heart)
# Writes ../public/vo/<scene>.mp3; scene lengths in src/Intro.tsx must still fit them.
import subprocess
import sys

import soundfile as sf
from kokoro_onnx import EspeakConfig, Kokoro

LINES = {
    "story": (
        "In twenty seventeen, six and a half thousand people gave half a million zloty "
        "to save a little boy's sight."
    ),
    "twist": "That boy never existed.",
    "today": "The platform held the money, and paid it to the organizer. Donors could only trust them.",
    "earmark": (
        "With Earmark, donations sit in a vault that nobody holds the key to. "
        "The money can go only to a verified clinic, or back to every donor."
    ),
    "title": "This is Earmark.",
}

voice = sys.argv[1] if len(sys.argv) > 1 else "af_heart"
kokoro = Kokoro(
    "kokoro-v1.0.onnx",
    "voices-v1.0.bin",
    espeak_config=EspeakConfig(
        lib_path="/opt/homebrew/lib/libespeak-ng.dylib",
        data_path="/opt/homebrew/share/espeak-ng-data",
    ),
)
for name, text in LINES.items():
    samples, rate = kokoro.create(text, voice=voice, speed=1.0, lang="en-us")
    sf.write(f"{name}.wav", samples, rate)
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", f"{name}.wav",
         "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-b:a", "160k", f"../public/vo/{name}.mp3"],
        check=True,
    )
    print(f"{name}: {len(samples) / rate:.2f} s")
