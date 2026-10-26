import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { LOCAL_API_URL, localDatabase, projectId, REPO_ROOT, spawnRunner } from './local-stack.mjs';
import { CONTRACTS_QUERY, main, PERSISTED, verifyContracts } from './verify-contracts.mjs';

// No test here reaches Docker, Supabase or a database: every command goes through an injected runner.
const snapshotPath = fileURLToPath(new URL('../../packages/domain/contracts/0.1.0.json', import.meta.url));
const committed = readFileSync(snapshotPath);
const persisted = JSON.parse(committed.toString('utf8')).persisted;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const KEY = 'sb_secret_fixture-must-never-print';
const scratch = (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'fitlog-contracts-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const project = (t, config = 'project_id = "fitlog_fixture"\n\n[api]\nport = 55321\n') => {
  const dir = scratch(t);
  mkdirSync(join(dir, 'supabase'));
  writeFileSync(join(dir, 'supabase/config.toml'), config);
  return dir;
};
/** A fake `pnpm exec supabase status` and `docker exec … psql`, recording every call. */
function stack({ status = { API_URL: LOCAL_API_URL, SECRET_KEY: KEY, PUBLISHABLE_KEY: 'sb_publishable_fixture' }, psql = () => ({ status: 0, stdout: '', stderr: '' }) } = {}) {
  const calls = [];
  const run = (command, args, options = {}) => {
    calls.push({ command, args, options });
    if (command === 'pnpm') return typeof status === 'function' ? status() : { status: 0, stdout: typeof status === 'string' ? status : JSON.stringify(status), stderr: '' };
    if (command === 'docker') return psql(args, options);
    return assert.fail(`unexpected command ${command}`);
  };
  return { run, calls };
}
/** The same values as the database returns them: keys in another order at every depth. */
const reordered = (value) => (Array.isArray(value) ? value.map(reordered)
  : value !== null && typeof value === 'object' ? Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reordered(item)])) : value);
const rows = (schemas) => () => ({ status: 0, stdout: `${JSON.stringify(reordered(schemas))}\n`, stderr: '' });
const io = () => {
  const out = []; const err = [];
  return { out, err, io: { stdout: { write: (text) => out.push(text) }, stderr: { write: (text) => err.push(text) } } };
};

test('the target is the project config.toml names, reached through argument arrays', (t) => {
  const dir = project(t);
  const { run, calls } = stack();
  const db = localDatabase({ projectDir: dir, run });
  assert.equal(db.container, 'supabase_db_fitlog_fixture');
  db.psql(['-At', '-c', 'select 1']);
  assert.deepEqual(calls.map(({ command, args }) => [command, args]), [
    ['pnpm', ['exec', 'supabase', 'status', '-o', 'json', '--workdir', dir]],
    ['docker', ['exec', '-i', 'supabase_db_fitlog_fixture', 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1', '-At', '-c', 'select 1']],
  ]);
  assert.equal(calls[0].options.cwd, REPO_ROOT);
  assert.ok(calls.every(({ options }) => !('shell' in options)), 'no call asks for a shell');
});

test('any other API URL is refused before the database is touched, and no key is printed', (t) => {
  const dir = project(t);
  for (const API_URL of ['http://127.0.0.1:54321', 'http://localhost:55321', undefined]) {
    const { run, calls } = stack({ status: { API_URL, SECRET_KEY: KEY } });
    assert.throws(() => localDatabase({ projectDir: dir, run }), (error) => {
      assert.match(error.message, /^Refusing to run against .*: expected http:\/\/127\.0\.0\.1:55321/);
      assert.doesNotMatch(error.message, /sb_secret/);
      return true;
    });
    assert.deepEqual(calls.map(({ command }) => command), ['pnpm']);
  }
});

test('a failed or unreadable supabase status is refused without echoing it', (t) => {
  const dir = project(t);
  for (const status of [() => ({ status: 1, stdout: KEY, stderr: KEY }), `not json ${KEY}`, () => ({ status: null, stdout: '', stderr: '', error: 'spawnSync pnpm ENOENT' })]) {
    const { run } = stack({ status });
    assert.throws(() => localDatabase({ projectDir: dir, run }), (error) => {
      assert.match(error.message, /supabase status/);
      assert.doesNotMatch(error.message, /sb_secret/);
      return true;
    });
  }
});

test('an injected target must be a loopback API URL', (t) => {
  const dir = project(t);
  for (const expectedApiUrl of ['http://10.0.0.5:55321', 'https://127.0.0.1:55321', 'http://localhost:55321', 'http://127.0.0.1:55321/']) {
    const { run, calls } = stack();
    assert.throws(() => localDatabase({ projectDir: dir, expectedApiUrl, run }), /loopback/, expectedApiUrl);
    assert.deepEqual(calls, []);
  }
  const replay = stack({ status: { API_URL: 'http://127.0.0.1:56321' } });
  assert.equal(localDatabase({ projectDir: project(t, 'project_id = "fitlog_ar1_replay_20261026"\n'), expectedApiUrl: 'http://127.0.0.1:56321', run: replay.run }).container, 'supabase_db_fitlog_ar1_replay_20261026');
});

test('config.toml must name exactly one valid top-level project_id', () => {
  assert.equal(projectId(readFileSync(join(REPO_ROOT, 'supabase/config.toml'), 'utf8')), 'fitlog_rebuild_20261017');
  assert.equal(projectId('# project_id = "commented"\nproject_id = "top" # comment\n[auth.third_party.firebase]\nproject_id = "nested"\n'), 'top');
  for (const config of ['[db]\nport = 1\n', 'project_id = "a"\nproject_id = "b"\n', 'project_id = "has space"\n', 'project_id = "../x"\n', 'project_id = top\n', 'project_id = ""\n']) {
    assert.throws(() => projectId(config), /project_id/, config);
  }
});

test('the default runner passes each argument and stdin unchanged, with no shell', (t) => {
  const dir = scratch(t);
  const echo = join(dir, 'echo.mjs');
  writeFileSync(echo, "let input = Buffer.alloc(0); process.stdin.on('data', (d) => { input = Buffer.concat([input, d]); }).on('end', () => process.stdout.write(JSON.stringify({ args: process.argv.slice(2), stdin: input.toString('hex') })));\n");
  const args = ['a b; echo $HOME', 'fixture={"x": "it\'s"}\n', '$(touch never)'];
  const input = Buffer.from([0x00, 0x0a, 0xff, 0x41]);
  const result = spawnRunner(process.execPath, [echo, ...args], { input });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { args, stdin: input.toString('hex') });
  assert.equal(spawnRunner(join(dir, 'no-such-binary'), []).status, null);
});

test('private.contracts equal to the persisted section passes, whatever the key order', (t) => {
  const { run, calls } = stack({ psql: rows(persisted) });
  const result = verifyContracts({ projectDir: project(t), run });
  assert.deepEqual(result.problems, []);
  assert.equal(result.line, `private.contracts matches the persisted section of contract 0.1.0 (packages/domain/contracts/0.1.0.json, sha256 ${sha256(committed)}, as manifest.json records): 8 schemas (${PERSISTED.join(', ')}) in supabase_db_fitlog_fixture at ${LOCAL_API_URL}`);
  assert.deepEqual(calls[1].args.slice(-3), ['-At', '-c', CONTRACTS_QUERY]);
  assert.equal(CONTRACTS_QUERY, "select coalesce(json_object_agg(name, schema order by name), '{}') from private.contracts");
});

test('a changed bound is named by contract and JSON pointer', (t) => {
  const changed = structuredClone(persisted);
  changed.set.properties.reps.anyOf[0].maximum = 1001;
  const result = verifyContracts({ projectDir: project(t), run: stack({ psql: rows(changed) }).run });
  assert.deepEqual(result.problems, ['persisted.set differs at /properties/reps/anyOf/0/maximum: database 1001, snapshot 1000']);
});

test('a missing or an extra row fails, and so does a type or array-length change', (t) => {
  const { goal, ...rest } = persisted;
  const changed = { ...structuredClone(rest), probe: {} };
  changed.exercise.required = changed.exercise.required.slice(1);
  changed.food.properties.name.maxLength = '100';
  assert.ok(goal);
  const result = verifyContracts({ projectDir: project(t), run: stack({ psql: rows(changed) }).run });
  assert.deepEqual(result.problems, [
    'persisted.exercise differs at /required: database array of 12, snapshot array of 13',
    'persisted.food differs at /properties/name/maxLength: database "100", snapshot 100',
    'private.contracts has no row goal',
    'private.contracts has an unexpected row probe',
  ]);
});

test('M1.5 shape: a mutant snapshot fails on its manifest hash and on the changed bound, and the committed file is untouched', (t) => {
  const dir = scratch(t);
  const mutant = JSON.parse(committed.toString('utf8'));
  mutant.persisted.measurements.additionalProperties.maximum = 501;
  const mutantPath = join(dir, '0.1.0-mutant.json');
  writeFileSync(mutantPath, `${JSON.stringify(mutant, null, 2)}\n`);
  const result = verifyContracts({ snapshotPath: mutantPath, projectDir: project(t), run: stack({ psql: rows(persisted) }).run });
  assert.deepEqual(result.problems, [
    `${mutantPath} has sha256 ${sha256(readFileSync(mutantPath))}, but packages/domain/contracts/manifest.json records ${sha256(committed)} for 0.1.0`,
    'persisted.measurements differs at /additionalProperties/maximum: database 500, snapshot 501',
  ]);
  assert.equal(sha256(readFileSync(snapshotPath)), sha256(committed));
});

test('a snapshot for a version the manifest does not end at is refused', (t) => {
  const dir = scratch(t);
  const other = { ...JSON.parse(committed.toString('utf8')), version: '9.9.9' };
  const path = join(dir, '9.9.9.json');
  writeFileSync(path, `${JSON.stringify(other, null, 2)}\n`);
  const result = verifyContracts({ snapshotPath: path, projectDir: project(t), run: stack({ psql: rows(persisted) }).run });
  assert.deepEqual(result.problems, [`${path} is contract 9.9.9, but packages/domain/contracts/manifest.json ends at 0.1.0`]);
});

test('a psql failure or output that is not one JSON object fails, and no key appears', (t) => {
  const dir = project(t);
  const failed = verifyContracts({ projectDir: dir, run: stack({ psql: () => ({ status: 2, stdout: '', stderr: 'psql: error: connection to server failed\n' }) }).run });
  assert.deepEqual(failed.problems, ['psql exited 2: psql: error: connection to server failed']);
  for (const stdout of ['not json\n', '[]\n', '{"a":1}\n{"b":2}\n']) {
    const result = verifyContracts({ projectDir: dir, run: stack({ psql: () => ({ status: 0, stdout, stderr: '' }) }).run });
    assert.match(result.problems.join('\n'), /^private\.contracts did not come back as one JSON object/, stdout);
    assert.doesNotMatch(result.problems.join('\n'), /sb_secret/);
  }
});

test('the command takes at most one snapshot path and prints one line', (t) => {
  const dir = project(t);
  const usage = io();
  assert.equal(main(['a.json', 'b.json'], { io: usage.io, projectDir: dir, run: stack().run }), 1);
  assert.match(usage.err.join(''), /^usage: node scripts\/backend\/verify-contracts\.mjs \[snapshot\.json\]/);
  const ok = io();
  assert.equal(main([], { io: ok.io, projectDir: dir, run: stack({ psql: rows(persisted) }).run }), 0);
  assert.equal(ok.out.join('').trim().split('\n').length, 1);
  const refused = io();
  assert.equal(main([], { io: refused.io, projectDir: dir, run: stack({ status: { API_URL: 'http://127.0.0.1:54321', SECRET_KEY: KEY } }).run }), 1);
  assert.match(refused.err.join(''), /Refusing to run against/);
  assert.doesNotMatch(refused.err.join('') + refused.out.join(''), /sb_secret/);
});
