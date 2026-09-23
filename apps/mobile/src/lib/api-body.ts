/**
 * Body metrics, goals and B-01 (G9).
 *
 * **`dashboard()` takes no date on purpose.** The server resolves the user's
 * local day from their profile timezone (**I7**); a `?date=` sent from here
 * would be the client having an opinion about a question that is not its to
 * answer, and it would be wrong for exactly the people who travel.
 *
 * The optional argument exists for looking at a *specific* past day, which is a
 * different thing from "today" and is always an explicit choice.
 */
import type {
  BodyMetric, BodyMetricIn, BodySeries, Dashboard, ProgressPhoto, ProgressPhotoIn,
} from '@volt/api-types';
import { api } from './api';

function qs(params: Readonly<Record<string, unknown>>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export interface RangeQuery {
  from?: string;
  to?: string;
}

export const bodyApi = {
  /** **AC-11.** One call, three domains, the server's day. */
  dashboard: (date?: string) => api.get<Dashboard>('/dashboard' + qs({ date })),

  /** Every entry, including the ones that are not the day's canonical one. */
  metrics: (metricKey = 'body_weight', range: RangeQuery = {}) =>
    api.get<BodyMetric[]>('/body-metrics' + qs({ metric_key: metricKey, ...range })),

  deleteMetric: (id: string) => api.del<BodyMetric>(`/body-metrics/${id}`),

  /** One point per day — the FIRST weigh-in of each (Q5) — plus the average. */
  series: (metricKey = 'body_weight', range: RangeQuery = {}) =>
    api.get<BodySeries>('/analytics/body' + qs({ metric_key: metricKey, ...range })),

  photos: () => api.get<ProgressPhoto[]>('/progress-photos'),
  createPhoto: (body: ProgressPhotoIn) =>
    api.post<ProgressPhoto>('/progress-photos', body),
  deletePhoto: (id: string) => api.del<ProgressPhoto>(`/progress-photos/${id}`),

  /**
   * Logging a measurement is NOT here.
   *
   * Stepping on a scale happens in a bathroom, which is where the signal is
   * worst — so it goes through the outbox, exactly as a set does. See
   * `features/body/logMetric.ts`. A direct POST next to these reads is how
   * somebody reaches past the queue.
   */
};

export type { BodyMetricIn };
