import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { LOCAL_API_URL } from './local-stack.mjs';
import { DEFAULT_FIXTURE, DEFAULT_SQL, main, verifyFixtures } from './verify-fixtures.mjs';

// No test here reaches Docker, Supabase or a database: every command goes through an injected runner.
const fixturePath = fileURLToPath(new URL('../../packages/domain/fixtures/ac03-training.v1.json', import.meta.url));
const sqlPath = fileURLToPath(new URL('./sql/training-fixtures.sql', import.meta.url));
const fixtureBytes = readFileSync(fixturePath);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const KEY = 'sb_secret_fixture-must-never-print';
const PASSED = 'training.v1: 16 set vectors and 2 session vectors passed in SQL; 1 pending MB-4 session vectors not asserted';
/** What psql prints to stderr for the two notices training-fixtures.sql raises. */
const notices = (hash, passed = PASSED) => `psql:<stdin>:23: NOTICE:  training.v1 fixture text sha256 ${hash}\n${passed ? `psql:<stdin>:96: NOTICE:  ${passed}\n` : ''}`;
const scratch = (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'fitlog-fixtures-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const project = (t) => {
  const dir = scratch(t);
  mkdirSync(join(dir, 'supabase'));
  writeFileSync(join(dir, 'supabase/config.toml'), 'project_id = "fitlog_fixture"\n');
  return dir;
};
function stack({ API_URL = LOCAL_API_URL, psql = () => ({ status: 0, stdout: '', stderr: notices(sha256(fixtureBytes)) }) } = {}) {
  const calls = [];
  const run = (command, args, options = {}) => {
    calls.push({ command, args, options });
    if (command === 'pnpm') return { status: 0, stdout: JSON.stringify({ API_URL, SECRET_KEY: KEY }), stderr: '' };
    if (command === 'docker') return psql(args, options);
    return assert.fail(`unexpected command ${command}`);
  };
  return { run, calls };
}
const io = () => {
  const out = []; const err = [];
  return { out, err, io: { stdout: { write: (text) => out.push(text) }, stderr: { write: (text) => err.push(text) } } };
};

test('the defaults are the shared fixture and the rollback-only SQL check', () => {
  assert.equal(DEFAULT_FIXTURE, fixturePath);
  assert.equal(DEFAULT_SQL, sqlPath);
});

test('the fixture reaches psql byte for byte as one argument, with the SQL on stdin and ON_ERROR_STOP', (t) => {
  const { run, calls } = stack();
  const result = verifyFixtures({ projectDir: project(t), run });
  assert.deepEqual(result.problems, []);
  assert.equal(result.line, `training.v1 SQL check passed for packages/domain/fixtures/ac03-training.v1.json (sha256 ${sha256(fixtureBytes)}, received unchanged): ${PASSED} [scripts/backend/sql/training-fixtures.sql in supabase_db_fitlog_fixture at ${LOCAL_API_URL}]`);
  const [, docker] = calls;
  assert.deepEqual(docker.args, ['exec', '-i', 'supabase_db_fitlog_fixture', 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1', '-q', '-v', `fixture=${fixtureBytes.toString('utf8')}`, '-f', '-']);
  assert.ok(Buffer.from(docker.args[13].slice('fixture='.length), 'utf8').equals(fixtureBytes), 'the argument holds the file bytes, final newline included');
  assert.ok(Buffer.isBuffer(docker.options.input) && docker.options.input.equals(readFileSync(sqlPath)));
  assert.ok(!('shell' in docker.options));
});

test('psql reporting another fixture hash fails: the bytes changed on the way', (t) => {
  const result = verifyFixtures({ projectDir: project(t), run: stack({ psql: () => ({ status: 0, stdout: '', stderr: notices('0'.repeat(64)) }) }).run });
  assert.deepEqual(result.problems, [`psql received fixture text with sha256 ${'0'.repeat(64)}, but packages/domain/fixtures/ac03-training.v1.json has sha256 ${sha256(fixtureBytes)}`]);
});

test('a psql run without both notices fails, even when it exits 0', (t) => {
  const dir = project(t);
  const noPass = verifyFixtures({ projectDir: dir, run: stack({ psql: () => ({ status: 0, stdout: '', stderr: notices(sha256(fixtureBytes), '') }) }).run });
  assert.deepEqual(noPass.problems, ['the SQL check did not report that the training.v1 vectors passed']);
  const silent = verifyFixtures({ projectDir: dir, run: stack({ psql: () => ({ status: 0, stdout: '', stderr: '' }) }).run });
  assert.deepEqual(silent.problems, ['the SQL check did not report the sha256 of the fixture text it received', 'the SQL check did not report that the training.v1 vectors passed']);
});

test('M4.2 shape: a failing SQL check is reported with its psql error', (t) => {
  const error = 'psql:<stdin>:96: ERROR:  training.v1 fixture failed in SQL: ac03-working-80x8 e1rmKg: expected 101.333333, got 84.258065';
  const result = verifyFixtures({ projectDir: project(t), run: stack({ psql: () => ({ status: 3, stdout: '', stderr: `${notices(sha256(fixtureBytes), '')}${error}\nCONTEXT:  PL/pgSQL function inline_code_block line 76 at RAISE\n` }) }).run });
  assert.equal(result.problems.length, 1);
  assert.match(result.problems[0], /^psql exited 3:\n/);
  assert.ok(result.problems[0].includes(error));
});

test('a fixture that is not JSON, or cannot pass through an argument unchanged, stops before psql', (t) => {
  const dir = scratch(t);
  for (const [bytes, message] of [[Buffer.from('{"fixture": '), /is not JSON/], [Buffer.from([0x7b, 0xff, 0x7d]), /not valid UTF-8/], [Buffer.from('{"a":"\u0000"}'), /NUL/]]) {
    const path = join(dir, `fixture-${sha256(bytes).slice(0, 8)}.json`);
    writeFileSync(path, bytes);
    const { run, calls } = stack();
    assert.throws(() => verifyFixtures({ fixturePath: path, projectDir: project(t), run }), message);
    assert.deepEqual(calls.map(({ command }) => command), ['pnpm'], 'psql never ran');
  }
});

test('any other API URL is refused before the fixture is sent', (t) => {
  const { run, calls } = stack({ API_URL: 'http://127.0.0.1:54321' });
  assert.throws(() => verifyFixtures({ projectDir: project(t), run }), /^Error: Refusing to run against http:\/\/127\.0\.0\.1:54321/);
  assert.deepEqual(calls.map(({ command }) => command), ['pnpm']);
});

test('the optional argument replaces the SQL file, more arguments are refused, and no key is printed', (t) => {
  const dir = project(t);
  const mutant = join(scratch(t), 'training-fixtures-mutant.sql');
  writeFileSync(mutant, '-- mutant\n');
  const { run, calls } = stack();
  const replaced = io();
  assert.equal(main([mutant], { io: replaced.io, projectDir: dir, run }), 0, replaced.err.join(''));
  assert.ok(calls[1].options.input.equals(Buffer.from('-- mutant\n')));
  assert.match(replaced.out.join(''), new RegExp(`\\[${mutant.replaceAll(/[.*+?^${}()|[\]\\/]/g, '\\$&')} in supabase_db_fitlog_fixture`));
  assert.equal(replaced.out.join('').trim().split('\n').length, 1);
  const usage = io();
  assert.equal(main(['a.sql', 'b.sql'], { io: usage.io, projectDir: dir, run }), 1);
  assert.match(usage.err.join(''), /^usage: node scripts\/backend\/verify-fixtures\.mjs \[training-fixtures\.sql\]/);
  const failed = io();
  assert.equal(main([], { io: failed.io, projectDir: dir, run: stack({ psql: () => ({ status: 3, stdout: '', stderr: 'ERROR:  boom\n' }) }).run }), 1);
  assert.doesNotMatch([...replaced.out, ...replaced.err, ...failed.out, ...failed.err].join(''), /sb_secret/);
});
