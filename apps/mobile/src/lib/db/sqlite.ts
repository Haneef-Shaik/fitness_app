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

export const DATABASE_NAME = 'volt.db';

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

  return {
    async open() { await handle(); },

    journalMode: () => mode,

    async loadDraft() {
      const d = await handle();
      const row = await d.getFirstAsync<{ revision: number; updated_at: string; json: string }>(
        'SELECT revision, updated_at, json FROM session_draft WHERE id = 1',
      );
      return row ? { revision: row.revision, updatedAt: row.updated_at, json: row.json } : null;
    },

    async clearDraft() {
      const d = await handle();
      await d.runAsync('DELETE FROM session_draft WHERE id = 1');
    },

    async commit(draft: DraftRecord, entry?: NewOutboxEntry) {
      const d = await handle();
      // Both writes or neither. This is the property the decision rests on.
      await d.withTransactionAsync(async () => {
        await d.runAsync(
          `INSERT INTO session_draft (id, revision, updated_at, json) VALUES (1, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET revision = excluded.revision,
             updated_at = excluded.updated_at, json = excluded.json`,
          draft.revision, draft.updatedAt, draft.json,
        );
        if (entry) {
          // An enqueue that happens twice is a no-op, not a duplicate set (I8).
          await d.runAsync(
            `INSERT INTO outbox (aggregate_id, method, path, body, idempotency_key, next_attempt_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(idempotency_key) DO UPDATE SET body = excluded.body`,
            entry.aggregateId, entry.method, entry.path, entry.body,
            entry.idempotencyKey, entry.nextAttemptAt,
          );
        }
      });
    },

    async readyEntries(now: string, limit = 50) {
      const d = await handle();
      const rows = await d.getAllAsync<OutboxRow>(
        `SELECT * FROM outbox WHERE state = 'pending' AND next_attempt_at <= ?
         ORDER BY aggregate_id, id LIMIT ?`,
        now, limit,
      );
      return rows.map(toEntry);
    },

    async allEntries() {
      const d = await handle();
      const rows = await d.getAllAsync<OutboxRow>('SELECT * FROM outbox ORDER BY id');
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

    async reset() {
      const d = await handle();
      await d.execAsync('DELETE FROM outbox; DELETE FROM session_draft;');
    },
  };
}
