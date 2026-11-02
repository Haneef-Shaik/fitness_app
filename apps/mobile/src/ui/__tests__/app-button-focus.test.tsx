import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ComponentProps, ReactElement } from 'react';
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { momentum, ThemeProvider, useTheme, type ColorScheme } from '@/theme';
import { contrastRatio } from '@/theme/contrast';
import { createPreferenceStore } from '@/theme/preference-store';
import type { ColorRole } from '@/theme/roles';
import { dimensions } from '@/theme/tokens';
import { AppButton } from '../AppButton';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}),
}));

/**
 * Regression for the DS-1 reviews of 27 Oct 2026 (H1) and 31 Oct 2026 (finding 1). The ring was drawn in
 * `primary`, which Dark draws in the primary fill's own lime, so focus changed nothing on screen. The
 * first correction then hid the ring on disabled and loading buttons whenever React Native reported focus
 * there. The ring is measured against the fill it is actually drawn on, at the WCAG 2.2 non-text bar
 * (SC 1.4.11), in every state in which focus can be reported.
 */
const NON_TEXT = 3;
const LABEL = 'Save set';

type ButtonProps = ComponentProps<typeof AppButton>;
type Variant = NonNullable<ButtonProps['variant']>;
type Unavailability = 'disabled' | 'loading';

const schemes = ['dark', 'light'] as const satisfies readonly ColorScheme[];
const variants = ['primary', 'secondary'] as const satisfies readonly Variant[];
const unavailabilities = ['disabled', 'loading'] as const satisfies readonly Unavailability[];

/** The fill an available button draws, and the role chosen for its ring; contrast.test.ts pins both pairs. */
const fillRole = { primary: 'primaryContainer', secondary: 'secondaryContainer' } as const satisfies Record<Variant, ColorRole>;
const ringRole = { primary: 'onPrimaryContainer', secondary: 'onSecondaryContainer' } as const satisfies Record<Variant, ColorRole>;
/** What a disabled or loading button of either variant draws: its fill, and its ring in its label colour; contrast.test.ts pins the pair. */
const unavailableRole = { fill: 'surfaceHigh', ring: 'onSurfaceVariant' } as const satisfies Record<'fill' | 'ring', ColorRole>;

const availableCases = schemes.flatMap((scheme) => variants.map((variant) => ({ scheme, variant })));
const unavailableCases = availableCases.flatMap((testCase) =>
  unavailabilities.map((unavailability) => ({ ...testCase, unavailability })));

const unavailableProps = (unavailability: Unavailability): Pick<ButtonProps, Unavailability> =>
  (unavailability === 'disabled' ? { disabled: true } : { loading: true });

function SchemeProbe() {
  const { theme } = useTheme();
  return <Text testID="scheme">{theme.scheme}</Text>;
}

/** Renders with a stored explicit preference, so the scheme under test never follows the OS. */
async function renderInScheme(scheme: ColorScheme, ui: ReactElement) {
  const store = createPreferenceStore({ getItem: async () => scheme, setItem: async () => {} });
  await store.hydrate();
  const inTheme = (node: ReactElement) => <ThemeProvider store={store}>{node}<SchemeProbe /></ThemeProvider>;
  const view = render(inTheme(ui));
  expect(screen.getByTestId('scheme')).toHaveTextContent(scheme);
  return { rerender: (next: ReactElement) => view.rerender(inTheme(next)) };
}

const button = () => screen.getByRole('button', { name: LABEL });

/** What the button actually draws: its fill, the colour of its inset border, and the rest of its box. */
function drawn() {
  const style = StyleSheet.flatten(button().props.style as StyleProp<ViewStyle>) as ViewStyle;
  const { backgroundColor, borderColor, ...box } = style;
  if (typeof backgroundColor !== 'string' || typeof borderColor !== 'string') {
    throw new Error(`AppButton must draw palette colours, drew ${String(backgroundColor)} and ${String(borderColor)}`);
  }
  return { fill: backgroundColor, border: borderColor, box };
}
type Drawn = ReturnType<typeof drawn>;

/**
 * Focus is visible: the fill is the expected one, the border stands out from it by at least 3:1, the
 * border is the chosen ring role, and the box has not moved. The ≥3:1 check runs before the exact role,
 * so a ring drawn in its own fill colour (the original H1, or a hidden ring) fails on visibility first.
 */
function expectVisibleRing(now: Drawn, target: { fill: string; ring: string; box: Drawn['box'] }) {
  expect(now.fill).toBe(target.fill);
  expect(contrastRatio(now.border, now.fill)).toBeGreaterThanOrEqual(NON_TEXT);
  expect(now.border).toBe(target.ring);
  expect(now.box).toEqual(target.box);
}

/**
 * A defensive model of a reported focus or blur event on an unavailable button. In React Native's JS
 * layer a disabled Pressable keeps `focusable` (Pressable.js:258) and Pressability forwards focus and blur
 * without checking `disabled` (Pressability.js:433-444). On Android, though, Pressable merges `disabled`
 * into accessibilityState (Pressable.js:235-236), View forwards it to native (View.js:94-99) and
 * BaseViewManager.java:387-389 disables the native view. Whether a device gives or keeps focus on a
 * disabled or loading button is therefore unverified, and focus arriving while unavailable may never
 * happen on Android. fireEvent models touch and drops every event on a host whose responder refuses
 * touches, so for an unavailable button the host's own focus handlers are called directly. This shows
 * what the button draws if React Native reports focus or blur there, not that a device does.
 */
const nativeFocusEvent = { nativeEvent: {} };
function focusNatively() { act(() => { button().props.onFocus(nativeFocusEvent); }); }
function blurNatively() { act(() => { button().props.onBlur(nativeFocusEvent); }); }

describe('AppButton focus ring', () => {
  it.each(availableCases)('$scheme $variant: focus draws a 2 dp ring at ≥3:1 on the fill, blur removes it, nothing moves', async ({ scheme, variant }) => {
    const colors = momentum.colors[scheme];
    await renderInScheme(scheme, <AppButton label={LABEL} variant={variant} onPress={jest.fn()} />);
    const rest = drawn();
    expect(rest.fill).toBe(colors[fillRole[variant]]);
    expect(rest.border).toBe(rest.fill);
    expect(rest.box.borderWidth).toBe(dimensions.focusRing);
    expect(rest.box.minHeight).toBe(dimensions.buttonHeight);

    fireEvent(button(), 'focus');
    const focused = drawn();
    expect(focused.fill).toBe(rest.fill);
    expect(focused.border).toBe(colors[ringRole[variant]]);
    expect(contrastRatio(focused.border, focused.fill)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(focused.box).toEqual(rest.box);

    fireEvent(button(), 'blur');
    expect(drawn()).toEqual(rest);
  });

  it('keeps the 96 dp logger size and the same inset ring on the default large action', async () => {
    await renderInScheme('dark', <AppButton label={LABEL} large onPress={jest.fn()} />);
    const rest = drawn();
    expect(rest.box.minHeight).toBe(dimensions.loggerButtonHeight);

    fireEvent(button(), 'focus');
    const focused = drawn();
    expect(contrastRatio(focused.border, focused.fill)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(focused.box).toEqual(rest.box);
  });

  it.each(unavailableCases)('$scheme $variant: focus that lands while $unavailability draws a ≥3:1 ring in the label colour, blur removes it, nothing moves and the action stays blocked', async ({ scheme, variant, unavailability }) => {
    const colors = momentum.colors[scheme];
    const press = jest.fn();
    await renderInScheme(scheme, <AppButton label={LABEL} variant={variant} onPress={press} {...unavailableProps(unavailability)} />);
    const rest = drawn();
    expect(rest.fill).toBe(colors[unavailableRole.fill]);
    expect(rest.border).toBe(rest.fill);
    expect(rest.box.borderWidth).toBe(dimensions.focusRing);

    focusNatively();
    expectVisibleRing(drawn(), { fill: rest.fill, ring: colors[unavailableRole.ring], box: rest.box });
    fireEvent.press(button());
    expect(press).not.toHaveBeenCalled();

    blurNatively();
    expect(drawn()).toEqual(rest);
  });

  it.each(unavailableCases)('$scheme $variant: focus stays visible while the focused button is $unavailability and once it is available again; blur then removes it, and nothing moves', async ({ scheme, variant, unavailability }) => {
    const colors = momentum.colors[scheme];
    const press = jest.fn();
    const view = await renderInScheme(scheme, <AppButton label={LABEL} variant={variant} onPress={press} />);
    const rest = drawn();
    fireEvent(button(), 'focus');
    const focused = drawn();
    expectVisibleRing(focused, { fill: rest.fill, ring: colors[ringRole[variant]], box: rest.box });

    view.rerender(<AppButton label={LABEL} variant={variant} onPress={press} {...unavailableProps(unavailability)} />);
    expectVisibleRing(drawn(), { fill: colors[unavailableRole.fill], ring: colors[unavailableRole.ring], box: rest.box });
    fireEvent.press(button());
    expect(press).not.toHaveBeenCalled();
    expect(button()).toBeDisabled();
    expect(button().props.accessibilityState).toMatchObject({ disabled: true, busy: unavailability === 'loading' });

    view.rerender(<AppButton label={LABEL} variant={variant} onPress={press} />);
    expect(drawn()).toEqual(focused);

    fireEvent(button(), 'blur');
    expect(drawn()).toEqual(rest);
  });

  it.each(unavailableCases)('$scheme $variant: blur while $unavailability removes the ring, and it stays gone once the button is available again', async ({ scheme, variant, unavailability }) => {
    const colors = momentum.colors[scheme];
    const view = await renderInScheme(scheme, <AppButton label={LABEL} variant={variant} onPress={jest.fn()} />);
    const rest = drawn();
    fireEvent(button(), 'focus');
    view.rerender(<AppButton label={LABEL} variant={variant} onPress={jest.fn()} {...unavailableProps(unavailability)} />);
    expectVisibleRing(drawn(), { fill: colors[unavailableRole.fill], ring: colors[unavailableRole.ring], box: rest.box });

    blurNatively();
    const blurred = drawn();
    expect(blurred.fill).toBe(colors[unavailableRole.fill]);
    expect(blurred.border).toBe(blurred.fill);
    expect(blurred.box).toEqual(rest.box);

    view.rerender(<AppButton label={LABEL} variant={variant} onPress={jest.fn()} />);
    expect(drawn()).toEqual(rest);
  });
});
