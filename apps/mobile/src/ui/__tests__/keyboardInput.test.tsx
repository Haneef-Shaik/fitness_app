/**
 * A text field a hardware keyboard can reach.
 *
 * Found in G10's keyboard pass on a phone: on "Add food", Tab stopped dead on
 * Back. React Native 0.76's Android TextInput refuses every focus request from
 * the OS (ReactEditText.requestFocus is a deliberate no-op — "its focus is
 * controlled by JS"), so keyboard navigation could never enter ANY text field:
 * not search, not sign-in, not the logger's load and reps.
 *
 * The bridge is a focusable wrapper. When keyboard focus lands on it (Android
 * reports that as the app-wide `onHWKeyEvent`), it focuses the input from JS —
 * the one route the platform accepts.
 */
import React from 'react';
import * as RN from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { HW_FOCUS_EVENT } from '../focusRing';
import { TextInput } from '../TextInput';

const WRAPPER = 1;
const INPUT = 2;
jest.mock('react-native/Libraries/ReactNative/RendererProxy', () => ({
  ...jest.requireActual('react-native/Libraries/ReactNative/RendererProxy'),
  findNodeHandle: (inst: { props?: { testID?: string } } | null) =>
    inst?.props?.testID === 'keyboard-bridge' ? 1 : inst?.props?.testID === 'field' ? 2 : 99,
}));

// The mocked TextInput shares one `focus` jest.fn across instances.
beforeEach(() => jest.clearAllMocks());

const hw = (tag: number) =>
  act(() => { RN.DeviceEventEmitter.emit(HW_FOCUS_EVENT, { eventType: 'focus', tag, eventKeyAction: -1 }); });

function inputInstance() {
  return screen.UNSAFE_getByType(RN.TextInput).instance as { focus: jest.Mock };
}

describe('a hardware keyboard can reach a text field', () => {
  it('hands keyboard focus from the wrapper to the input', () => {
    render(<TextInput testID="field" accessibilityLabel="Search foods" />);
    hw(99);          // focus was on something before the field
    hw(WRAPPER);     // Tab lands on the wrapper
    expect(inputInstance().focus).toHaveBeenCalledTimes(1);
  });

  it('does not bounce focus back in when leaving the field backwards', () => {
    // Shift+Tab out of the input lands on the wrapper first; pulling focus
    // straight back into the input would trap the user in the field.
    render(<TextInput testID="field" accessibilityLabel="Search foods" />);
    hw(INPUT);
    hw(WRAPPER);
    expect(inputInstance().focus).not.toHaveBeenCalled();
  });

  it('ignores focus that lands elsewhere', () => {
    render(<TextInput testID="field" accessibilityLabel="Search foods" />);
    hw(99);
    expect(inputInstance().focus).not.toHaveBeenCalled();
  });

  it('is invisible to a screen reader — the input keeps its own name', () => {
    render(<TextInput testID="field" accessibilityLabel="Search foods" />);
    const bridge = screen.getByTestId('keyboard-bridge');
    expect(bridge.props.importantForAccessibility).toBe('no');
    expect(bridge.props.focusable).toBe(true);
    expect(screen.getByLabelText('Search foods')).toBeTruthy();
  });

  it('moves layout styles to the wrapper so the field keeps its size', () => {
    render(<TextInput testID="field" style={{ flex: 1, marginTop: 4, color: 'red' }} />);
    const outer = RN.StyleSheet.flatten(screen.getByTestId('keyboard-bridge').props.style);
    const inner = RN.StyleSheet.flatten(screen.getByTestId('field').props.style);
    expect(outer).toMatchObject({ flex: 1, marginTop: 4 });
    expect(inner.color).toBe('red');
    expect(inner.flex).toBeUndefined();
  });

  it('is the only TextInput screens use — a raw one cannot come back', () => {
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const { sync: glob } = require('glob');
    const root = join(__dirname, '..', '..', '..');
    const offenders = glob('{app,src}/**/*.tsx', { cwd: root })
      .filter((f: string) => !f.includes('__tests__') && f !== 'src/ui/TextInput.tsx')
      .filter((f: string) => /import\s*{[^}]*\bTextInput\b[^}]*}\s*from\s*'react-native'/s
        .test(readFileSync(join(root, f), 'utf8')));
    expect(offenders).toEqual([]);
  });
});
