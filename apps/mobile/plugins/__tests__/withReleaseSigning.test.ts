/**
 * A store build is signed with the upload key, never the debug key — and a
 * developer build without that key still builds (TODO §2, after G10).
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { applyReleaseSigning } = require('../withReleaseSigning');

const GENERATED = `
android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
            shrinkResources (findProperty('android.enableShrinkResourcesInReleaseBuilds')?.toBoolean() ?: false)
        }
    }
}`;

describe('withReleaseSigning', () => {
  const out = applyReleaseSigning(GENERATED);

  it('declares a release signing config read from the environment, never from the repo', () => {
    expect(out).toMatch(/release \{\n\s+if \(System\.getenv\('VOLT_UPLOAD_STORE_FILE'\)\)/);
    for (const v of ['VOLT_UPLOAD_STORE_FILE', 'VOLT_UPLOAD_STORE_PASSWORD', 'VOLT_UPLOAD_KEY_ALIAS', 'VOLT_UPLOAD_KEY_PASSWORD']) {
      expect(out).toContain(`System.getenv('${v}')`);
    }
  });

  it('signs a release build with it when the key is given, and only the release build', () => {
    expect(out).toContain("signingConfig System.getenv('VOLT_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug");
    // The debug build type keeps the debug key.
    expect(out).toMatch(/debug \{\n\s+signingConfig signingConfigs\.debug\n/);
  });

  it('is idempotent — prebuild may run it on an already-patched file', () => {
    expect(applyReleaseSigning(out)).toBe(out);
  });

  it('refuses to guess on a file it does not recognise', () => {
    expect(() => applyReleaseSigning('android { }')).toThrow(/signingConfigs/);
  });
});
