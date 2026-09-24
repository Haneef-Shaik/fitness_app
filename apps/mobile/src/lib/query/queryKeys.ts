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

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month';
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
  programTemplates: () => ['programs', 'templates'] as const,

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

  // analytics (G6). All derived from completed sessions, so all of them go
  // stale together — hence one shared `analytics` prefix for invalidation.
  analyticsWorkouts: (f: AnalyticsFilters = {}) => ['analytics', 'workouts', f] as const,
  analyticsMuscleVolume: (f: AnalyticsFilters = {}) => ['analytics', 'muscle-volume', f] as const,
  analyticsExercise: (exerciseId: string, f: AnalyticsFilters = {}) =>
    ['analytics', 'exercise', exerciseId, f] as const,
  analyticsRecords: (f: AnalyticsFilters = {}) => ['analytics', 'records', f] as const,
  analyticsFrequency: (f: AnalyticsFilters = {}) => ['analytics', 'frequency', f] as const,
  analyticsAdherence: (f: AnalyticsFilters = {}) => ['analytics', 'adherence', f] as const,

  // nutrition (G7). The diary is keyed by LOCAL date, never by "today" — the
  // client does not decide which day it is (I7).
  nutritionDay: (localDate: string) => ['nutrition', 'day', localDate] as const,
  meal: (id: string) => ['nutrition', 'meal', id] as const,
  // H-14. Under `nutrition` so every meal write reaches it; sessions and
  // weigh-ins reach it through `nutritionAnalytics` explicitly (training vs
  // rest days, the weight chart).
  nutritionAnalytics: (range: { from?: string; to?: string }) =>
    ['nutrition', 'analytics', range] as const,
  foods: (q?: string) => ['foods', 'list', q ?? ''] as const,
  food: (id: string) => ['foods', 'detail', id] as const,

  // H-16. Categories are their OWN key rather than part of `nutrition`: the
  // logger reads them on every screen, and they do not change when a meal does.
  mealCategories: () => ['meal-categories'] as const,

  // H-11. A recipe is a plan, so it is keyed apart from the diary it feeds —
  // logging one changes the day, editing one does not.
  recipes: () => ['recipes', 'list'] as const,
  recipe: (id: string) => ['recipes', 'detail', id] as const,

  // AI analysis (G8). An analysis is its OWN key, not part of `nutrition`: it
  // is a pending proposal, and it moves no total until someone confirms it.
  analyses: () => ['analyses', 'list'] as const,
  analysis: (id: string) => ['analyses', 'detail', id] as const,
  analysisQuota: () => ['analyses', 'quota'] as const,

  // B-01 (G9). Keyed by the date ASKED FOR, which is usually nothing at all:
  // `undefined` means "the server's today", and caching that under a date the
  // client made up would defeat the point of asking the server (I7).
  dashboard: (localDate?: string) => ['dashboard', localDate ?? 'today'] as const,

  // Body. The series and the raw list are different questions — one point per
  // day versus every entry — so they are different keys.
  bodySeries: (metricKey: string, f: { from?: string; to?: string } = {}) =>
    ['body', 'series', metricKey, f] as const,
  bodyMetrics: (metricKey: string, f: { from?: string; to?: string } = {}) =>
    ['body', 'list', metricKey, f] as const,
  progressPhotos: () => ['body', 'photos'] as const,
  bodyCheckins: () => ['body', 'checkins'] as const,

  // L-02. The outbox is LOCAL state, and it is in the query cache anyway: the
  // Sync Center wants the same refetch, staleness and boundary behaviour every
  // other read gets, and a second mechanism for one screen is a second thing
  // to get wrong.
  outbox: () => ['outbox'] as const,
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
  analytics: () => ['analytics'] as const,
  nutrition: () => ['nutrition'] as const,
  nutritionAnalytics: () => ['nutrition', 'analytics'] as const,
  foods: () => ['foods'] as const,
  mealCategories: () => ['meal-categories'] as const,
  recipes: () => ['recipes'] as const,
  analyses: () => ['analyses'] as const,
  dashboard: () => ['dashboard'] as const,
  body: () => ['body'] as const,
  outbox: () => ['outbox'] as const,
} as const;
