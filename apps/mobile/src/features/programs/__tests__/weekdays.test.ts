/**
 * A plan day's `scheduled_weekday` is 0 = Monday … 6 = Sunday — the API's
 * convention, the starter templates' ("Mon / Wed / Fri" is 0, 2, 4), C-01's
 * TODAY card's and the workout reminders'. The plan day editor and the program
 * screen read it Sunday-first, so a template's Monday showed as "Sun" (found
 * taking the screenshots, 2 Oct).
 */
import { PLAN_WEEKDAYS, planWeekdayName } from '../weekdays';
import { weekdayOf } from '../today';

it('starts the week on Monday, index for index with the API', () => {
  expect(PLAN_WEEKDAYS).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  expect(planWeekdayName(0)).toBe('Mon');
  expect(planWeekdayName(6)).toBe('Sun');
});

it('names the same day C-01 schedules for', () => {
  // 2026-10-05 is a Monday; C-01 offers the day whose scheduled_weekday matches.
  expect(planWeekdayName(weekdayOf('2026-10-05'))).toBe('Mon');
  expect(planWeekdayName(weekdayOf('2026-10-04'))).toBe('Sun');
});

it('has no name for something that is not a weekday', () => {
  expect(planWeekdayName(null)).toBeNull();
  expect(planWeekdayName(7)).toBeNull();
});
