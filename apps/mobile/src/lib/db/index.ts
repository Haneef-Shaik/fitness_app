/**
 * iOS and Android: the real store (D14).
 *
 * Metro prefers `index.web.ts` on web, which swaps in the in-memory store —
 * `expo-sqlite` has no web build and importing it there takes the app down.
 * TypeScript resolves this file, so the SQLite implementation is the one that
 * gets type-checked.
 */
import { createSqliteStore } from './sqlite';
import type { SessionStore } from './types';

export const store: SessionStore = createSqliteStore();
export const STORE_KIND = 'sqlite' as const;
export * from './types';
