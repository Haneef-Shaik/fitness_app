// MB-1 replay runner tests: the migration list (F5), the shared stack, CLI verification, read-only SQL, plan order and the 55321 gate. Moved unchanged from mb1-replay.test.mjs in SF-0
// (docs/plan/runs/MB-1/sf0.md); the shared harness is mb1-replay-test-harness.mjs.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { REPO_ROOT } from './local-stack.mjs';
import { CANDIDATE, READ_ONLY_PROOF, sha256 } from './mb1-replay-evidence.mjs';
import { MANIFEST, REPLAY_API_URL } from './mb1-replay-target.mjs';
import {
  atGreen, BASE, bindingOutput, CLEAN_ENV, cliTable, CONFIRM, CONTAINER, dbIdOf, DIR, FAKE, HELP, leaks, LOGS, md5, MIGRATIONS, NODE, passes, psqlOutput, readState, refuses, repo,
  REVIEWED_CANDIDATE, REVIEWED_PRECONDITIONS, run, setup, SHARED_CONFIRM, snapshot, SNAPSHOTS, STAGING, suite, SUPABASE_BIN, toSharedApply, version,
} from './mb1-replay-test-harness.mjs';

/* ---------------------------------------------------------------- The migration list (F5) ----------------------------- */

const bothRows = (files) => files.map((file) => ({ local: version(file), remote: version(file) }));
test('migrations keeps the rows CLI 2.121.0 prints and proves them against the manifest; an empty or unreadable list refuses at CLI exit 0', async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  const listed = passes(await run(env, 'migrations', DIR, '--evidence', 'phase2-1-migrations'), 'migrations');
  assert.equal(listed.out.match(/^ {3}`\d{14}` \| `\d{14}` \| `\d{4}-\d\d-\d\d \d\d:\d\d:\d\d`$/gm).length, 15);
  assert.match(listed.out, /^# 1 line\(s\) withheld \(not on the migrations allowlist, or secret-shaped\)$/m);
  assert.match(listed.out, /^# migration list: 15 row\(s\), equal to the manifest's 15 migration\(s\), 15 of them applied$/m);
  assert.deepEqual(leaks(readFileSync(env.at('evidence/phase2-1-migrations.txt'), 'utf8')), []);
  const refusals = [
    // The CLI exits 0 with an empty table: refused, never an exit 0.
    [cliTable([]), /^mb1-replay refused: the migration list does not prove the manifest's migrations: no migration row was recognised, so the list proves nothing\n$/],
    // The hand-written row shape the runner was first built on, which 2.121.0 cannot print.
    ['  Local          | Remote         | Time (UTC)\n  ---------------|----------------|---------------------\n  20261017161031 | 20261017161031 | 2026-10-17 16:10:31\n', /: no migration row was recognised, so the list proves nothing; 1 table-shaped line\(s\) were not recognised and stay withheld\n$/],
    // A committed migration the database has not applied, and a migration the manifest does not hold.
    [cliTable(BASE.map((file, at) => ({ local: version(file), remote: at === 3 ? '' : version(file) }))), new RegExp(`: ${version(BASE[3])} is listed local only, expected local and remote\\n$`)],
    [cliTable([...bothRows(BASE), { local: '', remote: '29991231235959' }]), /: the list has 16 row\(s\); the manifest expects 15; 29991231235959 is listed remote only, but it is not in the manifest\n$/],
    // A row holding a key: withheld, and the list refused.
    [`${cliTable(bothRows(BASE))}   \`20261017161031\` | ${FAKE.secret} | \`2026-10-17 16:10:31\`\n`, /: 1 table-shaped line\(s\) were not recognised and stay withheld\n$/],
  ];
  for (const [index, [listing, reason]] of refusals.entries()) {
    env.world.listing = listing;
    const name = `phase2-1-migrations-${index + 2}`;
    const result = refuses(await run(env, 'migrations', DIR, '--evidence', name), reason);
    assert.deepEqual(result.kinds, ['inspect', 'status', 'names', 'migration list'], name);
    const saved = readFileSync(env.at(`evidence/${name}.txt`), 'utf8');
    assert.match(saved, /^# mb1-replay migrations: exit 1\nmb1-replay refused: the migration list does not prove the manifest's migrations: /m);
    assert.deepEqual(leaks(`${result.out}${result.err}${saved}`), [], name);
  }
  // After add-candidate the candidate is a local file only; after migrate it is applied as well.
  env.world.listing = null;
  passes(await snapshot(env, 'before'), 'snapshot before');
  await suite(env, 'red');
  passes(await run(env, 'add-candidate', DIR), 'add-candidate');
  const added = passes(await run(env, 'migrations', DIR), 'migrations after add-candidate');
  assert.match(added.out, new RegExp(`^ {3}\`${version(CANDIDATE)}\` \\| \` \` {14}\\| \`2026-10-26 04:00:45\`$`, 'm'));
  assert.match(added.out, /^# migration list: 16 row\(s\), equal to the manifest's 16 migration\(s\), 15 of them applied$/m);
  env.world.listing = cliTable(bothRows(MIGRATIONS));
  refuses(await run(env, 'migrations', DIR), new RegExp(`: ${version(CANDIDATE)} is listed local and remote, expected local only\\n$`));
  env.world.listing = null;
  passes(await run(env, 'migrate', DIR), 'migrate');
  assert.match(passes(await run(env, 'migrations', DIR), 'migrations after migrate').out, /^# migration list: 16 row\(s\), equal to the manifest's 16 migration\(s\), 16 of them applied$/m);
});

test('the shared stack changing stops the runner, whether before a command or during it', async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  env.world.onStart = (w) => { w.shared = 'true 2026-10-26T05:00:00.000000000Z'; };
  const during = refuses(await run(env, 'start', DIR), /STOP: the shared 55321 database container changed after start \(recorded "true 2026-10-26T01:00:00\.123456789Z", now "true 2026-10-26T05:00:00\.000000000Z"\)/);
  assert.equal(during.kinds.at(-1), 'inspect');
  const before = refuses(await run(env, 'migrations', DIR), /STOP: the shared 55321 database container changed before migrations/);
  assert.deepEqual(before.kinds, ['inspect']);
  env.world.shared = 'absent';
  refuses(await run(env, 'check', DIR), /now "absent"/);
  // An inspect that a timeout or Ctrl-C stopped says nothing about the container: it is refused as unfinished, not "absent".
  env.world.inspect = { status: null, stdout: '', stderr: '', error: 'SIGINT' };
  refuses(await run(env, 'check', DIR), /^mb1-replay refused: docker inspect of supabase_db_fitlog_rebuild_20261017 did not finish \(SIGINT\); the shared stack could not be checked\n$/);
});

test('the CLI must be verified first, a missing flag blocks it, and stop, teardown and shared-apply each need their own token', async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  assert.deepEqual(refuses(await run(env, 'start', DIR), /run verify-cli first: no Supabase command runs before its flags are found in the CLI's own help/).kinds, ['inspect']);
  for (const [flag, line] of [['      --no-backup\n', 'MISSING --no-backup'], ['      --project-id string\n', 'MISSING --project-id']]) {
    env.world.help = HELP.replace(flag, '');
    const missing = await run(env, 'verify-cli', DIR);
    assert.equal(missing.code, 1);
    assert.match(missing.out, new RegExp(`^supabase 2\\.121\\.0 stop --help: ${line}$`, 'm'));
    refuses(await run(env, 'start', DIR), /run verify-cli first/);
  }
  env.world.help = HELP;
  const verified = passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  assert.match(verified.out, /^supabase 2\.121\.0 stop --help: lists --project-id, --no-backup, --workdir$/m);
  passes(await run(env, 'start', DIR), 'start');
  for (const argv of [[], ['--confirm'], ['--confirm', 'fitlog-mb1-replay-20261027'], ['--confirm', DIR], SHARED_CONFIRM]) {
    assert.deepEqual(refuses(await run(env, 'stop', DIR, ...argv), /stop needs --confirm fitlog-mb1-replay-20261026/).kinds, ['inspect']);
    assert.deepEqual(refuses(await run(env, 'teardown', DIR, ...argv), /teardown needs --confirm fitlog-mb1-replay-20261026/).kinds, ['inspect']);
  }
  // Review a102fb68 finding 4: the only write to 55321 has a token of its own, which stop's token does not satisfy.
  for (const argv of [[], ['--confirm'], CONFIRM, ['--confirm', 'fitlog-mb1-shared-apply-20261027']]) {
    assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...argv), /shared-apply needs --confirm fitlog-mb1-shared-apply-20261026/).kinds, ['inspect']);
  }
  assert.equal(env.world.running, true);
});

/* ---------------------------------------------------------------- Read-only SQL and plan order ------------------------ */

test('the read-only runner sends only the pinned preconditions file, with the session default read-only and its proof first', async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  // A session that is not read-only fails the snapshot and records nothing (the before snapshot, once taken, is never
  // retaken: review bbe2fbba finding 4, below).
  const notReadOnly = await snapshot(env, 'before', psqlOutput({ readOnly: 'off|on' }));
  assert.equal(notReadOnly.code, 1);
  assert.match(notReadOnly.out, /the session was not read-only: default_transaction_read_only=off/);
  assert.deepEqual(readState(env).snapshots, {});
  const result = passes(await snapshot(env, 'before'), 'snapshot before');
  const call = env.world.calls.at(-1);
  assert.deepEqual(call.args, ['exec', '-i', '-e', 'PGOPTIONS=-c default_transaction_read_only=on', CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1', '-A', '-F', '|', '-c', READ_ONLY_PROOF, '-f', '-']);
  const pinned = readFileSync(env.at(`private${DIR}/sql/preconditions.sql`));
  assert.deepEqual(Buffer.from(call.options.input), pinned);
  assert.match(result.out, new RegExp(`^# sql/preconditions\\.sql sha256 ${sha256(pinned)}, as manifest\\.json records and the reviewed constant; read-only check passed$`, 'm'));
  assert.match(result.out, /^# session: default_transaction_read_only=on, transaction_read_only=on$/m);
  assert.match(result.out, /^# snapshot before: 15 applied migration\(s\); no rule broken$/m);
  assert.equal(readState(env).snapshots.before.generation, 1);
  writeFileSync(env.at(`private${DIR}/sql/preconditions.sql`), `${pinned.toString('utf8')}\n`);
  assert.deepEqual(refuses(await snapshot(env, 'before'), /sql\/preconditions\.sql no longer matches its sha256 in manifest\.json/).kinds, []);
});

// Review a102fb68 finding 3: the manifest only vouches for itself, so the runner holds the reviewed block's sha256 as a
// constant and refuses any other block, at prepare and before every snapshot (the replay's and 55321's).
test('prepare and every snapshot use only the reviewed preconditions block, whose sha256 the runner holds as a constant', async (t) => {
  const phase1 = repo('docs/plan/runs/MB-1/phase1.md').toString('utf8');
  const edited = phase1.replace('\nrollback;\n```', '\nselect now();\nrollback;\n```');
  assert.notEqual(edited, phase1);
  const env = setup(t);
  env.deps = { readRepo: (rel) => (rel === 'docs/plan/runs/MB-1/phase1.md' ? Buffer.from(edited) : repo(rel)) };
  const refusedPrepare = refuses(await run(env, 'prepare', DIR), new RegExp(`phase1\\.md's preconditions block is not the reviewed one \\(sha256 [0-9a-f]{64}, reviewed ${REVIEWED_PRECONDITIONS}\\); nothing was prepared`));
  assert.deepEqual(refusedPrepare.kinds, ['inspect']);
  assert.equal(existsSync(env.at(`private${DIR}`)), false);
  env.deps = {};
  const prepared = passes(await run(env, 'prepare', DIR), 'prepare');
  assert.match(prepared.out, new RegExp(`^${REVIEWED_PRECONDITIONS}  sql/preconditions\\.sql \\(the reviewed phase1\\.md block; its sha256 is the runner's constant\\)$`, 'm'));
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  // An edited file re-pinned in the manifest passes the manifest check, but not the constant.
  const real = env.at(`private${DIR}`);
  const sql = Buffer.from(readFileSync(join(real, 'sql/preconditions.sql'), 'utf8').replace('\nrollback;\n', '\nselect now();\nrollback;\n'));
  writeFileSync(join(real, 'sql/preconditions.sql'), sql);
  const manifest = JSON.parse(readFileSync(join(real, MANIFEST), 'utf8'));
  writeFileSync(join(real, MANIFEST), JSON.stringify({ ...manifest, files: { ...manifest.files, 'sql/preconditions.sql': sha256(sql) } }));
  env.world.snapshot = SNAPSHOTS.before;
  for (const argv of [['snapshot', DIR, 'before'], ['shared-snapshot', DIR, 'before']]) {
    const result = refuses(await run(env, ...argv), new RegExp(`sql/preconditions\\.sql is not the reviewed block \\(sha256 ${sha256(sql)}, reviewed ${REVIEWED_PRECONDITIONS}\\); no snapshot was taken`));
    assert.ok(!result.kinds.includes('psql-read'), `${argv.join(' ')} sent SQL`);
  }
});

test('the replay runs in plan order, and a mutation counts only after its snapshot proves it applied', async (t) => {
  const env = setup(t);
  refuses(await run(env, 'prepare', DIR).then(() => run(env, 'suite', DIR, 'red')), /suite red needs the before snapshot first/);
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  refuses(await run(env, 'migrate', DIR), /migrate needs add-candidate first/);
  passes(await snapshot(env, 'before'), 'snapshot before');
  await suite(env, 'red');
  assert.deepEqual(env.suiteCalls.at(-1), { projectDir: DIR, expectedApiUrl: REPLAY_API_URL });
  // Review a102fb68 findings 1, 2 and 5: the suite gets the runner's signals, an exit that does nothing, and the runner's
  // own status runner and CLI, so its cleanup output is printed and recorded and its status call is guarded like the rest.
  const wiring = env.suiteWiring.at(-1);
  assert.equal(wiring.signals, env.signals);
  assert.deepEqual(wiring.cli, [NODE, SUPABASE_BIN]);
  assert.equal(typeof wiring.exit, 'function');
  const exits = [];
  t.mock.method(process, 'exit', (code) => { exits.push(code); });
  assert.equal(wiring.exit(130), undefined);
  assert.deepEqual(exits, [], "the suite's exit does nothing");
  assert.equal(typeof wiring.status, 'function');
  const status = await wiring.status(NODE, [SUPABASE_BIN, 'status', '-o', 'json', '--workdir', DIR], { cwd: REPO_ROOT });
  assert.equal(JSON.parse(status.stdout).API_URL, REPLAY_API_URL);
  assert.deepEqual(env.world.calls.at(-1).options.env, CLEAN_ENV);
  assert.equal(readState(env).ban, 'live');
  passes(await run(env, 'add-candidate', DIR), 'add-candidate');
  assert.equal(sha256(readFileSync(env.at(`private${DIR}/supabase/migrations/${CANDIDATE}`))), sha256(repo(`supabase/migrations/${CANDIDATE}`)));
  passes(await run(env, 'migrate', DIR), 'migrate');
  passes(await snapshot(env, 'after'), 'snapshot after');
  await suite(env, 'green');
  passes(await run(env, 'mutate', DIR, 'm1'), 'mutate m1');
  assert.deepEqual(env.world.writes.at(-1), { container: CONTAINER, input: readFileSync(env.at(`private${DIR}/sql/m1.sql`)) });
  refuses(await run(env, 'suite', DIR, 'm1'), /suite m1 needs the m1 snapshot to prove the mutation applied/);
  const silent = await snapshot(env, 'm1', SNAPSHOTS.after);
  assert.equal(silent.code, 1);
  assert.match(silent.out, /changes from after are \[none\], expected \[P2\.profile_read\.qual\]/);
  refuses(await run(env, 'suite', DIR, 'm1'), /needs the m1 snapshot/);
  passes(await snapshot(env, 'm1'), 'snapshot m1');
  await suite(env, 'm1');
  refuses(await run(env, 'mutate', DIR, 'm2'), /mutate m2 needs no mutation applied \(m1 is\)/);
  refuses(await run(env, 'mutate', DIR, 'restore-member-active'), /restore-member-active restores m2 or m3, not m1/);
  passes(await run(env, 'mutate', DIR, 'restore-m1'), 'restore m1');
  assert.deepEqual(env.world.writes.at(-1).input, readFileSync(env.at(`private${DIR}/supabase/migrations/${CANDIDATE}`)));
  refuses(await run(env, 'mutate', DIR, 'm2'), /mutate m2 needs the last restore proved by a restored snapshot/);
  refuses(await run(env, 'suite', DIR, 'green'), /suite green needs the last restore proved by a restored snapshot/);
  assert.equal((await snapshot(env, 'restored', SNAPSHOTS.m1)).code, 1);
  passes(await snapshot(env, 'restored', SNAPSHOTS.after), 'snapshot restored');
  for (const mutation of ['m2', 'm3']) {
    passes(await run(env, 'mutate', DIR, mutation), `mutate ${mutation}`);
    passes(await snapshot(env, mutation), `snapshot ${mutation}`);
    await suite(env, mutation);
    passes(await run(env, 'mutate', DIR, 'restore-member-active'), `restore ${mutation}`);
    passes(await snapshot(env, 'restored', SNAPSHOTS.after), `restored after ${mutation}`);
  }
  refuses(await run(env, 'mutate', DIR, 'm1'), /m1 was already applied once/);
  await suite(env, 'green');
  passes(await run(env, 'stop', DIR, ...CONFIRM), 'stop');
  assert.equal(readState(env).generation, 2);
  passes(await run(env, 'start', DIR), 'fresh start with 16');
  refuses(await run(env, 'suite', DIR, 'green'), /suite green needs a fresh16 snapshot of generation 2/);
  passes(await snapshot(env, 'fresh16', SNAPSHOTS.after), 'snapshot fresh16');
  await suite(env, 'green');
  passes(await run(env, 'diff', DIR), 'diff');
  passes(await run(env, 'lint', DIR), 'lint');
  passes(await run(env, 'images', DIR), 'images');
  const state = readState(env);
  assert.deepEqual(state.suites.map((entry) => `${entry.expect}:${entry.ok}:${entry.generation}`), ['red:true:1', 'green:true:1', 'm1:true:1', 'm2:true:1', 'm3:true:1', 'green:true:1', 'green:true:2']);
  assert.deepEqual(state.checks, { diff: { generation: 2, clean: true }, lint: { generation: 2, clean: true }, images: { generation: 2, ok: true } });
});

test('the 55321 apply is gated on every replay proof, its own token and a fresh equal snapshot; 55321 runs only read-only queries and one migration up', async (t) => {
  const env = setup(t);
  await atGreen(env);
  assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), /shared-apply needs every replay proof first; missing: suite m1, suite m2, suite m3, a generation 2 green suite, a clean generation 2 diff, a clean generation 2 lint, matching images, the 55321-before snapshot/).kinds, ['inspect']);
  await toSharedApply(env);
  env.world.snapshot = SNAPSHOTS.after;
  const differs = await run(env, 'shared-snapshot', DIR, 'before');
  assert.equal(differs.code, 1);
  assert.match(differs.out, /changes from before are \[P2\.profile_read\.qual, P3\.\+20261026040045\], expected \[none\]/);
  assert.match(differs.out, /^# 55321 does not match the replay project: STOP and apply nothing$/m);
  env.world.snapshot = SNAPSHOTS.before;
  const sharedBefore = passes(await run(env, 'shared-snapshot', DIR, 'before'), 'shared-snapshot before');
  assert.deepEqual(sharedBefore.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read']);
  // SF-7b (review 2026-10-27T0905Z L2): by the ID the binding proved, never by the name a recreated container would take over.
  assert.equal(env.world.calls.at(-1).args[4], dbIdOf(bindingOutput()));
  assert.notEqual(dbIdOf(bindingOutput()), null);
  // 55321 gets `migration up` from the repository: a migration the replay did not run, or changed bytes, applies nothing.
  // A changed candidate is refused first by its pinned sha256 (review b75d1e73 finding 4), before any byte comparison.
  const changed = Buffer.from('-- changed after the replay\n');
  for (const [deps, reason] of [
    [{ listMigrations: () => [...MIGRATIONS, '29991231235959_b1_linked_policies.sql'] }, /the repository's migrations differ from the 16 the replay ran \(29991231235959_b1_linked_policies\.sql\); apply nothing/],
    [{ readRepo: (rel) => (rel.endsWith(CANDIDATE) ? changed : repo(rel)) }, new RegExp(`supabase/migrations/${CANDIDATE} is not the reviewed candidate \\(sha256 ${sha256(changed)}, reviewed ${REVIEWED_CANDIDATE}\\); apply nothing`)],
  ]) {
    env.deps = deps;
    assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), reason).kinds, ['inspect', 'inspect']);
  }
  // Finding 4's scenario: the candidate is edited after review and replayed, so the replay's copy and manifest carry the
  // edit and every replay proof stands. Only the pinned sha256 stops it reaching 55321.
  const replayCandidate = env.at(`private${DIR}/supabase/migrations/${CANDIDATE}`);
  const manifestPath = env.at(`private${DIR}/${MANIFEST}`);
  const [keptCandidate, keptManifest] = [readFileSync(replayCandidate), readFileSync(manifestPath)];
  const repin = (bytes) => {
    writeFileSync(replayCandidate, bytes);
    const manifest = JSON.parse(keptManifest.toString('utf8'));
    writeFileSync(manifestPath, JSON.stringify({ ...manifest, files: { ...manifest.files, [`supabase/migrations/${CANDIDATE}`]: sha256(bytes) } }));
  };
  const grant = Buffer.from(`${keptCandidate.toString('utf8')}grant all on public.profiles to anon;\n`);
  repin(grant);
  env.deps = { readRepo: (rel) => (rel.endsWith(CANDIDATE) ? grant : repo(rel)) };
  assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), new RegExp(`^mb1-replay refused: supabase/migrations/${CANDIDATE} is not the reviewed candidate \\(sha256 ${sha256(grant)}, reviewed ${REVIEWED_CANDIDATE}\\); apply nothing\\n$`)).kinds, ['inspect', 'inspect']);
  // The pinned candidate in the repository against a replay that ran other bytes: the byte comparison applies nothing.
  env.deps = {};
  assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), new RegExp(`the repository's migrations differ from the 16 the replay ran \\(${CANDIDATE}\\); apply nothing`)).kinds, ['inspect', 'inspect']);
  writeFileSync(replayCandidate, keptCandidate);
  writeFileSync(manifestPath, keptManifest);
  // Review b75d1e73 finding 3: the repository's database must be at 127.0.0.1:55322, or nothing applies.
  const sharedDb = env.world.sharedDb;
  env.world.sharedDb = sharedDb.replace(':55322', ':56322');
  assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), /the repository's database is not at 127\.0\.0\.1:55322/).kinds, ['inspect', 'status', 'inspect']);
  env.world.sharedDb = sharedDb;
  assert.equal(readState(env).sharedApplied, false);
  // Review a102fb68 finding 4: another lane changes member_active() on 55321 after the before snapshot, without a restart
  // (so the pinned start time holds). The fresh read-only snapshot taken inside shared-apply sees it, and nothing applies.
  env.world.snapshot = psqlOutput({ fn: md5('changed by another lane') });
  const drifted = await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM);
  assert.equal(drifted.code, 1);
  assert.deepEqual(drifted.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'inspect']);
  assert.match(drifted.out, /changes from before are \[P1\.fn_definition_md5\], expected \[none\]/);
  assert.match(drifted.out, /^# 55321 changed since its before snapshot, or does not match the replay: STOP and apply nothing$/m);
  assert.equal(readState(env).sharedApplied, false);
  env.world.snapshot = SNAPSHOTS.before;
  const apply = passes(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), 'shared-apply');
  assert.deepEqual(apply.kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read', 'status', 'migration list', 'binding', 'inspect-id', 'migration up', 'binding', 'inspect-id', 'psql-read', 'inspect-id', 'inspect']);
  const [, , , , , fresh, , , , , up, , , after] = env.world.calls.slice(-apply.kinds.length);
  const preconditions = readFileSync(env.at(`private${DIR}/sql/preconditions.sql`));
  assert.deepEqual(fresh.args.slice(0, 5), ['exec', '-i', '-e', 'PGOPTIONS=-c default_transaction_read_only=on', dbIdOf(bindingOutput())]); // SF-7b L2
  assert.deepEqual(Buffer.from(fresh.options.input), preconditions);
  assert.match(apply.out, /^# fresh 55321 snapshot right before the apply: equal to the replay's before snapshot$/m);
  assert.equal(up.command, NODE);
  // Review bbe2fbba finding 1: migration up reads the runner-owned staging copy, never the repository, and exit 0 needs a
  // read-only 55321 snapshot afterwards that equals the replay's after snapshot.
  assert.deepEqual(up.args, [SUPABASE_BIN, 'migration', 'up', '--local', '--workdir', STAGING]);
  assert.deepEqual(after.args.slice(0, 5), ['exec', '-i', '-e', 'PGOPTIONS=-c default_transaction_read_only=on', dbIdOf(bindingOutput())]); // SF-7b L2
  assert.deepEqual(Buffer.from(after.options.input), preconditions);
  assert.match(apply.out, /^# 55321 after migration up: equal to the replay's after snapshot \(P1, P2 and P3 with each statements_md5\)$/m);
  refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), /the candidate was already applied to 55321/);
  env.world.snapshot = SNAPSHOTS.after;
  passes(await run(env, 'shared-snapshot', DIR, 'after'), 'shared-snapshot after');
  env.clock += 75_000;
  env.suites.push({ log: LOGS.green, code: 0 });
  passes(await run(env, 'shared-suite', DIR), 'shared-suite');
  assert.deepEqual(env.suiteCalls.at(-1), {});
  assert.equal(env.suiteWiring.at(-1).signals, env.signals);
  assert.deepEqual(env.world.writes.map(({ container }) => container), [CONTAINER, CONTAINER, CONTAINER, CONTAINER, CONTAINER, CONTAINER], 'every write went to the replay container');
});
