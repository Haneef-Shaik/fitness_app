/**
 * E-13 in the plan-day editor: linking neighbouring exercises into a superset.
 *
 * A group is a run of adjacent rows sharing `superset_group`. Linking row i to
 * i + 1 joins their groups; unlinking splits the run there, and a row left on
 * its own stops being a superset at all — a "superset" of one is a label that
 * would change nothing and confuse the logger's rounds.
 */
interface Row { superset_group?: number | null }

const groupOf = (r: Row | undefined) => r?.superset_group ?? null;

export function isLinked(rows: readonly Row[], i: number): boolean {
  const g = groupOf(rows[i]);
  return g !== null && g === groupOf(rows[i + 1]);
}

function freeGroup(rows: readonly Row[]): number | null {
  const used = new Set(rows.map(groupOf).filter((g) => g !== null));
  for (let g = 1; g <= 9; g++) if (!used.has(g)) return g;
  return null;
}

export function toggleLink<T extends Row>(rows: readonly T[], i: number): T[] {
  if (i < 0 || i >= rows.length - 1) return [...rows];
  const next = rows.map((r) => ({ ...r }));

  if (isLinked(rows, i)) {
    // Split the run after i. The part after keeps a group only if it is still
    // two or more exercises long; so does the part before.
    const g = groupOf(rows[i]);
    let end = i + 1;
    while (end + 1 < rows.length && groupOf(rows[end + 1]) === g) end++;
    let start = i;
    while (start > 0 && groupOf(rows[start - 1]) === g) start--;
    const after = end - i;          // rows i+1 … end
    const before = i - start + 1;   // rows start … i
    const newGroup = after >= 2 ? freeGroup(rows) : null;
    for (let k = i + 1; k <= end; k++) next[k]!.superset_group = newGroup;
    if (before < 2) next[i]!.superset_group = null;
    return next;
  }

  const g = groupOf(rows[i + 1]) ?? groupOf(rows[i]) ?? freeGroup(rows);
  if (g === null) return next;
  // Joining: both runs take one number.
  const a = groupOf(rows[i]);
  const b = groupOf(rows[i + 1]);
  for (const r of next) {
    const rg = groupOf(r);
    if (rg !== null && (rg === a || rg === b)) r.superset_group = g;
  }
  next[i]!.superset_group = g;
  next[i + 1]!.superset_group = g;
  return next;
}
