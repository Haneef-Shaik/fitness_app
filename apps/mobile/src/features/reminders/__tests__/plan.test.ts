/**
 * B-04 · what gets scheduled (G10). The reminders used to be toggles that
 * said "these do not send yet". The plan is pure: preferences + what the app
 * knows (the program's days, the next check-in, what is already logged today)
 * + the phone's clock → the notifications to set.
 *
 * Every reminder is a one-off on a date across a rolling window, because a
 * repeating one cannot skip the day the thing was already done (K-06, "only if
 * nothing's logged").
 */
import { CHECKIN_FOLLOW_UPS, phoneClock, plannedReminders, WINDOW_DAYS, type ReminderContext } from '../plan';

// Thursday 24 September 2026, 06:00 on the phone.
const clock = { today: '2026-09-24', minutes: 6 * 60 };
const ctx: ReminderContext = { programWeekdays: [0, 2, 4], nextCheckin: '2026-09-30', logged: null };

const dates = (list: { trigger: { date: string } }[]) => list.map((r) => r.trigger.date);

it('nothing is scheduled that was not switched on', () => {
  expect(plannedReminders({}, ctx, clock)).toEqual([]);
});

it('a workout reminder at 5 pm on each day the program plans one, across the window', () => {
  const r = plannedReminders({ workout: true }, ctx, clock);
  // Monday, Wednesday, Friday — two weeks of them from Thursday the 24th.
  expect(dates(r)).toEqual([
    '2026-09-25', '2026-09-28', '2026-09-30', '2026-10-02', '2026-10-05', '2026-10-07',
  ]);
  expect(r[0]).toMatchObject({
    id: 'workout-2026-09-25', kind: 'workout', title: 'Workout today',
    trigger: { date: '2026-09-25', hour: 17, minute: 0 },
  });
});

it('no program days, no workout reminder — rather than one every day', () => {
  expect(plannedReminders({ workout: true }, { ...ctx, programWeekdays: [] }, clock)).toEqual([]);
});

it('a weigh-in every morning and a meal nudge every evening, for the whole window', () => {
  const r = plannedReminders({ weigh_in: true, meal_log: true }, ctx, clock);
  const weighIns = r.filter((x) => x.kind === 'weigh_in');
  const meals = r.filter((x) => x.kind === 'meal_log');
  expect(weighIns).toHaveLength(WINDOW_DAYS);
  expect(meals).toHaveLength(WINDOW_DAYS);
  expect(weighIns[0]).toMatchObject({ id: 'weigh_in-2026-09-24', trigger: { date: '2026-09-24', hour: 7, minute: 30 } });
  expect(meals[0]).toMatchObject({ id: 'meal_log-2026-09-24', trigger: { date: '2026-09-24', hour: 20, minute: 0 } });
  expect(weighIns.at(-1)!.trigger.date).toBe('2026-10-07');
});

it('never sets one for a time already gone today — a past date either fires at once or fails', () => {
  const at9 = { ...clock, minutes: 9 * 60 };
  const r = plannedReminders({ weigh_in: true, meal_log: true }, ctx, at9);
  expect(r.find((x) => x.kind === 'weigh_in')!.trigger.date).toBe('2026-09-25');
  expect(r.find((x) => x.kind === 'meal_log')!.trigger.date).toBe('2026-09-24');
});

it('leaves out one due in the next minute or so — it could pass before it is set', () => {
  const at729 = { ...clock, minutes: 7 * 60 + 29 };
  expect(plannedReminders({ weigh_in: true }, ctx, at729)[0]!.trigger.date).toBe('2026-09-25');
  const at727 = { ...clock, minutes: 7 * 60 + 27 };
  expect(plannedReminders({ weigh_in: true }, ctx, at727)[0]!.trigger.date).toBe('2026-09-24');
});

describe('only if nothing is logged (K-06)', () => {
  it("skips today's reminder for what is already logged today", () => {
    const logged = { date: '2026-09-24', kinds: ['weigh_in', 'meal_log'] as const };
    const r = plannedReminders({ weigh_in: true, meal_log: true }, { ...ctx, logged }, clock);
    expect(r.find((x) => x.kind === 'weigh_in')!.trigger.date).toBe('2026-09-25');
    expect(r.find((x) => x.kind === 'meal_log')!.trigger.date).toBe('2026-09-25');
  });

  it('skips a workout reminder on a planned day already trained', () => {
    const friday = { today: '2026-09-25', minutes: 12 * 60 };
    const logged = { date: '2026-09-25', kinds: ['workout'] as const };
    const r = plannedReminders({ workout: true }, { ...ctx, logged }, friday);
    expect(r[0]!.trigger.date).toBe('2026-09-28');
  });

  it("yesterday's log does not silence today's reminder", () => {
    const logged = { date: '2026-09-23', kinds: ['weigh_in'] as const };
    const r = plannedReminders({ weigh_in: true }, { ...ctx, logged }, clock);
    expect(r[0]!.trigger.date).toBe('2026-09-24');
  });
});

describe('check-ins — the milestone measurements', () => {
  it('on the morning it is due, then again if it is still waiting', () => {
    const r = plannedReminders({ checkin: true }, ctx, clock);
    expect(CHECKIN_FOLLOW_UPS).toEqual([2, 7]);
    expect(r.map((x) => [x.id, x.title, x.trigger])).toEqual([
      ['checkin-2026-09-30', 'Check-in due', { date: '2026-09-30', hour: 8, minute: 0 }],
      ['checkin-2026-10-02', 'Check-in still due', { date: '2026-10-02', hour: 8, minute: 0 }],
      ['checkin-2026-10-07', 'Check-in still due', { date: '2026-10-07', hour: 8, minute: 0 }],
    ]);
    expect(r.every((x) => x.kind === 'checkin')).toBe(true);
  });

  it('overdue: only the follow-ups still to come, counted from the due date', () => {
    // Due Monday the 21st: its reminder and the +2 have gone; +7 is the 28th.
    const overdue = { ...ctx, nextCheckin: '2026-09-21' };
    expect(dates(plannedReminders({ checkin: true }, overdue, clock))).toEqual(['2026-09-28']);
  });

  it('opening the app each day never turns the follow-ups into a daily reminder', () => {
    // The review's case: due the 21st, the app opened at noon on each of the next days.
    const overdue = { ...ctx, nextCheckin: '2026-09-21' };
    const set = (today: string) => dates(plannedReminders({ checkin: true }, overdue, { today, minutes: 12 * 60 }));
    expect(set('2026-09-21')).toEqual(['2026-09-23', '2026-09-28']);
    expect(set('2026-09-22')).toEqual(['2026-09-23', '2026-09-28']);
    expect(set('2026-09-24')).toEqual(['2026-09-28']);
  });

  it('three reminders for a missed check-in, then quiet', () => {
    const longOverdue = { ...ctx, nextCheckin: '2026-09-01' };
    expect(plannedReminders({ checkin: true }, longOverdue, clock)).toEqual([]);
  });

  it('due this morning: set while 8 am is still to come', () => {
    const dueToday = { ...ctx, nextCheckin: '2026-09-24' };
    expect(dates(plannedReminders({ checkin: true }, dueToday, clock))[0]).toBe('2026-09-24');
    expect(dates(plannedReminders({ checkin: true }, dueToday, { ...clock, minutes: 15 * 60 }))[0]).toBe('2026-09-26');
  });

  it('none without a next check-in', () => {
    expect(plannedReminders({ checkin: true }, { ...ctx, nextCheckin: null }, clock)).toEqual([]);
  });
});

it('everything on at once stays inside the 64 an iPhone will hold', () => {
  const everyDay = { ...ctx, programWeekdays: [0, 1, 2, 3, 4, 5, 6] };
  const all = plannedReminders({ workout: true, weigh_in: true, meal_log: true, checkin: true }, everyDay, clock);
  expect(all.length).toBeLessThanOrEqual(64);
  expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
});

it("reads the phone's own date and time, not UTC's", () => {
  // 00:30 local on the 25th is still the 24th in UTC for anyone east of Greenwich.
  const at = new Date(2026, 8, 25, 0, 30);
  expect(phoneClock(at)).toEqual({ today: '2026-09-25', minutes: 30 });
});
