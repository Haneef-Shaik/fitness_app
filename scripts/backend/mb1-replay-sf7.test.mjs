// MB-1 replay runner tests: SF-7, review 2026-10-27T0405Z findings 1 and 4 in the scope of review 2026-10-27T0605Z. Every
// 55321 command needs Docker's own binding of the shared stack; shared-apply proves the route to 55321 and the binding again
// before its final guards, and a changed binding after migration up is a STOP; the replay mirror is held; state.json's
// shared pin is "true <ISO time>". Every Docker and CLI answer is a harness fixture: no live shape was read.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { bindingArgs, bindingLine, SHARED_BINDING } from './mb1-replay-binding.mjs';
import { CANDIDATE } from './mb1-replay-evidence.mjs';
import { STATE } from './mb1-replay-target.mjs';
import {
  atSharedApply, ATTEMPTED, BASE, bindingOutput, cliTable, CONFIRM, DIR, escapeRe, failed, INCIDENT, kind, leaks, LOCK, MIGRATIONS, ok, passes, readState, refuses, run, setup,
  SHARED_CONFIRM, snapshot, STAGING, SUPABASE_BIN, version,
} from './mb1-replay-test-harness.mjs';

const DB = 'supabase_db_fitlog_rebuild_20261017';
const KONG = 'supabase_kong_fitlog_rebuild_20261017';
const TIMEOUT = Object.freeze({ status: null, stdout: '', stderr: '', error: 'ETIMEDOUT' });
const unbound = (problems, consequence) => `Docker does not show the shared stack bound to 55322 and 55321: ${escapeRe(problems)}${consequence ? `; ${consequence}` : ''}`;
const refusal = (problems, consequence = 'nothing runs on 55321') => new RegExp(`^mb1-replay refused: ${unbound(problems, consequence)}\\n$`);
const PORT_DB = `${DB}: 5432/tcp is published other than only at 127.0.0.1 or 0.0.0.0 port 55322`;
const CHANGED = "Docker's binding of the shared stack changed";
const SHAPE = '\\(a container id, the project label or a published port\\)';
const UNKNOWN = `what 55321 applied is unknown, so shared-apply never runs again: ${INCIDENT}`; // SF-7b L4
// SF-7c (review 2026-10-27T0935Z L1): right after the first binding, the proven database ID's start time ('inspect-id').
const BEFORE_UP = ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'binding'];
// SF-7d (review 2026-10-27T1105Z L1, L2): the proven ID's start time again right after the second binding read, the last child
// before the final guards and the attempt; after migration up, after the binding read and again after the after snapshot.
const TO_UP = [...BEFORE_UP, 'inspect-id'];
const VERIFIED = [...TO_UP, 'migration up', 'binding', 'inspect-id', 'psql-read', 'inspect-id', 'inspect'];
const rows = (remote) => MIGRATIONS.map((file) => ({ local: version(file), remote: remote(file) ? version(file) : '' }));

test("SF-7: every 55321 command needs Docker's own binding of the shared stack before any SQL; anything else refuses, fail closed", async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  passes(await snapshot(env, 'before'), 'snapshot before');
  const cases = [
    ['another project label', { binding: bindingOutput({ label: 'fitlog_other_20261026' }) }, `${DB}: its com.supabase.cli.project label is not fitlog_rebuild_20261017; ${KONG}: its com.supabase.cli.project label is not fitlog_rebuild_20261017`],
    ['the database published at 56422', { binding: bindingOutput({ db: '56422' }) }, PORT_DB],
    ['Kong published at 56421', { binding: bindingOutput({ api: '56421' }) }, `${KONG}: 8000/tcp is published other than only at 127.0.0.1 or 0.0.0.0 port 55321`],
    ['an IPv6 address', { binding: bindingOutput({ hostIp: '::' }) }, `${PORT_DB}; ${KONG}: 8000/tcp is published other than only at 127.0.0.1 or 0.0.0.0 port 55321`],
    ['malformed output', { binding: `garbage ${'x'.repeat(40)}\n` }, 'docker inspect printed 1 line(s), not 2 (one per container, in order)'],
    ['exit 1', { bindingRuns: [failed('Error: No such object: supabase_kong_fitlog_rebuild_20261017')] }, 'docker inspect failed (exit 1)'],
    ['a timeout', { bindingRuns: [TIMEOUT] }, 'docker inspect did not finish (ETIMEDOUT)'],
  ];
  const { binding } = env.world;
  for (const [label, world, problems] of cases) {
    Object.assign(env.world, world);
    const result = refuses(await run(env, 'shared-snapshot', DIR, 'before', '--evidence', 'phase2-sf7-binding'), refusal(problems));
    Object.assign(env.world, { binding, bindingRuns: [] });
    assert.deepEqual(result.kinds, ['inspect', 'status', 'names', 'binding'], `${label}: no SQL after a refused binding`);
    assert.equal(readState(env).snapshots['55321-before'], undefined, label);
    assert.deepEqual(leaks(`${result.out}${result.err}${readFileSync(env.at('evidence/phase2-sf7-binding.txt'), 'utf8')}`), [], label);
    unlinkSync(env.at('evidence/phase2-sf7-binding.txt'));
  }
  const taken = passes(await run(env, 'shared-snapshot', DIR, 'before'), 'shared-snapshot before');
  assert.deepEqual(taken.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read']);
  const inspect = env.world.calls.find((call) => kind(call) === 'binding');
  assert.deepEqual([inspect.command, inspect.args, inspect.options.timeoutMs], ['docker', bindingArgs(SHARED_BINDING), 120_000]);
  assert.ok(taken.out.includes(`${bindingLine(SHARED_BINDING)}\n`), taken.out);
});

test('SF-7: shared-apply proves the route to 55321 and the binding again as its last children before the final guards; any failure refuses with no attempt recorded', async (t) => {
  const env = setup(t);
  await atSharedApply(env);
  const noAttempt = (label) => assert.equal(readState(env).sharedApplyAttempted, undefined, `${label}: an attempt was recorded`);
  // The binding in sharedRunning, for shared-apply too: refused before the fresh snapshot.
  env.world.binding = bindingOutput({ db: '56422' });
  assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), refusal(PORT_DB)).kinds, ['inspect', 'status', 'names', 'binding', 'inspect']);
  env.world.binding = bindingOutput();
  noAttempt('the first binding');

  // The route proof: migration list for the staged workdir reads the database migration up writes.
  const route = (problems) => new RegExp(`^mb1-replay refused: the route proof failed \\(migration list for the staged input must show the 15 base migrations remote and ${escapeRe(CANDIDATE)} local only\\): ${escapeRe(problems)}; apply nothing\\n$`);
  const other = '29991231235959';
  const differs = [...rows((file) => file !== CANDIDATE && file !== BASE[3]), { local: '', remote: other }];
  const cases = [
    ['16 remote: the candidate already applied', ok(cliTable(rows(() => true))), route(`${version(CANDIDATE)} is listed local and remote, expected local only`)],
    ['no row', ok(cliTable([])), route('no migration row was recognised, so the list proves nothing')],
    ['one remote version differs', ok(cliTable(differs)), route(`the list has 17 row(s); the manifest expects 16; ${version(BASE[3])} is listed local only, expected local and remote; ${other} is listed remote only, but it is not in the manifest`)],
    ['exit 1', failed('failed to connect to postgres: connection refused'), /^mb1-replay refused: migration list for the staged shared-apply input failed \(exit 1\); the route to 55321 is not proved; apply nothing\n$/],
    ['a timeout', TIMEOUT, /^mb1-replay refused: migration list for the staged shared-apply input did not finish \(ETIMEDOUT\); the route to 55321 is not proved; apply nothing\n$/],
  ];
  for (const [label, list, reason] of cases) {
    env.world.stagedList = list;
    const result = refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM, '--evidence', 'phase2-sf7-route'), reason);
    env.world.stagedList = null;
    assert.deepEqual(result.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'inspect'], label);
    assert.deepEqual(leaks(`${result.out}${result.err}${readFileSync(env.at('evidence/phase2-sf7-route.txt'), 'utf8')}`), [], label);
    unlinkSync(env.at('evidence/phase2-sf7-route.txt'));
    noAttempt(label);
  }

  // The binding again, after the route proof: equal to the first, or nothing applies.
  for (const [label, second, reason] of [
    ['another container id', ok(bindingOutput({ seed: 'replaced' })), new RegExp(`^mb1-replay refused: ${CHANGED} before migration up ${SHAPE}; apply nothing\\n$`)],
    ['another address', ok(bindingOutput({ hostIp: '0.0.0.0' })), new RegExp(`^mb1-replay refused: ${CHANGED} before migration up ${SHAPE}; apply nothing\\n$`)],
    ['the database moved', ok(bindingOutput({ db: '56422' })), refusal(PORT_DB, 'apply nothing')],
    ['a timeout', TIMEOUT, refusal('docker inspect did not finish (ETIMEDOUT)', 'apply nothing')],
  ]) {
    env.world.bindingRuns = [ok(bindingOutput()), second];
    const result = refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), reason);
    assert.deepEqual(result.kinds, [...BEFORE_UP, 'inspect'], label);
    noAttempt(label);
  }

  // A change to the staged input during either child is caught by the synchronous guards after it, before the attempt.
  const victim = join(env.at(`private${DIR}`), 'shared-apply', 'supabase', 'migrations', BASE[3]);
  const original = readFileSync(victim);
  for (const hook of ['onList', 'onBinding']) {
    let seen = 0;
    env.world[hook] = () => { seen += 1; if (hook === 'onList' || seen === 2) writeFileSync(victim, 'select 1;\n'); };
    const result = refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), new RegExp(`^mb1-replay refused: shared-apply/supabase/migrations/${escapeRe(BASE[3])} no longer matches its sha256 in manifest\\.json; apply nothing\\n$`));
    env.world[hook] = null;
    writeFileSync(victim, original);
    assert.deepEqual(result.kinds, [...TO_UP, 'inspect'], hook);
    noAttempt(hook);
  }

  // Nothing changed: the list, the binding and the proven ID's start time (SF-7d), then the guards and the attempt, then
  // migration up, with no child between.
  const order = [];
  env.world.onList = () => order.push(`list:${readState(env).sharedApplyAttempted ? 'attempted' : 'none'}`);
  env.world.onBinding = () => order.push(`binding:${readState(env).sharedApplyAttempted ? 'attempted' : 'none'}`);
  env.world.onMigrate = (w, workdir) => order.push(`up ${workdir === STAGING ? 'staged' : workdir}:${readState(env).sharedApplyAttempted ? 'attempted' : 'none'}`);
  const apply = passes(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM, '--evidence', 'phase2-sf7-apply'), 'shared-apply');
  assert.deepEqual(order, ['binding:none', 'list:none', 'binding:none', 'up staged:attempted', 'binding:attempted']);
  assert.deepEqual(apply.kinds, VERIFIED);
  const calls = env.world.calls.slice(-apply.kinds.length);
  assert.deepEqual(calls[7].args, [SUPABASE_BIN, 'migration', 'list', '--local', '--workdir', STAGING]);
  for (const at of [3, 8, 11]) assert.deepEqual(calls[at].args, bindingArgs(SHARED_BINDING), `call ${at}`);
  assert.match(apply.out, new RegExp(`^# route proof: migration list for the staged input shows 16 migration\\(s\\) local, the 15 base remote and ${escapeRe(CANDIDATE)} local only$`, 'm'));
  assert.match(apply.out, /^# rechecked before migration up: Docker's binding of the shared stack is unchanged$/m);
  assert.match(apply.out, /^# rechecked after migration up: Docker's binding of the shared stack is unchanged$/m);
  assert.deepEqual(leaks(`${apply.out}${readFileSync(env.at('evidence/phase2-sf7-apply.txt'), 'utf8')}`), []);
  assert.equal(readState(env).sharedApplied, true);
});

test('SF-7: after migration up, a changed or unreadable binding is a STOP: the attempt stays recorded and sharedApplied stays false', async (t) => {
  for (const [label, change, stop] of [
    ['another container id', (w) => { w.binding = bindingOutput({ seed: 'replaced' }); }, `${CHANGED} while migration up ran ${SHAPE}`],
    ['the database moved to 56422', (w) => { w.binding = bindingOutput({ db: '56422' }); }, unbound(PORT_DB)],
    ['malformed output', (w) => { w.binding = 'garbage\n'; }, unbound('docker inspect printed 1 line(s), not 2 (one per container, in order)')],
    ['exit 1', (w) => { w.bindingRuns = [failed('Error: No such object')]; }, unbound('docker inspect failed (exit 1)')],
    ['a timeout', (w) => { w.bindingRuns = [TIMEOUT]; }, unbound('docker inspect did not finish (ETIMEDOUT)')],
    // The binding is read whatever migration up's exit: an unchanged binding, then the failed exit's own STOP.
    ['migration up exit 1, binding unchanged', (w) => { w.migrateResult = failed('Error: failed to connect to postgres'); }, null],
  ]) {
    const env = setup(t);
    await atSharedApply(env);
    env.world.onMigrate = (w, workdir) => { if (workdir === STAGING) change(w); };
    const result = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM, '--evidence', 'phase2-6-apply');
    Object.assign(env.world, { onMigrate: null, migrateResult: null });
    assert.equal(result.code, 1, label);
    assert.equal(result.err, '', `${label}: a STOP line, not a refusal`);
    // A changed binding STOPs before the proven ID's inspect after migration up (SF-7d); an unchanged one is followed by it.
    assert.deepEqual(result.kinds, [...TO_UP, 'migration up', 'binding', ...(stop ? [] : ['inspect-id']), 'inspect'], label);
    const line = new RegExp(`^# STOP: ${stop ? `after migration up: ${stop}` : 'migration up exited 1'}; ${UNKNOWN}$`, 'm');
    assert.match(result.out, line, label);
    assert.match(readFileSync(env.at('evidence/phase2-6-apply.txt'), 'utf8'), line, label);
    if (!stop) assert.match(result.out, /^# rechecked after migration up: Docker's binding of the shared stack is unchanged$/m, label);
    const state = readState(env);
    assert.deepEqual(state.sharedApplyAttempted, { at: env.clock, workdir: 'shared-apply' }, label);
    assert.equal(state.sharedApplied, false, label);
    assert.equal(state.snapshots['55321-after'], undefined, label);
    assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), ATTEMPTED).kinds, ['inspect'], label);
  }
});

test('SF-7 holds the replay mirror: no replay command reads a binding, so stop and teardown run as before until the first live read', async (t) => {
  const env = setup(t);
  await atSharedApply(env); // every replay command, stop and a fresh start included, then one shared-snapshot
  const bindings = env.world.calls.filter((call) => kind(call) === 'binding');
  assert.equal(bindings.length, 1, 'only shared-snapshot before read a binding');
  assert.deepEqual(bindings[0].args, bindingArgs(SHARED_BINDING));
  passes(await run(env, 'retain', DIR), 'retain');
  const teardown = passes(await run(env, 'teardown', DIR, ...CONFIRM), 'teardown');
  assert.deepEqual(teardown.kinds, ['inspect', 'names', 'status', 'names', 'stop', 'names', 'inspect']);
});

test("0405Z finding 4: state.json's shared pin must be \"true <ISO time>\"; today's replay value and state shape read unchanged", async (t) => {
  const TODAY = 'true 2026-10-26T12:51:50.578854542Z'; // the replay's pin, as checkpoint.md records it (phase 2 attempt 2)
  const env = setup(t);
  env.world.shared = TODAY;
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  assert.equal(readState(env).shared, TODAY);
  // The state's shape after phase 2 attempt 8 (checkpoint.md): nine suites, mutations m1, m3 and m2, no shared proof.
  const entry = (expect, ok, endedAt, ban = 'banned') => ({ stack: 'replay', expect, ok, ban, generation: 1, endedAt });
  const today = {
    ...readState(env), candidate: 'applied', restoredProof: true, mutations: ['m1', 'm3', 'm2'], ban: 'banned', checks: {}, sharedApplied: false,
    suites: [entry('red', false, 1792946523000, null), entry('red', true, 1793037951000), entry('green', true, 1793059640000), entry('m1', true, 1793062950000),
      entry('green', true, 1793063035000), entry('m3', true, 1793066763147), entry('green', true, 1793066864185), entry('m2', true, 1793070372755), entry('green', true, 1793070472840)],
  };
  const path = env.at(`private${DIR}/${STATE}`);
  const bytes = Buffer.from(`${JSON.stringify(today, null, 2)}\n`);
  writeFileSync(path, bytes);
  assert.deepEqual(passes(await run(env, 'check', DIR), 'check on today').kinds, ['inspect', 'status', 'names']);
  const gate = refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), /^mb1-replay refused: shared-apply needs every replay proof first; missing: a generation 2 green suite, a clean generation 2 diff, a clean generation 2 lint, matching images, the 55321-before snapshot\n$/);
  assert.deepEqual(gate.kinds, ['inspect']);
  assert.deepEqual(readFileSync(path), bytes, 'reading today\'s state changed nothing');
  const pin = /^mb1-replay refused: state\.json's shared pin is not "true <ISO time>" \(the shared 55321 database container's start time, pinned at prepare\), so it is not this runner's state\n$/;
  const bad = ['absent', 'false 2026-10-26T12:51:50.578854542Z', 'true', 'true ', 'true 2026-10-26', 'true 2026-10-26T12:51', `${TODAY}\n`, ` ${TODAY}`, `${TODAY} `, TODAY.toUpperCase(),
    `${TODAY} extra`, 'true 2026-10-26T12:51:50.1234567890Z', 'true 2026-10-26 12:51:50Z', 'true 2026-10-26T12:51:50.578854542', '', 'true\t2026-10-26T12:51:50Z'];
  for (const [label, value, reason] of [...bad.map((value) => [JSON.stringify(value), value, pin]), ['a number', 42, /state\.json is not this runner's state/], ['null', null, /state\.json is not this runner's state/]]) {
    writeFileSync(path, `${JSON.stringify({ ...today, shared: value }, null, 2)}\n`);
    assert.deepEqual(refuses(await run(env, 'check', DIR), reason).kinds, [], `${label}: a child ran`);
    assert.equal(existsSync(env.at(`private${DIR}/${LOCK}`)), false, `${label}: the lock was kept`);
  }
  for (const value of ['true 2026-10-26T12:51:50Z', 'true 2026-10-26T12:51:50.5+02:00', 'true 2026-10-26T12:51:50.123456789-05:30']) {
    writeFileSync(path, `${JSON.stringify({ ...today, shared: value }, null, 2)}\n`);
    refuses(await run(env, 'check', DIR), /STOP: the shared 55321 database container changed before check/); // read, then compared
  }
  writeFileSync(path, bytes);
  passes(await run(env, 'check', DIR), 'check on today, again');
});
