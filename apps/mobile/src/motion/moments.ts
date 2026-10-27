import { AccessibilityInfo } from 'react-native';
import { playHaptic, type HapticDriver, type HapticKind } from './haptics';

/** The moments that earn a haptic (docs/22 §5). Nothing else in the app buzzes. */
export type Moment = 'setLogged' | 'restEnded' | 'personalRecord' | 'checkedIn';

/**
 * What the screen shows for the moment, so it still lands when haptics are off or the device has
 * none: the logged chip, the finished rest timer, the record badge, the check badge.
 */
export type MomentVisual = 'loggedChip' | 'restComplete' | 'recordBadge' | 'checkBadge';

export interface MomentSpec {
  readonly haptic: HapticKind;
  readonly visual: MomentVisual;
}

export const moments: Readonly<Record<Moment, MomentSpec>> = {
  setLogged: { haptic: 'confirm', visual: 'loggedChip' },
  restEnded: { haptic: 'success', visual: 'restComplete' },
  personalRecord: { haptic: 'success', visual: 'recordBadge' },
  checkedIn: { haptic: 'success', visual: 'checkBadge' },
};

export interface MomentFeedbackOptions {
  readonly haptic?: HapticDriver;
  /** Speaks the message through TalkBack or VoiceOver. */
  readonly announce?: (message: string) => void;
  /** The member's sound and haptics preference (PRD §5.3). On until settings supply it. */
  readonly hapticsEnabled?: () => boolean;
}

/**
 * Signals a moment that has already happened. Call it only after the durable result, for example
 * after the set is saved on the device, never before. Returns false, and plays nothing, when the
 * message is blank.
 */
export type SignalMoment = (moment: Moment, message: string) => boolean;

export function createMomentFeedback(options: MomentFeedbackOptions = {}): SignalMoment {
  const announce = options.announce ?? ((message: string) => AccessibilityInfo.announceForAccessibility(message));
  const hapticsEnabled = options.hapticsEnabled ?? (() => true);
  return (moment, message) => {
    const text = message.trim();
    // A haptic is never the only feedback: with no words to show and speak, nothing plays.
    if (!text) return false;
    announce(text);
    if (hapticsEnabled()) playHaptic(moments[moment].haptic, options.haptic);
    return true;
  };
}

export const signalMoment = createMomentFeedback();
