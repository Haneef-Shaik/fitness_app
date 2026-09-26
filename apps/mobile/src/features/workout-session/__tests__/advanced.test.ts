import {
  EMPTY_ADVANCED, NOTE_MAX, advancedSummary, appendTag, cleanNote, withRir, withRpe,
} from '../advanced';

describe('RPE and RIR suggest each other, never overwrite', () => {
  it('an RPE fills an empty RIR with 10 − RPE', () => {
    expect(withRpe(EMPTY_ADVANCED, 8)).toMatchObject({ rpe: 8, rir: 2 });
  });

  it('an RIR fills an empty RPE', () => {
    expect(withRir(EMPTY_ADVANCED, 1)).toMatchObject({ rir: 1, rpe: 9 });
  });

  it('a value the user already chose is left alone', () => {
    const v = { ...EMPTY_ADVANCED, rir: 3 };
    expect(withRpe(v, 9)).toMatchObject({ rpe: 9, rir: 3 });
  });

  it('is kept to 0–10 in half steps', () => {
    expect(withRpe(EMPTY_ADVANCED, 11).rpe).toBe(10);
    expect(withRpe(EMPTY_ADVANCED, 7.3).rpe).toBe(7.5);
    expect(withRir(EMPTY_ADVANCED, -1).rir).toBe(0);
  });

  it('clearing RPE does not invent an RIR', () => {
    expect(withRpe(EMPTY_ADVANCED, null)).toMatchObject({ rpe: null, rir: null });
  });
});

describe('notes', () => {
  it('are trimmed, capped and empty means none', () => {
    expect(cleanNote('  Grip went  ')).toBe('Grip went');
    expect(cleanNote('   ')).toBeNull();
    expect(cleanNote('x'.repeat(NOTE_MAX + 50))).toHaveLength(NOTE_MAX);
  });

  it('quick tags append as a sentence and never repeat', () => {
    expect(appendTag('', 'felt strong')).toBe('Felt strong');
    expect(appendTag('Bench moved well', 'tired')).toBe('Bench moved well. Tired');
    expect(appendTag('Good day.', 'tired')).toBe('Good day. Tired');
    expect(appendTag('Felt strong', 'felt strong')).toBe('Felt strong');
  });
});

describe('the one-line summary', () => {
  it('is null for a plain working set', () => {
    expect(advancedSummary(EMPTY_ADVANCED)).toBeNull();
  });

  it('names what was set, in order', () => {
    expect(advancedSummary({ setType: 'drop', rpe: 8.5, rir: 1, note: 'x' }))
      .toBe('Drop · RPE 8.5 · RIR 1 · note');
  });
});
