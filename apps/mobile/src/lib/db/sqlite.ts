/**
 * The SQLite store (D14) — the shipping implementation.
 *
 * Imported only from `index.native.ts`, so web never loads `expo-sqlite`. It has
 * no web build: `"platforms": ["apple", "android"]`.
 *
 * **Unverified on hardware.** No device exists yet (DR4) and web cannot run it,
 * so every line below is written against the documented API and proven only by
 * the shared store contract tests running against the in-memory twin. G4 runs
 * this one on a phone; until then that is the honest status.
 */
import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './schema';
import type { DraftRecord, NewOutboxEntry, OutboxEntry, SessionStore } from './types';

export const DATABASE_NAME = 'fitlog.db';

interface OutboxRow {
  id: number; aggregate_id: string; method: string; path: string; body: string;
  idempotency_key: string; attempts: number; next_attempt_at: string;
  state: string; last_error: string | null;
}

const toEntry = (r: OutboxRow): OutboxEntry => ({
  id: r.id,
  aggregateId: r.aggregate_id,
  method: r.method,
  path: r.path,
  body: r.body,
  idempotencyKey: r.idempotency_key,
  attempts: r.attempts,
  nextAttemptAt: r.next_attempt_at,
  state: r.state as OutboxEntry['state'],
  lastError: r.last_error,
});

export function createSqliteStore(name = DATABASE_NAME): SessionStore {
  let db: SQLite.SQLiteDatabase | null = null;
  let opening: Promise<SQLite.SQLiteDatabase> | null = null;
  let mode: string | null = null;
  // Whose rows this is (see SessionStore.setOwner). '' is never an account id.
  let owner: string | null = null;
  const requireOwner = (): string => {
    if (owner === null) throw new Error('No account is signed in; nothing can be queued.');
    return owner;
  };

  async function handle(): Promise<SQLite.SQLiteDatabase> {
    if (db) return db;
    if (opening) return opening;

    opening = (async () => {
      const d = await SQLite.openDatabaseAsync(name);

      // WAL lets a read proceed while a write is in flight. G0 deliberately did
      // not claim it works, so the result is RECORDED rather than assumed — a
      // platform that refuses WAL still works, just with more lock contention.
      try {
        const row = await d.getFirstAsync<{ journal_mode: string }>('PRAGMA journal_mode = WAL');
        mode = row?.journal_mode ?? null;
      } catch {
        mode = null;
      }

      const v = await d.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      for (let i = v?.user_version ?? 0; i < MIGRATIONS.length; i++) {
        await d.execAsync(MIGRATIONS[i]!);
      }
      // PRAGMA cannot be parameterised; the value is a compile-time constant.
      await d.execAsync(`PRAGMA user_version = ${MIGRATIONS.length}`);

      db = d;
      return d;
    })();

    return opening;
  }

  const UPSERT_ENTRY = `INSERT INTO outbox (aggregate_id, method, path, body, idempotency_key, next_attempt_at, owner)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(idempotency_key) DO UPDATE SET body = excluded.body`;

  return {
    setOwner(next: string | null) { owner = next; },

    async open() { await handle(); },

    journalMode: () => mode,

    async loadDraft() {
      if (owner === null) return null;
      const d = await handle();
      const row = await d.getFirstAsync<{ revision: number; updated_at: string; json: string }>(
        'SELECT revision, updated_at, json FROM session_draft WHERE owner = ?', owner,
      );
      return row ? { revision: row.revision, updatedAt: row.updated_at, json: row.json } : null;
    },

    async clearDraft() {
      const d = await handle();
      if (owner === null) return;
      await d.runAsync('DELETE FROM session_draft WHERE owner = ?', owner);
    },

    async enqueue(entry: NewOutboxEntry) {
      // No transaction needed: this is a single row, and it deliberately does
      // not touch the draft — see SessionStore.enqueue.
      const who = requireOwner();
      const d = await handle();
      await d.runAsync(UPSERT_ENTRY, entry.aggregateId, entry.method, entry.path, entry.body,
        entry.idempotencyKey, entry.nextAttemptAt, who);
    },

    async commit(draft: DraftRecord, entry?: NewOutboxEntry) {
      const who = requireOwner();
      const d = await handle();
      // Both writes or neither. This is the property the decision rests on.
      await d.withTransactionAsync(async () => {
        await d.runAsync(
          `INSERT INTO session_draft (owner, revision, updated_at, json) VALUES (?, ?, ?, ?)
           ON CONFLICT(owner) DO UPDATE SET revision = excluded.revision,
             updated_at = excluded.updated_at, json = excluded.json`,
          who, draft.revision, draft.updatedAt, draft.json,
        );
        if (entry) {
          // An enqueue that happens twice is a no-op, not a duplicate set (I8).
          await d.runAsync(UPSERT_ENTRY, entry.aggregateId, entry.method, entry.path, entry.body,
            entry.idempotencyKey, entry.nextAttemptAt, who);
        }
      });
    },

    async readyEntries(now: string, limit = 50) {
      if (owner === null) return [];
      const d = await handle();
      const rows = await d.getAllAsync<OutboxRow>(
        // FIFO per aggregate, including across backoff: a write is ready only
        // when no EARLIER pending write of its aggregate is still waiting. A
        // later write overtaking a backed-off one could delete a set before it
        // existed, or send a set before its exercise (G11).
        `SELECT * FROM outbox o
          WHERE o.owner = ? AND o.state = 'pending' AND o.next_attempt_at <= ?
            AND NOT EXISTS (
              SELECT 1 FROM outbox p
               WHERE p.owner = o.owner AND p.aggregate_id = o.aggregate_id
                 AND p.state = 'pending' AND p.id < o.id AND p.next_attempt_at > ?
            )
         ORDER BY o.aggregate_id, o.id LIMIT ?`,
        owner, now, now, limit,
      );
      return rows.map(toEntry);
    },

    async allEntries() {
      const d = await handle();
      if (owner === null) return [];
      const rows = await d.getAllAsync<OutboxRow>('SELECT * FROM outbox WHERE owner = ? ORDER BY id', owner);
      return rows.map(toEntry);
    },

    async markSent(id: number) {
      const d = await handle();
      await d.runAsync("UPDATE outbox SET state = 'sent', last_error = NULL WHERE id = ?", id);
    },

    async markRetry(id: number, nextAttemptAt: string, error: string) {
      const d = await handle();
      await d.runAsync(
        `UPDATE outbox SET attempts = attempts + 1, next_attempt_at = ?, last_error = ?
         WHERE id = ?`,
        nextAttemptAt, error, id,
      );
    },

    async markFailed(id: number, error: string) {
      const d = await handle();
      await d.runAsync(
        "UPDATE outbox SET state = 'failed', attempts = attempts + 1, last_error = ? WHERE id = ?",
        error, id,
      );
    },

    async requeue(id: number, nextAttemptAt: string) {
      const d = await handle();
      // `idempotency_key` is deliberately untouched: a retry is the SAME write
      // (I8), and a new key could double the thing it is retrying.
      await d.runAsync(
        `UPDATE outbox SET state = 'pending', next_attempt_at = ?, last_error = NULL
         WHERE id = ?`,
        nextAttemptAt, id,
      );
    },

    async discard(id: number) {
      const d = await handle();
      await d.runAsync('DELETE FROM outbox WHERE id = ?', id);
    },

    async unattributedCount() {
      const d = await handle();
      const row = await d.getFirstAsync<{ n: number }>(
        "SELECT COUNT(*) AS n FROM outbox WHERE owner = '' AND state != 'sent'",
      );
      return row?.n ?? 0;
    },

    async discardUnattributed() {
      const d = await handle();
      let n = 0;
      await d.withTransactionAsync(async () => {
        const row = await d.getFirstAsync<{ n: number }>(
          "SELECT COUNT(*) AS n FROM outbox WHERE owner = '' AND state != 'sent'",
        );
        n = row?.n ?? 0;
        await d.runAsync("DELETE FROM outbox WHERE owner = ''");
      });
      return n;
    },

    async reset() {
      const d = await handle();
      await d.execAsync('DELETE FROM outbox; DELETE FROM session_draft;');
    },
  };
}
