/**
 * A text field a hardware keyboard can reach — one stop per field, both ways.
 *
 * G10 (RN 0.76): Tab could not enter ANY text field — ReactEditText.requestFocus
 * was a deliberate no-op — so a focusable wrapper took keyboard focus and
 * handed it to the input from JS. RN 0.86 carries the upstream fix
 * (react-native#48547): the input takes the OS's focus itself. The wrapper then
 * became a second, invisible stop — on the emulator (26 Sep) every Shift+Tab
 * into a field landed on it first, drawn as a grey box that took no typing.
 *
 * So the wrapper is layout and naming only now, and never a keyboard stop. The
 * traversal itself is native: it was walked on the emulator's hardware keyboard
 * (Back → email → password → "Forgot password?" and back again, one stop each).
 */
import React from 'react';
import * as RN from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { HW_FOCUS_EVENT } from '../focusRing';
import { TextInput } from '../TextInput';

// Node handles for the wrapper (either name it has had) and the input, so a
// focus event can be addressed to the wrapper the way Android addresses it.
jest.mock('react-native/Libraries/ReactNative/RendererProxy', () => ({
  ...jest.requireActual('react-native/Libraries/ReactNative/RendererProxy'),
  findNodeHandle: (inst: { props?: { testID?: string } } | null) =>
    ['keyboard-bridge', 'field-frame'].includes(inst?.props?.testID ?? '') ? 1
      : inst?.props?.testID === 'field' ? 2 : 99,
}));

// The mocked TextInput shares one `focus` jest.fn across instances.
beforeEach(() => jest.clearAllMocks());

function inputInstance() {
  return screen.UNSAFE_getByType(RN.TextInput).instance as { focus: jest.Mock };
}

describe('a hardware keyboard reaches a text field in one stop', () => {
  it('the wrapper is not a keyboard stop — only the input is', () => {
    render(<TextInput testID="field" accessibilityLabel="Search foods" />);
    expect(screen.getByTestId('field-frame').props.focusable).toBeFalsy();
  });

  it('never pulls focus into the input from JS', () => {
    // The old bridge did, and on 0.86 that fought the OS's own focus.
    render(<TextInput testID="field" accessibilityLabel="Search foods" />);
    const hw = (tag: number) =>
      act(() => { RN.DeviceEventEmitter.emit(HW_FOCUS_EVENT, { eventType: 'focus', tag, eventKeyAction: -1 }); });
    hw(99);  // focus was elsewhere…
    hw(1);   // …and an event names the wrapper
    expect(inputInstance().focus).not.toHaveBeenCalled();
  });

  it('is invisible to a screen reader — the input keeps its own name', () => {
    render(<TextInput testID="field" accessibilityLabel="Search foods" />);
    expect(screen.getByTestId('field-frame').props.importantForAccessibility).toBe('no');
    expect(screen.getByLabelText('Search foods')).toBeTruthy();
  });

  it('moves layout styles to the wrapper so the field keeps its size', () => {
    render(<TextInput testID="field" style={{ flex: 1, marginTop: 4, color: 'red' }} />);
    const outer = RN.StyleSheet.flatten(screen.getByTestId('field-frame').props.style);
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
