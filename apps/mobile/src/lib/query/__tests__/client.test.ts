import { ApiError } from '../../api';
import { createQueryClient, isRetryable, staleTimes } from '../client';

describe('retry policy', () => {
  it('never retries a 4xx, because repeating a wrong request stays wrong', () => {
    for (const status of [400, 401, 403, 404, 422]) {
      expect(isRetryable(new ApiError('x', 'no', status))).toBe(false);
    }
  });

  it('retries the three 4xx that are timing rather than correctness', () => {
    // Mirrors the outbox's terminal-failure rule in docs/03 §7.
    for (const status of [408, 409, 429]) {
      expect(isRetryable(new ApiError('x', 'no', status))).toBe(true);
    }
  });

  it('retries a 5xx', () => {
    expect(isRetryable(new ApiError('x', 'no', 500))).toBe(true);
    expect(isRetryable(new ApiError('x', 'no', 503))).toBe(true);
  });

  it('retries an unrecognised failure — a dropped connection is worth another go', () => {
    expect(isRetryable(new TypeError('Network request failed'))).toBe(true);
    expect(isRetryable(undefined)).toBe(true);
  });
});

describe('query client defaults', () => {
  const client = createQueryClient();
  const q = client.getDefaultOptions().queries!;

  it('stops retrying after three attempts', () => {
    const retry = q.retry as (n: number, e: unknown) => boolean;
    const serverError = new ApiError('x', 'no', 500);
    expect(retry(0, serverError)).toBe(true);
    expect(retry(2, serverError)).toBe(true);
    expect(retry(3, serverError)).toBe(false);
  });

  it('gives up immediately on a 4xx regardless of attempt count', () => {
    const retry = q.retry as (n: number, e: unknown) => boolean;
    expect(retry(0, new ApiError('x', 'no', 422))).toBe(false);
  });

  it('backs off exponentially but caps the wait', () => {
    const delay = q.retryDelay as (n: number) => number;
    expect(delay(0)).toBe(1000);
    expect(delay(1)).toBe(2000);
    expect(delay(99)).toBe(30_000);
  });

  it('does not refetch on window focus — there is no window on a phone', () => {
    expect(q.refetchOnWindowFocus).toBe(false);
  });

  it('never retries mutations here; the outbox owns that', () => {
    expect(client.getDefaultOptions().mutations!.retry).toBe(false);
  });
});

describe('staleTimes (docs/03 §6.3)', () => {
  it('treats the active session as never stale — the local draft is authoritative', () => {
    expect(staleTimes.activeSession).toBe(Infinity);
  });

  it('caches the catalog for an hour and the session list for minutes', () => {
    expect(staleTimes.exercises).toBeGreaterThan(staleTimes.sessions);
    expect(staleTimes.muscleGroups).toBe(staleTimes.exercises);
  });
});
