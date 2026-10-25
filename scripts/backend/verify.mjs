import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Integration tests run against this project's isolated LOCAL stack only.
const status = JSON.parse(execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
assert.equal(status.API_URL, 'http://127.0.0.1:55321', 'Refusing to run against any other backend');
const users = [];
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
async function call(path, { method = 'GET', body, token, admin = false } = {}) {
  const response = await fetch(status.API_URL + path, { method, headers: { apikey: admin ? status.SECRET_KEY : status.PUBLISHABLE_KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json', Prefer: 'return=representation' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await response.text(); return { ok: response.ok, status: response.status, data: text ? JSON.parse(text) : null };
}
async function account() {
  const email = `fitlog-integration-${randomUUID()}@example.invalid`; const password = randomUUID() + 'aA1!';
  const created = await call('/auth/v1/admin/users', { method: 'POST', admin: true, body: { email, password, email_confirm: true } });
  assert.equal(created.ok, true, JSON.stringify(created.data)); users.push(created.data.id);
  const login = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
  assert.equal(login.ok, true); return { id: created.data.id, token: login.data.access_token };
}
async function rpc(name, body, token) { return call('/rest/v1/rpc/' + name, { method: 'POST', body, token }); }
try {
  const a = await account(); const b = await account();
  const onboarding = (dob) => ({ p_name: 'Integration fixture', p_dob: dob, p_timezone: 'Asia/Kolkata', p_locale: 'en', p_terms: 'test-notice', p_privacy: 'test-notice' });
  assert.equal((await rpc('complete_onboarding', onboarding('2015-01-01'), a.token)).ok, false, 'Under-18 activation must fail');
  assert.equal((await rpc('complete_onboarding', onboarding('1995-01-01'), a.token)).ok, true);
  assert.equal((await rpc('complete_onboarding', onboarding('1995-01-01'), b.token)).ok, true);
  const escalation = await call('/rest/v1/profiles?id=eq.' + a.id, { method: 'PATCH', token: a.token, body: { status: 'disabled' } });
  assert.equal(escalation.ok, false, 'Account status must not be client-editable');
  const bid = randomUUID();
  const body = await call('/rest/v1/body_entries', { method: 'POST', token: a.token, body: { id: bid, owner_id: a.id, measured_at: new Date().toISOString(), local_date: today, timezone: 'Asia/Kolkata', weight_kg: 80 } });
  assert.equal(body.ok, true, JSON.stringify(body.data));
  const forbidden = await call('/rest/v1/body_entries?owner_id=eq.' + a.id, { token: b.token });
  assert.deepEqual(forbidden.data, [], 'Another member must not read personal body records');
  const forged = await call('/rest/v1/body_entries', { method: 'POST', token: b.token, body: { id: randomUUID(), owner_id: a.id, measured_at: new Date().toISOString(), local_date: today, timezone: 'Asia/Kolkata', weight_kg: 80 } });
  assert.equal(forged.ok, false, 'Another member must not write personal body records');

  const sid = randomUUID(); const iid = randomUUID(); const now = new Date().toISOString();
  const row = (await call('/rest/v1/exercises?id=eq.20000000-0000-4000-8000-000000000001', { token: a.token })).data[0];
  assert.ok(row, 'Run seed-development.mjs first');
  const exercise = { id: row.id, version: row.version, name: row.name, type: row.logging_type, loadBasis: row.load_basis, multiplier: row.multiplier, equipment: row.equipment, primaryMuscles: row.primary_muscles, secondaryMuscles: row.secondary_muscles, instructions: row.instructions, aliases: row.aliases, ownerId: row.owner_id, archived: row.archived };
  const session = { id: sid, ownerId: a.id, name: 'Integration workout', programmeId: null, dayId: null, occurrenceId: null, status: 'in_progress', startedAt: now, localDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), timezone: 'Asia/Kolkata', sets: [], instances: [{ id: iid, exercise, prescription: null, skipped: false }], pauses: [] };
  const operation = (kind, baseRevision, payload) => ({ id: randomUUID(), ownerId: a.id, entityId: sid, kind, baseRevision, payload, dependencies: [] });
  const start = operation('session.create', 0, { session });
  const started = await rpc('apply_operation_v1', { p_operation: start }, a.token);
  assert.equal(started.ok, true, JSON.stringify(started.data));
  assert.deepEqual((await rpc('apply_operation_v1', { p_operation: start }, a.token)).data, started.data, 'Operation replay must be idempotent');
  const changedReplay = { ...start, payload: { session: { ...session, name: 'Different input' } } };
  assert.equal((await rpc('apply_operation_v1', { p_operation: changedReplay }, a.token)).ok, false, 'Operation IDs cannot be reused for different inputs');
  assert.equal((await rpc('apply_operation_v1', { p_operation: { ...start, id: randomUUID(), entityId: randomUUID() } }, a.token)).ok, false, 'A second active workout must fail');
  const log = operation('set.commit', 1, {});
  log.payload = { set: { id: randomUUID(), mutationId: log.id, instanceId: iid, reps: 8, loadKg: 80, durationSeconds: null, distanceMetres: null, rpe: null, rir: null, type: 'working', notes: '', performedAt: now, deletedAt: null } };
  const logged = await rpc('apply_operation_v1', { p_operation: log }, a.token);
  assert.equal(logged.ok, true, JSON.stringify(logged.data));
  assert.equal((await rpc('apply_operation_v1', { p_operation: { ...log, id: randomUUID(), baseRevision: 1 } }, a.token)).ok, false, 'Stale revisions must fail');
  assert.equal((await call('/rest/v1/performed_sets?session_id=eq.' + sid, { token: a.token })).data.length, 1);
  assert.deepEqual((await call('/rest/v1/workout_sessions', { token: b.token })).data, []);
  const finish = operation('session.finish', 2, { status: 'completed', endedAt: new Date().toISOString(), notes: '' });
  assert.equal((await rpc('apply_operation_v1', { p_operation: finish }, a.token)).ok, true);
  const edit = operation('set.edit', 3, { set: { ...log.payload.set, reps: 9, revision: 2 }, setRevision: 1 });
  const edited = await rpc('apply_operation_v1', { p_operation: edit }, a.token);
  assert.equal(edited.ok, true, JSON.stringify(edited.data));
  assert.equal((await call('/rest/v1/performed_sets?session_id=eq.' + sid, { token: a.token })).data[0].reps, 9);
  const deletion = operation('session.delete', 4, {});
  assert.equal((await rpc('apply_operation_v1', { p_operation: deletion }, a.token)).ok, true);
  assert.equal((await rpc('apply_operation_v1', { p_operation: operation('session.restore', 5, {}) }, a.token)).ok, true);
  assert.equal((await call('/rest/v1/workout_revisions?session_id=eq.' + sid, { token: b.token })).data.length, 0, 'Audit snapshots remain private');
  console.log('Local backend integration passed: adult eligibility, status protection, owner isolation, one active workout, idempotence, stale-revision conflicts, set commit and finish.');
} finally {
  const filter = encodeURIComponent(`in.(${users.join(',')})`);
  for (const table of ['mutation_outcomes', 'workout_revisions', 'performed_sets', 'workout_sessions', 'body_entries', 'goals', 'meal_items', 'nutrition_targets', 'schedule_occurrences', 'programme_schedules', 'programmes', 'foods', 'exercises']) {
    if (users.length) { const result = await call(`/rest/v1/${table}?owner_id=${filter}`, { method: 'DELETE', admin: true }); if (!result.ok) console.error(`Fixture cleanup needs attention: ${table}`); }
  }
  for (const user of users) { const result = await call('/auth/v1/admin/users/' + user, { method: 'DELETE', admin: true }); if (!result.ok) console.error('Fixture account cleanup needs attention'); }
}
