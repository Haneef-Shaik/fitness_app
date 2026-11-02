import { useSyncExternalStore } from 'react';
import { getCurrentLocale, subscribeLocale, type Locale } from './locale';

/** The current language; components using it re-render when the language changes. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getCurrentLocale, getCurrentLocale);
}
