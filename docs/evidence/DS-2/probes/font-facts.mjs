// DS-2 evidence probe (read-only): prints unitsPerEm, hhea/typo metrics and usWeightClass of the bundled text fonts.
// Usage (from the repo root): node docs/evidence/DS-2/probes/font-facts.mjs "$PWD/apps/mobile"
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const appRoot = process.argv[2];
const require = createRequire(path.join(appRoot, 'package.json'));
const families = {
  '@expo-google-fonts/google-sans-flex': ['GoogleSansFlex_400Regular', 'GoogleSansFlex_600SemiBold', 'GoogleSansFlex_700Bold'],
  '@expo-google-fonts/roboto-condensed': ['RobotoCondensed_700Bold'],
  '@expo-google-fonts/noto-sans-devanagari': ['NotoSansDevanagari_400Regular', 'NotoSansDevanagari_700Bold'],
};

function table(view, tag) {
  const count = view.getUint16(4);
  for (let i = 0; i < count; i += 1) {
    const at = 12 + i * 16;
    const name = String.fromCharCode(...[0, 1, 2, 3].map((b) => view.getUint8(at + b)));
    if (name === tag) return view.getUint32(at + 8);
  }
  throw new Error(tag);
}

for (const [pkg, names] of Object.entries(families)) {
  for (const family of names) {
    const dir = path.dirname(require.resolve(`${pkg}/${family.slice(family.indexOf('_') + 1)}`));
    const file = readdirSync(dir).find((f) => f === `${family}.ttf`);
    const bytes = readFileSync(path.join(dir, file));
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const upm = v.getUint16(table(v, 'head') + 18);
    const hhea = table(v, 'hhea');
    const os2 = table(v, 'OS/2');
    const asc = v.getInt16(hhea + 4);
    const desc = v.getInt16(hhea + 6);
    const typo = (v.getUint16(os2 + 62) & 128) !== 0;
    const tAsc = v.getInt16(os2 + 68);
    const tDesc = v.getInt16(os2 + 70);
    const extent = Math.max(asc - desc, typo ? tAsc - tDesc : 0) / upm;
    console.log([family, `upm=${upm}`, `hhea=${asc}/${desc}`, `useTypo=${typo}`, `typo=${tAsc}/${tDesc}`,
      `weightClass=${v.getUint16(os2 + 4)}`, `extent=${extent.toFixed(4)}`, `bytes=${bytes.byteLength}`].join(' '));
  }
}
