import { spawnSync } from 'node:child_process';
import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

// No SQL under supabase/ except migrations and the seeds config.toml lists, and no migration that exists at the
// trusted base is changed (docs/architecture/003 §7; AR-1 test-plan §2). Needs no database; git is only read.
// Self-contained on purpose: its tests run a copy of this file inside scratch repositories.

export const MIGRATION_NAME = /^\d{14}_[a-z0-9_]+\.sql$/;
export const BASE_ENV = 'FITLOG_BASE_REF';
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const MIGRATIONS = 'supabase/migrations';
const OID = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/;
const GLOB = /[*?[\]{}]/;
const GIT_LOCATION = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_COMMON_DIR', 'GIT_NAMESPACE'];
const CHANGE = { D: 'deleted', M: 'modified', T: 'retyped', U: 'unmerged' };

/**
 * Runs git read-only in one work tree. Inherited variables cannot point it at another repository, replace refs cannot
 * rewrite the base, and optional index refreshes are off, so the check writes nothing to .git.
 */
export function gitRunner({ binary = 'git', env = process.env } = {}) {
  const clean = { ...Object.fromEntries(Object.entries(env).filter(([key]) => !GIT_LOCATION.includes(key))), GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C' };
  return (root, args) => {
    const run = spawnSync(binary, ['--no-replace-objects', '-C', root, ...args], { env: clean, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
    return run.error
      ? { status: null, stdout: Buffer.alloc(0), stderr: `git did not run: ${run.error.message}` }
      : { status: run.status, stdout: run.stdout, stderr: run.stderr.toString('utf8').trim() };
  };
}
const why = ({ status, stderr }) => [status === null ? '' : `exit ${status}`, stderr].filter(Boolean).join(': ');
function gitText(git, root, args) {
  const run = git(root, args);
  if (run.status !== 0) throw new Error(`git ${args.join(' ')} failed (${why(run)})`);
  return run.stdout.toString('utf8');
}
const lstatOrNull = (path) => { try { return lstatSync(path); } catch { return null; } };
const kind = (stats) => (stats.isSymbolicLink() ? 'a symbolic link' : stats.isDirectory() ? 'a directory' : stats.isFile() ? 'a file' : 'neither a file nor a directory');
const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

/** A TOML array of plain strings, from just after `=` to its closing bracket; comments and line breaks are allowed between items. */
function stringArray(text) {
  const fail = (reason) => { throw new Error(`supabase/config.toml: ${reason}`); };
  let i = 0;
  const space = () => {
    while (i < text.length) {
      if (/\s/.test(text[i])) i += 1;
      else if (text[i] === '#') while (i < text.length && text[i] !== '\n') i += 1;
      else break;
    }
  };
  space();
  if (text[i] !== '[') fail('sql_paths must be an array of strings');
  i += 1;
  const items = [];
  for (;;) {
    space();
    if (text[i] === ']') break;
    const quote = text[i];
    if (quote !== '"' && quote !== "'") fail(i < text.length ? 'sql_paths must be an array of strings' : 'sql_paths has no closing ]');
    const end = text.indexOf(quote, i + 1);
    const newline = text.indexOf('\n', i + 1);
    if (end < 0 || (newline >= 0 && newline < end)) fail('a sql_paths string is not closed on its line');
    const value = text.slice(i + 1, end);
    if (quote === '"' && value.includes('\\')) fail('escape sequences in sql_paths are not supported');
    items.push(value);
    i = end + 1;
    space();
    if (text[i] === ',') i += 1;
    else if (text[i] !== ']') fail('sql_paths has no closing ]');
  }
  const lineEnd = text.indexOf('\n', i);
  if (!/^\]\s*(?:#.*)?$/.test(text.slice(i, lineEnd < 0 ? undefined : lineEnd))) fail('unexpected text after the array in sql_paths');
  return items;
}
function seedPath(value) {
  const where = `supabase/config.toml sql_paths entry "${value}"`;
  if (GLOB.test(value)) throw new Error(`${where} is a glob pattern; this guard needs each seed file listed`);
  if (value.startsWith('/') || value.includes('\\') || /^[A-Za-z]:/.test(value)) throw new Error(`${where} must be relative to supabase/`);
  const path = posix.normalize(value);
  if (path === '..' || path.startsWith('../')) throw new Error(`${where} points outside supabase/`);
  if (!path.endsWith('.sql')) throw new Error(`${where} is not a .sql file`);
  if (path === 'migrations' || path.startsWith('migrations/')) throw new Error(`${where} is inside ${MIGRATIONS}/`);
  return path;
}
/**
 * The configured seeds ([db.seed] sql_paths, config.toml:72) as paths relative to supabase/. Without the key nothing is
 * allowed, although Supabase would then load seed.sql; anything this reader cannot vouch for (globs, escapes, a second or
 * dotted key) is refused rather than guessed.
 */
export function seedPaths(config) {
  const lines = config.split(/\r?\n/);
  let table = '';
  const found = [];
  lines.forEach((line, index) => {
    const header = /^\s*\[\[?([^\]]*)\]\]?\s*(?:#.*)?$/.exec(line);
    if (header) table = header[1].split('.').map((part) => part.trim()).join('.');
    else if (/^\s*(?:[\w-]+\s*\.\s*)*["']?sql_paths["']?\s*=/.test(line)) found.push({ index, table, bare: /^\s*sql_paths\s*=/.test(line) });
  });
  if (found.length === 0) return [];
  if (found.length > 1 || found[0].table !== 'db.seed' || !found[0].bare) throw new Error('supabase/config.toml: sql_paths must be set once, as a bare key under [db.seed]');
  const { index } = found[0];
  return stringArray([lines[index].slice(lines[index].indexOf('=') + 1), ...lines.slice(index + 1)].join('\n')).map(seedPath);
}

/** Walks supabase/ without following links: migration names, repeated timestamps, links, and SQL that is neither a migration nor a configured seed. */
export function scanSupabase(root, seeds) {
  const problems = [];
  for (const dir of ['supabase', MIGRATIONS]) {
    const stats = lstatOrNull(join(root, dir));
    if (!stats?.isDirectory()) problems.push(`${dir}/ is ${stats ? kind(stats) : 'missing'}; it must be a real directory`);
  }
  if (problems.length) return { problems, migrations: null };
  const allowed = new Set(seeds.map((seed) => `supabase/${seed}`));
  const migrations = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true }).sort(byName)) {
      const path = `${dir}/${entry.name}`;
      if (entry.isSymbolicLink()) problems.push(`${path} is a symbolic link; links under supabase/ are refused, not followed`);
      else if (entry.isDirectory() && dir === MIGRATIONS) problems.push(`${path}/ is a directory; migrations are files directly in ${MIGRATIONS}/`);
      else if (entry.isDirectory()) walk(path);
      else if (!entry.isFile()) problems.push(`${path} is neither a file nor a directory`);
      else if (dir === MIGRATIONS && MIGRATION_NAME.test(entry.name)) migrations.push(entry.name);
      else if (dir === MIGRATIONS) problems.push(`${path} does not match ${MIGRATION_NAME.source}`);
      else if (/\.sql$/i.test(entry.name) && !allowed.has(path)) problems.push(`${path} is SQL outside ${MIGRATIONS}/ and not a configured seed`);
    }
  };
  walk('supabase');
  const stamps = Map.groupBy(migrations, (name) => name.slice(0, 14));
  for (const [stamp, names] of stamps) if (names.length > 1) problems.push(`${MIGRATIONS}/ repeats timestamp ${stamp}: ${names.join(', ')}`);
  for (const seed of allowed) if (!lstatOrNull(join(root, seed))?.isFile()) problems.push(`configured seed ${seed} is not a regular file`);
  return { problems, migrations };
}

const inCI = (env) => !['', '0', 'false'].includes((env.CI ?? '').trim().toLowerCase());
/** FITLOG_BASE_REF, or main locally. CI must name the trusted base itself (PL-1); a blank or all-zero value never falls back. */
export function baseRef(env) {
  const configured = env[BASE_ENV];
  if (inCI(env) && !configured?.trim()) throw new Error(`${BASE_ENV} must be set in CI to the trusted base commit (it is ${configured === undefined ? 'unset' : 'blank'})`);
  if (configured === undefined) return 'main';
  const ref = configured.trim();
  if (!ref) throw new Error(`${BASE_ENV} is blank: unset it to use main locally, or set it to the trusted base commit`);
  if (/^0+$/.test(ref)) throw new Error(`${BASE_ENV}=${ref} is the all-zero SHA, which names no commit`);
  if (ref.startsWith('-')) throw new Error(`${BASE_ENV}=${ref} looks like an option; refusing to pass it to git`);
  return ref;
}
/** The merge base of the trusted ref and HEAD. A ref that is missing, not a commit, or unrelated to HEAD (a shallow clone without the base) fails. */
function mergeBase(git, root, ref) {
  const unresolved = (run) => new Error(`Cannot resolve base ${ref}: fetch it (PL-1) or set ${BASE_ENV} (${why(run) || 'no output'})`);
  const commit = git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
  if (commit.status !== 0 || !OID.test(commit.stdout.toString('utf8').trim())) throw unresolved(commit);
  const fork = git(root, ['merge-base', commit.stdout.toString('utf8').trim(), 'HEAD']);
  if (fork.status !== 0 || !OID.test(fork.stdout.toString('utf8').trim())) throw unresolved(fork);
  return fork.stdout.toString('utf8').trim();
}
function requireTopLevel(git, root) {
  const top = git(root, ['rev-parse', '--show-toplevel']);
  if (top.status !== 0) throw new Error(`Cannot read Git state for ${root}: ${why(top)}`);
  const path = top.stdout.toString('utf8').trim();
  if (realpathSync(path) !== realpathSync(root)) throw new Error(`${root} is not the top of its Git work tree (${path})`);
}

/**
 * Every migration the merge base holds must still be in the working tree, byte for byte, as a regular file under the
 * same name. Each one is checked directly (the directory listing, lstat, and git hash-object on the file), so neither
 * rename detection, path filtering of diff output, nor an assume-unchanged flag can hide a change. git diff against the
 * base, with renames off, adds what only the index shows: a mode change, or a migration removed from the index.
 */
function baseProblems(git, root, base, label, entries) {
  const present = new Set(readdirSync(join(root, MIGRATIONS)));
  const problems = new Map();
  for (const { mode, type, oid, path } of entries) {
    const name = path.slice(MIGRATIONS.length + 1);
    const stats = name.includes('/') ? lstatOrNull(join(root, path)) : present.has(name) ? lstatSync(join(root, path)) : null;
    if (type !== 'blob' || !['100644', '100755'].includes(mode)) problems.set(path, `${path} is not a regular file at the base ${label} (mode ${mode}); this guard cannot vouch for it`);
    else if (!stats) problems.set(path, `${path} was deleted or renamed since the base ${label}; migrations on the base are append-only`);
    else if (!stats.isFile()) problems.set(path, `${path} was retyped since the base ${label} (now ${kind(stats)})`);
    else if (gitText(git, root, ['hash-object', '--', path]).trim() !== oid) problems.set(path, `${path} was modified since the base ${label}`);
  }
  const diff = gitText(git, root, ['diff', '--no-renames', '--no-ext-diff', '--no-textconv', '--name-status', '-z', base, '--', `${MIGRATIONS}/`]).split('\0');
  for (let i = 0; i + 1 < diff.length; i += 2) {
    const [status, path] = [diff[i], diff[i + 1]];
    if (status !== 'A' && !problems.has(path)) problems.set(path, `${path} is ${CHANGE[status] ?? 'changed'} against the base ${label} in the index or working tree (git diff ${status})`);
  }
  return [...problems.values()];
}

export function checkSqlSources({ root = REPO_ROOT, env = process.env, git = gitRunner() } = {}) {
  const ref = baseRef(env);
  const seeds = seedPaths(readFileSync(join(root, 'supabase/config.toml'), 'utf8'));
  const { problems, migrations } = scanSupabase(root, seeds);
  if (migrations === null) return { problems, summary: null };
  requireTopLevel(git, root);
  const base = mergeBase(git, root, ref);
  const label = `${ref}@${base.slice(0, 12)}`;
  const entries = gitText(git, root, ['ls-tree', '-r', '-z', '--full-tree', base, '--', `${MIGRATIONS}/`]).split('\0').filter(Boolean).map((line) => {
    const tab = line.indexOf('\t');
    const [mode, type, oid] = line.slice(0, tab).split(' ');
    return { mode, type, oid, path: line.slice(tab + 1) };
  }).filter(({ path }) => path.startsWith(`${MIGRATIONS}/`));
  const atBase = new Set(entries.map(({ path }) => path));
  const latest = entries.map(({ path }) => path.slice(MIGRATIONS.length + 1)).filter((name) => MIGRATION_NAME.test(name)).sort().at(-1);
  const added = migrations.filter((name) => !atBase.has(`${MIGRATIONS}/${name}`));
  const order = latest === undefined ? [] : added.filter((name) => name <= latest)
    .map((name) => `${MIGRATIONS}/${name} is new but does not sort after ${latest}, the latest migration at the base ${label}`);
  return {
    problems: [...problems, ...baseProblems(git, root, base, label, entries), ...order],
    summary: `SQL sources verified: ${migrations.length} migrations (${migrations.length - added.length} unchanged since ${label}, ${added.length} new); `
      + `configured seeds ${seeds.length ? seeds.map((seed) => `supabase/${seed}`).join(', ') : 'none'}; no other SQL under supabase/`,
  };
}

function main() {
  try {
    const { problems, summary } = checkSqlSources();
    if (problems.length) {
      process.stderr.write(`check-sql-sources failed:\n- ${problems.join('\n- ')}\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`${summary}\n`);
  } catch (error) {
    process.stderr.write(`check-sql-sources failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
function invokedDirectly() {
  try { return realpathSync(process.argv[1] ?? '') === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}
if (invokedDirectly()) main();
