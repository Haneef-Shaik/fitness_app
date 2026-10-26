import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { z } from 'zod';
import { epley, sessionSummary, setVolume, validateSetForExercise } from './calculations.ts';
import { CANONICAL_DECIMAL, formatDecimal } from './encoding.ts';
import { exerciseSchema, performedSetSchema, sessionSchema, type Exercise, type PerformedSet, type WorkoutSession } from './models.ts';

// One fixture file drives this test and scripts/backend/sql/training-fixtures.sql (003 §4.13); expected values live only there.
const fixtureBytes = readFileSync(new URL('../fixtures/ac03-training.v1.json', import.meta.url));
const decimal = z.string().regex(CANONICAL_DECIMAL);
const vectorId = z.string().regex(/^[a-z0-9]+([.-][a-z0-9]+)*$/);
const exerciseKey = z.string().regex(/^[a-z][a-zA-Z]*$/);
const fixtureSchema = z.strictObject({
  fixture: z.literal('ac03-training'), fixtureVersion: z.literal(1), formula: z.literal('training.v1'),
  source: z.string().min(1), decimal: z.string().min(1), nullSemantics: z.string().min(1),
  exercises: z.record(exerciseKey, z.strictObject({ name: z.string().min(1), type: exerciseSchema.shape.type, loadBasis: exerciseSchema.shape.loadBasis, multiplier: exerciseSchema.shape.multiplier })),
  // Nullable is not optional: a missing expectation fails here instead of reading as null.
  setVectors: z.array(z.strictObject({
    id: vectorId, exercise: exerciseKey, setType: performedSetSchema.shape.type, deleted: z.boolean(),
    reps: z.number().int().nullable(), loadKg: decimal.nullable(), durationSeconds: z.number().int().nullable(), distanceMetres: decimal.nullable(),
    expect: z.strictObject({ volumeKgReps: decimal.nullable(), e1rmKg: decimal.nullable() }),
  })).min(10),
  sessionVectors: z.array(z.strictObject({ id: vectorId, description: z.string().min(1), sets: z.array(vectorId).min(1),
    expect: z.strictObject({ volumeKgReps: decimal, workingSets: z.number().int().min(0) }) })).min(1),
  pendingSessionVectors: z.array(z.strictObject({ id: vectorId, owner: z.literal('MB-4'), description: z.string().min(1), sets: z.array(vectorId).min(1),
    prdExpect: z.strictObject({ volumeKgReps: z.null() }) })),
});
type SetVector = z.infer<typeof fixtureSchema>['setVectors'][number];
const fixture = fixtureSchema.parse(JSON.parse(fixtureBytes.toString('utf8')));

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const exerciseKeys = Object.keys(fixture.exercises);
const exercises = new Map<string, Exercise>(Object.entries(fixture.exercises).map(([key, e], i) => [key, exerciseSchema.parse({ ...e, id: uuid(100 + i), version: 1,
  equipment: 'Fixture', primaryMuscles: ['Fixture'], secondaryMuscles: [], instructions: '', aliases: [], ownerId: null, archived: false })]));
const vectors = new Map(fixture.setVectors.map((v) => [v.id, v]));
const exerciseFor = (key: string): Exercise => { const e = exercises.get(key); assert.ok(e, `unknown exercise ${key}`); return e; };
const vectorFor = (id: string): SetVector => { const v = vectors.get(id); assert.ok(v, `unknown set vector ${id}`); return v; };
const instanceId = (key: string) => uuid(200 + exerciseKeys.indexOf(key));
const decimalOrNull = (value: number | null) => (value === null ? null : formatDecimal(value));

function performedSet(v: SetVector, n: number): PerformedSet {
  return performedSetSchema.parse({ id: uuid(1000 + n), mutationId: uuid(2000 + n), instanceId: instanceId(v.exercise), reps: v.reps,
    loadKg: v.loadKg === null ? null : Number(v.loadKg), durationSeconds: v.durationSeconds, distanceMetres: v.distanceMetres === null ? null : Number(v.distanceMetres),
    rpe: null, rir: null, type: v.setType, notes: '', performedAt: '2026-10-12T06:00:00Z', revision: 1, deletedAt: v.deleted ? '2026-10-12T06:20:00Z' : null });
}
function completedSession(name: string, refs: string[]): WorkoutSession {
  const sets = refs.map(vectorFor);
  return sessionSchema.parse({ id: uuid(3000), ownerId: uuid(3001), name, programmeId: null, dayId: null, occurrenceId: null,
    startedAt: '2026-10-12T05:30:00Z', endedAt: '2026-10-12T06:30:00Z', timezone: 'Asia/Kolkata', localDate: '2026-10-12', status: 'completed', revision: 1,
    instances: [...new Set(sets.map((v) => v.exercise))].map((key) => ({ id: instanceId(key), exercise: exerciseFor(key), prescription: null, skipped: false })),
    sets: sets.map(performedSet), notes: '', pauses: [], restDeadline: null, deletedAt: null, syncState: 'synced' });
}

test('training.v1 set vectors match setVolume and epley', () => {
  const failures: string[] = [];
  for (const [n, v] of fixture.setVectors.entries()) {
    const exercise = exerciseFor(v.exercise); const set = performedSet(v, n);
    assert.doesNotThrow(() => validateSetForExercise(set, exercise), `${v.id}: the input must be a set the app can save`);
    const volume = decimalOrNull(setVolume(set, exercise)); const e1rm = decimalOrNull(epley(set, exercise));
    if (volume !== v.expect.volumeKgReps) failures.push(`${v.id} volumeKgReps: expected ${v.expect.volumeKgReps}, got ${volume}`);
    if (e1rm !== v.expect.e1rmKg) failures.push(`${v.id} e1rmKg: expected ${v.expect.e1rmKg}, got ${e1rm}`);
  }
  assert.deepEqual(failures, []);
});
test('training.v1 session vectors match sessionSummary (AC03)', () => {
  const failures: string[] = [];
  for (const v of fixture.sessionVectors) {
    const summary = sessionSummary(completedSession(v.id, v.sets)); const volume = formatDecimal(summary.volume);
    if (volume !== v.expect.volumeKgReps) failures.push(`${v.id} volumeKgReps: expected ${v.expect.volumeKgReps}, got ${volume}`);
    if (summary.workingSets !== v.expect.workingSets) failures.push(`${v.id} workingSets: expected ${v.expect.workingSets}, got ${summary.workingSets}`);
  }
  assert.deepEqual(failures, []);
});
test('training.v1 fixture covers the PRD 8.2 cases with explicit nulls', (t) => {
  t.diagnostic(`fixture sha256 ${createHash('sha256').update(fixtureBytes).digest('hex')}`);
  const sets = fixture.setVectors; const sessions = [...fixture.sessionVectors, ...fixture.pendingSessionVectors];
  assert.equal(vectors.size, sets.length, 'set vector ids are unique');
  assert.equal(new Set(sessions.map((s) => s.id)).size, sessions.length, 'session vector ids are unique');
  for (const s of sessions) s.sets.forEach(vectorFor);
  assert.ok(vectors.has('ac03-working-80x8') && fixture.sessionVectors.some((s) => s.id === 'ac03-session'), 'the AC03 set and session vectors are present');
  const of = (v: SetVector) => exerciseFor(v.exercise);
  const covered: [string, boolean][] = [
    ...performedSetSchema.shape.type.options.map((type): [string, boolean] => [`set type ${type}`, sets.some((v) => v.setType === type)]),
    ...exerciseSchema.shape.type.options.map((type): [string, boolean] => [`exercise type ${type}`, sets.some((v) => of(v).type === type)]),
    ...exerciseSchema.shape.loadBasis.options.map((basis): [string, boolean] => [`load basis ${basis}`, sets.some((v) => of(v).loadBasis === basis)]),
    ['a deleted set', sets.some((v) => v.deleted)],
    ['a counted volume with multiplier 2', sets.some((v) => of(v).multiplier === 2 && v.expect.volumeKgReps !== null)],
    ['an e1RM at 1 rep', sets.some((v) => v.reps === 1 && v.expect.e1rmKg !== null)],
    ['an e1RM at 30 reps', sets.some((v) => v.reps === 30 && v.expect.e1rmKg !== null)],
    ['a counted set above 30 reps with no e1RM', sets.some((v) => v.reps === 31 && v.expect.e1rmKg === null && v.expect.volumeKgReps !== null)],
    ['a set with no load', sets.some((v) => v.loadKg === null)],
    ['null and non-null volumes', sets.some((v) => v.expect.volumeKgReps === null) && sets.some((v) => v.expect.volumeKgReps !== null)],
    ['null and non-null e1RMs', sets.some((v) => v.expect.e1rmKg === null) && sets.some((v) => v.expect.e1rmKg !== null)],
    ['an eligible zero volume, distinct from null', sets.some((v) => v.expect.volumeKgReps === '0')],
  ];
  assert.deepEqual(covered.filter(([, ok]) => !ok).map(([label]) => label), [], 'missing coverage');
  for (const p of fixture.pendingSessionVectors) {
    for (const ref of p.sets) assert.equal(vectorFor(ref).expect.volumeKgReps, null, `${p.id}: ${ref} must contribute no volume`);
    t.diagnostic(`pending ${p.owner}: ${p.id} expects session volume null and is not asserted against sessionSummary`);
  }
});

test('formatDecimal trims zeros, keeps integers and never returns negative zero', () => {
  const cases: [number, number, string][] = [[1920, 6, '1920'], [100.5, 6, '100.5'], [100, 0, '100'], [0, 6, '0'], [-0, 6, '0'], [-0.0000001, 6, '0'],
    [-0.0000004, 6, '0'], [-0.4, 0, '0'], [-2.5, 6, '-2.5'], [0.000001, 6, '0.000001'], [2 / 3, 6, '0.666667'], [1 / 3, 6, '0.333333']];
  for (const [value, scale, expected] of cases) {
    const got = formatDecimal(value, scale);
    assert.equal(got, expected, `formatDecimal(${Object.is(value, -0) ? '-0' : value}, ${scale})`);
    assert.match(got, CANONICAL_DECIMAL);
  }
});
test('formatDecimal refuses non-finite values and invalid scales', () => {
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1e21]) assert.throws(() => formatDecimal(value), /finite/, `value ${value}`);
  for (const scale of [-1, 1.5, 21]) assert.throws(() => formatDecimal(1, scale), /Scale/, `scale ${scale}`);
});
test('formatDecimal rounds the binary double, not the decimal (known limit, 003 §4.13)', () => {
  // SQL round(1.005, 2) is 1.01, but the double nearest 1.005 is below it. The server value is authoritative; fixtures avoid such ties.
  assert.equal(formatDecimal(1.005, 2), '1');
});
