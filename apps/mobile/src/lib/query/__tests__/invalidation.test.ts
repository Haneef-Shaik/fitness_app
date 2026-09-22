import { createTestQueryClient } from '../client';
import fs from 'fs';
import path from 'path';
import {
  applyInvalidation,
  invalidationFor,
  invalidationRules,
  type MutationKind,
} from '../invalidation';
import { qk } from '../queryKeys';

const DOC = path.resolve(__dirname, '../../../../../../docs/03-FRONTEND-ARCHITECTURE.md');

/** The first column of every row in the §6.2 table. */
function docRowLabels(): string[] {
  const md = fs.readFileSync(DOC, 'utf8');
  const section = md.slice(md.indexOf('### 6.2 Invalidation map'), md.indexOf('### 6.3'));
  return section
    .split('\n')
    .filter((l) => l.startsWith('| ') && !l.startsWith('| Mutation') && !l.startsWith('|---'))
    .map((l) => l.split('|')[1]!.trim());
}

describe('invalidation map — code and docs/03 §6.2 agree', () => {
  it('every rule cites a row that exists in the table', () => {
    const labels = docRowLabels();
    for (const [kind, rule] of Object.entries(invalidationRules)) {
      expect(labels).toContain(rule.doc);
      expect(rule.doc.length).toBeGreaterThan(0);
      expect(kind).toBeTruthy();
    }
  });

  it('every row in the table is claimed by exactly one rule', () => {
    const claimed = Object.values(invalidationRules).map((r) => r.doc);
    for (const label of docRowLabels()) {
      expect(claimed.filter((c) => c === label)).toHaveLength(1);
    }
  });
});

describe('invalidation rules', () => {
  it('wipes the whole cache when the identity changes', () => {
    // Cached data belongs to the previous account; a stale read across a switch
    // is a data-leak bug, not a refresh bug.
    const inv = invalidationFor('auth.identityChanged');
    expect(inv.clearAll).toBe(true);
    expect(inv.keys).toHaveLength(0);
  });

  it('AC-12: editing a program never invalidates performed data', () => {
    const inv = invalidationFor('program.changed', { programId: 'p1' });
    const flat = JSON.stringify(inv.keys);
    expect(flat).toContain('programs');
    expect(flat).not.toContain('sessions');
    expect(flat).not.toContain('records');
    expect(flat).not.toContain('previous-performance');
  });

  it('I10: a set commit invalidates its session but never refetches', () => {
    const inv = invalidationFor('set.changed', { sessionId: 's1' });
    expect(inv.refetch).toBe(false);
    expect(inv.keys).toEqual([qk.session('s1')]);
  });

  it('finishing a session refetches the server-computed numbers', () => {
    const inv = invalidationFor('session.finished', { sessionId: 's1' });
    expect(inv.refetch).toBe(true);
    const flat = JSON.stringify(inv.keys);
    expect(flat).toContain('sessions');
    expect(flat).toContain('records');
  });

  it('a plan-day edit reaches only its program', () => {
    const inv = invalidationFor('planDay.changed', { programId: 'p9' });
    expect(inv.keys).toEqual([qk.program('p9')]);
  });

  it('falls back to the whole family when no id is given', () => {
    const inv = invalidationFor('program.changed');
    expect(inv.keys).toEqual([['programs']]);
  });
});

describe('applyInvalidation', () => {
  const kinds = Object.keys(invalidationRules) as MutationKind[];

  it('handles every declared mutation kind without throwing', async () => {
    for (const kind of kinds) {
      const qc = createTestQueryClient();
      await expect(
        applyInvalidation(qc, kind, { sessionId: 's', programId: 'p', goalId: 'g', exerciseId: 'e' }),
      ).resolves.toBeUndefined();
      qc.clear();
    }
  });

  it('actually clears the cache on an identity change', async () => {
    const qc = createTestQueryClient();
    qc.setQueryData(qk.profile(), { timezone: 'Europe/London' });
    expect(qc.getQueryData(qk.profile())).toBeDefined();

    await applyInvalidation(qc, 'auth.identityChanged');
    expect(qc.getQueryData(qk.profile())).toBeUndefined();
  });

  it('marks a session stale without removing what the UI is showing', async () => {
    const qc = createTestQueryClient();
    qc.setQueryData(qk.session('s1'), { id: 's1', status: 'in_progress' });

    await applyInvalidation(qc, 'set.changed', { sessionId: 's1' });

    // Still rendered from cache — I10 says the commit path never awaits the network.
    expect(qc.getQueryData(qk.session('s1'))).toEqual({ id: 's1', status: 'in_progress' });
    expect(qc.getQueryState(qk.session('s1'))?.isInvalidated).toBe(true);
  });
});
