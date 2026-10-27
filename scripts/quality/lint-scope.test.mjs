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
import {
  ESLINT_CONFIG,
  LINT_IGNORED,
  REVIEWED_ESLINT_CONFIG,
  lintScopeProblems,
} from './lint-scope.mjs';

// Every fixture is a scratch directory under the OS temporary directory; the first two tests only read this repository.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const PACKAGE = `${MOBILE_ROOT}/package.json`;
const SCREEN = `${MOBILE_ROOT}/src/features/gym/Screen.tsx`;
const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A scratch mobile package: a package.json, the reviewed eslint.config.js, one source file, and these files. */
function mobile(t, files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'fitlog-lint-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const all = {
    [PACKAGE]: '{ "name": "@fitlog/mobile" }\n',
    [ESLINT_CONFIG]: REVIEWED_ESLINT_CONFIG,
    [`${MOBILE_ROOT}/src/clean.ts`]: 'export const clean = 1;\n',
    ...files,
  };
  for (const [path, text] of Object.entries(all)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}
const lint = (root, io) => lintScopeProblems(root, configInventory(root, io), io);
const notReviewed = (line) =>
  new RegExp(
    `^${literal(`${ESLINT_CONFIG} is not the reviewed ESLint config (first difference at line ${line}`)}`,
  );
const LINTED = /\.(?:[cm]?[jt]s|[jt]sx)$/;
const denied = () => Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });
/** U+2028 LINE SEPARATOR and U+2029 PARAGRAPH SEPARATOR, written by code point so the source shows them. */
const LS = String.fromCodePoint(0x2028);
const PS = String.fromCodePoint(0x2029);

test('this repository lints with the reviewed config, and the other files it lints hold no undescribed eslint-disable', () => {
  const { problems, files } = lintScopeProblems(repoRoot, configInventory(repoRoot));
  assert.deepEqual(problems, []);
  const base = join(repoRoot, MOBILE_ROOT);
  // The config itself is pinned as text, so the directive scan reads every other file ESLint lints.
  const linted = readdirSync(base, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && LINTED.test(entry.name))
    .map((entry) => relative(base, join(entry.parentPath, entry.name)).split(sep))
    .filter((segments) => !segments.includes('node_modules') && !LINT_IGNORED.includes(segments[0]))
    .filter((segments) => `${MOBILE_ROOT}/${segments.join('/')}` !== ESLINT_CONFIG);
  assert.ok(linted.length > 0);
  assert.equal(files, linted.length);
});

test('the folders the directive scan skips are exactly the global ignores of the reviewed config', () => {
  const ignores = /^ {2}\{ ignores: \[([^\]]*)\] \},$/m.exec(REVIEWED_ESLINT_CONFIG)?.[1];
  assert.ok(ignores, 'the reviewed config has one global ignores line');
  assert.deepEqual(
    ignores.split(',').map((item) => item.trim().replace(/^'|'$/g, '')),
    LINT_IGNORED.map((dir) => `${dir}/**`),
  );
});

test('narrowing or changing the reviewed ESLint config fails, and line endings or a final newline do not', (t) => {
  const root = mobile(t);
  assert.deepEqual(lint(root).problems, []);
  const edits = [
    [(text) => text.replace("'coverage/**',", "'coverage/**', 'src/features/**',"), 6],
    [(text) => text.replace("        'error',", "        'off',"), 12],
    [(text) => text.replace("files: ['src/**/*.{ts,tsx}']", "files: ['src/ui/**/*.{ts,tsx}']"), 8],
    [
      (text) =>
        text.replace(
          '  expo,\n',
          "  expo,\n  { linterOptions: { reportUnusedDisableDirectives: 'off' } },\n",
        ),
      6,
    ],
    [(text) => text.replace('  expo,\n', ''), 5],
    [(text) => `${text}module.exports.push({ rules: { 'no-restricted-syntax': 'off' } });\n`, 25],
  ];
  for (const [edit, line] of edits) {
    const changed = edit(REVIEWED_ESLINT_CONFIG);
    assert.notEqual(changed, REVIEWED_ESLINT_CONFIG);
    writeFileSync(join(root, ESLINT_CONFIG), changed);
    assert.match(lint(root).problems.join('\n'), notReviewed(line));
  }
  for (const same of [
    REVIEWED_ESLINT_CONFIG.replace(/\n/g, '\r\n'),
    REVIEWED_ESLINT_CONFIG.trimEnd(),
    `${REVIEWED_ESLINT_CONFIG}\n`,
  ]) {
    writeFileSync(join(root, ESLINT_CONFIG), same);
    assert.deepEqual(lint(root).problems, []);
  }
  rmSync(join(root, ESLINT_CONFIG));
  assert.deepEqual(lint(root).problems, [
    `${ESLINT_CONFIG} is missing, so lint would run without the reviewed config`,
  ]);
});

test('every other ESLint config source in the mobile package fails, nested or hidden, in any letter case', (t) => {
  const sources = [
    `${MOBILE_ROOT}/eslint.config.mjs`,
    `${MOBILE_ROOT}/src/eslint.config.js`,
    `${MOBILE_ROOT}/src/features/gym/eslint.config.ts`,
    `${MOBILE_ROOT}/ESLint.Config.CJS`,
    `${MOBILE_ROOT}/.eslintrc`,
    `${MOBILE_ROOT}/src/.eslintrc.json`,
    `${MOBILE_ROOT}/scripts/.eslintrc.yml`,
    `${MOBILE_ROOT}/.eslintignore`,
    `${MOBILE_ROOT}/coverage/eslint.config.js`,
  ];
  for (const path of sources) {
    const found = lint(mobile(t, { [path]: 'module.exports = [];\n' })).problems;
    assert.equal(found.length, 1, `${path}: ${found.join('\n')}`);
    assert.match(
      found[0],
      new RegExp(
        `^${literal(`${path} is an ESLint configuration source besides ${ESLINT_CONFIG}`)}`,
      ),
    );
  }
  for (const key of ['eslintConfig', 'eslintIgnore']) {
    assert.deepEqual(
      lint(mobile(t, { [PACKAGE]: JSON.stringify({ name: '@fitlog/mobile', [key]: {} }) }))
        .problems,
      [
        `${PACKAGE} has an "${key}" key, which ESLint reads as configuration in its eslintrc mode. Remove it, or change scripts/quality/lint-scope.mjs in a reviewed diff first`,
      ],
    );
  }
  // Phase 2F (phase-2D review, test gap): each key is reported on its own, so dropping either from the check fails here.
  assert.deepEqual(
    lint(
      mobile(t, {
        [PACKAGE]: JSON.stringify({
          name: '@fitlog/mobile',
          eslintIgnore: ['src/features/**'],
          eslintConfig: { rules: {} },
        }),
      }),
    ).problems,
    ['eslintConfig', 'eslintIgnore'].map(
      (key) =>
        `${PACKAGE} has an "${key}" key, which ESLint reads as configuration in its eslintrc mode. Remove it, or change scripts/quality/lint-scope.mjs in a reviewed diff first`,
    ),
  );
  assert.deepEqual(
    lint(
      mobile(t, {
        [`${MOBILE_ROOT}/node_modules/some-lib/eslint.config.js`]: 'module.exports = [];\n',
      }),
    ).problems,
    [],
  );
});

test('an eslint-disable must name its rules and give a reason, and inline rule configuration fails, in comments and in strings', (t) => {
  const failing = [
    ['/* eslint-disable */', 'eslint-disable', 'every rule'],
    ['// eslint-disable-next-line', 'eslint-disable-next-line', 'every rule'],
    ['/* eslint-disable -- legacy screen */', 'eslint-disable -- legacy screen', 'every rule'],
    ['// eslint-disable-line no-console', 'eslint-disable-line no-console', 'no reason'],
    [
      '/* eslint-disable no-restricted-syntax */',
      'eslint-disable no-restricted-syntax',
      'no reason',
    ],
    [
      '// eslint-disable-next-line no-console --',
      'eslint-disable-next-line no-console --',
      'no reason',
    ],
    [
      '/*\n  eslint-disable-next-line no-console\n*/',
      'eslint-disable-next-line no-console',
      'no reason',
    ],
    [
      '/* eslint no-restricted-syntax: "off" */',
      'eslint no-restricted-syntax: \\"off\\"',
      'inline',
    ],
    [
      '/* eslint no-restricted-syntax: 0 -- tokens come later */',
      'eslint no-restricted-syntax: 0 -- tokens come later',
      'inline',
    ],
    [
      "const hint = '// eslint-disable-line no-console';",
      "eslint-disable-line no-console';",
      'no reason',
    ],
    // Phase 2E (phase-2D review, finding 1). ESLint drops empty and quote-only rule names (@eslint/plugin-kit
    // parseListConfig), and an empty list disables every rule (eslint lib/linter/linter.js createDisableDirectives).
    ['/* eslint-disable , -- legacy */', 'eslint-disable , -- legacy', 'every rule'],
    ['/* eslint-disable "" -- legacy */', 'eslint-disable \\"\\" -- legacy', 'every rule'],
    [
      '/* eslint-disable ,, \'\', "" -- legacy */',
      'eslint-disable ,, \'\', \\"\\" -- legacy',
      'every rule',
    ],
    [
      "// eslint-disable-next-line '' -- legacy",
      "eslint-disable-next-line '' -- legacy",
      'every rule',
    ],
    // Two comments back to back: the "/" that closes the first must not hide the start of the second.
    ['/* keep *//* eslint-disable */', 'eslint-disable', 'every rule'],
    ['/* keep */// eslint-disable-line', 'eslint-disable-line', 'every rule'],
    ['/* keep *//* eslint-disable no-console */', 'eslint-disable no-console', 'no reason'],
    // Phase 2F (phase-2E review, finding 2): a `//` comment ends at U+2028 and U+2029 as well as at CR and LF, so what
    // follows one is not its rule list or its reason (test 8 checks ESLint itself).
    [
      `const accent = '#ff0000'; // eslint-disable-line${LS}// no-restricted-syntax -- palette value`,
      'eslint-disable-line',
      'every rule',
    ],
    [
      `const accent = '#ff0000'; // eslint-disable-line${PS}// no-restricted-syntax -- palette value`,
      'eslint-disable-line',
      'every rule',
    ],
    [
      `// eslint-disable-next-line no-console${LS}// -- printed only in development builds`,
      'eslint-disable-next-line no-console',
      'no reason',
    ],
  ];
  const ending = {
    'every rule':
      ', which disables every rule: name the rules it disables, and give the reason after " -- "',
    'no reason':
      ', with no reason: give one after " -- ", since docs/23 §9 rule 3 allows no unexplained eslint-disable',
    inline: `, inline rule configuration, which changes a rule where the reviewed ${ESLINT_CONFIG} cannot see it: set rules in that config instead`,
  };
  for (const [comment, shown, kind] of failing) {
    const found = lint(
      mobile(t, { [SCREEN]: `export const a = 1;\n${comment}\nexport const b = 2;\n` }),
    ).problems;
    assert.deepEqual(found, [`${SCREEN}:2 has "${shown}"${ending[kind]}`], comment);
  }
  const passing = [
    '// eslint-disable-next-line no-console -- printed only in development builds',
    '/* eslint-disable no-restricted-syntax -- palette values are defined here */',
    '/* eslint-enable no-restricted-syntax */',
    '/* eslint-env node */',
    '// ESLint reads its rules from eslint.config.js.',
    '// See https://eslint.org/docs/latest/use/configure/rules.',
    '/* the eslint-disable rule above was removed */',
    // Phase 2E: named rules with a reason pass, however ESLint's list syntax writes them.
    '/* eslint-disable no-console, no-restricted-syntax -- generated palette values */',
    "// eslint-disable-next-line 'no-console' -- printed only in development builds",
    '/* eslint-disable "no-restricted-syntax", -- palette values are defined here */',
    '/* keep */// eslint-disable-line no-console -- printed only in development builds',
    '/* keep *//* eslint-disable no-console -- printed only in development builds */',
    // Phase 2F: a described disable followed by a separator and a note passes.
    `export const c = 3; // eslint-disable-line no-console -- printed only in development builds${LS}// a note`,
  ];
  for (const comment of passing) {
    assert.deepEqual(
      lint(mobile(t, { [SCREEN]: `export const a = 1;\n${comment}\nexport const b = 2;\n` }))
        .problems,
      [],
      comment,
    );
  }
});

test('the scan reads every linted file, in path and line order, and skips ignored, generated and non-source files', (t) => {
  const bare = '/* eslint-disable */\n';
  const root = mobile(t, {
    [`${MOBILE_ROOT}/app.config.ts`]: `export default {};\n${bare}`,
    [`${MOBILE_ROOT}/scripts/build.cjs`]: bare,
    [`${MOBILE_ROOT}/src/data/__tests__/store.test.ts`]: `${bare}// eslint-disable-next-line no-console\n`,
    [`${MOBILE_ROOT}/src/lib/tool.mjs`]: bare,
    [`${MOBILE_ROOT}/dist/bundle.js`]: bare,
    [`${MOBILE_ROOT}/coverage/lcov-report/prettify.js`]: bare,
    [`${MOBILE_ROOT}/.expo/types/router.d.ts`]: bare,
    [`${MOBILE_ROOT}/node_modules/some-lib/index.js`]: bare,
    [`${MOBILE_ROOT}/src/notes.md`]: bare,
  });
  const { problems, files } = lint(root);
  assert.deepEqual(
    problems.map((problem) => problem.slice(0, problem.indexOf(' '))),
    [
      `${MOBILE_ROOT}/app.config.ts:2`,
      `${MOBILE_ROOT}/scripts/build.cjs:1`,
      `${MOBILE_ROOT}/src/data/__tests__/store.test.ts:1`,
      `${MOBILE_ROOT}/src/data/__tests__/store.test.ts:2`,
      `${MOBILE_ROOT}/src/lib/tool.mjs:1`,
    ],
  );
  assert.equal(
    files,
    5,
    'app.config.ts, scripts/build.cjs, src/clean.ts, the test file and src/lib/tool.mjs; the pinned config is compared, not scanned',
  );
});

test('a linted file or the config that cannot be read, or a config that is a link, fails closed', (t) => {
  const root = mobile(t);
  const io = {
    list: (dir) => readdirSync(dir, { withFileTypes: true }),
    read: (file) => {
      if ([join(root, ESLINT_CONFIG), join(root, MOBILE_ROOT, 'src/clean.ts')].includes(file))
        throw denied();
      return readFileSync(file, 'utf8');
    },
  };
  assert.deepEqual(lint(root, io).problems, [
    `${ESLINT_CONFIG} cannot be read (EACCES: permission denied), so it cannot be compared with the reviewed config`,
    `${MOBILE_ROOT}/src/clean.ts cannot be read (EACCES: permission denied), so it cannot be checked for eslint-disable comments`,
  ]);
  const linked = mobile(t, { 'outside/eslint.config.js': REVIEWED_ESLINT_CONFIG });
  rmSync(join(linked, ESLINT_CONFIG));
  symlinkSync(join(linked, 'outside/eslint.config.js'), join(linked, ESLINT_CONFIG));
  assert.deepEqual(lint(linked).problems, [
    `${ESLINT_CONFIG} is not a regular file, so it cannot be compared with the reviewed config`,
  ]);
});

// Phase 2F (phase-2E review, finding 2): proved with the installed ESLint and the parsers it uses here, not only reasoned.
test('the installed ESLint ends a // comment at U+2028 and U+2029, so a blanket disable before one turns every rule off, and the scan refuses it', (t) => {
  const mobileRequire = createRequire(join(repoRoot, PACKAGE));
  const { Linter } = mobileRequire('eslint');
  // eslint-config-expo parses .ts and .tsx with @typescript-eslint/parser; .js, .mjs and .cjs use ESLint's own (espree).
  const tsParser = createRequire(mobileRequire.resolve('eslint-config-expo/flat'))(
    '@typescript-eslint/parser',
  );
  const linter = new Linter({ configType: 'flat' });
  const message = 'Use semantic theme colors.';
  const rules = {
    'no-restricted-syntax': [
      'error',
      { selector: 'Literal[value=/^#[a-fA-F0-9]{3,8}$/]', message },
    ],
  };
  for (const [filename, languageOptions] of [
    ['Screen.tsx', { parser: tsParser }],
    ['screen.js', {}],
  ]) {
    const config = [{ files: ['**/*.tsx', '**/*.js'], languageOptions, rules }];
    const messages = (code) =>
      linter.verify(code, config, filename).map((found) => `${found.line}: ${found.message}`);
    for (const separator of [LS, PS]) {
      const code = `export const a = 1;\nexport const accent = '#ff0000'; // eslint-disable-line${separator}// no-restricted-syntax -- palette value\n`;
      const where = `${filename}, U+${separator.codePointAt(0).toString(16).toUpperCase()}`;
      assert.deepEqual(
        messages(code.replace('eslint-disable-line', 'a note')),
        [`2: ${message}`],
        `${where}: the colour fails lint without the disable`,
      );
      assert.deepEqual(
        messages(code),
        [],
        `${where}: ESLint reads " eslint-disable-line" with no rules, so the colour passes`,
      );
      assert.deepEqual(
        lint(mobile(t, { [SCREEN]: code })).problems,
        [
          `${SCREEN}:2 has "eslint-disable-line", which disables every rule: name the rules it disables, and give the reason after " -- "`,
        ],
        where,
      );
    }
  }
});

// Phase 2F (phase-2D review, test gap): the mobile package.json's eslintrc keys are never skipped because it cannot be read.
test('a mobile package.json that is not JSON, not an object, not a regular file or unreadable fails closed, so its eslintConfig and eslintIgnore keys are never skipped', (t) => {
  const unchecked = 'so its eslintConfig and eslintIgnore keys cannot be checked';
  const notJson = lint(mobile(t, { [PACKAGE]: '{ "name": ' })).problems;
  assert.equal(notJson.length, 1, notJson.join('\n'));
  assert.match(
    notJson[0],
    new RegExp(`^${literal(`${PACKAGE} is not JSON (`)}.+${literal(`), ${unchecked}`)}$`),
  );
  for (const text of ['null\n', '[]\n', '"@fitlog/mobile"\n', '1\n', 'true\n']) {
    assert.deepEqual(
      lint(mobile(t, { [PACKAGE]: text })).problems,
      [`${PACKAGE} is not a JSON object, ${unchecked}`],
      text,
    );
  }
  const directory = mobile(t);
  rmSync(join(directory, PACKAGE));
  mkdirSync(join(directory, PACKAGE));
  assert.deepEqual(lint(directory).problems, [`${PACKAGE} is not a regular file, ${unchecked}`]);
  const linked = mobile(t, {
    'outside/package.json': JSON.stringify({ name: '@fitlog/mobile', eslintConfig: {} }),
  });
  rmSync(join(linked, PACKAGE));
  symlinkSync(join(linked, 'outside/package.json'), join(linked, PACKAGE));
  assert.deepEqual(lint(linked).problems, [`${PACKAGE} is not a regular file, ${unchecked}`]);
  const root = mobile(t);
  const io = {
    list: (dir) => readdirSync(dir, { withFileTypes: true }),
    read: (file) => {
      if (file === join(root, PACKAGE)) throw denied();
      return readFileSync(file, 'utf8');
    },
  };
  assert.deepEqual(lint(root, io).problems, [
    `${PACKAGE} cannot be read (EACCES: permission denied), ${unchecked}`,
  ]);
});
