/**
 * The session provider — auth state for the whole app.
 *
 * It decides whether a cold start lands on the splash, the login screen or the
 * dashboard. Getting it wrong signs people out of a workout, which is exactly
 * what the G3 refresh stampede did from one layer down. Supabase Auth holds
 * the session now (docs/14); these drive it through the fake in
 * src/lib/__mocks__/supabase.ts.
 */
import React from 'react';
import { AppState } from 'react-native';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as authActions from '@/features/auth/supabaseAuth';
import { ApiError } from '../api';
import * as supabaseModule from '../supabase';
import { OFFLINE_START_MS, SessionProvider, useSession } from '../session';

const { fakeAuth, forgetStoredSession, readStoredSession, supabase } =
  supabaseModule as unknown as typeof import('../__mocks__/supabase');

let mockRevoked: (() => void) | null = null;
const mockAuth = { me: jest.fn() };
const mockProfileApi = { get: jest.fn() };
const mockSetAccessToken = jest.fn();

jest.mock('../api', () => ({
  ApiError: jest.requireActual('../api').ApiError,
  get auth() { return mockAuth; },
  get profileApi() { return mockProfileApi; },
  setAccessToken: (...a: unknown[]) => mockSetAccessToken(...a),
  onSessionRevoked: (fn: (() => void) | null) => { mockRevoked = fn; },
}));

const mockStored = { account: null as string | null };
jest.mock('../storage', () => ({
  getAccountId: jest.fn(async () => mockStored.account),
  setAccountId: jest.fn(async (id: string) => { mockStored.account = id; }),
  clearAccountId: jest.fn(async () => { mockStored.account = null; }),
}));

type Session = ReturnType<typeof useSession>;
let session: Session;
function Probe() {
  session = useSession();
  const { status, email, expired } = session;
  return <Text testID="state">{`${status}|${email ?? '-'}${expired ? '|expired' : ''}`}</Text>;
}

const mockIdentity = jest.fn();
const show = () => render(<SessionProvider onIdentityChange={mockIdentity}><Probe /></SessionProvider>);
const state = () => screen.getByTestId('state').props.children;
const signedInApp = async () => {
  fakeAuth.signIn({ email: 'a@b.com' });
  show();
  await waitFor(() => expect(state()).toBe('ready|a@b.com'));
};

/** `/auth/me` answers for whoever Supabase has signed in: one identity (docs/14 S1). */
const me = (over: Record<string, unknown> = {}) => async () => ({
  id: fakeAuth.session?.user.id, email: fakeAuth.session?.user.email,
  status: 'active', provider: 'email', ...over,
});
const ACCT_A = 'user-a@b.com';

beforeEach(() => {
  jest.clearAllMocks();
  mockStored.account = null;
  mockRevoked = null;
  mockProfileApi.get.mockResolvedValue({ onboarding_completed: true, timezone: 'UTC' });
  mockAuth.me.mockImplementation(me());
});
afterEach(() => jest.restoreAllMocks());

describe('cold start', () => {
  it('goes straight to signed-out with no stored sign-in', async () => {
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));
    expect(mockAuth.me).not.toHaveBeenCalled();
  });

  it('restores a stored sign-in, and hands its token to the API client', async () => {
    const stored = fakeAuth.signIn({ email: 'a@b.com' });
    show();
    await waitFor(() => expect(state()).toBe('ready|a@b.com'));
    expect(mockSetAccessToken).toHaveBeenCalledWith(stored.access_token);
  });

  it('routes to onboarding when the profile is incomplete', async () => {
    fakeAuth.signIn({ email: 'a@b.com' });
    mockProfileApi.get.mockResolvedValue({ onboarding_completed: false, timezone: 'UTC' });
    show();
    await waitFor(() => expect(state()).toBe('onboarding|a@b.com'));
  });

  it('stays signed in when an expired sign-in cannot be refreshed for want of signal (O10)', async () => {
    // Offline with a cache is full read access and full workout logging.
    // "Could not ask" is not "was told no": signing out here ejects someone
    // from a workout in progress for walking into a basement gym.
    fakeAuth.signIn({ email: 'a@b.com' });
    fakeAuth.offline = true;
    show();
    // Who it is comes from the stored sign-in, so signing back in (L-05) can work.
    await waitFor(() => expect(state()).toBe('ready|a@b.com'));
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('opens at once while Supabase is still retrying — not after ~25 s of splash', async () => {
    jest.useFakeTimers();
    try {
      fakeAuth.signIn({ email: 'a@b.com' });
      fakeAuth.stalled = true;
      show();
      expect(state()).toBe('loading|-');
      await act(async () => { jest.advanceTimersByTime(OFFLINE_START_MS); });
      await act(async () => {});
      expect(state()).toBe('ready|a@b.com');
      expect(mockIdentity).toHaveBeenLastCalledWith(ACCT_A);
    } finally {
      jest.useRealTimers();
    }
  });

  it('stays signed in when the FitLog API cannot be reached', async () => {
    fakeAuth.signIn({ email: 'a@b.com' });
    mockAuth.me.mockRejectedValue(new TypeError('Network request failed'));
    show();
    await waitFor(() => expect(state()).toBe('ready|a@b.com'));
  });

  it('loads the account once there is signal again, after an offline start', async () => {
    fakeAuth.signIn({ email: 'a@b.com' });
    mockAuth.me.mockRejectedValueOnce(new TypeError('Network request failed'));
    show();
    await waitFor(() => expect(state()).toBe('ready|a@b.com'));
    expect(session.profile).toBeNull();

    await act(async () => { await supabase.auth.refreshSession(); });

    await waitFor(() => expect(session.profile).not.toBeNull());
    expect(mockAuth.me).toHaveBeenCalledTimes(2);
  });

  it('stays signed in when the API is up but broken — a 500 says nothing about the sign-in', async () => {
    fakeAuth.signIn({ email: 'a@b.com' });
    mockProfileApi.get.mockRejectedValue(new ApiError('INTERNAL', 'x', 500));
    show();
    await waitFor(() => expect(state()).toMatch(/^ready\|/));
  });

  it('signs out, here and in Supabase, when the API refuses the sign-in', async () => {
    fakeAuth.signIn();
    mockAuth.me.mockRejectedValue(new ApiError('UNAUTHORIZED', 'x', 401));
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(fakeAuth.session).toBeNull();
  });
});

describe('signing in', () => {
  it('with a password: signed in to Supabase, then the account loaded', async () => {
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));

    await act(async () => { await session.signIn('a@b.com', 'pw-long-enough'); });

    expect(state()).toBe('ready|a@b.com');
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw-long-enough' });
    expect(mockSetAccessToken).toHaveBeenCalledWith(fakeAuth.session!.access_token);
  });

  it('a wrong password says so, and nothing changes', async () => {
    fakeAuth.accounts.set('a@b.com', 'right-password');
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));

    await act(async () => {
      await expect(session.signIn('a@b.com', 'wrong')).rejects.toMatchObject({ code: 'invalid_credentials' });
    });
    expect(state()).toBe('signed-out|-');
  });

  it('a new account waits for its email to be confirmed (S8)', async () => {
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));

    let result: { confirm: boolean } | undefined;
    await act(async () => { result = await session.signUp('new@b.com', 'pw-long-enough', 'Sam'); });

    expect(result).toEqual({ confirm: true });
    expect(state()).toBe('signed-out|-');
    expect(supabase.auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'new@b.com', options: expect.objectContaining({ data: { display_name: 'Sam' } }),
    }));
  });

  it('with Google: signed in when the sheet returns an account, nothing when it is closed', async () => {
    mockAuth.me.mockImplementation(me({ provider: 'google' }));
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));
    const google = jest.spyOn(authActions, 'signInWithGoogle');

    google.mockResolvedValueOnce(null);
    await act(async () => { await expect(session.signInWithGoogle()).resolves.toBe(false); });
    expect(state()).toBe('signed-out|-');

    google.mockResolvedValueOnce(fakeAuth.signIn({ email: 'a@b.com' }) as never);
    await act(async () => { await expect(session.signInWithGoogle()).resolves.toBe(true); });
    expect(state()).toBe('ready|a@b.com');
  });

  it('with Apple, the same', async () => {
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));
    jest.spyOn(authActions, 'signInWithApple').mockResolvedValueOnce(fakeAuth.signIn({ email: 'a@b.com' }) as never);
    await act(async () => { await expect(session.signInWithApple()).resolves.toBe(true); });
    expect(state()).toBe('ready|a@b.com');
  });

  it('adopts the session an email link produced', async () => {
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));
    await act(async () => { await session.adoptSession(fakeAuth.signIn({ email: 'a@b.com' }) as never); });
    expect(state()).toBe('ready|a@b.com');
    expect(session.recovering).toBe(false);
  });

  it('a reset link or code lets the new password be set, until it is', async () => {
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));
    await act(async () => {
      await session.adoptSession(fakeAuth.signIn({ email: 'a@b.com' }) as never, { recovery: true });
    });
    expect(session.recovering).toBe(true);
    act(() => { session.finishRecovery(); });
    expect(session.recovering).toBe(false);
  });

  it('a spent link with the API out of reach signs in offline, not "that link did not work"', async () => {
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));
    mockAuth.me.mockRejectedValueOnce(new TypeError('Network request failed'));
    await act(async () => { await session.adoptSession(fakeAuth.signIn({ email: 'a@b.com' }) as never); });
    expect(state()).toBe('ready|a@b.com');
  });
});

describe('the account behind the session (K-02)', () => {
  it('knows how they signed in, and an address change still waiting on its link', async () => {
    mockAuth.me.mockImplementation(me({ provider: 'google' }));
    await signedInApp();
    expect(session.provider).toBe('google');
    expect(session.pendingEmail).toBeNull();

    await supabase.auth.updateUser({ email: 'new@b.com' });
    await act(async () => { await session.refreshAccount(); });

    expect(session.pendingEmail).toBe('new@b.com');
  });
});

describe('signing out', () => {
  it('ends this device’s sign-in and forgets the account — and is not an "expired" sign-in', async () => {
    await signedInApp();

    await act(async () => { await session.signOut(); });

    expect(state()).toBe('signed-out|-');
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mockStored.account).toBeNull();
    expect(mockSetAccessToken).toHaveBeenLastCalledWith(null);
  });

  it('still signs out here when Supabase cannot be told', async () => {
    await signedInApp();
    supabase.auth.signOut.mockRejectedValueOnce(new Error('offline'));
    await act(async () => { await session.signOut(); });
    expect(state()).toBe('signed-out|-');
    expect(forgetStoredSession).toHaveBeenCalled();
  });

  it('offline, forgets the stored sign-in itself — the next launch must not sign back in', async () => {
    // Expired and no signal: supabase-js answers with an error and keeps the session.
    await signedInApp();
    fakeAuth.offline = true;
    await act(async () => { await session.signOut(); });

    expect(state()).toBe('signed-out|-');
    expect(forgetStoredSession).toHaveBeenCalled();
    expect(fakeAuth.session).toBeNull();
  });

  it('a refresh that lands after signing out does not bring the sign-in back', async () => {
    await signedInApp();
    await act(async () => { await session.signOut(); });
    mockSetAccessToken.mockClear();

    act(() => { fakeAuth.emit('TOKEN_REFRESHED', fakeAuth.signIn({ email: 'a@b.com' })); });

    await waitFor(() => expect(forgetStoredSession).toHaveBeenCalled());
    expect(mockSetAccessToken).not.toHaveBeenCalled();
    expect(state()).toBe('signed-out|-');
  });
});

describe('whose data this is (found on a phone in G10)', () => {
  /**
   * One account's unfinished workout and failing writes showed up inside
   * another, and cached screens were never cleared on an account switch
   * (docs/03 §6.2 — "a stale read across an account switch is a data-leak
   * bug"). The provider reports every identity change; the app shell scopes
   * the on-device store and clears the cache on it.
   */
  it('reports the account once a stored sign-in is restored', async () => {
    await signedInApp();
    expect(mockIdentity).toHaveBeenLastCalledWith(ACCT_A);
    expect(mockStored.account).toBe(ACCT_A);
  });

  it('offline, restores the account of the stored sign-in — logging must still work (I10)', async () => {
    fakeAuth.signIn({ email: 'a@b.com' });
    fakeAuth.offline = true;
    show();
    await waitFor(() => expect(state()).toBe('ready|a@b.com'));
    expect(mockIdentity).toHaveBeenLastCalledWith(ACCT_A);
  });

  it('offline, falls back to the account it remembered when the stored sign-in names none', async () => {
    const stored = fakeAuth.signIn({ email: 'a@b.com' });
    (readStoredSession as jest.Mock).mockResolvedValueOnce({ ...stored, user: undefined });
    fakeAuth.offline = true;
    mockStored.account = 'acct-remembered';
    show();
    await waitFor(() => expect(mockIdentity).toHaveBeenLastCalledWith('acct-remembered'));
  });

  it('reports nobody when there is no sign-in', async () => {
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));
    expect(mockIdentity).toHaveBeenLastCalledWith(null);
  });

  it('reports the new account on sign-in and nobody on sign-out', async () => {
    show();
    await waitFor(() => expect(mockIdentity).toHaveBeenCalledWith(null));

    await act(async () => { await session.signIn('b@c.com', 'pw-long-enough'); });
    expect(mockIdentity).toHaveBeenLastCalledWith('user-b@c.com');
    expect(mockStored.account).toBe('user-b@c.com');

    await act(async () => { await session.signOut(); });
    expect(mockIdentity).toHaveBeenLastCalledWith(null);
    expect(mockStored.account).toBeNull();
  });
});

describe('L-05 · a sign-in that ends while the app is open', () => {
  it('keeps the screen and asks to sign in again when the API client hears it', async () => {
    await signedInApp();
    act(() => { mockRevoked?.(); });
    // Still `ready`: the screen underneath — a workout, a half-typed meal — stays.
    expect(state()).toBe('ready|a@b.com|expired');
  });

  it('…and when Supabase itself signs this device out', async () => {
    await signedInApp();
    act(() => { fakeAuth.emit('SIGNED_OUT', null); });
    expect(state()).toBe('ready|a@b.com|expired');
  });

  it('is not news before anyone is signed in', async () => {
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));
    act(() => { mockRevoked?.(); fakeAuth.emit('SIGNED_OUT', null); });
    expect(state()).toBe('signed-out|-');
  });

  it('signing in again as the same person carries on where they were', async () => {
    await signedInApp();
    act(() => { mockRevoked?.(); });

    await act(async () => { await session.reauthenticate('pw-long-enough'); });

    expect(state()).toBe('ready|a@b.com');
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw-long-enough' });
  });

  it('asks an email account for its password', async () => {
    await signedInApp();
    await act(async () => {
      await expect(session.reauthenticate()).rejects.toMatchObject({ field: 'password' });
    });
  });

  it('a Google account signs in with Google again; closing the sheet leaves the dialog up', async () => {
    mockAuth.me.mockImplementation(me({ provider: 'google' }));
    await signedInApp();
    act(() => { mockRevoked?.(); });
    const google = jest.spyOn(authActions, 'signInWithGoogle').mockResolvedValueOnce(null);

    await act(async () => { await session.reauthenticate(); });
    expect(state()).toBe('ready|a@b.com|expired');

    google.mockResolvedValueOnce(fakeAuth.signIn({ email: 'a@b.com' }) as never);
    await act(async () => { await session.reauthenticate(); });
    expect(state()).toBe('ready|a@b.com');
  });

  it('an Apple account signs in with Apple again', async () => {
    mockAuth.me.mockImplementation(me({ provider: 'apple' }));
    await signedInApp();
    const apple = jest.spyOn(authActions, 'signInWithApple')
      .mockResolvedValueOnce(fakeAuth.signIn({ email: 'a@b.com' }) as never);
    await act(async () => { await session.reauthenticate(); });
    expect(apple).toHaveBeenCalled();
  });

  it('refuses a DIFFERENT Google account — it must not switch whose data this is', async () => {
    mockAuth.me.mockImplementation(me({ provider: 'google' }));
    await signedInApp();
    jest.spyOn(authActions, 'signInWithGoogle')
      .mockResolvedValueOnce(fakeAuth.signIn({ email: 'someone-else@b.com' }) as never);
    mockAuth.me.mockClear();

    await act(async () => {
      await expect(session.reauthenticate()).rejects.toMatchObject({
        message: expect.stringMatching(/different account.*a@b\.com/),
      });
    });

    expect(mockAuth.me).not.toHaveBeenCalled();
    expect(mockIdentity).not.toHaveBeenLastCalledWith('user-someone-else@b.com');
    expect(fakeAuth.session).toBeNull();
    expect(mockSetAccessToken).toHaveBeenLastCalledWith(null);
  });
});

describe('keeping the token fresh', () => {
  it('hands every refreshed token to the API client', async () => {
    await signedInApp();
    await act(async () => { await supabase.auth.refreshSession(); });
    expect(mockSetAccessToken).toHaveBeenLastCalledWith(fakeAuth.session!.access_token);
  });

  it('refreshes while the app is in front, and not behind', async () => {
    const listeners: ((s: string) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_e, fn) => {
      listeners.push(fn as (s: string) => void);
      return { remove: jest.fn() } as never;
    });
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));

    act(() => { listeners.forEach((l) => l('background')); });
    expect(supabase.auth.stopAutoRefresh).toHaveBeenCalled();
    act(() => { listeners.forEach((l) => l('active')); });
    expect(supabase.auth.startAutoRefresh).toHaveBeenCalled();
  });
});
