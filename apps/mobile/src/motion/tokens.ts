/**
 * Momentum motion tokens (docs/22 §5). Plain data, so code that only needs a number never loads
 * Reanimated. Colour and type tokens stay in src/theme; this file is the motion layer only.
 */

/** A Material 3 Expressive spring, written the way the design specifies it. */
export interface SpringToken {
  readonly dampingRatio: number;
  readonly stiffness: number;
}

export const springs = {
  /** Pops: stickers, the logged chip, the record burst, the check badge. */
  spatialFast: { dampingRatio: 0.6, stiffness: 800 },
  /** Cards and banners entering, sheets. */
  spatialDefault: { dampingRatio: 0.8, stiffness: 380 },
  /** Large surfaces. */
  spatialSlow: { dampingRatio: 0.8, stiffness: 200 },
  /** Opacity and colour, with no bounce. */
  effectsDefault: { dampingRatio: 1, stiffness: 1600 },
  /** Press colour. */
  effectsFast: { dampingRatio: 1, stiffness: 3800 },
} as const satisfies Record<string, SpringToken>;

export type SpringName = keyof typeof springs;

/** docs/22 §5 is specified at mass 1. Reanimated 4 defaults to mass 4, which would slow every token. */
export const SPRING_MASS = 1;

export interface PhysicalSpring {
  readonly mass: number;
  readonly stiffness: number;
  readonly damping: number;
}

/** The Reanimated `withSpring` form of a token: damping = 2ζ√(k·m). */
export function toPhysicalSpring(token: SpringToken): PhysicalSpring {
  return {
    mass: SPRING_MASS,
    stiffness: token.stiffness,
    damping: 2 * token.dampingRatio * Math.sqrt(token.stiffness * SPRING_MASS),
  };
}

/** Any press: scale 0.94 in 100 ms, then back on the spatial-fast spring. */
export const press = { scale: 0.94, durationMs: 100 } as const;

/**
 * Pops grow into place. The logged chip starts at 0.6, the check badge at 0.4 and the record burst
 * at 0.3. Nothing starts from scale 0.
 */
export const pop = { fromScale: 0.6, minScale: 0.3 } as const;

/** Keeps a pop's starting scale inside Momentum's range, so nothing appears from nothing. */
export function popScale(from: number): number {
  if (!Number.isFinite(from)) return pop.fromScale;
  return Math.min(1, Math.max(pop.minScale, from));
}

/**
 * Cards enter by rising 28 dp into place, about 60 ms apart. The stagger stops growing after a few
 * cards so a long screen never makes the member wait for its last card.
 */
export const rise = { fromTranslateY: 28, staggerMs: 60, maxStaggerSteps: 5 } as const;

/** The entrance delay for the card at `index` on a screen. */
export function staggerDelay(index: number): number {
  const step = Number.isFinite(index) ? Math.min(rise.maxStaggerSteps, Math.max(0, Math.floor(index))) : 0;
  return step * rise.staggerMs;
}

/** A moment's banner (for example "Set saved") stays for 2 s. */
export const notice = { holdMs: 2000 } as const;

/** Strong ease-out for anything without a finger on it. UI never uses ease-in. */
export const easeOut = [0.23, 1, 0.32, 1] as const;
