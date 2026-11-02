import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { devNull, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkSqlSources, gitRunner } from '../backend/check-sql-sources.mjs';
import {
  BASE_ENV,
  checkBaseInClone,
  checkReplay,
  cliResult,
  cliRunner,
  COMMANDS,
  CONTRACT_ENV,
  DIFF_ARGS,
  diffProblems,
  ensureLocalMain,
  LINT_ARGS,
  lintProblems,
  main,
  REPLAY_QUERY,
  trackedVendorProblems,
  trustedBase,
} from './backend-ci.mjs';

// Offline only. Git runs in scratch repositories under the OS temporary directory; Supabase, Docker and psql
// are injected fakes. The Supabase CLI output is AR-1's recorded run of the pinned CLI 2.121.0, read from its
// committed evidence, so the parsers are checked against what the real CLI printed.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const recorded = (name) => readFileSync(join(repoRoot, 'docs/evidence/AR-1', name), 'utf8');
const CLEAN_DIFF = recorded('replay-final-diff.log');
const DRIFT_DIFF = recorded('replay-drift-probe.log');
const CLEAN_LINT = recorded('replay-lint.log');
const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const LOCAL = {
  container: 'supabase_db_fitlog_rebuild_20261017',
  apiUrl: 'http://127.0.0.1:55321',
  psql: () => assert.fail('psql is not used here'),
};

/** No inherited Git location, CI flag or base, and no user or system Git configuration. */
const isolated = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      !key.startsWith('GIT_') &&
      !key.startsWith('GITHUB_') &&
      !['CI', BASE_ENV, CONTRACT_ENV].includes(key),
  ),
);
const gitEnv = {
  ...isolated,
  GIT_CONFIG_GLOBAL: devNull,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Fixture',
  GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
  GIT_COMMITTER_NAME: 'Fixture',
  GIT_COMMITTER_EMAIL: 'fixture@example.invalid',
};
const runner = gitRunner({ env: gitEnv });
const git = (dir, ...args) =>
  execFileSync('git', ['-C', dir, ...args], {
    env: gitEnv,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
const scratch = (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'fitlog-ci-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const write = (root, path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};
const commitAll = (root, message) => {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', message);
  return git(root, 'rev-parse', 'HEAD');
};
/** Two commits on a branch that is not main: base, then head. */
function repo(t) {
  const root = scratch(t);
  git(root, 'init', '-q', '-b', 'work');
  write(root, 'one.txt', 'one\n');
  const base = commitAll(root, 'base');
  write(root, 'two.txt', 'two\n');
  return { root, base, head: commitAll(root, 'head') };
}
/** A GitHub Actions environment for `event`, both variables at `sha`, the payload served by readEvent. */
function actions(event, payload, sha = A) {
  return {
    env: {
      GITHUB_ACTIONS: 'true',
      GITHUB_EVENT_NAME: event,
      GITHUB_EVENT_PATH: '/github/workflow/event.json',
      [BASE_ENV]: sha,
      [CONTRACT_ENV]: sha,
    },
    readEvent: (path) => {
      assert.equal(path, '/github/workflow/event.json');
      return JSON.stringify(payload);
    },
  };
}
const io = () => {
  const out = [];
  const err = [];
  const stream = (into) => ({ write: (text) => into.push(text) });
  return { out, err, io: { stdout: stream(out), stderr: stream(err) } };
};

test('the trusted base is the pull request base or the previous push head, in both variables', () => {
  const pr = actions('pull_request', { pull_request: { base: { sha: A }, head: { sha: B } } });
  assert.deepEqual(trustedBase(pr.env, pr), { sha: A, event: 'pull_request' });
  const push = actions('push', { before: A, after: B });
  assert.deepEqual(trustedBase(push.env, push), { sha: A, event: 'push' });
  const sha256 = 'c'.repeat(64);
  const long = actions('push', { before: sha256 }, sha256);
  assert.deepEqual(trustedBase(long.env, long), { sha: sha256, event: 'push' });
});

test('a missing, blank, all-zero, short, symbolic or padded base fails before Git runs', () => {
  const cases = [
    [undefined, /is unset/],
    ['', /is blank/],
    ['   ', /is blank/],
    ['0'.repeat(40), /is the all-zero SHA/],
    ['abc1234', /is not a full lowercase 40- or 64-hex commit ID/],
    ['main', /is not a full/],
    ['HEAD', /is not a full/],
    [A.toUpperCase(), /is not a full/],
    [` ${A}`, /is not a full/],
    [`${A}\n::stop-commands::pl1`, /is not a full/],
  ];
  for (const name of [BASE_ENV, CONTRACT_ENV]) {
    for (const [value, expected] of cases) {
      const { env, readEvent } = actions('push', { before: A });
      assert.throws(
        () => trustedBase({ ...env, [name]: value }, { readEvent }),
        (error) => {
          assert.match(error.message, new RegExp(`^${name}`));
          assert.match(error.message, expected);
          assert.doesNotMatch(
            error.message,
            /\n/,
            'a value is quoted, so it cannot start a log line',
          );
          return true;
        },
        `${name}=${JSON.stringify(value)}`,
      );
    }
  }
});

test('the two variables must name one commit', () => {
  const { env, readEvent } = actions('push', { before: A });
  assert.throws(
    () => trustedBase({ ...env, [CONTRACT_ENV]: B }, { readEvent }),
    new RegExp(`^Error: ${BASE_ENV}=${A} and ${CONTRACT_ENV}=${B} differ; both guards must judge`),
  );
});

test('only pull_request and push events carry a trusted base', () => {
  const events = [
    undefined,
    '',
    'workflow_dispatch',
    'pull_request_target',
    'merge_group',
    'schedule',
    'constructor',
  ];
  for (const event of events) {
    const { env, readEvent } = actions('push', { before: A, pull_request: { base: { sha: A } } });
    assert.throws(
      () => trustedBase({ ...env, GITHUB_EVENT_NAME: event }, { readEvent }),
      /event gives no trusted base; only pull_request \(its base commit\) and push \(the previous head\) do/,
      String(event),
    );
  }
});

test("the base must be the event payload's own base", () => {
  const pr = actions('pull_request', { pull_request: { base: { sha: B }, head: { sha: A } } });
  assert.throws(
    () => trustedBase(pr.env, pr),
    /is not the pull_request event's own base \("b{40}"\)/,
  );
  const push = actions('push', { before: B, after: A });
  assert.throws(() => trustedBase(push.env, push), /is not the push event's own base \("b{40}"\)/);
  const { env } = actions('push', { before: A });
  const unreadable = () => {
    throw new Error('ENOENT: no such file');
  };
  assert.throws(() => trustedBase(env, { readEvent: () => 'null' }), /own base \(unset\)/);
  assert.throws(
    () => trustedBase(env, { readEvent: () => 'not json' }),
    /^Error: The event payload cannot be read as JSON/,
  );
  assert.throws(
    () => trustedBase(env, { readEvent: unreadable }),
    /cannot be read as JSON \(ENOENT: no such file\)/,
  );
  assert.throws(
    () => trustedBase({ ...env, GITHUB_EVENT_PATH: '' }, push),
    /^Error: GITHUB_EVENT_PATH is unset, so the base cannot be checked against the event itself$/,
  );
});

test('the base must be a commit in this clone that shares history with HEAD and is not HEAD', (t) => {
  const { root, base, head } = repo(t);
  const check = (sha, git = runner) => checkBaseInClone({ sha, root, git });
  assert.equal(check(base), base);
  assert.throws(
    () => check('f'.repeat(40)),
    /is not a commit in this clone; check out with fetch-depth: 0/,
  );
  assert.throws(
    () => check(git(root, 'rev-parse', 'HEAD^{tree}')),
    /is not a commit in this clone/,
  );
  assert.throws(() => check(head), /forks from HEAD itself, so every guard would compare HEAD/);
  git(root, 'checkout', '-q', '--orphan', 'unrelated');
  const unrelated = commitAll(root, 'unrelated history');
  git(root, 'checkout', '-q', 'work');
  assert.throws(() => check(unrelated), /shares no history with HEAD/);
  const noGit = gitRunner({ binary: join(root, 'no-such-git'), env: gitEnv });
  assert.throws(() => check(base, noGit), /git did not run/);
});

test('local-main creates refs/heads/main at the trusted base only when absent, and never moves HEAD', (t) => {
  const { root, base, head } = repo(t);
  const env = { GITHUB_ACTIONS: 'true' };
  assert.deepEqual(ensureLocalMain({ sha: base, root, git: runner, env }), {
    created: true,
    commit: base,
  });
  assert.equal(git(root, 'rev-parse', 'refs/heads/main'), base);
  assert.deepEqual(ensureLocalMain({ sha: head, root, git: runner, env }), {
    created: false,
    commit: base,
  });
  assert.equal(git(root, 'rev-parse', 'refs/heads/main'), base, 'an existing main is never moved');
  assert.equal(git(root, 'symbolic-ref', 'HEAD'), 'refs/heads/work');
  assert.equal(git(root, 'rev-parse', 'HEAD'), head);
});

test('a push to main keeps its checked-out main', (t) => {
  const { root, base, head } = repo(t);
  git(root, 'branch', '-m', 'work', 'main');
  const env = { GITHUB_ACTIONS: 'true' };
  assert.deepEqual(ensureLocalMain({ sha: base, root, git: runner, env }), {
    created: false,
    commit: head,
  });
  assert.equal(git(root, 'rev-parse', 'refs/heads/main'), head);
});

test('a tag named main that shadows the branch fails, and outside Actions no branch is made', (t) => {
  const { root, base, head } = repo(t);
  git(root, 'tag', 'main', head);
  assert.throws(
    () => ensureLocalMain({ sha: base, root, git: runner, env: { GITHUB_ACTIONS: 'true' } }),
    new RegExp(`^Error: main resolves to ${head}, not to refs/heads/main \\(${base}\\)`),
  );
  const other = repo(t);
  for (const env of [{}, { GITHUB_ACTIONS: 'false' }, { CI: 'true' }]) {
    assert.throws(
      () => ensureLocalMain({ sha: other.base, root: other.root, git: runner, env }),
      /^Error: local-main only prepares a GitHub Actions clone/,
      JSON.stringify(env),
    );
  }
  assert.throws(() => git(other.root, 'rev-parse', '--verify', '--quiet', 'refs/heads/main'));
});

test('Git may track no path inside a node_modules folder (QA-9 R6)', (t) => {
  const { root } = repo(t);
  assert.deepEqual(trackedVendorProblems({ root, git: runner }), []);
  write(root, 'docs/node_modules.md', 'a name, not a folder\n');
  write(root, 'apps/mobile/node_modules/jest-expo/jest-preset.js', 'module.exports = {};\n');
  write(root, 'tools/Node_Modules/x.js', '\n');
  mkdirSync(join(root, 'apps/web'), { recursive: true });
  symlinkSync('../../elsewhere', join(root, 'apps/web/node_modules'));
  git(root, 'add', '-f', '-A');
  const why =
    'is tracked inside a node_modules folder, where tools load it before the installed packages';
  assert.deepEqual(trackedVendorProblems({ root, git: runner }), [
    `"apps/mobile/node_modules/jest-expo/jest-preset.js" ${why}`,
    `"apps/web/node_modules" ${why}`,
    `"tools/Node_Modules/x.js" ${why}`,
  ]);
});

/** A fake local stack whose psql prints `stdout`, or fails, recording each call. */
function stack(stdout, status = 0) {
  const calls = [];
  const stderr =
    status === 0 ? '' : 'ERROR:  relation "supabase_migrations.schema_migrations" missing';
  const psql = (args) => {
    calls.push(args);
    return { status, stdout, stderr };
  };
  return { calls, database: () => ({ ...LOCAL, container: 'supabase_db_fixture', psql }) };
}

test('replay passes only when the database records exactly the migration files as applied', (t) => {
  const root = scratch(t);
  for (const name of ['20260101000000_one.sql', '20260102000000_two.sql', 'notes.md']) {
    write(root, `supabase/migrations/${name}`, '');
  }
  const ok = stack('20260101000000\n20260102000000\n');
  assert.deepEqual(checkReplay({ root, database: ok.database }), {
    problems: [],
    line: 'All 2 migrations (20260101000000 to 20260102000000) are recorded as applied in supabase_db_fixture at http://127.0.0.1:55321, and no other',
  });
  assert.deepEqual(ok.calls, [['-At', '-c', REPLAY_QUERY]]);
  assert.equal(
    REPLAY_QUERY,
    'select version from supabase_migrations.schema_migrations order by version',
  );
  assert.deepEqual(checkReplay({ root, database: stack('20260101000000\n').database }).problems, [
    'migration 20260102000000 is in supabase/migrations, but the database does not record it as applied',
  ]);
  const extra = stack('20260101000000\n20260102000000\n20260103000000\n');
  assert.deepEqual(checkReplay({ root, database: extra.database }).problems, [
    'the database records migration "20260103000000", which supabase/migrations does not hold',
  ]);
  assert.match(
    checkReplay({ root, database: stack('', 1).database }).problems.join('\n'),
    /^psql exited 1: ERROR: {2}relation/,
  );
  const empty = scratch(t);
  mkdirSync(join(empty, 'supabase/migrations'), { recursive: true });
  let touched = false;
  const database = () => {
    touched = true;
  };
  assert.deepEqual(checkReplay({ root: empty, database }).problems, [
    'supabase/migrations holds no migration, so nothing was replayed',
  ]);
  assert.equal(touched, false, 'the database is not asked when there is nothing to compare');
});

test('diff reads the recorded CLI output: the clean replay passes, the drift probe fails', () => {
  assert.deepEqual(diffProblems({ status: 0, stdout: '', stderr: CLEAN_DIFF }), []);
  assert.deepEqual(diffProblems({ status: 0, stdout: CLEAN_DIFF, stderr: '' }), []);
  const drift = diffProblems({ status: 0, stdout: DRIFT_DIFF, stderr: '' }).join('\n');
  assert.match(
    drift,
    /the replayed schema differs from a fresh shadow replay of the migrations:\nDROP TABLE "public"\."ar1_drift_probe";/,
  );
  assert.match(drift, /it would drop: DROP TABLE "public"\."ar1_drift_probe"/);
  assert.match(
    drift,
    /the diff covered \["public","private"\], not \["public","private","storage"\]/,
  );
});

test('diff fails closed on a failed run, a missing or repeated summary, or one it cannot vouch for', () => {
  const summary = (fields) =>
    JSON.stringify({
      diff: '',
      schemas: ['public', 'private', 'storage'],
      dropStatements: [],
      message: 'Diff complete.',
      ...fields,
    });
  const ok = (stdout) => ({ status: 0, stdout, stderr: '' });
  const cases = [
    [{ status: 1, stdout: CLEAN_DIFF, stderr: '' }, /^supabase db diff exited 1$/],
    [
      { status: null, stdout: '', stderr: '', error: 'spawnSync pnpm ENOENT' },
      /^supabase db diff did not run \(spawnSync pnpm ENOENT\)$/,
    ],
    [
      { status: null, signal: 'SIGTERM', stdout: '', stderr: '' },
      /^supabase db diff was stopped by SIGTERM$/,
    ],
    [ok('No schema changes found\n'), /found 0 JSON results with "diff"/],
    [ok(`${summary({})}\n${summary({})}\n`), /found 2 JSON results with "diff"/],
    [ok(summary({ diff: null })), /^the diff is null, not text$/],
    [ok(summary({ dropStatements: undefined })), /^the summary has no dropStatements list$/],
    [ok(summary({ schemas: ['public'] })), /^the diff covered \["public"\]/],
    [
      ok(summary({ diff: 'ALTER TABLE x ADD COLUMN y integer;\n' })),
      /differs from a fresh shadow replay of the migrations:\nALTER TABLE x/,
    ],
  ];
  for (const [run, expected] of cases) {
    assert.match(diffProblems(run).join('\n'), expected, JSON.stringify(run).slice(0, 80));
  }
});

test('lint reads the recorded CLI output: no results passes, any finding or failure fails', () => {
  assert.deepEqual(lintProblems({ status: 0, stdout: CLEAN_LINT, stderr: '' }), []);
  const finding = {
    function: 'private.example',
    issues: [{ level: 'warning', message: 'never read variable "x"' }],
  };
  const found = JSON.stringify({ results: [finding], message: 'db lint' });
  assert.deepEqual(lintProblems({ status: 0, stdout: found, stderr: '' }), [
    `lint finding: ${JSON.stringify(finding)}`,
  ]);
  assert.deepEqual(lintProblems({ status: 1, stdout: CLEAN_LINT, stderr: '' }), [
    'supabase db lint exited 1',
  ]);
  assert.match(
    lintProblems({ status: 0, stdout: 'No schema errors found\n', stderr: '' }).join(),
    /found 0 JSON results with "results"/,
  );
  assert.deepEqual(
    lintProblems({ status: 0, stdout: '{"results":{},"message":"db lint"}', stderr: '' }),
    ['the lint results are {}, not a list'],
  );
});

test('the summary is one JSON object on its own line, also in CRLF output', () => {
  assert.deepEqual(
    cliResult('Linting...\r\n  {"results":[],"message":"db lint"}  \r\n', 'results'),
    {
      results: [],
      message: 'db lint',
    },
  );
  assert.throws(() => cliResult('{"results": [], "message": "x"', 'results'), /found 0/);
  assert.throws(() => cliResult('[{"results":[]}]', 'results'), /found 0/);
  assert.throws(() => cliResult('{"message":"db lint"}', 'results'), /found 0/);
});

test('diff and lint confirm the local stack, then run the pinned CLI as argument arrays', () => {
  assert.deepEqual(DIFF_ARGS, [
    'exec',
    'supabase',
    'db',
    'diff',
    '--local',
    '--schema',
    'public,private,storage',
    '--strict-coverage',
  ]);
  assert.deepEqual(LINT_ARGS, [
    'exec',
    'supabase',
    'db',
    'lint',
    '--local',
    '--schema',
    'public,private',
    '--level',
    'warning',
  ]);
  const cases = [
    [
      'diff',
      DIFF_ARGS,
      CLEAN_DIFF,
      /No schema changes found/,
      'supabase db diff found no difference between the replayed schemas (public, private, storage) and a fresh shadow replay of every migration, in supabase_db_fitlog_rebuild_20261017 at http://127.0.0.1:55321\n',
    ],
    [
      'lint',
      LINT_ARGS,
      CLEAN_LINT,
      /No schema errors found/,
      'supabase db lint found no warning or error in public, private, in supabase_db_fitlog_rebuild_20261017 at http://127.0.0.1:55321\n',
    ],
  ];
  for (const [command, args, output, shown, line] of cases) {
    const order = [];
    const calls = [];
    const run = (program, argv, options) => {
      order.push('cli');
      calls.push({ program, argv, options });
      return { status: 0, stdout: '', stderr: output };
    };
    const database = () => {
      order.push('stack');
      return LOCAL;
    };
    const out = io();
    assert.equal(
      main([command], { io: out.io, run, database, root: repoRoot }),
      0,
      out.err.join(''),
    );
    assert.deepEqual(order, ['stack', 'cli'], 'the stack is confirmed before the CLI runs');
    assert.deepEqual(calls, [{ program: 'pnpm', argv: args, options: { cwd: repoRoot } }]);
    assert.deepEqual(out.out, [line]);
    assert.match(out.err.join(''), shown, "the CLI's own output is in the log");
  }
});

test('a refused stack stops diff and lint before the CLI runs, and a failing CLI exits 1', () => {
  const refuse = () => {
    throw new Error(
      'Refusing to run against http://127.0.0.1:54321: expected http://127.0.0.1:55321',
    );
  };
  for (const command of ['diff', 'lint']) {
    let ran = false;
    const refused = io();
    const run = () => {
      ran = true;
    };
    assert.equal(main([command], { io: refused.io, database: refuse, run }), 1);
    assert.equal(ran, false);
    assert.match(
      refused.err.join(''),
      new RegExp(`^backend-ci ${command} failed: Refusing to run`),
    );
    const failed = io();
    const boom = () => ({ status: 3, stdout: '', stderr: 'boom\n' });
    assert.equal(main([command], { io: failed.io, database: () => LOCAL, run: boom }), 1);
    assert.equal(
      failed.err.join(''),
      `boom\nbackend-ci ${command} failed:\n- supabase db ${command} exited 3\n`,
    );
    assert.deepEqual(failed.out, []);
  }
});

test('the command line takes exactly one known command; anything else is a usage error', () => {
  assert.deepEqual(Object.keys(COMMANDS), [
    'base',
    'vendored',
    'local-main',
    'replay',
    'diff',
    'lint',
  ]);
  for (const argv of [[], ['nope'], ['diff', 'extra'], ['toString'], ['__proto__']]) {
    const usage = io();
    assert.equal(main(argv, { io: usage.io }), 2, JSON.stringify(argv));
    assert.deepEqual(usage.err, [
      'usage: node scripts/ci/backend-ci.mjs <base|vendored|local-main|replay|diff|lint>\n',
    ]);
  }
});

test('base, vendored and local-main print one line and exit 0, or name the problem and exit 1', (t) => {
  const { root, base, head } = repo(t);
  const { env, readEvent } = actions('push', { before: base, after: head }, base);
  const options = { root, git: runner, env, readEvent };
  const ran = (argv, extra = {}) => {
    const out = io();
    const status = main(argv, { ...options, ...extra, io: out.io });
    return { status, out: out.out, err: out.err };
  };
  assert.deepEqual(ran(['base']), {
    status: 0,
    out: [
      `Trusted base ${base} from the push event, for FITLOG_BASE_REF and FITLOG_CONTRACT_BASELINE; it forks from HEAD at ${base}\n`,
    ],
    err: [],
  });
  assert.deepEqual(ran(['vendored']).out, ['Git tracks no path inside a node_modules folder\n']);
  assert.deepEqual(ran(['local-main']).out, [
    `Created refs/heads/main at the trusted base ${base} for the SQL-source test\n`,
  ]);
  assert.deepEqual(ran(['local-main']).out, [
    `Left the existing refs/heads/main at ${base} unchanged; FITLOG_BASE_REF still names the trusted base ${base}\n`,
  ]);
  assert.deepEqual(ran(['base'], { env: { ...env, [CONTRACT_ENV]: '' } }), {
    status: 1,
    out: [],
    err: [
      'backend-ci base failed: FITLOG_CONTRACT_BASELINE is blank; the workflow sets it from the event\n',
    ],
  });
  const atHead = actions('push', { before: head }, head);
  const refused = ran(['local-main'], atHead);
  assert.equal(refused.status, 1);
  assert.match(refused.err.join(''), /forks from HEAD itself/);
});

test('a pull-request checkout, a detached merge with no local branch, gets main at the base and the edited migration fails (L3)', (t) => {
  const root = scratch(t);
  const migration = 'supabase/migrations/20260101000000_one.sql';
  git(root, 'init', '-q', '-b', 'trunk');
  write(root, 'supabase/config.toml', 'project_id = "fixture"\n');
  write(root, migration, 'create table one (id integer);\n');
  const base = commitAll(root, 'base');
  git(root, 'checkout', '-q', '-b', 'feature');
  write(root, migration, 'create table one (id bigint);\n');
  const prHead = commitAll(root, 'edit a migration that is on the base');
  git(root, 'checkout', '-q', '--detach', base);
  git(root, 'merge', '-q', '--no-ff', '--no-edit', 'feature');
  const merge = git(root, 'rev-parse', 'HEAD');
  for (const branch of ['trunk', 'feature']) git(root, 'branch', '-q', '-D', branch);
  assert.equal(
    git(root, 'for-each-ref', 'refs/heads/'),
    '',
    'no local branch, as in a pull-request checkout',
  );
  assert.deepEqual(git(root, 'rev-parse', 'HEAD^1', 'HEAD^2').split('\n'), [base, prHead]);

  const { env, readEvent } = actions(
    'pull_request',
    { pull_request: { base: { sha: base }, head: { sha: prHead } } },
    base,
  );
  const ran = (command) => {
    const out = io();
    const status = main([command], { root, git: runner, env, readEvent, io: out.io });
    return { status, out: out.out, err: out.err };
  };
  assert.deepEqual(ran('base'), {
    status: 0,
    out: [
      `Trusted base ${base} from the pull_request event, for FITLOG_BASE_REF and FITLOG_CONTRACT_BASELINE; it forks from HEAD at ${base}\n`,
    ],
    err: [],
  });
  assert.deepEqual(ran('local-main'), {
    status: 0,
    out: [`Created refs/heads/main at the trusted base ${base} for the SQL-source test\n`],
    err: [],
  });
  assert.equal(git(root, 'rev-parse', 'refs/heads/main'), base);
  assert.equal(git(root, 'rev-parse', 'HEAD'), merge, 'HEAD stays the detached merge commit');
  assert.throws(
    () => git(root, 'symbolic-ref', '-q', 'HEAD'),
    /Command failed/,
    'HEAD is still detached',
  );

  const modified = (label) => [`${migration} was modified since the base ${label}`];
  assert.deepEqual(
    checkSqlSources({ root, env: {}, git: runner }).problems,
    modified(`main@${base.slice(0, 12)}`),
    'the SQL-source test reads the local main that local-main created',
  );
  assert.deepEqual(
    checkSqlSources({ root, env: { CI: '1', [BASE_ENV]: base }, git: runner }).problems,
    modified(`${base}@${base.slice(0, 12)}`),
    'pnpm backend:test reads FITLOG_BASE_REF in CI',
  );
});

test('the default runner keeps the exit code and both streams, and passes arguments with no shell', (t) => {
  const literal = '$(echo injected); | * `x` "q"';
  const script =
    'process.stdout.write(process.argv[1]); process.stderr.write("err"); process.exit(3)';
  assert.deepEqual(cliRunner(process.execPath, ['-e', script, literal], { cwd: scratch(t) }), {
    status: 3,
    signal: null,
    stdout: literal,
    stderr: 'err',
  });
  const missing = cliRunner(join(scratch(t), 'no-such-binary'), []);
  assert.equal(missing.status, null);
  assert.match(missing.error, /ENOENT/);
  assert.deepEqual(diffProblems(missing), [`supabase db diff did not run (${missing.error})`]);
});
