/** B-04 · setting the planned reminders on the phone. */
import { Platform } from 'react-native';

const mockCancelAll = jest.fn(async () => undefined);
const mockSchedule = jest.fn(async (_r: unknown) => 'id');
const mockChannel = jest.fn(async (_id: string, _c: unknown) => null);
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { DEFAULT: 3 },
  setNotificationHandler: jest.fn(),
  cancelAllScheduledNotificationsAsync: () => mockCancelAll(),
  scheduleNotificationAsync: (r: unknown) => mockSchedule(r),
  setNotificationChannelAsync: (id: string, c: unknown) => mockChannel(id, c),
}));

import { applyPlan, applyReminders, REMINDER_CHANNEL } from '../schedule';
import type { PlannedReminder } from '../plan';

const weighIn: PlannedReminder = {
  id: 'weigh_in-2026-09-25', kind: 'weigh_in', title: 'Weigh-in', body: 'b',
  trigger: { date: '2026-09-25', hour: 7, minute: 30 },
};
const checkin: PlannedReminder = {
  id: 'checkin-2026-09-30', kind: 'checkin', title: 'Check-in due', body: 'b',
  trigger: { date: '2026-09-30', hour: 8, minute: 0 },
};

beforeEach(() => { jest.clearAllMocks(); Platform.OS = 'android'; });

it('replaces the whole set: cancel everything, then schedule each', async () => {
  await expect(applyReminders([weighIn, checkin])).resolves.toBe(2);
  expect(mockCancelAll.mock.invocationCallOrder[0]!).toBeLessThan(mockSchedule.mock.invocationCallOrder[0]!);
  expect(mockSchedule).toHaveBeenCalledTimes(2);
});

it("fires at the phone's local time on the day, in the reminders channel", async () => {
  await applyReminders([weighIn]);
  const req = mockSchedule.mock.calls[0]![0] as { identifier: string; trigger: { type: string; date: Date; channelId: string } };
  expect(req.identifier).toBe('weigh_in-2026-09-25');
  expect(req.trigger.type).toBe('date');
  expect(req.trigger.date).toEqual(new Date(2026, 8, 25, 7, 30));
  expect(req.trigger.channelId).toBe(REMINDER_CHANNEL);
});

it('carries what it is about, so a tap opens the right screen', async () => {
  await applyReminders([checkin]);
  expect(mockSchedule.mock.calls[0]![0]).toMatchObject({
    content: { title: 'Check-in due', data: { type: 'reminder', kind: 'checkin' } },
  });
});

it('on Android, reminders have their own channel — silenced without silencing anything else', async () => {
  await applyReminders([weighIn]);
  expect(mockChannel).toHaveBeenCalledWith(REMINDER_CHANNEL, expect.objectContaining({ name: 'Reminders' }));
  Platform.OS = 'ios';
  mockChannel.mockClear();
  await applyReminders([weighIn]);
  expect(mockChannel).not.toHaveBeenCalled();
});

it('two changes at once cannot interleave into a mixture of both', async () => {
  // The screen and the background sync can both apply; the later set must win whole.
  let release!: () => void;
  mockCancelAll.mockImplementationOnce(() => new Promise((r) => { release = () => r(undefined); }));
  const first = applyReminders([weighIn]);
  const second = applyReminders([checkin]);
  await new Promise((r) => setTimeout(r, 0));
  release();
  await Promise.all([first, second]);
  const scheduled = mockSchedule.mock.calls.map((c) => (c[0] as { identifier: string }).identifier);
  expect(scheduled).toEqual(['weigh_in-2026-09-25', 'checkin-2026-09-30']);
  expect(mockCancelAll).toHaveBeenCalledTimes(2);
  // The second cancel came after the first set was scheduled, so only the second set survives.
  expect(mockCancelAll.mock.invocationCallOrder[1]!).toBeGreaterThan(mockSchedule.mock.invocationCallOrder[0]!);
});

it('one that fails to schedule does not take the rest with it', async () => {
  mockSchedule.mockImplementationOnce(async () => { throw new Error('interval must be > 0'); });
  await expect(applyReminders([weighIn, checkin])).rejects.toThrow('interval');
  expect(mockSchedule).toHaveBeenCalledTimes(2);
});

it('a queued plan is made when its turn comes, from what is current then', async () => {
  let release!: () => void;
  mockCancelAll.mockImplementationOnce(() => new Promise((r) => { release = () => r(undefined); }));
  let switches = [weighIn];
  const first = applyReminders([weighIn]);
  const second = applyPlan(async () => switches);
  switches = [checkin];   // changed while the second waited its turn
  await new Promise((r) => setTimeout(r, 0));
  release();
  await Promise.all([first, second]);
  expect((mockSchedule.mock.calls.at(-1)![0] as { identifier: string }).identifier).toBe('checkin-2026-09-30');
});

it('a plan of null leaves the phone as it is', async () => {
  await expect(applyPlan(async () => null)).resolves.toBeNull();
  expect(mockCancelAll).not.toHaveBeenCalled();
});

it('does nothing on the web', async () => {
  Platform.OS = 'web';
  await expect(applyReminders([weighIn])).resolves.toBe(0);
  expect(mockSchedule).not.toHaveBeenCalled();
});
