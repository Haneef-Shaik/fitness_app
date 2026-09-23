/**
 * Which dashboard cards a device shows, and in what order (B-02, BRD §15).
 *
 * A **device preference**: `/dashboard` always returns every domain, so this
 * changes nothing about what is fetched or tracked — only what is rendered.
 * That is why it does not go to the server, and why hiding a card is reversible
 * with no data loss to explain.
 *
 * A stored layout is **merged** with the known sections rather than trusted
 * wholesale: a card added in a later release must appear for somebody who saved
 * a layout before it existed, rather than silently never showing up.
 */
import { getPref, setPref } from '../../lib/prefs';

const KEY = 'dashboard_layout';

export const DASHBOARD_SECTIONS = [
  { key: 'training', label: 'Training' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'body', label: 'Body' },
  { key: 'goals', label: 'Goals' },
] as const;

export type SectionKey = (typeof DASHBOARD_SECTIONS)[number]['key'];

export interface SectionLayout {
  key: SectionKey;
  visible: boolean;
}

export type DashboardLayout = SectionLayout[];

export const DEFAULT_LAYOUT: DashboardLayout =
  DASHBOARD_SECTIONS.map((s) => ({ key: s.key, visible: true }));

/** Known sections in the saved order, with anything new appended visible. */
export function mergeLayout(saved: unknown): DashboardLayout {
  if (!Array.isArray(saved)) return DEFAULT_LAYOUT;

  const known = new Set<string>(DASHBOARD_SECTIONS.map((s) => s.key));
  const ordered: DashboardLayout = [];
  const seen = new Set<string>();

  for (const row of saved) {
    if (typeof row !== 'object' || row === null) continue;
    const key = (row as { key?: unknown }).key;
    if (typeof key !== 'string' || !known.has(key) || seen.has(key)) continue;
    seen.add(key);
    ordered.push({
      key: key as SectionKey,
      visible: (row as { visible?: unknown }).visible !== false,
    });
  }

  // A section the saved layout has never heard of is new. Show it.
  for (const section of DASHBOARD_SECTIONS) {
    if (!seen.has(section.key)) ordered.push({ key: section.key, visible: true });
  }
  return ordered;
}

export async function loadDashboardLayout(): Promise<DashboardLayout> {
  return mergeLayout(await getPref<unknown>(KEY, DEFAULT_LAYOUT));
}

export async function saveDashboardLayout(layout: DashboardLayout): Promise<void> {
  await setPref(KEY, layout.map((row) => ({ key: row.key, visible: row.visible })));
}
