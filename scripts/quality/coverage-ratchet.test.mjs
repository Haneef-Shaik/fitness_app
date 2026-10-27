import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { devNull, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  BASELINE_ENV,
  DOMAIN_METRICS,
  DOMAIN_TEST,
  FLOOR,
  JEST_CONFIG,
  MOBILE_METRICS,
  MOBILE_THRESHOLDS,
  checkCoverageRatchet,
  domainTest,
  gitRunner,
  mobilePackageProblems,
} from './coverage-ratchet.mjs';
import {
  DOMAIN_PACKAGE,
  MOBILE_PACKAGE,
  QUALITY_FILES,
  ROOT_PACKAGE,
  TSCONFIGS,
  WORKFLOW,
} from './gate-wiring.mjs';
import { ESLINT_CONFIG } from './lint-scope.mjs';

// Every Git fixture is a scratch repository under the OS temporary directory, seeded with copies of this repository's
// ratchet files. Nothing here writes to this repository; the first two tests only read it.
const cli = fileURLToPath(new URL('./coverage-ratchet.mjs', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const EVIDENCE = 'docs/evidence/QA-9/coverage-baseline.md';
const RATCHET_FILES = [
  FLOOR,
  MOBILE_THRESHOLDS,
  JEST_CONFIG,
  MOBILE_PACKAGE,
  DOMAIN_PACKAGE,
  ROOT_PACKAGE,
  WORKFLOW,
  ESLINT_CONFIG,
  ...Object.keys(TSCONFIGS),
  ...QUALITY_FILES,
];
const floor = JSON.parse(readFileSync(join(repoRoot, FLOOR), 'utf8'));
/** No inherited Git location, CI flag or baseline, and no user or system Git configuration. */
const isolated = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) => !key.startsWith('GIT_') && !['CI', 'GITHUB_ACTIONS', BASELINE_ENV].includes(key),
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
const git = (dir, ...args) =>
  execFileSync('git', ['-C', dir, ...args], {
    env: gitEnv,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
const scratch = (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'fitlog-ratchet-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const write = (root, path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};
/** Thresholds equal to the floor, so no fixture depends on how far this repository has raised them since. */
const PINNED_THRESHOLDS = `${JSON.stringify({ collectCoverageFrom: floor.mobile.collectCoverageFrom, global: floor.mobile.global }, null, 2)}\n`;
/** The source trees the guard scans for coverage-suppression comments. Each fixture holds one clean file in each. */
const SOURCE_ROOTS = ['apps/mobile/src', 'packages/domain/src'];
function copyRatchet(root) {
  for (const path of RATCHET_FILES) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    copyFileSync(join(repoRoot, path), join(root, path));
  }
  write(root, MOBILE_THRESHOLDS, PINNED_THRESHOLDS);
  write(root, DOMAIN_PACKAGE, setDomain({})(readFileSync(join(root, DOMAIN_PACKAGE), 'utf8')));
  for (const dir of SOURCE_ROOTS)
    write(root, `${dir}/clean.ts`, '// Coverage counts this file.\nexport const clean = 1;\n');
}
const commitAll = (root, message) => {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', message);
};
const startRepo = (root) => {
  git(root, 'init', '-q', '-b', 'main');
  commitAll(root, 'base');
  git(root, 'checkout', '-q', '-b', 'work');
};

/** main holds the ratchet exactly as this repository has it; the work branch sits on top with nothing changed. */
function ratchetRepo(t) {
  const root = scratch(t);
  copyRatchet(root);
  startRepo(root);
  return root;
}
/** main predates the ratchet, as 2a95726 does: no floor or thresholds file, and package scripts without coverage. The ratchet is added uncommitted. */
function firstCommitRepo(t) {
  const root = scratch(t);
  for (const path of [ROOT_PACKAGE, WORKFLOW]) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    copyFileSync(join(repoRoot, path), join(root, path));
  }
  write(
    root,
    MOBILE_PACKAGE,
    `${JSON.stringify({ name: '@fitlog/mobile', scripts: { 'test:ci': 'jest --runInBand --ci' } })}\n`,
  );
  write(
    root,
    DOMAIN_PACKAGE,
    `${JSON.stringify({ name: '@fitlog/domain', scripts: { test: 'node --import tsx --test src/*.test.ts' } })}\n`,
  );
  startRepo(root);
  copyRatchet(root);
  return root;
}
const check = (root, env = {}) =>
  checkCoverageRatchet({ root, env, git: gitRunner({ env: gitEnv }) });
const problems = (root, env) => check(root, env).problems.join('\n');
/** Applies one edit, runs fn, then restores the file byte for byte. The edit must change the file, so no case passes vacuously. */
function withEdit(root, path, edit, fn) {
  const original = readFileSync(join(root, path), 'utf8');
  const changed = edit(original);
  assert.notEqual(changed, original, `the edit to ${path} changed nothing`);
  write(root, path, changed);
  try {
    return fn();
  } finally {
    write(root, path, original);
  }
}
const jsonEdit = (change) => (text) => `${JSON.stringify(change(JSON.parse(text)), null, 2)}\n`;
const setScript = (name, value) =>
  jsonEdit((json) => ({ ...json, scripts: { ...json.scripts, [name]: value } }));
const setMobile = (values) =>
  jsonEdit((json) => ({ ...json, global: { ...json.global, ...values } }));
const setDomain = (values) => setScript('test', domainTest({ ...floor.domain, ...values }));
const lowerFloor = (metric, value) =>
  jsonEdit((json) => ({
    ...json,
    mobile: { ...json.mobile, global: { ...json.mobile.global, [metric]: value } },
  }));
const cents = (value, by) => (Math.round(value * 100) + by) / 100;
const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A §5 row of the evidence: package (or blank, continuing the row above), metric, and the bold proposed threshold. */
const EVIDENCE_ROW =
  /^\|\s*([^|]*?)\s*\|\s*`?(?:--test-coverage-)?(statements|branches|functions|lines)`?\s*\|\s*\*\*(\d+(?:\.\d+)?)\*\*\s*\|/;
/** The initial floor as the phase-1 evidence records it: the thresholds proposed in §5 and the mobile scope in §1. */
function initialEvidence() {
  const text = readFileSync(join(repoRoot, EVIDENCE), 'utf8');
  const section = text.split(/^## /m).find((part) => part.startsWith('5. '));
  assert.ok(section, `${EVIDENCE} has no §5`);
  const rows = section
    .split('\n')
    .map((line) => EVIDENCE_ROW.exec(line))
    .filter(Boolean);
  const owners = rows.reduce(
    (list, row) => [
      ...list,
      row[1].startsWith('Mobile') ? 'mobile' : row[1].startsWith('Domain') ? 'domain' : list.at(-1),
    ],
    [],
  );
  const values = (owner) =>
    Object.fromEntries(
      rows.filter((_, i) => owners[i] === owner).map((row) => [row[2], Number(row[3])]),
    );
  const scope = /`collectCoverageFrom: \[([^\]]*)\]`/
    .exec(text)?.[1]
    .split(', ')
    .map((pattern) => pattern.replace(/^'|'$/g, ''));
  return { mobile: values('mobile'), domain: values('domain'), scope };
}

test('this repository passes under its own environment, so in CI it is judged against the trusted baseline', () => {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== 'NODE_TEST_CONTEXT'),
  );
  const run = spawnSync(process.execPath, [cli], { cwd: repoRoot, env, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(
    run.stdout,
    /^Coverage ratchet verified\. Mobile \(apps\/mobile\/coverage-thresholds\.json\): statements [\d.]+, branches [\d.]+, functions [\d.]+, lines [\d.]+\. Domain/,
  );
});

test('the floor never sits below the phase-1 evidence, and equals it exactly until main anchors it', () => {
  const evidence = initialEvidence();
  assert.deepEqual(
    Object.keys(evidence.mobile).sort(),
    [...MOBILE_METRICS].sort(),
    `${EVIDENCE} §5 lists every mobile metric`,
  );
  assert.deepEqual(
    Object.keys(evidence.domain).sort(),
    [...DOMAIN_METRICS].sort(),
    `${EVIDENCE} §5 lists every domain metric`,
  );
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== 'NODE_TEST_CONTEXT'),
  );
  const { anchored } = checkCoverageRatchet({ env });
  assert.equal(
    typeof anchored,
    'boolean',
    'the guard reports whether a trusted baseline records the floor',
  );
  if (!anchored) {
    assert.deepEqual(
      {
        mobile: floor.mobile.global,
        domain: floor.domain,
        scope: floor.mobile.collectCoverageFrom,
      },
      evidence,
      `until main records ${FLOOR}, it must equal ${EVIDENCE} exactly; a reviewer compares them at the commit that is merged`,
    );
  }
  for (const metric of MOBILE_METRICS)
    assert.ok(
      floor.mobile.global[metric] >= evidence.mobile[metric],
      `mobile ${metric} is below the evidence`,
    );
  for (const metric of DOMAIN_METRICS)
    assert.ok(
      floor.domain[metric] >= evidence.domain[metric],
      `domain ${metric} is below the evidence`,
    );
});

test('before the first commit the checked-in floor is the minimum, the ratchet as built passes, and the floor is not anchored', (t) => {
  const root = firstCommitRepo(t);
  const local = check(root);
  assert.deepEqual(local.problems, []);
  assert.equal(local.anchored, false);
  assert.match(
    local.notes.join('\n'),
    /^HEAD@[0-9a-f]{12}: checked; records no coverage minimums yet, so the floor applies$/m,
  );
  assert.match(
    local.notes.join('\n'),
    /^the floor is not anchored yet: no trusted baseline \(main locally, FITLOG_CONTRACT_BASELINE in CI\) records/m,
  );
});

test('before the first commit, lowering any threshold by 0.01 fails against the floor', (t) => {
  const root = firstCommitRepo(t);
  for (const metric of MOBILE_METRICS) {
    const value = floor.mobile.global[metric];
    withEdit(root, MOBILE_THRESHOLDS, setMobile({ [metric]: cents(value, -1) }), () =>
      assert.match(
        problems(root),
        new RegExp(
          `^${literal(`${MOBILE_THRESHOLDS} global.${metric} is ${cents(value, -1)}, below ${value} at the floor (${FLOOR})`)}`,
          'm',
        ),
      ),
    );
  }
  for (const metric of DOMAIN_METRICS) {
    const value = floor.domain[metric];
    withEdit(root, DOMAIN_PACKAGE, setDomain({ [metric]: cents(value, -1) }), () =>
      assert.match(
        problems(root),
        new RegExp(
          `^${literal(`${DOMAIN_PACKAGE} --test-coverage-${metric} is ${cents(value, -1)}, below ${value} at the floor (${FLOOR})`)}`,
          'm',
        ),
      ),
    );
  }
});

test('raising thresholds passes the guard; Jest and Node then decide whether coverage meets them', (t) => {
  const root = firstCommitRepo(t);
  const raisedMobile = Object.fromEntries(
    MOBILE_METRICS.map((metric) => [metric, cents(floor.mobile.global[metric], 100)]),
  );
  const raisedDomain = Object.fromEntries(
    DOMAIN_METRICS.map((metric) => [metric, cents(floor.domain[metric], 1)]),
  );
  withEdit(root, MOBILE_THRESHOLDS, setMobile(raisedMobile), () =>
    withEdit(root, DOMAIN_PACKAGE, setDomain(raisedDomain), () =>
      assert.deepEqual(check(root).problems, []),
    ),
  );
});

test('a metric removed from the thresholds file or the domain command fails', (t) => {
  const root = firstCommitRepo(t);
  for (const metric of MOBILE_METRICS) {
    withEdit(
      root,
      MOBILE_THRESHOLDS,
      jsonEdit((json) => ({
        ...json,
        global: Object.fromEntries(Object.entries(json.global).filter(([key]) => key !== metric)),
      })),
      () =>
        assert.match(
          problems(root),
          new RegExp(`global\\.${metric} is missing; a coverage metric is never removed`),
        ),
    );
  }
  for (const metric of DOMAIN_METRICS) {
    withEdit(
      root,
      DOMAIN_PACKAGE,
      setScript(
        'test',
        domainTest(floor.domain).replace(new RegExp(` --test-coverage-${metric}=[\\d.]+`), ''),
      ),
      () =>
        assert.match(
          problems(root),
          /packages\/domain\/package\.json scripts\.test is not the ratchet command/,
        ),
    );
  }
});

test('a threshold must be a number from 0 to 100 with at most 2 decimals, and per-path thresholds are refused', (t) => {
  const root = firstCommitRepo(t);
  for (const bad of ['12.23', -1, 101, null, true, 12.235]) {
    withEdit(root, MOBILE_THRESHOLDS, setMobile({ statements: bad }), () =>
      assert.match(
        problems(root),
        /global\.statements is .*; it must be a number from 0 to 100 with at most 2 decimals/,
      ),
    );
  }
  withEdit(root, DOMAIN_PACKAGE, setDomain({ lines: 101 }), () =>
    assert.match(
      problems(root),
      /--test-coverage\.lines is 101; it must be a number from 0 to 100/,
    ),
  );
  withEdit(root, DOMAIN_PACKAGE, setDomain({ lines: 91.425 }), () =>
    assert.match(
      problems(root),
      /--test-coverage\.lines is 91\.425; it must be a number from 0 to 100 with at most 2 decimals/,
    ),
  );
  withEdit(
    root,
    MOBILE_THRESHOLDS,
    jsonEdit((json) => ({ ...json, './src/theme/': { lines: 90 } })),
    () =>
      assert.match(
        problems(root),
        /\.\/src\/theme\/ is not allowed; only collectCoverageFrom and global/,
      ),
  );
});

test('narrowing the coverage scope fails; widening it passes', (t) => {
  const root = firstCommitRepo(t);
  const scope = (change) =>
    jsonEdit((json) => ({ ...json, collectCoverageFrom: change(json.collectCoverageFrom) }));
  withEdit(
    root,
    MOBILE_THRESHOLDS,
    scope((list) => [...list, '!src/features/**']),
    () =>
      assert.match(
        problems(root),
        /collectCoverageFrom adds the exclusion "!src\/features\/\*\*", which no floor or baseline records/,
      ),
  );
  withEdit(
    root,
    MOBILE_THRESHOLDS,
    scope((list) =>
      list.map((pattern) =>
        pattern === 'src/**/*.{ts,tsx}' ? 'src/theme/**/*.{ts,tsx}' : pattern,
      ),
    ),
    () =>
      assert.match(
        problems(root),
        /collectCoverageFrom drops "src\/\*\*\/\*\.\{ts,tsx\}", recorded at the floor/,
      ),
  );
  // A safe widening stays inside src/, the tree the coverage-suppression scan reads (test 26 refuses one outside it).
  withEdit(
    root,
    MOBILE_THRESHOLDS,
    scope((list) => [...list, 'src/**/*.{js,jsx}']),
    () => assert.deepEqual(check(root).problems, []),
  );
  withEdit(
    root,
    MOBILE_THRESHOLDS,
    scope((list) => list.filter((pattern) => !pattern.startsWith('!'))),
    () => assert.deepEqual(check(root).problems, []),
  );
});

test('jest.config.cjs may set only the reviewed options, with preset and testMatch pinned and the thresholds file applied unchanged', (t) => {
  const root = firstCommitRepo(t);
  const add = (option) => (text) =>
    text.replace('clearMocks: true,', `clearMocks: true,\n  ${option},`);
  const notAllowed = (key) =>
    new RegExp(
      `^${literal(`${JEST_CONFIG} sets ${key}; only preset, testMatch, prettierPath, clearMocks, collectCoverageFrom, coverageThreshold, coverageReporters are allowed`)}`,
      'm',
    );
  const cases = [
    // The review's two cases: each takes untested files out of the count while every threshold still passes.
    [
      add("modulePathIgnorePatterns: ['<rootDir>/src/features/gym/']"),
      notAllowed('modulePathIgnorePatterns'),
    ],
    [
      add(
        "roots: ['<rootDir>/src/data', '<rootDir>/src/lib', '<rootDir>/src/theme', '<rootDir>/src/ui']",
      ),
      notAllowed('roots'),
    ],
    [add("coveragePathIgnorePatterns: ['/features/']"), notAllowed('coveragePathIgnorePatterns')],
    [add("testPathIgnorePatterns: ['/theme/']"), notAllowed('testPathIgnorePatterns')],
    [add('collectCoverage: false'), notAllowed('collectCoverage')],
    [add("coverageProvider: 'v8'"), notAllowed('coverageProvider')],
    [add("projects: ['<rootDir>']"), notAllowed('projects')],
    [
      (text) => text.replace("preset: 'jest-expo'", "preset: 'jest-expo/ios'"),
      /preset is "jest-expo\/ios", not "jest-expo" as reviewed/,
    ],
    [
      (text) => text.replace("  preset: 'jest-expo',\n", ''),
      /preset is unset, not "jest-expo" as reviewed/,
    ],
    [
      (text) => text.replace('<rootDir>/src/**/__tests__/', '<rootDir>/src/theme/**/__tests__/'),
      /testMatch is \["<rootDir>\/src\/theme\/\*\*\/__tests__\/\*\*\/\*\.test\.\[jt\]s\?\(x\)"\], not/,
    ],
    // prettierPath names a module Jest loads while it writes inline snapshots, so it is pinned to null: none at all.
    [
      (text) => text.replace('prettierPath: null', "prettierPath: 'prettier'"),
      /prettierPath is "prettier", not null as reviewed/,
    ],
    [
      (text) => text.replace('prettierPath: null', "prettierPath: './prettier-2.cjs'"),
      /prettierPath is "\.\/prettier-2\.cjs", not null as reviewed/,
    ],
    [
      (text) => text.replace('  prettierPath: null,\n', ''),
      /prettierPath is unset, not null as reviewed/,
    ],
    [
      (text) => text.replace('clearMocks: true,', "clearMocks: 'yes',"),
      /clearMocks must be true or false/,
    ],
    [
      (text) => text.replace("'text-summary',", "'./coverage-rewriter.cjs', 'text-summary',"),
      /coverageReporters must list only Istanbul's built-in reporters/,
    ],
    [
      (text) =>
        text.replace('coverageThreshold: { global: coverage.global }', 'coverageThreshold: {}'),
      /coverageThreshold must be exactly \{ global \}/,
    ],
    [
      (text) =>
        text.replace(
          'coverageThreshold: { global: coverage.global }',
          "coverageThreshold: { global: coverage.global, './src/theme/': { lines: 90 } }",
        ),
      /coverageThreshold must be exactly \{ global \}/,
    ],
    [
      (text) =>
        text.replace(
          'collectCoverageFrom: coverage.collectCoverageFrom',
          "collectCoverageFrom: ['src/theme/**']",
        ),
      /collectCoverageFrom is not the list in/,
    ],
    [
      (text) =>
        text
          .replace('module.exports = {', 'module.exports = async () => ({')
          .replace(/};\s*$/, '});\n'),
      /must export a plain object/,
    ],
  ];
  for (const [edit, expected] of cases)
    withEdit(root, JEST_CONFIG, edit, () => assert.match(problems(root), expected));
  withEdit(
    root,
    JEST_CONFIG,
    (text) => text.replace("'json-summary',", "'json-summary', 'lcov',"),
    () => assert.deepEqual(check(root).problems, []),
  );
  withEdit(
    root,
    MOBILE_PACKAGE,
    jsonEdit((json) => ({ ...json, jest: { roots: ['<rootDir>/src/theme'] } })),
    () =>
      assert.match(
        problems(root),
        /apps\/mobile\/package\.json has a "jest" key; Jest must read its options only from jest\.config\.cjs/,
      ),
  );
  assert.deepEqual(check(root).problems, []);
});

test('the domain test keeps its template, and the gate wiring checks run inside the guard', (t) => {
  const root = firstCommitRepo(t);
  const notDomain = /packages\/domain\/package\.json scripts\.test is not the ratchet command/;
  const cases = [
    [
      DOMAIN_PACKAGE,
      setScript(
        'test',
        domainTest(floor.domain).replace('node ../../scripts/quality/coverage-ratchet.mjs && ', ''),
      ),
      notDomain,
    ],
    [
      DOMAIN_PACKAGE,
      setScript('test', domainTest(floor.domain).replace(' --experimental-test-coverage', '')),
      notDomain,
    ],
    [
      DOMAIN_PACKAGE,
      setScript(
        'test',
        domainTest(floor.domain).replace(
          ' src/*.test.ts',
          " --test-coverage-exclude='src/cli/**' src/*.test.ts",
        ),
      ),
      notDomain,
    ],
    [
      DOMAIN_PACKAGE,
      setScript(
        'test',
        domainTest(floor.domain).replace(
          ' --test-reporter=../../scripts/quality/exact-coverage-reporter.mjs --test-reporter-destination=stdout',
          '',
        ),
      ),
      notDomain,
    ],
    [
      MOBILE_PACKAGE,
      setScript('test:ci', 'jest --runInBand --ci'),
      /^apps\/mobile\/package\.json scripts\["test:ci"\] is "jest --runInBand --ci", not/m,
    ],
    [
      ROOT_PACKAGE,
      setScript('check', 'pnpm test && pnpm plan:build --check'),
      /^package\.json scripts\["check"\] is "pnpm test && pnpm plan:build --check", not/m,
    ],
    [
      WORKFLOW,
      (text) =>
        text.replace('      - run: pnpm check\n', '      - run: pnpm check\n        if: false\n'),
      /the "- run: pnpm check" step also has "if: false"/,
    ],
  ];
  for (const [path, edit, expected] of cases)
    withEdit(root, path, edit, () => assert.match(problems(root), expected));
  rmSync(join(root, QUALITY_FILES[0]));
  assert.match(
    problems(root),
    /scripts\/quality\/coverage-ratchet\.test\.mjs is missing; the quality gates need it/,
  );
});

test('once committed, an uncommitted lowering fails against HEAD even when the floor is lowered with it', (t) => {
  const root = ratchetRepo(t);
  const value = floor.mobile.global.statements;
  const low = cents(value, -1);
  withEdit(root, FLOOR, lowerFloor('statements', low), () =>
    withEdit(root, MOBILE_THRESHOLDS, setMobile({ statements: low }), () => {
      const found = problems(root);
      assert.match(
        found,
        new RegExp(
          `^${literal(`${MOBILE_THRESHOLDS} global.statements is ${low}, below ${value} at `)}\\S+ at HEAD@[0-9a-f]{12}; coverage thresholds never go down$`,
          'm',
        ),
      );
      assert.match(
        found,
        new RegExp(
          `^${literal(`${FLOOR} mobile.global.statements is ${low}, below ${value} at ${FLOOR} at HEAD@`)}`,
          'm',
        ),
      );
    }),
  );
});

test('until main holds the ratchet the floor is not anchored: a later branch commit can lower it with a threshold, and only integration into main closes that', (t) => {
  const root = firstCommitRepo(t);
  commitAll(root, 'test(QA-9): coverage ratchet');
  const reviewed = git(root, 'rev-parse', 'HEAD');
  const value = floor.mobile.global.statements;
  const low = cents(value, -1);
  write(root, FLOOR, lowerFloor('statements', low)(readFileSync(join(root, FLOOR), 'utf8')));
  write(
    root,
    MOBILE_THRESHOLDS,
    setMobile({ statements: low })(readFileSync(join(root, MOBILE_THRESHOLDS), 'utf8')),
  );
  commitAll(root, 'lower the floor and the threshold together');
  const base = git(root, 'rev-parse', 'main');
  const local = check(root);
  assert.deepEqual(
    local.problems,
    [],
    'HEAD holds the lowered values and main holds no ratchet, so the guard alone passes',
  );
  assert.equal(local.anchored, false);
  assert.match(
    local.notes.join('\n'),
    /^main@[0-9a-f]{12}: checked; records no coverage minimums yet/m,
  );
  assert.match(local.notes.join('\n'), /^the floor is not anchored yet/m);
  const ci = check(root, { GITHUB_ACTIONS: 'true', [BASELINE_ENV]: base });
  assert.deepEqual(ci.problems, [], 'CI against the pull request base, which is main, passes too');
  assert.equal(ci.anchored, false);
  assert.match(
    ci.notes.join('\n'),
    /^FITLOG_CONTRACT_BASELINE@[0-9a-f]{12}: checked; records no coverage minimums yet/m,
  );

  git(root, 'branch', '-f', 'main', reviewed); // integration: main takes the reviewed commit and its initial floor
  const anchoredLocally = check(root);
  assert.equal(anchoredLocally.anchored, true);
  assert.match(
    anchoredLocally.problems.join('\n'),
    new RegExp(
      `^${literal(`${MOBILE_THRESHOLDS} global.statements is ${low}, below ${value} at `)}\\S+ at main@`,
      'm',
    ),
  );
  const anchoredInCI = check(root, { GITHUB_ACTIONS: 'true', [BASELINE_ENV]: reviewed });
  assert.equal(anchoredInCI.anchored, true);
  assert.match(
    anchoredInCI.problems.join('\n'),
    new RegExp(
      literal(
        `${FLOOR} mobile.global.statements is ${low}, below ${value} at ${FLOOR} at ${BASELINE_ENV}@`,
      ),
    ),
  );
});

test('once main holds the ratchet, a lowering committed on the branch still fails against main', (t) => {
  const root = ratchetRepo(t);
  const value = floor.domain.lines;
  const low = cents(value, -1);
  write(
    root,
    FLOOR,
    jsonEdit((json) => ({ ...json, domain: { ...json.domain, lines: low } }))(
      readFileSync(join(root, FLOOR), 'utf8'),
    ),
  );
  write(
    root,
    DOMAIN_PACKAGE,
    setDomain({ lines: low })(readFileSync(join(root, DOMAIN_PACKAGE), 'utf8')),
  );
  commitAll(root, 'lower the domain line threshold');
  const found = problems(root);
  assert.match(
    found,
    new RegExp(
      `^${literal(`${DOMAIN_PACKAGE} --test-coverage-lines is ${low}, below ${value} at `)}\\S+ at main@[0-9a-f]{12}`,
      'm',
    ),
  );
  assert.match(
    found,
    new RegExp(
      `^${literal(`${FLOOR} domain.lines is ${low}, below ${value} at ${FLOOR} at main@`)}`,
      'm',
    ),
  );
});

test('once committed, the floor itself never goes down or narrows', (t) => {
  const root = ratchetRepo(t);
  const value = floor.domain.branches;
  withEdit(
    root,
    FLOOR,
    jsonEdit((json) => ({ ...json, domain: { ...json.domain, branches: cents(value, -1) } })),
    () =>
      assert.match(
        problems(root),
        new RegExp(
          literal(
            `${FLOOR} domain.branches is ${cents(value, -1)}, below ${value} at ${FLOOR} at HEAD@`,
          ),
        ),
      ),
  );
  withEdit(
    root,
    FLOOR,
    jsonEdit((json) => ({
      ...json,
      mobile: {
        ...json.mobile,
        collectCoverageFrom: [...json.mobile.collectCoverageFrom, '!src/app/**'],
      },
    })),
    () =>
      assert.match(
        problems(root),
        /coverage-floor\.json mobile\.collectCoverageFrom adds the exclusion "!src\/app\/\*\*"/,
      ),
  );
});

test('a baseline file that is not valid JSON fails closed', (t) => {
  const root = scratch(t);
  copyRatchet(root);
  write(root, MOBILE_THRESHOLDS, '{ "global": ');
  startRepo(root);
  write(root, MOBILE_THRESHOLDS, PINNED_THRESHOLDS);
  assert.match(
    problems(root),
    /^apps\/mobile\/coverage-thresholds\.json at HEAD@[0-9a-f]{12} is not JSON \(.*\), so the ratchet cannot read it$/m,
  );
});

test('CI needs a trusted full commit ID and never falls back to HEAD or main', (t) => {
  const root = ratchetRepo(t);
  git(root, 'commit', '-q', '--allow-empty', '-m', 'work on the branch');
  const main = git(root, 'rev-parse', 'main');
  assert.throws(
    () => check(root, { CI: '1' }),
    /FITLOG_CONTRACT_BASELINE must be set in CI to the trusted base commit \(it is unset\)/,
  );
  assert.throws(
    () => check(root, { CI: 'true', [BASELINE_ENV]: ' ' }),
    /must be set in CI to the trusted base commit \(it is blank\)/,
  );
  assert.throws(
    () => check(root, { CI: '1', [BASELINE_ENV]: '0'.repeat(40) }),
    /is the all-zero SHA/,
  );
  assert.throws(
    () => check(root, { CI: '1', [BASELINE_ENV]: 'main' }),
    /FITLOG_CONTRACT_BASELINE=main is not a full 40- or 64-hex commit ID/,
  );
  assert.throws(
    () => check(root, { CI: '1', [BASELINE_ENV]: main.slice(0, 12) }),
    /is not a full 40- or 64-hex commit ID/,
  );
  assert.throws(
    () => check(root, { CI: '1', [BASELINE_ENV]: 'f'.repeat(40) }),
    /is not a commit in this repository/,
  );
  const trusted = check(root, { CI: '1', [BASELINE_ENV]: main });
  assert.deepEqual(trusted.problems, []);
  assert.deepEqual(trusted.notes, [
    `FITLOG_CONTRACT_BASELINE@${main.slice(0, 12)}: checked; records the floor, mobile thresholds, domain thresholds`,
  ]);
  assert.deepEqual(check(root, { CI: 'false' }).problems, []);
});

test('in GitHub Actions CI mode cannot be switched off, and a baseline that forks at HEAD is refused', (t) => {
  const root = ratchetRepo(t);
  git(root, 'commit', '-q', '--allow-empty', '-m', 'work on the branch');
  const main = git(root, 'rev-parse', 'main');
  const head = git(root, 'rev-parse', 'HEAD');
  // The review's case: a script that unsets CI and the baseline would otherwise leave only the change's own HEAD.
  assert.throws(
    () => check(root, { GITHUB_ACTIONS: 'true' }),
    /FITLOG_CONTRACT_BASELINE must be set in CI to the trusted base commit \(it is unset\)/,
  );
  assert.throws(() => check(root, { GITHUB_ACTIONS: 'true', CI: 'false' }), /must be set in CI/);
  // The review's other case: a baseline of the change itself (github.sha) forks from HEAD.
  assert.throws(
    () => check(root, { GITHUB_ACTIONS: 'true', [BASELINE_ENV]: head }),
    new RegExp(
      `${BASELINE_ENV}=${head} forks from HEAD itself, so in CI the change under test would be its own baseline`,
    ),
  );
  assert.throws(() => check(root, { CI: '1', [BASELINE_ENV]: head }), /forks from HEAD itself/);
  assert.deepEqual(check(root, { GITHUB_ACTIONS: 'true', [BASELINE_ENV]: main }).problems, []);
  assert.deepEqual(
    check(root, { [BASELINE_ENV]: head }).problems,
    [],
    'locally a configured baseline at HEAD is the same as the HEAD baseline',
  );
});

test('a configured baseline outside a Git work tree fails closed; a local run there only notes it', (t) => {
  const root = scratch(t);
  copyRatchet(root);
  const local = check(root);
  assert.deepEqual(local.problems, []);
  assert.match(
    local.notes.join('\n'),
    /not in a usable Git work tree .*, so only the floor applies/,
  );
  assert.throws(
    () => check(root, { [BASELINE_ENV]: 'a'.repeat(40) }),
    /cannot be checked: .* is not in a usable Git work tree/,
  );
});

test('a Git failure while reading a baseline throws and is never read as an absent file', (t) => {
  const root = ratchetRepo(t);
  const real = gitRunner({ env: gitEnv });
  const failing = (verb) => (dir, args) =>
    args[0] === verb
      ? { status: 128, stdout: Buffer.alloc(0), stderr: 'fatal: simulated failure' }
      : real(dir, args);
  for (const verb of ['ls-tree', 'cat-file']) {
    assert.throws(
      () => checkCoverageRatchet({ root, env: {}, git: failing(verb) }),
      new RegExp(
        `HEAD@[0-9a-f]{12}: git ${verb} .* failed \\(exit 128: fatal: simulated failure\\)`,
      ),
    );
  }
});

// Phase 2C (the phase-2B review, docs/evidence/QA-9/review-phase2b.md): a required input that is JSON null, any other
// non-object, missing or unreadable fails closed; so does a coverage-suppression comment in the scanned source.
const SHAPE = {
  [FLOOR]: 'with mobile and domain',
  [MOBILE_THRESHOLDS]: 'with collectCoverageFrom and global',
  [DOMAIN_PACKAGE]: 'with scripts.test',
};
const notObjectText = (path, kind) =>
  `${path} must be a JSON object ${SHAPE[path]}; it is ${kind}, so the ratchet cannot read it`;
const notObject = (path, kind) => new RegExp(`^${literal(notObjectText(path, kind))}$`, 'm');
const NOT_OBJECTS = [
  ['null', 'null'],
  ['[]', 'an array'],
  ['"src/**"', 'a string'],
  ['12.23', 'a number'],
  ['true', 'a boolean'],
];
const REQUIRE_LINE = "const coverage = require('./coverage-thresholds.json');";
const NARROW = { collectCoverageFrom: ['src/theme/**/*.{ts,tsx}'], global: {} };
/** The review's tolerant config: a thresholds file that reads as null hands Jest a narrow scope and no thresholds. */
const nullTolerant = (text) =>
  text.replace(
    REQUIRE_LINE,
    `const coverage = require('./coverage-thresholds.json') ?? ${JSON.stringify(NARROW)};`,
  );
/** The same fallback for a thresholds file that is missing or cannot be read. */
const missingTolerant = (text) =>
  text.replace(
    REQUIRE_LINE,
    `const coverage = (() => { try { return require('./coverage-thresholds.json'); } catch { return ${JSON.stringify(NARROW)}; } })();`,
  );
const cannotCheck = new RegExp(
  `^${literal(`${JEST_CONFIG} collectCoverageFrom and coverageThreshold cannot be checked, because ${MOBILE_THRESHOLDS} holds no thresholds object this guard could read`)}`,
  'm',
);
/** Both states of main the review names: before it holds the ratchet (unanchored), and after (anchored). */
const bothStates = (t) => [
  [firstCommitRepo(t), false],
  [ratchetRepo(t), true],
];
/** Removes one file, runs fn, then restores it byte for byte. */
function withRemoved(root, path, fn) {
  const original = readFileSync(join(root, path), 'utf8');
  rmSync(join(root, path));
  try {
    return fn();
  } finally {
    write(root, path, original);
  }
}
/** Puts a directory where a file was, so reading it fails with EISDIR on every platform; then restores the file. */
function withUnreadable(root, path, fn) {
  const original = readFileSync(join(root, path), 'utf8');
  rmSync(join(root, path));
  mkdirSync(join(root, path));
  try {
    return fn();
  } finally {
    rmSync(join(root, path), { recursive: true });
    write(root, path, original);
  }
}
/** jest.config.cjs exactly as Jest would load it from a fixture, with nothing cached from an earlier load. */
const requireFresh = createRequire(import.meta.url);
function jestConfigIn(root) {
  const dir = realpathSync(join(root, dirname(JEST_CONFIG)));
  for (const key of Object.keys(requireFresh.cache))
    if (key.startsWith(dir)) delete requireFresh.cache[key];
  return requireFresh(join(dir, 'jest.config.cjs'));
}

test('a thresholds file, floor or domain package that is JSON null or any other non-object fails closed, before and after main anchors the floor', (t) => {
  for (const [root, anchored] of bothStates(t)) {
    const before = check(root);
    assert.deepEqual(before.problems, []);
    assert.equal(before.anchored, anchored);
    for (const path of [MOBILE_THRESHOLDS, FLOOR, DOMAIN_PACKAGE]) {
      for (const [text, kind] of NOT_OBJECTS) {
        withEdit(
          root,
          path,
          () => `${text}\n`,
          () =>
            assert.match(
              problems(root),
              notObject(path, kind),
              `${path} holding ${text}, anchored: ${anchored}`,
            ),
        );
      }
    }
    // The review's note on the floor: a null floor no longer leaves the thresholds without a minimum.
    withEdit(
      root,
      FLOOR,
      () => 'null\n',
      () =>
        withEdit(root, MOBILE_THRESHOLDS, setMobile({ statements: 0 }), () =>
          assert.match(problems(root), notObject(FLOOR, 'null')),
        ),
    );
  }
});

test("the review's tolerant jest.config.cjs falls back to a narrow scope when the thresholds file is null or missing, and the guard refuses both, before and after main anchors the floor", (t) => {
  for (const [root, anchored] of bothStates(t)) {
    assert.equal(check(root).anchored, anchored);
    withEdit(root, JEST_CONFIG, nullTolerant, () => {
      assert.deepEqual(
        check(root).problems,
        [],
        'while the thresholds file is an object the fallback never runs, so Jest gets what was reviewed',
      );
      withEdit(
        root,
        MOBILE_THRESHOLDS,
        () => 'null\n',
        () => {
          const loaded = jestConfigIn(root);
          assert.deepEqual(
            { scope: loaded.collectCoverageFrom, threshold: loaded.coverageThreshold },
            { scope: NARROW.collectCoverageFrom, threshold: { global: {} } },
            'the fixture reproduces the review: Jest would load the narrowed fallback',
          );
          const found = problems(root);
          assert.match(found, notObject(MOBILE_THRESHOLDS, 'null'));
          assert.match(found, cannotCheck);
        },
      );
    });
    withEdit(root, JEST_CONFIG, missingTolerant, () =>
      withRemoved(root, MOBILE_THRESHOLDS, () => {
        assert.deepEqual(
          jestConfigIn(root).collectCoverageFrom,
          NARROW.collectCoverageFrom,
          'Jest would load the narrowed fallback',
        );
        const found = problems(root);
        assert.match(found, new RegExp(`^${literal(`${MOBILE_THRESHOLDS} is missing`)}`, 'm'));
        assert.match(found, cannotCheck);
      }),
    );
    assert.deepEqual(check(root).problems, []);
  }
});

test('a required file that exists but cannot be read stops the guard with its path, and is never read as missing', (t) => {
  for (const [root] of bothStates(t)) {
    for (const path of [MOBILE_THRESHOLDS, FLOOR, DOMAIN_PACKAGE]) {
      withUnreadable(root, path, () =>
        assert.throws(() => check(root), new RegExp(`${literal(path)} cannot be read \\(EISDIR`)),
      );
    }
  }
});

test('the guard command itself exits 1 and names the file for a null thresholds file under the tolerant config, and for an unreadable one', (t) => {
  const root = ratchetRepo(t);
  for (const name of [
    'coverage-ratchet.mjs',
    'gate-wiring.mjs',
    'coverage-suppression.mjs',
    'config-inventory.mjs',
    'transform-config.mjs',
    'lint-scope.mjs',
    'type-suppression.mjs',
  ])
    copyFileSync(join(repoRoot, 'scripts/quality', name), join(root, 'scripts/quality', name));
  const env = Object.fromEntries(
    Object.entries(gitEnv).filter(([key]) => key !== 'NODE_TEST_CONTEXT'),
  );
  const run = () =>
    spawnSync(process.execPath, [join(root, 'scripts/quality/coverage-ratchet.mjs')], {
      cwd: root,
      env,
      encoding: 'utf8',
    });
  const clean = run();
  assert.equal(clean.status, 0, clean.stderr);
  assert.match(clean.stdout, /^Coverage ratchet verified\./);
  withEdit(root, JEST_CONFIG, nullTolerant, () =>
    withEdit(
      root,
      MOBILE_THRESHOLDS,
      () => 'null\n',
      () => {
        const failed = run();
        assert.equal(failed.status, 1, failed.stdout);
        assert.equal(failed.stdout, '');
        assert.match(failed.stderr, /^coverage-ratchet failed:\n- /);
        assert.match(
          failed.stderr,
          new RegExp(`^- ${literal(notObjectText(MOBILE_THRESHOLDS, 'null'))}$`, 'm'),
        );
      },
    ),
  );
  withUnreadable(root, MOBILE_THRESHOLDS, () => {
    const failed = run();
    assert.equal(failed.status, 1, failed.stdout);
    assert.match(
      failed.stderr,
      /^coverage-ratchet failed: apps\/mobile\/coverage-thresholds\.json cannot be read \(EISDIR/,
    );
  });
});

test('a coverage-suppression comment in mobile or domain source fails the guard, before and after main anchors the floor', (t) => {
  for (const [root, anchored] of bothStates(t)) {
    assert.equal(check(root).anchored, anchored);
    const cases = [
      // The review's case: one comment takes a whole untested screen out of Jest's count.
      [
        'apps/mobile/src/features/gym/GymMembersScreen.tsx',
        '/* istanbul ignore file */',
        'istanbul ignore',
        'an Istanbul',
      ],
      [
        'packages/domain/src/progression.ts',
        '/* node:coverage disable */',
        'node:coverage',
        'a Node test runner',
      ],
    ];
    for (const [path, comment, found, tool] of cases) {
      write(root, path, `export const before = 1;\n${comment}\nexport const after = 2;\n`);
      try {
        assert.match(
          problems(root),
          new RegExp(
            `^${literal(`${path}:2 has ${JSON.stringify(found)}, ${tool} coverage-suppression comment`)}`,
            'm',
          ),
        );
      } finally {
        rmSync(join(root, path));
      }
    }
    const passed = check(root);
    assert.deepEqual(passed.problems, []);
    assert.match(
      passed.summary,
      / No coverage-suppression comment is in the 2 files under apps\/mobile\/src and packages\/domain\/src\.$/,
    );
  }
});

test('a baseline file that is JSON null fails closed, like one that is not JSON, and is never read as a baseline that predates it', (t) => {
  const root = scratch(t);
  copyRatchet(root);
  write(root, MOBILE_THRESHOLDS, 'null\n');
  startRepo(root);
  write(root, MOBILE_THRESHOLDS, PINNED_THRESHOLDS);
  assert.match(
    problems(root),
    new RegExp(
      `^${literal(`${MOBILE_THRESHOLDS} at HEAD@`)}[0-9a-f]{12} ${literal('must be a JSON object with collectCoverageFrom and global; it is null, so the ratchet cannot read it')}$`,
      'm',
    ),
  );
});

// Phase 2D (the phase-2C review, docs/evidence/QA-9/review-phase2c.md, and residuals R8 and R11).
const setScope = (change) =>
  jsonEdit((json) => ({ ...json, collectCoverageFrom: change(json.collectCoverageFrom) }));
const setFloorScope = (change) =>
  jsonEdit((json) => ({
    ...json,
    mobile: { ...json.mobile, collectCoverageFrom: change(json.mobile.collectCoverageFrom) },
  }));
/** The problem for an include pattern the coverage-suppression scan would not read. */
const unscanned = (where, pattern) =>
  new RegExp(
    `^${literal(`${where}.collectCoverageFrom includes ${JSON.stringify(pattern)}, outside src/: the coverage-suppression scan reads only apps/mobile/src and packages/domain/src`)}`,
    'm',
  );
/** Include patterns that reach, or could reach, files outside apps/mobile/src. */
const OUTSIDE_SRC = [
  'scripts/**/*.ts',
  '**/*.{ts,tsx}',
  '{src,scripts}/**/*.ts',
  'src/../scripts/**/*.ts',
  './src/**/*.ts',
  '/tmp/**/*.ts',
  'src\\..\\scripts\\*.ts',
];

test('a coverage include pattern outside the scanned src/ fails in the thresholds file and the floor, before and after main anchors the floor; widening inside src/ passes', (t) => {
  for (const [root, anchored] of bothStates(t)) {
    assert.equal(check(root).anchored, anchored);
    for (const pattern of OUTSIDE_SRC) {
      withEdit(
        root,
        MOBILE_THRESHOLDS,
        setScope((list) => [...list, pattern]),
        () =>
          assert.match(
            problems(root),
            unscanned(MOBILE_THRESHOLDS, pattern),
            `${pattern}, anchored: ${anchored}`,
          ),
      );
      withEdit(
        root,
        FLOOR,
        setFloorScope((list) => [...list, pattern]),
        () =>
          assert.match(
            problems(root),
            unscanned(`${FLOOR} mobile`, pattern),
            `${pattern} in the floor, anchored: ${anchored}`,
          ),
      );
    }
    withEdit(
      root,
      MOBILE_THRESHOLDS,
      setScope((list) => [...list, 'src/**/*.{js,jsx}']),
      () => assert.deepEqual(check(root).problems, []),
    );
  }
});

test("the review's case: once main records an include outside src/, keeping it fails and dropping it fails, so a suppression comment there is never counted unseen", (t) => {
  const root = scratch(t);
  copyRatchet(root);
  const widen = (list) => [...list, 'scripts/**/*.ts'];
  write(
    root,
    MOBILE_THRESHOLDS,
    setScope(widen)(readFileSync(join(root, MOBILE_THRESHOLDS), 'utf8')),
  );
  write(root, FLOOR, setFloorScope(widen)(readFileSync(join(root, FLOOR), 'utf8')));
  startRepo(root); // main records the widened scope, so the floor is anchored there
  assert.equal(check(root).anchored, true);
  write(
    root,
    'apps/mobile/scripts/generate-palette.ts',
    '/* istanbul ignore file */\nexport const palette = 1;\n',
  );
  const kept = problems(root);
  assert.match(kept, unscanned(MOBILE_THRESHOLDS, 'scripts/**/*.ts'));
  assert.match(kept, unscanned(`${FLOOR} mobile`, 'scripts/**/*.ts'));
  write(root, MOBILE_THRESHOLDS, PINNED_THRESHOLDS);
  write(root, FLOOR, readFileSync(join(repoRoot, FLOOR), 'utf8'));
  assert.match(
    problems(root),
    new RegExp(
      `^${literal(`${MOBILE_THRESHOLDS} collectCoverageFrom drops "scripts/**/*.ts", recorded at `)}`,
      'm',
    ),
  );
});

test('an unreadable mobile package.json stops the jest-key check itself, whatever order the checks run in', () => {
  const denied = `${MOBILE_PACKAGE} cannot be read (EACCES: permission denied), so the ratchet fails closed`;
  assert.throws(
    () =>
      mobilePackageProblems((path) => {
        if (path === MOBILE_PACKAGE) throw new Error(denied);
        return null;
      }),
    new RegExp(literal(denied)),
  );
  assert.deepEqual(
    mobilePackageProblems(() => null),
    [],
    'gate-wiring.mjs reports a missing package.json',
  );
  assert.deepEqual(
    mobilePackageProblems(() => '{ "name": '),
    [],
    'gate-wiring.mjs reports a package.json that is not JSON',
  );
  assert.deepEqual(
    mobilePackageProblems(() => '{ "name": "@fitlog/mobile" }'),
    [],
  );
  assert.match(
    mobilePackageProblems(() => '{ "jest": { "roots": ["<rootDir>/src/theme"] } }').join('\n'),
    /^apps\/mobile\/package\.json has a "jest" key/,
  );
});

test('the domain test loads its tests only through the reviewed loader flags, so nothing else transforms domain source before Node counts it', (t) => {
  assert.equal(
    DOMAIN_TEST.split(' node --import tsx --enable-source-maps --test ').length,
    2,
    'the template holds the reviewed loader flags exactly once',
  );
  const loaderFlags = [
    ...DOMAIN_TEST.matchAll(
      /(?:^|\s)(--(?:import|require|loader|experimental-loader|experimental-config-file|env-file(?:-if-exists)?)\b|-r(?=\s))/g,
    ),
  ].map((match) => match[1]);
  assert.deepEqual(loaderFlags, ['--import'], 'tsx is the only module the domain test preloads');
  const root = firstCommitRepo(t);
  const notDomain = /^packages\/domain\/package\.json scripts\.test is not the ratchet command/m;
  const loaders = [
    (script) => script.replace('--import tsx', '--import ./scripts/hide-coverage.mjs'),
    (script) => script.replace('--import tsx', '--import tsx --import ./scripts/hide-coverage.mjs'),
    (script) =>
      script.replace('--import tsx', '--require ./scripts/hide-coverage.cjs --import tsx'),
    (script) =>
      script.replace(
        '--import tsx',
        '--experimental-loader ./scripts/hide-coverage.mjs --import tsx',
      ),
    (script) => script.replace('node --import tsx', 'node --env-file=.env.test --import tsx'),
    (script) => script.replace(' --enable-source-maps', ''),
  ];
  for (const edit of loaders)
    withEdit(root, DOMAIN_PACKAGE, setScript('test', edit(domainTest(floor.domain))), () =>
      assert.match(problems(root), notDomain),
    );
});

test('the guard refuses a Babel config, a changed ESLint config and an undescribed eslint-disable in the mobile package, before and after main anchors the floor', (t) => {
  for (const [root, anchored] of bothStates(t)) {
    const clean = check(root);
    assert.deepEqual(clean.problems, []);
    assert.equal(clean.anchored, anchored);
    // Fixture: package.json, jest.config.cjs, coverage-thresholds.json, eslint.config.js, tsconfig.json and src/ with one file.
    assert.match(
      clean.summary,
      / No Babel configuration is among the 7 entries under apps\/mobile, apps\/mobile\/eslint\.config\.js is as reviewed, and the 2 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration\. No coverage-suppression comment/,
    );
    write(root, 'apps/mobile/src/.babelrc', '{ "plugins": [] }\n');
    try {
      assert.match(
        problems(root),
        /^apps\/mobile\/src\/\.babelrc is a Babel configuration file\. No Babel configuration is reviewed for the mobile package/m,
      );
    } finally {
      rmSync(join(root, 'apps/mobile/src/.babelrc'));
    }
    withEdit(
      root,
      MOBILE_PACKAGE,
      jsonEdit((json) => ({ ...json, babel: { plugins: [] } })),
      () =>
        assert.match(
          problems(root),
          /^apps\/mobile\/package\.json has a "babel" key, which Babel reads as configuration/m,
        ),
    );
    withEdit(
      root,
      ESLINT_CONFIG,
      (text) => text.replace("'coverage/**',", "'coverage/**', 'src/features/**',"),
      () =>
        assert.match(
          problems(root),
          /^apps\/mobile\/eslint\.config\.js is not the reviewed ESLint config \(first difference at line 6/m,
        ),
    );
    withEdit(
      root,
      'apps/mobile/src/clean.ts',
      (text) => `/* eslint-disable */\n${text}`,
      () =>
        assert.match(
          problems(root),
          /^apps\/mobile\/src\/clean\.ts:1 has "eslint-disable", which disables every rule/m,
        ),
    );
    assert.deepEqual(check(root).problems, []);
  }
});

// Phase 2E (R14, Codex's phase-2E brief).
test('the guard refuses @ts-ignore, @ts-nocheck and an unexplained @ts-expect-error in mobile or domain source, before and after main anchors the floor', (t) => {
  for (const [root, anchored] of bothStates(t)) {
    const clean = check(root);
    assert.deepEqual(clean.problems, []);
    assert.equal(clean.anchored, anchored);
    // Fixture: apps/mobile/src/clean.ts and packages/domain/src/clean.ts, and the configs, none of them TypeScript.
    assert.match(
      clean.summary,
      / No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 2 TypeScript files under apps\/mobile and packages\/domain\. No Babel configuration/,
    );
    const cases = [
      [
        'apps/mobile/src/features/gym/GymMembersScreen.tsx',
        '// @ts-nocheck',
        '@ts-nocheck", which switches off type checking for the whole file',
      ],
      [
        'packages/domain/src/progression.ts',
        '// @ts-ignore',
        '@ts-ignore", which switches off type checking for the next line',
      ],
      [
        'apps/mobile/app.config.ts',
        '// @ts-expect-error TODO',
        '@ts-expect-error" with the reason "TODO": give a reason of at least 3 different words',
      ],
    ];
    for (const [path, comment, found] of cases) {
      write(
        root,
        path,
        `export const before = 1;\n${comment}\nexport const after: number = before;\n`,
      );
      try {
        assert.match(
          problems(root),
          new RegExp(`^${literal(`${path}:2 has "${found}`)}`, 'm'),
          `${path}, anchored: ${anchored}`,
        );
      } finally {
        rmSync(join(root, path));
      }
    }
    // Phase 2F (phase-2E review, finding 1, and R16): the Kelvin-sign spelling, and a declaration file in source.
    const kelvin = `@ts-nochec${String.fromCodePoint(0x212a)}`;
    write(
      root,
      'apps/mobile/src/features/gym/GymMembersScreen.tsx',
      `// ${kelvin}\nexport const after: number = 1;\n`,
    );
    try {
      assert.match(
        problems(root),
        new RegExp(
          `^${literal(`apps/mobile/src/features/gym/GymMembersScreen.tsx:1 has "${kelvin}", which switches off type checking for the whole file`)}`,
          'm',
        ),
        `anchored: ${anchored}`,
      );
    } finally {
      rmSync(join(root, 'apps/mobile/src/features/gym/GymMembersScreen.tsx'));
    }
    write(root, 'packages/domain/src/loose.d.ts', 'export type Loose = any;\n');
    try {
      assert.match(
        problems(root),
        /^packages\/domain\/src\/loose\.d\.ts is a declaration file in source\. skipLibCheck is on in both packages/m,
        `anchored: ${anchored}`,
      );
    } finally {
      rmSync(join(root, 'packages/domain/src/loose.d.ts'));
    }
    // Outside src/, a generated expo-env.d.ts passes.
    write(root, 'apps/mobile/expo-env.d.ts', '/// <reference types="expo/types" />\n');
    try {
      assert.deepEqual(check(root).problems, [], `anchored: ${anchored}`);
    } finally {
      rmSync(join(root, 'apps/mobile/expo-env.d.ts'));
    }
    // Phase 2G (phase-2F review, findings 1–3): a line break inside a declaration name, a UTF-16 file, and JavaScript in source.
    const refusedIn2G = [
      [
        `apps/mobile/src/loose.d.${String.fromCodePoint(0x2028)}.ts`,
        'export type Loose = any;\n',
        'is a declaration file in source. skipLibCheck is on in both packages',
      ],
      [
        'packages/domain/src/sub/fixtures.test.ts',
        Buffer.concat([
          Buffer.from([0xff, 0xfe]),
          Buffer.from('// @ts-nocheck\nexport {};\n', 'utf16le'),
        ]),
        'starts with the UTF-16LE byte-order mark FF FE. TypeScript decodes such a file as UTF-16',
      ],
      [
        'apps/mobile/src/features/gym/GymMembersScreen.jsx',
        "export const accent = '#ff0000';\n",
        'is JavaScript in source. TypeScript does not type-check it',
      ],
    ];
    for (const [path, content, found] of refusedIn2G) {
      write(root, path, content);
      try {
        assert.match(
          problems(root),
          new RegExp(`^${literal(`${path} ${found}`)}`, 'm'),
          `${JSON.stringify(path)}, anchored: ${anchored}`,
        );
      } finally {
        rmSync(join(root, path));
      }
    }
    assert.deepEqual(check(root).problems, []);
  }
});

// Phase 3B (review of phase 3, finding 2): Codex chose to pin prettierPath to null rather than record a residual.
test('jest.config.cjs pins prettierPath to null, because the Prettier Jest 29 would load is 3 and it then refuses to write an inline snapshot', (t) => {
  // The installed Jest, as apps/mobile resolves it: its default loads `prettier`, which there is the root's 3.6.2.
  const mobile = createRequire(join(repoRoot, 'apps/mobile/package.json'));
  assert.equal(mobile('jest-config').defaults.prettierPath, 'prettier');
  assert.equal(mobile('prettier/package.json').version, '3.6.2');
  // The code Jest runs to write inline snapshots, called directly on a scratch test file. Its package exports hide build/.
  const snapshotRoot = dirname(mobile.resolve('jest-snapshot/package.json'));
  const { saveInlineSnapshots } = mobile(join(snapshotRoot, 'build', 'InlineSnapshots.js'));
  const dir = scratch(t);
  const file = join(dir, 'answer.test.js');
  const source = 'expect(42).toMatchInlineSnapshot();\n';
  const column = source.indexOf('toMatchInlineSnapshot') + 1;
  const save = (prettierPath) =>
    saveInlineSnapshots([{ frame: { file, line: 1, column }, snapshot: '42' }], dir, prettierPath);
  writeFileSync(file, source);
  assert.throws(
    () => save(mobile.resolve('prettier')),
    /Inline Snapshots are not supported when using Prettier 3\.0\.0 or above/,
  );
  assert.equal(readFileSync(file, 'utf8'), source, 'with Prettier 3, nothing is written');
  const { prettierPath } = jestConfigIn(repoRoot);
  assert.equal(prettierPath, null);
  save(prettierPath);
  assert.equal(readFileSync(file, 'utf8'), 'expect(42).toMatchInlineSnapshot(`42`);\n');
});
