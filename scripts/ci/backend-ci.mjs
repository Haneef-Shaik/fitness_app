import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { gitRunner, MIGRATION_NAME } from '../backend/check-sql-sources.mjs';
import { invokedDirectly, localDatabase, psqlFailure, REPO_ROOT } from '../backend/local-stack.mjs';

// PL-1: the steps of the hosted backend job (.github/workflows/backend-ci.yml) that need more than one shell
// line. Each command prints one result line and exits 0, or names every problem and exits 1; a usage error
// exits 2. Supabase, Docker and psql are reached only after local-stack.mjs has confirmed the isolated local
// stack, through argument arrays and never a shell. `supabase status` output, which holds keys, is never
// echoed. Values taken from the environment are quoted in messages, so none can start a log line of its own.

export const BASE_ENV = 'FITLOG_BASE_REF';
export const CONTRACT_ENV = 'FITLOG_CONTRACT_BASELINE';
const FULL_SHA = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
/** Where each trusted event keeps its base: the pull request's base commit, or the head before the push. */
const EVENT_BASE = {
  pull_request: (payload) => payload?.pull_request?.base?.sha,
  push: (payload) => payload?.before,
};
export const DIFF_SCHEMAS = ['public', 'private', 'storage'];
export const LINT_SCHEMAS = ['public', 'private'];
/** AR-1 box 3's replay checks, as run with the pinned Supabase CLI 2.121.0 (evidence/AR-1/replay-verification.md). */
export const DIFF_ARGS = [
  'exec',
  'supabase',
  'db',
  'diff',
  '--local',
  '--schema',
  DIFF_SCHEMAS.join(','),
  '--strict-coverage',
];
export const LINT_ARGS = [
  'exec',
  'supabase',
  'db',
  'lint',
  '--local',
  '--schema',
  LINT_SCHEMAS.join(','),
  '--level',
  'warning',
];
export const REPLAY_QUERY =
  'select version from supabase_migrations.schema_migrations order by version';
/** A shadow replay of every migration can take minutes on a hosted runner; the job's own timeout still applies. */
const CLI_TIMEOUT_MS = 15 * 60 * 1000;

const quoted = (value) => (value === undefined ? 'unset' : JSON.stringify(value));
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const gitText = (run) => run.stdout.toString('utf8').trim();
const gitWhy = ({ status, stderr }) =>
  [status === null ? '' : `exit ${status}`, stderr].filter(Boolean).join(': ');
/** Why a command did not succeed, from a cliRunner-shaped result. */
function why({ status, signal, error }) {
  if (status !== null && status !== undefined) return `exited ${status}`;
  if (error) return `did not run (${error})`;
  return `was stopped${signal ? ` by ${signal}` : ''}`;
}

function fullSha(name, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    const state = typeof value === 'string' ? 'blank' : 'unset';
    throw new Error(`${name} is ${state}; the workflow sets it from the event`);
  }
  if (/^0+$/.test(value)) {
    throw new Error(
      `${name} is the all-zero SHA: the push created the branch, so there is no previous head to trust`,
    );
  }
  if (!FULL_SHA.test(value)) {
    throw new Error(`${name}=${quoted(value)} is not a full lowercase 40- or 64-hex commit ID`);
  }
  return value;
}

/**
 * The one trusted base: both variables set identically by the workflow, from the event that started the run,
 * and equal to that event payload's own base (AR-1 L4). Throws for anything else.
 */
export function trustedBase(env, { readEvent = (path) => readFileSync(path, 'utf8') } = {}) {
  const event = env.GITHUB_EVENT_NAME;
  if (!Object.hasOwn(EVENT_BASE, event ?? '')) {
    throw new Error(
      `The ${quoted(event)} event gives no trusted base; only pull_request (its base commit) and push (the previous head) do`,
    );
  }
  const base = fullSha(BASE_ENV, env[BASE_ENV]);
  const contract = fullSha(CONTRACT_ENV, env[CONTRACT_ENV]);
  if (base !== contract) {
    throw new Error(
      `${BASE_ENV}=${base} and ${CONTRACT_ENV}=${contract} differ; both guards must judge against one trusted commit`,
    );
  }
  if (!env.GITHUB_EVENT_PATH) {
    throw new Error(
      'GITHUB_EVENT_PATH is unset, so the base cannot be checked against the event itself',
    );
  }
  let payload;
  try {
    payload = JSON.parse(readEvent(env.GITHUB_EVENT_PATH));
  } catch (error) {
    throw new Error(`The event payload cannot be read as JSON (${error.message})`);
  }
  const expected = EVENT_BASE[event](payload);
  if (base !== expected) {
    throw new Error(
      `${BASE_ENV}=${base} is not the ${event} event's own base (${quoted(expected)})`,
    );
  }
  return { sha: base, event };
}

/** The commit `ref` names in the clone, or null; a git that cannot run throws. */
function commitOf(git, root, ref) {
  const run = git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
  if (run.status === null) throw new Error(run.stderr || 'git did not run');
  return run.status === 0 ? gitText(run) : null;
}

/** The trusted base must be a commit in this clone (fetch-depth: 0) that shares history with HEAD, and not HEAD. */
export function checkBaseInClone({ sha, root = REPO_ROOT, git = gitRunner() }) {
  if (commitOf(git, root, sha) !== sha) {
    throw new Error(
      `The trusted base ${sha} is not a commit in this clone; check out with fetch-depth: 0`,
    );
  }
  const head = commitOf(git, root, 'HEAD');
  if (head === null) throw new Error('HEAD is not a commit in this clone');
  const fork = git(root, ['merge-base', sha, head]);
  const forkSha = fork.status === 0 ? gitText(fork) : '';
  if (!FULL_SHA.test(forkSha)) {
    throw new Error(
      `The trusted base ${sha} shares no history with HEAD ${head}, so nothing can be compared with it (${gitWhy(fork) || 'no merge base'})`,
    );
  }
  if (forkSha === head) {
    throw new Error(
      `The trusted base ${sha} forks from HEAD itself, so every guard would compare HEAD with itself`,
    );
  }
  return forkSha;
}

/**
 * AR-1 L1: check-sql-sources.test.mjs's last test judges this repository against a local `main`, which a
 * GitHub Actions checkout has only after a push to main. Create refs/heads/main at the trusted base when it is
 * absent; never move an existing one, or HEAD. `main` must then resolve to that branch, not a tag of that name.
 */
export function ensureLocalMain({ sha, root = REPO_ROOT, git = gitRunner(), env = process.env }) {
  if (env.GITHUB_ACTIONS !== 'true') {
    throw new Error(
      'local-main only prepares a GitHub Actions clone; it creates no branch anywhere else',
    );
  }
  const before = commitOf(git, root, 'refs/heads/main');
  if (before === null) {
    // An empty old value makes Git refuse if refs/heads/main appeared meanwhile.
    const created = git(root, ['update-ref', 'refs/heads/main', sha, '']);
    if (created.status !== 0) {
      throw new Error(`Cannot create refs/heads/main at ${sha} (${gitWhy(created)})`);
    }
  }
  const commit = commitOf(git, root, 'refs/heads/main');
  const resolved = commitOf(git, root, 'main');
  if (commit === null || resolved !== commit) {
    throw new Error(
      `main resolves to ${resolved ?? 'nothing'}, not to refs/heads/main (${commit ?? 'missing'}); a tag or other ref named main would mislead the SQL-source test`,
    );
  }
  return { created: before === null, commit };
}

/**
 * QA-9 R6: Jest, jest-expo and ESLint resolve shared configuration from the nearest node_modules first, so a
 * tracked path there would run ahead of the installed packages. Git may track no path with that segment.
 */
export function trackedVendorProblems({ root = REPO_ROOT, git = gitRunner() } = {}) {
  const run = git(root, ['ls-files', '-z']);
  if (run.status !== 0) throw new Error(`git ls-files failed (${gitWhy(run)})`);
  return run.stdout
    .toString('utf8')
    .split('\0')
    .filter((path) => path.split('/').some((part) => part.toLowerCase() === 'node_modules'))
    .map(
      (path) =>
        `${JSON.stringify(path)} is tracked inside a node_modules folder, where tools load it before the installed packages`,
    );
}

/** The version of every migration file, in order, by the name pattern check-sql-sources.mjs enforces. */
export function migrationVersions(root = REPO_ROOT) {
  return readdirSync(join(root, 'supabase/migrations'))
    .filter((name) => MIGRATION_NAME.test(name))
    .map((name) => name.slice(0, 14))
    .sort();
}

/** The database must record every migration file as applied, and nothing else. */
export function checkReplay({ root = REPO_ROOT, database = () => localDatabase() } = {}) {
  const files = migrationVersions(root);
  if (!files.length) {
    return { problems: ['supabase/migrations holds no migration, so nothing was replayed'] };
  }
  const db = database();
  const result = db.psql(['-At', '-c', REPLAY_QUERY]);
  if (result.status !== 0) return { problems: [psqlFailure(result)] };
  const applied = result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const problems = [
    ...files
      .filter((version) => !applied.includes(version))
      .map(
        (version) =>
          `migration ${version} is in supabase/migrations, but the database does not record it as applied`,
      ),
    ...applied
      .filter((version) => !files.includes(version))
      .map(
        (version) =>
          `the database records migration ${JSON.stringify(version)}, which supabase/migrations does not hold`,
      ),
  ];
  if (!problems.length && !isDeepStrictEqual(applied, files)) {
    problems.push(`the database records ${applied.length} migrations for ${files.length} files`);
  }
  return {
    problems,
    line: `All ${files.length} migrations (${files[0]} to ${files.at(-1)}) are recorded as applied in ${db.container} at ${db.apiUrl}, and no other`,
  };
}

/** The one JSON object, on a line of its own, that the CLI printed with `key`. */
export function cliResult(output, key) {
  const found = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('{'))
    .flatMap((line) => {
      try {
        const value = JSON.parse(line);
        return isObject(value) && Object.hasOwn(value, key) ? [value] : [];
      } catch {
        return [];
      }
    });
  if (found.length !== 1) {
    throw new Error(
      `found ${found.length} JSON results with "${key}" in its output, where exactly one was expected`,
    );
  }
  return found[0];
}

/** The summary of one run, from either stream: the CLI 2.121.0 prints it as the last line of its output. */
function summaryOf(label, run, key) {
  if (run.status !== 0) return { problems: [`${label} ${why(run)}`] };
  try {
    return { result: cliResult(`${run.stdout ?? ''}\n${run.stderr ?? ''}`, key) };
  } catch (error) {
    return {
      problems: [
        `${label} ${error.message}; this check reads the summary line Supabase CLI 2.121.0 prints`,
      ],
    };
  }
}

/** `supabase db diff` exits 0 even when it finds a difference, so the summary decides. */
export function diffProblems(run) {
  const { problems, result } = summaryOf('supabase db diff', run, 'diff');
  if (problems) return problems;
  const found = [];
  if (!isDeepStrictEqual(result.schemas, DIFF_SCHEMAS)) {
    found.push(
      `the diff covered ${JSON.stringify(result.schemas)}, not ${JSON.stringify(DIFF_SCHEMAS)}`,
    );
  }
  if (typeof result.diff !== 'string') {
    found.push(`the diff is ${JSON.stringify(result.diff)}, not text`);
  } else if (result.diff.trim()) {
    found.push(
      `the replayed schema differs from a fresh shadow replay of the migrations:\n${result.diff.trim()}`,
    );
  }
  if (!Array.isArray(result.dropStatements)) {
    found.push('the summary has no dropStatements list');
  } else {
    found.push(...result.dropStatements.map((statement) => `it would drop: ${statement}`));
  }
  return found;
}

/** `supabase db lint` exits 0 with findings unless told otherwise, so the summary decides. */
export function lintProblems(run) {
  const { problems, result } = summaryOf('supabase db lint', run, 'results');
  if (problems) return problems;
  if (!Array.isArray(result.results)) {
    return [`the lint results are ${JSON.stringify(result.results)}, not a list`];
  }
  return result.results.map((item) => `lint finding: ${JSON.stringify(item)}`);
}

/** Runs a command from an argument array with no shell, keeping both streams. */
export function cliRunner(command, args, { cwd = REPO_ROOT } = {}) {
  const run = spawnSync(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: CLI_TIMEOUT_MS,
  });
  return {
    status: run.error ? null : run.status,
    signal: run.signal,
    stdout: run.stdout ?? '',
    stderr: run.stderr ?? '',
    ...(run.error ? { error: run.error.message } : {}),
  };
}

/** Confirms the local stack, runs one Supabase CLI check, and shows the CLI's own output in the log. */
function cliCheck(args, problemsOf, done, { io, root, run, database }) {
  const db = database();
  const result = run('pnpm', args, { cwd: root });
  for (const text of [result.stderr, result.stdout]) {
    if (text) io.stderr.write(text.endsWith('\n') ? text : `${text}\n`);
  }
  return { problems: problemsOf(result), line: `${done}, in ${db.container} at ${db.apiUrl}` };
}

export const COMMANDS = {
  base: ({ env, root, git, readEvent }) => {
    const { sha, event } = trustedBase(env, { readEvent });
    const fork = checkBaseInClone({ sha, root, git });
    return {
      problems: [],
      line: `Trusted base ${sha} from the ${event} event, for ${BASE_ENV} and ${CONTRACT_ENV}; it forks from HEAD at ${fork}`,
    };
  },
  vendored: ({ root, git }) => ({
    problems: trackedVendorProblems({ root, git }),
    line: 'Git tracks no path inside a node_modules folder',
  }),
  'local-main': ({ env, root, git, readEvent }) => {
    const { sha } = trustedBase(env, { readEvent });
    checkBaseInClone({ sha, root, git });
    const { created, commit } = ensureLocalMain({ sha, root, git, env });
    return {
      problems: [],
      line: created
        ? `Created refs/heads/main at the trusted base ${commit} for the SQL-source test`
        : `Left the existing refs/heads/main at ${commit} unchanged; ${BASE_ENV} still names the trusted base ${sha}`,
    };
  },
  replay: ({ root, database }) => checkReplay({ root, database }),
  diff: (options) =>
    cliCheck(
      DIFF_ARGS,
      diffProblems,
      `supabase db diff found no difference between the replayed schemas (${DIFF_SCHEMAS.join(', ')}) and a fresh shadow replay of every migration`,
      options,
    ),
  lint: (options) =>
    cliCheck(
      LINT_ARGS,
      lintProblems,
      `supabase db lint found no warning or error in ${LINT_SCHEMAS.join(', ')}`,
      options,
    ),
};
const USAGE = `usage: node scripts/ci/backend-ci.mjs <${Object.keys(COMMANDS).join('|')}>`;

export function main(
  argv = process.argv.slice(2),
  {
    io = process,
    env = process.env,
    root = REPO_ROOT,
    git = gitRunner(),
    run = cliRunner,
    database = () => localDatabase(),
    readEvent,
  } = {},
) {
  const [command, ...extra] = argv;
  if (!Object.hasOwn(COMMANDS, command ?? '') || extra.length) {
    io.stderr.write(`${USAGE}\n`);
    return 2;
  }
  try {
    const { problems, line } = COMMANDS[command]({ io, env, root, git, run, database, readEvent });
    if (problems.length) {
      io.stderr.write(`backend-ci ${command} failed:\n- ${problems.join('\n- ')}\n`);
      return 1;
    }
    io.stdout.write(`${line}\n`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr.write(`backend-ci ${command} failed: ${message}\n`);
    return 1;
  }
}
if (invokedDirectly(import.meta.url)) process.exitCode = main();
