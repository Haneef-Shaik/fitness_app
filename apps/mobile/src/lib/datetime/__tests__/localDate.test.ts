/**
 * Which calendar day an instant falls on, as a LABEL's reference point.
 *
 * Screens worked out "today" for "Yesterday" / "6 days ago" with
 * `new Date().toISOString().slice(0, 10)` — the UTC date. Between midnight and
 * 05:30 in India that is still yesterday, so the day before read "Today".
 * I7 still holds: this picks the words, never which day a record belongs to.
 */
import { localDateIn, monthLabel } from '../index';

describe('localDateIn', () => {
  it('is the profile zone’s date, not UTC’s', () => {
    // 20:00 UTC on 1 Oct is 01:30 on 2 Oct in Kolkata.
    const instant = new Date('2026-10-01T20:00:00Z');
    expect(localDateIn(instant, 'Asia/Kolkata')).toBe('2026-10-02');
    expect(localDateIn(instant, 'America/New_York')).toBe('2026-10-01');
  });

  it('pads the month and day', () => {
    expect(localDateIn(new Date('2026-03-05T12:00:00Z'), 'UTC')).toBe('2026-03-05');
  });

  it('falls back to a usable date when the zone is unknown', () => {
    expect(localDateIn(new Date('2026-03-05T12:00:00Z'), 'Not/AZone')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('monthLabel', () => {
  it('names the month', () => {
    expect(monthLabel('2026-09')).toBe('September 2026');
    expect(monthLabel('2026-01')).toBe('January 2026');
  });

  it('leaves anything else alone', () => {
    expect(monthLabel('soon')).toBe('soon');
    expect(monthLabel('2026-13')).toBe('2026-13');
  });
});
