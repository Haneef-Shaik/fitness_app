import { en, type CopyKey } from './en';
import { hi } from './hi';
import { getCurrentLocale, type Locale } from './locale';

export type CopyParams = Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{(\w+)\}/g;

/** Looks a key up in the current language's catalog; the account or device sets the language. */
export function t(key: CopyKey, locale: Locale = getCurrentLocale()): string {
  return (locale === 'hi' ? hi : en)[key];
}

/** Replaces {name} with params.name. Unknown names stay visible rather than vanishing. */
export function interpolate(template: string, params: CopyParams): string {
  return template.replace(PLACEHOLDER, (match: string, name: string) => (
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  ));
}

/** t() for copy with named values. Format numbers, dates and money before passing them in. */
export function tf(key: CopyKey, params: CopyParams, locale: Locale = getCurrentLocale()): string {
  return interpolate(t(key, locale), params);
}

/** Sorted placeholder names in a piece of copy, for parity checks. */
export function placeholders(text: string): string[] {
  const names: string[] = [];
  const pattern = new RegExp(PLACEHOLDER.source, 'g');
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) names.push(match[1] ?? '');
  return names.sort();
}
