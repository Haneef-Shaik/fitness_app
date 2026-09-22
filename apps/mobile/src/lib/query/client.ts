/**
 * The app's QueryClient, configured from the caching policy in docs/03 §6.3.
 *
 * staleTime is per-read and set at the call site via `staleTimes`; what lives here
 * is the behaviour that must be identical everywhere — retry policy, and the rule
 * that a 4xx is never retried because it will never succeed.
 */
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api';

export const MINUTE = 60_000;

/** docs/03 §6.3, in one place so a screen cannot quietly invent its own. */
export const staleTimes = {
  profile: 5 * MINUTE,
  goals: 30_000,
  muscleGroups: 60 * MINUTE,
  exercises: 60 * MINUTE,
  programs: 5 * MINUTE,
  sessions: 2 * MINUTE,
  /** The local draft is authoritative while a session is in progress (§5). */
  activeSession: Infinity,
  records: 5 * MINUTE,
  /** Immutable for the duration of a session. */
  previousPerformance: 5 * MINUTE,
  /** Completed sessions do not change on their own; only finishing one adds to them. */
  history: 5 * MINUTE,
  previousOccurrence: 5 * MINUTE,
  /** Comparing two finished sessions is a question with a fixed answer. */
  sessionComparison: 30 * MINUTE,
} as const;

/**
 * A 4xx means the request was wrong, so repeating it wastes the user's battery and
 * delays the error they need to see. 408/409/429 are the exceptions — they are
 * timing, not correctness. Mirrors the outbox's terminal-failure rule (docs/03 §7).
 */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true; // network/unknown — worth retrying
  if (error.status >= 500) return true;
  return error.status === 408 || error.status === 409 || error.status === 429;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => isRetryable(error) && failureCount < 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
        staleTime: 30_000,
        refetchOnWindowFocus: false, // there is no window; AppState drives this instead
      },
      mutations: {
        retry: false, // mutations retry through the outbox, not here (docs/03 §7)
      },
    },
  });
}

/**
 * A client for tests: no retries, no garbage-collection timer. The gc timer is a
 * real `setTimeout` that keeps Jest's event loop alive and hangs the run.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}
