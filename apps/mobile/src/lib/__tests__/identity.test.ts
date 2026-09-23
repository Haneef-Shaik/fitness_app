/**
 * What an identity change does to everything held on the device (G10).
 *
 * Found on a phone: after the demo account's test runs, the owner's account
 * opened on the demo's unfinished workout and the demo's failing writes. On
 * every change of account — including to nobody — the store is re-scoped, every
 * cached read is dropped (docs/03 §6.2), and the in-memory workout is let go
 * WITHOUT deleting it: it belongs to its account and waits for it (K-01).
 */
import { createIdentityHandler } from '../identity';

function setup() {
  const deps = {
    setOwner: jest.fn(),
    clearCache: jest.fn(),
    releaseWorkout: jest.fn(),
    flush: jest.fn(async () => {}),
  };
  return { deps, onChange: createIdentityHandler(deps) };
}

it('signing in scopes the store to that account, clears the cache, and drains its queue', () => {
  const { deps, onChange } = setup();
  onChange('acct-a');
  expect(deps.setOwner).toHaveBeenCalledWith('acct-a');
  expect(deps.clearCache).toHaveBeenCalledTimes(1);
  expect(deps.releaseWorkout).toHaveBeenCalledTimes(1);
  expect(deps.flush).toHaveBeenCalledTimes(1);
});

it('scopes the store BEFORE anything can read it', () => {
  const { deps, onChange } = setup();
  onChange('acct-a');
  expect(deps.setOwner.mock.invocationCallOrder[0])
    .toBeLessThan(deps.flush.mock.invocationCallOrder[0]!);
});

it('signing out scopes to nobody and sends nothing', () => {
  const { deps, onChange } = setup();
  onChange('acct-a');
  jest.clearAllMocks();
  onChange(null);
  expect(deps.setOwner).toHaveBeenCalledWith(null);
  expect(deps.clearCache).toHaveBeenCalledTimes(1);
  expect(deps.releaseWorkout).toHaveBeenCalledTimes(1);
  expect(deps.flush).not.toHaveBeenCalled();
});

it('the same account reported again changes nothing — no cache wipe mid-use', () => {
  const { deps, onChange } = setup();
  onChange('acct-a');
  jest.clearAllMocks();
  onChange('acct-a');
  expect(deps.clearCache).not.toHaveBeenCalled();
  expect(deps.releaseWorkout).not.toHaveBeenCalled();
});
