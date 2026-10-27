import { AccessibilityInfo } from 'react-native';
import { t } from '@/lib/i18n';
import { createMomentFeedback, moments } from '../moments';

function harness(hapticsEnabled = true) {
  const haptic = jest.fn(async () => {});
  const announce = jest.fn();
  return { haptic, announce, signal: createMomentFeedback({ haptic, announce, hapticsEnabled: () => hapticsEnabled }) };
}

describe('haptic moments (docs/22 §5)', () => {
  it.each([
    ['setLogged', 'confirm', 'loggedChip'],
    ['restEnded', 'success', 'restComplete'],
    ['personalRecord', 'success', 'recordBadge'],
    ['checkedIn', 'success', 'checkBadge'],
  ] as const)('%s plays %s once, and is also spoken and shown as %s', (moment, haptic, visual) => {
    expect(moments[moment]).toEqual({ haptic, visual });
    const h = harness();
    expect(h.signal(moment, t('setLogged'))).toBe(true);
    expect(h.haptic.mock.calls).toEqual([[haptic]]);
    expect(h.announce.mock.calls).toEqual([[t('setLogged')]]);
  });

  it('covers exactly the four Momentum moments', () => {
    expect(Object.keys(moments).sort()).toEqual(['checkedIn', 'personalRecord', 'restEnded', 'setLogged']);
  });

  it('never plays a haptic without words to show and speak', () => {
    const h = harness();
    expect(h.signal('restEnded', '   ')).toBe(false);
    expect(h.haptic).not.toHaveBeenCalled();
    expect(h.announce).not.toHaveBeenCalled();
  });

  it('still speaks the moment when the member has turned haptics off', () => {
    const h = harness(false);
    expect(h.signal('personalRecord', '  New record  ')).toBe(true);
    expect(h.haptic).not.toHaveBeenCalled();
    expect(h.announce).toHaveBeenCalledWith('New record');
  });

  it('speaks through TalkBack or VoiceOver by default', () => {
    const signal = createMomentFeedback({ haptic: jest.fn(async () => {}) });
    signal('checkedIn', 'You’re in');
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('You’re in');
  });

  it('keeps going when the haptic engine fails', () => {
    const signal = createMomentFeedback({ haptic: async () => { throw new Error('No haptic engine'); }, announce: jest.fn() });
    expect(() => signal('setLogged', t('setLogged'))).not.toThrow();
  });
});
