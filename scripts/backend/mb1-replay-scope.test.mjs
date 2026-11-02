// MB-1 replay runner tests: review 2026-10-27T0605Z L1. SF-0's split made the command functions importable, so "every
// command goes through dispatch" (the lock, the halt, the confirm tokens, the plan order and the shared pin) was a convention.
// These tests pin it: the entry exports exactly its six names, only the runner chain imports the five internal modules, and
// each says so in its role comment. Pure: file reads only, and a scratch fixture under the OS temp directory.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { test } from 'node:test';
import { REPO_ROOT } from './local-stack.mjs';
import * as entry from './mb1-replay.mjs';

const INTERNAL = Object.freeze(['mb1-replay-exec.mjs', 'mb1-replay-live.mjs', 'mb1-replay-sql.mjs', 'mb1-replay-commands.mjs', 'mb1-replay-shared.mjs']);
const CHAIN = new Set(['scripts/backend/mb1-replay.mjs', ...INTERNAL.map((name) => `scripts/backend/${name}`)]);
const SOURCE = /\.(mjs|cjs|js|jsx|mts|cts|ts|tsx)$/;
// Static imports and re-exports, side-effect imports, dynamic import() and require(); comments that quote a specifier count
// too, which errs on the side of a false alarm.
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"`])([^'"`\n]+)\1/g;

/** Every source file under `dir`, without node_modules, dot-directories or links. */
function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    if (item.name === 'node_modules' || item.name.startsWith('.')) return [];
    const path = join(dir, item.name);
    if (item.isDirectory()) return sources(path);
    return item.isFile() && SOURCE.test(item.name) ? [path] : [];
  });
}
/** Each import of an internal runner module by a file outside the runner chain, as `file -> module`, relative to `root`. */
function internalImporters(root) {
  return sources(root).flatMap((path) => {
    const file = relative(root, path);
    if (CHAIN.has(file)) return [];
    return [...readFileSync(path, 'utf8').matchAll(SPECIFIER)].map((match) => match[2].split('/').at(-1))
      .map((name) => (name.endsWith('.mjs') ? name : `${name}.mjs`)).filter((name) => INTERNAL.includes(name)).map((name) => `${file} -> ${name}`);
  }).sort();
}

test('L1: the entry exports exactly its six names', () => {
  assert.deepEqual(Object.keys(entry).sort(), ['CHILD_ENV', 'SUPABASE', 'SUPABASE_CLI', 'childEnv', 'runCommand', 'runReplay']);
});

test('L1: the importer scan finds an internal import anywhere outside the runner chain (a scratch fixture)', (t) => {
  const base = mkdtempSync(join(tmpdir(), 'fitlog-mb1-scope-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  // Each fixture's import line is assembled at run time, so this file's own source holds no specifier the scan would flag.
  const m = (part, ext = '.mjs') => ['mb1', 'replay', part].join('-') + ext;
  const q = (quote, path) => `${quote}${path}${quote}`;
  const files = {
    'scripts/backend/mb1-replay.mjs': `import { sharedApply } from ${q("'", `./${m('shared')}`)};\nexport { childEnv } from ${q("'", `./${m('exec')}`)};\n`,
    [`scripts/backend/${m('shared')}`]: `import { cliCall } from ${q("'", `./${m('live')}`)};\n`,
    'scripts/backend/helper.mjs': `import { sharedApply } from ${q("'", `./${m('shared')}`)};\nimport { runReplay } from ${q("'", './mb1-replay.mjs')};\n`,
    'scripts/backend/reexport.test.mjs': `export { mutate } from ${q('"', `./${m('commands')}`)};\n`,
    'scripts/other/tool.mjs': `const live = await import(${q("'", `../backend/${m('live')}`)});\n`,
    'scripts/other/old.cjs': `const sql = require(${q('"', `../backend/${m('sql', '')}`)});\n`,
    'apps/web/side-effect.ts': `import ${q("'", `../../scripts/backend/${m('exec')}`)};\n`,
    'scripts/backend/prose.mjs': `// ${m('exec')} and ${m('shared')} are internal: a name in prose is not an import\n`,
    'node_modules/pkg/index.mjs': `import ${q("'", `../../scripts/backend/${m('sql')}`)};\n`,
    '.cache/stale.mjs': `import ${q("'", `../scripts/backend/${m('sql')}`)};\n`,
  };
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(join(base, dirname(rel)), { recursive: true });
    writeFileSync(join(base, rel), text);
  }
  assert.deepEqual(internalImporters(base), [
    'apps/web/side-effect.ts -> mb1-replay-exec.mjs', 'scripts/backend/helper.mjs -> mb1-replay-shared.mjs', 'scripts/backend/reexport.test.mjs -> mb1-replay-commands.mjs',
    'scripts/other/old.cjs -> mb1-replay-sql.mjs', 'scripts/other/tool.mjs -> mb1-replay-live.mjs',
  ]);
});

test('L1: in this repository only the runner chain imports the five internal modules, and each says so', () => {
  assert.deepEqual(internalImporters(REPO_ROOT), []);
  for (const name of INTERNAL) {
    const head = readFileSync(join(REPO_ROOT, 'scripts/backend', name), 'utf8').split('\n').slice(0, 5).join('\n');
    assert.match(head, /^\/\/ Internal: only mb1-replay\.mjs and its sibling modules import this;/m, name);
  }
});
