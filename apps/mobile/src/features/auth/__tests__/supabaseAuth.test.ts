/**
 * Every account action that is Supabase Auth's (docs/14), against the fake in
 * src/lib/__mocks__/supabase.ts.
 *
 * What matters here is what a person sees: every failure arrives as an
 * `AuthProblem` in FitLog's words, on the field it is about — never
 * Supabase's own wording, and never "wrong password" for no signal.
 */
import { Platform } from 'react-native';
import * as supabaseModule from '@/lib/supabase';
import {
  AuthProblem, appleAvailable, changeEmail, changePassword, completeLink, forgetProviderAccount,
  forgotPassword, googleConfigured, problemFrom, resendConfirmation, setNewPassword, signInWithApple,
  signInWithGoogle, signInWithPassword, signOutOtherDevices, signUp, verifyResetCode, wordsFor,
} from '../supabaseAuth';

const { fakeAuth, supabase } = supabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

const mockGoogle = {
  configure: jest.fn(),
  signOut: jest.fn(async () => null),
  hasPlayServices: jest.fn(async () => true),
  signIn: jest.fn(async (): Promise<unknown> => ({ type: 'success', data: { idToken: 'google-id-token' } })),
};
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: mockGoogle,
  isSuccessResponse: (r: { type: string }) => r.type === 'success',
  isErrorWithCode: (e: unknown) => typeof e === 'object' && e !== null && 'code' in e,
  statusCodes: { IN_PROGRESS: 'IN_PROGRESS', PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE' },
}));

const mockApple = {
  isAvailableAsync: jest.fn(async () => true),
  signInAsync: jest.fn(async (_o: unknown): Promise<unknown> => ({
    identityToken: 'apple-id-token', fullName: { givenName: 'Sam', familyName: 'Lee' },
  })),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
};
jest.mock('expo-apple-authentication', () => mockApple);
jest.mock('expo-crypto', () => ({
  randomUUID: () => 'raw-nonce',
  digestStringAsync: jest.fn(async () => 'hashed-nonce'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

const authError = (code: string) => Object.assign(new Error(code), { code, __isAuthError: true });
const offline = () => Object.assign(new Error('Failed to fetch'), { name: 'AuthRetryableFetchError' });
const refused = (code: string) => ({ data: { session: null, user: null }, error: authError(code) });
const setOS = (os: 'ios' | 'android') => Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });

beforeEach(() => {
  jest.clearAllMocks();
  setOS('android');
});

describe('problemFrom — Supabase in FitLog’s words', () => {
  it('names the field a known problem belongs to', () => {
    const p = problemFrom(authError('invalid_credentials'));
    expect(p).toBeInstanceOf(AuthProblem);
    expect(p).toMatchObject({ field: 'password', code: 'invalid_credentials' });
    expect(p.message).toBe('That email and password do not match.');
  });

  it('says "no signal" for a request that got no answer — not "wrong password"', () => {
    expect(problemFrom(offline())).toMatchObject({ code: 'network', message: expect.stringMatching(/Could not reach FitLog/) });
  });

  it('never shows Supabase’s wording for a code it does not know', () => {
    const p = problemFrom(authError('something_new'));
    expect(p.message).toBe('That did not work. Try again.');
    expect(p.code).toBe('something_new');
  });

  it('asks for the password length Supabase and the app agree on', () => {
    expect(wordsFor('weak_password')).toMatch(/at least 10 characters/);
    expect(wordsFor('nope')).toBeNull();
    expect(wordsFor(undefined)).toBeNull();
  });
});

describe('email and password', () => {
  it('signs in with the address trimmed', async () => {
    const session = await signInWithPassword(' a@b.com ', 'pw-long-enough');
    expect(session.access_token).toBeTruthy();
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw-long-enough' });
  });

  it('turns a refusal into a problem, and a missing session into one too', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce(refused('email_not_confirmed') as never);
    await expect(signInWithPassword('a@b.com', 'x')).rejects.toMatchObject({ code: 'email_not_confirmed', field: 'email' });

    supabase.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: null, user: null }, error: null } as never);
    await expect(signInWithPassword('a@b.com', 'x')).rejects.toBeInstanceOf(AuthProblem);
  });

  it('a new account waits for its confirmation email, with the name kept for its profile', async () => {
    await expect(signUp('new@b.com', 'pw-long-enough', 'Sam')).resolves.toEqual({ session: null, confirm: true });
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@b.com', password: 'pw-long-enough',
      options: { emailRedirectTo: 'fitlog://auth/callback', data: { display_name: 'Sam' } },
    });
  });

  it('says so when the address already has an account — Supabase answers with no identities', async () => {
    await signUp('taken@b.com', 'pw-long-enough');
    await expect(signUp('taken@b.com', 'pw-long-enough')).rejects.toMatchObject({
      code: 'user_already_exists', field: 'email',
    });
  });

  it('goes straight in when confirmation is off', async () => {
    const session = fakeAuth.signIn({ email: 'x@b.com' });
    supabase.auth.signUp.mockResolvedValueOnce({ data: { session, user: session.user }, error: null } as never);
    await expect(signUp('x@b.com', 'pw-long-enough')).resolves.toEqual({ session, confirm: false });
  });

  it('passes a sign-up refusal on', async () => {
    supabase.auth.signUp.mockResolvedValueOnce(refused('weak_password') as never);
    await expect(signUp('x@b.com', 'short')).rejects.toMatchObject({ field: 'password' });
  });

  it('sends the confirmation link again', async () => {
    await resendConfirmation(' a@b.com ');
    expect(supabase.auth.resend).toHaveBeenCalledWith({
      type: 'signup', email: 'a@b.com', options: { emailRedirectTo: 'fitlog://auth/callback' },
    });
    supabase.auth.resend.mockResolvedValueOnce(refused('over_email_send_rate_limit') as never);
    await expect(resendConfirmation('a@b.com')).rejects.toMatchObject({ message: expect.stringMatching(/a moment ago/) });
  });
});

describe('recovery (A-05)', () => {
  it('asks for a reset that returns to the new-password screen', async () => {
    await forgotPassword(' a@b.com ');
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.com', {
      redirectTo: 'fitlog://auth/callback',
    });
  });

  it('answers the same for an address with no account — no enumeration', async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: authError('user_not_found') } as never);
    await expect(forgotPassword('nobody@b.com')).resolves.toBeUndefined();
    supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: offline() } as never);
    await expect(forgotPassword('a@b.com')).rejects.toMatchObject({ code: 'network' });
  });

  it('signs in with the six-digit code, spaces and all', async () => {
    const session = await verifyResetCode(' a@b.com ', '123 456');
    expect(session.user.email).toBe('a@b.com');
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.com', token: '123456', type: 'recovery' });
  });

  it('refuses a code that is not six digits before asking, and a wrong one after', async () => {
    await expect(verifyResetCode('a@b.com', '12ab')).rejects.toMatchObject({ field: 'code' });
    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
    await expect(verifyResetCode('a@b.com', '999999')).rejects.toMatchObject({
      field: 'code', code: 'otp_expired', message: expect.stringMatching(/not right, or has expired/),
    });
  });

  it('a new password signs every other device out, and keeps this one', async () => {
    fakeAuth.signIn();
    await expect(setNewPassword('a-much-better-passphrase')).resolves.toBe(true);
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'a-much-better-passphrase' });
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'others' });
    expect(fakeAuth.session).not.toBeNull();
  });

  it('says so when the password changed but the other devices could not be signed out', async () => {
    fakeAuth.signIn();
    supabase.auth.signOut.mockResolvedValueOnce({ error: offline() } as never);
    await expect(setNewPassword('a-much-better-passphrase')).resolves.toBe(false);
  });

  it('a refused new password signs nobody out', async () => {
    supabase.auth.updateUser.mockResolvedValueOnce({ data: { user: null }, error: authError('same_password') } as never);
    await expect(setNewPassword('same')).rejects.toMatchObject({ code: 'same_password' });
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });
});

describe('K-02 — the password asked for again', () => {
  beforeEach(() => { fakeAuth.accounts.set('a@b.com', 'right-password'); fakeAuth.signIn({ email: 'a@b.com' }); });

  it('changes the password only after the current one checks out', async () => {
    await expect(changePassword('a@b.com', 'wrong', 'a-much-better-passphrase')).rejects.toMatchObject({
      field: 'password', message: 'Your current password is not right.',
    });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();

    await expect(changePassword('a@b.com', 'right-password', 'a-much-better-passphrase')).resolves.toBe(true);
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'a-much-better-passphrase' });
  });

  it('moves the address only after the password checks out, and only once the links are opened', async () => {
    await expect(changeEmail('a@b.com', 'wrong', 'new@b.com')).rejects.toMatchObject({ field: 'password' });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();

    await changeEmail('a@b.com', 'right-password', ' new@b.com ');
    expect(supabase.auth.updateUser).toHaveBeenCalledWith(
      { email: 'new@b.com' }, { emailRedirectTo: 'fitlog://auth/callback' },
    );
  });

  it('passes on a check that got no answer as "no signal"', async () => {
    fakeAuth.offline = true;
    await expect(changeEmail('a@b.com', 'right-password', 'new@b.com')).rejects.toMatchObject({ code: 'network' });
  });

  it('refuses an address already in use', async () => {
    supabase.auth.updateUser.mockResolvedValueOnce({ data: { user: null }, error: authError('email_exists') } as never);
    await expect(changeEmail('a@b.com', 'right-password', 'taken@b.com')).rejects.toMatchObject({ field: 'email' });
  });

  it('signs other devices out, or says why not', async () => {
    await signOutOtherDevices();
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'others' });
    supabase.auth.signOut.mockResolvedValueOnce({ error: offline() } as never);
    await expect(signOutOtherDevices()).rejects.toMatchObject({ code: 'network' });
  });
});

describe('links from email', () => {
  it('turns the code into a session, or a problem in words', async () => {
    await expect(completeLink('good')).resolves.toMatchObject({
      session: { access_token: expect.any(String) }, recovery: false,
    });
    await expect(completeLink('bad')).rejects.toMatchObject({
      message: 'Open the link on the phone you asked for it on.',
    });
  });
});

describe('links from email — which are resets', () => {
  it('knows a reset from what Supabase recorded on this phone, not from the link', async () => {
    await expect(completeLink('recovery')).resolves.toMatchObject({ recovery: true });
  });
});

describe('Google (S7)', () => {
  it('is not offered by a build without its client id', () => {
    // EXPO_PUBLIC_* is inlined when the bundle is built; this one never was.
    expect(googleConfigured()).toBe(false);
  });

  it('shows the chooser every time, then hands Google’s ID token to Supabase', async () => {
    const session = await signInWithGoogle();
    // Signed out of Google's SDK first, or it re-picks the last account unasked.
    expect(mockGoogle.signOut.mock.invocationCallOrder[0])
      .toBeLessThan(mockGoogle.signIn.mock.invocationCallOrder[0]!);
    expect(mockGoogle.hasPlayServices).toHaveBeenCalled();
    expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({ provider: 'google', token: 'google-id-token' });
    expect(session?.access_token).toBeTruthy();
  });

  it('is nothing when the chooser is closed or already open', async () => {
    mockGoogle.signIn.mockResolvedValueOnce({ type: 'cancelled' });
    await expect(signInWithGoogle()).resolves.toBeNull();
    mockGoogle.signIn.mockRejectedValueOnce({ code: 'IN_PROGRESS' });
    await expect(signInWithGoogle()).resolves.toBeNull();
    expect(supabase.auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('says what is missing when it cannot work on this phone', async () => {
    mockGoogle.hasPlayServices.mockRejectedValueOnce({ code: 'PLAY_SERVICES_NOT_AVAILABLE' });
    await expect(signInWithGoogle()).rejects.toMatchObject({ message: expect.stringMatching(/Google Play services/) });
    mockGoogle.signIn.mockResolvedValueOnce({ type: 'success', data: { idToken: null } });
    await expect(signInWithGoogle()).rejects.toMatchObject({ message: expect.stringMatching(/did not return/) });
    mockGoogle.signIn.mockRejectedValueOnce(offline());
    await expect(signInWithGoogle()).rejects.toMatchObject({ code: 'network' });
  });

  it('skips the Play services check on iOS', async () => {
    setOS('ios');
    await signInWithGoogle();
    expect(mockGoogle.hasPlayServices).not.toHaveBeenCalled();
  });
});

it('forgets nothing from Google in a build without Google', async () => {
  await forgetProviderAccount();
  expect(mockGoogle.signOut).not.toHaveBeenCalled();
});

describe('Apple (S7)', () => {
  it('exists on iOS only', async () => {
    await expect(appleAvailable()).resolves.toBe(false);
    setOS('ios');
    await expect(appleAvailable()).resolves.toBe(true);
    mockApple.isAvailableAsync.mockRejectedValueOnce(new Error('no module'));
    await expect(appleAvailable()).resolves.toBe(false);
  });

  it('signs the HASHED nonce into Apple’s token and hands Supabase the raw one', async () => {
    await signInWithApple();
    expect(mockApple.signInAsync).toHaveBeenCalledWith(expect.objectContaining({ nonce: 'hashed-nonce' }));
    expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'apple', token: 'apple-id-token', nonce: 'raw-nonce',
    });
  });

  it('keeps the name Apple gives only on the first sign-in — in the token the account is made from', async () => {
    const session = await signInWithApple();
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ data: { full_name: 'Sam Lee' } });
    expect(supabase.auth.refreshSession).toHaveBeenCalled();
    expect(session?.access_token).toMatch(/^access-refreshed-/);

    jest.clearAllMocks();
    mockApple.signInAsync.mockResolvedValueOnce({ identityToken: 'apple-id-token', fullName: null });
    await signInWithApple();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('is nothing when the sheet is closed, and a problem when it fails', async () => {
    mockApple.signInAsync.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'ERR_REQUEST_CANCELED' }));
    await expect(signInWithApple()).resolves.toBeNull();
    mockApple.signInAsync.mockRejectedValueOnce(new Error('boom'));
    await expect(signInWithApple()).rejects.toBeInstanceOf(AuthProblem);
    mockApple.signInAsync.mockResolvedValueOnce({ identityToken: null });
    await expect(signInWithApple()).rejects.toMatchObject({ message: expect.stringMatching(/did not return/) });
  });
});
