# Generates the intro voice-over from script.json with Kokoro TTS (open-source, runs offline).
#
# Setup (once, in video/voiceover/):
#   brew install espeak-ng ffmpeg
#   uv venv .venv && uv pip install --python .venv/bin/python kokoro-onnx soundfile
#   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
#   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
#
# Run from video/voiceover/:  .venv/bin/python generate.py [voice] [--fast]
# Writes ../public/vo/<line>.mp3 and ../src/vo-durations.json; the intro's scene lengths follow the durations.
# --fast reads 15 % quicker into ../public/vo-fast/ and ../src/vo-durations-fast.json (the dynamic cut).
import json
import os
import subprocess
import sys

import soundfile as sf
from kokoro_onnx import EspeakConfig, Kokoro

script = json.load(open("script.json"))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
fast = "--fast" in sys.argv
voice = args[0] if args else script["voice"]
speed = script.get("speed", 1.0) * (1.15 if fast else 1.0)
out_dir = "../public/vo-fast" if fast else "../public/vo"
durations_file = "../src/vo-durations-fast.json" if fast else "../src/vo-durations.json"
kokoro = Kokoro(
    "kokoro-v1.0.onnx",
    "voices-v1.0.bin",
    espeak_config=EspeakConfig(
        lib_path="/opt/homebrew/lib/libespeak-ng.dylib",
        data_path="/opt/homebrew/share/espeak-ng-data",
    ),
)
os.makedirs(out_dir, exist_ok=True)
durations = {}
for scene in script["scenes"]:
    for line in scene["lines"]:
        samples, rate = kokoro.create(line["text"], voice=voice, speed=speed, lang="en-us")
        sf.write(f"{line['id']}.wav", samples, rate)
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", f"{line['id']}.wav",
             "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-b:a", "160k",
             f"{out_dir}/{line['id']}.mp3"],
            check=True,
        )
        durations[line["id"]] = round(len(samples) / rate, 3)
        print(f"{line['id']}: {durations[line['id']]:.2f} s")

with open(durations_file, "w") as f:
    json.dump(durations, f, indent=2)
print(f"total speech: {sum(durations.values()):.1f} s")
