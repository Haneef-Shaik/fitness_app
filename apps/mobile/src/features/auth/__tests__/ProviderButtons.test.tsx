/**
 * "Continue with Google" / "Continue with Apple" (docs/14, S7): shown only
 * where they can work, and a closed sheet is not an error.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as auth from '../supabaseAuth';
import { ProviderButtons } from '../ProviderButtons';

const mockResetTo = jest.fn();
jest.mock('@/lib/navigation', () => ({ resetTo: (...a: unknown[]) => mockResetTo(...a) }));
const mockGoogle = jest.fn(async (): Promise<boolean> => true);
jest.mock('@/lib/session', () => ({
  useSession: () => ({ signInWithGoogle: mockGoogle, signInWithApple: jest.fn() }),
}));

const onProblem = jest.fn();

beforeEach(() => { jest.clearAllMocks(); });
afterEach(() => jest.restoreAllMocks());

it('renders nothing in a build with no provider — the email form stands alone', () => {
  render(<ProviderButtons onProblem={onProblem} />);
  expect(screen.queryByTestId('provider-buttons')).toBeNull();
});

describe('with Google configured', () => {
  beforeEach(() => { jest.spyOn(auth, 'googleConfigured').mockReturnValue(true); });

  it('signs in and goes into the app', async () => {
    render(<ProviderButtons onProblem={onProblem} />);
    expect(screen.getByText('or with email')).toBeTruthy();
    await act(async () => { fireEvent.press(screen.getByTestId('continue-google')); });
    expect(mockGoogle).toHaveBeenCalled();
    expect(mockResetTo).toHaveBeenCalledWith('/');
  });

  it('stays put when the chooser is closed', async () => {
    mockGoogle.mockResolvedValueOnce(false);
    render(<ProviderButtons onProblem={onProblem} />);
    await act(async () => { fireEvent.press(screen.getByTestId('continue-google')); });
    expect(mockResetTo).not.toHaveBeenCalled();
    expect(onProblem).not.toHaveBeenCalled();
  });

  it('hands a problem to the screen, in words', async () => {
    mockGoogle.mockRejectedValueOnce(new auth.AuthProblem('Google Play services are needed.'));
    render(<ProviderButtons onProblem={onProblem} />);
    await act(async () => { fireEvent.press(screen.getByTestId('continue-google')); });
    expect(onProblem).toHaveBeenCalledWith('Google Play services are needed.');

    mockGoogle.mockRejectedValueOnce(new Error('native crash'));
    await act(async () => { fireEvent.press(screen.getByTestId('continue-google')); });
    expect(onProblem).toHaveBeenLastCalledWith('That did not work. Try again.');
  });
});
