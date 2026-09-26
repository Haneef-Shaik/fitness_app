import { isLinked, toggleLink } from '../supersetLinks';

const rows = (...g: (number | null)[]) => g.map((superset_group) => ({ superset_group }));
const groups = (r: { superset_group?: number | null }[]) => r.map((x) => x.superset_group ?? null);

it('links two straight sets into a new superset', () => {
  expect(groups(toggleLink(rows(null, null, null), 0))).toEqual([1, 1, null]);
});

it('extends a superset into a circuit', () => {
  expect(groups(toggleLink(rows(1, 1, null), 1))).toEqual([1, 1, 1]);
});

it('unlinking a pair leaves two straight sets, not two supersets of one', () => {
  expect(groups(toggleLink(rows(1, 1), 0))).toEqual([null, null]);
});

it('unlinking in the middle of a circuit splits it where it can', () => {
  expect(groups(toggleLink(rows(1, 1, 1, 1), 1))).toEqual([1, 1, 2, 2]);
  expect(groups(toggleLink(rows(1, 1, 1), 1))).toEqual([1, 1, null]);
});

it('knows which rows are linked', () => {
  const r = rows(1, 1, null, 2, 2);
  expect([0, 1, 2, 3].map((i) => isLinked(r, i))).toEqual([true, false, false, true]);
});
