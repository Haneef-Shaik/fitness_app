import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** The only two haptics Momentum uses (docs/22 §5). */
export type HapticKind = 'confirm' | 'success';
export type HapticDriver = (kind: HapticKind) => Promise<void>;
export type HapticFailureReporter = (error: unknown) => void;

/**
 * Maps a kind to the platform's own haptic. Android CONFIRM goes through the system haptics
 * engine and needs no vibrate permission. The web has no dependable haptic engine, so it stays
 * silent there and the moment's visual and spoken equivalents carry it.
 */
export function createExpoHapticDriver(os: string = Platform.OS): HapticDriver {
  return async (kind) => {
    if (os !== 'ios' && os !== 'android') return;
    if (kind === 'success') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (os === 'android') return Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
    return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
}

const expoDriver = createExpoHapticDriver();

const ignoreHapticFailure: HapticFailureReporter = () => {
  // No haptic engine, or haptics off system-wide. Nothing can be recovered here, and the moment's
  // visual and spoken equivalents have already carried it.
};

/**
 * Fire and forget. A haptic never delays or breaks the action it confirms, and a failure goes to
 * `report` instead of the caller.
 */
export function playHaptic(kind: HapticKind, driver: HapticDriver = expoDriver, report: HapticFailureReporter = ignoreHapticFailure): void {
  try {
    void driver(kind).catch(report);
  } catch (error) {
    report(error);
  }
}
