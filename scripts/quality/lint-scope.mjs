import { MOBILE_ROOT, defaultIo, readListed, reason } from './config-inventory.mjs';

// QA-9 (docs/23 §9 rule 3): lint never quietly narrows, and no eslint-disable goes unexplained. Root `lint` runs
// `eslint . --max-warnings=0` in apps/mobile, pinned by gate-wiring.mjs. Read from the installed packages, 26 October 2026:
// - ESLint 9.39.5 takes its config from the first of eslint.config.{js,mjs,cjs,ts,mts,cts} it finds upwards from the
//   working directory, or from each linted file's folder when ESLINT_FLAGS turns on v10_config_lookup_from_file
//   (lib/config/config-loader.js, lib/eslint/eslint-helpers.js). With ESLINT_USE_FLAT_CONFIG=false it uses its eslintrc
//   mode instead (lib/cli.js), which reads .eslintrc*, .eslintignore and the package.json eslintConfig and eslintIgnore keys
//   (@eslint/eslintrc).
// - It honours a directive only at the start of a comment and in lower case: eslint-disable, eslint-disable-line and
//   eslint-disable-next-line switch rules off, and `eslint` sets rules inline. Text after " -- " is the reason
//   (@eslint/plugin-kit; lib/languages/js/source-code/source-code.js). An unused disable already fails lint, since ESLint
//   reports it as a warning by default (lib/config/default-config.js) and the lint script allows none.
// So the reviewed eslint.config.js is pinned as text, every other ESLint config source in apps/mobile is refused, a disable
// must name its rules and give a reason, and inline rule configuration is refused.

export const ESLINT_CONFIG = `${MOBILE_ROOT}/eslint.config.js`;
const PACKAGE = `${MOBILE_ROOT}/package.json`;
/** The folders the reviewed config ignores globally, relative to apps/mobile: ESLint lints none of their files. */
export const LINT_IGNORED = ['dist', 'dist-native', 'dist-verified', 'coverage', '.expo'];
/** The files ESLint lints: its defaults (.js, .mjs, .cjs) and eslint-config-expo's (.jsx, .ts, .tsx), plus .mts and .cts. */
const LINTED = /\.(?:[cm]?[jt]s|[jt]sx)$/i;
/** Every ESLint config source, in either mode and any letter case (a case-insensitive file system finds them all). */
const ESLINT_SOURCE = /^(?:eslint\.config(?:\..*)?|\.eslintrc(?:\..*)?|\.eslintignore)$/i;
const ESLINTRC_KEYS = ['eslintConfig', 'eslintIgnore'];
/** @eslint/plugin-kit's directive pattern, and the separator before a directive's reason. */
const DIRECTIVE = /^([a-z]+(?:-[a-z]+)*)(?:\s|$)/u;
const REASON = /\s-{2,}\s/u;
/**
 * The rules a disable names, read as @eslint/plugin-kit 0.4.1's parseListConfig reads them: split on commas, each trimmed and
 * stripped of one pair of matching quotes, empty items dropped. ESLint 9.39.5 turns an empty list into "every rule"
 * (lib/linter/linter.js, createDisableDirectives), so `eslint-disable , -- why` and `eslint-disable "" -- why` name none.
 */
const namedRules = (value) =>
  value
    .split(',')
    .map((item) => item.trim().replace(/^(?<quote>['"]?)(?<rule>.*)\k<quote>$/su, '$<rule>'))
    .filter(Boolean);
/**
 * Every "/" followed by "/" or "*" starts a comment, and starts that overlap are each read. When one block comment ends where
 * the next comment begins, the "/" closing the first is not consumed together with the "/" opening the second.
 */
const COMMENT_START = /\/(?=[/*])/g;
const DISABLES = ['eslint-disable', 'eslint-disable-line', 'eslint-disable-next-line'];
const CHANGE = 'Remove it, or change scripts/quality/lint-scope.mjs in a reviewed diff first';
/**
 * apps/mobile/eslint.config.js as reviewed: eslint-config-expo's flat config, the global ignores, and the design-token
 * rules of docs/23 §9 rule 4 for src/ outside the theme and the tests. A change to it changes this text in the same diff.
 */
export const REVIEWED_ESLINT_CONFIG = String.raw`const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expo,
  { ignores: ['dist/**', 'dist-native/**', 'dist-verified/**', 'coverage/**', '.expo/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**', 'src/**/__tests__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^(#[a-fA-F0-9]{3,8}|rgba?\\(|hsla?\\()/]',
          message: 'Use semantic theme colors. Define palette values in src/theme/themes/.',
        },
        {
          selector: 'Property[key.name=/^(fontSize|lineHeight|fontFamily|borderRadius)$/] > Literal',
          message: 'Use the shared typography or radius tokens from useTheme().',
        },
      ],
    },
  },
]);
`;

const lines = (text) => text.replace(/\r\n/g, '\n').trimEnd().split('\n');
const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The config must be the reviewed text; line endings and trailing blank lines aside. */
function configProblems(root, io, entry) {
  if (!entry) return [`${ESLINT_CONFIG} is missing, so lint would run without the reviewed config`];
  const unchecked = 'so it cannot be compared with the reviewed config';
  if (entry.kind !== 'file') return [`${ESLINT_CONFIG} is not a regular file, ${unchecked}`];
  const { text, problem } = readListed(root, io, ESLINT_CONFIG, unchecked);
  if (problem) return [problem];
  const actual = lines(text);
  const reviewed = lines(REVIEWED_ESLINT_CONFIG);
  const first = Array.from({ length: Math.max(actual.length, reviewed.length) }, (_, i) => i).find(
    (i) => actual[i] !== reviewed[i],
  );
  return first === undefined
    ? []
    : [
        `${ESLINT_CONFIG} is not the reviewed ESLint config (first difference at line ${first + 1}: ${JSON.stringify(actual[first] ?? '(end of file)')}). It sets the files, ignores and rules lint applies, so it changes only together with scripts/quality/lint-scope.mjs, in a reviewed diff`,
      ];
}

/** The eslintrc-mode keys of the mobile package.json. A file that cannot be read or parsed is a problem here too. */
function packageProblems(root, io, entry) {
  if (!entry) return [];
  const unchecked = `so its ${ESLINTRC_KEYS.join(' and ')} keys cannot be checked`;
  if (entry.kind !== 'file') return [`${PACKAGE} is not a regular file, ${unchecked}`];
  const { text, problem } = readListed(root, io, PACKAGE, unchecked);
  if (problem) return [problem];
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return [`${PACKAGE} is not JSON (${reason(error)}), ${unchecked}`];
  }
  if (!isObject(json)) return [`${PACKAGE} is not a JSON object, ${unchecked}`];
  return ESLINTRC_KEYS.filter((key) => key in json).map(
    (key) =>
      `${PACKAGE} has an "${key}" key, which ESLint reads as configuration in its eslintrc mode. ${CHANGE}`,
  );
}

/**
 * The characters that end a `//` comment: JavaScript's line terminators, CR, LF, U+2028 and U+2029, which both parsers ESLint
 * uses here end one at: espree, and @typescript-eslint/parser for .ts and .tsx (lint-scope test 8 runs both). Ending only at
 * CR and LF would read on past U+2028 into the next comment, and take its text for the rule list or the reason (phase-2E
 * review, finding 2). type-suppression.mjs ends a reason at the same four. \p{Zl} is U+2028 alone and \p{Zp} is U+2029 alone.
 */
const LINE_END = /[\r\n\p{Zl}\p{Zp}]/gu;

/** The text of the comment that starts at index: to the end of the line for `//`, to the closing `*\/` for `/*`. */
function bodyAt(text, index) {
  const start = index + 2;
  if (text[index + 1] === '*') {
    const end = text.indexOf('*/', start);
    return text.slice(start, end < 0 ? text.length : end);
  }
  const lineEnd = new RegExp(LINE_END);
  lineEnd.lastIndex = start;
  return text.slice(start, lineEnd.exec(text)?.index ?? text.length);
}

/**
 * Every disable without rules or a reason, and every inline rule configuration, in one file's text. Each `//` and `/*` is
 * read as a comment wherever it starts, strings and other comments included, and starts that overlap are each read; such a
 * string must be reworded. This reads text, not a parse: it finds every comment start ESLint could see, and ends a comment
 * where JavaScript does, but it is not ESLint's parser, so a form neither the tests nor the review have named may still read
 * differently. A disable whose rule list is empty once ESLint has read it disables every rule.
 */
function directivesIn(path, text) {
  const problems = [];
  for (const { index } of text.matchAll(COMMENT_START)) {
    const body = bodyAt(text, index);
    const cut = REASON.exec(body);
    const directive = (cut ? body.slice(0, cut.index) : body).trim();
    const label = DIRECTIVE.exec(directive)?.[1];
    if (label !== 'eslint' && !DISABLES.includes(label)) continue;
    const at = `${path}:${lineOf(text, index)} has ${JSON.stringify(body.trim().split(/\r?\n/)[0].slice(0, 120))}`;
    if (label === 'eslint')
      problems.push(
        `${at}, inline rule configuration, which changes a rule where the reviewed ${ESLINT_CONFIG} cannot see it: set rules in that config instead`,
      );
    else if (!namedRules(directive.slice(label.length)).length)
      problems.push(
        `${at}, which disables every rule: name the rules it disables, and give the reason after " -- "`,
      );
    else if (!(cut && body.slice(cut.index + cut[0].length).trim()))
      problems.push(
        `${at}, with no reason: give one after " -- ", since docs/23 §9 rule 3 allows no unexplained eslint-disable`,
      );
  }
  return problems;
}

const ignored = (path) => LINT_IGNORED.some((dir) => path.startsWith(`${MOBILE_ROOT}/${dir}/`));
/**
 * The lint scope of the mobile package, given its inventory (config-inventory.mjs): the reviewed config, no other config
 * source, and no undescribed disable or inline rule configuration in any file ESLint lints. The pinned config is compared
 * as text, so the scan reads every other linted file; `files` is how many.
 */
export function lintScopeProblems(root, { entries }, io = defaultIo) {
  const problems = [
    ...configProblems(
      root,
      io,
      entries.find((entry) => entry.path === ESLINT_CONFIG),
    ),
    ...entries
      .filter(({ path, name }) => ESLINT_SOURCE.test(name) && path !== ESLINT_CONFIG)
      .map(
        ({ path }) =>
          `${path} is an ESLint configuration source besides ${ESLINT_CONFIG}. ESLint can use it instead of the reviewed config: from a linted file's folder when ESLINT_FLAGS turns on v10_config_lookup_from_file, or in eslintrc mode when ESLINT_USE_FLAT_CONFIG=false. ${CHANGE}`,
      ),
    ...packageProblems(
      root,
      io,
      entries.find((entry) => entry.path === PACKAGE),
    ),
  ];
  const scanned = entries.filter(
    ({ path, name, kind }) =>
      kind === 'file' && LINTED.test(name) && path !== ESLINT_CONFIG && !ignored(path),
  );
  for (const { path } of scanned) {
    const { text, problem } = readListed(
      root,
      io,
      path,
      'so it cannot be checked for eslint-disable comments',
    );
    problems.push(...(problem ? [problem] : directivesIn(path, text)));
  }
  return { problems, files: scanned.length };
}
