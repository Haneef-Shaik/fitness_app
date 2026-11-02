import {
  devanagariLineHeightRatio,
  fontFiles,
  fontScaling,
  lineHeightGrid,
  platformType,
  typeAliases,
  typeScale,
  type FontRole,
  type FontWeightToken,
  type TypeToken,
} from './tokens';
import type { ThemePlatform } from './types';

export type TypeScaleName = keyof typeof typeScale;
export type TypeVariant = TypeScaleName | keyof typeof typeAliases;

/** A ready React Native text style. It holds style keys only, so it can be spread into any `style`. */
export interface TextStyleToken {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: FontWeightToken;
}

type Scale = { readonly [Name in TypeScaleName]: TypeToken };
type ByVariant<T> = { readonly [Variant in TypeVariant]: T };

/** Heaviest first, so the heavier weight wins when two are equally near. */
const WEIGHTS_HEAVIEST_FIRST: readonly FontWeightToken[] = ['700', '600', '400'];

/** The registered family for a role at an exact bundled weight. It throws rather than fall back. */
export function fontFamilyFor(role: FontRole, weight: FontWeightToken): string {
  const files: Partial<Record<FontWeightToken, string>> = fontFiles[role];
  const family = files[weight];
  if (!family) throw new Error(`No bundled ${role} font at weight ${weight}`);
  return family;
}

/** The bundled weight nearest the requested one, for a script that lacks it (Hindi has no 600). */
export function nearestBundledWeight(role: FontRole, weight: FontWeightToken): FontWeightToken {
  const available = WEIGHTS_HEAVIEST_FIRST.filter((candidate) => candidate in fontFiles[role]);
  const distance = (candidate: FontWeightToken) => Math.abs(Number(candidate) - Number(weight));
  const [first, ...rest] = available;
  if (!first) throw new Error(`No bundled ${role} font`);
  return rest.reduce((best, candidate) => (distance(candidate) < distance(best) ? candidate : best), first);
}

/**
 * React Native's `maxFontSizeMultiplier` for a size: full scaling up to `fullScaleMaxSize`, then a
 * linear taper to no growth at `fixedFromSize`. Rounded to two decimals.
 */
export function maxFontSizeMultiplierFor(fontSize: number): number {
  const { maxFontScale, fullScaleMaxSize, fixedFromSize } = fontScaling;
  const share = Math.min(1, Math.max(0, (fixedFromSize - fontSize) / (fixedFromSize - fullScaleMaxSize)));
  return Math.round((1 + (maxFontScale - 1) * share) * 100) / 100;
}

/** The scale React Native applies for an OS font scale: a cap of 1 or more limits it, 0 means none. */
export function effectiveFontScale(fontScale: number, maxFontSizeMultiplier: number): number {
  return maxFontSizeMultiplier >= 1 ? Math.min(fontScale, maxFontSizeMultiplier) : fontScale;
}

function styleFor(role: FontRole, token: TypeToken, lineHeight: number): TextStyleToken {
  const weight = nearestBundledWeight(role, token.fontWeight);
  return { fontFamily: fontFamilyFor(role, weight), fontSize: token.fontSize, lineHeight, fontWeight: weight };
}

function latinStyle(token: TypeToken): TextStyleToken {
  return styleFor(token.role, token, token.lineHeight);
}

/** Hindi words use Noto Sans Devanagari and a taller line box; figures stay Latin digits. */
function devanagariStyle(token: TypeToken): TextStyleToken {
  if (token.role === 'figures') return latinStyle(token);
  const tall = Math.ceil((token.fontSize * devanagariLineHeightRatio) / lineHeightGrid) * lineHeightGrid;
  return styleFor('devanagari', token, Math.max(token.lineHeight, tall));
}

function scaleFor(platform: ThemePlatform): Scale {
  if (platform !== 'ios') return typeScale;
  return { ...typeScale, bodyLarge: { ...typeScale.bodyLarge, fontSize: platformType.iosBodySize } };
}

function mapScale<T>(scale: Scale, toValue: (token: TypeToken) => T): ByVariant<T> {
  const named = Object.fromEntries(Object.entries(scale).map(([name, token]) => [name, toValue(token)])) as Record<TypeScaleName, T>;
  const aliased = Object.fromEntries(Object.entries(typeAliases).map(([alias, name]) => [alias, named[name]]));
  return { ...named, ...aliased } as ByVariant<T>;
}

/** Every variant, by name, for Latin and Hindi text, with its text-scaling cap. */
export function createTypography(platform: ThemePlatform) {
  const scale = scaleFor(platform);
  return {
    latin: mapScale(scale, latinStyle),
    devanagari: mapScale(scale, devanagariStyle),
    maxFontSizeMultiplier: mapScale(scale, (token) => maxFontSizeMultiplierFor(token.fontSize)),
  } as const;
}
