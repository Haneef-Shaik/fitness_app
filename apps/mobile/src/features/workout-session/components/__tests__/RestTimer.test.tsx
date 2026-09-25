/**
 * E-04 — the end of a rest is spoken.
 *
 * G10's TalkBack session: between sets TalkBack's focus sits on "Save set", so
 * the timer's own label changing to "Rest complete" was never read — the rest
 * ended in silence for anyone not looking at the screen.
 */
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { RestTimer } from '../RestTimer';

const T0 = new Date('2026-09-25T10:00:00Z');

beforeEach(() => {
  // jest-expo's AccessibilityInfo is already a mock, so spyOn returns it as-is
  // and its calls would carry over from the previous test.
  jest.clearAllMocks();
  jest.useFakeTimers({ now: T0 });
  jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const props = (targetIso: string) => ({
  targetIso, totalSeconds: 30, onDismiss: jest.fn(), onAdjust: jest.fn(),
});

describe('RestTimer', () => {
  it('announces "Rest complete" once, when the rest runs out', () => {
    render(<RestTimer {...props(new Date(T0.getTime() + 30_000).toISOString())} />);
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(31_000); });
    act(() => { jest.advanceTimersByTime(5_000); });

    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledTimes(1);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Rest complete');
  });

  it('says nothing for a rest that was already over when it appeared', () => {
    render(<RestTimer {...props(new Date(T0.getTime() - 1_000).toISOString())} />);
    act(() => { jest.advanceTimersByTime(2_000); });
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
  });

  it('says the new time when the rest is adjusted — the change was silent', () => {
    const p = props(new Date(T0.getTime() + 60_000).toISOString());
    render(<RestTimer {...p} />);
    fireEvent.press(screen.getByLabelText('Add 15 seconds'));
    expect(p.onAdjust).toHaveBeenCalledWith(15);
    expect(AccessibilityInfo.announceForAccessibility)
      .toHaveBeenCalledWith('1 minute 15 seconds of rest left');
  });
});
