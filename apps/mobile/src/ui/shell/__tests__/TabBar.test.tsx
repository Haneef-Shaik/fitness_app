/**
 * The bottom tab bar. What it has to get right: the active tab is marked in
 * words for a screen reader (not only by colour), switching tabs RESETS the
 * history so Back on a tab root leaves the app instead of replaying old
 * screens — found in G10: Back from the dashboard landed on "Create account",
 * which looks exactly like being signed out — and the centre action opens B-03.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockDismissAll = jest.fn();
let mockCanDismiss = true;
let mockPath = '/home';
jest.mock('expo-router', () => ({
  router: {
    replace: (...a: unknown[]) => mockReplace(...a),
    push: (...a: unknown[]) => mockPush(...a),
    dismissAll: () => mockDismissAll(),
    canDismiss: () => mockCanDismiss,
  },
  usePathname: () => mockPath,
}));

import { TabBar } from '../TabBar';

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 24 } };
const show = () => render(<SafeAreaProvider initialMetrics={METRICS}><TabBar /></SafeAreaProvider>);

beforeEach(() => { jest.clearAllMocks(); mockCanDismiss = true; mockPath = '/home'; });

it('names every tab, and marks the active one as selected', () => {
  mockPath = '/nutrition/food/1';
  show();
  for (const label of ['Home', 'Train', 'Nutrition', 'Progress', 'Quick actions']) {
    expect(screen.getByLabelText(label)).toBeTruthy();
  }
  expect(screen.getByLabelText('Nutrition').props.accessibilityState).toMatchObject({ selected: true });
  expect(screen.getByLabelText('Home').props.accessibilityState).toMatchObject({ selected: false });
});

it('switching tab clears the history, then lands on the tab root', () => {
  show();
  fireEvent.press(screen.getByLabelText('Train'));
  expect(mockDismissAll).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenCalledWith('/train');
  expect(mockDismissAll.mock.invocationCallOrder[0]).toBeLessThan(mockReplace.mock.invocationCallOrder[0]!);
});

it('does not dismiss when there is nothing to dismiss', () => {
  mockCanDismiss = false;
  show();
  fireEvent.press(screen.getByLabelText('Progress'));
  expect(mockDismissAll).not.toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith('/progress');
});

it('tapping the tab you are already on, at its root, does nothing', () => {
  mockPath = '/home';
  show();
  fireEvent.press(screen.getByLabelText('Home'));
  expect(mockReplace).not.toHaveBeenCalled();
});

it('tapping your own tab from deeper in it returns to its root', () => {
  mockPath = '/train/programs/abc';
  show();
  fireEvent.press(screen.getByLabelText('Train'));
  expect(mockReplace).toHaveBeenCalledWith('/train');
});

it('the centre action opens the quick-action sheet on top, keeping history', () => {
  show();
  fireEvent.press(screen.getByLabelText('Quick actions'));
  expect(mockPush).toHaveBeenCalledWith('/quick');
  expect(mockDismissAll).not.toHaveBeenCalled();
});

it('clears the home indicator', () => {
  show();
  const bar = screen.getByTestId('tab-bar');
  expect(require('react-native').StyleSheet.flatten(bar.props.style).paddingBottom).toBeGreaterThanOrEqual(24);
});
