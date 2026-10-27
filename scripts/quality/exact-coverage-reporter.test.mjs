import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { thresholdsFrom, verdict } from './exact-coverage-reporter.mjs';

// The spawned runs use a small scratch package under the OS temporary directory; nothing here writes to this repository.
const reporter = fileURLToPath(new URL('./exact-coverage-reporter.mjs', import.meta.url));
const env = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) => !['NODE_TEST_CONTEXT', 'NODE_V8_COVERAGE', 'NODE_OPTIONS'].includes(key),
  ),
);
const NODE_MESSAGE = /coverage does not meet threshold of/;
/**
 * The Node release on which mutation M4 saw the threshold flags truncated to whole numbers (ratchet-enforcement.md). It is a
 * fixed release, so the assertion tied to it cannot change. Another release may check the decimals itself; there the test
 * asks only that the reporter catches the miss too.
 */
const TRUNCATING_NODE = '22.23.1';
const ONLY_LIB = ['--test-coverage-include=lib.mjs'];

/** A package where one of two exported functions is called. extra.mjs, when written, is imported only if extra is 'loaded'. */
function run(t, flags, { coverage = true, globs = ONLY_LIB, extra = null } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'fitlog-exact-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(
    join(dir, 'lib.mjs'),
    'export const used = () => 1;\nexport const unused = () => 2;\n',
  );
  if (extra) writeFileSync(join(dir, 'extra.mjs'), 'export const extra = () => 3;\n');
  const load = extra === 'loaded' ? "import './extra.mjs';\n" : '';
  writeFileSync(
    join(dir, 'lib.test.mjs'),
    `import { test } from 'node:test';\nimport { used } from './lib.mjs';\n${load}test('used', () => { if (used() !== 1) throw new Error('used() changed'); });\n`,
  );
  const args = [
    '--test',
    ...(coverage ? ['--experimental-test-coverage', ...globs] : []),
    ...flags,
    '--test-reporter=spec',
    '--test-reporter-destination=stdout',
    `--test-reporter=${reporter}`,
    '--test-reporter-destination=stdout',
    'lib.test.mjs',
  ];
  return spawnSync(process.execPath, args, { cwd: dir, env, encoding: 'utf8' });
}
/** The covered and total counts the reporter printed for one metric. */
const countsOf = (stdout, metric) => {
  const match = new RegExp(`${metric} coverage (\\d+)/(\\d+)`).exec(stdout);
  assert.ok(match, `no exact ${metric} line in:\n${stdout}`);
  return [Number(match[1]), Number(match[2])];
};
/** Hundredths of a percent as a flag value with exactly 2 decimals, built from integers. */
const asFlag = (hundredths) =>
  `${Math.floor(hundredths / 100)}.${String(hundredths % 100).padStart(2, '0')}`;

test('the threshold flags are read as written, and a flag that is not a number is kept as NaN', () => {
  assert.deepEqual(
    thresholdsFrom([
      '--import',
      'tsx',
      '--test-coverage-lines=91.42',
      '--test-coverage-branches=86.90',
      '--test-coverage-functions=90.59',
      '--test',
    ]),
    { lines: 91.42, branches: 86.9, functions: 90.59 },
  );
  assert.deepEqual(thresholdsFrom(['--test-coverage-include=src/**/*.ts']), {});
  assert.ok(Number.isNaN(thresholdsFrom(['--test-coverage-lines=']).lines));
  assert.ok(Number.isNaN(thresholdsFrom(['--test-coverage-lines=ninety']).lines));
});

test('the verdict compares unrounded: 106/117 meets 90.59 but not 90.60, and 272/313 meets 86.90 but not 86.91', () => {
  const totals = {
    coveredFunctionCount: 106,
    totalFunctionCount: 117,
    coveredBranchCount: 272,
    totalBranchCount: 313,
    coveredLineCount: 533,
    totalLineCount: 583,
  };
  assert.equal(verdict(totals, { functions: 90.59, branches: 86.9, lines: 91.42 }).failed, false);
  const tight = verdict(totals, { functions: 90.6, branches: 86.91, lines: 91.43 });
  assert.equal(tight.failed, true);
  assert.deepEqual(
    tight.lines.map((line) => line.startsWith('Error: exact')),
    [true, true, true],
  );
  assert.match(
    tight.lines[0],
    /^Error: exact functions coverage 106\/117 \(90\.5983%\) does not meet the threshold of 90\.6%$/,
  );
});

test('the comparison is exact in integers: 29/100 meets 29 although (29 / 100) × 100 is 28.999…, and 2 decimals is the limit', () => {
  assert.ok((29 / 100) * 100 < 29, 'the floating-point form this replaces falls short at 29/100');
  const at = (threshold, covered = 29) =>
    verdict({ coveredLineCount: covered, totalLineCount: 100 }, { lines: threshold });
  assert.equal(at(29).failed, false);
  assert.match(
    at(29).lines[0],
    /^Exact lines coverage 29\/100 \(29\.0000%\) meets the threshold of 29%$/,
  );
  assert.equal(at(29.01).failed, true);
  assert.equal(at(57, 57).failed, false, '(57 / 100) × 100 is 56.99999999999999 in floating point');
  assert.equal(
    verdict({ coveredLineCount: 0, totalLineCount: 0 }, { lines: 100 }).failed,
    false,
    'no lines at all counts as 100%',
  );
  const tooFine = at(28.999);
  assert.equal(tooFine.failed, true);
  assert.match(
    tooFine.lines[0],
    /^Error: lines coverage cannot be checked exactly \(threshold 28\.999, which must be a number from 0 to 100 with at most 2 decimals/,
  );
});

test('missing counts or a threshold that is not a number fail closed', () => {
  assert.equal(verdict(undefined, { lines: 50 }).failed, true);
  assert.equal(
    verdict({ coveredLineCount: 1, totalLineCount: 2 }, { lines: Number.NaN }).failed,
    true,
  );
  assert.equal(verdict({ coveredLineCount: 1, totalLineCount: 2 }, { functions: 10 }).failed, true);
  assert.equal(verdict({ coveredLineCount: 3, totalLineCount: 2 }, { lines: 10 }).failed, true);
  assert.equal(verdict({ coveredLineCount: 1, totalLineCount: 2 }, { lines: 101 }).failed, true);
});

test('a 2-decimal threshold that Node truncates still fails the run when it is not met, and passes at the exact boundary', (t) => {
  const [covered, total] = countsOf(run(t, ['--test-coverage-functions=0']).stdout, 'functions');
  const met = (covered * 10000 - ((covered * 10000) % total)) / total; // the highest threshold met, in hundredths
  const above = met + 1;
  assert.equal(
    Math.floor(above / 100),
    Math.floor(met / 100),
    'the probe must stay within one whole number, where truncation passes it',
  );
  const failing = run(t, [`--test-coverage-functions=${asFlag(above)}`]);
  assert.equal(failing.status, 1, failing.stdout + failing.stderr);
  assert.match(
    failing.stdout,
    /Error: exact functions coverage \d+\/\d+ \([\d.]+%\) does not meet the threshold of/,
  );
  const nodeEnforced = NODE_MESSAGE.test(failing.stdout + failing.stderr);
  t.diagnostic(
    `Node ${process.versions.node} ${nodeEnforced ? 'also enforced' : 'truncated'} --test-coverage-functions=${asFlag(above)} (${covered}/${total})`,
  );
  if (process.versions.node === TRUNCATING_NODE)
    assert.equal(
      nodeEnforced,
      false,
      `Node ${TRUNCATING_NODE} truncates the flag, so the reporter alone failed this run`,
    );
  const exact = run(t, [`--test-coverage-functions=${asFlag(met)}`]);
  assert.equal(exact.status, 0, exact.stdout + exact.stderr);
  assert.match(
    exact.stdout,
    /Exact functions coverage \d+\/\d+ \([\d.]+%\) meets the threshold of/,
  );
});

test('a file the include globs match but no test loads fails the run, because Node would leave its lines out', (t) => {
  const globs = ['--test-coverage-include=*.mjs', '--test-coverage-exclude=*.test.mjs'];
  const unloaded = run(t, ['--test-coverage-lines=0'], { globs, extra: 'unloaded' });
  assert.equal(unloaded.status, 1, unloaded.stdout + unloaded.stderr);
  assert.match(
    unloaded.stdout,
    /Error: extra\.mjs matches --test-coverage-include but no test loaded it, so its lines are not counted/,
  );
  const loaded = run(t, ['--test-coverage-lines=0'], { globs, extra: 'loaded' });
  assert.equal(loaded.status, 0, loaded.stdout + loaded.stderr);
  assert.match(loaded.stdout, /Coverage counts all 2 files that --test-coverage-include matches/);
});

test('include globs the reporter cannot read, or thresholds without include globs, fail closed', (t) => {
  const braces = run(t, ['--test-coverage-lines=0'], {
    globs: ['--test-coverage-include={lib,extra}.mjs'],
  });
  assert.equal(braces.status, 1, braces.stdout + braces.stderr);
  assert.match(
    braces.stdout,
    /Error: the files coverage should count cannot be listed \(the coverage glob "\{lib,extra\}\.mjs" uses syntax this reporter does not read/,
  );
  const none = run(t, ['--test-coverage-lines=0'], { globs: [] });
  assert.equal(none.status, 1, none.stdout + none.stderr);
  assert.match(
    none.stdout,
    /Error: coverage thresholds are set without --test-coverage-include, so files no test loads cannot be found/,
  );
});

test('thresholds without a coverage run fail instead of passing silently', (t) => {
  const result = run(t, ['--test-coverage-lines=50'], { coverage: false });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /no coverage report arrived to check them exactly/);
});
