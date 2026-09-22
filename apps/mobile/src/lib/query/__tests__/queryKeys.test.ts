import { qk, qkPrefix } from '../queryKeys';

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

describe('every key in the registry is reachable', () => {
  it('produces a distinct, non-empty key for each read', () => {
    const keys = [
      qk.me(), qk.profile(), qk.goals(), qk.goals('active'), qk.goal('g'),
      qk.muscleGroups(), qk.exercises({ q: 'press' }), qk.exercise('e'),
      qk.programs(), qk.program('p'),
      qk.sessions({ limit: 10 }), qk.session('s'), qk.activeSession(),
      qk.records('e'), qk.previousPerformance('e'),
    ].map((k) => JSON.stringify(k));

    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k.length).toBeGreaterThan(2);
  });

  it('separates goal statuses so a filtered list is its own cache', () => {
    expect(qk.goals('active')).not.toEqual(qk.goals());
  });
});

describe('invalidation prefixes', () => {
  it('every prefix is a strict prefix of the keys it must reach', () => {
    const pairs: Array<[readonly unknown[], readonly unknown[]]> = [
      [qkPrefix.goals(), qk.goal('g')],
      [qkPrefix.exercises(), qk.exercise('e')],
      [qkPrefix.programs(), qk.program('p')],
      [qkPrefix.sessions(), qk.session('s')],
      [qkPrefix.records(), qk.records('e')],
      [qkPrefix.exerciseHistory(), qk.exerciseHistory('e')],
      [qkPrefix.exerciseStats(), qk.exerciseStats('e')],
    ];
    for (const [prefix, key] of pairs) {
      expect(key.slice(0, prefix.length)).toEqual(prefix);
      expect(key.length).toBeGreaterThan(prefix.length);
    }
  });
});
