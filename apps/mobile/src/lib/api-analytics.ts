/**
 * Analytics endpoints (G6) — G-01 … G-07.
 *
 * A surface, not transport. Every shape comes from @volt/api-types; nothing
 * here is hand-typed (D3b), and nothing here computes a number — the server
 * already deferred all of them to the domain, which is what AC-06 rests on.
 */
import type {
  Adherence,
  ExerciseProgression,
  Frequency,
  MuscleVolume,
  PersonalRecordRow,
  WorkoutAnalytics,
} from '@volt/api-types';
import { api } from './api';

export interface RangeQuery {
  from?: string;
  to?: string;
}

export type GroupBy = 'day' | 'week' | 'month';

function qs(params: Readonly<Record<string, unknown>> | RangeQuery): string {
  const entries = Object.entries(params as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const analyticsApi = {
  /** G-02's volume column chart — the surface AC-06 compares to the logger. */
  workouts: (q: RangeQuery & { groupBy?: GroupBy } = {}) =>
    api.get<WorkoutAnalytics>('/analytics/workouts' + qs({
      from: q.from, to: q.to, group_by: q.groupBy,
    })),

  /** G-02's sorted bar. Sorted by the server; do not re-sort. */
  muscleVolume: (q: RangeQuery = {}) =>
    api.get<MuscleVolume[]>('/analytics/muscle-volume' + qs(q)),

  /** G-03 / G-07. The series carries its `formula_version` (I5). */
  exercise: (exerciseId: string, q: RangeQuery = {}) =>
    api.get<ExerciseProgression>(`/analytics/exercises/${exerciseId}` + qs(q)),

  /** G-04's KPI row. */
  personalRecords: (q: RangeQuery = {}) =>
    api.get<PersonalRecordRow[]>('/analytics/personal-records' + qs(q)),

  /** G-05's week × muscle heatmap. */
  frequency: (q: RangeQuery = {}) =>
    api.get<Frequency>('/analytics/frequency' + qs(q)),

  /** G-06's meter. `adherence` is null when nothing was planned. */
  adherence: (q: RangeQuery = {}) =>
    api.get<Adherence>('/analytics/adherence' + qs(q)),
};
