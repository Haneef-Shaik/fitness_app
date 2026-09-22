import { appendSet, startDraft } from '../store/reducers';
import { contribution, draftRecords, summarise } from '../summary';

const TRACKS = { load: true, reps: true, duration: false, distance: false };

function draftWith(sets: Array<{ reps: number; loadKg: number; setType?: 'warmup' | 'working' }>) {
  let d = startDraft({
    sessionId: 's1',
    startedAt: '2026-09-22T10:00:00Z',
    exercises: [{ clientId: 'x1', exerciseId: 'e1', exerciseName: 'Bench', tracks: TRACKS }],
  });
  sets.forEach((s, i) => { d = appendSet(d, 'x1', { clientId: `c${i}`, ...s }); });
  return d;
}

const FINISHED = new Date('2026-09-22T11:00:00Z');

describe('the instant summary agrees with the server by construction', () => {
  it('excludes warm-ups from volume (I3/D6)', () => {
    // Exactly the scenario the server's /stats test asserts: warm-up 10x40 plus
    // 8x80 and 6x90 is 1180 kg, not 1580.
    const d = draftWith([
      { reps: 10, loadKg: 40, setType: 'warmup' },
      { reps: 8, loadKg: 80 },
      { reps: 6, loadKg: 90 },
    ]);

    expect(summarise(d, FINISHED).totalVolumeKg).toBeCloseTo(1180);
  });

  it('uses Epley and carries its version (I5)', () => {
    const s = summarise(draftWith([{ reps: 6, loadKg: 90 }]), FINISHED);

    expect(s.exercises[0]!.bestE1rmKg).toBeCloseTo(108); // 90 x (1 + 6/30)
    expect(s.exercises[0]!.formulaVersion).toBe('epley_v1');
  });

  it('never treats a warm-up as a clean e1RM attempt', () => {
    const s = summarise(draftWith([
      { reps: 1, loadKg: 200, setType: 'warmup' },
      { reps: 5, loadKg: 100 },
    ]), FINISHED);

    // Epley on 100x5 = 100 x (1 + 5/30) = 116.67. The 200x1 warm-up would have
    // been 206.67, so this also proves the warm-up was not treated as an attempt.
    expect(s.exercises[0]!.bestE1rmKg).toBeCloseTo(116.67, 1);
  });

  it('counts every set, including warm-ups — they happened', () => {
    const s = summarise(draftWith([
      { reps: 10, loadKg: 40, setType: 'warmup' },
      { reps: 8, loadKg: 80 },
    ]), FINISHED);

    expect(s.setCount).toBe(2);
  });

  it('measures the session duration from its start', () => {
    expect(summarise(draftWith([]), FINISHED).durationSeconds).toBe(3600);
  });

  it('never reports a negative duration', () => {
    expect(summarise(draftWith([]), new Date('2026-09-22T09:00:00Z')).durationSeconds).toBe(0);
  });

  it('summarises an empty session without dividing by anything', () => {
    const s = summarise(draftWith([]), FINISHED);
    expect(s).toMatchObject({ setCount: 0, totalVolumeKg: 0, exerciseCount: 1 });
    expect(s.exercises[0]!.bestE1rmKg).toBeNull();
  });
});

describe('per-set contribution (E-03 delta)', () => {
  it('is load x reps for a working set', () => {
    const d = draftWith([{ reps: 8, loadKg: 80 }]);
    expect(contribution(d.exercises[0]!.sets[0]!)).toBeCloseTo(640);
  });

  it('is zero for a warm-up', () => {
    const d = draftWith([{ reps: 10, loadKg: 40, setType: 'warmup' }]);
    expect(contribution(d.exercises[0]!.sets[0]!)).toBe(0);
  });
});

describe('records for E-11', () => {
  it('reports the best working set, ignoring warm-ups', () => {
    const d = draftWith([
      { reps: 1, loadKg: 200, setType: 'warmup' },
      { reps: 5, loadKg: 100 },
      { reps: 8, loadKg: 80 },
    ]);

    const r = draftRecords(d.exercises[0]!.sets);

    expect(r.maxLoadKg).toBe(100);
    expect(r.maxReps).toBe(8);
  });
});
