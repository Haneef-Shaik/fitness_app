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
  | 'outbox.flushed'
  | 'meal.changed'
  | 'food.changed'
  | 'mealCategory.changed'
  | 'recipe.changed'
  | 'analysis.submitted'
  | 'analysis.confirmed'
  | 'analysis.imagesDeleted'
  | 'bodyMetric.changed'
  | 'progressPhoto.changed'
  | 'timezone.changed';

export interface InvalidationContext {
  sessionId?: string;
  programId?: string;
  goalId?: string;
  exerciseId?: string;
  recipeId?: string;
  analysisId?: string;
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
    // The dashboard carries the macro targets, so changing one has to reach
    // B-01 as well as the profile itself.
    doc: '`PATCH /profile`',
    keys: () => [qk.profile(), qkPrefix.dashboard()],
  },
  'goal.changed': {
    doc: 'Create / edit a goal',
    keys: ({ goalId }) => [
      qkPrefix.goals(),
      ...(goalId ? [qk.goal(goalId)] : []),
      // B-01 shows the active goals, so the card moves with the list.
      qkPrefix.dashboard(),
    ],
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
    // B-01 surfaces the active session so "resume" is reachable.
    keys: () => [qk.activeSession(), qk.sessions(), qkPrefix.dashboard()],
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
      // G5: F-01's list, AC-05's lookup and F-06's comparison all read completed
      // sessions, so all three are stale the moment one more exists.
      qkPrefix.history(),
      qkPrefix.previousOccurrence(),
      qkPrefix.sessionComparison(),
      // Every analytics read is derived from completed sessions, so one
      // prefix covers volume, muscle balance, PRs, frequency and adherence.
      qkPrefix.analytics(),
      // And B-01's training card, which is the same fact one screen over.
      qkPrefix.dashboard(),
    ],
  },
  'session.lifecycleChanged': {
    doc: 'Cancel / reopen a session',
    keys: ({ sessionId }) => [
      qk.activeSession(),
      qk.sessions(),
      ...(sessionId ? [qk.session(sessionId)] : []),
      // A reopened session LEAVES history — it is no longer completed. Without
      // this it stays on F-01, and AC-05 would still resolve to it.
      qkPrefix.history(),
      qkPrefix.previousOccurrence(),
      qkPrefix.sessionComparison(),
      // Every analytics read is derived from completed sessions, so one
      // prefix covers volume, muscle balance, PRs, frequency and adherence.
      qkPrefix.analytics(),
      qkPrefix.dashboard(),
    ],
  },
  'meal.changed': {
    // The diary and the day's totals are the same fact, so one prefix. Foods
    // are NOT invalidated: logging a meal does not change any food, and the
    // snapshot means it never will.
    doc: 'Log / edit / delete a **meal** or item',
    keys: () => [qkPrefix.nutrition(), qkPrefix.dashboard()],
  },
  'food.changed': {
    // Correcting a food changes the picker and NOTHING already logged —
    // item macros were snapshotted at write (02 §4.2). Invalidating the diary
    // here would imply otherwise and re-fetch for no reason.
    doc: 'Create / edit / delete a **food**',
    keys: () => [qkPrefix.foods()],
  },
  'mealCategory.changed': {
    // The diary renders a category's NAME, so a rename has to reach it. It does
    // not reach `foods`: a category is not a food, and the picker is unmoved.
    doc: 'Create / rename / reorder / hide / delete a **meal category**',
    keys: () => [qkPrefix.mealCategories(), qkPrefix.nutrition()],
  },
  'recipe.changed': {
    // A recipe is a PLAN. Editing one changes what it will produce next time and
    // nothing it already produced, so the diary is deliberately absent — the
    // same rule as `program.changed` not touching sessions (AC-12).
    doc: 'Create / edit / delete a **recipe**',
    keys: ({ recipeId }) =>
      recipeId ? [qkPrefix.recipes(), qk.recipe(recipeId)] : [qkPrefix.recipes()],
  },
  'analysis.submitted': {
    // The list and the quota, and NOT the diary. An analysis that has just been
    // submitted has changed no total — it has not even run yet. Invalidating
    // `nutrition` here would be the "just for the preview" bug in cache form.
    doc: 'Submit a **food analysis** (text or photo)',
    keys: () => [qkPrefix.analyses()],
  },
  'analysis.confirmed': {
    // NOW the diary moves, because meal_items were written. The analysis is
    // invalidated too: it is read-only afterwards and shows what was saved
    // against what was proposed, which is the AC-10 audit view.
    doc: 'Confirm a **food analysis** into a meal',
    keys: ({ analysisId }) => [
      qkPrefix.nutrition(),
      qkPrefix.dashboard(),
      qkPrefix.analyses(),
      ...(analysisId ? [qk.analysis(analysisId)] : []),
    ],
  },
  'analysis.imagesDeleted': {
    doc: 'Delete the stored **analysis photos**',
    keys: () => [qkPrefix.analyses()],
  },
  'bodyMetric.changed': {
    // The dashboard carries the body card, so a weigh-in reaches both. It does
    // NOT reach `nutrition` or `analytics`: stepping on a scale changes neither.
    doc: 'Log / delete a **body measurement**',
    keys: () => [qkPrefix.body(), qkPrefix.dashboard(), qkPrefix.goals()],
  },
  'progressPhoto.changed': {
    doc: 'Add / delete a **progress photo**',
    keys: () => [qk.progressPhotos()],
  },
  'timezone.changed': {
    // A timezone change moves a BOUNDARY: the server re-files every session,
    // meal and weigh-in onto the day it now falls on (T4). Every cached read
    // that is keyed by a day is therefore wrong, which is all of them.
    doc: 'Change the profile **timezone**',
    keys: () => [],
    clearAll: true,
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
