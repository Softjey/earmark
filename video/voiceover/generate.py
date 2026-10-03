# Generates the intro voice-over from script.json with Kokoro TTS (open-source, runs offline).
#
# Setup (once, in video/voiceover/):
#   brew install espeak-ng ffmpeg
#   uv venv .venv && uv pip install --python .venv/bin/python kokoro-onnx soundfile
#   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
#   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
#
# Run from video/voiceover/:  .venv/bin/python generate.py [voice]
# Writes ../public/vo/<line>.mp3 and ../src/vo-durations.json; the intro's scene lengths follow the durations.
import json
import os
import subprocess
import sys

import soundfile as sf
from kokoro_onnx import EspeakConfig, Kokoro

script = json.load(open("script.json"))
voice = sys.argv[1] if len(sys.argv) > 1 else script["voice"]
kokoro = Kokoro(
    "kokoro-v1.0.onnx",
    "voices-v1.0.bin",
    espeak_config=EspeakConfig(
        lib_path="/opt/homebrew/lib/libespeak-ng.dylib",
        data_path="/opt/homebrew/share/espeak-ng-data",
    ),
)
os.makedirs("../public/vo", exist_ok=True)
durations = {}
for scene in script["scenes"]:
    for line in scene["lines"]:
        samples, rate = kokoro.create(line["text"], voice=voice, speed=script.get("speed", 1.0), lang="en-us")
        sf.write(f"{line['id']}.wav", samples, rate)
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", f"{line['id']}.wav",
             "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-b:a", "160k",
             f"../public/vo/{line['id']}.mp3"],
            check=True,
        )
        durations[line["id"]] = round(len(samples) / rate, 3)
        print(f"{line['id']}: {durations[line['id']]:.2f} s")

with open("../src/vo-durations.json", "w") as f:
    json.dump(durations, f, indent=2)
print(f"total speech: {sum(durations.values()):.1f} s")
