import { test } from 'node:test';
import assert from 'node:assert/strict';
import { instantAtLocalTime, instantForDiaryDate } from './dates.ts';
test('backdated diary records retain their selected local date in India and DST zones', () => {
  assert.equal(instantAtLocalTime('2026-10-12', 'Asia/Kolkata'), '2026-10-12T06:30:00.000Z');
  assert.equal(instantAtLocalTime('2026-03-08', 'America/New_York'), '2026-03-08T16:00:00.000Z');
  assert.equal(instantForDiaryDate('2026-10-12', 'Asia/Kolkata', '2026-10-11T20:00:00Z'), '2026-10-11T20:00:00Z');
  assert.throws(() => instantAtLocalTime('2026-03-08', 'America/New_York', 2, 30), /does not exist/);
});
