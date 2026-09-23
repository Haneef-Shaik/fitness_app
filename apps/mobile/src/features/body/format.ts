/**
 * How body figures read. One formatter, so I-01, I-03 and B-01 phrase the same
 * number the same way.
 */

/** A weight to one decimal — the precision a bathroom scale actually has. */
export function weight(value: number | null | undefined, unit = 'kg'): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(1)} ${unit}`;
}

/**
 * A change, with its direction stated.
 *
 * Down is not automatically good and up is not automatically bad — that depends
 * on the goal, which this function does not know. So it reports the arrow and
 * the number and leaves the judgement to the screen.
 */
export function delta(value: number | null | undefined, unit = 'kg'): string | null {
  if (value === null || value === undefined) return null;
  if (Math.abs(value) < 0.05) return `No change (${unit})`;
  return `${value > 0 ? '▲' : '▼'} ${Math.abs(value).toFixed(1)} ${unit}`;
}

/** "Last logged 2 days ago" — a fact, never a scold. */
export function sinceLabel(localDate: string, today: string): string {
  const days = daysBetween(localDate, today);
  if (days <= 0) return 'Logged today';
  if (days === 1) return 'Logged yesterday';
  return `Last logged ${days} days ago`;
}

export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

export const METRIC_FIELDS = [
  { key: 'body_weight', label: 'Weight', unit: 'kg' },
  { key: 'body_fat_pct', label: 'Body fat', unit: '%' },
  { key: 'waist_cm', label: 'Waist', unit: 'cm' },
  { key: 'chest_cm', label: 'Chest', unit: 'cm' },
  { key: 'arm_cm', label: 'Arm', unit: 'cm' },
  { key: 'thigh_cm', label: 'Thigh', unit: 'cm' },
  { key: 'hip_cm', label: 'Hip', unit: 'cm' },
] as const;

export type MetricKey = (typeof METRIC_FIELDS)[number]['key'];

export function metricLabel(key: string): string {
  return METRIC_FIELDS.find((f) => f.key === key)?.label
    ?? key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export function metricUnit(key: string): string {
  return METRIC_FIELDS.find((f) => f.key === key)?.unit ?? 'kg';
}
