import { dirname, join, resolve } from 'node:path';
import { projectId } from './local-stack.mjs';
import { CANDIDATE, CANDIDATE_SHA256, extractPreconditions, mutationSql, PRECONDITIONS_SHA256, readOnlySqlProblems, sha256 } from './mb1-replay-evidence.mjs';

// The MB-1 disposable replay project as a checked target (review 39fe1fb5 finding 1). Its directory is only ever the
// literal /tmp/fitlog-mb1-replay-YYYYMMDD; the runner creates it once, marks it with an owner sentinel and a manifest of
// every file it wrote (with sha256), and refuses it whenever any of that, its config's project_id or ports, or its path's
// real location is not exactly as written. The shared 55321 project can never pass. One command at a time holds the
// directory's lock file (review a102fb68 finding 5); a lock is never removed by anyone but the invocation that wrote it.
// `fs` is node:fs or a test double with the same synchronous methods; nothing here runs a command.

export const REPLAY_API_URL = 'http://127.0.0.1:56421';
export const SHARED = Object.freeze({ projectId: 'fitlog_rebuild_20261017', apiUrl: 'http://127.0.0.1:55321', dbPort: '55322', container: 'supabase_db_fitlog_rebuild_20261017' });
export const REPLAY_PORTS = Object.freeze({ 'api.port': '56421', 'db.port': '56422', 'db.shadow_port': '56420', 'db.pooler.port': '56429', 'studio.port': '56423', 'local_smtp.port': '56424', 'analytics.port': '56427', 'edge_runtime.inspector_port': '8283' });
export const OWNER = 'fitlog-mb1-replay';
export const SENTINEL = '.fitlog-mb1-replay';
export const MANIFEST = 'manifest.json';
export const STATE = 'state.json';
export const LOCK = '.fitlog-mb1-replay.lock';
export const BASE_MIGRATIONS = 15;
/** Review bbe2fbba finding 1: the runner-owned copy of what shared-apply's migration up reads, inside the replay directory. */
export const STAGING = 'shared-apply';
const DIR = /^\/tmp\/fitlog-mb1-replay-(\d{8})$/;
const OWNED_DIRS = ['supabase', 'supabase/migrations', 'sql'];
const STAGING_DIRS = [STAGING, `${STAGING}/supabase`, `${STAGING}/supabase/migrations`]; // present only once shared-apply staged
const RUNNER_FILES = [SENTINEL, MANIFEST, STATE, LOCK];
// What the Supabase CLI itself may write under a workdir: the replay's own, and the staged copy's.
const CLI_TREES = ['supabase/.temp', 'supabase/.branches', `${STAGING}/supabase/.temp`, `${STAGING}/supabase/.branches`];
const SAFE_REL = /^[A-Za-z0-9_][A-Za-z0-9_.-]*(\/[A-Za-z0-9_][A-Za-z0-9_.-]*)*$/;

export class Refusal extends Error {}
const refuse = (message) => new Refusal(message);

/** The checked target for a literal directory argument; anything else is refused before any command or file access. */
export function replayTarget(dir) {
  if (typeof dir !== 'string' || dir === '') throw refuse('no replay directory was given');
  const match = DIR.exec(dir);
  if (!match) throw refuse(`${JSON.stringify(dir)} is not the literal /tmp/fitlog-mb1-replay-YYYYMMDD path`);
  const date = match[1];
  const day = new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}T00:00:00Z`);
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10).replaceAll('-', '') !== date) throw refuse(`${date} is not a calendar date`);
  const id = `fitlog_mb1_replay_${date}`;
  // stop and teardown take `confirm`; shared-apply, the only write to 55321, takes its own (review a102fb68 finding 4).
  return Object.freeze({ dir, date, projectId: id, container: `supabase_db_${id}`, apiUrl: REPLAY_API_URL, confirm: `fitlog-mb1-replay-${date}`, sharedConfirm: `fitlog-mb1-shared-apply-${date}` });
}

export const sentinelText = (target) => `${JSON.stringify({ owner: OWNER, dir: target.dir, projectId: target.projectId, apiUrl: target.apiUrl })}\n`;

/**
 * The ports a config.toml sets as plain digits, keyed `<section>.<key>` (`db.port`, `db.shadow_port`, …); comments are
 * dropped. A port set any other way (a quoted string, an env() reference) is absent, so a check that needs it fails closed.
 */
export function configPorts(text) {
  const ports = {};
  let section = '';
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const header = /^\[([A-Za-z0-9_.-]+)\]$/.exec(line);
    const port = /^(port|shadow_port|inspector_port)\s*=\s*(\d+)$/.exec(line);
    if (header) section = header[1];
    else if (port) ports[`${section}.${port[1]}`] = port[2];
  }
  return ports;
}

/** Every problem with a replay config.toml: its project_id, each of the eight replay ports, and any shared-stack port. */
export function configProblems(text, target) {
  const problems = [];
  let id;
  try { id = projectId(text); } catch (error) { problems.push(error.message); }
  if (id !== undefined && id !== target.projectId) problems.push(`config.toml names project ${id}, not ${target.projectId}`);
  const ports = configPorts(text);
  for (const [key, value] of Object.entries(REPLAY_PORTS)) if (ports[key] !== value) problems.push(`config.toml ${key} is ${ports[key] ?? 'unset'}, not ${value}`);
  for (const key of Object.keys(ports)) if (!(key in REPLAY_PORTS)) problems.push(`config.toml sets an unexpected port ${key}`);
  if (/\b553\d\d\b|\b8183\b/.test(text)) problems.push('config.toml still names a shared-stack port');
  return problems;
}

/** The shared config with only project_id and the eight ports changed (553xx -> 564xx, inspector 8183 -> 8283). */
export function replayConfig(shared, target) {
  if (projectId(shared) !== SHARED.projectId) throw refuse(`supabase/config.toml no longer names ${SHARED.projectId}`);
  const lines = shared.split('\n');
  const out = lines.map((line) => line.replace(/^project_id = "fitlog_rebuild_20261017"$/, `project_id = "${target.projectId}"`)
    .replace(/\b553(\d\d)\b/g, '564$1').replace(/^inspector_port = 8183$/, 'inspector_port = 8283'));
  const changed = out.filter((line, index) => line !== lines[index]).length;
  if (changed !== 9) throw refuse(`the replay config changed ${changed} line(s) of supabase/config.toml, expected 9 (project_id and eight ports)`);
  const text = out.join('\n');
  const problems = configProblems(text, target);
  if (problems.length) throw refuse(problems.join('; '));
  return text;
}

/**
 * Why the repository's config.toml cannot be the one `migration up --local --workdir <repository>` reads for 55321, or
 * nothing (review 19eea0f3 finding 1). That command connects to the config's [db] port, read when it runs, so the port must
 * be exactly 55322, where the repository's status DB_URL must be too. And the whole file must be the one the replay was
 * prepared from: replayConfig of it must hash to `replayConfigSha256`, the manifest's pin, which replayConfig can only reach
 * from the same text (it changes exactly nine lines and refuses any other port).
 */
export function sharedConfigProblems(text, target, replayConfigSha256, label = "the repository's supabase/config.toml") {
  let id;
  try { id = projectId(text); } catch (error) { return [error.message]; }
  if (id !== SHARED.projectId) return [`${label} names project ${id}, not ${SHARED.projectId}`];
  const port = configPorts(text)['db.port'];
  if (port !== SHARED.dbPort) return [`${label} sets [db] port ${port ?? '(none)'}, not ${SHARED.dbPort}, where its status DB_URL must be; migration up --local connects to the config's port`];
  let replay;
  try { replay = replayConfig(text, target); } catch (error) { return [`${label} no longer yields the replay's config (${error.message})`]; }
  if (typeof replayConfigSha256 !== 'string' || sha256(replay) !== replayConfigSha256) return [`${label} is not the one the replay was prepared from (its replay config's sha256 differs from ${MANIFEST}'s)`];
  return [];
}

/* ---------------------------------------------------------------- The staged shared-apply input (bbe2fbba finding 1) */

/** Every file shared-apply's migration up reads, as workdir-relative paths: the config, the two seeds and the migrations. */
const sharedInputRels = (manifest) => ['supabase/config.toml', 'supabase/seed.sql', 'supabase/development-catalogue.sql', ...manifestMigrations(manifest).map((name) => `supabase/migrations/${name}`)];
const stagedRels = (manifest) => Object.keys(manifest.files).filter((rel) => rel.startsWith(`${STAGING}/`)).sort();

/**
 * The bytes to stage, keyed by workdir-relative path. The config is the repository's, read once by the caller and bound here
 * to 55322 and to the replay's own config (sharedConfigProblems), so the bytes checked are the bytes staged. The seeds and the
 * migrations are the replay's own pinned copies, the bytes the replay ran, never the repository's; the candidate among them
 * must be the pinned candidate. Pure: nothing is written.
 */
export function sharedInputFiles(target, fs, manifest, config) {
  const problems = sharedConfigProblems(config.toString('utf8'), target, manifest.files['supabase/config.toml']);
  if (problems.length) throw refuse(problems.join('; '));
  const files = new Map([['supabase/config.toml', Buffer.from(config)]]);
  for (const rel of sharedInputRels(manifest).slice(1)) {
    if (typeof manifest.files[rel] !== 'string') throw refuse(`${MANIFEST} does not pin ${rel}; nothing was staged`);
    const bytes = fs.readFileSync(join(target.dir, rel));
    if (sha256(bytes) !== manifest.files[rel]) throw refuse(`${rel} changed after the manifest check; nothing was staged`);
    files.set(rel, bytes);
  }
  if (sha256(files.get(`supabase/migrations/${CANDIDATE}`) ?? '') !== CANDIDATE_SHA256) throw refuse(`the replay's supabase/migrations/${CANDIDATE} is not the pinned candidate; nothing was staged`);
  return files;
}

/**
 * Writes the staged copy once: the directories, every file exclusively (`wx`) under shared-apply/, then the manifest with each
 * pinned, so every later command re-hashes them. A copy already staged is never rewritten: its pins must equal the bytes it
 * would stage now, or it refuses. Returns the manifest and whether anything was written.
 */
export function stageSharedInput(target, fs, manifest, files) {
  const want = new Map([...files].map(([rel, bytes]) => [`${STAGING}/${rel}`, sha256(bytes)]));
  const pinned = stagedRels(manifest);
  if (pinned.length) {
    const differ = [...new Set([...pinned, ...want.keys()])].filter((rel) => manifest.files[rel] !== want.get(rel)).sort();
    if (differ.length) throw refuse(`the staged shared-apply input differs from what would be staged now (${differ.join(', ')}); a staged copy is never rewritten: apply nothing`);
    return { manifest, written: false };
  }
  for (const rel of STAGING_DIRS) if (!lstatOrNull(fs, join(target.dir, rel))) fs.mkdirSync(join(target.dir, rel));
  for (const [rel, bytes] of files) fs.writeFileSync(join(target.dir, STAGING, rel), bytes, { flag: 'wx' });
  const next = { ...manifest, files: { ...manifest.files, ...Object.fromEntries(want) } };
  fs.writeFileSync(join(target.dir, MANIFEST), manifestText(target, next.files));
  return { manifest: next, written: true };
}

/**
 * Why the staged copy is not exactly what migration up must read, or nothing. Synchronous, with no child process: the replay
 * directory holds no entry the runner did not create; the staged directories are plain; the manifest pins exactly the files
 * migration up reads, each a plain file with its pinned sha256; each staged seed and migration has the replay's own pin; the
 * staged candidate is the pinned candidate; and the staged config is bound to 55322 and to the replay's config.
 */
export function stagedInputProblems(target, fs, manifest) {
  const staged = stagedRels(manifest);
  const expected = sharedInputRels(manifest).map((rel) => `${STAGING}/${rel}`).sort();
  if (staged.join(',') !== expected.join(',')) return [`${MANIFEST} pins ${staged.length} staged file(s), not the ${expected.length} migration up reads`];
  const problems = [];
  const { unexpected } = ownedInventory(target, fs, manifest);
  if (unexpected.length) problems.push(`${target.dir} holds entries this runner did not create: ${unexpected.join(', ')}`);
  for (const rel of STAGING_DIRS) {
    const stat = lstatOrNull(fs, join(target.dir, rel));
    if (!stat?.isDirectory()) problems.push(`${rel} is missing or not a plain directory`);
  }
  for (const rel of staged) {
    const path = join(target.dir, rel);
    if (!lstatOrNull(fs, path)?.isFile()) problems.push(`${rel} is missing or not a plain file`);
    else if (sha256(fs.readFileSync(path)) !== manifest.files[rel]) problems.push(`${rel} no longer matches its sha256 in ${MANIFEST}`);
  }
  const config = `${STAGING}/supabase/config.toml`;
  for (const rel of staged.filter((name) => name !== config)) if (manifest.files[rel] !== manifest.files[rel.slice(STAGING.length + 1)]) problems.push(`${rel} is not the replay's pinned copy`);
  if (manifest.files[`${STAGING}/supabase/migrations/${CANDIDATE}`] !== CANDIDATE_SHA256) problems.push(`the staged ${CANDIDATE} is not the pinned candidate`);
  if (lstatOrNull(fs, join(target.dir, config))?.isFile()) problems.push(...sharedConfigProblems(fs.readFileSync(join(target.dir, config), 'utf8'), target, manifest.files['supabase/config.toml'], `the staged ${config}`));
  return problems;
}

/**
 * Every file the replay directory starts with: the replay config, both seeds and the 15 committed migrations (exact
 * copies), the phase1.md §7 preconditions (which must pass the read-only check), and M1-M3 with the restore. The
 * candidate is not among them; add-candidate copies it at phase2-plan step 3.
 */
export function replayFiles(target, readRepo, migrationNames) {
  const base = migrationNames.filter((name) => name.endsWith('.sql') && name !== CANDIDATE).sort();
  if (base.length !== BASE_MIGRATIONS || !migrationNames.includes(CANDIDATE) || base.some((name) => name > CANDIDATE)) throw refuse(`supabase/migrations must hold the ${BASE_MIGRATIONS} committed migrations and the candidate, sorting last`);
  const text = (rel) => readRepo(rel).toString('utf8');
  const preconditions = extractPreconditions(text('docs/plan/runs/MB-1/phase1.md'));
  const hash = sha256(preconditions);
  if (hash !== PRECONDITIONS_SHA256) throw refuse(`phase1.md's preconditions block is not the reviewed one (sha256 ${hash}, reviewed ${PRECONDITIONS_SHA256}); nothing was prepared`);
  const problems = readOnlySqlProblems(preconditions);
  if (problems.length) throw refuse(`phase1.md's preconditions fail the read-only check: ${problems.join('; ')}`);
  const mutations = mutationSql({ candidate: text(`supabase/migrations/${CANDIDATE}`), memberCore: text('supabase/migrations/20261017161031_member_core.sql') });
  return new Map([
    ['supabase/config.toml', Buffer.from(replayConfig(text('supabase/config.toml'), target))],
    ...['seed.sql', 'development-catalogue.sql'].map((seed) => [`supabase/${seed}`, readRepo(`supabase/${seed}`)]),
    ...base.map((name) => [`supabase/migrations/${name}`, readRepo(`supabase/migrations/${name}`)]),
    ['sql/preconditions.sql', Buffer.from(preconditions)],
    ...Object.entries(mutations).map(([rel, sql]) => [rel, Buffer.from(sql)]),
  ]);
}

const manifestText = (target, files) => `${JSON.stringify({ owner: OWNER, dir: target.dir, projectId: target.projectId, files }, null, 2)}\n`;
function lstatOrNull(fs, path) {
  try { return fs.lstatSync(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

/* ---------------------------------------------------------------- .env files (review b75d1e73 finding 3) ------------ */

/** Any .env name, in any case (a macOS file system ignores case), so .env, .env.local, .ENV and .envrc all count. */
export const ENV_FILE = /^\.env/i;
const ABSENT = new Set(['ENOENT', 'ENOTDIR']);
function chain(dir) {
  const dirs = [];
  for (let at = dir; ; at = dirname(at)) { dirs.push(at); if (dirname(at) === at) return dirs; }
}
/**
 * Every directory whose .env files the Supabase CLI may read for these workdirs. The installed 2.121.0 (its bundled code,
 * read as a file; phase1e.md §3) reads .env.<env>.local, .env.local, .env.<env> and .env from <workdir>/supabase and
 * <workdir>, and SUPABASE_* names there override config.toml, its ports included. Its Go sidecar cannot be read that way,
 * and which root each loader is given was not traced, so every parent directory is included too, by the path as given and
 * by its real path (fail closed). Nothing is created; a workdir that does not exist yet (before prepare) is taken by its
 * path as given, and a directory that does not exist simply holds no file.
 */
export function envSearchDirs(fs, workdirs) {
  const dirs = [];
  const add = (dir) => { if (!dirs.includes(dir)) dirs.push(dir); };
  for (const workdir of workdirs) {
    const literal = resolve(workdir);
    let real = null;
    try { real = fs.realpathSync(literal); } catch (error) { if (!ABSENT.has(error.code)) throw refuse(`${literal} could not be resolved (${error.code ?? 'unknown error'}), so a .env file the Supabase CLI may load cannot be ruled out`); }
    for (const base of real && real !== literal ? [literal, real] : [literal]) { add(join(base, 'supabase')); chain(base).forEach(add); }
  }
  return dirs;
}
/** The .env files in those directories, by path only: no file is opened, read, changed or removed. */
export function envFiles(fs, dirs) {
  const found = [];
  for (const dir of dirs) {
    let names;
    try { names = fs.readdirSync(dir); } catch (error) {
      if (ABSENT.has(error.code)) continue;
      throw refuse(`${dir} could not be listed (${error.code ?? 'unknown error'}), so a .env file the Supabase CLI may load cannot be ruled out`);
    }
    for (const name of names) if (ENV_FILE.test(String(name))) found.push(join(dir, String(name)));
  }
  return [...new Set(found)].sort();
}

/* ---------------------------------------------------------------- The lock (review a102fb68 finding 5) -------------- */

/** The lock file's text: who holds it (command, pid, start) and a token only that invocation knows. Never a secret. */
export const lockText = (target, { op, pid, startedAt, token }) => `${JSON.stringify({ owner: OWNER, dir: target.dir, op, pid, startedAt, token })}\n`;
const lockPath = (target) => join(target.dir, LOCK);
function describeLock(fs, path) {
  try {
    if (!fs.lstatSync(path).isFile()) return 'not a plain file';
    const lock = JSON.parse(fs.readFileSync(path, 'utf8'));
    const known = /^[a-z-]+$/.test(lock?.op) && Number.isInteger(lock.pid) && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(lock.startedAt);
    return known ? `${lock.op}, pid ${lock.pid}, since ${lock.startedAt}` : 'an unreadable lock';
  } catch { return 'an unreadable lock'; }
}

/**
 * Takes the lock for one command, or refuses. The file is created exclusively (`wx`, which also fails on any link there),
 * so two invocations can never both hold it. A lock that is already there is never removed or replaced here, whatever its
 * age: a crashed run leaves it for the coordinator to review and remove by hand.
 */
export function acquireLock(target, fs, text) {
  try { fs.writeFileSync(lockPath(target), text, { flag: 'wx' }); } catch (error) {
    if (error.code !== 'EEXIST') throw refuse(`the lock ${target.dir}/${LOCK} could not be written (${error.code ?? error.message})`);
    throw refuse(`another mb1-replay command holds ${target.dir}/${LOCK} (${describeLock(fs, lockPath(target))}); a lock is never removed automatically: wait for that command, or, if no runner is running, the coordinator reviews the state and removes the file by hand`);
  }
}

/**
 * Releases the lock only if it is still a plain file holding this invocation's token. Returns 'released', or why the lock
 * was left alone (it is then never touched: a lock this invocation does not own is not its to remove).
 */
export function releaseLock(target, fs, token) {
  const path = lockPath(target);
  const shown = `${target.dir}/${LOCK}`;
  const stat = lstatOrNull(fs, path);
  if (!stat) return `the lock ${shown} was gone before release; another process removed it`;
  if (!stat.isFile()) return `the lock ${shown} is no longer a plain file; it was left in place`;
  let held;
  try { held = JSON.parse(fs.readFileSync(path, 'utf8'))?.token; } catch { held = undefined; }
  if (held !== token) return `the lock ${shown} now belongs to another invocation; it was left in place`;
  fs.unlinkSync(path);
  return 'released';
}

/* ---------------------------------------------------------------- The owned directory ------------------------------- */

/**
 * Creates the replay directory, which must not exist, and takes its lock first: mkdir is exclusive, so a second prepare
 * fails, and the lock keeps every other command out until prepare ends.
 */
export function createReplayDir(target, fs, lock) {
  if (lstatOrNull(fs, target.dir)) throw refuse(`${target.dir} already exists; a replay directory is never reused`);
  const tmp = fs.realpathSync('/tmp');
  if (tmp !== '/tmp' && tmp !== '/private/tmp') throw refuse(`/tmp resolves to ${tmp}`);
  try { fs.mkdirSync(target.dir); } catch (error) { throw refuse(`${target.dir} could not be created (${error.code ?? error.message}); a replay directory is never reused`); }
  try { fs.writeFileSync(lockPath(target), lock, { flag: 'wx' }); } catch (error) {
    throw refuse(`prepare stopped (${error.code ?? error.message}); ${target.dir} is incomplete, every command refuses it, and it must be removed by hand after review`);
  }
}

/**
 * Fills the new directory with the sentinel first and the manifest last, so an interrupted prepare leaves a directory that
 * every command refuses. Files are written exclusively (`wx`), never over anything.
 */
export function fillReplayDir(target, fs, files, state) {
  const at = (rel) => join(target.dir, rel);
  try {
    fs.writeFileSync(at(SENTINEL), sentinelText(target), { flag: 'wx' });
    for (const rel of OWNED_DIRS) fs.mkdirSync(at(rel));
    for (const [rel, bytes] of files) fs.writeFileSync(at(rel), bytes, { flag: 'wx' });
    fs.writeFileSync(at(STATE), `${JSON.stringify(state, null, 2)}\n`, { flag: 'wx' });
    fs.writeFileSync(at(MANIFEST), manifestText(target, Object.fromEntries([...files].map(([rel, bytes]) => [rel, sha256(bytes)]))), { flag: 'wx' });
  } catch (error) {
    throw refuse(`prepare stopped (${error.code ?? error.message}); ${target.dir} is incomplete, every command refuses it, and it must be removed by hand after review`);
  }
}

function requireEntry(fs, target, rel, kind, real) {
  const path = rel ? join(target.dir, rel) : target.dir;
  const stat = lstatOrNull(fs, path);
  if (!stat) throw refuse(`${path} is missing`);
  if (stat.isSymbolicLink()) throw refuse(`${path} is a symbolic link`);
  if (kind === 'directory' ? !stat.isDirectory() : !stat.isFile()) throw refuse(`${path} is not a ${kind}`);
  if (real !== undefined && fs.realpathSync(path) !== join(real, rel)) throw refuse(`${path} resolves outside ${target.dir}`);
}

function readManifest(target, fs, real) {
  requireEntry(fs, target, MANIFEST, 'file', real);
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(join(target.dir, MANIFEST), 'utf8')); } catch { throw refuse(`${MANIFEST} is not JSON`); }
  const files = manifest?.files;
  if (manifest?.owner !== OWNER || manifest.dir !== target.dir || manifest.projectId !== target.projectId || files === null || typeof files !== 'object' || Array.isArray(files)) throw refuse(`${MANIFEST} does not belong to ${target.dir}`);
  if (typeof files['supabase/config.toml'] !== 'string') throw refuse(`${MANIFEST} does not pin supabase/config.toml`);
  for (const [rel, hash] of Object.entries(files)) {
    if (!SAFE_REL.test(rel) || RUNNER_FILES.includes(rel)) throw refuse(`${MANIFEST} lists an unsafe path ${JSON.stringify(rel)}`);
    requireEntry(fs, target, rel, 'file', real);
    if (sha256(fs.readFileSync(join(target.dir, rel))) !== hash) throw refuse(`${rel} no longer matches its sha256 in ${MANIFEST}`);
  }
  return manifest;
}

/**
 * The full static check, run before every command: the literal path is a real directory (not a link) whose real location
 * is itself or /private plus itself; the runner's own entries are plain files and directories inside it; the sentinel is
 * this target's; every manifest file still has its sha256; and the config names this replay project and its ports only.
 */
export function checkOwnedDir(target, fs) {
  requireEntry(fs, target, '', 'directory');
  const real = fs.realpathSync(target.dir);
  if (real !== target.dir && real !== `/private${target.dir}`) throw refuse(`${target.dir} resolves to ${real}, not to itself or /private${target.dir}`);
  for (const rel of OWNED_DIRS) requireEntry(fs, target, rel, 'directory', real);
  for (const rel of STAGING_DIRS) if (lstatOrNull(fs, join(target.dir, rel))) requireEntry(fs, target, rel, 'directory', real);
  requireEntry(fs, target, SENTINEL, 'file', real);
  if (fs.readFileSync(join(target.dir, SENTINEL), 'utf8') !== sentinelText(target)) throw refuse(`${target.dir} has a different owner sentinel; it is not this runner's replay directory`);
  const manifest = readManifest(target, fs, real);
  requireEntry(fs, target, STATE, 'file', real);
  // `supabase start` applies every file in supabase/migrations, so a file the manifest does not pin must never be there.
  const { unexpected } = ownedInventory(target, fs, manifest);
  if (unexpected.length) throw refuse(`${target.dir} holds entries this runner did not create: ${unexpected.join(', ')}; nothing runs on it and nothing was removed`);
  const problems = configProblems(fs.readFileSync(join(target.dir, 'supabase/config.toml'), 'utf8'), target);
  if (problems.length) throw refuse(problems.join('; '));
  return manifest;
}

/** Adds one file the runner writes later (the candidate) and returns the new manifest. The file must not exist yet. */
export function addOwnedFile(target, fs, manifest, rel, bytes) {
  if (!SAFE_REL.test(rel) || rel in manifest.files) throw refuse(`${rel} cannot be added to ${MANIFEST}`);
  fs.writeFileSync(join(target.dir, rel), bytes, { flag: 'wx' });
  const next = { ...manifest, files: { ...manifest.files, [rel]: sha256(bytes) } };
  fs.writeFileSync(join(target.dir, MANIFEST), manifestText(target, next.files));
  return next;
}

export const manifestMigrations = (manifest) => Object.keys(manifest.files).filter((rel) => rel.startsWith('supabase/migrations/')).map((rel) => rel.slice('supabase/migrations/'.length)).sort();

/** Every entry under the directory, without following links: the runner's own, the CLI's trees, and anything else. */
export function ownedInventory(target, fs, manifest) {
  const files = []; const dirs = []; const unexpected = [];
  const ownFiles = new Set([...RUNNER_FILES, ...Object.keys(manifest.files)]);
  const inCliTree = (rel) => CLI_TREES.some((tree) => rel === tree || rel.startsWith(`${tree}/`));
  const walk = (rel) => {
    for (const entry of fs.readdirSync(rel ? join(target.dir, rel) : target.dir, { withFileTypes: true })) {
      const child = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory() && (OWNED_DIRS.includes(child) || STAGING_DIRS.includes(child) || inCliTree(child))) { walk(child); dirs.push(child); }
      else if (entry.isFile() && (ownFiles.has(child) || (inCliTree(child) && !CLI_TREES.includes(child)))) files.push(child);
      else unexpected.push(child);
    }
  };
  walk('');
  return { files, dirs, unexpected: unexpected.sort() };
}

/**
 * Teardown's removal: never recursive, never `rm -rf`. Refused whole if anything this runner did not create is there.
 * Files go one at a time (each re-checked as a plain file), then directories deepest first (rmdir fails on anything left),
 * then this invocation's own lock (released only if it still holds `token`; `onReleased` is told), then the sentinel, then
 * the directory itself.
 */
export function removeOwnedDir(target, fs, manifest, { token, onReleased }) {
  const { files, dirs, unexpected } = ownedInventory(target, fs, manifest);
  if (unexpected.length) throw refuse(`${target.dir} holds entries this runner did not create: ${unexpected.join(', ')}; nothing runs on it and nothing was removed`);
  for (const rel of files.filter((file) => file !== SENTINEL && file !== LOCK)) {
    const path = join(target.dir, rel);
    if (!fs.lstatSync(path).isFile()) throw refuse(`${path} changed type during teardown; stopped with the rest in place`);
    fs.unlinkSync(path);
  }
  for (const rel of dirs) fs.rmdirSync(join(target.dir, rel));
  const released = releaseLock(target, fs, token);
  if (released !== 'released') throw refuse(`STOP: ${released}; teardown stopped with the sentinel and the directory in place`);
  onReleased();
  fs.unlinkSync(join(target.dir, SENTINEL));
  fs.rmdirSync(target.dir);
  return { files: files.length, dirs: dirs.length + 1 };
}
