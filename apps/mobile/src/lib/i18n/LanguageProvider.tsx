import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useSyncExternalStore, type PropsWithChildren, type ReactNode } from 'react';
import { createLanguageStore, type LanguageStore } from './language-store';

/**
 * Reads the device's saved language before rendering the app, then keeps every later language
 * choice saved on the device. Mount it once around the app, inside the theme provider.
 * Kept out of the '@/lib/i18n' index so importing t() never loads native storage.
 */
export function LanguageProvider({ children, store: providedStore, fallback = null }: PropsWithChildren<{ store?: LanguageStore; fallback?: ReactNode }>) {
  const [store] = useState(() => providedStore ?? createLanguageStore(AsyncStorage));
  const { hydrated } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => {
    const stop = store.start();
    void store.hydrate();
    return stop;
  }, [store]);
  return <>{hydrated ? children : fallback}</>;
}
