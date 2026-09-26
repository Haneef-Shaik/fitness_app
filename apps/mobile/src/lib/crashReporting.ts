/**
 * Crash reporting (Sentry) — on only when `EXPO_PUBLIC_SENTRY_DSN` is set at
 * build time, and never with personal data.
 *
 * The server's rule (02 §8, `app/observability/crash_reporting.py`) holds here
 * too: a crash report is a log line that leaves the phone, so it carries no
 * emails, no tokens, no URL query strings (an upload URL's query IS its
 * signature) and no request bodies. Sentry's own switches do most of it;
 * `scrubEvent` is the part that does not depend on remembering which switch
 * covers which field, and it returns a NEW event — what it is handed is not
 * touched.
 *
 * Off by default, like the API's: a development build, Expo Go and Jest send
 * nothing, and `wrapRoot` hands the layout back unwrapped.
 *
 * NOTE: `process.env.EXPO_PUBLIC_*` is inlined at BUILD time by
 * babel-preset-expo (see `src/lib/api.ts`). Setting the DSN after Metro has
 * started does nothing; rebuild. The default parameters below are written as
 * the literal member expressions for exactly that reason.
 */
import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';

const FILTERED = '[Filtered]';

/** Keys whose VALUE is a secret, wherever they appear. */
const SECRET_KEY = /password|passwd|secret|token|authorization|cookie|api_?key|signature/i;

/** Dropped outright: a request's body and cookies, a breadcrumb's query. */
const DROPPED_KEYS = new Set(['data', 'cookies', 'query_string', 'http.query', 'http.fragment']);

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const JWT = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g;
const URL_QUERY = /(https?:\/\/[^\s?#"']+)[?#][^\s"']*/g;

function scrubText(text: string): string {
  return text.replace(URL_QUERY, '$1').replace(JWT, '[token]').replace(EMAIL, '[email]');
}

function scrubValue(value: unknown, dropData: boolean): unknown {
  if (typeof value === 'string') return scrubText(value);
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, dropData));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (dropData && DROPPED_KEYS.has(key)) continue;
      out[key] = SECRET_KEY.test(key) ? FILTERED : scrubValue(v, false);
    }
    return out;
  }
  return value;
}

/** Recursively: secrets filtered, emails, tokens and URL queries replaced. */
function scrub<T>(value: T): T {
  return scrubValue(value, false) as T;
}

type AnyEvent = Record<string, unknown> & {
  request?: Record<string, unknown>;
  user?: Record<string, unknown>;
};

/** `beforeSend`: the event without personal data. Never drops it. */
export function scrubEvent<E extends AnyEvent>(event: E): E {
  const cleaned = scrub(event) as AnyEvent;
  const out: AnyEvent = { ...cleaned };
  if (cleaned.request) {
    const { headers: _headers, ...rest } = scrubValue(cleaned.request, true) as Record<string, unknown>;
    // No headers at all: the client's own are the bearer token and nothing
    // a crash needs.
    out.request = rest;
  }
  if (cleaned.user) {
    // The id is how a report meets a support request; nothing else.
    out.user = 'id' in cleaned.user ? { id: cleaned.user.id } : {};
  }
  return out as E;
}

/** `beforeBreadcrumb`: the same rules, at the moment a breadcrumb is recorded. */
export function scrubBreadcrumb<B extends Record<string, unknown>>(breadcrumb: B): B {
  const cleaned = scrub(breadcrumb) as Record<string, unknown>;
  const data = cleaned.data;
  if (data && typeof data === 'object') {
    return { ...cleaned, data: scrubValue(data, true) } as unknown as B;
  }
  return cleaned as B;
}

let enabled = false;

/** Whether `initCrashReporting` turned Sentry on in this process. */
export const crashReportingEnabled = () => enabled;

export function initCrashReporting(
  dsn: string | undefined = process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: string | undefined = process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT,
): boolean {
  if (!dsn) return false;
  Sentry.init({
    dsn,
    environment: environment || (__DEV__ ? 'development' : 'production'),
    sendDefaultPii: false,
    // Pictures of the screen are pictures of somebody's meals and body.
    attachScreenshot: false,
    attachViewHierarchy: false,
    // Would attach request and response details of every failed call.
    enableCaptureFailedRequests: false,
    // Errors only: tracing is a second data stream with its own PII surface.
    tracesSampleRate: 0,
    beforeSend: (event) => scrubEvent(event as unknown as AnyEvent) as unknown as typeof event,
    beforeBreadcrumb: (breadcrumb) =>
      scrubBreadcrumb(breadcrumb as unknown as Record<string, unknown>) as unknown as typeof breadcrumb,
  });
  enabled = true;
  return true;
}

/**
 * The root layout, wrapped when crash reporting is on (touch breadcrumbs and
 * the root boundary). Unwrapped otherwise, so development and Jest render the
 * same tree they always did.
 */
export function wrapRoot<P extends Record<string, unknown>>(
  Root: ComponentType<P>,
  dsn: string | undefined = process.env.EXPO_PUBLIC_SENTRY_DSN,
): ComponentType<P> {
  return dsn ? (Sentry.wrap(Root) as ComponentType<P>) : Root;
}
