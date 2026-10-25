import { createContext, useContext, useEffect, useState, useSyncExternalStore, type PropsWithChildren } from 'react';
import { AppState, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AUTH_CALLBACK_PATH, createAuthCallbackHandler } from '@/lib/auth-callback';
import { setCurrentLocale, t } from '@/lib/i18n';
import { AppButton, AppText, Screen } from '@/ui';
import { useTheme } from '@/theme';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { OnboardingScreen } from '@/features/auth/OnboardingScreen';
import { openCache } from './cache';
import { createMemberStore, type MemberStore } from './member-store';
import { loadMemberData, loadProfile, sendOperation } from './api';
import type { Profile } from './types';
import { syncGymOutbox } from './gym-outbox';

const MemberContext = createContext<MemberStore | null>(null);
function Loading() { const { theme } = useTheme(); return <Screen><ActivityIndicator color={theme.colors.primary} accessibilityLabel={t('loadingData')} /></Screen>; }

export function MemberProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null); const [authReady, setAuthReady] = useState(!supabase);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data, error: failure }) => { if (active) { setSession(failure ? null : data.session); setAuthReady(true); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => { if (active) setSession(next); });
    const appState = AppState.addEventListener('change', (state) => { if (state === 'active') supabase?.auth.startAutoRefresh(); else supabase?.auth.stopAutoRefresh(); });
    const acceptUrl = createAuthCallbackHandler(supabase.auth, Linking.createURL(AUTH_CALLBACK_PATH));
    void Linking.getInitialURL().then(acceptUrl).catch(() => {});
    const links = Linking.addEventListener('url', ({ url }) => { void acceptUrl(url); });
    return () => { active = false; subscription.unsubscribe(); appState.remove(); links.remove(); };
  }, []);
  if (!authReady) return <Loading />;
  if (!session) return <AuthScreen />;
  return <MemberWorkspace key={session.user.id} userId={session.user.id}>{children}</MemberWorkspace>;
}

function MemberWorkspace({ children, userId }: PropsWithChildren<{ userId: string }>) {
  const [store, setStore] = useState<MemberStore | null>(null); const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [error, setError] = useState(''); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; let instance: MemberStore | undefined;
    void (async () => {
      const cache = await openCache(userId);
      if (!active) { await cache.close(); return; }
      setNeedsOnboarding(false); setError('');
      const cached = await cache.read(); let profile: Profile | null;
      try { profile = await loadProfile(); } catch (e) { profile = cached?.drafts.__profile as Profile | undefined ?? null; if (!profile) throw e; }
      if (!active) { await cache.close(); return; }
      if (!profile) { await cache.close(); setNeedsOnboarding(true); return; }
      const chosen = profile;
      setCurrentLocale(chosen.locale);
      await cache.write(cached?.data ?? { exercises: [], programmes: [], sessions: [], foods: [], meals: [], targets: [], body: [], goals: [], occurrences: [] }, cached?.operations ?? [], { ...cached?.drafts, __profile: chosen });
      instance = createMemberStore(chosen, cache, { load: loadMemberData, send: sendOperation }, Crypto.randomUUID);
      await instance.initialize();
      if (active) setStore(instance); else await instance.close();
    })().catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : t('loadFailed')); });
    return () => { active = false; if (instance) void instance.close(); };
  }, [userId, attempt]);
  useEffect(() => {
    if (!store) return;
    const timer = setInterval(() => { void store.sync(); void syncGymOutbox(store).catch(() => {}); }, 15_000);
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') void store.sync(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [store]);
  if (needsOnboarding) return <OnboardingScreen onComplete={() => setAttempt((n) => n + 1)} />;
  if (error) return <Screen><AppText tone="error">{error}</AppText><AppButton label={t('retry')} onPress={() => setAttempt((n) => n + 1)} /></Screen>;
  if (!store) return <Loading />;
  return <MemberContext.Provider value={store}>{children}</MemberContext.Provider>;
}

export function useMember() {
  const store = useContext(MemberContext);
  if (!store) throw new Error('Member workspace is unavailable');
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { store, profile: store.profile, ...snapshot };
}
