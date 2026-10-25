import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adherence, canLinkOccurrence, epley, goalProgress, membershipEndExclusive, platePairs, scaleFood, sessionSummary, setVolume, strengthGoalValue } from './calculations.ts';
import { bodyEntrySchema, exerciseSchema, performedSetSchema, type Exercise, type Goal, type Occurrence, type PerformedSet, type WorkoutSession } from './models.ts';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const exercise: Exercise = { id: uuid(1), version: 1, name: 'Bench press', type: 'resistance', loadBasis: 'total', multiplier: 1,
  equipment: 'Barbell', primaryMuscles: ['Chest', 'Triceps'], secondaryMuscles: [], instructions: 'Controlled repetitions.', aliases: [], ownerId: null, archived: false };
const set: PerformedSet = { id: uuid(2), mutationId: uuid(3), instanceId: uuid(4), reps: 8, loadKg: 80, durationSeconds: null, distanceMetres: null,
  rpe: null, rir: null, type: 'working', notes: '', performedAt: '2026-10-12T06:00:00Z', revision: 1, deletedAt: null };
const session: WorkoutSession = { id: uuid(5), ownerId: uuid(6), name: 'Push day', programmeId: null, dayId: null, occurrenceId: null,
  startedAt: '2026-10-12T05:30:00Z', endedAt: '2026-10-12T06:30:00Z', timezone: 'Asia/Kolkata', localDate: '2026-10-12', status: 'completed', revision: 1,
  instances: [{ id: uuid(4), exercise, prescription: null, skipped: false }], sets: [set, { ...set, id: uuid(7) }, { ...set, id: uuid(8) }, { ...set, id: uuid(9), type: 'warmup', loadKg: 40, reps: 10 }], notes: '', pauses: [], restDeadline: null, deletedAt: null, syncState: 'synced' };

test('PRD training fixture excludes warmups and does not round intermediate e1RM', () => {
  assert.equal(sessionSummary(session).volume, 1920);
  assert.equal(sessionSummary(session).workingSets, 3);
  assert.equal(epley(set, exercise), 80 * (1 + 8 / 30));
  assert.equal(epley(set, { ...exercise, type: 'bodyweight' }), null);
  assert.equal(setVolume(set, { ...exercise, loadBasis: 'assistance' }), null);
  assert.equal(setVolume(set, { ...exercise, loadBasis: 'per_hand', multiplier: 2 }), 1280);
});
test('explicit pauses are removed but background time is counted', () => {
  assert.equal(sessionSummary({ ...session, pauses: [{ startedAt: '2026-10-12T06:00:00Z', endedAt: '2026-10-12T06:05:00Z' }] }).durationSeconds, 3300);
});
test('occurrences require an explicit eligible link and exclude future pending days from adherence', () => {
  const occurrence: Occurrence = { id: uuid(10), programmeId: uuid(11), dayId: uuid(12), date: '2026-10-12', timezone: 'Asia/Kolkata', status: 'missed', sessionId: null, revision: 1 };
  assert.equal(canLinkOccurrence(occurrence, '2026-10-13T05:00:00Z', session.id), true);
  assert.equal(canLinkOccurrence(occurrence, '2026-10-20T05:00:00Z', session.id), false);
  assert.equal(canLinkOccurrence({ ...occurrence, sessionId: uuid(99) }, session.startedAt, session.id), false);
  assert.equal(adherence([{ ...occurrence, date: '2026-10-13', status: 'pending' }], '2026-10-13'), null);
  assert.equal(adherence([{ ...occurrence, status: 'completed' }, { ...occurrence, id: uuid(13), date: '2026-10-13', status: 'pending' }], '2026-10-13')?.percent, 100);
});
test('food portions preserve unknowns and cannot infer liquid density', () => {
  const food = { id: uuid(14), name: 'Dal', aliases: [], brand: '', referenceQuantity: 100, referenceUnit: 'g' as const,
    nutrients: { kcal: 120, protein: 6, carbs: 20, fat: null, fibre: null }, servings: [], source: 'Fixture', sourceVersion: '1', ownerId: null, archived: false };
  assert.deepEqual(scaleFood(food, 150, 'g'), { kcal: 180, protein: 9, carbs: 30, fat: null, fibre: null });
  assert.throws(() => scaleFood(food, 100, 'ml'));
  assert.throws(() => scaleFood(food, Number.NaN, 'g'));
});
test('goal progress handles loss, equal targets and baseline-only strength', () => {
  const goal: Goal = { id: uuid(15), name: 'Bench', type: 'strength', metric: 'max_load', exerciseId: exercise.id, exerciseVersion: 1, loadBasis: 'total', fixedLoadKg: null,
    baseline: 80, baselineCutoff: '2026-10-11T23:59:59Z', startDate: '2026-10-12', deadline: '2026-10-31', target: 100, rangeMin: null, rangeMax: null, status: 'active', notes: '', revision: 1 };
  assert.equal(goalProgress({ ...goal, type: 'loss', baseline: 80, target: 75 }, 78)?.percent, 40);
  assert.equal(goalProgress({ ...goal, baseline: 80, target: 80 }, 80)?.reached, true);
  assert.equal(strengthGoalValue(goal, [{ ...session, localDate: '2026-10-10' }], '2026-10-17'), null);
  assert.equal(strengthGoalValue(goal, [{ ...session, sets: [{ ...set, loadKg: 90 }] }], '2026-10-17'), 90);
  assert.equal(strengthGoalValue(goal, [{ ...session, localDate: '2026-11-01' }], '2026-11-02'), null);
});
test('month-end membership and plate calculator fixtures', () => {
  assert.equal(membershipEndExclusive('2027-01-31', 1), '2027-03-01');
  assert.equal(membershipEndExclusive('2028-01-31', 1), '2028-03-01');
  assert.equal(membershipEndExclusive('2027-01-15', 1), '2027-02-15');
  assert.deepEqual(platePairs(100, 20, [20, 10, 5, 2.5]).perSide, [20, 20]);
  assert.equal(platePairs(101, 20, [20, 10, 5, 2.5]).remainderKg, 1);
});
test('invalid domain inputs cannot enter storage', () => {
  assert.equal(performedSetSchema.safeParse({ ...set, reps: 0 }).success, false);
  assert.equal(performedSetSchema.safeParse({ ...set, rpe: 4.2 }).success, false);
  assert.equal(exerciseSchema.safeParse({ ...exercise, multiplier: 3 }).success, false);
  assert.equal(bodyEntrySchema.safeParse({ id: uuid(1), ownerId: uuid(2), measuredAt: set.performedAt, localDate: '2026-10-12', timezone: 'Asia/Kolkata', weightKg: null, bodyFat: null, measurements: {}, notes: '', deletedAt: null, revision: 1 }).success, false);
});
