/**
 * A-04 · Log in.
 *
 * "Forgot password?" carries whatever was typed, so nobody types their address
 * twice. Supabase Auth checks the password (docs/14): a wrong one is said under
 * the password, and an account whose address is not confirmed yet (S8) is
 * offered its link again rather than a dead end.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AuthProblem } from '@/features/auth/supabaseAuth';
import { resetTo } from '@/lib/navigation';
import * as supabaseModule from '@/lib/supabase';

const { supabase } = supabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

const mockPush = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => mockParams,
  usePathname: () => '/login',
}));
jest.mock('@/lib/navigation', () => ({ resetTo: jest.fn() }));
const mockSignIn = jest.fn(async (_e: string, _p: string) => {});
jest.mock('@/lib/session', () => ({ useSession: () => ({ signIn: mockSignIn }) }));

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

it('shows the note a confirmed address lands with', () => {
  mockParams = { notice: 'confirmed' };
  render(<Login />);
  expect(screen.getByText(/Email confirmed\. Log in to carry on\./)).toBeTruthy();
});

async function logIn(email = 'haneef@example.com', password = 'correct-horse-battery') {
  fireEvent.changeText(screen.getByTestId('login-email'), ` ${email} `);
  fireEvent.changeText(screen.getByTestId('login-password'), password);
  await act(async () => { fireEvent.press(screen.getByLabelText('Log in')); });
}

it('signs in with the trimmed address and goes into the app', async () => {
  render(<Login />);
  await logIn();
  expect(mockSignIn).toHaveBeenCalledWith('haneef@example.com', 'correct-horse-battery');
  expect(resetTo).toHaveBeenCalledWith('/');
});

it('says a wrong password under the password', async () => {
  mockSignIn.mockRejectedValueOnce(new AuthProblem('That email and password do not match.', 'password', 'invalid_credentials'));
  render(<Login />);
  await logIn();
  expect(screen.getByText('That email and password do not match.')).toBeTruthy();
  expect(resetTo).not.toHaveBeenCalled();
});

it('offers the confirmation link again to an account not yet confirmed (S8)', async () => {
  mockSignIn.mockRejectedValueOnce(new AuthProblem('Confirm your email first — the link is in your inbox.', 'email', 'email_not_confirmed'));
  render(<Login />);
  await logIn();
  expect(screen.getByText(/Confirm your email first/)).toBeTruthy();

  await act(async () => { fireEvent.press(screen.getByTestId('login-resend')); });

  expect(supabase.auth.resend).toHaveBeenCalledWith(expect.objectContaining({ type: 'signup', email: 'haneef@example.com' }));
  expect(screen.getByText('Sent — check your inbox.')).toBeTruthy();
});

it('says it could not reach FitLog when the failure is not an answer', async () => {
  mockSignIn.mockRejectedValueOnce(new TypeError('Network request failed'));
  render(<Login />);
  await logIn();
  expect(screen.getByText(/Could not reach FitLog/)).toBeTruthy();
});
