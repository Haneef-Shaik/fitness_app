/**
 * The open-source licence list (K-10) cannot quietly fall behind the app.
 *
 * It is generated from package.json by `node scripts/licences.mjs`, and
 * checked in so the app never reads node_modules at runtime. A dependency
 * added without regenerating fails here, naming the command to run.
 */
import licences from '../licences.json';

const pkg = require('../../../../package.json') as { dependencies: Record<string, string> };

/** The app's own workspace packages are FitLog's code, not a third party's. */
const shipped = Object.entries(pkg.dependencies)
  .filter(([, range]) => !range.startsWith('workspace:'))
  .map(([name]) => name)
  .sort();

it('has an entry for every runtime dependency, and nothing else', () => {
  const listed = licences.map((l) => l.name).sort();
  expect(listed).toEqual(shipped);
  // If this fails: cd apps/mobile && node scripts/licences.mjs
});

it('names a licence and a version for every entry', () => {
  for (const entry of licences) {
    expect(entry.license).toBeTruthy();
    expect(entry.version).toMatch(/^\d+\.\d+\.\d+/);
  }
});
