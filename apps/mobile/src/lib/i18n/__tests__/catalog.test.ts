import { en } from '../en';
import { hi } from '../hi';
import { resolveLocale, t } from '..';

describe('foundation translations', () => {
  it('has the same non-empty keys in English and Hindi', () => {
    expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
    for (const catalog of [en, hi]) {
      expect(Object.values(catalog).every((value) => value.trim().length > 0)).toBe(true);
    }
  });

  it('handles Hindi language tags and defaults unsupported locales to English', () => {
    expect(resolveLocale('hi-IN')).toBe('hi');
    expect(resolveLocale('hi_IN')).toBe('hi');
    expect(resolveLocale('en-IN')).toBe('en');
    expect(resolveLocale('fr-FR')).toBe('en');
    expect(t('appearance', 'hi')).toBe(hi.appearance);
  });
});
