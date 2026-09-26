/**
 * Regenerate K-10's open-source licence list from package.json.
 *
 *     cd apps/mobile && node scripts/licences.mjs
 *
 * Reads each runtime dependency's own package.json from node_modules for the
 * version actually installed and the licence it declares, and writes
 * src/features/about/licences.json. Checked in, so the app never reads
 * node_modules at runtime; `licences.test.ts` fails when a dependency is added
 * without running this.
 *
 * Direct dependencies only — the list a person can read on a phone. The full
 * transitive inventory and licence texts belong in the store build's notices.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const OUT = resolve(root, 'src/features/about/licences.json');
const require = createRequire(resolve(root, 'package.json'));

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

function manifest(name) {
  // Resolve the package's own package.json; some packages do not export it,
  // so fall back to walking up from their entry point.
  try {
    return JSON.parse(readFileSync(require.resolve(`${name}/package.json`), 'utf8'));
  } catch {
    let dir = dirname(require.resolve(name));
    for (;;) {
      try {
        const found = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8'));
        if (found.name === name) return found;
      } catch { /* keep walking */ }
      const up = dirname(dir);
      if (up === dir) throw new Error(`cannot find package.json for ${name}`);
      dir = up;
    }
  }
}

function licenceOf(m) {
  if (typeof m.license === 'string') return m.license;
  if (m.license?.type) return m.license.type;
  if (Array.isArray(m.licenses)) return m.licenses.map((l) => l.type ?? l).join(' OR ');
  return 'UNKNOWN';
}

const entries = Object.entries(pkg.dependencies ?? {})
  // The app's own workspace packages are FitLog's code.
  .filter(([, range]) => !String(range).startsWith('workspace:'))
  .map(([name]) => {
    const m = manifest(name);
    return { name, version: m.version, license: licenceOf(m) };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(OUT, `${JSON.stringify(entries, null, 2)}\n`);
console.log(`wrote ${entries.length} entries to ${OUT}`);
