import { loadFont as loadSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { Easing, interpolate, spring } from "remotion";

// Design tokens: docs/design/README.md
export const C = {
  ground: "#F4F6F4",
  surface: "#FFFFFF",
  ink: "#0E1A17",
  muted: "#4A5752",
  line: "#D9DFDC",
  track: "#E4E9E6",
  accent: "#0B6B55",
  accentSoft: "#E3F1EC",
  warn: "#8A4200",
  warnSoft: "#FBEEDD",
  error: "#A3261B",
  errorSoft: "#FBE7E4",
  info: "#24467A",
  infoSoft: "#E9EEF7",
};

export const SANS = loadSans("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

export const MONO = loadMono("normal", {
  weights: ["500"],
  subsets: ["latin"],
}).fontFamily;

export const FPS = 30;

/** Fade in and slide up, starting at `start`. */
export function fadeUp(frame: number, start: number, distance = 24) {
  const p = interpolate(frame, [start, start + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return { opacity: p, transform: `translateY(${(1 - p) * distance}px)` };
}

/** Fade out over `duration` frames, starting at `start`. */
export function fadeOut(frame: number, start: number, duration = 12) {
  return interpolate(frame, [start, start + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** 0 → 1 spring, starting at `start`. */
export function pop(frame: number, fps: number, start: number) {
  return spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 140 } });
}

/** 0 → 1 linear draw progress between two frames. */
export function draw(frame: number, start: number, duration: number) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
}
