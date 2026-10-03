import { Easing, interpolate } from "remotion";

// Light tints for text on the dark (ink) scenes.
export const D = { muted: "#9FB3AC", soft: "#B9C3BF", accent: "#7FD4B8", error: "#F2A99F" };

export const fmt = (n: number): string => n.toLocaleString("en-US").replace(/,/g, " ");

/** 0 → `to` with an ease-out, between two frames. */
export function grow(frame: number, start: number, duration: number, to: number): number {
  return interpolate(frame, [start, start + duration], [0, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}
