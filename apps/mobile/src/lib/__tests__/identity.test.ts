/**
 * What an identity change does to everything held on the device (G10).
 *
 * Found on a phone: after the demo account's test runs, the owner's account
 * opened on the demo's unfinished workout and the demo's failing writes. On
 * every change of account — including to nobody — the store is re-scoped, every
 * cached read is dropped (docs/03 §6.2), and the in-memory workout is let go
 * WITHOUT deleting it: it belongs to its account and waits for it (K-01).
 */
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react-native';
import { createIdentityHandler, dropCachedReads } from '../identity';

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

describe('dropCachedReads — what "clear the cache" means with screens on show', () => {
  // Found in G10 opening /progress directly: the screen's reads 401'd, the
  // session refreshed and announced the account, and `queryClient.clear()`
  // removed the queries out from under their mounted observers. The retries
  // came back 200 and the screen said "Loading…" for ever.
  it('a mounted read is refetched, not orphaned', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    let who = 'a';
    const observer = new QueryObserver(client, { queryKey: ['me'], queryFn: async () => who });
    const stop = observer.subscribe(() => {});
    await waitFor(() => expect(observer.getCurrentResult().data).toBe('a'));

    who = 'b';
    dropCachedReads(client);
    await waitFor(() => expect(observer.getCurrentResult().data).toBe('b'));
    stop();
    client.clear();
  });

  it('nothing read under the previous account survives, mounted or not', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    client.setQueryData(['inactive'], 'secret');
    dropCachedReads(client);
    expect(client.getQueryData(['inactive'])).toBeUndefined();
    client.clear();
  });
});
