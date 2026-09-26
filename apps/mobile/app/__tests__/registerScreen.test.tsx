/**
 * A-03 · Sign up — the password rule it now shares with A-05 and K-02.
 *
 * The meter was bars only, and nine characters lit three of them while the
 * server refused anything under ten. It now says what it means in words, from
 * the same rule the reset and change screens use.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  usePathname: () => '/register',
}));
jest.mock('@/lib/navigation', () => ({ resetTo: jest.fn() }));
jest.mock('@/lib/session', () => ({ useSession: () => ({ signUp: jest.fn() }) }));

import Register from '../register';

it('states the minimum and names the strength in words', () => {
  render(<Register />);
  expect(screen.getByText('At least 10 characters.')).toBeTruthy();

  fireEvent.changeText(screen.getByTestId('register-password'), 'a'.repeat(9));
  expect(screen.getByLabelText('Password strength: Too short')).toBeTruthy();

  fireEvent.changeText(screen.getByTestId('register-password'), 'correct-horse-battery');
  expect(screen.getByLabelText('Password strength: Strong')).toBeTruthy();
});
