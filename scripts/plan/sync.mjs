import { isDeepStrictEqual } from 'node:util';

// Compare semantic data, ignoring the builder's display order and layout coordinates.
export function generatedProblems(source, generated, html) {
  const problems = [];
  if (!isDeepStrictEqual(source, generated)) problems.push('plan.json differs from GOALS.md; run pnpm plan:build');
  const match = html.match(/^const PLAN = (\{[^\n]*\});[ \t]*(?:\/\/[^\n]*)?$/m);
  if (!match) return [...problems, 'board.html has no readable embedded plan; run pnpm plan:build'];
  let board;
  try { board = JSON.parse(match[1]); }
  catch { return [...problems, 'board.html has invalid embedded JSON; run pnpm plan:build']; }
  const syncPoints = source.syncPoints || [];
  const sp = Object.fromEntries(syncPoints.flatMap(p => p.goals.map(id => [id, p.id])));
  const expected = source.goals.map(g => ({
    id: g.id, t: g.title, s: g.size || '', n: g.needs, g: !!g.guard,
    tr: g.track || '', o: g.owner, l: g.label || g.title.slice(0, 40),
    sp: g.syncPoint || sp[g.id] || '', doc: g.doc || '',
  }));
  const actual = (board.goals || []).map(({ st, r, ...goal }) => goal);
  const sorted = goals => [...goals].sort((a, b) => a.id.localeCompare(b.id));
  if (!isDeepStrictEqual(sorted(expected), sorted(actual))) problems.push('board.html goal data differs from GOALS.md; run pnpm plan:build');
  for (const field of ['tracks', 'syncPoints']) {
    if (!isDeepStrictEqual(source[field] || (field === 'tracks' ? {} : []), board[field])) {
      problems.push(`board.html ${field} differs from GOALS.md; run pnpm plan:build`);
    }
  }
  for (const [key, value] of Object.entries(source.config || {})) {
    if (!isDeepStrictEqual(value, board.config?.[key])) problems.push(`board.html config.${key} differs from GOALS.md; run pnpm plan:build`);
  }
  const people = (source.people || []).map(p => typeof p === 'string' ? { name: p } : p);
  if (!isDeepStrictEqual(people.map(p => p.name), board.people?.slice(0, people.length).map(p => p.name)) ||
      people.some((p, i) => p.colour && p.colour !== board.people?.[i]?.colour)) {
    problems.push('board.html lanes differ from GOALS.md; run pnpm plan:build');
  }
  return problems;
}
