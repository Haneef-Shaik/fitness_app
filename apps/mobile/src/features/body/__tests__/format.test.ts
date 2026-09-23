/**
 * How body figures read.
 *
 * `delta` deliberately does **not** judge: down is not automatically good and
 * up is not automatically bad — that depends on the goal, which this module
 * does not know. It reports the direction and the size and leaves the colour to
 * the screen that has the goal in hand.
 */
import { daysBetween, delta, metricLabel, metricUnit, sinceLabel, weight } from '../format';

describe('weight', () => {
  it('shows one decimal — the precision a bathroom scale actually has', () => {
    expect(weight(78.44)).toBe('78.4 kg');
    expect(weight(78)).toBe('78.0 kg');
  });

  it('is an em dash when there is nothing to show, never 0.0', () => {
    expect(weight(null)).toBe('—');
    expect(weight(undefined)).toBe('—');
  });
});

describe('delta', () => {
  it('states the direction without judging it', () => {
    expect(delta(-0.6)).toBe('▼ 0.6 kg');
    expect(delta(0.6)).toBe('▲ 0.6 kg');
  });

  it('calls a rounding-level change no change', () => {
    // 0.04 kg is the scale's own noise, not a result.
    expect(delta(0.04)).toBe('No change (kg)');
  });

  it('is null when there is no change to report', () => {
    // Null, not "0.0 kg": "we have only weighed you once" and "you have not
    // changed" are different statements.
    expect(delta(null)).toBeNull();
    expect(delta(undefined)).toBeNull();
  });
});

describe('sinceLabel', () => {
  it('says today, yesterday, and then counts', () => {
    expect(sinceLabel('2026-09-23', '2026-09-23')).toBe('Logged today');
    expect(sinceLabel('2026-09-22', '2026-09-23')).toBe('Logged yesterday');
    expect(sinceLabel('2026-09-09', '2026-09-23')).toBe('Last logged 14 days ago');
  });

  it('is a fact and never a scold', () => {
    // The wireframe is explicit about this. No "you should", no exclamation.
    const label = sinceLabel('2026-09-05', '2026-09-23');
    expect(label).toBe('Last logged 18 days ago');
    expect(label).not.toMatch(/should|!|overdue/i);
  });

  it('treats a future date as today rather than as negative days', () => {
    expect(sinceLabel('2026-09-24', '2026-09-23')).toBe('Logged today');
  });
});

describe('daysBetween', () => {
  it('counts across a month boundary', () => {
    expect(daysBetween('2026-02-26', '2026-03-02')).toBe(4);
  });

  it('counts across a year boundary', () => {
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3);
  });

  it('returns 0 for something that is not a date', () => {
    expect(daysBetween('not-a-date', '2026-09-23')).toBe(0);
  });
});

describe('metric labels', () => {
  it('names the ones it knows', () => {
    expect(metricLabel('body_weight')).toBe('Weight');
    expect(metricUnit('waist_cm')).toBe('cm');
  });

  it('makes something readable out of one it does not', () => {
    expect(metricLabel('calf_cm')).toBe('Calf Cm');
    expect(metricUnit('calf_cm')).toBe('kg');
  });
});
