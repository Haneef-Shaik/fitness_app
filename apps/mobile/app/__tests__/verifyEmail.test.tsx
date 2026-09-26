/**
 * A-06 · Verify email.
 *
 * `fitlog://verify-email?token=…` verifies on arrival, signed in or not — the
 * link is often opened on a phone that is not signed in to that account. The
 * same link finishes a K-02 email change, so the screen names the address the
 * server says is now confirmed rather than the one it remembers.
 *
 * Verification never blocks anything (A-06): there is no "you must verify"
 * here, only a way to do it and a way back to the app.
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ApiError } from '@/lib/api';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => mockParams,
  usePathname: () => '/verify-email',
}));

const mockResetTo = jest.fn();
jest.mock('@/lib/navigation', () => ({ resetTo: (...a: unknown[]) => mockResetTo(...a) }));

const mockVerify = jest.fn(async (_t: string): Promise<unknown> => (
  { email: 'haneef@example.com', email_verified: true }
));
const mockResend = jest.fn(async (): Promise<unknown> => ({ sent: true, email_verified: false }));
jest.mock('@/lib/api-account', () => ({
  ...jest.requireActual('@/lib/api-account'),
  recoveryApi: { verifyEmail: (t: string) => mockVerify(t) },
  accountApi: { resendVerification: () => mockResend() },
}));

const mockRefreshAccount = jest.fn(async () => {});
const mockSession = { status: 'ready', email: 'haneef@example.com' as string | null };
jest.mock('@/lib/session', () => ({
  useSession: () => ({ ...mockSession, emailVerified: false, refreshAccount: mockRefreshAccount }),
}));

import VerifyEmail from '../verify-email';

const EXPIRED = new ApiError(
  'LINK_EXPIRED', 'This link has expired or was already used. Request a new one.', 400,
);

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockSession.status = 'ready';
  mockSession.email = 'haneef@example.com';
  mockVerify.mockResolvedValue({ email: 'haneef@example.com', email_verified: true });
  mockResend.mockResolvedValue({ sent: true, email_verified: false });
});

it('verifies on arrival from the link, once', async () => {
  mockParams = { token: 'tok-from-link' };
  render(<VerifyEmail />);

  await waitFor(() => expect(screen.getByText('haneef@example.com is confirmed.')).toBeTruthy());
  expect(mockVerify).toHaveBeenCalledTimes(1);
  expect(mockVerify).toHaveBeenCalledWith('tok-from-link');
  // Signed in: the banner on K-01 must go without a relaunch.
  expect(mockRefreshAccount).toHaveBeenCalled();

  fireEvent.press(screen.getByLabelText('Continue'));
  expect(mockResetTo).toHaveBeenCalledWith('/');
});

it('names the address the server confirmed — the new one, after an email change', async () => {
  mockParams = { token: 'change-link' };
  mockVerify.mockResolvedValue({ email: 'new@example.com', email_verified: true });
  render(<VerifyEmail />);

  await waitFor(() => expect(screen.getByText('new@example.com is confirmed.')).toBeTruthy());
});

it('works signed out, and then offers to log in', async () => {
  mockParams = { token: 'tok' };
  mockSession.status = 'signed-out';
  mockSession.email = null;
  render(<VerifyEmail />);

  await waitFor(() => expect(screen.getByText(/is confirmed/)).toBeTruthy());
  expect(mockRefreshAccount).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Log in'));
  expect(mockResetTo).toHaveBeenCalledWith('/login');
});

it('says an old link is spent and, signed in, sends a fresh one', async () => {
  mockParams = { token: 'old' };
  mockVerify.mockRejectedValue(EXPIRED);
  render(<VerifyEmail />);

  await waitFor(() => expect(screen.getByText(/This link has expired/)).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByLabelText('Resend link')); });

  expect(mockResend).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Sent\. Check haneef@example\.com/)).toBeTruthy();
});

it('signed out with a spent link, points to log in rather than a resend it cannot do', async () => {
  mockParams = { token: 'old' };
  mockSession.status = 'signed-out';
  mockVerify.mockRejectedValue(EXPIRED);
  render(<VerifyEmail />);

  await waitFor(() => expect(screen.getByText(/This link has expired/)).toBeTruthy());
  expect(screen.queryByLabelText('Resend link')).toBeNull();
  fireEvent.press(screen.getByLabelText('Log in to send a new link'));
  expect(mockResetTo).toHaveBeenCalledWith('/login');
});

it('without a link, takes the code from the email', async () => {
  render(<VerifyEmail />);
  expect(screen.getByText(/We sent a link to haneef@example\.com/)).toBeTruthy();

  fireEvent.changeText(screen.getByTestId('verify-code'), ' pasted-code ');
  await act(async () => { fireEvent.press(screen.getByLabelText('Confirm email')); });

  expect(mockVerify).toHaveBeenCalledWith('pasted-code');
  expect(screen.getByText('haneef@example.com is confirmed.')).toBeTruthy();
});

it('says how long to wait when a link went out a moment ago', async () => {
  mockResend.mockRejectedValue(new ApiError(
    'RATE_LIMITED', 'We just sent one. You can ask again in 42 seconds.', 429,
  ));
  render(<VerifyEmail />);
  await act(async () => { fireEvent.press(screen.getByLabelText('Resend link')); });

  expect(screen.getByText('We just sent one. You can ask again in 42 seconds.')).toBeTruthy();
});
