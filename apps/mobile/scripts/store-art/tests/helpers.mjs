// Test helpers for the DS-6 store-art generator. Not a test file itself.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = fileURLToPath(new URL('../../../../../', import.meta.url));

export function readJson(relative) {
  return JSON.parse(readFileSync(join(REPO_ROOT, relative), 'utf8'));
}

export function readText(relative) {
  return readFileSync(join(REPO_ROOT, relative), 'utf8');
}

export function pixel(image, x, y) {
  const offset = (y * image.width + x) * image.channels;
  return Array.from(image.pixels.subarray(offset, offset + image.channels));
}

export function hexOf(rgb) {
  return `#${rgb
    .slice(0, 3)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

export function alphaAt(image, x, y) {
  return image.channels === 4 ? image.pixels[(y * image.width + x) * 4 + 3] : 255;
}

/** Pixel that holds a point given in visible-icon units measured from the centre. */
export function probe(spec, [vx, vy]) {
  const scale = spec.width * spec.contentScale;
  return [Math.floor(spec.width / 2 + vx * scale), Math.floor(spec.height / 2 + vy * scale)];
}

export function rgbOf(hex) {
  return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
}

/** Content = any pixel with alpha > 0 (transparent layers) or any pixel that is not the ground (opaque art). */
export function contentTest(image, groundHex) {
  if (groundHex === null) {
    return (x, y) => alphaAt(image, x, y) > 0;
  }
  const [r, g, b] = rgbOf(groundHex);
  return (x, y) => {
    const offset = (y * image.width + x) * image.channels;
    return image.pixels[offset] !== r || image.pixels[offset + 1] !== g || image.pixels[offset + 2] !== b;
  };
}

export function contentStats(image, isContent) {
  const cx = image.width / 2;
  const cy = image.height / 2;
  const stats = { count: 0, maxRadius: 0, minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (isContent(x, y)) {
        stats.count += 1;
        stats.maxRadius = Math.max(stats.maxRadius, Math.hypot(x + 0.5 - cx, y + 0.5 - cy));
        stats.minX = Math.min(stats.minX, x);
        stats.minY = Math.min(stats.minY, y);
        stats.maxX = Math.max(stats.maxX, x);
        stats.maxY = Math.max(stats.maxY, y);
      }
    }
  }
  return stats;
}

/** Share of pixels that are exactly a palette colour (fully opaque) or fully transparent. */
export function paletteFidelity(image, hexes) {
  const key = (r, g, b) => r * 65536 + g * 256 + b;
  const palette = new Set(hexes.map((hex) => key(...rgbOf(hex))));
  const area = image.width * image.height;
  let exact = 0;
  for (let index = 0; index < area; index += 1) {
    const offset = index * image.channels;
    const alpha = image.channels === 4 ? image.pixels[offset + 3] : 255;
    const colour = key(image.pixels[offset], image.pixels[offset + 1], image.pixels[offset + 2]);
    if (alpha === 0 || (alpha === 255 && palette.has(colour))) {
      exact += 1;
    }
  }
  return exact / area;
}

export function pathPoints(svgText) {
  return [...svgText.matchAll(/\sd="([^"]+)"/g)].flatMap(([, d]) => {
    const numbers = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    return Array.from({ length: numbers.length / 2 }, (_, index) => [numbers[index * 2], numbers[index * 2 + 1]]);
  });
}

export function textSink() {
  const chunks = [];
  return {
    write: (text) => {
      chunks.push(text);
      return true;
    },
    text: () => chunks.join(''),
  };
}
