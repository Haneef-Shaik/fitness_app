/**
 * What a change of account does to everything held on the device.
 *
 * Found on a phone in G10: one account's unfinished workout and failing writes
 * appeared inside another, and cached screens survived an account switch. On
 * every change — including to nobody — the store is re-scoped first, every
 * cached read is dropped (docs/03 §6.2: a stale read across an account switch
 * is a data-leak bug), and the in-memory workout is released WITHOUT being
 * deleted: it belongs to its account and waits for it (K-01).
 */
export interface IdentityDeps {
  setOwner: (accountId: string | null) => void;
  clearCache: () => void;
  /** Drop the workout from memory only; the persisted draft stays. */
  releaseWorkout: () => void;
  /** Drain the new account's queue. */
  flush: () => Promise<void>;
}

export function createIdentityHandler(deps: IdentityDeps) {
  let current: string | null | undefined;
  return (accountId: string | null) => {
    if (accountId === current) return;
    current = accountId;
    deps.setOwner(accountId);
    deps.clearCache();
    deps.releaseWorkout();
    if (accountId !== null) void deps.flush().catch(() => { /* the pump retries */ });
  };
}
