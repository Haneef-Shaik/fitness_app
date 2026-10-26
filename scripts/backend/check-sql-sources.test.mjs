import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { devNull, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkSqlSources, gitRunner, seedPaths } from './check-sql-sources.mjs';

// Every Git fixture is a scratch repository under the OS temporary directory. Nothing here writes to this
// repository; the last test only reads it.
const cli = fileURLToPath(new URL('./check-sql-sources.mjs', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
/** No inherited Git location, CI flag or base ref, and no user or system Git configuration (signing, hooks, templates). */
const isolated = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_') && key !== 'CI' && key !== 'FITLOG_BASE_REF'));
const gitEnv = { ...isolated, GIT_CONFIG_GLOBAL: devNull, GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.invalid', GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.invalid' };
const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { env: gitEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const scratch = (t, prefix = 'fitlog-sql-') => {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const write = (root, path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};
const CONFIG = 'project_id = "fixture"\n\n[db.seed]\nenabled = true\nsql_paths = ["./seed.sql"]\n';
const ONE = 'supabase/migrations/20260101000000_one.sql';
const TWO = 'supabase/migrations/20260102000000_two.sql';

/** main holds two migrations and one configured seed; the work branch is checked out on top of it. */
function fixtureRepo(t) {
  const root = scratch(t);
  write(root, 'supabase/config.toml', CONFIG);
  write(root, 'supabase/seed.sql', 'select 1;\n');
  write(root, ONE, 'create table one(id integer);\n');
  write(root, TWO, 'create table two(id integer);\n');
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'base');
  git(root, 'checkout', '-q', '-b', 'work');
  return root;
}
const commitAll = (root, message) => { git(root, 'add', '-A'); git(root, 'commit', '-q', '-m', message); };
const check = (root, env = {}) => checkSqlSources({ root, env, git: gitRunner({ env: gitEnv }) });
const problems = (root, env) => check(root, env).problems.join('\n');

test('a clean branch passes, and a new migration that sorts last is accepted', (t) => {
  const root = fixtureRepo(t);
  assert.deepEqual(check(root).problems, []);
  write(root, 'supabase/migrations/20260103000000_three.sql', 'create table three(id integer);\n');
  const result = check(root);
  assert.deepEqual(result.problems, []);
  assert.match(result.summary, /^SQL sources verified: 3 migrations \(2 unchanged since main@[0-9a-f]{12}, 1 new\); configured seeds supabase\/seed\.sql; no other SQL under supabase\/$/);
});

test('an uncommitted edit to a base migration fails (M2.2 shape), and the restored file passes', (t) => {
  const root = fixtureRepo(t);
  appendFileSync(join(root, ONE), '-- probe\n');
  assert.match(problems(root), /^supabase\/migrations\/20260101000000_one\.sql was modified since the base main@[0-9a-f]{12}$/m);
  writeFileSync(join(root, ONE), 'create table one(id integer);\n');
  assert.deepEqual(check(root).problems, []);
});

test('an edit that git diff cannot see (assume-unchanged) still fails', (t) => {
  const root = fixtureRepo(t);
  git(root, 'update-index', '--assume-unchanged', ONE);
  appendFileSync(join(root, ONE), '-- hidden\n');
  assert.equal(git(root, 'diff', '--name-only', 'main', '--', 'supabase/migrations'), '', 'git diff alone misses this edit');
  assert.match(problems(root), /20260101000000_one\.sql was modified since the base/);
});

test('committed edits, deletions and renames of base migrations fail', (t) => {
  const cases = [
    ['edit', (root) => appendFileSync(join(root, TWO), '-- changed\n'), /two\.sql was modified since the base/],
    ['delete', (root) => rmSync(join(root, TWO)), /two\.sql was deleted or renamed since the base/],
    ['rename inside migrations', (root) => git(root, 'mv', TWO, 'supabase/migrations/20260102000001_two.sql'), /two\.sql was deleted or renamed since the base/],
    ['chmod +x', (root) => chmodSync(join(root, TWO), 0o755), /two\.sql is modified against the base .*\(git diff M\)/],
  ];
  for (const [label, change, expected] of cases) {
    const root = fixtureRepo(t);
    change(root);
    commitAll(root, label);
    assert.match(problems(root), expected, label);
  }
});

test('a rename out of supabase/migrations fails, although a path filter on git diff output would miss it', (t) => {
  const root = fixtureRepo(t);
  mkdirSync(join(root, 'docs'));
  git(root, 'mv', TWO, 'docs/two.sql');
  commitAll(root, 'move a migration away');
  assert.deepEqual(git(root, 'diff', '--name-only', '-M', 'main', 'HEAD').split('\n'), ['docs/two.sql'], 'rename detection reports only the new path');
  assert.match(problems(root), /^supabase\/migrations\/20260102000000_two\.sql was deleted or renamed since the base main@/m);
});

test('a base migration replaced by a symbolic link to identical text is retyped and fails', (t) => {
  const root = fixtureRepo(t);
  write(root, 'elsewhere/one.sql', readFileSync(join(root, ONE), 'utf8'));
  rmSync(join(root, ONE));
  symlinkSync('../../elsewhere/one.sql', join(root, ONE));
  const found = problems(root);
  assert.match(found, /20260101000000_one\.sql was retyped since the base main@[0-9a-f]{12} \(now a symbolic link\)/);
  assert.match(found, /^supabase\/migrations\/20260101000000_one\.sql is a symbolic link/m);
});

test('a base migration removed from the index but left on disk fails', (t) => {
  const root = fixtureRepo(t);
  git(root, 'rm', '-q', '--cached', ONE);
  assert.match(problems(root), /20260101000000_one\.sql is deleted against the base main@[0-9a-f]{12} in the index or working tree \(git diff D\)/);
});

test('a stray SQL file fails (M2.1 shape), and a symbolic link is reported, never followed', (t) => {
  const root = fixtureRepo(t);
  write(root, 'supabase/zz-probe.sql', 'select 1;\n');
  write(root, 'supabase/functions/helper.SQL', 'select 1;\n');
  const outside = scratch(t, 'fitlog-sql-outside-');
  write(outside, 'hidden.sql', 'select 1;\n');
  symlinkSync(outside, join(root, 'supabase/linked'));
  const found = check(root).problems;
  assert.deepEqual(found, [
    'supabase/functions/helper.SQL is SQL outside supabase/migrations/ and not a configured seed',
    'supabase/linked is a symbolic link; links under supabase/ are refused, not followed',
    'supabase/zz-probe.sql is SQL outside supabase/migrations/ and not a configured seed',
  ]);
  for (const path of ['supabase/zz-probe.sql', 'supabase/functions', 'supabase/linked']) rmSync(join(root, path), { recursive: true });
  assert.deepEqual(check(root).problems, []);
});

test('a seed is allowed only while config.toml lists it, and a listed seed must exist', (t) => {
  const root = fixtureRepo(t);
  write(root, 'supabase/config.toml', 'project_id = "fixture"\n');
  assert.deepEqual(check(root).problems, ['supabase/seed.sql is SQL outside supabase/migrations/ and not a configured seed']);
  write(root, 'supabase/config.toml', CONFIG.replace('["./seed.sql"]', '["./seed.sql", "./missing.sql"]'));
  assert.deepEqual(check(root).problems, ['configured seed supabase/missing.sql is not a regular file']);
});

test('migration names must match the pattern, sit directly in migrations/, and not repeat a timestamp', (t) => {
  const root = fixtureRepo(t);
  write(root, 'supabase/migrations/20260103000000_again.sql', '');
  write(root, 'supabase/migrations/20260103000000_more.sql', '');
  write(root, 'supabase/migrations/2026_short.sql', '');
  write(root, 'supabase/migrations/20260104000000_Upper.sql', '');
  write(root, 'supabase/migrations/notes.md', '');
  write(root, 'supabase/migrations/nested/20260105000000_deep.sql', '');
  assert.deepEqual(check(root).problems, [
    'supabase/migrations/20260104000000_Upper.sql does not match ^\\d{14}_[a-z0-9_]+\\.sql$',
    'supabase/migrations/2026_short.sql does not match ^\\d{14}_[a-z0-9_]+\\.sql$',
    'supabase/migrations/nested/ is a directory; migrations are files directly in supabase/migrations/',
    'supabase/migrations/notes.md does not match ^\\d{14}_[a-z0-9_]+\\.sql$',
    'supabase/migrations/ repeats timestamp 20260103000000: 20260103000000_again.sql, 20260103000000_more.sql',
  ]);
});

test('a new migration must sort after every migration on the base', (t) => {
  const root = fixtureRepo(t);
  write(root, 'supabase/migrations/20260101120000_between.sql', '');
  assert.match(problems(root), /^supabase\/migrations\/20260101120000_between\.sql is new but does not sort after 20260102000000_two\.sql, the latest migration at the base main@[0-9a-f]{12}$/m);
});

test('CI requires FITLOG_BASE_REF, and a blank or all-zero value is refused (M2.4 shape)', (t) => {
  const root = fixtureRepo(t);
  for (const env of [{ CI: 'true' }, { CI: '1', FITLOG_BASE_REF: '' }, { CI: 'true', FITLOG_BASE_REF: '  ' }]) {
    assert.throws(() => check(root, env), /FITLOG_BASE_REF must be set in CI to the trusted base commit/, JSON.stringify(env));
  }
  assert.throws(() => check(root, { FITLOG_BASE_REF: ' ' }), /FITLOG_BASE_REF is blank/);
  assert.throws(() => check(root, { CI: 'true', FITLOG_BASE_REF: '0'.repeat(40) }), /all-zero SHA/);
  for (const env of [{ CI: 'false' }, { CI: '0' }, {}]) assert.match(check(root, env).summary, /since main@/, JSON.stringify(env));
  const base = git(root, 'rev-parse', 'main');
  assert.match(check(root, { CI: 'true', FITLOG_BASE_REF: base }).summary, new RegExp(`since ${base}@${base.slice(0, 12)}`));
});

test('a base that is not a commit sharing history with HEAD fails closed (M2.3 shape)', (t) => {
  const root = fixtureRepo(t);
  assert.throws(() => check(root, { FITLOG_BASE_REF: 'refs/heads/ar1-no-such-ref' }), /Cannot resolve base refs\/heads\/ar1-no-such-ref: fetch it \(PL-1\) or set FITLOG_BASE_REF/);
  assert.throws(() => check(root, { CI: 'true', FITLOG_BASE_REF: 'main^{tree}' }), /Cannot resolve base main\^\{tree\}/);
  assert.throws(() => check(root, { FITLOG_BASE_REF: '--output=probe' }), /looks like an option/);
  git(root, 'checkout', '-q', '--orphan', 'unrelated');
  commitAll(root, 'unrelated history');
  git(root, 'checkout', '-q', 'work');
  assert.throws(() => check(root, { FITLOG_BASE_REF: 'unrelated' }), /Cannot resolve base unrelated: fetch it \(PL-1\)/);
});

test('a shallow clone that lacks the base fails closed instead of passing', (t) => {
  const origin = fixtureRepo(t);
  const base = git(origin, 'rev-parse', 'main');
  write(origin, 'notes.txt', 'later\n');
  commitAll(origin, 'later');
  const clone = join(scratch(t), 'clone');
  execFileSync('git', ['clone', '-q', '--depth', '1', '--branch', 'work', pathToFileURL(origin).href, clone], { env: gitEnv, stdio: 'ignore' });
  assert.throws(() => check(clone, { CI: 'true', FITLOG_BASE_REF: base }), /Cannot resolve base [0-9a-f]{40}: fetch it \(PL-1\)/);
});

test('outside a Git work tree, below its top, or without a git binary, the check fails closed', (t) => {
  const plain = scratch(t);
  write(plain, 'supabase/config.toml', CONFIG);
  write(plain, 'supabase/seed.sql', '');
  mkdirSync(join(plain, 'supabase/migrations'));
  assert.throws(() => check(plain), /Cannot read Git state for /);
  const root = fixtureRepo(t);
  write(root, 'nested/supabase/config.toml', CONFIG);
  write(root, 'nested/supabase/seed.sql', '');
  mkdirSync(join(root, 'nested/supabase/migrations'));
  assert.throws(() => check(join(root, 'nested')), /is not the top of its Git work tree/);
  assert.throws(() => checkSqlSources({ root, env: {}, git: gitRunner({ binary: join(plain, 'no-such-git'), env: gitEnv }) }), /git did not run/);
});

test('the seed allowlist is read from [db.seed] sql_paths and refuses what it cannot vouch for', () => {
  assert.deepEqual(seedPaths(readFileSync(join(repoRoot, 'supabase/config.toml'), 'utf8')), ['seed.sql', 'development-catalogue.sql']);
  assert.deepEqual(seedPaths('[db.seed]\n# sql_paths = ["./old.sql"]\nsql_paths = [\n  "./a.sql", # first\n  \'b/c.sql\',\n] # done\n'), ['a.sql', 'b/c.sql']);
  assert.deepEqual(seedPaths('[db]\nport = 1\n'), [], 'without sql_paths nothing is allowed, although Supabase would default to seed.sql');
  const refused = [
    ['[db.seed]\nsql_paths = ["./seeds/*.sql"]\n', /glob/],
    ['[db.seed]\nsql_paths = ["../outside.sql"]\n', /outside supabase\//],
    ['[db.seed]\nsql_paths = ["/abs.sql"]\n', /relative/],
    ['[db.seed]\nsql_paths = ["./migrations/x.sql"]\n', /migrations/],
    ['[db.seed]\nsql_paths = ["./seed.txt"]\n', /\.sql/],
    ['[db.seed]\nsql_paths = ["a.sql"]\nsql_paths = ["b.sql"]\n', /once/],
    ['[db]\nseed.sql_paths = ["a.sql"]\n', /under \[db\.seed\]/],
    ['sql_paths = ["a.sql"]\n[db.seed]\n', /under \[db\.seed\]/],
    ['[db.seed]\nsql_paths = "a.sql"\n', /array/],
    ['[db.seed]\nsql_paths = ["a\\u0041.sql"]\n', /escape/],
    ['[db.seed]\nsql_paths = ["a.sql"\n', /closing/],
    ['[db.seed]\nsql_paths = ["a.sql"] extra\n', /after the array/],
  ];
  for (const [config, message] of refused) assert.throws(() => seedPaths(config), message, config);
});

test('the command exits 1 naming each problem, and 0 with one summary line on a clean tree', (t) => {
  const root = fixtureRepo(t);
  const copy = join(root, 'scripts/backend/check-sql-sources.mjs');
  mkdirSync(dirname(copy), { recursive: true });
  copyFileSync(cli, copy);
  const run = (env = {}) => spawnSync(process.execPath, [copy], { env: { ...gitEnv, ...env }, encoding: 'utf8' });
  const clean = run();
  assert.equal(clean.status, 0, clean.stderr);
  assert.match(clean.stdout, /^SQL sources verified: 2 migrations \(2 unchanged since main@[0-9a-f]{12}, 0 new\)/);
  assert.equal(clean.stdout.trim().split('\n').length, 1);
  write(root, 'supabase/zz-probe.sql', '');
  const stray = run();
  assert.equal(stray.status, 1);
  assert.match(stray.stderr, /supabase\/zz-probe\.sql is SQL outside supabase\/migrations\//);
  const ci = run({ CI: 'true' });
  assert.equal(ci.status, 1);
  assert.match(ci.stderr, /FITLOG_BASE_REF must be set in CI to the trusted base commit/);
});

test('this repository passes: only migrations and the configured seeds are SQL, and no base migration changed', () => {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== 'CI' && key !== 'FITLOG_BASE_REF'));
  const run = spawnSync(process.execPath, [cli], { cwd: repoRoot, env, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^SQL sources verified: /);
});
