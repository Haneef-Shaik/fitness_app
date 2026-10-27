import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { configInventory } from './config-inventory.mjs';
import { SUPPRESSION_ROOTS, suppressionProblems } from './coverage-suppression.mjs';
import { BASELINE_ENV, DOMAIN_PACKAGE, MOBILE_PACKAGE, wiringProblems } from './gate-wiring.mjs';
import { ESLINT_CONFIG, lintScopeProblems } from './lint-scope.mjs';
import { transformConfigProblems } from './transform-config.mjs';
import { TYPE_ROOTS, typeSuppressionProblems } from './type-suppression.mjs';

// QA-9 coverage ratchet (docs/23 §9 rule 3): coverage thresholds and scope may rise, never fall. The working tree is held to
// the checked-in floor and to the same files at each trusted Git baseline, which are read as data and never run. Through
// gate-wiring.mjs it also checks that coverage, lint and types stay wired into `pnpm check` exactly as reviewed; through
// coverage-suppression.mjs that no source comment takes code out of the count; through transform-config.mjs that no Babel
// configuration changes how Jest transforms mobile files; through lint-scope.mjs that ESLint keeps the reviewed config and
// no eslint-disable goes unexplained; and through type-suppression.mjs that no comment switches type checking off.
// Needs no database; git is only read.
// Self-contained on purpose: its tests run it against scratch repositories.

export { BASELINE_ENV };
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const FLOOR = 'scripts/quality/coverage-floor.json';
export const MOBILE_THRESHOLDS = 'apps/mobile/coverage-thresholds.json';
export const JEST_CONFIG = 'apps/mobile/jest.config.cjs';
/** The phase-1 measurement the initial floor was taken from. */
export const EVIDENCE = 'docs/evidence/QA-9/coverage-baseline.md';
export const MOBILE_METRICS = ['statements', 'branches', 'functions', 'lines'];
export const DOMAIN_METRICS = ['lines', 'branches', 'functions'];
/**
 * The exact domain `test`, with a number in each slot. Node enforces each flag only as a whole number (90.59 as 90), so
 * exact-coverage-reporter.mjs re-checks the same flags exactly and fails the run when one is not met.
 */
export const DOMAIN_TEST =
  "node ../../scripts/quality/coverage-ratchet.mjs && node --import tsx --enable-source-maps --test --experimental-test-coverage --test-coverage-include='src/**/*.ts' --test-coverage-exclude='src/**/*.test.ts' --test-coverage-lines={lines} --test-coverage-branches={branches} --test-coverage-functions={functions} --test-reporter=spec --test-reporter-destination=stdout --test-reporter=../../scripts/quality/exact-coverage-reporter.mjs --test-reporter-destination=stdout src/*.test.ts";
/**
 * The only options jest.config.cjs may export. preset and testMatch are pinned, and scope and thresholds must be the
 * thresholds file. clearMocks and coverageReporters change neither which files count nor the threshold check, which Jest
 * runs after the reporters. Any other option can change which files count: roots and modulePathIgnorePatterns shrink the
 * module map Jest adds untested files from, and another preset brings options of its own. prettierPath names a module
 * Jest loads only to write inline snapshots, and it is pinned to null: Jest 29 refuses Prettier 3, the root devDependency,
 * and with null it writes them with no Prettier at all, so no module is named.
 */
const JEST_PINNED = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.[jt]s?(x)'],
  prettierPath: null,
};
const JEST_KEYS = [
  ...Object.keys(JEST_PINNED),
  'clearMocks',
  'collectCoverageFrom',
  'coverageThreshold',
  'coverageReporters',
];
/** Istanbul's built-in reporters. A reporter named by path would load code that runs before the threshold check. */
const ISTANBUL_REPORTERS = [
  'clover',
  'cobertura',
  'html',
  'html-spa',
  'json',
  'json-summary',
  'lcov',
  'lcovonly',
  'none',
  'teamcity',
  'text',
  'text-lcov',
  'text-summary',
];
const UNANCHORED = `the floor is not anchored yet: no trusted baseline (main locally, ${BASELINE_ENV} in CI) records ${FLOOR}. Until the ratchet is on main, a change that lowers the floor and a threshold together passes this guard; until then the quality tests hold the floor to ${EVIDENCE} §5, and a reviewer compares the two at the exact commit that is merged`;
const OID = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/;
const SLOT = /\{(lines|branches|functions)\}/g;
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DOMAIN_PATTERN = new RegExp(
  `^${DOMAIN_TEST.split(SLOT)
    .map((part, i) => (i % 2 ? '(\\d+(?:\\.\\d+)?)' : escape(part)))
    .join('')}$`,
);
const DOMAIN_SLOTS = [...DOMAIN_TEST.matchAll(SLOT)].map((match) => match[1]);
const DOMAIN_FLAG = /--test-coverage-(lines|branches|functions)=(\S+)/g;
const GIT_LOCATION = [
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_INDEX_FILE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_COMMON_DIR',
  'GIT_NAMESPACE',
];
const requireFresh = createRequire(import.meta.url);

/** The domain `test` script with these thresholds in its slots. */
export const domainTest = (values) =>
  DOMAIN_TEST.replace(SLOT, (_, metric) => String(values[metric]));

/** Runs git read-only in one work tree: inherited variables cannot point it elsewhere and replace refs cannot rewrite a baseline. */
export function gitRunner({ binary = 'git', env = process.env } = {}) {
  const clean = {
    ...Object.fromEntries(Object.entries(env).filter(([key]) => !GIT_LOCATION.includes(key))),
    GIT_OPTIONAL_LOCKS: '0',
    GIT_TERMINAL_PROMPT: '0',
    LC_ALL: 'C',
  };
  return (root, args) => {
    const run = spawnSync(binary, ['--no-replace-objects', '-C', root, ...args], {
      env: clean,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
    return run.error
      ? { status: null, stdout: Buffer.alloc(0), stderr: `git did not run: ${run.error.message}` }
      : { status: run.status, stdout: run.stdout, stderr: run.stderr.toString('utf8').trim() };
  };
}
const why = ({ status, stderr }) =>
  [status === null ? '' : `exit ${status}`, stderr].filter(Boolean).join(': ');
function gitText(git, root, args, label) {
  const run = git(root, args);
  if (run.status !== 0)
    throw new Error(`${label}: git ${args.join(' ')} failed (${why(run) || 'no output'})`);
  return run.stdout.toString('utf8');
}

/** CI mode. GitHub sets GITHUB_ACTIONS=true for every step and a workflow cannot override it, so unsetting CI does not end CI mode. */
export const inCI = (env) =>
  env.GITHUB_ACTIONS === 'true' ||
  !['', '0', 'false'].includes((env.CI ?? '').trim().toLowerCase());
/**
 * The trusted baseline CI already sets and validates for the contract guard, or undefined locally (HEAD and main). In CI it
 * must be a full commit ID; a blank or all-zero value never falls back.
 */
export function configuredBaseline(env) {
  const value = env[BASELINE_ENV];
  if (inCI(env) && !value?.trim())
    throw new Error(
      `${BASELINE_ENV} must be set in CI to the trusted base commit (it is ${value === undefined ? 'unset' : 'blank'})`,
    );
  if (value === undefined) return undefined;
  const ref = value.trim();
  if (!ref)
    throw new Error(
      `${BASELINE_ENV} is blank: unset it to use HEAD and main, or set it to the trusted base commit`,
    );
  if (/^0+$/.test(ref))
    throw new Error(
      `${BASELINE_ENV}=${ref} is the all-zero SHA, which names no commit, so there is no trusted baseline`,
    );
  if (inCI(env) && !OID.test(ref))
    throw new Error(
      `${BASELINE_ENV}=${ref} is not a full 40- or 64-hex commit ID; CI must name the trusted base commit exactly`,
    );
  if (ref.startsWith('-'))
    throw new Error(`${BASELINE_ENV}=${ref} looks like an option; refusing to pass it to git`);
  return ref;
}

/**
 * Read-only baselines: the merge base of each ref with HEAD. A configured baseline fails closed (no work tree, not a commit,
 * no shared history, or in CI a fork point at HEAD itself); locally a missing ref, or no Git at all, is only noted. A file's
 * listing or read failing always throws, so a failure is never mistaken for an absent file. The anchor is the fork point of
 * the trusted ref (main locally, the configured baseline otherwise): the floor holds only once that commit records it.
 */
function gitBaselines(git, root, configured, ci) {
  const top = git(root, ['rev-parse', '--show-toplevel']);
  if (top.status !== 0) {
    if (configured !== undefined)
      throw new Error(
        `${BASELINE_ENV}=${configured} cannot be checked: ${root} is not in a usable Git work tree (${why(top)})`,
      );
    return {
      baselines: [],
      notes: [`not in a usable Git work tree (${why(top)}), so only the floor applies`],
      anchor: null,
    };
  }
  const path = top.stdout.toString('utf8').trim();
  if (realpathSync(path) !== realpathSync(root))
    throw new Error(`${root} is not the top of its Git work tree (${path})`);
  const head = ci
    ? gitText(git, root, ['rev-parse', '--verify', 'HEAD^{commit}'], 'HEAD').trim()
    : null;
  const refs = configured === undefined ? ['HEAD', 'main'] : [configured];
  const baselines = [];
  const notes = [];
  const seen = new Set();
  let anchor = null;
  for (const ref of refs) {
    const commit = git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    const oid = commit.stdout.toString('utf8').trim();
    if (commit.status !== 0 || !OID.test(oid)) {
      if (configured !== undefined)
        throw new Error(
          `${BASELINE_ENV}=${ref} is not a commit in this repository (${why(commit) || 'no output'}); CI must fetch full history`,
        );
      notes.push(`${ref}: not found, skipped`);
      continue;
    }
    const fork = git(root, ['merge-base', oid, 'HEAD']);
    const base = fork.stdout.toString('utf8').trim();
    if (fork.status !== 0 || !OID.test(base)) {
      if (configured !== undefined)
        throw new Error(
          `${BASELINE_ENV}=${ref} shares no history with HEAD (${why(fork) || 'no output'})`,
        );
      notes.push(`${ref}: shares no history with HEAD, skipped`);
      continue;
    }
    if (ci && base === head)
      throw new Error(
        `${BASELINE_ENV}=${ref} forks from HEAD itself, so in CI the change under test would be its own baseline; it must name the pull request base or the previous push head`,
      );
    if (ref === refs.at(-1)) anchor = base;
    const label = `${configured === undefined ? ref : BASELINE_ENV}@${base.slice(0, 12)}`;
    if (seen.has(base)) {
      notes.push(`${label}: same commit as an earlier baseline`);
      continue;
    }
    seen.add(base);
    baselines.push({
      label,
      base,
      read: (file) => {
        const entry = gitText(git, root, ['ls-tree', '-z', '--full-tree', base, '--', file], label)
          .split('\0')
          .find(Boolean);
        if (entry === undefined) return null;
        const [mode, type, blob] = entry.slice(0, entry.indexOf('\t')).split(' ');
        if (type !== 'blob')
          throw new Error(`${label}: ${file} is a ${type} (mode ${mode}), not a file`);
        return gitText(git, root, ['cat-file', 'blob', blob], label);
      },
    });
  }
  return { baselines, notes, anchor };
}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const show = (value) => (value === undefined ? 'unset' : JSON.stringify(value));
/** A threshold is a number from 0 to 100 with at most 2 decimals: the precision Jest reports and the exact reporter compares. */
const isThreshold = (value) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100 &&
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
const THRESHOLD_RULE = 'it must be a number from 0 to 100 with at most 2 decimals';
/** The valid metrics in one thresholds object; every missing, invalid or unknown metric is a problem. */
function metricView(values, metrics, where, problems) {
  if (!isObject(values)) {
    problems.push(`${where} must be an object of ${metrics.join(', ')}`);
    return null;
  }
  for (const key of Object.keys(values))
    if (!metrics.includes(key))
      problems.push(`${where}.${key} is not a coverage metric (${metrics.join(', ')})`);
  const valid = {};
  for (const metric of metrics) {
    if (!(metric in values))
      problems.push(`${where}.${metric} is missing; a coverage metric is never removed`);
    else if (!isThreshold(values[metric]))
      problems.push(`${where}.${metric} is ${JSON.stringify(values[metric])}; ${THRESHOLD_RULE}`);
    else valid[metric] = values[metric];
  }
  return valid;
}
const MOBILE_DIR = dirname(MOBILE_THRESHOLDS);
/** The collectCoverageFrom prefixes the coverage-suppression scan reads: each mobile SUPPRESSION_ROOTS folder (today "src/"). */
const SCANNED = SUPPRESSION_ROOTS.filter((dir) => dir.startsWith(`${MOBILE_DIR}/`)).map(
  (dir) => `${dir.slice(MOBILE_DIR.length + 1)}/`,
);
/** An include pattern the scan may not cover: one that does not start with a scanned prefix, or holds `..` or a backslash. */
const unscanned = (pattern) =>
  !pattern.startsWith('!') &&
  (!SCANNED.some((prefix) => pattern.startsWith(prefix)) || /\.\.|\\/.test(pattern));
/**
 * The mobile scope and thresholds of one thresholds object. In the working tree every include pattern must stay inside a
 * folder the suppression scan reads, until the scan reads more: a file counted from elsewhere could carry an ignore comment
 * the guard never sees. A baseline's patterns are only kept, so one recorded outside src/ fails here until it is resolved.
 */
function mobileView(json, where, problems, inTree) {
  if (!isObject(json)) {
    problems.push(`${where} must be an object with collectCoverageFrom and global`);
    return null;
  }
  for (const key of Object.keys(json))
    if (!['collectCoverageFrom', 'global'].includes(key))
      problems.push(
        `${where}.${key} is not allowed; only collectCoverageFrom and global (per-path thresholds take files out of the global count)`,
      );
  const patterns = json.collectCoverageFrom;
  const listed =
    Array.isArray(patterns) &&
    patterns.length > 0 &&
    patterns.every((item) => typeof item === 'string' && item.length > 0 && item !== '!');
  if (!listed)
    problems.push(`${where}.collectCoverageFrom must be a non-empty list of glob patterns`);
  if (listed && inTree) {
    for (const pattern of patterns.filter(unscanned)) {
      problems.push(
        `${where}.collectCoverageFrom includes ${JSON.stringify(pattern)}, outside ${SCANNED.join(', ') || 'every scanned folder'}: the coverage-suppression scan reads only ${SUPPRESSION_ROOTS.join(' and ')}, so a file this pattern adds could carry an ignore comment unseen. Widen SUPPRESSION_ROOTS in a reviewed change to this guard first`,
      );
    }
  }
  return {
    json,
    patterns: listed ? patterns : null,
    values: metricView(json.global, MOBILE_METRICS, `${where}.global`, problems),
  };
}
/** The working tree must run exactly DOMAIN_TEST; a baseline only records whichever threshold flags its script had. */
function domainView(script, where, required, problems) {
  if (required) {
    const match = typeof script === 'string' ? DOMAIN_PATTERN.exec(script) : null;
    if (!match) {
      problems.push(
        `${where} scripts.test is not the ratchet command ${JSON.stringify(DOMAIN_TEST)} with a number in each slot; it must run this guard and Node coverage with all three thresholds`,
      );
      return null;
    }
    return metricView(
      Object.fromEntries(DOMAIN_SLOTS.map((metric, i) => [metric, Number(match[i + 1])])),
      DOMAIN_METRICS,
      `${where} --test-coverage`,
      problems,
    );
  }
  const flags = typeof script === 'string' ? [...script.matchAll(DOMAIN_FLAG)] : [];
  if (!flags.length) return null;
  const values = Object.fromEntries(flags.map(([, metric, value]) => [metric, Number(value)]));
  for (const [metric, value] of Object.entries(values))
    if (!isThreshold(value))
      problems.push(
        `${where} --test-coverage-${metric} is not a number from 0 to 100 with at most 2 decimals`,
      );
  return Object.fromEntries(Object.entries(values).filter(([, value]) => isThreshold(value)));
}

/** What each file the ratchet reads must hold at its top level. */
const SHAPE = {
  [FLOOR]: 'with mobile and domain',
  [MOBILE_THRESHOLDS]: 'with collectCoverageFrom and global',
  [DOMAIN_PACKAGE]: 'with scripts.test',
};
const kindOf = (value) =>
  value === null ? 'null' : Array.isArray(value) ? 'an array' : `a ${typeof value}`;
/**
 * The floor, mobile thresholds and domain thresholds one source holds. The working tree must hold all three; a baseline may
 * predate any of them. A file that is there must parse to a JSON object: `null` or any other value is a problem, never read
 * as a missing file, because a config that tolerates it (`require(…) ?? fallback`) would hand Jest a scope this guard never saw.
 */
function minimumsIn(read, label, required) {
  const problems = [];
  const at = (path) => (required ? path : `${path} at ${label}`);
  /** The file's JSON object; null when it is absent, or when it is not a JSON object, which is then a problem. */
  const object = (path) => {
    const text = read(path);
    if (text === null) {
      if (required) problems.push(`${path} is missing, so the ratchet cannot read it`);
      return null;
    }
    let value;
    try {
      value = JSON.parse(text);
    } catch (error) {
      problems.push(`${at(path)} is not JSON (${error.message}), so the ratchet cannot read it`);
      return null;
    }
    if (isObject(value)) return value;
    problems.push(
      `${at(path)} must be a JSON object ${SHAPE[path]}; it is ${kindOf(value)}, so the ratchet cannot read it`,
    );
    return null;
  };
  const floorJson = object(FLOOR);
  let floor = null;
  if (floorJson) {
    for (const key of Object.keys(floorJson))
      if (!['source', 'mobile', 'domain'].includes(key))
        problems.push(`${at(FLOOR)}.${key} is not allowed`);
    floor = {
      mobile: mobileView(floorJson.mobile, `${at(FLOOR)} mobile`, problems, required),
      domain: metricView(floorJson.domain, DOMAIN_METRICS, `${at(FLOOR)} domain`, problems),
    };
  }
  const mobileJson = object(MOBILE_THRESHOLDS);
  const mobile = mobileJson && mobileView(mobileJson, at(MOBILE_THRESHOLDS), problems, required);
  const domainJson = object(DOMAIN_PACKAGE);
  const domain =
    domainJson && domainView(domainJson.scripts?.test, at(DOMAIN_PACKAGE), required, problems);
  return { label, floor, mobile, domain, problems };
}

/** Each metric must reach the highest value any minimum records for it. */
function belowProblems(name, values, kind, metrics, minimums) {
  return metrics.flatMap((metric) => {
    if (!isThreshold(values?.[metric])) return [];
    const top = minimums
      .filter((source) => isThreshold(source[kind]?.[metric]))
      .sort((a, b) => b[kind][metric] - a[kind][metric])[0];
    return top && values[metric] < top[kind][metric]
      ? [
          `${name(metric)} is ${values[metric]}, below ${top[kind][metric]} at ${top.label}; coverage thresholds never go down`,
        ]
      : [];
  });
}
/** Every include pattern a minimum records is kept, and no exclusion is added that none records. */
function scopeProblems(name, patterns, minimums) {
  const recorded = minimums.filter((source) => source.patterns);
  if (!patterns || !recorded.length) return [];
  const required = new Map();
  const allowed = new Set();
  for (const source of recorded) {
    for (const pattern of source.patterns) {
      if (pattern.startsWith('!')) allowed.add(pattern);
      else if (!required.has(pattern)) required.set(pattern, source.label);
    }
  }
  return [
    ...[...required]
      .filter(([pattern]) => !patterns.includes(pattern))
      .map(
        ([pattern, label]) =>
          `${name} drops ${JSON.stringify(pattern)}, recorded at ${label}; coverage scope never narrows`,
      ),
    ...patterns
      .filter((pattern) => pattern.startsWith('!') && !allowed.has(pattern))
      .map(
        (pattern) =>
          `${name} adds the exclusion ${JSON.stringify(pattern)}, which no floor or baseline records; coverage scope never narrows`,
      ),
  ];
}
function ratchetProblems(tree, recorded) {
  const source = (label, floor) => ({
    label,
    mobile: floor.mobile?.values,
    patterns: floor.mobile?.patterns,
    domain: floor.domain,
  });
  const baseFloors = recorded
    .filter((r) => r.floor)
    .map((r) => source(`${FLOOR} at ${r.label}`, r.floor));
  const minimums = [
    ...(tree.floor ? [source(`the floor (${FLOOR})`, tree.floor)] : []),
    ...baseFloors,
    ...recorded
      .filter((r) => r.mobile)
      .map((r) => ({
        label: `${MOBILE_THRESHOLDS} at ${r.label}`,
        mobile: r.mobile.values,
        patterns: r.mobile.patterns,
      })),
    ...recorded
      .filter((r) => r.domain)
      .map((r) => ({ label: `${DOMAIN_PACKAGE} at ${r.label}`, domain: r.domain })),
  ];
  return [
    ...belowProblems(
      (m) => `${MOBILE_THRESHOLDS} global.${m}`,
      tree.mobile?.values,
      'mobile',
      MOBILE_METRICS,
      minimums,
    ),
    ...scopeProblems(`${MOBILE_THRESHOLDS} collectCoverageFrom`, tree.mobile?.patterns, minimums),
    ...belowProblems(
      (m) => `${DOMAIN_PACKAGE} --test-coverage-${m}`,
      tree.domain,
      'domain',
      DOMAIN_METRICS,
      minimums,
    ),
    ...belowProblems(
      (m) => `${FLOOR} mobile.global.${m}`,
      tree.floor?.mobile?.values,
      'mobile',
      MOBILE_METRICS,
      baseFloors,
    ),
    ...belowProblems(
      (m) => `${FLOOR} domain.${m}`,
      tree.floor?.domain,
      'domain',
      DOMAIN_METRICS,
      baseFloors,
    ),
    ...scopeProblems(
      `${FLOOR} mobile.collectCoverageFrom`,
      tree.floor?.mobile?.patterns,
      baseFloors,
    ),
  ];
}

const isIstanbulReporter = (entry) =>
  ISTANBUL_REPORTERS.includes(
    Array.isArray(entry) && entry.length === 2 && isObject(entry[1]) ? entry[0] : entry,
  );
/** Scope and thresholds must be the thresholds file unchanged; with no readable thresholds object, they cannot be confirmed. */
function appliedProblems(config, mobile) {
  if (!mobile)
    return [
      `${JEST_CONFIG} collectCoverageFrom and coverageThreshold cannot be checked, because ${MOBILE_THRESHOLDS} holds no thresholds object this guard could read (see above); Jest must never run on a scope or thresholds this guard has not read`,
    ];
  return [
    ...(isDeepStrictEqual(config.collectCoverageFrom, mobile.json.collectCoverageFrom)
      ? []
      : [`${JEST_CONFIG} collectCoverageFrom is not the list in ${MOBILE_THRESHOLDS}`]),
    ...(isDeepStrictEqual(config.coverageThreshold, { global: mobile.json.global })
      ? []
      : [`${JEST_CONFIG} coverageThreshold must be exactly { global } from ${MOBILE_THRESHOLDS}`]),
  ];
}
/**
 * jest.config.cjs is the working tree's own code, which `pnpm check` runs anyway: it may export only the reviewed options. It
 * is checked even when the thresholds file is unusable, since a config can fall back to a scope of its own exactly then.
 */
function jestProblems(root, read, mobile) {
  const path = join(root, JEST_CONFIG);
  let config;
  try {
    const dir = dirname(realpathSync(path)) + sep;
    for (const key of Object.keys(requireFresh.cache))
      if (key.startsWith(dir)) delete requireFresh.cache[key];
    config = requireFresh(path);
  } catch (error) {
    return [
      `${JEST_CONFIG} could not be loaded (${error instanceof Error ? error.message : String(error)})`,
    ];
  }
  if (!isObject(config))
    return [`${JEST_CONFIG} must export a plain object, so this guard can read what Jest will use`];
  return [
    ...Object.keys(config)
      .filter((key) => !JEST_KEYS.includes(key))
      .map(
        (key) =>
          `${JEST_CONFIG} sets ${key}; only ${JEST_KEYS.join(', ')} are allowed, since any other option (roots, modulePathIgnorePatterns, another preset's own options) can change which files coverage counts. Change this guard in a reviewed diff first`,
      ),
    ...Object.entries(JEST_PINNED)
      .filter(([key, value]) => !isDeepStrictEqual(config[key], value))
      .map(
        ([key, value]) =>
          `${JEST_CONFIG} ${key} is ${show(config[key])}, not ${JSON.stringify(value)} as reviewed`,
      ),
    ...('clearMocks' in config && typeof config.clearMocks !== 'boolean'
      ? [`${JEST_CONFIG} clearMocks must be true or false`]
      : []),
    ...('coverageReporters' in config &&
    !(Array.isArray(config.coverageReporters) && config.coverageReporters.every(isIstanbulReporter))
      ? [
          `${JEST_CONFIG} coverageReporters must list only Istanbul's built-in reporters (${ISTANBUL_REPORTERS.join(', ')}); a reporter loaded from a path runs before the threshold check`,
        ]
      : []),
    ...appliedProblems(config, mobile),
    ...mobilePackageProblems(read),
  ];
}
/**
 * The mobile package.json must not configure Jest itself: Jest would read those options instead of jest.config.cjs. The
 * file is read outside the `try`, so one that exists but cannot be read stops the guard here as everywhere (the reader
 * throws), whatever order the checks run in. Only parsing is tolerated: gate-wiring.mjs reports a file that is not JSON.
 */
export function mobilePackageProblems(read) {
  const text = read(MOBILE_PACKAGE);
  if (text === null) return [];
  let mobilePackage;
  try {
    mobilePackage = JSON.parse(text);
  } catch {
    return [];
  }
  return isObject(mobilePackage) && 'jest' in mobilePackage
    ? [
        `${MOBILE_PACKAGE} has a "jest" key; Jest must read its options only from jest.config.cjs, which this guard checks`,
      ]
    : [];
}

/**
 * A working-tree file's text, or null only when nothing is at that path. Any other failure to read it (a directory, no
 * permission) stops the guard and names the file, so an unreadable input is never taken for a missing one.
 */
function treeReader(root) {
  return (path) => {
    try {
      return readFileSync(join(root, path), 'utf8');
    } catch (error) {
      if (['ENOENT', 'ENOTDIR'].includes(error?.code)) return null;
      throw new Error(
        `${path} cannot be read (${error instanceof Error ? error.message : String(error)}), so the ratchet fails closed`,
      );
    }
  };
}

const listed = (values, metrics) =>
  metrics.map((metric) => `${metric} ${values?.[metric] ?? '?'}`).join(', ');
export function checkCoverageRatchet({
  root = REPO_ROOT,
  env = process.env,
  git = gitRunner(),
} = {}) {
  const configured = configuredBaseline(env);
  const read = treeReader(root);
  const tree = minimumsIn(read, 'working tree', true);
  const { baselines, notes, anchor } = gitBaselines(git, root, configured, inCI(env));
  const recorded = baselines.map((baseline) => ({
    ...minimumsIn(baseline.read, baseline.label, false),
    base: baseline.base,
  }));
  const anchored = anchor !== null && recorded.some((r) => r.base === anchor && r.floor !== null);
  const records = recorded.map((r) => {
    const held = [
      r.floor && 'the floor',
      r.mobile && 'mobile thresholds',
      r.domain && 'domain thresholds',
    ].filter(Boolean);
    return `${r.label}: checked; records ${held.length ? held.join(', ') : 'no coverage minimums yet, so the floor applies'}`;
  });
  const scan = suppressionProblems(root);
  const inventory = configInventory(root);
  const lint = lintScopeProblems(root, inventory);
  const types = typeSuppressionProblems(root);
  return {
    problems: [
      ...tree.problems,
      ...wiringProblems(read),
      ...jestProblems(root, read, tree.mobile),
      ...scan.problems,
      ...inventory.problems,
      ...transformConfigProblems(root, inventory),
      ...lint.problems,
      ...types.problems,
      ...recorded.flatMap((r) => r.problems),
      ...ratchetProblems(tree, recorded),
    ],
    notes: [...records, ...notes, ...(anchored ? [] : [UNANCHORED])],
    summary:
      `Coverage ratchet verified. Mobile (${MOBILE_THRESHOLDS}): ${listed(tree.mobile?.values, MOBILE_METRICS)}. ` +
      `Domain (${DOMAIN_PACKAGE} test): ${listed(tree.domain, DOMAIN_METRICS)}. Nothing is below the floor or ${recorded.length} Git baseline(s). ` +
      `No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the ${types.files} TypeScript files under ${TYPE_ROOTS.join(' and ')}. ` +
      `No Babel configuration is among the ${inventory.entries.length} entries under ${MOBILE_DIR}, ${ESLINT_CONFIG} is as reviewed, and the ${lint.files} other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. ` +
      `No coverage-suppression comment is in the ${scan.files} files under ${SUPPRESSION_ROOTS.join(' and ')}.`,
    anchored,
  };
}

function main() {
  try {
    const { problems, notes, summary } = checkCoverageRatchet();
    if (problems.length) {
      process.stderr.write(`coverage-ratchet failed:\n- ${problems.join('\n- ')}\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`${summary}\n${notes.map((note) => `  ${note}\n`).join('')}`);
  } catch (error) {
    process.stderr.write(
      `coverage-ratchet failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
function invokedDirectly() {
  try {
    return realpathSync(process.argv[1] ?? '') === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}
if (invokedDirectly()) main();
