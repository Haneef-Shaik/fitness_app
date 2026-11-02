import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { COMMANDS } from './backend-ci.mjs';
import {
  backendWorkflowProblems,
  EVENT_BASE,
  MOBILE_WORKFLOW,
  STEPS,
  WORKFLOW,
} from './workflow-guard.mjs';

// Both workflows are read as text and checked in memory. Every mutant is an edited copy, never written anywhere.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const workflow = readFileSync(join(repoRoot, WORKFLOW), 'utf8');
const mobile = readFileSync(join(repoRoot, MOBILE_WORKFLOW), 'utf8');
const problems = (text, mobileText = mobile) =>
  backendWorkflowProblems(text, mobileText).join('\n');
/** Replaces one exact piece of the reviewed text; a mutant whose target vanished fails here, not silently. */
function mutate(text, from, to) {
  assert.ok(text.includes(from), `the mutant's target ${JSON.stringify(from)} is in the text`);
  return text.replace(from, to);
}
const TESTS = '      - run: pnpm backend:test\n';
const GUARD = '        run: node scripts/ci/workflow-guard.mjs\n';
const CHECKOUT = 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1';
const BASE_LINE = `      FITLOG_BASE_REF: ${EVENT_BASE}`;
const CONTRACT_LINE = `      FITLOG_CONTRACT_BASELINE: ${EVENT_BASE}`;
const START = 'run: pnpm exec supabase start > /dev/null';
const DIFF = 'run: node scripts/ci/backend-ci.mjs diff';
const PUSH_GROUP =
  "  group: backend-${{ github.event_name == 'pull_request' && github.ref || github.run_id }}\n";

test('the backend workflow is exactly as reviewed', () => {
  assert.deepEqual(backendWorkflowProblems(workflow, mobile), []);
});

test('the reviewed base is the event expression mobile-ci.yml already uses', () => {
  assert.equal(
    EVENT_BASE,
    "${{ github.event_name == 'pull_request' && github.event.pull_request.base.sha || github.event_name == 'push' && github.event.before || '' }}",
  );
  assert.ok(mobile.includes(`      FITLOG_CONTRACT_BASELINE: ${EVENT_BASE}\n`));
});

test('the steps run every backend-ci command once, and pnpm backend:test once, in a reasoned order', () => {
  const helper = STEPS.flatMap(
    ({ run }) => /^node scripts\/ci\/backend-ci\.mjs (\S+)$/.exec(run ?? '')?.slice(1) ?? [],
  );
  assert.deepEqual([...helper].sort(), Object.keys(COMMANDS).sort());
  assert.equal(new Set(helper).size, helper.length);
  assert.deepEqual(
    STEPS.filter(({ run }) => run === 'pnpm backend:test'),
    [{ run: 'pnpm backend:test' }],
  );
  const at = (run) => STEPS.findIndex((step) => step.run === run);
  const order = [
    'node scripts/ci/workflow-guard.mjs',
    'node scripts/ci/backend-ci.mjs base',
    'node --test scripts/ci/*.test.mjs',
    'node scripts/ci/backend-ci.mjs local-main',
    'pnpm install --frozen-lockfile --strict-peer-dependencies',
    'pnpm exec supabase start > /dev/null',
    'node scripts/ci/backend-ci.mjs replay',
    'node scripts/ci/backend-ci.mjs diff',
    'node scripts/ci/backend-ci.mjs lint',
    'pnpm backend:test',
  ].map(at);
  assert.ok(
    order.every((index) => index >= 0),
    'each ordered step is in STEPS',
  );
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
    'the workflows are judged first, and the base is checked before anything trusts it',
  );
  assert.ok(
    at('node scripts/ci/backend-ci.mjs vendored') <
      at('pnpm install --frozen-lockfile --strict-peer-dependencies'),
    'tracked paths are checked before the install runs any package code',
  );
  assert.equal(STEPS.at(-1).if, 'failure()', 'only the last, diagnostic step is conditional');
  assert.equal(STEPS.filter((step) => 'if' in step).length, 1);
});

test('each way to skip a step, ignore a failure, move the base or unpin an action is refused', () => {
  const swapped = mutate(mutate(workflow, START, '@@START@@'), DIFF, START).replace(
    '@@START@@',
    DIFF,
  );
  const cases = [
    [
      'continue-on-error on the tests',
      mutate(workflow, TESTS, `${TESTS}        continue-on-error: true\n`),
      /continue-on-error lets a failing step or job pass/,
    ],
    [
      'continue-on-error on the job',
      mutate(workflow, '  backend:\n', '  backend:\n    continue-on-error: true\n'),
      /jobs\.backend sets continue-on-error; only runs-on, timeout-minutes, env, steps are allowed/,
    ],
    [
      'a job-level if',
      mutate(workflow, '  backend:\n', '  backend:\n    if: false\n'),
      /jobs\.backend sets if; only runs-on, timeout-minutes, env, steps are allowed/,
    ],
    [
      'a job-level if that skips pull requests',
      mutate(workflow, '  backend:\n', "  backend:\n    if: github.event_name == 'push'\n"),
      /jobs\.backend sets if/,
    ],
    [
      'a job that waits on another',
      mutate(workflow, '  backend:\n', '  backend:\n    needs: [setup]\n'),
      /jobs\.backend sets needs/,
    ],
    [
      'a job display name that could report as another required check',
      mutate(workflow, '  backend:\n', '  backend:\n    name: check\n'),
      /jobs\.backend sets name/,
    ],
    [
      '|| true after the tests',
      mutate(workflow, TESTS, '      - run: pnpm backend:test || true\n'),
      /it would ignore a failing command/,
    ],
    [
      'set +e before the tests',
      mutate(workflow, TESTS, '      - run: set +e; pnpm backend:test\n'),
      /it would ignore a failing command/,
    ],
    [
      'an if on the tests',
      mutate(workflow, TESTS, `${TESTS}        if: false\n`),
      /step 14 is \{"run":"pnpm backend:test","if":"false"\}, not the reviewed \{"run":"pnpm backend:test"\}/,
    ],
    [
      'an if on the workflow guard step',
      mutate(workflow, GUARD, `${GUARD}        if: false\n`),
      /step 3 is \{"run":"node scripts\/ci\/workflow-guard\.mjs","if":"false"\}/,
    ],
    [
      'the workflow guard step removed',
      mutate(
        workflow,
        `      - name: The three required workflows are as reviewed (checked here and in the ci-guard job)\n${GUARD}`,
        '',
      ),
      /has 14 steps, not the 15 reviewed/,
    ],
    ['the tests removed', mutate(workflow, TESTS, ''), /has 14 steps, not the 15 reviewed/],
    [
      'the diff before the stack starts',
      swapped,
      /step 10 is \{"run":"node scripts\/ci\/backend-ci\.mjs diff"\}/,
    ],
    [
      'the base from the head commit',
      mutate(workflow, BASE_LINE, '      FITLOG_BASE_REF: ${{ github.sha }}'),
      /jobs\.backend\.env\.FITLOG_BASE_REF is "\$\{\{ github\.sha \}\}", not the reviewed/,
    ],
    [
      'the contract base from the pull request head',
      mutate(
        workflow,
        CONTRACT_LINE,
        '      FITLOG_CONTRACT_BASELINE: ${{ github.event.pull_request.head.sha }}',
      ),
      /jobs\.backend\.env\.FITLOG_CONTRACT_BASELINE is "\$\{\{ github\.event\.pull_request\.head\.sha \}\}"/,
    ],
    [
      'a step env replacing the base',
      mutate(
        workflow,
        '        run: node scripts/ci/backend-ci.mjs local-main\n',
        '        run: node scripts/ci/backend-ci.mjs local-main\n        env:\n          FITLOG_BASE_REF: ${{ github.sha }}\n',
      ),
      /defines FITLOG_BASE_REF 2 times; only jobs\.backend\.env may/,
    ],
    [
      'the base defined twice',
      mutate(workflow, BASE_LINE, `${BASE_LINE}\n${BASE_LINE}`),
      /jobs\.backend\.env must set FITLOG_BASE_REF exactly once \(it does 2 times\)/,
    ],
    [
      'a workflow-level env',
      mutate(workflow, 'permissions:\n', 'env:\n  NODE_OPTIONS: --require ./x.cjs\npermissions:\n'),
      /top level sets env; only name, on, permissions, concurrency, jobs are allowed/,
    ],
    [
      'a workflow-level default shell that exits 0',
      mutate(workflow, 'permissions:\n', 'defaults:\n  run:\n    shell: true {0}\npermissions:\n'),
      /top level sets defaults; only name, on, permissions, concurrency, jobs are allowed/,
    ],
    [
      'a job-level default shell that exits 0',
      mutate(
        workflow,
        '    timeout-minutes: 30\n',
        '    timeout-minutes: 30\n    defaults:\n      run:\n        shell: true {0}\n',
      ),
      /jobs\.backend sets defaults; only runs-on, timeout-minutes, env, steps are allowed/,
    ],
    [
      'a step shell that exits 0',
      mutate(workflow, TESTS, `${TESTS}        shell: true {0}\n`),
      /step 14 sets shell; only name, uses, with, run, if are allowed/,
    ],
    [
      'GITHUB_ENV',
      mutate(workflow, TESTS, `      - run: echo "CI=0" >> "$GITHUB_ENV"\n${TESTS}`),
      /could rewrite the environment, PATH or outputs/,
    ],
    [
      'an unpinned action',
      mutate(workflow, CHECKOUT, 'actions/checkout@v4'),
      /uses "actions\/checkout@v4", which is not pinned to a full commit SHA/,
    ],
    [
      'another commit of a pinned action (review 0905 M1)',
      mutate(workflow, CHECKOUT, `actions/checkout@${'1'.repeat(40)}`),
      /jobs\.backend step 1 is \{"uses":"actions\/checkout@1{40}".*, not the reviewed \{"uses":"actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1"/,
    ],
    ['a shallow checkout', mutate(workflow, '          fetch-depth: 0\n', ''), /step 1 is /],
    [
      'persisted credentials',
      mutate(workflow, 'persist-credentials: false', 'persist-credentials: true'),
      /step 1 is .*"persist-credentials":"true"/,
    ],
    [
      'pull_request_target',
      mutate(workflow, '  pull_request:\n', '  pull_request_target:\n'),
      /these events run with write access on code the change controls/,
    ],
    [
      'a path filter on pull requests',
      mutate(workflow, '  pull_request:\n', '  pull_request:\n    paths: [supabase/**]\n'),
      /on: must be exactly/,
    ],
    [
      'pushes filtered by branches-ignore',
      mutate(workflow, '    branches: [main, v2/develop]', '    branches-ignore: [wip/**]'),
      /on: must be exactly/,
    ],
    [
      'a manual-only trigger',
      mutate(
        workflow,
        'on:\n  pull_request:\n  push:\n    branches: [main, v2/develop]\n',
        'on:\n  workflow_dispatch:\n',
      ),
      /on: must be exactly/,
    ],
    [
      'write permissions',
      mutate(workflow, '  contents: read\n', '  contents: write\n'),
      /permissions must be only contents: read/,
    ],
    [
      'a secret',
      mutate(workflow, "      CI: '1'\n", "      CI: '1'\n      TOKEN: ${{ secrets.TOKEN }}\n"),
      /this job needs no secret/,
    ],
    [
      'an expression in run',
      mutate(
        workflow,
        'run: node scripts/ci/backend-ci.mjs base\n',
        'run: node scripts/ci/backend-ci.mjs base ${{ github.head_ref }}\n',
      ),
      /puts an expression in run/,
    ],
    ['a tab', mutate(workflow, '    runs-on:', '\truns-on:'), /indents with a tab/],
    [
      'a block scalar',
      mutate(workflow, TESTS, '      - run: |\n          pnpm backend:test\n'),
      /step 14 is \{"run":"\|"\}/,
    ],
    [
      'a second job',
      `${workflow}  other:\n    runs-on: ubuntu-latest\n`,
      /jobs sets other; only backend are allowed/,
    ],
    [
      'no timeout',
      mutate(workflow, '    timeout-minutes: 30\n', ''),
      /jobs\.backend\.timeout-minutes is unset; it must be a whole number from 1 to 60/,
    ],
    [
      'a timeout above the cap',
      mutate(workflow, 'timeout-minutes: 30', 'timeout-minutes: 600'),
      /timeout-minutes is "600"/,
    ],
    [
      'a self-hosted runner',
      mutate(workflow, 'runs-on: ubuntu-latest', 'runs-on: self-hosted'),
      /a self-hosted runner keeps state between runs/,
    ],
    [
      'concurrency that cancels main',
      mutate(
        workflow,
        "cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
        'cancel-in-progress: true',
      ),
      /concurrency must be exactly/,
    ],
    [
      'one concurrency group that queued pushes share (L1)',
      mutate(workflow, PUSH_GROUP, '  group: backend-${{ github.ref }}\n'),
      /concurrency must be exactly/,
    ],
  ];
  for (const [label, text, expected] of cases) {
    const found = problems(text);
    assert.match(found, expected, `${label}:\n${found}`);
  }
});

test("the backend base agrees with mobile-ci.yml's, and its triggers are the one reviewed set", () => {
  const mobileLine = /^ +FITLOG_CONTRACT_BASELINE:.*$/m.exec(mobile)[0];
  assert.match(
    problems(
      workflow,
      mutate(mobile, mobileLine, '      FITLOG_CONTRACT_BASELINE: ${{ github.sha }}'),
    ),
    /mobile-ci\.yml sets FITLOG_CONTRACT_BASELINE to "\$\{\{ github\.sha \}\}", not the reviewed event base/,
  );
  assert.match(
    problems(mutate(workflow, '    branches: [main, v2/develop]', '    branches: ["**"]')),
    /backend-ci\.yml on: must be exactly \["on:","  pull_request:","  push:","    branches: \[main, v2\/develop\]"\]/,
  );
  assert.match(problems(workflow, null), /mobile-ci\.yml sets FITLOG_CONTRACT_BASELINE to unset/);
  assert.deepEqual(backendWorkflowProblems(null, mobile), [
    '.github/workflows/backend-ci.yml is missing, so no hosted job replays the migrations or runs pnpm backend:test',
  ]);
});

test('every push runs in its own concurrency group, so a queued push is never cancelled (L1)', () => {
  assert.ok(workflow.includes(PUSH_GROUP), 'the reviewed group is the one the workflow sets');
  assert.ok(
    workflow.includes("  cancel-in-progress: ${{ github.event_name == 'pull_request' }}\n"),
    'only superseded pull request runs are cancelled',
  );
});

test('the guard reads lines as YAML does: a bare CR, a character outside printable ASCII or a line nested under a value is refused (L2)', () => {
  const NAME = 'name: Backend replay\n';
  const cases = [
    [
      'a bare CR that YAML reads as a line break',
      mutate(workflow, NAME, `${NAME}  x\rdefaults:\n  run:\n    shell: true {0}\n`),
      [
        /backend-ci\.yml:2 has a carriage return that does not end the line/,
        /backend-ci\.yml top level has 3 lines nested under name: "Backend replay"/,
      ],
    ],
    [
      'NEL, a line break to YAML 1.1 parsers',
      mutate(workflow, NAME, 'name: Backend replay\u0085defaults:\n'),
      [/backend-ci\.yml:1 has U\+0085 at column 21, outside printable ASCII/],
    ],
    [
      'a line separator',
      mutate(workflow, NAME, 'name: Backend replay defaults:\n'),
      [/backend-ci\.yml:1 has U\+2028 at column 21/],
    ],
    [
      'an escape character',
      mutate(workflow, TESTS, '      - run: pnpm backend:test\u001b[8m\n'),
      [/has U\+001B at column 31/],
    ],
    ['a NUL', mutate(workflow, NAME, 'name: Backend\u0000 replay\n'), [/has U\+0000 at column 14/]],
    [
      'a non-ASCII character in a comment',
      mutate(workflow, '# PL-1. The required', '# PL-1 — The required'),
      [/has U\+2014 at column 8, outside printable ASCII/],
    ],
    [
      'a tab inside a value',
      mutate(workflow, "CI: '1'", "CI:\t'1'"),
      [/has U\+0009 at column 10/],
    ],
    [
      'a non-ASCII character in a value a message quotes',
      mutate(workflow, 'runs-on: ubuntu-latest', 'runs-on: ubuntu-latest—x'),
      [/jobs\.backend\.runs-on is "ubuntu-latest\\u2014x", not ubuntu-latest/],
    ],
    [
      'a line nested under the workflow name',
      mutate(workflow, NAME, `${NAME}  continued\n`),
      [/top level has 1 line nested under name: "Backend replay"/],
    ],
    [
      'a line nested under runs-on',
      mutate(workflow, '    runs-on: ubuntu-latest\n', '    runs-on: ubuntu-latest\n      x: y\n'),
      [/jobs\.backend has 1 line nested under runs-on: "ubuntu-latest"/],
    ],
    [
      'a line nested under timeout-minutes',
      mutate(workflow, '    timeout-minutes: 30\n', '    timeout-minutes: 30\n      0\n'),
      [/jobs\.backend has 1 line nested under timeout-minutes: "30"/],
    ],
    [
      'a line nested under an env value',
      mutate(workflow, "      CI: '1'\n", "      CI: '1'\n        more\n"),
      [/jobs\.backend\.env has 1 line nested under CI: "'1'"/],
    ],
  ];
  for (const [label, text, expected] of cases) {
    const found = problems(text);
    for (const pattern of expected) assert.match(found, pattern, `${label}:\n${found}`);
    assert.doesNotMatch(found, /[^\n\x20-\x7e]/, `${label}: every message is printable ASCII`);
  }
  assert.deepEqual(
    backendWorkflowProblems(workflow.replaceAll('\n', '\r\n'), mobile),
    [],
    'a CR that ends a line (CRLF) is not bare',
  );
});
