/**
 * The build numbers the stores check. A number that does not rise is a rejected
 * upload; a non-number would be a confusing one.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBuildNumbers = require('../../app.config.js') as (a: { config: Record<string, unknown> }) => Record<string, any>;

const BASE = { name: 'FitLog', version: '0.1.0', ios: { bundleIdentifier: 'com.fitlog.app' }, android: { package: 'com.fitlog.app' } };

afterEach(() => { delete process.env.FITLOG_VERSION; delete process.env.FITLOG_BUILD_NUMBER; });

it('leaves app.json\'s numbers alone when nothing is passed', () => {
  const out = withBuildNumbers({ config: BASE });
  expect(out.version).toBe('0.1.0');
  expect(out.android.versionCode).toBeUndefined();
  expect(out.ios.buildNumber).toBeUndefined();
});

it('declares export compliance and blocks permissions FitLog never uses', () => {
  const out = withBuildNumbers({ config: BASE });
  expect(out.ios.infoPlist.ITSAppUsesNonExemptEncryption).toBe(false);
  expect(out.android.blockedPermissions).toEqual(
    expect.arrayContaining([
      'android.permission.RECORD_AUDIO', 'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.USE_BIOMETRIC', 'android.permission.USE_FINGERPRINT',
    ]),
  );
});

it('sets the version and both stores\' build numbers together', () => {
  process.env.FITLOG_VERSION = '1.0.0';
  process.env.FITLOG_BUILD_NUMBER = '42';
  const out = withBuildNumbers({ config: BASE });
  expect(out.version).toBe('1.0.0');
  expect(out.android.versionCode).toBe(42);
  expect(out.ios.buildNumber).toBe('42');
});

it('refuses a build number the stores would not accept', () => {
  process.env.FITLOG_BUILD_NUMBER = '1.2';
  expect(() => withBuildNumbers({ config: BASE })).toThrow(/positive integer/);
});
