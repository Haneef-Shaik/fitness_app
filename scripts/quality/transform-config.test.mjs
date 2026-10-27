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
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { MOBILE_ROOT, configInventory } from './config-inventory.mjs';
import { BABEL_CONFIG, transformConfigProblems } from './transform-config.mjs';

// Every fixture is a scratch directory under the OS temporary directory; the first two tests only read this repository
// and the installed packages.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const PACKAGE = `${MOBILE_ROOT}/package.json`;
const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A scratch mobile package: a package.json with no babel key, one source file, and these files. */
function mobile(t, files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'fitlog-transform-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const all = {
    [PACKAGE]: '{ "name": "@fitlog/mobile" }\n',
    [`${MOBILE_ROOT}/src/clean.ts`]: 'export const clean = 1;\n',
    ...files,
  };
  for (const [path, text] of Object.entries(all)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}
/** What the guard reports for the mobile package: the inventory's own problems, then the transform-config ones. */
function problemsIn(root, io) {
  const inventory = configInventory(root, io);
  return [...inventory.problems, ...transformConfigProblems(root, inventory, io)];
}
const refused = (path) =>
  new RegExp(
    `^${literal(`${path} is a Babel configuration file`)}.*${literal('No Babel configuration is reviewed for the mobile package')}`,
  );
const denied = () => Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });

test('the mobile package of this repository holds no Babel configuration, and the inventory lists every entry outside node_modules', () => {
  const inventory = configInventory(repoRoot);
  assert.deepEqual(inventory.problems, []);
  assert.deepEqual(transformConfigProblems(repoRoot, inventory), []);
  const base = join(repoRoot, MOBILE_ROOT);
  const onDisk = readdirSync(base, { recursive: true, withFileTypes: true })
    .map((entry) => relative(base, join(entry.parentPath, entry.name)).split(sep))
    .filter((segments) => !segments.includes('node_modules'))
    .map((segments) => `${MOBILE_ROOT}/${segments.join('/')}`)
    .sort();
  assert.ok(onDisk.length > 0);
  assert.deepEqual(inventory.entries.map(({ path }) => path).sort(), onDisk);
});

test('every config name the installed jest-expo and @babel/core look for is refused, in any letter case', () => {
  const mobileRequire = createRequire(join(repoRoot, PACKAGE));
  const jestExpo = dirname(mobileRequire.resolve('jest-expo/package.json'));
  const babelCore = join(
    dirname(createRequire(mobileRequire.resolve('babel-jest')).resolve('@babel/core')),
    '..',
  );
  const listed = (file, name) => {
    const text = readFileSync(file, 'utf8');
    const block = new RegExp(`${name}\\s*=\\s*(?:exports\\.${name}\\s*=\\s*)?\\[([^\\]]*)\\]`).exec(
      text,
    );
    assert.ok(
      block,
      `${file} no longer lists ${name}: re-read how it loads Babel configuration before trusting this guard`,
    );
    return [...block[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
  };
  const configuration = join(babelCore, 'lib/config/files/configuration.js');
  const names = [
    ...listed(join(jestExpo, 'src/resolveBabelOptions.js'), 'BABEL_CONFIG_NAMES'),
    ...listed(configuration, 'ROOT_CONFIG_FILENAMES'),
    ...listed(configuration, 'RELATIVE_CONFIG_FILENAMES'),
    /BABELIGNORE_FILENAME = "([^"]+)"/.exec(readFileSync(configuration, 'utf8'))?.[1],
  ];
  assert.equal(names.length, 13 + 7 + 6 + 1, names.join(', '));
  for (const name of [
    ...names,
    ...names.map((name) => name.toUpperCase()),
    '.BabelRC',
    'Babel.Config.Js',
  ])
    assert.match(name, BABEL_CONFIG);
  for (const name of [
    'babel.ts',
    'babel-helpers.ts',
    'babelrc',
    '.babel.json',
    'my.babelrc',
    'babel.configs',
  ])
    assert.doesNotMatch(name, BABEL_CONFIG);
});

test('a Babel config file fails wherever it sits in the mobile package, hidden or nested, in any letter case', (t) => {
  const names = [
    'babel.config.js',
    'babel.config.json',
    'babel.config.mts',
    '.babelrc',
    '.babelrc.js',
    '.babelignore',
    '.BabelRC',
    'Babel.Config.CJS',
  ];
  const folders = [
    MOBILE_ROOT,
    `${MOBILE_ROOT}/src`,
    `${MOBILE_ROOT}/src/features/gym`,
    `${MOBILE_ROOT}/.hidden`,
    `${MOBILE_ROOT}/coverage`,
  ];
  for (const name of names) {
    for (const folder of folders) {
      const path = `${folder}/${name}`;
      const found = problemsIn(mobile(t, { [path]: '{ "ignore": ["src/features/**"] }\n' }));
      assert.equal(found.length, 1, `${path}: ${found.join('\n')}`);
      assert.match(found[0], refused(path));
    }
  }
  // Phase 2F (phase-2D review, test gap): a directory with such a name fails too, named as one. @babel/core 7.29.7 checks
  // only that the path exists (lib/config/files/utils.js, fileMtime) before reading it as a file, so a directory makes Babel
  // throw for each file under it, which takes untested files out of Jest's count.
  for (const path of [
    `${MOBILE_ROOT}/.babelrc`,
    `${MOBILE_ROOT}/src/features/babel.config.js`,
    `${MOBILE_ROOT}/src/.babelignore`,
  ]) {
    const found = problemsIn(mobile(t, { [`${path}/keep.json`]: '{}\n' }));
    assert.equal(found.length, 1, `${path}: ${found.join('\n')}`);
    assert.match(
      found[0],
      new RegExp(
        `^${literal(`${path} is a Babel configuration file (a directory with that name). No Babel configuration is reviewed for the mobile package`)}`,
      ),
    );
  }
});

test('a "babel" key in the mobile package.json fails, and so does any package.json nested in the mobile package', (t) => {
  assert.match(
    problemsIn(
      mobile(t, { [PACKAGE]: '{ "name": "@fitlog/mobile", "babel": { "plugins": [] } }\n' }),
    ).join('\n'),
    new RegExp(
      `^${literal(`${PACKAGE} has a "babel" key, which Babel reads as configuration for the files of its package. No Babel configuration is reviewed`)}`,
    ),
  );
  const notJson = problemsIn(mobile(t, { [PACKAGE]: '{ "name": ' }));
  assert.equal(notJson.length, 1, notJson.join('\n'));
  assert.match(
    notJson[0],
    new RegExp(
      `^${literal(`${PACKAGE} is not JSON (`)}.+${literal('), so its "babel" key cannot be checked')}$`,
    ),
  );
  assert.deepEqual(problemsIn(mobile(t, { [PACKAGE]: 'null\n' })), [
    `${PACKAGE} is not a JSON object, so its "babel" key cannot be checked`,
  ]);
  for (const [path, text] of [
    [`${MOBILE_ROOT}/src/features/package.json`, '{}\n'],
    [`${MOBILE_ROOT}/src/data/package.json`, 'null\n'],
    [`${MOBILE_ROOT}/scripts/Package.json`, '{ "babel": {} }\n'],
  ]) {
    const found = problemsIn(mobile(t, { [path]: text }));
    assert.equal(found.length, 1, `${path}: ${found.join('\n')}`);
    assert.match(
      found[0],
      new RegExp(`^${literal(`${path} starts a package of its own inside ${MOBILE_ROOT}`)}`),
    );
  }
});

test('node_modules folders are skipped at any depth, as Babel and ESLint skip them, and generated folders are not', (t) => {
  const root = mobile(t, {
    [`${MOBILE_ROOT}/node_modules/some-lib/.babelrc`]: '{}\n',
    [`${MOBILE_ROOT}/node_modules/some-lib/package.json`]: '{ "babel": {} }\n',
    [`${MOBILE_ROOT}/src/node_modules/.babelrc`]: '{}\n',
  });
  assert.deepEqual(problemsIn(root), []);
  assert.ok(
    configInventory(root).entries.every(({ path }) => !path.split('/').includes('node_modules')),
  );
  assert.match(
    problemsIn(mobile(t, { [`${MOBILE_ROOT}/dist/.babelrc`]: '{}\n' })).join('\n'),
    refused(`${MOBILE_ROOT}/dist/.babelrc`),
  );
});

test('a link, a folder that cannot be listed, a file that cannot be read and a missing package each fail closed', (t) => {
  const linkedFile = mobile(t, { 'outside/babelrc.json': '{ "ignore": ["src/**"] }\n' });
  symlinkSync(join(linkedFile, 'outside/babelrc.json'), join(linkedFile, MOBILE_ROOT, '.babelrc'));
  const fileProblems = problemsIn(linkedFile);
  assert.match(
    fileProblems.join('\n'),
    new RegExp(
      `^${literal(`${MOBILE_ROOT}/.babelrc is not a regular file or directory, so the config inventory cannot see what it holds`)}`,
      'm',
    ),
  );
  assert.match(
    fileProblems.join('\n'),
    new RegExp(
      `^${literal(`${MOBILE_ROOT}/.babelrc is a Babel configuration file (a link or other entry with that name)`)}`,
      'm',
    ),
  );

  const linkedFolder = mobile(t, { 'outside/vendor/.babelrc': '{}\n' });
  symlinkSync(join(linkedFolder, 'outside/vendor'), join(linkedFolder, MOBILE_ROOT, 'vendor'));
  assert.deepEqual(problemsIn(linkedFolder), [
    `${MOBILE_ROOT}/vendor is not a regular file or directory, so the config inventory cannot see what it holds; a link can bring configuration in from anywhere`,
  ]);

  const root = mobile(t, { [`${MOBILE_ROOT}/src/features/gym/Screen.tsx`]: 'export {};\n' });
  const io = {
    list: (dir) => {
      if (dir === join(root, MOBILE_ROOT, 'src/features')) throw denied();
      return readdirSync(dir, { withFileTypes: true });
    },
    read: (file) => {
      if (file === join(root, PACKAGE)) throw denied();
      return readFileSync(file, 'utf8');
    },
  };
  assert.deepEqual(problemsIn(root, io), [
    `${MOBILE_ROOT}/src/features cannot be listed (EACCES: permission denied), so the config inventory cannot see what it holds`,
    `${PACKAGE} cannot be read (EACCES: permission denied), so its "babel" key cannot be checked`,
  ]);

  const noPackage = `${PACKAGE} is missing: Babel would then look past ${MOBILE_ROOT}, up to the next package.json, for .babelrc files and a "babel" key`;
  const missing = mobile(t);
  rmSync(join(missing, MOBILE_ROOT), { recursive: true });
  assert.deepEqual(problemsIn(missing), [
    `${MOBILE_ROOT} is missing, so the config inventory cannot see what it holds`,
    noPackage,
  ]);

  const empty = mobile(t);
  rmSync(join(empty, MOBILE_ROOT), { recursive: true });
  mkdirSync(join(empty, MOBILE_ROOT));
  assert.deepEqual(
    problemsIn(empty),
    [noPackage],
    'an empty package folder holds no package.json either',
  );

  const withoutPackage = mobile(t);
  rmSync(join(withoutPackage, PACKAGE));
  assert.deepEqual(problemsIn(withoutPackage), [noPackage]);
});
