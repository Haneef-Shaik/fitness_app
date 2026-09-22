import { qk } from '../queryKeys';

describe('query key registry', () => {
  it('gives every read one key', () => {
    expect(qk.profile()).toEqual(['profile']);
    expect(qk.goal('g1')).toEqual(['goals', 'detail', 'g1']);
    expect(qk.exercise('e1')).toEqual(['exercises', 'detail', 'e1']);
    expect(qk.activeSession()).toEqual(['sessions', 'active']);
  });

  it('shares a prefix so one invalidation reaches list, detail and active', () => {
    // docs/03 §6.1: invalidating ['sessions'] must reach all three.
    const prefix = ['sessions'];
    for (const key of [qk.sessions(), qk.session('s1'), qk.activeSession()]) {
      expect(key.slice(0, prefix.length)).toEqual(prefix);
    }
  });

  it('separates list from detail so one session can be invalidated alone', () => {
    expect(qk.session('s1')).not.toEqual(qk.sessions());
    expect(qk.session('s1')).not.toEqual(qk.session('s2'));
  });

  it('treats different filters as different caches', () => {
    expect(qk.exercises({ muscle: 'chest' })).not.toEqual(qk.exercises({ muscle: 'back' }));
    expect(qk.exercises()).toEqual(qk.exercises({}));
  });

  it('defaults previous-performance to the latest occurrence', () => {
    expect(qk.previousPerformance('e1')).toEqual(['previous-performance', 'e1', 'latest']);
    expect(qk.previousPerformance('e1', '2026-09-01')).toEqual(
      ['previous-performance', 'e1', '2026-09-01'],
    );
  });
});
