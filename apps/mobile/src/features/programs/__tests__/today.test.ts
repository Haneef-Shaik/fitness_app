/**
 * C-01's "TODAY" card: which plan day to offer. Driven by the SERVER's local
 * date (I7), never the phone's clock.
 */
import type { Program } from '@fitlog/api-types';
import { suggestDay, weekdayOf } from '../today';

const day = (id: string, name: string, scheduled_weekday: number | null) =>
  ({ id, name, scheduled_weekday, day_index: 0, notes: null, exercises: [] });
const program = (id: string, days: ReturnType<typeof day>[], status: 'active' | 'archived' = 'active') =>
  ({ id, name: id, description: null, status, days } as unknown as Program);

describe('weekdayOf', () => {
  it('is 0 for Monday … 6 for Sunday, from a YYYY-MM-DD with no timezone games', () => {
    expect(weekdayOf('2026-09-21')).toBe(0); // Monday
    expect(weekdayOf('2026-09-23')).toBe(2); // Wednesday
    expect(weekdayOf('2026-09-27')).toBe(6); // Sunday
  });
});

describe('suggestDay', () => {
  it('offers the day scheduled for today', () => {
    const p = program('ppl', [day('push', 'Push', 0), day('pull', 'Pull', 2), day('legs', 'Legs', 4)]);
    expect(suggestDay([p], '2026-09-23')).toMatchObject({ day: { id: 'pull' }, scheduled: true });
  });

  it('with nothing scheduled today, offers the first day of the first active program', () => {
    const p = program('ppl', [day('push', 'Push', 0), day('legs', 'Legs', 4)]);
    expect(suggestDay([p], '2026-09-23')).toMatchObject({ day: { id: 'push' }, scheduled: false });
  });

  it('ignores archived programs and programs with no days', () => {
    const old = program('old', [day('x', 'X', 2)], 'archived');
    const empty = program('empty', []);
    const live = program('live', [day('a', 'A', null)]);
    expect(suggestDay([old, empty, live], '2026-09-23')).toMatchObject({ program: { id: 'live' }, day: { id: 'a' } });
  });

  it('is null when there is nothing to train from', () => {
    expect(suggestDay([], '2026-09-23')).toBeNull();
    expect(suggestDay([program('e', [])], '2026-09-23')).toBeNull();
  });
});
