# Downloads the third-party photos, stock clips and meme sound effects used by the v8 cut into public/v8/
# (git-ignored: they are not ours to redistribute). Credits and licences: media/CREDITS.md.
# Run from video/media/:  python3 fetch.py
import json
import os
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

OUT = "../public/v8"
BROWSER = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"}
WIKI = {"User-Agent": "EarmarkDemoVideo/1.0 (hackathon demo video)"}

# Wikimedia Commons photos (name -> file title)
PHOTOS = {
    "rl-happy": "File:Robert Lewandowski, FC Bayern München (by Sven Mandel, 2019-05-27) 01.jpg",
    "rl-sad": "File:Robert Lewandowski 2018, JAP-POL (cropped).jpg",
    "flood-1": "File:2024 Powódź w Kłodzku (01).jpg",
    "flood-2": "File:2024 Most Żelazny w Kłodzku (8), powódź.jpg",
    "police-flood": "File:Policja przy wjeździe na drogę techniczną – zbiornik Racibórz Dolny, powodzie w Polsce 2024.jpg",
    "war": "File:Chernihiv Shchors movie theater building destroyed 01.jpg",
    "shelter": "File:Dog in animal shelter in Washington, Iowa.jpg",
}

# Mixkit stock video, Mixkit Free licence only (name -> clip id)
CLIPS = {
    "phone": 4915,  # hands of a person typing on a cell phone
    "crowd": 4401,  # crowds of people cross a street junction
    "cash-falling": 18305,  # banknotes falling on a dark background
    "cash-flip": 18304,  # hands flipping through a wad of dollars
    "empty-wallet": 18299,  # person realizes that they no longer have money in his wallet
    "hacker": 50745,  # hacker wearing an anonymous face mask
}

# myinstants.com sound effects (name -> file)
SOUNDS = ["record-scratch", "sad-violin", "vine-boom", "ka-ching", "dun-dun-dun", "bruh", "windows-xp-error", "police-siren", "huh"]


def get(url: str, headers: dict, path: str) -> None:
    if os.path.exists(path):
        return
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers)) as r, open(path, "wb") as f:
        f.write(r.read())
    print(path)


def wiki_json(url: str) -> dict:
    for attempt in range(5):  # Commons rate-limits bursts (HTTP 429)
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=WIKI)))
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(10 * (attempt + 1))
    raise RuntimeError("Wikimedia Commons keeps rate-limiting; try again later")


os.makedirs(OUT, exist_ok=True)
missing = {name: title for name, title in PHOTOS.items() if not os.path.exists(f"{OUT}/{name}.jpg")}
q = urllib.parse.urlencode({"action": "query", "titles": "|".join(missing.values() or PHOTOS.values()), "prop": "imageinfo", "iiprop": "url", "iiurlwidth": "1920", "format": "json"})
if missing:
    pages = wiki_json("https://commons.wikimedia.org/w/api.php?" + q)["query"]["pages"]
    urls = {p["title"]: p["imageinfo"][0].get("thumburl") or p["imageinfo"][0]["url"] for p in pages.values()}
    for name, title in missing.items():
        get(urls[title], WIKI, f"{OUT}/{name}.jpg")
for name, clip in CLIPS.items():
    get(f"https://assets.mixkit.co/videos/{clip}/{clip}-720.mp4", BROWSER, f"{OUT}/{name}.mp4")
for name in SOUNDS:
    get(f"https://www.myinstants.com/media/sounds/{name}.mp3", BROWSER, f"{OUT}/{name}.mp3")

# meme sounds come at wildly different levels: write loudness-matched copies (<name>.norm.mp3) that the cut uses
for name in SOUNDS:
    src, dst = f"{OUT}/{name}.mp3", f"{OUT}/{name}.norm.mp3"
    if not os.path.exists(dst):
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-af", "loudnorm=I=-18:TP=-2:LRA=11", "-ar", "44100", dst], check=True)
        print(dst)
