// MB-1 replay runner tests: SF-7c, review 2026-10-27T0935Z L1, test-first, with fixtures only (no live Docker read). The
// start-time check before every command reads the shared database container by its name; two child processes later, the
// binding proves a container ID. Right after the binding, every 55321 command now inspects that ID (--type container) and
// needs the start time pinned at prepare. So a restart, a recreate or a switched Docker context in between refuses before
// any snapshot exec, staged input, attempt record, migration up or suite. The binding's own arguments are unchanged.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { bindingArgs, SHARED_BINDING } from './mb1-replay-binding.mjs';
import { STATE } from './mb1-replay-target.mjs';
import {
  atGreen, atSharedApply, bindingOutput, dbIdOf, DIR, escapeRe, failed, LOGS, ok, passes, readState, refuses, run, setup, SHARED_CONFIRM, SNAPSHOTS, STARTED,
  toSharedApply,
} from './mb1-replay-test-harness.mjs';

const FINGERPRINT = '{{.State.Running}} {{.State.StartedAt}}';
/** The inspect of the proven database ID: the start-time check's arguments, with the ID in place of the name. */
const proven = (id) => ['inspect', '--type', 'container', '--format', FINGERPRINT, id];
/** Every 55321 command up to and including the inspect of the proven ID. */
const TO_ID = ['inspect', 'status', 'names', 'binding', 'inspect-id'];
const unpinned = (now) => new RegExp(`^mb1-replay refused: the database container Docker's binding proved, inspected by its ID, does not have the start time pinned at prepare \\(recorded "${escapeRe(STARTED)}", now "${escapeRe(now)}"\\): it was restarted or recreated, or another Docker daemon answered, after the start-time check; nothing runs on 55321\\n$`);
const UNFINISHED = /^mb1-replay refused: docker inspect of the database container the binding proved did not finish \(ETIMEDOUT\); the shared stack could not be checked\n$/;
const UNEXPECTED = /^mb1-replay refused: docker inspect printed an unexpected value for the shared database container\n$/;
// shared-apply is a lifecycle command: the start-time check by name runs again after it, sees the change, and its STOP is
// the refusal printed. The behaviour (no exec, no staging, no attempt, no migration up) is what these tests check.
const AFTER_APPLY = /^mb1-replay refused: STOP: the shared 55321 database container changed after shared-apply /;
const PINNED_LINE = /^# the database container the binding proved, inspected by its ID, has the start time pinned at prepare$/m;

const RESTARTED = 'true 2026-10-27T09:35:00.000000000Z';
const OTHER_DAEMON = 'true 2026-10-20T08:00:00.000000000Z';
const STOPPED = STARTED.replace(/^true/, 'false');
// Each change lands between the start-time check (the first inspect, by name) and the binding read: during the docker ps
// between them. The other daemon's stack carries the same names, label and ports, with its own IDs and start time.
const CHANGES = [
  ['a restart (the same ID, a new start time)', (w) => { w.shared = RESTARTED; }, RESTARTED],
  ['a recreate (a new ID and start time under the same names)', (w) => Object.assign(w, { binding: bindingOutput({ seed: 'recreated' }), shared: RESTARTED }), RESTARTED],
  ['a Docker context switched to another daemon', (w) => Object.assign(w, { binding: bindingOutput({ seed: 'other-daemon' }), shared: OTHER_DAEMON }), OTHER_DAEMON],
  ['a stop (the same ID and start time, not running)', (w) => { w.shared = STOPPED; }, STOPPED],
];
/** Arms one change for the next docker ps, which in a 55321 command sits between the start-time check and the binding read. */
const between = (env, change) => { env.world.onNames = (w) => { w.onNames = null; change(w); }; };
const restore = (env) => Object.assign(env.world, { onNames: null, shared: STARTED, binding: bindingOutput(), bindingRuns: [], provenRuns: [] });
const statePath = (env) => env.at(`private${DIR}/${STATE}`);
const execTarget = (call) => call.args[call.args.indexOf('psql') - 1];

test('SF-7c L1: a restart, a recreate or a switched Docker context between the start-time check and the binding read refuses shared-snapshot right after the binding, before any exec; nothing is recorded', async (t) => {
  const env = setup(t);
  await atGreen(env);
  await toSharedApply(env);
  env.world.snapshot = SNAPSHOTS.before;
  for (const [label, change, now] of CHANGES) {
    const bytes = readFileSync(statePath(env));
    between(env, change);
    const result = refuses(await run(env, 'shared-snapshot', DIR, 'before'), unpinned(now));
    // Behaviour first: the ID the binding just proved was inspected, and nothing ran after it.
    assert.deepEqual(result.kinds, TO_ID, `${label}: a snapshot exec ran`);
    const inspect = env.world.calls.at(-1);
    assert.deepEqual(inspect.args, proven(dbIdOf(env.world.binding)), label);
    assert.equal(inspect.options.timeoutMs, 120_000, label);
    assert.deepEqual(readFileSync(statePath(env)), bytes, `${label}: state.json changed`);
    assert.equal(readState(env).snapshots['55321-before'], undefined, `${label}: a reference was recorded`);
    restore(env);
  }
  // Nothing changed: the same command inspects the proven ID, finds the pin, and reads the snapshot through that ID.
  const taken = passes(await run(env, 'shared-snapshot', DIR, 'before'), 'shared-snapshot before');
  assert.deepEqual(taken.kinds, [...TO_ID, 'psql-read']);
  const calls = env.world.calls.slice(-taken.kinds.length);
  assert.deepEqual(calls[3].args, bindingArgs(SHARED_BINDING), 'the binding arguments are unchanged');
  assert.deepEqual(calls[4].args, proven(dbIdOf(bindingOutput())));
  assert.equal(execTarget(calls[5]), dbIdOf(bindingOutput()));
  assert.match(taken.out, PINNED_LINE);
  assert.ok(readState(env).snapshots['55321-before']);
});

test('SF-7c L1: the same changes refuse shared-apply right after the binding, with no fresh snapshot, staged input, attempt or migration up; then shared-suite runs no suite', async (t) => {
  const env = setup(t);
  await atSharedApply(env);
  const staged = env.at(`private${DIR}/shared-apply`);
  for (const [label, change] of CHANGES) {
    const bytes = readFileSync(statePath(env));
    between(env, change);
    const result = refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), AFTER_APPLY);
    assert.deepEqual(result.kinds, [...TO_ID, 'inspect'], `${label}: shared-apply went on past the binding`);
    assert.deepEqual(env.world.calls.at(-2).args, proven(dbIdOf(env.world.binding)), label);
    assert.deepEqual(readFileSync(statePath(env)), bytes, `${label}: state.json changed (an attempt, or sharedApplied)`);
    assert.equal(existsSync(staged), false, `${label}: the input was staged`);
    restore(env);
  }
  // A context switched to the other daemon for the binding read and the ID's inspect only, then back: the start-time check
  // after shared-apply holds again, so the refusal printed is the ID's own.
  const other = bindingOutput({ seed: 'other-daemon' });
  Object.assign(env.world, { bindingRuns: [ok(other)], provenRuns: [ok(`${OTHER_DAEMON}\n`)] });
  const bytes = readFileSync(statePath(env));
  const transient = refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), unpinned(OTHER_DAEMON));
  assert.deepEqual(transient.kinds, [...TO_ID, 'inspect']);
  assert.deepEqual(env.world.calls.at(-2).args, proven(dbIdOf(other)));
  assert.deepEqual(readFileSync(statePath(env)), bytes, 'the transient switch recorded an attempt');
  assert.equal(existsSync(staged), false);
  restore(env);

  // Nothing changed: shared-apply applies, with the ID's inspect right after the first binding read. Since SF-7d (review
  // 2026-10-27T1105Z L1, L2) the ID is inspected again right after the second binding read, and twice after migration up.
  const apply = passes(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), 'shared-apply');
  assert.deepEqual(apply.kinds, [...TO_ID, 'psql-read', 'status', 'migration list', 'binding', 'inspect-id', 'migration up', 'binding', 'inspect-id', 'psql-read', 'inspect-id', 'inspect']);
  assert.deepEqual(env.world.calls.slice(-apply.kinds.length)[4].args, proven(dbIdOf(bindingOutput())));
  assert.match(apply.out, PINNED_LINE);
  assert.equal(readState(env).sharedApplied, true);

  // shared-suite: the same changes refuse it right after the binding, and no suite runs.
  env.clock += 75_000;
  for (const [label, change, now] of CHANGES) {
    const kept = readFileSync(statePath(env));
    const suites = env.suiteCalls.length;
    between(env, change);
    assert.deepEqual(refuses(await run(env, 'shared-suite', DIR), unpinned(now)).kinds, TO_ID, label);
    assert.equal(env.suiteCalls.length, suites, `${label}: the suite ran`);
    assert.deepEqual(readFileSync(statePath(env)), kept, `${label}: state.json changed`);
    restore(env);
  }
  const suites = env.suiteCalls.length;
  env.suites.push({ log: LOGS.green, code: 0 });
  assert.deepEqual(passes(await run(env, 'shared-suite', DIR), 'shared-suite').kinds, TO_ID);
  assert.equal(env.suiteCalls.length, suites + 1, 'the shared suite ran once');
});

test('SF-7c L1: an inspect of the proven ID that finds no container, does not finish or prints anything else refuses before any exec', async (t) => {
  const env = setup(t);
  await atGreen(env);
  await toSharedApply(env);
  env.world.snapshot = SNAPSHOTS.before;
  for (const [label, answer, reason] of [
    ['no such container (replaced again after the binding read)', failed(`Error response from daemon: No such container: ${dbIdOf(bindingOutput())}`), unpinned('absent')],
    ['a timeout', { status: null, stdout: '', stderr: '', error: 'ETIMEDOUT' }, UNFINISHED],
    ['an unexpected value', ok('running\n'), UNEXPECTED],
    ['two lines', ok(`${STARTED}\n${STARTED}\n`), UNEXPECTED],
  ]) {
    env.world.provenRuns = [answer];
    const result = refuses(await run(env, 'shared-snapshot', DIR, 'before'), reason);
    assert.deepEqual(env.world.provenRuns, [], `${label}: the proven ID was not inspected`);
    assert.deepEqual(result.kinds, TO_ID, `${label}: a snapshot exec ran`);
    assert.equal(readState(env).snapshots['55321-before'], undefined, label);
  }
});
