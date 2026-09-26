/**
 * A-05 · Forgot password — the request half.
 *
 * The one rule this screen could break on its own is enumeration. The server
 * answers the same whether or not the address has an account; the screen must
 * too — one confirmation, worded as a condition, whatever happened. What it may
 * report is a problem with the REQUEST (not an address, no connection), which
 * says nothing about accounts.
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ApiError } from '@/lib/api';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: {
    push: (...a: unknown[]) => mockPush(...a), replace: (...a: unknown[]) => mockReplace(...a),
    back: jest.fn(),
  },
  useLocalSearchParams: () => mockParams,
  usePathname: () => '/forgot-password',
}));

const mockForgot = jest.fn(async (_email: string): Promise<unknown> => ({ requested: true }));
jest.mock('@/lib/api-account', () => ({
  ...jest.requireActual('@/lib/api-account'),
  recoveryApi: { forgotPassword: (e: string) => mockForgot(e) },
}));

jest.mock('@/lib/session', () => ({ useSession: () => ({ status: 'signed-out', email: null }) }));

import ForgotPassword from '../forgot-password';

const CONFIRMATION = /If an account exists for haneef@example\.com, we've sent a reset link/;

async function send(email = 'haneef@example.com') {
  fireEvent.changeText(screen.getByTestId('forgot-email'), email);
  await act(async () => { fireEvent.press(screen.getByLabelText('Send reset link')); });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockForgot.mockResolvedValue({ requested: true });
});

afterEach(() => { jest.useRealTimers(); });

it('carries the email typed on the login screen (A-04 → A-05)', () => {
  mockParams = { email: 'haneef@example.com' };
  render(<ForgotPassword />);
  expect(screen.getByTestId('forgot-email').props.value).toBe('haneef@example.com');
});

it('shows one confirmation, worded so it never says whether an account exists', async () => {
  render(<ForgotPassword />);
  await send('  haneef@example.com ');

  expect(mockForgot).toHaveBeenCalledWith('haneef@example.com');
  expect(screen.getByText(CONFIRMATION)).toBeTruthy();
});

it('puts a malformed address under the field, and confirms nothing', async () => {
  mockForgot.mockRejectedValue(new ApiError(
    'VALIDATION_FAILED', 'Some details need fixing.', 422,
    { email: 'value is not a valid email address' },
  ));
  render(<ForgotPassword />);
  await send('not-an-email');

  expect(screen.getByText('value is not a valid email address')).toBeTruthy();
  expect(screen.queryByText(/If an account exists/)).toBeNull();
});

it('says it could not reach the server rather than claiming it sent', async () => {
  mockForgot.mockRejectedValue(new TypeError('Network request failed'));
  render(<ForgotPassword />);
  await send();

  expect(screen.getByText(/Could not reach the server/)).toBeTruthy();
  expect(screen.queryByText(/If an account exists/)).toBeNull();
});

it('asks for an address before calling anyone', async () => {
  render(<ForgotPassword />);
  await send('   ');

  expect(mockForgot).not.toHaveBeenCalled();
  expect(screen.getByText('Enter your email address.')).toBeTruthy();
});

it('offers Resend after a minute, as a countdown until then', async () => {
  jest.useFakeTimers();
  render(<ForgotPassword />);
  await send();

  expect(screen.getByLabelText('Resend in 1:00')).toBeDisabled();
  act(() => { jest.advanceTimersByTime(61_000); });

  await act(async () => { fireEvent.press(screen.getByLabelText('Resend link')); });
  expect(mockForgot).toHaveBeenCalledTimes(2);
});

it('lets someone with the code carry on without the link', () => {
  render(<ForgotPassword />);
  fireEvent.press(screen.getByLabelText('I have a code'));
  expect(mockPush).toHaveBeenCalledWith('/reset-password');
});
