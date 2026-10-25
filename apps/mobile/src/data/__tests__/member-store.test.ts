import { createMemberStore } from '../member-store';
import { emptyMemberData, type LocalCache, type Profile } from '../types';

const profile: Profile = { id: '00000000-0000-4000-8000-000000000001', displayName: 'Fixture', timezone: 'Asia/Kolkata', locale: 'en', weightUnit: 'kg', lengthUnit: 'cm', weeklyGoal: 3 };
function fixtures() {
  let n = 10; const uuid = () => `00000000-0000-4000-8000-${String(n++).padStart(12, '0')}`;
  let saved: Awaited<ReturnType<LocalCache['read']>> = null;
  const cache: LocalCache = { read: jest.fn(async () => saved), write: jest.fn(async (data, operations, drafts) => { saved = structuredClone({ data, operations, drafts }); }), close: jest.fn(async () => {}), clear: jest.fn(async () => { saved = null; }) };
  const transport = { load: jest.fn(async () => emptyMemberData()), send: jest.fn(async () => ({})) };
  return { uuid, cache, transport };
}

describe('durable member operations', () => {
  it('does not acknowledge an uncommitted local write', async () => {
    const f = fixtures(); const store = createMemberStore(profile, f.cache, f.transport, f.uuid);
    jest.mocked(f.cache.write).mockRejectedValueOnce(new Error('Storage full'));
    await expect(store.startWorkout('Scratch')).rejects.toThrow('Storage full');
    expect(store.getSnapshot().data.sessions).toEqual([]);
    expect(store.getSnapshot().operations).toEqual([]);
    expect(f.transport.send).not.toHaveBeenCalled();
  });
  it('restores an active session and queues session before performed sets', async () => {
    const f = fixtures(); const store = createMemberStore(profile, f.cache, f.transport, f.uuid);
    const id = await store.startWorkout('Scratch');
    const exercise = { id: f.uuid(), version: 1, name: 'Bench', type: 'resistance' as const, loadBasis: 'total' as const, multiplier: 1 as const, equipment: 'Barbell', primaryMuscles: ['Chest'], secondaryMuscles: [], instructions: '', aliases: [], ownerId: profile.id, archived: false };
    const instance = f.uuid(); await store.updateWorkout(id, (s) => ({ ...s, instances: [{ id: instance, exercise, prescription: null, skipped: false }] }));
    const mutation = f.uuid(); const input = { instanceId: instance, reps: 8, loadKg: 80, durationSeconds: null, distanceMetres: null, rpe: null, rir: null, type: 'working' as const, notes: '' };
    await Promise.all([store.logSet(id, input, 90, mutation), store.logSet(id, input, 90, mutation)]);
    expect(store.getSnapshot().data.sessions[0]?.sets).toHaveLength(1);
    expect(store.getSnapshot().operations.map((o) => o.kind)).toEqual(['session.create', 'session.update', 'set.commit']);
    const restored = createMemberStore(profile, f.cache, { ...f.transport, load: async () => { throw new Error('Offline'); }, send: async () => { throw new Error('Offline'); } }, f.uuid);
    await restored.initialize();
    expect(restored.getSnapshot().data.sessions[0]?.id).toBe(id);
    expect(restored.getSnapshot().data.sessions[0]?.sets).toHaveLength(1);
    expect(restored.getSnapshot().data.sessions[0]?.restDeadline).not.toBeNull();
  });
  it('rejects a record from another account rather than loading it', async () => {
    const f = fixtures(); const original = createMemberStore(profile, f.cache, f.transport, f.uuid);
    await original.startWorkout('Scratch');
    const other = createMemberStore({ ...profile, id: f.uuid() }, f.cache, f.transport, f.uuid);
    await expect(other.initialize()).rejects.toThrow('Account cache mismatch');
  });
  it('cannot finish a session without performed work', async () => {
    const f = fixtures(); const store = createMemberStore(profile, f.cache, f.transport, f.uuid); const id = await store.startWorkout('Scratch');
    await expect(store.finishWorkout(id)).rejects.toThrow('Log a set');
    expect(store.getSnapshot().data.sessions[0]?.status).toBe('in_progress');
  });
});
