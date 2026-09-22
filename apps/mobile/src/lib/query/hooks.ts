/**
 * Typed reads and writes, keyed from ./queryKeys and invalidated through
 * ./invalidation. Screens call these; no screen builds a query key, sets a
 * staleTime, or decides what to invalidate on its own.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
} from '@volt/api-types';
import { goalsApi, profileApi } from '../api';
import { catalogApi, programsApi, type ExerciseQuery } from '../api-catalog';
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
