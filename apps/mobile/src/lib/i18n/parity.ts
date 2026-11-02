import type { CalendarNames } from './calendar';
import type { PluralForms } from './plurals';
import { placeholders } from './translate';

type Catalog = Readonly<Record<string, string>>;
type PluralCatalog = Readonly<Record<string, PluralForms>>;
interface Names { readonly reference: string; readonly translation: string }

const DEFAULT_NAMES: Names = { reference: 'en', translation: 'hi' };
const has = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

function keyProblems(reference: object, translation: object, names: Names): string[] {
  return [
    ...Object.keys(reference).filter((key) => !has(translation, key)).map((key) => `${names.translation} is missing "${key}"`),
    ...Object.keys(translation).filter((key) => !has(reference, key)).map((key) => `${names.translation} has extra "${key}"`),
  ];
}

/**
 * Everything that would make a translated screen wrong: a key only one language has, empty copy,
 * or placeholders that differ ({value} in English but not in Hindi). An empty list means parity.
 */
export function catalogProblems(reference: Catalog, translation: Catalog, names: Names = DEFAULT_NAMES): string[] {
  const problems = keyProblems(reference, translation, names);
  for (const [name, catalog] of [[names.reference, reference], [names.translation, translation]] as const) {
    for (const [key, value] of Object.entries(catalog)) if (value.trim() === '') problems.push(`${name}.${key} is empty`);
  }
  for (const [key, value] of Object.entries(reference)) {
    const translated = translation[key];
    if (translated === undefined) continue;
    const expected = placeholders(value).join(','); const actual = placeholders(translated).join(',');
    if (expected !== actual) {
      problems.push(`"${key}" placeholders differ: ${names.reference} {${expected}} · ${names.translation} {${actual}}`);
    }
  }
  return problems;
}

/** Counted nouns: same keys, and every form non-empty with a {count}. */
export function pluralCatalogProblems(reference: PluralCatalog, translation: PluralCatalog, names: Names = DEFAULT_NAMES): string[] {
  const problems = keyProblems(reference, translation, names);
  for (const [name, catalog] of [[names.reference, reference], [names.translation, translation]] as const) {
    for (const [key, forms] of Object.entries(catalog)) {
      for (const form of ['one', 'other'] as const) {
        const text = forms[form];
        if (text.trim() === '') problems.push(`${name}.${key}.${form} is empty`);
        else if (!placeholders(text).includes('count')) problems.push(`${name}.${key}.${form} has no {count}`);
      }
    }
  }
  return problems;
}

/** Twelve months and seven weekdays in every width, none empty. */
export function calendarProblems(reference: CalendarNames, translation: CalendarNames, names: Names = DEFAULT_NAMES): string[] {
  const problems: string[] = [];
  const sizes = { monthsShort: 12, monthsLong: 12, weekdaysNarrow: 7, weekdaysShort: 7, weekdaysLong: 7 } as const;
  for (const [name, calendar] of [[names.reference, reference], [names.translation, translation]] as const) {
    for (const [field, size] of Object.entries(sizes) as [keyof CalendarNames, number][]) {
      const values = calendar[field];
      if (values.length !== size) problems.push(`${name}.${field} needs ${size} names`);
      else if (values.some((value) => value.trim() === '')) problems.push(`${name}.${field} has an empty name`);
    }
  }
  return problems;
}
