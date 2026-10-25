import type { PreferenceStorage, ThemePreference } from './types';

export const preferenceStorageKey = '@fitlog/appearance/v1';
export interface PreferenceSnapshot {
  readonly preference: ThemePreference;
  readonly hydrated: boolean;
  readonly error: 'read' | 'write' | null;
}

function isPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

/** Storage is injected so races/failures can be tested without a device. No account data lives here. */
export function createPreferenceStore(storage: PreferenceStorage) {
  let snapshot: PreferenceSnapshot = { preference: 'system', hydrated: false, error: null };
  const listeners = new Set<() => void>();
  let hydration: Promise<void> | undefined;
  let writes: Promise<void> = Promise.resolve();
  let revision = 0;

  function update(patch: Partial<PreferenceSnapshot>) {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    hydrate() {
      hydration ??= (async () => {
        const initialRevision = revision;
        try {
          const saved = await storage.getItem(preferenceStorageKey);
          if (revision === initialRevision) {
            update({ preference: isPreference(saved) ? saved : 'system', error: null });
          }
        } catch {
          if (revision === initialRevision) update({ error: 'read' });
        } finally {
          update({ hydrated: true });
        }
      })();
      return hydration;
    },
    setPreference(preference: ThemePreference) {
      // Guard external/untyped callers as well as typed component code.
      if (!isPreference(preference)) throw new Error('Invalid appearance preference');
      const selectionRevision = ++revision;
      update({ preference, error: null });
      writes = writes.then(async () => {
        try {
          await storage.setItem(preferenceStorageKey, preference);
          if (revision === selectionRevision) update({ error: null });
        } catch {
          if (revision === selectionRevision) update({ error: 'write' });
        }
      });
      return writes;
    },
  };
}

export type PreferenceStore = ReturnType<typeof createPreferenceStore>;
