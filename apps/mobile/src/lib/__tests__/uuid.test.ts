import { isUuid, uuid } from '../uuid';

describe('client-generated ids are real UUIDs', () => {
  it('produces a v4 UUID', () => {
    // The server types Idempotency-Key as a UUID and 422s anything else, which
    // shows up as a set that logs fine and never uploads.
    expect(isUuid(uuid())).toBe(true);
  });

  it('produces a v4 UUID without a platform generator', () => {
    const original = globalThis.crypto;
    // Deliberately removed, as a Hermes build without it would be.
    delete (globalThis as { crypto?: unknown }).crypto;
    try {
      const v = uuid();
      expect(isUuid(v)).toBe(true);
      expect(v[14]).toBe('4');
      expect('89ab').toContain(v[19]!.toLowerCase());
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });

  it('does not repeat itself', () => {
    const seen = new Set(Array.from({ length: 500 }, () => uuid()));
    expect(seen.size).toBe(500);
  });

  it('rejects the shapes that are not UUIDs', () => {
    expect(isUuid('mg1x2k-ab12cd34')).toBe(false);  // the bug this file exists for
    expect(isUuid('')).toBe(false);
    expect(isUuid('not-a-uuid')).toBe(false);
  });
});
