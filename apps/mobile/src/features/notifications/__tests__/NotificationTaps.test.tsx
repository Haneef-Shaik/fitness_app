/**
 * A tapped notification opens what it is about — including the tap that
 * launched the app, which arrives before the session has been restored.
 */
import React from 'react';
import { Platform } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDismissAll = jest.fn();
let mockPathname = '/home';
jest.mock('expo-router', () => ({
  router: {
    push: (...a: unknown[]) => mockPush(...a),
    replace: (...a: unknown[]) => mockReplace(...a),
    canDismiss: () => true,
    dismissAll: () => mockDismissAll(),
  },
  usePathname: () => mockPathname,
}));
let mockStatus = 'ready';
jest.mock('@/lib/session', () => ({ useSession: () => ({ status: mockStatus }) }));

type Listener = (r: unknown) => void;
let mockListener: Listener | null = null;
let mockLast: unknown = null;
const mockClear = jest.fn(() => { mockLast = null; });
const mockShowWhileOpen = jest.fn();
jest.mock('../display', () => ({ showWhileOpen: () => mockShowWhileOpen() }));
jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  getLastNotificationResponse: () => mockLast,
  clearLastNotificationResponse: () => mockClear(),
  addNotificationResponseReceivedListener: (l: Listener) => {
    mockListener = l;
    return { remove: () => { mockListener = null; } };
  },
}));

import { NotificationTaps } from '../NotificationTaps';

let seq = 0;
const tap = (data: unknown, action = 'expo.modules.notifications.actions.DEFAULT') => ({
  actionIdentifier: action,
  notification: { date: ++seq, request: { identifier: `n-${seq}`, content: { data } } },
});

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'android';
  mockPathname = '/home'; mockStatus = 'ready'; mockListener = null; mockLast = null;
});

it('a tapped check-in reminder opens the check-in', async () => {
  render(<NotificationTaps />);
  act(() => mockListener!(tap({ type: 'reminder', kind: 'checkin' })));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/progress/checkin'));
});

it('the tap that launched the app waits for the start screen to send the user home', async () => {
  mockLast = tap({ type: 'reminder', kind: 'weigh_in' });
  mockPathname = '/';
  const view = render(<NotificationTaps />);
  expect(mockPush).not.toHaveBeenCalled();   // "/" is about to redirect — pushing now would be replaced

  mockPathname = '/home';
  view.rerender(<NotificationTaps />);
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/progress/log'));
  expect(mockClear).toHaveBeenCalled();
});

it('the same tap is opened once, however often it is seen', async () => {
  const launch = tap({ type: 'reminder', kind: 'checkin' });
  mockLast = launch;
  const view = render(<NotificationTaps />);
  act(() => mockListener!(launch));
  view.unmount();
  mockLast = launch;
  render(<NotificationTaps />);
  await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
  expect(mockPush).toHaveBeenCalledWith('/progress/checkin');
});

it("a tab's root goes the way the tab bar goes — never a second copy on the stack", async () => {
  render(<NotificationTaps />);
  act(() => mockListener!(tap({ type: 'reminder', kind: 'meal_log' })));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/nutrition'));
  expect(mockPush).not.toHaveBeenCalled();

  // Already there: nothing to do.
  mockReplace.mockClear();
  mockPathname = '/nutrition';
  render(<NotificationTaps />);
  act(() => mockListener!(tap({ type: 'reminder', kind: 'meal_log' })));
  await new Promise((r) => setTimeout(r, 10));
  expect(mockReplace).not.toHaveBeenCalled();
});

it('a dismissal or an unknown notification opens nothing', async () => {
  render(<NotificationTaps />);
  act(() => mockListener!(tap({ type: 'reminder', kind: 'checkin' }, 'expo.modules.notifications.actions.DISMISS')));
  act(() => mockListener!(tap({ type: 'something-else' })));
  await new Promise((r) => setTimeout(r, 10));
  expect(mockPush).not.toHaveBeenCalled();
});

it('signed out, nothing listens — a reminder cannot open a screen behind the login', () => {
  mockStatus = 'signed-out';
  render(<NotificationTaps />);
  expect(mockListener).toBeNull();
});

it('notifications show while the app is open from the start — not only once reminders are set', () => {
  // Found on the emulator: a run that scheduled nothing (reminders off, or an
  // offline start) dropped every notification that arrived in the foreground.
  mockStatus = 'signed-out';
  render(<NotificationTaps />);
  expect(mockShowWhileOpen).toHaveBeenCalled();
});
