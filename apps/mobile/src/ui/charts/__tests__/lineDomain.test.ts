/**
 * The y-range a line is drawn against. Found on the store-screenshot account:
 * from a zero baseline, eight weeks of 83 → 79.9 kg drew as a flat line along
 * the top of the chart — the one screen whose job is to show the trend.
 */
import { lineDomain } from '../lineDomain';

const share = (lo: number, hi: number, d: { min: number; max: number }) => (hi - lo) / (d.max - d.min);

describe('lineDomain', () => {
  it('fits the data, not zero — a 3 kg cut fills the chart', () => {
    const d = lineDomain([83, 82.1, 81.4, 80.6, 79.9]);
    expect(d.min).toBeGreaterThan(70);
    expect(d.min).toBeLessThan(79.9);
    expect(d.max).toBeGreaterThan(83);
    expect(share(79.9, 83, d)).toBeGreaterThan(0.8);
  });

  it('does not draw a scale wobble as a cliff', () => {
    // 0.1 kg is water, not progress: at least 2% of the value is always in view.
    const d = lineDomain([80, 79.9, 80, 79.9]);
    expect(share(79.9, 80, d)).toBeLessThan(0.1);
  });

  it('never runs below zero for data that cannot', () => {
    expect(lineDomain([0, 1, 5]).min).toBe(0);
    expect(lineDomain([0.2, 0.3]).min).toBeGreaterThanOrEqual(0);
  });

  it('gives one value, all zeros and no data a drawable range', () => {
    for (const values of [[50], [0, 0], []]) {
      const d = lineDomain(values);
      expect(d.max).toBeGreaterThan(d.min);
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(d.min);
        expect(v).toBeLessThanOrEqual(d.max);
      }
    }
  });

  it('keeps a series that dips below zero in view', () => {
    const d = lineDomain([-2, 3]);
    expect(d.min).toBeLessThan(-2);
    expect(d.max).toBeGreaterThan(3);
  });
});
