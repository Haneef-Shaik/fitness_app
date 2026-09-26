/**
 * K-02 · Account & security.
 *
 * Three things someone holding an unlocked phone should not be able to do
 * quietly, so each asks for the password or the new inbox and says, BEFORE it
 * happens, what it will do to other devices (K-02). Every result is stated in
 * words on the screen — a changed password, a pending address, a count of
 * devices signed out.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError } from '@/lib/api';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
  usePathname: () => '/settings/security',
}));

const PAIR = { access_token: 'a2', refresh_token: 'r2', token_type: 'Bearer', expires_in: 900 };
const mockChangePassword = jest.fn(async (_c: string, _n: string): Promise<unknown> => PAIR);
const mockChangeEmail = jest.fn(async (_e: string, _p: string): Promise<unknown> => (
  { pending_email: 'new@example.com' }
));
const mockRevoke = jest.fn(async (): Promise<unknown> => ({ revoked: 2 }));
const mockResend = jest.fn(async (): Promise<unknown> => ({ sent: true, email_verified: false }));
jest.mock('@/lib/api-account', () => ({
  ...jest.requireActual('@/lib/api-account'),
  accountApi: {
    changePassword: (c: string, n: string) => mockChangePassword(c, n),
    changeEmail: (e: string, p: string) => mockChangeEmail(e, p),
    signOutOtherDevices: () => mockRevoke(),
    resendVerification: () => mockResend(),
  },
}));

const mockAdopt = jest.fn(async (_p: unknown) => {});
const mockRefreshAccount = jest.fn(async () => {});
const mockSession = {
  status: 'ready', email: 'haneef@example.com',
  emailVerified: true as boolean | null, pendingEmail: null as string | null,
};
jest.mock('@/lib/session', () => ({
  useSession: () => ({
    ...mockSession, adoptTokens: mockAdopt, refreshAccount: mockRefreshAccount,
  }),
}));

import Security from '../settings/security';

const press = async (label: string) => {
  await act(async () => { fireEvent.press(screen.getByLabelText(label)); });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.emailVerified = true;
  mockSession.pendingEmail = null;
  mockChangePassword.mockResolvedValue(PAIR);
  mockChangeEmail.mockResolvedValue({ pending_email: 'new@example.com' });
  mockRevoke.mockResolvedValue({ revoked: 2 });
});

describe('email', () => {
  it('shows the address and says in words whether it is verified', () => {
    render(<Security />);
    expect(screen.getByText('haneef@example.com')).toBeTruthy();
    expect(screen.getByText('Verified')).toBeTruthy();
  });

  it('offers a resend while it is not', async () => {
    mockSession.emailVerified = false;
    render(<Security />);
    expect(screen.getByText('Not verified yet')).toBeTruthy();

    await press('Resend link');
    expect(mockResend).toHaveBeenCalledTimes(1);
  });

  it('shows a change that is waiting on its link', () => {
    mockSession.pendingEmail = 'new@example.com';
    render(<Security />);
    expect(screen.getByText(/Waiting for you to confirm new@example\.com/)).toBeTruthy();
  });

  it('asks for the password, and says nothing changes until the new inbox is proven', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change email'));
    fireEvent.changeText(screen.getByTestId('email-new'), ' New@Example.com ');
    fireEvent.changeText(screen.getByTestId('email-password'), 'correct-horse-battery');
    await press('Send confirmation link');

    expect(mockChangeEmail).toHaveBeenCalledWith('New@Example.com', 'correct-horse-battery');
    expect(mockRefreshAccount).toHaveBeenCalled();
    expect(screen.getByText(/We sent a link to new@example\.com/)).toBeTruthy();
  });

  it('puts a refusal under the field it is about', async () => {
    mockChangeEmail.mockRejectedValue(new ApiError(
      'VALIDATION_FAILED', 'An account already uses this email.', 422,
      { new_email: 'An account already uses this email.' },
    ));
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change email'));
    fireEvent.changeText(screen.getByTestId('email-new'), 'taken@example.com');
    fireEvent.changeText(screen.getByTestId('email-password'), 'correct-horse-battery');
    await press('Send confirmation link');

    expect(screen.getByText('An account already uses this email.')).toBeTruthy();
  });
});

describe('password', () => {
  const fill = (current: string, next: string, confirm = next) => {
    fireEvent.changeText(screen.getByTestId('password-current'), current);
    fireEvent.changeText(screen.getByTestId('password-new'), next);
    fireEvent.changeText(screen.getByTestId('password-confirm'), confirm);
  };

  it('says before confirming that other devices will be signed out (K-02)', () => {
    render(<Security />);
    expect(screen.getByText(/signs you out on every other device/)).toBeTruthy();
  });

  it('keeps this device signed in with the pair it is given', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change password'));
    fill('correct-horse-battery', 'a-much-better-passphrase');
    await press('Save new password');

    expect(mockChangePassword).toHaveBeenCalledWith(
      'correct-horse-battery', 'a-much-better-passphrase',
    );
    expect(mockAdopt).toHaveBeenCalledWith(PAIR);
    expect(screen.getByText(/Password changed/)).toBeTruthy();
  });

  it('checks the new pair before sending anything', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change password'));
    fill('correct-horse-battery', 'a-much-better-passphrase', 'something-else-entirely');
    await press('Save new password');

    expect(mockChangePassword).not.toHaveBeenCalled();
    expect(screen.getByText("The passwords don't match.")).toBeTruthy();
  });

  it('puts a wrong current password under that field', async () => {
    mockChangePassword.mockRejectedValue(new ApiError(
      'VALIDATION_FAILED', 'That password is not right.', 422,
      { current_password: 'That password is not right.' },
    ));
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change password'));
    fill('wrong-password-here', 'a-much-better-passphrase');
    await press('Save new password');

    expect(screen.getByText('That password is not right.')).toBeTruthy();
    expect(mockAdopt).not.toHaveBeenCalled();
  });
});

describe('other devices', () => {
  it('asks first, and does nothing if they back out', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Sign out other devices'));
    expect(screen.getByTestId('signout-others-confirm')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Cancel'));
    expect(mockRevoke).not.toHaveBeenCalled();
    expect(screen.queryByTestId('signout-others-confirm')).toBeNull();
  });

  it('says how many devices it signed out', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Sign out other devices'));
    await press('Yes, sign them out');

    expect(mockRevoke).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Signed out of 2 other devices.')).toBeTruthy();
  });

  it('says so when there was nothing to sign out', async () => {
    mockRevoke.mockResolvedValue({ revoked: 0 });
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Sign out other devices'));
    await press('Yes, sign them out');

    expect(screen.getByText('No other devices were signed in.')).toBeTruthy();
  });
});
