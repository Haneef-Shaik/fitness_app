/**
 * Web: an in-memory store, because `expo-sqlite` has no web build.
 *
 * Web is a development surface, not a shipping platform (D1), so losing the draft
 * on reload is acceptable here and nowhere else. The warning is deliberate: a
 * durability layer that silently is not durable is worse than one that is absent.
 */
import { createMemoryStore } from './memory';
import type { SessionStore } from './types';

if (__DEV__) {
  console.warn(
    '[db] expo-sqlite has no web build — using an in-memory store. ' +
    'Drafts do NOT survive a reload here. iOS and Android use SQLite (D14).',
  );
}

export const store: SessionStore = createMemoryStore();
export const STORE_KIND = 'memory' as const;
export * from './types';
