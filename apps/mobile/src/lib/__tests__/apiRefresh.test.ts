/**
 * Losing the network must not lose the account.
 *
 * `performRefresh` caught everything and cleared the refresh token, on the
 * reasoning that reuse detection may have revoked the family. That is true of a
 * 401. It is not true of a phone with no signal — and `fetch` rejects with a
 * plain TypeError there, which landed in the same catch.
 *
 * So opening the app in a basement gym deleted the stored token, signed the user
 * out of a workout in progress, and left them unable to log back in until they
 * had reception. Found while trying to prove the offline flow on a device: the
 * app could not be relaunched with the server unreachable without being ejected
 * to the login screen.
 */
import { api } from '../api';

const mockTokens = { value: null as string | null };
jest.mock('../storage', () => ({
  getRefreshToken: jest.fn(async () => mockTokens.value),
  setRefreshToken: jest.fn(async (t: string) => { mockTokens.value = t; }),
  clearRefreshToken: jest.fn(async () => { mockTokens.value = null; }),
}));

const asResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

beforeEach(() => { mockTokens.value = 'stored-refresh-token'; });

describe('a refresh that fails because the server cannot be reached', () => {
  it('keeps the token, so the session survives being offline', async () => {
    // This is how fetch fails with no network: it rejects, it does not respond.
    global.fetch = jest.fn(async () => { throw new TypeError('Network request failed'); }) as never;

    await expect(api.tryRefresh()).resolves.toBe(false);

    expect(mockTokens.value).toBe('stored-refresh-token');
  });

  it('keeps the token when the server is up but broken', async () => {
    // A 500 says nothing about whether this session is still valid.
    global.fetch = jest.fn(async () => asResponse(500, { success: false, error: {} })) as never;

    await expect(api.tryRefresh()).resolves.toBe(false);

    expect(mockTokens.value).toBe('stored-refresh-token');
  });
});

describe('a refresh the server actively rejects', () => {
  it('clears the token — reuse detection has revoked the family', async () => {
    global.fetch = jest.fn(async () =>
      asResponse(401, { success: false, error: { code: 'INVALID_TOKEN' } })) as never;

    await expect(api.tryRefresh()).resolves.toBe(false);

    expect(mockTokens.value).toBeNull();
  });

  it('clears the token on a 403 too', async () => {
    global.fetch = jest.fn(async () =>
      asResponse(403, { success: false, error: { code: 'FORBIDDEN' } })) as never;

    await api.tryRefresh();

    expect(mockTokens.value).toBeNull();
  });
});

describe('a refresh that works', () => {
  it('stores the rotated token', async () => {
    global.fetch = jest.fn(async () => asResponse(200, {
      success: true, data: { access_token: 'new-access', refresh_token: 'rotated' },
    })) as never;

    await expect(api.tryRefresh()).resolves.toBe(true);

    expect(mockTokens.value).toBe('rotated');
  });
});
