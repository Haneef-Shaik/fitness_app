/**
 * A-04 · Log in — the two ways it meets A-05.
 *
 * "Forgot password?" carries whatever was typed, so nobody types their address
 * twice; and a completed reset lands here with a note saying why this device
 * has to log in again (A-05 → A-04 "Password updated. Log in.").
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => mockParams,
  usePathname: () => '/login',
}));
jest.mock('@/lib/navigation', () => ({ resetTo: jest.fn() }));
jest.mock('@/lib/session', () => ({ useSession: () => ({ signIn: jest.fn() }) }));

import Login from '../login';

beforeEach(() => { jest.clearAllMocks(); mockParams = {}; });

it('offers a way back in, carrying the typed email to A-05', () => {
  render(<Login />);
  fireEvent.changeText(screen.getByTestId('login-email'), ' haneef@example.com ');
  fireEvent.press(screen.getByLabelText('Forgot password?'));

  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/forgot-password', params: { email: 'haneef@example.com' },
  });
});

it('carries nothing when nothing was typed', () => {
  render(<Login />);
  fireEvent.press(screen.getByLabelText('Forgot password?'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/forgot-password', params: {} });
});

it('says why after a reset, instead of a bare login form', () => {
  mockParams = { notice: 'password-updated' };
  render(<Login />);
  expect(screen.getByText(/Password updated\. Log in with your new password\./)).toBeTruthy();
});

it('shows no note on an ordinary visit', () => {
  render(<Login />);
  expect(screen.queryByText(/Password updated/)).toBeNull();
});
