import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { HINDI_BACKLOG, loadCatalogue } from './catalogue.mjs';
import { seedRows } from './seed.mjs';
import { buildStarterTemplates, exerciseSnapshot, hindiBacklog } from './templates.mjs';

const catalogue = loadCatalogue();
const CONTRACT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const contractsDir = new URL('../../packages/domain/contracts/', import.meta.url);
const { snapshots } = JSON.parse(readFileSync(new URL('manifest.json', contractsDir), 'utf8'));
const contract = JSON.parse(readFileSync(new URL(`${snapshots.at(-1).version}.json`, contractsDir), 'utf8'));
const daySchema = contract.persisted.days.items;
const prescriptionSchema = daySchema.properties.exercises.items;
const snapshotSchema = prescriptionSchema.properties.exercise;
const sorted = (values) => [...values].sort();

test('starter templates use exactly the keys of the published persisted days contract', () => {
  for (const schema of [daySchema, prescriptionSchema, snapshotSchema]) assert.equal(schema.additionalProperties, false);
  for (const template of buildStarterTemplates(catalogue)) {
    for (const day of template.days) {
      assert.deepEqual(sorted(Object.keys(day)), sorted(daySchema.required), `${template.slug} day keys`);
      for (const prescription of day.exercises) {
        assert.deepEqual(sorted(Object.keys(prescription)), sorted(prescriptionSchema.required), `${template.slug} prescription keys`);
        assert.deepEqual(sorted(Object.keys(prescription.exercise)), sorted(snapshotSchema.required), `${template.slug} snapshot keys`);
      }
    }
  }
});

test('template values sit inside the contract bounds and snapshot the seeded exercise version exactly', () => {
  const rowsById = new Map(seedRows(catalogue).map((row) => [row.id, row]));
  const ids = [];
  for (const template of buildStarterTemplates(catalogue)) {
    ids.push(template.id);
    assert.match(template.id, CONTRACT_UUID);
    for (const day of template.days) {
      ids.push(day.id);
      assert.match(day.id, CONTRACT_UUID);
      assert.ok(day.name.length >= 1 && day.name.length <= 100 && day.notes.length <= 2000);
      assert.ok(day.weekdays.length >= 1 && day.weekdays.every((weekday) => Number.isInteger(weekday) && weekday >= 0 && weekday <= 6));
      assert.ok(day.exercises.length >= 1, `${template.slug} ${day.name} has exercises, so it can be scheduled`);
      for (const p of day.exercises) {
        ids.push(p.id);
        assert.match(p.id, CONTRACT_UUID);
        assert.ok(Number.isInteger(p.sets) && p.sets >= 1 && p.sets <= 50);
        assert.ok(Number.isInteger(p.repsMin) && Number.isInteger(p.repsMax) && p.repsMin >= 1 && p.repsMax <= 1000 && p.repsMin <= p.repsMax);
        assert.ok(Number.isInteger(p.restSeconds) && p.restSeconds >= 0 && p.restSeconds <= 3600);
        assert.ok(p.durationSeconds === null || (Number.isInteger(p.durationSeconds) && p.durationSeconds >= 1 && p.durationSeconds <= 86400));
        assert.equal(p.distanceMetres, null);
        assert.equal(p.loadKg, null, 'starter templates leave load unset (PRD 6.2)');
        assert.equal(p.supersetId, null);
        const row = rowsById.get(p.exercise.id);
        assert.ok(row, `${p.exercise.name} is a seeded catalogue row`);
        assert.deepEqual(p.exercise, exerciseSnapshot(row));
        assert.equal(p.exercise.ownerId, null);
        if (p.exercise.type === 'timed') assert.ok(p.durationSeconds !== null, `${p.exercise.name} has a duration`);
      }
    }
  }
  assert.equal(new Set(ids).size, ids.length, 'template, day and prescription ids are distinct');
});

test('starter templates snapshot the PRD 6.1 multiplier of the seeded row: two-dumbbell one-leg x1, one-arm x1, bilateral per-hand x2 (review M2)', () => {
  // The published snapshot has no reps-per-side key, so the template cannot say "per side" yet; that is MB-2's.
  const expected = { 'dumbbell-reverse-lunge': 1, 'dumbbell-bulgarian-split-squat': 1, 'dumbbell-one-arm-row': 1, 'dumbbell-bench-press': 2 };
  const snapshots = buildStarterTemplates(catalogue).flatMap((template) => template.days.flatMap((day) => day.exercises.map((p) => p.exercise)));
  for (const [slug, multiplier] of Object.entries(expected)) {
    const id = catalogue.exercises.find((exercise) => exercise.slug === slug)?.id;
    const prescribed = snapshots.filter((snapshot) => snapshot.id === id);
    assert.ok(id && prescribed.length >= 1, `a starter programme prescribes ${slug}`);
    for (const snapshot of prescribed) assert.deepEqual([snapshot.loadBasis, snapshot.multiplier], ['per_hand', multiplier], slug);
  }
});

test('template ids and content are deterministic across builds', () => {
  assert.deepEqual(buildStarterTemplates(loadCatalogue()), buildStarterTemplates(catalogue));
});

test('box 4: the G14.hi backlog lists every record without Hindi exactly once, and a translated record leaves it', () => {
  const backlog = hindiBacklog(catalogue);
  const keys = backlog.map((entry) => `${entry.kind}:${entry.key}`);
  assert.equal(new Set(keys).size, keys.length, 'no record is listed twice');
  const days = catalogue.programmes.flatMap((programme) => programme.days);
  const records = catalogue.regions.length + catalogue.muscles.length + catalogue.equipment.length + catalogue.exercises.length + catalogue.programmes.length + days.length;
  const translated = [...catalogue.regions, ...catalogue.muscles, ...catalogue.equipment, ...catalogue.exercises, ...catalogue.programmes, ...days].filter((record) => record.hi !== HINDI_BACKLOG).length;
  assert.equal(backlog.length, records - translated);
  for (const exercise of catalogue.exercises.filter((item) => item.hi === HINDI_BACKLOG)) {
    assert.deepEqual(backlog.find((entry) => entry.kind === 'exercise' && entry.key === exercise.slug), { kind: 'exercise', key: exercise.slug, gate: HINDI_BACKLOG, fields: ['name', 'instructions'] });
  }
  assert.ok(backlog.every((entry) => entry.gate === HINDI_BACKLOG));
  const copy = structuredClone(catalogue);
  copy.exercises[0].hi = { name: 'बारबेल बैक स्क्वाट', instructions: 'बार को कंधों के पीछे रखें। नीचे बैठें और फिर खड़े हों।' };
  const after = hindiBacklog(copy);
  assert.equal(after.length, backlog.length - 1);
  assert.ok(!after.some((entry) => entry.kind === 'exercise' && entry.key === copy.exercises[0].slug));
});
