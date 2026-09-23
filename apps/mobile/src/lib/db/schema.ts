/**
 * The on-device schema (docs/03 §5.3, decision D14).
 *
 * The asymmetry between the two tables is the design:
 *
 *  - `session_draft` is ONE JSON blob because it is read and written **whole**. A
 *    session is opened once and re-rendered from memory; the row exists so a
 *    process death does not lose it. `revision` makes a stale write detectable.
 *  - `outbox` is rows because it is dequeued **in order and partially**. Entries
 *    fail individually, and `idempotency_key UNIQUE` makes an enqueue that
 *    happens twice a no-op rather than a duplicate set (I8).
 */
export const SCHEMA_VERSION = 2;

export const MIGRATIONS: readonly string[] = [
  // v1 — G3
  `
  CREATE TABLE IF NOT EXISTS session_draft (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    revision INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aggregate_id TEXT NOT NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    body TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'pending',
    last_error TEXT
  );

  CREATE INDEX IF NOT EXISTS ix_outbox_ready
    ON outbox (aggregate_id, id) WHERE state = 'pending';
  `,
  // v2 — G10: every row belongs to the account that wrote it. Found on a phone:
  // one account's unfinished workout and failing writes showed up inside
  // another. The draft becomes one row PER ACCOUNT, and the outbox gains an
  // owner.
  //
  // Rows written before this cannot be attributed to anyone — nothing in them
  // records whose they were. They get the empty owner, which no signed-in
  // account ever has, so they are never shown or sent as the wrong person.
  `
  ALTER TABLE outbox ADD COLUMN owner TEXT NOT NULL DEFAULT '';
  CREATE INDEX IF NOT EXISTS ix_outbox_owner ON outbox (owner, state);

  DROP TABLE IF EXISTS session_draft;
  CREATE TABLE session_draft (
    owner TEXT PRIMARY KEY,
    revision INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    json TEXT NOT NULL
  );
  `,
];
