// MB-1 replay runner tests: SF-7e, review 2026-10-27T1132Z L1 (SF-7d's review), test-first, with fixtures only (no live
// Docker read). dispatch wrote a verified shared-apply's state (sharedApplied and 55321-after) and only then ran, in finally,
// the start-time check by name. A restart, a stop, another start time read once or a timeout there ended the run in a STOP
// with the verified apply already in state.json; in the one-off cases the next command's checks passed, so shared-suite was
// no longer blocked. Now a verified shared-apply is written only after that check holds, and the check runs exactly once.
// Every other shared-apply outcome, and every other lifecycle command, still writes its state first (a STOP's stopRecorded,
// stop's generation) and then runs the check in finally.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { SHARED, STATE } from './mb1-replay-target.mjs';
import {
  atRed, atSharedApply, ATTEMPTED, CLEAN_ENV, CONFIRM, DIR, escapeRe, failed, kind, LOGS, ok, passes, readState, refuses, run, setup, SHARED_CONFIRM, STARTED,
} from './mb1-replay-test-harness.mjs';

/** shared-apply up to and including the proven ID's inspect right after the second binding read (SF-7d L1). */
const TO_UP = ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'binding', 'inspect-id'];
/** From migration up: the binding, the proven ID, the after snapshot, the ID again (SF-7d L2), then the check by name. */
const AFTER_UP = ['migration up', 'binding', 'inspect-id', 'psql-read', 'inspect-id', 'inspect'];
const WRITE = `write ${STATE}`;
const RESTARTED = 'true 2026-10-27T11:32:00.000000000Z';
const OTHER = 'true 2026-10-20T08:00:00.000000000Z';
const STOPPED = STARTED.replace(/^true/, 'false');
const TIMEOUT = Object.freeze({ status: null, stdout: '', stderr: '', error: 'ETIMEDOUT' });
const changed = (when, now) => new RegExp(`^mb1-replay refused: STOP: the shared 55321 database container changed ${escapeRe(when)} \\(recorded "${escapeRe(STARTED)}", now "${escapeRe(now)}"\\); nothing more runs until the coordinator reviews it\\n$`);
const UNFINISHED = new RegExp(`^mb1-replay refused: docker inspect of ${escapeRe(SHARED.container)} did not finish \\(ETIMEDOUT\\); the shared stack could not be checked\\n$`);
const NEEDS_APPLY = /^mb1-replay refused: shared-suite needs shared-apply and the 55321-after snapshot first\n$/;
const SUPABASE_VARIABLE = 'the environment sets SUPABASE_DB_PORT; a SUPABASE_\\* variable can override the replay\'s config\\.toml';
/** What each write of state.json recorded: [sharedApplied, a 55321-after snapshot]. */
const verified = (states) => states.map((state) => [state.sharedApplied, Boolean(state.snapshots['55321-after'])]);
/** A function that runs `effect` on its `n`-th call only. */
const nth = (n, effect) => {
  let calls = 0;
  return (w) => { calls += 1; if (calls === n) effect(w); };
};

/**
 * For the next run only: an executor and a file system that log, in order, each child process (by kind) and each write of
 * state.json, and keep the states written. `after[kind]` runs once a child of that kind has answered: a change while it ran.
 */
function logged(env, { after = {}, runnerEnv = { ...CLEAN_ENV } } = {}) {
  const events = [];
  const writes = [];
  env.deps = {
    env: runnerEnv,
    exec: (command, args, options) => {
      const answer = env.world.exec(command, args, options);
      const name = kind({ command, args });
      events.push(name);
      after[name]?.(env.world);
      return answer;
    },
    fs: {
      ...env.fs,
      writeFileSync: (path, data, options) => {
        if (String(path).endsWith(`/${STATE}`)) { events.push(WRITE); writes.push(JSON.parse(String(data))); }
        return env.fs.writeFileSync(path, data, options);
      },
    },
  };
  return { events, writes };
}
async function runLogged(env, options, ...argv) {
  const log = logged(env, options);
  try { return { ...(await run(env, ...argv)), ...log }; } finally { delete env.deps; }
}

test('SF-7e L1: a change at the start-time check by name after a verified shared-apply is a STOP before state.json is written: the attempt stays, no sharedApplied or 55321-after, and the next shared-apply and shared-suite are refused', async (t) => {
  // [label, the change once the last proven-ID inspect has answered, what the check by name then reads (null: unfinished), lasting]
  const cases = [
    ['a restart (the same ID, a new start time)', (w) => { w.shared = RESTARTED; }, RESTARTED, true],
    ['a stop (the same ID and start time, not running)', (w) => { w.shared = STOPPED; }, STOPPED, true],
    ['another start time, read once (another Docker daemon answered)', (w) => { w.inspect = ok(`${OTHER}\n`); }, OTHER, false],
    ['a timeout of the check by name, once', (w) => { w.inspect = TIMEOUT; }, null, false],
  ];
  for (const [index, [label, change, now, lasting]] of cases.entries()) {
    await t.test(label, async (st) => {
      const env = setup(st);
      await atSharedApply(env);
      // The fourth proven-ID inspect is the last, after the after snapshot. An override of the check by name answers once.
      const after = { 'inspect-id': nth(4, change), inspect: (w) => { delete w.inspect; } };
      const evidence = `phase2-sf7e-name-${index}`;
      const result = await runLogged(env, { after }, 'shared-apply', DIR, ...SHARED_CONFIRM, '--evidence', evidence);
      const state = readState(env);
      // Behaviour first: the run ends in the STOP, and state.json holds the attempt only.
      assert.equal(result.code, 1, label);
      assert.equal(state.sharedApplied, false, `${label}: a run that ended in the STOP after shared-apply recorded sharedApplied`);
      assert.equal(state.snapshots['55321-after'], undefined, `${label}: a 55321-after snapshot was recorded`);
      assert.deepEqual(state.sharedApplyAttempted, { at: env.clock, workdir: 'shared-apply' }, label);
      // One check by name after the apply, after the last ID inspect; the attempt is the only write.
      assert.deepEqual(result.events, [...TO_UP, WRITE, ...AFTER_UP], `${label}: the order of the checks and the writes`);
      assert.deepEqual(verified(result.writes), [[false, false]], label);
      assert.deepEqual(result.kinds, [...TO_UP, ...AFTER_UP], label);
      refuses(result, now ? changed('after shared-apply', now) : UNFINISHED);
      // Every check inside shared-apply held: the STOP is the entry's check by name, not one of shared-apply's own.
      assert.match(result.out, /^# rechecked after the 55321-after snapshot: /m, label);
      assert.doesNotMatch(result.out, /^# STOP: /m, label);
      assert.ok(readFileSync(env.at(`evidence/${evidence}.txt`), 'utf8').endsWith(`# mb1-replay shared-apply: exit 1\n${result.err}`), `${label}: the evidence file`);
      // A lasting change refuses every 55321 command at the check by name before it; the harness then restores the pin.
      if (lasting) {
        assert.deepEqual(refuses(await run(env, 'shared-suite', DIR), changed('before shared-suite', now)).kinds, ['inspect'], label);
        env.world.shared = STARTED;
      }
      // With the check by name passing again, state.json alone refuses: no second apply, and no suite on an unverified apply.
      assert.equal(env.world.inspect, undefined, label);
      assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), ATTEMPTED).kinds, ['inspect'], label);
      assert.deepEqual(refuses(await run(env, 'shared-suite', DIR), NEEDS_APPLY).kinds, ['inspect'], label);
    });
  }
});

test('SF-7e control: a verified shared-apply with nothing changed runs the check by name once, after its last proven-ID inspect and before state.json records sharedApplied and 55321-after; shared-suite may then run', async (t) => {
  const env = setup(t);
  await atSharedApply(env);
  const apply = passes(await runLogged(env, {}, 'shared-apply', DIR, ...SHARED_CONFIRM), 'shared-apply');
  assert.deepEqual(apply.events, [...TO_UP, WRITE, ...AFTER_UP, WRITE], 'the verified state was not written after the check by name');
  assert.deepEqual(verified(apply.writes), [[false, false], [true, true]]);
  assert.deepEqual(apply.kinds, [...TO_UP, ...AFTER_UP]);
  const state = readState(env);
  assert.equal(state.sharedApplied, true);
  assert.ok(state.snapshots['55321-after']);
  assert.deepEqual(state.sharedApplyAttempted, { at: env.clock, workdir: 'shared-apply' });
  env.clock += 75_000;
  env.suites.push({ log: LOGS.green, code: 0 });
  passes(await run(env, 'shared-suite', DIR), 'shared-suite on the verified apply');
});

test('SF-7e control: every other lifecycle command and every other shared-apply outcome still writes its state first, then runs the check by name once, in finally', async (t) => {
  await t.test('migrate: a replay STOP and a restart during migration up keep stopRecorded on disk', async (st) => {
    const env = setup(st);
    await atRed(env);
    passes(await run(env, 'add-candidate', DIR), 'add-candidate');
    const runnerEnv = { ...CLEAN_ENV };
    const drift = (w) => { runnerEnv.SUPABASE_DB_PORT = '55322'; w.shared = RESTARTED; };
    const result = await runLogged(env, { runnerEnv, after: { 'migration up': drift } }, 'migrate', DIR);
    refuses(result, changed('after migrate', RESTARTED));
    assert.match(result.out, new RegExp(`^# STOP: after migration up on the replay: ${SUPABASE_VARIABLE}`, 'm'));
    assert.deepEqual(result.events, ['inspect', 'status', 'names', 'migration up', WRITE, 'inspect']);
    assert.deepEqual(readState(env).stopRecorded, { at: env.clock, op: 'migrate' });
    assert.equal(readState(env).candidate, 'added');
  });
  await t.test('diff: a replay STOP and a restart during db diff keep stopRecorded on disk', async (st) => {
    const env = setup(st);
    await atRed(env);
    const runnerEnv = { ...CLEAN_ENV };
    const drift = (w) => { runnerEnv.SUPABASE_DB_PORT = '55322'; w.shared = RESTARTED; };
    const result = await runLogged(env, { runnerEnv, after: { 'db diff': drift } }, 'diff', DIR);
    refuses(result, changed('after diff', RESTARTED));
    assert.match(result.out, new RegExp(`^# STOP: after db diff on the replay: ${SUPABASE_VARIABLE}`, 'm'));
    assert.deepEqual(result.events, ['inspect', 'status', 'names', 'db diff', WRITE, 'inspect']);
    assert.deepEqual(readState(env).stopRecorded, { at: env.clock, op: 'diff' });
  });
  await t.test('stop: a restart during the stop keeps the next generation on disk', async (st) => {
    const env = setup(st);
    await atRed(env);
    assert.equal(readState(env).generation, 1);
    const result = await runLogged(env, { after: { stop: (w) => { w.shared = RESTARTED; } } }, 'stop', DIR, ...CONFIRM);
    refuses(result, changed('after stop', RESTARTED));
    assert.deepEqual(result.events, ['inspect', 'status', 'names', 'stop', 'names', WRITE, 'inspect']);
    assert.equal(readState(env).generation, 2);
  });
  await t.test('shared-apply refused before migration up: no write, and the check by name still runs once, in finally', async (st) => {
    const env = setup(st);
    await atSharedApply(env);
    const bytes = readFileSync(env.at(`private${DIR}/${STATE}`));
    env.world.stagedList = failed('Error: connection refused');
    const result = await runLogged(env, {}, 'shared-apply', DIR, ...SHARED_CONFIRM);
    refuses(result, /^mb1-replay refused: migration list for the staged shared-apply input failed \(exit 1\); the route to 55321 is not proved; apply nothing\n$/);
    assert.deepEqual(result.events, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'inspect']);
    assert.deepEqual(readFileSync(env.at(`private${DIR}/${STATE}`)), bytes);
  });
  await t.test("shared-apply's own STOP after migration up: the attempt state is written, then the check by name runs once, in finally", async (st) => {
    const env = setup(st);
    await atSharedApply(env);
    env.world.migrateResult = failed('Error: connection reset by peer');
    const result = await runLogged(env, {}, 'shared-apply', DIR, ...SHARED_CONFIRM);
    assert.equal(result.code, 1);
    assert.equal(result.err, '', 'a STOP line, not a refusal');
    assert.match(result.out, /^# STOP: migration up exited 1; what 55321 applied is unknown/m);
    assert.deepEqual(result.events, [...TO_UP, WRITE, 'migration up', 'binding', 'inspect-id', WRITE, 'inspect']);
    assert.deepEqual(verified(result.writes), [[false, false], [false, false]]);
    assert.equal(readState(env).sharedApplied, false);
  });
});
