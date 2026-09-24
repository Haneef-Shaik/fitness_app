/**
 * A-07 … A-10 · the onboarding flow, end to end on the screen (G10).
 *
 * The old onboarding computed every target from a hard-coded BMR of 1,680. The
 * rules pinned here: the target comes from the answers; the profile is saved
 * step by step; the goal and the baseline check-in are written ONCE; the
 * chosen program is copied; and onboarding is only marked complete at the end.
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockReset = jest.fn();
jest.mock('@/lib/navigation', () => ({ resetTo: (...a: unknown[]) => mockReset(...a) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));

const mockPatch = jest.fn(async (_b: Record<string, unknown>) => ({}));
const mockGoal = jest.fn(async (_g: Record<string, unknown>) => ({ id: 'g1' }));
const mockGoals = jest.fn(async (): Promise<Record<string, unknown>[]> => []);
const mockGoalPatch = jest.fn(async (_id: string, _b: Record<string, unknown>) => ({ id: 'g0' }));
jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return {
    ...actual,
    profileApi: { patch: (b: Record<string, unknown>) => mockPatch(b), get: jest.fn() },
    goalsApi: {
      create: (g: Record<string, unknown>) => mockGoal(g),
      list: () => mockGoals(),
      patch: (id: string, b: Record<string, unknown>) => mockGoalPatch(id, b),
    },
  };
});

const mockStart = jest.fn(async (_k: string) => ({ id: 'p1' }));
jest.mock('@/lib/api-catalog', () => ({ programsApi: { startTemplate: (k: string) => mockStart(k) } }));

const mockQueue = jest.fn(async (_m: Record<string, unknown>) => ({ clientId: 'c', idempotencyKey: 'k' }));
jest.mock('@/features/body/logMetric', () => ({ queueMetric: (m: Record<string, unknown>) => mockQueue(m) }));

const mockRefresh = jest.fn(async () => {});
jest.mock('@/lib/session', () => ({
  useSession: () => ({ refreshProfile: mockRefresh, profile: { timezone: 'UTC', display_name: null } }),
}));

const TEMPLATE = {
  key: 'stronglifts-5x5', name: '5×5 Linear Progression', summary: 'Five by five.', level: 'beginner',
  focus: 'strength', equipment: 'full_gym', session_minutes: 45, days_per_week: 3,
  schedule: 'Three days', progression: 'Add weight', based_on: 'StrongLifts 5×5', fits: true,
  recommended: true, reasons: ['Matches your 3 days a week'],
  days: [{ name: 'Workout A', scheduled_weekday: null, notes: null, exercises: [
    { name: 'Barbell Squat', sets: 5, reps_min: 5, reps_max: 5, duration_seconds: null, rest_seconds: 180 },
  ] }],
};
jest.mock('@/lib/query/hooks', () => ({
  useProgramTemplates: () => ({
    data: [TEMPLATE], isPending: false, isError: false, error: null, refetch: jest.fn(),
  }),
}));

import Onboarding from '../onboarding';

const cont = async () => { await act(async () => { fireEvent.press(screen.getByTestId('onboarding-continue')); }); };
const type = (id: string, v: string) => fireEvent.changeText(screen.getByTestId(id), v);

beforeEach(() => { jest.clearAllMocks(); mockGoals.mockResolvedValue([]); });

async function answerThroughMeasurements() {
  render(<Onboarding />);
  // 1 units
  fireEvent.press(screen.getByTestId('units-metric'));
  await cont();
  // 2 about you
  type('about-name', 'Haneef');
  fireEvent.press(screen.getByTestId('about-sex-male'));
  type('about-dob-d', '12'); type('about-dob-m', '3'); type('about-dob-y', '1996');
  type('about-height', '180');
  type('about-weight', '84');
  await cont();
  // 3 activity
  fireEvent.press(screen.getByTestId('activity-moderate'));
  await cont();
  // 4 goal
  fireEvent.press(screen.getByTestId('goal-fat_loss'));
  type('goal-target', '76');
  fireEvent.press(screen.getByTestId('goal-pace-0.5'));
  await cont();
  // 5 training
  fireEvent.press(screen.getByTestId('experience-beginner'));
  fireEvent.press(screen.getByTestId('days-3'));
  fireEvent.press(screen.getByTestId('minutes-60'));
  fireEvent.press(screen.getByTestId('equipment-full_gym'));
  await cont();
  // 6 measurements
  type('measure-waist_cm', '92');
  await cont();
}

it('the target is computed from the answers — not a constant', async () => {
  await answerThroughMeasurements();
  // Mifflin–St Jeor for 84 kg, 180 cm, male, born 1996 → ~2,852 maintenance at
  // "moderate", minus 550 for 0.5 kg/week. Not 1,680 × anything.
  const kcal = Number(String(screen.getByTestId('targets-kcal').props.children).replace(/,/g, ''));
  expect(kcal).toBeGreaterThan(2100);
  expect(kcal).toBeLessThan(2400);
});

it('saves the profile step by step, with the training answers', async () => {
  await answerThroughMeasurements();
  const last = mockPatch.mock.calls.at(-1)![0];
  expect(last).toMatchObject({
    display_name: 'Haneef', sex: 'male', height_cm: 180, birth_date: '1996-03-12',
    training_experience: 'beginner', training_days_per_week: 3, session_minutes: 60, equipment: 'full_gym',
  });
  expect(mockPatch.mock.calls.every(([b]) => !('onboarding_completed' in b))).toBe(true);
});

it('"Looks good" writes targets, the goal and the baseline check-in — once', async () => {
  await answerThroughMeasurements();
  await cont();                                       // Looks good
  expect(mockGoal).toHaveBeenCalledTimes(1);
  expect(mockGoal.mock.calls[0]![0]).toMatchObject({
    goal_type: 'fat_loss', direction: 'down', start_value: 84, target_value: 76, weekly_rate: 0.5,
  });
  expect(mockQueue.mock.calls.map(([m]) => m.metric_key)).toEqual(['body_weight', 'waist_cm']);
  expect(mockPatch.mock.calls.some(([b]) => 'daily_calorie_target' in b)).toBe(true);

  // Back to targets and forward again: nothing is written twice.
  await act(async () => { fireEvent.press(screen.getByLabelText('Back')); });
  await cont();
  expect(mockGoal).toHaveBeenCalledTimes(1);
  expect(mockQueue).toHaveBeenCalledTimes(2);
});

it('copies the chosen program and finishes on the dashboard', async () => {
  await answerThroughMeasurements();
  await cont();                                       // Looks good
  fireEvent.press(screen.getByTestId('program-stronglifts-5x5'));
  await cont();                                       // Use this program
  expect(mockStart).toHaveBeenCalledWith('stronglifts-5x5');
  expect(screen.getByText(/program is ready/)).toBeTruthy();
  // The weight is not "a measurement": it said "(2 measurements)" for weight + waist.
  expect(screen.getByText(/check-in is recorded \(weight and 1 measurement\)/)).toBeTruthy();
  await cont();                                       // Go to my dashboard
  expect(mockPatch).toHaveBeenLastCalledWith({ onboarding_completed: true });
  expect(mockRefresh).toHaveBeenCalled();
  expect(mockReset).toHaveBeenCalledWith('/home');
});

it('units cannot be skipped; later steps can', async () => {
  render(<Onboarding />);
  expect(screen.queryByLabelText('Skip this step')).toBeNull();
  await cont();
  expect(screen.getByLabelText('Skip this step')).toBeTruthy();
});

it('an unusual value is questioned once, then allowed', async () => {
  render(<Onboarding />);
  await cont();
  type('about-height', '300');
  await cont();
  expect(screen.getByText(/height looks unusual/)).toBeTruthy();
  const before = mockPatch.mock.calls.length;
  await cont();
  expect(mockPatch.mock.calls.length).toBe(before + 1);   // advanced
});

it('stops someone under 13 (A-07)', async () => {
  render(<Onboarding />);
  await cont();
  const year = String(new Date().getUTCFullYear() - 10);
  type('about-dob-d', '1'); type('about-dob-m', '1'); type('about-dob-y', year);
  await waitFor(() => expect(screen.getByText(/aged 13 and over/)).toBeTruthy());
  expect(screen.getByTestId('onboarding-continue').props.accessibilityState.disabled).toBe(true);
});

it('coming back after "Looks good" updates the goal it already wrote instead of adding a second', async () => {
  // The app can be closed between "Looks good" and the last step; onboarding
  // then starts again. It used to create a second active goal.
  mockGoals.mockResolvedValue([
    { id: 'old', status: 'achieved', goal_type: 'fat_loss', metric_key: 'body_weight' },
    { id: 'g0', status: 'active', goal_type: 'fat_loss', metric_key: 'body_weight' },
  ]);
  await answerThroughMeasurements();
  await cont();                                       // Looks good
  expect(mockGoal).not.toHaveBeenCalled();
  expect(mockGoalPatch).toHaveBeenCalledWith('g0', { target_value: 76, weekly_rate: 0.5 });
});
