import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  normalizeRing,
  orientClockwise,
  parsePolygonPath,
  parseSvgPolygon,
  quantize,
  rotateRing,
  roundedRect,
  signedArea,
  toPixelRing,
  wavyBand,
} from '../geometry.mjs';
import { readText } from './helpers.mjs';

const close = (actual, expected, label) =>
  assert.ok(Math.abs(actual - expected) < 1e-12, `${label}: expected ${expected}, got ${actual}`);

describe('parsePolygonPath', () => {
  it('reads an absolute polygon and drops the repeated closing point', () => {
    assert.deepEqual(parsePolygonPath('M0 0L10 0L10 10L0 10L0 0Z'), [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]);
  });

  it('reads compact numbers, exponents and comma separators', () => {
    assert.deepEqual(parsePolygonPath('M0,0 L1.5.5 L-1e1 2Z'), [
      [0, 0],
      [1.5, 0.5],
      [-10, 2],
    ]);
  });

  const rejected = [
    ['curves', 'M0 0C1 1 2 2 3 3Z', /unsupported path command "C"/],
    ['relative commands', 'M0 0l1 0l0 1z', /unsupported path command "l"/],
    ['a second subpath', 'M0 0L1 0L1 1ZM2 2L3 2L3 3Z', /one closed subpath/],
    ['an open path', 'M0 0L1 0L1 1', /closed with Z/],
    ['stray characters', 'M0 0L1 0L1 1#Z', /unsupported characters/],
    ['an odd coordinate count', 'M0 0L1 0L1Z', /coordinate/],
    ['fewer than three points', 'M0 0L1 0Z', /at least three points/],
    ['a path that does not start with M', 'L0 0L1 0L1 1Z', /start with M/],
  ];
  for (const [label, d, message] of rejected) {
    it(`rejects ${label}`, () => {
      assert.throws(() => parsePolygonPath(d, 'fixture'), message);
    });
  }
});

describe('parseSvgPolygon and normalizeRing', () => {
  it('normalises the Momentum Cookie 12 badge to a unit radius around the origin', () => {
    const { viewBox, ring } = parseSvgPolygon(readText('apps/mobile/assets/momentum/imgCookie12.svg'), 'imgCookie12');
    assert.deepEqual(viewBox, [0, 0, 280, 280]);
    const radii = normalizeRing(ring, viewBox).map(([x, y]) => Math.hypot(x, y));
    close(Math.max(...radii), 1, 'lobe tip');
    const valley = Math.min(...radii);
    assert.ok(valley > 0.85 && valley < 0.95, `twelve shallow scallops, valley ${valley}`);
  });

  it('reads every Momentum shape the generator depends on', () => {
    for (const name of ['imgCookie12', 'imgCookie9', 'imgClover4']) {
      const { viewBox, ring } = parseSvgPolygon(readText(`apps/mobile/assets/momentum/${name}.svg`), name);
      assert.ok(ring.length > 50, `${name} has its full outline`);
      close(Math.max(...normalizeRing(ring, viewBox).map(([x, y]) => Math.hypot(x, y))), 1, name);
    }
  });

  it('rejects an SVG without a viewBox', () => {
    assert.throws(() => parseSvgPolygon('<svg><path d="M0 0L1 0L1 1Z"/></svg>', 'fixture'), /viewBox/);
  });

  it('rejects an SVG with more than one path', () => {
    const svg = '<svg viewBox="0 0 2 2"><path d="M0 0L1 0L1 1Z"/><path d="M0 0L1 0L1 1Z"/></svg>';
    assert.throws(() => parseSvgPolygon(svg, 'fixture'), /exactly one <path d>/);
  });
});

describe('primitives', () => {
  it('builds a rounded rectangle with exact bounds and clockwise orientation', () => {
    const ring = roundedRect({ cx: 0, cy: 0, width: 0.4, height: 0.1, radius: 0.05 });
    const xs = ring.map(([x]) => x);
    const ys = ring.map(([, y]) => y);
    close(Math.min(...xs), -0.2, 'left');
    close(Math.max(...xs), 0.2, 'right');
    close(Math.min(...ys), -0.05, 'top');
    close(Math.max(...ys), 0.05, 'bottom');
    assert.ok(signedArea(ring) > 0);
  });

  it('refuses a corner radius larger than half the short side', () => {
    assert.throws(() => roundedRect({ cx: 0, cy: 0, width: 0.4, height: 0.1, radius: 0.06 }), /radius/);
  });

  it('rotates clockwise on screen for positive angles (y points down)', () => {
    const [[x, y]] = rotateRing([[1, 0]], 90);
    close(x, 0, 'x');
    close(y, 1, 'y');
  });

  it('reverses counter-clockwise rings and leaves clockwise rings alone', () => {
    const counter = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ];
    assert.ok(signedArea(counter) < 0);
    const fixed = orientClockwise(counter);
    assert.ok(signedArea(fixed) > 0);
    assert.equal(orientClockwise(fixed), fixed);
    assert.deepEqual(counter[1], [0, 1], 'the input ring is not mutated');
  });

  it('quantises to a 1/256 pixel grid', () => {
    assert.equal(quantize(1.0019), 1);
    assert.equal(quantize(1.003), 257 / 256);
  });

  it('maps to pixels, snapping to the grid and dropping repeated points', () => {
    const ring = toPixelRing(
      [
        [0, 0],
        [0, 0],
        [0.5, 0],
        [0.5, 0.5],
      ],
      { scale: 100, x: 10, y: 20 },
    );
    assert.deepEqual(ring, [
      [10, 20],
      [60, 20],
      [60, 70],
    ]);
  });

  it('refuses a ring that collapses below three points on the pixel grid', () => {
    assert.throws(
      () =>
        toPixelRing(
          [
            [0, 0],
            [0, 0],
            [1e-9, 0],
          ],
          { scale: 1, x: 0, y: 0 },
        ),
      /Degenerate/,
    );
  });
});

describe('wavyBand', () => {
  const options = { cx: 0, cy: 0, radius: 100, amplitude: 4, waves: 12, width: 10, startDeg: -90, sweepDeg: 270 };
  const band = wavyBand(options);

  it('stays inside the wave envelope plus half the stroke', () => {
    const radii = band.map(([x, y]) => Math.hypot(x, y));
    assert.ok(Math.max(...radii) <= 100 + 4 + 5 + 1e-9);
    assert.ok(Math.min(...radii) >= 100 - 4 - 5 - 1e-9);
  });

  it('is a clockwise ring', () => {
    assert.ok(signedArea(band) > 0);
  });

  it('covers only the requested sweep (plus its round caps)', () => {
    const angles = band.map(([x, y]) => (Math.atan2(y, x) * 180) / Math.PI);
    assert.ok(
      angles.every((angle) => !(angle > -170 && angle < -100)),
      'the upper-left quadrant outside the 270° sweep stays empty',
    );
  });

  it('rejects a stroke too wide for the ring', () => {
    assert.throws(() => wavyBand({ ...options, width: 200 }), /Stroke width/);
  });

  it('rejects a sweep outside (0, 360]', () => {
    assert.throws(() => wavyBand({ ...options, sweepDeg: 0 }), /sweepDeg/);
    assert.throws(() => wavyBand({ ...options, sweepDeg: 361 }), /sweepDeg/);
  });
});
