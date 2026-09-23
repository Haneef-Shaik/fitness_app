/**
 * docs/05: "A visible 2 px ring with 2 px offset whenever focus is driven by an
 * external keyboard … never removed." Found in G10's keyboard pass on a phone:
 * Tab moved focus correctly, and NOTHING on screen showed where it was — the
 * `--focus-ring` token was specified and never built.
 *
 * Driven here by the same event the phone sends: Android reports keyboard
 * focus on ordinary views only as an app-wide `onHWKeyEvent` with the focused
 * view's tag (confirmed on the device; a Pressable's `onFocus` never fires).
 */
import React from 'react';
import * as RN from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { Button } from '../index';
import { HW_FOCUS_EVENT } from '../focusRing';
import { palette } from '../../theme/tokens';

// `findNodeHandle` is exported through a getter that `spyOn` cannot replace,
// so the module behind the getter is mocked: every control resolves to MINE.
const MINE = 42;
jest.mock('react-native/Libraries/ReactNative/RendererProxy', () => ({
  ...jest.requireActual('react-native/Libraries/ReactNative/RendererProxy'),
  findNodeHandle: () => 42,
}));

const hw = (eventType: 'focus' | 'blur', tag: number) =>
  act(() => { RN.DeviceEventEmitter.emit(HW_FOCUS_EVENT, { eventType, tag, eventKeyAction: -1 }); });

const ringStyle = () =>
  Object.assign({}, ...[screen.getByTestId('focus-ring').props.style].flat(Infinity).filter(Boolean));

describe('the keyboard focus ring', () => {
  it('is absent until the control has focus', () => {
    render(<Button title="Log food" onPress={jest.fn()} />);
    expect(screen.queryByTestId('focus-ring')).toBeNull();
  });

  it('appears on focus, 2 px, in the focus-ring colour, offset outside the control', () => {
    render(<Button title="Log food" onPress={jest.fn()} />);
    hw('focus', MINE);

    const s = ringStyle();
    expect(s.borderWidth).toBe(2);
    expect([palette.dark.focusRing, palette.light.focusRing]).toContain(s.borderColor);
    // 2 px ring + 2 px offset: the ring's inner edge sits 2 px outside the control.
    expect(s.top).toBe(-4);
    expect(s.left).toBe(-4);
  });

  it('goes away on blur', () => {
    render(<Button title="Log food" onPress={jest.fn()} />);
    hw('focus', MINE);
    hw('blur', MINE);
    expect(screen.queryByTestId('focus-ring')).toBeNull();
  });

  it('goes away when focus moves to a different control', () => {
    render(<Button title="Log food" onPress={jest.fn()} />);
    hw('focus', MINE);
    hw('focus', 7);
    expect(screen.queryByTestId('focus-ring')).toBeNull();
  });

  it('ignores focus that belongs to another control', () => {
    render(<Button title="Log food" onPress={jest.fn()} />);
    hw('focus', 7);
    expect(screen.queryByTestId('focus-ring')).toBeNull();
  });
});

describe('every Pressable in the app carries the ring', () => {
  const { Pressable } = require('../Pressable');
  const { Text } = require('react-native');

  it('shows it on keyboard focus, at the control\'s own corner radius', () => {
    render(
      <Pressable accessibilityLabel="Rolled Oats" style={{ borderRadius: 16 }}>
        <Text>Rolled Oats</Text>
      </Pressable>,
    );
    hw('focus', MINE);
    expect(ringStyle().borderRadius).toBe(16 + 4);
  });

  it('keeps function children and function styles working', () => {
    render(
      <Pressable accessibilityLabel="Row" style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.5 : 1 })}>
        {({ pressed }: { pressed: boolean }) => <Text>{pressed ? 'down' : 'up'}</Text>}
      </Pressable>,
    );
    expect(screen.getByText('up')).toBeTruthy();
  });

  it('is the only Pressable screens use — a raw one cannot come back', () => {
    // The ring lives in one component. A screen importing Pressable straight
    // from react-native would be a control a keyboard user cannot see.
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const { sync: glob } = require('glob');
    const root = join(__dirname, '..', '..', '..');
    const allowed = new Set(['src/ui/Pressable.tsx', 'src/ui/index.tsx']);
    const offenders = glob('{app,src}/**/*.tsx', { cwd: root })
      .filter((f: string) => !f.includes('__tests__') && !allowed.has(f))
      .filter((f: string) => /import\s*{[^}]*\bPressable\b[^}]*}\s*from\s*'react-native'/s
        .test(readFileSync(join(root, f), 'utf8')));
    expect(offenders).toEqual([]);
  });
});

describe('a button leaves room around its label (found on the phone in G10)', () => {
  // The shared Button had NO horizontal padding: a small button was exactly as
  // wide as its words — "Try again", "Recipes", "Copy this day" touched their
  // own borders.
  it.each(['md', 'sm'] as const)('%s buttons pad their label', (size) => {
    render(<Button title="Try again" size={size} onPress={jest.fn()} />);
    const style = RN.StyleSheet.flatten(
      (screen.getByLabelText('Try again').props.style as unknown),
    ) as { paddingHorizontal?: number };
    expect(style.paddingHorizontal).toBeGreaterThanOrEqual(14);
  });
});
