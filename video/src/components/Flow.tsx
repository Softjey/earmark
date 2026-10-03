import { useCurrentFrame } from "remotion";
import { draw } from "../theme";

type Pt = { x: number; y: number };

function quad(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}

/** Split a quadratic curve at t and return the first part's control point (de Casteljau). */
function partialControl(a: Pt, c: Pt, t: number): Pt {
  return { x: a.x + (c.x - a.x) * t, y: a.y + (c.y - a.y) * t };
}

/**
 * An arrow from `from` to `to` (optionally curved through `via`) that draws itself
 * starting at frame `start`, then carries coins along it.
 * `stopAt` < 1 draws only part of the way (a blocked transfer).
 */
export function Flow({
  from,
  to,
  via,
  start,
  duration = 25,
  color,
  coins = true,
  stopAt = 1,
  width = 6,
}: {
  from: Pt;
  to: Pt;
  via?: Pt;
  start: number;
  duration?: number;
  color: string;
  coins?: boolean;
  stopAt?: number;
  width?: number;
}) {
  const frame = useCurrentFrame();
  const ctrl = via ?? { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const p = draw(frame, start, duration) * stopAt;
  if (p <= 0) return null;

  const tip = quad(from, ctrl, to, p);
  const c1 = partialControl(from, ctrl, p);
  // Arrowhead direction: tangent at the tip.
  const dx = tip.x - c1.x;
  const dy = tip.y - c1.y;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const done = p >= stopAt;

  const coinStart = start + duration;
  const coinDots =
    coins && done && stopAt === 1
      ? [0, 1, 2].map((i) => {
          const t = (((frame - coinStart) / 36 + i / 3) % 1 + 1) % 1;
          const pt = quad(from, ctrl, to, t);
          const fade = Math.min(1, (frame - coinStart) / 10) * Math.min(1, t * 8, (1 - t) * 8);
          return <circle key={i} cx={pt.x} cy={pt.y} r={11} fill={color} opacity={fade} stroke="#fff" strokeWidth={3} />;
        })
      : null;

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <path
        d={`M ${from.x} ${from.y} Q ${c1.x} ${c1.y} ${tip.x} ${tip.y}`}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        fill="none"
      />
      {stopAt === 1 && (
        <polygon
          points="0,-13 22,0 0,13"
          fill={color}
          transform={`translate(${tip.x} ${tip.y}) rotate(${angle}) translate(-14 0)`}
        />
      )}
      {coinDots}
    </svg>
  );
}
