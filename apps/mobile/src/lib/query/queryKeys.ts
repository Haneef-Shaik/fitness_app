/**
 * The one query-key registry (docs/03 §6.1).
 *
 * Keys are hierarchical and share prefixes deliberately: invalidating `['sessions']`
 * reaches the list, every detail and the active session in one call, while
 * `['sessions','detail',id]` reaches exactly one. Every key here has a documented
 * invalidator in docs/03 §6.2, implemented in ./invalidation.ts.
 */

export interface ExerciseFilters {
  q?: string;
  muscle?: string;
  equipment?: string;
  pattern?: string;
  includeArchived?: boolean;
}

export interface HistoryFilters {
  muscle?: string;
  exerciseId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface SessionFilters {
  from?: string;
  to?: string;
  limit?: number;
}

export const qk = {
  // identity
  me: () => ['me'] as const,
  profile: () => ['profile'] as const,
  goals: (status?: string) => ['goals', 'list', status ?? 'all'] as const,
  goal: (id: string) => ['goals', 'detail', id] as const,

  // catalog
  muscleGroups: () => ['muscle-groups'] as const,
  exercises: (f: ExerciseFilters = {}) => ['exercises', 'list', f] as const,
  exercise: (id: string) => ['exercises', 'detail', id] as const,

  // planning
  programs: () => ['programs', 'list'] as const,
  program: (id: string) => ['programs', 'detail', id] as const,

  // training
  sessions: (f: SessionFilters = {}) => ['sessions', 'list', f] as const,
  session: (id: string) => ['sessions', 'detail', id] as const,
  activeSession: () => ['sessions', 'active'] as const,
  records: (exerciseId: string) => ['records', exerciseId] as const,
  exerciseHistory: (exerciseId: string) => ['exercise-history', exerciseId] as const,
  exerciseStats: (exerciseId: string) => ['exercise-stats', exerciseId] as const,
  previousPerformance: (exerciseId: string, before?: string) =>
    ['previous-performance', exerciseId, before ?? 'latest'] as const,

  // retrieval (G5). `history` is a LIST key carrying its filters, so changing a
  // filter is a different query rather than a refetch of the same one — which
  // is what lets F-02 keep the unfiltered page cached behind the sheet.
  history: (f: HistoryFilters = {}) => ['history', 'list', f] as const,
  previousOccurrence: (muscle: string) => ['previous-occurrence', muscle] as const,
  sessionComparison: (sessionIds: readonly string[]) =>
    ['session-comparison', [...sessionIds].sort().join(',')] as const,
} as const;

/** The prefixes invalidation targets. Kept beside the registry so they cannot drift. */
export const qkPrefix = {
  goals: () => ['goals'] as const,
  exercises: () => ['exercises'] as const,
  programs: () => ['programs'] as const,
  sessions: () => ['sessions'] as const,
  records: () => ['records'] as const,
  exerciseHistory: () => ['exercise-history'] as const,
  exerciseStats: () => ['exercise-stats'] as const,
  previousPerformance: () => ['previous-performance'] as const,
  history: () => ['history'] as const,
  previousOccurrence: () => ['previous-occurrence'] as const,
  sessionComparison: () => ['session-comparison'] as const,
} as const;
