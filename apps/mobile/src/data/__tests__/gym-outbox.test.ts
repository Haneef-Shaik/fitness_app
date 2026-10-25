import { createMemberStore } from '../member-store';
import { emptyMemberData, type LocalCache, type Profile } from '../types';
import { gymCommand } from '../gym-api';
import { gymOperations, queueGymCommand, syncGymOutbox } from '../gym-outbox';
jest.mock('../gym-api', () => ({ gymCommand: jest.fn() }));
const profile: Profile = { id: '00000000-0000-4000-8000-000000000001', displayName: 'Fixture', timezone: 'Asia/Kolkata', locale: 'en', weightUnit: 'kg', lengthUnit: 'cm', weeklyGoal: 3 };
const gym = '00000000-0000-4000-8000-000000000002'; const mutation = '00000000-0000-4000-8000-000000000003';
function fixture() {
  let saved: Awaited<ReturnType<LocalCache['read']>> = null;
  const cache: LocalCache = { read: async () => saved, write: jest.fn(async (data, operations, drafts) => { saved = structuredClone({ data, operations, drafts }); }), clear: async () => {}, close: async () => {} };
  const store = createMemberStore(profile, cache, { load: async () => emptyMemberData(), send: async () => ({}) }, () => mutation);
  return { store, cache };
}
beforeEach(() => jest.resetAllMocks());
test('a payment is not acknowledged or sent when local persistence fails', async () => {
  const { store, cache } = fixture(); jest.mocked(cache.write).mockRejectedValueOnce(new Error('Storage full'));
  await expect(queueGymCommand(store, gym, 'payment.record', { amountPaise: 10000 }, mutation)).rejects.toThrow('Storage full');
  expect(gymOperations(store)).toEqual([]); expect(gymCommand).not.toHaveBeenCalled();
});
test('offline provisional payment restores and retries the same operation without a receipt', async () => {
  const { store, cache } = fixture(); jest.mocked(gymCommand).mockRejectedValue(new Error('Offline'));
  const payload = { amountPaise: 10000, expectedRevision: 7, receivedAt: '2026-10-19T10:00:00Z' };
  await queueGymCommand(store, gym, 'payment.record', payload, mutation); await syncGymOutbox(store);
  expect(gymOperations(store)[0]).toMatchObject({ status: 'pending', result: null, payload });
  const restored = createMemberStore(profile, cache, { load: async () => { throw new Error('Offline'); }, send: async () => ({}) }, () => mutation); await restored.initialize();
  jest.mocked(gymCommand).mockResolvedValue({ receipt: 'TEST/2026/000001' }); await syncGymOutbox(restored);
  expect(gymOperations(restored)[0]).toMatchObject({ id: mutation, status: 'confirmed', result: { receipt: 'TEST/2026/000001' } });
  expect(gymCommand).toHaveBeenLastCalledWith(gym, 'payment.record', payload, mutation);
});
test('permission loss and conflicts stop automatic replay while retaining the original operation', async () => {
  const { store } = fixture(); jest.mocked(gymCommand).mockRejectedValue({ code: '40001', message: 'Review current balance' });
  await queueGymCommand(store, gym, 'payment.record', { expectedRevision: 1 }, mutation); await syncGymOutbox(store);
  expect(gymOperations(store)[0]).toMatchObject({ id: mutation, status: 'conflict', error: 'Review current balance' });
  const calls = jest.mocked(gymCommand).mock.calls.length; await syncGymOutbox(store); expect(gymCommand).toHaveBeenCalledTimes(calls);
});
