/**
 * Where the legal links go (K-10, A-02).
 *
 * The owner can point Terms and Privacy anywhere with `EXPO_PUBLIC_TERMS_URL`
 * and `EXPO_PUBLIC_PRIVACY_URL`; until they do, the drafts the API serves are
 * the fallback, so a build never ships a dead link. Babel inlines EXPO_PUBLIC_*
 * at build time, which is why the environment is a parameter here.
 */
import { legalLinks, supportMailto } from '../legal';

const API = 'https://api.fitlog.example';

it('falls back to the pages the API serves', () => {
  expect(legalLinks({}, API)).toEqual({
    terms: `${API}/legal/terms`,
    privacy: `${API}/legal/privacy`,
    deleteAccount: `${API}/account/delete`,
    supportEmail: null,
  });
});

it('uses the owner\'s addresses when they are set', () => {
  const links = legalLinks({
    terms: 'https://fitlog.example/terms',
    privacy: 'https://fitlog.example/privacy',
    support: 'help@fitlog.example',
  }, API);
  expect(links.terms).toBe('https://fitlog.example/terms');
  expect(links.privacy).toBe('https://fitlog.example/privacy');
  expect(links.supportEmail).toBe('help@fitlog.example');
});

it('treats a blank variable as unset', () => {
  expect(legalLinks({ terms: '  ', support: '' }, API)).toMatchObject({
    terms: `${API}/legal/terms`, supportEmail: null,
  });
});

it('does not double a trailing slash on the API address', () => {
  expect(legalLinks({}, `${API}/`).privacy).toBe(`${API}/legal/privacy`);
});

it('pre-fills a support email with what support will ask for', () => {
  const url = supportMailto('help@fitlog.example', { version: '0.1.0', platform: 'ios' });
  expect(url.startsWith('mailto:help@fitlog.example?')).toBe(true);
  const body = decodeURIComponent(url.split('body=')[1]!);
  expect(body).toContain('App version: 0.1.0');
  expect(body).toContain('Platform: ios');
  expect(decodeURIComponent(url)).toContain('subject=FitLog support');
});
