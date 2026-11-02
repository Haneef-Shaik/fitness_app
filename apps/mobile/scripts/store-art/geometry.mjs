// Pure 2D geometry for the DS-6 store-art generator.
// Points are [x, y] with y pointing down (screen space), so a ring with a positive signed area runs
// clockwise on screen. Every function returns new arrays and never mutates its input.

const DEGREE = Math.PI / 180;
const TOKEN_PATTERN = /[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
const COMMAND_PATTERN = /^[A-Za-z]$/;

/** Snap grid for pixel-space geometry: 1/256 px keeps reruns stable against last-bit float noise. */
export const GRID = 256;

export function quantize(value) {
  return Math.round(value * GRID) / GRID;
}

const samePoint = (a, b) => a[0] === b[0] && a[1] === b[1];

/**
 * Parse SVG path data made only of absolute M, L and Z (as the Momentum Figma shape exports are)
 * into one closed polygon ring. Anything else fails loudly rather than being approximated.
 */
export function parsePolygonPath(d, label = 'path') {
  if (typeof d !== 'string') {
    throw new Error(`${label}: path data must be a string`);
  }
  if (!/^[\s,]*$/.test(d.replace(TOKEN_PATTERN, ''))) {
    throw new Error(`${label}: path data has unsupported characters`);
  }
  const points = [];
  let started = false;
  let closed = false;
  let pending = [];
  for (const token of d.match(TOKEN_PATTERN) ?? []) {
    if (COMMAND_PATTERN.test(token)) {
      if (pending.length > 0) {
        throw new Error(`${label}: dangling coordinate before "${token}"`);
      }
      if (closed) {
        throw new Error(`${label}: only one closed subpath is supported`);
      }
      if (token === 'M') {
        if (started) {
          throw new Error(`${label}: only one closed subpath is supported`);
        }
        started = true;
      } else if (token === 'L' || token === 'Z') {
        if (!started) {
          throw new Error(`${label}: path data must start with M`);
        }
        closed = token === 'Z';
      } else {
        throw new Error(`${label}: unsupported path command "${token}"; only absolute M, L and Z are supported`);
      }
    } else {
      if (!started || closed) {
        throw new Error(`${label}: coordinate outside a command`);
      }
      pending = [...pending, Number(token)];
      if (pending.length === 2) {
        points.push(pending);
        pending = [];
      }
    }
  }
  if (pending.length > 0) {
    throw new Error(`${label}: dangling coordinate at the end of the path`);
  }
  if (!closed) {
    throw new Error(`${label}: path must be closed with Z`);
  }
  const ring = points.length > 1 && samePoint(points[0], points[points.length - 1]) ? points.slice(0, -1) : points;
  if (ring.length < 3) {
    throw new Error(`${label}: a polygon needs at least three points`);
  }
  if (ring.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) {
    throw new Error(`${label}: path coordinates must be finite`);
  }
  return ring;
}

/** Read the viewBox and the single <path d> of a Momentum shape SVG. */
export function parseSvgPolygon(svgText, label) {
  const viewBoxMatch = /\sviewBox="([^"]+)"/.exec(svgText);
  const pathMatches = [...svgText.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)];
  if (!viewBoxMatch || pathMatches.length !== 1) {
    throw new Error(`${label}: expected an <svg> with a viewBox and exactly one <path d>`);
  }
  const viewBox = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
  if (viewBox.length !== 4 || !viewBox.every(Number.isFinite) || viewBox[2] <= 0 || viewBox[3] <= 0) {
    throw new Error(`${label}: viewBox must be four numbers with a positive size`);
  }
  return { viewBox, ring: parsePolygonPath(pathMatches[0][1], label) };
}

/** Centre a ring on its viewBox and scale it so its farthest point lies at radius 1. */
export function normalizeRing(ring, [minX, minY, width, height]) {
  const cx = minX + width / 2;
  const cy = minY + height / 2;
  const centred = ring.map(([x, y]) => [x - cx, y - cy]);
  const reach = centred.reduce((farthest, [x, y]) => Math.max(farthest, Math.hypot(x, y)), 0);
  if (!(reach > 0)) {
    throw new Error('Cannot normalise a ring with no extent');
  }
  return centred.map(([x, y]) => [x / reach, y / reach]);
}

/** A rounded rectangle (a capsule when radius is half the short side), clockwise on screen. */
export function roundedRect({ cx, cy, width, height, radius, segments = 16 }) {
  if (!(width > 0 && height > 0)) {
    throw new Error('A rounded rectangle needs a positive width and height');
  }
  if (!(radius >= 0 && radius <= Math.min(width, height) / 2)) {
    throw new Error(`Corner radius ${radius} must be between 0 and half the short side`);
  }
  if (!Number.isInteger(segments) || segments < 1) {
    throw new Error('segments must be a positive integer');
  }
  const x0 = cx - width / 2;
  const x1 = cx + width / 2;
  const y0 = cy - height / 2;
  const y1 = cy + height / 2;
  const corners = [
    { x: x1 - radius, y: y1 - radius, from: 0 },
    { x: x0 + radius, y: y1 - radius, from: 90 },
    { x: x0 + radius, y: y0 + radius, from: 180 },
    { x: x1 - radius, y: y0 + radius, from: 270 },
  ];
  return corners.flatMap(({ x, y, from }) =>
    Array.from({ length: segments + 1 }, (_, step) => {
      const angle = (from + (90 * step) / segments) * DEGREE;
      return [x + radius * Math.cos(angle), y + radius * Math.sin(angle)];
    }),
  );
}

/** Rotate about the origin; positive degrees turn clockwise on screen. */
export function rotateRing(ring, degrees) {
  const angle = degrees * DEGREE;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return ring.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);
}

export function scaleRing(ring, factor) {
  return ring.map(([x, y]) => [x * factor, y * factor]);
}

export function signedArea(ring) {
  return (
    ring.reduce((sum, [x, y], index) => {
      const [nx, ny] = ring[(index + 1) % ring.length];
      return sum + (x * ny - nx * y);
    }, 0) / 2
  );
}

/** Return the ring clockwise on screen, so rings in one layer always unite under non-zero winding. */
export function orientClockwise(ring) {
  return signedArea(ring) < 0 ? [...ring].reverse() : ring;
}

/** Drop points equal to their predecessor (cyclically, so a repeated closing point goes too). */
export function dedupeRing(ring) {
  return ring.filter((point, index) => !samePoint(point, ring[(index + ring.length - 1) % ring.length]));
}

/** Map a ring into pixel space (x + v·scale, y + v·scale), snapped to the 1/256 px grid. */
export function toPixelRing(ring, { scale, x, y }) {
  const mapped = dedupeRing(ring.map(([px, py]) => [quantize(x + px * scale), quantize(y + py * scale)]));
  if (mapped.length < 3) {
    throw new Error('Degenerate ring: fewer than three distinct points after snapping to the pixel grid');
  }
  return mapped;
}

/**
 * The outline of a stroked wavy arc with round caps, as one clockwise ring: the Material 3 Expressive
 * wavy circular indicator that Momentum uses for its rest timer.
 * Centreline radius: radius + amplitude · sin(waves · θ), for θ from startDeg over sweepDeg.
 */
export function wavyBand({
  cx,
  cy,
  radius,
  amplitude,
  waves,
  width,
  startDeg,
  sweepDeg,
  stepsPerDegree = 4,
  capSegments = 12,
}) {
  const half = width / 2;
  if (!(radius > 0 && amplitude >= 0 && half > 0)) {
    throw new Error('A wavy band needs a positive radius and stroke width, and a non-negative amplitude');
  }
  if (!(half < radius - amplitude)) {
    throw new Error('Stroke width must be smaller than the ring');
  }
  if (!(sweepDeg > 0 && sweepDeg <= 360)) {
    throw new Error('sweepDeg must be in (0, 360]');
  }
  if (!Number.isInteger(waves) || waves < 0) {
    throw new Error('waves must be a non-negative integer');
  }
  const steps = Math.ceil(sweepDeg * stepsPerDegree);
  const frames = Array.from({ length: steps + 1 }, (_, step) => {
    const theta = (startDeg + (sweepDeg * step) / steps) * DEGREE;
    const r = radius + amplitude * Math.sin(waves * theta);
    const dr = amplitude * waves * Math.cos(waves * theta);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const tx = dr * cos - r * sin;
    const ty = dr * sin + r * cos;
    const length = Math.hypot(tx, ty);
    const tangent = [tx / length, ty / length];
    return { centre: [cx + r * cos, cy + r * sin], tangent, normal: [tangent[1], -tangent[0]] };
  });
  const offset = ({ centre, normal }, sign) => [centre[0] + sign * half * normal[0], centre[1] + sign * half * normal[1]];
  const cap = ({ centre, tangent, normal }, direction) =>
    Array.from({ length: capSegments - 1 }, (_, step) => {
      const alpha = (Math.PI * (step + 1)) / capSegments;
      const along = Math.sin(alpha);
      const across = Math.cos(alpha);
      return [
        centre[0] + direction * half * (normal[0] * across + tangent[0] * along),
        centre[1] + direction * half * (normal[1] * across + tangent[1] * along),
      ];
    });
  const outer = frames.map((frame) => offset(frame, 1));
  const inner = frames.map((frame) => offset(frame, -1)).reverse();
  return [...outer, ...cap(frames[frames.length - 1], 1), ...inner, ...cap(frames[0], -1)];
}
