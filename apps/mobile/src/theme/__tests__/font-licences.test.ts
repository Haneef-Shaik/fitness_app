import { fontLicences } from '../font-licences';
import { fontFiles, type FontRole } from '../tokens';
import { appRoot, fs, path, resolveModule } from './node';

const read = (file: string) => fs.readFileSync(path.join(appRoot, file), 'utf8').replace(/^﻿/, '');
const firstLine = (file: string) => read(file).split(/\r?\n/)[0];
const sorted = <T>(values: readonly T[]) => [...values].sort();
const textRoles = Object.keys(fontFiles) as FontRole[];
const textFonts = fontLicences.filter((entry) => (textRoles as readonly string[]).includes(entry.role));
const LICENCE_TEXT = {
  'OFL-1.1': ['This Font Software is licensed under the SIL Open Font License, Version 1.1.',
    'SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007', 'PERMISSION & CONDITIONS'],
  'Apache-2.0': ['Apache License', 'Version 2.0, January 2004', 'TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION'],
} as const;

describe('bundled font licences (in-app licences data)', () => {
  it('lists each text role exactly once, with every file that role uses', () => {
    expect(sorted(textFonts.map((entry) => entry.role))).toEqual(sorted(textRoles));
    for (const entry of textFonts) {
      expect(sorted(entry.files)).toEqual(sorted(Object.values(fontFiles[entry.role as FontRole])));
    }
  });

  it('registers every font package in the dependency tree at its locked version', () => {
    const lockfile = fs.readFileSync(path.join(appRoot, '../../pnpm-lock.yaml'), 'utf8');
    const locked = new Set([...lockfile.matchAll(/^ {2}'(@expo-google-fonts\/[\w-]+@[\w.-]+)':$/gm)].map(([, id]) => id));
    expect(locked.size).toBeGreaterThan(0);
    expect(sorted(fontLicences.map((entry) => `${entry.package}@${entry.version}`))).toEqual(sorted([...locked]));
  });

  it('marks the packages the app depends on directly, at the version it depends on', () => {
    const { dependencies } = JSON.parse(read('package.json')) as { dependencies: Record<string, string> };
    const direct = Object.entries(dependencies).filter(([name]) => name.startsWith('@expo-google-fonts/'));
    expect(sorted(fontLicences.filter((entry) => entry.dependency === 'direct').map((entry) => `${entry.package}@${entry.version}`)))
      .toEqual(sorted(direct.map(([name, version]) => `${name}@${version}`)));
  });

  it.each(fontLicences.map((entry) => [entry.family, entry] as const))('%s keeps the licence its package ships, byte for byte', (_, entry) => {
    expect(entry.noticeFile.startsWith('assets/licenses/')).toBe(true);
    const shipped = fs.readFileSync(path.join(path.dirname(resolveModule(`${entry.package}/package.json`)), 'LICENSE_FONT'), 'utf8');
    expect(read(entry.noticeFile)).toBe(shipped);
    for (const phrase of LICENCE_TEXT[entry.licence.id]) expect(shipped).toContain(phrase);
  });

  it.each(fontLicences.filter((entry) => entry.copyright !== null).map((entry) => [entry.family, entry] as const))(
    '%s lists the copyright line its notice starts with', (_, entry) => {
      expect(firstLine(entry.noticeFile)).toBe(entry.copyright);
    },
  );

  it('pins the OFL notice that ships without a copyright line (DEC-16 follow-up)', () => {
    const ofl = fontLicences.filter((entry) => entry.licence.id === 'OFL-1.1');
    expect(ofl.filter((entry) => entry.copyright === null).map((entry) => entry.family)).toEqual(['Google Sans Flex']);
    expect(firstLine('assets/licenses/google-sans-flex-OFL.txt')).not.toMatch(/^Copyright/);
  });

  it('matches the text fonts the root layout imports and loads, so no style names an unloaded font', () => {
    const layout = read('src/app/_layout.tsx');
    const imports = [...layout.matchAll(/import \{ (\w+) \} from '(@expo-google-fonts\/[\w-]+)\/(\w+)';/g)]
      .map(([, family, packageName, entry]) => ({ family, packageName, entry }));
    const loaded = (layout.match(/useFonts\(\{([^}]*)\}\)/)?.[1] ?? '').split(',').map((name) => name.trim()).filter(Boolean);
    const registered = textFonts.flatMap((entry) => entry.files.map((family) => `${family} from ${entry.package}`));

    expect(sorted(imports.map(({ family, packageName }) => `${family} from ${packageName}`))).toEqual(sorted(registered));
    for (const { family, entry } of imports) expect(family?.endsWith(`_${entry}`)).toBe(true);
    expect(sorted(loaded)).toEqual(sorted(textFonts.flatMap((entry) => entry.files)));
  });
});
