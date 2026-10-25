import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const id = randomUUID(); const renewal = randomUUID(); const freeze = randomUUID();
const terms = [
  { id, starts_on: '2026-10-01', ends_on: '2026-11-01', original_ends_on: '2026-11-01', cancelled_on: null, revision: 1, snapshot: { freeze_days: 7, duration_value: 1, duration_unit: 'months' } },
  { id: renewal, starts_on: '2026-11-01', ends_on: '2026-12-01', original_ends_on: '2026-12-01', cancelled_on: null, revision: 1, snapshot: { freeze_days: 30, duration_value: 1, duration_unit: 'months' } },
];
const freezes = [{ id: freeze, membership_id: id, starts_on: '2026-10-30', ends_on: '2026-11-03', status: 'pending', revision: 1 }];
function project(t, f, mode, returns = null, shift = true, today = '2026-10-19') {
  const args = [`$terms$${JSON.stringify(t)}$terms$::jsonb`, `$freezes$${JSON.stringify(f)}$freezes$::jsonb`, `'${id}'::uuid`, `'${freeze}'::uuid`, `'${mode}'`, returns ? `'${returns}'::date` : 'null::date', `'${today}'::date`, shift ? 'true' : 'false'];
  return JSON.parse(execFileSync('docker', ['exec', 'supabase_db_fitlog_rebuild_20261017', 'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1', '-c', `select private.freeze_projection(${args.join(',')})`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
}
const approved = project(terms, freezes, 'approve');
assert.equal(approved.changes[0].endsOn, '2026-11-05'); assert.equal(approved.changes[1].startsOn, '2026-11-05'); assert.equal(approved.changes[1].endsOn, '2026-12-05'); assert.equal(approved.remainingDays, 3);
const frozenTerms = terms.map((t, i) => ({ ...t, revision: 2, starts_on: approved.changes[i].startsOn, ends_on: approved.changes[i].endsOn, original_ends_on: approved.changes[i].originalEndsOn }));
const approvedFreeze = [{ ...freezes[0], status: 'approved' }];
const returned = project(frozenTerms, approvedFreeze, 'unfreeze', '2026-11-01', true, '2026-11-01');
assert.equal(returned.changes[0].endsOn, '2026-11-03'); assert.equal(returned.changes[1].startsOn, '2026-11-03'); assert.equal(returned.changes[1].endsOn, '2026-12-03'); assert.equal(returned.remainingDays, 5);
const gap = project(frozenTerms, approvedFreeze, 'unfreeze', '2026-11-01', false, '2026-11-01'); assert.equal(gap.changes.length, 1); assert.equal(gap.gapDays, 2);
assert.throws(() => project([{ ...terms[0], snapshot: { ...terms[0].snapshot, freeze_days: 0 } }, terms[1]], freezes, 'approve'));
assert.throws(() => project(terms, freezes, 'approve', null, true, '2026-11-01'), /./, 'An already-started renewal must not move');
const prior = { id: randomUUID(), membership_id: id, starts_on: '2026-10-05', ends_on: '2026-10-10', status: 'approved' };
assert.throws(() => project(terms, [...freezes, prior], 'approve'), /./, 'Five used days leave only two of the sold seven');
const overlap = { ...prior, starts_on: '2026-10-30', ends_on: '2026-10-31' };
assert.throws(() => project(terms, [...freezes, overlap], 'approve'));
const leapTerms = terms.map((t, i) => ({ ...t, starts_on: i ? '2028-03-01' : '2028-02-01', ends_on: i ? '2028-04-01' : '2028-03-01', original_ends_on: i ? '2028-04-01' : '2028-03-01' }));
const leap = project(leapTerms, [{ ...freezes[0], starts_on: '2028-02-28', ends_on: '2028-03-01' }], 'approve', null, true, '2028-02-01'); assert.equal(leap.consumedDays, 2); assert.equal(leap.changes[0].endsOn, '2028-03-03');
const dstTerms = terms.map((t, i) => ({ ...t, starts_on: i ? '2026-03-31' : '2026-03-01', ends_on: i ? '2026-04-30' : '2026-03-31', original_ends_on: i ? '2026-04-30' : '2026-03-31' }));
assert.equal(project(dstTerms, [{ ...freezes[0], starts_on: '2026-03-07', ends_on: '2026-03-09' }], 'approve', null, true, '2026-03-01').consumedDays, 2, 'DST weekends still count calendar dates');
console.log('Freeze projection passed: PRD October/November fixture, optional early-return gap, sold zero/remaining allowance, overlapping freezes, leap/DST calendar dates and started-renewal rejection.');
