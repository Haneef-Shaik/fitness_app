// MB-1 replay runner tests: review 19eea0f3 findings 1 and 2, the pinned candidate, suite spacing, verdicts and F6 (phase 1F). Moved unchanged from mb1-replay.test.mjs in SF-0
// (docs/plan/runs/MB-1/sf0.md); the shared harness is mb1-replay-test-harness.mjs.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { test } from 'node:test';
import { REPO_ROOT } from './local-stack.mjs';
import { CANDIDATE, PROFILE_READ_FAILURES, sha256 } from './mb1-replay-evidence.mjs';
import { MANIFEST, STATE } from './mb1-replay-target.mjs';
import {
  atGreen, atRed, atSharedApply, ATTEMPTED, BAN, BAN_BANNED, BASE, bindingOutput, CLEAN_ENV, dbIdOf, DIR, envRefusal, escapeRe, FAKE, INCIDENT, kind, leaks, LOGS, MIGRATIONS, passes, readState,
  refuses, repo, REVIEWED_CANDIDATE, run, setup, SHARED_CONFIRM, snapshot, SNAPSHOTS, STAGING, suiteLog, toSharedApply,
} from './mb1-replay-test-harness.mjs';

/* ---------------------------------------------------------------- Review 19eea0f3 findings 1 and 2 (phase 1F) -------- */

// Finding 1: `migration up --local --workdir <repository>` connects to the [db] port of the repository's config, read when it
// runs, and CLI 2.121.0 prefers supabase/config.json to config.toml. The DB_URL check proves where the running 55321
// container publishes, not where migration up will connect. So every 55321 command, before any child process, needs: no
// config.json (any case, any type) in the repository's supabase/, named only and never read; a config.toml whose [db] port is
// 55322, where status's DB_URL must be; and that config.toml exactly the one the replay was prepared from (its replay config
// hashes to the manifest's pin).
const SHARED_OPS = [['shared-snapshot', DIR, 'before'], ['shared-snapshot', DIR, 'after'], ['shared-apply', DIR, ...SHARED_CONFIRM], ['shared-suite', DIR]];
const portRefusal = (port) => new RegExp(`^mb1-replay refused: the repository's supabase/config\\.toml sets \\[db\\] port ${escapeRe(port)}, not 55322, where its status DB_URL must be; migration up --local connects to the config's port\\n$`);
const configJsonRefusal = (path) => new RegExp(`^mb1-replay refused: ${escapeRe(path)} is present; the Supabase CLI prefers config\\.json to config\\.toml, so nothing runs on 55321 while it is there \\(names only: no file was read, changed or removed\\)\\n$`);
test("review 19eea0f3 finding 1: every 55321 command binds the repository's [db] port to 55322 and to the replay's config, before any child process", async (t) => {
  const env = setup(t);
  await atGreen(env);
  await toSharedApply(env);
  const config = repo('supabase/config.toml').toString('utf8');
  assert.equal(config.split('\n').filter((line) => line === 'port = 55322').length, 1, 'the repository config sets port = 55322 once, in [db]');
  const cases = [
    // The Codex probe: the [db] port moved to the replay's 56422 after prepare, while 55321's status still reports 55322.
    ['[db] port 56422, status still at 55322', config.replace('port = 55322', 'port = 56422'), portRefusal('56422')],
    ['[db] port 55399', config.replace('port = 55322', 'port = 55399'), portRefusal('55399')],
    ['[db] port from env()', config.replace('port = 55322', 'port = "env(SUPABASE_DB_PORT)"'), portRefusal('(none)')],
    ['no [db] port', config.replace('port = 55322\n', ''), portRefusal('(none)')],
    ['an edit elsewhere after prepare', `${config}# edited after prepare\n`, /^mb1-replay refused: the repository's supabase\/config\.toml is not the one the replay was prepared from \(its replay config's sha256 differs from manifest\.json's\)\n$/],
    ['a ninth 553xx port', `${config}\n[extra]\nport = 55399\n`, /^mb1-replay refused: the repository's supabase\/config\.toml no longer yields the replay's config \(the replay config changed 10 line\(s\) of supabase\/config\.toml, expected 9/],
    ['another project', config.replace('project_id = "fitlog_rebuild_20261017"', 'project_id = "fitlog_other_20261026"'), /^mb1-replay refused: the repository's supabase\/config\.toml names project fitlog_other_20261026, not fitlog_rebuild_20261017\n$/],
  ];
  for (const [label, text, reason] of cases) {
    assert.notEqual(text, config, label);
    env.deps = { readRepo: (rel) => (rel === 'supabase/config.toml' ? Buffer.from(text) : repo(rel)) };
    for (const argv of SHARED_OPS) {
      const result = refuses(await run(env, ...argv, '--evidence', 'phase2-config'), reason);
      assert.deepEqual(result.kinds, [], `${label}: ${argv.join(' ')} ran a child process`);
      assert.deepEqual(leaks(`${result.out}${result.err}${readFileSync(env.at('evidence/phase2-config.txt'), 'utf8')}`), [], label);
      unlinkSync(env.at('evidence/phase2-config.txt'));
    }
  }
  assert.equal(readState(env).sharedApplied, false);
  assert.ok(!env.world.calls.some((call) => kind(call) === 'migration up' && call.args.at(-1) === REPO_ROOT), 'migration up never ran for the repository');

  // A config.json the CLI would prefer, in any case and of any type, is refused by name; it is never read, changed or removed.
  const repoSupabase = `${REPO_ROOT.replace(/\/$/, '')}/supabase`;
  mkdirSync(env.at(repoSupabase), { recursive: true });
  const reads = [];
  env.deps = {
    fs: { ...env.fs, readFileSync: (path, encoding) => { reads.push(String(path)); return env.fs.readFileSync(path, encoding); } },
    readRepo: (rel) => { reads.push(rel); return repo(rel); },
  };
  const secretJson = `{"db":{"port":56422},"auth":{"jwt_secret":"${FAKE.jwtSecret}"},"key":"${FAKE.secret}"}\n`;
  for (const name of ['config.json', 'CONFIG.JSON', 'Config.Json']) {
    const planted = `${repoSupabase}/${name}`;
    writeFileSync(env.at(planted), secretJson);
    for (const argv of SHARED_OPS) {
      const result = refuses(await run(env, ...argv), configJsonRefusal(planted));
      assert.deepEqual(result.kinds, [], `${name}: ${argv[0]}`);
      assert.deepEqual(leaks(`${result.out}${result.err}`), [], name);
    }
    assert.equal(readFileSync(env.at(planted), 'utf8'), secretJson, `${name} was changed`);
    unlinkSync(env.at(planted));
  }
  mkdirSync(env.at(`${repoSupabase}/config.json`));
  assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), configJsonRefusal(`${repoSupabase}/config.json`)).kinds, []);
  rmdirSync(env.at(`${repoSupabase}/config.json`));
  assert.deepEqual(reads.filter((path) => /config\.json/i.test(path)), [], 'no config.json was read');
  // The replay's own directory never holds one: an entry the runner did not create stops every command.
  const replayJson = env.at(`private${DIR}/supabase/config.json`);
  writeFileSync(replayJson, '{"db":{"port":55322}}\n');
  for (const argv of [['check', DIR], ['migrations', DIR], ...SHARED_OPS]) {
    assert.deepEqual(refuses(await run(env, ...argv), /holds entries this runner did not create: supabase\/config\.json; nothing runs on it and nothing was removed/).kinds, [], argv[0]);
  }
  unlinkSync(replayJson);

  // With the repository config as the replay was prepared from it, the same commands run.
  env.deps = {};
  env.world.snapshot = SNAPSHOTS.before;
  passes(await run(env, 'shared-snapshot', DIR, 'before'), 'shared-snapshot before');
  assert.deepEqual(passes(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), 'shared-apply').kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'binding', 'inspect-id', 'migration up', 'binding', 'inspect-id', 'psql-read', 'inspect-id', 'inspect']);
});

// Finding 2: shared-apply checks the .env files, the candidate pin and the migration comparison first, then runs status and
// a read-only snapshot, which take seconds, before migration up reads the same files. So each of those checks, finding 1's
// config binding and the SUPABASE_* refusal run again immediately before the migration-up child, and the candidate is
// hashed again after it.
test('review 19eea0f3 finding 2: a change made after the fresh snapshot, just before migration up, applies nothing', async (t) => {
  const env = setup(t);
  await atGreen(env);
  await toSharedApply(env);
  env.world.snapshot = SNAPSHOTS.before;
  passes(await run(env, 'shared-snapshot', DIR, 'before'), 'shared-snapshot before');
  const repoRoot = REPO_ROOT.replace(/\/$/, '');
  mkdirSync(env.at(`${repoRoot}/supabase`), { recursive: true });
  const config = repo('supabase/config.toml').toString('utf8');
  const grant = Buffer.from(`${repo(`supabase/migrations/${CANDIDATE}`).toString('utf8')}grant all on public.profiles to anon;\n`);
  const runnerEnv = { ...CLEAN_ENV };
  let drift = {};
  env.deps = { env: runnerEnv, readRepo: (rel) => drift.readRepo?.(rel) ?? repo(rel), listMigrations: () => drift.list ?? MIGRATIONS };
  const plant = (path, text) => [() => writeFileSync(env.at(path), text), () => unlinkSync(env.at(path))];
  const late = [
    ['a .env file in the repository', ...plant(`${repoRoot}/supabase/.env`, 'SUPABASE_DB_PORT=56422\n'), envRefusal([`${repoRoot}/supabase/.env`])],
    ['a .env file in a parent directory', ...plant(`${dirname(repoRoot)}/.env.local`, 'SUPABASE_DB_PORT=56422\n'), envRefusal([`${dirname(repoRoot)}/.env.local`])],
    ['a SUPABASE_* variable', () => { runnerEnv.SUPABASE_DB_PORT = '56422'; }, () => { delete runnerEnv.SUPABASE_DB_PORT; }, /^mb1-replay refused: the environment sets SUPABASE_DB_PORT; a SUPABASE_\* variable can override the replay's config\.toml \(project_id included\), so nothing runs until it is unset \(names only; no value is printed\)\n$/],
    ['a supabase/config.json', ...plant(`${repoRoot}/supabase/config.json`, '{"db":{"port":56422}}\n'), configJsonRefusal(`${repoRoot}/supabase/config.json`)],
    ['the [db] port moved to 56422', () => { drift = { readRepo: (rel) => (rel === 'supabase/config.toml' ? Buffer.from(config.replace('port = 55322', 'port = 56422')) : undefined) }; }, () => { drift = {}; }, portRefusal('56422')],
    ['the candidate edited', () => { drift = { readRepo: (rel) => (rel.endsWith(CANDIDATE) ? grant : undefined) }; }, () => { drift = {}; }, new RegExp(`^mb1-replay refused: supabase/migrations/${CANDIDATE} is not the reviewed candidate \\(sha256 ${sha256(grant)}, reviewed ${REVIEWED_CANDIDATE}\\); apply nothing\\n$`)],
    ['a migration added', () => { drift = { list: [...MIGRATIONS, '29991231235959_b1_linked_policies.sql'] }; }, () => { drift = {}; }, /^mb1-replay refused: the repository's migrations differ from the 16 the replay ran \(29991231235959_b1_linked_policies\.sql\); apply nothing\n$/],
    ['a committed migration edited', () => { drift = { readRepo: (rel) => (rel === `supabase/migrations/${BASE[3]}` ? Buffer.from('select 1;\n') : undefined) }; }, () => { drift = {}; }, new RegExp(`^mb1-replay refused: the repository's migrations differ from the 16 the replay ran \\(${escapeRe(BASE[3])}\\); apply nothing\\n$`)],
  ];
  for (const [label, change, undo, reason] of late) {
    env.world.onRead = (w, args) => { if (args.includes(dbIdOf(bindingOutput()))) change(); }; // SF-7b L2: 55321 reads go by the proven ID
    const result = refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), reason);
    env.world.onRead = null;
    undo();
    assert.deepEqual(result.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'inspect'], `${label}: migration up ran`);
    assert.match(result.out, /^# fresh 55321 snapshot right before the apply: equal to the replay's before snapshot$/m, label);
    assert.deepEqual(leaks(`${result.out}${result.err}`), [], label);
    assert.equal(readState(env).sharedApplied, false, label);
    assert.equal(readState(env).sharedApplyAttempted, undefined, `${label}: a refusal before migration up records no attempt`);
  }
  const apply = passes(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), 'shared-apply with nothing changed');
  assert.deepEqual(apply.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'binding', 'inspect-id', 'migration up', 'binding', 'inspect-id', 'psql-read', 'inspect-id', 'inspect']);
  assert.match(apply.out, /^# rechecked immediately before migration up: no SUPABASE_\* variable, no \.env file, no config\.json, \[db\] port 55322 and the replay's config, the pinned candidate, and the 16 migration\(s\) the replay ran$/m);
  assert.match(apply.out, /^# rechecked immediately before migration up, the staged input it reads: exactly the 19 file\(s\) pinned under shared-apply\/, each sha256 equal, the staged config bound to 55322 and the staged candidate pinned$/m);
  assert.match(apply.out, new RegExp(`^# after migration up: supabase/migrations/${CANDIDATE} still has the pinned sha256 ${REVIEWED_CANDIDATE}$`, 'm'));
  assert.equal(readState(env).sharedApplied, true);
});

// Phase 1F recorded this STOP as sharedApplied: true, so the apply was never repeated. Review bbe2fbba finding 1 (c): the
// attempt itself is now recorded, before migration up starts, and sharedApplied means only a verified apply.
test('review 19eea0f3 finding 2: a candidate changed or unreadable after migration up is a STOP, and shared-apply never runs again', async (t) => {
  const changed = Buffer.from('-- changed while migration up ran\n');
  const after = (what) => new RegExp(`^# STOP: supabase/migrations/${CANDIDATE} ${what}; what 55321 applied is unknown, so shared-apply never runs again: ${INCIDENT}$`, 'm'); // SF-7b L4
  for (const [label, late, line] of [
    ['changed', () => changed, after(`changed while migration up ran \\(sha256 ${sha256(changed)}, pinned ${REVIEWED_CANDIDATE}\\)`)],
    ['unreadable', () => { throw Object.assign(new Error('gone'), { code: 'ENOENT' }); }, after('could not be read after migration up \\(ENOENT\\)')],
  ]) {
    const env = setup(t);
    await atSharedApply(env);
    let swapped = null;
    env.deps = { readRepo: (rel) => (swapped && rel.endsWith(CANDIDATE) ? swapped() : repo(rel)) };
    env.world.onMigrate = (w, workdir) => { if (workdir === STAGING) swapped = late; };
    const result = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM, '--evidence', 'phase2-6-apply');
    env.world.onMigrate = null;
    swapped = null;
    assert.equal(result.code, 1, label);
    assert.equal(result.err, '', `${label}: a STOP line, not a refusal`);
    assert.deepEqual(result.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'binding', 'inspect-id', 'migration up', 'inspect'], label);
    assert.match(result.out, line, label);
    assert.match(readFileSync(env.at('evidence/phase2-6-apply.txt'), 'utf8'), line, label);
    const state = readState(env);
    assert.deepEqual(state.sharedApplyAttempted, { at: env.clock, workdir: 'shared-apply' }, `${label}: an apply that may have written is never repeated`);
    assert.equal(state.sharedApplied, false, `${label}: nothing verified`);
    assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), ATTEMPTED).kinds, ['inspect']);
  }
});

// Review b75d1e73 finding 4: add-candidate copies only the pinned candidate bytes into the replay.
test('add-candidate refuses any candidate but the pinned bytes, before copying anything', async (t) => {
  const env = setup(t);
  await atRed(env);
  const rel = `supabase/migrations/${CANDIDATE}`;
  const manifest = readFileSync(env.at(`private${DIR}/${MANIFEST}`));
  for (const edited of [Buffer.from(`${repo(rel).toString('utf8')}grant all on public.profiles to anon;\n`), Buffer.from(repo(rel).toString('utf8').replace('member_active()', 'member_active() or true'))]) {
    env.deps = { readRepo: (path) => (path === rel ? edited : repo(path)) };
    const refused = refuses(await run(env, 'add-candidate', DIR), new RegExp(`^mb1-replay refused: ${rel} is not the reviewed candidate \\(sha256 ${sha256(edited)}, reviewed ${REVIEWED_CANDIDATE}\\); nothing was added\\n$`));
    assert.deepEqual(refused.kinds, ['inspect']);
    assert.equal(existsSync(env.at(`private${DIR}/${rel}`)), false);
    assert.deepEqual(readFileSync(env.at(`private${DIR}/${MANIFEST}`)), manifest);
    assert.equal(readState(env).candidate, 'absent');
  }
  env.deps = {};
  const added = passes(await run(env, 'add-candidate', DIR), 'add-candidate');
  assert.match(added.out, new RegExp(`^${REVIEWED_CANDIDATE}  ${rel} \\(equals the repository file and the pinned candidate\\); added to manifest\\.json$`, 'm'));
  assert.equal(sha256(readFileSync(env.at(`private${DIR}/${rel}`))), REVIEWED_CANDIDATE);
  assert.equal(readState(env).candidate, 'added');
});

test('suites on one stack are spaced at least 75 seconds apart, so 30 sign-ins per 5 minutes is never reached', async (t) => {
  const env = setup(t);
  await atRed(env);
  passes(await run(env, 'add-candidate', DIR), 'add-candidate');
  passes(await run(env, 'migrate', DIR), 'migrate');
  passes(await snapshot(env, 'after'), 'snapshot after');
  env.clock += 74_000;
  assert.deepEqual(refuses(await run(env, 'suite', DIR, 'green'), /wait 1 s more: suites on one stack run at least 75 s apart/).kinds, ['inspect']);
  env.clock += 1_000;
  env.suites.push({ log: LOGS.green, code: 0 });
  passes(await run(env, 'suite', DIR, 'green'), 'suite green at 75 s');
});

test('a suite verdict is mechanical: a 429, an unknown ban answer or a cleanup line fails it whatever the exit code', async (t) => {
  const env = setup(t);
  await atRed(env);
  passes(await run(env, 'add-candidate', DIR), 'add-candidate');
  passes(await run(env, 'migrate', DIR), 'migrate');
  passes(await snapshot(env, 'after'), 'snapshot after');
  for (const [log, code, reason] of [
    ['verify-identity setup failed: Fixture sign-in failed: HTTP 429\n', 1, /stop line: verify-identity setup failed: Fixture sign-in failed: HTTP 429/],
    [LOGS.green.replace('HTTP 200', 'HTTP 403 {"code":"bad_jwt","message":"invalid JWT"}'), 0, /unrecognised ban answer .*: stop and record it/],
    // F6: user_banned is the class "banned" now, and against this run's "live" reference it is a mismatch, never a pass.
    [suiteLog([], BAN_BANNED), 0, /^# problem: the ban answer is banned, but the reference run recorded live$/m],
    [`${LOGS.green}Fixture cleanup needs attention: account x (HTTP 500)\n`, 0, /stop line: Fixture cleanup needs attention/],
    [LOGS.green, 1, /expected exit 0, got 1/],
  ]) {
    env.clock += 75_000;
    env.suites.push({ log, code });
    const result = await run(env, 'suite', DIR, 'green');
    assert.equal(result.code, 1);
    assert.match(result.out, reason);
    assert.match(result.out, /^# verdict: the green expectation is NOT met$/m);
  }
  assert.ok(readState(env).suites.slice(1).every((entry) => entry.ok === false));
});

// F6 (phase2.md A3.3): GoTrue's user_banned answer is the class "banned". The exact suite output attempt 3 recorded passes RED
// as a new run, with that class as the reference; a failed run before it stays failed and is never rewritten; GREEN, M1 and
// M3 hold under it. Phase 1F refused M2 under "banned" outright; review bbe2fbba's nonvacuous M2 replaced that rule (its
// finding 2 tests, below, cover M2 under "banned" and "ended"). Without a recorded reference, M2 is still refused.
test('F6: a user_banned answer is recorded as "banned": RED, GREEN, M1 and M3 hold, an earlier failed RED stays failed, and M2 without a reference is refused before any SQL', async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  passes(await snapshot(env, 'before'), 'snapshot before');
  // As attempt 3 ended: a red run whose ban answer the verdict does not know fails and records no reference.
  env.clock += 75_000;
  env.suites.push({ log: suiteLog(PROFILE_READ_FAILURES, BAN_BANNED.replace('user_banned', 'not_a_known_code')), code: 1 });
  const unknown = await run(env, 'suite', DIR, 'red', '--evidence', 'phase2-2-red');
  assert.equal(unknown.code, 1);
  assert.match(unknown.out, /^# suite exit 1; GoTrue's answer after the ban: unrecognised\n# verdict: the red expectation is NOT met$/m);
  const failed = readState(env).suites[0];
  assert.deepEqual({ ...failed, endedAt: typeof failed.endedAt }, { stack: 'replay', expect: 'red', ok: false, ban: null, generation: 1, endedAt: 'number' });
  assert.equal(readState(env).ban, null);
  refuses(await run(env, 'add-candidate', DIR), /add-candidate needs a passing red suite first/);
  // The exact suite output attempt 3 recorded (phase2-2-red.txt up to its summary line), as a new run.
  const recorded = repo('docs/evidence/MB-1/phase2-2-red.txt').toString('utf8');
  const output = recorded.slice(0, recorded.indexOf('# problem: '));
  assert.ok(output.endsWith(`\n5 of 27 identity checks failed: ${PROFILE_READ_FAILURES.join('; ')}\n`), output);
  env.clock += 75_000;
  env.suites.push({ log: output, code: 1 });
  const red = passes(await run(env, 'suite', DIR, 'red', '--evidence', 'phase2-2-red-2'), 'suite red with the recorded user_banned output');
  assert.match(red.out, /^# suite exit 1; GoTrue's answer after the ban: banned\n# verdict: the red expectation is met\n# ban answer "banned" \(GoTrue HTTP 403 user_banned\): /m);
  assert.deepEqual(leaks(`${red.out}${readFileSync(env.at('evidence/phase2-2-red-2.txt'), 'utf8')}`), []);
  const state = readState(env);
  assert.deepEqual(state.suites[0], failed, 'the earlier failed run is never rewritten');
  assert.deepEqual(state.suites.map((entry) => `${entry.expect}:${entry.ok}:${entry.ban}`), ['red:false:null', 'red:true:banned']);
  assert.equal(state.ban, 'banned');
  // GREEN, M1 and M3 hold under "banned"; a live answer is a mismatch with the reference.
  passes(await run(env, 'add-candidate', DIR), 'add-candidate');
  passes(await run(env, 'migrate', DIR), 'migrate');
  passes(await snapshot(env, 'after'), 'snapshot after');
  const suiteRun = async (expect, failing, ban = BAN_BANNED) => { env.clock += 75_000; env.suites.push({ log: suiteLog(failing, ban), code: failing.length ? 1 : 0 }); return run(env, 'suite', DIR, expect); };
  const live = await suiteRun('green', [], BAN);
  assert.equal(live.code, 1);
  assert.match(live.out, /^# problem: the ban answer is live, but the reference run recorded banned$/m);
  passes(await suiteRun('green', []), 'suite green under banned');
  passes(await run(env, 'mutate', DIR, 'm1'), 'mutate m1');
  passes(await snapshot(env, 'm1'), 'snapshot m1');
  passes(await suiteRun('m1', PROFILE_READ_FAILURES), 'suite m1 under banned');
  passes(await run(env, 'mutate', DIR, 'restore-m1'), 'restore m1');
  passes(await snapshot(env, 'restored', SNAPSHOTS.after), 'restored after m1');
  const writes = env.world.writes.length;
  passes(await run(env, 'mutate', DIR, 'm3'), 'mutate m3');
  passes(await snapshot(env, 'm3'), 'snapshot m3');
  passes(await suiteRun('m3', ['a deletion-pending account reads no profile']), 'suite m3 under banned');
  passes(await run(env, 'mutate', DIR, 'restore-member-active'), 'restore m3');
  passes(await snapshot(env, 'restored', SNAPSHOTS.after), 'restored after m3');
  assert.deepEqual(readState(env).mutations, ['m1', 'm3']);
  // shared-apply stays blocked: there is no passing M2.
  refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), /shared-apply needs every replay proof first; missing: suite m2, a generation 2 green suite,/);
  // A state with no recognised reference (unreachable in plan order: add-candidate needs a passing red) refuses M2.
  writeFileSync(env.at(`private${DIR}/${STATE}`), `${JSON.stringify({ ...readState(env), ban: null }, null, 2)}\n`);
  assert.deepEqual(refuses(await run(env, 'mutate', DIR, 'm2', '--evidence', 'phase2-4-m2-apply'), /^mb1-replay refused: mutate m2 is refused: no reference ban answer of "live" or "banned" is recorded \(it is none\), so M2 has no expectation\n$/).kinds, ['inspect']);
  assert.equal(env.world.writes.length, writes + 2, 'only the m3 mutation and its restore were sent');
});
