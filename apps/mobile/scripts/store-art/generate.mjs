// DS-6 · App icon, splash and store art: deterministic generator.
//
//   node apps/mobile/scripts/store-art/generate.mjs           write apps/mobile/assets/store-art/
//   node apps/mobile/scripts/store-art/generate.mjs --check   fail if the committed art has drifted
//
// Inputs: the Momentum theme JSON (every colour), the Momentum shape SVGs (badge and decorations) and
// brand.config.json (the provisional name, DEC-01). Output: PNGs for Expo and the stores, SVG masters
// and manifest.json with a sha256 per file. Dependency-free (node:zlib and node:crypto only); no
// network, no timestamps and no randomness, so a rerun gives the same bytes. Store screenshots are
// deliberately not generated: they must be captured from a real release build.
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateBrand } from './brand.mjs';
import { normalizeRing, parseSvgPolygon } from './geometry.mjs';
import { encodePng } from './png.mjs';
import { hexToRgb, rasterize } from './raster.mjs';
import { BADGE_RADIUS, buildScene, DUMBBELL, paletteRoles } from './scenes.mjs';
import { renderSvg } from './svg.mjs';

export const REPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
export const STORE_ART_DIR = 'apps/mobile/assets/store-art';
export const GENERATOR_PATH = 'apps/mobile/scripts/store-art/generate.mjs';
export const THEME_PATH = 'apps/mobile/src/theme/themes/momentum.json';
export const BRAND_CONFIG_PATH = 'apps/mobile/scripts/store-art/brand.config.json';
export const APPROVAL_RECORD_PATH = 'docs/evidence/DS-6/approval.md';

export const SHAPE_SOURCES = Object.freeze({
  cookie12: Object.freeze({ file: 'apps/mobile/assets/momentum/imgCookie12.svg', use: 'Icon badge' }),
  cookie9: Object.freeze({ file: 'apps/mobile/assets/momentum/imgCookie9.svg', use: 'Feature graphic decoration' }),
  clover4: Object.freeze({ file: 'apps/mobile/assets/momentum/imgClover4.svg', use: 'Feature graphic decoration' }),
});

export const INPUT_FILES = Object.freeze([
  THEME_PATH,
  BRAND_CONFIG_PATH,
  ...Object.values(SHAPE_SOURCES).map(({ file }) => file),
]);

/** A pixel whose centre is within this distance of a shape's edge may hold anti-aliased coverage. */
const AA_TOLERANCE_PX = 0.75;
/** Adaptive icons: the 72 dp visible viewport on the 108 dp canvas. */
const ADAPTIVE_CONTENT_SCALE = 72 / 108;
/** Notification icons: the 20 dp live area on the 24 dp grid, filled edge to edge by the badge. */
const NOTIFICATION_CONTENT_SCALE = 20 / 24 / (2 * BADGE_RADIUS);

const ICON_MASK_SAFE = Object.freeze({
  kind: 'circle',
  radius: 0.42,
  rule: 'Inside the iOS and Google Play corner masks: content within a centred circle of radius 0.42 × size',
});
const ADAPTIVE_SAFE = Object.freeze({
  kind: 'circle',
  radius: 33 / 108,
  rule: 'Android adaptive icon safe zone: the 66 dp circle on the 108 dp canvas',
});
const SPLASH_SAFE = Object.freeze({
  kind: 'circle',
  radius: 1 / 3,
  rule: 'Android 12+ splash screen icon: content inside a circle two-thirds of the icon box',
});
const NOTIFICATION_SAFE = Object.freeze({
  kind: 'circle',
  radius: 10 / 24,
  rule: 'Material status-bar icon: the 20 dp live area on the 24 dp grid',
});
const FEATURE_SAFE = Object.freeze({
  kind: 'margin',
  pixels: 32,
  rule: 'Google Play feature graphic: key art centred, nothing within 32 px of an edge',
});

export const OUTPUTS = Object.freeze([
  Object.freeze({
    id: 'icon',
    title: 'App icon',
    file: 'icon.png',
    svg: 'icon.svg',
    width: 1024,
    height: 1024,
    channels: 3,
    opaque: true,
    scene: 'mark',
    mark: 'colour',
    background: true,
    contentScale: 1,
    safeArea: ICON_MASK_SAFE,
    purpose: 'Expo `icon`: the iOS app icon and App Store icon (1024 px, no alpha channel, square corners)',
  }),
  Object.freeze({
    id: 'adaptive-foreground',
    title: 'Android adaptive icon foreground',
    file: 'adaptive-foreground.png',
    svg: 'adaptive-foreground.svg',
    width: 1024,
    height: 1024,
    channels: 4,
    opaque: false,
    scene: 'mark',
    mark: 'colour',
    background: false,
    contentScale: ADAPTIVE_CONTENT_SCALE,
    safeArea: ADAPTIVE_SAFE,
    purpose: 'Expo `android.adaptiveIcon.foregroundImage`, over `backgroundColor` = the ground colour',
  }),
  Object.freeze({
    id: 'adaptive-monochrome',
    title: 'Android themed icon',
    file: 'adaptive-monochrome.png',
    svg: 'adaptive-monochrome.svg',
    width: 1024,
    height: 1024,
    channels: 4,
    opaque: false,
    scene: 'mark',
    mark: 'mask',
    background: false,
    contentScale: ADAPTIVE_CONTENT_SCALE,
    safeArea: ADAPTIVE_SAFE,
    purpose: 'Expo `android.adaptiveIcon.monochromeImage`: the Android 13+ themed icon, tinted by the system',
  }),
  Object.freeze({
    id: 'splash-icon',
    title: 'Splash icon',
    file: 'splash-icon.png',
    svg: null,
    width: 1024,
    height: 1024,
    channels: 4,
    opaque: false,
    scene: 'mark',
    mark: 'colour',
    background: false,
    contentScale: ADAPTIVE_CONTENT_SCALE,
    safeArea: SPLASH_SAFE,
    purpose: '`expo-splash-screen` image, on the light and dark theme surfaces',
  }),
  Object.freeze({
    id: 'notification-icon',
    title: 'Notification icon',
    file: 'notification-icon.png',
    svg: 'notification-icon.svg',
    width: 96,
    height: 96,
    channels: 4,
    opaque: false,
    scene: 'mark',
    mark: 'mask',
    background: false,
    contentScale: NOTIFICATION_CONTENT_SCALE,
    safeArea: NOTIFICATION_SAFE,
    purpose: 'Android notification small icon: a white silhouette the system tints with the notification colour',
  }),
  Object.freeze({
    id: 'play-store-icon',
    title: 'Google Play icon',
    file: 'play-store-icon.png',
    svg: null,
    width: 512,
    height: 512,
    channels: 4,
    opaque: true,
    scene: 'mark',
    mark: 'colour',
    background: true,
    contentScale: 1,
    safeArea: ICON_MASK_SAFE,
    purpose: 'Google Play listing icon (512 px, 32-bit PNG, full square; Play applies the mask and shadow)',
  }),
  Object.freeze({
    id: 'play-feature-graphic',
    title: 'Google Play feature graphic',
    file: 'play-feature-graphic.png',
    svg: 'play-feature-graphic.svg',
    width: 1024,
    height: 500,
    channels: 3,
    opaque: true,
    scene: 'feature-graphic',
    safeArea: FEATURE_SAFE,
    purpose: 'Google Play feature graphic (1024 × 500, 24-bit PNG, no alpha)',
  }),
]);

const NOT_GENERATED = Object.freeze([
  Object.freeze({
    item: 'Store screenshots',
    reason: 'Captured only from a real release build of the real UI (PL-7, PL-8); never drawn or mocked here.',
  }),
  Object.freeze({
    item: 'iOS 26 layered icon (Icon Composer .icon)',
    reason: 'Needs Apple Icon Composer; the flat 1024 px icon is the supported fallback.',
  }),
  Object.freeze({
    item: 'Wordmark',
    reason: 'The final name is not cleared (DEC-01), so no art carries a name.',
  }),
]);

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const rounded = (value) => Number(value.toFixed(6));

function loadShapes(read) {
  return Object.fromEntries(
    Object.entries(SHAPE_SOURCES).map(([name, { file, use }]) => {
      const bytes = read(file);
      const { viewBox, ring } = parseSvgPolygon(bytes.toString('utf8'), file);
      return [name, Object.freeze({ file, use, sha256: sha256(bytes), ring: normalizeRing(ring, viewBox) })];
    }),
  );
}

function insideSafeArea(area, x, y, width, height) {
  if (area.kind === 'circle') {
    const distance = Math.hypot(x + 0.5 - width / 2, y + 0.5 - height / 2);
    return distance <= area.radius * Math.min(width, height) + AA_TOLERANCE_PX;
  }
  if (area.kind === 'margin') {
    return x >= area.pixels && y >= area.pixels && x < width - area.pixels && y < height - area.pixels;
  }
  throw new Error(`Unknown safe-area kind ${String(area.kind)}`);
}

/**
 * Refuse art whose content leaves its platform safe area. Content is any pixel with alpha > 0 on a
 * transparent layer, or any pixel that differs from the ground on opaque art.
 */
export function assertContentInside({ spec, pixels, ground }) {
  const { width, height, channels, safeArea } = spec;
  const transparent = channels === 4 && !spec.opaque;
  for (let index = 0; index < width * height; index += 1) {
    const offset = index * channels;
    const isContent = transparent
      ? pixels[offset + 3] > 0
      : pixels[offset] !== ground[0] || pixels[offset + 1] !== ground[1] || pixels[offset + 2] !== ground[2];
    const x = index % width;
    const y = Math.floor(index / width);
    if (isContent && !insideSafeArea(safeArea, x, y, width, height)) {
      throw new Error(`${spec.id}: content at ${x},${y} falls outside its safe area (${safeArea.rule})`);
    }
  }
}

function renderOutput(spec, { roles, shapes, brand, ground }) {
  const scene = buildScene(spec, { roles, shapes });
  const pixels = rasterize({ ...scene, channels: spec.channels, opaque: spec.opaque });
  assertContentInside({ spec, pixels, ground });
  const png = encodePng({ width: spec.width, height: spec.height, channels: spec.channels, pixels });
  const pngFile = `${STORE_ART_DIR}/${spec.file}`;
  const svgFile = spec.svg ? `${STORE_ART_DIR}/${spec.svg}` : null;
  const svg = svgFile ? Buffer.from(renderSvg({ ...scene, title: `${brand.appName} · ${spec.title}` }), 'utf8') : null;
  return {
    entries: svgFile ? [[pngFile, png], [svgFile, svg]] : [[pngFile, png]],
    asset: {
      id: spec.id,
      file: pngFile,
      purpose: spec.purpose,
      width: spec.width,
      height: spec.height,
      format: spec.channels === 4 ? 'png-rgba-8bit' : 'png-rgb-8bit',
      opaque: spec.opaque,
      contentScale: spec.contentScale === undefined ? null : rounded(spec.contentScale),
      safeArea: { ...spec.safeArea, ...(spec.safeArea.radius === undefined ? {} : { radius: rounded(spec.safeArea.radius) }) },
      sha256: sha256(png),
      svg: svgFile ? { file: svgFile, sha256: sha256(svg) } : null,
    },
  };
}

function buildManifest({ brand, roles, themeSha, shapes, assets }) {
  return {
    schema: 'fitlog.store-art/1',
    goal: 'DS-6',
    generator: GENERATOR_PATH,
    commands: {
      generate: `node ${GENERATOR_PATH}`,
      check: `node ${GENERATOR_PATH} --check`,
      test: 'node --test apps/mobile/scripts/store-art/tests/*.test.mjs',
    },
    brand: {
      appName: brand.appName,
      nameStatus: brand.nameStatus,
      decision: brand.decision,
      trademarkClearance: brand.trademarkClearance,
      clearanceEvidence: brand.clearanceEvidence,
      note: 'No art carries the name or a wordmark. A different final name changes this metadata and the SVG titles only.',
    },
    approval: {
      recordedHere: false,
      record: APPROVAL_RECORD_PATH,
      note: 'The generator never records approval. Approval is a dated entry in the record above.',
    },
    palette: { source: THEME_PATH, sha256: themeSha, roles },
    notificationColor: {
      ...roles.notification,
      why: 'Android uses it for the small icon and the app name. docs/22 forbids volt lime as a thin line or small text on light surfaces, so it is the light primary.',
    },
    mark: {
      badge: `Momentum Cookie 12, lobe tips at ${BADGE_RADIUS} of the visible icon, in ${roles.badge.token}`,
      glyph: `Dumbbell built from capsules (bar ${DUMBBELL.barLength} long), rotated -45°, in ${roles.glyph.token}`,
    },
    sources: Object.entries(shapes).map(([name, shape]) => ({
      name,
      file: shape.file,
      use: shape.use,
      sha256: shape.sha256,
    })),
    assets,
    notGenerated: NOT_GENERATED,
  };
}

/**
 * Build every store-art file in memory.
 * @param {{ repoRoot?: string, brand?: object }} [options] `brand` overrides brand.config.json (tests)
 * @returns {{ files: Map<string, Buffer>, manifest: object }} repo-relative POSIX path → bytes
 */
export function buildStoreArt({ repoRoot = REPO_ROOT, brand: brandOverride } = {}) {
  const read = (file) => readFileSync(join(repoRoot, file));
  const themeBytes = read(THEME_PATH);
  const roles = paletteRoles(JSON.parse(themeBytes.toString('utf8')));
  const brand = validateBrand(brandOverride ?? JSON.parse(read(BRAND_CONFIG_PATH).toString('utf8')), {
    readEvidence: (file) => {
      const absolute = join(repoRoot, file);
      return existsSync(absolute) ? readFileSync(absolute, 'utf8') : null;
    },
  });
  const shapes = loadShapes(read);
  const ground = hexToRgb(roles.ground.hex);
  const rendered = OUTPUTS.map((spec) => renderOutput(spec, { roles, shapes, brand, ground }));
  const manifest = buildManifest({
    brand,
    roles,
    themeSha: sha256(themeBytes),
    shapes,
    assets: rendered.map(({ asset }) => asset),
  });
  const files = new Map([
    ...rendered.flatMap(({ entries }) => entries),
    [`${STORE_ART_DIR}/manifest.json`, Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8')],
  ]);
  return { files, manifest };
}

/** Differences between the generated files and the files under `root`, in a stable order. */
export function compareWithDisk(files, root) {
  const drift = [...files].flatMap(([file, expected]) => {
    const absolute = join(root, file);
    if (!existsSync(absolute)) {
      return [{ kind: 'missing', file }];
    }
    return readFileSync(absolute).equals(expected) ? [] : [{ kind: 'differs', file }];
  });
  const directory = join(root, STORE_ART_DIR);
  const unexpected = existsSync(directory)
    ? readdirSync(directory)
        .filter((name) => /\.(png|svg|json)$/i.test(name) && !files.has(`${STORE_ART_DIR}/${name}`))
        .sort()
        .map((name) => ({ kind: 'unexpected', file: `${STORE_ART_DIR}/${name}` }))
    : [];
  return [...drift, ...unexpected];
}

export function writeFiles(files, root) {
  for (const [file, bytes] of files) {
    const absolute = join(root, file);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, bytes);
  }
}

export function parseArgs(argv) {
  const unknown = argv.filter((argument) => argument !== '--check');
  if (unknown.length > 0) {
    throw new Error(`Unknown argument: ${unknown.join(' ')}. Usage: node ${GENERATOR_PATH} [--check]`);
  }
  return { check: argv.includes('--check') };
}

/** CLI body; returns the exit code. `root`, `stdout` and `stderr` are injectable for tests. */
export function main(argv, { root = REPO_ROOT, stdout = process.stdout, stderr = process.stderr } = {}) {
  const { check } = parseArgs(argv);
  const { files } = buildStoreArt({ repoRoot: root });
  if (check) {
    const problems = compareWithDisk(files, root);
    if (problems.length > 0) {
      const lines = problems.map(({ kind, file }) => `  ${kind}: ${file}`).join('\n');
      stderr.write(`Store art does not match the generator:\n${lines}\nRegenerate with: node ${GENERATOR_PATH}\n`);
      return 1;
    }
    stdout.write(`Store art matches the generator (${files.size} files).\n`);
    return 0;
  }
  writeFiles(files, root);
  stdout.write(`Wrote ${files.size} files to ${STORE_ART_DIR}.\n`);
  return 0;
}

function invokedDirectly() {
  if (!process.argv[1]) {
    return false;
  }
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
