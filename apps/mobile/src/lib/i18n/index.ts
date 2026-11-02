/**
 * The strings and formats spine (G14.app). Screens show text only through:
 *   t(key) / tf(key, params)        catalog copy, in the current language
 *   formatCount(key, n)             counted nouns with English/Hindi plural rules
 *   formatNumber / formatMoney      en-IN and hi-IN numbers, integer-paise money (₹1,00,000.00)
 *   formatDate / formatTime / formatDateTime / weekdayName   dates and times
 *   formatMeasure / labelWithUnit / formatWeight / formatLength   units
 * The language comes from the account profile once loaded, else the device store, else the device.
 * LanguageProvider (device persistence) is imported from '@/lib/i18n/LanguageProvider'.
 */
export type { CopyKey } from './en';
export type { Locale } from './locale';
export { LANGUAGE_NAMES, SUPPORTED_LOCALES, getCurrentLocale, isLocale, resolveLocale, setCurrentLocale, subscribeLocale } from './locale';
export { interpolate, placeholders, t, tf, type CopyParams } from './translate';
export { pluralCategory, type PluralCategory } from './plural-rules';
export type { PluralForms, PluralKey } from './plurals';
export {
  CM_PER_INCH, KG_PER_LB, formatCount, formatDate, formatDateTime, formatLength, formatMeasure, formatMoney, formatNumber,
  formatTime, formatWeight, labelWithUnit, lengthFromCm, unitLabel, weekdayName, weightFromKg, withUnit,
  type DateStyle, type MeasureUnit, type NumberOptions, type WeekdayWidth,
} from './format';
export { calendarProblems, catalogProblems, pluralCatalogProblems } from './parity';
export { createLanguageStore, languageStorageKey, type LanguageSnapshot, type LanguageStorage, type LanguageStore } from './language-store';
export { useLocale } from './use-locale';
