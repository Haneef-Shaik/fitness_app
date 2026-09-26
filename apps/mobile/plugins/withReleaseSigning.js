/**
 * Store builds are signed with the upload key; nothing else changes.
 *
 * `expo prebuild` generates android/ (it is not committed) with the release
 * build type signed by the DEBUG key. This plugin adds a `release` signing
 * config read from the environment and uses it when — and only when — the key
 * is given:
 *
 *   FITLOG_UPLOAD_STORE_FILE      absolute path to the upload keystore
 *   FITLOG_UPLOAD_STORE_PASSWORD
 *   FITLOG_UPLOAD_KEY_ALIAS
 *   FITLOG_UPLOAD_KEY_PASSWORD
 *
 * The key and its passwords never enter the repo. Without them a release build
 * still builds, debug-signed, as the G10 measurement builds were.
 * `scripts/build-release-apk.sh` with STORE=1 refuses to run without them.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARK = "System.getenv('FITLOG_UPLOAD_STORE_FILE')";

const RELEASE_CONFIG = `
        release {
            if (${MARK}) {
                storeFile file(${MARK})
                storePassword System.getenv('FITLOG_UPLOAD_STORE_PASSWORD')
                keyAlias System.getenv('FITLOG_UPLOAD_KEY_ALIAS')
                keyPassword System.getenv('FITLOG_UPLOAD_KEY_PASSWORD')
            }
        }`;

/** The transform itself, pure so it can be tested without a prebuild. */
function applyReleaseSigning(contents) {
  if (contents.includes(MARK)) return contents;

  const debugConfig = /(signingConfigs \{\n\s+debug \{[\s\S]*?\n\s{8}\})/;
  if (!debugConfig.test(contents)) {
    throw new Error('withReleaseSigning: no signingConfigs { debug { … } } block to extend');
  }
  let out = contents.replace(debugConfig, `$1${RELEASE_CONFIG}`);

  const releaseType = /(release \{[^{}]*?)signingConfig signingConfigs\.debug/;
  if (!releaseType.test(out)) {
    throw new Error('withReleaseSigning: the release build type does not name signingConfigs.debug');
  }
  out = out.replace(
    releaseType,
    `$1signingConfig ${MARK} ? signingConfigs.release : signingConfigs.debug`,
  );
  return out;
}

const withReleaseSigning = (config) =>
  withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = applyReleaseSigning(cfg.modResults.contents);
    return cfg;
  });

module.exports = withReleaseSigning;
module.exports.applyReleaseSigning = applyReleaseSigning;
