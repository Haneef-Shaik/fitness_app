import {
  exerciseSummaryLabel, savedAnnouncement, setRowLabel, spokenDuration, startedAgo, syncWords,
} from '../a11y';
import type { DraftSet } from '../store/types';

const set = (over: Partial<DraftSet>): DraftSet => ({
  clientId: 'c', setIndex: 0, setType: 'working', reps: 8, loadKg: 80,
  durationSeconds: null, distanceM: null, syncState: 'synced', ...over,
} as DraftSet);

const saved = { setType: 'working', loadKg: 82.5, reps: 8, durationSeconds: null, distanceM: null };

describe('what the logger says', () => {
  it('names the sync state in words, never only as a colour', () => {
    expect(syncWords('synced')).toBe('Synced');
    expect(syncWords('pending')).toBe('Waiting to sync');
    expect(syncWords('failed')).toBe('Not uploaded');
  });

  it('reads a set row in one sentence with its sync state', () => {
    expect(setRowLabel(set({}))).toBe('Set 1, 80 kilograms for 8 reps. Synced');
    expect(setRowLabel(set({ setIndex: 2, setType: 'warmup', syncState: 'pending' })))
      .toBe('Set 3, warm-up, 80 kilograms for 8 reps. Waiting to sync');
  });

  it('says which set was saved and what it recorded', () => {
    expect(savedAnnouncement(2, saved)).toBe('Set 2 saved: 82.5 kilograms for 8 reps');
    expect(savedAnnouncement(1, { ...saved, reps: 1, loadKg: 1 })).toBe('Set 1 saved: 1 kilogram for 1 rep');
    expect(savedAnnouncement(1, { ...saved, setType: 'warmup' })).toBe('Set 1, warm-up saved: 82.5 kilograms for 8 reps');
  });

  it('covers bodyweight, timed and distance sets', () => {
    expect(savedAnnouncement(3, { ...saved, loadKg: null })).toBe('Set 3 saved: 8 reps');
    expect(savedAnnouncement(1, { ...saved, loadKg: null, reps: null, durationSeconds: 60, distanceM: 400 }))
      .toBe('Set 1 saved: 60 seconds, 400 metres');
    expect(savedAnnouncement(1, { ...saved, loadKg: null, reps: null })).toBe('Set 1 saved');
  });
});

describe('the finish summary, read aloud', () => {
  it('reads a duration as a duration — "15:50" is spoken as a time of day', () => {
    expect(spokenDuration(950)).toBe('15 minutes 50 seconds');
    expect(spokenDuration(3600 + 120)).toBe('1 hour 2 minutes');
    expect(spokenDuration(61)).toBe('1 minute 1 second');
    expect(spokenDuration(0)).toBe('0 seconds');
  });

  it('reads each exercise as one sentence, without the "e1RM" abbreviation', () => {
    expect(exerciseSummaryLabel('Barbell Bench Press', 1980, 3, 105))
      .toBe('Barbell Bench Press, 1,980 kilograms, 3 sets, best estimated one-rep max 105 kilograms');
    expect(exerciseSummaryLabel(null, 0, 1, null)).toBe('Exercise, 0 kilograms, 1 set');
  });
});

describe('startedAgo', () => {
  it('says how long ago in words, not as a clock reading ("54:36 ago")', () => {
    expect(startedAgo(20)).toBe('started just now');
    expect(startedAgo(54 * 60 + 36)).toBe('started 54 minutes ago');
    expect(startedAgo(60)).toBe('started 1 minute ago');
    expect(startedAgo(3 * 3600 + 5)).toBe('started 3 hours ago');
    expect(startedAgo(2 * 86_400)).toBe('started 2 days ago');
  });
});

describe('a set row names what E-06 added', () => {
  const base = {
    clientId: 'c', setIndex: 1, setType: 'drop' as const, reps: 8, loadKg: 60,
    loadUnitEntered: 'kg' as const, durationSeconds: null, distanceM: null,
    rpe: 8.5, rir: 1, note: 'x', completed: true, performedAt: '', syncState: 'synced' as const,
  };

  it('reads the type, the effort and that there is a note', () => {
    expect(setRowLabel(base))
      .toBe('Set 2, drop set, 60 kilograms for 8 reps, RPE 8.5, 1 in reserve, has a note. Synced');
  });
});
