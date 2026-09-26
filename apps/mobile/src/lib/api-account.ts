/**
 * The account as a whole — recovery and security (A-05, A-06, K-02) and data &
 * privacy (K-07).
 *
 * Split by who may call. `recoveryApi` works signed out: a reset is for someone
 * who cannot sign in, and a verification link is often opened on a different
 * device from the one that asked for it. `accountApi` acts on the signed-in
 * account, and refreshes an expired access token like any other call.
 *
 * The export and the deletions are **actions, not reads**: nothing here is
 * cached, because an export is something a person asks for once and a copy
 * of it sitting in a query cache is one more place their data lives.
 */
import type {
  AccountDeleted, EmailChange, EmailVerified, PasswordReset, PhotosDeleted, ResetRequested,
  SessionsRevoked, TokenPair, VerificationSent,
} from '@fitlog/api-types';
import { ApiError, api } from './api';

/** The server's code for an emailed link that cannot be used — unknown, spent or expired. */
export const LINK_EXPIRED = 'LINK_EXPIRED';

export const isExpiredLink = (e: unknown) => e instanceof ApiError && e.code === LINK_EXPIRED;

/** `fitlog.export.v1` — a documented JSON document the server builds. */
export type AccountExport = Record<string, unknown>;

export const recoveryApi = {
  /** A-05. Resolves the same way whether or not the address has an account. */
  forgotPassword: (email: string) =>
    api.post<ResetRequested>('/auth/password/forgot', { email }),
  /** A-05. Signs every device out — this one included. */
  resetPassword: (token: string, newPassword: string) =>
    api.post<PasswordReset>('/auth/password/reset', { token, new_password: newPassword }),
  /** A-06, and the K-02 email-change link, which moves the account. */
  verifyEmail: (token: string) =>
    api.post<EmailVerified>('/auth/email/verify', { token }),
};

export const accountApi = {
  /** A-06 "Resend link". 429 inside a minute of the last one. */
  resendVerification: () => api.post<VerificationSent>('/auth/email/resend'),
  /** K-02. A fresh pair for this device; every other device is signed out. */
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<TokenPair>('/account/password', {
      current_password: currentPassword, new_password: newPassword,
    }),
  /** K-02. Nothing changes until the link sent to `newEmail` is opened. */
  changeEmail: (newEmail: string, password: string) =>
    api.post<EmailChange>('/account/email', { new_email: newEmail, password }),
  /** K-02. How many other devices were signed out. */
  signOutOtherDevices: () => api.post<SessionsRevoked>('/auth/sessions/revoke-others'),

  /** K-07. Everything the account owns, as one JSON document. */
  export: () => api.get<AccountExport>('/account/export'),
  /** K-07. Every stored image: progress photos go, analyses keep their record. */
  deletePhotos: () => api.del<PhotosDeleted>('/account/photos'),
  /**
   * K-07. Deletes the account. The password travels in the body — the older
   * `DELETE /account?confirm=` put it in the URL, where logs keep it — and the
   * server checks the typed DELETE as well as the screen does.
   */
  delete: (password: string) =>
    api.post<AccountDeleted>('/account/delete', { password, confirmation: 'DELETE' }),
};
