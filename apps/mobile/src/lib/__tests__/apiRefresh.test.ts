/**
 * Losing the network must not lose the account.
 *
 * The first refresh code caught everything and signed out, on the reasoning
 * that reuse detection may have ended the sign-in. That is true when the
 * server answers no. It is not true of a phone with no signal — and there the
 * failure looked the same.
 *
 * So opening the app in a basement gym signed the user out of a workout in
 * progress, and left them unable to log back in until they had reception.
 * Found while proving the offline flow on a device. Supabase Auth holds the
 * session now (docs/14); the rule is the same: only an answer means "over".
 */
import { api, getAccessToken, onSessionRevoked, setAccessToken } from '../api';
import * as supabaseModule from '../supabase';

// The fake jest.setup.ts installs in place of Supabase (src/lib/__mocks__).
const { fakeAuth, supabase } = supabaseModule as unknown as typeof import('../__mocks__/supabase');

const asResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});
const unauthorised = () => asResponse(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'no' } });

beforeEach(() => {
  jest.clearAllMocks();
  fakeAuth.signIn();
  setAccessToken('stale-access');
});
afterEach(() => onSessionRevoked(null));

describe('a refresh that fails because Supabase cannot be reached', () => {
  it('keeps the sign-in, and tells nobody it ended', async () => {
    fakeAuth.offline = true;
    const heard = jest.fn();
    onSessionRevoked(heard);

    await expect(api.tryRefresh()).resolves.toBe(false);

    expect(fakeAuth.session).not.toBeNull();
    expect(getAccessToken()).toBe('stale-access');
    expect(heard).not.toHaveBeenCalled();
  });
});

describe('a refresh Supabase refuses — the sign-in was ended elsewhere', () => {
  it('drops the token and tells the app (L-05)', async () => {
    fakeAuth.revoke();
    const heard = jest.fn();
    onSessionRevoked(heard);

    await expect(api.tryRefresh()).resolves.toBe(false);

    expect(getAccessToken()).toBeNull();
    expect(heard).toHaveBeenCalledTimes(1);
  });
});

describe('a refresh that works', () => {
  it('uses the new access token', async () => {
    await expect(api.tryRefresh()).resolves.toBe(true);
    expect(getAccessToken()).toMatch(/^access-refreshed-/);
  });

  it('retries the refused request once with it', async () => {
    const seen: (string | undefined)[] = [];
    global.fetch = jest.fn(async (_url: string, init: { headers: Record<string, string> }) => {
      seen.push(init.headers.authorization);
      return seen.length === 1 ? unauthorised() : asResponse(200, { success: true, data: { ok: 1 } });
    }) as never;

    await expect(api.get('/profile')).resolves.toEqual({ ok: 1 });

    expect(seen[0]).toBe('Bearer stale-access');
    expect(seen[1]).toMatch(/^Bearer access-refreshed-/);
  });
});

describe('the last refused request is remembered for a problem report', () => {
  it('keeps its request id, and only the id', async () => {
    const { lastFailedRequestId } = jest.requireActual('../api') as typeof import('../api');
    global.fetch = jest.fn(async () => asResponse(422, {
      success: false, error: { code: 'VALIDATION_FAILED', message: 'no', request_id: 'req_x1' },
    })) as never;

    await expect(api.post('/meals', { secret: 'my dinner' })).rejects.toThrow('no');

    expect(lastFailedRequestId()).toBe('req_x1');
  });
});
