import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, Barlow_700Bold,
} from '@expo-google-fonts/barlow';
import {
  BarlowCondensed_600SemiBold, BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';

import { QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider, useTheme } from '@/theme';
import { SessionProvider } from '@/lib/session';
import { createQueryClient } from '@/lib/query/client';
import { STORE_KIND, store } from '@/lib/db';
import { configurePersistence } from '@/features/workout-session/store/sessionStore';
import { flushAndReconcile } from '@/features/workout-session/sessionController';
import { AuthGate } from '@/lib/AuthGate';
import { startOutboxPump } from '@/lib/offline/pump';
import { RecoveryGate } from '@/features/workout-session/RecoveryGate';
import { SyncShell } from '@/features/sync/SyncBanner';
import { TabBar } from '@/ui/shell/TabBar';
import { showsTabBar } from '@/ui/shell/tabs';
import { BottomInsetHandled } from '@/ui/topInset';
import { createIdentityHandler } from '@/lib/identity';
import { useSessionStore } from '@/features/workout-session/store/sessionStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

// One client for the app's lifetime; recreating it would throw away every cache.
const queryClient = createQueryClient();

function Root() {
  const { c, scheme } = useTheme();
  // The tab bar (00 §4, D2) sits BELOW the stack rather than over it, so no
  // screen has to pad itself for it; it owns the home-indicator inset instead.
  const tabs = showsTabBar(usePathname());
  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* L-02's banner: a row above the stack, so it can never cover content
          or swallow a tap. While it shows, it owns the status-bar inset. */}
      <SyncShell>
        <BottomInsetHandled.Provider value={tabs}>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: c.page },
                animation: 'fade',
              }}
            />
          </View>
        </BottomInsetHandled.Provider>
      </SyncShell>
      {tabs ? <TabBar /> : null}
    </View>
  );
}

export default function Layout() {
  // Whose session this is. `undefined` until the session has decided.
  const [account, setAccount] = useState<string | null | undefined>(undefined);
  const onIdentityChange = useMemo(() => {
    const handle = createIdentityHandler({
      setOwner: (id) => store.setOwner(id),
      clearCache: () => queryClient.clear(),
      releaseWorkout: () => useSessionStore.setState({ draft: null, recoveryCandidate: null }),
      flush: flushAndReconcile,
    });
    return (id: string | null) => { handle(id); setAccount(id); };
  }, []);

  const [loaded] = useFonts({
    Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, Barlow_700Bold,
    BarlowCondensed_600SemiBold, BarlowCondensed_700Bold,
  });

  // The durability layer opens at launch: recovery (E-10) reads it before any
  // screen renders, so a failure here must be loud rather than deferred.
  useEffect(() => {
    store.open()
      .then(() => {
        // The draft store persists through this handle; wiring it here means the
        // commit path never has to check whether the database is ready.
        configurePersistence({
          store,
          onPersistError: (e) => console.error('[db] draft write failed', e),
          // The queue drains when a write LANDS, not when a screen hopes it has.
          // The logger's own post-commit flush could run before the entry
          // reached SQLite, and nothing re-armed it afterwards, so a set could
          // sit queued for ever while the row was on screen.
          onPersisted: () => { void flushAndReconcile(); },
        });
        // journal_mode is recorded rather than assumed (G0 declined to claim WAL).
        if (__DEV__) console.log(`[db] open (${STORE_KIND}) journal_mode=${store.journalMode() ?? 'unknown'}`);
      })
      .catch((e: unknown) => console.error('[db] failed to open', e));
  }, []);

  // Retry queued writes on a timer, for the whole life of the app rather than
  // of one screen. Every other trigger is something the user does, so a queue
  // stranded by an unreachable server stayed stranded while the phone sat on a
  // bench — measured at 90 s with the server back up and nothing moving.
  useEffect(() => startOutboxPump({ flush: flushAndReconcile }), []);

  useEffect(() => { if (loaded) SplashScreen.hideAsync().catch(() => {}); }, [loaded]);
  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionProvider onIdentityChange={onIdentityChange}>
            {/* Watches the session status rather than the route: app/index.tsx
                redirects only while it is mounted, so losing the session
                anywhere else left the screen you were on. */}
            <AuthGate />
            <Root />
            {/* Asked once per ACCOUNT, once that account is known — an unfinished
                workout belongs to the account that started it (G10). */}
            <RecoveryGate key={account ?? 'nobody'} enabled={Boolean(account)} />
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
