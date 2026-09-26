/**
 * Deleting the account from the phone (K-07; Apple 5.1.1(v), Google Play).
 *
 * The order is the whole design:
 *
 *   1. **The server first.** If it refuses — a wrong password, no signal, a
 *      rate limit — this throws before anything on the phone is touched, so a
 *      failed deletion never costs someone their unfinished workout.
 *   2. **Then this device forgets the account**, while it is still the signed-in
 *      owner: the store only reaches the current owner's rows, so after
 *      sign-out there would be nothing to delete them through. The draft and
 *      the queued writes belong to an account that no longer exists; sent, they
 *      would fail for ever in the Sync Center.
 *   3. **Then the session ends**, with a sentence left for the welcome screen.
 *
 * Unlike sign-out (K-01), which keeps a workout waiting for its account, this
 * drops it: there is no account left for it to wait for.
 */
import { ApiError } from '@/lib/api';
import type { SessionStore } from '@/lib/db/types';
import { leaveFarewell } from './farewell';

export const ACCOUNT_DELETED = 'Your account and everything in it has been deleted.';
export const SESSION_ENDED = "You've been signed out. If you had just asked to delete your "
  + "account, that went through; if not, sign in and try again.";

export interface ForgetDeps {
  store: Pick<SessionStore, 'clearDraft' | 'allEntries' | 'discard'>;
  /** Drop the workout held in memory (the persisted draft is cleared above). */
  releaseWorkout: () => void;
  /**
   * Cancel the scheduled reminders. Sign-out keeps them — they are device
   * preferences (D29) — but a deleted account has no workouts to be reminded
   * of. The preference stays, so the next account on this phone gets them back.
   */
  cancelReminders: () => Promise<unknown>;
  /** Any downloaded export still inside the app — a full copy of what went. */
  removeExports: () => Promise<unknown>;
}

export interface DeleteAccountDeps extends ForgetDeps {
  /** The server call. Throws on refusal. */
  remove: (password: string) => Promise<unknown>;
  signOut: () => Promise<void>;
}

const warn = (what: string) => (e: unknown) => {
  // The account is already gone on the server; a leftover row on this phone is
  // logged, and must not keep the person signed in to an account that is not there.
  console.warn(`[privacy] could not ${what} after deleting the account`, e);
};

/** This account's workout, queued writes, reminders and exports, gone from this phone. */
export async function forgetThisDevice(
  { store, releaseWorkout, cancelReminders, removeExports }: ForgetDeps,
): Promise<void> {
  await store.clearDraft().catch(warn('clear the workout draft'));
  const entries = await store.allEntries().catch((e: unknown) => {
    warn('read the queue')(e);
    return [];
  });
  for (const entry of entries) {
    await store.discard(entry.id).catch(warn(`discard queued write ${entry.id}`));
  }
  releaseWorkout();
  await cancelReminders().catch(warn('cancel the reminders'));
  await removeExports().catch(warn('remove downloaded exports'));
}

/**
 * Deletes the account, or says honestly why it did not.
 *
 * **A 401 means the session is already gone.** Most likely a retry after a
 * dropped reply: the first attempt deleted the account and its tokens went
 * with it. The session is ended either way — but the device is NOT forgotten,
 * because a session that merely expired must keep its unfinished workout for
 * its account, as sign-out promises (K-01).
 */
export async function deleteAccountEverywhere(password: string, deps: DeleteAccountDeps): Promise<void> {
  try {
    await deps.remove(password);
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 401)) throw e;
    leaveFarewell(SESSION_ENDED);
    await deps.signOut();
    return;
  }
  await forgetThisDevice(deps);
  leaveFarewell(ACCOUNT_DELETED);
  await deps.signOut();
}

/**
 * What to say when deleting did not finish.
 *
 * Only a refusal the server actually sent can promise that nothing was
 * deleted. A reply that never arrived — no signal, a proxy's error page — may
 * have followed a deletion that did happen, so it says it cannot tell.
 */
export function failureMessage(e: unknown): string {
  if (e instanceof ApiError && e.code !== 'NETWORK' && e.status > 0) {
    return `${e.message} Nothing has been deleted.`;
  }
  return "Couldn't reach the server, so we can't tell whether your account was deleted. "
    + "Try again when you're online — if it was, you'll be signed out.";
}
