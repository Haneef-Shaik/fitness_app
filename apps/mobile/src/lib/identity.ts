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
import type { QueryClient } from '@tanstack/react-query';

/**
 * Drop every cached read without orphaning the screens that are showing them.
 *
 * `queryClient.clear()` removes queries from the cache, but a mounted
 * observer keeps a reference to its removed query and never hears of it
 * again: opening /progress directly, its reads 401'd, the session refreshed
 * and announced the account, the cache was cleared under the screen, and it
 * said "Loading…" for ever (G10). Reads nobody is watching are removed;
 * mounted ones are reset — their data dropped — and fetched afresh.
 */
export function dropCachedReads(client: QueryClient): void {
  client.removeQueries({ type: 'inactive' });
  void client.resetQueries({ type: 'active' }).catch(() => { /* each screen shows its own error */ });
}

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
