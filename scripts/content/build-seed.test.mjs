import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkOutPath, main, parseArgs } from './build-seed.mjs';
import { CONTENT_ROOT, loadCatalogue } from './catalogue.mjs';
import { buildExerciseSeedSql } from './seed.mjs';

// The CLI writes only where a test points it, always inside an OS temporary directory. No database is touched.
const cli = fileURLToPath(new URL('./build-seed.mjs', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const scratch = (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'fitlog-ct1-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const io = () => {
  const out = []; const err = [];
  return { out, err, io: { stdout: { write: (text) => out.push(text) }, stderr: { write: (text) => err.push(text) } } };
};

test('check prints one summary line and exits 0', () => {
  const run = io();
  assert.equal(main(['check'], { io: run.io }), 0, run.err.join(''));
  assert.equal(run.out.join('').trim().split('\n').length, 1);
  assert.match(run.out.join(''), /^CT-1 content \S+ valid: \d{3} exercises/);
});

test('sql prints the seed; --out writes the same bytes to a .sql file', (t) => {
  const expected = buildExerciseSeedSql(loadCatalogue()).sql;
  const printed = io();
  assert.equal(main(['sql'], { io: printed.io }), 0);
  assert.equal(printed.out.join(''), expected);
  const dir = scratch(t);
  const written = io();
  assert.equal(main(['sql', '--out', 'seed.sql'], { io: written.io, cwd: dir }), 0, written.err.join(''));
  assert.equal(readFileSync(join(dir, 'seed.sql'), 'utf8'), expected);
  assert.match(written.out.join(''), /^Wrote .*seed\.sql: \d+ catalogue rows, payload sha256 [0-9a-f]{64}\n$/);
});

test('the seed is never written into supabase/migrations/ or to a non-.sql path', (t) => {
  const target = 'supabase/migrations/20991231235959_ct1_seed.sql';
  const refused = io();
  assert.equal(main(['sql', '--out', target], { io: refused.io, cwd: repoRoot }), 1);
  assert.match(refused.err.join(''), /inside supabase\/migrations\/; the seed is not a migration/);
  assert.equal(existsSync(join(repoRoot, target)), false);
  assert.throws(() => checkOutPath('./supabase/migrations/../migrations/x.sql', repoRoot), /inside supabase\/migrations/);
  assert.throws(() => checkOutPath('seed.txt', scratch(t)), /must name a \.sql file/);
});

test('usage errors exit 2', () => {
  for (const argv of [[], ['launch'], ['check', '--out', 'a.sql'], ['sql', '--out'], ['check', '--colour']]) {
    const run = io();
    assert.equal(main(argv, { io: run.io }), 2, JSON.stringify(argv));
    assert.match(run.err.join(''), /usage: node scripts\/content\/build-seed\.mjs/);
  }
  assert.equal(parseArgs(['sql', '--out', 'x.sql']).out, 'x.sql');
});

test('broken content exits 1 and names the record; nothing is printed to stdout', (t) => {
  const dir = scratch(t);
  cpSync(CONTENT_ROOT, dir, { recursive: true });
  const file = join(dir, 'exercises/barbell.json');
  const data = JSON.parse(readFileSync(file, 'utf8'));
  delete data.exercises[0].provenance;
  writeFileSync(file, JSON.stringify(data));
  for (const command of ['check', 'sql', 'templates', 'hi-backlog']) {
    const run = io();
    assert.equal(main([command, '--content', dir], { io: run.io }), 1, command);
    assert.match(run.err.join(''), /exercises\/barbell\.json barbell-back-squat: provenance is missing/);
    assert.deepEqual(run.out, []);
  }
});

test('templates and hi-backlog print JSON', () => {
  const templates = io();
  assert.equal(main(['templates'], { io: templates.io }), 0);
  assert.equal(JSON.parse(templates.out.join('')).length, 3);
  const backlog = io();
  assert.equal(main(['hi-backlog'], { io: backlog.io }), 0);
  assert.ok(JSON.parse(backlog.out.join('')).length > 200);
});

test('run as a command, the exit code is wired', () => {
  const ok = spawnSync(process.execPath, [cli, 'check'], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  const usage = spawnSync(process.execPath, [cli], { encoding: 'utf8' });
  assert.equal(usage.status, 2);
});
