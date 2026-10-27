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
import { TSCONFIGS } from './gate-wiring.mjs';
import {
  REASON_WORDS,
  SOURCE_ROOTS,
  TYPE_ROOTS,
  typeSuppressionProblems,
} from './type-suppression.mjs';

// Every fixture is a scratch directory under the OS temporary directory; the first two tests only read this repository.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const MOBILE = 'apps/mobile/src/features/gym/Screen.tsx';
const DOMAIN = 'packages/domain/src/progression.ts';
/** The files TypeScript type-checks: .ts, .tsx, .mts and .cts, declarations included, in any letter case. */
const TYPESCRIPT = /\.(?:[cm]?ts|tsx)$/i;
const UNCHECKED = 'so it cannot be checked for TypeScript suppression comments';
const denied = () => Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });
/** U+212A KELVIN SIGN, which toLowerCase() turns into "k". Written by code point, so the source shows it. */
const KELVIN = String.fromCodePoint(0x212a);
/** JavaScript's four line terminators, which a regular expression's `.` does not match: CR, LF, U+2028 and U+2029. */
const LINE_BREAKS = ['\r', '\n', String.fromCodePoint(0x2028), String.fromCodePoint(0x2029)];

/** Both packages with one clean source file each, plus these files. */
function packages(t, files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'fitlog-types-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const all = {
    'apps/mobile/src/clean.ts': 'export const clean = 1;\n',
    'packages/domain/src/clean.ts': 'export const clean = 1;\n',
    ...files,
  };
  for (const [path, text] of Object.entries(all)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}
const scan = (root, io) => typeSuppressionProblems(root, io);
/** The exact problem for each comment, so a test fails on a changed message as well as on a missed comment. */
const refusedText = {
  ignore: (at, found) =>
    `${at} has ${JSON.stringify(found)}, which switches off type checking for the next line and outlives the error it hides. Fix the type error, or use @ts-expect-error with a reason on the same line`,
  nocheck: (at, found) =>
    `${at} has ${JSON.stringify(found)}, which switches off type checking for the whole file. Remove it and fix the type errors`,
};
const unexplainedText = (at, found, reason) =>
  `${at} has ${JSON.stringify(found)} ${reason ? `with the reason ${JSON.stringify(reason)}` : 'with no reason'}: give a reason of at least ${REASON_WORDS} different words after it, on the same line and in the same comment, saying why the error is expected (TODO, FIXME, TBD, XXX and HACK do not count)`;
const declarationText = (path) =>
  `${path} is a declaration file in source. skipLibCheck is on in both packages, so TypeScript never type-checks it, and it can declare or loosen types without any suppression comment. Put the declarations in a checked .ts module, or change scripts/quality/type-suppression.mjs in a reviewed diff first`;
const utf16Text = (path, encoding, mark) =>
  `${path} starts with the ${encoding} byte-order mark ${mark}. TypeScript decodes such a file as UTF-16, but this scan reads source as UTF-8, so a suppression comment in it would go unseen. Save it as UTF-8`;
const notBytesText = (path) =>
  `${path} was not read as bytes, so its byte-order mark cannot be checked before decoding, ${UNCHECKED}`;
const javascriptText = (path) =>
  `${path} is JavaScript in source. TypeScript does not type-check it (checkJs is off), and coverage counts only TypeScript files, so it would escape strict types and coverage. Write it as .ts or .tsx, or change scripts/quality/type-suppression.mjs in a reviewed diff first`;
const inFile = (comment) => `export const a = 1;\n${comment}\nexport const b = 2;\n`;
/** The TypeScript each package's `tsc` runs, loaded from that package as its typecheck script resolves it. */
const typescriptOf = (dir) => createRequire(join(repoRoot, dir, 'package.json'))('typescript');

test('this repository holds no TypeScript suppression comment, and the scan reads every TypeScript file of both packages outside their installed node_modules', () => {
  const { problems, files } = scan(repoRoot);
  assert.deepEqual(problems, []);
  const onDisk = TYPE_ROOTS.flatMap((dir) =>
    readdirSync(join(repoRoot, dir), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && TYPESCRIPT.test(entry.name))
      .map((entry) => relative(join(repoRoot, dir), join(entry.parentPath, entry.name)).split(sep))
      .filter((segments) => segments[0] !== 'node_modules'),
  );
  assert.ok(onDisk.length > 0);
  assert.equal(files, onDisk.length);
});

test('the scanned packages are exactly the ones whose type checks pnpm check runs', () => {
  assert.deepEqual(TYPE_ROOTS, ['apps/mobile', 'packages/domain']);
  assert.equal(REASON_WORDS, 3);
  for (const config of Object.keys(TSCONFIGS)) {
    assert.ok(
      TYPE_ROOTS.some((dir) => config.startsWith(`${dir}/`)),
      `${config} type-checks files of a package this scan does not read`,
    );
  }
});

test('@ts-ignore and @ts-nocheck fail wherever they appear, in any letter case and in strings too, with file and line', (t) => {
  const refused = [
    ['// @ts-ignore', 2, '@ts-ignore', 'ignore'],
    ['//@ts-ignore', 2, '@ts-ignore', 'ignore'],
    ['/// @ts-ignore', 2, '@ts-ignore', 'ignore'],
    ['/* @ts-ignore */', 2, '@ts-ignore', 'ignore'],
    // TypeScript reads the last line of a block comment, so a JSDoc-style ignore takes effect.
    ['/**\n * The props type lags the library.\n * @ts-ignore */', 4, '@ts-ignore', 'ignore'],
    ['// @ts-ignore: the props type lags the library', 2, '@ts-ignore', 'ignore'],
    ['// @TS-IGNORE', 2, '@TS-IGNORE', 'ignore'],
    // TypeScript matches the directive as a prefix, so this still ignores the next line.
    ['// @ts-ignored until the library is fixed', 2, '@ts-ignore', 'ignore'],
    ["const hint = '@ts-ignore';", 2, '@ts-ignore', 'ignore'],
    ['// @ts-nocheck', 2, '@ts-nocheck', 'nocheck'],
    ['// @ts-nocheck: generated by the palette script', 2, '@ts-nocheck', 'nocheck'],
    // TypeScript lower-cases pragma names, so this switches checking off too.
    ['// @TS-NoCheck', 2, '@TS-NoCheck', 'nocheck'],
    ['/* @ts-nocheck */', 2, '@ts-nocheck', 'nocheck'],
    // Phase 2F (phase-2E review, finding 1): toLowerCase() turns the KELVIN SIGN, U+212A, into "k", so TypeScript reads
    // these as ts-nocheck too. A /i pattern without the u flag does not match U+212A to "k" (test 7 checks TypeScript).
    [`// @ts-nochec${KELVIN}`, 2, `@ts-nochec${KELVIN}`, 'nocheck'],
    [`// @TS-NOCHEC${KELVIN}: generated`, 2, `@TS-NOCHEC${KELVIN}`, 'nocheck'],
  ];
  for (const path of [MOBILE, DOMAIN]) {
    for (const [comment, line, found, kind] of refused) {
      assert.deepEqual(
        scan(packages(t, { [path]: inFile(comment) })).problems,
        [refusedText[kind](`${path}:${line}`, found)],
        comment,
      );
    }
  }
  const both = scan(
    packages(t, {
      [MOBILE]: '// @ts-nocheck\nexport const a = 1;\n// @ts-ignore\nexport const b: number = a;\n',
    }),
  ).problems;
  assert.deepEqual(
    both,
    [
      refusedText.nocheck(`${MOBILE}:1`, '@ts-nocheck'),
      refusedText.ignore(`${MOBILE}:3`, '@ts-ignore'),
    ],
    'every comment in a file, in line order',
  );
});

test('@ts-expect-error needs a reason of at least three different words after it, on its own line and in the same comment', (t) => {
  const unexplained = [
    ['// @ts-expect-error', ''],
    ['// @ts-expect-error:', ''],
    ['// @ts-expect-error -- ', ''],
    ['// @TS-EXPECT-ERROR', '', '@TS-EXPECT-ERROR'],
    ['// @ts-expect-error TODO', 'TODO'],
    ['// @ts-expect-error: TODO FIXME, fix later', 'TODO FIXME, fix later'],
    ['// @ts-expect-error TS2322 TS2345 TS7006', 'TS2322 TS2345 TS7006'],
    ['// @ts-expect-error the the the', 'the the the'],
    ['// @ts-expect-error a b c d', 'a b c d'],
    // The reason must be inside the same comment: text after its end, or on a later line, is not read.
    ['/* @ts-expect-error */ render(); // the router types omit dynamic segments', ''],
    ['/* @ts-expect-error\n   the router types omit dynamic segments */', ''],
    ['// @ts-expect-error the router types omit dynamic segments', ''],
    ["const hint = '@ts-expect-error';", "';"],
  ];
  for (const path of [MOBILE, DOMAIN]) {
    for (const [comment, reason, found = '@ts-expect-error'] of unexplained) {
      assert.deepEqual(
        scan(packages(t, { [path]: inFile(comment) })).problems,
        [unexplainedText(`${path}:2`, found, reason)],
        comment,
      );
    }
  }
  const explained = [
    "// @ts-expect-error: expo-router's typed routes omit dynamic segments",
    '// @ts-expect-error -- the generated client types lag the RPC contract',
    '/* @ts-expect-error React Native web types miss this prop */',
    '/**\n * Tested on purpose:\n * @ts-expect-error the guard must refuse a string here\n */',
    '// @ts-expect-error: TODO the router types omit dynamic segments',
    '// @ts-check',
    '// TypeScript suppression comments are refused by the quality guard.',
    '// ts-ignore without the at sign is prose, not a directive',
  ];
  for (const path of [MOBILE, DOMAIN]) {
    for (const comment of explained)
      assert.deepEqual(scan(packages(t, { [path]: inFile(comment) })).problems, [], comment);
  }
});

test("the scan reads every TypeScript file in both packages, hidden, generated or nested, and skips only each package's installed node_modules and files TypeScript does not check", (t) => {
  const ignored = '// @ts-ignore\nexport {};\n';
  const root = packages(t, {
    'apps/mobile/app.config.ts': ignored,
    'apps/mobile/.expo/types/router.d.ts': ignored,
    'apps/mobile/dist/types.ts': ignored,
    'apps/mobile/scripts/palette.mts': ignored,
    'apps/mobile/src/Upper.TSX': ignored,
    'apps/mobile/src/node_modules/local.ts': ignored,
    'apps/mobile/src/screen.tsx': ignored,
    'packages/domain/scripts/tool.cts': ignored,
    'packages/domain/src/types.d.ts': ignored,
    // Not read: installed dependencies, JavaScript (checkJs is off, so it is never type-checked) and other files.
    'apps/mobile/node_modules/some-lib/index.d.ts': ignored,
    'packages/domain/node_modules/some-lib/index.ts': ignored,
    'apps/mobile/jest.config.cjs': ignored,
    'apps/mobile/src/legacy.js': ignored,
    'apps/mobile/src/notes.md': ignored,
  });
  const { problems, files } = scan(root);
  assert.deepEqual(
    problems.map((problem) => problem.slice(0, problem.indexOf(' '))),
    [
      'apps/mobile/.expo/types/router.d.ts:1',
      'apps/mobile/app.config.ts:1',
      'apps/mobile/dist/types.ts:1',
      'apps/mobile/scripts/palette.mts:1',
      // Phase 2G (phase-2F review, finding 3): JavaScript under src/ is refused as such, and its comments are not read (test 10).
      'apps/mobile/src/Upper.TSX:1',
      'apps/mobile/src/legacy.js',
      'apps/mobile/src/node_modules/local.ts:1',
      'apps/mobile/src/screen.tsx:1',
      // Phase 2F (R16): a declaration file under src/ is refused as such, before its comments are read (test 8).
      'packages/domain/scripts/tool.cts:1',
      'packages/domain/src/types.d.ts',
      'packages/domain/src/types.d.ts:1',
    ],
  );
  assert.equal(files, 11, 'the nine files above and the two clean ones');
});

test('a missing package, a link, a folder that cannot be listed and a file that cannot be read each fail closed', (t) => {
  const missing = packages(t);
  rmSync(join(missing, 'packages/domain'), { recursive: true });
  assert.deepEqual(scan(missing).problems, [`packages/domain is missing, ${UNCHECKED}`]);

  const linked = packages(t, {
    'outside/hidden.ts': '// @ts-nocheck\nexport {};\n',
    'outside/shared/index.ts': '// @ts-nocheck\nexport {};\n',
  });
  symlinkSync(join(linked, 'outside/hidden.ts'), join(linked, 'apps/mobile/src/linked.ts'));
  symlinkSync(join(linked, 'outside/shared'), join(linked, 'packages/domain/src/shared'));
  const link = (path) =>
    `${path} is not a regular file or directory, ${UNCHECKED}; TypeScript follows links, so a link can bring in a file this scan never reads`;
  assert.deepEqual(scan(linked).problems, [
    link('apps/mobile/src/linked.ts'),
    link('packages/domain/src/shared'),
  ]);

  // Phase 2G: an injected reader goes through the same byte path as the real one (readFileSync with no encoding).
  const root = packages(t, { 'apps/mobile/app.config.ts': '// @ts-ignore\nexport {};\n' });
  const io = {
    list: (dir) => {
      if (dir === join(root, 'apps/mobile/src')) throw denied();
      return readdirSync(dir, { withFileTypes: true });
    },
    read: (file) => {
      if (file === join(root, 'packages/domain/src/clean.ts')) throw denied();
      return readFileSync(file);
    },
  };
  assert.deepEqual(scan(root, io).problems, [
    refusedText.ignore('apps/mobile/app.config.ts:1', '@ts-ignore'),
    `apps/mobile/src cannot be listed (EACCES: permission denied), ${UNCHECKED}`,
    `packages/domain/src/clean.ts cannot be read (EACCES: permission denied), ${UNCHECKED}`,
  ]);

  // A reader that hands back decoded text, so the byte-order mark is already gone, fails closed: it is never skipped quietly.
  const decoded = {
    list: (dir) => readdirSync(dir, { withFileTypes: true }),
    read: (file) => readFileSync(file, 'utf8'),
  };
  assert.deepEqual(
    scan(root, decoded).problems,
    ['apps/mobile/app.config.ts', 'apps/mobile/src/clean.ts', 'packages/domain/src/clean.ts'].map(
      notBytesText,
    ),
  );
});

// Phase 2F (phase-2E review, finding 1): proved with the installed TypeScript, not only reasoned from its source.
test('every one-character spelling the installed TypeScript reads as ts-nocheck is refused, the Kelvin sign among them', (t) => {
  const NAME = 'ts-nocheck';
  // TypeScript lower-cases a pragma's name with toLowerCase() (addPragmaForMatch), so any character that lower-cases to
  // part of the name can stand in for it. Every such character, in every place it fits:
  const spellings = [];
  for (let code = 0; code <= 0x10ffff; code += 1) {
    if (code >= 0xd800 && code <= 0xdfff) continue;
    const char = String.fromCodePoint(code);
    const lower = char.toLowerCase();
    if (lower === char) continue;
    for (let at = NAME.indexOf(lower); at >= 0; at = NAME.indexOf(lower, at + 1))
      spellings.push(`@${NAME.slice(0, at)}${char}${NAME.slice(at + lower.length)}`);
  }
  assert.ok(
    spellings.includes(`@ts-nochec${KELVIN}`),
    'toLowerCase() maps the KELVIN SIGN, U+212A, to "k"',
  );
  const shown = (text) =>
    [...text]
      .map((char) =>
        char.codePointAt(0) > 0x7e ? `U+${char.codePointAt(0).toString(16).toUpperCase()}` : char,
      )
      .join('');
  t.diagnostic(`${spellings.length} spellings: ${spellings.map(shown).join(' ')}`);
  for (const dir of TYPE_ROOTS) {
    const ts = typescriptOf(dir);
    const off = (spelling) =>
      ts.createSourceFile(
        'screen.ts',
        `// ${spelling}\nexport const a: number = 'text';\n`,
        ts.ScriptTarget.Latest,
      ).checkJsDirective?.enabled === false;
    assert.ok(
      off('@ts-nocheck') && !off('@ts-check') && !off('@ts-nocheckx'),
      `TypeScript ${ts.version} in ${dir} no longer reads ts-nocheck as before: re-read how it reads pragmas before trusting this scan`,
    );
    // TypeScript switches type checking off for every one of them (canIncludeBindAndCheckDiagnostics), and so for both at once.
    assert.deepEqual(
      spellings.filter((spelling) => !off(spelling)),
      [],
      `TypeScript ${ts.version} in ${dir}`,
    );
    assert.ok(off(`@TS-NOCHEC${KELVIN}`));
  }
  const all = [...spellings, `@TS-NOCHEC${KELVIN}`];
  for (const path of [MOBILE, DOMAIN]) {
    const text = all.map((spelling) => `// ${spelling}\n`).join('');
    assert.deepEqual(
      scan(packages(t, { [path]: text })).problems,
      all.map((spelling, index) => refusedText.nocheck(`${path}:${index + 1}`, spelling)),
      path,
    );
  }
});

// Phase 2F (R16, Codex's phase-2F brief): narrowly, declaration files under each package's src/ only.
test('a declaration file under apps/mobile/src or packages/domain/src fails, by the names the installed TypeScript gives them, and one outside src/, such as a generated expo-env.d.ts, does not', (t) => {
  assert.deepEqual(SOURCE_ROOTS, ['apps/mobile/src', 'packages/domain/src']);
  const ts = typescriptOf('apps/mobile');
  const isDeclaration = (name) =>
    ts.createSourceFile(name, '', ts.ScriptTarget.Latest).isDeclarationFile;
  // Phase 2G (phase-2F review, finding 1): TypeScript puts no limit on what lies between ".d." and ".ts", line breaks
  // included, so each of the four line terminators is tried there. The near misses beside them are ordinary files.
  const declarations = [
    'types.d.ts',
    'env.d.mts',
    'env.d.cts',
    'styles.d.css.ts',
    'data.d.json.ts',
    ...LINE_BREAKS.flatMap((line) => [`loose.d.${line}.ts`, `styles.d.c${line}ss.ts`]),
  ];
  const ordinary = [
    'types.ts',
    'd.ts',
    'odd.ts',
    'env.d.tsx',
    'index.mts',
    'tool.cts',
    ...LINE_BREAKS.flatMap((line) => [
      `loose.d${line}.ts`,
      `loose.d.${line}.tsx`,
      `loose.d.${line}.mts`,
    ]),
  ];
  for (const name of declarations)
    assert.equal(
      isDeclaration(name),
      true,
      `TypeScript ${ts.version} reads ${JSON.stringify(name)} as a declaration file`,
    );
  for (const name of ordinary)
    assert.equal(
      isDeclaration(name),
      false,
      `TypeScript ${ts.version} reads ${JSON.stringify(name)} as a source file`,
    );
  const loose = 'export type Loose = any;\n';
  // The line-break names reach tsc: each package's own include, read by the installed TypeScript, lists them.
  const broken = packages(
    t,
    Object.fromEntries(
      SOURCE_ROOTS.flatMap((dir) =>
        LINE_BREAKS.map((line) => [`${dir}/loose.d.${line}.ts`, loose]),
      ),
    ),
  );
  for (const dir of TYPE_ROOTS) {
    const { include } = JSON.parse(readFileSync(join(repoRoot, dir, 'tsconfig.json'), 'utf8'));
    const { fileNames } = ts.parseJsonConfigFileContent({ include }, ts.sys, join(broken, dir));
    for (const line of LINE_BREAKS)
      assert.ok(
        fileNames.some((file) => file.endsWith(`/src/loose.d.${line}.ts`)),
        `${dir} includes ${JSON.stringify(`loose.d.${line}.ts`)}`,
      );
  }
  const expected = SOURCE_ROOTS.flatMap((dir) =>
    LINE_BREAKS.map((line) => declarationText(`${dir}/loose.d.${line}.ts`)),
  );
  assert.deepEqual([...scan(broken).problems].sort(), expected.sort());
  for (const dir of SOURCE_ROOTS) {
    // Upper case too: a superset, since a case-insensitive file system finds Upper.D.TS where Upper.d.ts is named.
    for (const name of [...declarations, 'Upper.D.TS']) {
      for (const path of [`${dir}/${name}`, `${dir}/features/gym/${name}`]) {
        assert.deepEqual(
          scan(packages(t, { [path]: loose })).problems,
          [declarationText(path)],
          path,
        );
      }
    }
    for (const name of ordinary)
      assert.deepEqual(
        scan(packages(t, { [`${dir}/${name}`]: loose })).problems,
        [],
        `${dir}/${name}`,
      );
  }
  // Outside src/ they are read for comments, but not refused: expo writes expo-env.d.ts, and .expo/types holds generated routes.
  const outside = packages(t, {
    'apps/mobile/expo-env.d.ts': '/// <reference types="expo/types" />\n',
    'apps/mobile/.expo/types/router.d.ts': loose,
    'apps/mobile/types/env.d.ts': loose,
    'apps/mobile/srcs/env.d.ts': loose,
    'packages/domain/types.d.ts': loose,
  });
  assert.deepEqual(scan(outside), { problems: [], files: 7 });
  // A declaration file in source is still read for comments.
  assert.deepEqual(scan(packages(t, { 'apps/mobile/src/env.d.ts': '// @ts-nocheck\n' })).problems, [
    declarationText('apps/mobile/src/env.d.ts'),
    refusedText.nocheck('apps/mobile/src/env.d.ts:1', '@ts-nocheck'),
  ]);
});

// Phase 2G (phase-2F review, finding 2): proved with the installed TypeScript's own file reader, on the bytes on disk.
test('a TypeScript file that starts with a UTF-16 byte-order mark fails before it is decoded, since the installed TypeScript reads it as UTF-16 and this scan reads UTF-8', (t) => {
  const text = "// @ts-nocheck\nexport const a: number = 'text';\n";
  const utf16le = Buffer.from(text, 'utf16le');
  const encodings = [
    ['UTF-16LE', 'FF FE', Buffer.concat([Buffer.from([0xff, 0xfe]), utf16le])],
    [
      'UTF-16BE',
      'FE FF',
      Buffer.concat([Buffer.from([0xfe, 0xff]), Buffer.from(utf16le).swap16()]),
    ],
  ];
  // The review's file (a test fixture in a subfolder of domain source), a mobile screen, and a mobile file outside src/.
  const paths = [
    'packages/domain/src/sub/fixtures.test.ts',
    'apps/mobile/src/features/gym/Screen.tsx',
    'apps/mobile/app.config.ts',
  ];
  for (const [encoding, mark, bytes] of encodings) {
    for (const path of paths) {
      const root = packages(t, { [path]: bytes });
      const dir = TYPE_ROOTS.find((pkg) => path.startsWith(`${pkg}/`));
      const ts = typescriptOf(dir);
      const decoded = ts.sys.readFile(join(root, path));
      assert.equal(
        decoded,
        text,
        `TypeScript ${ts.version} in ${dir} decodes ${encoding} after its byte-order mark`,
      );
      assert.equal(
        ts.createSourceFile(path, decoded, ts.ScriptTarget.Latest).checkJsDirective?.enabled,
        false,
        'so its @ts-nocheck switches type checking off',
      );
      assert.ok(
        !readFileSync(join(root, path), 'utf8').includes('@ts-nocheck'),
        'read as UTF-8, the comment is not there to find',
      );
      // The scan's own reader, none injected: refused before decoding, so the hidden comment is not reported as well.
      assert.deepEqual(
        scan(root).problems,
        [utf16Text(path, encoding, mark)],
        `${encoding} ${path}`,
      );
    }
  }
  // Every other file TypeScript reads as UTF-8, as the scan does: past a UTF-8 byte-order mark, and with FF FE anywhere but the start.
  const utf8Mark = Buffer.from([0xef, 0xbb, 0xbf]);
  const root = packages(t, {
    'apps/mobile/src/marked.ts': Buffer.concat([utf8Mark, Buffer.from(text)]),
    'apps/mobile/src/marked-clean.ts': Buffer.concat([
      utf8Mark,
      Buffer.from('export const a = 1;\n'),
    ]),
    'apps/mobile/src/later.ts': Buffer.concat([
      Buffer.from('export const a = 1;\n// '),
      Buffer.from([0xff, 0xfe]),
      Buffer.from('\n'),
    ]),
    'apps/mobile/src/short.ts': Buffer.from([0xff]),
  });
  const ts = typescriptOf('apps/mobile');
  assert.equal(
    ts.createSourceFile(
      'marked.ts',
      ts.sys.readFile(join(root, 'apps/mobile/src/marked.ts')),
      ts.ScriptTarget.Latest,
    ).checkJsDirective?.enabled,
    false,
  );
  assert.deepEqual(scan(root), {
    problems: [refusedText.nocheck('apps/mobile/src/marked.ts:1', '@ts-nocheck')],
    files: 6,
  });
});

// Phase 2G (phase-2F review, finding 3): strict TypeScript in source, shown with the installed TypeScript and the real mobile tsconfig.
test('a JavaScript file under apps/mobile/src or packages/domain/src fails, since TypeScript does not type-check it and coverage does not count it, and one outside src/ does not', (t) => {
  const ts = typescriptOf('apps/mobile');
  const unrecoverable = (diagnostic) =>
    assert.fail(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
  const { options } = ts.getParsedCommandLineOfConfigFile(
    join(repoRoot, 'apps/mobile/tsconfig.json'),
    {},
    { ...ts.sys, onUnRecoverableConfigFileDiagnostic: unrecoverable },
  );
  assert.equal(options.allowJs, true, 'expo/tsconfig.base turns allowJs on');
  assert.notEqual(options.checkJs, true, 'and checkJs stays off');
  // The same type error in a .ts and a .js file: the installed TypeScript, with the mobile options, reports it only in the .ts one.
  const body = 'const count = 1;\nexport const label = count.toUpperCase();\n';
  const shown = packages(t, { 'apps/mobile/src/typed.ts': body, 'apps/mobile/src/loose.js': body });
  const at = (name) => join(shown, 'apps/mobile/src', name);
  const program = ts.createProgram({
    rootNames: [at('typed.ts'), at('loose.js')],
    options: { ...options, types: [], noEmit: true },
  });
  const errors = (name) =>
    program
      .getSemanticDiagnostics(program.getSourceFile(at(name)))
      .map((diagnostic) => diagnostic.code);
  assert.deepEqual(errors('typed.ts'), [2339], 'Property toUpperCase does not exist on type 1');
  assert.deepEqual(errors('loose.js'), []);

  assert.deepEqual(SOURCE_ROOTS, ['apps/mobile/src', 'packages/domain/src']);
  const javascript = [
    'legacy.js',
    'Screen.jsx',
    'tool.mjs',
    'tool.cjs',
    'Upper.JS',
    'Upper.JSX',
    'Upper.MJS',
    'Upper.CJS',
  ];
  for (const dir of SOURCE_ROOTS) {
    for (const name of javascript) {
      for (const path of [`${dir}/${name}`, `${dir}/features/gym/${name}`]) {
        // Not counted as a TypeScript file and not read for comments: the refusal is the whole report.
        assert.deepEqual(
          scan(packages(t, { [path]: "// @ts-nocheck\nexport const color = '#ff0000';\n" })),
          { problems: [javascriptText(path)], files: 2 },
          path,
        );
      }
    }
  }
  // Outside src/, and other files in it, pass: configs, scripts, the prefix trap srcs/, JSON, notes and snapshots.
  const passing = packages(t, {
    'apps/mobile/jest.config.cjs': 'module.exports = {};\n',
    'apps/mobile/eslint.config.js': 'module.exports = [];\n',
    'apps/mobile/scripts/palette.mjs': 'export {};\n',
    'apps/mobile/srcs/legacy.js': 'export {};\n',
    'packages/domain/scripts/tool.cjs': 'module.exports = {};\n',
    'apps/mobile/src/data.json': '{}\n',
    'apps/mobile/src/legacy.js.md': 'notes\n',
    'apps/mobile/src/__snapshots__/Screen.test.tsx.snap': 'exports[`a`] = `b`;\n',
    'packages/domain/src/legacy.json': '{}\n',
  });
  assert.deepEqual(scan(passing), { problems: [], files: 2 });
});
