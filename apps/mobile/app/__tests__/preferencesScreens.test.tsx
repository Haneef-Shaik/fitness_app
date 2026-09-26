/**
 * K-03 and K-04 — the settings that change what the numbers mean.
 *
 * K-04's warm-up switch restates every past workout's volume, and K-03's time
 * zone re-files every past day. Both screens must say so before saving, and
 * both must send exactly what the user chose.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: (...a: unknown[]) => mockBack(...a) },
}));

const q = (data: unknown) => ({ data, isPending: false, isError: false, error: null, refetch: jest.fn() });

const PROFILE = {
  preferred_unit_system: 'metric', timezone: 'Asia/Kolkata', week_starts_on: 1,
  warmups_in_volume: false, show_rpe: false, show_rir: false, default_rest_seconds: null,
  load_step_kg: 2.5, bar_weight_kg: 20, plate_inventory_kg: [25, 20, 15, 10, 5, 2.5, 1.25],
};

const mockMutate = jest.fn((_body?: unknown) => Promise.resolve(PROFILE));
const mockRefresh = jest.fn(async () => {});

jest.mock('@/lib/query/hooks', () => ({
  useProfile: () => q(PROFILE),
  useUpdateProfile: () => ({ mutateAsync: mockMutate, isPending: false }),
}));
jest.mock('@/lib/session', () => ({
  useSession: () => ({ refreshProfile: mockRefresh }),
}));

import LoggingPreferences from '../settings/logging';
import UnitsAndTime from '../settings/units';

beforeEach(() => jest.clearAllMocks());

describe('K-04 · logging preferences', () => {
  it('warns that counting warm-ups recounts the past, before saving', () => {
    render(<LoggingPreferences />);
    expect(screen.queryByTestId('pref-warmups-note')).toBeNull();

    fireEvent.press(screen.getByTestId('pref-warmups'));

    expect(screen.getByTestId('pref-warmups-note')).toBeTruthy();
  });

  it('saves exactly what was chosen', async () => {
    render(<LoggingPreferences />);

    fireEvent.press(screen.getByTestId('pref-warmups'));
    fireEvent.press(screen.getByTestId('pref-rpe'));
    fireEvent.press(screen.getByTestId('pref-rest-120'));
    fireEvent.press(screen.getByTestId('pref-step-1.25'));
    fireEvent.press(screen.getByTestId('pref-bar-15'));
    fireEvent.press(screen.getByTestId('pref-plate-1.25'));   // off
    fireEvent.press(screen.getByTestId('pref-plate-0.5'));    // on
    fireEvent.press(screen.getByTestId('pref-save'));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(mockMutate.mock.calls[0]![0]).toEqual({
      warmups_in_volume: true, show_rpe: true, show_rir: false, default_rest_seconds: 120,
      load_step_kg: 1.25, bar_weight_kg: 15, plate_inventory_kg: [25, 20, 15, 10, 5, 2.5, 0.5],
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('never lets the last plate be removed', () => {
    render(<LoggingPreferences />);
    for (const p of [25, 20, 15, 10, 5, 2.5, 1.25]) fireEvent.press(screen.getByTestId(`pref-plate-${p}`));
    expect(screen.getByTestId('pref-plate-1.25').props.accessibilityState).toEqual({ checked: true });
  });

  it('switches read as switches', () => {
    render(<LoggingPreferences />);
    const s = screen.getByTestId('pref-warmups');
    expect(s.props.accessibilityRole).toBe('switch');
    expect(s.props.accessibilityState).toEqual({ checked: false });
  });
});

describe('K-03 · units and time zone', () => {
  it('says a new time zone re-files the past', () => {
    render(<UnitsAndTime />);
    expect(screen.queryByTestId('tz-warning')).toBeNull();

    fireEvent.changeText(screen.getByTestId('tz-input'), 'Europe/London');

    expect(screen.getByTestId('tz-warning')).toBeTruthy();
  });

  it('saves units, zone and week start together', async () => {
    render(<UnitsAndTime />);

    fireEvent.press(screen.getByTestId('units-imperial'));
    fireEvent.changeText(screen.getByTestId('tz-input'), ' Europe/London ');
    fireEvent.press(screen.getByTestId('week-start-0'));
    fireEvent.press(screen.getByTestId('units-save'));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(mockMutate.mock.calls[0]![0]).toEqual({
      preferred_unit_system: 'imperial', timezone: 'Europe/London', week_starts_on: 0,
    });
  });
});
