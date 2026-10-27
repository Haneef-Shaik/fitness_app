import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { SUPPRESSION_ROOTS, suppressionProblems } from './coverage-suppression.mjs';

// Every fixture is a scratch directory under the OS temporary directory; the first two tests only read this repository.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const MOBILE_FILE = 'apps/mobile/src/features/gym/GymMembersScreen.tsx';
const DOMAIN_FILE = 'packages/domain/src/progression.ts';
const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Both scanned trees, holding exactly these files. */
function sources(t, files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'fitlog-suppression-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of SUPPRESSION_ROOTS) mkdirSync(join(root, dir), { recursive: true });
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}
const where = (problems) => problems.map((problem) => problem.slice(0, problem.indexOf(' ')));

test('the scanned trees are the mobile and domain sources whose coverage is enforced', () => {
  assert.deepEqual(SUPPRESSION_ROOTS, ['apps/mobile/src', 'packages/domain/src']);
});

test('this repository carries no coverage-suppression comment, and the scan reads every file in both trees', () => {
  const { problems, files } = suppressionProblems(repoRoot);
  assert.deepEqual(problems, []);
  const onDisk = SUPPRESSION_ROOTS.map(
    (dir) =>
      readdirSync(join(repoRoot, dir), { recursive: true, withFileTypes: true }).filter((entry) =>
        entry.isFile(),
      ).length,
  );
  assert.ok(
    onDisk.every((count) => count > 0),
    `both trees hold files (${onDisk.join(', ')})`,
  );
  assert.equal(files, onDisk[0] + onDisk[1]);
});

test('each Istanbul, c8, V8 and Node coverage-suppression comment fails, in mobile and in domain source, with its file and line', (t) => {
  const comments = [
    ['/* istanbul ignore file */', 'istanbul ignore', 'an Istanbul'],
    ['/* istanbul ignore next */', 'istanbul ignore', 'an Istanbul'],
    ['// istanbul ignore else', 'istanbul ignore', 'an Istanbul'],
    ['/*istanbul ignore if*/', 'istanbul ignore', 'an Istanbul'],
    ['/* istanbul ignore next @preserve */', 'istanbul ignore', 'an Istanbul'],
    ['/* Istanbul  Ignore Next */', 'Istanbul  Ignore', 'an Istanbul'],
    ['/* c8 ignore next 3 */', 'c8 ignore', 'a c8 or V8'],
    ['/* c8 ignore start */', 'c8 ignore', 'a c8 or V8'],
    ['/* v8 ignore next */', 'v8 ignore', 'a c8 or V8'],
    ['/* node:coverage disable */', 'node:coverage', 'a Node test runner'],
    ['/* node:coverage ignore next 2 */', 'node:coverage', 'a Node test runner'],
  ];
  for (const [comment, found, tool] of comments) {
    for (const path of [MOBILE_FILE, DOMAIN_FILE]) {
      const root = sources(t, {
        [path]: `// One module.\nexport const a = 1;\n${comment}\nexport const b = 2;\n`,
      });
      const { problems, files } = suppressionProblems(root);
      assert.equal(files, 1);
      assert.equal(problems.length, 1, `${comment} in ${path}: ${problems.join('\n')}`);
      assert.match(
        problems[0],
        new RegExp(
          `^${literal(`${path}:3 has ${JSON.stringify(found)}, ${tool} coverage-suppression comment. It takes code out of the coverage count`)}`,
        ),
      );
    }
  }
});

test('a comment split over lines, one in a test file, and every comment in a file are each reported, in file and line order', (t) => {
  const root = sources(t, {
    'apps/mobile/src/data/__tests__/store.test.ts': 'export {};\n/* istanbul\n   ignore next */\n',
    [DOMAIN_FILE]:
      '/* c8 ignore start */\nexport const a = 1;\n/* c8 ignore stop */\n/* istanbul ignore next */\n',
  });
  assert.deepEqual(where(suppressionProblems(root).problems), [
    'apps/mobile/src/data/__tests__/store.test.ts:2',
    `${DOMAIN_FILE}:1`,
    `${DOMAIN_FILE}:3`,
    `${DOMAIN_FILE}:4`,
  ]);
});

test('prose that names a coverage tool, without a suppression comment, passes', (t) => {
  const root = sources(t, {
    [MOBILE_FILE]:
      '// Istanbul counts every file here; c8 and v8 are other coverage tools.\n// node coverage runs in the domain package.\nexport const ignored = ["ignore"];\n',
  });
  assert.deepEqual(suppressionProblems(root), { problems: [], files: 1 });
});

test('a missing tree, a link, and a directory or file that cannot be read each fail closed', (t) => {
  const missing = sources(t, { [MOBILE_FILE]: 'export {};\n' });
  rmSync(join(missing, 'packages/domain/src'), { recursive: true });
  assert.deepEqual(suppressionProblems(missing).problems, [
    'packages/domain/src is missing, so it cannot be checked for coverage-suppression comments',
  ]);

  const linked = sources(t, { 'outside/escape.ts': '/* istanbul ignore file */\n' });
  symlinkSync(join(linked, 'outside/escape.ts'), join(linked, 'apps/mobile/src/linked.ts'));
  assert.match(
    suppressionProblems(linked).problems.join('\n'),
    /^apps\/mobile\/src\/linked\.ts is not a regular file or directory, so it cannot be checked for coverage-suppression comments/m,
  );

  const denied = sources(t, { [MOBILE_FILE]: 'export {};\n', [DOMAIN_FILE]: 'export {};\n' });
  const refuse = () => Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });
  const io = {
    list: (dir) => {
      if (dir === join(denied, 'apps/mobile/src/features')) throw refuse();
      return readdirSync(dir, { withFileTypes: true });
    },
    read: (file) => {
      if (file === join(denied, DOMAIN_FILE)) throw refuse();
      return readFileSync(file, 'utf8');
    },
  };
  assert.deepEqual(suppressionProblems(denied, io).problems, [
    'apps/mobile/src/features cannot be listed (EACCES: permission denied), so it cannot be checked for coverage-suppression comments',
    `${DOMAIN_FILE} cannot be read (EACCES: permission denied), so it cannot be checked for coverage-suppression comments`,
  ]);
});
