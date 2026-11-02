// MB-1 replay runner tests: review bbe2fbba findings 1, 2 and 4 (phase 1G). Moved unchanged from mb1-replay.test.mjs in SF-0
// (docs/plan/runs/MB-1/sf0.md); the shared harness is mb1-replay-test-harness.mjs.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { REPO_ROOT } from './local-stack.mjs';
import { CANDIDATE, M2_CHECK, M2_UNKILLED, PROFILE_READ_FAILURES, sha256 } from './mb1-replay-evidence.mjs';
import { MANIFEST, REPLAY_API_URL, STATE } from './mb1-replay-target.mjs';
import {
  atM2, atSharedApply, ATTEMPTED, BAN_BANNED, BAN_ENDED, BASE, CLEAN_ENV, CONFIRM, CONTAINER, DIR, envRefusal, escapeRe, failed, GUARDED, INCIDENT, kind, leaks, listFiles,
  LOGS, M2_STOP, md5, MIGRATIONS, ok, passes, psqlOutput, readState, refuses, repo, REVIEWED_CANDIDATE, run, setup, SHARED_CONFIRM, snapshot, SNAPSHOTS, STAGING,
  suite, suiteLog, suiteWith, SUPABASE_BIN,
} from './mb1-replay-test-harness.mjs';

/* ---------------------------------------------------------------- Review bbe2fbba findings 2 and 4 (phase 1G) ------- */

// Finding 2 and its nonvacuous M2 (accepted by Codex as the plan). Under "banned", mutate m2 runs and suite m2 holds only on
// the exact kill: "a banned account reads no profile" alone fails, with HTTP 200, 1 row(s). That row is the run's own session
// evidence: with the ban clause removed, member C's row came back, so member_active()'s session clause held. 27 ok is never
// a kill: the run says STOP, and M2 is not run again on that replay (the fallback is M2b, reviewed separately).
test('review bbe2fbba finding 2: under "banned", mutate m2 runs, and suite m2 holds only on the exact kill; 27 ok is never a kill and stops M2 on the replay', async (t) => {
  const env = setup(t);
  await atM2(env, BAN_BANNED);
  assert.deepEqual(env.world.writes.at(-1), { container: CONTAINER, input: readFileSync(env.at(`private${DIR}/sql/m2.sql`)) }, 'the pinned M2 SQL went to the replay only');
  // The banned check failing for another reason is no kill and no stop, so M2 may run again.
  const serverError = await suiteWith(env, 'm2', [M2_CHECK], BAN_BANNED, { [M2_CHECK]: 'HTTP 500 {"code":"XX000","message":"internal error"}' });
  assert.equal(serverError.code, 1);
  assert.match(serverError.out, /^# problem: "a banned account reads no profile" failed with "HTTP 500 \{"code":"XX000","message":"internal error"\}", not "HTTP 200, 1 row\(s\)" \(the caller's own row\)/m);
  assert.match(serverError.out, /^# verdict: the m2 expectation is NOT met$/m);
  assert.doesNotMatch(serverError.out, /^# STOP:/m);
  const killed = passes(await suiteWith(env, 'm2', [M2_CHECK], BAN_BANNED), 'suite m2 under banned, the exact kill');
  assert.match(killed.out, /^# suite exit 1; GoTrue's answer after the ban: banned\n# verdict: the m2 expectation is met\n# ban answer "banned" \(GoTrue HTTP 403 user_banned\): .*M2 holds only when exactly "a banned account reads no profile" fails with HTTP 200, 1 row\(s\)/m);
  assert.deepEqual(readState(env).suites.slice(-2).map((entry) => `${entry.expect}:${entry.ok}:${entry.ban}:${entry.m2Stopped ?? '-'}`), ['m2:false:banned:-', 'm2:true:banned:-']);

  // 27 ok: never a kill. The verdict fails, the runner prints a STOP and records it, and suite m2 is refused from then on.
  const stopped = setup(t);
  await atM2(stopped, BAN_BANNED);
  const vacuous = await suiteWith(stopped, 'm2', [], BAN_BANNED);
  assert.equal(vacuous.code, 1);
  assert.equal(vacuous.err, '', 'a STOP line, not a refusal');
  assert.ok(vacuous.out.includes(`# problem: ${M2_UNKILLED}\n`), vacuous.out);
  assert.match(vacuous.out, /^# verdict: the m2 expectation is NOT met$/m);
  assert.match(vacuous.out, M2_STOP);
  const entry = readState(stopped).suites.at(-1);
  assert.deepEqual({ ...entry, endedAt: typeof entry.endedAt }, { stack: 'replay', expect: 'm2', ok: false, ban: 'banned', generation: 1, endedAt: 'number', m2Stopped: true });
  const ran = stopped.suiteCalls.length;
  stopped.clock += 75_000;
  stopped.suites.push({ log: suiteLog([M2_CHECK], BAN_BANNED), code: 1 });
  const again = refuses(await run(stopped, 'suite', DIR, 'm2', '--evidence', 'phase2-4-m2-suite-2'), /^mb1-replay refused: suite m2 is stopped on this replay: an earlier M2 run passed "a banned account reads no profile" with the ban clause removed, which never counts as a kill \(review bbe2fbba finding 2\); the fallback is M2b, reviewed separately\n$/);
  assert.deepEqual(again.kinds, ['inspect']);
  assert.equal(stopped.suiteCalls.length, ran, 'the suite did not run again');
  stopped.suites.length = 0;
  // The restore still runs, and shared-apply stays blocked: since review 2026-10-26T2000Z finding 1, by the stop itself, before
  // any child process, whatever else is missing or passed.
  passes(await run(stopped, 'mutate', DIR, 'restore-member-active'), 'restore m2');
  passes(await snapshot(stopped, 'restored', SNAPSHOTS.after), 'restored after m2');
  assert.deepEqual(refuses(await run(stopped, 'shared-apply', DIR, ...SHARED_CONFIRM), /^mb1-replay refused: shared-apply is blocked on this replay: M2 was stopped at \d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z \("a banned account reads no profile" passed with the ban clause removed\), so no M2 run here counts, an earlier pass included \(review 2026-10-26T2000Z finding 1\); the fallback is M2b, reviewed separately\n$/).kinds, ['inspect']);
});

test('review bbe2fbba finding 2: under an "ended" reference, mutate m2 is refused before any SQL, so shared-apply stays blocked', async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  passes(await snapshot(env, 'before'), 'snapshot before');
  const red = passes(await suiteWith(env, 'red', PROFILE_READ_FAILURES, BAN_ENDED), 'suite red under ended');
  assert.match(red.out, /^# suite exit 1; GoTrue's answer after the ban: ended\n# verdict: the red expectation is met\n# ban answer "ended" \(GoTrue HTTP 403 session_not_found\): .*but M2 is refused on this replay \(review bbe2fbba finding 2\), so shared-apply stays blocked here$/m);
  assert.equal(readState(env).ban, 'ended');
  passes(await run(env, 'add-candidate', DIR), 'add-candidate');
  passes(await run(env, 'migrate', DIR), 'migrate');
  passes(await snapshot(env, 'after'), 'snapshot after');
  passes(await suiteWith(env, 'green', [], BAN_ENDED), 'suite green under ended');
  const writes = env.world.writes.length;
  const refusal = /^mb1-replay refused: mutate m2 is refused: the reference ban answer is "ended": GoTrue ended member C's session, so the session clause refuses its read with or without the ban clause, and no M2 run can show the ban clause is needed \(review bbe2fbba finding 2\); M2 needs a fresh replay whose reference is "live" or "banned", or the separately reviewed M2b\n$/;
  assert.deepEqual(refuses(await run(env, 'mutate', DIR, 'm2', '--evidence', 'phase2-4-m2-apply'), refusal).kinds, ['inspect']);
  assert.match(readFileSync(env.at('evidence/phase2-4-m2-apply.txt'), 'utf8'), /mutate m2 is refused: the reference ban answer is "ended"/);
  assert.equal(env.world.writes.length, writes, 'no mutation SQL was sent');
  assert.deepEqual(readState(env).mutations, []);
  refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), /shared-apply needs every replay proof first; missing: suite m1, suite m2, suite m3,/);
});

// Finding 4: the before snapshot is the one reference with nothing to compare it with, and 55321's before must later equal
// it, so a retake would replace a verified reference unchecked. A failed attempt records nothing, so it is no reference.
test('review bbe2fbba finding 4: the before snapshot is taken once and never retaken or overwritten', async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  assert.equal((await snapshot(env, 'before', psqlOutput({ readOnly: 'off|on' }))).code, 1);
  assert.deepEqual(readState(env).snapshots, {}, 'a failed attempt is no reference');
  passes(await snapshot(env, 'before'), 'snapshot before');
  const kept = readState(env).snapshots.before;
  assert.equal(kept.at, Date.UTC(2026, 9, 26, 6));
  const retake = /^mb1-replay refused: snapshot before is the reference every later snapshot is compared with, so it is taken once and never retaken \(review bbe2fbba finding 4\): the one taken at 2026-10-26T06:00:00\.000Z stands\n$/;
  for (const output of [SNAPSHOTS.before, psqlOutput({ fn: md5('another reference') })]) {
    const result = refuses(await snapshot(env, 'before', output), retake);
    assert.deepEqual(result.kinds, ['inspect'], 'no SQL was sent');
    assert.deepEqual(readState(env).snapshots.before, kept);
  }
  await suite(env, 'red');
  env.world.snapshot = psqlOutput({ fn: md5('another reference') });
  refuses(await run(env, 'snapshot', DIR, 'before', '--evidence', 'phase2-2-before-2'), retake);
  assert.match(readFileSync(env.at('evidence/phase2-2-before-2.txt'), 'utf8'), /^mb1-replay refused: snapshot before is the reference every later snapshot is compared with/m);
  assert.deepEqual(readState(env).snapshots.before, kept);
});

/* ---------------------------------------------------------------- Review bbe2fbba finding 1 (phase 1G) ---------------- */

// Finding 1: `migration up --workdir <repository>` read the live repository after the last check, and an exit 0 proved
// nothing. Now shared-apply copies what migration up reads into a runner-owned directory inside the replay, written once and
// pinned in the manifest, so every later command re-hashes it. That is the repository's config.toml, read once and bound to
// 55322 and to the replay's config before it is written, and the seeds and migrations as the replay's own pinned copies (the
// bytes the replay ran). The CLI gets that copy as its workdir; its status for the copy must name 55321 and 127.0.0.1:55322;
// every guard runs on the copy immediately before the apply and again after it, as a STOP; the attempt is on disk before the
// CLI starts; and exit 0 needs a read-only 55321 snapshot equal to the replay's after snapshot.
const STAGED = ['supabase/config.toml', 'supabase/development-catalogue.sql', 'supabase/seed.sql', ...MIGRATIONS.map((name) => `supabase/migrations/${name}`)].sort();
const UNKNOWN = `what 55321 applied is unknown, so shared-apply never runs again: ${INCIDENT}`; // SF-7b L4
test('review bbe2fbba finding 1: migration up runs from a runner-owned, manifest-pinned staging copy, never the repository', async (t) => {
  const env = setup(t);
  await atSharedApply(env);
  const real = env.at(`private${DIR}`);
  const staged = (rel) => join(real, 'shared-apply', rel);
  const pins = () => JSON.parse(readFileSync(join(real, MANIFEST), 'utf8')).files;
  const stagedLine = (how) => new RegExp(`^# shared-apply input ${how}: migration up runs from /tmp/fitlog-mb1-replay-20261026/shared-apply, never the repository; 19 file\\(s\\) pinned in manifest\\.json$`, 'm');

  // The staged input's status names another stack: refused before migration up, and no attempt is recorded. The copy is
  // written by the first run and stays, pinned; the second run verifies it unchanged and writes nothing.
  for (const [field, value, how, reason] of [
    ['stagedApi', REPLAY_API_URL, 'staged', /^mb1-replay refused: the staged shared-apply input answers at http:\/\/127\.0\.0\.1:56421, not http:\/\/127\.0\.0\.1:55321; apply nothing\n$/],
    ['stagedDb', env.world.sharedDb.replace(':55322', ':56422'), 'already staged, verified unchanged', /^mb1-replay refused: the staged shared-apply input's database is not at 127\.0\.0\.1:55322; its DB_URL is not printed, because it holds credentials; apply nothing\n$/],
  ]) {
    env.world[field] = value;
    const result = refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM, '--evidence', 'phase2-6-apply-staged'), reason);
    env.world[field] = null;
    assert.deepEqual(result.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'inspect'], field);
    assert.match(result.out, stagedLine(how), field);
    assert.equal(readState(env).sharedApplyAttempted, undefined, field);
    assert.deepEqual(leaks(`${result.out}${result.err}${readFileSync(env.at('evidence/phase2-6-apply-staged.txt'), 'utf8')}`), [], field);
    unlinkSync(env.at('evidence/phase2-6-apply-staged.txt'));
  }
  assert.deepEqual(listFiles(join(real, 'shared-apply')), STAGED);
  assert.deepEqual(readFileSync(staged('supabase/config.toml')), repo('supabase/config.toml'));
  for (const rel of STAGED.filter((rel) => rel !== 'supabase/config.toml')) assert.deepEqual(readFileSync(staged(rel)), readFileSync(join(real, rel)), rel);
  assert.equal(sha256(readFileSync(staged(`supabase/migrations/${CANDIDATE}`))), REVIEWED_CANDIDATE);
  for (const rel of STAGED) assert.equal(pins()[`shared-apply/${rel}`], sha256(readFileSync(staged(rel))), rel);

  // Once staged, the copy is immutable. An edit is refused by every command, because the manifest re-hashes it ...
  const victim = staged(`supabase/migrations/${BASE[3]}`);
  const original = readFileSync(victim);
  writeFileSync(victim, 'select 1;\n');
  for (const argv of [['check', DIR], ['shared-snapshot', DIR, 'after'], ['shared-apply', DIR, ...SHARED_CONFIRM]]) {
    assert.deepEqual(refuses(await run(env, ...argv), new RegExp(`shared-apply/supabase/migrations/${escapeRe(BASE[3])} no longer matches its sha256 in manifest\\.json`)).kinds, [], argv[0]);
  }
  // ... an edit re-pinned in the manifest is not what would be staged now, so nothing applies ...
  const keptManifest = readFileSync(join(real, MANIFEST));
  writeFileSync(join(real, MANIFEST), JSON.stringify({ ...JSON.parse(keptManifest.toString('utf8')), files: { ...pins(), [`shared-apply/supabase/migrations/${BASE[3]}`]: sha256('select 1;\n') } }));
  const repinned = refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), new RegExp(`^mb1-replay refused: the staged shared-apply input differs from what would be staged now \\(shared-apply/supabase/migrations/${escapeRe(BASE[3])}\\); a staged copy is never rewritten: apply nothing\\n$`));
  assert.deepEqual(repinned.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'inspect']);
  writeFileSync(victim, original);
  writeFileSync(join(real, MANIFEST), keptManifest);
  // ... and an entry the runner did not stage stops every command.
  writeFileSync(staged('supabase/config.json'), '{"db":{"port":56422}}\n');
  assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), /holds entries this runner did not create: shared-apply\/supabase\/config\.json; nothing runs on it and nothing was removed/).kinds, []);
  unlinkSync(staged('supabase/config.json'));

  // A change to the actual input while the staged status call runs: the recheck immediately before migration up refuses it.
  const candidate = staged(`supabase/migrations/${CANDIDATE}`);
  const keptCandidate = readFileSync(candidate);
  const config = repo('supabase/config.toml');
  const late = [
    ['a staged migration edited', () => writeFileSync(victim, 'select 1;\n'), () => writeFileSync(victim, original), new RegExp(`^mb1-replay refused: shared-apply/supabase/migrations/${escapeRe(BASE[3])} no longer matches its sha256 in manifest\\.json; apply nothing\\n$`)],
    ['the staged candidate edited', () => writeFileSync(candidate, `${keptCandidate}grant all on public.profiles to anon;\n`), () => writeFileSync(candidate, keptCandidate), new RegExp(`^mb1-replay refused: shared-apply/supabase/migrations/${escapeRe(CANDIDATE)} no longer matches its sha256 in manifest\\.json; apply nothing\\n$`)],
    ['the staged [db] port moved', () => writeFileSync(staged('supabase/config.toml'), config.toString('utf8').replace('port = 55322', 'port = 56422')), () => writeFileSync(staged('supabase/config.toml'), config), /^mb1-replay refused: shared-apply\/supabase\/config\.toml no longer matches its sha256 in manifest\.json; the staged shared-apply\/supabase\/config\.toml sets \[db\] port 56422, not 55322, where its status DB_URL must be; migration up --local connects to the config's port; apply nothing\n$/],
    ['a config.json planted in the staged workdir', () => writeFileSync(staged('supabase/config.json'), '{"db":{"port":56422}}\n'), () => unlinkSync(staged('supabase/config.json')), new RegExp(`^mb1-replay refused: ${escapeRe(DIR)} holds entries this runner did not create: shared-apply/supabase/config\\.json; apply nothing\\n$`)],
    ['a staged file replaced by a link', () => { unlinkSync(victim); symlinkSync(join(real, `supabase/migrations/${BASE[3]}`), victim); }, () => { unlinkSync(victim); writeFileSync(victim, original); }, new RegExp(`^mb1-replay refused: ${escapeRe(DIR)} holds entries this runner did not create: shared-apply/supabase/migrations/${escapeRe(BASE[3])}; shared-apply/supabase/migrations/${escapeRe(BASE[3])} is missing or not a plain file; apply nothing\\n$`)],
    ['a .env file planted in the staged workdir', () => writeFileSync(staged('.env'), 'SUPABASE_DB_PORT=56422\n'), () => unlinkSync(staged('.env')), envRefusal([`/private${STAGING}/.env`, `${STAGING}/.env`])],
  ];
  for (const [label, change, undo, reason] of late) {
    env.world.onStatus = change;
    const result = refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), reason);
    env.world.onStatus = null;
    undo();
    assert.deepEqual(result.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'inspect'], `${label}: migration up ran`);
    assert.equal(readState(env).sharedApplyAttempted, undefined, label);
  }

  // Nothing changed: migration up runs once, from the staged copy, which holds exactly the staged files while it runs.
  let seen = null;
  env.world.onMigrate = (w, workdir) => { if (workdir === STAGING) seen = { files: listFiles(join(real, 'shared-apply')), attempted: readState(env).sharedApplyAttempted }; };
  const apply = passes(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM, '--evidence', 'phase2-6-apply'), 'shared-apply');
  env.world.onMigrate = null;
  assert.deepEqual(apply.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'binding', 'inspect-id', 'migration up', 'binding', 'inspect-id', 'psql-read', 'inspect-id', 'inspect']);
  const calls = env.world.calls.slice(-apply.kinds.length);
  assert.deepEqual(calls[6].args, [SUPABASE_BIN, 'status', '-o', 'json', '--workdir', STAGING]);
  assert.deepEqual(calls[7].args, [SUPABASE_BIN, 'migration', 'list', '--local', '--workdir', STAGING]);
  assert.deepEqual(calls[10].args, [SUPABASE_BIN, 'migration', 'up', '--local', '--workdir', STAGING]);
  assert.ok(!env.world.calls.some((call) => kind(call) === 'migration up' && call.args.at(-1) === REPO_ROOT), 'migration up never ran on the repository');
  assert.deepEqual(seen, { files: STAGED, attempted: { at: env.clock, workdir: 'shared-apply' } }, 'while migration up ran, its workdir held exactly the staged files, and the attempt was already on disk');
  assert.match(apply.out, stagedLine('already staged, verified unchanged'));
  assert.match(apply.out, new RegExp(`^${sha256(config)}  shared-apply/supabase/config\\.toml \\(the repository's config\\.toml, bound to 55322 and to the replay's config\\)$`, 'm'));
  assert.match(apply.out, new RegExp(`^${REVIEWED_CANDIDATE}  shared-apply/supabase/migrations/${escapeRe(CANDIDATE)} \\(the replay's pinned copy\\)$`, 'm'));
  assert.match(apply.out, /^# the staged input resolves to http:\/\/127\.0\.0\.1:55321 with its database at 127\.0\.0\.1:55322$/m);
  assert.match(apply.out, /^# apply attempt recorded in state\.json before migration up starts: shared-apply never runs again on this replay$/m);
  assert.deepEqual(leaks(`${apply.out}${readFileSync(env.at('evidence/phase2-6-apply.txt'), 'utf8')}`), []);
  // The staged copy is the runner's own: teardown removes it with the rest, one entry at a time.
  passes(await run(env, 'retain', DIR), 'retain');
  passes(await run(env, 'teardown', DIR, ...CONFIRM), 'teardown');
  assert.equal(existsSync(real), false);
});

test('review bbe2fbba finding 1: the attempt is on disk before migration up starts, so no outcome allows another apply, and the read-only shared-snapshot after stays allowed', async (t) => {
  const differentAfter = psqlOutput({ readQual: GUARDED, migrations: MIGRATIONS, statements: { [CANDIDATE]: md5('other statements') } });
  for (const [label, world, stop, afterCode] of [
    ['a timeout', { migrateResult: { status: null, stdout: '', stderr: '', error: 'ETIMEDOUT' } }, 'migration up did not finish \\(ETIMEDOUT\\)', 0],
    ['exit 1', { migrateResult: failed('Error: failed to connect to postgres') }, 'migration up exited 1', 0],
    ['an unexpected migration', { migrateResult: ok(`Applying migration 29991231235959_other.sql...\nApplying migration ${CANDIDATE}...\n`) }, `55321 applied 29991231235959_other\\.sql, ${escapeRe(CANDIDATE)}, not only ${escapeRe(CANDIDATE)}`, 0],
    ["55321 not equal to the replay's after snapshot", { afterApply: differentAfter }, "55321 does not equal the replay's after snapshot after migration up", 1],
  ]) {
    const env = setup(t);
    await atSharedApply(env);
    Object.assign(env.world, world);
    let during = null;
    env.world.onMigrate = (w, workdir) => { if (workdir === STAGING) during = readState(env).sharedApplyAttempted; };
    const result = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM, '--evidence', 'phase2-6-apply');
    Object.assign(env.world, { onMigrate: null, migrateResult: null });
    assert.equal(result.code, 1, label);
    assert.equal(result.err, '', `${label}: a STOP line, not a refusal`);
    assert.match(result.out, new RegExp(`^# STOP: ${stop}; ${UNKNOWN}$`, 'm'), label);
    assert.match(readFileSync(env.at('evidence/phase2-6-apply.txt'), 'utf8'), new RegExp(`^# STOP: ${stop}; `, 'm'), label);
    if (afterCode) assert.match(result.out, /changes from after are \[P3\.20261026040045\.statements_md5\], expected \[none\]/, `${label}: P3 statements_md5 is compared`);
    assert.deepEqual(during, { at: env.clock, workdir: 'shared-apply' }, `${label}: the attempt was on disk before the CLI ran`);
    const state = readState(env);
    assert.deepEqual(state.sharedApplyAttempted, during, label);
    assert.equal(state.sharedApplied, false, label);
    assert.equal(state.snapshots['55321-after'], undefined, label);
    // No outcome allows another apply or a new before snapshot, and shared-suite needs a verified apply.
    assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), ATTEMPTED).kinds, ['inspect'], label);
    assert.deepEqual(refuses(await run(env, 'shared-snapshot', DIR, 'before'), /^mb1-replay refused: a shared-apply was attempted at \d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z, so 55321 may hold the candidate: take shared-snapshot after instead\n$/).kinds, ['inspect'], label);
    env.clock += 75_000;
    assert.deepEqual(refuses(await run(env, 'shared-suite', DIR), /^mb1-replay refused: shared-suite needs shared-apply and the 55321-after snapshot first\n$/).kinds, ['inspect'], label);
    // The read-only shared-snapshot after runs whatever happened, and shows what 55321 holds.
    const after = await run(env, 'shared-snapshot', DIR, 'after');
    assert.deepEqual(after.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read'], label);
    assert.equal(after.code, afterCode, label);
  }
});

test('review bbe2fbba finding 1: after migration up every guard runs again as a STOP, the staged input included, and exit 0 needs 55321 equal to the replay after snapshot', async (t) => {
  const env = setup(t);
  await atSharedApply(env);
  const real = env.at(`private${DIR}`);
  const staged = (rel) => join(real, 'shared-apply', rel);
  const repoRoot = REPO_ROOT.replace(/\/$/, '');
  mkdirSync(env.at(`${repoRoot}/supabase`), { recursive: true });
  const runnerEnv = { ...CLEAN_ENV };
  let drift = {};
  env.deps = { env: runnerEnv, readRepo: (rel) => drift.readRepo?.(rel) ?? repo(rel), listMigrations: () => drift.list ?? MIGRATIONS };
  // Stage the copy first (a run refused at the staged status), so the cases below can change it.
  env.world.stagedApi = REPLAY_API_URL;
  refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), /the staged shared-apply input answers at/);
  env.world.stagedApi = null;
  const ready = readFileSync(env.at(`private${DIR}/${STATE}`));
  const victim = staged(`supabase/migrations/${BASE[3]}`);
  const original = readFileSync(victim);
  const plant = (path, text) => [() => writeFileSync(path, text), () => unlinkSync(path)];
  const late = [
    ['a .env file in the repository', ...plant(env.at(`${repoRoot}/supabase/.env`), 'SUPABASE_DB_PORT=56422\n'), `a \\.env file the Supabase CLI may load is present: ${escapeRe(`${repoRoot}/supabase/.env`)}; nothing runs while one is there \\(names only: no file was read, changed or removed\\)`],
    ['a .env file in the staged workdir', ...plant(staged('supabase/.env'), 'SUPABASE_DB_PORT=56422\n'), `a \\.env file the Supabase CLI may load is present: ${escapeRe(`/private${STAGING}/supabase/.env`)}, ${escapeRe(`${STAGING}/supabase/.env`)}; nothing runs while one is there \\(names only: no file was read, changed or removed\\)`],
    ['a SUPABASE_* variable', () => { runnerEnv.SUPABASE_DB_PORT = '56422'; }, () => { delete runnerEnv.SUPABASE_DB_PORT; }, "the environment sets SUPABASE_DB_PORT; a SUPABASE_\\* variable can override the replay's config\\.toml \\(project_id included\\), so nothing runs until it is unset \\(names only; no value is printed\\)"],
    ['a config.json in the repository', ...plant(env.at(`${repoRoot}/supabase/config.json`), '{"db":{"port":56422}}\n'), `${escapeRe(`${repoRoot}/supabase/config.json`)} is present; the Supabase CLI prefers config\\.json to config\\.toml, so nothing runs on 55321 while it is there \\(names only: no file was read, changed or removed\\)`],
    ['the repository [db] port moved', () => { drift = { readRepo: (rel) => (rel === 'supabase/config.toml' ? Buffer.from(repo(rel).toString('utf8').replace('port = 55322', 'port = 56422')) : undefined) }; }, () => { drift = {}; }, "the repository's supabase/config\\.toml sets \\[db\\] port 56422, not 55322, where its status DB_URL must be; migration up --local connects to the config's port"],
    ['a migration added to the repository', () => { drift = { list: [...MIGRATIONS, '29991231235959_b1_linked_policies.sql'] }; }, () => { drift = {}; }, "the repository's migrations differ from the 16 the replay ran \\(29991231235959_b1_linked_policies\\.sql\\)"],
    ['a staged migration edited', () => writeFileSync(victim, 'select 1;\n'), () => writeFileSync(victim, original), `shared-apply/supabase/migrations/${escapeRe(BASE[3])} no longer matches its sha256 in manifest\\.json`],
    ['a migration planted in the staged workdir', ...plant(staged('supabase/migrations/29991231235959_extra.sql'), 'grant all on public.profiles to anon;\n'), `${escapeRe(DIR)} holds entries this runner did not create: shared-apply/supabase/migrations/29991231235959_extra\\.sql`],
  ];
  for (const [label, change, undo, problem] of late) {
    writeFileSync(env.at(`private${DIR}/${STATE}`), ready); // as after the coordinator's review: no attempt (test harness only)
    env.world.snapshot = SNAPSHOTS.before;
    env.world.onMigrate = (w, workdir) => { if (workdir === STAGING) change(); };
    const result = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM);
    env.world.onMigrate = null;
    undo();
    assert.equal(result.code, 1, label);
    assert.equal(result.err, '', `${label}: a STOP line, not a refusal`);
    assert.deepEqual(result.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'binding', 'inspect-id', 'migration up', 'inspect'], `${label}: no after snapshot, and no exit 0`);
    assert.match(result.out, new RegExp(`^# STOP: after migration up: ${problem}; ${UNKNOWN}$`, 'm'), label);
    assert.equal(readState(env).sharedApplied, false, label);
    assert.deepEqual(readState(env).sharedApplyAttempted, { at: env.clock, workdir: 'shared-apply' }, label);
    assert.deepEqual(leaks(`${result.out}${result.err}`), [], label);
  }
  // Nothing changed: every guard holds after the apply too, and 55321 equals the replay's after snapshot.
  writeFileSync(env.at(`private${DIR}/${STATE}`), ready);
  env.world.snapshot = SNAPSHOTS.before;
  const apply = passes(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), 'shared-apply');
  assert.match(apply.out, /^# rechecked after migration up: no SUPABASE_\* variable, no \.env file, no config\.json, \[db\] port 55322 and the replay's config, the pinned candidate, and the 16 migration\(s\) the replay ran$/m);
  assert.match(apply.out, /^# rechecked after migration up, the staged input it reads: exactly the 19 file\(s\) pinned under shared-apply\/, each sha256 equal, the staged config bound to 55322 and the staged candidate pinned$/m);
  assert.match(apply.out, /^# snapshot 55321-after: 16 applied migration\(s\); no rule broken$/m);
  assert.match(apply.out, /^# 55321 after migration up: equal to the replay's after snapshot \(P1, P2 and P3 with each statements_md5\)$/m);
  const state = readState(env);
  assert.equal(state.sharedApplied, true);
  assert.equal(state.snapshots['55321-after'].generation, 2);
  env.clock += 75_000;
  env.suites.push({ log: LOGS.green, code: 0 });
  passes(await run(env, 'shared-suite', DIR), 'shared-suite on the verified apply');
});
