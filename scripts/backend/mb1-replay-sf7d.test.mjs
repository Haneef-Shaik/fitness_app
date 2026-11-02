// MB-1 replay runner tests: SF-7d, the two lows of review 2026-10-27T1105Z (SF-7c's review), test-first, with fixtures only
// (no live Docker read). L1: the proven database ID's start time was checked once, right after the first binding; four child
// processes later the second binding read compares the IDs, the label and the ports, not the start time. So the proven ID is
// inspected again right after that read, as the last child before the final guards, the attempt record and migration up's
// spawn. L2: after migration up, the proven ID's start time is checked again before the after snapshot, and once more after it
// and before the verified state is returned to be written, so a STOP inside shared-apply never records sharedApplied (the
// entry's check by name after it is SF-7e's, mb1-replay-sf7e.test.mjs).
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { STATE } from './mb1-replay-target.mjs';
import {
  atSharedApply, ATTEMPTED, BASE, bindingOutput, dbIdOf, DIR, escapeRe, failed, INCIDENT, ok, passes, readState, refuses, run, setup, SHARED_CONFIRM, SNAPSHOTS,
  STAGING, STARTED,
} from './mb1-replay-test-harness.mjs';

const FINGERPRINT = '{{.State.Running}} {{.State.StartedAt}}';
/** The inspect of the proven database ID (SF-7c): the start-time check's arguments, with the ID in place of the name. */
const proven = (id) => ['inspect', '--type', 'container', '--format', FINGERPRINT, id];
const PROVEN = dbIdOf(bindingOutput());
/** shared-apply up to and including the proven ID's inspect right after the second binding read (SF-7d L1). */
const TO_UP = ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'binding', 'inspect-id'];
const RESTARTED = 'true 2026-10-27T11:05:00.000000000Z';
const OTHER = 'true 2026-10-20T08:00:00.000000000Z';
const STOPPED = STARTED.replace(/^true/, 'false');
const TIMEOUT = Object.freeze({ status: null, stdout: '', stderr: '', error: 'ETIMEDOUT' });
const ABSENT = failed(`Error response from daemon: No such container: ${PROVEN}`);
const unpinned = (now) => `the database container Docker's binding proved, inspected by its ID, does not have the start time pinned at prepare \\(recorded "${escapeRe(STARTED)}", now "${escapeRe(now)}"\\): it was restarted or recreated, or another Docker daemon answered, after the start-time check`;
const UNFINISHED = 'docker inspect of the database container the binding proved did not finish \\(ETIMEDOUT\\); the shared stack could not be checked';
const UNEXPECTED = 'docker inspect printed an unexpected value for the shared database container';
// shared-apply is a lifecycle command: when the change is still there, the start-time check by name after it sees it too,
// and its STOP is the refusal printed (review 1105Z I-a). The behaviour is what these tests check first.
const AFTER_APPLY = /^mb1-replay refused: STOP: the shared 55321 database container changed after shared-apply /;
const UNKNOWN = `what 55321 applied is unknown, so shared-apply never runs again: ${INCIDENT}`;
const stopLine = (where, why) => new RegExp(`^# STOP: ${where}: ${why}; ${UNKNOWN}$`, 'm');
const rechecked = (when) => new RegExp(`^# rechecked ${escapeRe(when)}: the database container the binding proved, inspected by its ID, still has the start time pinned at prepare$`, 'm');
const statePath = (env) => env.at(`private${DIR}/${STATE}`);
const reset = (env) => Object.assign(env.world, { onStatus: null, onList: null, onBinding: null, onMigrate: null, onRead: null, shared: STARTED, provenRuns: [], bindingRuns: [], migrateResult: null });
/** Answers the proven ID's inspects in order, as provenRuns does, and runs `effect` while the `at`-th one runs. */
function provenWith(answers, at, effect) {
  let n = 0;
  return { get length() { return answers.length - n; }, shift() { n += 1; if (n === at) effect(); return answers[n - 1]; } };
}

test('SF-7d L1: a restart or a stop during the staged status, the route proof or the second binding read refuses shared-apply at the proven ID right after that read: no attempt, no migration up, state.json byte-equal', async (t) => {
  const env = setup(t);
  await atSharedApply(env);
  const during = [
    ['the staged status call', (change) => { env.world.onStatus = change; }],
    ["the route proof's migration list", (change) => { env.world.onList = change; }],
    ['the second binding read', (change) => { let seen = 0; env.world.onBinding = (w) => { seen += 1; if (seen === 2) change(w); }; }],
  ];
  // The same ID and binding throughout. Live Docker publishes no port for a stopped container, so there the second binding
  // read would refuse a stop first; this fixture holds the binding, so the proven ID's inspect is what is tested.
  const changes = [
    ['a restart (a new start time)', (w) => { w.shared = RESTARTED; }],
    ['a stop (not running)', (w) => { w.shared = STOPPED; }],
  ];
  for (const [where, arm] of during) {
    for (const [what, change] of changes) {
      const label = `${what} during ${where}`;
      const bytes = readFileSync(statePath(env));
      arm(change);
      const result = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM);
      reset(env);
      // Behaviour first: the proven ID was inspected right after the second binding read, and no migration up ran.
      assert.deepEqual(result.kinds, [...TO_UP, 'inspect'], `${label}: shared-apply went on past the second binding read`);
      assert.deepEqual(env.world.calls.at(-2).args, proven(PROVEN), label);
      assert.deepEqual(readFileSync(statePath(env)), bytes, `${label}: state.json changed (an attempt, or sharedApplied)`);
      assert.equal(readState(env).sharedApplyAttempted, undefined, label);
      refuses(result, AFTER_APPLY);
    }
  }
});

test("SF-7d L1: the proven ID's inspect before migration up refuses on its own, before the final guards, the attempt and the spawn; with nothing changed it is the last child before them", async (t) => {
  const env = setup(t);
  await atSharedApply(env);
  // The ID's first inspect, right after the first binding (SF-7c), answers the pin; the second gives `answer`. The start-time
  // check by name after shared-apply holds, so the refusal printed is the proven ID's own.
  for (const [label, answer, why] of [
    ['another start time, once (a transient switch)', ok(`${OTHER}\n`), `${unpinned(OTHER)}; apply nothing`],
    ['no such container (replaced after the second binding read)', ABSENT, `${unpinned('absent')}; apply nothing`],
    ['a timeout', TIMEOUT, UNFINISHED],
    ['an unexpected value', ok('running\n'), UNEXPECTED],
  ]) {
    const bytes = readFileSync(statePath(env));
    env.world.provenRuns = [ok(`${STARTED}\n`), answer];
    const result = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM);
    const left = env.world.provenRuns.length;
    reset(env);
    assert.equal(left, 0, `${label}: the proven ID was not inspected again before migration up`);
    assert.deepEqual(result.kinds, [...TO_UP, 'inspect'], label);
    assert.deepEqual(readFileSync(statePath(env)), bytes, `${label}: state.json changed (an attempt, or sharedApplied)`);
    refuses(result, new RegExp(`^mb1-replay refused: ${why}\\n$`));
  }

  // The final guards run after the ID's inspect, with no await before the attempt: a staged migration edited while the ID is
  // inspected is still refused, and no attempt is recorded.
  const victim = join(env.at(`private${DIR}`), 'shared-apply', 'supabase', 'migrations', BASE[3]);
  const original = readFileSync(victim);
  const bytes = readFileSync(statePath(env));
  env.world.provenRuns = provenWith([ok(`${STARTED}\n`), ok(`${STARTED}\n`)], 2, () => writeFileSync(victim, 'select 1;\n'));
  const edited = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM);
  const left = env.world.provenRuns.length;
  reset(env);
  writeFileSync(victim, original);
  assert.equal(left, 0, 'the proven ID was not inspected again before migration up');
  assert.deepEqual(edited.kinds, [...TO_UP, 'inspect']);
  assert.deepEqual(readFileSync(statePath(env)), bytes, 'an attempt was recorded');
  refuses(edited, new RegExp(`^mb1-replay refused: shared-apply/supabase/migrations/${escapeRe(BASE[3])} no longer matches its sha256 in manifest\\.json; apply nothing\\n$`));

  // Nothing changed: the ID's inspect right after the second binding read is the last child; then the guards, the attempt (on
  // disk when migration up starts) and the spawn. After migration up the ID is inspected twice more (L2).
  const order = [];
  env.world.onMigrate = (w, workdir) => order.push(`up ${workdir === STAGING ? 'staged' : workdir}:${readState(env).sharedApplyAttempted ? 'attempted' : 'none'}`);
  const apply = passes(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), 'shared-apply');
  reset(env);
  assert.deepEqual(apply.kinds, [...TO_UP, 'migration up', 'binding', 'inspect-id', 'psql-read', 'inspect-id', 'inspect']);
  const calls = env.world.calls.slice(-apply.kinds.length);
  for (const at of [4, 9, 12, 14]) {
    assert.deepEqual(calls[at].args, proven(PROVEN), `call ${at}`);
    assert.equal(calls[at].options.timeoutMs, 120_000, `call ${at}`);
  }
  assert.deepEqual(order, ['up staged:attempted']);
  const lines = apply.out.split('\n');
  const sequence = [
    rechecked('before migration up'), /^# rechecked immediately before migration up: no SUPABASE_\* variable/, /^# apply attempt recorded in state\.json before migration up starts/,
    rechecked('after migration up'), /^# snapshot 55321-after: /, rechecked('after the 55321-after snapshot'), /^# 55321 after migration up: equal to the replay's after snapshot/,
  ];
  const positions = sequence.map((pattern) => lines.findIndex((line) => pattern.test(line)));
  assert.ok(positions.every((position) => position >= 0), `a line is missing: ${positions.join(', ')}`);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), 'the lines are out of order');
  const state = readState(env);
  assert.equal(state.sharedApplied, true);
  assert.ok(state.snapshots['55321-after']);
});

test('SF-7d L2: a restart, a stop or a failed inspect of the proven ID during migration up is a STOP before the after snapshot: the attempt stays recorded, and no sharedApplied or 55321-after is written', async (t) => {
  const env = setup(t);
  await atSharedApply(env);
  const ready = readFileSync(statePath(env));
  // [label, the change while migration up runs, why, whether it is still there when the start-time check by name runs]
  const cases = [
    ['a restart (the same ID and binding, a new start time)', (w) => { w.shared = RESTARTED; }, unpinned(RESTARTED), true],
    ['a stop (the same ID and start time, not running)', (w) => { w.shared = STOPPED; }, unpinned(STOPPED), true],
    ['a restart, and migration up exited 1', (w) => Object.assign(w, { shared: RESTARTED, migrateResult: failed('Error: connection reset by peer') }), unpinned(RESTARTED), true],
    ['another start time, once (a transient switch)', (w) => { w.provenRuns = [ok(`${OTHER}\n`)]; }, unpinned(OTHER), false],
    ['no such container under the proven ID', (w) => { w.provenRuns = [ABSENT]; }, unpinned('absent'), false],
    ['a timeout', (w) => { w.provenRuns = [TIMEOUT]; }, UNFINISHED, false],
  ];
  for (const [index, [label, change, why, lasting]] of cases.entries()) {
    writeFileSync(statePath(env), ready); // as after the coordinator's review: no attempt (test harness only)
    env.world.snapshot = SNAPSHOTS.before;
    env.world.onMigrate = (w, workdir) => { if (workdir === STAGING) change(w); };
    const evidence = `phase2-sf7d-up-${index}`;
    const result = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM, '--evidence', evidence);
    const left = env.world.provenRuns.length;
    reset(env);
    const state = readState(env);
    // Behaviour first: a run that ends in a STOP never records a verified apply.
    assert.equal(result.code, 1, label);
    assert.equal(state.sharedApplied, false, `${label}: a run that ended in a STOP recorded sharedApplied`);
    assert.equal(state.snapshots['55321-after'], undefined, `${label}: a 55321-after snapshot was recorded`);
    assert.deepEqual(state.sharedApplyAttempted, { at: env.clock, workdir: 'shared-apply' }, label);
    assert.equal(left, 0, `${label}: the proven ID was not inspected after migration up`);
    assert.deepEqual(result.kinds, [...TO_UP, 'migration up', 'binding', 'inspect-id', 'inspect'], `${label}: the after snapshot ran`);
    const line = stopLine('after migration up', why);
    assert.equal(result.out.split('\n').filter((text) => text.startsWith('# STOP: ')).length, 1, `${label}: ${result.out}`);
    assert.match(result.out, line, label);
    assert.match(readFileSync(env.at(`evidence/${evidence}.txt`), 'utf8'), line, label);
    assert.match(result.out, /^# rechecked after migration up: Docker's binding of the shared stack is unchanged$/m, label);
    assert.doesNotMatch(result.out, /^# 55321 after migration up: equal/m, label);
    if (lasting) refuses(result, AFTER_APPLY);
    else assert.equal(result.err, '', `${label}: a STOP line, not a refusal`);
    // No outcome allows another apply.
    assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), ATTEMPTED).kinds, ['inspect'], label);
  }
});

test('SF-7d L2: a restart during the after snapshot is a STOP before the verified state is returned to be written: no sharedApplied, no 55321-after', async (t) => {
  const env = setup(t);
  await atSharedApply(env);
  const ready = readFileSync(statePath(env));
  for (const [index, [label, change, why, lasting]] of [
    ['a restart (the same ID, a new start time)', (w) => { w.shared = RESTARTED; }, unpinned(RESTARTED), true],
    ['another start time, once (a transient switch)', (w) => { w.provenRuns = [ok(`${OTHER}\n`)]; }, unpinned(OTHER), false],
  ].entries()) {
    writeFileSync(statePath(env), ready); // as after the coordinator's review: no attempt (test harness only)
    env.world.snapshot = SNAPSHOTS.before;
    // The after snapshot is the first read after migration up: the change lands while it runs, after the ID's first check.
    env.world.onMigrate = (w, workdir) => { if (workdir === STAGING) w.onRead = (r) => { r.onRead = null; change(r); }; };
    const evidence = `phase2-sf7d-after-${index}`;
    const result = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM, '--evidence', evidence);
    const left = env.world.provenRuns.length;
    reset(env);
    const state = readState(env);
    assert.equal(result.code, 1, label);
    assert.equal(state.sharedApplied, false, `${label}: a run that ended in a STOP recorded sharedApplied`);
    assert.equal(state.snapshots['55321-after'], undefined, `${label}: a 55321-after snapshot was recorded`);
    assert.deepEqual(state.sharedApplyAttempted, { at: env.clock, workdir: 'shared-apply' }, label);
    assert.equal(left, 0, `${label}: the proven ID was not inspected after the after snapshot`);
    assert.deepEqual(result.kinds, [...TO_UP, 'migration up', 'binding', 'inspect-id', 'psql-read', 'inspect-id', 'inspect'], label);
    const line = stopLine('after the 55321-after snapshot', why);
    assert.equal(result.out.split('\n').filter((text) => text.startsWith('# STOP: ')).length, 1, `${label}: ${result.out}`);
    assert.match(result.out, line, label);
    assert.match(readFileSync(env.at(`evidence/${evidence}.txt`), 'utf8'), line, label);
    assert.match(result.out, rechecked('after migration up'), `${label}: the check before the after snapshot held`);
    assert.doesNotMatch(result.out, /^# 55321 after migration up: equal/m, label);
    if (lasting) refuses(result, AFTER_APPLY);
    else assert.equal(result.err, '', `${label}: a STOP line, not a refusal`);
    assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), ATTEMPTED).kinds, ['inspect'], label);
  }
});
