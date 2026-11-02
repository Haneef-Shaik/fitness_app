import { fontFiles, type FontRole } from './tokens';

type Licence =
  | { readonly id: 'OFL-1.1'; readonly name: 'SIL Open Font License 1.1'; readonly url: string }
  | { readonly id: 'Apache-2.0'; readonly name: 'Apache License 2.0'; readonly url: string };

/** One bundled typeface, as the in-app licences screen lists it (PRD §19.1, DEC-16). */
export interface FontLicence {
  readonly family: string;
  /** A text role from the theme, or `icons` for a symbol font a dependency bundles. */
  readonly role: FontRole | 'icons';
  /** The npm package that ships the font files, at its exact locked version. */
  readonly package: string;
  readonly version: string;
  /** `direct` when apps/mobile depends on the package; `transitive` when another dependency bundles it. */
  readonly dependency: 'direct' | 'transitive';
  /** Registered family names, one per bundled static weight. */
  readonly files: readonly string[];
  readonly licence: Licence;
  /** The notice's copyright line, or null when the licence the package ships has none (see DEC-16). */
  readonly copyright: string | null;
  /** The full licence text, a byte-for-byte copy of the package's own, relative to `apps/mobile/`. */
  readonly noticeFile: string;
  readonly source: string;
}

const OFL = { id: 'OFL-1.1', name: 'SIL Open Font License 1.1', url: 'https://openfontlicense.org' } as const;
const APACHE = { id: 'Apache-2.0', name: 'Apache License 2.0', url: 'https://www.apache.org/licenses/LICENSE-2.0' } as const;

export const fontLicences: readonly FontLicence[] = [
  {
    family: 'Google Sans Flex',
    role: 'words',
    package: '@expo-google-fonts/google-sans-flex',
    version: '0.4.6',
    dependency: 'direct',
    files: Object.values(fontFiles.words),
    licence: OFL,
    copyright: null,
    noticeFile: 'assets/licenses/google-sans-flex-OFL.txt',
    source: 'https://fonts.google.com/specimen/Google+Sans+Flex',
  },
  {
    family: 'Roboto Condensed',
    role: 'figures',
    package: '@expo-google-fonts/roboto-condensed',
    version: '0.4.2',
    dependency: 'direct',
    files: Object.values(fontFiles.figures),
    licence: OFL,
    copyright: 'Copyright 2011 The Roboto Project Authors (https://github.com/googlefonts/roboto-classic)',
    noticeFile: 'assets/licenses/roboto-condensed-OFL.txt',
    source: 'https://fonts.google.com/specimen/Roboto+Condensed',
  },
  {
    family: 'Noto Sans Devanagari',
    role: 'devanagari',
    package: '@expo-google-fonts/noto-sans-devanagari',
    version: '0.4.1',
    dependency: 'direct',
    files: Object.values(fontFiles.devanagari),
    licence: OFL,
    copyright: 'Copyright 2022 The Noto Project Authors (https://github.com/notofonts/devanagari)',
    noticeFile: 'assets/licenses/noto-sans-devanagari-OFL.txt',
    source: 'https://fonts.google.com/specimen/Noto+Sans+Devanagari',
  },
  {
    // Bundled by expo-symbols, which expo-router's Android native tabs import for Material icon names.
    family: 'Material Symbols',
    role: 'icons',
    package: '@expo-google-fonts/material-symbols',
    version: '0.4.50',
    dependency: 'transitive',
    files: ['MaterialSymbols_400Regular'],
    licence: APACHE,
    copyright: null,
    noticeFile: 'assets/licenses/material-symbols-Apache-2.0.txt',
    source: 'https://fonts.google.com/icons',
  },
];
