import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';

import {
  assertContentInside,
  buildStoreArt,
  compareWithDisk,
  INPUT_FILES,
  main,
  OUTPUTS,
  parseArgs,
  STORE_ART_DIR,
  writeFiles,
} from '../generate.mjs';
import { decodePng } from '../png.mjs';
import {
  alphaAt,
  contentStats,
  contentTest,
  hexOf,
  paletteFidelity,
  pathPoints,
  pixel,
  probe,
  readJson,
  REPO_ROOT,
  textSink,
} from './helpers.mjs';

const theme = readJson('apps/mobile/src/theme/themes/momentum.json');
const GROUND = theme.colors.dark.surface;
const LIME = theme.colors.dark.primaryContainer;
const TRACK = theme.colors.dark.surfaceHighest;
const TONAL = theme.colors.dark.secondaryContainer;
const WHITE = '#FFFFFF';

const art = buildStoreArt({ repoRoot: REPO_ROOT });
const specs = Object.fromEntries(OUTPUTS.map((spec) => [spec.id, spec]));
const fileFor = (name) => `${STORE_ART_DIR}/${name}`;
const decoded = new Map(OUTPUTS.map((spec) => [spec.id, decodePng(art.files.get(fileFor(spec.file)))]));
const image = (id) => decoded.get(id);
const svgText = (id) => art.files.get(fileFor(specs[id].svg)).toString('utf8');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

// Points in visible-icon units (the 72 dp viewport = 1.0), measured from the centre.
const ON_BADGE = [0, -0.29]; // inside the scallop valley, clear of the dumbbell
const CENTRE = [0, 0]; // on the dumbbell bar
const OUTSIDE = [0, -0.45]; // past the badge's lobe tips

// Expected from the platform rules, written independently of the generator's OUTPUTS table.
const PLATFORM = {
  icon: { size: [1024, 1024], channels: 3, safe: 0.42, reach: 0.39 },
  'adaptive-foreground': { size: [1024, 1024], channels: 4, safe: 33 / 108, reach: 0.26 },
  'adaptive-monochrome': { size: [1024, 1024], channels: 4, safe: 33 / 108, reach: 0.26 },
  'splash-icon': { size: [1024, 1024], channels: 4, safe: 1 / 3, reach: 0.26 },
  'notification-icon': { size: [96, 96], channels: 4, safe: 10 / 24, reach: 0.4 },
  'play-store-icon': { size: [512, 512], channels: 4, safe: 0.42, reach: 0.39 },
  'play-feature-graphic': { size: [1024, 500], channels: 3 },
};
const TRANSPARENT_IDS = ['adaptive-foreground', 'adaptive-monochrome', 'splash-icon', 'notification-icon'];
const MASK_IDS = ['adaptive-monochrome', 'notification-icon'];
const COLOUR_ICON_IDS = ['icon', 'play-store-icon'];
const AA_TOLERANCE = 0.75;

describe('store-art outputs', () => {
  it('plans exactly the DS-6 asset set', () => {
    assert.deepEqual(Object.keys(specs).sort(), Object.keys(PLATFORM).sort());
  });

  for (const [id, expected] of Object.entries(PLATFORM)) {
    it(`${id}: has the platform size and channel layout`, () => {
      const decodedImage = image(id);
      assert.deepEqual([decodedImage.width, decodedImage.height], expected.size);
      assert.equal(decodedImage.channels, expected.channels);
    });
  }

  it('keeps the 32-bit Play icon fully opaque', () => {
    const alphas = image('play-store-icon').pixels.filter((_, index) => index % 4 === 3);
    assert.equal(alphas.length, 512 * 512);
    assert.ok(
      alphas.every((alpha) => alpha === 255),
      'every alpha is 255',
    );
  });

  for (const id of TRANSPARENT_IDS) {
    it(`${id}: is transparent outside the mark`, () => {
      const layer = image(id);
      assert.equal(alphaAt(layer, 0, 0), 0, 'top-left corner');
      assert.equal(alphaAt(layer, layer.width - 1, layer.height - 1), 0, 'bottom-right corner');
      assert.equal(alphaAt(layer, ...probe(specs[id], OUTSIDE)), 0, 'past the lobe tips');
    });
  }

  for (const [id, expected] of Object.entries(PLATFORM).filter(([, rule]) => rule.safe !== undefined)) {
    it(`${id}: keeps every content pixel inside the platform safe area`, () => {
      const layer = image(id);
      const stats = contentStats(layer, contentTest(layer, TRANSPARENT_IDS.includes(id) ? null : GROUND));
      assert.ok(stats.count > 0, 'has content');
      assert.ok(
        stats.maxRadius <= expected.safe * layer.width + AA_TOLERANCE,
        `reach ${stats.maxRadius.toFixed(2)} px exceeds the safe radius ${(expected.safe * layer.width).toFixed(2)} px`,
      );
      assert.ok(stats.maxRadius >= expected.reach * layer.width, 'the badge is drawn at full size, not shrunk');
    });
  }

  it('notification-icon: stays inside the 20 dp live area of the 24 dp grid (8 px padding at 96 px)', () => {
    const stats = contentStats(image('notification-icon'), contentTest(image('notification-icon'), null));
    assert.ok(stats.minX >= 8 && stats.minY >= 8, `top-left ${stats.minX},${stats.minY}`);
    assert.ok(stats.maxX <= 87 && stats.maxY <= 87, `bottom-right ${stats.maxX},${stats.maxY}`);
  });

  for (const id of COLOUR_ICON_IDS) {
    it(`${id}: is a volt lime badge with a ground-coloured dumbbell on the Momentum ground`, () => {
      const icon = image(id);
      assert.equal(hexOf(pixel(icon, 0, 0)), GROUND, 'ground in the corner');
      assert.equal(hexOf(pixel(icon, ...probe(specs[id], OUTSIDE))), GROUND, 'ground past the lobe tips');
      assert.equal(hexOf(pixel(icon, ...probe(specs[id], ON_BADGE))), LIME, 'lime badge');
      assert.equal(hexOf(pixel(icon, ...probe(specs[id], CENTRE))), GROUND, 'dumbbell cut through to the ground');
    });
  }

  for (const id of ['adaptive-foreground', 'splash-icon']) {
    it(`${id}: draws the same badge and dumbbell, fully opaque inside the mark`, () => {
      const layer = image(id);
      const onBadge = probe(specs[id], ON_BADGE);
      const centre = probe(specs[id], CENTRE);
      assert.equal(hexOf(pixel(layer, ...onBadge)), LIME);
      assert.equal(alphaAt(layer, ...onBadge), 255);
      assert.equal(hexOf(pixel(layer, ...centre)), GROUND);
      assert.equal(alphaAt(layer, ...centre), 255);
    });
  }

  for (const id of MASK_IDS) {
    it(`${id}: is a pure white silhouette with the dumbbell knocked out`, () => {
      const layer = image(id);
      const offenders = [];
      for (let y = 0; y < layer.height && offenders.length === 0; y += 1) {
        for (let x = 0; x < layer.width; x += 1) {
          if (alphaAt(layer, x, y) > 0 && hexOf(pixel(layer, x, y)) !== WHITE) {
            offenders.push(`${x},${y} is ${hexOf(pixel(layer, x, y))}`);
          }
        }
      }
      assert.deepEqual(offenders, [], 'every visible pixel is pure white');
      assert.equal(alphaAt(layer, ...probe(specs[id], ON_BADGE)), 255, 'solid badge');
      assert.equal(alphaAt(layer, ...probe(specs[id], CENTRE)), 0, 'knocked-out dumbbell');
    });
  }

  for (const [id, palette] of [
    ['icon', [GROUND, LIME]],
    ['play-store-icon', [GROUND, LIME]],
    ['adaptive-foreground', [GROUND, LIME]],
    ['splash-icon', [GROUND, LIME]],
    ['play-feature-graphic', [GROUND, LIME, TRACK, TONAL]],
  ]) {
    it(`${id}: uses only Momentum theme colours outside anti-aliased edges`, () => {
      const share = paletteFidelity(image(id), palette);
      assert.ok(share >= 0.97, `only ${(share * 100).toFixed(2)}% of pixels are exact palette colours`);
    });
  }
});

describe('play-feature-graphic', () => {
  const graphic = image('play-feature-graphic');
  const at = (x, y) => hexOf(pixel(graphic, x, y));

  it('centres the lime badge with its dumbbell on the ground', () => {
    assert.equal(at(0, 0), GROUND);
    assert.equal(at(512, 141), LIME, 'badge');
    assert.equal(at(512, 250), GROUND, 'dumbbell');
  });

  it('draws a 270° tonal wavy progress ring over a full neutral track', () => {
    assert.equal(at(708, 250), TONAL, 'progress at 3 o’clock');
    assert.equal(at(369, 107), TRACK, 'track only, upper-left');
  });

  it('places tonal Momentum shapes as quiet decoration', () => {
    assert.equal(at(170, 140), TONAL, 'Clover 4');
    assert.equal(at(860, 360), TONAL, 'Cookie 9');
  });

  it('keeps 32 px clear on every edge', () => {
    const stats = contentStats(graphic, contentTest(graphic, GROUND));
    assert.ok(stats.minX >= 32 && stats.minY >= 32, `top-left ${stats.minX},${stats.minY}`);
    assert.ok(stats.maxX < 1024 - 32 && stats.maxY < 500 - 32, `bottom-right ${stats.maxX},${stats.maxY}`);
  });
});

describe('svg masters', () => {
  for (const spec of OUTPUTS.filter(({ svg }) => svg)) {
    it(`${spec.id}: is a vector master of the same canvas with the name only as a title`, () => {
      const svg = svgText(spec.id);
      assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
      assert.ok(svg.includes(`viewBox="0 0 ${spec.width} ${spec.height}"`));
      assert.ok(svg.includes('<title>FitLog · '));
      assert.ok(!svg.includes('<text'), 'no wordmark or text');
      assert.ok(!/NaN|undefined|Infinity/.test(svg));
    });
  }

  it('adaptive-foreground.svg: every vertex sits inside the 66 dp safe circle', () => {
    const safe = (33 / 108) * 1024;
    for (const [x, y] of pathPoints(svgText('adaptive-foreground'))) {
      assert.ok(Math.hypot(x - 512, y - 512) <= safe, `vertex ${x},${y}`);
    }
  });

  it('adaptive-monochrome.svg: knocks the dumbbell out with a mask', () => {
    const svg = svgText('adaptive-monochrome');
    assert.ok(svg.includes('<mask id="knockout"'));
    assert.ok(svg.includes('mask="url(#knockout)"'));
  });
});

describe('manifest', () => {
  const manifest = JSON.parse(art.files.get(fileFor('manifest.json')).toString('utf8'));

  it('lists every generated file with its sha256', () => {
    assert.equal(manifest.assets.length, OUTPUTS.length);
    for (const asset of manifest.assets) {
      assert.equal(asset.sha256, sha256(art.files.get(asset.file)), asset.file);
      if (asset.svg) {
        assert.equal(asset.svg.sha256, sha256(art.files.get(asset.svg.file)), asset.svg.file);
      }
    }
  });

  it('records the name as provisional and claims no trademark clearance', () => {
    assert.equal(manifest.brand.appName, 'FitLog');
    assert.equal(manifest.brand.nameStatus, 'provisional');
    assert.equal(manifest.brand.trademarkClearance, 'unproved');
    assert.equal(manifest.brand.clearanceEvidence, null);
    assert.equal(manifest.approval.recordedHere, false);
  });

  it('takes every colour from the Momentum theme and pins the theme file', () => {
    assert.equal(manifest.palette.source, 'apps/mobile/src/theme/themes/momentum.json');
    assert.equal(manifest.palette.sha256, sha256(readFileSync(join(REPO_ROOT, manifest.palette.source))));
    assert.equal(manifest.palette.roles.badge.hex, LIME);
    assert.equal(manifest.palette.roles.ground.hex, GROUND);
  });

  it('sets the notification colour to light primary, never lime on light surfaces', () => {
    assert.equal(manifest.notificationColor.token, 'light.primary');
    assert.equal(manifest.notificationColor.hex, theme.colors.light.primary);
    assert.notEqual(manifest.notificationColor.hex, LIME);
  });

  it('pins the Momentum shapes it reuses', () => {
    for (const source of manifest.sources) {
      assert.equal(source.sha256, sha256(readFileSync(join(REPO_ROOT, source.file))), source.file);
    }
    assert.deepEqual(manifest.sources.map(({ name }) => name).sort(), ['clover4', 'cookie12', 'cookie9']);
  });

  it('declares that store screenshots are not drawn', () => {
    assert.ok(manifest.notGenerated.some(({ item }) => item === 'Store screenshots'));
  });

  it('contains no timestamps or machine paths', () => {
    const text = art.files.get(fileFor('manifest.json')).toString('utf8');
    assert.ok(!text.includes(REPO_ROOT), 'no absolute paths');
    assert.ok(!/\d{4}-\d{2}-\d{2}T\d{2}:/.test(text), 'no timestamps');
  });
});

describe('determinism and configurability', () => {
  it('produces byte-identical files on a second run', () => {
    const again = buildStoreArt({ repoRoot: REPO_ROOT });
    assert.deepEqual([...again.files.keys()], [...art.files.keys()]);
    for (const [file, bytes] of art.files) {
      assert.ok(again.files.get(file).equals(bytes), `${file} changed between runs`);
    }
  });

  it('keeps the raster art name-independent: a new provisional name changes metadata only', () => {
    const renamed = buildStoreArt({
      repoRoot: REPO_ROOT,
      brand: { appName: 'Placeholder Name', nameStatus: 'provisional', decision: 'DEC-01', clearanceEvidence: null },
    });
    for (const spec of OUTPUTS) {
      assert.ok(renamed.files.get(fileFor(spec.file)).equals(art.files.get(fileFor(spec.file))), spec.file);
    }
    assert.equal(renamed.manifest.brand.appName, 'Placeholder Name');
  });

  it('refuses to generate under a cleared name without clearance evidence', () => {
    assert.throws(
      () =>
        buildStoreArt({
          repoRoot: REPO_ROOT,
          brand: { appName: 'FitLog', nameStatus: 'cleared', decision: 'DEC-01', clearanceEvidence: null },
        }),
      /clearanceEvidence/,
    );
  });
});

describe('safe-area guard', () => {
  const circleSpec = {
    id: 'fixture',
    width: 4,
    height: 4,
    channels: 4,
    opaque: false,
    safeArea: { kind: 'circle', radius: 0.25, rule: 'fixture circle' },
  };
  const withAlphaAt = (x, y) => {
    const pixels = new Uint8Array(4 * 4 * 4);
    pixels[(y * 4 + x) * 4 + 3] = 255;
    return pixels;
  };

  it('accepts content inside the circle', () => {
    assert.doesNotThrow(() => assertContentInside({ spec: circleSpec, pixels: withAlphaAt(1, 1), ground: [0, 0, 0] }));
  });

  it('refuses content outside the circle', () => {
    assert.throws(
      () => assertContentInside({ spec: circleSpec, pixels: withAlphaAt(0, 0), ground: [0, 0, 0] }),
      /fixture: content at 0,0 falls outside its safe area \(fixture circle\)/,
    );
  });

  it('refuses opaque content inside a margin', () => {
    const spec = {
      id: 'margin-fixture',
      width: 10,
      height: 10,
      channels: 3,
      opaque: true,
      safeArea: { kind: 'margin', pixels: 2, rule: 'fixture margin' },
    };
    const pixels = new Uint8Array(10 * 10 * 3);
    pixels[(5 * 10 + 1) * 3] = 255;
    assert.throws(() => assertContentInside({ spec, pixels, ground: [0, 0, 0] }), /content at 1,5/);
    assert.doesNotThrow(() => assertContentInside({ spec, pixels: new Uint8Array(10 * 10 * 3), ground: [0, 0, 0] }));
  });
});

describe('command line', () => {
  const roots = [];
  const tempRoot = () => {
    const root = mkdtempSync(join(tmpdir(), 'fitlog-store-art-'));
    roots.push(root);
    return root;
  };
  after(() => roots.forEach((root) => rmSync(root, { recursive: true, force: true })));

  it('accepts only --check', () => {
    assert.deepEqual(parseArgs([]), { check: false });
    assert.deepEqual(parseArgs(['--check']), { check: true });
    assert.throws(() => parseArgs(['--force']), /Unknown argument: --force/);
  });

  it('reports missing art, writes it, then passes the check', () => {
    const root = tempRoot();
    for (const file of INPUT_FILES) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      cpSync(join(REPO_ROOT, file), join(root, file));
    }
    const out = textSink();
    const err = textSink();
    assert.equal(main(['--check'], { root, stdout: out, stderr: err }), 1);
    assert.match(err.text(), /missing: apps\/mobile\/assets\/store-art\/icon\.png/);
    assert.equal(main([], { root, stdout: out, stderr: err }), 0);
    assert.equal(main(['--check'], { root, stdout: out, stderr: err }), 0);
    assert.match(out.text(), /matches the generator/);
  });

  it('flags edited and unexpected files', () => {
    const root = tempRoot();
    writeFiles(art.files, root);
    assert.deepEqual(compareWithDisk(art.files, root), []);
    const icon = join(root, fileFor('icon.png'));
    writeFileSync(icon, Buffer.concat([readFileSync(icon), Buffer.from([0])]));
    writeFileSync(join(root, fileFor('stray.png')), Buffer.from([0]));
    assert.deepEqual(compareWithDisk(art.files, root), [
      { kind: 'differs', file: fileFor('icon.png') },
      { kind: 'unexpected', file: fileFor('stray.png') },
    ]);
  });
});
