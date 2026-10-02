/**
 * Dates a person would say. The old screens printed the server's `local_date`
 * raw — "2026-09-20" as a hero figure on F-05, "2026-09-26 · 07:05" on every
 * weigh-in row — which reads as a database, not an app.
 */
import { humanDate } from '../humanDate';

const TODAY = '2026-09-26';

describe('humanDate', () => {
  it.each([
    ['2026-09-26', 'Today'],
    ['2026-09-25', 'Yesterday'],
    ['2026-09-27', 'Tomorrow'],
  ])('%s → %s', (date, label) => {
    expect(humanDate(date, TODAY)).toBe(label);
  });

  it('names the weekday for anything else this year', () => {
    expect(humanDate('2026-09-20', TODAY)).toBe('Sun 20 Sep');
    expect(humanDate('2026-01-02', TODAY)).toBe('Fri 2 Jan');
  });

  it('adds the year only when it differs from today', () => {
    expect(humanDate('2025-12-31', TODAY)).toBe('Wed 31 Dec 2025');
  });

  it('never moves a calendar date across a timezone', () => {
    // Parsed as a calendar day (I7), so the phone's own zone cannot shift it.
    expect(humanDate('2026-03-01', '2026-03-05')).toBe('Sun 1 Mar');
  });

  it('returns what it was given when it is not a date', () => {
    expect(humanDate('not-a-date', TODAY)).toBe('not-a-date');
    expect(humanDate('', TODAY)).toBe('');
  });
});
