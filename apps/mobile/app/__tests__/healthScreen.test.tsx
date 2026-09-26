/**
 * K-09 — each direction is off until turned on, and turning it on is what
 * asks the health store; a refusal leaves it off and says so.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() } }));

const mockAccess = { weight: true, workouts: false };
const mockBridge = {
  name: 'Health Connect',
  isAvailable: jest.fn(async () => true),
  requestAccess: jest.fn(async () => mockAccess),
  readWeights: jest.fn(async () => []),
  saveWorkout: jest.fn(async () => {}),
};
jest.mock('@/features/health/bridge', () => ({ healthBridge: () => mockBridge }));
const mockPrefs: Record<string, unknown> = {};
jest.mock('@/lib/prefs', () => ({
  getPref: async (k: string, d: unknown) => (k in mockPrefs ? mockPrefs[k] : d),
  setPref: async (k: string, v: unknown) => { mockPrefs[k] = v; },
}));
jest.mock('@/features/body/logMetric', () => ({ queueMetric: jest.fn() }));
const mockImport = jest.fn(async () => 2);
jest.mock('@/features/health/sync', () => ({
  ...jest.requireActual('@/features/health/sync'),
  importWeights: () => mockImport(),
}));

import HealthIntegrations from '../settings/health';

beforeEach(() => { jest.clearAllMocks(); for (const k of Object.keys(mockPrefs)) delete mockPrefs[k]; });

it('names the store and starts with both directions off', async () => {
  render(<HealthIntegrations />);
  await waitFor(() => expect(screen.getByText('Import weight from Health Connect')).toBeTruthy());
  expect(screen.getByTestId('health-weight').props.accessibilityState).toEqual({ checked: false });
  expect(screen.getByTestId('health-workouts').props.accessibilityState).toEqual({ checked: false });
});

it('turning weight on asks the store, then offers a sync', async () => {
  render(<HealthIntegrations />);
  fireEvent.press(screen.getByTestId('health-weight'));

  await waitFor(() => expect(screen.getByTestId('health-weight').props.accessibilityState).toEqual({ checked: true }));
  expect(mockBridge.requestAccess).toHaveBeenCalled();

  fireEvent.press(screen.getByTestId('health-sync'));
  await waitFor(() => expect(screen.getByText('2 weigh-ins added to your progress.')).toBeTruthy());
});

it('a refusal leaves the switch off and says where to change it', async () => {
  render(<HealthIntegrations />);
  fireEvent.press(screen.getByTestId('health-workouts'));

  await waitFor(() => expect(screen.getByTestId('health-note')).toBeTruthy());
  expect(screen.getByTestId('health-workouts').props.accessibilityState).toEqual({ checked: false });
});
