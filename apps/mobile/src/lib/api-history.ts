/**
 * Retrieval endpoints (G5) — F-01 … F-07.
 *
 * Separate from api-catalog.ts for the same reason that one is separate from
 * api.ts: this file is a surface, not transport. Every shape comes from
 * @fitlog/api-types; nothing here is hand-typed (D3b).
 */
import type {
  HistoryItem,
  PreviousOccurrence,
  SessionComparison,
} from '@fitlog/api-types';
import { api, type Page } from './api';

export interface HistoryQuery {
  muscle?: string;
  exerciseId?: string;
  from?: string;
  to?: string;
  limit?: number;
  /** Opaque. Comes from `meta.next_cursor`; never construct one (H5.1). */
  cursor?: string;
}

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const historyApi = {
  /** F-01. Paged — the cursor lives in `meta`, so this is a paged read. */
  workouts: (q: HistoryQuery = {}): Promise<Page<HistoryItem[]>> =>
    api.getPaged<HistoryItem[]>('/history/workouts' + qs({
      muscle: q.muscle,
      exercise_id: q.exerciseId,
      from: q.from,
      to: q.to,
      limit: q.limit,
      cursor: q.cursor,
    })),

  /**
   * F-05 / **AC-05**. `data` is null when the muscle has never been trained —
   * a first-time prompt, not an error.
   *
   * The answer carries `widened`, and the screen is required to say so: PRD
   * §7.2 makes "the UI states that it widened" part of the rule, not a nicety.
   */
  previousOccurrence: (muscle: string): Promise<PreviousOccurrence | null> =>
    api.get<PreviousOccurrence | null>('/history/previous-occurrence' + qs({ muscle })),

  /** F-06. Two or three sessions, aligned by exercise. */
  compare: (sessionIds: readonly string[]): Promise<SessionComparison> =>
    api.get<SessionComparison>('/history/compare' + qs({ sessions: sessionIds.join(',') })),
};
