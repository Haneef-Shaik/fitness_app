/**
 * Crash reports from the phone carry no personal data, and are only sent when a
 * build was given a DSN. `@sentry/react-native` is mocked in jest.setup.ts —
 * its native module does not exist under Jest — so these assert what the app
 * asks of it, and what the scrubber leaves.
 */
import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';
import {
  crashReportingEnabled, initCrashReporting, scrubBreadcrumb, scrubEvent, wrapRoot,
} from '../crashReporting';

const EMAIL = 'someone@example.com';
const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl';

const event = () => ({
  message: `sign-in failed for ${EMAIL}`,
  exception: { values: [{ type: 'ApiError', value: `401 with token ${JWT}` }] },
  request: {
    url: 'https://api.fitlog.app/v1/uploads/uploads/u/1.jpg?size=9&exp=1&sig=SECRET',
    data: { email: EMAIL, password: 'hunter2' },
    cookies: { session: 'abc' },
    headers: { authorization: `Bearer ${JWT}` },
  },
  user: { id: 'u-1', email: EMAIL, ip_address: '203.0.113.9' },
  extra: { refresh_token: 'rt-123' },
  breadcrumbs: [
    { category: 'fetch', data: { url: 'https://api.fitlog.app/v1/auth/login?next=x', method: 'POST' } },
    { category: 'console', message: `logged in as ${EMAIL}` },
  ],
});

describe('scrubEvent', () => {
  it('leaves no email, token or signature anywhere', () => {
    const sent = JSON.stringify(scrubEvent(event()));

    for (const leaked of [EMAIL, JWT, 'SECRET', 'hunter2', 'rt-123', 'session']) {
      expect(sent).not.toContain(leaked);
    }
  });

  it('keeps the request URL, without its query, and nothing else of the request', () => {
    expect(scrubEvent(event()).request).toEqual({
      url: 'https://api.fitlog.app/v1/uploads/uploads/u/1.jpg',
    });
  });

  it('keeps the user as their id and nothing more', () => {
    expect(scrubEvent(event()).user).toEqual({ id: 'u-1' });
  });

  it('filters a secret by its name', () => {
    expect(scrubEvent(event()).extra).toEqual({ refresh_token: '[Filtered]' });
  });

  it('still sends the error, with its type', () => {
    const scrubbed = scrubEvent(event());

    expect(scrubbed.exception.values[0]!.type).toBe('ApiError');
    expect(scrubbed.message).toBe('sign-in failed for [email]');
  });

  it('changes nothing it was handed', () => {
    const original = event();
    const before = JSON.parse(JSON.stringify(original));

    scrubEvent(original);

    expect(original).toEqual(before);
  });
});

describe('scrubBreadcrumb', () => {
  it('cuts the query from a request breadcrumb and keeps what it did', () => {
    expect(scrubBreadcrumb({
      category: 'fetch',
      data: { url: 'https://api.fitlog.app/v1/uploads/k?sig=SECRET', method: 'PUT', 'http.query': 'sig=SECRET' },
    })).toEqual({
      category: 'fetch',
      data: { url: 'https://api.fitlog.app/v1/uploads/k', method: 'PUT' },
    });
  });

  it('replaces an email in a console breadcrumb', () => {
    expect(scrubBreadcrumb({ category: 'console', message: `hello ${EMAIL}` }).message)
      .toBe('hello [email]');
  });
});

describe('initCrashReporting', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does nothing without a DSN — development, Expo Go and this suite', () => {
    expect(initCrashReporting(undefined, undefined)).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('with a DSN, sends no PII, no screenshots and no failed-request details', () => {
    expect(initCrashReporting('https://public@o0.ingest.sentry.io/0', 'staging')).toBe(true);

    const options = (Sentry.init as jest.Mock).mock.calls[0][0];
    expect(options).toMatchObject({
      dsn: 'https://public@o0.ingest.sentry.io/0',
      environment: 'staging',
      sendDefaultPii: false,
      attachScreenshot: false,
      attachViewHierarchy: false,
      enableCaptureFailedRequests: false,
      tracesSampleRate: 0,
    });
    expect(crashReportingEnabled()).toBe(true);
  });

  it('routes every event and breadcrumb through the scrubbers', () => {
    initCrashReporting('https://public@o0.ingest.sentry.io/0', 'staging');
    const options = (Sentry.init as jest.Mock).mock.calls[0][0];

    expect(JSON.stringify(options.beforeSend(event()))).not.toContain(EMAIL);
    expect(options.beforeBreadcrumb({ message: EMAIL }).message).toBe('[email]');
  });
});

describe('wrapRoot', () => {
  const Root: ComponentType<Record<string, unknown>> = () => null;

  it('hands the layout back untouched without a DSN', () => {
    expect(wrapRoot(Root, undefined)).toBe(Root);
    expect(Sentry.wrap).not.toHaveBeenCalled();
  });

  it('wraps it when crash reporting is on', () => {
    wrapRoot(Root, 'https://public@o0.ingest.sentry.io/0');

    expect(Sentry.wrap).toHaveBeenCalledWith(Root);
  });
});
