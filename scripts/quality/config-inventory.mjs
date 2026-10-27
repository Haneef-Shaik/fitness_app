import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// QA-9 (docs/23 §9 rule 3): every entry in the mobile package that Jest's Babel transform or ESLint could read as
// configuration. transform-config.mjs and lint-scope.mjs judge the entries; this module only lists them and runs nothing.

/** The package whose Jest transform and ESLint run the inventory covers. */
export const MOBILE_ROOT = 'apps/mobile';
/**
 * Skipped at any depth. That is a trust boundary, not a claim that nothing there matters. @babel/core 7.29.7 stops its
 * package search at a folder named node_modules (lib/config/files/package.js) and ESLint 9.39.5 ignores node_modules
 * folders by default (lib/config/default-config.js), so no Babel or ESLint config file in one applies to the mobile
 * package's own files. But each tool resolves the shared config it loads from apps/mobile before the hoisted copy at the
 * repository root: Jest's `jest-expo` preset (jest-config 29.7.0 build/normalize.js, setupPreset), jest-expo's
 * `expo/internal/babel-preset` (src/resolveBabelOptions.js) and eslint.config.js's `eslint-config-expo/flat`. So a
 * node_modules folder in apps/mobile, such as a force-added apps/mobile/node_modules/jest-expo/jest-preset.js, can replace
 * that config while this inventory never reads it. That is dependency trust, which this guard leaves to PL-1 (R6): a check
 * that Git tracks no node_modules path, and protection for .npmrc and pnpm-workspace.yaml.
 */
export const SKIPPED = 'node_modules';
const UNSEEN = 'so the config inventory cannot see what it holds';
export const defaultIo = {
  list: (dir) => readdirSync(dir, { withFileTypes: true }),
  read: (file) => readFileSync(file, 'utf8'),
};
export const reason = (error) => (error instanceof Error ? error.message : String(error));
const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const kindOf = (entry) => (entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other');

/**
 * Every entry under apps/mobile outside node_modules folders, in path order: its path, its name, and whether it is a
 * file, a directory or something else. A missing package, a folder that cannot be listed and an entry that is neither a
 * regular file nor a directory (a link, a socket) are problems, since the inventory cannot see what they hold. Links are
 * never followed.
 */
export function configInventory(root, io = defaultIo) {
  const entries = [];
  const problems = [];
  const visit = (path) => {
    let listed;
    try {
      listed = io.list(join(root, path));
    } catch (error) {
      problems.push(
        path === MOBILE_ROOT && error?.code === 'ENOENT'
          ? `${path} is missing, ${UNSEEN}`
          : `${path} cannot be listed (${reason(error)}), ${UNSEEN}`,
      );
      return;
    }
    for (const entry of [...listed].sort(byName)) {
      if (entry.name === SKIPPED) continue;
      const child = { path: `${path}/${entry.name}`, name: entry.name, kind: kindOf(entry) };
      entries.push(child);
      if (child.kind === 'directory') visit(child.path);
      else if (child.kind === 'other')
        problems.push(
          `${child.path} is not a regular file or directory, ${UNSEEN}; a link can bring configuration in from anywhere`,
        );
    }
  };
  visit(MOBILE_ROOT);
  return { entries, problems };
}

/** A listed file's text, or a problem naming it when it cannot be read, so an unreadable file never passes as a clean one. */
export function readListed(root, io, path, unchecked) {
  try {
    return { text: io.read(join(root, path)) };
  } catch (error) {
    return { problem: `${path} cannot be read (${reason(error)}), ${unchecked}` };
  }
}
