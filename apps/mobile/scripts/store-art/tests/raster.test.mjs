import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { coverageMask, hexToRgb, rasterize, SUPERSAMPLE } from '../raster.mjs';

const FULL = SUPERSAMPLE * SUPERSAMPLE;
const square = (x0, y0, x1, y1) => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

describe('coverageMask', () => {
  it('uses an even supersample grid so half-pixel edges are exact', () => {
    assert.equal(SUPERSAMPLE % 2, 0);
    assert.ok(SUPERSAMPLE >= 4, 'at least 17 anti-aliasing levels');
  });

  it('covers whole pixels exactly and nothing else', () => {
    const counts = coverageMask([square(1, 1, 3, 3)], 4, 4);
    const covered = new Set([5, 6, 9, 10]);
    counts.forEach((count, index) => assert.equal(count, covered.has(index) ? FULL : 0, `pixel ${index}`));
  });

  it('gives a half-covered pixel exactly half of its samples', () => {
    const counts = coverageMask([square(0, 0, 1.5, 1)], 2, 1);
    assert.deepEqual(Array.from(counts), [FULL, FULL / 2]);
  });

  it('unites overlapping rings of the same orientation without double counting', () => {
    const counts = coverageMask([square(0, 0, 2, 1), square(1, 0, 3, 1)], 3, 1);
    assert.deepEqual(Array.from(counts), [FULL, FULL, FULL]);
  });

  it('treats either winding direction of a lone ring as filled', () => {
    const clockwise = coverageMask([square(0, 0, 1, 1)], 1, 1);
    const counter = coverageMask([[...square(0, 0, 1, 1)].reverse()], 1, 1);
    assert.deepEqual(Array.from(counter), Array.from(clockwise));
  });

  it('clips geometry that falls outside the canvas', () => {
    const counts = coverageMask([square(-5, -5, 1, 1)], 2, 2);
    assert.deepEqual(Array.from(counts), [FULL, 0, 0, 0]);
  });

  it('rejects non-finite coordinates', () => {
    assert.throws(
      () =>
        coverageMask(
          [
            [
              [0, 0],
              [Number.NaN, 1],
              [1, 1],
            ],
          ],
          2,
          2,
        ),
      /finite/,
    );
  });

  it('rejects a ring with fewer than three points', () => {
    assert.throws(
      () =>
        coverageMask(
          [
            [
              [0, 0],
              [1, 1],
            ],
          ],
          2,
          2,
        ),
      /three points/,
    );
  });
});

describe('rasterize', () => {
  it('fills an opaque ground and paints an exact colour where coverage is full', () => {
    const pixels = rasterize({
      width: 2,
      height: 1,
      channels: 3,
      opaque: true,
      background: '#0E0F0A',
      layers: [{ kind: 'fill', color: '#CAFD00', rings: [square(1, 0, 2, 1)] }],
    });
    assert.deepEqual(Array.from(pixels), [14, 15, 10, 202, 253, 0]);
  });

  it('blends a half-covered edge pixel over an opaque ground', () => {
    const pixels = rasterize({
      width: 1,
      height: 1,
      channels: 3,
      opaque: true,
      background: '#000000',
      layers: [{ kind: 'fill', color: '#FFFFFF', rings: [square(0, 0, 0.5, 1)] }],
    });
    assert.deepEqual(Array.from(pixels), [128, 128, 128]);
  });

  it('keeps edge colour exact on a transparent layer (alpha carries the coverage)', () => {
    const pixels = rasterize({
      width: 1,
      height: 1,
      channels: 4,
      opaque: false,
      layers: [{ kind: 'fill', color: '#FFFFFF', rings: [square(0, 0, 0.5, 1)] }],
    });
    assert.deepEqual(Array.from(pixels), [255, 255, 255, 128]);
  });

  it('erases a knockout to full transparency', () => {
    const pixels = rasterize({
      width: 3,
      height: 1,
      channels: 4,
      opaque: false,
      layers: [
        { kind: 'fill', color: '#FFFFFF', rings: [square(0, 0, 2, 1)] },
        { kind: 'erase', rings: [square(1, 0, 2, 1)] },
      ],
    });
    assert.deepEqual(Array.from(pixels), [255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('refuses an RGB output that would contain a transparent pixel', () => {
    assert.throws(
      () =>
        rasterize({
          width: 2,
          height: 1,
          channels: 3,
          opaque: true,
          layers: [{ kind: 'fill', color: '#FFFFFF', rings: [square(0, 0, 1, 1)] }],
        }),
      /transparent pixel at 1,0/,
    );
  });

  it('refuses an RGBA output marked opaque that would contain a transparent pixel', () => {
    assert.throws(
      () =>
        rasterize({
          width: 2,
          height: 1,
          channels: 4,
          opaque: true,
          layers: [{ kind: 'fill', color: '#FFFFFF', rings: [square(0, 0, 1, 1)] }],
        }),
      /transparent pixel at 1,0/,
    );
  });

  it('rejects an unknown layer kind', () => {
    assert.throws(
      () => rasterize({ width: 1, height: 1, channels: 4, opaque: false, layers: [{ kind: 'stroke', rings: [] }] }),
      /Unknown layer kind/,
    );
  });

  it('rejects colours that are not #RRGGBB', () => {
    assert.throws(() => hexToRgb('lime'), /#RRGGBB/);
    assert.deepEqual(hexToRgb('#CAFD00'), [202, 253, 0]);
  });
});
