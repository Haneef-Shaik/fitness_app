/** B-01's header: "Wednesday, 23 Sep", from the SERVER's local date (I7). */
import { friendlyDate, shortDate } from '../date';

it('names the weekday and the day, in the calendar the date string says', () => {
  expect(friendlyDate('2026-09-23')).toBe('Wednesday, 23 Sep');
  expect(friendlyDate('2026-09-21')).toBe('Monday, 21 Sep');
  expect(friendlyDate('2027-01-03')).toBe('Sunday, 3 Jan');
});

it('no timezone can move the day — the string is a calendar date, not an instant', () => {
  // Parsed as UTC midnight and formatted in UTC: a phone at UTC−11 must not
  // show the day before.
  expect(friendlyDate('2026-12-31')).toBe('Thursday, 31 Dec');
});

describe('shortDate — a date that may be months away (projections, check-ins)', () => {
  it('drops the weekday and keeps the year off when it is this year', () => {
    expect(shortDate('2026-11-04', '2026-09-23')).toBe('4 Nov');
  });

  it('says the year when it is not this one — "13 Jan" alone reads as last January', () => {
    expect(shortDate('2027-01-13', '2026-09-23')).toBe('13 Jan 2027');
    expect(shortDate('2025-12-01', '2026-09-23')).toBe('1 Dec 2025');
  });
});
