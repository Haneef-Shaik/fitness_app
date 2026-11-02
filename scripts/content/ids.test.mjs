import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATALOGUE_NAMESPACE, dayId, exerciseId, prescriptionId, programmeId, uuidv5 } from './ids.mjs';

// The contract's UUID pattern (packages/domain contracts): version 1-8, RFC 4122 variant.
const CONTRACT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DNS_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

test('uuidv5 matches the published RFC 4122 name-based vector', () => {
  // Python's uuid documentation: uuid.uuid5(uuid.NAMESPACE_DNS, 'python.org').
  assert.equal(uuidv5('python.org', DNS_NAMESPACE), '886313e1-3b8a-5372-9b90-0c9aee199e5d');
});

test('catalogue ids are version-5, contract-shaped, deterministic and distinct per key', () => {
  const squat = exerciseId('barbell-back-squat');
  assert.match(squat, CONTRACT_UUID);
  assert.equal(squat[14], '5', 'version nibble');
  assert.equal(exerciseId('barbell-back-squat'), squat, 'same slug, same id');
  assert.notEqual(exerciseId('barbell-front-squat'), squat);
  assert.notEqual(programmeId('barbell-back-squat'), squat, 'programme and exercise key spaces differ');
  const day = dayId('full-body-three-day', 'day-1');
  assert.notEqual(dayId('full-body-three-day', 'day-2'), day);
  assert.notEqual(prescriptionId('full-body-three-day', 'day-1', 1), prescriptionId('full-body-three-day', 'day-1', 2));
  for (const id of [day, programmeId('x'), prescriptionId('p', 'd', 1)]) assert.match(id, CONTRACT_UUID);
});

test('the catalogue namespace never overlaps the development fixture key space', () => {
  assert.match(CATALOGUE_NAMESPACE, CONTRACT_UUID);
  assert.ok(!exerciseId('barbell-bench-press').startsWith('20000000-0000-4000-8000-'));
});

test('a malformed namespace, a non-string name or a bad position is refused', () => {
  assert.throws(() => uuidv5('x', 'not-a-uuid'), /namespace/);
  assert.throws(() => uuidv5(42, DNS_NAMESPACE), /name/);
  assert.throws(() => exerciseId(''), /slug/);
  assert.throws(() => prescriptionId('p', 'd', 0), /position/);
});
