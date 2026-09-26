/**
 * Who is signed in, and what the app may show them.
 *
 * Signing in is Supabase Auth's (lib/supabase.ts, docs/14-SUPABASE.md): it
 * holds the session in the keychain and refreshes it. This provider turns that
 * into the app's four states, and keeps the rules the old token code earned:
 *
 * - **Offline is not signed out (O10).** A stored sign-in that cannot be
 *   refreshed for want of signal still opens the app — at once, not after
 *   supabase-js's ~25 s of retries — with the last account's workouts and
 *   queue: logging must work in a gym basement. The account and profile are
 *   filled in once there is signal again.
 * - **An ended sign-in is said over the screen that is open (L-05)**, not by
 *   dropping someone at the login screen mid-meal or mid-workout.
 * - **Whose data is on screen changes only with the account** (G10):
 *   `onIdentityChange` scopes the device store and clears cached reads.
 * - **Signing out is final on this phone**, signal or not.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';
import * as authActions from '@/features/auth/supabaseAuth';
import { ApiError, auth, onSessionRevoked, profileApi, setAccessToken, type Me, type Profile } from './api';
import { clearAccountId, getAccountId, setAccountId } from './storage';
import { forgetStoredSession, readStoredSession, supabase } from './supabase';

type Status = 'loading' | 'signed-out' | 'onboarding' | 'ready';

interface SessionValue {
  status: Status;
  email: string | null;
  /** "email", "google" or "apple": which account screens apply (no password
   *  to change for a Google or Apple sign-in). */
  provider: string | null;
  /** K-02. The address a change is waiting on, until its link is opened. */
  pendingEmail: string | null;
  profile: Profile | null;
  /** A-05. Signed in by a reset link or code, so a new password may be set
   *  without the old one — and only then. */
  recovering: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** `confirm: true` — the account exists and its confirmation email is out (S8). */
  signUp: (email: string, password: string, displayName?: string) => Promise<{ confirm: boolean }>;
  /** False when the person closed the provider's sheet. */
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  /** A session a link or code from an email produced (app/auth/callback.tsx,
   *  app/reset-password.tsx). The link is spent by now: with the API out of
   *  reach, this signs in offline rather than failing. */
  adoptSession: (session: Session, options?: { recovery?: boolean }) => Promise<void>;
  /** A-05 is over: the new password is set. */
  finishRecovery: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Re-reads the account after a change of address or password. */
  refreshAccount: () => Promise<void>;
  /** L-05 — the sign-in ended while a screen was open. */
  expired: boolean;
  /** Signs the same account back in, leaving whatever screen is open in place.
   *  A password for an email account; the provider's sheet otherwise. */
  reauthenticate: (password?: string) => Promise<void>;
}

const Ctx = createContext<SessionValue>(null as never);

/** An API failure that says "no answer", not "no". */
const unreachable = (e: unknown) =>
  !(e instanceof ApiError) || e.code === 'NETWORK' || e.status >= 500 || e.status === 0;

/** How long a cold start waits for Supabase before opening on the stored sign-in. */
export const OFFLINE_START_MS = 3000;

const providerOf = (session: Session) =>
  (session.user?.app_metadata?.provider as string | undefined) ?? null;

export function SessionProvider({ children, onIdentityChange }: {
  children: React.ReactNode;
  onIdentityChange?: (accountId: string | null) => void;
}) {
  const [status, setStatus] = useState<Status>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expired, setExpired] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const identity = useRef(onIdentityChange);
  identity.current = onIdentityChange;
  const announce = useCallback((id: string | null) => { identity.current?.(id); }, []);
  /** Whose sign-in this is — a re-authentication must be the same person. */
  const userId = useRef<string | null>(null);
  /** Opened on the stored sign-in without the API: load the account when possible. */
  const offlineStart = useRef(false);
  /** Signed out here; a refresh still in flight must not bring the sign-in back. */
  const forgotten = useRef(false);

  const showAccount = useCallback((me: Me, session?: Session | null) => {
    setEmail(me.email);
    setProvider(me.provider ?? null);
    setPendingEmail(session?.user?.new_email ?? null);
  }, []);

  const clear = useCallback(() => {
    setAccessToken(null);
    announce(null);
    userId.current = null;
    offlineStart.current = false;
    setExpired(false);
    setRecovering(false);
    setProfile(null); setEmail(null); setProvider(null); setPendingEmail(null);
    setStatus('signed-out');
  }, [announce]);

  /** The FitLog side of a sign-in: `/auth/me` creates the account the first
   *  time (docs/14 S1), then the profile decides onboarding or the app. */
  const load = useCallback(async (session: Session) => {
    forgotten.current = false;
    setAccessToken(session.access_token);
    const me = await auth.me();
    await setAccountId(me.id);
    userId.current = me.id;
    announce(me.id);
    showAccount(me, session);
    const p = await profileApi.get();
    setProfile(p);
    offlineStart.current = false;
    setStatus(p.onboarding_completed ? 'ready' : 'onboarding');
  }, [announce, showAccount]);

  /** The app, on a sign-in the API could not be asked about (O10). What the
   *  session itself knows — who, and how they signed in — is shown now. */
  const openOffline = useCallback(async (session: Session) => {
    offlineStart.current = true;
    forgotten.current = false;
    if (session.access_token) setAccessToken(session.access_token);
    userId.current = session.user?.id ?? (await getAccountId());
    announce(userId.current);
    setEmail(session.user?.email ?? null);
    setProvider(providerOf(session));
    setStatus('ready');
  }, [announce]);

  /** A-01 Splash: restore the sign-in before showing anything. */
  useEffect(() => {
    (async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const answer = await Promise.race([
        supabase.auth.getSession(),
        new Promise<'slow'>((resolve) => { timer = setTimeout(() => resolve('slow'), OFFLINE_START_MS); }),
      ]);
      clearTimeout(timer);
      const noSignal = answer === 'slow'
        || (!answer.data.session && answer.error && isAuthRetryableFetchError(answer.error));
      if (noSignal) {
        // Stored, expired, and no signal to refresh it: offline is full
        // logging, not a login screen. supabase-js keeps the session and
        // refreshes it once there is a connection.
        const stored = await readStoredSession();
        if (stored) await openOffline(stored); else clear();
        return;
      }
      const session = answer.data.session;
      if (!session) { clear(); return; }
      try {
        await load(session);
      } catch (e) {
        if (unreachable(e)) { await openOffline(session); return; }
        // The API said no to this sign-in: forget it here too, or every
        // launch would try it again.
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        clear();
      }
    })();
  }, [load, openOffline, clear]);

  /** After an offline start: the account and profile, once they can be had. */
  const resuming = useRef(false);
  const resume = useCallback(async (session?: Session | null) => {
    if (!offlineStart.current || resuming.current) return;
    resuming.current = true;
    try {
      const s = session ?? (await supabase.auth.getSession()).data.session;
      if (s) await load(s);
    } catch { /* still out of reach: the next refresh or return to the app tries again */ }
    finally { resuming.current = false; }
  }, [load]);
  const resumeRef = useRef(resume);
  resumeRef.current = resume;

  // Refreshed while the app is in front, and not while it is not — Supabase's
  // React Native guide, which otherwise refreshes on a timer in the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void supabase.auth.startAutoRefresh();
        void resumeRef.current();
      } else {
        void supabase.auth.stopAutoRefresh();
      }
    });
    return () => sub.remove();
  }, []);

  // L-05. Only a sign-in in use can expire; a sign-out this device asked for is not news.
  const live = useRef(false);
  live.current = status === 'ready' || status === 'onboarding';
  const leaving = useRef(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && forgotten.current) {
        // A refresh that was already retrying when this phone signed out.
        void forgetStoredSession();
        return;
      }
      if (session?.access_token) setAccessToken(session.access_token);
      if (event === 'TOKEN_REFRESHED') void resumeRef.current(session);
      if (event === 'SIGNED_OUT' && live.current && !leaving.current) setExpired(true);
    });
    onSessionRevoked(() => { if (live.current) setExpired(true); });
    return () => { data.subscription.unsubscribe(); onSessionRevoked(null); };
  }, []);

  /** A link or code from an email: spent now, so no signal is not a failure. */
  const adopt = useCallback(async (session: Session, options?: { recovery?: boolean }) => {
    try {
      await load(session);
    } catch (e) {
      if (!unreachable(e)) throw e;
      await openOffline(session);
    }
    setRecovering(Boolean(options?.recovery));
  }, [load, openOffline]);

  const value = useMemo<SessionValue>(() => ({
    status, email, provider, pendingEmail, profile, expired, recovering,
    signIn: async (e, p) => load(await authActions.signInWithPassword(e, p)),
    signUp: async (e, p, name) => {
      const { session, confirm } = await authActions.signUp(e, p, name);
      if (session) await load(session);
      return { confirm };
    },
    signInWithGoogle: async () => {
      const session = await authActions.signInWithGoogle();
      if (session) await load(session);
      return Boolean(session);
    },
    signInWithApple: async () => {
      const session = await authActions.signInWithApple();
      if (session) await load(session);
      return Boolean(session);
    },
    adoptSession: adopt,
    finishRecovery: () => setRecovering(false),
    signOut: async () => {
      leaving.current = true;
      forgotten.current = true;
      // This device only; the server refuses its token from now on (docs/14 S3).
      // With an expired token and no signal supabase-js keeps the session and
      // says so — then it is forgotten here without asking.
      const { error } = await supabase.auth.signOut({ scope: 'local' })
        .catch((e: unknown) => ({ error: e }));
      if (error) await forgetStoredSession();
      await authActions.forgetProviderAccount();
      await clearAccountId();
      // The unfinished workout stays on the device for this account (K-01);
      // it is only hidden until they sign back in.
      clear();
      leaving.current = false;
    },
    refreshProfile: async () => {
      const p = await profileApi.get();
      setProfile(p);
      setStatus(p.onboarding_completed ? 'ready' : 'onboarding');
    },
    refreshAccount: async () => {
      const { data } = await supabase.auth.getSession();
      showAccount(await auth.me(), data.session);
    },
    reauthenticate: async (password) => {
      let session: Session | null;
      if (provider === 'google') session = await authActions.signInWithGoogle();
      else if (provider === 'apple') session = await authActions.signInWithApple();
      else {
        if (!email || !password) throw new authActions.AuthProblem('Enter your password.', 'password');
        session = await authActions.signInWithPassword(email, password);
      }
      if (!session) return; // closed the sheet: the dialog stays
      if (userId.current && session.user?.id !== userId.current) {
        // Another Google or Apple account was chosen. Signing it in here
        // would switch whose data this is under the open screen — and a
        // deletion would delete the wrong account.
        setAccessToken(null);
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        throw new authActions.AuthProblem(
          `That is a different account. Choose the one for ${email ?? 'this account'}.`,
        );
      }
      await load(session);
      setExpired(false);
    },
  }), [status, email, provider, pendingEmail, profile, expired, recovering, load, adopt, clear, showAccount]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
