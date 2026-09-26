/**
 * K-01 · Your details (G10). Onboarding asks for birth date, sex, height,
 * activity and how someone trains — and until now nothing let them change any
 * of it afterwards. This screen edits the same answers with the same pieces.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ router: { back: () => mockBack(), push: jest.fn() } }));

const mockPatch = jest.fn(async (_b: Record<string, unknown>) => ({}));
jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, profileApi: { patch: (b: Record<string, unknown>) => mockPatch(b), get: jest.fn() } };
});

const mockRefresh = jest.fn(async () => {});
const PROFILE = {
  display_name: 'Sam', preferred_unit_system: 'metric', timezone: 'Europe/London', sex: 'male',
  birth_date: '1994-06-14', height_cm: 178, activity_level: 'light', training_experience: 'beginner',
  training_days_per_week: 3, session_minutes: 60, equipment: 'full_gym', checkin_interval_days: 7,
};
jest.mock('@/lib/session', () => ({
  useSession: () => ({ profile: PROFILE, refreshProfile: mockRefresh, email: 'sam@example.com' }),
}));

import ProfileDetails from '../settings/profile';

beforeEach(() => jest.clearAllMocks());

const save = async () => { await act(async () => { fireEvent.press(screen.getByTestId('profile-save')); }); };

it('opens on what was saved', () => {
  render(<ProfileDetails />);
  expect(screen.getByTestId('about-name').props.value).toBe('Sam');
  expect(screen.getByTestId('about-height').props.value).toBe('178');
  expect(screen.getByTestId('about-dob-y').props.value).toBe('1994');
  expect(screen.getByTestId('experience-beginner').props.accessibilityState.checked).toBe(true);
  // Weight is a check-in, with its own history — not a setting.
  expect(screen.queryByTestId('about-weight')).toBeNull();
});

it('saves the changes, refreshes the session and goes back', async () => {
  render(<ProfileDetails />);
  fireEvent.changeText(screen.getByTestId('about-height'), '179');
  fireEvent.press(screen.getByTestId('days-4'));
  fireEvent.press(screen.getByTestId('checkin-14'));
  await save();
  expect(mockPatch).toHaveBeenCalledWith(expect.objectContaining({
    height_cm: 179, training_days_per_week: 4, checkin_interval_days: 14, display_name: 'Sam',
  }));
  expect(mockRefresh).toHaveBeenCalled();
  expect(mockBack).toHaveBeenCalled();
});

it('switching to imperial shows the same height in feet and inches, and saves it in cm', async () => {
  render(<ProfileDetails />);
  fireEvent.press(screen.getByTestId('units-imperial'));
  expect(screen.getByTestId('about-height-ft').props.value).toBe('5');
  expect(screen.getByTestId('about-height-in').props.value).toBe('10');
  await save();
  const body = mockPatch.mock.calls[0]![0];
  expect(body.preferred_unit_system).toBe('imperial');
  expect(body.height_cm).toBeCloseTo(177.8, 1);
});

it('a failed save says so and stays on the screen', async () => {
  mockPatch.mockRejectedValueOnce(new Error('offline'));
  render(<ProfileDetails />);
  await save();
  expect(screen.getByTestId('profile-error')).toBeTruthy();
  expect(mockBack).not.toHaveBeenCalled();
});

it('a refused field says why — the server holds the age rule (A-07, Q9)', async () => {
  const { ApiError } = jest.requireActual('@/lib/api');
  mockPatch.mockRejectedValueOnce(new ApiError(
    'VALIDATION_FAILED', 'Some details need fixing.', 422,
    { birth_date: 'FitLog is for people aged 16 and over.' },
  ));
  render(<ProfileDetails />);
  await save();
  expect(screen.getByTestId('profile-error').props.children).toBe('FitLog is for people aged 16 and over.');
  expect(mockBack).not.toHaveBeenCalled();
});
