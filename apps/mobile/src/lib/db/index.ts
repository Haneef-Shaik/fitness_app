/**
 * iOS and Android: the real store (D14).
 *
 * Metro prefers `index.web.ts` on web, which swaps in the in-memory store —
 * `expo-sqlite` has no web build and importing it there takes the app down.
 * TypeScript resolves this file, so the SQLite implementation is the one that
 * gets type-checked.
 *
 * **The implementation is required lazily, on first use.** `expo-sqlite` is a
 * native module, so a static import puts it in the module graph of everything
 * that so much as mentions the store — which, since G7 wired meals through it,
 * is the whole query layer. Under Jest that import throws before a single
 * assertion runs. Loading it on first call keeps the cost where the use is, and
 * keeps a suite that never touches the store from having to pretend SQLite
 * exists.
 */
import type { DraftRecord, NewOutboxEntry, SessionStore } from './types';

let instance: SessionStore | null = null;

function impl(): SessionStore {
  if (instance === null) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSqliteStore } = require('./sqlite') as typeof import('./sqlite');
    instance = createSqliteStore();
  }
  return instance;
}

/**
 * A façade, not the store. Every call forwards to the one real instance; it
 * exists so importing this module costs nothing.
 */
export const store: SessionStore = {
  setOwner: (owner: string | null) => impl().setOwner(owner),
  open: () => impl().open(),
  journalMode: () => impl().journalMode(),
  loadDraft: () => impl().loadDraft(),
  clearDraft: () => impl().clearDraft(),
  commit: (draft: DraftRecord, entry?: NewOutboxEntry) => impl().commit(draft, entry),
  enqueue: (entry: NewOutboxEntry) => impl().enqueue(entry),
  readyEntries: (now: string, limit?: number) => impl().readyEntries(now, limit),
  allEntries: () => impl().allEntries(),
  markSent: (id: number) => impl().markSent(id),
  markRetry: (id: number, nextAttemptAt: string, error: string) =>
    impl().markRetry(id, nextAttemptAt, error),
  markFailed: (id: number, error: string) => impl().markFailed(id, error),
  requeue: (id: number, nextAttemptAt: string) => impl().requeue(id, nextAttemptAt),
  discard: (id: number) => impl().discard(id),
  reset: () => impl().reset(),
};

export const STORE_KIND = 'sqlite' as const;
export * from './types';
