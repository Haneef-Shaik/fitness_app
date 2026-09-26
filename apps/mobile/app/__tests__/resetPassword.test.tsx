/**
 * A-05 · Reset password — the half that follows the email.
 *
 * The email's link signs this phone in (app/auth/callback.tsx) and lands here;
 * an email read on another device, where the link cannot work (PKCE), gives a
 * six-digit code instead, typed here while signed out. Either way the new
 * password follows sign-up's rule, and every OTHER device is signed out —
 * this one stays in (docs/14). Signed in any OTHER way, the screen sets
 * nothing: an unlocked phone must not change the password without the old one.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as supabaseModule from '@/lib/supabase';

const { fakeAuth, supabase } = supabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: (...a: unknown[]) => mockReplace(...a), back: jest.fn() },
  useLocalSearchParams: () => mockParams,
  usePathname: () => '/reset-password',
}));

const mockResetTo = jest.fn();
jest.mock('@/lib/navigation', () => ({ resetTo: (...a: unknown[]) => mockResetTo(...a) }));

const mockAdopt = jest.fn(async (_s: unknown, _o?: unknown) => {});
const mockFinish = jest.fn();
const mockSession = { status: 'ready', recovering: true };
jest.mock('@/lib/session', () => ({
  useSession: () => ({ ...mockSession, adoptSession: mockAdopt, finishRecovery: mockFinish }),
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
  mockSession.status = 'ready';
  mockSession.recovering = true;
  fakeAuth.signIn({ email: 'haneef@example.com' });
});

describe('signed in by the link', () => {
  it('sets the new password, signs every other device out, and carries on in the app', async () => {
    render(<ResetPassword />);
    expect(screen.queryByTestId('reset-code')).toBeNull();

    fill();
    await submit();

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: GOOD });
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'others' });
    expect(mockFinish).toHaveBeenCalled();
    expect(mockResetTo).toHaveBeenCalledWith('/');
  });

  it('does not claim the other devices are out when they could not be signed out', async () => {
    supabase.auth.signOut.mockResolvedValueOnce({
      error: Object.assign(new Error('Failed to fetch'), { name: 'AuthRetryableFetchError' }),
    } as never);
    render(<ResetPassword />);
    fill();
    await submit();

    expect(screen.getByTestId('reset-others-left')).toBeTruthy();
    expect(mockResetTo).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('reset-continue'));
    expect(mockResetTo).toHaveBeenCalledWith('/');
  });

  it("applies sign-up's rule before a round trip", async () => {
    render(<ResetPassword />);
    fill('short');
    await submit();

    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    expect(screen.getByText('Use at least 10 characters.')).toBeTruthy();
  });

  it('says when the two passwords differ', async () => {
    render(<ResetPassword />);
    fill(GOOD, `${GOOD}x`);
    await submit();

    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    expect(screen.getByText("The passwords don't match.")).toBeTruthy();
  });

  it("puts Supabase's refusal under the password it is about", async () => {
    supabase.auth.updateUser.mockResolvedValueOnce({
      data: { user: null }, error: Object.assign(new Error('weak'), { code: 'weak_password' }),
    } as never);
    render(<ResetPassword />);
    fill('letmein12345');
    await submit();

    expect(screen.getByText(/Choose a stronger password/)).toBeTruthy();
    expect(mockResetTo).not.toHaveBeenCalled();
  });

  it('describes strength in words, not only bars', () => {
    render(<ResetPassword />);
    fireEvent.changeText(screen.getByTestId('reset-new'), 'short');
    expect(screen.getByLabelText('Password strength: Too short')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('reset-new'), GOOD);
    expect(screen.getByLabelText('Password strength: Strong')).toBeTruthy();
  });
});

describe('signed in, but not by a reset', () => {
  it('sets nothing, and sends the person where the old password is asked for', () => {
    mockSession.recovering = false;
    render(<ResetPassword />);
    expect(screen.queryByTestId('reset-new')).toBeNull();
    fireEvent.press(screen.getByTestId('reset-go-security'));
    expect(mockReplace).toHaveBeenCalledWith('/settings/security');
  });
});

describe('signed out, with the code from the email', () => {
  beforeEach(() => { mockSession.status = 'signed-out'; });

  it('carries the address from the request screen', () => {
    mockParams = { email: 'haneef@example.com' };
    render(<ResetPassword />);
    expect(screen.getByTestId('reset-email').props.value).toBe('haneef@example.com');
    expect(screen.queryByTestId('reset-new')).toBeNull();
  });

  it('signs this phone in with the code, and then asks for the password', async () => {
    mockParams = { email: 'haneef@example.com' };
    render(<ResetPassword />);
    fireEvent.changeText(screen.getByTestId('reset-code'), ' 123 456 ');
    await act(async () => { fireEvent.press(screen.getByTestId('reset-verify')); });

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'haneef@example.com', token: '123456', type: 'recovery',
    });
    expect(mockAdopt).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: expect.any(String) }), { recovery: true },
    );
  });

  it('says a wrong or old code plainly, under the code', async () => {
    mockParams = { email: 'haneef@example.com' };
    render(<ResetPassword />);
    fireEvent.changeText(screen.getByTestId('reset-code'), '999999');
    await act(async () => { fireEvent.press(screen.getByTestId('reset-verify')); });

    expect(screen.getByText(/That code is not right, or has expired/)).toBeTruthy();
    expect(mockAdopt).not.toHaveBeenCalled();
  });

  it('asks for the address and a six-digit code before calling anyone', async () => {
    render(<ResetPassword />);
    await act(async () => { fireEvent.press(screen.getByTestId('reset-verify')); });
    expect(screen.getByText('Enter your email address.')).toBeTruthy();
    expect(screen.getByText('Enter the 6-digit code from the email.')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('reset-email'), 'haneef@example.com');
    fireEvent.changeText(screen.getByTestId('reset-code'), '12ab');
    await act(async () => { fireEvent.press(screen.getByTestId('reset-verify')); });

    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
    expect(screen.getByText('Enter the 6-digit code from the email.')).toBeTruthy();
  });

  it('offers a new email', () => {
    render(<ResetPassword />);
    fireEvent.press(screen.getByTestId('reset-request-new'));
    expect(mockReplace).toHaveBeenCalledWith('/forgot-password');
  });
});
