// MB-1 replay runner tests: the target, the owned directory and the guards before every command. Moved unchanged from mb1-replay.test.mjs in SF-0
// (docs/plan/runs/MB-1/sf0.md); the shared harness is mb1-replay-test-harness.mjs.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { REPO_ROOT } from './local-stack.mjs';
import { sha256 } from './mb1-replay-evidence.mjs';
import { MANIFEST, REPLAY_API_URL, SENTINEL, SHARED } from './mb1-replay-target.mjs';
import {
  BASE, CLEAN_ENV, CONFIRM, CONTAINER, DIR, envRefusal, FAKE, leaks, LOCK, NODE, passes, PROJECT, readState, refuses, repo, run, setup, SHARED_CONFIRM, snapshot,
  SNAPSHOTS, STARTED, SUPABASE_BIN,
} from './mb1-replay-test-harness.mjs';

/* ---------------------------------------------------------------- The target and the owned directory ----------------- */

test('every target that is not the literal replay directory is refused before any command runs', async (t) => {
  const env = setup(t);
  for (const dir of ['', ' ', '.', 'tmp/fitlog-mb1-replay-20261026', `${DIR}/`, `/private${DIR}`, '/tmp/../tmp/fitlog-mb1-replay-20261026', '/tmp/fitlog-mb1-replay-2026102',
    '/tmp/fitlog-mb1-replay-20261340', '/tmp/fitlog-mb1-replay-YYYYMMDD', '/tmp/fitlog-ar1-replay-20261026', REPO_ROOT, `${DIR} `, `${DIR}\n`]) {
    for (const op of ['prepare', 'check', 'start', 'migrate', 'stop', 'teardown']) {
      const result = refuses(await run(env, op, dir, ...CONFIRM), /replay directory was given|is not the literal \/tmp\/fitlog-mb1-replay-YYYYMMDD path|is not a calendar date/);
      assert.deepEqual(result.kinds, [], `${op} ${JSON.stringify(dir)} ran a command`);
    }
  }
  refuses(await run(env, 'check'), /usage: node scripts\/backend\/mb1-replay\.mjs <command> \/tmp\/fitlog-mb1-replay-YYYYMMDD/);
  refuses(await run(env, 'reset', DIR), /unknown command reset/);
  assert.deepEqual(readdirSync(env.at('private/tmp')), []);
  assert.equal(env.world.calls.length, 0);
});

test('prepare builds the owned directory once: sentinel, manifest of exact copies, generated SQL, pinned shared stack', async (t) => {
  const env = setup(t);
  const result = passes(await run(env, 'prepare', DIR), 'prepare');
  assert.deepEqual(result.kinds, ['inspect']);
  const real = env.at(`private${DIR}`);
  assert.deepEqual(readdirSync(join(real, 'supabase/migrations')).sort(), BASE);
  for (const name of BASE) assert.equal(sha256(readFileSync(join(real, 'supabase/migrations', name))), sha256(repo(`supabase/migrations/${name}`)), name);
  assert.equal(readFileSync(join(real, SENTINEL), 'utf8'), `${JSON.stringify({ owner: 'fitlog-mb1-replay', dir: DIR, projectId: PROJECT, apiUrl: REPLAY_API_URL })}\n`);
  const manifest = JSON.parse(readFileSync(join(real, MANIFEST), 'utf8'));
  assert.equal(Object.keys(manifest.files).length, 23);
  for (const [rel, hash] of Object.entries(manifest.files)) assert.equal(sha256(readFileSync(join(real, rel))), hash, rel);
  const shared = repo('supabase/config.toml').toString('utf8').split('\n');
  const changed = readFileSync(join(real, 'supabase/config.toml'), 'utf8').split('\n').map((line, index) => [shared[index], line]).filter(([a, b]) => a !== b);
  assert.deepEqual(changed.map(([, line]) => line), [`project_id = "${PROJECT}"`, 'port = 56421', 'port = 56422', 'shadow_port = 56420', 'port = 56429', 'port = 56423', 'port = 56424', 'inspector_port = 8283', 'port = 56427']);
  assert.equal(readState(env).shared, STARTED);
  assert.match(result.out, new RegExp(`^prepared ${DIR}: 23 files; sentinel and manifest written; shared stack pinned at "${STARTED}"$`, 'm'));
  assert.match(result.out, new RegExp(`^${sha256(repo(`supabase/migrations/${BASE[0]}`))}  supabase/migrations/${BASE[0]} \\(equals the repository file\\)$`, 'm'));
  assert.equal(existsSync(join(real, LOCK)), false, 'prepare releases its lock');
  refuses(await run(env, 'prepare', DIR), /already exists; a replay directory is never reused/);
  const absent = setup(t);
  absent.world.shared = 'absent';
  refuses(await run(absent, 'prepare', DIR), /the shared 55321 database container must be running at prepare, so its start time can be pinned/);
  assert.equal(existsSync(absent.at(`private${DIR}`)), false);
});

test('a symlinked, foreign, tampered or shared-config directory is refused before any command; Linux /tmp is accepted', async (t) => {
  const cases = {
    'a symbolic link for the directory': (env) => { renameSync(env.at(`private${DIR}`), env.at('private/tmp/elsewhere')); symlinkSync(env.at('private/tmp/elsewhere'), env.at(`private${DIR}`)); },
    'a symbolic link inside it': (env) => { renameSync(env.at(`private${DIR}/supabase/migrations`), env.at('private/tmp/m')); symlinkSync(env.at('private/tmp/m'), env.at(`private${DIR}/supabase/migrations`)); },
    '/tmp pointing elsewhere': (env) => { mkdirSync(env.at('other')); renameSync(env.at('private/tmp'), env.at('other/tmp')); unlinkSync(env.at('tmp')); symlinkSync('other/tmp', env.at('tmp')); },
    'another owner sentinel': (env) => writeFileSync(env.at(`private${DIR}/${SENTINEL}`), '{"owner":"fitlog-ar1-replay"}\n'),
    'an edited migration': (env) => writeFileSync(env.at(`private${DIR}/supabase/migrations/${BASE[3]}`), 'select 1;\n'),
    'a missing manifest': (env) => unlinkSync(env.at(`private${DIR}/${MANIFEST}`)),
    'an unlisted migration, which start would apply': (env) => writeFileSync(env.at(`private${DIR}/supabase/migrations/29991231235959_unpinned.sql`), 'create table public.x(id int);\n'),
    'the shared stack config, hash and all': (env) => {
      const config = repo('supabase/config.toml');
      writeFileSync(env.at(`private${DIR}/supabase/config.toml`), config);
      const manifest = JSON.parse(readFileSync(env.at(`private${DIR}/${MANIFEST}`), 'utf8'));
      writeFileSync(env.at(`private${DIR}/${MANIFEST}`), JSON.stringify({ ...manifest, files: { ...manifest.files, 'supabase/config.toml': sha256(config) } }));
    },
  };
  const reasons = {
    'a symbolic link for the directory': /\/tmp\/fitlog-mb1-replay-20261026 is a symbolic link/,
    'a symbolic link inside it': /supabase\/migrations is a symbolic link/,
    '/tmp pointing elsewhere': /resolves to \/other\/tmp\/fitlog-mb1-replay-20261026, not to itself or \/private\/tmp\/fitlog-mb1-replay-20261026/,
    'another owner sentinel': /has a different owner sentinel; it is not this runner's replay directory/,
    'an edited migration': /no longer matches its sha256 in manifest\.json/,
    'a missing manifest': /manifest\.json is missing/,
    'an unlisted migration, which start would apply': /holds entries this runner did not create: supabase\/migrations\/29991231235959_unpinned\.sql; nothing runs on it/,
    'the shared stack config, hash and all': /config\.toml names project fitlog_rebuild_20261017, not fitlog_mb1_replay_20261026.*api\.port is 55321, not 56421/,
  };
  const args = { check: [], start: [], migrate: [], stop: CONFIRM, teardown: CONFIRM, snapshot: ['before'], mutate: ['m1'], 'shared-apply': SHARED_CONFIRM };
  for (const [name, damage] of Object.entries(cases)) {
    const env = setup(t);
    passes(await run(env, 'prepare', DIR), 'prepare');
    damage(env);
    for (const [op, extra] of Object.entries(args)) assert.deepEqual(refuses(await run(env, op, DIR, ...extra), reasons[name]).kinds, [], `${name}: ${op}`);
  }
  const linux = setup(t, { linux: true });
  passes(await run(linux, 'prepare', DIR), 'prepare on Linux');
  passes(await run(linux, 'verify-cli', DIR), 'verify-cli on Linux');
  passes(await run(linux, 'start', DIR), 'start on Linux');
  assert.deepEqual(passes(await run(linux, 'check', DIR), 'check').kinds, ['inspect', 'status', 'names']);
});

/* ---------------------------------------------------------------- Guards before every command ------------------------- */

test('the project, port, container and shared-stack checks run before every command, and Supabase always gets the literal workdir', async (t) => {
  const env = setup(t);
  // The runner's own environment holds a Docker host, a node preload and unrelated keys; children get only the allowlist.
  env.deps = { env: { ...CLEAN_ENV, DOCKER_HOST: 'unix:///fixture/docker.sock', NODE_OPTIONS: '--require /fixture/preload.cjs', OPENAI_API_KEY: 'fixture-openai-key', LD_PRELOAD: '/fixture/x.so', EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:55321' } };
  const kinds = {};
  const outs = [];
  const step = async (label, ...argv) => { const result = passes(await run(env, ...argv), label); kinds[label] = result.kinds; outs.push(result.out); };
  await step('prepare', 'prepare', DIR);
  await step('verify-cli', 'verify-cli', DIR);
  await step('start', 'start', DIR);
  await step('migrations', 'migrations', DIR);
  env.world.snapshot = SNAPSHOTS.before;
  await step('snapshot', 'snapshot', DIR, 'before');
  await step('diff', 'diff', DIR);
  await step('lint', 'lint', DIR);
  await step('images', 'images', DIR);
  await step('stop', 'stop', DIR, ...CONFIRM);
  assert.deepEqual(kinds, {
    prepare: ['inspect'],
    'verify-cli': ['inspect', '--version', 'start help', 'status help', 'migration list help', 'migration up help', 'db diff help', 'db lint help', 'stop help'],
    start: ['inspect', 'names', 'start', 'status', 'names', 'inspect'],
    migrations: ['inspect', 'status', 'names', 'migration list'],
    snapshot: ['inspect', 'status', 'names', 'psql-read'],
    diff: ['inspect', 'status', 'names', 'db diff', 'inspect'],
    lint: ['inspect', 'status', 'names', 'db lint'],
    images: ['inspect', 'status', 'names', 'images'],
    stop: ['inspect', 'status', 'names', 'stop', 'names', 'inspect'],
  });
  for (const { command, args, options } of env.world.calls) {
    assert.ok(args.every((arg) => typeof arg === 'string' && arg !== ''), `${command} got an empty argument`);
    assert.notEqual(command, 'pnpm', 'the CLI is the installed executable, never reached through pnpm');
    assert.deepEqual(options.env, { PATH: CLEAN_ENV.PATH, HOME: CLEAN_ENV.HOME, DOCKER_HOST: 'unix:///fixture/docker.sock' }, `${command} ${args.join(' ')} got another environment`);
    assert.equal(options.signals, env.signals);
    const at = args.indexOf('--workdir');
    if (at >= 0) assert.equal(args[at + 1], DIR);
    if (command !== 'docker') { assert.equal(command, NODE); assert.equal(args[0], SUPABASE_BIN); assert.equal(options.cwd, REPO_ROOT); }
    if (command === 'docker' && args[0] === 'exec') assert.equal(args.at(args.indexOf('psql') - 1), CONTAINER);
    // SF-7b (review 2026-10-27T0905Z L2): --type container, so a missing container never falls through to a same-named volume.
    if (command === 'docker' && args[0] === 'inspect') assert.deepEqual(args, ['inspect', '--type', 'container', '--format', '{{.State.Running}} {{.State.StartedAt}}', SHARED.container]);
  }
  assert.ok(env.world.calls.every(({ args }) => !args.includes(SHARED.container) || args[0] === 'inspect'), 'no replay command names the shared container');
  assert.match(outs.join(''), /^# child environment: PATH, HOME, DOCKER_HOST \(an allowlist; values are not printed; no SUPABASE_\* variable is set\)$/m);
  assert.ok(!outs.join('').includes('unix:///fixture/docker.sock'), 'no environment value is printed');
});

// Review a102fb68 finding 1: a SUPABASE_* variable can override the replay's config.toml (project_id included, by the
// reviewer's reading of the CLI's config loader), so the runner refuses while one is set, naming it and never its value.
test('the runner refuses while any SUPABASE_* variable is set, naming it only, before any command or replay-directory access', async (t) => {
  const env = setup(t);
  const values = { SUPABASE_PROJECT_ID: 'fitlog_rebuild_20261017', supabase_db_password: 'fixture-value-must-never-print', SUPABASE_CLI_BINARY_OVERRIDE: '/fixture/not-the-cli' };
  env.deps = { env: { ...CLEAN_ENV, ...values } };
  const reason = /the environment sets SUPABASE_CLI_BINARY_OVERRIDE, SUPABASE_PROJECT_ID, supabase_db_password; a SUPABASE_\* variable can override the replay's config\.toml \(project_id included\), so nothing runs until it is unset \(names only; no value is printed\)/;
  for (const argv of [['prepare', DIR], ['check', DIR], ['stop', DIR, ...CONFIRM], ['teardown', DIR, ...CONFIRM], ['shared-apply', DIR, ...SHARED_CONFIRM]]) {
    const result = refuses(await run(env, ...argv, '--evidence', `phase2-env-${argv[0]}`), reason);
    assert.deepEqual(result.kinds, [], argv.join(' '));
    const saved = readFileSync(env.at(`evidence/phase2-env-${argv[0]}.txt`), 'utf8');
    assert.match(saved, reason);
    for (const value of Object.values(values)) assert.ok(!`${result.out}${result.err}${saved}`.includes(value), `${argv[0]} printed ${value}`);
  }
  assert.equal(existsSync(env.at(`private${DIR}`)), false);
});

// Review b75d1e73 finding 3. The installed CLI 2.121.0 (its bundled code, read as a file; phase1e.md §3) reads
// .env.<env>.local, .env.local, .env.<env> and .env from <workdir>/supabase and <workdir>, and SUPABASE_* names there
// override config.toml, its ports included. Its Go sidecar cannot be read that way, so every parent directory, by its path
// as given and its real path, is checked too (fail closed). Any .env* name, in any case (macOS file systems ignore case).
test('a .env file the CLI may load stops every command, named only, and is never read, changed or removed', async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  const repoRoot = REPO_ROOT.replace(/\/$/, '');
  mkdirSync(env.at(`${repoRoot}/supabase`), { recursive: true });
  mkdirSync(env.at(`${repoRoot}/apps/mobile`), { recursive: true });
  const reads = [];
  env.deps = { fs: { ...env.fs, readFileSync: (path, encoding) => { reads.push(String(path)); return env.fs.readFileSync(path, encoding); } } };
  // Names the CLI does not build, or a .env deeper than any directory it reads, stop nothing.
  for (const path of [`${repoRoot}/env`, `${repoRoot}/dotenv.txt`, `${repoRoot}/x.env`, `${repoRoot}/apps/mobile/.env.example`]) writeFileSync(env.at(path), `SUPABASE_DB_PORT=56322\n`);
  passes(await run(env, 'check', DIR), 'check with no .env file in a directory the CLI reads');
  const content = Buffer.from(`SUPABASE_DB_PORT=56322\nSUPABASE_AUTH_EXTERNAL_APPLE_SECRET=${FAKE.secret}\n`);
  const cases = [
    [`${repoRoot}/supabase/.env`, [`${repoRoot}/supabase/.env`]],
    [`${repoRoot}/.env.local`, [`${repoRoot}/.env.local`]],
    [`${dirname(repoRoot)}/.env.development`, [`${dirname(repoRoot)}/.env.development`]],
    [`${dirname(dirname(repoRoot))}/.envrc`, [`${dirname(dirname(repoRoot))}/.envrc`]],
    ['/.env.test.local', ['/.env.test.local']],
    ['/tmp/.ENV', ['/private/tmp/.ENV', '/tmp/.ENV']],
    [`${DIR}/supabase/.env.production`, [`/private${DIR}/supabase/.env.production`, `${DIR}/supabase/.env.production`]],
  ];
  const argvs = [['prepare', DIR], ['verify-cli', DIR], ['check', DIR], ['migrations', DIR], ['snapshot', DIR, 'before'], ['stop', DIR, ...CONFIRM], ['teardown', DIR, ...CONFIRM], ['shared-snapshot', DIR, 'before'], ['shared-apply', DIR, ...SHARED_CONFIRM]];
  for (const [planted, named] of cases) {
    writeFileSync(env.at(planted), content);
    for (const argv of argvs) {
      const result = refuses(await run(env, ...argv, '--evidence', 'phase2-dotenv'), envRefusal(named));
      assert.deepEqual(result.kinds, [], `${planted}: ${argv[0]} ran a command`);
      const saved = readFileSync(env.at('evidence/phase2-dotenv.txt'), 'utf8');
      assert.equal(saved, `${result.out}${result.err}`, 'the evidence holds exactly the exit line and the refusal');
      assert.deepEqual(leaks(`${result.out}${result.err}${saved}`), [], `${planted}: ${argv[0]}`);
      unlinkSync(env.at('evidence/phase2-dotenv.txt'));
    }
    assert.deepEqual(readFileSync(env.at(planted)), content, `${planted} was changed`);
    unlinkSync(env.at(planted));
  }
  assert.deepEqual(reads.filter((path) => /\/\.env/i.test(path)), [], 'no .env file was read');
  assert.equal(env.world.running, true, 'nothing was stopped');
  passes(await run(env, 'check', DIR), 'check once the .env files are gone');
});

test('a running replay must answer at 56421 in its own container; anything else is refused without printing a key', async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  const notRunning = refuses(await run(env, 'migrations', DIR), /supabase status for \/tmp\/fitlog-mb1-replay-20261026 failed \(exit 1\); its output is withheld because it holds keys/);
  assert.deepEqual(notRunning.kinds, ['inspect', 'status']);
  passes(await run(env, 'start', DIR), 'start');
  refuses(await run(env, 'start', DIR), /replay containers are already running \(supabase_db_fitlog_mb1_replay_20261026, supabase_auth_fitlog_mb1_replay_20261026\); stop them first/);
  env.world.statusUrl = 'http://127.0.0.1:55321';
  const shared = refuses(await run(env, 'check', DIR), /the replay project answers at http:\/\/127\.0\.0\.1:55321, not http:\/\/127\.0\.0\.1:56421/);
  assert.deepEqual(shared.kinds, ['inspect', 'status']);
  assert.deepEqual(leaks(shared.err + notRunning.err), []);
  env.world.statusUrl = REPLAY_API_URL;
  const replayDb = env.world.replayDb;
  for (const url of [replayDb.replace(':56422', ':55322'), replayDb.replace('127.0.0.1', 'localhost'), replayDb.replace('postgresql:', 'http:'), undefined]) {
    env.world.replayDb = url;
    const elsewhere = refuses(await run(env, 'check', DIR), /^mb1-replay refused: the replay database is not at 127\.0\.0\.1:56422\n$/);
    assert.deepEqual(elsewhere.kinds, ['inspect', 'status'], String(url));
    assert.deepEqual(leaks(`${elsewhere.out}${elsewhere.err}`), []);
  }
  env.world.replayDb = replayDb;
  passes(await run(env, 'check', DIR), 'check');
});

// Review b75d1e73 finding 3: `migration up --local --workdir <repository>` connects to the repository config's database
// port, so 55321 commands need its status to name exactly 127.0.0.1:55322 for the database, as well as the API at 55321.
test("55321 commands need the repository's API at exactly 127.0.0.1:55321 and its database at exactly 127.0.0.1:55322", async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  passes(await snapshot(env, 'before'), 'snapshot before');
  const { sharedApi, sharedDb } = env.world;
  const db = /^mb1-replay refused: the repository's database is not at 127\.0\.0\.1:55322; its DB_URL is not printed, because it holds credentials\n$/;
  const api = /^mb1-replay refused: the repository's project answers at \(no loopback API_URL\), not http:\/\/127\.0\.0\.1:55321\n$/;
  for (const [field, value, reason] of [
    ['sharedDb', sharedDb.replace(':55322', ':56322'), db], // e.g. AR-1's 563xx replay project
    ['sharedDb', sharedDb.replace(':55322', ':56422'), db],
    ['sharedDb', sharedDb.replace(':55322', ''), db],
    ['sharedDb', sharedDb.replace('127.0.0.1', 'localhost'), db],
    ['sharedDb', sharedDb.replace('127.0.0.1', '0.0.0.0'), db],
    ['sharedDb', sharedDb.replace('127.0.0.1', '[::1]'), db],
    ['sharedDb', sharedDb.replace('postgresql:', 'http:'), db],
    ['sharedDb', undefined, db],
    ['sharedApi', 'http://localhost:55321', api],
    ['sharedApi', 'http://127.0.0.1:55321/', api],
  ]) {
    env.world[field] = value;
    const result = refuses(await run(env, 'shared-snapshot', DIR, 'before'), reason);
    assert.deepEqual(result.kinds, ['inspect', 'status'], `${field} ${value}`);
    assert.deepEqual(leaks(`${result.out}${result.err}`), []);
    Object.assign(env.world, { sharedApi, sharedDb });
  }
  assert.deepEqual(passes(await run(env, 'shared-snapshot', DIR, 'before'), 'shared-snapshot before').kinds, ['inspect', 'status', 'names', 'binding', 'inspect-id', 'psql-read']);
});

test('start and status output, CLI errors and refusals never print a key, token or password', async (t) => {
  const env = setup(t);
  const printed = [];
  const keep = (result) => { printed.push(result.out, result.err); return result; };
  keep(passes(await run(env, 'prepare', DIR), 'prepare'));
  keep(passes(await run(env, 'verify-cli', DIR), 'verify-cli'));
  const start = keep(passes(await run(env, 'start', DIR), 'start'));
  assert.match(start.out, /^# 5 line\(s\) withheld \(not on the start allowlist, or secret-shaped\)$/m);
  assert.match(start.out, /^# 15 Applying migration line\(s\); the manifest holds 15 migration\(s\)\. P3 in a snapshot is the proof\.$/m);
  const list = keep(passes(await run(env, 'migrations', DIR), 'migrations'));
  assert.match(list.out, /^ {3}`20261017161031` \| `20261017161031` \| `2026-10-17 16:10:31`$/m);
  assert.match(list.out, /^# 1 line\(s\) withheld/m);
  keep(await run(env, 'check', DIR, '--evidence', 'phase2-check'));
  assert.deepEqual(leaks(printed.join('')), []);
  assert.deepEqual(leaks(readFileSync(env.at('evidence/phase2-check.txt'), 'utf8')), []);
});
