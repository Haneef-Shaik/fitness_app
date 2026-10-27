import { easeOut, notice, pop, popScale, press, rise, springs, staggerDelay, toPhysicalSpring } from '../tokens';

describe('Momentum spring tokens (docs/22 §5)', () => {
  it.each([
    ['spatialFast', 0.6, 800, 33.9],
    ['spatialDefault', 0.8, 380, 31.2],
    ['spatialSlow', 0.8, 200, 22.6],
    ['effectsDefault', 1, 1600, 80],
    ['effectsFast', 1, 3800, 123.3],
  ] as const)('%s is damping ratio %s at stiffness %s, which is damping %s at mass 1', (name, ratio, stiffness, damping) => {
    expect(springs[name]).toEqual({ dampingRatio: ratio, stiffness });
    const physical = toPhysicalSpring(springs[name]);
    // Reanimated defaults to mass 4; the Momentum table is specified at mass 1.
    expect(physical.mass).toBe(1);
    expect(physical.stiffness).toBe(stiffness);
    expect(physical.damping).toBeCloseTo(damping, 1);
  });

  it('keeps the damping ratio when converting to the physical form', () => {
    for (const token of Object.values(springs)) {
      const { mass, stiffness, damping } = toPhysicalSpring(token);
      expect(damping / (2 * Math.sqrt(stiffness * mass))).toBeCloseTo(token.dampingRatio, 10);
    }
  });

  it('keeps the press, pop, rise and banner values from docs/22 §5', () => {
    expect(press).toEqual({ scale: 0.94, durationMs: 100 });
    expect(pop.fromScale).toBe(0.6);
    expect(rise).toMatchObject({ fromTranslateY: 28, staggerMs: 60 });
    expect(notice.holdMs).toBe(2000);
    expect(easeOut).toEqual([0.23, 1, 0.32, 1]);
  });

  it('never pops from scale 0, and never past full size', () => {
    expect(popScale(0)).toBe(pop.minScale);
    expect(popScale(-1)).toBe(pop.minScale);
    expect(popScale(0.4)).toBe(0.4);
    expect(popScale(1.5)).toBe(1);
    expect(popScale(Number.NaN)).toBe(pop.fromScale);
  });

  it('staggers cards 60 ms apart and caps the wait on long screens', () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(2)).toBe(120);
    expect(staggerDelay(1.7)).toBe(60);
    expect(staggerDelay(-3)).toBe(0);
    expect(staggerDelay(Number.POSITIVE_INFINITY)).toBe(0);
    expect(staggerDelay(50)).toBe(rise.maxStaggerSteps * rise.staggerMs);
  });
});
