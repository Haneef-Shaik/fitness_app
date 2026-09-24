/**
 * B-04 · what gets scheduled (G10). The reminders used to be toggles that
 * said "these do not send yet". The plan is pure: preferences + what the app
 * knows (the program's days, the next check-in) → the notifications to set.
 */
import { plannedReminders, toExpoWeekday } from '../plan';

const ctx = { programWeekdays: [0, 2, 4], nextCheckin: '2026-09-30', today: '2026-09-24' };

it('converts the API weekday (0 = Monday) to the notifications one (1 = Sunday)', () => {
  expect([0, 1, 5, 6].map(toExpoWeekday)).toEqual([2, 3, 7, 1]);
});

it('nothing is scheduled that was not switched on', () => {
  expect(plannedReminders({}, ctx)).toEqual([]);
});

it('a workout reminder on each day the program plans one', () => {
  const r = plannedReminders({ workout: true }, ctx);
  expect(r.map((x) => x.trigger)).toEqual([
    { kind: 'weekly', weekday: 2, hour: 17, minute: 0 },
    { kind: 'weekly', weekday: 4, hour: 17, minute: 0 },
    { kind: 'weekly', weekday: 6, hour: 17, minute: 0 },
  ]);
  expect(r[0]!.title).toBe('Workout today');
});

it('no program days, no workout reminder — rather than one every day', () => {
  expect(plannedReminders({ workout: true }, { ...ctx, programWeekdays: [] })).toEqual([]);
});

it('a daily weigh-in first thing, and an evening nudge to log meals', () => {
  const r = plannedReminders({ weigh_in: true, meal_log: true }, ctx);
  expect(r.map((x) => [x.id, x.trigger])).toEqual([
    ['weigh_in', { kind: 'daily', hour: 7, minute: 30 }],
    ['meal_log', { kind: 'daily', hour: 20, minute: 0 }],
  ]);
});

it('a check-in reminder on the morning it is due — or tomorrow if that has passed', () => {
  expect(plannedReminders({ checkin: true }, ctx)[0]!.trigger)
    .toEqual({ kind: 'date', date: '2026-09-30', hour: 8, minute: 0 });
  expect(plannedReminders({ checkin: true }, { ...ctx, nextCheckin: '2026-09-20' })[0]!.trigger)
    .toEqual({ kind: 'date', date: '2026-09-25', hour: 8, minute: 0 });
  expect(plannedReminders({ checkin: true }, { ...ctx, nextCheckin: null })).toEqual([]);
});
