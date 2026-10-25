import { z } from 'zod';
import * as Crypto from 'expo-crypto';
import { gymCommand } from './gym-api';
import type { MemberStore } from './member-store';

const schema = z.array(z.object({ id: z.uuid(), gymId: z.uuid(), kind: z.enum(['payment.record', 'visit.record']), payload: z.record(z.string(), z.unknown()),
  createdAt: z.iso.datetime(), status: z.enum(['pending', 'confirmed', 'conflict', 'rejected']), result: z.unknown().nullable(), error: z.string().nullable() }));
export type GymOperation = z.infer<typeof schema>[number];
const key = 'gym-outbox:v1';
export function gymOperations(store: MemberStore): GymOperation[] { const value = store.getSnapshot().drafts[key]; return value ? schema.parse(value) : []; }
export async function queueGymCommand(store: MemberStore, gymId: string, kind: GymOperation['kind'], payload: Record<string, unknown>, id = Crypto.randomUUID()) {
  const operation: GymOperation = { id, gymId, kind, payload, createdAt: new Date().toISOString(), status: 'pending', result: null, error: null };
  await store.mutateDraft(key, (raw) => { const all = raw ? schema.parse(raw) : []; return all.some((o) => o.id === id) ? all : [...all, operation]; });
  void syncGymOutbox(store).catch(() => {}); return id;
}
const inFlight = new WeakMap<MemberStore, Promise<void>>();
export function syncGymOutbox(store: MemberStore): Promise<void> {
  const running = inFlight.get(store); if (running) return running;
  const work = (async () => {
    for (const operation of gymOperations(store).filter((o) => o.status === 'pending')) {
      let patch: Partial<GymOperation>;
      try { const result = await gymCommand(operation.gymId, operation.kind, operation.payload, operation.id); patch = { result, status: 'confirmed', error: null }; }
      catch (e) { const error = e as { code?: string; message?: string }; const permanent = error.code === '40001' || error.code === '23505' || error.code === '42501' || error.code === 'PT404' || error.code?.startsWith('22') || error.code?.startsWith('23'); if (!permanent) continue; patch = { status: error.code === '40001' || error.code === '23505' ? 'conflict' : 'rejected', error: error.message ?? 'Could not save' }; }
      await store.mutateDraft(key, (raw) => schema.parse(raw).map((o) => o.id === operation.id ? { ...o, ...patch } : o));
    }
  })().finally(() => { inFlight.delete(store); });
  inFlight.set(store, work); return work;
}
