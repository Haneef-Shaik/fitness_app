/**
 * Catalog and planning endpoints (G2).
 *
 * Kept out of api.ts so that file stays the transport — envelope unwrapping, the
 * 401 refresh and host derivation — and this one stays the surface. Every shape
 * comes from @fitlog/api-types; nothing here is hand-typed (D3b).
 */
import type {
  Exercise,
  ExerciseHistoryEntry,
  ExerciseIn,
  ExercisePatch,
  ExerciseStats,
  MuscleGroup,
  PreviousPerformance,
  PlanDayIn,
  PlanDayPatch,
  PlanExerciseIn,
  Program,
  ProgramIn,
  ProgramPatch, ProgramTemplate } from '@fitlog/api-types';
import { api } from './api';

export interface ExerciseQuery {
  q?: string;
  muscle?: string;
  equipment?: string;
  pattern?: string;
  include_archived?: boolean;
  limit?: number;
  offset?: number;
}

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const catalogApi = {
  muscleGroups: () => api.get<MuscleGroup[]>('/muscle-groups'),

  exercises: (query: ExerciseQuery = {}) =>
    api.get<Exercise[]>(`/exercises${qs({ limit: 200, ...query })}`),

  exercise: (id: string) => api.get<Exercise>(`/exercises/${id}`),

  createExercise: (body: ExerciseIn) => api.post<Exercise>('/exercises', body),

  updateExercise: (id: string, body: ExercisePatch) =>
    api.patch<Exercise>(`/exercises/${id}`, body),

  archiveExercise: (id: string) => api.post<Exercise>(`/exercises/${id}/archive`),

  /** D-02's recent sessions. Completed sessions only, newest first. */
  history: (id: string, limit = 20, offset = 0) =>
    api.get<ExerciseHistoryEntry[]>(`/exercises/${id}/history${qs({ limit, offset })}`),

  /** D-02's PR tiles and e1RM trend. */
  stats: (id: string) => api.get<ExerciseStats>(`/exercises/${id}/stats`),

  /**
   * E-03's previous-performance strip (**AC-04**). `data` is null when the
   * exercise has never been performed — a first-time prompt, not an error.
   */
  previousPerformance: (id: string, before?: string) =>
    api.get<PreviousPerformance | null>(
      `/exercises/${id}/previous-performance${qs({ before })}`,
    ),
};

export const programsApi = {
  list: () => api.get<Program[]>('/workout-programs'),
  get: (id: string) => api.get<Program>(`/workout-programs/${id}`),
  create: (body: ProgramIn) => api.post<Program>('/workout-programs', body),
  update: (id: string, body: ProgramPatch) => api.patch<Program>(`/workout-programs/${id}`, body),
  duplicate: (id: string) => api.post<Program>(`/workout-programs/${id}/duplicate`),
  archive: (id: string) => api.post<Program>(`/workout-programs/${id}/archive`),
  remove: (id: string) => api.del<{ deleted: boolean }>(`/workout-programs/${id}`),
  /** Starter programs (C-01, C-04): plans nobody owns until one is started. */
  templates: () => api.get<ProgramTemplate[]>('/program-templates'),
  /** Deep-copies a template into the user's own programs. */
  startTemplate: (key: string) => api.post<Program>(`/program-templates/${key}/start`),

  addDay: (programId: string, body: PlanDayIn) =>
    api.post<Program>(`/workout-programs/${programId}/days`, body),
  updateDay: (dayId: string, body: PlanDayPatch) =>
    api.patch<Program>(`/plan-days/${dayId}`, body),
  removeDay: (dayId: string) => api.del<Program>(`/plan-days/${dayId}`),

  /**
   * Bulk reorder + prescription write. One transaction server-side, so an
   * ordering change can never half-apply (D13).
   */
  setDayExercises: (dayId: string, body: PlanExerciseIn[]) =>
    api.put<Program>(`/plan-days/${dayId}/exercises`, body),
};
