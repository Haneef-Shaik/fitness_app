import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const config = JSON.parse(execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
assert.equal(config.API_URL, 'http://127.0.0.1:55321', 'Tests only run on the isolated local stack');
const accounts = []; const gyms = [];
async function call(path, { method = 'GET', body, token, admin = false } = {}) {
  const response = await fetch(config.API_URL + path, { method, headers: { apikey: admin ? config.SECRET_KEY : config.PUBLISHABLE_KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json', Prefer: 'return=representation' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await response.text(); return { ok: response.ok, status: response.status, data: text ? JSON.parse(text) : null };
}
const rpc = (name, body, token) => call('/rest/v1/rpc/' + name, { method: 'POST', body, token });
async function account() {
  const email = `gym-integration-${randomUUID()}@example.invalid`; const password = randomUUID() + 'aA1!';
  const created = await call('/auth/v1/admin/users', { method: 'POST', admin: true, body: { email, password, email_confirm: true } }); assert.equal(created.ok, true); accounts.push(created.data.id);
  const login = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }); assert.equal(login.ok, true);
  const user = { id: created.data.id, token: login.data.access_token };
  const onboarded = await rpc('complete_onboarding', { p_name: 'Gym integration fixture', p_dob: '1995-01-01', p_timezone: 'Asia/Kolkata', p_locale: 'en', p_terms: 'development', p_privacy: 'development' }, user.token); assert.equal(onboarded.ok, true, JSON.stringify(onboarded.data)); return user;
}
async function command(user, gymId, kind, payload, operationId = randomUUID()) { return rpc('gym_command_v1', { p_command: { id: operationId, gymId, kind, payload } }, user.token); }
function success(result) { assert.equal(result.ok, true, JSON.stringify(result.data)); return result.data; }
try {
  const owner = await account(); const desk = await account(); const outsider = await account();
  const gid = randomUUID(); gyms.push(gid);
  success(await command(owner, gid, 'gym.create', { code: 'T' + randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase(), name: 'Disposable local integration gym', timezone: 'Asia/Kolkata' }));
  assert.equal((await command(outsider, gid, 'plan.save', {})).status, 404, 'Another tenant must not learn gym details');
  const role = await call('/rest/v1/gym_roles', { method: 'POST', admin: true, body: { gym_id: gid, user_id: desk.id, role: 'front_desk' } }); success(role);
  assert.equal((await call('/rest/v1/gym_roles', { method: 'POST', admin: true, body: { gym_id: gid, user_id: outsider.id, role: 'trainer' } })).ok, false, 'Retired trainer role must be rejected');
  const minor = await command(owner, gid, 'member.save', { memberId: randomUUID(), name: 'Minor fixture', ageStatus: 'minor', joinedOn: '2026-10-01', noticeVersion: 'dev' }); assert.equal(minor.ok, false);
  const mid = randomUUID(); success(await command(desk, gid, 'member.save', { memberId: mid, name: 'Adult fixture', ageStatus: 'adult', joinedOn: '2026-10-01', noticeVersion: 'dev' }));
  const plan = randomUUID(); const planPayload = { planId: plan, baseVersion: 0, code: 'MONTH', name: 'One month', durationValue: 1, durationUnit: 'months', feePaise: 100000, freezeDays: 7 };
  assert.equal((await command(desk, gid, 'plan.save', planPayload)).ok, false, 'Front desk cannot set prices');
  success(await command(owner, gid, 'plan.save', planPayload));
  const term = { memberId: mid, expectedRevision: 1, planId: plan, planVersion: 1, membershipId: randomUUID(), startsOn: '2027-01-31' };
  assert.equal((await command(desk, gid, 'membership.issue', term)).ok, false, 'Front desk cannot activate memberships');
  const issued = success(await command(owner, gid, 'membership.issue', term)); assert.equal(issued.endsOn, '2027-03-01', 'Month-end convention must include all of February');
  assert.equal((await command(owner, gid, 'membership.issue', { ...term, expectedRevision: 2, membershipId: randomUUID() })).ok, false, 'Overlapping memberships must fail atomically');
  const paymentId = randomUUID(); const mutation = randomUUID(); const payment = { memberId: mid, expectedRevision: 2, paymentId, amountPaise: 120000, method: 'cash', receivedAt: new Date().toISOString(), reference: '' };
  const paid = success(await command(desk, gid, 'payment.record', payment, mutation)); assert.deepEqual(paid.balance, { charges: 100000, principal: 120000, allocated: 100000, due: 0, credit: 20000, net: -20000 });
  assert.deepEqual(success(await command(desk, gid, 'payment.record', payment, mutation)), paid, 'Replayed payment must reuse its receipt');
  const refund = { memberId: mid, expectedRevision: 3, paymentId, amountPaise: 15000, principalStartPaise: 105000, reason: 'Local fixture refund', method: 'cash', reference: 'TEST', occurredAt: new Date().toISOString() };
  assert.equal((await command(desk, gid, 'payment.refund', refund)).ok, false, 'Front desk cannot refund');
  const refunded = success(await command(owner, gid, 'payment.refund', refund)); assert.equal(refunded.balance.credit, 5000); assert.equal(refunded.balance.due, 0); assert.equal(refunded.balance.principal, 105000);
  assert.equal((await command(owner, gid, 'payment.reverse', { ...refund, expectedRevision: 4 })).ok, false, 'Refunded principal cannot be reversed again');
  const charge = (await call(`/rest/v1/gym_charges?gym_id=eq.${gid}&member_id=eq.${mid}`, { token: owner.token })).data[0];
  const waived = success(await command(owner, gid, 'charge.waive', { memberId: mid, expectedRevision: 4, chargeId: charge.id, amountPaise: 20000, reason: 'Fixture waiver' })); assert.equal(waived.charges, 80000); assert.equal(waived.principal, 105000); assert.equal(waived.credit, 25000);
  const accountView = success(await rpc('gym_account_v1', { p_gym: gid, p_member: mid }, owner.token)); assert.deepEqual(accountView.balance, waived, 'Account read model must agree with committed ledger');
  assert.equal((await rpc('gym_account_v1', { p_gym: gid, p_member: mid }, outsider.token)).status, 404);
  assert.equal((await call(`/rest/v1/gym_payments?id=eq.${paymentId}`, { method: 'PATCH', token: owner.token, body: { amount_paise: 1 } })).ok, false, 'Settled principal is immutable');
  assert.deepEqual((await call(`/rest/v1/gym_members?gym_id=eq.${gid}`, { token: outsider.token })).data, []);
  const body = success(await call('/rest/v1/body_entries', { method: 'POST', token: owner.token, body: { id: randomUUID(), owner_id: owner.id, measured_at: new Date().toISOString(), local_date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), timezone: 'Asia/Kolkata', weight_kg: 80 } })); assert.ok(body);
  assert.deepEqual((await call('/rest/v1/body_entries?owner_id=eq.' + owner.id, { token: desk.token })).data, [], 'Staff must never gain health access');
  success(await call(`/rest/v1/gym_roles?gym_id=eq.${gid}&user_id=eq.${desk.id}`, { method: 'PATCH', admin: true, body: { revoked_at: new Date().toISOString() } }));
  assert.equal((await command(desk, gid, 'visit.record', { memberId: mid, visitId: randomUUID(), occurredAt: new Date().toISOString() })).status, 404, 'Role revocation takes effect on the next request');
  const concurrentMembers = Array.from({ length: 50 }, () => randomUUID());
  await Promise.all(concurrentMembers.map(async (memberId, i) => success(await command(owner, gid, 'member.save', { memberId, name: `Concurrent fixture ${i + 1}`, ageStatus: 'adult', joinedOn: '2026-10-01', noticeVersion: 'dev' }))));
  const receipts = await Promise.all(concurrentMembers.map(async (memberId) => success(await command(owner, gid, 'payment.record', { memberId, expectedRevision: 1, paymentId: randomUUID(), amountPaise: 1, method: 'cash', receivedAt: new Date().toISOString(), note: 'Disposable concurrency fixture, not actual money' }))));
  const numbers = receipts.map((r) => Number(r.receipt.split('/').at(-1))).sort((a, b) => a - b);
  assert.deepEqual(numbers, Array.from({ length: 50 }, (_, i) => i + 2), '50 concurrent successful receipts must be unique and gap-free');
  console.log('Gym integration passed: tenant isolation, live roles/revocation, retired role rejection, month-end dates, overlap rejection, immutable money, idempotent receipts, disjoint corrections, waiver/credit, consistent account reads, health privacy and 50 concurrent gap-free receipts.');
} finally {
  for (const gid of gyms) {
    for (const table of ['gym_audit','gym_commands','gym_receipts','gym_allocations','gym_principal_events','gym_payments','gym_charge_adjustments','gym_charges','gym_freezes','gym_memberships','gym_plans','gym_visits','gym_members','gym_roles','gym_receipt_counters']) {
      const result = await call(`/rest/v1/${table}?gym_id=eq.${gid}`, { method: 'DELETE', admin: true }); if (!result.ok) console.error('Fixture cleanup needs attention: ' + table);
    }
    await call('/rest/v1/gyms?id=eq.' + gid, { method: 'DELETE', admin: true });
  }
  for (const user of accounts) { await call('/rest/v1/body_entries?owner_id=eq.' + user, { method: 'DELETE', admin: true }); const result = await call('/auth/v1/admin/users/' + user, { method: 'DELETE', admin: true }); if (!result.ok) console.error('Fixture account cleanup needs attention'); }
}
