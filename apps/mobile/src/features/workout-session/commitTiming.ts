/**
 * tap → set rendered, measured (**D16 / H4.3**).
 *
 * The budget is **p95 < 100 ms**, and G3 proved only that the commit path is
 * *synchronous* — a different claim from *fast on a phone*. This records the real
 * thing: `performance.now()` when the tap is handled, and again in a post-commit
 * frame callback, so the span covers validate → reduce → publish → **paint**.
 *
 * It keeps a rolling window in memory rather than shipping anything anywhere.
 * Reading it is a deliberate act (`commitTimings.report()`), because a logger
 * that phones home about its own latency has missed the point.
 */
import { InteractionManager } from 'react-native';

const WINDOW = 200;

let samples: number[] = [];

function record(ms: number): void {
  samples.push(ms);
  if (samples.length > WINDOW) samples = samples.slice(-WINDOW);
}

const now = (): number =>
  (typeof performance !== 'undefined' && typeof performance.now === 'function')
    ? performance.now()
    : Date.now();

export interface TimingReport {
  count: number;
  p50: number;
  p95: number;
  worst: number;
  /** The budget this is measured against (D16). */
  budgetMs: number;
  withinBudget: boolean;
}

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  // Nearest-rank: with 20 samples, p95 is the 19th, not an interpolation
  // between two. It is the honest reading of a small sample.
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))]!;
}

export const commitTimings = {
  /**
   * Call at the top of the tap handler. The returned function is called once the
   * commit has been painted.
   */
  start(): () => void {
    const t0 = now();
    let done = false;
    return () => {
      if (done) return;          // a double-call would halve the apparent time
      done = true;
      // After interactions AND a frame: this is the first moment the user could
      // actually have seen the row.
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => record(now() - t0));
      });
    };
  },

  report(): TimingReport {
    const sorted = [...samples].sort((a, b) => a - b);
    const p95 = percentile(sorted, 95);
    return {
      count: sorted.length,
      p50: Math.round(percentile(sorted, 50) * 10) / 10,
      p95: Math.round(p95 * 10) / 10,
      worst: Math.round((sorted[sorted.length - 1] ?? 0) * 10) / 10,
      budgetMs: 100,
      withinBudget: sorted.length > 0 && p95 < 100,
    };
  },

  reset(): void { samples = []; },

  /** Test seam — the same path a real sample takes, window included. */
  __record(ms: number): void { record(ms); },
};
