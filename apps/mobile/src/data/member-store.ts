import { canLinkOccurrence, localDateAt, operationSchema, performedSetSchema, programmeSchema, sessionSchema, validateSetForExercise, type Occurrence, type Operation, type PerformedSet, type PlanDay, type Programme, type WorkoutSession } from '@fitlog/domain';
import type { LocalCache, MemberData, Profile } from './types';
import { emptyMemberData } from './types';

export interface MemberSnapshot {
  data: MemberData; operations: Operation[]; drafts: Record<string, unknown>;
  ready: boolean; syncing: boolean; error: string | null; offline: boolean;
}
export interface MemberTransport { load(): Promise<MemberData>; send(operation: Operation): Promise<unknown> }
export function createMemberStore(profile: Profile, cache: LocalCache, transport: MemberTransport, uuid: () => string) {
  let snapshot: MemberSnapshot = { data: emptyMemberData(), operations: [], drafts: {}, ready: false, syncing: false, error: null, offline: false };
  const listeners = new Set<() => void>(); let serial: Promise<unknown> = Promise.resolve(); let syncing: Promise<void> | undefined;
  const notify = (patch: Partial<MemberSnapshot>) => { snapshot = { ...snapshot, ...patch }; listeners.forEach((l) => l()); };
  const serialize = <T,>(work: () => Promise<T>): Promise<T> => { const task = serial.then(work); serial = task.catch(() => {}); return task; };
  async function persist(data: MemberData, operations = snapshot.operations, drafts = snapshot.drafts) {
    await cache.write(data, operations, drafts);
    notify({ data, operations, drafts, error: null });
  }
  function op(kind: Operation['kind'], entityId: string, baseRevision: number, payload: Operation['payload'], mutationId = uuid()): Operation {
    const prior = snapshot.operations.filter((o) => o.entityId === entityId && o.status !== 'synced').at(-1);
    return operationSchema.parse({ id: mutationId, ownerId: profile.id, entityId, kind, baseRevision, payload, createdAt: new Date().toISOString(), dependencies: prior ? [prior.id] : [], attempts: 0, status: 'pending', error: null });
  }
  async function saveSession(session: WorkoutSession, operation: Operation) {
    const parsed = sessionSchema.parse(session);
    await persist({ ...snapshot.data, sessions: [...snapshot.data.sessions.filter((s) => s.id !== parsed.id), parsed] }, [...snapshot.operations, operation]);
  }
  const store = {
    get profile() { return profile; },
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async initialize() {
      const saved = await cache.read();
      if (saved) {
        saved.data.sessions = saved.data.sessions.map((s) => sessionSchema.parse(s));
        if (saved.data.sessions.some((s) => s.ownerId !== profile.id) || saved.operations.some((o) => o.ownerId !== profile.id)) throw new Error('Account cache mismatch');
        saved.data.programmes = saved.data.programmes.map((p) => programmeSchema.parse(p));
        const operations = saved.operations.map((o) => operationSchema.parse({ ...o, status: o.status === 'syncing' ? 'pending' : o.status }));
        notify({ ...saved, operations });
      }
      notify({ ready: true });
      await store.sync();
    },
    sync(): Promise<void> {
      if (syncing) return syncing;
      syncing = (async () => {
        notify({ syncing: true });
        try {
          // Network calls do not hold the local mutation queue or delay Log set.
          const pending = snapshot.operations.filter((o) => o.status === 'pending');
          for (const operation of pending) {
            const dependencies = snapshot.operations.filter((o) => operation.dependencies.includes(o.id));
            if (dependencies.some((o) => o.status !== 'synced')) continue;
            try {
              await transport.send(operation);
              await serialize(() => persist(snapshot.data, snapshot.operations.map((o) => o.id === operation.id ? { ...o, status: 'synced', error: null } : o)));
            } catch (error) {
              const failure = error as { code?: string; message?: string };
              const conflict = failure.code === '40001' || failure.code === '23505';
              const permanent = conflict || failure.code?.startsWith('22') || failure.code === '42501';
              await serialize(() => persist(snapshot.data, snapshot.operations.map((o) => o.id === operation.id ? { ...o, attempts: o.attempts + 1, status: conflict ? 'conflict' : permanent ? 'rejected' : 'pending', error: failure.message ?? 'Could not sync' } : o)));
              if (!permanent) notify({ offline: true });
            }
          }
          const remote = await transport.load();
          await serialize(async () => {
            const unsynced = new Set(snapshot.operations.filter((o) => o.status !== 'synced').map((o) => o.entityId));
            const merged = {
              ...remote,
              sessions: [
                ...remote.sessions.filter((s) => !unsynced.has(s.id)).map((s) => ({ ...s, restDeadline: snapshot.data.sessions.find((old) => old.id === s.id)?.restDeadline ?? null })),
                ...snapshot.data.sessions.filter((s) => unsynced.has(s.id)),
              ],
              programmes: [...remote.programmes.filter((p) => !unsynced.has(p.id)), ...snapshot.data.programmes.filter((p) => unsynced.has(p.id))],
            };
            await persist(merged);
            notify({ offline: false });
          });
        } catch { notify({ offline: true }); }
        finally { notify({ syncing: false }); syncing = undefined; }
      })();
      return syncing;
    },
    startWorkout(name: string, day?: PlanDay, programme?: Programme, occurrence?: Occurrence) {
      return serialize(async () => {
        const active = snapshot.data.sessions.find((s) => s.status === 'in_progress' && !s.deletedAt);
        if (active) return active.id;
        const now = new Date().toISOString(); const id = uuid();
        if (occurrence && (!canLinkOccurrence(occurrence, now, id) || occurrence.sessionId || occurrence.programmeId !== programme?.id || occurrence.dayId !== day?.id)) throw new Error('Occurrence unavailable');
        const session = sessionSchema.parse({ id, ownerId: profile.id, name, programmeId: programme?.id ?? null, dayId: day?.id ?? null, occurrenceId: occurrence?.id ?? null,
          startedAt: now, endedAt: null, timezone: profile.timezone, localDate: localDateAt(now, profile.timezone), status: 'in_progress', revision: 1,
          instances: day?.exercises.map((p) => ({ id: uuid(), exercise: p.exercise, prescription: p, skipped: false })) ?? [],
          sets: [], notes: '', pauses: [], restDeadline: null, deletedAt: null, syncState: 'pending' });
        await saveSession(session, op('session.create', id, 0, { session, ...(occurrence ? { occurrenceRevision: occurrence.revision } : {}) }));
        return id;
      });
    },
    updateWorkout(id: string, change: (session: WorkoutSession) => WorkoutSession) {
      return serialize(async () => {
        const current = snapshot.data.sessions.find((s) => s.id === id);
        if (!current || current.status !== 'in_progress') throw new Error('Workout is not active');
        const next = sessionSchema.parse({ ...change(current), revision: current.revision + 1, syncState: 'pending' });
        await saveSession(next, op('session.update', id, current.revision, { session: next }));
      });
    },
    logSet(sessionId: string, input: Omit<PerformedSet, 'id' | 'mutationId' | 'performedAt' | 'revision' | 'deletedAt'>, restSeconds: number, mutationId = uuid()) {
      return serialize(async () => {
        // A retried/double-delivered local command is acknowledged once.
        if (snapshot.operations.some((o) => o.id === mutationId)) return;
        const current = snapshot.data.sessions.find((s) => s.id === sessionId);
        if (!current || current.status !== 'in_progress') throw new Error('Workout is not active');
        const instance = current.instances.find((i) => i.id === input.instanceId);
        if (!instance) throw new Error('Exercise not found');
        const set = performedSetSchema.parse({ ...input, id: uuid(), mutationId, performedAt: new Date().toISOString(), revision: 1, deletedAt: null });
        validateSetForExercise(set, instance.exercise);
        const next = { ...current, sets: [...current.sets, set], revision: current.revision + 1, syncState: 'pending' as const,
          restDeadline: restSeconds > 0 ? new Date(Date.now() + restSeconds * 1000).toISOString() : null };
        await saveSession(next, op('set.commit', sessionId, current.revision, { set }, mutationId));
      });
    },
    finishWorkout(id: string, discard = false, notes = '') {
      return serialize(async () => {
        const current = snapshot.data.sessions.find((s) => s.id === id);
        if (!current || current.status !== 'in_progress') throw new Error('Workout is not active');
        if (!discard && !current.sets.some((s) => !s.deletedAt)) throw new Error('Log a set before finishing');
        const endedAt = new Date().toISOString(); const status = discard ? 'discarded' as const : 'completed' as const;
        const next = { ...current, endedAt, status, notes, restDeadline: null, revision: current.revision + 1, syncState: 'pending' as const,
          pauses: current.pauses.map((p) => p.endedAt ? p : { ...p, endedAt }) };
        await saveSession(next, op('session.finish', id, current.revision, { status, endedAt, notes }));
      });
    },
    editSet(sessionId: string, nextSet: PerformedSet) {
      return serialize(async () => {
        const current = snapshot.data.sessions.find((s) => s.id === sessionId && !s.deletedAt);
        const old = current?.sets.find((s) => s.id === nextSet.id && !s.deletedAt);
        const instance = current?.instances.find((i) => i.id === nextSet.instanceId);
        if (!current || !old || !instance) throw new Error('Set not found');
        const set = performedSetSchema.parse({ ...nextSet, revision: old.revision + 1 });
        validateSetForExercise(set, instance.exercise);
        await saveSession({ ...current, sets: current.sets.map((s) => s.id === set.id ? set : s), revision: current.revision + 1, syncState: 'pending' },
          op('set.edit', sessionId, current.revision, { set, setRevision: old.revision }));
      });
    },
    deleteSet(sessionId: string, setId: string, restore = false) {
      return serialize(async () => {
        const current = snapshot.data.sessions.find((s) => s.id === sessionId && !s.deletedAt);
        const set = current?.sets.find((s) => s.id === setId);
        if (!current || !set) throw new Error('Set not found');
        if (restore && (!set.deletedAt || Date.now() - new Date(set.deletedAt).getTime() > 10000)) throw new Error('Undo window expired');
        const next = { ...set, deletedAt: restore ? null : new Date().toISOString(), revision: set.revision + 1 };
        await saveSession({ ...current, sets: current.sets.map((s) => s.id === setId ? next : s), revision: current.revision + 1, syncState: 'pending' }, op(restore ? 'set.restore' : 'set.delete', sessionId, current.revision, { setId, setRevision: set.revision }));
      });
    },
    adjustRest(id: string, seconds: number | null) {
      return serialize(async () => {
        await persist({ ...snapshot.data, sessions: snapshot.data.sessions.map((s) => s.id === id ? { ...s, restDeadline: seconds === null ? null : new Date(Math.max(Date.now(), new Date(s.restDeadline ?? new Date().toISOString()).getTime()) + seconds * 1000).toISOString() } : s) });
      });
    },
    deleteWorkout(id: string, restore = false) {
      return serialize(async () => {
        const current = snapshot.data.sessions.find((s) => s.id === id);
        if (!current || current.status !== 'completed') throw new Error('Completed workout required');
        if (restore && (!current.deletedAt || Date.now() - new Date(current.deletedAt).getTime() > 10000)) throw new Error('Undo window expired');
        await saveSession({ ...current, deletedAt: restore ? null : new Date().toISOString(), revision: current.revision + 1, syncState: 'pending' }, op(restore ? 'session.restore' : 'session.delete', id, current.revision, {}));
      });
    },
    saveProgramme(programme: Programme) {
      return serialize(async () => {
        const old = snapshot.data.programmes.find((p) => p.id === programme.id);
        const next = programmeSchema.parse({ ...programme, version: (old?.version ?? 0) + 1, updatedAt: new Date().toISOString() });
        const data = { ...snapshot.data, programmes: [...snapshot.data.programmes.filter((p) => p.id !== next.id).map((p) => next.current ? { ...p, current: false } : p), next] };
        await persist(data, [...snapshot.operations, op('programme.save', next.id, old?.version ?? 0, { programme: next })]);
      });
    },
    archiveProgramme(id: string) {
      return serialize(async () => {
        const old = snapshot.data.programmes.find((p) => p.id === id);
        if (!old) throw new Error('Programme not found');
        const next = { ...old, archived: true, current: false, version: old.version + 1, updatedAt: new Date().toISOString() };
        const today = localDateAt(new Date(), profile.timezone);
        await persist({ ...snapshot.data, programmes: snapshot.data.programmes.map((p) => p.id === id ? next : p),
          occurrences: snapshot.data.occurrences.map((o) => o.programmeId === id && o.status === 'pending' && o.date >= today ? { ...o, status: 'cancelled', revision: o.revision + 1 } : o) }, [...snapshot.operations, op('programme.archive', id, old.version, {})]);
      });
    },
    saveDraft(key: string, value: unknown) { return serialize(() => persist(snapshot.data, snapshot.operations, { ...snapshot.drafts, [key]: value })); },
    mutateDraft<T>(key: string, change: (current: unknown) => T) { return serialize(async () => { const value = change(snapshot.drafts[key]); await persist(snapshot.data, snapshot.operations, { ...snapshot.drafts, [key]: value }); return value; }); },
    updateProfile(next: Profile) {
      if (next.id !== profile.id) throw new Error('Account mismatch');
      return serialize(async () => {
        await persist(snapshot.data, snapshot.operations, { ...snapshot.drafts, __profile: next });
        profile = { ...next };
        notify({});
      });
    },
    async onlineWrite(work: () => Promise<void>) { await work(); await store.sync(); },
    async close() { await serial; await cache.close(); },
    async clear() { await cache.clear(); notify({ data: emptyMemberData(), operations: [], drafts: {} }); },
  };
  return store;
}
export type MemberStore = ReturnType<typeof createMemberStore>;
