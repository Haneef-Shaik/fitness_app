export type Locale = 'en' | 'hi';

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'hi'];

/** Each language named in its own script, as language pickers show them. Not translated. */
export const LANGUAGE_NAMES: Readonly<Record<Locale, string>> = Object.freeze({
  en: 'English',
  hi: 'हिन्दी',
});

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'hi';
}

/** PRD §5.3: follow a supported device language, otherwise English. */
export function resolveLocale(deviceLocale: string): Locale {
  return deviceLocale.toLowerCase().split(/[-_]/)[0] === 'hi' ? 'hi' : 'en';
}

function deviceLocale(): Locale {
  return resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale);
}

/** The explicit choice, from the account profile or the device store. undefined follows the device. */
let explicitLocale: Locale | undefined;
const listeners = new Set<(explicit: Locale | undefined) => void>();

export function getCurrentLocale(): Locale {
  return explicitLocale ?? deviceLocale();
}

export function setCurrentLocale(locale: Locale | undefined): void {
  if (locale !== undefined && !isLocale(locale)) throw new Error('Unsupported language');
  if (locale === explicitLocale) return;
  explicitLocale = locale;
  [...listeners].forEach((listener) => listener(locale));
}

/** Notified with the new explicit choice whenever it changes. Returns an unsubscribe function. */
export function subscribeLocale(listener: (explicit: Locale | undefined) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
