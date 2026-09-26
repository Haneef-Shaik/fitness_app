/**
 * A-03 · Sign up — the password rule it shares with A-05 and K-02, and the
 * confirmation email every new account waits on (docs/14 S8).
 *
 * The meter was bars only, and nine characters lit three of them while the
 * server refused anything under ten. It now says what it means in words, from
 * the same rule the reset and change screens use.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AuthProblem } from '@/features/auth/supabaseAuth';
import { resetTo } from '@/lib/navigation';
import * as supabaseModule from '@/lib/supabase';

const { supabase } = supabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  usePathname: () => '/register',
}));
jest.mock('@/lib/navigation', () => ({ resetTo: jest.fn() }));
const mockSignUp = jest.fn(async (_e: string, _p: string) => ({ confirm: true }));
jest.mock('@/lib/session', () => ({ useSession: () => ({ signUp: mockSignUp }) }));

import Register from '../register';

beforeEach(() => jest.clearAllMocks());

async function create(email = 'new@example.com') {
  fireEvent.changeText(screen.getByTestId('register-email'), ` ${email} `);
  fireEvent.changeText(screen.getByTestId('register-password'), 'correct-horse-battery');
  await act(async () => { fireEvent.press(screen.getByLabelText('Create account')); });
}

it('states the minimum and names the strength in words', () => {
  render(<Register />);
  expect(screen.getByText('At least 10 characters.')).toBeTruthy();

  fireEvent.changeText(screen.getByTestId('register-password'), 'a'.repeat(9));
  expect(screen.getByLabelText('Password strength: Too short')).toBeTruthy();

  fireEvent.changeText(screen.getByTestId('register-password'), 'correct-horse-battery');
  expect(screen.getByLabelText('Password strength: Strong')).toBeTruthy();
});

it('says to check the inbox, and can send the link again once', async () => {
  render(<Register />);
  await create();

  expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'correct-horse-battery');
  expect(screen.getByTestId('register-check-email')).toBeTruthy();
  expect(screen.getByText(/We sent a link to new@example\.com/)).toBeTruthy();
  expect(resetTo).not.toHaveBeenCalled();

  await act(async () => { fireEvent.press(screen.getByTestId('register-resend')); });
  expect(supabase.auth.resend).toHaveBeenCalledWith(expect.objectContaining({ type: 'signup', email: 'new@example.com' }));
  expect(screen.getByLabelText('Sent again')).toBeDisabled();
});

it('goes straight in when no confirmation is needed', async () => {
  mockSignUp.mockResolvedValueOnce({ confirm: false });
  render(<Register />);
  await create();
  expect(resetTo).toHaveBeenCalledWith('/');
});

it('puts an address that already has an account under the address', async () => {
  mockSignUp.mockRejectedValueOnce(new AuthProblem('An account already uses this email. Log in instead.', 'email', 'user_already_exists'));
  render(<Register />);
  await create('taken@example.com');
  expect(screen.getByText('An account already uses this email. Log in instead.')).toBeTruthy();
  expect(screen.queryByTestId('register-check-email')).toBeNull();
});
