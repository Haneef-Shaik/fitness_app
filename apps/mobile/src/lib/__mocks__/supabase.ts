/**
 * Supabase Auth for the test suite (docs/14-SUPABASE.md): installed for every
 * test by jest.setup.ts, so nothing reaches a network.
 *
 * Behaves like supabase-js where the app depends on it — an in-memory session,
 * the auth events, `refreshSession` failing *retryably* when offline and for
 * good when the sign-in was ended — and a test steers it through `fakeAuth`:
 *
 *   fakeAuth.signIn({ email })   a stored sign-in, as after a cold start
 *   fakeAuth.offline = true      every call fails with AuthRetryableFetchError
 *   fakeAuth.stalled = true      getSession() never answers (still retrying offline)
 *   fakeAuth.revoke()            the refresh token no longer works
 *
 * jest.setup.ts resets it before every test. Reach it through the mocked
 * module — importing this file by its own path loads a second, disconnected copy:
 *
 *   import * as supabaseModule from '@/lib/supabase';
 *   const { fakeAuth } = supabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');
 *
 * Every method is a jest.fn, so a test can also `.mockResolvedValueOnce` it.
 */
type Listener = (event: string, session: FakeSession | null) => void;

export interface FakeSession {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string; new_email?: string; identities?: unknown[] };
}

/** Shaped like supabase-js's, so its `isAuthRetryableFetchError` recognises it. */
class AuthError extends Error {
  readonly __isAuthError = true;
  constructor(message: string, readonly code?: string, name = 'AuthApiError') {
    super(message);
    this.name = name;
  }
}

const listeners = new Set<Listener>();
let session: FakeSession | null = null;
let serial = 0;

function emit(event: string, s: FakeSession | null) {
  for (const l of [...listeners]) l(event, s);
}

function make(email: string, id = `user-${email}`): FakeSession {
  serial += 1;
  return {
    access_token: `access-${serial}`, refresh_token: `refresh-${serial}`,
    user: { id, email, identities: [{}] },
  };
}

const offlineError = () => new AuthError('Failed to fetch', undefined, 'AuthRetryableFetchError');

export const fakeAuth = {
  offline: false,
  /** getSession() never answers — an expired token still being retried offline. */
  stalled: false,
  revoked: false,
  /** Accounts that exist, with their passwords. */
  accounts: new Map<string, string>(),
  get session() { return session; },
  signIn({ email = 'sam@example.com' } = {}) {
    session = make(email);
    return session;
  },
  revoke() { this.revoked = true; },
  emit,
  reset() {
    session = null; serial = 0; listeners.clear();
    this.offline = false; this.stalled = false; this.revoked = false; this.accounts.clear();
  },
};

const ok = <T,>(data: T) => ({ data, error: null });
const fail = (error: AuthError, data: Record<string, unknown> = { session: null, user: null }) => ({ data, error });

export const supabase = {
  auth: {
    getSession: jest.fn(async () => {
      // supabase-js retries an expired token's refresh for ~25 s with no signal.
      if (fakeAuth.stalled && session) await new Promise(() => {});
      if (fakeAuth.offline && session) return fail(offlineError(), { session: null });
      return ok({ session });
    }),
    refreshSession: jest.fn(async () => {
      if (fakeAuth.offline) return fail(offlineError());
      if (!session) return fail(new AuthError('Auth session missing!', 'session_not_found', 'AuthSessionMissingError'));
      if (fakeAuth.revoked) {
        session = null;
        emit('SIGNED_OUT', null);
        return fail(new AuthError('Invalid Refresh Token', 'refresh_token_not_found'));
      }
      session = { ...session, access_token: `access-refreshed-${++serial}` };
      emit('TOKEN_REFRESHED', session);
      return ok({ session, user: session.user });
    }),
    signInWithPassword: jest.fn(async ({ email, password }: { email: string; password: string }) => {
      if (fakeAuth.offline) return fail(offlineError());
      const known = fakeAuth.accounts.get(email);
      if (known !== undefined && known !== password) {
        return fail(new AuthError('Invalid login credentials', 'invalid_credentials'));
      }
      session = make(email);
      emit('SIGNED_IN', session);
      return ok({ session, user: session.user });
    }),
    signUp: jest.fn(async ({ email, password }: { email: string; password: string }) => {
      if (fakeAuth.accounts.has(email)) {
        return ok({ session: null, user: { id: 'x', email, identities: [] } });
      }
      fakeAuth.accounts.set(email, password);
      // Email confirmation is on (S8): an account, no session yet.
      return ok({ session: null, user: { id: `user-${email}`, email, identities: [{}] } });
    }),
    signInWithIdToken: jest.fn(async ({ provider }: { provider: string }) => {
      session = make(`${provider}@example.com`);
      emit('SIGNED_IN', session);
      return ok({ session, user: session.user });
    }),
    /** `bad` is refused; `recovery` is a reset link's code. */
    exchangeCodeForSession: jest.fn(async (code: string) => {
      if (code === 'bad') return fail(new AuthError('invalid flow state', 'flow_state_not_found'));
      session = make('linked@example.com');
      const recovery = code === 'recovery';
      emit(recovery ? 'PASSWORD_RECOVERY' : 'SIGNED_IN', session);
      return ok({ session, user: session.user, redirectType: recovery ? 'recovery' : null });
    }),
    /** The code in a reset email: 123456 is right, anything else is not. */
    verifyOtp: jest.fn(async ({ email, token }: { email: string; token: string }) => {
      if (token !== '123456') return fail(new AuthError('Token has expired or is invalid', 'otp_expired'));
      session = make(email);
      emit('PASSWORD_RECOVERY', session);
      return ok({ session, user: session.user });
    }),
    signOut: jest.fn(async ({ scope }: { scope?: string } = {}) => {
      // Expired and no signal: supabase-js answers with an error and KEEPS the session.
      if (fakeAuth.offline) return { error: offlineError() };
      if (scope !== 'others') {
        session = null;
        emit('SIGNED_OUT', null);
      }
      return { error: null };
    }),
    resetPasswordForEmail: jest.fn(async () => ok({})),
    resend: jest.fn(async () => ok({})),
    updateUser: jest.fn(async (attrs: { email?: string }) => {
      if (session && attrs.email) session = { ...session, user: { ...session.user, new_email: attrs.email } };
      return ok({ user: session?.user ?? null });
    }),
    onAuthStateChange: jest.fn((listener: Listener) => {
      listeners.add(listener);
      return { data: { subscription: { unsubscribe: () => { listeners.delete(listener); } } } };
    }),
    startAutoRefresh: jest.fn(async () => {}),
    stopAutoRefresh: jest.fn(async () => {}),
  },
};

export const STORAGE_KEY = 'fitlog.supabase';
/** The stored sign-in, readable with or without signal. */
export const readStoredSession = jest.fn(async () => session);
export const forgetStoredSession = jest.fn(async () => { session = null; });

export const SUPABASE_URL = 'http://supabase.test';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
export const AUTH_CALLBACK = 'fitlog://auth/callback';
