import { startDraft } from '../store/reducers';
import { groupLetter, groupWithNext, membersOf, roundStep } from '../supersets';

const TRACKS = { load: true, reps: true, duration: false, distance: false };
const draft = (groups: (number | null)[], skipped: boolean[] = []) => {
  const d = startDraft({
    sessionId: 's', startedAt: '2026-09-26T10:00:00Z',
    exercises: groups.map((g, i) => ({ clientId: `x${i}`, exerciseId: `e${i}`, supersetGroup: g, tracks: TRACKS })),
  });
  return { ...d, exercises: d.exercises.map((e, i) => ({ ...e, skipped: skipped[i] ?? false })) };
};

describe('E-13 · the round', () => {
  it('a straight set rests and stays put', () => {
    expect(roundStep(draft([null, null]), 0)).toEqual({ next: 0, restNow: true });
  });

  it('a superset moves to the partner without resting, then rests after the round', () => {
    const d = draft([1, 1, null]);
    expect(roundStep(d, 0)).toEqual({ next: 1, restNow: false });
    expect(roundStep(d, 1)).toEqual({ next: 0, restNow: true });
  });

  it('a circuit of three goes round in order', () => {
    const d = draft([2, 2, 2]);
    expect([0, 1, 2].map((i) => roundStep(d, i))).toEqual([
      { next: 1, restNow: false }, { next: 2, restNow: false }, { next: 0, restNow: true },
    ]);
  });

  it('a skipped member is stepped over', () => {
    const d = draft([1, 1, 1], [false, true, false]);
    expect(membersOf(d, 0)).toEqual([0, 2]);
    expect(roundStep(d, 0)).toEqual({ next: 2, restNow: false });
  });

  it('letters read top to bottom whatever the numbers', () => {
    const d = draft([7, 7, null, 3, 3]);
    expect([0, 2, 3].map((i) => groupLetter(d, i))).toEqual(['A', null, 'B']);
  });

  it('joining the next exercise uses its group, or a free one', () => {
    expect(groupWithNext(draft([null, 4]), 0)).toBe(4);
    expect(groupWithNext(draft([1, null, null]), 1)).toBe(2);
    expect(groupWithNext(draft([null, null]), 1)).toBeNull();
  });
});
