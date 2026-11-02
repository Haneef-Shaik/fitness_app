/// <reference types="node" />
/**
 * theme:generate — regenerates src/theme/themes/momentum.json from momentum.recipe.json and seed #C6F432
 * with Material's Vibrant scheme. Default `--check` fails on any difference; see `usage` for every mode.
 * Run through tsx: material-color-utilities 0.4.0 has an extensionless ESM import that plain Node rejects.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { argbFromHex, Hct, hexFromArgb, SchemeVibrant } from '@material/material-color-utilities';

import type { ColorScheme } from '../src/theme/types';
import {
  diffPalettes,
  parseCommand,
  parseRecipe,
  RecipeError,
  recordCurations,
  reportLines,
  resolvePalette,
  serializePalette,
  serializeRecipe,
  usage,
  UsageError,
  type PaletteRecipe,
  type SchemeSource,
} from './palette/recipe';

const themeDirectory = join(__dirname, '..', 'src', 'theme', 'themes');
const defaultRecipePath = join(themeDirectory, 'momentum.recipe.json');
const defaultPalettePath = join(themeDirectory, 'momentum.json');

function readJson(path: string): unknown {
  const text = readFileSync(path, 'utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new RecipeError(`${path} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function materialSource(recipe: PaletteRecipe): SchemeSource {
  const { contrastLevel, specVersion, platform } = recipe.scheme;
  const seed = Hct.fromInt(argbFromHex(recipe.seed));
  const schemes: Record<ColorScheme, SchemeVibrant> = {
    dark: new SchemeVibrant(seed, true, contrastLevel, specVersion, platform),
    light: new SchemeVibrant(seed, false, contrastLevel, specVersion, platform),
  };
  return (scheme, color) => hexFromArgb(schemes[scheme][color]).toUpperCase();
}

function curationTotal(recipe: PaletteRecipe) {
  return Object.keys(recipe.curations.dark).length + Object.keys(recipe.curations.light).length;
}

function run(args: readonly string[]): number {
  const command = parseCommand(args);
  const recipePath = command.recipePath ?? defaultRecipePath;
  const palettePath = command.palettePath ?? defaultPalettePath;
  const recipe = parseRecipe(readJson(recipePath));

  if (command.mode === 'candidate') {
    const seed = command.seed ?? recipe.seed;
    const candidate: PaletteRecipe = { ...recipe, id: `custom-${seed.slice(1).toLowerCase()}`, seed, curations: { dark: {}, light: {} } };
    process.stdout.write(serializePalette(resolvePalette(candidate, materialSource(candidate), { requireRecorded: false }).definition));
    return 0;
  }

  const source = materialSource(recipe);
  if (command.mode === 'report') {
    process.stdout.write(`${reportLines(recipe, source).join('\n')}\n`);
    return 0;
  }
  if (command.mode === 'record') {
    const recorded = recordCurations(recipe, source);
    writeFileSync(recipePath, serializeRecipe(recorded));
    process.stdout.write(`Recorded ${curationTotal(recorded)} curations against seed ${recipe.seed}; `
      + `${curationTotal(recipe) - curationTotal(recorded)} now come straight from the seed. Pinned values are unchanged.\n`);
    return 0;
  }

  const { definition, problems } = resolvePalette(recipe, source, { requireRecorded: true });
  if (problems.length > 0) {
    process.stderr.write(`${problems.map((problem) => problem.message).join('\n')}\n`);
    return 1;
  }
  const generated = serializePalette(definition);
  if (command.mode === 'write') {
    writeFileSync(palettePath, generated);
    process.stdout.write(`Wrote ${palettePath} from seed ${recipe.seed}.\n`);
    return 0;
  }

  const committed = readFileSync(palettePath, 'utf8');
  if (committed === generated) {
    process.stdout.write(`momentum.json matches its recipe: seed ${recipe.seed}, Material ${recipe.scheme.variant} `
      + `${recipe.scheme.specVersion}, ${curationTotal(recipe)} recorded curations, no diff.\n`);
    return 0;
  }
  const differences = diffPalettes(definition, readJson(palettePath));
  const detail = differences.length > 0 ? differences.join('\n') : 'Values match but formatting differs; run theme:generate --write.';
  process.stderr.write(`${palettePath} does not match its recipe:\n${detail}\n`);
  return 1;
}

try {
  process.exitCode = run(process.argv.slice(2));
} catch (error) {
  if (error instanceof UsageError) {
    process.stderr.write(`${error.message}\n${usage}\n`);
    process.exitCode = 2;
  } else if (error instanceof RecipeError) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
