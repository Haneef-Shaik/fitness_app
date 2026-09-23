/**
 * Landing somewhere with NOTHING behind it.
 *
 * Found on a phone in G10: signing in went welcome → login → (replaced) home,
 * so the welcome screen sat under the dashboard. Back from the dashboard landed
 * on "Create account / I already have one" — a signed-in user who looked signed
 * out. Every transition across the auth boundary now resets the history.
 */
const mockReplace = jest.fn();
const mockDismissAll = jest.fn();
let mockCanDismiss = true;
jest.mock('expo-router', () => ({
  router: {
    replace: (...a: unknown[]) => mockReplace(...a),
    dismissAll: () => mockDismissAll(),
    canDismiss: () => mockCanDismiss,
  },
}));

import { resetTo } from '../navigation';

beforeEach(() => { jest.clearAllMocks(); mockCanDismiss = true; });

it('clears the history, then lands', () => {
  resetTo('/');
  expect(mockDismissAll).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenCalledWith('/');
  expect(mockDismissAll.mock.invocationCallOrder[0]).toBeLessThan(mockReplace.mock.invocationCallOrder[0]!);
});

it('with nothing to clear, only lands', () => {
  mockCanDismiss = false;
  resetTo('/welcome');
  expect(mockDismissAll).not.toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith('/welcome');
});
