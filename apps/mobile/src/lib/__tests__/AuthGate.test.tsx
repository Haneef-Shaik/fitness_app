/**
 * Signing out has to take you somewhere.
 *
 * The redirect used to live only in `app/index.tsx`, which renders at `/`. Once
 * a user had navigated to `/home`, flipping `status` to `signed-out` changed
 * nothing on screen: the dashboard stayed up with a "U" where the avatar had
 * been, and the next query 401'd into "Something went wrong". Found on a phone,
 * by a test harness that signed out and then could not find the login screen.
 *
 * It matters beyond the sign-out button. G3's refresh stampede ended in exactly
 * this state — the session revoked mid-workout — and the honest answer to that
 * is the login screen, not a dashboard that no longer works.
 */
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { AuthGate } from '../AuthGate';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a), push: jest.fn(), back: jest.fn() },
}));

// `mock`-prefixed: Jest forbids a mock factory closing over anything else.
const mockSession = { status: 'loading' };
jest.mock('../session', () => ({ useSession: () => mockSession }));

beforeEach(() => { jest.clearAllMocks(); mockSession.status = 'loading'; });

it('stays put while the session is still loading', () => {
  render(<AuthGate />);
  expect(mockReplace).not.toHaveBeenCalled();
});

it('leaves a ready session alone', () => {
  mockSession.status = 'ready';
  render(<AuthGate />);
  expect(mockReplace).not.toHaveBeenCalled();
});

it('sends a signed-out session to the welcome screen', () => {
  mockSession.status = 'signed-out';
  render(<AuthGate />);
  expect(mockReplace).toHaveBeenCalledWith('/welcome');
});

it('redirects when the session is lost mid-session, not only at startup', () => {
  // The case the old guard could not see: already deep in the app when the
  // token goes. Rendering at `/` is not what happens here.
  mockSession.status = 'ready';
  const view = render(<AuthGate />);
  expect(mockReplace).not.toHaveBeenCalled();

  act(() => { mockSession.status = 'signed-out'; view.rerender(<AuthGate />); });

  expect(mockReplace).toHaveBeenCalledWith('/welcome');
});
