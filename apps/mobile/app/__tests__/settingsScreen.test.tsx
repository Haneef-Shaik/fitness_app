/**
 * K-01 · Profile & settings — where the avatar goes.
 *
 * Found on a phone in G10: the avatar on the dashboard WAS the sign-out
 * button. One tap, no confirmation, and the user was signed out — the single
 * biggest reason the app "did not remember" a login. Sign-out now lives here,
 * behind a confirmation that says what happens to unfinished work (K-01).
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn(), replace: jest.fn() },
  usePathname: () => '/settings',
}));

const mockSignOut = jest.fn(async () => {});
jest.mock('@/lib/session', () => ({
  useSession: () => ({
    email: 'haneef@example.com',
    profile: { display_name: 'Haneef A', timezone: 'Asia/Kolkata' },
    signOut: mockSignOut,
    refreshAccount: jest.fn(async () => {}),
  }),
}));

let mockDraft: unknown = null;
let mockEntries: { state: string }[] = [];
jest.mock('@/lib/db', () => ({
  store: {
    loadDraft: async () => mockDraft,
    allEntries: async () => mockEntries,
  },
}));

import Settings from '../settings/index';

beforeEach(() => {
  jest.clearAllMocks();
  mockDraft = null;
  mockEntries = [];
});

it('shows whose account this is', () => {
  render(<Settings />);
  expect(screen.getByText('Haneef A')).toBeTruthy();
  expect(screen.getByText('haneef@example.com')).toBeTruthy();
});

it('links to the settings that exist', () => {
  render(<Settings />);
  // K-01 showed the email only; the answers onboarding collects are editable now.
  fireEvent.press(screen.getByLabelText('Your details'));
  expect(mockPush).toHaveBeenLastCalledWith('/settings/profile');
  fireEvent.press(screen.getByLabelText('Calorie and macro targets'));
  expect(mockPush).toHaveBeenLastCalledWith('/nutrition/targets');
  fireEvent.press(screen.getByLabelText('Dashboard layout'));
  expect(mockPush).toHaveBeenLastCalledWith('/home/customize');
  fireEvent.press(screen.getByLabelText('Notifications and reminders'));
  expect(mockPush).toHaveBeenLastCalledWith('/notifications');
  fireEvent.press(screen.getByLabelText('Account and security'));
  expect(mockPush).toHaveBeenLastCalledWith('/settings/security');
});

it('sign-out asks first, and only signs out on confirm', async () => {
  render(<Settings />);
  fireEvent.press(screen.getByLabelText('Sign out'));
  expect(mockSignOut).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByTestId('signout-confirm')).toBeTruthy());

  fireEvent.press(screen.getByLabelText('Stay signed in'));
  expect(screen.queryByTestId('signout-confirm')).toBeNull();
  expect(mockSignOut).not.toHaveBeenCalled();

  fireEvent.press(screen.getByLabelText('Sign out'));
  await waitFor(() => expect(screen.getByTestId('signout-confirm')).toBeTruthy());
  fireEvent.press(screen.getByLabelText('Yes, sign out'));
  await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
});

it('says an unfinished workout will wait for them (K-01)', async () => {
  mockDraft = { revision: 1, updatedAt: 'x', json: '{}' };
  render(<Settings />);
  fireEvent.press(screen.getByLabelText('Sign out'));
  await waitFor(() => expect(screen.getByText(/unfinished workout on this device/)).toBeTruthy());
});

it('says how many changes have not uploaded yet', async () => {
  mockEntries = [{ state: 'pending' }, { state: 'pending' }, { state: 'sent' }];
  render(<Settings />);
  fireEvent.press(screen.getByLabelText('Sign out'));
  await waitFor(() => expect(screen.getByText(/2 changes haven't uploaded/)).toBeTruthy());
});
