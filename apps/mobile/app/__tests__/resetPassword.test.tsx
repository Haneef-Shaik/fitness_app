/**
 * A-05 · Reset password — the half that opens from the email.
 *
 * `fitlog://reset-password?token=…` arrives with the token; a phone that would
 * not open the link arrives without one, and the code is pasted instead. Either
 * way the new password follows sign-up's rule, and a completed reset leaves
 * this device signed out — the server has ended every session — on the login
 * screen with a note saying why (A-05 → A-04).
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError } from '@/lib/api';

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: (...a: unknown[]) => mockReplace(...a), back: jest.fn() },
  useLocalSearchParams: () => mockParams,
  usePathname: () => '/reset-password',
}));

const mockResetTo = jest.fn();
jest.mock('@/lib/navigation', () => ({ resetTo: (...a: unknown[]) => mockResetTo(...a) }));

const mockReset = jest.fn(async (_t: string, _p: string): Promise<unknown> => ({ password_reset: true }));
jest.mock('@/lib/api-account', () => ({
  ...jest.requireActual('@/lib/api-account'),
  recoveryApi: { resetPassword: (t: string, p: string) => mockReset(t, p) },
}));

const mockSignOut = jest.fn(async () => {});
const mockSession = { status: 'signed-out', email: null as string | null };
jest.mock('@/lib/session', () => ({
  useSession: () => ({ ...mockSession, signOut: mockSignOut }),
}));

import ResetPassword from '../reset-password';

const GOOD = 'a-much-better-passphrase';

function fill(password = GOOD, confirm = password) {
  fireEvent.changeText(screen.getByTestId('reset-new'), password);
  fireEvent.changeText(screen.getByTestId('reset-confirm'), confirm);
}

const submit = async () => {
  await act(async () => { fireEvent.press(screen.getByLabelText('Update password')); });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockSession.status = 'signed-out';
  mockReset.mockResolvedValue({ password_reset: true });
});

it('uses the token from the link, and does not ask for a code', async () => {
  mockParams = { token: 'tok-from-link' };
  render(<ResetPassword />);
  expect(screen.queryByTestId('reset-code')).toBeNull();

  fill();
  await submit();

  expect(mockReset).toHaveBeenCalledWith('tok-from-link', GOOD);
});

it('takes a pasted code when there was no link', async () => {
  render(<ResetPassword />);
  fireEvent.changeText(screen.getByTestId('reset-code'), '  pasted-code \n');
  fill();
  await submit();

  expect(mockReset).toHaveBeenCalledWith('pasted-code', GOOD);
});

it('asks for the code before calling anyone', async () => {
  render(<ResetPassword />);
  fill();
  await submit();

  expect(mockReset).not.toHaveBeenCalled();
  expect(screen.getByText('Paste the code from the email.')).toBeTruthy();
});

it("applies sign-up's rule before a round trip", async () => {
  mockParams = { token: 't' };
  render(<ResetPassword />);
  fill('short');
  await submit();

  expect(mockReset).not.toHaveBeenCalled();
  expect(screen.getByText('Use at least 10 characters.')).toBeTruthy();
});

it('says when the two passwords differ', async () => {
  mockParams = { token: 't' };
  render(<ResetPassword />);
  fill(GOOD, `${GOOD}x`);
  await submit();

  expect(mockReset).not.toHaveBeenCalled();
  expect(screen.getByText("The passwords don't match.")).toBeTruthy();
});

it("puts the server's refusal under the password it is about", async () => {
  mockParams = { token: 't' };
  mockReset.mockRejectedValue(new ApiError(
    'VALIDATION_FAILED', 'That password is too common.', 422,
    { new_password: 'That password is too common.' },
  ));
  render(<ResetPassword />);
  fill('letmein1234');
  await submit();

  expect(screen.getByText('That password is too common.')).toBeTruthy();
});

it('describes strength in words, not only bars', () => {
  render(<ResetPassword />);
  fireEvent.changeText(screen.getByTestId('reset-new'), 'short');
  expect(screen.getByLabelText('Password strength: Too short')).toBeTruthy();
  fireEvent.changeText(screen.getByTestId('reset-new'), GOOD);
  expect(screen.getByLabelText('Password strength: Strong')).toBeTruthy();
});

it('lands on log in with a note once the password is changed', async () => {
  mockParams = { token: 't' };
  render(<ResetPassword />);
  fill();
  await submit();

  expect(mockSignOut).not.toHaveBeenCalled();
  expect(mockResetTo).toHaveBeenCalledWith({
    pathname: '/login', params: { notice: 'password-updated' },
  });
});

it('signs this device out first when it was signed in — its session has ended', async () => {
  mockParams = { token: 't' };
  mockSession.status = 'ready';
  render(<ResetPassword />);
  fill();
  await submit();

  expect(mockSignOut).toHaveBeenCalledTimes(1);
  expect(mockResetTo).toHaveBeenCalled();
});

it('offers a new link when this one has expired or was used', async () => {
  mockParams = { token: 'old' };
  mockReset.mockRejectedValue(new ApiError(
    'LINK_EXPIRED', 'This link has expired or was already used. Request a new one.', 400,
  ));
  render(<ResetPassword />);
  fill();
  await submit();

  expect(screen.getByText(/This link has expired/)).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Request a new link'));
  expect(mockReplace).toHaveBeenCalledWith('/forgot-password');
});
