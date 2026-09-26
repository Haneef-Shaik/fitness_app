/**
 * The y-range a line chart is drawn against.
 *
 * A bar encodes its value by length, so it needs a zero baseline (05 §3). A
 * line encodes change by position, and from zero it hides the change: eight
 * weeks of 83 → 79.9 kg drew as a flat line along the top of the chart. So a
 * line fits its own data, with headroom.
 *
 * The opposite failure is kept away by a floor on the span — at least
 * `MIN_SPAN_FRACTION` of the values' size — so 80.0 → 79.9 kg of water is not
 * drawn as a cliff. Data that cannot go negative is never given a negative
 * axis.
 */
export interface Domain {
  min: number;
  max: number;
}

/** The smallest span shown, as a fraction of the largest value's size. */
export const MIN_SPAN_FRACTION = 0.02;
/** Headroom above and below the data, as a fraction of the span. */
const HEADROOM = 0.1;

export function lineDomain(values: readonly number[]): Domain {
  if (values.length === 0) return { min: 0, max: 1 };
  const lo = Math.min(...values);
  const hi = Math.max(...values);

  const magnitude = Math.max(Math.abs(lo), Math.abs(hi));
  const span = Math.max(hi - lo, magnitude * MIN_SPAN_FRACTION) || 1;
  const half = (span / 2) * (1 + 2 * HEADROOM);
  const mid = (hi + lo) / 2;

  const min = mid - half;
  const max = mid + half;
  // Shifted, not clipped, so the span — and the floor on it — survives.
  return lo >= 0 && min < 0 ? { min: 0, max: max - min } : { min, max };
}
