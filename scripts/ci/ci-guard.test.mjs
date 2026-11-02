import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as guard from './workflow-guard.mjs';
import { characterProblems, entry } from './workflow-text.mjs';

// PL-1 review 0535 H1. A skipped job reports as passing, so each required job's workflow is also judged from a
// job in another workflow file. All three workflows are read as text; every mutant is an edited copy in memory,
// except the command-line tests, which write copies under the OS temporary directory and remove them.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const BACKEND = '.github/workflows/backend-ci.yml';
const CI_GUARD = '.github/workflows/ci-guard.yml';
const MOBILE = '.github/workflows/mobile-ci.yml';
const readRepo = (path) => {
  try {
    return readFileSync(join(repoRoot, path), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};
const reviewed = Object.freeze({
  [BACKEND]: readRepo(BACKEND),
  [CI_GUARD]: readRepo(CI_GUARD),
  [MOBILE]: readRepo(MOBILE),
});
const listingOf = (files) =>
  Object.keys(files)
    .filter((path) => files[path] !== null)
    .map((path) => ({ name: basename(path), type: 'file' }))
    .sort((a, b) => (a.name < b.name ? -1 : 1));
const problemsOf = (files, listing = listingOf(files)) =>
  guard.ciWorkflowProblems((path) => files[path] ?? null, listing).join('\n');
/** One exact replacement in one reviewed workflow; a target that vanished fails here, not silently. */
function edit(path, from, to) {
  const text = reviewed[path];
  assert.ok(text?.includes(from), `the mutant's target ${JSON.stringify(from)} is in ${path}`);
  return { ...reviewed, [path]: text.replace(from, to) };
}
/**
 * Several exact replacements, in order, in one reviewed workflow, or in `base`, a fixed version of it: still a
 * single edit to one file.
 */
function editEach(path, pairs, base = reviewed[path]) {
  const text = pairs.reduce((current, [from, to]) => {
    assert.ok(current?.includes(from), `the mutant's target ${JSON.stringify(from)} is in ${path}`);
    return current.replace(from, to);
  }, base);
  return { ...reviewed, [path]: text };
}
/** mobile-ci.yml's top-level permissions, which the guard pins exactly, so fixtures can stand in for them. */
const MOBILE_PERMISSIONS = 'permissions:\n  contents: read\n';
/**
 * mobile-ci.yml without its top-level concurrency block, whatever QA-9 sets there. A fixture that needs one
 * brings its own fixed text in place of MOBILE_PERMISSIONS, so a harmless change to QA-9's group cannot break
 * it (review 1205 L-1).
 */
function mobileWithoutConcurrency() {
  const text = reviewed[MOBILE]?.replace(/^concurrency:.*\n(?:(?: .*)?\n)*/m, '');
  assert.ok(text?.includes(MOBILE_PERMISSIONS), `${MOBILE} has the pinned top-level permissions`);
  assert.doesNotMatch(text, /^concurrency:/m, `${MOBILE} has no concurrency block left`);
  return text;
}
const GUARD_RUN = '        run: node scripts/ci/workflow-guard.mjs\n';
const CHECK = '      - run: pnpm check\n';
const INSTALL = '      - run: pnpm install --frozen-lockfile --strict-peer-dependencies\n';
const PNPM_ACTION =
  '      - uses: pnpm/action-setup@f520eceda224fe1a4aed5a2a27a194379a409996 # v6\n';
const FETCH_DEPTH = '          fetch-depth: 0\n';
const NODE_VERSION_FILE = '          node-version-file: .node-version\n';
const OLD_SHA = '5fefc31d6d87fab87289c3732888302171f595d4';
const SKIP_SCRIPT = '      - run: npm pkg set scripts.check="echo skipped"\n';
const OTHER_PIN = '0'.repeat(40);
/** Another commit of the same action, for example one from a fork (review 0905 M1). */
const FORK_SHA = '1'.repeat(40);
/** The actions mobile-ci.yml runs before pnpm check: the step, the action and its reviewed commit. */
const MOBILE_ACTIONS = [
  [1, 'actions/checkout', '3d3c42e5aac5ba805825da76410c181273ba90b1'],
  [3, 'actions/setup-node', '949feb2413d6458794dcd2491c4babbbce0c15c1'],
  [4, 'pnpm/action-setup', 'f520eceda224fe1a4aed5a2a27a194379a409996'],
];
const ON = 'on:\n  pull_request:\n  push:\n    branches: [main, v2/develop]\n';
const SHELL_DEFAULT = 'defaults:\n  run:\n    shell: true {0}\npermissions:\n';
const PATHS = '  pull_request:\n    paths: [docs/**]\n';
const io = () => {
  const out = [];
  const err = [];
  const stream = (into) => ({ write: (text) => into.push(text) });
  return { out, err, io: { stdout: stream(out), stderr: stream(err) } };
};

test('three required checks, each from its own reviewed workflow, and each guarded from another job', () => {
  assert.deepEqual(guard.REQUIRED_CHECKS, {
    check: MOBILE,
    backend: BACKEND,
    'ci-guard': CI_GUARD,
  });
  assert.equal(guard.GUARD_WORKFLOW, CI_GUARD);
  assert.deepEqual(guard.GUARD_RUNNERS, [BACKEND, CI_GUARD]);
  assert.deepEqual(problemsOf(reviewed), '');
  for (const [name, steps] of [
    ['backend', guard.STEPS],
    ['ci-guard', guard.GUARD_STEPS],
  ]) {
    for (const run of [guard.GUARD_COMMAND, guard.TEST_COMMAND]) {
      assert.deepEqual(
        steps.filter((step) => step.run === run),
        [{ run }],
        `${name} runs ${run} once, unconditionally`,
      );
    }
  }
  assert.equal(guard.GUARD_COMMAND, 'node scripts/ci/workflow-guard.mjs');
  assert.equal(guard.TEST_COMMAND, 'node --test scripts/ci/*.test.mjs');
  for (const [name, path] of Object.entries(guard.REQUIRED_CHECKS)) {
    assert.ok(
      guard.GUARD_RUNNERS.some((runner) => runner !== path),
      `the ${name} check's workflow is judged from a job in another workflow`,
    );
  }
});

test('ci-guard.yml is exactly as reviewed', () => {
  assert.notEqual(reviewed[CI_GUARD], null, `${CI_GUARD} exists`);
  assert.deepEqual(
    guard.guardWorkflowProblems(reviewed[CI_GUARD]),
    [],
    'ci-guard.yml is judged alone, against the reviewed pins, not against mobile-ci.yml text',
  );
  const cases = [
    ['a job-level if', '  ci-guard:\n', '  ci-guard:\n    if: false\n', /jobs\.ci-guard sets if/],
    [
      'a job that waits on another',
      '  ci-guard:\n',
      '  ci-guard:\n    needs: [backend]\n',
      /jobs\.ci-guard sets needs/,
    ],
    [
      'continue-on-error on the job',
      '  ci-guard:\n',
      '  ci-guard:\n    continue-on-error: true\n',
      /continue-on-error lets a failing step or job pass/,
    ],
    [
      'an if on the guard step',
      GUARD_RUN,
      `${GUARD_RUN}        if: false\n`,
      /jobs\.ci-guard step 3 is \{"run":"node scripts\/ci\/workflow-guard\.mjs","if":"false"\}/,
    ],
    [
      'the tests removed',
      '      - name: Test the CI helper and the workflow guard\n        run: node --test scripts/ci/*.test.mjs\n',
      '',
      /jobs\.ci-guard has 3 steps, not the 4 reviewed/,
    ],
    ['a workflow default shell', 'permissions:\n', SHELL_DEFAULT, /top level sets defaults/],
    [
      'a job default shell',
      '    timeout-minutes: 10\n',
      '    timeout-minutes: 10\n    defaults:\n      run:\n        shell: true {0}\n',
      /jobs\.ci-guard sets defaults/,
    ],
    [
      'an env',
      '    timeout-minutes: 10\n',
      '    timeout-minutes: 10\n    env:\n      NODE_OPTIONS: --require ./x.cjs\n',
      /jobs\.ci-guard sets env; only runs-on, timeout-minutes, steps are allowed/,
    ],
    [
      'a manual-only trigger',
      ON,
      'on:\n  workflow_dispatch:\n',
      /ci-guard\.yml on: must be exactly/,
    ],
    [
      'a path filter',
      '  pull_request:\n',
      '  pull_request:\n    paths: [scripts/ci/**]\n',
      /ci-guard\.yml on: must be exactly/,
    ],
    [
      'one concurrency group that queued pushes share',
      "  group: ci-guard-${{ github.event_name == 'pull_request' && github.ref || github.run_id }}\n",
      '  group: ci-guard-${{ github.ref }}\n',
      /concurrency must be exactly/,
    ],
    [
      'persisted credentials',
      'persist-credentials: false',
      'persist-credentials: true',
      /step 1 is .*"persist-credentials":"true"/,
    ],
    [
      'an unpinned action',
      'actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1',
      'actions/setup-node@v4',
      /not pinned to a full commit SHA/,
    ],
    [
      'another commit of a pinned action (review 0905 M1)',
      'actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1',
      `actions/setup-node@${FORK_SHA}`,
      /jobs\.ci-guard step 2 is \{"uses":"actions\/setup-node@1{40}".*, not the reviewed \{"uses":"actions\/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1"/,
    ],
    ['write permissions', '  contents: read\n', '  contents: write\n', /permissions must be only/],
    [
      'a second job',
      '  ci-guard:\n',
      '  other:\n    runs-on: ubuntu-latest\n  ci-guard:\n',
      /jobs sets other; only ci-guard are allowed/,
    ],
    [
      'a job display name',
      '  ci-guard:\n',
      '  ci-guard:\n    name: backend\n',
      /jobs\.ci-guard sets name/,
    ],
    [
      'a timeout above the cap',
      'timeout-minutes: 10',
      'timeout-minutes: 600',
      /jobs\.ci-guard\.timeout-minutes is "600"; it must be a whole number from 1 to 15/,
    ],
    [
      '|| true',
      GUARD_RUN,
      '        run: node scripts/ci/workflow-guard.mjs || true\n',
      /ignore a failing/,
    ],
  ];
  for (const [label, from, to, expected] of cases) {
    const found = guard.guardWorkflowProblems(edit(CI_GUARD, from, to)[CI_GUARD]).join('\n');
    assert.match(found, expected, `${label}:\n${found}`);
  }
  assert.deepEqual(guard.guardWorkflowProblems(null), [
    `${CI_GUARD} is missing, so no job outside backend and check judges their workflows`,
  ]);
});

test('each listed edit to mobile-ci.yml that would skip, empty or redirect its check job is refused', () => {
  assert.deepEqual(guard.mobileWorkflowProblems(reviewed[MOBILE]), []);
  const cases = [
    [
      'a job-level if',
      '  check:\n',
      '  check:\n    if: false\n',
      /mobile-ci\.yml jobs\.check sets if/,
    ],
    ['needs', '  check:\n', '  check:\n    needs: [lint]\n', /jobs\.check sets needs/],
    [
      'continue-on-error on the job',
      '  check:\n',
      '  check:\n    continue-on-error: true\n',
      /jobs\.check sets continue-on-error/,
    ],
    [
      'a matrix that renames the check',
      '    timeout-minutes: 15\n',
      '    timeout-minutes: 15\n    strategy:\n      matrix:\n        x: [1]\n',
      /jobs\.check sets strategy/,
    ],
    ['a job display name', '  check:\n', '  check:\n    name: backend\n', /jobs\.check sets name/],
    [
      'a job default shell',
      '    timeout-minutes: 15\n',
      '    timeout-minutes: 15\n    defaults:\n      run:\n        shell: true {0}\n',
      /jobs\.check sets defaults/,
    ],
    [
      'a workflow default shell',
      'permissions:\n',
      SHELL_DEFAULT,
      /mobile-ci\.yml top level sets defaults/,
    ],
    [
      'a workflow env',
      'permissions:\n',
      'env:\n  NODE_OPTIONS: --require ./x.cjs\npermissions:\n',
      /mobile-ci\.yml top level sets env/,
    ],
    [
      'a job env variable',
      "      EXPO_NO_TELEMETRY: '1'\n",
      "      EXPO_NO_TELEMETRY: '1'\n      NODE_OPTIONS: --require ./x.cjs\n",
      /jobs\.check\.env sets NODE_OPTIONS; only CI, EXPO_NO_TELEMETRY, FITLOG_CONTRACT_BASELINE are allowed/,
    ],
    [
      'pnpm check skipped',
      CHECK,
      `${CHECK}        if: false\n`,
      /jobs\.check step 6 sets if; no step there may be conditional/,
    ],
    [
      'another step skipped',
      '      - run: pnpm --filter @fitlog/mobile export:web\n',
      '      - run: pnpm --filter @fitlog/mobile export:web\n        if: false\n',
      /jobs\.check step 8 sets if/,
    ],
    [
      'pnpm check under a shell that exits 0',
      CHECK,
      `${CHECK}        shell: true {0}\n`,
      /jobs\.check step 6 sets shell to "true \{0\}"; only bash is allowed/,
    ],
    [
      'pnpm check from another folder',
      CHECK,
      `${CHECK}        working-directory: apps/mobile\n`,
      /jobs\.check step 6 sets working-directory; only name, uses, with, run, shell are allowed/,
    ],
    [
      'pnpm check with a step env',
      CHECK,
      `${CHECK}        env:\n          CI: '0'\n`,
      /jobs\.check step 6 sets env/,
    ],
    [
      'pnpm check replaced',
      CHECK,
      '      - run: pnpm --version\n',
      /jobs\.check must run "pnpm check" in exactly one plain step with no other key \(found 0\)/,
    ],
    [
      'pnpm check run twice',
      CHECK,
      `${CHECK}${CHECK}`,
      /must run "pnpm check" in exactly one plain step with no other key \(found 2\)/,
    ],
    ['pnpm check || true', CHECK, '      - run: pnpm check || true\n', /ignore a failing command/],
    [
      'GITHUB_ENV before pnpm check',
      CHECK,
      `      - run: echo "CI=0" >> "$GITHUB_ENV"\n${CHECK}`,
      /mobile-ci\.yml:\d+ has .*could rewrite the environment, PATH or outputs/,
    ],
    [
      'an expression in a run block',
      '          if [[ -z "$FITLOG_CONTRACT_BASELINE" ]]; then\n',
      '          if [[ -z "${{ github.head_ref }}" ]]; then\n',
      /jobs\.check step 2 puts an expression in run/,
    ],
    [
      'a step item whose keys would sit at another depth',
      CHECK,
      '      -  run: pnpm check\n',
      /jobs\.check\.steps has "-  run: pnpm check" where a "      - key: value" step was expected/,
    ],
    [
      'an if after a run block',
      '          fi\n      - uses: actions/setup-node',
      '          fi\n        if: false\n      - uses: actions/setup-node',
      /jobs\.check step 2 sets if/,
    ],
    ['a path filter', '  pull_request:\n', PATHS, /mobile-ci\.yml on: must be exactly/],
    [
      'a second job reporting a required check name',
      '  check:\n',
      "  backend:\n    runs-on: ubuntu-latest\n    steps:\n      - run: 'true'\n  check:\n",
      /mobile-ci\.yml jobs sets backend; only check are allowed/,
    ],
    [
      'an unpinned action',
      'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
      'actions/checkout@v4',
      /mobile-ci\.yml jobs\.check step 1 uses "actions\/checkout@v4", which is not pinned to a full commit SHA/,
    ],
    [
      'write permissions',
      '  contents: read\n',
      '  contents: write\n',
      /mobile-ci\.yml permissions must be only/,
    ],
    [
      'a line nested under runs-on',
      '    runs-on: ubuntu-latest\n',
      '    runs-on: ubuntu-latest\n      x: y\n',
      /jobs\.check has 1 line nested under runs-on: "ubuntu-latest"/,
    ],
  ];
  for (const [label, from, to, expected] of cases) {
    const found = guard.mobileWorkflowProblems(edit(MOBILE, from, to)[MOBILE]).join('\n');
    assert.match(found, expected, `${label}:\n${found}`);
  }
  const ratchet = edit(
    MOBILE,
    CHECK,
    `${CHECK}      - run: node scripts/quality/coverage-ratchet.mjs\n`,
  );
  assert.deepEqual(
    guard.mobileWorkflowProblems(ratchet[MOBILE]),
    [],
    "QA-9 R2's planned plain step after pnpm check stays allowed",
  );
  assert.deepEqual(guard.mobileWorkflowProblems(null), [
    `${MOBILE} is missing, so no job runs pnpm check`,
  ]);
});

test('every mobile-ci.yml step up to and including pnpm check is exactly as reviewed (review 0705 F1)', () => {
  const text = reviewed[MOBILE];
  const cases = [
    [
      'npm pkg set rewrites the check script just before it runs',
      edit(MOBILE, CHECK, `${SKIP_SCRIPT}${CHECK}`)[MOBILE],
      /jobs\.check step 6 is \{"run":"npm pkg set scripts\.check=\\"echo skipped\\""\}, not the reviewed \{"run":"pnpm check"\}/,
    ],
    [
      'the checkout moved to an old commit',
      edit(MOBILE, FETCH_DEPTH, `${FETCH_DEPTH}          ref: ${OLD_SHA}\n`)[MOBILE],
      /jobs\.check step 1 is \{"uses":"actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1","with":\{"persist-credentials":"false","fetch-depth":"0","ref":"5fefc31d6d87fab87289c3732888302171f595d4"\}\}, not the reviewed/,
    ],
    [
      'an extra pinned action before pnpm check that could export NODE_OPTIONS',
      edit(
        MOBILE,
        CHECK,
        `      - uses: example/env-action@${OTHER_PIN}\n        with:\n          node-options: --require ./x.cjs\n${CHECK}`,
      )[MOBILE],
      /jobs\.check step 6 is \{"uses":"example\/env-action@0{40}","with":\{"node-options":"--require \.\/x\.cjs"\}\}, not the reviewed \{"run":"pnpm check"\}/,
    ],
    [
      'setup-node given another Node version',
      edit(MOBILE, NODE_VERSION_FILE, '          node-version: 18\n')[MOBILE],
      /jobs\.check step 3 is \{"uses":"actions\/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1","with":\{"node-version":"18","package-manager-cache":"false"\}\}, not the reviewed/,
    ],
    [
      'pnpm/action-setup given inputs',
      edit(MOBILE, PNPM_ACTION, `${PNPM_ACTION}        with:\n          version: 8\n`)[MOBILE],
      /jobs\.check step 4 is \{"uses":"pnpm\/action-setup@f520eceda224fe1a4aed5a2a27a194379a409996","with":\{"version":"8"\}\}, not the reviewed \{"uses":"pnpm\/action-setup@f520eceda224fe1a4aed5a2a27a194379a409996"\}/,
    ],
    [
      'the install line chained to a script rewrite',
      edit(MOBILE, INSTALL, `${INSTALL.slice(0, -1)} && npm pkg set scripts.check=true\n`)[MOBILE],
      /jobs\.check step 5 is \{"run":"pnpm install --frozen-lockfile --strict-peer-dependencies && npm pkg set scripts\.check=true"\}, not the reviewed/,
    ],
    [
      'the baseline step made to pass on a missing base',
      edit(MOBILE, '            exit 1\n', '            exit 0\n')[MOBILE],
      /jobs\.check step 2 is \{"shell":"bash","run":\{"block":"\|","lines":\[.*"exit 0".*\]\}\}, not the reviewed/,
    ],
    [
      'the baseline script folded into one line',
      edit(MOBILE, '        run: |\n', '        run: >\n')[MOBILE],
      /jobs\.check step 2 is \{"shell":"bash","run":\{"block":">",/,
    ],
    [
      'every step from setup-node on removed',
      text.slice(0, text.indexOf('      - uses: actions/setup-node')),
      /jobs\.check has 2 steps; its first 6, up to and including "pnpm check", must be exactly as reviewed/,
    ],
  ];
  const missed = cases
    .map(([label, mutant, expected]) => ({
      label,
      expected,
      found: guard.mobileWorkflowProblems(mutant).join('\n'),
    }))
    .filter(({ expected, found }) => !expected.test(found))
    .map(({ label, found }) => `${label}: ${found || 'no problem found'}`);
  assert.deepEqual(missed, [], 'each edit up to and including pnpm check is refused');
  assert.equal(
    guard.MOBILE_STEPS?.length,
    6,
    'checkout, baseline, setup-node, pnpm, install, check',
  );
  assert.deepEqual(guard.MOBILE_STEPS.at(-1), { run: 'pnpm check' });
  const after = edit(
    MOBILE,
    CHECK,
    `${CHECK}      - uses: example/report@${OTHER_PIN}\n        with:\n          path: coverage\n`,
  );
  assert.deepEqual(
    guard.mobileWorkflowProblems(after[MOBILE]),
    [],
    'an unconditional pinned step after pnpm check stays allowed',
  );
});

test('another commit of an action before pnpm check is refused whatever comment or later step keeps the old pin (review 0905 M1)', () => {
  const decoys = [
    [
      'a comment on the same line',
      (action, sha) => [[`${action}@${sha}`, `${action}@${FORK_SHA} # was uses: ${action}@${sha}`]],
    ],
    [
      'a later comment line',
      (action, sha) => [
        [`${action}@${sha}`, `${action}@${FORK_SHA}`],
        [CHECK, `${CHECK}      # uses: ${action}@${sha}\n`],
      ],
    ],
    [
      'a step after pnpm check',
      (action, sha) => [
        [`${action}@${sha}`, `${action}@${FORK_SHA}`],
        [CHECK, `${CHECK}      - uses: ${action}@${sha}\n`],
      ],
    ],
  ];
  const missed = MOBILE_ACTIONS.flatMap(([step, action, sha]) =>
    decoys.flatMap(([decoy, pairs]) => {
      const files = editEach(MOBILE, pairs(action, sha));
      for (const runner of guard.GUARD_RUNNERS) {
        assert.equal(
          files[runner],
          reviewed[runner],
          `${runner} and its guard step are as reviewed`,
        );
      }
      const found = problemsOf(files);
      const refused = `${MOBILE} jobs.check step ${step} is {"uses":"${action}@${FORK_SHA}"`;
      const pinned = `, not the reviewed {"uses":"${action}@${sha}"`;
      return found.includes(refused) && found.includes(pinned)
        ? []
        : [`${action} behind ${decoy}: ${found || 'no problem found'}`];
    }),
  );
  assert.deepEqual(missed, [], 'the guard both guard jobs run refuses each changed pin');
});

test("mobile-ci.yml's check job runs on ubuntu-latest for at most 15 minutes, as reviewed (review 0905 L1)", () => {
  const RUNS_ON = '    runs-on: ubuntu-latest\n';
  const TIMEOUT = '    timeout-minutes: 15\n';
  const cases = [
    [
      'a macOS runner, billed at about ten times the minutes',
      RUNS_ON,
      '    runs-on: macos-latest\n',
      'jobs.check.runs-on is "macos-latest", not ubuntu-latest, a fresh GitHub-hosted runner',
    ],
    [
      'a custom runner label',
      RUNS_ON,
      '    runs-on: fitlog-runner\n',
      'jobs.check.runs-on is "fitlog-runner", not ubuntu-latest, a fresh GitHub-hosted runner',
    ],
    [
      'a timeout above the cap',
      TIMEOUT,
      '    timeout-minutes: 16\n',
      'jobs.check.timeout-minutes is "16"; it must be a whole number from 1 to 15',
    ],
    [
      'a zero timeout',
      TIMEOUT,
      '    timeout-minutes: 0\n',
      'jobs.check.timeout-minutes is "0"; it must be a whole number from 1 to 15',
    ],
  ];
  const missed = cases.flatMap(([label, from, to, expected]) => {
    const found = problemsOf(edit(MOBILE, from, to));
    return found.includes(`${MOBILE} ${expected}`)
      ? []
      : [`${label}: ${found || 'no problem found'}`];
  });
  assert.deepEqual(missed, [], 'each runner or timeout change is refused');
  assert.equal(
    problemsOf(edit(MOBILE, TIMEOUT, '    timeout-minutes: 1\n')),
    '',
    'one minute is within the cap',
  );
});

/** The line number, from 1, of `line` in `text`; a mutant whose line vanished fails here, not silently. */
function lineOf(text, line) {
  const at = text.split('\n').indexOf(line);
  assert.ok(at >= 0, `${JSON.stringify(line)} is a line of the mutant`);
  return at + 1;
}

test('a quote, [ or { left open on its line is refused wherever it sits, so YAML cannot read later steps or keys into it (review 1005 M1)', () => {
  const LINT =
    '      - name: The replayed schemas lint clean\n        run: node scripts/ci/backend-ci.mjs lint\n';
  const TESTS = '      - run: pnpm backend:test\n';
  const EXPO_CHECK = '      - run: pnpm --filter @fitlog/mobile exec expo install --check\n';
  const ungrouped = mobileWithoutConcurrency();
  /**
   * mobile-ci.yml's top level from fixed text: `fixed` in place of the pinned permissions, with QA-9's own
   * concurrency block removed first (review 1205 L-1).
   */
  const top = (fixed, opening, value) => ({
    path: MOBILE,
    base: ungrouped,
    pairs: [[MOBILE_PERMISSIONS, fixed]],
    opening,
    value,
  });
  /** mobile-ci.yml's install step given an open name, and `close` added after the line `after`. */
  const install = (open, close, after = CHECK) => ({
    path: MOBILE,
    pairs: [
      [INSTALL, `${INSTALL}        name: ${open}\n`],
      [after, `${after}${close}\n`],
    ],
    opening: `        name: ${open}`,
    value: open,
    step: `${MOBILE} jobs.check step 5 has ${JSON.stringify(`name: ${open}`)}, a plain key with a value this guard does not read`,
  });
  const cases = [
    ['pnpm check inside an open double-quoted name', install('"Install', '      #"')],
    ['pnpm check inside an open single-quoted name', install("'Install", "      #'")],
    [
      'pnpm check and the next step inside a name a later step closes with name: x"',
      install('"Install', '        name: x"', EXPO_CHECK),
    ],
    [
      'a fork setup-node that YAML runs before the only pnpm check it reads',
      install(
        '"Install',
        `      #"\n      - uses: actions/setup-node@${FORK_SHA}\n      - name: Check\n        run: pnpm check`,
      ),
    ],
    [
      'pnpm backend:test inside an open name on the lint step',
      {
        path: BACKEND,
        pairs: [
          [
            LINT,
            '      - run: node scripts/ci/backend-ci.mjs lint\n        name: "The replayed schemas lint clean\n',
          ],
          [TESTS, `${TESTS}      #"\n`],
        ],
        opening: '        name: "The replayed schemas lint clean',
        value: '"The replayed schemas lint clean',
        step: `${BACKEND} jobs.backend step 13 has "name: \\"The replayed schemas lint clean", a plain key with a value this guard does not read`,
      },
    ],
    [
      'pnpm check inside an open flow sequence',
      install('[Install', '        name: x]', EXPO_CHECK),
    ],
    ['pnpm check inside a quote opened after an anchor', install('&install "Install', '      #"')],
    ['pnpm check inside a quote opened after a tag', install('!!str "Install', '      #"')],
    [
      'the top-level permissions inside an open concurrency group, which the guard reads nowhere else',
      top(
        'concurrency:\n  cancel-in-progress: true\n  group: "mobile-${{ github.ref }}\npermissions:\n  contents: read\n  #"\n',
        '  group: "mobile-${{ github.ref }}',
        '"mobile-${{ github.ref }}',
      ),
    ],
    [
      'the top-level permissions inside an open concurrency string on its own line (review 1102 L1)',
      top(
        'concurrency:\n  "mobile-${{ github.ref }}\npermissions:\n  contents: read\n  #"\n',
        '  "mobile-${{ github.ref }}',
        '"mobile-${{ github.ref }}',
      ),
    ],
    [
      'the top-level permissions inside an open string after a "- " indicator (review 1102 L1)',
      top(
        'concurrency:\n  - "mobile-${{ github.ref }}\npermissions:\n  contents: read\n  #"\n',
        '  - "mobile-${{ github.ref }}',
        '"mobile-${{ github.ref }}',
      ),
    ],
    [
      'the top-level permissions inside an open string after a "? " indicator (review 1205 L-2)',
      top(
        'concurrency:\n  ? "mobile-${{ github.ref }}\npermissions:\n  contents: read\n  #"\n',
        '  ? "mobile-${{ github.ref }}',
        '"mobile-${{ github.ref }}',
      ),
    ],
  ];
  const missed = cases.flatMap(([label, { path, base, pairs, opening, value, step }]) => {
    const files = editEach(path, pairs, base);
    for (const other of [BACKEND, CI_GUARD, MOBILE].filter((other) => other !== path)) {
      assert.equal(files[other], reviewed[other], `${label}: ${other} is as reviewed`);
    }
    const found = problemsOf(files);
    const where = `${path}:${lineOf(files[path], opening)}`;
    const line = `${where} has the value ${JSON.stringify(value)}, which this guard does not read`;
    const wanted = step ? [line, step] : [line];
    return wanted.every((message) => found.includes(message))
      ? []
      : [`${label}: ${found || 'no problem found'}`];
  });
  assert.deepEqual(missed, [], 'the guard both guard jobs run refuses each open value');
});

test('a quoted or flow value that closes on its line, with at most a comment after it, is read as YAML reads it (review 1005 M1)', () => {
  const wrong = [];
  const read = [
    ['name: plain text # a comment', 'plain text'],
    ['name: "a \\" b # not a comment" # a comment', '"a \\" b # not a comment"'],
    ["name: 'it''s' # a comment", "'it''s'"],
    ["CI: '1'", "'1'"],
    ['needs: [a, "b]", \'c\'] # a comment', '[a, "b]", \'c\']'],
    ['with:', ''],
    ['run: |', '|'],
  ];
  for (const [content, value] of read) {
    const found = entry(content);
    if (!found || found.value !== value) wrong.push(`${content} read as ${JSON.stringify(found)}`);
  }
  const refused = [
    'name: "open',
    "name: 'open",
    'name: "a closing quote escaped\\"',
    "name: 'a closing quote escaped''",
    'name: "closed" then text',
    'name: "closed"# a comment with no space',
    "name: 'one' 'two'",
    'name: [open',
    'name: [closed] then text',
    'name: [[nested]]',
    'name: [a, # a comment inside]',
    'name: {a: "open}',
    'name: &anchor value',
    'name: *alias',
    'name: !!str value',
  ];
  for (const content of refused) {
    const found = entry(content);
    if (found !== null) wrong.push(`${content} read as ${JSON.stringify(found)}, not refused`);
  }
  const accepted = [
    [
      'a double-quoted name and a comment',
      MOBILE,
      INSTALL,
      `${INSTALL}        name: "Install the workspace" # frozen\n`,
    ],
    [
      'escapes in a double-quoted name',
      MOBILE,
      INSTALL,
      `${INSTALL}        name: "Say \\"hi\\" \\\\ then install"\n`,
    ],
    [
      'a single-quoted name with a quote inside',
      MOBILE,
      '      - run: pnpm --filter @fitlog/mobile export:web\n',
      "      - run: pnpm --filter @fitlog/mobile export:web\n        name: 'Export the web build, it''s checked'\n",
    ],
    [
      'a quoted env value and a comment',
      BACKEND,
      "      CI: '1'\n",
      "      CI: '1' # the CI flag\n",
    ],
    [
      'a closed flow input with quoted items and a comment, after pnpm check',
      MOBILE,
      CHECK,
      `${CHECK}      - uses: example/report@${OTHER_PIN}\n        with:\n          paths: [coverage, "a b]"] # two\n`,
    ],
  ];
  for (const [label, path, from, to] of accepted) {
    const found = problemsOf(edit(path, from, to));
    if (found !== '') wrong.push(`${label}: ${found}`);
  }
  assert.deepEqual(wrong, [], 'each closed value is read as YAML reads it');
});

test('an expression on a comment line is refused wherever it sits: inside a run block that line is script GitHub fills in, and the guard skips comment lines (review 1102 M1)', () => {
  const wrong = [];
  const BASELINE_RUN = '        run: |\n';
  const LAST_ERROR =
    '            echo "::error::FITLOG_CONTRACT_BASELINE is not a full commit SHA"\n';
  const PR_BODY = '          # ${{ github.event.pull_request.body }}';
  /** The review's payload that needs no pull request body: a newline from fromJSON, then a script rewrite. */
  const PAYLOAD =
    "            # ${{ format('{0}npm pkg set scripts.check=true', fromJSON('\"\\n\"')) }}";
  const PR_TITLE = '          # ${{ github.event.pull_request.title }}';
  const RUN_ID = '  # each push run is grouped by ${{ github.run_id }}';
  const SHELL_VARIABLE = '          # prints ${GITHUB_EVENT_NAME} for the log';
  const refused = [
    [
      "the pull request body on a comment line of the baseline run block, before pnpm check (the review's case)",
      MOBILE,
      BASELINE_RUN,
      `${BASELINE_RUN}${PR_BODY}\n`,
      PR_BODY,
    ],
    [
      'a payload that needs no pull request body, deeper in the same run block',
      MOBILE,
      LAST_ERROR,
      `${LAST_ERROR}${PAYLOAD}\n`,
      PAYLOAD,
    ],
    [
      'the pull request title on a comment line of a run block after pnpm check',
      MOBILE,
      CHECK,
      `${CHECK}      - run: |\n          echo report\n${PR_TITLE}\n`,
      PR_TITLE,
    ],
    [
      'a comment line outside any run block, in backend-ci.yml: refused all the same, by the one simple rule',
      BACKEND,
      'jobs:\n',
      `jobs:\n${RUN_ID}\n`,
      RUN_ID,
    ],
  ];
  for (const [label, path, from, to, opening] of refused) {
    const files = edit(path, from, to);
    for (const other of [BACKEND, CI_GUARD, MOBILE].filter((other) => other !== path)) {
      assert.equal(files[other], reviewed[other], `${label}: ${other} is as reviewed`);
    }
    const found = problemsOf(files);
    const message = `${path}:${lineOf(files[path], opening)} has an expression on a comment line;`;
    if (!found.includes(message)) wrong.push(`${label}: ${found || 'no problem found'}`);
  }
  // Counted across the three workflows together, so QA-9 rewording mobile-ci.yml's comments cannot turn this
  // control red; each workflow as it stands must still pass (review 1205 L-1).
  let comments = 0;
  let expressions = 0;
  for (const path of [BACKEND, CI_GUARD, MOBILE]) {
    const lines = reviewed[path].split('\n');
    comments += lines.filter((line) => line.trim().startsWith('#')).length;
    expressions += lines.filter(
      (line) => !line.trim().startsWith('#') && line.includes('${{'),
    ).length;
    const found = characterProblems(path, reviewed[path]);
    if (found.length) wrong.push(`${path} as reviewed: ${found.join('\n')}`);
  }
  if (!comments || !expressions) {
    wrong.push(
      `the three workflows have ${comments} comment lines and ${expressions} other lines with an expression, so this control proves nothing`,
    );
  }
  const accepted = [
    [
      'a comment line with no expression in the baseline run block',
      MOBILE,
      BASELINE_RUN,
      `${BASELINE_RUN}          # the base comes from the event, never from the change\n`,
    ],
    [
      'a shell variable, not an expression, on a comment line of a run block after pnpm check',
      MOBILE,
      CHECK,
      `${CHECK}      - run: |\n${SHELL_VARIABLE}\n          echo "$GITHUB_EVENT_NAME"\n`,
    ],
  ];
  for (const [label, path, from, to] of accepted) {
    const found = problemsOf(edit(path, from, to));
    if (found !== '') wrong.push(`${label}: ${found}`);
  }
  assert.deepEqual(
    wrong,
    [],
    'each comment line with an expression is refused, and no other line is newly refused',
  );
});

test('one disabling edit to any one workflow is refused by a guard job in a workflow the edit left alone', () => {
  const cases = [
    [
      BACKEND,
      '  backend:\n',
      "  backend:\n    if: github.event_name == 'push'\n",
      /backend-ci\.yml jobs\.backend sets if/,
    ],
    [
      BACKEND,
      GUARD_RUN,
      `${GUARD_RUN}        if: false\n`,
      /backend-ci\.yml jobs\.backend step 3 is/,
    ],
    [BACKEND, 'permissions:\n', SHELL_DEFAULT, /backend-ci\.yml top level sets defaults/],
    [BACKEND, '  pull_request:\n', PATHS, /backend-ci\.yml on: must be exactly/],
    [
      CI_GUARD,
      '  ci-guard:\n',
      '  ci-guard:\n    if: false\n',
      /ci-guard\.yml jobs\.ci-guard sets if/,
    ],
    [CI_GUARD, '  ci-guard:\n', '  ci-guard:\n    needs: [backend]\n', /jobs\.ci-guard sets needs/],
    [
      CI_GUARD,
      GUARD_RUN,
      `${GUARD_RUN}        if: false\n`,
      /ci-guard\.yml jobs\.ci-guard step 3 is/,
    ],
    [CI_GUARD, 'permissions:\n', SHELL_DEFAULT, /ci-guard\.yml top level sets defaults/],
    [CI_GUARD, ON, 'on:\n  workflow_dispatch:\n', /ci-guard\.yml on: must be exactly/],
    [MOBILE, '  check:\n', '  check:\n    if: false\n', /mobile-ci\.yml jobs\.check sets if/],
    [
      MOBILE,
      '  check:\n',
      '  check:\n    continue-on-error: true\n',
      /mobile-ci\.yml:\d+ has "continue-on-error: true"/,
    ],
    [MOBILE, CHECK, `${CHECK}        if: false\n`, /mobile-ci\.yml jobs\.check step 6 sets if/],
    [
      MOBILE,
      CHECK,
      `${CHECK}        shell: true {0}\n`,
      /mobile-ci\.yml jobs\.check step 6 sets shell/,
    ],
    [MOBILE, 'permissions:\n', SHELL_DEFAULT, /mobile-ci\.yml top level sets defaults/],
    [
      MOBILE,
      ON,
      `${ON.slice(0, -1)}\n    paths-ignore: ['**']\n`,
      /mobile-ci\.yml on: must be exactly/,
    ],
    [
      MOBILE,
      'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
      `actions/checkout@${FORK_SHA}`,
      /mobile-ci\.yml jobs\.check step 1 is \{"uses":"actions\/checkout@1{40}".*, not the reviewed \{"uses":"actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1"/,
    ],
    [
      MOBILE,
      CHECK,
      `${SKIP_SCRIPT}${CHECK}`,
      /mobile-ci\.yml jobs\.check step 6 is \{"run":"npm pkg set scripts\.check=/,
    ],
    [
      MOBILE,
      FETCH_DEPTH,
      `${FETCH_DEPTH}          ref: ${OLD_SHA}\n`,
      /mobile-ci\.yml jobs\.check step 1 is .*"ref":"5fefc31d6d87fab87289c3732888302171f595d4"/,
    ],
  ];
  for (const [path, from, to, expected] of cases) {
    const files = edit(path, from, to);
    const found = problemsOf(files);
    assert.match(found, expected, `${path}: ${JSON.stringify(to)}:\n${found}`);
    const untouched = guard.GUARD_RUNNERS.filter((runner) => runner !== path);
    assert.ok(untouched.length > 0, `a guard job outside ${path} runs`);
    for (const runner of untouched) {
      assert.equal(files[runner], reviewed[runner], `${runner} and its guard step are as reviewed`);
    }
  }
});

test('no other workflow file may run, and none of the three may be missing, a link or a folder', () => {
  const plus = (...entries) => [...listingOf(reviewed), ...entries];
  assert.match(
    problemsOf(reviewed, plus({ name: 'shadow.yml', type: 'file' })),
    /\.github\/workflows\/shadow\.yml is not one of the three reviewed workflows; another workflow could report a required check name/,
  );
  assert.match(
    problemsOf(reviewed, plus({ name: 'Shadow.YAML', type: 'file' })),
    /\.github\/workflows\/Shadow\.YAML is not one of the three reviewed workflows/,
  );
  assert.match(
    problemsOf(reviewed, plus({ name: 'old', type: 'directory' })),
    /\.github\/workflows\/old is a directory, not one of the three reviewed workflows/,
  );
  const forged = problemsOf(reviewed, plus({ name: 'x\n::error::y.yml', type: 'file' }));
  assert.match(forged, /^"\.github\/workflows\/x\\n::error::y\.yml" is not one of the three/m);
  assert.doesNotMatch(forged, /^::/m, 'a file name cannot start a workflow command');
  assert.equal(
    problemsOf(
      reviewed,
      plus({ name: 'README.md', type: 'file' }, { name: '.DS_Store', type: 'file' }),
    ),
    '',
    'GitHub loads only .yml and .yaml files from the folder, so other regular files are not workflows',
  );
  const linked = listingOf(reviewed).map((entry) =>
    entry.name === 'ci-guard.yml' ? { ...entry, type: 'symbolic link' } : entry,
  );
  assert.match(
    problemsOf(reviewed, linked),
    /ci-guard\.yml is a symbolic link, not a regular file/,
  );
  const gone = { ...reviewed, [CI_GUARD]: null };
  const found = problemsOf(gone);
  assert.match(found, /ci-guard\.yml is missing, so no job outside backend and check judges/);
  assert.match(found, /\.github\/workflows has no ci-guard\.yml/);
  assert.match(problemsOf(reviewed, null), /^\.github\/workflows is missing or unreadable/m);
});

test('the guard command prints one line and exits 0, or names every problem and exits 1', (t) => {
  const ok = io();
  assert.equal(guard.main([], { root: repoRoot, io: ok.io }), 0, ok.err.join(''));
  assert.deepEqual(ok.out, [
    'CI workflows as reviewed: backend-ci.yml (job backend), ci-guard.yml (job ci-guard) and mobile-ci.yml (job check), each judged from both the backend and the ci-guard job; no other workflow file\n',
  ]);
  const usage = io();
  assert.equal(guard.main(['extra'], { root: repoRoot, io: usage.io }), 2);
  assert.deepEqual(usage.err, ['usage: node scripts/ci/workflow-guard.mjs\n']);

  const root = mkdtempSync(join(tmpdir(), 'fitlog-ci-guard-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const dir = join(root, '.github/workflows');
  mkdirSync(dir, { recursive: true });
  for (const path of [BACKEND, MOBILE]) writeFileSync(join(root, path), reviewed[path]);
  const forged = '  ci-guard:\n    if: false\n   ::error::forged\r::warning::x\n';
  writeFileSync(join(root, CI_GUARD), reviewed[CI_GUARD].replace('  ci-guard:\n', forged));
  mkdirSync(join(dir, 'nested'));
  symlinkSync('backend-ci.yml', join(dir, 'link.yml'));
  const bad = io();
  assert.equal(guard.main([], { root, io: bad.io }), 1);
  assert.deepEqual(bad.out, []);
  const text = bad.err.join('');
  assert.match(text, /^workflow-guard failed:\n- /);
  assert.match(text, /jobs\.ci-guard sets if/);
  assert.match(
    text,
    /\.github\/workflows\/nested is a directory, not one of the three reviewed workflows/,
  );
  assert.match(
    text,
    /\.github\/workflows\/link\.yml is a symbolic link, not one of the three reviewed workflows/,
  );
  for (const line of text.split(/\r\n|\r|\n/).filter(Boolean)) {
    assert.match(line, /^(?:workflow-guard failed:|- )/, 'no line can start a workflow command');
  }
  assert.doesNotMatch(text, /[^\n\x20-\x7e]/, 'every message is printable ASCII');

  const empty = mkdtempSync(join(tmpdir(), 'fitlog-ci-guard-'));
  t.after(() => rmSync(empty, { recursive: true, force: true }));
  const none = io();
  assert.equal(guard.main([], { root: empty, io: none.io }), 1);
  assert.match(none.err.join(''), /- \.github\/workflows is missing or unreadable/);
});

test('only the value check skips a block scalar body, which is script or text: the block ends at the first nonblank line, comment lines included, indented no deeper than its key, and a script line that looks like key: | opens no block (review 1102 L2, PL1-D1)', () => {
  const wrong = [];
  /**
   * Two run blocks after pnpm check, as QA-9 R2 may add them. Read as YAML values, the lines that start with
   * [, {, a quote or !, or hold a quote after a colon, would be open values; in a block they are script. The
   * heredoc's `label: |` is script text too, so the [ line after its EOF is still read as script.
   */
  const REPORT = [
    '      - name: Coverage report',
    '        run: | # the summary must exist and show no empty file',
    '          [ -s coverage/coverage-summary.json ] || exit 1',
    '          "$PNPM_HOME/pnpm" --version',
    '',
    '          echo "ratchet: \'ok\'"',
    '          # a shell comment, deeper than run, stays in the block',
    '          ! grep -q \'"pct":0\' coverage/coverage-summary.json',
    '          {',
    '            echo "## Coverage"',
    '          } > coverage/summary.md',
    "          cat > coverage/badge.yml <<'EOF'",
    '          label: |',
    '            [coverage',
    '          EOF',
    '          [ -s coverage/badge.yml ] || exit 1',
    '      - run: >-',
    '          node scripts/quality/coverage-ratchet.mjs',
    '          "--summary" coverage/coverage-summary.json',
    '',
  ].join('\n');
  const ungrouped = mobileWithoutConcurrency();
  /** mobile-ci.yml with fixed top-level text in place of the pinned permissions (review 1205 L-1). */
  const top = (fixed) => editEach(MOBILE, [[MOBILE_PERMISSIONS, fixed]], ungrouped);
  const accepted = [
    ['two run blocks after pnpm check', edit(MOBILE, CHECK, `${CHECK}${REPORT}`)],
    [
      'a folded concurrency group',
      top(
        'concurrency:\n  group: >-\n    [mobile] ${{ github.ref }}\n  cancel-in-progress: true\n' +
          MOBILE_PERMISSIONS,
      ),
    ],
  ];
  for (const [label, files] of accepted) {
    const found = problemsOf(files);
    if (found !== '') wrong.push(`${label}: ${found}`);
  }
  const RUN = '      - run: |\n          echo report\n';
  const value = (text) => `has the value ${JSON.stringify(text)}, which this guard does not read`;
  const refused = [
    [
      'an open name at the run key\'s own column after "- run: |", two columns in from the dash',
      edit(MOBILE, CHECK, `${CHECK}${RUN}        name: "Report\n      #"\n`),
      '        name: "Report',
      value('"Report'),
    ],
    [
      "a comment line at the run key's column, which ends the block, then a deeper open name",
      edit(
        MOBILE,
        CHECK,
        `${CHECK}${RUN}        # the report ends here\n          name: "Report\n      #"\n`,
      ),
      '          name: "Report',
      value('"Report'),
    ],
    [
      'the next step, with an open name',
      edit(MOBILE, CHECK, `${CHECK}${RUN}      - name: "Upload\n      #"\n`),
      '      - name: "Upload',
      value('"Upload'),
    ],
    [
      'the top-level permissions inside an open value after a block concurrency group',
      top(
        'concurrency:\n  group: |\n    [mobile] x\n  cancel-in-progress: "true\npermissions:\n  contents: read\n  #"\n',
      ),
      '  cancel-in-progress: "true',
      value('"true'),
    ],
    [
      'a character outside printable ASCII in a block',
      edit(MOBILE, CHECK, `${CHECK}${RUN}          echo a\u0085echo b\n`),
      '          echo a\u0085echo b',
      'has U+0085 at column 17, outside printable ASCII',
    ],
    [
      'a tab indenting a block line',
      edit(MOBILE, CHECK, `${CHECK}${RUN}          \techo b\n`),
      '          \techo b',
      'indents with a tab, which YAML forbids',
    ],
    [
      'a carriage return inside a block line',
      edit(MOBILE, CHECK, `${CHECK}${RUN}          echo a\recho b\n`),
      '          echo a\recho b',
      'has a carriage return that does not end the line',
    ],
    [
      'an expression on a comment line in a block',
      edit(MOBILE, CHECK, `${CHECK}${RUN}          # \${{ github.head_ref }}\n`),
      '          # ${{ github.head_ref }}',
      'has an expression on a comment line',
    ],
  ];
  for (const [label, files, line, message] of refused) {
    for (const other of [BACKEND, CI_GUARD]) {
      assert.equal(files[other], reviewed[other], `${label}: ${other} is as reviewed`);
    }
    const found = problemsOf(files);
    if (!found.includes(`${MOBILE}:${lineOf(files[MOBILE], line)} ${message}`)) {
      wrong.push(`${label}: ${found || 'no problem found'}`);
    }
  }
  assert.deepEqual(
    wrong,
    [],
    'block bodies skip only the value check, and every line outside them is still read',
  );
});

test('a plain key whose value the guard does not read is named as such, and only a line with no plain key is called not a plain key (review 1102 L4, PL1-D2)', () => {
  const VALUE = 'a plain key with a value this guard does not read';
  const NO_KEY = 'which is not a plain key';
  const cases = [
    [
      'an alias for the workflow name',
      CI_GUARD,
      'name: CI guard\n',
      'name: *guard\n',
      `${CI_GUARD} top level`,
      VALUE,
    ],
    [
      'an anchored job timeout',
      CI_GUARD,
      '    timeout-minutes: 10\n',
      '    timeout-minutes: &minutes 10\n',
      `${CI_GUARD} jobs.ci-guard`,
      VALUE,
    ],
    [
      'a tagged step command',
      BACKEND,
      '        run: node scripts/ci/backend-ci.mjs base\n',
      '        run: !!str node scripts/ci/backend-ci.mjs base\n',
      `${BACKEND} jobs.backend step 4`,
      VALUE,
    ],
    [
      'an open flow as a step input',
      BACKEND,
      NODE_VERSION_FILE,
      '          node-version-file: [.node-version\n',
      `${BACKEND} jobs.backend step 2`,
      VALUE,
    ],
    [
      'a quoted workflow key',
      CI_GUARD,
      'name: CI guard\n',
      '"name": CI guard\n',
      `${CI_GUARD} top level`,
      NO_KEY,
    ],
    [
      'a step key with no space after its colon',
      BACKEND,
      '        run: node scripts/ci/backend-ci.mjs vendored\n',
      '        run:node scripts/ci/backend-ci.mjs vendored\n',
      `${BACKEND} jobs.backend step 6`,
      NO_KEY,
    ],
  ];
  const wrong = cases.flatMap(([label, path, from, to, where, wording]) => {
    const found = problemsOf(edit(path, from, to));
    const content = JSON.stringify(to.trim());
    const named = found.includes(`${where} has ${content}, ${wording}`);
    const misnamed = found.includes(`${content}, ${wording === VALUE ? NO_KEY : VALUE}`);
    return named && !misnamed ? [] : [`${label}: ${found || 'no problem found'}`];
  });
  assert.deepEqual(wrong, [], 'each refused key line says which part this guard does not read');
});
