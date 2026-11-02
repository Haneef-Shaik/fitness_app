// MB-1 replay runner tests: the rechecks around a CLI, review 2026-10-26T2000Z finding 2 and review 2026-10-26T2305Z finding 4. Moved unchanged from mb1-replay.test.mjs in SF-0
// (docs/plan/runs/MB-1/sf0.md); the shared harness is mb1-replay-test-harness.mjs.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { REPO_ROOT } from './local-stack.mjs';
import { sha256 } from './mb1-replay-evidence.mjs';
import { MANIFEST, STATE } from './mb1-replay-target.mjs';
import { atRed, BASE, CLEAN_ENV, CONFIRM, DIR, escapeRe, ISO, kind, leaks, passes, readState, refuses, run, setup, SHARED_CONFIRM, snapshot } from './mb1-replay-test-harness.mjs';

// Finding 2: start and migrate checked the replay directory, its config and the environment once, then awaited the shared
// container's start time, status and docker ps; the CLI read <replay>/supabase/config.toml seconds later. A [db] port moved to
// 55322 in that window would have sent migrate's candidate to 55321. Now the same checks run again synchronously, with no await
// before the child starts, the manifest's pins must still be the ones read under the lock, and after migrate they run again as
// a STOP that state.json records, so nothing more runs on the replay until the coordinator clears it.
const RECHECKED = (at, files) => new RegExp(`^# rechecked ${at} on the replay: no SUPABASE_\\* variable, no \\.env file, the ${files} file\\(s\\) pinned in manifest\\.json each sha256 equal and unchanged since this command began, nothing else in /tmp/fitlog-mb1-replay-20261026, and its config\\.toml naming fitlog_mb1_replay_20261026 at the eight 564xx ports$`, 'm');
/** The rest of a STOP line after a CLI that may write (migration up; since review 2026-10-26T2305Z finding 4, db diff and db lint). */
const unknownAfter = (label) => `the replay's input changed while the CLI ran, so where ${escapeRe(label)} wrote is unknown \\(55321 included\\): nothing more runs on this replay until the coordinator reviews it \\(state\\.json records the STOP\\)`;
const REPLAY_UNKNOWN = unknownAfter('migration up');
/** The refusal every command gets while state.json records a STOP after `label`. */
const haltedBy = (label) => new RegExp(`^mb1-replay refused: a STOP was recorded at ${ISO}: the replay's input changed while ${escapeRe(label)} ran, so where it wrote is unknown \\(55321 included\\), and nothing runs on this replay until the coordinator reviews it and removes stopRecorded from state\\.json by hand \\(review 2026-10-26T2000Z finding 2\\)\\n$`);
const HALTED = haltedBy('migration up');
/** The eight changes replayDrift makes, in its order: one subtest each (review 2026-10-26T2305Z, informational 5). */
const DRIFT_LABELS = Object.freeze(['the [db] port moved to 55322', 'the [db] port moved to 55322 and re-pinned', 'a migration edited and re-pinned', 'a migration planted', 'a config.json planted', 'a .env file in the replay', 'a .env file in the repository', 'a SUPABASE_* variable']);
/**
 * Runs `body` once per drift case, each as its own subtest on its own sandbox brought to its starting point by `reach`, so a
 * case that fails never hides a later one, and no case depends on an earlier one's undo.
 */
async function eachDrift(t, prefix, reach, body) {
  for (const [index, name] of DRIFT_LABELS.entries()) {
    await t.test(`${prefix}: ${name}`, async (st) => {
      const env = setup(st);
      await reach(env);
      const runnerEnv = { ...CLEAN_ENV };
      env.deps = { env: runnerEnv };
      const [label, change, undo, problem] = replayDrift(env, runnerEnv)[index];
      assert.equal(label, name);
      await body({ env, runnerEnv, label, change, undo, problem });
    });
  }
}
/** How a CLI ended: exit 0 (the world's default output), exit 1, or a timeout, which the executor gives as status null. */
const CLI_ENDS = Object.freeze([
  ['exit 0', undefined],
  ['exit 1', Object.freeze({ status: 1, stdout: '', stderr: 'Error: the command failed partway\n' })],
  ['a timeout', Object.freeze({ status: null, stdout: '', stderr: '', error: 'ETIMEDOUT' })],
]);
const CLI_END_LINE = Object.freeze({ 'exit 1': /^# exit 1$/m, 'a timeout': /^# did not finish \(ETIMEDOUT\)$/m });
async function atStarted(env) {
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
}
async function atCandidateAdded(env) {
  await atRed(env);
  passes(await run(env, 'add-candidate', DIR), 'add-candidate');
}
/** What a same-user writer could change in what the replay CLI reads: [label, change, undo, the problem it gives]. */
function replayDrift(env, runnerEnv) {
  const real = env.at(`private${DIR}`);
  const config = join(real, 'supabase/config.toml');
  const manifestPath = join(real, MANIFEST);
  const kept = { config: readFileSync(config), manifest: readFileSync(manifestPath) };
  const restore = () => { writeFileSync(config, kept.config); writeFileSync(manifestPath, kept.manifest); };
  const repin = (rel, bytes) => {
    writeFileSync(join(real, rel), bytes);
    const manifest = JSON.parse(kept.manifest.toString('utf8'));
    writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, files: { ...manifest.files, [rel]: sha256(bytes) } }, null, 2)}\n`);
  };
  assert.equal(kept.config.toString('utf8').split('\n').filter((line) => line === 'port = 56422').length, 1, 'the replay config sets port = 56422 once, in [db]');
  const moved = Buffer.from(kept.config.toString('utf8').replace('port = 56422', 'port = 55322'));
  const victim = `supabase/migrations/${BASE[3]}`;
  const original = readFileSync(join(real, victim));
  const plant = (path, text) => [() => writeFileSync(path, text), () => unlinkSync(path)];
  const repoRoot = REPO_ROOT.replace(/\/$/, '');
  mkdirSync(env.at(`${repoRoot}/supabase`), { recursive: true });
  return [
    // The reviewer's scenario: the replay's [db] port set to the shared database's.
    ['the [db] port moved to 55322', () => writeFileSync(config, moved), restore, 'supabase/config\\.toml no longer matches its sha256 in manifest\\.json'],
    ['the [db] port moved to 55322 and re-pinned', () => repin('supabase/config.toml', moved), restore, 'config\\.toml db\\.port is 55322, not 56422; config\\.toml still names a shared-stack port'],
    ['a migration edited and re-pinned', () => repin(victim, Buffer.from('select 1;\n')), () => { writeFileSync(join(real, victim), original); restore(); }, `manifest\\.json changed while this command ran \\(${escapeRe(victim)}\\): its pins are not the ones checked under the lock`],
    ['a migration planted', ...plant(join(real, 'supabase/migrations/29991231235959_unpinned.sql'), 'grant all on public.profiles to anon;\n'), `${escapeRe(DIR)} holds entries this runner did not create: supabase/migrations/29991231235959_unpinned\\.sql; nothing runs on it and nothing was removed`],
    ['a config.json planted', ...plant(join(real, 'supabase/config.json'), '{"db":{"port":55322}}\n'), `${escapeRe(DIR)} holds entries this runner did not create: supabase/config\\.json; nothing runs on it and nothing was removed`],
    ['a .env file in the replay', ...plant(join(real, 'supabase/.env'), 'SUPABASE_DB_PORT=55322\n'), `a \\.env file the Supabase CLI may load is present: ${escapeRe(`/private${DIR}/supabase/.env`)}, ${escapeRe(`${DIR}/supabase/.env`)}; nothing runs while one is there \\(names only: no file was read, changed or removed\\)`],
    ['a .env file in the repository', ...plant(env.at(`${repoRoot}/supabase/.env`), 'SUPABASE_DB_PORT=55322\n'), `a \\.env file the Supabase CLI may load is present: ${escapeRe(`${repoRoot}/supabase/.env`)}; nothing runs while one is there \\(names only: no file was read, changed or removed\\)`],
    ['a SUPABASE_* variable', () => { runnerEnv.SUPABASE_DB_PORT = '55322'; }, () => { delete runnerEnv.SUPABASE_DB_PORT; }, "the environment sets SUPABASE_DB_PORT; a SUPABASE_\\* variable can override the replay's config\\.toml \\(project_id included\\), so nothing runs until it is unset \\(names only; no value is printed\\)"],
  ];
}
/** An executor and file system that log, in order, each child process and each read of the replay's config.toml. */
function ordered(env, runnerEnv, events) {
  const config = `${DIR}/supabase/config.toml`;
  return {
    env: runnerEnv,
    exec: (command, args, options) => { events.push(kind({ command, args })); return env.world.exec(command, args, options); },
    fs: { ...env.fs, readFileSync: (path, encoding) => { if (path === config) events.push('read config.toml'); return env.fs.readFileSync(path, encoding); } },
  };
}
/** The events between the last child process before `child` and `child` itself: only reads, no other process. */
function lastCheck(events, child) {
  const at = events.indexOf(child);
  assert.ok(at > 0, `${child} ran`);
  const between = events.slice(events.lastIndexOf('names', at) + 1, at);
  assert.equal(events[events.lastIndexOf('names', at)], 'names');
  assert.ok(between.length > 0 && between.every((event) => event === 'read config.toml'), `between the last docker ps and ${child}: ${between.join(', ') || 'nothing'}`);
}

test('review 2026-10-26T2000Z finding 2: start and migrate recheck the replay directory, its config and the environment immediately before the CLI starts', async (t) => {
  // start: a change during the last check before it (docker ps) starts nothing, and nothing is applied.
  await eachDrift(t, 'before start', async (env) => {
    passes(await run(env, 'prepare', DIR), 'prepare');
    passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  }, async ({ env, label, change, problem }) => {
    env.world.onNames = change;
    const result = refuses(await run(env, 'start', DIR, '--evidence', 'phase2-1-start'), new RegExp(`^mb1-replay refused: ${problem}\\n$`));
    assert.deepEqual(result.kinds, ['inspect', 'names', 'inspect'], `${label}: start ran`);
    assert.deepEqual([env.world.running, env.world.applied], [false, []], `${label}: something started or was applied`);
    assert.deepEqual(leaks(`${result.out}${result.err}${readFileSync(env.at('evidence/phase2-1-start.txt'), 'utf8')}`), [], label);
  });
  await t.test('start with nothing changed', async (st) => {
    const env = setup(st);
    passes(await run(env, 'prepare', DIR), 'prepare');
    passes(await run(env, 'verify-cli', DIR), 'verify-cli');
    const events = [];
    env.deps = ordered(env, { ...CLEAN_ENV }, events);
    const started = passes(await run(env, 'start', DIR), 'start with nothing changed');
    assert.deepEqual(started.kinds, ['inspect', 'names', 'start', 'status', 'names', 'inspect']);
    lastCheck(events, 'start');
    assert.match(started.out, RECHECKED('immediately before start', 23));
  });

  // migrate: the same changes, during the replay's container check, apply nothing and leave the candidate added.
  await eachDrift(t, 'before migrate', atCandidateAdded, async ({ env, label, change, problem }) => {
    const applied = [...env.world.applied];
    env.world.onNames = change;
    const result = refuses(await run(env, 'migrate', DIR, '--evidence', 'phase2-3-migrate'), new RegExp(`^mb1-replay refused: ${problem}\\n$`));
    assert.deepEqual(result.kinds, ['inspect', 'status', 'names', 'inspect'], `${label}: migration up ran`);
    assert.deepEqual(env.world.applied, applied, `${label}: something was applied`);
    assert.equal(readState(env).candidate, 'added', label);
    assert.deepEqual(leaks(`${result.out}${result.err}${readFileSync(env.at('evidence/phase2-3-migrate.txt'), 'utf8')}`), [], label);
  });
  await t.test('migrate with nothing changed', async (st) => {
    const env = setup(st);
    await atCandidateAdded(env);
    const events = [];
    env.deps = ordered(env, { ...CLEAN_ENV }, events);
    const migrated = passes(await run(env, 'migrate', DIR), 'migrate with nothing changed');
    assert.deepEqual(migrated.kinds, ['inspect', 'status', 'names', 'migration up', 'inspect']);
    lastCheck(events, 'migration up');
    assert.match(migrated.out, RECHECKED('immediately before migration up', 24));
    assert.equal(readState(env).candidate, 'applied');
  });
});

// Review 2026-10-26T2305Z finding 2 (phase 1I): every case here used to end migration up with exit 0, so an early return on a
// failed CLI placed before the recheck would have passed them all, and dropped the STOP exactly when a timeout or a partial run
// leaves nobody knowing where the CLI wrote. Each of the eight changes now runs with exit 0, exit 1 and a timeout, each its
// own subtest: the STOP line, the record in state.json, the candidate still added, and every later command refused.
test('review 2026-10-26T2000Z finding 2: after migrate every replay guard runs again; a change is a STOP that state.json records, whatever the CLI exit, and every later command is refused', async (t) => {
  const later = [['check', DIR], ['migrate', DIR], ['snapshot', DIR, 'after'], ['suite', DIR, 'green'], ['stop', DIR, ...CONFIRM], ['teardown', DIR, ...CONFIRM], ['shared-snapshot', DIR, 'before'], ['shared-apply', DIR, ...SHARED_CONFIRM]];
  for (const [end, ending] of CLI_ENDS) {
    await eachDrift(t, `migration up ending with ${end}`, atCandidateAdded, async ({ env, label, change, undo, problem }) => {
      env.world.migrateResult = ending;
      env.world.onMigrate = (w, workdir) => { if (workdir === DIR) change(); };
      const result = await run(env, 'migrate', DIR, '--evidence', 'phase2-3-migrate');
      env.world.onMigrate = null;
      assert.equal(result.code, 1, label);
      assert.equal(result.err, '', `${label}: a STOP line, not a refusal`);
      assert.deepEqual(result.kinds, ['inspect', 'status', 'names', 'migration up', 'inspect'], label);
      if (CLI_END_LINE[end]) assert.match(result.out, CLI_END_LINE[end], `${label}: the CLI's own end is shown`);
      const line = new RegExp(`^# STOP: after migration up on the replay: ${problem}; ${REPLAY_UNKNOWN}$`, 'm');
      assert.match(result.out, line, label);
      assert.match(readFileSync(env.at('evidence/phase2-3-migrate.txt'), 'utf8'), line, label);
      assert.deepEqual(leaks(`${result.out}${result.err}`), [], label);
      assert.doesNotMatch(result.out, /^# rechecked after migration up/m, label);
      const stoppedAt = env.clock;
      const state = readState(env);
      assert.equal(state.candidate, 'added', `${label}: never recorded as applied`);
      assert.deepEqual(state.stopRecorded, { at: stoppedAt, op: 'migrate' }, label);
      // With the change undone and the CLI healthy again, every later command is still refused, before any child process.
      undo();
      env.world.migrateResult = undefined;
      env.clock += 75_000;
      for (const argv of later) assert.deepEqual(refuses(await run(env, ...argv), HALTED).kinds, [], `${label}: ${argv[0]}`);
      assert.deepEqual(readState(env).stopRecorded, { at: stoppedAt, op: 'migrate' }, `${label}: the record is durable`);
      assert.equal(readState(env).candidate, 'added', label);
    });
  }
  // With nothing changed, a failed or timed-out migration up is no STOP: it fails, the candidate stays added, and migrate may
  // run again. Only a change while the CLI ran halts the replay.
  for (const [end, ending] of CLI_ENDS.slice(1)) {
    await t.test(`migration up ending with ${end}, nothing changed`, async (st) => {
      const env = setup(st);
      await atCandidateAdded(env);
      env.world.migrateResult = ending;
      const failedRun = await run(env, 'migrate', DIR);
      assert.equal(failedRun.code, 1);
      assert.equal(failedRun.err, '');
      assert.match(failedRun.out, CLI_END_LINE[end]);
      assert.match(failedRun.out, RECHECKED('after migration up', 24));
      assert.doesNotMatch(failedRun.out, /^# STOP:/m);
      assert.deepEqual([readState(env).candidate, readState(env).stopRecorded], ['added', undefined]);
      env.world.migrateResult = undefined;
      passes(await run(env, 'migrate', DIR), 'migrate again');
      assert.equal(readState(env).candidate, 'applied');
    });
  }
  // Clearing the record by hand (test harness: the coordinator's review), the clean migrate prints both recheck lines.
  await t.test('cleared by hand after a STOP, the clean migrate applies', async (st) => {
    const env = setup(st);
    await atCandidateAdded(env);
    const runnerEnv = { ...CLEAN_ENV };
    env.deps = { env: runnerEnv };
    const [, change, undo] = replayDrift(env, runnerEnv)[0];
    env.world.onMigrate = (w, workdir) => { if (workdir === DIR) change(); };
    assert.equal((await run(env, 'migrate', DIR)).code, 1);
    env.world.onMigrate = null;
    undo();
    const statePath = env.at(`private${DIR}/${STATE}`);
    const { stopRecorded, ...cleared } = readState(env);
    assert.equal(stopRecorded.op, 'migrate');
    writeFileSync(statePath, `${JSON.stringify(cleared, null, 2)}\n`);
    const migrated = passes(await run(env, 'migrate', DIR), 'migrate with nothing changed');
    assert.match(migrated.out, RECHECKED('immediately before migration up', 24));
    assert.match(migrated.out, RECHECKED('after migration up', 24));
    const state = readState(env);
    assert.equal(state.candidate, 'applied');
    assert.equal(state.stopRecorded, undefined);
    passes(await snapshot(env, 'after'), 'snapshot after');
  });
});

/* ---------------------------------------------------------------- Review 2026-10-26T2305Z finding 4 (phase 1I) -------- */

// Finding 4: migrations, diff, lint and stop (and teardown, through the same stop) read the replay's config.toml after the
// dispatch checks only, with awaits in between (the shared container's inspect, the replay's status and docker ps). diff starts
// a shadow database at the config's shadow_port and applies the migrations there; lint creates plpgsql_check in a transaction
// it rolls back. Now each runs the replay guards synchronously as its first statement, with no await before its child, and diff
// and lint run them again after the CLI, whatever its exit, as a STOP that state.json records.
const PRE_SPAWN = Object.freeze([
  // [command, its extra arguments, the CLI call it makes, the calls a refusal before that call leaves]
  ['migrations', [], 'migration list', 'migration list', ['inspect', 'status', 'names']],
  ['diff', [], 'db diff', 'db diff', ['inspect', 'status', 'names', 'inspect']],
  ['lint', [], 'db lint', 'db lint', ['inspect', 'status', 'names']],
  ['stop', CONFIRM, 'stop', 'stop', ['inspect', 'status', 'names', 'inspect']],
]);
test('review 2026-10-26T2305Z finding 4: migrations, diff, lint, stop and teardown recheck the replay directory, its config and the environment immediately before the CLI starts', async (t) => {
  for (const [name, extra, call, at, kinds] of PRE_SPAWN) {
    await eachDrift(t, `before ${name}`, atStarted, async ({ env, label, change, problem }) => {
      const state = readFileSync(env.at(`private${DIR}/${STATE}`));
      env.world.onNames = change;
      const result = refuses(await run(env, name, DIR, ...extra, '--evidence', 'phase2-5-check'), new RegExp(`^mb1-replay refused: ${problem}\\n$`));
      assert.deepEqual(result.kinds, kinds, `${label}: ${call} ran`);
      assert.equal(env.world.running, true, `${label}: the replay was stopped`);
      assert.deepEqual(readFileSync(env.at(`private${DIR}/${STATE}`)), state, `${label}: state.json changed`);
      assert.doesNotMatch(result.out, /^# rechecked /m, label);
      assert.deepEqual(leaks(`${result.out}${result.err}${readFileSync(env.at('evidence/phase2-5-check.txt'), 'utf8')}`), [], label);
    });
    await t.test(`${name} with nothing changed`, async (st) => {
      const env = setup(st);
      await atStarted(env);
      const events = [];
      env.deps = ordered(env, { ...CLEAN_ENV }, events);
      const result = passes(await run(env, name, DIR, ...extra), `${name} with nothing changed`);
      assert.ok(result.kinds.includes(call), result.kinds.join(', '));
      lastCheck(events, call);
      assert.match(result.out, RECHECKED(`immediately before ${at}`, 23));
    });
  }
  // teardown stops a running replay through the same stop: the recheck is the first statement before that child too.
  const retained = async (env) => { await atStarted(env); passes(await run(env, 'retain', DIR), 'retain'); };
  await eachDrift(t, 'before teardown', retained, async ({ env, label, change, problem }) => {
    env.world.onNames = change;
    const result = refuses(await run(env, 'teardown', DIR, ...CONFIRM), new RegExp(`^mb1-replay refused: ${problem}\\n$`));
    assert.deepEqual(result.kinds, ['inspect', 'names', 'status', 'names', 'inspect'], `${label}: stop ran`);
    assert.equal(env.world.running, true, label);
    assert.equal(existsSync(env.at(`private${DIR}/${MANIFEST}`)), true, `${label}: something was removed`);
  });
  await t.test('teardown with nothing changed', async (st) => {
    const env = setup(st);
    await retained(env);
    const events = [];
    env.deps = ordered(env, { ...CLEAN_ENV }, events);
    const result = passes(await run(env, 'teardown', DIR, ...CONFIRM), 'teardown with nothing changed');
    lastCheck(events, 'stop');
    assert.match(result.out, RECHECKED('immediately before stop', 23));
    assert.equal(existsSync(env.at(`private${DIR}`)), false);
  });
});

test('review 2026-10-26T2305Z finding 4: after db diff and db lint every replay guard runs again; a change is a STOP that state.json records, whatever the CLI exit, and every later command is refused', async (t) => {
  const later = [['check', DIR], ['migrations', DIR], ['diff', DIR], ['lint', DIR], ['images', DIR], ['stop', DIR, ...CONFIRM], ['teardown', DIR, ...CONFIRM], ['shared-snapshot', DIR, 'before']];
  for (const [name, kinds] of [['diff', ['inspect', 'status', 'names', 'db diff', 'inspect']], ['lint', ['inspect', 'status', 'names', 'db lint']]]) {
    const label = `db ${name}`;
    for (const [end, ending] of CLI_ENDS) {
      await eachDrift(t, `${label} ending with ${end}`, atStarted, async ({ env, label: drift, change, undo, problem }) => {
        env.world.dbResult = ending;
        env.world.onDb = (w, sub) => { if (sub.startsWith(label)) change(); };
        const result = await run(env, name, DIR, '--evidence', `phase2-5-${name}`);
        env.world.onDb = null;
        assert.equal(result.code, 1, drift);
        assert.equal(result.err, '', `${drift}: a STOP line, not a refusal`);
        assert.deepEqual(result.kinds, kinds, drift);
        assert.match(result.out, RECHECKED(`immediately before ${label}`, 23));
        if (CLI_END_LINE[end]) assert.match(result.out, CLI_END_LINE[end], `${drift}: the CLI's own end is shown`);
        const line = new RegExp(`^# STOP: after ${label} on the replay: ${problem}; ${unknownAfter(label)}$`, 'm');
        assert.match(result.out, line, drift);
        assert.match(readFileSync(env.at(`evidence/phase2-5-${name}.txt`), 'utf8'), line, drift);
        assert.deepEqual(leaks(`${result.out}${result.err}`), [], drift);
        assert.doesNotMatch(result.out, new RegExp(`^# rechecked after ${label}|^# ${name} clean: `, 'm'), `${drift}: no verdict after a STOP`);
        const stoppedAt = env.clock;
        assert.deepEqual(readState(env).stopRecorded, { at: stoppedAt, op: name }, drift);
        assert.equal(readState(env).checks[name], undefined, `${drift}: a ${name} result was recorded`);
        undo();
        env.world.dbResult = undefined;
        env.clock += 75_000;
        for (const argv of later) assert.deepEqual(refuses(await run(env, ...argv), haltedBy(label)).kinds, [], `${drift}: ${argv[0]}`);
        assert.deepEqual(readState(env).stopRecorded, { at: stoppedAt, op: name }, `${drift}: the record is durable`);
      });
    }
    // With nothing changed: exit 0 records the clean result after both rechecks; a failure or a timeout is no STOP.
    for (const [end, ending] of CLI_ENDS) {
      await t.test(`${label} ending with ${end}, nothing changed`, async (st) => {
        const env = setup(st);
        await atStarted(env);
        env.world.dbResult = ending;
        const result = await run(env, name, DIR);
        assert.equal(result.code, ending ? 1 : 0, result.out);
        assert.equal(result.err, '');
        assert.match(result.out, RECHECKED(`immediately before ${label}`, 23));
        assert.match(result.out, RECHECKED(`after ${label}`, 23));
        assert.doesNotMatch(result.out, /^# STOP:/m);
        assert.equal(readState(env).stopRecorded, undefined);
        assert.deepEqual(readState(env).checks[name], { generation: 1, clean: !ending });
      });
    }
  }
});
