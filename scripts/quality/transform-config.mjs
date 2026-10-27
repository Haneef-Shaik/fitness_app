import { MOBILE_ROOT, defaultIo, readListed, reason } from './config-inventory.mjs';

// QA-9 (docs/23 §9 rule 3): coverage scope never narrows at transform time either. Jest instruments mobile files for
// coverage while babel-jest transforms them, so a Babel config could drop, rewrite or ignore code before it is counted,
// where coverage-suppression.mjs, which reads source text, cannot see it. Read from the installed packages, 26 October 2026:
// - jest-expo 57.0.6 (src/resolveBabelOptions.js) hands babel-jest `root` and `babelrcRoots` set to the mobile package,
//   `babelrc: true` and `configFile: true`, and `extends` the first of 13 babel.config.* or .babelrc* names it finds there.
//   With none, it uses expo's own preset.
// - @babel/core 7.29.7 (lib/config/config-chain.js, files/configuration.js, files/package.js) then reads babel.config.* in
//   that root, and for each file every .babelrc* and .babelignore from the file's folder up to its package, plus that
//   package.json's "babel" key. A package.json further down starts a package of its own, and one that is not a JSON object
//   makes Babel throw.
// - babel-jest 29.7.0 throws for a file Babel ignores or cannot configure. For a file no test loads, Jest 29
//   (@jest/reporters CoverageReporter.js) then only logs "Failed to collect coverage from" it, and leaves it out of the count.
// No Babel configuration is reviewed for the mobile package, so every such file or key is refused.

/** Babel's and jest-expo's config names, in any letter case, since a case-insensitive file system finds .BabelRC as .babelrc. */
export const BABEL_CONFIG = /^(?:babel\.config(?:\..*)?|\.babelrc(?:\..*)?|\.babelignore)$/i;
const PACKAGE_NAME = /^package\.json$/i;
const PACKAGE = `${MOBILE_ROOT}/package.json`;
const REFUSED =
  'No Babel configuration is reviewed for the mobile package: Jest would transform and instrument its files through it, where the coverage-suppression scan cannot see what it drops or ignores. Remove it, or change scripts/quality/transform-config.mjs in a reviewed diff first';
const NESTED = `starts a package of its own inside ${MOBILE_ROOT}: Babel then looks for configuration from there for the files under it, and if it is not a JSON object Babel fails on each of them, which takes untested files out of Jest's count. Remove it, or change scripts/quality/transform-config.mjs in a reviewed diff first`;
const UNCHECKED = 'so its "babel" key cannot be checked';
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The mobile package.json may not carry a "babel" key; a file that cannot be read or parsed is a problem too. */
function packageProblems(root, io, { path, kind }) {
  if (kind !== 'file') return [`${path} is not a regular file, ${UNCHECKED}`];
  const { text, problem } = readListed(root, io, path, UNCHECKED);
  if (problem) return [problem];
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return [`${path} is not JSON (${reason(error)}), ${UNCHECKED}`];
  }
  if (!isObject(json)) return [`${path} is not a JSON object, ${UNCHECKED}`];
  return 'babel' in json
    ? [
        `${path} has a "babel" key, which Babel reads as configuration for the files of its package. ${REFUSED}`,
      ]
    : [];
}

/**
 * Every Babel config file or key in the mobile package, given its inventory (config-inventory.mjs). The mobile package.json
 * must be there: without it Babel's package search walks on to the next package.json up, and reads .babelrc files and a
 * "babel" key outside apps/mobile.
 */
export function transformConfigProblems(root, { entries }, io = defaultIo) {
  const missing = entries.some((entry) => entry.path === PACKAGE)
    ? []
    : [
        `${PACKAGE} is missing: Babel would then look past ${MOBILE_ROOT}, up to the next package.json, for .babelrc files and a "babel" key`,
      ];
  return [
    ...missing,
    ...entries.flatMap((entry) => {
      if (BABEL_CONFIG.test(entry.name)) {
        return [
          `${entry.path} is a Babel configuration file${entry.kind === 'file' ? '' : ` (a ${entry.kind === 'directory' ? 'directory' : 'link or other entry'} with that name)`}. ${REFUSED}`,
        ];
      }
      if (!PACKAGE_NAME.test(entry.name)) return [];
      return entry.path === PACKAGE
        ? packageProblems(root, io, entry)
        : [`${entry.path} ${NESTED}`];
    }),
  ];
}
