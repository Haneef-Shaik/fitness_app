/**
 * Turning an outbox entry into something a person can act on (L-02).
 *
 * The wireframe's rule is the whole design: **nothing is ever dropped
 * silently** — a terminal failure lands in the Sync Center with a
 * plain-language reason and a concrete choice.
 *
 * Two things this module is careful about:
 *
 * **The badge counts terminal failures only.** Pending retries are normal
 * operation; counting them alarms somebody about the outbox working.
 *
 * **A conflict is not a validation error.** "Reps must be at least 1" is
 * something the user can fix. "That meal no longer exists" is something that
 * happened somewhere else, and it gets L-07's dialog rather than a Fix button.
 */
import type { OutboxEntry } from '@/lib/db';
import { UNREACHABLE } from '@/lib/offline/outbox';

export type FailureKind = 'validation' | 'conflict' | 'gone' | 'unknown';

export interface QueuedChange {
  id: number;
  /** "3 sets · Chest & Triceps", "Weight 78.4 kg" — what the user did. */
  title: string;
  detail: string | null;
  attempts: number;
  kind: FailureKind;
  /** The server's own sentence, shown verbatim. */
  reason: string | null;
}

/** What kind of thing a queued write is, from its path alone. */
export function describePath(entry: OutboxEntry): string {
  const { path, method } = entry;

  if (path.includes('/sets')) return 'Set';
  if (path.startsWith('/meals')) return method === 'POST' ? 'Meal' : 'Meal change';
  if (path.includes('/recipes/') && path.endsWith('/log')) return 'Recipe';
  if (path.startsWith('/body-metrics')) return 'Measurement';
  if (path.startsWith('/food-analysis')) return 'Food analysis';
  return 'Change';
}

/**
 * A one-line summary of what is queued, from the body.
 *
 * Reads the JSON rather than storing a second copy of it: a label saved
 * alongside the entry would be a second home for the same fact (**I15**) and
 * would go stale the moment the body changed.
 */
export function summarise(entry: OutboxEntry): { title: string; detail: string | null } {
  const kind = describePath(entry);
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(entry.body) as Record<string, unknown>;
  } catch {
    // A body we cannot read is still a change we must not drop.
    return { title: kind, detail: null };
  }

  if (kind === 'Set') {
    const load = body.load_kg;
    const reps = body.reps;
    return {
      title: 'Set',
      detail: load != null && reps != null ? `${load} kg × ${reps}` : null,
    };
  }
  if (kind === 'Measurement') {
    return {
      title: 'Measurement',
      detail: body.value != null ? `${body.value} ${body.unit ?? ''}`.trim() : null,
    };
  }
  if (kind === 'Meal' || kind === 'Recipe') {
    const items = Array.isArray(body.items) ? body.items.length : null;
    return {
      title: kind,
      detail: [
        typeof body.meal_type === 'string' ? body.meal_type : null,
        items === null ? null : `${items} item${items === 1 ? '' : 's'}`,
      ].filter(Boolean).join(' · ') || null,
    };
  }
  return { title: kind, detail: null };
}

/**
 * Which kind of failure this is, and therefore what the user is offered.
 *
 * Classified from the **server's message**, because the outbox stores what the
 * server said and not why. Crude on purpose: a wrong guess here costs a button
 * label, where storing a parallel taxonomy would cost correctness.
 */
export function classify(reason: string | null): FailureKind {
  if (!reason) return 'unknown';
  const lower = reason.toLowerCase();
  if (lower.includes('no longer exists') || lower.includes('not found')) return 'gone';
  if (lower.includes('changed somewhere else') || lower.includes('conflict')) return 'conflict';
  if (lower.includes('must') || lower.includes('needs') || lower.includes('at least')) {
    return 'validation';
  }
  return 'unknown';
}

export function toChange(entry: OutboxEntry): QueuedChange {
  const { title, detail } = summarise(entry);
  return {
    id: entry.id,
    title,
    detail,
    attempts: entry.attempts,
    kind: classify(entry.lastError),
    reason: entry.lastError,
  };
}

export interface SyncState {
  pending: QueuedChange[];
  failed: QueuedChange[];
  /** **Terminal failures only.** A pending retry is the outbox working. */
  badge: number;
}

export function syncState(entries: readonly OutboxEntry[]): SyncState {
  const pending = entries.filter((e) => e.state === 'pending').map(toChange);
  const failed = entries.filter((e) => e.state === 'failed').map(toChange);
  return { pending, failed, badge: failed.length };
}

/**
 * Whether the phone looks offline, from the only evidence the app has: a
 * queued write whose last attempt could not reach the server. A server error
 * is the server being reached, so it does not count; neither does a write not
 * yet tried, nor a terminal failure.
 */
export function looksOffline(entries: readonly OutboxEntry[]): boolean {
  return entries.some((e) => e.state === 'pending' && e.lastError === UNREACHABLE);
}

/** The banner's sentence — what still works, not just that something is wrong. */
export function bannerFor(state: SyncState, online: boolean): string | null {
  if (state.failed.length > 0) {
    const n = state.failed.length;
    return `${n} change${n === 1 ? '' : 's'} couldn't sync`;
  }
  if (!online) return 'Offline — everything you log is still saving here';
  if (state.pending.length > 0) {
    const n = state.pending.length;
    return `Syncing ${n} change${n === 1 ? '' : 's'}…`;
  }
  return null;
}
