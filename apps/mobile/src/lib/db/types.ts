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

  /**
   * Whose draft and queue this is — the signed-in account's id, or null when
   * nobody is signed in.
   *
   * Added in G10, after the phone showed one account's unfinished workout and
   * failing writes inside another account. Every row is stamped with the owner
   * that wrote it and every read sees only the current owner's, so a workout
   * waits for its own account (K-01: "It'll still be here when you sign back
   * in") and is never shown to, or sent as, anyone else. With no owner there
   * is nothing to read, and writing throws.
   */
  setOwner(owner: string | null): void;

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

  /**
   * Queues a write that has **no draft behind it** — a meal, a body metric.
   *
   * Added in G7. The outbox ENGINE was always generic (`createOutbox` only
   * touches `readyEntries`/`markSent`/`markRetry`/`markFailed`), but the only
   * way to fill it was `commit(draft, entry)`, which demands a session draft.
   * That made "the outbox is generic" true of the queue and false of the door.
   *
   * Fixed here rather than answered with a second queue: two queues is how one
   * of them silently stops flushing.
   *
   * Idempotent on `idempotencyKey`, exactly as `commit`'s entry is (**I8**).
   */
  enqueue(entry: NewOutboxEntry): Promise<void>;

  /** Pending entries whose backoff has elapsed, oldest first, FIFO per aggregate. */
  readyEntries(now: string, limit?: number): Promise<OutboxEntry[]>;

  allEntries(): Promise<OutboxEntry[]>;

  markSent(id: number): Promise<void>;
  /** A retryable failure: bump attempts and push `nextAttemptAt` out. */
  markRetry(id: number, nextAttemptAt: string, error: string): Promise<void>;
  /** Terminal: surfaced in the Sync Center, never silently dropped (docs/03 §7). */
  markFailed(id: number, error: string): Promise<void>;

  /**
   * Put a failed entry back in the queue, due now (L-02's "Retry everything").
   *
   * Added in G10. G3 built the queue and G7 built the door; neither built the
   * way **out** — a terminal failure landed in `failed` and nothing could
   * either retry it or throw it away. "Nothing is ever dropped silently" is
   * only true if the user has somewhere to drop it deliberately.
   *
   * The idempotency key is **kept** (**I8**). A retry that generated a new key
   * could double the write it is retrying, which is the one thing the outbox
   * exists to prevent.
   */
  requeue(id: number, nextAttemptAt: string): Promise<void>;

  /** Throw an entry away. Per-item and confirmed in the UI, never automatic. */
  discard(id: number): Promise<void>;

  /** Test and "clear data" support. */
  reset(): Promise<void>;
}
