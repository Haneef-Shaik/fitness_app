import { calendarEn, calendarHi, type CalendarNames } from './calendar';
import type { CopyKey } from './en';
import { getCurrentLocale, type Locale } from './locale';
import { pluralCategory } from './plural-rules';
import { pluralsEn, pluralsHi, type PluralKey } from './plurals';
import { interpolate, t, tf } from './translate';

/**
 * en-IN and hi-IN display formats (PRD §4.2). Both use Latin digits, '.' for decimals and Indian
 * grouping (1,00,000), as CLDR does. Output is built here rather than by Intl so it is the same on
 * every JavaScript engine. Rounding is for display only, half away from zero on the decimal value.
 */
const NUMBER_SYMBOLS: Readonly<Record<Locale, { readonly decimal: string; readonly group: string }>> = {
  en: { decimal: '.', group: ',' },
  hi: { decimal: '.', group: ',' },
};
const CALENDARS: Readonly<Record<Locale, CalendarNames>> = { en: calendarEn, hi: calendarHi };
const MAX_FRACTION_DIGITS = 6;
const MISSING = '—';
const RUPEE = '₹';

export interface NumberOptions {
  readonly minimumFractionDigits?: number;
  readonly maximumFractionDigits?: number;
}

function groupDigits(digits: string, separator: string): string {
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, separator);
  return `${head}${separator}${digits.slice(-3)}`;
}

function checkDigits(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 0 || value > MAX_FRACTION_DIGITS) {
    throw new RangeError(`${name} must be a whole number from 0 to ${MAX_FRACTION_DIGITS}`);
  }
  return value;
}

/** Splits |value| rounded to `digits` decimals into integer and fraction digit strings. */
function roundedDigits(value: number, digits: number): { integer: string; fraction: string } {
  const magnitude = Math.abs(value);
  const plain = String(magnitude);
  const scaled = /e/i.test(plain) ? Math.round(magnitude * 10 ** digits) : Math.round(Number(`${plain}e${digits}`));
  if (!Number.isSafeInteger(scaled)) throw new RangeError('This number is too large to show exactly');
  const padded = String(scaled).padStart(digits + 1, '0');
  return digits === 0
    ? { integer: padded, fraction: '' }
    : { integer: padded.slice(0, -digits), fraction: padded.slice(-digits) };
}

export function formatNumber(value: number, options: NumberOptions = {}, locale: Locale = getCurrentLocale()): string {
  if (!Number.isFinite(value)) throw new RangeError('Only finite numbers can be shown');
  const maximum = checkDigits(options.maximumFractionDigits ?? 2, 'maximumFractionDigits');
  const minimum = checkDigits(options.minimumFractionDigits ?? 0, 'minimumFractionDigits');
  if (minimum > maximum) throw new RangeError('minimumFractionDigits cannot exceed maximumFractionDigits');
  const symbols = NUMBER_SYMBOLS[locale];
  const { integer, fraction } = roundedDigits(value, maximum);
  let shown = fraction;
  while (shown.length > minimum && shown.endsWith('0')) shown = shown.slice(0, -1);
  const sign = value < 0 && /[1-9]/.test(integer + shown) ? '-' : '';
  return `${sign}${groupDigits(integer, symbols.group)}${shown ? `${symbols.decimal}${shown}` : ''}`;
}

/** Money is integer paise (PRD §13); this never rounds it. wholeUnits drops '.00' for whole rupees. */
export function formatMoney(paise: number, options: { readonly wholeUnits?: boolean } = {}, locale: Locale = getCurrentLocale()): string {
  if (!Number.isSafeInteger(paise)) throw new RangeError('Money must be a whole number of paise');
  const symbols = NUMBER_SYMBOLS[locale];
  const magnitude = Math.abs(paise);
  const fractionPaise = magnitude % 100;
  const rupees = (magnitude - fractionPaise) / 100;
  const fraction = options.wholeUnits && fractionPaise === 0 ? '' : `${symbols.decimal}${String(fractionPaise).padStart(2, '0')}`;
  return `${paise < 0 ? '-' : ''}${RUPEE}${groupDigits(String(rupees), symbols.group)}${fraction}`;
}

export function formatCount(key: PluralKey, count: number, locale: Locale = getCurrentLocale()): string {
  const forms = (locale === 'hi' ? pluralsHi : pluralsEn)[key];
  return interpolate(forms[pluralCategory(count, locale)], { count: formatNumber(count, {}, locale) });
}

export type DateStyle = 'numeric' | 'medium' | 'long' | 'full' | 'dayMonth' | 'weekdayDayMonth';
export type WeekdayWidth = 'narrow' | 'short' | 'long';

interface CalendarDate { readonly year: number; readonly month: number; readonly day: number; readonly weekday: number }

/** Reads a stable local date (YYYY-MM-DD, PRD §4.2) and refuses one that does not exist. */
function calendarDate(date: string): CalendarDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new RangeError(`Expected a YYYY-MM-DD date, got "${date}"`);
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    throw new RangeError(`${date} is not a calendar date`);
  }
  return { year, month, day, weekday: utc.getUTCDay() };
}

function nameAt(names: readonly string[], index: number): string {
  const name = names[index];
  if (name === undefined) throw new RangeError('Calendar names are incomplete');
  return name;
}

export function weekdayName(date: string, width: WeekdayWidth = 'long', locale: Locale = getCurrentLocale()): string {
  const calendar = CALENDARS[locale];
  const names = width === 'narrow' ? calendar.weekdaysNarrow : width === 'short' ? calendar.weekdaysShort : calendar.weekdaysLong;
  return nameAt(names, calendarDate(date).weekday);
}

/** Formats a local calendar date. en-IN and hi-IN both read day, month, year. */
export function formatDate(date: string, style: DateStyle = 'medium', locale: Locale = getCurrentLocale()): string {
  const { year, month, day, weekday } = calendarDate(date);
  const calendar = CALENDARS[locale];
  const shortMonth = nameAt(calendar.monthsShort, month - 1);
  const longMonth = nameAt(calendar.monthsLong, month - 1);
  const longWeekday = nameAt(calendar.weekdaysLong, weekday);
  switch (style) {
    case 'numeric': return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    case 'long': return `${day} ${longMonth} ${year}`;
    case 'full': return `${longWeekday}, ${day} ${longMonth} ${year}`;
    case 'dayMonth': return `${day} ${shortMonth}`;
    case 'weekdayDayMonth': return `${longWeekday}, ${day} ${longMonth}`;
    default: return `${day} ${shortMonth} ${year}`;
  }
}

/** The local date and 24-hour time of an instant in an IANA zone. */
function wallClock(instant: string | number | Date, timeZone: string): { date: string; hour: number; minute: number } {
  const at = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(at.getTime())) throw new RangeError('Expected a valid instant');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) => {
    const found = parts.find((candidate) => candidate.type === type);
    if (!found) throw new RangeError(`Missing ${type} for ${timeZone}`);
    return found.value;
  };
  return { date: `${part('year')}-${part('month')}-${part('day')}`, hour: Number(part('hour')) % 24, minute: Number(part('minute')) };
}

/** 12-hour time in the record's zone, for example 7:05 pm. */
export function formatTime(instant: string | number | Date, timeZone: string, locale: Locale = getCurrentLocale()): string {
  const { hour, minute } = wallClock(instant, timeZone);
  const period = t(hour < 12 ? 'timeAm' : 'timePm', locale);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${period}`;
}

/** Medium date and time in the record's zone, for example 28 Oct 2026, 12:30 am. */
export function formatDateTime(instant: string | number | Date, timeZone: string, locale: Locale = getCurrentLocale()): string {
  return `${formatDate(wallClock(instant, timeZone).date, 'medium', locale)}, ${formatTime(instant, timeZone, locale)}`;
}

export type MeasureUnit = 'kg' | 'lb' | 'g' | 'cm' | 'in' | 'm' | 'km' | 'mi' | 'kcal' | 's' | 'min' | 'kgReps';

const UNIT_KEYS: Readonly<Record<MeasureUnit, CopyKey>> = {
  kg: 'unitKg', lb: 'unitLb', g: 'unitG', cm: 'unitCm', in: 'unitIn', m: 'unitM', km: 'unitKm', mi: 'unitMi',
  kcal: 'unitKcal', s: 'unitSeconds', min: 'unitMinutes', kgReps: 'unitKgReps',
};
/** PRD §4.2 display defaults: load and weight 2, measurements and macros 1, distance 2, kcal 0. */
const UNIT_DIGITS: Readonly<Record<MeasureUnit, number>> = {
  kg: 2, lb: 2, kgReps: 2, g: 1, cm: 1, in: 1, m: 2, km: 2, mi: 2, kcal: 0, s: 0, min: 0,
};

export const KG_PER_LB = 0.45359237;
export const CM_PER_INCH = 2.54;

export function unitLabel(unit: MeasureUnit, locale: Locale = getCurrentLocale()): string {
  return t(UNIT_KEYS[unit], locale);
}

/** Places already formatted text next to a unit, for example '25 + 20' and kg. */
export function withUnit(value: string, unit: MeasureUnit, locale: Locale = getCurrentLocale()): string {
  return tf('measureValue', { value, unit: unitLabel(unit, locale) }, locale);
}

/** A field label with its unit, for example Weight (kg). */
export function labelWithUnit(label: string, unit: MeasureUnit, locale: Locale = getCurrentLocale()): string {
  return tf('labelWithUnit', { label, unit: unitLabel(unit, locale) }, locale);
}

/** A value already in `unit`. null or undefined shows a dash, never zero (PRD §4.2). */
export function formatMeasure(value: number | null | undefined, unit: MeasureUnit, locale: Locale = getCurrentLocale()): string {
  if (value === null || value === undefined) return MISSING;
  return withUnit(formatNumber(value, { maximumFractionDigits: UNIT_DIGITS[unit] }, locale), unit, locale);
}

export function weightFromKg(kg: number, unit: 'kg' | 'lb'): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB;
}

export function lengthFromCm(cm: number, unit: 'cm' | 'in'): number {
  return unit === 'cm' ? cm : cm / CM_PER_INCH;
}

/** Canonical kg shown in the member's weight unit. */
export function formatWeight(kg: number | null, unit: 'kg' | 'lb', locale: Locale = getCurrentLocale()): string {
  return kg === null ? MISSING : formatMeasure(weightFromKg(kg, unit), unit, locale);
}

/** Canonical cm shown in the member's length unit. */
export function formatLength(cm: number | null, unit: 'cm' | 'in', locale: Locale = getCurrentLocale()): string {
  return cm === null ? MISSING : formatMeasure(lengthFromCm(cm, unit), unit, locale);
}
