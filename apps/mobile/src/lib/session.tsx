import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth, profileApi, setAccessToken, type Profile } from './api';
import { clearRefreshToken, getRefreshToken, setRefreshToken } from './storage';
import { api } from './api';

type Status = 'loading' | 'signed-out' | 'onboarding' | 'ready';

interface SessionValue {
  status: Status;
  email: string | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<SessionValue>(null as never);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    const me = await auth.me();
    setEmail(me.email);
    const p = await profileApi.get();
    setProfile(p);
    setStatus(p.onboarding_completed ? 'ready' : 'onboarding');
  }, []);

  /** A-01 Splash: restore the session before showing anything. */
  useEffect(() => {
    (async () => {
      const token = await getRefreshToken();
      if (!token) { setStatus('signed-out'); return; }
      const ok = await api.tryRefresh();
      if (!ok) {
        // O9 vs O10. `performRefresh` clears the stored token ONLY when the
        // server actively rejected it, so the token's survival is the signal:
        //   gone  -> the family was revoked, this session is finished (O9)
        //   still there -> we could not ask. The phone is offline, and offline
        //   with a cache is full logging, not a login screen (O10).
        // Signing out here ejected someone from a workout in progress for
        // having no reception.
        if (await getRefreshToken()) { setStatus('ready'); return; }
        setStatus('signed-out');
        return;
      }
      try {
        await load();
      } catch {
        // `load` sets the email before it fetches the profile, so a failure part
        // way through would otherwise leave the app signed out while still
        // showing whose account it was. Clear the identity with the status.
        setEmail(null);
        setProfile(null);
        setStatus('signed-out');
      }
    })();
  }, [load]);

  const afterAuth = useCallback(async (res: { access_token: string; refresh_token: string; user: { email: string } }) => {
    setAccessToken(res.access_token);
    await setRefreshToken(res.refresh_token);
    setEmail(res.user.email);
    await load();
  }, [load]);

  const value = useMemo<SessionValue>(() => ({
    status, email, profile,
    signIn: async (e, p) => afterAuth(await auth.login(e, p)),
    signUp: async (e, p) => afterAuth(await auth.register(e, p)),
    signOut: async () => {
      const t = await getRefreshToken();
      if (t) { try { await auth.logout(t); } catch { /* best effort */ } }
      await clearRefreshToken();
      setAccessToken(null);
      setProfile(null); setEmail(null); setStatus('signed-out');
    },
    refreshProfile: async () => {
      const p = await profileApi.get();
      setProfile(p);
      setStatus(p.onboarding_completed ? 'ready' : 'onboarding');
    },
  }), [status, email, profile, afterAuth]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
