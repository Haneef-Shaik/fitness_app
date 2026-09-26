/**
 * Importing from Strong or Hevy: the phone reads the file, the server previews,
 * and nothing is written until the user has seen what will happen.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), back: jest.fn() } }));
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///strong.csv', name: 'strong.csv' }] })),
}));
jest.mock('expo-file-system/legacy', () => ({ readAsStringAsync: jest.fn(async () => 'Date,Workout Name\n') }));

const REPORT = {
  format: 'strong', sessions_found: 3, sessions_new: 2, sessions_already_imported: 1, sets: 24,
  exercises_matched: { 'Bench Press (Barbell)': 'Barbell Bench Press' },
  exercises_to_create: ['Zercher Carry'], skipped_rows: { 'rest timer rows': 5 }, dry_run: true,
};
const mockPost = jest.fn(async (_p: string, body: { dry_run: boolean }) =>
  ({ ...REPORT, dry_run: body.dry_run }));
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: { post: (p: string, b: { dry_run: boolean }) => mockPost(p, b) },
}));

import ImportHistory from '../settings/import';

beforeEach(() => jest.clearAllMocks());

it('previews first, writes nothing, and shows every decision', async () => {
  render(<ImportHistory />);
  fireEvent.press(screen.getByTestId('import-unit-lb'));
  fireEvent.press(screen.getByTestId('import-choose'));

  await waitFor(() => expect(screen.getByTestId('import-preview')).toBeTruthy());
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(mockPost.mock.calls[0]![1]).toMatchObject({ dry_run: true, weight_unit: 'lb' });
  expect(screen.getByText('Bench Press (Barbell) → Barbell Bench Press')).toBeTruthy();
  expect(screen.getByText('Zercher Carry')).toBeTruthy();
  expect(screen.getByText('5 rest timer rows')).toBeTruthy();
});

it('imports only when confirmed', async () => {
  render(<ImportHistory />);
  fireEvent.press(screen.getByTestId('import-choose'));
  await waitFor(() => expect(screen.getByTestId('import-confirm')).toBeTruthy());

  fireEvent.press(screen.getByTestId('import-confirm'));

  await waitFor(() => expect(screen.getByTestId('import-done')).toBeTruthy());
  expect(mockPost.mock.calls[1]![1]).toMatchObject({ dry_run: false });
});

it('imports nutrition from MyFitnessPal through its own endpoint', async () => {
  mockPost.mockImplementation(async (_p: string, body: { dry_run: boolean }) => ({
    format: 'myfitnesspal', meals_found: 3, meals_new: 3, meals_already_imported: 0,
    first_day: '2025-02-10', last_day: '2025-02-10', skipped_rows: {}, dry_run: body.dry_run,
  }) as never);
  render(<ImportHistory />);
  fireEvent.press(screen.getByTestId('import-kind-nutrition'));
  fireEvent.press(screen.getByTestId('import-choose'));

  await waitFor(() => expect(screen.getByText(/3 new meals from 2025-02-10/)).toBeTruthy());
  expect(mockPost.mock.calls[0]![0]).toBe('/imports/nutrition');
  fireEvent.press(screen.getByTestId('import-confirm'));
  await waitFor(() => expect(screen.getByTestId('import-done')).toBeTruthy());
});
