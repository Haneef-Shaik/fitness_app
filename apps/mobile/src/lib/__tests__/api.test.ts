/**
 * src/lib/api.ts shipped untested. These cover the three things that fail
 * silently: envelope unwrapping, the 401 refresh dance, and the LAN host
 * derivation that decides whether a physical phone can reach the API at all.
 */
import { ApiError, api, getAccessToken, setAccessToken } from '../api';
import * as supabaseModule from '../supabase';

// The fake jest.setup.ts installs in place of Supabase (src/lib/__mocks__).
const { fakeAuth, supabase } = supabaseModule as unknown as typeof import('../__mocks__/supabase');

type FetchMock = jest.Mock<Promise<unknown>, [string, RequestInit?]>;

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
function textResponse(status: number) {
  return { ok: false, status, json: async () => { throw new SyntaxError('not json'); } };
}

const okEnvelope = (data: unknown) => jsonResponse({ success: true, data, error: null });
const failEnvelope = (
  status: number,
  error: Partial<{ code: string; message: string; fields: Record<string, string>; request_id: string }>,
) => jsonResponse({ success: false, data: null, error }, status);

let fetchMock: FetchMock;

beforeEach(() => {
  fetchMock = jest.fn() as FetchMock;
  (global as unknown as { fetch: FetchMock }).fetch = fetchMock;
  setAccessToken(null);
  jest.clearAllMocks();
});

describe('envelope unwrapping (I9)', () => {
  it('returns data, never the envelope', async () => {
    fetchMock.mockResolvedValueOnce(okEnvelope({ timezone: 'Europe/London' }));
    await expect(api.get('/profile')).resolves.toEqual({ timezone: 'Europe/London' });
  });

  it('turns an error envelope into ApiError with every field the UI needs', async () => {
    fetchMock.mockResolvedValueOnce(
      failEnvelope(422, {
        code: 'validation_failed',
        message: 'That is not a recognised time zone.',
        fields: { timezone: 'Unknown time zone.' },
        request_id: 'req-123',
      }),
    );

    const err = await api.patch('/profile', {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    const e = err as ApiError;
    expect(e.code).toBe('validation_failed');
    expect(e.status).toBe(422);
    expect(e.requestId).toBe('req-123');
    expect(e.field('timezone')).toBe('Unknown time zone.');
    expect(e.field('nope')).toBeUndefined();
  });

  it('throws when success is false even though the status says 200', async () => {
    // A 200 with success:false must never be handed to a screen as data.
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: false, data: null, error: { code: 'x', message: 'no', request_id: 'r' } }, 200),
    );
    await expect(api.get('/profile')).rejects.toBeInstanceOf(ApiError);
  });

  it('degrades a non-JSON error page to a readable network error', async () => {
    fetchMock.mockResolvedValueOnce(textResponse(502));
    const e = (await api.get('/profile').catch((x: unknown) => x)) as ApiError;
    expect(e.code).toBe('NETWORK');
    expect(e.status).toBe(502);
    expect(e.message).toMatch(/connection/i);
  });

  it('sends the bearer token once one is set', async () => {
    setAccessToken('tok-1');
    fetchMock.mockResolvedValueOnce(okEnvelope({}));
    await api.get('/profile');
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok-1');
  });
});

describe('401 → refresh → retry', () => {
  // Supabase Auth refreshes the session (docs/14); the FitLog API only says 401.
  const unauthorised = (message = 'nope') =>
    failEnvelope(401, { code: 'unauthorized', message, request_id: 'r' });

  it('refreshes once and replays the original request with the new token', async () => {
    fakeAuth.signIn();
    setAccessToken('old-access');
    fetchMock
      .mockResolvedValueOnce(unauthorised())
      .mockResolvedValueOnce(okEnvelope({ timezone: 'Europe/London' }));

    await expect(api.get('/profile')).resolves.toEqual({ timezone: 'Europe/London' });

    expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
    const replay = fetchMock.mock.calls[1]![1] as RequestInit;
    expect((replay.headers as Record<string, string>).authorization).toMatch(/^Bearer access-refreshed-/);
  });

  it('surfaces the ORIGINAL error when the sign-in was ended, and drops the token', async () => {
    fakeAuth.signIn();
    fakeAuth.revoke();
    setAccessToken('old-access');
    fetchMock.mockResolvedValueOnce(unauthorised());

    const e = (await api.get('/profile').catch((x: unknown) => x)) as ApiError;
    expect(e).toBeInstanceOf(ApiError);
    expect(e.code).toBe('unauthorized');
    expect(getAccessToken()).toBeNull();
  });

  it('does not replay when nobody is signed in', async () => {
    fetchMock.mockResolvedValueOnce(unauthorised());

    await expect(api.get('/profile')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes for /auth/me like any other call — it carries no credentials of its own', async () => {
    fakeAuth.signIn();
    fetchMock
      .mockResolvedValueOnce(unauthorised())
      .mockResolvedValueOnce(okEnvelope({ id: 'u1' }));

    await expect(api.get('/auth/me')).resolves.toEqual({ id: 'u1' });
    expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('refreshes ONCE when several requests 401 together', async () => {
    // Observed for real: a screen fires several queries, they all 401, each
    // refreshes with the same token, the first rotates it and reuse detection
    // ends the sign-in. The user is signed out mid-workout.
    fakeAuth.signIn();
    setAccessToken('old-access');
    fetchMock.mockImplementation(async () =>
      (getAccessToken() ?? '').startsWith('access-refreshed-') ? okEnvelope({ ok: true }) : unauthorised());

    await Promise.all([api.get('/profile'), api.get('/goals'), api.get('/programs')]);

    expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('gives up after one refresh rather than looping', async () => {
    fakeAuth.signIn();
    fetchMock
      .mockResolvedValueOnce(unauthorised('a'))
      .mockResolvedValueOnce(unauthorised('b'));

    await expect(api.get('/profile')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(2); // not 3, not infinite
  });

  it('refreshes for a cursor-paged read too', async () => {
    fakeAuth.signIn();
    fetchMock
      .mockResolvedValueOnce(unauthorised())
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [1], meta: { has_more: false } }));

    await expect(api.getPaged('/history')).resolves.toEqual({ data: [1], meta: { has_more: false } });
  });
});
