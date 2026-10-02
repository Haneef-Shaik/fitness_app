/**
 * B-01's "up next" line: the one thing the dashboard suggests doing now.
 *
 * The old dashboard was four cards each ending in a small grey button, and
 * nothing told a new user which to press. This is the rule that decides,
 * in a fixed order, so the suggestion is predictable rather than clever.
 */
import { mealForHour, nextUp, type NextUpInput } from '../nextUp';

const base: NextUpInput = {
  local_date: '2026-09-26',
  training: {
    active_session_id: null, sessions_today: 1,
    last_session: { local_date: '2026-09-26' },
  },
  nutrition: { meals_logged: 2, pending_count: 0 },
  body: { latest: { local_date: '2026-09-26' } },
};

describe('nextUp — in order of what matters most', () => {
  it('an open workout comes before everything', () => {
    const next = nextUp({ ...base, training: { ...base.training, active_session_id: 's9' } }, 12);
    expect(next).toMatchObject({ kind: 'resume', href: '/session/s9' });
  });

  it('a brand-new account gets the checklist, not a random first task', () => {
    const next = nextUp({
      ...base,
      training: { active_session_id: null, sessions_today: 0, last_session: null },
      nutrition: { meals_logged: 0, pending_count: 0 },
      body: { latest: null },
    }, 12);
    expect(next.kind).toBe('first-run');
  });

  it('estimated food waits for a check before anything new is suggested', () => {
    const next = nextUp({ ...base, nutrition: { meals_logged: 1, pending_count: 2 } }, 12);
    expect(next).toMatchObject({ kind: 'review', href: '/nutrition' });
    expect(next.title).toBe('Check 2 estimated items');
  });

  it('suggests training when nothing has been trained today', () => {
    const next = nextUp({
      ...base,
      training: { active_session_id: null, sessions_today: 0, last_session: { local_date: '2026-09-23' } },
    }, 12);
    expect(next).toMatchObject({ kind: 'workout', href: '/train/start' });
    expect(next.body).toBe('Last session 3 days ago.');
  });

  it('then a meal, named for the time of day', () => {
    const next = nextUp({ ...base, nutrition: { meals_logged: 0, pending_count: 0 } }, 13);
    expect(next).toMatchObject({ kind: 'meal', href: '/nutrition/add', title: 'Log lunch' });
  });

  it('then a weigh-in once a week', () => {
    const next = nextUp({ ...base, body: { latest: { local_date: '2026-09-18' } } }, 12);
    expect(next).toMatchObject({ kind: 'weigh-in', href: '/progress/log' });
    expect(next.body).toBe('Last logged 8 days ago.');
  });

  it('leaves a recent weigh-in alone', () => {
    const next = nextUp({ ...base, body: { latest: { local_date: '2026-09-22' } } }, 12);
    expect(next.kind).toBe('done');
  });

  it('says so when everything is done', () => {
    expect(nextUp(base, 12)).toMatchObject({ kind: 'done', href: '/progress' });
  });
});

describe('mealForHour', () => {
  it.each([
    [6, 'breakfast'], [9, 'breakfast'], [10, 'lunch'], [14, 'lunch'],
    [15, 'dinner'], [20, 'dinner'], [21, 'a snack'], [23, 'a snack'], [2, 'a snack'],
  ])('%i:00 → %s', (hour, meal) => {
    expect(mealForHour(hour)).toBe(meal);
  });
});
