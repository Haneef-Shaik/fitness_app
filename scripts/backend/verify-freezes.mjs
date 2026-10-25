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
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const day = (offset) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); };
async function freezeCall(user, gid, kind, payload, preview = false, id = randomUUID()) { return rpc(preview ? 'freeze_preview_v1' : 'freeze_command_v1', { p_command: { gymId: gid, id, kind, payload } }, user.token); }
try {
 const owner = await account(); const desk = await account(); const linked = await account(); const outsider = await account();
 const gid = randomUUID(); gyms.push(gid); success(await command(owner, gid, 'gym.create', { code: 'F' + randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase(), name: 'Disposable freeze fixture', timezone: 'Asia/Kolkata' }));
 success(await call('/rest/v1/gym_roles', { method: 'POST', admin: true, body: { gym_id: gid, user_id: desk.id, role: 'front_desk' } }));
 const mid = randomUUID(); success(await command(owner, gid, 'member.save', { memberId: mid, name: 'Freeze fixture adult', ageStatus: 'adult', joinedOn: day(-20), noticeVersion: 'development' }));
 success(await call(`/rest/v1/gym_members?id=eq.${mid}`, { method: 'PATCH', admin: true, body: { linked_user_id: linked.id } }));
 const plan = randomUUID(); const planInput = { planId: plan, baseVersion: 0, code: 'FIXED', name: '30 days', feePaise: 100000, durationValue: 30, durationUnit: 'days', freezeDays: 7 };
 success(await command(owner, gid, 'plan.save', planInput));
 const target = randomUUID(); const renewal = randomUUID();
 success(await command(owner, gid, 'membership.issue', { memberId: mid, expectedRevision: 1, membershipId: target, planId: plan, planVersion: 1, startsOn: day(-20) }));
 success(await command(owner, gid, 'membership.issue', { memberId: mid, expectedRevision: 2, membershipId: renewal, planId: plan, planVersion: 1, startsOn: day(10), renewalOf: target }));
 const getAccount = async () => success(await rpc('gym_account_v1', { p_gym: gid, p_member: mid }, owner.token));
 const activeCount = async () => success(await rpc('gym_dashboard_v1', { p_gym: gid }, owner.token)).activeMembers;
 const visit = async () => success(await command(desk, gid, 'visit.record', { memberId: mid, visitId: randomUUID(), occurredAt: new Date().toISOString() }));
 const original = await getAccount(); const fid = randomUUID(); const payload = { memberId: mid, freezeId: fid, membershipId: target, startsOn: day(-2), endsOn: day(2), reason: 'Local fixture interval' };
 const requestId = randomUUID(); const requested = success(await freezeCall(owner, gid, 'request', payload, false, requestId)); assert.equal(requested.status, 'pending');
 assert.deepEqual(success(await freezeCall(owner, gid, 'request', payload, false, requestId)), requested);
 assert.equal((await getAccount()).memberships.find((m) => m.id === target).ends_on, day(10), 'Pending requests change no sold dates');
 assert.equal(await activeCount(), 1); assert.equal((await visit()).eligible, true, 'A pending request does not freeze attendance');
 assert.equal((await freezeCall(desk, gid, 'approve', { memberId: mid, freezeId: fid }, true)).status, 403);
 assert.equal((await freezeCall(linked, gid, 'approve', { memberId: mid, freezeId: fid }, true)).status, 403);
 assert.equal((await freezeCall(outsider, gid, 'approve', { memberId: mid, freezeId: fid }, true)).status, 404);
 const declinedPreview = success(await freezeCall(owner, gid, 'approve', { memberId: mid, freezeId: fid, shiftRenewals: false }, true)); assert.equal(declinedPreview.needsShift, true);
 assert.equal((await freezeCall(owner, gid, 'approve', { memberId: mid, freezeId: fid, shiftRenewals: false, previewHash: declinedPreview.previewHash })).status, 409);
 assert.deepEqual((await getAccount()).balance, original.balance, 'A refused shift changes no finance');
 const stale = success(await freezeCall(owner, gid, 'approve', { memberId: mid, freezeId: fid, shiftRenewals: true }, true));
 const third = randomUUID(); success(await command(owner, gid, 'membership.issue', { memberId: mid, expectedRevision: 3, membershipId: third, planId: plan, planVersion: 1, startsOn: day(40), renewalOf: renewal }));
 assert.equal((await freezeCall(owner, gid, 'approve', { memberId: mid, freezeId: fid, shiftRenewals: true, previewHash: stale.previewHash })).status, 409, 'Concurrent renewal invalidates the preview');
 const beforeApproval = await getAccount(); const review = success(await freezeCall(owner, gid, 'approve', { memberId: mid, freezeId: fid, shiftRenewals: true }, true)); assert.equal(review.changes.length, 3);
 const approvalId = randomUUID(); const approvalBody = { memberId: mid, freezeId: fid, shiftRenewals: true, previewHash: review.previewHash };
 const approved = success(await freezeCall(owner, gid, 'approve', approvalBody, false, approvalId)); assert.deepEqual(success(await freezeCall(owner, gid, 'approve', approvalBody, false, approvalId)), approved);
 const afterApproval = await getAccount(); assert.equal(afterApproval.memberships.find((m) => m.id === target).ends_on, day(14)); assert.equal(afterApproval.memberships.find((m) => m.id === renewal).starts_on, day(14)); assert.equal(afterApproval.memberships.find((m) => m.id === third).starts_on, day(44)); assert.deepEqual(afterApproval.balance, beforeApproval.balance);
 assert.equal(await activeCount(), 0); assert.equal((await visit()).eligible, false, 'Approved frozen dates are ineligible for attendance ranking');
 const overlap = randomUUID(); success(await freezeCall(desk, gid, 'request', { ...payload, freezeId: overlap, startsOn: day(0), endsOn: day(1) })); assert.equal((await freezeCall(owner, gid, 'approve', { memberId: mid, freezeId: overlap, shiftRenewals: true }, true)).ok, false);
 success(await command(owner, gid, 'plan.save', { ...planInput, baseVersion: 1, freezeDays: 30 }));
 const excess = randomUUID(); success(await freezeCall(linked, gid, 'request', { ...payload, freezeId: excess, startsOn: day(4), endsOn: day(8) })); assert.equal((await freezeCall(owner, gid, 'approve', { memberId: mid, freezeId: excess, shiftRenewals: true }, true)).ok, false, 'Editing the catalogue allowance cannot change a sold seven-day allowance');
 const unfreezePayload = { memberId: mid, freezeId: fid, returnOn: date, shiftRenewals: false, reason: 'Fixture early return' }; const returnReview = success(await freezeCall(owner, gid, 'unfreeze', unfreezePayload, true)); assert.equal(returnReview.remainingDays, 5); assert.equal(returnReview.gapDays, 2);
 success(await freezeCall(owner, gid, 'unfreeze', { ...unfreezePayload, previewHash: returnReview.previewHash }));
 const returned = await getAccount(); assert.equal(returned.memberships.find((m) => m.id === target).ends_on, day(12)); assert.equal(returned.memberships.find((m) => m.id === renewal).starts_on, day(14), 'Declining earlier renewal shift must retain the explicit inactive gap'); assert.deepEqual(returned.balance, beforeApproval.balance);
 assert.equal(await activeCount(), 1); assert.equal((await visit()).eligible, true, 'Attendance eligibility resumes on the exclusive return date');
 const excessRow = returned.freezes.find((f) => f.id === excess); success(await freezeCall(owner, gid, 'reject', { memberId: mid, freezeId: excess, requestRevision: excessRow.revision, reason: 'Choose a shorter interval' }));
 const ownRequest = randomUUID(); success(await freezeCall(linked, gid, 'request', { ...payload, freezeId: ownRequest, startsOn: day(5), endsOn: day(6) })); success(await freezeCall(linked, gid, 'cancel', { memberId: mid, freezeId: ownRequest, requestRevision: 1, reason: 'Request withdrawn' }));
 const concurrent = [randomUUID(), randomUUID()];
 success(await freezeCall(owner, gid, 'request', { ...payload, freezeId: concurrent[0], startsOn: day(2), endsOn: day(4) }));
 success(await freezeCall(owner, gid, 'request', { ...payload, freezeId: concurrent[1], startsOn: day(5), endsOn: day(9) }));
 const previews = await Promise.all(concurrent.map(async (freezeId) => success(await freezeCall(owner, gid, 'approve', { memberId: mid, freezeId, shiftRenewals: true }, true))));
 assert.equal((await freezeCall(owner, gid, 'approve', { memberId: mid, freezeId: concurrent[1], shiftRenewals: true, previewHash: previews[0].previewHash })).status, 409, 'A preview is bound to the selected freeze request');
 const raced = await Promise.all(concurrent.map((freezeId, i) => freezeCall(owner, gid, 'approve', { memberId: mid, freezeId, shiftRenewals: true, previewHash: previews[i].previewHash })));
 assert.equal(raced.filter((r) => r.ok).length, 1, 'Only one competing stale preview can commit'); assert.equal(raced.find((r) => !r.ok).status, 409);
 const final = await getAccount(); assert.ok(final.freezes.filter((f) => f.status === 'approved').reduce((n, f) => n + (Date.parse(f.ends_on) - Date.parse(f.starts_on)) / 86400000, 0) <= 7); assert.deepEqual(final.balance, beforeApproval.balance);
 assert.deepEqual((await call(`/rest/v1/gym_freezes?gym_id=eq.${gid}`, { token: outsider.token })).data, []);
 console.log('Freeze integration passed: member/staff requests, permissions, pending isolation, atomic renewal shifts, stale previews, idempotence, overlap/allowance checks, early-return gap, rejection/cancellation, concurrent approvals, attendance eligibility and unchanged finance.');
} finally {
 for (const gid of gyms) {
  for (const table of ['gym_audit','gym_commands','gym_receipts','gym_allocations','gym_principal_events','gym_payments','gym_charge_adjustments','gym_charges','gym_freezes','gym_memberships','gym_plans','gym_visits','gym_members','gym_roles','gym_receipt_counters']) {
   const result = await call(`/rest/v1/${table}?gym_id=eq.${gid}`, { method: 'DELETE', admin: true }); if (!result.ok) console.error('Fixture cleanup needs attention: ' + table);
  }
  await call('/rest/v1/gyms?id=eq.' + gid, { method: 'DELETE', admin: true });
 }
 for (const user of accounts) { const result = await call('/auth/v1/admin/users/' + user, { method: 'DELETE', admin: true }); if (!result.ok) console.error('Fixture account cleanup needs attention'); }
}
