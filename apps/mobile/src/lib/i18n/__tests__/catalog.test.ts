import { calendarEn, calendarHi } from '../calendar';
import { en } from '../en';
import { hi } from '../hi';
import { pluralsEn, pluralsHi } from '../plurals';
import { calendarProblems, catalogProblems, interpolate, LANGUAGE_NAMES, pluralCatalogProblems, resolveLocale, t, tf } from '..';

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
    expect(resolveLocale('')).toBe('en');
    expect(t('appearance', 'hi')).toBe(hi.appearance);
  });

  it('reports no parity problem in the shipped catalogs', () => {
    expect(catalogProblems(en, hi)).toEqual([]);
    expect(pluralCatalogProblems(pluralsEn, pluralsHi)).toEqual([]);
    expect(calendarProblems(calendarEn, calendarHi)).toEqual([]);
  });

  it('fails on a planted literal that only one catalog carries', () => {
    const plantedEnglish = { ...en, plantedLiteral: 'Planted literal' };
    expect(catalogProblems(plantedEnglish, hi)).toEqual(['hi is missing "plantedLiteral"']);
    const plantedHindi = { ...hi, plantedLiteral: 'रोपा गया शब्द' };
    expect(catalogProblems(en, plantedHindi)).toEqual(['hi has extra "plantedLiteral"']);
  });

  it('fails on empty copy and on placeholders that differ between languages', () => {
    expect(catalogProblems(en, { ...hi, save: ' ' })).toEqual(['hi.save is empty']);
    expect(catalogProblems(en, { ...hi, measureValue: '{value}' }))
      .toEqual(['"measureValue" placeholders differ: en {unit,value} · hi {value}']);
    expect(pluralCatalogProblems(pluralsEn, { ...pluralsHi, setCount: { one: 'सेट', other: '{count} सेट' } }))
      .toEqual(['hi.setCount.one has no {count}']);
    expect(pluralCatalogProblems(pluralsEn, { ...pluralsHi, plantedCount: { one: '{count} x', other: '{count} x' } }))
      .toEqual(['hi has extra "plantedCount"']);
    expect(calendarProblems(calendarEn, { ...calendarHi, monthsShort: calendarHi.monthsShort.slice(0, 11) }))
      .toEqual(['hi.monthsShort needs 12 names']);
  });

  it('fills named values and leaves unknown placeholders visible', () => {
    expect(tf('measureValue', { value: '5', unit: 'kg' }, 'en')).toBe('5 kg');
    expect(tf('labelWithUnit', { label: 'वज़न', unit: 'किग्रा' }, 'hi')).toBe('वज़न (किग्रा)');
    expect(interpolate('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });

  it('names each language in its own script for the language picker', () => {
    // Code points spelled out: ह ि न ् द ी, the endonym ProfileScreen shows today.
    expect(LANGUAGE_NAMES).toEqual({ en: 'English', hi: 'हिन्दी' });
  });
});
