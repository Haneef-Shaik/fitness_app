/** Canonical decimal string (docs/architecture/003 §4.9): no exponent, `+`, leading or trailing fractional zeros, bare point or `-0`. */
export const CANONICAL_DECIMAL = /^(0|-?[1-9][0-9]*(\.[0-9]*[1-9])?|-?0\.[0-9]*[1-9])$/;

/**
 * Canonical decimal text of a number rounded to `scale` places. `toFixed` rounds the binary double, so an exact
 * decimal tie can round differently from SQL `round(numeric)`, which is authoritative (003 §4.13).
 */
export function formatDecimal(value: number, scale = 6): string {
  if (!Number.isFinite(value) || Math.abs(value) >= 1e21) throw new Error('Decimal must be finite and below 1e21');
  if (!Number.isInteger(scale) || scale < 0 || scale > 20) throw new Error('Scale must be an integer from 0 to 20');
  const fixed = value.toFixed(scale);
  const trimmed = fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed;
  return trimmed === '-0' ? '0' : trimmed;
}
