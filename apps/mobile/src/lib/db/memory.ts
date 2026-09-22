/**
 * The in-memory store — the web development surface and every test.
 *
 * It exists because `expo-sqlite` has no web build, and web is currently the only
 * runnable target (DR4). It is **not** a shipping store: nothing survives a
 * reload, and it says so rather than pretending.
 *
 * It implements the same contract as the SQLite store and is exercised by the
 * same test suite, so the logic above it — reducers, outbox ordering, recovery —
 * is proven here and only the SQL itself waits for G4.
 */
import type { DraftRecord, NewOutboxEntry, OutboxEntry, SessionStore } from './types';

export function createMemoryStore(): SessionStore {
  let draft: DraftRecord | null = null;
  let entries: OutboxEntry[] = [];
  let nextId = 1;

  return {
    async open() { /* nothing to open */ },

    journalMode: () => null,

    async loadDraft() { return draft ? { ...draft } : null; },

    async clearDraft() { draft = null; },

    async commit(next: DraftRecord, entry?: NewOutboxEntry) {
      // Synchronous, so the pair cannot tear — the same guarantee the SQLite
      // implementation buys with a transaction.
      const previousDraft = draft;
      const previousEntries = entries;
      try {
        draft = { ...next };
        if (entry) {
          const existing = entries.find((e) => e.idempotencyKey === entry.idempotencyKey);
          if (existing) {
            // An enqueue that happens twice updates, never appends (I8).
            entries = entries.map((e) =>
              e.idempotencyKey === entry.idempotencyKey ? { ...e, body: entry.body } : e,
            );
          } else {
            entries = [...entries, {
              ...entry, id: nextId++, attempts: 0, state: 'pending', lastError: null,
            }];
          }
        }
      } catch (e) {
        draft = previousDraft;
        entries = previousEntries;
        throw e;
      }
    },

    async readyEntries(now: string, limit = 50) {
      return entries
        .filter((e) => e.state === 'pending' && e.nextAttemptAt <= now)
        .sort((a, b) => (a.aggregateId === b.aggregateId
          ? a.id - b.id
          : a.aggregateId.localeCompare(b.aggregateId)))
        .slice(0, limit)
        .map((e) => ({ ...e }));
    },

    async allEntries() { return entries.map((e) => ({ ...e })).sort((a, b) => a.id - b.id); },

    async markSent(id: number) {
      entries = entries.map((e) =>
        e.id === id ? { ...e, state: 'sent', lastError: null } : e);
    },

    async markRetry(id: number, nextAttemptAt: string, error: string) {
      entries = entries.map((e) =>
        e.id === id ? { ...e, attempts: e.attempts + 1, nextAttemptAt, lastError: error } : e);
    },

    async markFailed(id: number, error: string) {
      entries = entries.map((e) =>
        e.id === id ? { ...e, state: 'failed', attempts: e.attempts + 1, lastError: error } : e);
    },

    async reset() { draft = null; entries = []; nextId = 1; },
  };
}
