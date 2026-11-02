import type { Locale } from './locale';

export type PluralCategory = 'one' | 'other';

/**
 * CLDR cardinal rules, written out because Intl.PluralRules is not guaranteed on Hermes.
 * English: one when the number is exactly 1. Hindi: one when the integer part is 0, or n is 1.
 * Tests compare these against Node's Intl.PluralRules.
 */
export function pluralCategory(count: number, locale: Locale): PluralCategory {
  if (!Number.isFinite(count)) return 'other';
  const n = Math.abs(count);
  if (locale === 'hi') return Math.trunc(n) === 0 || n === 1 ? 'one' : 'other';
  return n === 1 ? 'one' : 'other';
}
