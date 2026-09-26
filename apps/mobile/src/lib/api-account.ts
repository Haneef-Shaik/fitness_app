/**
 * The account as a whole, as the FitLog API holds it — data & privacy (K-07).
 * Recovery and security (A-05, A-06, K-02) are Supabase Auth's now:
 * `src/features/auth/supabaseAuth.ts` (docs/14-SUPABASE.md).
 *
 * The export and the deletions are **actions, not reads**: nothing here is
 * cached, because an export is something a person asks for once and a copy
 * of it sitting in a query cache is one more place their data lives.
 */
import type { AccountDeleted, PhotosDeleted } from '@fitlog/api-types';
import { ApiError, api } from './api';

/** `fitlog.export.v1` — a documented JSON document the server builds. */
export type AccountExport = Record<string, unknown>;

/** The server's answer when a deletion needs a fresher sign-in (docs/14 S5). */
export const REAUTH_REQUIRED = 'REAUTH_REQUIRED';
export const needsFreshSignIn = (e: unknown) => e instanceof ApiError && e.code === REAUTH_REQUIRED;

export const accountApi = {
  /** K-07. Everything the account owns, as one JSON document. */
  export: () => api.get<AccountExport>('/account/export'),
  /** K-07. Every stored image: progress photos go, analyses keep their record. */
  deletePhotos: () => api.del<PhotosDeleted>('/account/photos'),
  /**
   * K-07. Deletes the account — FitLog's data and the Supabase sign-in. Needs a
   * sign-in in the last ten minutes (REAUTH_REQUIRED otherwise) and the typed
   * DELETE, which the server checks as well as the screen does.
   */
  delete: () => api.post<AccountDeleted>('/account/delete', { confirmation: 'DELETE' }),
};
