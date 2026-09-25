/**
 * A text field's name reaches TalkBack.
 *
 * G10's TalkBack session, on the phone: TalkBack names an Android text field by
 * its HINT and ignores its contentDescription (which is what
 * `accessibilityLabel` becomes). The logger's load field was announced
 * "—, 80, Edit box" — its placeholder — and the food amount "100, Edit box",
 * with no name at all. The accessibility tree said "Load (kg)" throughout,
 * which is why reading the tree never found it.
 */
import React from 'react';
import { Platform } from 'react-native';
import * as RN from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { TextInput, hintFor } from '../TextInput';

const native = () => screen.UNSAFE_getByType(RN.TextInput).props;

describe('hintFor', () => {
  it('puts the name in the hint and moves a different placeholder to the overlay', () => {
    expect(hintFor('Load (kg)', '—')).toEqual({ hint: 'Load (kg)', overlay: '—' });
  });

  it('names a field that has no placeholder at all', () => {
    expect(hintFor('Amount in grams', undefined)).toEqual({ hint: 'Amount in grams', overlay: undefined });
  });

  it('changes nothing when the placeholder already is the name, or there is no name', () => {
    expect(hintFor('Search foods', 'Search foods')).toEqual({ hint: 'Search foods' });
    expect(hintFor(undefined, 'you@example.com')).toEqual({ hint: 'you@example.com' });
  });
});

describe('on Android', () => {
  const os = Platform.OS;
  beforeAll(() => { Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true }); });
  afterAll(() => { Object.defineProperty(Platform, 'OS', { value: os, configurable: true }); });

  it('the native hint is the field name, and it is not painted', () => {
    render(<TextInput accessibilityLabel="Load (kg)" placeholder="—" placeholderTextColor="#777" value="80" />);
    expect(native().placeholder).toBe('Load (kg)');
    expect(native().placeholderTextColor).toBe('transparent');
  });

  it('draws the visible placeholder over an EMPTY field, hidden from the reader', () => {
    render(<TextInput accessibilityLabel="Load (kg)" placeholder="—" placeholderTextColor="#777" value="" />);
    const overlay = screen.getByTestId('placeholder-overlay', { includeHiddenElements: true });
    expect(overlay.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(overlay.props.pointerEvents).toBe('none');
    expect(screen.getByText('—', { includeHiddenElements: true })).toBeTruthy();
  });

  it('removes the overlay once there is text', () => {
    render(<TextInput accessibilityLabel="Load (kg)" placeholder="—" value="82.5" />);
    expect(screen.queryByTestId('placeholder-overlay', { includeHiddenElements: true })).toBeNull();
  });

  it('tracks an uncontrolled field through what is typed', () => {
    const typed = jest.fn();
    render(<TextInput accessibilityLabel="Search" placeholder="Bananas, oats…" onChangeText={typed} />);
    expect(screen.queryByTestId('placeholder-overlay', { includeHiddenElements: true })).not.toBeNull();
    act(() => { native().onChangeText('oat'); });
    expect(typed).toHaveBeenCalledWith('oat');
    expect(screen.queryByTestId('placeholder-overlay', { includeHiddenElements: true })).toBeNull();
  });
});

describe('elsewhere', () => {
  it('leaves the placeholder alone — VoiceOver reads accessibilityLabel', () => {
    render(<TextInput accessibilityLabel="Load (kg)" placeholder="—" placeholderTextColor="#777" value="" />);
    expect(native().placeholder).toBe('—');
    expect(native().placeholderTextColor).toBe('#777');
    expect(screen.queryByTestId('placeholder-overlay', { includeHiddenElements: true })).toBeNull();
  });
});
