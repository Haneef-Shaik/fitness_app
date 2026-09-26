/** Reminders follow the program, the next check-in and today's log without the screen being opened (B-04, G10). */
import React from 'react';
import { render, renderHook, waitFor } from '@testing-library/react-native';

const mockApply = jest.fn(async (_l: unknown[]) => 0);
let mockGranted = true;
jest.mock('../schedule', () => ({
  applyReminders: (l: unknown[]) => mockApply(l),
  applyPlan: async (plan: () => Promise<unknown[] | null>) => {
    const list = await plan();
    return list ? mockApply(list) : null;
  },
  hasPermission: async () => mockGranted,
}));
let mockPrefs: Record<string, unknown> = {};
jest.mock('@/lib/prefs', () => ({ getPref: async (k: string, f: unknown) => (k in mockPrefs ? mockPrefs[k] : f) }));
let mockDue = '2099-09-30';
let mockStatus = 'ready';
let mockDashboard: unknown = undefined;
let mockProgramsLoaded = true;
jest.mock('@/lib/session', () => ({ useSession: () => ({ status: mockStatus }) }));
jest.mock('@/lib/query/hooks', () => ({
  usePrograms: () => ({ data: mockProgramsLoaded ? [{ status: 'active', days: [{ scheduled_weekday: 1 }] }] : undefined }),
  useCheckins: () => ({ data: { next_due: mockDue, today: '2099-09-24', checkins: [{ local_date: '2099-09-23' }] } }),
  useDashboard: () => ({ data: mockDashboard }),
}));

import { ReminderSync, useReminderSync } from '../useReminderSync';
import { phoneClock } from '../plan';

beforeEach(() => {
  jest.clearAllMocks();
  mockGranted = true; mockPrefs = {}; mockDue = '2099-09-30'; mockStatus = 'ready'; mockDashboard = undefined;
  mockProgramsLoaded = true;
});

it('waits for the program and check-ins to load — applying before would wipe their reminders', async () => {
  mockPrefs = { reminders: { workout: true, checkin: true } };
  mockProgramsLoaded = false;
  const { rerender } = renderHook(() => useReminderSync());
  await new Promise((r) => setTimeout(r, 10));
  expect(mockApply).not.toHaveBeenCalled();

  mockProgramsLoaded = true;
  rerender({});
  await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(1));
  const kinds = new Set((mockApply.mock.calls[0]![0] as { kind: string }[]).map((r) => r.kind));
  expect(kinds).toEqual(new Set(['workout', 'checkin']));
});

it('re-applies when the next check-in moves', async () => {
  mockPrefs = { reminders: { checkin: true } };
  const { rerender } = renderHook(() => useReminderSync());
  await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(1));
  mockDue = '2099-10-07';
  rerender({});
  await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(2));
  expect(mockApply.mock.calls[1]![0]).toEqual(expect.arrayContaining([expect.objectContaining({
    id: 'checkin-2099-10-07', trigger: expect.objectContaining({ date: '2099-10-07' }),
  })]));
});

it("re-applies once today's weigh-in is logged, dropping today's reminder", async () => {
  mockPrefs = { reminders: { weigh_in: true } };
  const today = phoneClock().today;
  const empty = { local_date: today, body: { today: null }, nutrition: { meals_logged: 0 }, training: { sessions_today: 0 } };
  mockDashboard = empty;
  const { rerender } = renderHook(() => useReminderSync());
  await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(1));

  mockDashboard = { ...empty, body: { today: 81.2 } };
  rerender({});
  await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(2));
  const dates = (mockApply.mock.calls[1]![0] as { trigger: { date: string } }[]).map((r) => r.trigger.date);
  expect(dates).not.toContain(today);
});

it('does nothing when no reminder is on, or without permission — and never asks', async () => {
  renderHook(() => useReminderSync());
  mockPrefs = { reminders: { weigh_in: true } };
  mockGranted = false;
  renderHook(() => useReminderSync());
  await new Promise((r) => setTimeout(r, 10));
  expect(mockApply).not.toHaveBeenCalled();
});

it("signing out takes the account's reminders off the phone", async () => {
  mockStatus = 'signed-out';
  render(<ReminderSync />);
  await waitFor(() => expect(mockApply).toHaveBeenCalledWith([]));
});
