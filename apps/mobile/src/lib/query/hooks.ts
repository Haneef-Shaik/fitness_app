/**
 * Typed reads and writes, keyed from ./queryKeys and invalidated through
 * ./invalidation. Screens call these; no screen builds a query key, sets a
 * staleTime, or decides what to invalidate on its own.
 */
import {
  useInfiniteQuery, useMutation, useQuery, useQueryClient,
} from '@tanstack/react-query';
import type {
  Exercise,
  ExerciseHistoryEntry,
  ExerciseIn,
  ExerciseStats,
  Goal,
  GoalIn,
  GoalPatch,
  MuscleGroup,
  PlanDayIn,
  PlanDayPatch,
  PlanExerciseIn,
  Profile,
  ProfilePatch,
  PreviousPerformance,
  Program,
  ProgramIn,
  Adherence,
  ExerciseProgression,
  Frequency,
  MuscleVolume,
  PersonalRecordRow,
  WorkoutAnalytics,
  Food,
  FoodIn,
  FoodPatch,
  Meal,
  MealIn,
  MealItemPatch,
  NutritionDay,
  MealCategory,
  MealCategoryIn,
  MealCategoryPatch,
  MealCopyIn,
  DayCopyIn,
  Recipe,
  RecipeIn,
  RecipePatch,
  BodyMetric,
  BodyMetricIn,
  BodySeries,
  Dashboard,
  ProgressPhoto,
  ProgressPhotoIn,
  AnalysisQuota,
  ConfirmIn,
  FoodAnalysis,
  ImageAnalysisIn,
  TextAnalysisIn,
  HistoryItem,
  PreviousOccurrence,
  SessionComparison, ProgramTemplate } from '@volt/api-types';
import { goalsApi, profileApi } from '../api';
import { catalogApi, programsApi, type ExerciseQuery } from '../api-catalog';
import { historyApi, type HistoryQuery } from '../api-history';
import { analyticsApi, type GroupBy, type RangeQuery } from '../api-analytics';
import { analysisApi } from '../api-analysis';
import { bodyApi, type RangeQuery as BodyRange } from '../api-body';
import { nutritionApi } from '../api-nutrition';
import { queueMeal, queueRecipeLog } from '../../features/nutrition/logMeal';
import { queueMetric } from '../../features/body/logMetric';
import { store, type OutboxEntry } from '../db';
import { flushAndReconcile } from '../../features/workout-session/sessionController';
import { staleTimes } from './client';
import { applyInvalidation } from './invalidation';
import { qk } from './queryKeys';

export function useProfile() {
  return useQuery<Profile>({
    queryKey: qk.profile(),
    queryFn: () => profileApi.get(),
    staleTime: staleTimes.profile,
  });
}

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: qk.goals(),
    queryFn: () => goalsApi.list(),
    staleTime: staleTimes.goals,
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => profileApi.patch(patch),
    onSuccess: (profile) => {
      // The response is the new profile, so seed the cache rather than refetch it.
      client.setQueryData(qk.profile(), profile);
      return applyInvalidation(client, 'profile.updated');
    },
  });
}

export function useGoal(id: string) {
  return useQuery<Goal>({
    queryKey: qk.goal(id),
    queryFn: () => goalsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useUpdateGoal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: GoalPatch }) =>
      goalsApi.patch(id, body),
    onSuccess: (_goal, { id }) => applyInvalidation(client, 'goal.changed', { goalId: id }),
  });
}

export function useCreateGoal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (goal: GoalIn) => goalsApi.create(goal),
    onSuccess: (goal) => applyInvalidation(client, 'goal.changed', { goalId: goal.id }),
  });
}

/* --------------------------------------------------------- catalog (G2) --- */

export function useMuscleGroups() {
  return useQuery<MuscleGroup[]>({
    queryKey: qk.muscleGroups(),
    queryFn: () => catalogApi.muscleGroups(),
    staleTime: staleTimes.muscleGroups,
  });
}

export function useExercises(query: ExerciseQuery = {}) {
  return useQuery<Exercise[]>({
    queryKey: qk.exercises(query),
    queryFn: () => catalogApi.exercises(query),
    staleTime: staleTimes.exercises,
  });
}

export function useExercise(id: string) {
  return useQuery<Exercise>({
    queryKey: qk.exercise(id),
    queryFn: () => catalogApi.exercise(id),
    staleTime: staleTimes.exercises,
    enabled: Boolean(id),
  });
}

export function useExerciseHistory(id: string) {
  return useQuery<ExerciseHistoryEntry[]>({
    queryKey: qk.exerciseHistory(id),
    queryFn: () => catalogApi.history(id),
    staleTime: staleTimes.sessions,
    enabled: Boolean(id),
  });
}

export function useExerciseStats(id: string) {
  return useQuery<ExerciseStats>({
    queryKey: qk.exerciseStats(id),
    queryFn: () => catalogApi.stats(id),
    staleTime: staleTimes.sessions,
    enabled: Boolean(id),
  });
}

/**
 * **AC-04** — what the user did last time, on screen before they type anything.
 *
 * Immutable for the duration of a session, so it is cached hard: re-fetching it
 * mid-workout would only spend battery.
 */
export function usePreviousPerformance(exerciseId: string) {
  return useQuery<PreviousPerformance | null>({
    queryKey: qk.previousPerformance(exerciseId),
    queryFn: () => catalogApi.previousPerformance(exerciseId),
    staleTime: staleTimes.previousPerformance,
    enabled: Boolean(exerciseId),
  });
}

export function useCreateExercise() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: ExerciseIn) => catalogApi.createExercise(body),
    onSuccess: (ex) => applyInvalidation(client, 'exercise.changed', { exerciseId: ex.id }),
  });
}

/* -------------------------------------------------------- planning (G2) --- */

export function usePrograms() {
  return useQuery<Program[]>({
    queryKey: qk.programs(),
    queryFn: () => programsApi.list(),
    staleTime: staleTimes.programs,
  });
}

/** C-01 / C-04: the starter programs. Static on the server, so cached long. */
export function useProgramTemplates() {
  return useQuery<ProgramTemplate[]>({
    queryKey: qk.programTemplates(),
    queryFn: () => programsApi.templates(),
    staleTime: Infinity,
  });
}

/** Copies a starter program into the user's own programs. */
export function useStartTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => programsApi.startTemplate(key),
    onSuccess: (p) => applyInvalidation(client, 'program.changed', { programId: p.id }),
  });
}

export function useProgram(id: string) {
  return useQuery<Program>({
    queryKey: qk.program(id),
    queryFn: () => programsApi.get(id),
    staleTime: staleTimes.programs,
    enabled: Boolean(id),
  });
}

export function useCreateProgram() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: ProgramIn) => programsApi.create(body),
    onSuccess: (p) => applyInvalidation(client, 'program.changed', { programId: p.id }),
  });
}

export function useAddPlanDay(programId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: PlanDayIn) => programsApi.addDay(programId, body),
    onSuccess: () => applyInvalidation(client, 'program.changed', { programId }),
  });
}

export function useUpdatePlanDay(programId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ dayId, body }: { dayId: string; body: PlanDayPatch }) =>
      programsApi.updateDay(dayId, body),
    onSuccess: () => applyInvalidation(client, 'planDay.changed', { programId }),
  });
}

/** C-05's Save. Bulk, so ordering cannot half-apply. */
export function useSetDayExercises(programId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ dayId, body }: { dayId: string; body: PlanExerciseIn[] }) =>
      programsApi.setDayExercises(dayId, body),
    onSuccess: () => applyInvalidation(client, 'planDay.changed', { programId }),
  });
}


/* ------------------------------------------------------------- retrieval (G5) */

/**
 * F-01's list. An infinite query, because the cursor convention (**H5.1**) is
 * "ask for the next page with the blob the last one gave you" and that is
 * exactly `getNextPageParam`.
 *
 * The cursor is opaque: it is read from `meta.next_cursor` and passed back
 * untouched. Nothing here parses it, which is what lets the server change the
 * key later without breaking this screen.
 */
export function useWorkoutHistory(filters: HistoryQuery = {}) {
  return useInfiniteQuery({
    queryKey: qk.history(filters),
    queryFn: ({ pageParam }) =>
      historyApi.workouts({ ...filters, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    // `has_more` comes from the server counting one row past the page, so it is
    // a fact rather than an inference from "did we fill it?" — which is wrong
    // on an exactly-full last page.
    getNextPageParam: (last) =>
      last.meta?.has_more ? (last.meta?.next_cursor ?? undefined) : undefined,
    staleTime: staleTimes.history,
  });
}

/** Every loaded page, flattened — what F-01 actually renders. */
export function flattenHistory(
  pages: { data: HistoryItem[] }[] | undefined,
): HistoryItem[] {
  return (pages ?? []).flatMap((p) => p.data);
}

/**
 * **AC-05** — "what did I do last chest day?", without knowing the date.
 *
 * `null` means the muscle has never been trained, which F-05 renders as a
 * prompt rather than an error. When `widened` is true the screen MUST say so:
 * PRD §7.2 makes that part of the rule.
 */
export function usePreviousOccurrence(muscle: string) {
  return useQuery<PreviousOccurrence | null>({
    queryKey: qk.previousOccurrence(muscle),
    queryFn: () => historyApi.previousOccurrence(muscle),
    staleTime: staleTimes.previousOccurrence,
    enabled: Boolean(muscle),
  });
}

/** F-06. Two or three finished sessions, aligned by exercise (**H5.2**). */
export function useSessionComparison(sessionIds: readonly string[]) {
  return useQuery<SessionComparison>({
    queryKey: qk.sessionComparison(sessionIds),
    queryFn: () => historyApi.compare(sessionIds),
    staleTime: staleTimes.sessionComparison,
    enabled: sessionIds.length > 0,
  });
}


/* ------------------------------------------------------------- analytics (G6) */

/**
 * G-02's volume column chart.
 *
 * This is the read **AC-06** compares against the logger: the same session's
 * volume must be identical here, on the finish summary and in session detail.
 */
export function useWorkoutAnalytics(range: RangeQuery & { groupBy?: GroupBy } = {}) {
  return useQuery<WorkoutAnalytics>({
    queryKey: qk.analyticsWorkouts(range),
    queryFn: () => analyticsApi.workouts(range),
    staleTime: staleTimes.analytics,
  });
}

/** G-02's sorted horizontal bar. Already sorted by the server — do not re-sort. */
export function useMuscleVolume(range: RangeQuery = {}) {
  return useQuery<MuscleVolume[]>({
    queryKey: qk.analyticsMuscleVolume(range),
    queryFn: () => analyticsApi.muscleVolume(range),
    staleTime: staleTimes.analytics,
  });
}

/** G-03 / G-07. The payload states its `formula_version` (I5) — show it. */
export function useExerciseProgression(exerciseId: string, range: RangeQuery = {}) {
  return useQuery<ExerciseProgression>({
    queryKey: qk.analyticsExercise(exerciseId, range),
    queryFn: () => analyticsApi.exercise(exerciseId, range),
    staleTime: staleTimes.analytics,
    enabled: Boolean(exerciseId),
  });
}

/** G-04's PR board. */
export function usePersonalRecords(range: RangeQuery = {}) {
  return useQuery<PersonalRecordRow[]>({
    queryKey: qk.analyticsRecords(range),
    queryFn: () => analyticsApi.personalRecords(range),
    staleTime: staleTimes.analytics,
  });
}

/** G-05's week × muscle heatmap. */
export function useFrequency(range: RangeQuery = {}) {
  return useQuery<Frequency>({
    queryKey: qk.analyticsFrequency(range),
    queryFn: () => analyticsApi.frequency(range),
    staleTime: staleTimes.analytics,
  });
}

/** G-06's meter. `adherence` is null when nothing was planned — not zero. */
export function useAdherence(range: RangeQuery = {}) {
  return useQuery<Adherence>({
    queryKey: qk.analyticsAdherence(range),
    queryFn: () => analyticsApi.adherence(range),
    staleTime: staleTimes.analytics,
  });
}


/* ------------------------------------------------------------ nutrition (G7) */

/**
 * H-01's diary for one local day.
 *
 * The date is passed in, never computed here: the server resolves "today" from
 * the profile's timezone (**I7**) and the client does not get a second opinion.
 * Omitting it asks the server for its answer.
 */
export function useNutritionDay(localDate?: string) {
  return useQuery<NutritionDay>({
    queryKey: qk.nutritionDay(localDate ?? 'today'),
    queryFn: () => nutritionApi.day(localDate),
    staleTime: staleTimes.nutritionDay,
  });
}

export function useMeal(id: string) {
  return useQuery<Meal>({
    queryKey: qk.meal(id),
    queryFn: () => nutritionApi.meal(id),
    enabled: Boolean(id),
  });
}

/**
 * One food by id.
 *
 * H-05 used to look its food up in `useFoods('')` — an unfiltered list capped
 * at 25 — so opening a food from search showed "not found" as soon as the
 * catalog outgrew a page. Invisible in tests, found on a device in G10.
 */
export function useFood(id: string) {
  return useQuery<Food>({
    queryKey: qk.food(id),
    queryFn: () => nutritionApi.food(id),
    enabled: Boolean(id),
  });
}

/** H-04's search. `meta.filtered` is what lets the screen offer "create it" (I13). */
export function useFoods(q?: string) {
  return useQuery({
    queryKey: qk.foods(q),
    queryFn: () => nutritionApi.foods(q),
    staleTime: staleTimes.foods,
  });
}

/**
 * **AC-07** — logs a meal and moves today's totals.
 *
 * Goes through the OUTBOX, not a direct POST: a meal logged on the train is
 * still a meal. The diary is invalidated on success so the server's numbers
 * replace the optimistic ones as soon as the queue drains.
 */
export function useLogMeal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (body: MealIn) => queueMeal(body),
    // NOT returned: TanStack would hold `mutateAsync` until every active read
    // had refetched, and offline those retry with backoff — Save sat on
    // "Saving…" for ~14 s (seen on a phone in G10). The write is already safe
    // in the outbox; the reads refresh when they can.
    onSuccess: () => { void applyInvalidation(client, 'meal.changed', {}); },
  });
}

export function useUpdateMealItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: MealItemPatch }) =>
      nutritionApi.updateItem(id, body),
    onSuccess: () => applyInvalidation(client, 'meal.changed', {}),
  });
}

export function useDeleteMealItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nutritionApi.deleteItem(id),
    onSuccess: () => applyInvalidation(client, 'meal.changed', {}),
  });
}

export function useDeleteMeal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nutritionApi.deleteMeal(id),
    onSuccess: () => applyInvalidation(client, 'meal.changed', {}),
  });
}

/** H-10. Creating a food changes the picker and nothing already logged. */
export function useCreateFood() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: FoodIn) => nutritionApi.createFood(body),
    onSuccess: () => applyInvalidation(client, 'food.changed', {}),
  });
}

export function useUpdateFood() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: FoodPatch }) =>
      nutritionApi.updateFood(id, body),
    onSuccess: () => applyInvalidation(client, 'food.changed', {}),
  });
}


/* ---------------------------------------------------- H-16 · categories */

/**
 * The user's meal categories.
 *
 * Returns ALL of them, hidden included — the manager has to show what it would
 * be un-hiding. Screens that OFFER a category filter to `!hidden` themselves.
 */
export function useMealCategories() {
  return useQuery<MealCategory[]>({
    queryKey: qk.mealCategories(),
    queryFn: () => nutritionApi.categories(),
    staleTime: staleTimes.foods,
  });
}

export function useCreateMealCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: MealCategoryIn) => nutritionApi.createCategory(body),
    onSuccess: () => applyInvalidation(client, 'mealCategory.changed', {}),
  });
}

export function useUpdateMealCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: MealCategoryPatch }) =>
      nutritionApi.updateCategory(id, body),
    onSuccess: () => applyInvalidation(client, 'mealCategory.changed', {}),
  });
}

export function useReorderMealCategories() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (ids: readonly string[]) =>
      nutritionApi.reorderCategories({ ids: [...ids] }),
    onSuccess: () => applyInvalidation(client, 'mealCategory.changed', {}),
  });
}

export function useDeleteMealCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nutritionApi.deleteCategory(id),
    onSuccess: () => applyInvalidation(client, 'mealCategory.changed', {}),
  });
}

/* ------------------------------------------------------- H-11 · recipes */

export function useRecipes() {
  return useQuery<Recipe[]>({
    queryKey: qk.recipes(),
    queryFn: () => nutritionApi.recipes(),
    staleTime: staleTimes.foods,
  });
}

export function useRecipe(id: string) {
  return useQuery<Recipe>({
    queryKey: qk.recipe(id),
    queryFn: () => nutritionApi.recipe(id),
    enabled: Boolean(id),
  });
}

export function useCreateRecipe() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: RecipeIn) => nutritionApi.createRecipe(body),
    onSuccess: () => applyInvalidation(client, 'recipe.changed', {}),
  });
}

/**
 * Editing a recipe invalidates the recipe and **not** the diary.
 *
 * That absence is the rule, not an omission: logging snapshotted the macros, so
 * a meal already logged from this recipe has not moved. Invalidating the diary
 * here would imply it had.
 */
export function useUpdateRecipe() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RecipePatch }) =>
      nutritionApi.updateRecipe(id, body),
    onSuccess: (_data, { id }) => applyInvalidation(client, 'recipe.changed', { recipeId: id }),
  });
}

export function useDeleteRecipe() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nutritionApi.deleteRecipe(id),
    onSuccess: () => applyInvalidation(client, 'recipe.changed', {}),
  });
}

/** Logging a recipe is logging a meal, so it rides the same outbox (H3.2). */
export function useLogRecipe() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: {
      id: string;
      body: { meal_type: string; servings: number; consumed_at?: string | null };
    }) => queueRecipeLog(id, body),
    // NOT returned: TanStack would hold `mutateAsync` until every active read
    // had refetched, and offline those retry with backoff — Save sat on
    // "Saving…" for ~14 s (seen on a phone in G10). The write is already safe
    // in the outbox; the reads refresh when they can.
    onSuccess: () => { void applyInvalidation(client, 'meal.changed', {}); },
  });
}

/* ---------------------------------------------------------- H-12 · copy */

/**
 * Copying is ONLINE, unlike logging.
 *
 * A copy reads a day the client may not hold, so there is nothing to queue —
 * see `features/nutrition/logMeal.ts`.
 */
export function useCopyMeal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: MealCopyIn }) =>
      nutritionApi.copyMeal(id, body),
    onSuccess: () => applyInvalidation(client, 'meal.changed', {}),
  });
}

export function useCopyDay() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: DayCopyIn) => nutritionApi.copyDay(body),
    onSuccess: () => applyInvalidation(client, 'meal.changed', {}),
  });
}


/* ------------------------------------------------- G8 · AI food analysis */

/**
 * H-07's poll.
 *
 * 2 s while it is working, backing off to 5 s, and **stopping entirely** once
 * the analysis has finished. A poll that keeps running after `completed` is a
 * battery drain nobody sees in testing.
 */
export function useAnalysis(id: string, options: { poll?: boolean } = {}) {
  return useQuery<FoodAnalysis>({
    queryKey: qk.analysis(id),
    queryFn: () => analysisApi.get(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      if (options.poll === false) return false;
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return query.state.dataUpdateCount > 5 ? 5000 : 2000;
    },
  });
}

export function useAnalyses() {
  return useQuery<FoodAnalysis[]>({
    queryKey: qk.analyses(),
    queryFn: () => analysisApi.list(),
  });
}

/** H-06 and H-09 read this BEFORE offering the button (02 §5.4). */
export function useAnalysisQuota() {
  return useQuery<AnalysisQuota>({
    queryKey: qk.analysisQuota(),
    queryFn: () => analysisApi.quota(),
    staleTime: staleTimes.foods,
  });
}

export function useAnalyseText() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: TextAnalysisIn) => analysisApi.analyseText(body),
    onSuccess: () => applyInvalidation(client, 'analysis.submitted', {}),
  });
}

export function useAnalyseImage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: ImageAnalysisIn) => analysisApi.analyseImage(body),
    onSuccess: () => applyInvalidation(client, 'analysis.submitted', {}),
  });
}

/**
 * **AC-10.** Writes the meal and leaves the analysis byte-identical.
 *
 * Unlike a manual log this does NOT go through the outbox: confirming needs the
 * analysis, which lives on the server, so there is nothing to replay offline.
 * H-08 says so rather than queueing a write that would fail on delivery.
 */
export function useConfirmAnalysis() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ConfirmIn }) =>
      analysisApi.confirm(id, body),
    onSuccess: (_meal, { id }) =>
      applyInvalidation(client, 'analysis.confirmed', { analysisId: id }),
  });
}

export function useDeleteAnalysisImages() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => analysisApi.deleteImages(),
    onSuccess: () => applyInvalidation(client, 'analysis.imagesDeleted', {}),
  });
}


/* ----------------------------------------------- G9 · B-01, body, goals */

/**
 * **AC-11.** The whole dashboard, in one request.
 *
 * `localDate` is omitted in normal use, and that omission is the point: the
 * server resolves the user's day from their profile timezone (**I7**). Passing
 * a date computed on the device would be right for almost every user and wrong
 * for exactly the ones who travel — and would fail silently.
 */
export function useDashboard(localDate?: string) {
  return useQuery<Dashboard>({
    queryKey: qk.dashboard(localDate),
    queryFn: () => bodyApi.dashboard(localDate),
    staleTime: staleTimes.nutritionDay,
  });
}

/** One point per day — the FIRST weigh-in of each (Q5) — plus a trailing mean. */
export function useBodySeries(metricKey = 'body_weight', range: BodyRange = {}) {
  return useQuery<BodySeries>({
    queryKey: qk.bodySeries(metricKey, range),
    queryFn: () => bodyApi.series(metricKey, range),
  });
}

/** Every entry, including the ones that are not their day's canonical one. */
export function useBodyMetrics(metricKey = 'body_weight', range: BodyRange = {}) {
  return useQuery<BodyMetric[]>({
    queryKey: qk.bodyMetrics(metricKey, range),
    queryFn: () => bodyApi.metrics(metricKey, range),
  });
}

/**
 * Logging a measurement goes through the **outbox**, like a set and like a meal.
 *
 * Somebody weighs themselves in a bathroom, which is where the signal is worst
 * in any building — so this is the write least able to afford needing the
 * network.
 */
export function useLogBodyMetric() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: BodyMetricIn) => queueMetric(body),
    // NOT returned: TanStack would hold `mutateAsync` until every active read
    // had refetched, and offline those retry with backoff — Save sat on
    // "Saving…" for ~14 s (seen on a phone in G10). The write is already safe
    // in the outbox; the reads refresh when they can.
    onSuccess: () => { void applyInvalidation(client, 'bodyMetric.changed', {}); },
  });
}

export function useDeleteBodyMetric() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bodyApi.deleteMetric(id),
    onSuccess: () => applyInvalidation(client, 'bodyMetric.changed', {}),
  });
}

export function useProgressPhotos() {
  return useQuery<ProgressPhoto[]>({
    queryKey: qk.progressPhotos(),
    queryFn: () => bodyApi.photos(),
  });
}

export function useCreateProgressPhoto() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: ProgressPhotoIn) => bodyApi.createPhoto(body),
    onSuccess: () => applyInvalidation(client, 'progressPhoto.changed', {}),
  });
}

export function useDeleteProgressPhoto() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bodyApi.deletePhoto(id),
    onSuccess: () => applyInvalidation(client, 'progressPhoto.changed', {}),
  });
}

/**
 * Changing the timezone drops the whole cache.
 *
 * The server re-files every session, meal and weigh-in onto the day it now
 * falls on (**T4**), so every cached read keyed by a day is wrong — which is
 * all of them. A targeted invalidation here would be a guess.
 */
export function useUpdateTimezone() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (timezone: string) => profileApi.patch({ timezone }),
    onSuccess: () => applyInvalidation(client, 'timezone.changed', {}),
  });
}


/* ------------------------------------------------- G10 · the Sync Center */

/**
 * L-02's view of the outbox.
 *
 * Local state, read through the query layer anyway: the Sync Center wants the
 * same refetch, staleness and `DataBoundary` behaviour every other read gets,
 * and a second mechanism for one screen is a second thing to get wrong.
 *
 * Polled while the screen is open, because the pump drains in the background
 * and a queue that emptied while somebody was looking at it should look empty.
 */
export function useOutbox() {
  return useQuery<OutboxEntry[]>({
    queryKey: qk.outbox(),
    queryFn: () => store.allEntries(),
    refetchInterval: 3000,
  });
}

/** L-02's "Retry". The idempotency key is kept, so a retry is the same write. */
export function useRetryQueued() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await store.requeue(id, new Date().toISOString());
      // Due now, so drain now rather than waiting up to a pump interval for
      // something the user just asked for.
      await flushAndReconcile();
    },
    onSuccess: () => applyInvalidation(client, 'outbox.changed', {}),
  });
}

export function useRetryAllQueued() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (ids: readonly number[]) => {
      const now = new Date().toISOString();
      for (const id of ids) await store.requeue(id, now);
      await flushAndReconcile();
    },
    onSuccess: () => applyInvalidation(client, 'outbox.changed', {}),
  });
}

/** L-02's "Discard". Per-item, and the screen confirms before calling it. */
export function useDiscardQueued() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => store.discard(id),
    onSuccess: () => applyInvalidation(client, 'outbox.changed', {}),
  });
}

export type { Food };
