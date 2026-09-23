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

type Owned = OutboxEntry & { owner: string };

/** An entry as callers see it — the owner is the store's business. */
const bare = ({ owner: _owner, ...e }: Owned): OutboxEntry => ({ ...e });

export function createMemoryStore(initialOwner: string | null = null): SessionStore {
  let owner: string | null = initialOwner;
  let drafts = new Map<string, DraftRecord>();
  let entries: Owned[] = [];
  let nextId = 1;

  const mine = () => entries.filter((e) => e.owner === owner);
  const requireOwner = (): string => {
    if (owner === null) throw new Error('No account is signed in; nothing can be queued.');
    return owner;
  };

  /** Insert, or update the body of the same key (I8) — within this owner. */
  const upsert = (list: Owned[], who: string, entry: NewOutboxEntry): Owned[] =>
    list.some((e) => e.idempotencyKey === entry.idempotencyKey)
      ? list.map((e) => (e.idempotencyKey === entry.idempotencyKey ? { ...e, body: entry.body } : e))
      : [...list, { ...entry, owner: who, id: nextId++, attempts: 0, state: 'pending', lastError: null }];

  return {
    setOwner(next: string | null) { owner = next; },

    async open() { /* nothing to open */ },

    journalMode: () => null,

    async loadDraft() {
      const d = owner === null ? undefined : drafts.get(owner);
      return d ? { ...d } : null;
    },

    async clearDraft() {
      if (owner === null) return;
      drafts = new Map([...drafts].filter(([k]) => k !== owner));
    },

    async enqueue(entry: NewOutboxEntry) {
      // Deliberately does NOT touch the draft — see SessionStore.enqueue.
      entries = upsert(entries, requireOwner(), entry);
    },

    async commit(next: DraftRecord, entry?: NewOutboxEntry) {
      // Built whole and swapped in, so the pair cannot tear — the guarantee the
      // SQLite implementation buys with a transaction.
      const who = requireOwner();
      const nextEntries = entry ? upsert(entries, who, entry) : entries;
      drafts = new Map(drafts).set(who, { ...next });
      entries = nextEntries;
    },

    async readyEntries(now: string, limit = 50) {
      return mine()
        .filter((e) => e.state === 'pending' && e.nextAttemptAt <= now)
        .sort((a, b) => (a.aggregateId === b.aggregateId
          ? a.id - b.id
          : a.aggregateId.localeCompare(b.aggregateId)))
        .slice(0, limit)
        .map(bare);
    },

    async allEntries() { return mine().map(bare).sort((a, b) => a.id - b.id); },

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

    async requeue(id: number, nextAttemptAt: string) {
      // The idempotency key is untouched: a retry is the SAME write (I8).
      entries = entries.map((e) =>
        e.id === id
          ? { ...e, state: 'pending', nextAttemptAt, lastError: null }
          : e);
    },

    async discard(id: number) {
      entries = entries.filter((e) => e.id !== id);
    },

    async reset() { drafts = new Map(); entries = []; nextId = 1; },
  };
}
