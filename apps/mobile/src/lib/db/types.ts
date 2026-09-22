/**
 * The durability contract (docs/03 §5.3, D14).
 *
 * Defined as an interface, not as SQL, for a reason discovered in G3: `expo-sqlite`
 * declares `"platforms": ["apple", "android"]` — there is **no web implementation
 * at all**. Importing it on web throws `Cannot find native module 'ExpoSQLite'`
 * and takes the whole app down, and web is the only target this project can
 * currently run (DR4 — no device yet, no Xcode).
 *
 * So the store is an interface with two implementations: SQLite on the shipping
 * platforms, and an in-memory one for the web development surface and for tests.
 * The logic above it — the reducers, the outbox ordering, the recovery rules — is
 * then provable without a device, and the SQLite implementation is the only part
 * G4 still has to verify on hardware.
 */

export interface DraftRecord {
  revision: number;
  updatedAt: string;
  /** The whole draft, as JSON. Read and written whole (docs/03 §5.3). */
  json: string;
}

export type OutboxState = 'pending' | 'sent' | 'failed';

export interface OutboxEntry {
  id: number;
  aggregateId: string;
  method: string;
  path: string;
  body: string;
  /** I8 — generated once, at commit, and never regenerated on retry. */
  idempotencyKey: string;
  attempts: number;
  nextAttemptAt: string;
  state: OutboxState;
  lastError: string | null;
}

export type NewOutboxEntry = Omit<OutboxEntry, 'id' | 'attempts' | 'state' | 'lastError'>;

export interface SessionStore {
  /** Opens and migrates. Safe to call more than once. */
  open(): Promise<void>;

  /** What `PRAGMA journal_mode` returned, or null where the concept does not apply. */
  journalMode(): string | null;

  loadDraft(): Promise<DraftRecord | null>;
  clearDraft(): Promise<void>;

  /**
   * **The set-commit write.** The draft and the outbox entry land together or not
   * at all — a torn pair is a lost set or a duplicated one, and that single
   * requirement is the whole reason D14 chose a database over key-value.
   *
   * `entry` is optional because some committed changes (a note, a reorder) rewrite
   * the draft without producing a write.
   */
  commit(draft: DraftRecord, entry?: NewOutboxEntry): Promise<void>;

  /** Pending entries whose backoff has elapsed, oldest first, FIFO per aggregate. */
  readyEntries(now: string, limit?: number): Promise<OutboxEntry[]>;

  allEntries(): Promise<OutboxEntry[]>;

  markSent(id: number): Promise<void>;
  /** A retryable failure: bump attempts and push `nextAttemptAt` out. */
  markRetry(id: number, nextAttemptAt: string, error: string): Promise<void>;
  /** Terminal: surfaced in the Sync Center, never silently dropped (docs/03 §7). */
  markFailed(id: number, error: string): Promise<void>;

  /** Test and "clear data" support. */
  reset(): Promise<void>;
}
