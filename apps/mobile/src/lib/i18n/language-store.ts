import { isLocale, setCurrentLocale, subscribeLocale, type Locale } from './locale';

/** Device-local copy of the language choice, so the app opens in it before sign-in and offline. */
export const languageStorageKey = '@fitlog/language/v1';

export interface LanguageStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface LanguageSnapshot {
  readonly saved: Locale | null;
  readonly hydrated: boolean;
  readonly error: 'read' | 'write' | null;
}

/** The app-wide language state the store reads and writes; injectable for tests. */
export interface LocaleBinding {
  set(locale: Locale | undefined): void;
  subscribe(listener: (explicit: Locale | undefined) => void): () => void;
}

const appLocale: LocaleBinding = { set: setCurrentLocale, subscribe: subscribeLocale };

/**
 * Persists the language locally. The account profile stays the source of truth once it loads:
 * MemberProvider and the profile screen call setCurrentLocale, and start() saves each such choice
 * here. Only the language code is stored; no account or health data.
 */
export function createLanguageStore(storage: LanguageStorage, locale: LocaleBinding = appLocale) {
  let snapshot: LanguageSnapshot = { saved: null, hydrated: false, error: null };
  const listeners = new Set<() => void>();
  let hydration: Promise<void> | undefined;
  let writes: Promise<void> = Promise.resolve();
  let revision = 0;
  let applyingLocally = false;
  let unsubscribe: (() => void) | undefined;

  function update(patch: Partial<LanguageSnapshot>) {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  }

  function persist(choice: Locale): Promise<void> {
    const selection = ++revision;
    writes = writes.then(async () => {
      try {
        await storage.setItem(languageStorageKey, choice);
        if (selection === revision) update({ saved: choice, error: null });
      } catch {
        if (selection === revision) update({ error: 'write' });
      }
    });
    return writes;
  }

  function apply(choice: Locale) {
    applyingLocally = true;
    try { locale.set(choice); } finally { applyingLocally = false; }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    /** Saves every explicit language change made elsewhere in the app until the returned stop runs. */
    start() {
      unsubscribe ??= locale.subscribe((explicit) => {
        if (!applyingLocally && explicit !== undefined) void persist(explicit);
      });
      return () => { unsubscribe?.(); unsubscribe = undefined; };
    },
    /** Reads the saved language once. A choice made while reading wins over the older saved value. */
    hydrate() {
      hydration ??= (async () => {
        const initialRevision = revision;
        try {
          const saved = await storage.getItem(languageStorageKey);
          if (revision === initialRevision) {
            if (isLocale(saved)) apply(saved);
            update({ saved: isLocale(saved) ? saved : null, error: null });
          }
        } catch {
          if (revision === initialRevision) update({ error: 'read' });
        } finally {
          update({ hydrated: true });
        }
      })();
      return hydration;
    },
    /** Applies a language now and saves it; the language stays applied even if saving fails. */
    setLanguage(choice: Locale): Promise<void> {
      if (!isLocale(choice)) throw new Error('Unsupported language');
      apply(choice);
      return persist(choice);
    },
    /** Resolves once every queued write has finished. */
    settled(): Promise<void> {
      return writes;
    },
  };
}

export type LanguageStore = ReturnType<typeof createLanguageStore>;
