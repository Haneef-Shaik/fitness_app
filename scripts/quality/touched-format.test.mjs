import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { devNull, tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import { BASELINE_ENV, gitRunner } from './coverage-ratchet.mjs';
import {
  GENERATED,
  PRETTIER_CONFIG,
  PRETTIER_OPTIONS,
  PRETTIER_VERSION,
  RULE,
  checkTouchedFormat,
  touchedFiles,
} from './touched-format.mjs';

// QA-9 phase 3: Prettier on touched files only. Every Git fixture is a scratch repository under the OS temporary
// directory; nothing here writes to this repository. What counts as formatted comes from the installed Prettier itself.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
/** No inherited Git location, CI flag, baseline or test-runner context, and no user or system Git configuration. */
const isolated = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      !key.startsWith('GIT_') &&
      !['CI', 'GITHUB_ACTIONS', BASELINE_ENV, 'NODE_TEST_CONTEXT'].includes(key),
  ),
);
const gitEnv = {
  ...isolated,
  GIT_CONFIG_GLOBAL: devNull,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Fixture',
  GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
  GIT_COMMITTER_NAME: 'Fixture',
  GIT_COMMITTER_EMAIL: 'fixture@example.invalid',
};
const git = (dir, ...args) =>
  execFileSync('git', ['-C', dir, ...args], {
    env: gitEnv,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
const scratch = (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'fitlog-format-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const write = (root, path, content) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
};
const commitAll = (root, message) => {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', message);
};
const runner = gitRunner({ env: gitEnv });
const select = (root, env = {}) => touchedFiles({ root, env, git: runner });
const verify = (root, env = {}, formatter = undefined) =>
  checkTouchedFormat({ root, env, git: runner, ...(formatter ? { formatter } : {}) });
const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Writes one file, runs fn, then restores the file byte for byte. */
async function withText(root, path, text, fn) {
  const original = readFileSync(join(root, path));
  write(root, path, text);
  try {
    return await fn();
  } finally {
    write(root, path, original);
  }
}

const FORMATTED = "export const answer = { value: 42, label: 'answer' };\n";
const UNFORMATTED = 'export const answer = {value:42,label:"answer"}\n';
const FORMATTED_TSX = 'export const Screen = () => <Text>hi</Text>;\n';
const FORMATTED_CJS = 'module.exports = { answer: 42 };\n';
/** A space, a non-ASCII letter and an upper-case extension; and a quote, a tab and a line break, which only -z output keeps. */
const UNICODE = `apps/mobile/src/Screen ${String.fromCodePoint(0xfc)}ber.TSX`;
const ODD = 'scripts/odd "name"\twith\nbreaks.mjs';
const notFormatted = (path) =>
  new RegExp(
    `^${literal(`${path} is not formatted as Prettier ${PRETTIER_VERSION} formats it with ${PRETTIER_CONFIG}`)}`,
    'm',
  );

/** This module exactly as this repository holds it: committed at a base, it puts the format rule in force there. */
const ruleText = readFileSync(join(repoRoot, 'scripts/quality/touched-format.mjs'));

/**
 * main holds the format rule, the pinned config, unformatted files no change touches, and the files the branch edits,
 * renames and deletes. The branch commits an edit, a rename, a deletion, new source with awkward names, a binary, a Markdown file,
 * the regenerated types and a force-added node_modules file. main then moves on with a file of its own. Finally the work
 * tree gains an unstaged edit, a staged new file and an untracked file.
 */
function changeRepo(t) {
  const root = scratch(t);
  git(root, 'init', '-q', '-b', 'main');
  write(root, '.gitignore', 'node_modules/\n');
  write(root, PRETTIER_CONFIG, `${JSON.stringify(PRETTIER_OPTIONS, null, 2)}\n`);
  write(root, RULE, ruleText);
  write(root, 'apps/mobile/src/kept.ts', UNFORMATTED);
  write(root, 'apps/mobile/src/edited.ts', FORMATTED);
  write(root, 'apps/mobile/src/old name.ts', FORMATTED);
  write(root, 'packages/domain/src/gone.ts', UNFORMATTED);
  write(root, GENERATED[0], UNFORMATTED);
  write(root, 'scripts/tool.mjs', FORMATTED);
  commitAll(root, 'base');
  git(root, 'checkout', '-q', '-b', 'work');
  write(root, 'apps/mobile/src/edited.ts', `${FORMATTED}export const more = 1;\n`);
  git(root, 'mv', 'apps/mobile/src/old name.ts', 'apps/mobile/src/renamed file.ts');
  git(root, 'rm', '-q', 'packages/domain/src/gone.ts');
  write(root, UNICODE, FORMATTED_TSX);
  write(root, ODD, FORMATTED);
  write(
    root,
    'assets/logo.png',
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff]),
  );
  write(root, 'docs/notes.md', '*  unformatted   markdown*\n');
  write(root, GENERATED[0], `${UNFORMATTED}// regenerated\n`);
  write(root, 'apps/mobile/node_modules/pkg/index.js', UNFORMATTED);
  git(root, 'add', '-f', 'apps/mobile/node_modules/pkg/index.js');
  commitAll(root, 'work');
  git(root, 'checkout', '-q', 'main');
  write(root, 'apps/mobile/src/later.ts', UNFORMATTED);
  // main edits a file the branch never touched; measured from main's tip, it would look touched.
  write(root, 'apps/mobile/src/kept.ts', `${UNFORMATTED}export const editedOnMain = 1;\n`);
  commitAll(root, 'main moves on');
  git(root, 'checkout', '-q', 'work');
  write(root, 'scripts/tool.mjs', `${FORMATTED}export const edited = true;\n`);
  write(root, 'scripts/staged.cjs', FORMATTED_CJS);
  git(root, 'add', 'scripts/staged.cjs');
  write(root, 'apps/mobile/src/untracked.ts', UNFORMATTED);
  return root;
}
const TOUCHED = [
  UNICODE,
  'apps/mobile/src/edited.ts',
  'apps/mobile/src/renamed file.ts',
  ODD,
  'scripts/staged.cjs',
  'scripts/tool.mjs',
];
const IGNORED = {
  deleted: ['apps/mobile/src/old name.ts', 'packages/domain/src/gone.ts'],
  notSource: ['assets/logo.png', 'docs/notes.md'],
  generated: [GENERATED[0]],
  vendor: ['apps/mobile/node_modules/pkg/index.js'],
};

test('the fixture texts are what the installed Prettier says they are', async () => {
  const at = (path) => ({ ...PRETTIER_OPTIONS, filepath: path });
  assert.equal(prettier.version, PRETTIER_VERSION);
  for (const path of ['a.ts', 'a.mjs', 'a.tsx']) {
    assert.equal(await prettier.check(FORMATTED, at(path)), true, path);
    assert.equal(await prettier.check(UNFORMATTED, at(path)), false, path);
  }
  assert.equal(await prettier.check(FORMATTED_TSX, at(UNICODE)), true);
  assert.equal(await prettier.check(FORMATTED_CJS, at('a.cjs')), true);
  assert.equal(await prettier.format(UNFORMATTED, at('a.ts')), FORMATTED);
});

test('the touched files are the tracked JavaScript and TypeScript files added, modified or renamed since the fork from main, committed or not', (t) => {
  const root = changeRepo(t);
  const fork = git(root, 'merge-base', 'main', 'HEAD');
  assert.notEqual(fork, git(root, 'rev-parse', 'main'), 'main moved on after the fork');
  const touched = select(root);
  assert.equal(touched.base, fork);
  assert.equal(touched.label, `main@${fork.slice(0, 12)}`);
  assert.deepEqual(touched.files, TOUCHED);
  assert.deepEqual(touched.ignored, IGNORED);
  assert.deepEqual(touched.problems, []);
});

test('only touched files are checked: untouched, generated, vendored, untracked and main-only files stay unformatted and pass', async (t) => {
  const root = changeRepo(t);
  const clean = await verify(root);
  assert.deepEqual(clean.problems, []);
  assert.match(
    clean.summary,
    /^Formatting verified: the 6 touched JavaScript and TypeScript files match Prettier 3\.6\.2 with \.prettierrc\.json\. Base: main@[0-9a-f]{12}\. Not checked: 2 deleted, 2 not JavaScript or TypeScript, 1 generated, 1 under node_modules\./,
  );
  for (const path of [
    'apps/mobile/src/kept.ts',
    GENERATED[0],
    'apps/mobile/node_modules/pkg/index.js',
    'apps/mobile/src/untracked.ts',
  ]) {
    assert.equal(
      readFileSync(join(root, path), 'utf8').startsWith(UNFORMATTED),
      true,
      `${path} was left as it was`,
    );
  }
});

test('an unformatted touched file fails by name, whether committed, renamed, staged or unstaged, and passes once Prettier formats it', async (t) => {
  const root = changeRepo(t);
  for (const path of [
    'apps/mobile/src/edited.ts',
    'apps/mobile/src/renamed file.ts',
    UNICODE,
    'scripts/staged.cjs',
    'scripts/tool.mjs',
  ]) {
    await withText(root, path, UNFORMATTED, async () => {
      const { problems } = await verify(root);
      assert.equal(problems.length, 1, problems.join('\n'));
      assert.match(problems[0], notFormatted(path));
      write(
        root,
        path,
        await prettier.format(UNFORMATTED, { ...PRETTIER_OPTIONS, filepath: join(root, path) }),
      );
      assert.deepEqual((await verify(root)).problems, [], `${path} once formatted`);
    });
  }
  await withText(root, ODD, UNFORMATTED, async () => {
    assert.match((await verify(root)).problems.join('\n'), notFormatted(JSON.stringify(ODD)));
  });
});

test('a touched file Prettier cannot parse fails closed', async (t) => {
  const root = changeRepo(t);
  await withText(root, 'scripts/tool.mjs', 'export const = ;\n', async () => {
    assert.match(
      (await verify(root)).problems.join('\n'),
      /^scripts\/tool\.mjs could not be parsed by Prettier 3\.6\.2 \(/m,
    );
  });
});

test('no Prettier config, ignore file, editorconfig, package.json key or pragma can weaken the check; the root config must stay the pinned options', async (t) => {
  const root = changeRepo(t);
  const tool = join(root, 'scripts/tool.mjs');
  write(root, '.prettierignore', '*\n');
  write(root, 'scripts/.prettierrc', '{ "requirePragma": true }\n');
  write(root, '.editorconfig', 'root = true\n[*]\nindent_style = tab\nmax_line_length = off\n');
  write(root, 'package.json', '{ "prettier": { "requirePragma": true } }\n');
  git(root, 'add', '.prettierignore', 'scripts/.prettierrc', '.editorconfig', 'package.json');
  const noformat = `/** @noformat */\n${UNFORMATTED}`;
  // Each of these would switch Prettier off for the file where a tool reads it: the ignore file, the nested config, and
  // the pragma under checkIgnorePragma.
  assert.equal(
    (await prettier.getFileInfo(tool, { ignorePath: join(root, '.prettierignore') })).ignored,
    true,
  );
  assert.equal((await prettier.resolveConfig(tool, { editorconfig: true }))?.requirePragma, true);
  assert.equal(
    await prettier.check(noformat, {
      ...PRETTIER_OPTIONS,
      filepath: tool,
      checkIgnorePragma: true,
    }),
    true,
  );
  await withText(root, 'scripts/tool.mjs', noformat, async () => {
    const { problems } = await verify(root);
    assert.equal(problems.length, 1, problems.join('\n'));
    assert.match(problems[0], notFormatted('scripts/tool.mjs'));
  });
  const config = join(root, PRETTIER_CONFIG);
  const pinned = readFileSync(config);
  const loosened = [
    [
      `${JSON.stringify({ ...PRETTIER_OPTIONS, requirePragma: true })}\n`,
      /^\.prettierrc\.json is not the reviewed Prettier options/m,
    ],
    [
      `${JSON.stringify({ ...PRETTIER_OPTIONS, plugins: ['./relax.mjs'] })}\n`,
      /^\.prettierrc\.json is not the reviewed Prettier options/m,
    ],
    ['{ printWidth: 100 }\n', /^\.prettierrc\.json is not JSON/m],
  ];
  for (const [text, expected] of loosened) {
    await withText(root, PRETTIER_CONFIG, text, async () =>
      assert.match((await verify(root)).problems.join('\n'), expected),
    );
  }
  rmSync(config);
  assert.match((await verify(root)).problems.join('\n'), /^\.prettierrc\.json is missing/m);
  writeFileSync(config, pinned);
  assert.deepEqual((await verify(root)).problems, []);
});

test('the installed Prettier and this repository pin the same exact version and options as the check', async (t) => {
  const rootPackage = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  assert.equal(
    rootPackage.devDependencies.prettier,
    PRETTIER_VERSION,
    'the root devDependency is the exact pinned version',
  );
  assert.deepEqual(
    JSON.parse(readFileSync(join(repoRoot, PRETTIER_CONFIG), 'utf8')),
    PRETTIER_OPTIONS,
  );
  const root = changeRepo(t);
  const drifted = await verify(root, {}, { version: '3.6.1', check: prettier.check });
  assert.match(
    drifted.problems.join('\n'),
    /^Prettier 3\.6\.1 is installed, but this check is pinned to 3\.6\.2/m,
  );
});

test('the base is explicit and fails closed: CI needs the trusted baseline, locally main must exist, and no base means no check', (t) => {
  const root = changeRepo(t);
  const fork = git(root, 'merge-base', 'main', 'HEAD');
  const main = git(root, 'rev-parse', 'main');
  const head = git(root, 'rev-parse', 'HEAD');
  assert.throws(
    () => select(root, { GITHUB_ACTIONS: 'true' }),
    /FITLOG_CONTRACT_BASELINE must be set in CI to the trusted base commit \(it is unset\)/,
  );
  assert.throws(
    () => select(root, { CI: '1', [BASELINE_ENV]: '0'.repeat(40) }),
    /is the all-zero SHA/,
  );
  assert.throws(
    () => select(root, { CI: '1', [BASELINE_ENV]: 'f'.repeat(40) }),
    /^Error: FITLOG_CONTRACT_BASELINE=f{40} is not a commit in this repository/,
  );
  assert.throws(
    () => select(root, { GITHUB_ACTIONS: 'true', [BASELINE_ENV]: head }),
    /FITLOG_CONTRACT_BASELINE=[0-9a-f]{40} forks from HEAD itself/,
  );
  const ci = select(root, { GITHUB_ACTIONS: 'true', [BASELINE_ENV]: main });
  assert.equal(ci.label, `FITLOG_CONTRACT_BASELINE@${fork.slice(0, 12)}`);
  assert.deepEqual(ci.files, TOUCHED);
  // Locally a configured baseline replaces main. At HEAD, only the uncommitted changes to tracked files are touched.
  assert.deepEqual(select(root, { [BASELINE_ENV]: 'HEAD' }).files, [
    'scripts/staged.cjs',
    'scripts/tool.mjs',
  ]);
  const island = git(
    root,
    'commit-tree',
    git(root, 'rev-parse', 'HEAD^{tree}'),
    '-m',
    'unrelated history',
  );
  assert.throws(() => select(root, { [BASELINE_ENV]: island }), /shares no history with HEAD/);
  git(root, 'branch', '-m', 'main', 'trunk');
  assert.throws(
    () => select(root),
    /^Error: main is not a commit in this repository .*set FITLOG_CONTRACT_BASELINE/,
  );
  const outside = scratch(t);
  assert.throws(() => select(outside), /is not in a usable Git work tree/);
  assert.throws(
    () => select(outside, { CI: '1', [BASELINE_ENV]: main }),
    /is not in a usable Git work tree/,
  );
});

test('the rule applies from the commit that adds it, so a base that predates it never asks for files earlier commits touched', async (t) => {
  // As on the first hosted run: the event's base (origin/main) predates this rule, and the change also holds earlier
  // goals' commits, whose files were never formatted.
  const root = scratch(t);
  git(root, 'init', '-q', '-b', 'main');
  write(root, PRETTIER_CONFIG, `${JSON.stringify(PRETTIER_OPTIONS, null, 2)}\n`);
  write(root, 'apps/mobile/src/old.ts', UNFORMATTED);
  commitAll(root, 'main before the rule');
  git(root, 'checkout', '-q', '-b', 'work');
  write(root, 'apps/mobile/src/old.ts', `${UNFORMATTED}export const touchedBefore = 1;\n`);
  write(root, 'apps/mobile/src/before.ts', UNFORMATTED);
  commitAll(root, 'an earlier goal, before the rule');
  const uncommitted = select(root);
  assert.equal(uncommitted.base, git(root, 'rev-parse', 'HEAD'));
  assert.match(
    uncommitted.label,
    /, from HEAD@[0-9a-f]{12}: scripts\/quality\/touched-format\.mjs is not committed yet, so only uncommitted edits count$/,
  );
  assert.deepEqual(uncommitted.files, []);
  write(root, RULE, ruleText);
  write(root, 'apps/mobile/src/with-rule.ts', FORMATTED);
  commitAll(root, 'the rule arrives');
  write(root, 'apps/mobile/src/after.ts', FORMATTED);
  commitAll(root, 'a later goal');
  const main = git(root, 'rev-parse', 'main');
  const adding = git(root, 'rev-parse', 'HEAD~1');
  for (const env of [{}, { GITHUB_ACTIONS: 'true', [BASELINE_ENV]: main }]) {
    const touched = select(root, env);
    assert.equal(
      touched.base,
      git(root, 'rev-parse', 'HEAD~2'),
      'measured from the parent of the commit that adds the rule',
    );
    assert.match(
      touched.label,
      new RegExp(
        `@${main.slice(0, 12)}, from ${adding.slice(0, 12)}, which adds scripts/quality/touched-format\\.mjs$`,
      ),
    );
    assert.deepEqual(touched.files, [
      'apps/mobile/src/after.ts',
      'apps/mobile/src/with-rule.ts',
      RULE,
    ]);
    assert.deepEqual((await verify(root, env)).problems, [], JSON.stringify(env));
  }
  // A later commit that touches a file from before the rule brings that file under it.
  write(root, 'apps/mobile/src/before.ts', `${UNFORMATTED}export const touchedAfter = 1;\n`);
  commitAll(root, 'a later goal touches an old file');
  assert.match((await verify(root)).problems.join('\n'), notFormatted('apps/mobile/src/before.ts'));
});

test('a touched link or unmerged path fails closed and is never followed', (t) => {
  const root = changeRepo(t);
  symlinkSync('edited.ts', join(root, 'apps/mobile/src/link.ts'));
  git(root, 'add', 'apps/mobile/src/link.ts');
  assert.match(
    select(root).problems.join('\n'),
    /^apps\/mobile\/src\/link\.ts is not a regular file \(Git mode 120000, a symbolic link\)/m,
  );
  const conflict = scratch(t);
  git(conflict, 'init', '-q', '-b', 'main');
  write(conflict, 'a.ts', FORMATTED);
  commitAll(conflict, 'base');
  git(conflict, 'checkout', '-q', '-b', 'work');
  write(conflict, 'a.ts', 'export const a = 1;\n');
  commitAll(conflict, 'work');
  git(conflict, 'checkout', '-q', 'main');
  write(conflict, 'a.ts', 'export const a = 2;\n');
  commitAll(conflict, 'main');
  git(conflict, 'checkout', '-q', 'work');
  const merge = spawnSync('git', ['-C', conflict, 'merge', '-q', 'main'], {
    env: gitEnv,
    encoding: 'utf8',
  });
  assert.notEqual(merge.status, 0, 'the fixture merge conflicts');
  const halfMerged = select(conflict);
  assert.match(halfMerged.problems.join('\n'), /^a\.ts is unmerged; finish or abort the merge/m);
  assert.deepEqual(halfMerged.files, [], 'an unmerged path is never read as a touched file');
});

/** The quality modules this check imports, directly or through the guard. */
const IMPORTED = [
  'coverage-ratchet.mjs',
  'gate-wiring.mjs',
  'coverage-suppression.mjs',
  'config-inventory.mjs',
  'transform-config.mjs',
  'lint-scope.mjs',
  'type-suppression.mjs',
];
/**
 * Writes this check at `at` (in scripts/quality/, beside the modules it imports, copied from this repository), links the
 * installed Prettier, and returns a runner of that copy as the root `check` runs it. node_modules must be gitignored.
 */
function installCommand(root, at = RULE) {
  write(root, at, ruleText);
  for (const name of IMPORTED)
    write(root, `scripts/quality/${name}`, readFileSync(join(repoRoot, 'scripts/quality', name)));
  mkdirSync(join(root, 'node_modules'));
  symlinkSync(join(repoRoot, 'node_modules/prettier'), join(root, 'node_modules/prettier'), 'dir');
  return (env = {}) =>
    spawnSync(process.execPath, [join(root, at)], {
      cwd: root,
      env: { ...gitEnv, ...env },
      encoding: 'utf8',
    });
}

test('the command exits 0 when every touched file is formatted, and 1 naming each one that is not or when no base is found', async (t) => {
  const root = changeRepo(t);
  const run = installCommand(root);
  const clean = run();
  assert.equal(clean.status, 0, clean.stderr);
  assert.match(
    clean.stdout,
    /^Formatting verified: the 6 touched JavaScript and TypeScript files match Prettier 3\.6\.2 with \.prettierrc\.json\. Base: main@/,
  );
  await withText(root, 'scripts/tool.mjs', UNFORMATTED, () => {
    const failed = run();
    assert.equal(failed.status, 1, failed.stdout);
    assert.equal(failed.stdout, '');
    assert.match(
      failed.stderr,
      /^touched-format failed:\n- scripts\/tool\.mjs is not formatted as Prettier 3\.6\.2 formats it/,
    );
  });
  git(root, 'branch', '-m', 'main', 'trunk');
  const refused = run();
  assert.equal(refused.status, 1, refused.stdout);
  assert.match(refused.stderr, /^touched-format failed: main is not a commit in this repository/);
});

test('a Git failure while finding the touched files throws, and is never read as nothing touched or as a base without the rule', (t) => {
  /** The real git, except that one subcommand fails as a damaged repository or a missing object makes it fail. */
  const failing = (verb) => (dir, args) =>
    args[0] === verb
      ? { status: 128, stdout: Buffer.alloc(0), stderr: 'fatal: simulated failure' }
      : runner(dir, args);
  const root = changeRepo(t);
  for (const [verb, expected] of [
    [
      'diff',
      /^Error: git diff against main@[0-9a-f]{12} failed \(exit 128: fatal: simulated failure\)/,
    ],
    ['ls-files', /^Error: git ls-files -u failed \(exit 128: fatal: simulated failure\)/],
    [
      'ls-tree',
      /^Error: main@[0-9a-f]{12}: git ls-tree failed \(exit 128: fatal: simulated failure\)/,
    ],
  ]) {
    assert.throws(() => touchedFiles({ root, env: {}, git: failing(verb) }), expected, verb);
  }
  const early = scratch(t);
  git(early, 'init', '-q', '-b', 'main');
  write(early, 'a.ts', FORMATTED);
  commitAll(early, 'main before the rule');
  assert.throws(
    () => touchedFiles({ root: early, env: {}, git: failing('rev-list') }),
    /^Error: main@[0-9a-f]{12}: git rev-list failed \(exit 128: fatal: simulated failure\)/,
  );
});

// Phase 3B (review of phase 3, finding 1): the rule start can never be lost silently.

/** main holds an unformatted file and, when `check` names a path, this check there; a work branch touches the file. */
function laterChangeRepo(t, { check } = {}) {
  const root = scratch(t);
  git(root, 'init', '-q', '-b', 'main');
  write(root, '.gitignore', 'node_modules/\n');
  write(root, PRETTIER_CONFIG, `${JSON.stringify(PRETTIER_OPTIONS, null, 2)}\n`);
  write(root, 'apps/mobile/src/old.ts', UNFORMATTED);
  const run = check ? installCommand(root, check) : undefined;
  commitAll(root, check ? `main holds the check at ${check}` : 'main without the check');
  git(root, 'checkout', '-q', '-b', 'work');
  write(root, 'apps/mobile/src/old.ts', `${UNFORMATTED}export const touched = 1;\n`);
  commitAll(root, 'a later change touches an unformatted file');
  return { root, run, main: git(root, 'rev-parse', 'main') };
}
/** The refusal when no start of the rule can be found, for the fork point `named`@`commit`. */
const noStart = (named, commit) =>
  new RegExp(
    `^Error: ${named}@${commit.slice(0, 12)}: neither this fork point nor any commit after it up to HEAD holds ${literal(RULE)}`,
  );

test("RULE is this module's own path in the repository and the path root check runs, so renaming or moving the check carries the rule start with it", () => {
  const own = fileURLToPath(new URL('./touched-format.mjs', import.meta.url));
  assert.equal(RULE, relative(repoRoot, own).split(sep).join('/'));
  const { scripts } = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  assert.match(scripts.check, new RegExp(`(?:^| && )node ${literal(RULE)} && `));
});

test('a renamed check still finds its rule at the fork point, locally and in CI, so later changes stay checked (review finding 1)', (t) => {
  // The review's scenario: a reviewed change renamed the check, main now holds it only under the new name, and a later
  // change touches an unformatted file. Run as the root `check` runs it, the renamed copy must still judge that file.
  const { root, run, main } = laterChangeRepo(t, { check: 'scripts/quality/format-check.mjs' });
  const envs = [
    ['main', {}],
    [BASELINE_ENV, { GITHUB_ACTIONS: 'true', [BASELINE_ENV]: main }],
  ];
  for (const [, env] of envs) {
    const failed = run(env);
    assert.equal(failed.status, 1, `${JSON.stringify(env)}: ${failed.stdout}`);
    assert.match(
      failed.stderr,
      /^touched-format failed:\n- apps\/mobile\/src\/old\.ts is not formatted as Prettier 3\.6\.2 formats it/,
    );
  }
  write(root, 'apps/mobile/src/old.ts', FORMATTED);
  commitAll(root, 'formatted');
  for (const [named, env] of envs) {
    const clean = run(env);
    assert.equal(clean.status, 0, `${JSON.stringify(env)}: ${clean.stderr}`);
    assert.match(
      clean.stdout,
      new RegExp(
        `^Formatting verified: the 1 touched JavaScript and TypeScript file matches Prettier 3\\.6\\.2 with \\.prettierrc\\.json\\. Base: ${named}@${main.slice(0, 12)}\\. No other`,
      ),
      'measured from the fork point, which holds the renamed check',
    );
  }
});

test('in CI the rule must have a start: a base without the check, and no commit after it adding the check, fails instead of checking nothing', async (t) => {
  const { root, main } = laterChangeRepo(t);
  const ci = { GITHUB_ACTIONS: 'true', [BASELINE_ENV]: main };
  assert.throws(() => select(root, ci), noStart(BASELINE_ENV, main));
  await assert.rejects(verify(root, ci), noStart(BASELINE_ENV, main));
  // The check committed under a path RULE does not name, as a rename that left a hand-written RULE behind would leave it.
  write(root, 'scripts/quality/format-check.mjs', ruleText);
  commitAll(root, 'the check under another name');
  assert.throws(() => select(root, ci), noStart(BASELINE_ENV, main));
  // Locally the same history is the state before the check is committed: only uncommitted edits count, as labelled.
  const local = select(root);
  assert.equal(local.base, git(root, 'rev-parse', 'HEAD'));
  assert.match(
    local.label,
    new RegExp(
      `, from HEAD@[0-9a-f]{12}: ${literal(RULE)} is not committed yet, so only uncommitted edits count$`,
    ),
  );
});

test('locally, a committed check whose adding commit Git does not find fails closed, never falls back to uncommitted edits', (t) => {
  // main predates the check; the branch commits it. Real Git finds the commit that adds it.
  const { root, main } = laterChangeRepo(t);
  write(root, RULE, ruleText);
  commitAll(root, 'the check arrives');
  assert.equal(select(root).base, git(root, 'rev-parse', 'HEAD~1'));
  // A Git that lists no commit adding it, though HEAD holds it, as a rewritten or cut history could.
  const blind = (dir, args) =>
    args[0] === 'rev-list' ? { status: 0, stdout: Buffer.alloc(0), stderr: '' } : runner(dir, args);
  assert.throws(
    () => touchedFiles({ root, env: {}, git: blind }),
    new RegExp(
      `^Error: main@${main.slice(0, 12)}: HEAD holds ${literal(RULE)}, but no commit after this fork point adds it`,
    ),
  );
  assert.throws(
    () => touchedFiles({ root, env: { GITHUB_ACTIONS: 'true', [BASELINE_ENV]: main }, git: blind }),
    noStart(BASELINE_ENV, main),
  );
  // Whether HEAD holds the check must be read, never assumed.
  const unreadable = (dir, args) =>
    args[0] === 'ls-tree' && args.includes('HEAD')
      ? { status: 128, stdout: Buffer.alloc(0), stderr: 'fatal: simulated failure' }
      : blind(dir, args);
  assert.throws(
    () => touchedFiles({ root, env: {}, git: unreadable }),
    new RegExp(
      `^Error: main@${main.slice(0, 12)}: git ls-tree failed \\(exit 128: fatal: simulated failure\\)`,
    ),
  );
});

// Phase 3C (final review of phases 3 and 3B, finding 2): the commit shape the hosted run actually checks out.

test('a pull request is checked as GitHub checks it out: a detached merge whose first parent is the baseline still starts the rule at the commit that adopts it (final review finding 2)', async (t) => {
  // On pull_request, actions/checkout checks out GitHub's test merge commit, detached. Its first parent is the event's
  // base, which predates the rule; its second parent is the change. The change holds an earlier goal's commit, never
  // formatted, then the commit that adopts the rule with QA-9's kind of files: the check, the quality modules beside
  // it, an edited jest.config.cjs, and JSON and Markdown that are not checked.
  const root = scratch(t);
  git(root, 'init', '-q', '-b', 'main');
  write(root, '.gitignore', 'node_modules/\n');
  write(root, 'package.json', '{ "private": true }\n');
  write(root, 'apps/mobile/jest.config.cjs', FORMATTED_CJS);
  write(root, 'apps/mobile/src/old.ts', UNFORMATTED);
  commitAll(root, 'the baseline, before the rule');
  git(root, 'checkout', '-q', '-b', 'work');
  write(root, 'apps/mobile/src/old.ts', `${UNFORMATTED}export const touchedBefore = 1;\n`);
  write(root, 'apps/mobile/src/before.ts', UNFORMATTED);
  commitAll(root, 'an earlier goal, before the rule');
  const run = installCommand(root);
  write(root, PRETTIER_CONFIG, `${JSON.stringify(PRETTIER_OPTIONS, null, 2)}\n`);
  write(root, 'package.json', '{ "private": true, "devDependencies": { "prettier": "3.6.2" } }\n');
  write(
    root,
    'apps/mobile/jest.config.cjs',
    `${FORMATTED_CJS}module.exports.prettierPath = null;\n`,
  );
  write(root, 'docs/plan.md', '# The format rule\n');
  commitAll(root, 'the change adopts the rule');
  const baseline = git(root, 'rev-parse', 'main');
  const adopting = git(root, 'rev-parse', 'work');
  const merge = git(
    root,
    'commit-tree',
    git(root, 'rev-parse', 'work^{tree}'),
    '-p',
    baseline,
    '-p',
    adopting,
    '-m',
    'Merge work into main, as GitHub tests a pull request',
  );
  git(root, 'checkout', '-q', '--detach', merge);
  assert.equal(git(root, 'rev-parse', 'HEAD^1'), baseline, 'the first parent is the baseline');
  assert.equal(git(root, 'rev-parse', 'HEAD^2'), adopting, 'the second parent is the change');
  assert.equal(
    git(root, 'merge-base', baseline, 'HEAD'),
    baseline,
    'the fork point is the baseline',
  );
  assert.equal(
    spawnSync('git', ['-C', root, 'symbolic-ref', '-q', 'HEAD'], { env: gitEnv }).status,
    1,
    'HEAD is detached',
  );
  const ci = { GITHUB_ACTIONS: 'true', [BASELINE_ENV]: baseline };
  const touched = select(root, ci);
  assert.equal(
    touched.base,
    git(root, 'rev-parse', `${adopting}^1`),
    'measured from the parent of the commit that adopts the rule, not from the baseline',
  );
  assert.equal(
    touched.label,
    `${BASELINE_ENV}@${baseline.slice(0, 12)}, from ${adopting.slice(0, 12)}, which adds ${RULE}`,
  );
  const adopted = [
    'apps/mobile/jest.config.cjs',
    RULE,
    ...IMPORTED.map((name) => `scripts/quality/${name}`),
  ].sort();
  assert.deepEqual(
    touched.files,
    adopted,
    "the adopting commit's own files, and no earlier goal's",
  );
  assert.deepEqual(touched.ignored, {
    deleted: [],
    notSource: [PRETTIER_CONFIG, 'docs/plan.md', 'package.json'],
    generated: [],
    vendor: [],
  });
  assert.deepEqual(touched.problems, []);
  assert.deepEqual((await verify(root, ci)).problems, []);
  // As root `check` runs it in the hosted job: the label a verifier reads in the log.
  const hosted = run(ci);
  assert.equal(hosted.status, 0, hosted.stderr);
  assert.match(
    hosted.stdout,
    new RegExp(
      `^Formatting verified: the ${adopted.length} touched JavaScript and TypeScript files match Prettier 3\\.6\\.2 with \\.prettierrc\\.json\\. Base: ${literal(touched.label)}\\. Not checked: 3 not JavaScript or TypeScript\\.`,
    ),
  );
});
