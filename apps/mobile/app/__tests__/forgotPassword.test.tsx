/**
 * A-05 · Forgot password — the request half.
 *
 * The one rule this screen could break on its own is enumeration. Supabase
 * answers the same whether or not the address has an account; the screen must
 * too — one confirmation, worded as a condition, whatever happened. What it may
 * report is a problem with the REQUEST (not an address, no connection), which
 * says nothing about accounts.
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as supabaseModule from '@/lib/supabase';

const { supabase } = supabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

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

jest.mock('@/lib/session', () => ({ useSession: () => ({ status: 'signed-out', email: null }) }));

import ForgotPassword from '../forgot-password';

const CONFIRMATION = /If an account exists for haneef@example\.com, we've sent a reset link and a 6-digit code/;

async function send(email = 'haneef@example.com') {
  fireEvent.changeText(screen.getByTestId('forgot-email'), email);
  await act(async () => { fireEvent.press(screen.getByLabelText('Send reset link')); });
}

const mockForgot = supabase.auth.resetPasswordForEmail;
const authError = (code: string) => ({ data: {}, error: Object.assign(new Error(code), { code }) });

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
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

  expect(mockForgot).toHaveBeenCalledWith('haneef@example.com', {
    redirectTo: 'fitlog://auth/callback',
  });
  expect(screen.getByText(CONFIRMATION)).toBeTruthy();
});

it('confirms the same for an address with no account', async () => {
  mockForgot.mockResolvedValueOnce(authError('user_not_found') as never);
  render(<ForgotPassword />);
  await send();
  expect(screen.getByText(CONFIRMATION)).toBeTruthy();
});

it('puts a malformed address under the field, and confirms nothing', async () => {
  mockForgot.mockResolvedValueOnce(authError('email_address_invalid') as never);
  render(<ForgotPassword />);
  await send('not-an-email');

  expect(screen.getByText('Enter a real email address.')).toBeTruthy();
  expect(screen.queryByText(/If an account exists/)).toBeNull();
});

it('says it could not reach the server rather than claiming it sent', async () => {
  mockForgot.mockResolvedValueOnce({
    data: {}, error: Object.assign(new Error('Failed to fetch'), { name: 'AuthRetryableFetchError' }),
  } as never);
  render(<ForgotPassword />);
  await send();

  expect(screen.getByText(/Could not reach FitLog/)).toBeTruthy();
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

it('lets someone with the code carry on without the link, keeping the address', () => {
  render(<ForgotPassword />);
  fireEvent.changeText(screen.getByTestId('forgot-email'), ' haneef@example.com ');
  fireEvent.press(screen.getByLabelText('I have a code'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/reset-password', params: { email: 'haneef@example.com' } });
});
