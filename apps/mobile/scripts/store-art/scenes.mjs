// Momentum compositions for the DS-6 store art.
//
// The mark: the Momentum Cookie 12 shape (from the project's own Figma export) as a volt lime badge,
// with a dumbbell built from capsules and drawn in the ground colour, so it reads as a cut-through to
// the near-black ground. docs/22: one loud thing (the lime), neutrals around it, no green "success"
// colour, and lime never as a thin line or small text on light surfaces.
//
// Mark geometry uses "visible units": the visible icon (the 72 dp viewport of an adaptive icon, or the
// whole square of an iOS or Play icon) spans 1.0, with the origin at its centre.
import { orientClockwise, rotateRing, roundedRect, scaleRing, toPixelRing, wavyBand } from './geometry.mjs';

/** Lobe-tip radius of the badge in visible units: an 0.80-wide badge inside the 1.0 viewport. */
export const BADGE_RADIUS = 0.4;
export const GLYPH_ANGLE_DEG = -45;

/** Dumbbell parts in visible units before rotation; the farthest point sits 0.27 from the centre. */
export const DUMBBELL = Object.freeze({
  barLength: 0.54,
  barThickness: 0.056,
  innerPlate: Object.freeze({ offset: 0.135, width: 0.072, height: 0.25 }),
  outerPlate: Object.freeze({ offset: 0.2, width: 0.062, height: 0.17 }),
});

/** Android tints monochrome and notification layers itself; they must be a white silhouette. */
export const PLATFORM_MASK_WHITE = '#FFFFFF';

/** Theme tokens behind every colour the art uses (apps/mobile/src/theme/themes/momentum.json). */
export const ROLE_TOKENS = Object.freeze({
  ground: Object.freeze(['dark', 'surface']),
  badge: Object.freeze(['dark', 'primaryContainer']),
  glyph: Object.freeze(['dark', 'surface']),
  track: Object.freeze(['dark', 'surfaceHighest']),
  tonal: Object.freeze(['dark', 'secondaryContainer']),
  notification: Object.freeze(['light', 'primary']),
  splashLight: Object.freeze(['light', 'surface']),
  splashDark: Object.freeze(['dark', 'surface']),
});

/** Feature graphic layout in pixels on its fixed 1024 × 500 canvas. */
export const FEATURE_GRAPHIC = Object.freeze({
  width: 1024,
  height: 500,
  centre: Object.freeze([512, 250]),
  badgeRadius: 150,
  ring: Object.freeze({ radius: 196, amplitude: 6, waves: 18, width: 14, startDeg: -90, progressDeg: 270 }),
  decorations: Object.freeze([
    Object.freeze({ shape: 'clover4', x: 170, y: 140, size: 120, rotation: 15, role: 'tonal' }),
    Object.freeze({ shape: 'cookie9', x: 860, y: 360, size: 140, rotation: -10, role: 'tonal' }),
    Object.freeze({ shape: 'clover4', x: 880, y: 110, size: 70, rotation: 30, role: 'track' }),
    Object.freeze({ shape: 'cookie9', x: 140, y: 390, size: 80, rotation: 0, role: 'track' }),
  ]),
});

/** Resolve each colour role to its theme token and hex value; fail on a missing or malformed token. */
export function paletteRoles(theme) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(ROLE_TOKENS).map(([role, [mode, token]]) => {
        const hex = theme?.colors?.[mode]?.[token];
        if (typeof hex !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
          throw new Error(`Theme token ${mode}.${token} (role ${role}) must be a #RRGGBB colour`);
        }
        return [role, Object.freeze({ token: `${mode}.${token}`, hex: hex.toUpperCase() })];
      }),
    ),
  );
}

export function dumbbellGlyph() {
  const { barLength, barThickness, innerPlate, outerPlate } = DUMBBELL;
  const plate = (side, { offset, width, height }) =>
    roundedRect({ cx: side * offset, cy: 0, width, height, radius: width / 2 });
  const parts = [
    roundedRect({ cx: 0, cy: 0, width: barLength, height: barThickness, radius: barThickness / 2 }),
    ...[-1, 1].flatMap((side) => [plate(side, innerPlate), plate(side, outerPlate)]),
  ];
  return parts.map((ring) => orientClockwise(rotateRing(ring, GLYPH_ANGLE_DEG)));
}

export function badgeRing(shapes) {
  return orientClockwise(scaleRing(shapes.cookie12.ring, BADGE_RADIUS));
}

/** The mark as layers in visible units: `colour` for icons, `mask` for system-tinted silhouettes. */
export function markLayers({ roles, shapes, style }) {
  const badge = badgeRing(shapes);
  const glyph = dumbbellGlyph();
  if (style === 'colour') {
    return [
      { kind: 'fill', color: roles.badge.hex, rings: [badge] },
      { kind: 'fill', color: roles.glyph.hex, rings: glyph },
    ];
  }
  if (style === 'mask') {
    return [
      { kind: 'fill', color: PLATFORM_MASK_WHITE, rings: [badge] },
      { kind: 'erase', rings: glyph },
    ];
  }
  throw new Error(`Unknown mark style ${String(style)}`);
}

export function placeLayers(layers, transform) {
  return layers.map((layer) => ({ ...layer, rings: layer.rings.map((ring) => toPixelRing(ring, transform)) }));
}

function markScene(spec, { roles, shapes }) {
  const layers = placeLayers(markLayers({ roles, shapes, style: spec.mark }), {
    scale: spec.width * spec.contentScale,
    x: spec.width / 2,
    y: spec.height / 2,
  });
  return {
    width: spec.width,
    height: spec.height,
    background: spec.background ? roles.ground.hex : null,
    layers,
  };
}

function featureGraphicScene(spec, { roles, shapes }) {
  const { width, height, centre, badgeRadius, ring, decorations } = FEATURE_GRAPHIC;
  if (spec.width !== width || spec.height !== height) {
    throw new Error(`The feature graphic layout is drawn for ${width} × ${height}`);
  }
  const [cx, cy] = centre;
  const band = (sweepDeg) =>
    toPixelRing(
      wavyBand({
        cx,
        cy,
        radius: ring.radius,
        amplitude: ring.amplitude,
        waves: ring.waves,
        width: ring.width,
        startDeg: ring.startDeg,
        sweepDeg,
      }),
      { scale: 1, x: 0, y: 0 },
    );
  const decorationLayers = decorations.map(({ shape, x, y, size, rotation, role }) => ({
    kind: 'fill',
    color: roles[role].hex,
    rings: [toPixelRing(orientClockwise(rotateRing(shapes[shape].ring, rotation)), { scale: size / 2, x, y })],
  }));
  const mark = placeLayers(markLayers({ roles, shapes, style: 'colour' }), {
    scale: badgeRadius / BADGE_RADIUS,
    x: cx,
    y: cy,
  });
  return {
    width,
    height,
    background: roles.ground.hex,
    layers: [
      ...decorationLayers,
      { kind: 'fill', color: roles.track.hex, rings: [band(360)] },
      { kind: 'fill', color: roles.tonal.hex, rings: [band(ring.progressDeg)] },
      ...mark,
    ],
  };
}

export function buildScene(spec, context) {
  if (spec.scene === 'mark') {
    return markScene(spec, context);
  }
  if (spec.scene === 'feature-graphic') {
    return featureGraphicScene(spec, context);
  }
  throw new Error(`Unknown scene ${String(spec.scene)}`);
}
