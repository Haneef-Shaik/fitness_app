/**
 * L-05 — a session that ends mid-use asks for the password over the current
 * screen. Nothing navigates; the screen underneath is left exactly as it was.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ApiError } from '@/lib/api';
import { SessionExpiredDialog } from '../SessionExpiredDialog';

const mockSession = {
  expired: true,
  email: 'a@b.com',
  reauthenticate: jest.fn(async (_pw: string) => {}),
  signOut: jest.fn(async () => {}),
};
jest.mock('@/lib/session', () => ({ useSession: () => mockSession }));

beforeEach(() => { jest.clearAllMocks(); mockSession.expired = true; });

it('is not there while the session is live', () => {
  mockSession.expired = false;
  render(<SessionExpiredDialog />);
  expect(screen.queryByTestId('expired-password')).toBeNull();
});

it('names the account and signs it back in with the password', async () => {
  render(<SessionExpiredDialog />);
  expect(screen.getByText(/a@b\.com/)).toBeTruthy();

  fireEvent.changeText(screen.getByTestId('expired-password'), 'correct-horse-battery');
  fireEvent.press(screen.getByTestId('expired-submit'));

  await waitFor(() => expect(mockSession.reauthenticate).toHaveBeenCalledWith('correct-horse-battery'));
});

it('says a wrong password plainly, and stays', async () => {
  mockSession.reauthenticate.mockRejectedValueOnce(new ApiError('unauthorized', 'bad', 401));
  render(<SessionExpiredDialog />);

  fireEvent.changeText(screen.getByTestId('expired-password'), 'nope-nope-nope');
  fireEvent.press(screen.getByTestId('expired-submit'));

  await waitFor(() => expect(screen.getByTestId('expired-error')).toBeTruthy());
  expect(screen.getByText("That password didn't match. Try again.")).toBeTruthy();
});

it('offers signing out instead', () => {
  render(<SessionExpiredDialog />);
  fireEvent.press(screen.getByTestId('expired-signout'));
  expect(mockSession.signOut).toHaveBeenCalled();
});
