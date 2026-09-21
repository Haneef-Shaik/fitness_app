/** Exact by definition — never approximate these. */
export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const kgToLb = (kg: number): number => kg / KG_PER_LB;
export const lbToKg = (lb: number): number => lb * KG_PER_LB;
export const cmToIn = (cm: number): number => cm / CM_PER_IN;
export const inToCm = (inches: number): number => inches * CM_PER_IN;

/**
 * Display rounding. Storage keeps full precision — a rounded value is NEVER written back.
 * 100 kg → 220.5 lb → back to kg must still be exactly 100.
 */
export const roundLoad = (v: number, unit: 'kg' | 'lb'): number =>
  unit === 'kg' ? Math.round(v * 2) / 2 : Math.round(v);
export const roundWeight = (v: number): number => Math.round(v * 10) / 10;
export const roundMacro = (v: number): number => Math.round(v);
