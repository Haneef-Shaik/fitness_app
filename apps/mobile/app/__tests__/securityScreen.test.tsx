/**
 * K-02 · Account & security (Supabase Auth, docs/14).
 *
 * Three things someone holding an unlocked phone should not be able to do
 * quietly, so each asks for the password or the new inbox and says, BEFORE it
 * happens, what it will do to other devices (K-02). Every result is stated in
 * words on the screen. A Google or Apple account has no password here, and
 * its address is the provider's.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as supabaseModule from '@/lib/supabase';

const { fakeAuth, supabase } = supabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
  usePathname: () => '/settings/security',
}));

const mockRefreshAccount = jest.fn(async () => {});
const mockSession = {
  status: 'ready', email: 'haneef@example.com',
  provider: 'email' as string | null, pendingEmail: null as string | null,
};
jest.mock('@/lib/session', () => ({
  useSession: () => ({ ...mockSession, refreshAccount: mockRefreshAccount }),
}));

import Security from '../settings/security';

const PASSWORD = 'correct-horse-battery';
const press = async (label: string) => {
  await act(async () => { fireEvent.press(screen.getByLabelText(label)); });
};
const authError = (code: string) => ({ data: { user: null }, error: Object.assign(new Error(code), { code }) });

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.provider = 'email';
  mockSession.pendingEmail = null;
  fakeAuth.accounts.set('haneef@example.com', PASSWORD);
  fakeAuth.signIn({ email: 'haneef@example.com' });
});

describe('email', () => {
  it('shows the address', () => {
    render(<Security />);
    expect(screen.getByText('haneef@example.com')).toBeTruthy();
    expect(screen.queryByTestId('signed-in-with')).toBeNull();
  });

  it('shows a change that is waiting on its links', () => {
    mockSession.pendingEmail = 'new@example.com';
    render(<Security />);
    expect(screen.getByText(/Waiting for you to confirm new@example\.com/)).toBeTruthy();
  });

  it('asks for the password, and says nothing changes until the links are opened', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change email'));
    fireEvent.changeText(screen.getByTestId('email-new'), ' New@Example.com ');
    fireEvent.changeText(screen.getByTestId('email-password'), PASSWORD);
    await press('Send confirmation link');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'haneef@example.com', password: PASSWORD });
    expect(supabase.auth.updateUser).toHaveBeenCalledWith(
      { email: 'New@Example.com' }, { emailRedirectTo: 'fitlog://auth/callback' },
    );
    expect(mockRefreshAccount).toHaveBeenCalled();
    expect(screen.getByText(/We sent confirmation links to New@Example\.com/)).toBeTruthy();
  });

  it('refuses a wrong password, under the password, and moves nothing', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change email'));
    fireEvent.changeText(screen.getByTestId('email-new'), 'new@example.com');
    fireEvent.changeText(screen.getByTestId('email-password'), 'not-the-password');
    await press('Send confirmation link');

    expect(screen.getByText('Your current password is not right.')).toBeTruthy();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('puts an address already in use under the new address', async () => {
    supabase.auth.updateUser.mockResolvedValueOnce(authError('email_exists') as never);
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change email'));
    fireEvent.changeText(screen.getByTestId('email-new'), 'taken@example.com');
    fireEvent.changeText(screen.getByTestId('email-password'), PASSWORD);
    await press('Send confirmation link');

    expect(screen.getByText('An account already uses this email.')).toBeTruthy();
  });

  it('asks for both fields before calling anyone', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change email'));
    await press('Send confirmation link');
    expect(screen.getByText('Enter the new email address.')).toBeTruthy();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
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

  it('checks the current password, sets the new one, and signs every other device out', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change password'));
    fill(PASSWORD, 'a-much-better-passphrase');
    await press('Save new password');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'haneef@example.com', password: PASSWORD });
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'a-much-better-passphrase' });
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'others' });
    expect(fakeAuth.session).not.toBeNull(); // this phone stays signed in
    expect(screen.getByText(/Password changed/)).toBeTruthy();
  });

  it('does not claim the other devices are out when they could not be signed out', async () => {
    supabase.auth.signOut.mockResolvedValueOnce({
      error: Object.assign(new Error('Failed to fetch'), { name: 'AuthRetryableFetchError' }),
    } as never);
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change password'));
    fill(PASSWORD, 'a-much-better-passphrase');
    await press('Save new password');

    expect(screen.getByText(/other devices could not be signed out just now/)).toBeTruthy();
  });

  it('checks the new pair before sending anything', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change password'));
    fill(PASSWORD, 'a-much-better-passphrase', 'something-else-entirely');
    await press('Save new password');

    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(screen.getByText("The passwords don't match.")).toBeTruthy();
  });

  it('puts a wrong current password under that field', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change password'));
    fill('wrong-password-here', 'a-much-better-passphrase');
    await press('Save new password');

    expect(screen.getByText('Your current password is not right.')).toBeTruthy();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('puts a password Supabase will not take under the new password', async () => {
    supabase.auth.updateUser.mockResolvedValueOnce(authError('weak_password') as never);
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Change password'));
    fill(PASSWORD, 'password12345');
    await press('Save new password');

    expect(screen.getByText(/Choose a stronger password/)).toBeTruthy();
  });
});

describe('a Google or Apple account', () => {
  it('says how they signed in, and offers no password or address form', () => {
    mockSession.provider = 'google';
    render(<Security />);
    expect(screen.getByText('Signed in with Google')).toBeTruthy();
    expect(screen.getByText(/Change it with Google/)).toBeTruthy();
    expect(screen.queryByLabelText('Change email')).toBeNull();
    expect(screen.queryByLabelText('Change password')).toBeNull();
    // Other devices still apply.
    expect(screen.getByLabelText('Sign out other devices')).toBeTruthy();
  });
});

describe('other devices', () => {
  it('asks first, and does nothing if they back out', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Sign out other devices'));
    expect(screen.getByTestId('signout-others-confirm')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Cancel'));
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
    expect(screen.queryByTestId('signout-others-confirm')).toBeNull();
  });

  it('ends every other sign-in and keeps this one', async () => {
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Sign out other devices'));
    await press('Yes, sign them out');

    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'others' });
    expect(fakeAuth.session).not.toBeNull();
    expect(screen.getByText('Every other device is signed out. This phone is still signed in.')).toBeTruthy();
  });

  it('says so when it did not work', async () => {
    supabase.auth.signOut.mockResolvedValueOnce({
      error: Object.assign(new Error('Failed to fetch'), { name: 'AuthRetryableFetchError' }),
    } as never);
    render(<Security />);
    fireEvent.press(screen.getByLabelText('Sign out other devices'));
    await press('Yes, sign them out');

    expect(screen.getByText(/Could not reach FitLog/)).toBeTruthy();
  });
});
