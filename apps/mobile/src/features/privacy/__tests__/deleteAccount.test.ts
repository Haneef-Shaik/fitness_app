/**
 * Deleting an account from the phone (K-07; Apple 5.1.1(v), Google Play).
 *
 * Three things have to happen, in an order that matters:
 *
 *   1. the server deletes the account — and if it refuses (wrong password,
 *      offline, rate limited), NOTHING on the phone is touched;
 *   2. this device forgets that account's unfinished workout and queued
 *      writes — they belong to an account that no longer exists, and sending
 *      them would fail for ever in the Sync Center;
 *   3. the session ends, and the welcome screen says what happened.
 *
 * Step 2 runs BEFORE sign-out because the store only reaches the rows of the
 * account that is signed in: once the owner is cleared there is nothing left
 * to delete them through.
 */
import { ApiError } from '@/lib/api';
import { deleteAccountEverywhere, failureMessage, forgetThisDevice } from '../deleteAccount';
import { takeFarewell } from '../farewell';

function harness(over: { remove?: jest.Mock } = {}) {
  const calls: string[] = [];
  const store = {
    clearDraft: jest.fn(async () => { calls.push('clearDraft'); }),
    allEntries: jest.fn(async () => [{ id: 1 }, { id: 2 }] as never),
    discard: jest.fn(async (id: number) => { calls.push(`discard:${id}`); }),
  };
  const deps = {
    remove: over.remove ?? jest.fn(async () => { calls.push('remove'); }),
    store,
    releaseWorkout: jest.fn(() => { calls.push('release'); }),
    cancelReminders: jest.fn(async () => { calls.push('cancelReminders'); }),
    removeExports: jest.fn(async () => { calls.push('removeExports'); }),
    signOut: jest.fn(async () => { calls.push('signOut'); }),
  };
  return { deps, calls, store };
}

beforeEach(() => { takeFarewell(); });

it('deletes on the server, then forgets this device, then signs out', async () => {
  const { deps, calls } = harness();
  await deleteAccountEverywhere('correct-horse-battery', deps);

  expect(deps.remove).toHaveBeenCalledWith('correct-horse-battery');
  expect(calls).toEqual([
    'remove', 'clearDraft', 'discard:1', 'discard:2', 'release', 'cancelReminders',
    'removeExports', 'signOut',
  ]);
});

it('a session the server no longer knows is signed out, without claiming a deletion', async () => {
  // A retry after a dropped connection: the first attempt may have deleted
  // the account, and the tokens went with it. Signing out is right either
  // way; forgetting the device is not — if the session merely expired, the
  // unfinished workout must wait for its account as sign-out promises (K-01).
  const expired = new ApiError('UNAUTHORIZED', 'Log back in to carry on.', 401);
  const { deps, store } = harness({ remove: jest.fn(async () => { throw expired; }) });

  await deleteAccountEverywhere('pw', deps);

  expect(deps.signOut).toHaveBeenCalled();
  expect(store.clearDraft).not.toHaveBeenCalled();
  expect(takeFarewell()).toMatch(/signed out/);
});

describe('failureMessage', () => {
  it('says nothing was deleted when the server answered with a refusal', () => {
    const limited = new ApiError('RATE_LIMITED', 'Too many attempts. Try again in 12 minutes.', 429);
    expect(failureMessage(limited)).toBe(
      'Too many attempts. Try again in 12 minutes. Nothing has been deleted.',
    );
  });

  it('does not claim to know when the answer never arrived', () => {
    // The server may have deleted the account and the reply been lost.
    for (const lost of [
      new TypeError('Network request failed'),
      new ApiError('NETWORK', 'Could not reach the server.', 502),
    ]) {
      const message = failureMessage(lost);
      expect(message).toMatch(/can't tell/);
      expect(message).not.toMatch(/Nothing has been deleted/);
    }
  });
});

it('stops the reminders a deleted account scheduled, and survives failing to', async () => {
  // Sign-out keeps them (device preferences, D29); a deleted account has no
  // workouts to be reminded of. The preference itself stays, so another
  // account signing in on this phone gets them back.
  const { deps } = harness();
  deps.cancelReminders.mockRejectedValueOnce(new Error('no permission'));
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await deleteAccountEverywhere('pw', deps);

  expect(deps.cancelReminders).toHaveBeenCalled();
  expect(deps.signOut).toHaveBeenCalled();
  warn.mockRestore();
});

it('leaves the welcome screen a sentence to say', async () => {
  const { deps } = harness();
  await deleteAccountEverywhere('pw', deps);
  expect(takeFarewell()).toMatch(/account .*has been deleted/i);
  // Said once, not every time the welcome screen appears.
  expect(takeFarewell()).toBeNull();
});

it('touches nothing on the phone when the server refuses', async () => {
  const refusal = new Error('That password is not right.');
  const { deps, store } = harness({ remove: jest.fn(async () => { throw refusal; }) });

  await expect(deleteAccountEverywhere('wrong', deps)).rejects.toBe(refusal);
  expect(store.clearDraft).not.toHaveBeenCalled();
  expect(store.discard).not.toHaveBeenCalled();
  expect(deps.signOut).not.toHaveBeenCalled();
  expect(takeFarewell()).toBeNull();
});

it('still signs out if forgetting the device half fails', async () => {
  // The account is already gone on the server; staying signed in to it would
  // be worse than a stale row on the phone.
  const { deps, store } = harness();
  store.clearDraft.mockRejectedValueOnce(new Error('database is locked'));
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  await deleteAccountEverywhere('pw', deps);

  expect(deps.signOut).toHaveBeenCalled();
  expect(store.discard).toHaveBeenCalledTimes(2);
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});

it('forgetting the device drops the draft, every queued write and the workout in memory', async () => {
  const { deps, store } = harness();
  await forgetThisDevice(deps);
  expect(store.clearDraft).toHaveBeenCalled();
  expect(store.discard.mock.calls.map((c) => c[0])).toEqual([1, 2]);
  expect(deps.releaseWorkout).toHaveBeenCalled();
  expect(deps.cancelReminders).toHaveBeenCalled();
  // A downloaded export is a full copy of what was just deleted.
  expect(deps.removeExports).toHaveBeenCalled();
});
