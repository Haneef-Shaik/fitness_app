// MB-1 replay runner tests: the shared harness. Not a test file: node --test never collects it. Moved unchanged from
// mb1-replay.test.mjs in SF-0 (docs/plan/runs/MB-1/sf0.md), with the helpers more than one test file uses.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPO_ROOT } from './local-stack.mjs';
import { BINDING_FORMAT } from './mb1-replay-binding.mjs';
import { CANDIDATE, IDENTITY_CHECKS, P1_COLUMNS, PROFILE_READ_FAILURES, secretHits } from './mb1-replay-evidence.mjs';
import { REPLAY_API_URL, SHARED, STATE } from './mb1-replay-target.mjs';
import { runReplay } from './mb1-replay.mjs';

// The guarded replay runner (review 39fe1fb5 finding 1, the evidence rules of findings 2-4 and 6, and review a102fb68's five
// findings). Every command goes to an injected executor that models Docker and the Supabase CLI in memory; the identity
// suite is an injected double (or the real main() with a fetch double); the file system is a temporary directory mapped so
// the runner still sees the literal /tmp/fitlog-mb1-replay-YYYYMMDD path. Only the executor tests start processes, and only
// local `node` scripts written to a temporary directory: nothing here reaches Docker, Supabase, a database or the network.

const DIR = '/tmp/fitlog-mb1-replay-20261026';
// Review bbe2fbba finding 1: the runner-owned, manifest-pinned copy shared-apply runs migration up from.
const STAGING = `${DIR}/shared-apply`;
const PROJECT = 'fitlog_mb1_replay_20261026';
const CONTAINER = `supabase_db_${PROJECT}`;
const CONFIRM = ['--confirm', 'fitlog-mb1-replay-20261026'];
const SHARED_CONFIRM = ['--confirm', 'fitlog-mb1-shared-apply-20261026'];
const STARTED = 'true 2026-10-26T01:00:00.123456789Z';
const NODE = process.execPath;
const SUPABASE_BIN = join(REPO_ROOT, 'node_modules/.bin/supabase');
const LOCK = '.fitlog-mb1-replay.lock';
// The phase1.md block review a102fb68 called clean; mb1-replay-evidence.test.mjs ties it to phase1.md byte for byte.
const REVIEWED_PRECONDITIONS = 'ca683771f22935ff97c26f3101e93634f1611132963d2e44db7bc9d913ed769a';
// The candidate's pinned bytes (review b75d1e73 finding 4); mb1-replay-evidence.test.mjs ties them to the file and phase1.md §3.
const REVIEWED_CANDIDATE = 'ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3';
const CLEAN_ENV = Object.freeze({ PATH: '/usr/bin:/bin', HOME: '/home/fixture' });
const MIGRATIONS = readdirSync(join(REPO_ROOT, 'supabase/migrations')).filter((name) => name.endsWith('.sql')).sort();
const BASE = MIGRATIONS.filter((name) => name !== CANDIDATE);
const repo = (rel) => readFileSync(join(REPO_ROOT, rel));
const FAKE = Object.freeze({ secret: 'sb_secret_fixture-must-never-print-0001', publishable: 'sb_publishable_fixture-must-never-print-0002', dbPassword: 'fixture-db-pw-0005', jwtSecret: 'fixture-jwt-secret-with-at-least-thirty-two-characters' });
const leaks = (text) => [...Object.values(FAKE).filter((value) => text.includes(value)), ...secretHits(text)];

/** node:fs, with every absolute path mapped under `base`; realpath maps back, so an escape shows as <outside>. */
function rooted(base) {
  const realBase = realpathSync(base);
  const map = (path) => { assert.ok(String(path).startsWith('/'), `absolute paths only: ${path}`); return join(base, path); };
  const unmap = (real) => (real === realBase ? '/' : real.startsWith(`${realBase}/`) ? real.slice(realBase.length) : `<outside>${real}`);
  return {
    lstatSync: (path) => lstatSync(map(path)), realpathSync: (path) => unmap(realpathSync(map(path))),
    readFileSync: (path, encoding) => readFileSync(map(path), encoding), writeFileSync: (path, data, options) => writeFileSync(map(path), data, options),
    mkdirSync: (path) => mkdirSync(map(path)), readdirSync: (path, options) => readdirSync(map(path), options),
    unlinkSync: (path) => unlinkSync(map(path)), rmdirSync: (path) => rmdirSync(map(path)),
  };
}

const ok = (stdout = '') => ({ status: 0, stdout, stderr: '' });
const failed = (stderr) => ({ status: 1, stdout: '', stderr });
const STATUS_BLOCK = [`        DB URL: postgresql://postgres:${FAKE.dbPassword}@127.0.0.1:56422/postgres`, `    JWT secret: ${FAKE.jwtSecret}`, `    Secret key: ${FAKE.secret}`, `Publishable key: ${FAKE.publishable}`, '  S3 Secret Key: fixture-s3-secret-0004'];
const HELP = `Usage:\n  supabase [command]\n\nFlags:\n  -x, --exclude strings   Names of containers to not start. [gotrue,realtime,storage-api,imgproxy,kong,mailpit,postgrest,postgres-meta,studio,edge-runtime,logflare,vector,supavisor]\n      --no-backup\n      --project-id string\n      --local\n  -s, --schema strings\n      --strict-coverage\n      --level string\n  -o, --output string\n\nGlobal Flags:\n      --workdir string\n`;
const AR1_DIFF = repo('docs/evidence/AR-1/replay-final-diff.log').toString('utf8');
const AR1_LINT = repo('docs/evidence/AR-1/replay-lint.log').toString('utf8');
const IMAGES = (auth = 'gotrue:v2.180.0') => ['db postgres:17.6.1.003', `auth ${auth}`, 'rest postgrest:v13.0.5'].flatMap((pair) => {
  const [service, image] = pair.split(' ');
  return [`supabase_${service}_${PROJECT} ${image}`, `supabase_${service}_${SHARED.projectId} ${service === 'auth' ? 'gotrue:v2.180.0' : image}`];
}).join('\n');

/** The Supabase CLI arguments of a call, when it is one: the installed executable run by this node, never pnpm. */
function cliArgs(command, args) {
  return command === NODE && args[0] === SUPABASE_BIN ? args.slice(1) : null;
}
// `supabase migration list` as CLI 2.121.0 prints it, transcribed from the installed CLI's bundled code (POn, Da, _me; see
// mb1-replay-evidence.test.mjs, which ties it to the header and rule the runner kept live). Not live output.
const listTime = (v) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)} ${v.slice(8, 10)}:${v.slice(10, 12)}:${v.slice(12, 14)}`;
function cliTable(rows) {
  const cell = (value) => (value.length > 0 ? `\`${value}\`` : '` `');
  const body = rows.map(({ local, remote }) => [cell(local), cell(remote), `\`${listTime(remote || local)}\``]);
  const head = ['Local', 'Remote', 'Time (UTC)'];
  const widths = head.map((title, at) => Math.max(title.length, ...body.map((row) => row[at].length)));
  const line = (cells) => `  ${cells.map((value, at) => ` ${value.padEnd(widths[at])} `).join('|')}`;
  return ['', '  ', line(head), `  ${widths.map((width) => '-'.repeat(width + 2)).join('|')}`, ...body.map(line), ''].join('\n');
}
const version = (file) => file.slice(0, 14);
/** The rows the CLI lists: the migration files in `dir` (local) beside the migrations its database has applied (remote). */
function listRows(dir, applied) {
  const local = readdirSync(dir).sort().map(version);
  const remote = applied.map(version);
  return [...new Set([...local, ...remote])].sort().map((v) => ({ local: local.includes(v) ? v : '', remote: remote.includes(v) ? v : '' }));
}
// SF-7: Docker's answer to the binding inspect, in the shape BINDING_FORMAT asks for. A fixture: no live Docker output was
// read, so the label key and any IPv4-plus-IPv6 pair are unconfirmed (review 2026-10-27T0605Z, SF-7 scope).
const containerId = (seed) => createHash('sha256').update(seed).digest('hex');
function bindingOutput({ project = SHARED.projectId, label = project, db = '55322', api = '55321', hostIp = '127.0.0.1', seed = '' } = {}) {
  const line = (service, port, hostPort, extra) => `${containerId(`${seed}${service}_${project}`)}|/supabase_${service}_${project}|${label}|${JSON.stringify({ [port]: [{ HostIp: hostIp, HostPort: hostPort }], ...extra })}`;
  return `${line('db', '5432/tcp', db, {})}\n${line('kong', '8000/tcp', api, { '8443/tcp': null })}\n`;
}
/** SF-7b (review 2026-10-27T0905Z L2): the database container's ID in a binding answer (its first field), or null. */
const dbIdOf = (output) => (/^[0-9a-f]{64}\|/.test(String(output)) ? String(output).slice(0, 64) : null);
/** A full container ID, as Docker prints it: 64 lowercase hex digits. */
const ID = /^[0-9a-f]{64}$/;
/** Docker and the Supabase CLI, in memory: one replay stack that start and stop switch, and the shared stack beside it. */
function world() {
  const w = {
    running: false, shared: STARTED, statusUrl: REPLAY_API_URL, calls: [], snapshot: '', images: IMAGES(), onStart: null, help: HELP, writes: [], applied: [], listing: null,
    replayDb: `postgresql://postgres:${FAKE.dbPassword}@127.0.0.1:56422/postgres`, sharedApi: 'http://127.0.0.1:55321', sharedDb: `postgresql://postgres:${FAKE.dbPassword}@127.0.0.1:55322/postgres`,
    // SF-7: the shared stack's binding (bindingRuns, when set, answers the next binding inspects in order) and the
    // migrations 55321 has applied as the staged migration list shows them: the base, unless a test says otherwise.
    binding: bindingOutput(), bindingRuns: [], sharedRemote: BASE, stagedList: null,
    // SF-7c (review 2026-10-27T0935Z L1): provenRuns, when set, answers the next inspects by container ID in order.
    provenRuns: [],
  };
  w.exec = (command, args, options = {}) => { w.calls.push({ command, args, options }); return respond(w, command, args, options); };
  return w;
}
function respond(w, command, args, options) {
  if (command === 'docker' && args[0] === 'inspect' && args.includes(BINDING_FORMAT)) {
    w.onBinding?.(w); // a test may change the staged input while the last binding inspect before migration up runs
    return w.bindingRuns.length ? w.bindingRuns.shift() : ok(w.binding);
  }
  if (command === 'docker' && args[0] === 'inspect' && ID.test(args.at(-1))) {
    // SF-7c (L1): an inspect by ID answers for the container Docker has under that ID now. That is the shared database
    // container (w.binding's), with its state and start time (w.shared); any other ID is Docker's "No such container".
    if (w.provenRuns.length) return w.provenRuns.shift();
    return args.at(-1) === dbIdOf(w.binding) && w.shared !== 'absent' ? ok(`${w.shared}\n`) : failed(`Error response from daemon: No such container: ${args.at(-1)}`);
  }
  if (command === 'docker' && args[0] === 'inspect') return w.inspect ?? (w.shared === 'absent' ? failed('Error: No such object') : ok(`${w.shared}\n`));
  if (command === 'docker' && args[0] === 'ps') {
    if (args[2] !== '{{.Names}}') return ok(w.images);
    w.onNames?.(w); // a test may change the replay directory during the last child process before start or migrate
    return ok(`${[...(w.running ? [CONTAINER, `supabase_auth_${PROJECT}`] : []), SHARED.container].join('\n')}\n`);
  }
  if (command === 'docker' && args[0] === 'exec') {
    if (args.includes('--single-transaction')) { w.writes.push({ container: args[2], input: Buffer.from(options.input) }); return ok('BEGIN\nALTER POLICY\nCOMMIT\n'); }
    w.onRead?.(w, args); // a test may change the repository while a read-only snapshot runs
    // SF-7b (L2): an exec by ID reaches only the shared database container Docker has now (w.binding's); a replaced one is gone.
    const target = args[args.indexOf('psql') - 1];
    if (/^[0-9a-f]{64}$/.test(target) && target !== dbIdOf(w.binding)) return failed(`Error response from daemon: No such container: ${target}`);
    return ok(w.snapshot);
  }
  const cli = cliArgs(command, args);
  assert.ok(cli, `unexpected command ${command} ${args.join(' ')}`);
  const at = cli.indexOf('--workdir');
  const sub = cli.slice(0, at < 0 ? undefined : at).join(' ');
  const workdir = at < 0 ? null : cli[at + 1];
  if (sub === '--version') return ok('2.121.0\n');
  if (sub.endsWith('--help')) return ok(w.help);
  if (sub === 'status -o json') {
    if (workdir === REPO_ROOT) return ok(JSON.stringify({ API_URL: w.sharedApi, DB_URL: w.sharedDb, SECRET_KEY: FAKE.secret }));
    if (workdir === STAGING) {
      w.onStatus?.(w); // a test may change the staged input while the staged status call runs
      return ok(JSON.stringify({ API_URL: w.stagedApi ?? w.sharedApi, DB_URL: w.stagedDb ?? w.sharedDb, SECRET_KEY: FAKE.secret }));
    }
    return w.running ? ok(JSON.stringify({ API_URL: w.statusUrl, DB_URL: w.replayDb, SECRET_KEY: FAKE.secret, PUBLISHABLE_KEY: FAKE.publishable })) : failed(`not running; SECRET_KEY=${FAKE.secret}`);
  }
  if (sub.startsWith('start --exclude')) {
    w.running = true; w.applied = readdirSync(w.migrationsDir).sort(); w.onStart?.(w);
    return ok([...w.applied.map((name) => `Applying migration ${name}...`), 'Started supabase local development setup.', ...STATUS_BLOCK].join('\n'));
  }
  // Only a stop tied to the replay's literal project ID stops anything (review a102fb68 finding 1); --no-backup drops the data.
  if (sub === `stop --project-id ${PROJECT} --no-backup`) { w.running = false; w.applied = []; return ok('Stopped supabase local development setup.\n'); }
  if (sub === 'migration list --local' && workdir === STAGING) {
    w.onList?.(w); // a test may change the staged input while the route proof's migration list runs (SF-7)
    return w.stagedList ?? ok(`${cliTable(listRows(w.stagedDir, w.sharedRemote))}${FAKE.secret}\n`);
  }
  if (sub === 'migration list --local') return ok(w.listing ?? `${cliTable(listRows(w.migrationsDir, w.applied))}${FAKE.secret}\n`);
  if (sub === 'migration up --local') {
    if (workdir === DIR) w.applied = readdirSync(w.migrationsDir).sort();
    if (workdir === STAGING) w.snapshot = w.afterApply ?? SNAPSHOTS.after; // 55321 now holds the candidate (or what a test says)
    w.onMigrate?.(w, workdir); // a test may change the repository while migration up runs
    return w.migrateResult ?? ok(`Connecting to local database...\nApplying migration ${CANDIDATE}...\nLocal database is up to date.\n`);
  }
  if (sub.startsWith('db diff') || sub.startsWith('db lint')) {
    w.onDb?.(w, sub); // a test may change the replay directory while db diff or db lint runs (review 2026-10-26T2305Z finding 4)
    return w.dbResult ?? ok(sub.startsWith('db diff') ? AR1_DIFF : AR1_LINT);
  }
  throw new Error(`unexpected command ${command} ${args.join(' ')}`);
}
/**
 * A short name for each call: inspect (by name), inspect-id (by container ID, SF-7c), binding, names, images, psql-read,
 * psql-write, or the Supabase command (`start`, `db diff help`).
 */
function kind({ command, args }) {
  if (command === 'docker') return args[0] === 'inspect' ? (args.includes(BINDING_FORMAT) ? 'binding' : ID.test(args.at(-1)) ? 'inspect-id' : 'inspect') : args[0] === 'ps' ? (args[2] === '{{.Names}}' ? 'names' : 'images') : args.includes('--single-transaction') ? 'psql-write' : 'psql-read';
  const cli = cliArgs(command, args) ?? [];
  if (cli.includes('--version')) return '--version';
  const words = [];
  for (const arg of cli) { if (arg.startsWith('-')) break; words.push(arg); }
  return cli.includes('--help') ? `${words.join(' ')} help` : words.join(' ');
}

const READ_QUAL = '(id = ( SELECT auth.uid() AS uid))';
const GUARDED = '((id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.member_active() AS member_active))';
const md5 = (seed) => createHash('md5').update(seed).digest('hex');
function psqlOutput({ readOnly = 'on|on', fn = md5('fn'), readQual = READ_QUAL, migrations = BASE, statements = {} } = {}) {
  const p3 = migrations.map((file) => { const [, version, name] = /^(\d{14})_(.+)\.sql$/.exec(file); return `${version}|${name}|${statements[file] ?? md5(file)}`; });
  return ['default_transaction_read_only|transaction_read_only', readOnly, '(1 row)', 'BEGIN', P1_COLUMNS.join('|'), `postgres|t|f|postgres|t|s|{"search_path=\\"\\""}|f|f|t|${fn}`, '(1 row)',
    'policyname|permissive|roles|cmd|qual|with_check', `profile_read|PERMISSIVE|{authenticated}|SELECT|${readQual}|`, `profile_update|PERMISSIVE|{authenticated}|UPDATE|${GUARDED}|${GUARDED}`, '(2 rows)',
    'version|name|statements_md5', ...p3, `(${p3.length} rows)`, 'ROLLBACK', ''].join('\n');
}
const SNAPSHOTS = {
  before: psqlOutput(), after: psqlOutput({ readQual: GUARDED, migrations: MIGRATIONS }), m1: psqlOutput({ migrations: MIGRATIONS }),
  m2: psqlOutput({ readQual: GUARDED, migrations: MIGRATIONS, fn: md5('m2') }), m3: psqlOutput({ readQual: GUARDED, migrations: MIGRATIONS, fn: md5('m3') }),
};
const BAN = "# after the ban, GoTrue answers member C's session with HTTP 200";
// F6 (phase 2 attempt 3): the replay's GoTrue answered the banned member's session with this, recorded in phase2-2-red.txt.
const BAN_BANNED = `# after the ban, GoTrue answers member C's session with HTTP 403 {"code":"user_banned","message":"User is banned"}`;
const BAN_ENDED = `# after the ban, GoTrue answers member C's session with HTTP 403 {"code":"session_not_found","message":"Session from session_id claim in JWT does not exist"}`;
/** The suite's output; each failing check's detail line is `HTTP 200, 1 row(s)` unless `details` names another. */
function suiteLog(failing = [], ban = BAN, details = {}) {
  const lines = IDENTITY_CHECKS.flatMap((name) => [...(name === 'a banned account reads no profile' ? [ban] : []), failing.includes(name) ? `not ok - ${name}\n  ${details[name] ?? 'HTTP 200, 1 row(s)'}` : `ok - ${name}`]);
  return `${lines.join('\n')}\n\n${failing.length ? `${failing.length} of 27 identity checks failed: ${failing.join('; ')}` : 'Local identity integration passed, 27 checks: profile ownership.'}\n`;
}
const LOGS = { red: suiteLog(PROFILE_READ_FAILURES), green: suiteLog(), m1: suiteLog(PROFILE_READ_FAILURES), m2: suiteLog(['a banned account reads no profile']), m3: suiteLog(['a deletion-pending account reads no profile']) };

/** A sandbox: the mapped file system (macOS layout, /tmp -> /private/tmp, unless linux), the world, a clock and a suite double. */
function setup(t, { linux = false } = {}) {
  const base = mkdtempSync(join(tmpdir(), 'fitlog-mb1-replay-test-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  if (linux) mkdirSync(join(base, 'tmp'));
  else { mkdirSync(join(base, 'private/tmp'), { recursive: true }); symlinkSync('private/tmp', join(base, 'tmp')); }
  mkdirSync(join(base, 'evidence'));
  const env = { base, fs: rooted(base), world: world(), clock: Date.UTC(2026, 9, 26, 6), suites: [], suiteCalls: [], suiteWiring: [], signals: new EventEmitter(), tokens: 0, at: (path) => join(base, path) };
  env.world.migrationsDir = env.at(`${DIR}/supabase/migrations`);
  env.world.stagedDir = env.at(`${STAGING}/supabase/migrations`);
  env.suite = async ({ io, signals, exit, run: status, cli, ...target }) => {
    env.suiteCalls.push(target);
    env.suiteWiring.push({ signals, exit, status, cli });
    const { log, code } = env.suites.shift();
    io.stdout.write(log);
    return code;
  };
  return env;
}
async function run(env, ...argv) {
  const out = []; const err = [];
  const io = { stdout: { write: (text) => out.push(text) }, stderr: { write: (text) => err.push(text) } };
  const before = env.world.calls.length;
  const code = await runReplay(argv, {
    exec: env.world.exec, fs: env.fs, now: () => env.clock, io, suite: env.suite, evidenceDir: '/evidence', env: CLEAN_ENV, signals: env.signals, pid: 4100,
    token: () => { env.tokens += 1; return `token-${env.tokens}`; }, ...env.deps,
  });
  return { code, out: out.join(''), err: err.join(''), kinds: env.world.calls.slice(before).map(kind) };
}
function passes(result, label) { assert.equal(result.code, 0, `${label}: ${result.err}${result.out}`); assert.equal(result.err, ''); return result; }
function refuses(result, reason) {
  assert.equal(result.code, 1, result.out);
  assert.match(result.err, reason);
  assert.match(result.err, /^mb1-replay refused: [^\n]+\n$/);
  return result;
}
const readState = (env) => JSON.parse(readFileSync(env.at(`${DIR}/${STATE}`), 'utf8'));
async function suite(env, expect) {
  env.clock += 75_000;
  env.suites.push({ log: LOGS[expect], code: expect === 'green' ? 0 : 1 });
  return passes(await run(env, 'suite', DIR, expect), `suite ${expect}`);
}
async function snapshot(env, label, output = SNAPSHOTS[label] ?? SNAPSHOTS.after) {
  env.world.snapshot = output;
  return run(env, 'snapshot', DIR, label);
}
/** Prepare, verify the CLI, start, then the 'before' snapshot and RED: the replay stands at phase2-plan step 2. */
async function atRed(env) {
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  passes(await snapshot(env, 'before'), 'snapshot before');
  await suite(env, 'red');
}
/** Then the candidate, its 'after' snapshot and GREEN: step 3. */
async function atGreen(env) {
  await atRed(env);
  passes(await run(env, 'add-candidate', DIR), 'add-candidate');
  passes(await run(env, 'migrate', DIR), 'migrate');
  passes(await snapshot(env, 'after'), 'snapshot after');
  await suite(env, 'green');
}
/** From GREEN, every other replay proof shared-apply needs: M1-M3 with restores, generation 2 green, diff, lint, images. */
async function toSharedApply(env) {
  for (const mutation of ['m1', 'm2', 'm3']) {
    passes(await run(env, 'mutate', DIR, mutation), `mutate ${mutation}`);
    passes(await snapshot(env, mutation), `snapshot ${mutation}`);
    await suite(env, mutation);
    passes(await run(env, 'mutate', DIR, mutation === 'm1' ? 'restore-m1' : 'restore-member-active'), `restore ${mutation}`);
    passes(await snapshot(env, 'restored', SNAPSHOTS.after), 'restored');
  }
  passes(await run(env, 'stop', DIR, ...CONFIRM), 'stop');
  passes(await run(env, 'start', DIR), 'start');
  passes(await snapshot(env, 'fresh16', SNAPSHOTS.after), 'fresh16');
  await suite(env, 'green');
  passes(await run(env, 'diff', DIR), 'diff');
  passes(await run(env, 'lint', DIR), 'lint');
  passes(await run(env, 'images', DIR), 'images');
}
/** Every replay proof and 55321's before snapshot: the replay stands right before phase2-plan step 6.3, shared-apply. */
async function atSharedApply(env) {
  await atGreen(env);
  await toSharedApply(env);
  env.world.snapshot = SNAPSHOTS.before;
  passes(await run(env, 'shared-snapshot', DIR, 'before'), 'shared-snapshot before');
}
/** One suite run whose output fails `failing` (with `details`) and answers the ban with `ban`. */
async function suiteWith(env, expect, failing, ban, details = {}) {
  env.clock += 75_000;
  env.suites.push({ log: suiteLog(failing, ban, details), code: failing.length ? 1 : 0 });
  return run(env, 'suite', DIR, expect);
}
/** From prepare to M2 applied and proved, on a replay whose RED recorded the ban answer `ban` prints as its reference. */
async function atM2(env, ban) {
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  passes(await snapshot(env, 'before'), 'snapshot before');
  passes(await suiteWith(env, 'red', PROFILE_READ_FAILURES, ban), 'suite red');
  passes(await run(env, 'add-candidate', DIR), 'add-candidate');
  passes(await run(env, 'migrate', DIR), 'migrate');
  passes(await snapshot(env, 'after'), 'snapshot after');
  passes(await suiteWith(env, 'green', [], ban), 'suite green');
  passes(await run(env, 'mutate', DIR, 'm2'), 'mutate m2');
  passes(await snapshot(env, 'm2'), 'snapshot m2');
}
/** Every file under a real directory, relative and sorted, without following links. */
function listFiles(base, rel = '') {
  return readdirSync(join(base, rel), { withFileTypes: true }).flatMap((entry) => {
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listFiles(base, child) : [child];
  }).sort();
}
/** The promise's value, or a failure after `ms`: a command that never returns fails the test instead of hanging it. */
function within(promise, ms = 2000) {
  let timer;
  const late = new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error(`still pending after ${ms} ms`)), ms); });
  return Promise.race([promise, late]).finally(() => clearTimeout(timer));
}
async function until(predicate, ms = 3000) {
  for (let waited = 0; !predicate(); waited += 5) {
    assert.ok(waited < ms, 'timed out waiting');
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; } };
/** Waits until no process has this id; fails if it is still there after `ms`. */
async function gone(pid, ms = 3000) {
  assert.ok(Number.isInteger(pid) && pid > 1, `not a process id: ${pid}`);
  for (let waited = 0; alive(pid); waited += 20) {
    assert.ok(waited < ms, `process ${pid} outlived the command`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const envRefusal = (paths) => new RegExp(`^mb1-replay refused: a \\.env file the Supabase CLI may load is present: ${paths.map(escapeRe).join(', ')}; nothing runs while one is there \\(names only: no file was read, changed or removed\\)\\n$`);
// SF-7b (review 2026-10-27T0905Z L4): where the coordinator turns after an attempt; never a runner read a changed container refuses.
const INCIDENT = "the coordinator reviews 55321 through SF-2's manually authorized read-only incident path outside this runner \\(not yet written; once the shared container has changed, every 55321 command here is refused\\)";
const ATTEMPTED = new RegExp(`^mb1-replay refused: a shared-apply was already attempted at \\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d\\.\\d{3}Z \\(migration up started\\), so it never runs again: ${INCIDENT}\\n$`);
const M2_STOP = /^# STOP: M2 is stopped on this replay: "a banned account reads no profile" passed with the ban clause removed, so no later suite m2 runs here and shared-apply stays blocked; the fallback is M2b, reviewed separately$/m;
const ISO = '\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d\\.\\d{3}Z';

export {
  atGreen, atM2, atRed, atSharedApply, ATTEMPTED, BAN, BAN_BANNED, BAN_ENDED, BASE, bindingOutput, CLEAN_ENV, cliTable, CONFIRM, CONTAINER, dbIdOf, DIR, envRefusal, escapeRe, failed,
  FAKE, gone, GUARDED, HELP, INCIDENT, ISO, kind, leaks, listFiles, LOCK, LOGS, M2_STOP, md5, MIGRATIONS, NODE, ok, passes, PROJECT, psqlOutput, readState, refuses, repo,
  REVIEWED_CANDIDATE, REVIEWED_PRECONDITIONS, run, setup, SHARED_CONFIRM, snapshot, SNAPSHOTS, STAGING, STARTED, suite, suiteLog, suiteWith, SUPABASE_BIN, toSharedApply,
  until, version, within,
};
