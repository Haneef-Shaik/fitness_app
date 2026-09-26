/**
 * E-12 · the plate calculator's arithmetic — what to load on each side of the bar.
 *
 * Not greedy. "Heaviest plate first" misses loads a real rack can make: with
 * 25 and 15 kg plates, 30 kg a side is 15 + 15, and greedy stops at 25. So this
 * searches every per-side sum the inventory can make (plates come in pairs, any
 * number of each) and takes the closest to the target — exact when possible,
 * with the fewest plates among equals, and the lighter load on a tie, because
 * rounding a working set *up* is the one a lifter did not ask for.
 */

export interface PlateResult {
  /** Heaviest first — the order they go on the bar. */
  perSide: number[];
  /** What the bar weighs with those plates on it. */
  achieved: number;
  exact: boolean;
}

/** Hundredths: every common plate (1.25, 0.5, 2.5 lb) is a whole number of them. */
const SCALE = 100;
const toUnits = (n: number) => Math.round(n * SCALE);

export const METRIC_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export const IMPERIAL_PLATES_LB = [45, 35, 25, 10, 5, 2.5] as const;
export const METRIC_BAR_KG = 20;
export const IMPERIAL_BAR_LB = 45;

export function platesFor(target: number, bar: number, inventory: readonly number[]): PlateResult {
  const plates = [...new Set(inventory.filter((p) => p > 0))].sort((a, b) => b - a);
  const perSideTarget = Math.max(0, (target - bar) / 2);
  if (plates.length === 0 || perSideTarget === 0) {
    return { perSide: [], achieved: bar, exact: perSideTarget === 0 };
  }

  const goal = toUnits(perSideTarget);
  const units = plates.map(toUnits);
  // Search a little past the goal so the nearest load above it is a candidate.
  const limit = goal + Math.max(...units);

  // fewest[s] = fewest plates making s; from[s] = the plate added last.
  const fewest = new Array<number>(limit + 1).fill(Infinity);
  const from = new Array<number>(limit + 1).fill(-1);
  fewest[0] = 0;
  for (let s = 1; s <= limit; s++) {
    for (let i = 0; i < units.length; i++) {
      const u = units[i]!;
      if (u <= s && fewest[s - u]! + 1 < fewest[s]!) {
        fewest[s] = fewest[s - u]! + 1;
        from[s] = i;
      }
    }
  }

  let best = 0;
  for (let s = 0; s <= limit; s++) {
    if (fewest[s] === Infinity) continue;
    const d = Math.abs(s - goal);
    const bestD = Math.abs(best - goal);
    if (d < bestD || (d === bestD && s < best)) best = s;
  }

  const perSide: number[] = [];
  for (let s = best; s > 0; s -= units[from[s]!]!) perSide.push(plates[from[s]!]!);
  perSide.sort((a, b) => b - a);

  const achieved = bar + (2 * best) / SCALE;
  return { perSide, achieved: Math.round(achieved * SCALE) / SCALE, exact: best === goal };
}
