import { en, type CopyKey } from './en';
import { hi } from './hi';

export type Locale = 'en' | 'hi';
let currentLocale: Locale | undefined;
export function setCurrentLocale(locale: Locale | undefined) { currentLocale = locale; }
export function getCurrentLocale(): Locale { return currentLocale ?? resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale); }

export function resolveLocale(deviceLocale: string): Locale {
  return deviceLocale.toLowerCase().split(/[-_]/)[0] === 'hi' ? 'hi' : 'en';
}

/** A small typed catalog; future account preferences can supply locale without editing screens. */
export function t(key: CopyKey, locale: Locale = currentLocale ?? resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale)): string {
  return (locale === 'hi' ? hi : en)[key];
}
