import * as Haptics from 'expo-haptics';
import { createExpoHapticDriver, playHaptic } from '../haptics';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  performAndroidHapticsAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Soft: 'soft', Rigid: 'rigid' },
  AndroidHaptics: { Confirm: 'confirm', Reject: 'reject' },
}));

const flush = () => new Promise<void>((resolve) => { setTimeout(resolve, 0); });

function allHapticCalls() {
  return [
    ...jest.mocked(Haptics.impactAsync).mock.calls.map((call) => ['impact', ...call]),
    ...jest.mocked(Haptics.notificationAsync).mock.calls.map((call) => ['notification', ...call]),
    ...jest.mocked(Haptics.performAndroidHapticsAsync).mock.calls.map((call) => ['android', ...call]),
  ];
}

describe('expo haptic driver', () => {
  it('confirms with the Android CONFIRM haptic, which needs no vibrate permission', async () => {
    await createExpoHapticDriver('android')('confirm');
    expect(allHapticCalls()).toEqual([['android', 'confirm']]);
  });

  it('confirms with a light impact on iOS', async () => {
    await createExpoHapticDriver('ios')('confirm');
    expect(allHapticCalls()).toEqual([['impact', 'light']]);
  });

  it.each(['ios', 'android'])('signals success with the success notification on %s', async (os) => {
    await createExpoHapticDriver(os)('success');
    expect(allHapticCalls()).toEqual([['notification', 'success']]);
  });

  it.each(['confirm', 'success'] as const)('stays silent on the web for %s', async (kind) => {
    await createExpoHapticDriver('web')(kind);
    expect(allHapticCalls()).toEqual([]);
  });
});

describe('playHaptic', () => {
  it('returns before the haptic settles, so it never delays the action it confirms', () => {
    const driver = jest.fn(() => new Promise<void>(() => {}));
    expect(playHaptic('confirm', driver)).toBeUndefined();
    expect(driver).toHaveBeenCalledWith('confirm');
  });

  it('reports a failed haptic instead of passing it to the caller', async () => {
    const failure = new Error('No haptic engine');
    const report = jest.fn();
    expect(() => playHaptic('success', async () => { throw failure; }, report)).not.toThrow();
    await flush();
    expect(report).toHaveBeenCalledWith(failure);
  });

  it('reports a driver that throws before returning a promise', () => {
    const failure = new Error('Unavailable');
    const report = jest.fn();
    expect(() => playHaptic('confirm', () => { throw failure; }, report)).not.toThrow();
    expect(report).toHaveBeenCalledWith(failure);
  });
});
