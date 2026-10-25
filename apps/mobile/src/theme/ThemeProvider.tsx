import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type PropsWithChildren } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { createPreferenceStore, type PreferenceStore } from './preference-store';
import { createTheme, resolveColorScheme, type AppTheme } from './theme';
import { momentum } from './themes/momentum';
import type { ThemeDefinition, ThemePreference } from './types';

interface ThemeContextValue {
  readonly theme: AppTheme;
  readonly preference: ThemePreference;
  readonly hydrated: boolean;
  readonly storageError: 'read' | 'write' | null;
  readonly setPreference: (value: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  definition = momentum,
  store: providedStore,
}: PropsWithChildren<{ definition?: ThemeDefinition; store?: PreferenceStore }>) {
  const [store] = useState(() => providedStore ?? createPreferenceStore(AsyncStorage));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const systemScheme = useColorScheme();
  const scheme = resolveColorScheme(snapshot.preference, systemScheme === 'dark' ? 'dark' : 'light');
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
  const theme = useMemo(() => createTheme(definition, scheme, platform), [definition, scheme, platform]);

  useEffect(() => { void store.hydrate(); }, [store]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    preference: snapshot.preference,
    hydrated: snapshot.hydrated,
    storageError: snapshot.error,
    setPreference: store.setPreference,
  }), [theme, snapshot, store]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
