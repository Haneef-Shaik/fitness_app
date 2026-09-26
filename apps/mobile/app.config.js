/**
 * The store-facing numbers, set per build rather than by hand-editing app.json.
 *
 * Both stores refuse an upload whose build number is not higher than the last
 * one, and a version bumped by hand is the one that gets forgotten. CI (or EAS,
 * which manages them remotely — see eas.json) passes them in:
 *
 *   FITLOG_VERSION        the user-facing version, e.g. 1.0.0
 *   FITLOG_BUILD_NUMBER   a positive integer that only ever goes up; becomes
 *                         Android's versionCode and iOS's buildNumber
 *
 * Unset, app.json's values stand, as they always have for development.
 */
module.exports = ({ config }) => {
  const version = process.env.FITLOG_VERSION || config.version;
  const build = process.env.FITLOG_BUILD_NUMBER;
  if (build !== undefined && !/^[1-9]\d*$/.test(build)) {
    throw new Error(`FITLOG_BUILD_NUMBER must be a positive integer, got "${build}"`);
  }
  return {
    ...config,
    version,
    // Placeholder artwork from scripts/make-icons.py until the real icon exists;
    // replacing the PNGs is the whole change.
    icon: config.icon ?? './assets/icon.png',
    ios: {
      ...config.ios,
      ...(build ? { buildNumber: build } : {}),
      infoPlist: {
        ...config.ios?.infoPlist,
        // HTTPS only, no custom cryptography: exempt from export documentation,
        // so App Store Connect stops asking on every upload.
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      ...config.android,
      adaptiveIcon: {
        backgroundColor: '#0E0F11',
        ...config.android?.adaptiveIcon,
        foregroundImage: config.android?.adaptiveIcon?.foregroundImage ?? './assets/adaptive-icon.png',
      },
      ...(build ? { versionCode: Number(build) } : {}),
      // Permissions FitLog never uses, which Play review asks about all the same:
      // the microphone (the image picker's video mode) and drawing over other
      // apps (a development overlay). Photos come from the system photo picker.
      blockedPermissions: [
        ...(config.android?.blockedPermissions ?? []),
        'android.permission.RECORD_AUDIO',
        'android.permission.SYSTEM_ALERT_WINDOW',
        // expo-secure-store declares these for biometric-gated items; FitLog
        // stores its refresh token without `requireAuthentication`, so they
        // would only be a question on the Play form with no feature behind it.
        'android.permission.USE_BIOMETRIC',
        'android.permission.USE_FINGERPRINT',
      ],
    },
  };
};
