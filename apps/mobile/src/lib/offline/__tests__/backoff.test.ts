import { BASE_DELAY_MS, MAX_DELAY_MS, backoffMs, nextAttemptAt } from '../backoff';

describe('backoff', () => {
  it('grows exponentially', () => {
    const full = () => 1; // no jitter, so the ceiling is visible
    expect(backoffMs(0, full)).toBe(BASE_DELAY_MS);
    expect(backoffMs(1, full)).toBe(2_000);
    expect(backoffMs(3, full)).toBe(8_000);
  });

  it('caps so a long outage does not become an hour-long wait', () => {
    expect(backoffMs(99, () => 1)).toBe(MAX_DELAY_MS);
  });

  it('jitters — two phones leaving the same tunnel must not retry in lockstep', () => {
    expect(backoffMs(5, () => 0)).toBe(0);
    expect(backoffMs(5, () => 0.5)).toBe(16_000);
    expect(backoffMs(5, () => 1)).toBe(32_000);
  });

  it('never returns a negative delay', () => {
    expect(backoffMs(-3, () => 1)).toBeGreaterThanOrEqual(0);
  });

  it('produces an ISO instant in the future', () => {
    const now = new Date('2026-09-22T10:00:00Z');
    expect(nextAttemptAt(0, now, () => 1)).toBe('2026-09-22T10:00:01.000Z');
  });
});
