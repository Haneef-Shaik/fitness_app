import { fs, path, resolveModule } from './node';

/** sfnt versions for TrueType ('\0\1\0\0', 'true') and CFF ('OTTO') outlines. */
const SFNT_VERSIONS = new Set([0x00010000, 0x74727565, 0x4f54544f]);
const USE_TYPO_METRICS = 1 << 7;

export interface FontFileFacts {
  /** OS/2 usWeightClass: the weight the file itself declares. */
  readonly weightClass: number;
  /** Ascent and descent the platform lays text out with, in em (descent positive, below the baseline). */
  readonly ascent: number;
  readonly descent: number;
}

export interface GlyphBounds {
  /** Highest and lowest outline points of the text's glyphs, in em (yMin negative below the baseline). */
  readonly yMax: number;
  readonly yMin: number;
  /** Characters the font has no glyph for. */
  readonly missing: string;
}

/** Finds the .ttf an `@expo-google-fonts` weight entry ships, e.g. `NotoSansDevanagari_400Regular`. */
export function bundledFontFile(packageName: string, family: string): string {
  const weightEntry = family.slice(family.indexOf('_') + 1);
  const entryDir = path.dirname(resolveModule(`${packageName}/${weightEntry}`));
  for (const dir of [entryDir, path.dirname(entryDir)]) {
    const file = fs.readdirSync(dir).find((name) => name === `${family}.ttf`);
    if (file) return path.join(dir, file);
  }
  throw new Error(`${packageName} does not ship ${family}.ttf next to its ${weightEntry} entry`);
}

function open(file: string): DataView {
  const bytes = fs.readFileSync(file);
  const font = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (!SFNT_VERSIONS.has(font.getUint32(0))) throw new Error(`${file} is not an sfnt font`);
  return font;
}

function tableOffset(font: DataView, tag: string): number {
  const numTables = font.getUint16(4);
  for (let index = 0; index < numTables; index += 1) {
    const record = 12 + index * 16;
    const recordTag = String.fromCharCode(...[0, 1, 2, 3].map((byte) => font.getUint8(record + byte)));
    if (recordTag === tag) return font.getUint32(record + 8);
  }
  throw new Error(`Font has no ${tag} table`);
}

/**
 * The metrics that decide clipping and faux bold on Android: FreeType and Skia lay text out with
 * the OS/2 typo ascent and descent when the font sets USE_TYPO_METRICS, and with `hhea` otherwise.
 */
export function readFontFacts(file: string): FontFileFacts {
  const font = open(file);
  const unitsPerEm = font.getUint16(tableOffset(font, 'head') + 18);
  const os2 = tableOffset(font, 'OS/2');
  const usesTypo = (font.getUint16(os2 + 62) & USE_TYPO_METRICS) !== 0;
  const [ascentAt, descentAt] = usesTypo ? [os2 + 68, os2 + 70] : [tableOffset(font, 'hhea') + 4, tableOffset(font, 'hhea') + 6];
  return {
    weightClass: font.getUint16(os2 + 4),
    ascent: font.getInt16(ascentAt) / unitsPerEm,
    descent: -font.getInt16(descentAt) / unitsPerEm,
  };
}

/** Glyph id for a code point from a Unicode cmap subtable (format 12, then format 4). */
function glyphIdFor(font: DataView, codePoint: number): number {
  const cmap = tableOffset(font, 'cmap');
  const subtables = Array.from({ length: font.getUint16(cmap + 2) }, (_, index) => cmap + 4 + index * 8)
    .map((record) => ({ platform: font.getUint16(record), encoding: font.getUint16(record + 2), at: cmap + font.getUint32(record + 4) }))
    .filter(({ platform, encoding }) => platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10)));
  for (const { at } of subtables) {
    const format = font.getUint16(at);
    if (format === 12) {
      for (let group = 0; group < font.getUint32(at + 12); group += 1) {
        const record = at + 16 + group * 12;
        const start = font.getUint32(record);
        if (codePoint >= start && codePoint <= font.getUint32(record + 4)) return font.getUint32(record + 8) + codePoint - start;
      }
    } else if (format === 4 && codePoint <= 0xffff) {
      const segCount = font.getUint16(at + 6) / 2;
      const ends = at + 14;
      const starts = ends + segCount * 2 + 2;
      const deltas = starts + segCount * 2;
      const ranges = deltas + segCount * 2;
      for (let segment = 0; segment < segCount; segment += 1) {
        if (codePoint > font.getUint16(ends + segment * 2)) continue;
        const start = font.getUint16(starts + segment * 2);
        if (codePoint < start) break;
        const delta = font.getInt16(deltas + segment * 2);
        const range = font.getUint16(ranges + segment * 2);
        if (range === 0) return (codePoint + delta) & 0xffff;
        const glyph = font.getUint16(ranges + segment * 2 + range + (codePoint - start) * 2);
        return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
      }
    }
  }
  return 0;
}

/**
 * Vertical bounds of the text's glyphs, one code point at a time. This is unshaped: conjuncts and
 * stacked marks that Devanagari shaping substitutes are not measured, so device captures remain the proof.
 */
export function glyphBounds(file: string, text: string): GlyphBounds {
  const font = open(file);
  const head = tableOffset(font, 'head');
  const unitsPerEm = font.getUint16(head + 18);
  const longOffsets = font.getInt16(head + 50) === 1;
  const loca = tableOffset(font, 'loca');
  const glyf = tableOffset(font, 'glyf');
  const offsetOf = (glyph: number) => (longOffsets ? font.getUint32(loca + glyph * 4) : font.getUint16(loca + glyph * 2) * 2);
  let yMax = 0;
  let yMin = 0;
  let missing = '';
  for (const character of text.replace(/\s/g, '')) {
    const glyph = glyphIdFor(font, character.codePointAt(0) ?? 0);
    if (glyph === 0) {
      missing += character;
    } else if (offsetOf(glyph) !== offsetOf(glyph + 1)) {
      yMin = Math.min(yMin, font.getInt16(glyf + offsetOf(glyph) + 4));
      yMax = Math.max(yMax, font.getInt16(glyf + offsetOf(glyph) + 8));
    }
  }
  return { yMax: yMax / unitsPerEm, yMin: yMin / unitsPerEm, missing };
}
