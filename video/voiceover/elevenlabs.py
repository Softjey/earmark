# Voices one intro variant with ElevenLabs (v10-sarah). Costs credits: lines that already have a file are skipped.
# Key: ELEVENLABS_API_KEY in the environment, or the repo-root .env.local (a bare key or ELEVENLABS_API_KEY=...).
# Run from video/voiceover/:  python3 elevenlabs.py <variant> [voice_name]
# Writes ../public/vo-<voice>/<line>.mp3 and ../src/vo-durations-<voice>.json.
import json
import os
import subprocess
import sys
import urllib.request

VOICES = {"sarah": "EXAVITQu4vr4xnSDxMaL"}  # ElevenLabs default library
MODEL = "eleven_v4"
SETTINGS = {"stability": 0.3, "similarity_boost": 0.75, "style": 0.6}  # low stability = livelier delivery; no audio tags


def api_key() -> str:
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"]
    raw = open("../../.env.local").read().strip()
    for line in raw.splitlines():
        if line.startswith("ELEVENLABS_API_KEY="):
            return line.split("=", 1)[1].strip()
    return raw


variant = sys.argv[1]
voice = sys.argv[2] if len(sys.argv) > 2 else "sarah"
script = json.load(open("script.json"))
scenes = {s["id"]: s for s in script["scenes"]}
out_dir, durations_file = f"../public/vo-{voice}", f"../src/vo-durations-{voice}.json"
os.makedirs(out_dir, exist_ok=True)
durations = json.load(open(durations_file)) if os.path.exists(durations_file) else {}
key = api_key()
for scene_id in script["variants"][variant]:
    for line in scenes[scene_id]["lines"]:
        path = f"{out_dir}/{line['id']}.mp3"
        if not os.path.exists(path):
            req = urllib.request.Request(
                f"https://api.elevenlabs.io/v1/text-to-speech/{VOICES[voice]}?output_format=mp3_44100_128",
                data=json.dumps({"text": line["text"], "model_id": MODEL, "voice_settings": SETTINGS}).encode(),
                headers={"xi-api-key": key, "Content-Type": "application/json"},
            )
            raw = f"{out_dir}/{line['id']}.raw.mp3"
            with urllib.request.urlopen(req) as r, open(raw, "wb") as f:
                f.write(r.read())
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-b:a", "160k", path], check=True)
            os.remove(raw)
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
        durations[line["id"]] = round(float(out.stdout), 3)
        print(f"{line['id']}: {durations[line['id']]:.2f} s")
with open(durations_file, "w") as f:
    json.dump(durations, f, indent=2)
print(f"total speech: {sum(durations.values()):.1f} s")
