/** Reminders follow the program and the next check-in without the screen being opened (B-04, G10). */
import { renderHook, waitFor } from '@testing-library/react-native';

const mockApply = jest.fn(async (_l: unknown[]) => 0);
let mockGranted = true;
jest.mock('../schedule', () => ({
  applyReminders: (l: unknown[]) => mockApply(l),
  hasPermission: async () => mockGranted,
}));
let mockPrefs: Record<string, unknown> = {};
jest.mock('@/lib/prefs', () => ({ getPref: async (k: string, f: unknown) => (k in mockPrefs ? mockPrefs[k] : f) }));
let mockDue = '2026-09-30';
jest.mock('@/lib/session', () => ({ useSession: () => ({ status: 'ready' }) }));
jest.mock('@/lib/query/hooks', () => ({
  usePrograms: () => ({ data: [{ status: 'active', days: [{ scheduled_weekday: 1 }] }] }),
  useCheckins: () => ({ data: { next_due: mockDue, today: '2026-09-24' } }),
}));

import { useReminderSync } from '../useReminderSync';

beforeEach(() => { jest.clearAllMocks(); mockGranted = true; mockPrefs = {}; mockDue = '2026-09-30'; });

it('re-applies when the next check-in moves', async () => {
  mockPrefs = { reminders: { checkin: true } };
  const { rerender } = renderHook(() => useReminderSync());
  await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(1));
  mockDue = '2026-10-07';
  rerender({});
  await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(2));
  expect(mockApply.mock.calls[1]![0]).toEqual([expect.objectContaining({
    id: 'checkin', trigger: expect.objectContaining({ date: '2026-10-07' }),
  })]);
});

it('does nothing when no reminder is on, or without permission — and never asks', async () => {
  renderHook(() => useReminderSync());
  mockPrefs = { reminders: { weigh_in: true } };
  mockGranted = false;
  renderHook(() => useReminderSync());
  await new Promise((r) => setTimeout(r, 10));
  expect(mockApply).not.toHaveBeenCalled();
});
