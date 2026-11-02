// Deterministic polygon rasterizer for the DS-6 store-art generator.
// Coverage is point-sampled on a fixed SUPERSAMPLE × SUPERSAMPLE grid per pixel with the non-zero
// winding rule, so a sample count is an exact integer and the same geometry always gives the same
// pixels. Layers composite in order, premultiplied, on sRGB-encoded values (as most design tools do):
// `fill` is source-over with an opaque colour; `erase` is destination-out (used for knockouts in
// single-colour icon layers).

export const SUPERSAMPLE = 6;

const LAYER_KINDS = new Set(['fill', 'erase']);
const MAX_DIMENSION = 16384;

export function hexToRgb(hex) {
  const match = typeof hex === 'string' ? /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(hex) : null;
  if (!match) {
    throw new Error(`Expected a #RRGGBB colour, got ${String(hex)}`);
  }
  return [match[1], match[2], match[3]].map((part) => Number.parseInt(part, 16));
}

function assertCanvas(width, height) {
  const valid = (value) => Number.isInteger(value) && value > 0 && value <= MAX_DIMENSION;
  if (!valid(width) || !valid(height)) {
    throw new Error(`Canvas size must be positive integers up to ${MAX_DIMENSION}, got ${width}×${height}`);
  }
}

function assertRings(rings) {
  if (!Array.isArray(rings)) {
    throw new Error('A layer needs an array of rings');
  }
  for (const ring of rings) {
    if (!Array.isArray(ring) || ring.length < 3) {
      throw new Error('Each ring needs at least three points');
    }
    for (const point of ring) {
      if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
        throw new Error('Ring coordinates must be finite numbers');
      }
    }
  }
}

function buildEdges(rings) {
  return rings.flatMap((ring) =>
    ring.flatMap((start, index) => {
      const end = ring[(index + 1) % ring.length];
      if (start[1] === end[1]) {
        return [];
      }
      const down = end[1] > start[1];
      const [top, bottom] = down ? [start, end] : [end, start];
      return [
        {
          yTop: top[1],
          yBottom: bottom[1],
          xTop: top[0],
          slope: (bottom[0] - top[0]) / (bottom[1] - top[1]),
          dir: down ? 1 : -1,
        },
      ];
    }),
  );
}

/** Add one horizontal span [xStart, xEnd) of a sub-scanline to the per-pixel sample counts. */
function addSpan(counts, rowOffset, xStart, xEnd, samples, columns) {
  // Sample column n sits at x = (n + 0.5) / samples; it is inside when xStart <= x < xEnd.
  const first = Math.max(0, Math.ceil(xStart * samples - 0.5));
  const end = Math.min(columns, Math.ceil(xEnd * samples - 0.5));
  if (end <= first) {
    return;
  }
  const lastPixel = Math.floor((end - 1) / samples);
  for (let pixel = Math.floor(first / samples); pixel <= lastPixel; pixel += 1) {
    counts[rowOffset + pixel] += Math.min(end, (pixel + 1) * samples) - Math.max(first, pixel * samples);
  }
}

function addSpans(counts, rowOffset, crossings, samples, columns) {
  let winding = 0;
  let spanStart = 0;
  for (const { x, dir } of crossings) {
    const before = winding;
    winding += dir;
    if (before === 0 && winding !== 0) {
      spanStart = x;
    } else if (before !== 0 && winding === 0) {
      addSpan(counts, rowOffset, spanStart, x, samples, columns);
    }
  }
}

/**
 * Number of covered samples (0 … samples²) per pixel for the union of `rings` (non-zero rule).
 * @returns {Uint16Array}
 */
export function coverageMask(rings, width, height, samples = SUPERSAMPLE) {
  assertCanvas(width, height);
  assertRings(rings);
  const counts = new Uint16Array(width * height);
  const edges = buildEdges(rings);
  if (edges.length === 0) {
    return counts;
  }
  const top = edges.reduce((lowest, edge) => Math.min(lowest, edge.yTop), Infinity);
  const bottom = edges.reduce((highest, edge) => Math.max(highest, edge.yBottom), -Infinity);
  const firstRow = Math.max(0, Math.floor(top));
  const lastRow = Math.min(height - 1, Math.floor(bottom));
  const columns = width * samples;
  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let sub = 0; sub < samples; sub += 1) {
      const y = row + (sub + 0.5) / samples;
      const crossings = edges
        .filter((edge) => y >= edge.yTop && y < edge.yBottom)
        .map((edge) => ({ x: edge.xTop + (y - edge.yTop) * edge.slope, dir: edge.dir }))
        .sort((a, b) => a.x - b.x || a.dir - b.dir);
      addSpans(counts, row * width, crossings, samples, columns);
    }
  }
  return counts;
}

function paint(buffer, counts, rgb, full) {
  const [r, g, b] = rgb.map((value) => value / 255);
  for (let index = 0; index < counts.length; index += 1) {
    if (counts[index] > 0) {
      const cover = counts[index] / full;
      const keep = 1 - cover;
      const offset = index * 4;
      buffer[offset] = r * cover + buffer[offset] * keep;
      buffer[offset + 1] = g * cover + buffer[offset + 1] * keep;
      buffer[offset + 2] = b * cover + buffer[offset + 2] * keep;
      buffer[offset + 3] = cover + buffer[offset + 3] * keep;
    }
  }
}

function erase(buffer, counts, full) {
  for (let index = 0; index < counts.length; index += 1) {
    if (counts[index] > 0) {
      const keep = 1 - counts[index] / full;
      const offset = index * 4;
      for (let channel = 0; channel < 4; channel += 1) {
        buffer[offset + channel] *= keep;
      }
    }
  }
}

const unit = (value) => Math.min(1, Math.max(0, value));

function toBytes(buffer, width, height, channels, mustBeOpaque) {
  const area = width * height;
  const out = new Uint8Array(area * channels);
  for (let index = 0; index < area; index += 1) {
    const a = unit(buffer[index * 4 + 3]);
    const alpha = Math.round(a * 255);
    if (mustBeOpaque && alpha !== 255) {
      throw new Error(`Opaque output has a transparent pixel at ${index % width},${Math.floor(index / width)}`);
    }
    const offset = index * channels;
    if (alpha > 0) {
      for (let channel = 0; channel < 3; channel += 1) {
        out[offset + channel] = Math.round(unit(buffer[index * 4 + channel] / a) * 255);
      }
    }
    if (channels === 4) {
      out[offset + 3] = alpha;
    }
  }
  return out;
}

/**
 * Rasterize a scene of filled and erased polygon layers into 8-bit RGB or RGBA bytes.
 * Pure: the working buffer is local, and the result is a new Uint8Array.
 */
export function rasterize({ width, height, channels, opaque, background = null, layers, samples = SUPERSAMPLE }) {
  assertCanvas(width, height);
  if (channels !== 3 && channels !== 4) {
    throw new Error(`channels must be 3 or 4, got ${channels}`);
  }
  const area = width * height;
  const full = samples * samples;
  const buffer = new Float64Array(area * 4);
  if (background !== null) {
    const [r, g, b] = hexToRgb(background).map((value) => value / 255);
    for (let index = 0; index < area; index += 1) {
      buffer[index * 4] = r;
      buffer[index * 4 + 1] = g;
      buffer[index * 4 + 2] = b;
      buffer[index * 4 + 3] = 1;
    }
  }
  for (const layer of layers) {
    if (!LAYER_KINDS.has(layer.kind)) {
      throw new Error(`Unknown layer kind ${String(layer.kind)}`);
    }
    const counts = coverageMask(layer.rings, width, height, samples);
    if (layer.kind === 'fill') {
      paint(buffer, counts, hexToRgb(layer.color), full);
    } else {
      erase(buffer, counts, full);
    }
  }
  return toBytes(buffer, width, height, channels, channels === 3 || opaque === true);
}
