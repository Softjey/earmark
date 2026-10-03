# Synthesises the intro's background music and sound effects (no samples, no licences needed).
#
# Run from video/sound/ with the voice-over venv (it has numpy; add scipy once):
#   uv pip install --python ../voiceover/.venv/bin/python scipy
#   ../voiceover/.venv/bin/python generate.py
# Writes ../public/music/<mood>[-drive].mp3 and ../public/sfx/<name>.mp3 (the v3 cuts).
#
#   ../voiceover/.venv/bin/python generate.py score <variant>
# scores one continuous track to a cut's picture (timings from export-timeline.ts) and writes
# ../public/music/score-<variant>.mp3 and score-<variant>-dynamic.mp3 (the v4+ cuts).
#
# All music is in A minor / C major so the moods can follow each other without clashing.
# Calm stems run at 84 BPM, the "-drive" stems (dynamic cut) at 108 BPM with drums.
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy import signal

SR = 44100
rng = np.random.default_rng(7)

NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(name: str) -> float:
    """'A3' -> 220.0"""
    pitch, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[pitch] + 12 * (octave + 1) - 69) / 12)


def t(seconds: float) -> np.ndarray:
    return np.arange(int(seconds * SR)) / SR


def env(n: int, attack: float, release: float) -> np.ndarray:
    e = np.ones(n)
    a = min(n, int(attack * SR))
    r = min(n - a, int(release * SR))
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[n - r :] = np.linspace(1, 0, r)
    return e


def lowpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    sos = signal.butter(order, cutoff, "low", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def highpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    sos = signal.butter(order, cutoff, "high", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def bandpass(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    sos = signal.butter(2, [lo, hi], "band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def reverb(x: np.ndarray, seconds: float = 2.4, mix: float = 0.3) -> np.ndarray:
    """Stereo convolution reverb with a decaying-noise impulse response."""
    n = int(seconds * SR)
    decay = np.exp(-np.linspace(0, 7, n))
    out = np.zeros((len(x) + n - 1, 2))
    mono = x if x.ndim == 1 else x.mean(axis=1)
    for ch in range(2):
        ir = lowpass(rng.standard_normal(n) * decay, 5000)
        ir /= np.sqrt(np.sum(ir**2))
        out[:, ch] = signal.fftconvolve(mono, ir)
    dry = np.zeros_like(out)
    dry[: len(x)] = x if x.ndim == 2 else np.stack([x, x], axis=1)
    return (1 - mix) * dry + mix * out


def place(track: np.ndarray, sound: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(at * SR)
    if i >= len(track):
        return
    s = sound if sound.ndim == 2 else np.stack([sound, sound], axis=1)
    n = min(len(s), len(track) - i)
    track[i : i + n] += gain * s[:n]


# ---------- instruments ----------


def pad(freqs: list[float], seconds: float, cutoff: float = 1400, attack: float = 1.2) -> np.ndarray:
    tt = t(seconds)
    x = np.zeros_like(tt)
    for f in freqs:
        for detune in (-0.08, 0.0, 0.09):
            ph = rng.uniform(0, 1)
            x += signal.sawtooth(2 * np.pi * f * (1 + detune / 100) * tt + ph * 2 * np.pi)
    x = lowpass(x / (3 * len(freqs)), cutoff, 2)
    return x * env(len(tt), attack, min(1.5, seconds / 2))


def pluck(f: float, seconds: float = 1.6, bright: float = 1.0) -> np.ndarray:
    tt = t(seconds)
    x = sum((0.6**k) * np.sin(2 * np.pi * f * (k + 1) * tt) for k in range(5))
    x *= np.exp(-tt * (3.5 / bright)) * env(len(tt), 0.004, 0.05)
    return x * 0.5


def bell(f: float, seconds: float = 2.5) -> np.ndarray:
    tt = t(seconds)
    partials = [(1, 1.0, 1.4), (2.76, 0.5, 2.6), (5.4, 0.25, 4.0), (8.93, 0.12, 6)]
    x = sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt * d) for r, a, d in partials)
    return x * env(len(tt), 0.002, 0.1) * 0.5


def sub(f: float, seconds: float) -> np.ndarray:
    tt = t(seconds)
    return np.sin(2 * np.pi * f * tt) * env(len(tt), 0.6, 0.8)


def kick(gain: float = 1.0, length: float = 0.45) -> np.ndarray:
    tt = t(length)
    freq = 45 + 90 * np.exp(-tt * 28)
    x = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 7)
    click = highpass(rng.standard_normal(len(tt)), 2000) * np.exp(-tt * 300) * 0.15
    return (x + click) * gain


def hat(gain: float = 1.0, length: float = 0.06) -> np.ndarray:
    tt = t(length)
    return highpass(rng.standard_normal(len(tt)), 7000) * np.exp(-tt * 70) * 0.35 * gain


def clap(gain: float = 1.0) -> np.ndarray:
    tt = t(0.25)
    burst = bandpass(rng.standard_normal(len(tt)), 900, 3500)
    e = np.exp(-tt * 22)
    for off in (0.0, 0.011, 0.022):  # three quick hits make it sound like a clap
        e += np.exp(-np.maximum(tt - off, 0) * 90) * (tt >= off) * 0.6
    return burst * e * 0.3 * gain


def bass(f: float, seconds: float) -> np.ndarray:
    tt = t(seconds)
    x = signal.sawtooth(2 * np.pi * f * tt) * 0.5 + np.sin(2 * np.pi * f * tt)
    return lowpass(x, 400, 2) * env(len(tt), 0.01, 0.08) * 0.5


# ---------- music ----------

CHORDS = {
    "Am": ["A2", "E3", "A3", "C4", "E4"],
    "F": ["F2", "C3", "A3", "C4", "F4"],
    "C": ["C3", "G3", "C4", "E4", "G4"],
    "G": ["G2", "D3", "G3", "B3", "D4"],
    "Dm": ["D3", "A3", "D4", "F4", "A4"],
    "Fmaj7": ["F2", "C3", "A3", "E4", "A4"],
    "Am(add9)": ["A2", "E3", "B3", "C4", "E4"],
    "E": ["E2", "B2", "E3", "G#3", "B3"],
}
ARP = {k: [hz(n) for n in v[2:]] + [hz(v[2]) * 2] for k, v in CHORDS.items()}


def progression(chords: list[str], bpm: float, bars_each: int, seconds: float, cutoff: float, arp: bool, arp_rate: int, arp_gain: float = 0.22):
    bar = 4 * 60 / bpm
    out = np.zeros((int(seconds * SR), 2))
    at, i = 0.0, 0
    while at < seconds:
        chord = chords[i % len(chords)]
        length = bar * bars_each
        p = pad([hz(n) for n in CHORDS[chord]], length + 1.0, cutoff, attack=0.8)
        place(out, p, at, 0.5)
        place(out, sub(hz(CHORDS[chord][0]) / 2, length), at, 0.25)
        if arp:
            step = bar / arp_rate
            notes = ARP[chord]
            for k in range(int(length / step)):
                place(out, pluck(notes[k % len(notes)] * 2, 1.2), at + k * step, arp_gain)
        at += length
        i += 1
    return out


def drums(seconds: float, bpm: float, pattern: str, gain: float = 1.0) -> np.ndarray:
    """pattern: 'heart' (two soft kicks per bar), 'pulse' (kick on 1 and 3, hats), 'four' (four-on-the-floor, hats, claps)."""
    beat = 60 / bpm
    out = np.zeros((int(seconds * SR), 2))
    n = int(seconds / beat)
    for b in range(n):
        at = b * beat
        if pattern == "heart":
            if b % 4 == 0:
                place(out, lowpass(kick(0.9), 300), at)
                place(out, lowpass(kick(0.6), 300), at + beat * 0.42)
        elif pattern == "pulse":
            if b % 2 == 0:
                place(out, kick(0.8), at)
            place(out, hat(0.5), at + beat / 2)
        elif pattern == "four":
            place(out, kick(0.9), at)
            place(out, hat(0.45), at + beat / 2)
            if b % 2 == 1:
                place(out, clap(0.9), at)
            if b % 4 == 3:
                place(out, hat(0.35), at + beat * 0.75)
    return out * gain


def bassline(chords: list[str], bpm: float, bars_each: int, seconds: float, eighths: bool) -> np.ndarray:
    beat = 60 / bpm
    out = np.zeros((int(seconds * SR), 2))
    step = beat / 2 if eighths else beat
    k, at = 0, 0.0
    while at < seconds:
        chord = chords[int(at / (4 * beat * bars_each)) % len(chords)]
        f = hz(CHORDS[chord][0])
        place(out, bass(f, step * 0.9), at, 0.55)
        at += step
        k += 1
    return out


def master(x: np.ndarray, seconds: float, fade_in: float = 0.5, fade_out: float = 2.0) -> np.ndarray:
    x = x[: int(seconds * SR)]
    e = env(len(x), fade_in, fade_out)[:, None]
    x = x * e
    return x / (np.max(np.abs(x)) + 1e-9) * 0.9


def music(name: str, drive: bool) -> np.ndarray:
    bpm = 108 if drive else 84
    seconds = 60.0
    if name == "story":  # warm, a little hopeful: the fundraiser as people saw it
        chords = ["Am", "F", "C", "G"]
        x = progression(chords, bpm, 1, seconds, 1500, arp=True, arp_rate=8 if drive else 4)
        if drive:
            x += drums(seconds, bpm, "pulse", 0.5)
        x = reverb(x, 2.5, 0.35)
    elif name == "dark":  # the scam is revealed: low drone, heartbeat
        chords = ["Am", "Am", "F", "Dm"]
        x = progression(chords, bpm, 2, seconds, 650, arp=False, arp_rate=4)
        tt = t(seconds)
        drone = np.sin(2 * np.pi * hz("A1") * tt) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * tt))
        x += np.stack([drone, drone], axis=1) * 0.35
        tension = np.sin(2 * np.pi * hz("D#5") * tt) * 0.03 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * tt))
        x += np.stack([tension, tension], axis=1)
        x += drums(seconds, bpm, "heart", 0.9)
        if drive:
            x += bassline(chords, bpm, 2, seconds, eighths=True) * 0.8
            x += drums(seconds, bpm, "pulse", 0.4)
        x = reverb(x, 3.0, 0.35)
    elif name == "riser":  # the question: suspense that builds up into the answer
        seconds = 12.0
        tt = t(seconds)
        noise = rng.standard_normal(len(tt))
        out = np.zeros_like(tt)
        hop = int(0.05 * SR)
        for i in range(0, len(tt) - hop, hop):  # sweep a band-pass upwards
            c = 300 + (i / len(tt)) ** 2 * 6000
            out[i : i + hop] = bandpass(noise[i : i + hop + 2000], c * 0.8, c * 1.25)[:hop]
        sweep = np.sin(2 * np.pi * np.cumsum(110 + (tt / seconds) ** 2 * 330) / SR)
        x = (out * 0.25 + sweep * 0.25) * (tt / seconds) ** 1.5
        x = np.stack([x, x], axis=1) + reverb(pad([hz("E3"), hz("B3"), hz("E4")], seconds, 900, 3.0), 2.0, 0.4)[: len(tt)] * 0.4
        x = reverb(x, 1.5, 0.25)
        return master(x, seconds, 0.3, 0.05)
    elif name == "hope":  # the answer: brighter, major, moving forward
        chords = ["C", "G", "Am", "F"]
        x = progression(chords, bpm, 1, seconds, 2600, arp=True, arp_rate=8, arp_gain=0.26)
        x += drums(seconds, bpm, "four" if drive else "pulse", 0.6 if drive else 0.35)
        if drive:
            x += bassline(chords, bpm, 1, seconds, eighths=True) * 0.7
        x = reverb(x, 2.2, 0.3)
    elif name == "resolve":  # the title: one big chord that rings out
        seconds = 14.0
        x = np.zeros((int(seconds * SR), 2))
        place(x, pad([hz(n) for n in CHORDS["Fmaj7"]], 2.4, 2500, 0.2), 0.0, 0.6)
        place(x, pad([hz(n) for n in CHORDS["C"]] + [hz("C5")], 11.0, 3000, 0.4), 2.2, 0.7)
        for i, n in enumerate(["C5", "E5", "G5", "C6"]):
            place(x, bell(hz(n), 4.0), 2.2 + i * 0.18, 0.3)
        place(x, sub(hz("C2"), 9.0), 2.2, 0.35)
        if drive:
            place(x, kick(1.0, 0.8), 2.2, 0.9)
        x = reverb(x, 3.5, 0.4)
        return master(x, seconds, 0.05, 4.0)
    else:
        raise ValueError(name)
    return master(x, seconds)


# ---------- effects ----------


def sfx(name: str) -> np.ndarray:
    if name == "whoosh":
        tt = t(0.7)
        noise = rng.standard_normal(len(tt))
        out = np.zeros_like(tt)
        hop = int(0.02 * SR)
        for i in range(0, len(tt) - hop, hop):
            p = i / len(tt)
            c = 500 + 3500 * np.sin(np.pi * p)
            out[i : i + hop] = bandpass(noise[i : i + hop + 1500], c * 0.7, c * 1.4)[:hop]
        x = out * np.sin(np.pi * tt / 0.7) ** 2
        x = reverb(x, 0.8, 0.25)
    elif name == "impact":  # deep hit for the twist
        tt = t(3.0)
        freq = 30 + 70 * np.exp(-tt * 12)
        body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 1.6)
        noise = lowpass(rng.standard_normal(len(tt)), 900) * np.exp(-tt * 9) * 0.6
        x = reverb(body + noise, 3.0, 0.4)
    elif name == "stamp":  # "got scammed."
        tt = t(0.6)
        x = kick(1.0, 0.6) + bandpass(rng.standard_normal(len(tt)), 500, 4000) * np.exp(-tt * 25) * 0.6
        x = reverb(x, 1.2, 0.25)
    elif name == "counter":  # numbers rolling up
        x = np.zeros(int(1.6 * SR))
        at, step = 0.0, 0.035
        while at < 1.5:
            tick = np.sin(2 * np.pi * 2400 * t(0.012)) * env(int(0.012 * SR), 0.0005, 0.008)
            place_mono = int(at * SR)
            x[place_mono : place_mono + len(tick)] += tick * 0.4
            at += step
            step *= 1.06
        x = reverb(x, 0.4, 0.15)
    elif name == "pop":  # an element appears
        tt = t(0.12)
        x = np.sin(2 * np.pi * np.cumsum(500 + 500 * tt / 0.12) / SR) * np.exp(-tt * 40)
        x = reverb(x, 0.4, 0.15)
    elif name == "coin":  # money lands where it should
        x = np.zeros(int(1.2 * SR))
        a, b = bell(hz("B5"), 1.0), bell(hz("E6"), 1.1)
        x[: len(a)] += a
        x[int(0.07 * SR) : int(0.07 * SR) + len(b)] += b
        x = reverb(x, 1.2, 0.25)
    elif name == "chime":  # verified / confirmed
        x = np.zeros(int(2.2 * SR))
        for i, n in enumerate(["C6", "E6", "G6"]):
            b = bell(hz(n), 1.8)
            s = int(i * 0.09 * SR)
            x[s : s + len(b)] += b * 0.7
        x = reverb(x, 1.8, 0.35)
    elif name == "error":  # blocked transfer
        tt = t(0.14)
        tone = signal.square(2 * np.pi * 150 * tt) * env(len(tt), 0.003, 0.03)
        x = np.zeros(int(0.45 * SR))
        x[: len(tt)] += tone
        x[int(0.18 * SR) : int(0.18 * SR) + len(tt)] += tone
        x = reverb(lowpass(x, 1800) * 0.6, 0.6, 0.15)
    elif name == "doubt":  # "trust?" — a soft, slightly wrong ding
        x = bell(hz("F5"), 1.6) * 0.6 + bell(hz("B5"), 1.6) * 0.4
        x = reverb(x, 1.6, 0.35)
    elif name == "refund":  # money flows back
        tt = t(0.9)
        f = 1400 - 700 * tt / 0.9
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.9) * 0.4
        x = reverb(x, 1.0, 0.3)
    else:
        raise ValueError(name)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    return x / (np.max(np.abs(x)) + 1e-9) * 0.9


def write(path: str, x: np.ndarray, lufs: float | None = None) -> None:
    """Encode to mp3; music stems are loudness-matched so mood changes don't jump in volume."""
    wav = path.replace(".mp3", ".wav")
    sf.write(wav, x, SR)
    norm = ["-af", f"loudnorm=I={lufs}:TP=-1.5:LRA=11"] if lufs is not None else []
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", wav, *norm, "-ar", "44100", "-b:a", "192k", path], check=True)
    os.remove(wav)
    print(path, f"{len(x) / SR:.1f} s")


# ---------- v4+: soft mallet effects (no bells) and one continuous score ----------


def marimba(f: float, seconds: float = 1.0) -> np.ndarray:
    tt = t(seconds)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 6)
    x += 0.25 * np.sin(2 * np.pi * f * 4 * tt) * np.exp(-tt * 22)
    x += 0.08 * np.sin(2 * np.pi * f * 10 * tt) * np.exp(-tt * 45)
    return x * env(len(tt), 0.002, 0.05) * 0.6


def mallet_sfx(name: str) -> np.ndarray:
    notes = {
        "pay": [("E5", 0.0), ("A5", 0.09)],  # money lands where it should
        "confirm": [("C5", 0.0), ("E5", 0.06), ("G5", 0.12)],  # verified / confirmed
        "uhoh": [("F4", 0.0), ("B3", 0.16)],  # "trust?"
    }[name]
    x = np.zeros(int(1.4 * SR))
    for n, at in notes:
        m = marimba(hz(n), 1.0)
        i = int(at * SR)
        x[i : i + len(m)] += m
    x = reverb(x, 1.0, 0.2)
    return x / (np.max(np.abs(x)) + 1e-9) * 0.9


def curve(total: int, points: list[tuple[float, float]]) -> np.ndarray:
    """Gain automation: linear between (seconds, gain) points, held at the ends."""
    xs, ys = zip(*sorted(points))
    return np.interp(np.arange(total) / SR, xs, ys)[:, None]


def score(scenes: list[dict], drive: bool, v5: bool = False, groove: bool = False) -> np.ndarray:
    """One track for the whole cut. The same A-minor motif runs from the hook through the scam (darker, not cut),
    holds on E for the question, turns to C major for Earmark and resolves on C for the title.
    v5 keeps mid and high frequencies under the dark part too (a quiet arpeggio and an airy upper pad), so the
    bed never sounds like silence on laptop speakers, and makes the twist dip gentler."""
    start = {s["id"].rstrip("LB"): s["start"] for s in scenes}
    seconds = scenes[-1]["start"] + scenes[-1]["length"]
    n = int(seconds * SR)
    dark, question, bright, end = start["twist"], start["question"], start["earmark"], start["title"]
    bpm = 108 if drive else 84
    beat = 60 / bpm
    bar = 4 * beat
    fade = 1.2

    # chord plan: (time, chord, length)
    plan = []
    at, i = 0.0, 0
    minor = ["Am", "F", "C", "G"]
    while at < question - 0.01:
        length = min(bar, question - at)
        plan.append((at, minor[i % 4], length))
        at += length
        i += 1
    plan.append((question, "E", bright - question))
    at, i = bright, 0
    major = ["C", "G", "Am", "F"]
    while at < end - 0.01:
        length = min(bar, end - at)
        plan.append((at, major[i % 4], length))
        at += length
        i += 1
    plan.append((end, "Fmaj7", bar))
    plan.append((end + bar, "C", max(0.5, seconds - end - bar)))

    pads_open = np.zeros((n, 2))
    pads_shut = np.zeros((n, 2))
    subs = np.zeros((n, 2))
    arp = np.zeros((n, 2))
    air = np.zeros((n, 2))
    for at, chord, length in plan:
        if v5:
            upper = [hz(x) * 2 for x in CHORDS[chord][2:]]
            place(air, pad(upper, length + 1.0, 3200, attack=1.0), at, 0.2)
        freqs = [hz(x) for x in CHORDS[chord]]
        place(pads_open, pad(freqs, length + 1.0, 1900, attack=0.6), at, 0.5)
        place(pads_shut, pad(freqs, length + 1.0, 520, attack=0.6), at, 0.6)
        place(subs, sub(freqs[0] / 2, length + 0.5), at, 0.25)
        if chord in ("E", "Fmaj7") or at >= end + bar:
            continue
        step = beat / 2 if (at >= bright or drive) else beat
        notes = ARP[chord]
        for k in range(int(round(length / step))):
            place(arp, marimba(notes[k % len(notes)] * 2, 0.9), at + k * step, 0.3)

    # automation: the open pad and the arpeggio make way for the shut pad while the scam is told
    g_open = curve(n, [(0, 1), (dark, 1), (dark + fade, 0), (bright - fade, 0), (bright, 1)])
    g_shut = 1 - g_open
    if v5:
        g_arp = curve(n, [(0, 1), (dark, 1), (dark + 0.8, 0.7), (question, 0.7), (question + 1, 0.4), (bright, 0.4), (bright + 0.6, 1), (end, 1), (end + bar, 0)])
        air *= curve(n, [(0, 1), (dark, 1), (dark + 1.5, 2.6), (bright - 0.5, 2.6), (bright + 0.5, 1)])
    else:
        g_arp = curve(n, [(0, 1), (dark, 1), (dark + 0.8, 0), (bright, 0), (bright + 0.6, 1), (end, 1), (end + bar, 0)])
    mix = pads_open * g_open + pads_shut * g_shut + subs + arp * g_arp + air

    tt = np.arange(n) / SR
    drone = np.sin(2 * np.pi * hz("A1") * tt) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * tt)) * 0.3
    mix += np.stack([drone, drone], axis=1) * curve(n, [(dark, 0), (dark + 1.5, 1), (bright - 0.8, 1), (bright, 0)])

    heart = np.zeros((n, 2))
    b = dark + bar / 2
    while b < question:
        place(heart, lowpass(kick(0.9), 300), b)
        place(heart, lowpass(kick(0.6), 300), b + beat * 0.42)
        b += bar
    mix += heart * 0.8

    # riser into the answer
    rlen = bright - question
    rt = t(rlen)
    noise = rng.standard_normal(len(rt))
    swept = np.zeros_like(rt)
    hop = int(0.05 * SR)
    for k in range(0, len(rt) - hop, hop):
        c = 300 + (k / len(rt)) ** 2 * 5000
        swept[k : k + hop] = bandpass(noise[k : k + hop + 2000], c * 0.8, c * 1.25)[:hop]
    place(mix, swept * 0.18 * (rt / rlen) ** 1.6, question)

    if drive:
        d = np.zeros((n, 2))
        beats_total = int(seconds / beat)
        for k in range(beats_total):
            at = k * beat
            if at < dark:  # light pulse under the story
                if k % 2 == 0:
                    place(d, kick(0.5), at)
                place(d, hat(0.35), at + beat / 2)
            elif at < question:  # driving bass under the scam
                place(d, bass(hz("A1") if (k // 4) % 4 != 1 else hz("F1"), beat * 0.45), at, 0.5)
                place(d, bass(hz("A1") if (k // 4) % 4 != 1 else hz("F1"), beat * 0.45), at + beat / 2, 0.5)
                place(d, hat(0.35), at + beat / 2)
            elif bright <= at < end:  # full groove for the answer
                place(d, kick(0.8), at)
                place(d, hat(0.4), at + beat / 2)
                if k % 2 == 1:
                    place(d, clap(0.8), at)
        mix += d * 0.7
        place(mix, kick(1.0, 0.8), end, 0.8)

    if groove:  # v7: a light pulse under the story and the answer (soft kick on 1 and 3, closed hats on the offbeats)
        g = np.zeros((n, 2))
        for k in range(int(seconds / beat)):
            at = k * beat
            if at < dark or bright <= at < end:
                if k % 2 == 0:
                    place(g, lowpass(kick(0.6), 900), at)
                place(g, hat(0.3), at + beat / 2)
        mix += g * curve(n, [(0, 0), (bar, 1), (dark - 0.3, 1), (dark, 0), (bright, 0), (bright + bar, 1), (end, 1)]) * 0.55
    # the answer has no drone or heartbeat under it, so lift it to the level of the scam section
    mix *= curve(n, [(0, 1), (bright - 0.3, 1), (bright + 0.8, 1.45), (seconds, 1.45)])
    # a short dip right on "did not exist" so the impact effect lands
    mix *= curve(n, [(0, 1), (dark - 0.05, 1), (dark + 0.25, 0.65 if v5 else 0.35), (dark + 1.8, 1), (seconds, 1)])
    mix = reverb(mix, 2.4, 0.3)[:n]
    mix *= curve(n, [(0, 0), (0.4, 1), (seconds - 2.5, 1), (seconds, 0)])
    return mix / (np.max(np.abs(mix)) + 1e-9) * 0.9


def swell() -> np.ndarray:
    """An A-minor chord played backwards out of its own reverb: rises for 1.2 s and stops dead on the beat."""
    x = np.zeros(int(2.5 * SR))
    for i, n in enumerate(["A3", "C4", "E4", "A4"]):
        m = marimba(hz(n), 2.0) + 0.5 * pluck(hz(n), 2.0)
        x[: len(m)] += m
    wet = reverb(x, 2.5, 0.7)
    y = wet[::-1][-int(1.2 * SR) :]
    y = y * np.linspace(0, 1, len(y))[:, None] ** 1.5
    return y / (np.max(np.abs(y)) + 1e-9) * 0.9


def thud() -> np.ndarray:
    """A soft, low landing under the twist (no noise burst)."""
    tt = t(1.4)
    freq = 42 + 30 * np.exp(-tt * 10)
    x = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 3.5) * env(len(tt), 0.01, 0.2)
    x = reverb(lowpass(x, 200), 1.5, 0.25)
    return x / (np.max(np.abs(x)) + 1e-9) * 0.9


def cut_timeline(variant: str, pacing: str) -> list[dict]:
    out = subprocess.run(
        ["../../node_modules/.bin/tsx", "export-timeline.ts", variant, pacing], capture_output=True, text=True, check=True, cwd="."
    ).stdout
    return json.loads(out)


os.makedirs("../public/music", exist_ok=True)
os.makedirs("../public/sfx", exist_ok=True)
if len(sys.argv) > 2 and sys.argv[1] == "score":
    # --v5: airier bed under the dark part, gentler twist dip, and the dynamic cut gets the calm (drum-free) score
    # --brisk: only the v6 dynamic cut (its pacing is "brisk")
    # --groove: a light rhythmic pulse (v7)
    variant, v5, groove = sys.argv[2], "--v5" in sys.argv or "--brisk" in sys.argv, "--groove" in sys.argv
    cuts = (("brisk", "-dynamic"),) if "--brisk" in sys.argv else (("calm", ""), ("dynamic", "-dynamic"))
    for pacing, suffix in cuts:
        drive = pacing == "dynamic" and not v5
        write(f"../public/music/score-{variant}{suffix}.mp3", score(cut_timeline(variant, pacing), drive, v5, groove), lufs=-18)
    for name in ["pay", "confirm", "uhoh"]:  # shared by v4+; written once so earlier cuts stay reproducible
        if not os.path.exists(f"../public/sfx/{name}.mp3"):
            write(f"../public/sfx/{name}.mp3", mallet_sfx(name))
    if v5 and not os.path.exists("../public/sfx/swell.mp3"):
        write("../public/sfx/swell.mp3", swell())
        write("../public/sfx/thud.mp3", thud())
else:
    for mood in ["story", "dark", "riser", "hope", "resolve"]:
        write(f"../public/music/{mood}.mp3", music(mood, drive=False), lufs=-18)
        write(f"../public/music/{mood}-drive.mp3", music(mood, drive=True), lufs=-18)
    for name in ["whoosh", "impact", "stamp", "counter", "pop", "coin", "chime", "error", "doubt", "refund"]:
        write(f"../public/sfx/{name}.mp3", sfx(name))
