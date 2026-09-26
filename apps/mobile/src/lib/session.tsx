import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  auth, onSessionRevoked, profileApi, setAccessToken, type Me, type Profile, type TokenPair,
} from './api';
import {
  clearAccountId, clearRefreshToken, getAccountId, getRefreshToken, setAccountId, setRefreshToken,
} from './storage';
import { api } from './api';

type Status = 'loading' | 'signed-out' | 'onboarding' | 'ready';

interface SessionValue {
  status: Status;
  email: string | null;
  /** A-06. `null` until the server has said — never shown as unverified on a guess. */
  emailVerified: boolean | null;
  /** K-02. The address an email change is waiting on, until its link is opened. */
  pendingEmail: string | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** L-05 — the server ended the session while a screen was open. */
  expired: boolean;
  /** Signs the same account back in, leaving whatever screen is open in place. */
  reauthenticate: (password: string) => Promise<void>;
  /** Re-reads the account (email, verification) after A-06 or a K-02 change. */
  refreshAccount: () => Promise<void>;
  /** K-02: a password change hands this device a fresh pair; keep it signed in. */
  adoptTokens: (pair: TokenPair) => Promise<void>;
}

const Ctx = createContext<SessionValue>(null as never);

/**
 * `onIdentityChange` is told whose session this is — an account id, or null
 * for nobody — whenever that changes. The app shell uses it to scope the
 * on-device store and to clear every cached read (docs/03 §6.2), so nothing of
 * one account is ever shown to another (G10).
 */
export function SessionProvider({ children, onIdentityChange }: {
  children: React.ReactNode;
  onIdentityChange?: (accountId: string | null) => void;
}) {
  const [status, setStatus] = useState<Status>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expired, setExpired] = useState(false);
  const identity = React.useRef(onIdentityChange);
  identity.current = onIdentityChange;
  const announce = useCallback((id: string | null) => { identity.current?.(id); }, []);

  const showAccount = useCallback((me: Me) => {
    setEmail(me.email);
    setEmailVerified(me.email_verified ?? null);
    setPendingEmail(me.pending_email ?? null);
  }, []);

  const load = useCallback(async () => {
    const me = await auth.me();
    await setAccountId(me.id);
    announce(me.id);
    showAccount(me);
    const p = await profileApi.get();
    setProfile(p);
    setStatus(p.onboarding_completed ? 'ready' : 'onboarding');
  }, []);

  /** A-01 Splash: restore the session before showing anything. */
  useEffect(() => {
    (async () => {
      const token = await getRefreshToken();
      if (!token) { announce(null); setStatus('signed-out'); return; }
      const ok = await api.tryRefresh();
      if (!ok) {
        // O9 vs O10. `performRefresh` clears the stored token ONLY when the
        // server actively rejected it, so the token's survival is the signal:
        //   gone  -> the family was revoked, this session is finished (O9)
        //   still there -> we could not ask. The phone is offline, and offline
        //   with a cache is full logging, not a login screen (O10).
        // Signing out here ejected someone from a workout in progress for
        // having no reception.
        if (await getRefreshToken()) {
          // Whose workout is on this phone is remembered, not asked for.
          announce(await getAccountId());
          setStatus('ready');
          return;
        }
        announce(null);
        setStatus('signed-out');
        return;
      }
      try {
        await load();
      } catch {
        // `load` sets the email before it fetches the profile, so a failure part
        // way through would otherwise leave the app signed out while still
        // showing whose account it was. Clear the identity with the status.
        announce(null);
        setEmail(null);
        setEmailVerified(null);
        setPendingEmail(null);
        setProfile(null);
        setStatus('signed-out');
      }
    })();
  }, [load, announce]);

  // L-05. Only a session that was in use can expire; at cold start a rejected
  // refresh is simply "signed out", which the effect above already decides.
  const live = React.useRef(false);
  live.current = status === 'ready' || status === 'onboarding';
  useEffect(() => {
    onSessionRevoked(() => { if (live.current) setExpired(true); });
    return () => onSessionRevoked(null);
  }, []);

  const afterAuth = useCallback(async (res: { access_token: string; refresh_token: string; user: { email: string } }) => {
    setAccessToken(res.access_token);
    await setRefreshToken(res.refresh_token);
    setEmail(res.user.email);
    await load();
  }, [load]);

  const value = useMemo<SessionValue>(() => ({
    status, email, emailVerified, pendingEmail, profile, expired,
    reauthenticate: async (password) => {
      if (!email) throw new Error('No account to sign back in to.');
      await afterAuth(await auth.login(email, password));
      setExpired(false);
    },
    signIn: async (e, p) => afterAuth(await auth.login(e, p)),
    signUp: async (e, p) => afterAuth(await auth.register(e, p)),
    signOut: async () => {
      const t = await getRefreshToken();
      if (t) { try { await auth.logout(t); } catch { /* best effort */ } }
      await clearRefreshToken();
      await clearAccountId();
      setAccessToken(null);
      // The unfinished workout stays on the device for this account (K-01);
      // it is only hidden until they sign back in.
      announce(null);
      setExpired(false);
      setProfile(null); setEmail(null); setEmailVerified(null); setPendingEmail(null);
      setStatus('signed-out');
    },
    refreshProfile: async () => {
      const p = await profileApi.get();
      setProfile(p);
      setStatus(p.onboarding_completed ? 'ready' : 'onboarding');
    },
    refreshAccount: async () => { showAccount(await auth.me()); },
    adoptTokens: async (pair) => {
      // Every token this device held before the change is revoked server-side;
      // the stored one must be replaced before anything tries to refresh it.
      setAccessToken(pair.access_token);
      await setRefreshToken(pair.refresh_token);
    },
  }), [status, email, emailVerified, pendingEmail, profile, expired, afterAuth, announce, showAccount]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
