/** B-01's header: "Wednesday, 23 Sep", from the SERVER's local date (I7). */
import { friendlyDate } from '../date';

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
