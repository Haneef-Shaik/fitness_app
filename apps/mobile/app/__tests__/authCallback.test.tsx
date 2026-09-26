/**
 * Where every link in an email from Supabase Auth lands (docs/14).
 *
 * A link carries a PKCE code that becomes a session here; a reset goes on to
 * the new password. The first of an address change's two links carries only a
 * message — halfway, not a failure — and a link Supabase refused says why in
 * FitLog's words, with a way on.
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import * as supabaseModule from '@/lib/supabase';

const { supabase } = supabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: (...a: unknown[]) => mockReplace(...a), back: jest.fn() },
  useLocalSearchParams: () => mockParams,
  usePathname: () => '/auth/callback',
}));
const mockResetTo = jest.fn();
jest.mock('@/lib/navigation', () => ({ resetTo: (...a: unknown[]) => mockResetTo(...a) }));
const mockAdopt = jest.fn(async (_s: unknown) => {});
jest.mock('@/lib/session', () => ({ useSession: () => ({ adoptSession: mockAdopt }) }));

import AuthCallback from '../auth/callback';

beforeEach(() => { jest.clearAllMocks(); mockParams = {}; });

it('signs in with the code and goes into the app', async () => {
  mockParams = { code: 'good' };
  render(<AuthCallback />);
  expect(screen.getByTestId('auth-callback-working')).toBeTruthy();

  await waitFor(() => expect(mockResetTo).toHaveBeenCalledWith('/'));
  expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('good');
  expect(mockAdopt).toHaveBeenCalledWith(
    expect.objectContaining({ access_token: expect.any(String) }), { recovery: false },
  );
});

it('sends a reset on to choosing the new password — known from Supabase, not the link', async () => {
  mockParams = { code: 'recovery' };
  render(<AuthCallback />);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/reset-password'));
  expect(mockAdopt).toHaveBeenCalledWith(expect.anything(), { recovery: true });
  expect(mockResetTo).not.toHaveBeenCalled();
});

it('a link that only CLAIMS to be a reset is not one', async () => {
  mockParams = { code: 'good', next: 'reset-password', type: 'recovery' };
  render(<AuthCallback />);
  await waitFor(() => expect(mockResetTo).toHaveBeenCalledWith('/'));
  expect(mockReplace).not.toHaveBeenCalledWith('/reset-password');
});

it('says a code that will not exchange is for the phone that asked', async () => {
  mockParams = { code: 'bad' };
  render(<AuthCallback />);
  expect(await screen.findByText('Open the link on the phone you asked for it on.')).toBeTruthy();
  expect(mockAdopt).not.toHaveBeenCalled();
});

it('says a link Supabase refused in FitLog’s words', () => {
  mockParams = { error: 'access_denied', error_code: 'otp_expired', error_description: 'Email+link+is+invalid' };
  render(<AuthCallback />);
  expect(screen.getByText('That link has expired or was already used. Ask for a new one.')).toBeTruthy();
  expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
});

it('never shows the link’s own words — anyone can write a link', () => {
  mockParams = { error_code: 'unexpected_failure', error_description: 'Call+0800+to+restore+your+account' };
  render(<AuthCallback />);
  expect(screen.getByText('That link did not work. Ask for a new one.')).toBeTruthy();
  expect(screen.queryByText(/0800/)).toBeNull();
});

it('says the first of two address-change links is halfway, not a failure', () => {
  mockParams = { message: 'Confirmation link accepted. Please proceed to confirm link sent to the other email' };
  render(<AuthCallback />);
  expect(screen.getByTestId('auth-callback-halfway')).toBeTruthy();
  fireEvent.press(screen.getByTestId('auth-callback-done'));
  expect(mockResetTo).toHaveBeenCalledWith('/');
});

it('a link with nothing in it offers a way on', () => {
  render(<AuthCallback />);
  expect(screen.getByText(/That link is incomplete/)).toBeTruthy();
  fireEvent.press(screen.getByTestId('auth-callback-login'));
  expect(mockResetTo).toHaveBeenCalledWith('/login');
  fireEvent.press(screen.getByLabelText('Reset my password'));
  expect(mockReplace).toHaveBeenCalledWith('/forgot-password');
});
