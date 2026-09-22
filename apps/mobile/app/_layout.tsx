import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
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
import { RecoveryGate } from '@/features/workout-session/RecoveryGate';

SplashScreen.preventAutoHideAsync().catch(() => {});

// One client for the app's lifetime; recreating it would throw away every cache.
const queryClient = createQueryClient();

function Root() {
  const { c, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.page },
          animation: 'fade',
        }}
      />
    </>
  );
}

export default function Layout() {
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
        });
        if (__DEV__) console.log(`[db] open (${STORE_KIND})`);
      })
      .catch((e: unknown) => console.error('[db] failed to open', e));
  }, []);

  useEffect(() => { if (loaded) SplashScreen.hideAsync().catch(() => {}); }, [loaded]);
  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionProvider>
            <Root />
            <RecoveryGate enabled />
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
