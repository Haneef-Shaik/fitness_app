/** H-14's range picker: which days "Week", "Month" and "3 months" mean, and how a range reads. */
import { rangeFor, rangeLabel, validCustom } from '../range';

const TODAY = '2026-09-24';

it('a week, a month and three months all end today and include it', () => {
  expect(rangeFor('week', TODAY)).toEqual({ from: '2026-09-18', to: TODAY });
  expect(rangeFor('month', TODAY)).toEqual({ from: '2026-08-26', to: TODAY });
  expect(rangeFor('quarter', TODAY)).toEqual({ from: '2026-06-27', to: TODAY });
});

it('reads as dates and a day count, the year once', () => {
  expect(rangeLabel('2026-09-01', '2026-09-21')).toBe('1 – 21 Sep 2026 · 21 days');
  expect(rangeLabel('2026-08-26', '2026-09-24')).toBe('26 Aug – 24 Sep 2026 · 30 days');
  expect(rangeLabel('2025-12-30', '2026-01-02')).toBe('30 Dec 2025 – 2 Jan 2026 · 4 days');
  expect(rangeLabel('2026-09-24', '2026-09-24')).toBe('24 Sep 2026 · 1 day');
});

describe('a custom range', () => {
  it('must be real dates, in order, not in the future, and at most 92 days', () => {
    expect(validCustom('2026-09-01', '2026-09-20', TODAY)).toBeNull();
    expect(validCustom('2026-09-31', '2026-10-01', TODAY)).toMatch(/real date/);
    expect(validCustom('2026-09-20', '2026-09-01', TODAY)).toMatch(/before/);
    expect(validCustom('2026-09-01', '2026-09-30', TODAY)).toMatch(/future/);
    expect(validCustom('2026-01-01', '2026-09-20', TODAY)).toMatch(/three months/);
  });
});
