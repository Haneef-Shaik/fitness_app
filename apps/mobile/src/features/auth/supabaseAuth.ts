/**
 * Every account action that is Supabase Auth's (docs/14-SUPABASE.md): signing
 * in by password, Google or Apple; the links in confirmation, reset and
 * change-of-address emails; changing a password or an address; signing other
 * devices out.
 *
 * Each throws `AuthProblem` — a sentence a person can act on, and the field it
 * belongs to — so a screen never shows Supabase's own wording or codes.
 */
import type { AuthError, Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { AUTH_CALLBACK, supabase } from '@/lib/supabase';
import { MIN_PASSWORD_LENGTH } from './password';

export class AuthProblem extends Error {
  constructor(message: string, readonly field?: 'email' | 'password' | 'code', readonly code?: string) {
    super(message);
  }
}

/** Supabase's error codes, in words (https://supabase.com/docs/guides/auth/debugging/error-codes). */
const WORDS: Record<string, [string, AuthProblem['field']?]> = {
  invalid_credentials: ['That email and password do not match.', 'password'],
  email_not_confirmed: ['Confirm your email first — the link is in your inbox.', 'email'],
  user_already_exists: ['An account already uses this email. Log in instead.', 'email'],
  email_exists: ['An account already uses this email.', 'email'],
  weak_password: [`Choose a stronger password: at least ${MIN_PASSWORD_LENGTH} characters, not a common one.`, 'password'],
  same_password: ['That is your current password. Choose a new one.', 'password'],
  over_email_send_rate_limit: ['We sent one a moment ago. Try again in a minute.'],
  over_request_rate_limit: ['Too many attempts. Try again shortly.'],
  otp_expired: ['That link has expired or was already used. Ask for a new one.'],
  flow_state_expired: ['That link has expired. Ask for a new one.'],
  flow_state_not_found: ['Open the link on the phone you asked for it on.'],
  bad_code_verifier: ['Open the link on the phone you asked for it on.'],
  email_address_invalid: ['Enter a real email address.', 'email'],
  signup_disabled: ['New accounts are paused right now.'],
  reauthentication_needed: ['Sign in again to change this.'],
};

/** FitLog's words for one of Supabase's error codes, when it has them. */
export function wordsFor(code: string | undefined): string | null {
  return code && WORDS[code] ? WORDS[code][0] : null;
}

export function problemFrom(error: AuthError | Error): AuthProblem {
  const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  if (code && WORDS[code]) return new AuthProblem(WORDS[code][0], WORDS[code][1], code);
  if (error.name === 'AuthRetryableFetchError') {
    return new AuthProblem('Could not reach FitLog. Check your connection and try again.', undefined, 'network');
  }
  return new AuthProblem('That did not work. Try again.', undefined, code);
}

function sessionOrThrow(result: { data: { session: Session | null }; error: AuthError | null }): Session {
  if (result.error) throw problemFrom(result.error);
  if (!result.data.session) throw new AuthProblem('That did not work. Try again.');
  return result.data.session;
}

/* ------------------------------------------------------------ signing in */

export async function signInWithPassword(email: string, password: string): Promise<Session> {
  return sessionOrThrow(await supabase.auth.signInWithPassword({ email: email.trim(), password }));
}

/** A new account. With email confirmation on (S8) there is no session yet —
 *  `confirm: true` means "check your inbox". */
export async function signUp(
  email: string, password: string, displayName?: string,
): Promise<{ session: Session | null; confirm: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(), password,
    options: { emailRedirectTo: AUTH_CALLBACK, data: displayName ? { display_name: displayName } : undefined },
  });
  if (error) throw problemFrom(error);
  // An already-registered address comes back as a user with no identities
  // (Supabase does not say so outright, to not reveal who has an account).
  if (!data.session && data.user && (data.user.identities?.length ?? 0) === 0) {
    throw new AuthProblem(WORDS.user_already_exists[0], 'email', 'user_already_exists');
  }
  return { session: data.session, confirm: !data.session };
}

export async function resendConfirmation(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: 'signup', email: email.trim(), options: { emailRedirectTo: AUTH_CALLBACK },
  });
  if (error) throw problemFrom(error);
}

/* ---------------------------------------------------- Google and Apple (S7) */

/** Shown only when the build was given Google's client ids. */
export const googleConfigured = () => Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);

export async function signInWithGoogle(): Promise<Session | null> {
  // Required lazily: the native module is absent in Expo Go and under Jest.
  const g = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
  g.GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  try {
    if (Platform.OS === 'android') await g.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Google's SDK otherwise re-picks the last account without asking: always
    // show the chooser, so an account is chosen, not assumed.
    await g.GoogleSignin.signOut().catch(() => null);
    const response = await g.GoogleSignin.signIn();
    if (!g.isSuccessResponse(response)) return null; // the person closed the chooser
    const token = response.data.idToken;
    if (!token) throw new AuthProblem('Google did not return a sign-in. Try again.');
    return sessionOrThrow(await supabase.auth.signInWithIdToken({ provider: 'google', token }));
  } catch (e) {
    if (e instanceof AuthProblem) throw e;
    if (g.isErrorWithCode(e) && e.code === g.statusCodes.IN_PROGRESS) return null;
    if (g.isErrorWithCode(e) && e.code === g.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new AuthProblem('Google Play services are needed for Google sign-in on this phone.');
    }
    throw problemFrom(e as Error);
  }
}

/** Sign in with Apple exists on iOS only (App Store 4.8 once Google is offered). */
export async function appleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const apple = require('expo-apple-authentication') as typeof import('expo-apple-authentication');
    return await apple.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signInWithApple(): Promise<Session | null> {
  const apple = require('expo-apple-authentication') as typeof import('expo-apple-authentication');
  const crypto = require('expo-crypto') as typeof import('expo-crypto');
  // Apple signs the HASH of the nonce into its token; Supabase checks it
  // against the raw one — so a token lifted from elsewhere cannot be replayed.
  const raw = crypto.randomUUID();
  const hashed = await crypto.digestStringAsync(crypto.CryptoDigestAlgorithm.SHA256, raw);
  let credential;
  try {
    credential = await apple.signInAsync({
      requestedScopes: [apple.AppleAuthenticationScope.FULL_NAME, apple.AppleAuthenticationScope.EMAIL],
      nonce: hashed,
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw problemFrom(e as Error);
  }
  if (!credential.identityToken) throw new AuthProblem('Apple did not return a sign-in. Try again.');
  const session = sessionOrThrow(await supabase.auth.signInWithIdToken({
    provider: 'apple', token: credential.identityToken, nonce: raw,
  }));
  // Apple gives the name once, on the first sign-in, and never again. The
  // FitLog account takes its name from the token (docs/14 S1), so it needs a
  // token issued after the name was saved.
  const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
  if (!name) return session;
  const saved = await supabase.auth.updateUser({ data: { full_name: name } });
  if (saved.error) return session;
  const refreshed = await supabase.auth.refreshSession();
  return refreshed.data.session ?? session;
}

/** On signing out: Google's SDK forgets its account too, so the next person's
 *  "Continue with Google" on this phone is not handed the last one's. */
export async function forgetProviderAccount(): Promise<void> {
  if (!googleConfigured()) return;
  try {
    const g = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
    await g.GoogleSignin.signOut();
  } catch { /* nothing signed in with Google here */ }
}

/* ----------------------------------------------------- recovery (A-05, K-02) */

/** Resolves the same whether or not the address has an account. */
export async function forgotPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: AUTH_CALLBACK });
  if (error && error.code !== 'user_not_found') throw problemFrom(error);
}

/** A-05 without the link — the email was opened on another device, where
 *  the link cannot work (PKCE). The same email carries a six-digit code;
 *  typed here, it signs this phone in to choose the new password. */
export async function verifyResetCode(email: string, code: string): Promise<Session> {
  const token = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(token)) throw new AuthProblem('Enter the 6-digit code from the email.', 'code');
  const result = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'recovery' });
  if (result.error?.code === 'otp_expired') {
    throw new AuthProblem('That code is not right, or has expired. Use the newest email, or ask for another.', 'code', 'otp_expired');
  }
  return sessionOrThrow(result);
}

/** The new password, then every other device signed out (whoever had the old
 *  password is out). Resolves false when the password changed but the other
 *  devices could not be signed out — the screen must not claim they were. */
export async function setNewPassword(password: string): Promise<boolean> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw problemFrom(error);
  const others = await supabase.auth.signOut({ scope: 'others' });
  return !others.error;
}

/** The password of the account signed in here, asked for again (K-02). */
async function checkPassword(email: string, password: string): Promise<void> {
  const check = await supabase.auth.signInWithPassword({ email, password });
  if (!check.error) return;
  const problem = problemFrom(check.error);
  throw problem.code === 'invalid_credentials'
    ? new AuthProblem('Your current password is not right.', 'password', problem.code) : problem;
}

/** K-02. The current password is checked first — a stolen, unlocked phone must
 *  not be enough to lock the owner out — then every other device is signed out. */
export async function changePassword(email: string, current: string, next: string): Promise<boolean> {
  await checkPassword(email, current);
  return setNewPassword(next);
}

/** K-02. The password first — a stolen, unlocked phone must not be enough to
 *  move the account, and every future reset link, to another inbox. Nothing
 *  changes until the links Supabase sends are opened. */
export async function changeEmail(email: string, password: string, newEmail: string): Promise<void> {
  await checkPassword(email, password);
  const { error } = await supabase.auth.updateUser(
    { email: newEmail.trim() }, { emailRedirectTo: AUTH_CALLBACK },
  );
  if (error) throw problemFrom(error);
}

export async function signOutOtherDevices(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) throw problemFrom(error);
}

/** A link from an email, back in the app: the PKCE code for a session.
 *  `recovery` only for a password-reset link — as Supabase recorded it when
 *  the reset was asked for on this phone, not as the link says. */
export async function completeLink(code: string): Promise<{ session: Session; recovery: boolean }> {
  const result = await supabase.auth.exchangeCodeForSession(code);
  // supabase-js returns `redirectType` without declaring it on the public type.
  const redirectType = (result.data as { redirectType?: string | null }).redirectType;
  return { session: sessionOrThrow(result), recovery: redirectType === 'recovery' };
}
