// MB-1 replay runner, the live checks: the Supabase command table, the SUPABASE_* and .env refusals, status, docker ps,
// the 55321 config binding, Docker's binding of the shared stack (SF-7) and the shared container's fingerprint. Moved from
// mb1-replay.mjs in SF-0 (docs/plan/runs/MB-1/sf0.md); SF-7 added sharedBinding (sf7.md); SF-7b the DOCKER_HOST rule (sf7b.md);
// SF-7c the proven database ID's start time, right after the binding (sf7c.md); SF-7d exports it for shared-apply (sf7d.md).
// Internal: only mb1-replay.mjs and its sibling modules import this; all else goes through runReplay, so dispatch (the lock,
// the halt, the confirm tokens and the plan order) always runs first. mb1-replay-scope.test.mjs pins it (review 0605Z L1).
import { join } from 'node:path';
import { LOCAL_API_URL, REPO_ROOT } from './local-stack.mjs';
import { bindingArgs, bindingLine, bindingResult, SHARED_BINDING } from './mb1-replay-binding.mjs';
import { renderRun } from './mb1-replay-evidence.mjs';
import { LONG, SHORT } from './mb1-replay-exec.mjs';
import { envFiles, envSearchDirs, Refusal, REPLAY_API_URL, SHARED, sharedConfigProblems, STAGING } from './mb1-replay-target.mjs';

const EXCLUDED = ['studio', 'edge-runtime', 'logflare', 'vector', 'imgproxy'];
/** The installed Supabase CLI, run directly by this node: no pnpm, no shell, no PATH lookup of the CLI. */
export const SUPABASE_CLI = Object.freeze([process.execPath, join(REPO_ROOT, 'node_modules/.bin/supabase')]);
/** Every Supabase command this runner sends, and the flags verify-cli must find in that command's --help first. */
export const SUPABASE = Object.freeze({
  start: { args: () => ['start', '--exclude', EXCLUDED.join(',')], flags: ['--exclude', ...EXCLUDED], timeoutMs: LONG },
  status: { args: () => ['status', '-o', 'json'], flags: ['--output'], timeoutMs: SHORT },
  migrations: { args: () => ['migration', 'list', '--local'], flags: ['--local'], timeoutMs: SHORT },
  migrate: { args: () => ['migration', 'up', '--local'], flags: ['--local'], timeoutMs: LONG },
  diff: { args: () => ['db', 'diff', '--local', '--schema', 'public,private,storage', '--strict-coverage'], flags: ['--local', '--schema', '--strict-coverage'], timeoutMs: LONG },
  lint: { args: () => ['db', 'lint', '--local', '--schema', 'public,private', '--level', 'warning'], flags: ['--local', '--schema', '--level'], timeoutMs: LONG },
  // `--no-backup` deletes the project's data volumes, so stop names the replay's literal project ID (a102fb68 finding 1).
  stop: { args: (target) => ['stop', '--project-id', target.projectId, '--no-backup'], flags: ['--project-id', '--no-backup'], timeoutMs: LONG },
});
const refuse = (message) => new Refusal(message);
const supabaseVariables = (env) => Object.keys(env).filter((name) => /^supabase_/i.test(name)).sort();
/** Refuses while a SUPABASE_* variable is set: one can override config.toml, project_id included (names only). */
function refuseSupabaseVariables(ctx) {
  const variables = supabaseVariables(ctx.env);
  if (variables.length) throw refuse(`the environment sets ${variables.join(', ')}; a SUPABASE_* variable can override the replay's config.toml (project_id included), so nothing runs until it is unset (names only; no value is printed)`);
}
/** The staged workdir shared-apply's migration up runs from (review bbe2fbba finding 1). */
const stagingWorkdir = (ctx) => join(ctx.target.dir, STAGING);
/**
 * Refuses while a .env file is where the CLI may load it: its SUPABASE_* names override config.toml, ports included (paths
 * only). The workdirs are the repository, the replay and the staged copy shared-apply runs migration up from.
 */
function refuseEnvFiles(ctx) {
  const dotenv = envFiles(ctx.fs, envSearchDirs(ctx.fs, [ctx.repoRoot, ctx.target.dir, stagingWorkdir(ctx)]));
  if (dotenv.length) throw refuse(`a .env file the Supabase CLI may load is present: ${dotenv.join(', ')}; nothing runs while one is there (names only: no file was read, changed or removed)`);
}

/* ---------------------------------------------------------------- Live checks ---------------------------------------- */

/** The subcommand words before the first flag: ['migration', 'list', '--local'] -> ['migration', 'list']. */
function commandWords(args) {
  const at = args.findIndex((arg) => arg.startsWith('-'));
  return at < 0 ? args : args.slice(0, at);
}
const cliCall = (ctx, args, timeoutMs) => ctx.exec(SUPABASE_CLI[0], [SUPABASE_CLI[1], ...args], { cwd: ctx.repoRoot, timeoutMs });
const supabaseArgs = (ctx, name, workdir) => [...SUPABASE[name].args(ctx.target), '--workdir', workdir];
async function supabase(ctx, name, workdir = ctx.target.dir) {
  const args = supabaseArgs(ctx, name, workdir);
  const run = await cliCall(ctx, args, SUPABASE[name].timeoutMs);
  ctx.print(renderRun(`node_modules/.bin/supabase ${args.join(' ')}`, name, run));
  return run;
}
async function containerNames(ctx) {
  const out = await ctx.exec('docker', ['ps', '--format', '{{.Names}}'], { timeoutMs: SHORT });
  if (out.status !== 0) throw refuse(`docker ps ${out.status === null ? `did not finish (${out.error})` : `failed (exit ${out.status})`}`);
  return out.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}
const replayContainers = async (ctx) => (await containerNames(ctx)).filter((name) => name.endsWith(`_${ctx.target.projectId}`));
const loopbackUrl = (url) => (typeof url === 'string' && /^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(url) ? url : '(no loopback API_URL)');
/** A Postgres URL at exactly 127.0.0.1 on `port`; the installed CLI 2.121.0 builds its URLs as postgresql://…@host:port/db. */
function loopbackDb(url, port) {
  try {
    const parsed = new URL(url);
    return ['postgresql:', 'postgres:'].includes(parsed.protocol) && parsed.hostname === '127.0.0.1' && parsed.port === port;
  } catch { return false; }
}
/** `supabase status -o json` for a workdir, parsed; its output is never printed, because it holds keys. */
async function statusOf(ctx, workdir, label) {
  const out = await cliCall(ctx, supabaseArgs(ctx, 'status', workdir), SHORT);
  if (out.status !== 0) throw refuse(`supabase status for ${label} ${out.status === null ? `did not finish (${out.error})` : `failed (exit ${out.status})`}; its output is withheld because it holds keys`);
  try { return JSON.parse(out.stdout); } catch { throw refuse(`supabase status -o json for ${label} did not print JSON; its output is withheld because it holds keys`); }
}
/** The replay, and only it, answers: status for the literal workdir at 56421, its database at 56422, its container running. */
async function replayRunning(ctx) {
  const status = await statusOf(ctx, ctx.target.dir, ctx.target.dir);
  if (status?.API_URL !== REPLAY_API_URL) throw refuse(`the replay project answers at ${loopbackUrl(status?.API_URL)}, not ${REPLAY_API_URL}`);
  if (!loopbackDb(status.DB_URL, '56422')) throw refuse('the replay database is not at 127.0.0.1:56422');
  if (!(await containerNames(ctx)).includes(ctx.target.container)) throw refuse(`${ctx.target.container} is not running`);
}
async function replayStopped(ctx) {
  const running = await replayContainers(ctx);
  if (running.length) throw refuse(`replay containers are already running (${running.join(', ')}); stop them first`);
}
const CONFIG_JSON = /^config\.json$/i;
const ABSENT_DIR = new Set(['ENOENT', 'ENOTDIR']);
/**
 * Review 19eea0f3 finding 1. `migration up --local --workdir <repository>` connects to the [db] port of the repository's
 * config, read when it runs, and CLI 2.121.0 uses supabase/config.json in preference to config.toml. So, with no child
 * process and no await: no config.json of any case or type in the repository's supabase/ (its directory is listed by name;
 * no file is read), and a config.toml that names the shared project, sets [db] port 55322 (where the status DB_URL must be)
 * and is the one the replay was prepared from (sharedConfigProblems). Pure file reads, so it can run anywhere.
 */
function sharedConfigBound(ctx) {
  const dir = join(ctx.repoRoot, 'supabase');
  let names = [];
  try { names = ctx.fs.readdirSync(dir); } catch (error) {
    if (!ABSENT_DIR.has(error.code)) throw refuse(`${dir} could not be listed (${error.code ?? 'unknown error'}), so a supabase/config.json the CLI would prefer cannot be ruled out`);
  }
  const json = names.map(String).filter((name) => CONFIG_JSON.test(name)).sort().map((name) => join(dir, name));
  if (json.length) throw refuse(`${json.join(', ')} is present; the Supabase CLI prefers config.json to config.toml, so nothing runs on 55321 while it is there (names only: no file was read, changed or removed)`);
  let text;
  try { text = ctx.readRepo('supabase/config.toml').toString('utf8'); } catch (error) { throw refuse(`the repository's supabase/config.toml could not be read (${error.code ?? 'unknown error'})`); }
  const problems = sharedConfigProblems(text, ctx.target, ctx.manifest.files['supabase/config.toml']);
  if (problems.length) throw refuse(problems.join('; '));
}
/**
 * The shared 55321 stack, as local-stack.mjs's localDatabase checks it (the repository config names its container, and its
 * status answers at LOCAL_API_URL), but through this runner's own executor, plus its database at exactly 127.0.0.1:55322,
 * where `migration up --local` connects (review b75d1e73 finding 3), and its container running. The repository's config is
 * bound again first (finding 1 of review 19eea0f3): its [db] port is 55322, so the config and the status agree on it.
 */
async function sharedRunning(ctx) {
  sharedConfigBound(ctx);
  const status = await statusOf(ctx, ctx.repoRoot, 'the repository');
  if (status?.API_URL !== LOCAL_API_URL) throw refuse(`the repository's project answers at ${loopbackUrl(status?.API_URL)}, not ${LOCAL_API_URL}`);
  if (!loopbackDb(status.DB_URL, SHARED.dbPort)) throw refuse(`the repository's database is not at 127.0.0.1:${SHARED.dbPort}; its DB_URL is not printed, because it holds credentials`);
  if (!(await containerNames(ctx)).includes(SHARED.container)) throw refuse(`${SHARED.container} is not running`);
  const { value, ids } = await sharedBinding(ctx); // SF-7: the container the snapshots read is the one Docker publishes at 55322
  await provenStarted(ctx, ids[SHARED.container]); // SF-7c (review 2026-10-27T0935Z L1): no child process between them
  ctx.print(`${bindingLine(SHARED_BINDING)}\n`);
  ctx.print('# the database container the binding proved, inspected by its ID, has the start time pinned at prepare\n');
  // SF-7b (review 2026-10-27T0905Z L2): the snapshots exec the database container by the ID this binding proved, never by its
  // name, so a container recreated under that name since is not read: its exec fails (a failed snapshot, or a STOP after the apply).
  return { container: ids[SHARED.container], binding: value };
}
/**
 * SF-7b (review 2026-10-27T0905Z L1): the binding, the start-time pin and the snapshots read whichever Docker daemon
 * DOCKER_HOST selects, while migration up and the route proof dial this machine's 127.0.0.1:55322. So a 55321 command refuses,
 * before any child process, a DOCKER_HOST set to anything but a unix:///<path> socket (tcp://, ssh://, an empty value …). The
 * scheme only is checked, and the value is never printed. A Docker context's endpoint is not read here: the live read records it.
 */
const UNIX_SOCKET = /^unix:\/\/\//;
function refuseRemoteDocker(ctx) {
  const host = ctx.childEnv.DOCKER_HOST;
  if (host !== undefined && !UNIX_SOCKET.test(host)) throw refuse("DOCKER_HOST is set, but not to a unix:///<path> socket, so Docker's reads could describe another daemon than the one 127.0.0.1:55322 reaches; nothing runs on 55321 (the value is not printed)");
}
/**
 * SF-7 (review 2026-10-27T0405Z finding 1): Docker's own binding of the shared stack. migration up writes to whatever listens
 * at 127.0.0.1:55322, and the snapshots exec the database container by the ID this inspect proves (SF-7b), so one docker
 * inspect of the database and Kong containers must show the project label, 5432/tcp published only at 55322 and Kong's
 * 8000/tcp only at 55321, on 127.0.0.1 or 0.0.0.0 (mb1-replay-binding.mjs). Anything else, a failed or an unfinished inspect
 * included, refuses. Returns the binding's value, which a later call must equal, and the IDs it proved (SF-7b). The replay's
 * mirror is held until a reviewed first live read.
 */
async function sharedBinding(ctx, consequence = 'nothing runs on 55321') {
  const run = await ctx.exec('docker', bindingArgs(SHARED_BINDING), { timeoutMs: SHORT });
  const { problems, value, ids } = bindingResult(run, SHARED_BINDING);
  if (problems.length) throw refuse(`Docker does not show the shared stack bound to ${SHARED.dbPort} and ${new URL(LOCAL_API_URL).port}: ${problems.join('; ')}${consequence ? `; ${consequence}` : ''}`);
  return { value, ids };
}
/**
 * One container's "<running> <start time>", by its name or its ID: 'absent' when Docker has no such container. An inspect a
 * timeout or signal stopped says nothing about the container, so it is refused as unfinished, never read as absent; any
 * other value refuses too. `label` names the container in that refusal.
 */
async function startTimeOf(ctx, container, label) {
  // SF-7b (review 2026-10-27T0905Z L2): --type container, so a missing container never falls through to a same-named volume.
  const out = await ctx.exec('docker', ['inspect', '--type', 'container', '--format', '{{.State.Running}} {{.State.StartedAt}}', container], { timeoutMs: SHORT });
  if (out.status === null) throw refuse(`docker inspect of ${label} did not finish (${out.error}); the shared stack could not be checked`);
  if (out.status !== 0) return 'absent';
  const value = out.stdout.trim();
  if (!/^(true|false) \d{4}-\d\d-\d\dT[\d:.]+(Z|[+-]\d\d:\d\d)$/.test(value)) throw refuse('docker inspect printed an unexpected value for the shared database container');
  return value;
}
const sharedFingerprint = (ctx) => startTimeOf(ctx, SHARED.container, SHARED.container);
/**
 * SF-7c (review 2026-10-27T0935Z L1): the start-time check before every command reads the shared database container by its
 * name, a status call and a docker ps before sharedBinding proves an ID. So, right after the binding, the proven ID is
 * inspected too, and it must be running with the start time pinned at prepare (state.json's shared). A restart, a recreate or
 * a switched Docker context in that gap refuses here, before any snapshot exec, staged input, attempt record, migration up or
 * suite. The value compared is never a binding argument: those are unchanged.
 * SF-7d (review 2026-10-27T1105Z L1, L2): shared-apply runs it again, right after the second binding read ('apply nothing'),
 * and after migration up (no consequence: the caller makes the refusal a STOP), so `consequence` ends the refusal, as in
 * sharedBinding. An unfinished or unexpected inspect refuses with startTimeOf's own text.
 */
async function provenStarted(ctx, id, consequence = 'nothing runs on 55321') {
  const now = await startTimeOf(ctx, id, 'the database container the binding proved');
  if (now !== ctx.state.shared) throw refuse(`the database container Docker's binding proved, inspected by its ID, does not have the start time pinned at prepare (recorded "${ctx.state.shared}", now "${now}"): it was restarted or recreated, or another Docker daemon answered, after the start-time check${consequence ? `; ${consequence}` : ''}`);
}
async function sharedUnchanged(ctx, when) {
  const now = await sharedFingerprint(ctx);
  if (now !== ctx.state.shared) throw refuse(`STOP: the shared 55321 database container changed ${when} (recorded "${ctx.state.shared}", now "${now}"); nothing more runs until the coordinator reviews it`);
}

export {
  cliCall, commandWords, loopbackDb, loopbackUrl, provenStarted, refuse, refuseEnvFiles, refuseRemoteDocker, refuseSupabaseVariables, replayContainers, replayRunning, replayStopped,
  sharedBinding, sharedConfigBound, sharedFingerprint, sharedRunning, sharedUnchanged, stagingWorkdir, statusOf, supabase, supabaseArgs,
};
