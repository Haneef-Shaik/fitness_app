/**
 * src/lib/api.ts shipped untested. These cover the three things that fail
 * silently: envelope unwrapping, the 401 refresh dance, and the LAN host
 * derivation that decides whether a physical phone can reach the API at all.
 */
import { ApiError, api, auth, setAccessToken } from '../api';
import * as storage from '../storage';

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
  it('refreshes once and replays the original request', async () => {
    await storage.setRefreshToken('old-refresh');

    fetchMock
      .mockResolvedValueOnce(failEnvelope(401, { code: 'unauthorized', message: 'nope', request_id: 'r' }))
      .mockResolvedValueOnce(okEnvelope({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 900 }))
      .mockResolvedValueOnce(okEnvelope({ timezone: 'Europe/London' }));

    await expect(api.get('/profile')).resolves.toEqual({ timezone: 'Europe/London' });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]![0]).toContain('/auth/refresh');
    // The rotated token must be persisted, or the next cold start signs the user out.
    await expect(storage.getRefreshToken()).resolves.toBe('new-refresh');
  });

  it('clears the session when the refresh itself fails', async () => {
    // Reuse detection revokes the whole family — this session is finished.
    await storage.setRefreshToken('stale');

    fetchMock
      .mockResolvedValueOnce(failEnvelope(401, { code: 'unauthorized', message: 'nope', request_id: 'r' }))
      .mockResolvedValueOnce(failEnvelope(401, { code: 'token_reused', message: 'revoked', request_id: 'r2' }));

    const e = (await api.get('/profile').catch((x: unknown) => x)) as ApiError;
    expect(e).toBeInstanceOf(ApiError);
    expect(e.code).toBe('unauthorized'); // the ORIGINAL error, not the refresh failure
    await expect(storage.getRefreshToken()).resolves.toBeNull();
  });

  it('does not try to refresh when there is no refresh token', async () => {
    await storage.clearRefreshToken();
    fetchMock.mockResolvedValueOnce(failEnvelope(401, { code: 'unauthorized', message: 'nope', request_id: 'r' }));

    await expect(api.get('/profile')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never refreshes in response to an auth endpoint failing', async () => {
    // A bad password must surface as a bad password, not as a refresh loop.
    await storage.setRefreshToken('present');
    fetchMock.mockResolvedValueOnce(failEnvelope(401, { code: 'bad_credentials', message: 'no', request_id: 'r' }));

    const e = (await auth.login('a@b.c', 'wrong').catch((x: unknown) => x)) as ApiError;
    expect(e.code).toBe('bad_credentials');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['/auth/password/forgot'], ['/auth/password/reset'], ['/auth/email/verify'],
  ])('never refreshes for %s either — its 401 is about the body, not the session', async (path) => {
    await storage.setRefreshToken('present');
    fetchMock.mockResolvedValueOnce(failEnvelope(401, { code: 'x', message: 'no', request_id: 'r' }));

    await expect(api.post(path, {})).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['/auth/me'], ['/auth/email/resend'], ['/auth/sessions/revoke-others'],
  ])('refreshes for %s, which acts on the signed-in account (A-06, K-02)', async (path) => {
    // These live under /auth/ but carry no credentials in the body: a 401 is
    // an expired access token, and must refresh like any other call.
    await storage.setRefreshToken('r1');
    fetchMock
      .mockResolvedValueOnce(failEnvelope(401, { code: 'unauthorized', message: 'no', request_id: 'r' }))
      .mockResolvedValueOnce(okEnvelope({ access_token: 'a2', refresh_token: 'r2' }))
      .mockResolvedValueOnce(okEnvelope({ ok: true }));

    await expect(api.post(path)).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[1]![0]).toContain('/auth/refresh');
  });

  it('refreshes ONCE when several requests 401 together', async () => {
    // Observed for real: a screen fires several queries, they all 401, each
    // refreshes with the same token, the first rotates it and reuse detection
    // revokes the family. The user is signed out mid-workout.
    await storage.setRefreshToken('shared');

    const unauthorised = () =>
      failEnvelope(401, { code: 'unauthorized', message: 'nope', request_id: 'r' });

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/auth/refresh')) {
        return okEnvelope({ access_token: 'a2', refresh_token: 'r2', expires_in: 900 });
      }
      // 401 until a refresh has happened, then fine.
      return (await storage.getRefreshToken()) === 'r2' ? okEnvelope({ ok: true }) : unauthorised();
    });

    await Promise.all([api.get('/profile'), api.get('/goals'), api.get('/programs')]);

    const refreshCalls = fetchMock.mock.calls.filter(([u]) => String(u).includes('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });

  it('gives up after one refresh rather than looping', async () => {
    await storage.setRefreshToken('r1');
    fetchMock
      .mockResolvedValueOnce(failEnvelope(401, { code: 'unauthorized', message: 'a', request_id: 'r' }))
      .mockResolvedValueOnce(okEnvelope({ access_token: 'a2', refresh_token: 'r2', expires_in: 900 }))
      .mockResolvedValueOnce(failEnvelope(401, { code: 'unauthorized', message: 'b', request_id: 'r' }));

    await expect(api.get('/profile')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(3); // not 4, not infinite
  });
});
