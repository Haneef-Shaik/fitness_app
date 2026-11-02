# PL-1 · Probe scripts, verbatim

These ran from `/tmp/fitlog-pl1-probe/`, outside the repository, on 27 October 2026, with Node v22.23.1. Each
takes the worktree path as its argument, works in a fresh `mkdtemp` directory and removes it. They are kept
here as text, not as tracked JavaScript, so that no gate lints or formats them. To repeat one, save the block
to a file outside the repository and run it with `rtk proxy node <file> <worktree>`. Outputs are in
[local-verification.md](local-verification.md).

## 1. `l1-probe.mjs`

```js
// PL-1 offline probe of AR-1 L1, run from a scratch directory under /tmp. It clones the worktree's committed
// HEAD, copies the uncommitted PL-1 files in, removes every local branch (as a pull-request checkout has none),
// and shows check-sql-sources test 18 failing, then passing after `backend-ci.mjs local-main`. Nothing is
// written outside the scratch clone; no network, database or Docker is used.
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const worktree = process.argv[2];
const scratch = mkdtempSync(join(tmpdir(), 'fitlog-pl1-l1-'));
const clone = join(scratch, 'clone');
const clean = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) => !key.startsWith('GIT_') && !key.startsWith('GITHUB_') && !['CI', 'FITLOG_BASE_REF', 'FITLOG_CONTRACT_BASELINE'].includes(key),
  ),
);
const git = (...args) => execFileSync('git', ['-C', clone, ...args], { env: clean, encoding: 'utf8' }).trim();
const run = (label, args, env) => {
  const result = spawnSync(process.execPath, args, { cwd: clone, env: { ...clean, ...env }, encoding: 'utf8' });
  const lines = `${result.stdout}${result.stderr}`.split('\n').filter((line) => /^(# (pass|fail)|not ok|ok |SQL sources|Created|Left|Trusted|backend-ci|check-sql-sources)/.test(line.trim()) || /Cannot resolve base/.test(line));
  console.log(`--- ${label}: exit ${result.status}`);
  for (const line of lines.slice(0, 12)) console.log(`    ${line.trim()}`);
  return result.status;
};
try {
  execFileSync('git', ['clone', '--quiet', '--no-hardlinks', worktree, clone], { env: clean });
  for (const path of ['scripts/ci/backend-ci.mjs', 'scripts/ci/backend-ci.test.mjs', 'scripts/ci/workflow-guard.mjs', 'scripts/ci/workflow-guard.test.mjs', '.github/workflows/backend-ci.yml']) {
    mkdirSync(dirname(join(clone, path)), { recursive: true });
    copyFileSync(join(worktree, path), join(clone, path));
  }
  const head = git('rev-parse', 'HEAD');
  const base = git('rev-parse', 'HEAD~1');
  git('checkout', '-q', '--detach');
  for (const branch of git('for-each-ref', '--format=%(refname:short)', 'refs/heads/').split('\n').filter(Boolean)) git('branch', '-q', '-D', branch);
  console.log(`clone HEAD ${head} (detached), trusted base ${base}; local branches: ${JSON.stringify(git('for-each-ref', 'refs/heads/'))}`);
  const test18 = ['--test', '--test-name-pattern=this repository passes', 'scripts/backend/check-sql-sources.test.mjs'];
  const before = run('test 18 with no local main (AR-1 L1)', test18, {});
  const event = join(scratch, 'event.json');
  writeFileSync(event, JSON.stringify({ before: base, after: head }));
  const actions = { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push', GITHUB_EVENT_PATH: event, FITLOG_BASE_REF: base, FITLOG_CONTRACT_BASELINE: base, CI: '1' };
  const baseStatus = run('backend-ci base', ['scripts/ci/backend-ci.mjs', 'base'], actions);
  const mismatch = run('backend-ci base, contract variable at HEAD', ['scripts/ci/backend-ci.mjs', 'base'], { ...actions, FITLOG_CONTRACT_BASELINE: head });
  const vendored = run('backend-ci vendored', ['scripts/ci/backend-ci.mjs', 'vendored'], actions);
  const created = run('backend-ci local-main', ['scripts/ci/backend-ci.mjs', 'local-main'], actions);
  const after = run('test 18 after local-main', test18, actions);
  const direct = run('check-sql-sources.mjs with CI=1 and FITLOG_BASE_REF', ['scripts/backend/check-sql-sources.mjs'], actions);
  const helperTests = run('node --test scripts/ci/*.test.mjs in the clone, CI env set', ['--test', 'scripts/ci/backend-ci.test.mjs', 'scripts/ci/workflow-guard.test.mjs'], actions);
  console.log(JSON.stringify({ before, baseStatus, mismatch, vendored, created, after, direct, helperTests }));
} finally {
  rmSync(scratch, { recursive: true, force: true });
  console.log(`removed ${scratch}`);
}
```

## 2. `mutations.mjs`

> **Phase 1 only. Stale; do not re-run as is** (review 0705 F6). Mutants G2, G5, G6, G7 and G9 target code
> that no longer exists, for example `STEPS[i]` and `isDeepStrictEqual(on, mobileOn)`. The copied file list
> also lacks `workflow-text.mjs`, `ci-guard.yml` and `ci-guard.test.mjs`, so the script cannot run on the
> current code. The current guard has **no outside mutation evidence**. Its only mutants are the in-test edited
> copies in `ci-guard.test.mjs` and `workflow-guard.test.mjs`.

```js
// PL-1 mutation checks, run on a scratch copy under the OS temporary directory; the worktree is only read.
// Each mutant replaces one exact piece of a guard (refusing a target that is missing), runs the CI tests in the
// copy, and records which named tests failed. The copy is removed at the end.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const worktree = process.argv[2];
const scratch = mkdtempSync(join(tmpdir(), 'fitlog-pl1-mutants-'));
const files = [
  'scripts/ci/backend-ci.mjs',
  'scripts/ci/backend-ci.test.mjs',
  'scripts/ci/workflow-guard.mjs',
  'scripts/ci/workflow-guard.test.mjs',
  'scripts/backend/check-sql-sources.mjs',
  'scripts/backend/local-stack.mjs',
  'docs/evidence/AR-1/replay-final-diff.log',
  'docs/evidence/AR-1/replay-drift-probe.log',
  'docs/evidence/AR-1/replay-lint.log',
  '.github/workflows/backend-ci.yml',
  '.github/workflows/mobile-ci.yml',
];
for (const path of files) {
  mkdirSync(dirname(join(scratch, path)), { recursive: true });
  copyFileSync(join(worktree, path), join(scratch, path));
}
const H = 'scripts/ci/backend-ci.mjs';
const G = 'scripts/ci/workflow-guard.mjs';
const mutants = [
  ['M1 the two variables may differ', H, 'if (base !== contract) {', 'if (false) {'],
  ['M2 no event payload cross-check', H, 'if (base !== expected) {', 'if (false) {'],
  ['M3 all-zero accepted', H, 'if (/^0+$/.test(value)) {', 'if (false) {'],
  ['M4 short or symbolic refs accepted', H, 'const FULL_SHA = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;', 'const FULL_SHA = /^[0-9A-Za-z]+$/;'],
  ['M5 any named event trusted', H, "if (!Object.hasOwn(EVENT_BASE, event ?? '')) {", 'if (event === undefined) {'],
  ['M6 a base at HEAD accepted', H, 'if (forkSha === head) {', 'if (false) {'],
  ['M7 an existing main is moved', H, "if (before === null) {\n    // An empty old value makes Git refuse if refs/heads/main appeared meanwhile.\n    const created = git(root, ['update-ref', 'refs/heads/main', sha, '']);", "if (true) {\n    const created = git(root, ['update-ref', 'refs/heads/main', sha]);"],
  ['M8 a shadowing tag accepted', H, 'if (commit === null || resolved !== commit) {', 'if (commit === null) {'],
  ['M9 local-main outside Actions', H, "if (env.GITHUB_ACTIONS !== 'true') {", 'if (false) {'],
  ['M10 node_modules matched by exact case only', H, "part.toLowerCase() === 'node_modules'", "part === 'node_modules'"],
  ['M11 extra applied versions ignored', H, '.filter((version) => !files.includes(version))', '.filter(() => false)'],
  ['M12 a non-empty diff passes', H, '} else if (result.diff.trim()) {', '} else if (false) {'],
  ['M13 drop statements ignored', H, 'found.push(...result.dropStatements.map(', 'found.push(...[].map('],
  ['M14 diffed schemas not checked', H, 'if (!isDeepStrictEqual(result.schemas, DIFF_SCHEMAS)) {', 'if (false) {'],
  ['M15 lint findings ignored', H, 'return result.results.map(', 'return [].map('],
  ['M16 CLI exit code ignored', H, 'if (run.status !== 0) return { problems: [`${label} ${why(run)}`] };', ''],
  ['M17 repeated summaries accepted', H, 'if (found.length !== 1) {', 'if (found.length === 0) {'],
  ['M18 stack not confirmed before the CLI', H, '  const db = database();\n  const result = run(', "  const db = { container: 'x', apiUrl: 'y' };\n  const result = run("],
  ['M19 a runner error reported as success', H, 'status: run.error ? null : run.status,', 'status: run.status ?? 0,'],
  ['M20 the runner goes through a shell', H, '    timeout: CLI_TIMEOUT_MS,\n', '    timeout: CLI_TIMEOUT_MS,\n    shell: true,\n'],
  ['G1 continue-on-error not named', G, "  [/continue-on-error/, 'continue-on-error lets a failing step or job pass'],\n", ''],
  ['G2 env values not compared', G, 'if (actual !== undefined && actual !== expected) {', 'if (false) {'],
  ['G3 extra definitions not counted', G, 'const count = lines.filter((line) => meaningful(line) && definition.test(line)).length;', 'const count = 1;'],
  ['G4 pins not compared with mobile-ci.yml', G, '} else if (pin && pins.get(pin[1]) !== pin[2]) {', '} else if (false) {'],
  ['G5 triggers not compared', G, 'if (on === null || !isDeepStrictEqual(on, mobileOn)) {', 'if (on === null) {'],
  ['G6 steps not compared', G, 'if (!isDeepStrictEqual(shape, STEPS[i])) {', 'if (false) {'],
  ['G7 unknown keys allowed', G, '    else if (!allowed.includes(parsed.key)) {', '    else if (false) {'],
  ['G8 expressions allowed in run', G, "if (typeof rest.run === 'string' && rest.run.includes('${{')) {", 'if (false) {'],
  ['G9 mobile baseline not compared', G, 'if (mobileBase !== EVENT_BASE) {', 'if (false) {'],
];
const tests = ['scripts/ci/backend-ci.test.mjs', 'scripts/ci/workflow-guard.test.mjs'];
const run = () => spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...tests], { cwd: scratch, encoding: 'utf8' });
const summary = (result) => ({
  exit: result.status,
  pass: Number(/^# pass (\d+)/m.exec(result.stdout)?.[1]),
  fail: Number(/^# fail (\d+)/m.exec(result.stdout)?.[1]),
  failed: [...result.stdout.matchAll(/^not ok \d+ - (.*)$/gm)].map((match) => match[1]),
});
const baseline = summary(run());
console.log(`baseline: ${JSON.stringify(baseline)}`);
const results = [];
try {
  for (const [label, path, from, to] of mutants) {
    const full = join(scratch, path);
    const original = readFileSync(full, 'utf8');
    if (!original.includes(from)) throw new Error(`${label}: target not found in ${path}`);
    writeFileSync(full, original.replace(from, to));
    const result = summary(run());
    writeFileSync(full, original);
    results.push({ label, killed: result.exit !== 0 && result.fail > 0, ...result });
    console.log(`${result.exit !== 0 ? 'KILLED ' : 'SURVIVED'} ${label}: fail ${result.fail} — ${result.failed.join(' | ')}`);
  }
  const restored = summary(run());
  console.log(`restored: ${JSON.stringify(restored)}`);
  console.log(`killed ${results.filter((r) => r.killed).length} of ${results.length}`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
  console.log(`removed ${scratch}`);
}
```

## 3. `yaml-parse.cjs`

> **Phase 1 only** (review 0705 F6). It parsed an older `backend-ci.yml`. Since then the guard step, the
> concurrency group and comments have changed, and `ci-guard.yml` did not exist. **Neither current workflow has
> been through a YAML parser.**

Run as `rtk proxy node yaml-parse.cjs /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/node_modules/yaml <worktree>`.
It only reads.

```js
// PL-1 read-only probe: parse both workflows with the `yaml` package installed in QA-9's worktree (loaded by
// absolute path, nothing installed or written) and print the structure GitHub would see.
const { readFileSync } = require('node:fs');
const YAML = require(process.argv[2]);
const worktree = process.argv[3];
const load = (path) => YAML.parse(readFileSync(`${worktree}/${path}`, 'utf8'), { uniqueKeys: true, strict: true });
const backend = load('.github/workflows/backend-ci.yml');
const mobile = load('.github/workflows/mobile-ci.yml');
const job = backend.jobs.backend;
console.log(JSON.stringify({
  topKeys: Object.keys(backend),
  on: backend.on,
  sameOnAsMobile: JSON.stringify(backend.on) === JSON.stringify(mobile.on),
  permissions: backend.permissions,
  concurrency: backend.concurrency,
  jobs: Object.keys(backend.jobs),
  jobKeys: Object.keys(job),
  timeout: job['timeout-minutes'],
  env: job.env,
  sameBaselineAsMobile: job.env.FITLOG_CONTRACT_BASELINE === mobile.jobs.check.env.FITLOG_CONTRACT_BASELINE && job.env.FITLOG_BASE_REF === mobile.jobs.check.env.FITLOG_CONTRACT_BASELINE,
  steps: job.steps.map((step) => ({ ...step })),
}, null, 1));
```
