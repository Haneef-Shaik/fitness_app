/**
 * Where a tapped notification goes — a reminder to the screen that does what
 * it asked, a finished meal estimate to its review. Only kinds the app itself
 * wrote navigate anywhere; anything else opens the app where it was.
 */
import type { ReminderKey } from '@/features/reminders/plan';

const REMINDER_ROUTES = new Map<string, string>([
  ['workout', '/train'],
  ['weigh_in', '/progress/log'],
  ['meal_log', '/nutrition'],
  ['checkin', '/progress/checkin'],
] satisfies [ReminderKey, string][]);

const UUID = /^[0-9a-f-]{36}$/i;

/** What a scheduled reminder carries, for `routeFor` to read back. */
export const reminderData = (kind: ReminderKey) => ({ type: 'reminder', kind });

export function routeFor(data: unknown): string | null {
  const d = data as { type?: unknown; analysis_id?: unknown; kind?: unknown } | null | undefined;
  if (d?.type === 'analysis' && typeof d.analysis_id === 'string' && UUID.test(d.analysis_id)) {
    return `/nutrition/analysis/${d.analysis_id}`;
  }
  if (d?.type === 'reminder' && typeof d.kind === 'string') return REMINDER_ROUTES.get(d.kind) ?? null;
  return null;
}
