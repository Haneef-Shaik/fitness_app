import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// The one local Supabase stack the database checks may touch (AR-1 test-plan, ground rules): `supabase status` for the
// project must report exactly the expected loopback API URL, and psql runs in the container that project's project_id
// names. Commands are argument arrays, never a shell. Nothing printed here contains a key: status output is never echoed.

export const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const LOCAL_API_URL = 'http://127.0.0.1:55321';
const LOOPBACK_API = /^http:\/\/127\.0\.0\.1:\d{1,5}$/;
const PROJECT_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

/** Runs a command from an argument array with no shell; stdin is the given bytes, or nothing. */
export function spawnRunner(command, args, { cwd, input } = {}) {
  const run = spawnSync(command, args, { cwd, input, stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'], encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120_000 });
  return run.error ? { status: null, stdout: '', stderr: '', error: run.error.message } : { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

/** The top-level project_id of supabase/config.toml; a table's own project_id (say, a Firebase one) is not it. */
export function projectId(config) {
  const lines = config.split(/\r?\n/);
  const firstTable = lines.findIndex((line) => /^\s*\[/.test(line));
  const values = (firstTable < 0 ? lines : lines.slice(0, firstTable)).map((line) => /^\s*project_id\s*=\s*(.*?)\s*(?:#.*)?$/.exec(line)?.[1]).filter((value) => value !== undefined);
  if (values.length !== 1) throw new Error(`supabase/config.toml must set project_id once at the top level (it does ${values.length} times)`);
  const id = /^"([^"\\]*)"$/.exec(values[0])?.[1];
  if (!id || !PROJECT_ID.test(id)) throw new Error(`supabase/config.toml project_id ${values[0]} is not a plain container name`);
  return id;
}

/**
 * The checked target. By default this repository's own project at LOCAL_API_URL; anything else is refused before any
 * database command runs. A caller may inject another loopback project (for example a disposable replay project), never a
 * remote one.
 */
export function localDatabase({ projectDir = REPO_ROOT, expectedApiUrl = LOCAL_API_URL, run = spawnRunner } = {}) {
  if (!LOOPBACK_API.test(expectedApiUrl)) throw new Error(`The expected API URL ${expectedApiUrl} is not a loopback http://127.0.0.1:<port> URL; refusing`);
  const container = `supabase_db_${projectId(readFileSync(join(projectDir, 'supabase/config.toml'), 'utf8'))}`;
  const status = run('pnpm', ['exec', 'supabase', 'status', '-o', 'json', '--workdir', projectDir], { cwd: REPO_ROOT });
  if (status.status !== 0) throw new Error(`supabase status ${status.status === null ? `did not run (${status.error})` : `failed (exit ${status.status})`}; run \`pnpm exec supabase status\` to see why`);
  let apiUrl;
  try { apiUrl = JSON.parse(status.stdout)?.API_URL; } catch { throw new Error('supabase status -o json did not print JSON; its output is not shown because it holds keys'); }
  if (apiUrl !== expectedApiUrl) throw new Error(`Refusing to run against ${typeof apiUrl === 'string' ? apiUrl : '(no API_URL)'}: expected ${expectedApiUrl}, the isolated local stack`);
  return {
    container,
    apiUrl,
    /** psql as postgres in the project's database container, stopping at the first error. */
    psql: (args, input) => run('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1', ...args], input === undefined ? {} : { input }),
  };
}

/** One problem line for a failed psql run, with its own messages (psql and docker print no keys). */
export function psqlFailure({ status, stderr, error }) {
  const text = (stderr ?? '').trim();
  return `psql ${status === null ? `did not run (${error})` : `exited ${status}`}:${text.includes('\n') ? '\n' : ' '}${text}`;
}

/** A path as the result lines show it: relative inside this repository, absolute outside it. */
export function display(path) {
  const inside = relative(REPO_ROOT, resolve(path));
  return inside && !inside.startsWith('..') && !isAbsolute(inside) ? inside.split(sep).join('/') : resolve(path);
}

export function invokedDirectly(moduleUrl) {
  try { return realpathSync(process.argv[1] ?? '') === realpathSync(fileURLToPath(moduleUrl)); } catch { return false; }
}
