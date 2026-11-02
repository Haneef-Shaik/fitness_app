import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { LOCAL_API_URL } from '../backend/local-stack.mjs';
import { CONTENT_ROOT, loadCatalogue } from './catalogue.mjs';
import { PROBE_ID, SYNTHETIC_MEMBER, checkScripts, main, verifySeed } from './verify-seed.mjs';

// No test here reaches Docker, Supabase or a database: every command goes through an injected runner, the same
// pattern as scripts/backend/verify-fixtures.test.mjs. The real database run is the serialized phase's job.
const KEY = 'sb_secret_fixture-must-never-print';
const catalogue = loadCatalogue();
const scripts = checkScripts(catalogue);
const NOTICE = `CT-1 seed check: ${scripts.rows.length} catalogue rows present once after two runs; the second run changed nothing; 20 pre-existing exercise rows and the member tables unchanged; 3 starter templates accepted by the programme contract`;
const results = {
  twice: () => ({ status: 0, stdout: '', stderr: `psql:<stdin>:200: NOTICE:  ${NOTICE}\n` }),
  conflict: () => ({ status: 3, stdout: '', stderr: `psql:<stdin>:40: ERROR:  CT-1 seed: catalogue key ${PROBE_ID} version 1 is held by a member-owned row\n` }),
  crossVersion: () => ({ status: 3, stdout: '', stderr: `psql:<stdin>:40: ERROR:  CT-1 seed: catalogue key ${PROBE_ID} version 2 is held by a member-owned row\n` }),
  drift: () => ({ status: 3, stdout: '', stderr: `psql:<stdin>:80: ERROR:  CT-1 seed: catalogue row ${PROBE_ID} version 1 differs from this seed; publish a new version instead of editing it\n` }),
};
const kindOf = (input) => (input.includes('ct1_after_first') ? 'twice' : input.includes('Claimed later catalogue version') ? 'crossVersion' : input.includes('Claimed catalogue key') ? 'conflict' : input.includes('Changed by the CT-1 seed check') ? 'drift' : 'unknown');
const scratch = (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'fitlog-ct1-seed-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const project = (t) => {
  const dir = scratch(t);
  mkdirSync(join(dir, 'supabase'));
  writeFileSync(join(dir, 'supabase/config.toml'), 'project_id = "fitlog_fixture"\n');
  return dir;
};
function stack({ API_URL = LOCAL_API_URL, override = {} } = {}) {
  const calls = [];
  const run = (command, args, options = {}) => {
    calls.push({ command, args, options });
    if (command === 'pnpm') return { status: 0, stdout: JSON.stringify({ API_URL, SECRET_KEY: KEY }), stderr: '' };
    if (command === 'docker') {
      const kind = kindOf(options.input);
      return (override[kind] ?? results[kind] ?? (() => assert.fail(`unexpected psql input ${kind}`)))();
    }
    return assert.fail(`unexpected command ${command}`);
  };
  return { run, calls };
}
const io = () => {
  const out = []; const err = [];
  return { out, err, io: { stdout: { write: (text) => out.push(text) }, stderr: { write: (text) => err.push(text) } } };
};
const count = (text, needle) => text.split(needle).length - 1;

test('four runs, each one transaction that ends in rollback, sent on stdin through psql without a shell', (t) => {
  const { run, calls } = stack();
  const result = verifySeed({ projectDir: project(t), run });
  assert.deepEqual(result.problems, []);
  const docker = calls.filter(({ command }) => command === 'docker');
  assert.deepEqual(docker.map(({ options }) => kindOf(options.input)), ['twice', 'conflict', 'crossVersion', 'drift']);
  for (const { args, options } of docker) {
    assert.deepEqual(args, ['exec', '-i', 'supabase_db_fitlog_fixture', 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1', '-q', '-f', '-']);
    assert.ok(options.input.startsWith('\\set ON_ERROR_STOP on\nbegin;\n'));
    assert.ok(options.input.endsWith('\nrollback;\n'));
    assert.doesNotMatch(options.input, /^\s*(?:commit|end)\s*;/im, 'no statement keeps the transaction');
    assert.ok(!('shell' in options));
  }
});

test('the twice run seeds twice between the snapshot, the first-run capture and the assertions', () => {
  const { twice, conflict, drift } = scripts;
  const at = (needle) => { const index = twice.indexOf(needle); assert.ok(index >= 0, needle); return index; };
  assert.equal(count(twice, 'do $ct1_seed$'), 2);
  const firstSeed = at('do $ct1_seed$');
  const secondSeed = twice.indexOf('do $ct1_seed$', firstSeed + 1);
  assert.ok(at("set_config('ct1.seed_ids'") < at('create temporary table ct1_exercises_before'));
  assert.ok(at('create temporary table ct1_exercises_before') < firstSeed);
  assert.ok(firstSeed < at('create temporary table ct1_after_first') && at('create temporary table ct1_after_first') < secondSeed);
  assert.ok(secondSeed < at('do $check$'));
  assert.equal(count(conflict, 'do $ct1_seed$'), 1);
  assert.ok(conflict.indexOf('Claimed catalogue key') < conflict.indexOf('do $ct1_seed$'), 'the member row is planted before the seed runs');
  assert.equal(count(drift, 'do $ct1_seed$'), 2);
  const driftAt = drift.indexOf('Changed by the CT-1 seed check');
  assert.ok(drift.indexOf('do $ct1_seed$') < driftAt && driftAt < drift.lastIndexOf('do $ct1_seed$'));
});

test('the cross-version run plants the member row at version 2 while the seed carries the probe at version 1 (review M1)', () => {
  const { conflict, crossVersion } = scripts;
  const sameVersionPlant = `values ('${PROBE_ID}', 1, '${SYNTHETIC_MEMBER}', 'Claimed catalogue key'`;
  const otherVersionPlant = `values ('${PROBE_ID}', 2, '${SYNTHETIC_MEMBER}', 'Claimed later catalogue version'`;
  assert.ok(conflict.includes(sameVersionPlant) && !conflict.includes(otherVersionPlant), 'the existing conflict run is still the same-version case');
  assert.ok(crossVersion.includes(otherVersionPlant) && !crossVersion.includes(sameVersionPlant), 'the new run plants only version 2');
  assert.equal(count(crossVersion, `values ('${PROBE_ID}', `), 1, 'one planted member row, no member row at version 1');
  assert.equal(count(crossVersion, 'do $ct1_seed$'), 1);
  assert.ok(crossVersion.includes(`"id":"${PROBE_ID}","version":1,`), 'the seed payload carries the probe at version 1');
  assert.ok(!crossVersion.includes(`"id":"${PROBE_ID}","version":2,`), 'the seed never carries the probe at version 2');
  const setupAt = crossVersion.indexOf('ct1-seed-check@example.invalid');
  const plantAt = crossVersion.indexOf(otherVersionPlant);
  assert.ok(setupAt >= 0 && setupAt < plantAt && plantAt < crossVersion.indexOf('do $ct1_seed$'), 'the synthetic member exists before its row is planted, and the row before the seed runs');
});

test('the probe key is outside the catalogue and the synthetic member matches the setup SQL', () => {
  assert.ok(!scripts.rows.some((row) => row.id === PROBE_ID));
  const setup = readFileSync(new URL('./sql/seed-check-setup.sql', import.meta.url), 'utf8');
  assert.ok(setup.includes(SYNTHETIC_MEMBER));
  assert.match(setup, /@example\.invalid/, 'synthetic address on a reserved domain');
  assert.ok(scripts.conflict.includes(`'${SYNTHETIC_MEMBER}', 'Claimed catalogue key'`));
  assert.ok(scripts.crossVersion.includes(`'${SYNTHETIC_MEMBER}', 'Claimed later catalogue version'`));
});

test('the result line carries the notice and the target', (t) => {
  const result = verifySeed({ projectDir: project(t), run: stack().run });
  assert.equal(result.line, `CT-1 seed check passed: ${NOTICE}; a member-owned catalogue key stopped the seed; a member-owned row on another version of a catalogue id stopped the seed; a drifted catalogue row stopped the seed [supabase_db_fitlog_fixture at ${LOCAL_API_URL}]`);
});

test('a seed that does not stop on a member-owned key, a member-owned other version or drift fails the check', (t) => {
  const passes = () => ({ status: 0, stdout: '', stderr: '' });
  const conflict = verifySeed({ projectDir: project(t), run: stack({ override: { conflict: passes } }).run });
  assert.deepEqual(conflict.problems, ['the seed did not stop when a member-owned row held a catalogue key']);
  const crossVersion = verifySeed({ projectDir: project(t), run: stack({ override: { crossVersion: passes } }).run });
  assert.deepEqual(crossVersion.problems, ['the seed did not stop when a member-owned row held another version of a catalogue id'], 'a seed that checks only (id, version) fails here');
  const drift = verifySeed({ projectDir: project(t), run: stack({ override: { drift: passes } }).run });
  assert.deepEqual(drift.problems, ['the seed did not stop when an existing catalogue row differed from it']);
});

test('the cross-version run accepts only the member-owned error for exactly the probe id at version 2', (t) => {
  const error = (text) => () => ({ status: 3, stdout: '', stderr: `psql:<stdin>:40: ERROR:  ${text}\n` });
  const otherKey = 'c7100000-0000-4000-8000-0000000000b1';
  for (const [label, stderr] of [
    ['the probe at the seed version', error(`CT-1 seed: catalogue key ${PROBE_ID} version 1 is held by a member-owned row`)],
    ['another key at version 2', error(`CT-1 seed: catalogue key ${otherKey} version 2 is held by a member-owned row`)],
    ['the probe at version 20', error(`CT-1 seed: catalogue key ${PROBE_ID} version 20 is held by a member-owned row`)],
    ['the drift error', error(`CT-1 seed: catalogue row ${PROBE_ID} version 1 differs from this seed; publish a new version instead of editing it`)],
  ]) {
    const result = verifySeed({ projectDir: project(t), run: stack({ override: { crossVersion: stderr } }).run });
    assert.equal(result.problems.length, 1, label);
    assert.match(result.problems[0], /^the member-owned other-version run failed for another reason: psql exited 3: /, label);
  }
});

test('a run that fails for another reason is not mistaken for the guard', (t) => {
  const other = () => ({ status: 3, stdout: '', stderr: 'psql:<stdin>:5: ERROR:  null value in column "aud" violates not-null constraint\n' });
  const result = verifySeed({ projectDir: project(t), run: stack({ override: { conflict: other, crossVersion: other, drift: other } }).run });
  assert.equal(result.problems.length, 3);
  assert.match(result.problems[0], /^the member-owned key run failed for another reason: psql exited 3: /);
  assert.match(result.problems[1], /^the member-owned other-version run failed for another reason: psql exited 3: /);
  assert.match(result.problems[2], /^the drift run failed for another reason: psql exited 3: /);
});

test('the twice check failing, or exiting 0 without its notice, fails', (t) => {
  const failing = verifySeed({ projectDir: project(t), run: stack({ override: { twice: () => ({ status: 3, stdout: '', stderr: 'ERROR:  CT-1 seed check failed: the second run changed or removed 1 catalogue rows\n' }) } }).run });
  assert.equal(failing.problems.length, 1);
  assert.match(failing.problems[0], /^the seed-twice check failed: psql exited 3: ERROR:  CT-1 seed check failed/);
  const silent = verifySeed({ projectDir: project(t), run: stack({ override: { twice: () => ({ status: 0, stdout: '', stderr: '' }) } }).run });
  assert.deepEqual(silent.problems, ['the seed-twice check did not report its result']);
});

test('any API URL other than the isolated local stack is refused before psql runs', (t) => {
  const { run, calls } = stack({ API_URL: 'http://127.0.0.1:54321' });
  assert.throws(() => verifySeed({ projectDir: project(t), run }), /Refusing to run against http:\/\/127\.0\.0\.1:54321/);
  assert.deepEqual(calls.map(({ command }) => command), ['pnpm']);
});

test('invalid content stops before any command runs', (t) => {
  const dir = scratch(t);
  cpSync(CONTENT_ROOT, dir, { recursive: true });
  const file = join(dir, 'exercises/cardio.json');
  const data = JSON.parse(readFileSync(file, 'utf8'));
  data.exercises[0].provenance.licence = 'CC-BY-NC-4.0';
  writeFileSync(file, JSON.stringify(data));
  const { run, calls } = stack();
  assert.throws(() => verifySeed({ root: dir, projectDir: project(t), run }), /treadmill-walk: provenance\.licence CC-BY-NC-4\.0 does not match source fitlog-original/);
  assert.deepEqual(calls, []);
});

test('main prints one line, refuses arguments and never prints a key', (t) => {
  const dir = project(t);
  const ok = io();
  assert.equal(main([], { io: ok.io, projectDir: dir, run: stack().run }), 0, ok.err.join(''));
  assert.equal(ok.out.join('').trim().split('\n').length, 1);
  const usage = io();
  assert.equal(main(['--now'], { io: usage.io, projectDir: dir, run: stack().run }), 1);
  assert.match(usage.err.join(''), /^usage: node scripts\/content\/verify-seed\.mjs/);
  const failed = io();
  assert.equal(main([], { io: failed.io, projectDir: dir, run: stack({ override: { conflict: () => ({ status: 0, stdout: '', stderr: '' }) } }).run }), 1);
  assert.match(failed.err.join(''), /^verify-seed failed:\n- the seed did not stop/);
  assert.doesNotMatch([...ok.out, ...ok.err, ...usage.out, ...usage.err, ...failed.out, ...failed.err].join(''), /sb_secret/);
});
