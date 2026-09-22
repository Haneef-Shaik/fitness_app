/**
 * The invalidation map from docs/03 §6.2, as data.
 *
 * Each rule carries the exact text of the table row it implements, and a test
 * asserts the two sets match in both directions — a rule without a row, or a row
 * without a rule, fails the build. That is the whole point: a cache rule that
 * lives only in code stops being reviewable, and one that lives only in a
 * document stops being true.
 */
import type { QueryClient } from '@tanstack/react-query';
import { qk, qkPrefix } from './queryKeys';

export type MutationKind =
  | 'auth.identityChanged'
  | 'profile.updated'
  | 'goal.changed'
  | 'exercise.changed'
  | 'program.changed'
  | 'planDay.changed'
  | 'session.started'
  | 'set.changed'
  | 'sessionExercise.changed'
  | 'session.finished'
  | 'session.lifecycleChanged'
  | 'outbox.flushed';

export interface InvalidationContext {
  sessionId?: string;
  programId?: string;
  goalId?: string;
  exerciseId?: string;
}

export type QueryKey = readonly unknown[];

export interface Invalidation {
  /** Key prefixes to mark stale. */
  readonly keys: readonly QueryKey[];
  /** Drop the entire cache instead — the data belongs to another identity. */
  readonly clearAll: boolean;
  /**
   * Whether an active observer should refetch immediately. `false` marks the data
   * stale but leaves the screen showing what it has, which is what keeps the
   * network off the set-commit path (**I10**).
   */
  readonly refetch: boolean;
}

interface Rule {
  /** The first column of this rule's row in docs/03 §6.2, verbatim. */
  readonly doc: string;
  readonly keys: (ctx: InvalidationContext) => readonly QueryKey[];
  readonly clearAll?: boolean;
  readonly refetch?: boolean;
}

export const invalidationRules: Readonly<Record<MutationKind, Rule>> = {
  'auth.identityChanged': {
    doc: 'Sign in / sign out',
    keys: () => [],
    clearAll: true,
  },
  'profile.updated': {
    doc: '`PATCH /profile`',
    keys: () => [qk.profile()],
  },
  'goal.changed': {
    doc: 'Create / edit a goal',
    keys: ({ goalId }) => (goalId ? [qkPrefix.goals(), qk.goal(goalId)] : [qkPrefix.goals()]),
  },
  'exercise.changed': {
    doc: 'Create / edit / archive an **exercise**',
    keys: ({ exerciseId }) =>
      exerciseId ? [qkPrefix.exercises(), qk.exercise(exerciseId)] : [qkPrefix.exercises()],
  },
  'program.changed': {
    // AC-12: a performed session snapshots its prescription, so editing the plan
    // must never appear to rewrite history. No session, record or analytics key here.
    doc: 'Create / edit / duplicate / archive / delete a **program**',
    keys: ({ programId }) =>
      programId ? [qkPrefix.programs(), qk.program(programId)] : [qkPrefix.programs()],
  },
  'planDay.changed': {
    doc: 'Edit a **plan day** or reorder its exercises',
    keys: ({ programId }) => (programId ? [qk.program(programId)] : [qkPrefix.programs()]),
  },
  'session.started': {
    doc: 'Start a session',
    keys: () => [qk.activeSession(), qk.sessions()],
  },
  'set.changed': {
    // I10: optimistic, no refetch. The local draft is authoritative in-session.
    doc: 'Commit / edit / delete a **set**',
    keys: ({ sessionId }) => (sessionId ? [qk.session(sessionId)] : [qkPrefix.sessions()]),
    refetch: false,
  },
  'sessionExercise.changed': {
    doc: 'Add / remove / reorder a session exercise',
    keys: ({ sessionId }) => (sessionId ? [qk.session(sessionId)] : [qkPrefix.sessions()]),
    refetch: false,
  },
  'session.finished': {
    // Volume, e1RM and PRs are computed inside the finish transaction, so from
    // this moment the server's numbers are the authoritative ones.
    doc: '**Finish** a session',
    keys: ({ sessionId }) => [
      qk.activeSession(),
      qk.sessions(),
      ...(sessionId ? [qk.session(sessionId)] : []),
      qkPrefix.records(),
      // D-02 is session-derived: its recent sessions and e1RM trend are stale the
      // instant a workout ends.
      qkPrefix.exerciseHistory(),
      qkPrefix.exerciseStats(),
    ],
  },
  'session.lifecycleChanged': {
    doc: 'Cancel / reopen a session',
    keys: ({ sessionId }) => [
      qk.activeSession(),
      qk.sessions(),
      ...(sessionId ? [qk.session(sessionId)] : []),
    ],
  },
  'outbox.flushed': {
    doc: 'Outbox flush (`/sets/batch`)',
    keys: ({ sessionId }) => (sessionId ? [qk.session(sessionId)] : [qkPrefix.sessions()]),
    refetch: false,
  },
};

export function invalidationFor(
  kind: MutationKind,
  ctx: InvalidationContext = {},
): Invalidation {
  const rule = invalidationRules[kind];
  return {
    keys: rule.keys(ctx),
    clearAll: rule.clearAll ?? false,
    refetch: rule.refetch ?? true,
  };
}

/** Applies one rule to the cache. The only place invalidation is performed. */
export async function applyInvalidation(
  client: QueryClient,
  kind: MutationKind,
  ctx: InvalidationContext = {},
): Promise<void> {
  const { keys, clearAll, refetch } = invalidationFor(kind, ctx);

  if (clearAll) {
    client.clear();
    return;
  }

  await Promise.all(
    keys.map((queryKey) =>
      client.invalidateQueries({
        queryKey: queryKey as unknown[],
        refetchType: refetch ? 'active' : 'none',
      }),
    ),
  );
}
