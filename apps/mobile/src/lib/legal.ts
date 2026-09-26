/**
 * Where the legal links lead (K-10, A-02, K-07).
 *
 * The owner points Terms and Privacy at wherever the final texts live with
 * `EXPO_PUBLIC_TERMS_URL` / `EXPO_PUBLIC_PRIVACY_URL`. Until then the DRAFT
 * pages the API serves are the fallback, so no build ships a dead link. The
 * account-deletion page is always the API's own: it has to delete through the
 * same server the app talks to.
 *
 * NOTE: babel-preset-expo INLINES `process.env.EXPO_PUBLIC_*` at build time, so
 * the reads below must stay literal member expressions — and the environment is
 * a parameter, because under Jest they are already `undefined`.
 */
import { API_BASE } from './api';

export interface LegalEnv {
  terms?: string;
  privacy?: string;
  support?: string;
}

export interface LegalLinks {
  terms: string;
  privacy: string;
  /** The web page Google Play lists for deleting an account without the app. */
  deleteAccount: string;
  /** Null until the owner sets one; the About screen says so rather than hiding it. */
  supportEmail: string | null;
}

const BUILD_ENV: LegalEnv = {
  terms: process.env.EXPO_PUBLIC_TERMS_URL,
  privacy: process.env.EXPO_PUBLIC_PRIVACY_URL,
  support: process.env.EXPO_PUBLIC_SUPPORT_EMAIL,
};

const set = (value?: string) => (value && value.trim() ? value.trim() : null);

export function legalLinks(env: LegalEnv = BUILD_ENV, apiBase: string = API_BASE): LegalLinks {
  const base = apiBase.replace(/\/+$/, '');
  return {
    terms: set(env.terms) ?? `${base}/legal/terms`,
    privacy: set(env.privacy) ?? `${base}/legal/privacy`,
    deleteAccount: `${base}/account/delete`,
    supportEmail: set(env.support),
  };
}

/**
 * A support email with what support will ask for already in it — the version
 * and the platform (K-10). Never the account's email or anything logged: the
 * person chooses what else to say.
 */
export function supportMailto(email: string, about: { version: string; platform: string }): string {
  const subject = encodeURIComponent('FitLog support');
  const body = encodeURIComponent(
    `\n\n---\nApp version: ${about.version}\nPlatform: ${about.platform}\n`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
