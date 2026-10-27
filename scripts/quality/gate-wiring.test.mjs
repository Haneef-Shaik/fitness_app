import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  BASELINE_LINE,
  CHECK_STEP,
  DOMAIN_PACKAGE,
  MOBILE_PACKAGE,
  MOBILE_TEST_CI,
  PINNED_SCRIPTS,
  QUALITY_FILES,
  ROOT_PACKAGE,
  TSCONFIGS,
  WORKFLOW,
  wiringProblems,
} from './gate-wiring.mjs';

// Each case edits an in-memory copy of this repository's wired files; nothing here writes to disk.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const WIRED = [
  ROOT_PACKAGE,
  MOBILE_PACKAGE,
  DOMAIN_PACKAGE,
  WORKFLOW,
  ...Object.keys(TSCONFIGS),
  ...QUALITY_FILES,
];
const repo = Object.fromEntries(
  WIRED.map((path) => [path, readFileSync(join(repoRoot, path), 'utf8')]),
);
const readWith = (path, text) => (file) => (file === path ? text : (repo[file] ?? null));
const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** The problems after one edit to one file. The edit must change the file, so no case passes vacuously. */
function after(path, edit) {
  const changed = edit(repo[path]);
  assert.notEqual(changed, repo[path], `the edit to ${path} changed nothing`);
  return wiringProblems(readWith(path, changed)).join('\n');
}
const jsonEdit = (change) => (text) => `${JSON.stringify(change(JSON.parse(text)), null, 2)}\n`;
const setScript = (name, value) =>
  jsonEdit((json) => ({ ...json, scripts: { ...json.scripts, [name]: value } }));
const setKey = (name, value) => jsonEdit((json) => ({ ...json, [name]: value }));
const setOption = (name, value) =>
  jsonEdit((json) => ({ ...json, compilerOptions: { ...json.compilerOptions, [name]: value } }));
const dropOption = (name) =>
  jsonEdit((json) => ({
    ...json,
    compilerOptions: Object.fromEntries(
      Object.entries(json.compilerOptions).filter(([key]) => key !== name),
    ),
  }));
const pinned = (path, name) =>
  new RegExp(
    `^${literal(`${path} scripts["${name}"] is `)}.*${literal('; gate scripts are pinned exactly as reviewed')}$`,
    'm',
  );
/** Inserts text after a line of the file, which must be there. */
const insertAfter = (line, added) => (text) => {
  assert.ok(text.includes(`${line}\n`), `no line ${JSON.stringify(line)}`);
  return text.replace(`${line}\n`, `${line}\n${added}\n`);
};

test('the wiring of this repository passes as reviewed', () => {
  assert.deepEqual(
    wiringProblems((file) => repo[file] ?? null),
    [],
  );
});

test('root check, test, typecheck and lint are pinned, so lint, types and every guard copy keep running', () => {
  const root = PINNED_SCRIPTS[ROOT_PACKAGE];
  const unformatted = root.check.replace('node scripts/quality/touched-format.mjs && ', ''); // Phase 3: Prettier on touched files
  for (const check of [
    'pnpm test && pnpm plan:build --check',
    root.check.replace('node scripts/quality/coverage-ratchet.mjs && ', ''),
    unformatted,
    `${root.check} || true`,
  ]) {
    assert.match(after(ROOT_PACKAGE, setScript('check', check)), pinned(ROOT_PACKAGE, 'check'));
  }
  for (const value of [
    `unset FITLOG_CONTRACT_BASELINE CI && ${root.test}`,
    'pnpm --filter @fitlog/domain test && pnpm plan:test',
  ]) {
    assert.match(after(ROOT_PACKAGE, setScript('test', value)), pinned(ROOT_PACKAGE, 'test'));
  }
  assert.match(
    after(ROOT_PACKAGE, setScript('typecheck', 'pnpm --filter @fitlog/domain typecheck')),
    pinned(ROOT_PACKAGE, 'typecheck'),
  );
  assert.match(
    after(ROOT_PACKAGE, setScript('lint', 'echo lint skipped')),
    pinned(ROOT_PACKAGE, 'lint'),
  );
});

test('mobile lint, typecheck and test:ci and the domain typecheck are pinned', () => {
  const mobile = PINNED_SCRIPTS[MOBILE_PACKAGE];
  const lintNarrowed = [
    mobile.lint.replace(' --max-warnings=0', ''),
    'eslint . --max-warnings=0',
    // Phase 2D (R8): a narrower lint scope, a rule switched off on the command line, and eslintrc mode.
    mobile.lint.replace('eslint . ', 'eslint src/ui '),
    mobile.lint.replace('eslint . ', "eslint . --rule 'no-restricted-syntax: off' "),
    mobile.lint.replace(
      'eslint . ',
      'eslint . --no-inline-config --ignore-pattern "src/features/**" ',
    ),
    `ESLINT_USE_FLAT_CONFIG=false ${mobile.lint}`,
  ];
  for (const value of lintNarrowed) {
    assert.match(after(MOBILE_PACKAGE, setScript('lint', value)), pinned(MOBILE_PACKAGE, 'lint'));
  }
  assert.match(
    after(MOBILE_PACKAGE, setScript('typecheck', 'tsc --noEmit -p tsconfig.loose.json')),
    pinned(MOBILE_PACKAGE, 'typecheck'),
  );
  const testCi = mobile['test:ci'];
  const weakened = [
    testCi.replace(' --coverage', ''),
    testCi.replace('node ../../scripts/quality/coverage-ratchet.mjs && ', ''),
    testCi.replace('node --test ../../scripts/quality/*.test.mjs && ', ''),
    `${testCi} || true`,
    // Phase 2E (phase-2D review, finding 2): Jest back on watchman, whose .watchmanconfig can hide folders from the count.
    testCi.replace(' --no-watchman', ''),
    testCi.replace(' --no-watchman', ' --watchman'),
  ];
  for (const value of weakened)
    assert.match(
      after(MOBILE_PACKAGE, setScript('test:ci', value)),
      pinned(MOBILE_PACKAGE, 'test:ci'),
    );
  assert.match(
    after(DOMAIN_PACKAGE, setScript('typecheck', 'tsc --noEmit')),
    pinned(DOMAIN_PACKAGE, 'typecheck'),
  );
  assert.match(
    after(DOMAIN_PACKAGE, () => 'null\n'),
    pinned(DOMAIN_PACKAGE, 'typecheck'),
  );
});

test('no pre or post script may run around a gate script', () => {
  const hooks = [
    [ROOT_PACKAGE, 'precheck'],
    [ROOT_PACKAGE, 'pretest'],
    [ROOT_PACKAGE, 'postlint'],
    [MOBILE_PACKAGE, 'pretest:ci'],
    [MOBILE_PACKAGE, 'pretypecheck'],
    [DOMAIN_PACKAGE, 'pretest'],
    [DOMAIN_PACKAGE, 'posttypecheck'],
  ];
  for (const [path, name] of hooks) {
    assert.match(
      after(path, setScript(name, 'node scripts/relax-thresholds.mjs')),
      new RegExp(
        `^${literal(`${path} scripts["${name}"] exists; pnpm runs it around a gate script`)}`,
        'm',
      ),
    );
  }
});

test('type checking stays strict and covers the same files', () => {
  const mobile = 'apps/mobile/tsconfig.json';
  const domain = 'packages/domain/tsconfig.json';
  const client = 'packages/domain/tsconfig.client.json';
  const cases = [
    [
      mobile,
      setOption('strict', false),
      /^apps\/mobile\/tsconfig\.json compilerOptions\.strict is false; it must stay true$/m,
    ],
    [
      mobile,
      dropOption('noUncheckedIndexedAccess'),
      /compilerOptions\.noUncheckedIndexedAccess is unset; it must stay true/,
    ],
    [
      mobile,
      setOption('noImplicitAny', false),
      /compilerOptions\.noImplicitAny is false, which switches off strict type checking or part of it/,
    ],
    [
      mobile,
      setOption('noCheck', true),
      /compilerOptions\.noCheck is true, which switches off strict type checking/,
    ],
    [
      mobile,
      setKey('exclude', ['src/features/**']),
      /^apps\/mobile\/tsconfig\.json exclude is \["src\/features\/\*\*"\], not unset; the files type-checked change only/m,
    ],
    [
      mobile,
      setKey('extends', './tsconfig.loose.json'),
      /apps\/mobile\/tsconfig\.json extends is "\.\/tsconfig\.loose\.json", not "expo\/tsconfig\.base"/,
    ],
    [
      domain,
      setOption('strictNullChecks', false),
      /packages\/domain\/tsconfig\.json compilerOptions\.strictNullChecks is false/,
    ],
    [
      domain,
      setKey('include', ['src/index.ts']),
      /packages\/domain\/tsconfig\.json include is \["src\/index\.ts"\], not \["src\/\*\*\/\*\.ts"\]/,
    ],
    [
      client,
      setOption('strict', false),
      /packages\/domain\/tsconfig\.client\.json compilerOptions\.strict is false, which switches off/,
    ],
    [client, setKey('files', []), /tsconfig\.client\.json files is \[\], not \["src\/index\.ts"\]/],
    [
      mobile,
      (text) => `// relaxed for now\n${text}`,
      /apps\/mobile\/tsconfig\.json is not plain JSON/,
    ],
    [mobile, () => 'null\n', /apps\/mobile\/tsconfig\.json has no compilerOptions object/],
  ];
  for (const [path, edit, expected] of cases) assert.match(after(path, edit), expected);
});

test('the CI check job keeps the trusted baseline line, a one-line pnpm check step and no condition', () => {
  const mustSet =
    /must set FITLOG_CONTRACT_BASELINE exactly once, in jobs\.check\.env, as reviewed/;
  const step = /must hold "- run: pnpm check" exactly once, as one plain line/;
  const stepHas = (line) =>
    new RegExp(
      `the "- run: pnpm check" step also has ${literal(JSON.stringify(line))}; it must be that one line`,
    );
  const jobSets = (key) =>
    new RegExp(`jobs\\.check sets ${key}; only runs-on, timeout-minutes, env, steps are allowed`);
  const cases = [
    // The review's two cases: the change names itself as the baseline, or the check step is skipped.
    [
      (text) => text.replace(BASELINE_LINE, '      FITLOG_CONTRACT_BASELINE: ${{ github.sha }}'),
      mustSet,
    ],
    [insertAfter(CHECK_STEP, '        if: false'), stepHas('if: false')],
    // The baseline taken from the change, or defined again where it would win.
    [
      (text) =>
        text.replace(
          BASELINE_LINE,
          '      FITLOG_CONTRACT_BASELINE: ${{ github.event.pull_request.head.sha }}',
        ),
      mustSet,
    ],
    [
      insertAfter(
        '      - run: pnpm install --frozen-lockfile --strict-peer-dependencies',
        '        env:\n          FITLOG_CONTRACT_BASELINE: ${{ github.sha }}',
      ),
      /\(found 2 definition\(s\)\)/,
    ],
    [
      insertAfter('  contents: read', 'env:\n  FITLOG_CONTRACT_BASELINE: ${{ github.sha }}'),
      /top level sets env; only name, on, permissions, concurrency, jobs are allowed/,
    ],
    [
      insertAfter(
        '          fi',
        '          echo "FITLOG_CONTRACT_BASELINE=$GITHUB_SHA" >> "$GITHUB_ENV"',
      ),
      /jobs\.check names GITHUB_ENV or GITHUB_PATH/,
    ],
    [
      insertAfter('          fi', '          echo "$RUNNER_TEMP/bin" >> "$GITHUB_PATH"'),
      /jobs\.check names GITHUB_ENV or GITHUB_PATH/,
    ],
    // The step skipped, its failure ignored, or its command changed.
    [
      insertAfter(CHECK_STEP, '        continue-on-error: true'),
      stepHas('continue-on-error: true'),
    ],
    [insertAfter(CHECK_STEP, '        env:\n          CI: "0"'), stepHas('env:')],
    [(text) => text.replace(CHECK_STEP, '      - if: false\n        run: pnpm check'), step],
    [(text) => text.replace(CHECK_STEP, '      - { run: pnpm check, if: false }'), step],
    [(text) => text.replace(CHECK_STEP, '      - run: pnpm typecheck'), step],
    [insertAfter(CHECK_STEP, CHECK_STEP), step],
    // The job skipped or its failure ignored.
    [insertAfter('  check:', '    if: false'), jobSets('if')],
    [insertAfter('  check:', '    needs: [gate]'), jobSets('needs')],
    [
      insertAfter('    runs-on: ubuntu-latest', '    continue-on-error: true'),
      jobSets('continue-on-error'),
    ],
    [
      insertAfter('    runs-on: ubuntu-latest', '    <<: *relaxed'),
      /jobs\.check has "<<: \*relaxed", which is not a plain key/,
    ],
    [
      insertAfter('  contents: read', 'defaults:\n  run:\n    shell: true {0}'),
      /top level sets defaults/,
    ],
    [
      insertAfter(
        "      EXPO_NO_TELEMETRY: '1'",
        '      NODE_OPTIONS: --require ./scripts/relax.cjs',
      ),
      /jobs\.check\.env sets NODE_OPTIONS; only CI, EXPO_NO_TELEMETRY, FITLOG_CONTRACT_BASELINE are allowed/,
    ],
    // Phase 2D (R8): ESLint switched to per-file config lookup, which would honour a nested eslint.config.*, or to eslintrc mode.
    [
      insertAfter(
        "      EXPO_NO_TELEMETRY: '1'",
        '      ESLINT_FLAGS: v10_config_lookup_from_file',
      ),
      /jobs\.check\.env sets ESLINT_FLAGS; only CI, EXPO_NO_TELEMETRY, FITLOG_CONTRACT_BASELINE are allowed/,
    ],
    [
      insertAfter("      EXPO_NO_TELEMETRY: '1'", "      ESLINT_USE_FLAT_CONFIG: 'false'"),
      /jobs\.check\.env sets ESLINT_USE_FLAT_CONFIG; only CI/,
    ],
    [
      insertAfter(CHECK_STEP, '        env:\n          ESLINT_FLAGS: v10_config_lookup_from_file'),
      stepHas('env:'),
    ],
    [
      (text) => text.replace('  check:\n', '  check: &check\n'),
      /has no "check" job written as "  check:" under "jobs:"/,
    ],
  ];
  for (const [edit, expected] of cases) assert.match(after(WORKFLOW, edit), expected);
  assert.match(
    wiringProblems(readWith(WORKFLOW, null)).join('\n'),
    /mobile-ci\.yml is missing, so CI would not run pnpm check/,
  );
});

test('the workflow is read by YAML layout, not line by line: comments, blank lines and CRLF endings pass', () => {
  const variants = [
    insertAfter(CHECK_STEP, '        # the gate: lint, types and coverage\n'),
    insertAfter('    runs-on: ubuntu-latest', '\n    # the timeout covers a cold cache'),
    (text) => text.replace(/\n/g, '\r\n'),
  ];
  for (const edit of variants) {
    const changed = edit(repo[WORKFLOW]);
    assert.notEqual(changed, repo[WORKFLOW]);
    assert.deepEqual(wiringProblems(readWith(WORKFLOW, changed)), []);
  }
});

test('a missing quality file fails, and every quality test file on disk is one of them', () => {
  for (const path of QUALITY_FILES) {
    assert.match(
      wiringProblems(readWith(path, null)).join('\n'),
      new RegExp(`^${literal(`${path} is missing; the quality gates need it`)}$`, 'm'),
    );
  }
  const tests = readdirSync(join(repoRoot, 'scripts/quality'))
    .filter((name) => name.endsWith('.test.mjs'))
    .map((name) => `scripts/quality/${name}`);
  assert.deepEqual(
    tests.filter((path) => !QUALITY_FILES.includes(path)),
    [],
    'a quality test file outside QUALITY_FILES could be deleted unseen',
  );
});

test('the mobile coverage run never uses watchman, so a .watchmanconfig cannot hide folders from the files Jest counts', () => {
  // Phase 2E (phase-2D review, finding 2). jest-config 29.7.0 defaults watchman to true (build/Defaults.js), and
  // jest-haste-map then crawls through watchman whenever it is installed (build/index.js _shouldUseWatchman), which honours
  // a .watchmanconfig ignore_dirs. --ci does not change that; --no-watchman makes Jest list the files itself (jest-cli
  // build/args.js). The flag is part of the reviewed command, so dropping it fails here and fails the pin.
  const jest = MOBILE_TEST_CI.split(' && ').filter((command) => command.startsWith('jest '));
  assert.deepEqual(
    jest,
    ['jest --runInBand --ci --coverage --no-watchman'],
    'one Jest run, with coverage and without watchman',
  );
  assert.equal(PINNED_SCRIPTS[MOBILE_PACKAGE]['test:ci'], MOBILE_TEST_CI);
  assert.equal(
    JSON.parse(repo[MOBILE_PACKAGE]).scripts['test:ci'],
    MOBILE_TEST_CI,
    'this repository runs the reviewed command',
  );
  assert.match(
    after(MOBILE_PACKAGE, setScript('test:ci', MOBILE_TEST_CI.replace(' --no-watchman', ''))),
    pinned(MOBILE_PACKAGE, 'test:ci'),
  );
});
