import { createAuthCallbackHandler } from '../auth-callback';

// Regression suite for QA-1 F-1: a deep link must never hand the app a session it did not start.
type SessionResult = { data: { session: { user: { id: string } } | null }; error: Error | null };
type ExchangeResult = { data: unknown; error: Error | null };

const code = '6f1c2b8e-3d4a-4e5f-9a0b-1c2d3e4f5a6b';
const native = 'fitlog:///auth/callback';
const nativeAuthority = 'fitlog://auth/callback';
const expoGo = 'exp://127.0.0.1:8081/--/auth/callback';
const web = 'http://localhost:8081/auth/callback';
const signedOut: SessionResult = { data: { session: null }, error: null };

function fixture(session: SessionResult = signedOut) {
  return {
    getSession: jest.fn(async (): Promise<SessionResult> => session),
    exchangeCodeForSession: jest.fn(async (_code: string): Promise<ExchangeResult> => ({ data: { session: { user: { id: 'member' } } }, error: null })),
    setSession: jest.fn(),
  };
}

async function expectRejected(expected: string, url: string | null, auth = fixture()) {
  await expect(createAuthCallbackHandler(auth, expected)(url)).resolves.toBe(false);
  expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  expect(auth.setSession).not.toHaveBeenCalled();
}

describe.each([['native', native], ['native with authority', nativeAuthority], ['Expo Go', expoGo], ['web', web]])('%s callback %s', (_label, expected) => {
  it('exchanges a PKCE code delivered to the exact callback URL', async () => {
    const auth = fixture();
    await expect(createAuthCallbackHandler(auth, expected)(`${expected}?code=${code}`)).resolves.toBe(true);
    expect(auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith(code);
    expect(auth.setSession).not.toHaveBeenCalled();
  });

  it.each([
    '#access_token=A&refresh_token=R',
    '#access_token=A',
    '#refresh_token=R',
    `?code=${code}#access_token=A&refresh_token=R`,
    `?code=${code}#refresh_token=R`,
    '?access_token=A&refresh_token=R',
    `?code=${code}&access_token=A&refresh_token=R`,
  ])('rejects implicit-flow tokens: %s', (suffix) => expectRejected(expected, `${expected}${suffix}`));

  it.each([
    '',
    '?code=',
    '?code',
    `?code=${code}&code=${code}`,
    `?code=${code}&code=other`,
    `?code=&code=${code}`,
  ])('rejects a missing, empty or duplicated code: "%s"', (suffix) => expectRejected(expected, `${expected}${suffix}`));
});

describe('callback URL must match exactly', () => {
  it.each([
    'fitlog://x#access_token=A&refresh_token=R',
    `fitlog://x?code=${code}`,
    `fitlog:///?code=${code}`,
    `fitlog:///auth/other?code=${code}`,
    `fitlog:///auth/callback/?code=${code}`,
    `fitlog:///auth/callback/extra?code=${code}`,
    `fitlog:///auth/callbackevil?code=${code}`,
    `fitlog://auth/callback?code=${code}`,
    `fitlog://evil.example/auth/callback?code=${code}`,
    `otherapp:///auth/callback?code=${code}`,
    `${expoGo}?code=${code}`,
    `https://evil.example/auth/callback?code=${code}`,
  ])('native fitlog:///auth/callback rejects %s', (url) => expectRejected(native, url));

  it.each([
    `fitlog:///auth/callback?code=${code}`,
    `fitlog://auth:8081/callback?code=${code}`,
    `fitlog://evil/callback?code=${code}`,
    `fitlog://auth/other?code=${code}`,
  ])('alternate fitlog://auth/callback rejects %s', (url) => expectRejected(nativeAuthority, url));

  it.each([
    `exp://127.0.0.1:19000/--/auth/callback?code=${code}`,
    `exp://192.168.1.20:8081/--/auth/callback?code=${code}`,
    `exp://127.0.0.1:8081/auth/callback?code=${code}`,
    `exp://127.0.0.1:8081/--/auth/other?code=${code}`,
    `exps://127.0.0.1:8081/--/auth/callback?code=${code}`,
    `${native}?code=${code}`,
  ])('Expo Go callback rejects %s', (url) => expectRejected(expoGo, url));

  it.each([
    `https://localhost:8081/auth/callback?code=${code}`,
    `http://localhost:8082/auth/callback?code=${code}`,
    `http://localhost/auth/callback?code=${code}`,
    `http://127.0.0.1:8081/auth/callback?code=${code}`,
    `http://localhost:8081@evil.example/auth/callback?code=${code}`,
    `http://evil.example/auth/callback?next=${encodeURIComponent(web)}&code=${code}`,
    `http://localhost:8081/auth/callbackevil?code=${code}`,
    `http://localhost:8081/?code=${code}`,
  ])('web callback rejects %s', (url) => expectRejected(web, url));
});

describe('malformed input', () => {
  it.each([
    null,
    '',
    'not a url',
    `auth/callback?code=${code}`,
    `/auth/callback?code=${code}`,
    `://auth/callback?code=${code}`,
    `http://[::1/auth/callback?code=${code}`,
    `http://localhost:99999/auth/callback?code=${code}`,
  ])('resolves false without throwing for %p', (url) => expectRejected(native, url));
});

describe('session state', () => {
  it('refuses to replace a signed-in session', async () => {
    const auth = fixture({ data: { session: { user: { id: 'current-member' } } }, error: null });
    await expectRejected(native, `${native}?code=${code}`, auth);
  });

  it('refuses when the current session cannot be read', async () => {
    const auth = fixture({ data: { session: null }, error: new Error('Storage unavailable') });
    await expectRejected(native, `${native}?code=${code}`, auth);
  });

  it('refuses when reading the current session throws', async () => {
    const auth = fixture();
    auth.getSession.mockRejectedValueOnce(new Error('Storage unavailable'));
    await expectRejected(native, `${native}?code=${code}`, auth);
  });
});

describe('exchange outcome', () => {
  it('returns false when the code exchange reports an error', async () => {
    const auth = fixture();
    auth.exchangeCodeForSession.mockResolvedValueOnce({ data: null, error: new Error('invalid flow state, no valid flow state found') });
    await expect(createAuthCallbackHandler(auth, native)(`${native}?code=${code}`)).resolves.toBe(false);
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith(code);
    expect(auth.setSession).not.toHaveBeenCalled();
  });

  it('returns false when the code exchange throws', async () => {
    const auth = fixture();
    auth.exchangeCodeForSession.mockRejectedValueOnce(new Error('Network request failed'));
    await expect(createAuthCallbackHandler(auth, native)(`${native}?code=${code}`)).resolves.toBe(false);
    expect(auth.setSession).not.toHaveBeenCalled();
  });
});
