import { readFileSync, realpathSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import * as prettier from 'prettier';
import { BASELINE_ENV, configuredBaseline, gitRunner, inCI } from './coverage-ratchet.mjs';

// QA-9 phase 3 (docs/23 §9 rule 3): Prettier on touched files only. Root `check` runs this once, after the ratchet guard.
//
// Which files. The tracked files this change adds, modifies or renames, compared with a base commit: in CI the fork point
// of FITLOG_CONTRACT_BASELINE (required there, as for the ratchet and contract guards), locally the fork point of
// refs/heads/main, or of FITLOG_CONTRACT_BASELINE when it is set. Git compares that commit with the work tree, so locally
// committed, staged and unstaged edits all count; untracked files do not until they are added. Renames count as touches
// (--no-renames lists the new path as added). Only the eight JavaScript and TypeScript extensions are read, in any letter
// case, as Prettier itself matches them. Deleted paths, every other extension (binary files, JSON, Markdown, YAML, SQL),
// the generated files in GENERATED and anything under a node_modules folder are listed as not checked. A touched link,
// submodule or unknown Git status fails closed, and so does any unmerged path in the index. No base, or no Git, fails
// closed too: without a base no file can be called touched.
//
// When the rule starts. It applies from the commit that adds this module (RULE). A base that predates it, as on the first
// hosted run, whose base is far behind local main, moves forward to the parent of that commit, so earlier commits' files
// are never demanded. Once main holds the rule every base does. A pull request is checked as its merge with the base, so
// the fork point is the base itself. RULE is this module's own path, taken from where it runs, so a rename or a move
// carries it along and restarts the rule at that commit, a reviewed change here. No start found fails closed in CI, which
// only runs committed code, and locally once HEAD holds RULE: only before RULE is committed do just uncommitted edits count.
//
// How they are checked. Each file is read as UTF-8, as Prettier's CLI reads it, and given to the installed Prettier's own
// check() with PRETTIER_OPTIONS and the file's path, which picks the parser. No Prettier config file, ignore file,
// .editorconfig, package.json key, plugin or pragma is ever read, so none of them can switch the check off for a file.
// The root .prettierrc.json must equal PRETTIER_OPTIONS, so that editors and `pnpm exec prettier --write` format as this
// check does, and the installed Prettier must be PRETTIER_VERSION, the exact root devDependency.
// Git is only read, as coverage-ratchet.mjs's gitRunner reads it. Needs no database or network.

const MODULE = fileURLToPath(import.meta.url);
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
/**
 * This module's path in the repository, derived from where it runs rather than written by hand, so it can never name a
 * path the check has left. The format rule applies from the commit that adds it.
 */
export const RULE = relative(REPO_ROOT, MODULE).split(sep).join('/');
export const PRETTIER_VERSION = '3.6.2';
export const PRETTIER_CONFIG = '.prettierrc.json';
/** The reviewed options. Prettier's defaults hold for every option not named here. */
export const PRETTIER_OPTIONS = Object.freeze({ printWidth: 100, singleQuote: true });
/** The local base branch, read as refs/heads/main so a tag or remote of the same name cannot stand in for it. */
export const LOCAL_BASE = 'main';
/** .js, .jsx, .mjs, .cjs, .ts, .tsx, .mts and .cts, in any letter case. */
export const SOURCE = /\.(?:[cm]?[jt]s|[jt]sx)$/i;
/** Files a tool writes, which are regenerated and never edited by hand (docs/23 §5). Adding one is a reviewed change here. */
export const GENERATED = Object.freeze(['apps/mobile/src/data/database.types.ts']);
const VENDOR = 'node_modules';
const REGULAR = ['100644', '100755'];
const MODE_KIND = { 120000: 'a symbolic link', 160000: 'a submodule' };
const TOUCHED = ['A', 'M', 'T'];
const OID = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/;
/** One `git diff --raw -z` entry's metadata: modes, object IDs and a one-letter status (no rename scores with --no-renames). */
const RAW = /^:(\d{6}) (\d{6}) [0-9a-f]+ [0-9a-f]+ ([A-Z])$/;
const NOT_CHECKED = {
  deleted: 'deleted',
  notSource: 'not JavaScript or TypeScript',
  generated: 'generated',
  vendor: 'under node_modules',
};
const HINT = `Format each file named above with: pnpm exec prettier --write <path>. The root ${PRETTIER_CONFIG} holds the same options. Untouched files are never checked, so leave them as they are.`;

const messageOf = (error) => (error instanceof Error ? error.message : String(error));
const why = ({ status, stderr }) =>
  [status === null ? '' : `exit ${status}`, stderr].filter(Boolean).join(': ') || 'no output';
const out = (run) => run.stdout.toString('utf8').trim();
/** A path as printed in a problem: JSON-quoted when it holds a control character such as a tab or a line break. */
const shown = (path) => (/[\0-\x1f\x7f]/.test(path) ? JSON.stringify(path) : path);

/** The fork point the touched files are measured from, and its label. Every way of not finding one throws. */
function resolveBase(git, root, env) {
  const configured = configuredBaseline(env);
  const top = git(root, ['rev-parse', '--show-toplevel']);
  if (top.status !== 0) {
    throw new Error(
      `${root} is not in a usable Git work tree (${why(top)}), so the files this change touches cannot be found; the format check needs Git and a base commit`,
    );
  }
  if (realpathSync(out(top)) !== realpathSync(root))
    throw new Error(`${root} is not the top of its Git work tree (${out(top)})`);
  const named = configured === undefined ? LOCAL_BASE : `${BASELINE_ENV}=${configured}`;
  const commit = git(root, [
    'rev-parse',
    '--verify',
    '--quiet',
    `${configured ?? `refs/heads/${LOCAL_BASE}`}^{commit}`,
  ]);
  if (commit.status !== 0 || !OID.test(out(commit))) {
    throw new Error(
      configured === undefined
        ? `${LOCAL_BASE} is not a commit in this repository (${why(commit)}), so the files this change touches cannot be found. Create or fetch ${LOCAL_BASE}, or set ${BASELINE_ENV} to the commit this change starts from`
        : `${named} is not a commit in this repository (${why(commit)}); CI must fetch full history`,
    );
  }
  const fork = git(root, ['merge-base', out(commit), 'HEAD']);
  const base = out(fork);
  if (fork.status !== 0 || !OID.test(base)) {
    throw new Error(
      `${named} shares no history with HEAD (${why(fork)}), so the files this change touches cannot be found`,
    );
  }
  if (inCI(env) && base === out(git(root, ['rev-parse', '--verify', 'HEAD^{commit}']))) {
    throw new Error(
      `${named} forks from HEAD itself, so in CI no file would count as touched; it must name the pull request base or the previous push head`,
    );
  }
  return ruleStart(
    git,
    root,
    env,
    base,
    `${configured === undefined ? LOCAL_BASE : BASELINE_ENV}@${base.slice(0, 12)}`,
  );
}

/** Whether `commit` holds RULE. A failing ls-tree throws: it is never read as "the rule is not there". */
function holdsRule(git, root, commit, label) {
  const listed = git(root, ['ls-tree', '-z', '--full-tree', commit, '--', RULE]);
  if (listed.status !== 0) {
    throw new Error(
      `${label}: git ls-tree failed (${why(listed)}), so whether the format rule holds there cannot be told`,
    );
  }
  return listed.stdout.length > 0;
}

/**
 * With no commit after the fork point adding RULE, the base may move to HEAD only where that is honest: locally, before
 * RULE is committed. CI runs only committed code, and a HEAD that holds RULE means its start was lost, so both throw
 * rather than check no committed file.
 */
function refuseLostStart(git, root, env, label) {
  if (inCI(env)) {
    throw new Error(
      `${label}: neither this fork point nor any commit after it up to HEAD holds ${RULE}, the format check that is running, so the rule has no start. CI runs only committed code, so that commit must be found; checking from HEAD would check no committed file`,
    );
  }
  if (holdsRule(git, root, 'HEAD', label)) {
    throw new Error(
      `${label}: HEAD holds ${RULE}, but no commit after this fork point adds it, so the rule's start cannot be found; the format check fails closed rather than check only uncommitted edits`,
    );
  }
}

/**
 * The rule applies from the commit that adds it. When the fork point already holds RULE, it is the base. When it does
 * not, as on the first hosted run, whose base predates the rule and whose range holds earlier goals' commits, the base
 * moves to the parent of the first commit after it that adds RULE; with no such commit yet, locally and only while RULE
 * is uncommitted, to HEAD, so only uncommitted edits count. A change is never asked to format what commits before the
 * rule touched, and once main holds the rule, every base does, so this changes nothing.
 */
function ruleStart(git, root, env, fork, label) {
  if (holdsRule(git, root, fork, label)) return { base: fork, label };
  const adding = git(root, [
    'rev-list',
    '--reverse',
    '--topo-order',
    '--full-history',
    `${fork}..HEAD`,
    '--',
    RULE,
  ]);
  if (adding.status !== 0) {
    throw new Error(
      `${label}: git rev-list failed (${why(adding)}), so the commit that adds ${RULE} cannot be found`,
    );
  }
  const first = out(adding).split('\n')[0];
  if (!first) refuseLostStart(git, root, env, label);
  const start = git(root, [
    'rev-parse',
    '--verify',
    first ? `${first}^1^{commit}` : 'HEAD^{commit}',
  ]);
  if (start.status !== 0 || !OID.test(out(start))) {
    throw new Error(
      `${label}: the commit the format rule starts from cannot be read (${why(start)})`,
    );
  }
  return {
    base: out(start),
    label: first
      ? `${label}, from ${first.slice(0, 12)}, which adds ${RULE}`
      : `${label}, from HEAD@${out(start).slice(0, 12)}: ${RULE} is not committed yet, so only uncommitted edits count`,
  };
}

/** The entries of `git diff --raw -z`: metadata and path alternate, each ended by NUL, so any byte in a path is safe. */
function rawEntries(stdout) {
  const fields = stdout.toString('utf8').split('\0');
  const pairs = fields.slice(0, -1);
  if (fields.at(-1) !== '' || pairs.length % 2 !== 0)
    throw new Error('git diff --raw -z printed output this check cannot read');
  return Array.from({ length: pairs.length / 2 }, (_, i) => {
    const meta = RAW.exec(pairs[2 * i]);
    if (!meta)
      throw new Error(
        `git diff --raw -z printed ${JSON.stringify(pairs[2 * i])}, which this check cannot read`,
      );
    return { mode: meta[2], status: meta[3], path: pairs[2 * i + 1] };
  });
}

/**
 * The paths `git ls-files -u -z` lists: index entries in a conflict stage. Against the work tree, git diff reports such a
 * path as an ordinary modification of whatever the work tree holds, so the index is asked directly.
 */
function unmergedPaths(stdout) {
  const entries = stdout.toString('utf8').split('\0');
  if (entries.at(-1) !== '')
    throw new Error('git ls-files -u -z printed output this check cannot read');
  return entries.slice(0, -1).map((entry) => {
    const tab = entry.indexOf('\t');
    if (tab < 0)
      throw new Error(
        `git ls-files -u -z printed ${JSON.stringify(entry)}, which this check cannot read`,
      );
    return entry.slice(tab + 1);
  });
}

/** What the check does with one touched path: check it, list it as not checked, or fail closed. */
function classify({ status, mode, path }) {
  if (status === 'D') return { kind: 'deleted', path };
  if (status === 'U') return { kind: 'unmerged', path };
  if (!TOUCHED.includes(status)) {
    return {
      kind: 'problem',
      problem: `${shown(path)} has Git status ${status}, which this check does not know, so it fails closed`,
    };
  }
  if (!SOURCE.test(path)) return { kind: 'notSource', path };
  if (path.split('/').includes(VENDOR)) return { kind: 'vendor', path };
  if (GENERATED.includes(path)) return { kind: 'generated', path };
  if (!REGULAR.includes(mode)) {
    return {
      kind: 'problem',
      problem: `${shown(path)} is not a regular file (Git mode ${mode}, ${MODE_KIND[mode] ?? 'not a file'}); the format check reads only regular files and never follows a link`,
    };
  }
  return { kind: 'file', path };
}

/** The tracked JavaScript and TypeScript files this change touched since its base, what was not checked, and problems. */
export function touchedFiles({ root = REPO_ROOT, env = process.env, git = gitRunner() } = {}) {
  const { base, label } = resolveBase(git, root, env);
  const diff = git(root, [
    'diff',
    '--raw',
    '-z',
    '--no-renames',
    '--no-abbrev',
    '--no-ext-diff',
    '--no-textconv',
    '--no-color',
    base,
    '--',
  ]);
  if (diff.status !== 0)
    throw new Error(
      `git diff against ${label} failed (${why(diff)}), so the files this change touches cannot be found`,
    );
  const index = git(root, ['ls-files', '-u', '-z']);
  if (index.status !== 0)
    throw new Error(
      `git ls-files -u failed (${why(index)}), so unmerged paths cannot be ruled out`,
    );
  const entries = rawEntries(diff.stdout).map(classify);
  const paths = (kind) =>
    entries
      .filter((entry) => entry.kind === kind)
      .map((entry) => entry.path)
      .sort();
  const unmerged = [...new Set([...unmergedPaths(index.stdout), ...paths('unmerged')])].sort();
  return {
    base,
    label,
    files: paths('file').filter((path) => !unmerged.includes(path)),
    ignored: Object.fromEntries(Object.keys(NOT_CHECKED).map((kind) => [kind, paths(kind)])),
    problems: [
      ...unmerged.map(
        (path) =>
          `${shown(path)} is unmerged; finish or abort the merge before the format check can read it`,
      ),
      ...entries.filter((entry) => entry.kind === 'problem').map((entry) => entry.problem),
    ],
  };
}

/** The root config must hold exactly the reviewed options; anything else would make editors format differently. */
function configProblems(root) {
  let text;
  try {
    text = readFileSync(join(root, PRETTIER_CONFIG), 'utf8');
  } catch (error) {
    return [
      error?.code === 'ENOENT'
        ? `${PRETTIER_CONFIG} is missing; it must hold the reviewed Prettier options ${JSON.stringify(PRETTIER_OPTIONS)}, which editors and pnpm exec prettier read`
        : `${PRETTIER_CONFIG} cannot be read (${messageOf(error)}), so the format check fails closed`,
    ];
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return [
      `${PRETTIER_CONFIG} is not JSON (${messageOf(error)}); it must hold the reviewed Prettier options ${JSON.stringify(PRETTIER_OPTIONS)}`,
    ];
  }
  return isDeepStrictEqual(json, PRETTIER_OPTIONS)
    ? []
    : [
        `${PRETTIER_CONFIG} is not the reviewed Prettier options ${JSON.stringify(PRETTIER_OPTIONS)}; this check always formats with those, so editors and pnpm exec prettier must too. Change both in a reviewed diff`,
      ];
}

/** One touched file's problem, or null when Prettier with the pinned options would leave it unchanged. */
async function formatProblem(root, path, formatter) {
  const file = join(root, path);
  let source;
  try {
    source = readFileSync(file, 'utf8');
  } catch (error) {
    return `${shown(path)} cannot be read (${messageOf(error)}), so the format check fails closed`;
  }
  try {
    return (await formatter.check(source, { ...PRETTIER_OPTIONS, filepath: file }))
      ? null
      : `${shown(path)} is not formatted as Prettier ${PRETTIER_VERSION} formats it with ${PRETTIER_CONFIG}`;
  } catch (error) {
    return `${shown(path)} could not be parsed by Prettier ${PRETTIER_VERSION} (${messageOf(error).split('\n')[0]}); a touched file must be source Prettier can format`;
  }
}

export async function checkTouchedFormat({
  root = REPO_ROOT,
  env = process.env,
  git = gitRunner(),
  formatter = prettier,
} = {}) {
  const touched = touchedFiles({ root, env, git });
  const version =
    formatter.version === PRETTIER_VERSION
      ? []
      : [
          `Prettier ${formatter.version} is installed, but this check is pinned to ${PRETTIER_VERSION}; run pnpm install --frozen-lockfile, or change the pin and the root devDependency together in a reviewed diff`,
        ];
  const formatted = await Promise.all(
    touched.files.map((path) => formatProblem(root, path, formatter)),
  );
  const skipped = Object.entries(touched.ignored)
    .filter(([, paths]) => paths.length)
    .map(([kind, paths]) => `${paths.length} ${NOT_CHECKED[kind]}`);
  return {
    problems: [
      ...touched.problems,
      ...configProblems(root),
      ...version,
      ...formatted.filter(Boolean),
    ],
    summary:
      `Formatting verified: the ${touched.files.length} touched JavaScript and TypeScript ${touched.files.length === 1 ? 'file matches' : 'files match'} Prettier ${PRETTIER_VERSION} with ${PRETTIER_CONFIG}. ` +
      `Base: ${touched.label}. ${skipped.length ? `Not checked: ${skipped.join(', ')}.` : 'No other tracked path was touched.'} Untouched and untracked files are never checked.`,
  };
}

async function main() {
  try {
    const { problems, summary } = await checkTouchedFormat();
    if (problems.length) {
      process.stderr.write(`touched-format failed:\n- ${problems.join('\n- ')}\n${HINT}\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`${summary}\n`);
  } catch (error) {
    process.stderr.write(`touched-format failed: ${messageOf(error)}\n`);
    process.exitCode = 1;
  }
}
function invokedDirectly() {
  try {
    return realpathSync(process.argv[1] ?? '') === realpathSync(MODULE);
  } catch {
    return false;
  }
}
if (invokedDirectly()) await main();
