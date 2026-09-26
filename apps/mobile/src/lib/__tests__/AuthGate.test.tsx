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
const mockRoute = { path: '/home' };
jest.mock('expo-router', () => ({
  router: {
    replace: (...a: unknown[]) => mockReplace(...a), push: jest.fn(), back: jest.fn(),
    canDismiss: () => false, dismissAll: jest.fn(),
  },
  usePathname: () => mockRoute.path,
}));

// `mock`-prefixed: Jest forbids a mock factory closing over anything else.
const mockSession = { status: 'loading' };
jest.mock('../session', () => ({ useSession: () => mockSession }));

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.status = 'loading';
  mockRoute.path = '/home';
});

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

describe('it must not bounce someone off a screen they chose', () => {
  it('leaves the login screen alone when the session settles as signed-out', () => {
    // The race the emulator exposed, and a user hits it by being quick:
    //   cold start -> /welcome, status still 'loading'
    //   tap "I already have one" -> /login
    //   restore finishes -> status becomes 'signed-out'
    // Redirecting on that transition throws the user off the login screen they
    // deliberately opened. On a fast device the restore wins the race and it
    // looks fine; on a slow one the tap does nothing at all.
    mockSession.status = 'loading';
    mockRoute.path = '/login';
    const view = render(<AuthGate />);

    act(() => { mockSession.status = 'signed-out'; view.rerender(<AuthGate />); });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('leaves /register and /welcome alone too', () => {
    for (const path of ['/register', '/welcome']) {
      jest.clearAllMocks();
      mockRoute.path = path;
      mockSession.status = 'signed-out';

      render(<AuthGate />);

      expect(mockReplace).not.toHaveBeenCalled();
    }
  });

  it('leaves the emailed-link screens alone — their links arrive signed out (A-05, A-06)', () => {
    for (const path of ['/forgot-password', '/reset-password', '/verify-email']) {
      jest.clearAllMocks();
      mockRoute.path = path;
      mockSession.status = 'signed-out';

      render(<AuthGate />);

      expect(mockReplace).not.toHaveBeenCalled();
    }
  });

  it('still rescues someone stranded on a screen that needs a session', () => {
    // The case the gate exists for: the token goes while deep in the app.
    mockRoute.path = '/session/abc';
    mockSession.status = 'ready';
    const view = render(<AuthGate />);

    act(() => { mockSession.status = 'signed-out'; view.rerender(<AuthGate />); });

    expect(mockReplace).toHaveBeenCalledWith('/welcome');
  });
});
