import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import {
  block,
  bodyLines,
  characterProblems,
  get,
  keyProblems,
  linesOf,
  meaningful,
  readStep,
  show,
  stepItems,
} from './workflow-text.mjs';

// PL-1: the required checks are the jobs `check` (mobile-ci.yml), `backend` (backend-ci.yml) and `ci-guard`
// (ci-guard.yml). GitHub reports a skipped job as passing, so a guard that ran only inside the job it guards
// could be skipped together with that job (review 0535 H1). This guard judges all three workflows and the
// folder that holds them, and both the backend and the ci-guard job run it, so one edit to a workflow file that
// skips, empties or redirects any one required job is refused by a guard job in a workflow the edit did not
// touch. For mobile-ci.yml that holds the runner, the timeout and every step up to and including `pnpm check`
// (review 0705 F1, review 0905 L1). Every action is held at its reviewed commit, read from the parsed step and
// never from a comment (review 0905 M1). It reads text and never runs it. It judges the workflow files only.
// Everything the jobs run or configure is trusted to review and branch protection, not to this guard:
// package.json scripts, .npmrc, the scripts and tests the commands run, and this guard itself, edited alone or
// with the workflows (review 0705 F2; docs/evidence/PL-1/hosted-proof-procedure.md).

export const WORKFLOW_DIR = '.github/workflows';
export const WORKFLOW = `${WORKFLOW_DIR}/backend-ci.yml`;
export const GUARD_WORKFLOW = `${WORKFLOW_DIR}/ci-guard.yml`;
export const MOBILE_WORKFLOW = `${WORKFLOW_DIR}/mobile-ci.yml`;
export const JOB = 'backend';
/** Each required check, by the job ID GitHub reports it under, and the workflow that defines it. */
export const REQUIRED_CHECKS = Object.freeze({
  check: MOBILE_WORKFLOW,
  backend: WORKFLOW,
  'ci-guard': GUARD_WORKFLOW,
});
/** The workflows whose required job runs this guard over all three. */
export const GUARD_RUNNERS = Object.freeze([WORKFLOW, GUARD_WORKFLOW]);
export const GUARD_COMMAND = 'node scripts/ci/workflow-guard.mjs';
export const TEST_COMMAND = 'node --test scripts/ci/*.test.mjs';
export const MAX_MINUTES = 60;
/** The trusted base exactly as AR-1 reviewed it for mobile-ci.yml: from the event, never from the change. */
export const EVENT_BASE =
  "${{ github.event_name == 'pull_request' && github.event.pull_request.base.sha || github.event_name == 'push' && github.event.before || '' }}";
/** Every required check runs on the same events and branches, with no path filter. */
const ON = ['on:', '  pull_request:', '  push:', '    branches: [main, v2/develop]'];
const PERMISSIONS = ['  contents: read'];
/**
 * Superseded pull request runs are cancelled. Each push has its own group (its run ID), so no queued push run
 * is cancelled and every push reaches a verdict against its own `before` (review 0535 L1).
 */
const concurrency = (prefix) => [
  `  group: ${prefix}-` +
    "${{ github.event_name == 'pull_request' && github.ref || github.run_id }}",
  "  cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
];
const TOP_KEYS = ['name', 'on', 'permissions', 'concurrency', 'jobs'];
const STEP_KEYS = ['name', 'uses', 'with', 'run', 'if'];
const PINNED = /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/;
/**
 * Each action the three workflows run, as `owner/repo@sha` at the full commit reviewed (review 0905 M1). A
 * step's `uses` is compared whole, as the reader parsed it, so no comment, later line or later step can stand in
 * for a changed pin. Moving any of them to another commit needs a reviewed change here, in the same diff.
 */
const ACTION = Object.freeze({
  checkout: 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
  setupNode: 'actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1',
  pnpm: 'pnpm/action-setup@f520eceda224fe1a4aed5a2a27a194379a409996',
});
const CHECKOUT = {
  uses: ACTION.checkout,
  with: { 'persist-credentials': 'false', 'fetch-depth': '0' },
};
const SETUP_NODE = {
  uses: ACTION.setupNode,
  with: { 'node-version-file': '.node-version', 'package-manager-cache': 'false' },
};
const PNPM_SETUP = { uses: ACTION.pnpm };
const INSTALL = { run: 'pnpm install --frozen-lockfile --strict-peer-dependencies' };
/** Every backend step in order, without its name: the command it runs, or the pinned action and its inputs. */
export const STEPS = [
  CHECKOUT,
  SETUP_NODE,
  { run: GUARD_COMMAND },
  { run: 'node scripts/ci/backend-ci.mjs base' },
  { run: TEST_COMMAND },
  { run: 'node scripts/ci/backend-ci.mjs vendored' },
  { run: 'node scripts/ci/backend-ci.mjs local-main' },
  PNPM_SETUP,
  INSTALL,
  { run: 'pnpm exec supabase start > /dev/null' },
  { run: 'node scripts/ci/backend-ci.mjs replay' },
  { run: 'node scripts/ci/backend-ci.mjs diff' },
  { run: 'node scripts/ci/backend-ci.mjs lint' },
  { run: 'pnpm backend:test' },
  { if: 'failure()', run: "docker ps --all --format '{{.Names}} {{.Status}}'" },
];
/** The ci-guard steps: Node only, no install, so it judges the workflows even when nothing else can run. */
export const GUARD_STEPS = [
  { uses: ACTION.checkout, with: { 'persist-credentials': 'false' } },
  SETUP_NODE,
  { run: GUARD_COMMAND },
  { run: TEST_COMMAND },
];
const BACKEND = {
  path: WORKFLOW,
  job: JOB,
  env: { CI: "'1'", FITLOG_CONTRACT_BASELINE: EVENT_BASE, FITLOG_BASE_REF: EVENT_BASE },
  maxMinutes: MAX_MINUTES,
  concurrency: concurrency('backend'),
  steps: STEPS,
  missing: `${WORKFLOW} is missing, so no hosted job replays the migrations or runs pnpm backend:test`,
};
const GUARD = {
  path: GUARD_WORKFLOW,
  job: 'ci-guard',
  env: {},
  maxMinutes: 15,
  concurrency: concurrency('ci-guard'),
  steps: GUARD_STEPS,
  missing: `${GUARD_WORKFLOW} is missing, so no job outside backend and check judges their workflows`,
};
/** What this guard holds of mobile-ci.yml's check job; QA-9's gate-wiring.mjs pins more, from inside the job. */
const MOBILE = {
  path: MOBILE_WORKFLOW,
  job: 'check',
  env: { CI: "'1'", EXPO_NO_TELEMETRY: "'1'", FITLOG_CONTRACT_BASELINE: EVENT_BASE },
  maxMinutes: 15,
};
const MOBILE_JOB_KEYS = ['runs-on', 'timeout-minutes', 'env', 'steps'];
const MOBILE_STEP_KEYS = ['name', 'uses', 'with', 'run', 'shell'];
const CHECK_RUN = 'pnpm check';
/** The baseline step's script, line by line as the reader keeps it: indentation dropped, which bash ignores. */
const BASELINE_SCRIPT = [
  'if [[ -z "$FITLOG_CONTRACT_BASELINE" ]]; then',
  'echo "::error::FITLOG_CONTRACT_BASELINE is missing: the ${GITHUB_EVENT_NAME} event gave no pull request base or previous push head"',
  'exit 1',
  'fi',
  'if [[ "$FITLOG_CONTRACT_BASELINE" =~ ^0+$ ]]; then',
  'echo "::error::FITLOG_CONTRACT_BASELINE is the all-zero SHA: the push created the branch, so there is no previous head to trust"',
  'exit 1',
  'fi',
  'if [[ ! "$FITLOG_CONTRACT_BASELINE" =~ ^[0-9a-f]{40}([0-9a-f]{24})?$ ]]; then',
  'echo "::error::FITLOG_CONTRACT_BASELINE is not a full commit SHA"',
  'exit 1',
  'fi',
];
/**
 * mobile-ci.yml's check job, every step up to and including `pnpm check`, in order and without its name: one
 * step before it could rewrite the check script, move the checkout or export NODE_OPTIONS (review 0705 F1).
 * Each action is compared whole, `owner/repo@sha`, against the reviewed pin (review 0905 M1). Steps after
 * `pnpm check` may be added, unconditionally, since none of them can turn a failed check into a pass.
 */
export const MOBILE_STEPS = [
  CHECKOUT,
  { shell: 'bash', run: { block: '|', lines: BASELINE_SCRIPT } },
  SETUP_NODE,
  PNPM_SETUP,
  INSTALL,
  { run: CHECK_RUN },
];
/** Text no meaningful line of the three workflows may hold, whatever key it sits under. */
const FORBIDDEN = [
  [/continue-on-error/, 'continue-on-error lets a failing step or job pass'],
  [
    /\bGITHUB_(?:ENV|PATH|OUTPUT)\b/,
    'a step could rewrite the environment, PATH or outputs that later steps trust',
  ],
  [/\bsecrets\b/, 'this job needs no secret, and a pull request must never reach one'],
  [
    /pull_request_target|workflow_run/,
    'these events run with write access on code the change controls',
  ],
  [/\|\|\s*(?:true|:)|\bset\s+\+e\b/, 'it would ignore a failing command'],
  [/self-hosted/, 'a self-hosted runner keeps state between runs'],
];
/** Names whose definitions are counted in each workflow, so no step or workflow-level env can replace one. */
const COUNTED = ['CI', 'EXPO_NO_TELEMETRY', 'FITLOG_CONTRACT_BASELINE', 'FITLOG_BASE_REF', 'env'];

const mobileBaseProblem = (value) =>
  `${MOBILE_WORKFLOW} sets FITLOG_CONTRACT_BASELINE to ${show(value)}, not the reviewed event base, so the two required checks could judge against different commits`;

function forbiddenProblems(path, lines) {
  const problems = [];
  lines.forEach((line, i) => {
    if (!meaningful(line)) return;
    for (const [pattern, reason] of FORBIDDEN) {
      if (pattern.test(line)) problems.push(`${path}:${i + 1} has ${show(line.trim())}: ${reason}`);
    }
  });
  return problems;
}

function definitionProblems({ path, job, env }, lines) {
  const problems = [];
  for (const key of COUNTED) {
    const expected =
      key === 'env' ? Math.min(Object.keys(env).length, 1) : Number(Object.hasOwn(env, key));
    const definition = new RegExp(`^\\s*(?:-\\s+)?['"]?${key}['"]?\\s*:`);
    const count = lines.filter((line) => meaningful(line) && definition.test(line)).length;
    if (count === expected) continue;
    problems.push(
      expected
        ? `${path} defines ${key} ${count} times; only jobs.${job}.env may, once, so no step or workflow-level env can replace it`
        : `${path} defines ${key} ${count} times, where the reviewed workflow defines it nowhere`,
    );
  }
  return problems;
}

function exactlyProblems(top, key, expected, message) {
  const found = get(top, key);
  if (found && found.parsed.value === '' && isDeepStrictEqual(bodyLines(found), expected)) {
    return [];
  }
  return [`${message} (found ${show(found ? bodyLines(found) : null)})`];
}

/** The keys, name, triggers and permissions all three workflows share. */
function sharedTopProblems(path, top) {
  const problems = keyProblems(`${path} top level`, top, TOP_KEYS);
  if (!get(top, 'name')?.parsed.value) problems.push(`${path} has no workflow name`);
  const on = get(top, 'on');
  const found = on ? [on.content, ...bodyLines(on)] : null;
  if (!isDeepStrictEqual(found, ON)) {
    problems.push(
      `${path} on: must be exactly ${show(ON)}: every required check runs on the same events and branches, with no path filter (found ${show(found)})`,
    );
  }
  problems.push(
    ...exactlyProblems(
      top,
      'permissions',
      PERMISSIONS,
      `${path} permissions must be only contents: read`,
    ),
  );
  if (get(top, 'jobs')?.parsed.value) problems.push(`${path} jobs must be a block mapping`);
  return problems;
}

/** The workflow's one job, by its required check name, and the problems with the jobs block around it. */
function namedJob({ path, job }, top) {
  const jobs = get(top, 'jobs');
  if (!jobs) return { problems: [], found: null };
  const named = block(jobs.body, 2);
  const problems = keyProblems(`${path} jobs`, named, [job]);
  const found = get(named, job) ?? null;
  if (found?.parsed.value) problems.push(`${path} jobs.${job} must be a block mapping`);
  return { problems, found };
}

function envProblems({ path, job, env }, keys) {
  const where = `${path} jobs.${job}`;
  const found = get(keys, 'env');
  if (!found) return [];
  const vars = block(found.body, 6);
  const problems = keyProblems(`${where}.env`, vars, Object.keys(env));
  for (const [key, expected] of Object.entries(env)) {
    const actual = get(vars, key)?.parsed.value;
    if (actual === undefined || actual === expected) continue;
    problems.push(
      path === MOBILE_WORKFLOW && key === 'FITLOG_CONTRACT_BASELINE'
        ? mobileBaseProblem(actual)
        : `${where}.env.${key} is ${show(actual)}, not the reviewed ${show(expected)}`,
    );
  }
  return problems;
}

function strictStepProblems(spec, lines) {
  const where = `${spec.path} jobs.${spec.job}`;
  const { steps, problems } = stepItems(lines, `${where}.steps`);
  if (steps.length !== spec.steps.length) {
    problems.push(`${where} has ${steps.length} steps, not the ${spec.steps.length} reviewed`);
  }
  steps.forEach((fields, i) => {
    const at = `${where} step ${i + 1}`;
    const { step, problems: found } = readStep(fields, at);
    problems.push(...found);
    for (const key of Object.keys(step).filter((key) => !STEP_KEYS.includes(key))) {
      problems.push(`${at} sets ${key}; only ${STEP_KEYS.join(', ')} are allowed`);
    }
    const { name, ...rest } = step;
    if (name === '') problems.push(`${at} has an empty name`);
    if (typeof rest.run === 'string' && rest.run.includes('${{')) {
      problems.push(
        `${at} puts an expression in run, where GitHub would paste it into the script before it runs`,
      );
    }
    if (typeof rest.uses === 'string' && !PINNED.test(rest.uses)) {
      problems.push(`${at} uses ${show(rest.uses)}, which is not pinned to a full commit SHA`);
    }
    if (!isDeepStrictEqual(rest, spec.steps[i])) {
      problems.push(`${at} is ${show(rest)}, not the reviewed ${show(spec.steps[i] ?? null)}`);
    }
  });
  return problems;
}

/**
 * A required job runs on a fresh GitHub-hosted ubuntu-latest runner, never a costlier or custom one, and stops
 * within its reviewed cap (for mobile-ci.yml's check job, review 0905 L1).
 */
function runnerProblems(where, keys, maxMinutes) {
  const problems = [];
  const value = (key) => get(keys, key)?.parsed.value;
  if (value('runs-on') !== 'ubuntu-latest') {
    problems.push(
      `${where}.runs-on is ${show(value('runs-on'))}, not ubuntu-latest, a fresh GitHub-hosted runner`,
    );
  }
  const minutes = value('timeout-minutes');
  if (!/^\d+$/.test(minutes ?? '') || Number(minutes) < 1 || Number(minutes) > maxMinutes) {
    problems.push(
      `${where}.timeout-minutes is ${show(minutes)}; it must be a whole number from 1 to ${maxMinutes}`,
    );
  }
  return problems;
}

function strictJobProblems(spec, found) {
  const where = `${spec.path} jobs.${spec.job}`;
  const keys = block(found.body, 4);
  const allowed = ['runs-on', 'timeout-minutes', ...(Object.keys(spec.env).length ? ['env'] : [])];
  const problems = [
    ...keyProblems(where, keys, [...allowed, 'steps']),
    ...envProblems(spec, keys),
    ...runnerProblems(where, keys, spec.maxMinutes),
  ];
  const steps = get(keys, 'steps');
  if (steps) problems.push(...strictStepProblems(spec, steps.body));
  return problems;
}

/** Every way a workflow pinned step by step (backend-ci.yml, ci-guard.yml) differs from what was reviewed. */
function strictProblems(spec, text) {
  if (text === null) return [spec.missing];
  const lines = linesOf(text);
  const top = block(lines, 0);
  const job = namedJob(spec, top);
  return [
    ...characterProblems(spec.path, text),
    ...forbiddenProblems(spec.path, lines),
    ...definitionProblems(spec, lines),
    ...sharedTopProblems(spec.path, top),
    ...exactlyProblems(
      top,
      'concurrency',
      spec.concurrency,
      `${spec.path} concurrency must be exactly ${show(spec.concurrency)}`,
    ),
    ...job.problems,
    ...(job.found ? strictJobProblems(spec, job.found) : []),
  ];
}

/**
 * Every way backend-ci.yml differs from what was reviewed, and whether mobile-ci.yml's contract base is the
 * same reviewed expression (`mobileText` null if missing).
 */
export function backendWorkflowProblems(text, mobileText) {
  if (text === null) return [BACKEND.missing];
  const mobileBase =
    mobileText === null
      ? undefined
      : /^\s+FITLOG_CONTRACT_BASELINE:[ \t]*(.*?)\s*$/m.exec(mobileText)?.[1];
  return [
    ...strictProblems(BACKEND, text),
    ...(mobileBase === EVENT_BASE ? [] : [mobileBaseProblem(mobileBase)]),
  ];
}

/** Every way ci-guard.yml differs from what was reviewed (null if missing). */
export function guardWorkflowProblems(text) {
  return strictProblems(GUARD, text);
}

/** What no step of the check job may do, before or after `pnpm check`. */
function mobileRuleProblems(at, step) {
  const problems = [];
  for (const key of Object.keys(step)) {
    if (key === 'if') {
      problems.push(
        `${at} sets if; no step there may be conditional, since a skipped step leaves the job passing`,
      );
    } else if (!MOBILE_STEP_KEYS.includes(key)) {
      problems.push(`${at} sets ${key}; only ${MOBILE_STEP_KEYS.join(', ')} are allowed`);
    }
  }
  if (step.shell !== undefined && step.shell !== 'bash') {
    problems.push(
      `${at} sets shell to ${show(step.shell)}; only bash is allowed, since the shell decides what run does and whether a failure stops it`,
    );
  }
  if (step.uses !== undefined && !PINNED.test(step.uses)) {
    problems.push(`${at} uses ${show(step.uses)}, which is not pinned to a full commit SHA`);
  }
  const script = typeof step.run === 'string' ? [step.run] : (step.run?.lines ?? []);
  if (script.some((line) => line.includes('${{'))) {
    problems.push(
      `${at} puts an expression in run, where GitHub would paste it into the script before it runs`,
    );
  }
  return problems;
}

/** A step up to and including `pnpm check`, against the reviewed one: without its name, its action whole. */
function mobilePrefixProblems(at, step, expected) {
  const rest = Object.fromEntries(Object.entries(step).filter(([key]) => key !== 'name'));
  return isDeepStrictEqual(rest, expected)
    ? []
    : [`${at} is ${show(rest)}, not the reviewed ${show(expected)}`];
}

function mobileStepProblems(lines) {
  const where = `${MOBILE_WORKFLOW} jobs.check`;
  const { steps, problems } = stepItems(lines, `${where}.steps`);
  if (steps.length < MOBILE_STEPS.length) {
    problems.push(
      `${where} has ${steps.length} steps; its first ${MOBILE_STEPS.length}, up to and including "${CHECK_RUN}", must be exactly as reviewed`,
    );
  }
  let plainChecks = 0;
  steps.forEach((fields, i) => {
    const at = `${where} step ${i + 1}`;
    const { step, problems: found } = readStep(fields, at, { blockRun: true });
    problems.push(...found, ...mobileRuleProblems(at, step));
    if (i < MOBILE_STEPS.length) problems.push(...mobilePrefixProblems(at, step, MOBILE_STEPS[i]));
    if (isDeepStrictEqual(step, { run: CHECK_RUN })) plainChecks += 1;
  });
  if (plainChecks !== 1) {
    problems.push(
      `${where} must run "${CHECK_RUN}" in exactly one plain step with no other key (found ${plainChecks})`,
    );
  }
  return problems;
}

/**
 * What a single edit to mobile-ci.yml could use to skip, empty or redirect the check job while it still passes:
 * job and workflow keys (if, needs, continue-on-error, defaults, strategy, name), an env override, triggers,
 * permissions, the runner and timeout (review 0905 L1), any step's if or shell, unpinned actions, and every
 * step up to and including `pnpm check`, held exactly with each action at its reviewed commit (MOBILE_STEPS).
 * QA-9's gate-wiring.mjs pins the check job further, from inside `pnpm check`; this holds the part that must
 * also be judged from outside the job. It judges this file only, not what `pnpm check` runs.
 */
export function mobileWorkflowProblems(text) {
  if (text === null) return [`${MOBILE_WORKFLOW} is missing, so no job runs pnpm check`];
  const lines = linesOf(text);
  const top = block(lines, 0);
  const job = namedJob(MOBILE, top);
  const problems = [
    ...characterProblems(MOBILE_WORKFLOW, text),
    ...forbiddenProblems(MOBILE_WORKFLOW, lines),
    ...definitionProblems(MOBILE, lines),
    ...sharedTopProblems(MOBILE_WORKFLOW, top),
    ...job.problems,
  ];
  if (!job.found) return problems;
  const keys = block(job.found.body, 4);
  const where = `${MOBILE_WORKFLOW} jobs.${MOBILE.job}`;
  problems.push(
    ...keyProblems(where, keys, MOBILE_JOB_KEYS),
    ...envProblems(MOBILE, keys),
    ...runnerProblems(where, keys, MOBILE.maxMinutes),
  );
  const steps = get(keys, 'steps');
  if (steps) problems.push(...mobileStepProblems(steps.body));
  return problems;
}

const kindOf = (type) => (type === 'other' ? 'neither a file, a folder nor a link' : `a ${type}`);
const label = (path) => (/^[\x21-\x7e]+$/.test(path) ? path : show(path));

/**
 * The workflow folder holds the three reviewed workflows as regular files, and no other workflow: GitHub
 * matches a required check by name, so another workflow could report a job under one of the three names.
 * GitHub loads only the .yml and .yaml files directly in the folder, so other regular files are ignored.
 * `listing` is [{ name, type }] with type file, directory, symbolic link or other; null if unreadable.
 */
export function inventoryProblems(listing) {
  if (listing === null) {
    return [`${WORKFLOW_DIR} is missing or unreadable, so no workflow can be checked`];
  }
  const reviewed = Object.values(REQUIRED_CHECKS).map((path) =>
    path.slice(WORKFLOW_DIR.length + 1),
  );
  const problems = [];
  for (const { name, type } of listing) {
    const path = label(`${WORKFLOW_DIR}/${name}`);
    if (reviewed.includes(name)) {
      if (type !== 'file') problems.push(`${path} is ${kindOf(type)}, not a regular file`);
    } else if (type !== 'file') {
      problems.push(
        `${path} is ${kindOf(type)}, not one of the three reviewed workflows; another workflow could report a required check name`,
      );
    } else if (/\.ya?ml$/i.test(name)) {
      problems.push(
        `${path} is not one of the three reviewed workflows; another workflow could report a required check name, so a new one needs a reviewed change to this guard`,
      );
    }
  }
  for (const name of reviewed.filter((name) => !listing.some((item) => item.name === name))) {
    problems.push(`${WORKFLOW_DIR} has no ${name}`);
  }
  return problems;
}

/** Everything this guard refuses, from `read(path)` (text, or null when missing) and the folder's listing. */
export function ciWorkflowProblems(read, listing) {
  const mobile = read(MOBILE_WORKFLOW);
  return [
    ...new Set([
      ...inventoryProblems(listing),
      ...backendWorkflowProblems(read(WORKFLOW), mobile),
      ...guardWorkflowProblems(read(GUARD_WORKFLOW)),
      ...mobileWorkflowProblems(mobile),
    ]),
  ];
}

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const typeOf = (entry) =>
  entry.isSymbolicLink()
    ? 'symbolic link'
    : entry.isFile()
      ? 'file'
      : entry.isDirectory()
        ? 'directory'
        : 'other';

/** The folder's entries, without following links; null when it cannot be read, which the guard refuses. */
export function listWorkflows(root = REPO_ROOT) {
  try {
    return readdirSync(join(root, WORKFLOW_DIR), { withFileTypes: true })
      .map((entry) => ({ name: entry.name, type: typeOf(entry) }))
      .sort(byName);
  } catch {
    return null;
  }
}

function readText(root, path) {
  try {
    return readFileSync(join(root, path), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

const DONE =
  'CI workflows as reviewed: backend-ci.yml (job backend), ci-guard.yml (job ci-guard) and mobile-ci.yml (job check), each judged from both the backend and the ci-guard job; no other workflow file';
const USAGE = 'usage: node scripts/ci/workflow-guard.mjs';

/** Prints one line and exits 0, or names every problem and exits 1; any argument is a usage error (2). */
export function main(argv = process.argv.slice(2), { root = REPO_ROOT, io = process } = {}) {
  if (argv.length) {
    io.stderr.write(`${USAGE}\n`);
    return 2;
  }
  try {
    const problems = ciWorkflowProblems((path) => readText(root, path), listWorkflows(root));
    if (problems.length) {
      io.stderr.write(`workflow-guard failed:\n- ${problems.join('\n- ')}\n`);
      return 1;
    }
    io.stdout.write(`${DONE}\n`);
    return 0;
  } catch (error) {
    io.stderr.write(
      `workflow-guard failed: ${show(error instanceof Error ? error.message : String(error))}\n`,
    );
    return 1;
  }
}

function invokedDirectly() {
  try {
    return realpathSync(process.argv[1] ?? '') === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}
if (invokedDirectly()) process.exitCode = main();
