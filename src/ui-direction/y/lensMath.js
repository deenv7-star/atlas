/**
 * Pure math behind the liquid-glass tab lens (iOS 26 Apple Music style). No DOM, so it is unit-tested
 * in tests/unit/tabbar-lens.test.mjs. Positions are viewport/bar px measured from real rects, so RTL
 * needs no special casing: whatever order the tabs render in, the nearest centre wins.
 */

/** Index of the tab whose centre is closest to x. centers: number[] (any order). */
export function nearestIndex(centers, x) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < centers.length; i += 1) {
    const d = Math.abs(centers[i] - x);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

/** Apple-style rubber band: soft resistance past an edge. overshoot px → displayed px. */
export function rubberband(overshoot, dimension, constant = 0.55) {
  if (overshoot === 0 || dimension <= 0) return 0;
  const s = Math.sign(overshoot);
  const o = Math.abs(overshoot);
  return s * (1 - 1 / ((o * constant) / dimension + 1)) * dimension;
}

/** Clamp x into [min,max] with a rubber band of `give` px beyond each edge. */
export function softClamp(x, min, max, give = 24) {
  if (x < min) return min + rubberband(x - min, give);
  if (x > max) return max + rubberband(x - max, give);
  return x;
}

/**
 * Spring from Apple's (response, dampingRatio) pair. response = period in seconds (not duration).
 * Returns { k, c } for unit mass.
 */
export function springParams(response, dampingRatio) {
  const w = (2 * Math.PI) / response;
  return { k: w * w, c: 2 * dampingRatio * w };
}

/**
 * Advance one spring by dt seconds (semi-implicit Euler, sub-stepped so a dropped frame cannot explode it).
 * s: { v (value), vel (velocity /s), target }. Mutates and returns s.
 */
export function stepSpring(s, dt, response, dampingRatio) {
  const { k, c } = springParams(response, dampingRatio);
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = Math.min(dt, 0.064) / steps;
  for (let i = 0; i < steps; i += 1) {
    const a = -k * (s.v - s.target) - c * s.vel;
    s.vel += a * h;
    s.v += s.vel * h;
  }
  return s;
}

export function settled(s, eps = 0.01, velEps = 0.05) {
  return Math.abs(s.v - s.target) < eps && Math.abs(s.vel) < velEps;
}

/** Decide whether a press becomes a lens drag: held long enough, or moved sideways past the threshold. */
export function shouldLift({ heldMs, dx, dy }, holdMs = 250, moveThreshold = 8) {
  if (Math.abs(dy) > moveThreshold * 2 && Math.abs(dy) > Math.abs(dx) * 1.5) return false;
  return heldMs >= holdMs || Math.abs(dx) >= moveThreshold;
}

/** Tuning, taken from the reference recording (Apple Music, iOS 26). */
export const LENS = {
  holdMs: 250,
  moveThreshold: 8,
  lift: 1.15, // lens scale while held
  barLift: 1.03, // the whole capsule swells slightly while the lens is up (reference)
  widthRatio: 1.36, // lens width : tab width (reference ≈ 1.35-1.4)
  heightPad: 4, // lens is this much shorter than the bar, then the 1.15 lift makes it bulge past the edges
  follow: { response: 0.14, damping: 0.86 }, // trails the finger very slightly, like liquid
  liftSpring: { response: 0.32, damping: 0.62 }, // pop up with a little overshoot
  snap: { response: 0.38, damping: 0.74 }, // release: momentum-carrying snap, slight bounce
};
