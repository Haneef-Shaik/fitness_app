// DS-1 evidence (read-only): which Material scheme settings come closest to the committed Momentum palette?
// Usage from the repo root, after `pnpm install --frozen-lockfile`:
//   node --import tsx docs/evidence/DS-1/scheme-search.mjs "$PWD"
// tsx is required: material-color-utilities 0.4.0 has an extensionless ESM import that plain Node rejects.
import { readFileSync } from 'node:fs';

const root = process.argv[2];
if (!root) throw new Error('Pass the repository root as the first argument');
const mcu = await import(`${root}/node_modules/@material/material-color-utilities/index.js`);
const palette = JSON.parse(readFileSync(`${root}/apps/mobile/src/theme/themes/momentum.json`, 'utf8'));
const seed = mcu.Hct.fromInt(mcu.argbFromHex('#C6F432'));

// The 18 seed-derived roles and the Material colour each maps to (as in momentum.recipe.json).
const mapping = {
  surface: 'surface', surfaceLow: 'surfaceContainerLow', surfaceContainer: 'surfaceContainer',
  surfaceHigh: 'surfaceContainerHigh', surfaceHighest: 'surfaceContainerHighest', onSurface: 'onSurface',
  onSurfaceVariant: 'onSurfaceVariant', outline: 'outline', outlineVariant: 'outlineVariant', primary: 'primary',
  onPrimary: 'onPrimary', primaryContainer: 'primaryContainer', onPrimaryContainer: 'onPrimaryContainer',
  secondaryContainer: 'secondaryContainer', onSecondaryContainer: 'onSecondaryContainer', error: 'error',
  errorContainer: 'errorContainer', onErrorContainer: 'onErrorContainer',
};
const variants = Object.keys(mcu).filter((name) => /^Scheme[A-Z]/.test(name) && name !== 'SchemeAndroid');
const results = [];
for (const variant of variants) {
  for (const spec of ['2021', '2025']) {
    for (const platform of ['phone', 'watch']) {
      for (const contrast of [-1, -0.5, 0, 0.5, 1]) {
        let matches = 0;
        const matched = [];
        for (const mode of ['dark', 'light']) {
          let scheme;
          try { scheme = new mcu[variant](seed, mode === 'dark', contrast, spec, platform); } catch { continue; }
          for (const [role, color] of Object.entries(mapping)) {
            let hex;
            try { hex = mcu.hexFromArgb(scheme[color]).toUpperCase(); } catch { continue; }
            if (hex === palette.colors[mode][role]) { matches += 1; matched.push(`${mode}.${role}`); }
          }
        }
        results.push({ variant, spec, platform, contrast, matches, matched });
      }
    }
  }
}
results.sort((a, b) => b.matches - a.matches);
console.log(`${variants.length} scheme classes searched; best matches out of 36:`);
for (const row of results.slice(0, 8)) console.log(row.matches, row.variant, row.spec, row.platform, row.contrast, row.matched.join(' '));
