import { isDeepStrictEqual } from 'node:util';

// QA-9 gate wiring (docs/23 §9 rule 3). `pnpm check` runs lint, types and coverage only through the package scripts,
// compiler settings and CI job pinned here as reviewed; coverage-ratchet.mjs runs these checks on every pass. They read text
// and never run it. They stop a careless or casual change from switching a gate off. They cannot stop deliberately hostile
// code in a change, because `pnpm check` and the workflow run that code: review and the repository's workflow protections
// (PL-1) carry that trust.

export const BASELINE_ENV = 'FITLOG_CONTRACT_BASELINE';
export const ROOT_PACKAGE = 'package.json';
export const MOBILE_PACKAGE = 'apps/mobile/package.json';
export const DOMAIN_PACKAGE = 'packages/domain/package.json';
export const WORKFLOW = '.github/workflows/mobile-ci.yml';
/** Without these, test:ci runs fewer quality tests or the domain thresholds hold only as whole numbers. */
export const QUALITY_FILES = [
  'scripts/quality/coverage-ratchet.test.mjs',
  'scripts/quality/coverage-suppression.test.mjs',
  'scripts/quality/gate-wiring.test.mjs',
  'scripts/quality/exact-coverage-reporter.mjs',
  'scripts/quality/exact-coverage-reporter.test.mjs',
  'scripts/quality/lint-scope.test.mjs',
  'scripts/quality/touched-format.test.mjs',
  'scripts/quality/transform-config.test.mjs',
  'scripts/quality/type-suppression.test.mjs',
];

/**
 * The exact mobile `test:ci`: the quality tests, the ratchet guard, then Jest with coverage, so coverageThreshold applies.
 * `--no-watchman` makes Jest list the files itself: through watchman, which Jest uses whenever it is installed, a
 * `.watchmanconfig` could hide folders from the files Jest counts.
 */
export const MOBILE_TEST_CI =
  'node --test ../../scripts/quality/*.test.mjs && node ../../scripts/quality/coverage-ratchet.mjs && jest --runInBand --ci --coverage --no-watchman';
/**
 * Gate scripts, pinned exactly. Root `check` runs the ratchet guard itself, so a change that unwires both package copies is
 * still caught, and it keeps typecheck and lint ahead of the tests. The domain `test` holds the thresholds, so
 * coverage-ratchet.mjs matches it as a template instead.
 */
export const PINNED_SCRIPTS = {
  [ROOT_PACKAGE]: {
    check:
      'node scripts/quality/coverage-ratchet.mjs && node scripts/quality/touched-format.mjs && pnpm typecheck && pnpm lint && pnpm test && pnpm plan:build --check',
    typecheck: 'pnpm --filter @fitlog/domain typecheck && pnpm --filter @fitlog/mobile typecheck',
    lint: 'pnpm --filter @fitlog/mobile lint',
    test: 'pnpm --filter @fitlog/domain test && pnpm --filter @fitlog/mobile test:ci && pnpm plan:test',
  },
  [MOBILE_PACKAGE]: {
    'test:ci': MOBILE_TEST_CI,
    lint: 'eslint . --max-warnings=0 && node scripts/test-design-rules.cjs',
    typecheck: 'tsc --noEmit',
  },
  [DOMAIN_PACKAGE]: { typecheck: 'tsc --noEmit && tsc -p tsconfig.client.json --noEmit' },
};
/** pnpm runs `pre<name>` and `post<name>` around a script it runs, so no gate script may have either. */
const GATED = {
  ...Object.fromEntries(
    Object.entries(PINNED_SCRIPTS).map(([path, scripts]) => [path, Object.keys(scripts)]),
  ),
  [DOMAIN_PACKAGE]: ['test', ...Object.keys(PINNED_SCRIPTS[DOMAIN_PACKAGE])],
};

/** The files each config type-checks, as reviewed, and the options it keeps true. */
export const TSCONFIGS = {
  'apps/mobile/tsconfig.json': {
    scope: { extends: 'expo/tsconfig.base', include: ['**/*.ts', '**/*.tsx'] },
    on: [
      'strict',
      'noUncheckedIndexedAccess',
      'exactOptionalPropertyTypes',
      'noImplicitReturns',
      'noFallthroughCasesInSwitch',
      'noUnusedLocals',
      'noUnusedParameters',
    ],
  },
  'packages/domain/tsconfig.json': {
    scope: { include: ['src/**/*.ts'] },
    on: ['strict', 'noUncheckedIndexedAccess', 'exactOptionalPropertyTypes'],
  },
  'packages/domain/tsconfig.client.json': {
    scope: { extends: './tsconfig.json', files: ['src/index.ts'], include: [] },
    on: [],
  },
};
const TS_SCOPE = ['extends', 'include', 'exclude', 'files', 'references'];
/** Option values that switch off all of `strict`, part of it, or type checking itself. */
const TS_WEAKENING = {
  strict: false,
  noImplicitAny: false,
  noImplicitThis: false,
  strictNullChecks: false,
  strictFunctionTypes: false,
  strictBindCallApply: false,
  strictPropertyInitialization: false,
  strictBuiltinIteratorReturn: false,
  alwaysStrict: false,
  useUnknownInCatchVariables: false,
  noCheck: true,
};

/** The trusted baseline exactly as reviewed: the event's base commit, never a value the change controls (AR-1 L4). */
export const BASELINE_LINE =
  "      FITLOG_CONTRACT_BASELINE: ${{ github.event_name == 'pull_request' && github.event.pull_request.base.sha || github.event_name == 'push' && github.event.before || '' }}";
export const CHECK_STEP = '      - run: pnpm check';
const WORKFLOW_KEYS = ['name', 'on', 'permissions', 'concurrency', 'jobs'];
const JOB_KEYS = ['runs-on', 'timeout-minutes', 'env', 'steps'];
const JOB_ENV = ['CI', 'EXPO_NO_TELEMETRY', BASELINE_ENV];
/** A YAML key naming the baseline, in block, quoted or flow style. */
const BASELINE_KEY = new RegExp(`${BASELINE_ENV}['"]?\\s*:`);

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const show = (value) => (value === undefined ? 'unset' : JSON.stringify(value));

function scriptProblems(path, json) {
  const scripts = isObject(json?.scripts) ? json.scripts : {};
  return [
    ...Object.entries(PINNED_SCRIPTS[path])
      .filter(([name, command]) => scripts[name] !== command)
      .map(
        ([name, command]) =>
          `${path} scripts["${name}"] is ${show(scripts[name])}, not ${JSON.stringify(command)}; gate scripts are pinned exactly as reviewed`,
      ),
    ...GATED[path]
      .flatMap((name) => [`pre${name}`, `post${name}`])
      .filter((name) => name in scripts)
      .map(
        (name) =>
          `${path} scripts["${name}"] exists; pnpm runs it around a gate script, where it could rewrite what the gate reads`,
      ),
  ];
}

function tsconfigProblems(path, json, { scope, on }) {
  const options = json?.compilerOptions;
  if (!isObject(options))
    return [
      `${path} has no compilerOptions object, so its strict type checking cannot be confirmed`,
    ];
  return [
    ...TS_SCOPE.filter((key) => !isDeepStrictEqual(json[key], scope[key])).map(
      (key) =>
        `${path} ${key} is ${show(json[key])}, not ${show(scope[key])}; the files type-checked change only in a reviewed change to this guard`,
    ),
    ...on
      .filter((key) => options[key] !== true)
      .map((key) => `${path} compilerOptions.${key} is ${show(options[key])}; it must stay true`),
    ...Object.entries(TS_WEAKENING)
      .filter(([key, value]) => options[key] === value)
      .map(
        ([key, value]) =>
          `${path} compilerOptions.${key} is ${value}, which switches off strict type checking or part of it`,
      ),
  ];
}

const indentOf = (line) => line.length - line.trimStart().length;
const meaningful = (line) => line.trim() !== '' && !line.trimStart().startsWith('#');
/** Block-style keys at one indentation; a line there that is not a plain `key:` comes back with key null. */
const keysAt = (lines, indent) =>
  lines
    .filter((line) => meaningful(line) && indentOf(line) === indent)
    .map((line) => ({
      line: line.trim(),
      key: /^([A-Za-z0-9_-]+):(?:\s|$)/.exec(line.trim())?.[1] ?? null,
    }));
/** The lines nested under lines[start]: up to the next meaningful line indented `indent` or less. */
function nestedUnder(lines, start, indent) {
  const end = lines.findIndex(
    (line, i) => i > start && meaningful(line) && indentOf(line) <= indent,
  );
  return lines.slice(start + 1, end < 0 ? lines.length : end);
}
const onlyKeys = (where, found, allowed, why) =>
  found
    .filter(({ key }) => !allowed.includes(key))
    .map(
      ({ key, line }) =>
        `${WORKFLOW} ${where} ${key === null ? `has ${JSON.stringify(line)}, which is not a plain key` : `sets ${key}`}; only ${allowed.join(', ')} are allowed, ${why}`,
    );

/**
 * The CI job that runs `pnpm check`, read as the block-style YAML this file uses. It must keep the trusted baseline line, a
 * one-line `pnpm check` step and only the keys allowed above: `if`, `needs` or `continue-on-error` could skip the job or
 * ignore its failure, and GitHub reports a skipped job as passing. This reads text, not YAML semantics. An override written
 * in a form it does not look for, or code in another step, is beyond it; PL-1 owns that workflow trust.
 */
export function workflowProblems(text) {
  if (text === null) return [`${WORKFLOW} is missing, so CI would not run pnpm check`];
  const lines = text.split(/\r?\n/);
  const top = onlyKeys(
    'top level',
    keysAt(lines, 0),
    WORKFLOW_KEYS,
    'since a key such as env or defaults reaches every step of every job',
  );
  const jobs = lines.indexOf('jobs:');
  const start = jobs < 0 ? -1 : lines.indexOf('  check:', jobs);
  if (
    start < 0 ||
    lines.slice(jobs + 1, start).some((line) => meaningful(line) && indentOf(line) === 0)
  ) {
    return [
      ...top,
      `${WORKFLOW} has no "check" job written as "  check:" under "jobs:", the block style this guard reads`,
    ];
  }
  const job = nestedUnder(lines, start, 2);
  const block = (key) => {
    const at = job.indexOf(`    ${key}:`);
    return at < 0 ? [] : nestedUnder(job, at, 4);
  };
  const env = block('env');
  const steps = block('steps');
  const step = steps.indexOf(CHECK_STEP);
  const definitions = lines.filter((line) => BASELINE_KEY.test(line)).length;
  return [
    ...top,
    ...onlyKeys(
      'jobs.check',
      keysAt(job, 4),
      JOB_KEYS,
      'because a key such as if, needs or continue-on-error can skip the job or ignore its failure, and GitHub reports a skipped job as passing',
    ),
    ...onlyKeys(
      'jobs.check.env',
      keysAt(env, 6),
      JOB_ENV,
      'since a variable such as NODE_OPTIONS changes what every step runs',
    ),
    ...(definitions === 1 && env.includes(BASELINE_LINE)
      ? []
      : [
          `${WORKFLOW} must set ${BASELINE_ENV} exactly once, in jobs.check.env, as reviewed: "${BASELINE_LINE.trim()}" (found ${definitions} definition(s)). The baseline comes from the event, never from the change`,
        ]),
    ...(step < 0 || steps.lastIndexOf(CHECK_STEP) !== step
      ? [
          `${WORKFLOW} jobs.check.steps must hold "${CHECK_STEP.trim()}" exactly once, as one plain line`,
        ]
      : nestedUnder(steps, step, 6)
          .filter(meaningful)
          .map(
            (line) =>
              `${WORKFLOW} the "${CHECK_STEP.trim()}" step also has ${JSON.stringify(line.trim())}; it must be that one line, since if, continue-on-error, env or shell can skip it, ignore its failure or change what it runs`,
          )),
    ...job
      .filter((line) => /GITHUB_(?:ENV|PATH)\b/.test(line))
      .map(
        (line) =>
          `${WORKFLOW} jobs.check names GITHUB_ENV or GITHUB_PATH (${JSON.stringify(line.trim())}); a step could use it to override CI or the baseline, or put another pnpm or node first on PATH, for every later step`,
      ),
  ];
}

/** Every way the gate wiring differs from what was reviewed. `read` returns a file's text, or null when it is missing. */
export function wiringProblems(read) {
  const parsed = (path) => {
    const text = read(path);
    if (text === null) return { readable: false, problems: [`${path} is missing`] };
    try {
      return { readable: true, json: JSON.parse(text), problems: [] };
    } catch (error) {
      return {
        readable: false,
        problems: [`${path} is not plain JSON (${error.message}), so this guard cannot read it`],
      };
    }
  };
  const checked = (paths, problemsOf) =>
    paths.flatMap((path) => {
      const { readable, json, problems } = parsed(path);
      return [...problems, ...(readable ? problemsOf(path, json) : [])];
    });
  return [
    ...checked(Object.keys(PINNED_SCRIPTS), scriptProblems),
    ...checked(Object.keys(TSCONFIGS), (path, json) =>
      tsconfigProblems(path, json, TSCONFIGS[path]),
    ),
    ...workflowProblems(read(WORKFLOW)),
    ...QUALITY_FILES.filter((path) => read(path) === null).map(
      (path) => `${path} is missing; the quality gates need it`,
    ),
  ];
}
