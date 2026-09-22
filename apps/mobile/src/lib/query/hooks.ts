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
  HistoryItem,
  PreviousOccurrence,
  SessionComparison,
} from '@volt/api-types';
import { goalsApi, profileApi } from '../api';
import { catalogApi, programsApi, type ExerciseQuery } from '../api-catalog';
import { historyApi, type HistoryQuery } from '../api-history';
import { analyticsApi, type GroupBy, type RangeQuery } from '../api-analytics';
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
