// MB-1 replay runner tests: SF-7b, the four lows of review 2026-10-27T0905Z, test-first, with fixtures only (no live Docker
// shape was read). L1: a 55321 command refuses a DOCKER_HOST that is not a unix:///<path> socket, before any child and naming
// no value; replay commands, stop and teardown are unchanged. L2: both Docker inspects say --type container, and every 55321
// snapshot execs the database container by the ID the binding proved, so a container replaced in between is never read.
// L3: a staged migration list that printed a valid route table but did not exit 0 refuses. L4: no STOP advises a runner read.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { test } from 'node:test';
import { BINDING_FORMAT, routeProof } from './mb1-replay-binding.mjs';
import { CANDIDATE } from './mb1-replay-evidence.mjs';
import { SHARED, STATE } from './mb1-replay-target.mjs';
import {
  atGreen, atSharedApply, ATTEMPTED, bindingOutput, CLEAN_ENV, cliTable, CONFIRM, CONTAINER, dbIdOf, DIR, escapeRe, INCIDENT, kind, LOCK, MIGRATIONS, ok, passes,
  readState, refuses, run, setup, SHARED_CONFIRM, SNAPSHOTS, STAGING, STARTED, toSharedApply, version,
} from './mb1-replay-test-harness.mjs';

// SF-7c (review 2026-10-27T0935Z L1): right after the first binding, the proven database ID's start time ('inspect-id').
const BEFORE_UP = ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'binding'];
// SF-7d (review 2026-10-27T1105Z L1, L2): the proven ID's start time again right after the second binding read, the last child
// before the final guards and the attempt; after migration up, after the binding read and again after the after snapshot.
const TO_UP = [...BEFORE_UP, 'inspect-id'];
const VERIFIED = [...TO_UP, 'migration up', 'binding', 'inspect-id', 'psql-read', 'inspect-id', 'inspect'];
const PROVEN = dbIdOf(bindingOutput());
const execTarget = (call) => call.args[call.args.indexOf('psql') - 1];
const noAttempt = (env, label) => assert.equal(readState(env).sharedApplyAttempted, undefined, `${label}: an attempt was recorded`);
const FINGERPRINT = '{{.State.Running}} {{.State.StartedAt}}';

test('SF-7b L3: a staged migration list that printed a valid route table but did not exit 0 refuses before any attempt; the exit decides', async (t) => {
  const env = setup(t);
  await atSharedApply(env);
  const table = cliTable(MIGRATIONS.map((file) => ({ local: version(file), remote: file === CANDIDATE ? '' : version(file) })));
  const stderr = 'Error: failed to read the migration history';
  // Not vacuous: on its own, this output is a valid route proof (16 local, the 15 base remote, the candidate local only).
  assert.equal(routeProof(`${table}\n${stderr}`, MIGRATIONS).ok, true);
  for (const [label, list, why] of [
    ['exit 1', { status: 1, stdout: table, stderr }, 'failed (exit 1)'],
    ['exit 2, nothing on stderr', { status: 2, stdout: table, stderr: '' }, 'failed (exit 2)'],
    ['no exit status, the table kept', { status: null, stdout: table, stderr: '', error: 'ETIMEDOUT' }, 'did not finish (ETIMEDOUT)'],
  ]) {
    env.world.stagedList = list;
    const result = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM);
    env.world.stagedList = null;
    // Behaviour first: no second binding read, no attempt and no migration up. Then the exact refusal.
    assert.deepEqual(result.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'inspect'], label);
    noAttempt(env, label);
    refuses(result, new RegExp(`^mb1-replay refused: migration list for the staged shared-apply input ${escapeRe(why)}; the route to 55321 is not proved; apply nothing\\n$`));
  }
  // The control: the same table at exit 0 is the route proof, and the apply goes on to its exit 0.
  env.world.stagedList = ok(table);
  const apply = passes(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), 'the same table at exit 0');
  assert.deepEqual(apply.kinds, VERIFIED);
  assert.equal(readState(env).sharedApplied, true);
});

test('SF-7b L2: both Docker inspects say --type container, and every 55321 snapshot execs the database container by the ID the binding proved', async (t) => {
  const env = setup(t);
  await atGreen(env);
  await toSharedApply(env);
  const from = env.world.calls.length;
  env.world.snapshot = SNAPSHOTS.before;
  passes(await run(env, 'shared-snapshot', DIR, 'before'), 'shared-snapshot before');
  passes(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), 'shared-apply');
  passes(await run(env, 'shared-snapshot', DIR, 'after'), 'shared-snapshot after');
  const shared = env.world.calls.slice(from);
  const reads = shared.filter((call) => kind(call) === 'psql-read');
  assert.equal(reads.length, 4, 'shared-snapshot before, the fresh snapshot, the after snapshot and shared-snapshot after');
  assert.match(PROVEN, /^[0-9a-f]{64}$/);
  for (const read of reads) assert.equal(execTarget(read), PROVEN);
  assert.ok(!shared.some(({ command, args }) => command === 'docker' && args[0] === 'exec' && args.includes(SHARED.container)), 'a 55321 exec named the container');
  const inspects = env.world.calls.filter(({ command, args }) => command === 'docker' && args[0] === 'inspect');
  for (const { args } of inspects) {
    assert.deepEqual(args.slice(0, 4), ['inspect', '--type', 'container', '--format'], args.join(' '));
    assert.ok([BINDING_FORMAT, FINGERPRINT].includes(args[4]), args.join(' '));
  }
  assert.ok(inspects.some(({ args }) => args[4] === BINDING_FORMAT) && inspects.some(({ args }) => args[4] === FINGERPRINT));
  // The replay's own reads keep its container's name: the mirror is held (SF-7).
  const replay = env.world.calls.slice(0, from).filter((call) => kind(call) === 'psql-read');
  assert.ok(replay.length > 0 && replay.every((call) => execTarget(call) === CONTAINER));
});

test('SF-7b L2: a shared container replaced between the binding read and the exec is never read: a snapshot fails, shared-apply applies nothing, and after migration up it is a STOP', async (t) => {
  // The binding read answers with the container proved so far, and so does the inspect of its ID that follows it (SF-7c);
  // by the exec, Docker has a new one under the same name. After migration up the binding read is followed by an inspect of
  // the ID too (SF-7d L2); it answers for the proved container, so the replacement lands after it and the exec by ID is what
  // is tested here. The ID's own STOP, when it is already replaced at that inspect ("absent"), is in mb1-replay-sf7d.test.mjs.
  const replaceAfterRead = (w, proven = [ok(`${STARTED}\n`)]) => Object.assign(w, { bindingRuns: [ok(bindingOutput())], provenRuns: proven, binding: bindingOutput({ seed: 'replaced' }) });
  const env = setup(t);
  await atGreen(env);
  await toSharedApply(env);
  env.world.snapshot = SNAPSHOTS.before;
  replaceAfterRead(env.world);
  const snap = await run(env, 'shared-snapshot', DIR, 'before');
  assert.equal(readState(env).snapshots['55321-before'], undefined, 'the replaced container was read as the reference');
  assert.deepEqual(snap.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read']);
  assert.equal(execTarget(env.world.calls.at(-1)), PROVEN);
  assert.equal(snap.code, 1);
  assert.match(snap.out, /^# snapshot 55321-before FAILED$/m);
  assert.match(snap.out, /^# 55321 does not match the replay project: STOP and apply nothing$/m);

  env.world.binding = bindingOutput(); // the proved container is back: take the reference, then replace it before the fresh snapshot
  passes(await run(env, 'shared-snapshot', DIR, 'before'), 'shared-snapshot before');
  replaceAfterRead(env.world);
  const apply = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM);
  assert.deepEqual(apply.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'inspect'], 'the apply went on past the fresh snapshot');
  noAttempt(env, 'replaced before the fresh snapshot');
  assert.equal(execTarget(env.world.calls.at(-2)), PROVEN);
  assert.equal(apply.code, 1);
  assert.match(apply.out, /^# 55321 changed since its before snapshot, or does not match the replay: STOP and apply nothing$/m);

  // After migration up: the binding read again and the ID's inspect are the proved one, then the container is replaced before
  // the after snapshot.
  const late = setup(t);
  await atSharedApply(late);
  late.world.onMigrate = (w, workdir) => { if (workdir === STAGING) replaceAfterRead(w); };
  const stopped = await run(late, 'shared-apply', DIR, ...SHARED_CONFIRM, '--evidence', 'phase2-sf7b-replaced');
  late.world.onMigrate = null;
  const state = readState(late);
  assert.equal(state.sharedApplied, false, 'the replaced container was read as the after snapshot');
  assert.equal(state.snapshots['55321-after'], undefined);
  assert.deepEqual(state.sharedApplyAttempted, { at: late.clock, workdir: 'shared-apply' });
  assert.deepEqual(stopped.kinds, [...TO_UP, 'migration up', 'binding', 'inspect-id', 'psql-read', 'inspect']);
  assert.deepEqual(late.world.provenRuns, [], "the ID's inspect after migration up did not run");
  assert.equal(execTarget(late.world.calls.at(-2)), PROVEN);
  assert.equal(stopped.code, 1);
  assert.equal(stopped.err, '', 'a STOP line, not a refusal');
  const line = new RegExp(`^# STOP: 55321 does not equal the replay's after snapshot after migration up; what 55321 applied is unknown, so shared-apply never runs again: ${INCIDENT}$`, 'm');
  assert.match(stopped.out, line);
  assert.match(readFileSync(late.at('evidence/phase2-sf7b-replaced.txt'), 'utf8'), line);
});

test('SF-7b L1: a 55321 command refuses a DOCKER_HOST that is not a unix:// socket path before any child, naming no value; replay commands, stop and teardown are unchanged', async (t) => {
  const SENTINEL = 'fixture-docker-host-must-never-print';
  const REFUSAL = /^mb1-replay refused: DOCKER_HOST is set, but not to a unix:\/\/\/<path> socket, so Docker's reads could describe another daemon than the one 127\.0\.0\.1:55322 reaches; nothing runs on 55321 \(the value is not printed\)\n$/;
  const env = setup(t);
  const host = (value) => { env.deps = { env: { ...CLEAN_ENV, DOCKER_HOST: value } }; };
  const tcp = `tcp://${SENTINEL}:2376`;
  host(tcp);
  // Every replay command, stop and a fresh start included, runs as before under a tcp:// DOCKER_HOST, which its children get.
  await atGreen(env);
  await toSharedApply(env);
  assert.equal(env.world.calls.at(-1).options.env.DOCKER_HOST, tcp);
  const statePath = env.at(`private${DIR}/${STATE}`);
  const evidence = env.at('evidence/phase2-sf7b-host.txt');
  for (const [label, value] of [
    ['tcp', tcp], ['ssh', `ssh://fixture-user@${SENTINEL}`], ['empty', ''], ['unix:// with no path', 'unix://'], ['npipe', `npipe:////./pipe/${SENTINEL}`],
    ['an upper-case scheme', `UNIX:///var/run/${SENTINEL}.sock`], ['a leading space', ` unix:///var/run/${SENTINEL}.sock`],
  ]) {
    host(value);
    for (const argv of [['shared-snapshot', DIR, 'before'], ['shared-apply', DIR, ...SHARED_CONFIRM], ['shared-suite', DIR]]) {
      const bytes = readFileSync(statePath);
      const result = await run(env, ...argv, '--evidence', 'phase2-sf7b-host');
      assert.deepEqual(result.kinds, [], `${label}, ${argv[0]}: a child ran`);
      refuses(result, REFUSAL);
      const saved = readFileSync(evidence, 'utf8');
      unlinkSync(evidence);
      for (const text of [result.out, result.err, saved]) assert.ok(!text.includes(SENTINEL), `${label}, ${argv[0]}: the value was printed`);
      assert.deepEqual(readFileSync(statePath), bytes, `${label}, ${argv[0]}: state.json changed`);
      assert.equal(existsSync(env.at(`private${DIR}/${LOCK}`)), false, `${label}, ${argv[0]}: the lock was kept`);
    }
  }
  // A unix:///<path> socket, or no DOCKER_HOST at all, lets them run as before.
  host('unix:///var/run/docker.sock');
  env.world.snapshot = SNAPSHOTS.before;
  assert.deepEqual(passes(await run(env, 'shared-snapshot', DIR, 'before'), 'unix://').kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read']);
  assert.equal(env.world.calls.at(-1).options.env.DOCKER_HOST, 'unix:///var/run/docker.sock');
  env.deps = {};
  passes(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), 'no DOCKER_HOST');
  // And retain, stop and teardown run as before under a tcp:// DOCKER_HOST.
  host(tcp);
  passes(await run(env, 'retain', DIR), 'retain');
  assert.deepEqual(passes(await run(env, 'teardown', DIR, ...CONFIRM), 'teardown').kinds, ['inspect', 'names', 'status', 'names', 'stop', 'names', 'inspect']);
});

test("SF-7b L4: a STOP after migration up and the refusals after it point to SF-2's manual read-only path, never to a runner read a changed container refuses", async (t) => {
  const env = setup(t);
  await atSharedApply(env);
  // Docker recreated the shared stack while migration up ran: a new ID under the same names, and a new start time.
  env.world.onMigrate = (w, workdir) => { if (workdir === STAGING) Object.assign(w, { binding: bindingOutput({ seed: 'recreated' }), shared: 'true 2026-10-27T09:05:00.000000000Z' }); };
  const result = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM);
  env.world.onMigrate = null;
  assert.equal(result.code, 1);
  assert.ok(readState(env).sharedApplyAttempted);
  const stops = result.out.split('\n').filter((line) => line.startsWith('# STOP: '));
  assert.equal(stops.length, 1, result.out);
  assert.match(stops[0], new RegExp(`^# STOP: after migration up: Docker's binding of the shared stack changed while migration up ran \\(a container id, the project label or a published port\\); what 55321 applied is unknown, so shared-apply never runs again: ${INCIDENT}$`));
  assert.doesNotMatch(stops[0], /shared-snapshot/);
  assert.match(result.err, /^mb1-replay refused: STOP: the shared 55321 database container changed after shared-apply /);
  // The read the old text advised is refused before any SQL, as is every 55321 command: the start time changed.
  for (const argv of [['shared-snapshot', DIR, 'after'], ['shared-apply', DIR, ...SHARED_CONFIRM], ['shared-suite', DIR]]) {
    assert.deepEqual(refuses(await run(env, ...argv), new RegExp(`^mb1-replay refused: STOP: the shared 55321 database container changed before ${argv[0]} `)).kinds, ['inspect'], argv[0]);
  }
  // Had the container kept its start time, the next shared-apply's refusal points to the same path, not to a runner read.
  env.world.shared = STARTED;
  assert.doesNotMatch(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), ATTEMPTED).err, /shared-snapshot/);
});
