import { commitTimings } from '../commitTiming';

beforeEach(() => commitTimings.reset());

describe('the measurement, not the measuring', () => {
  it('reports nothing before anything is measured', () => {
    expect(commitTimings.report()).toMatchObject({ count: 0, withinBudget: false });
  });

  it('reads p95 by nearest rank, not by interpolation', () => {
    // 20 samples: p95 is the 19th, which is what a small sample honestly supports.
    for (let i = 1; i <= 20; i++) commitTimings.__record(i);
    expect(commitTimings.report().p95).toBe(19);
  });

  it('reports the median and the worst case alongside it', () => {
    for (const ms of [10, 20, 30, 40, 500]) commitTimings.__record(ms);
    const r = commitTimings.report();
    expect(r.p50).toBe(30);
    expect(r.worst).toBe(500);
  });

  it('holds the D16 budget at 100 ms and judges against it', () => {
    for (let i = 0; i < 20; i++) commitTimings.__record(40);
    const r = commitTimings.report();
    expect(r.budgetMs).toBe(100);
    expect(r.withinBudget).toBe(true);
  });

  it('fails the budget when more than 5% of commits are slow', () => {
    // Two slow commits in twenty is 10% — past the p95 boundary.
    for (let i = 0; i < 18; i++) commitTimings.__record(10);
    commitTimings.__record(250);
    commitTimings.__record(250);
    expect(commitTimings.report().withinBudget).toBe(false);
  });

  it('a single stall in twenty passes p95 but is still visible as `worst`', () => {
    // One in twenty IS the 95th percentile boundary, so p95 does not move — which
    // is exactly why the report carries the worst case beside it. A user who saw
    // one 250 ms stall saw it.
    for (let i = 0; i < 19; i++) commitTimings.__record(10);
    commitTimings.__record(250);

    const r = commitTimings.report();
    expect(r.p95).toBe(10);
    expect(r.withinBudget).toBe(true);
    expect(r.worst).toBe(250);
  });

  it('keeps a rolling window rather than growing for ever', () => {
    for (let i = 0; i < 500; i++) commitTimings.__record(i);
    expect(commitTimings.report().count).toBeLessThanOrEqual(200);
  });

  it('start() returns a finish function that is safe to call twice', () => {
    const finish = commitTimings.start();
    expect(() => { finish(); finish(); }).not.toThrow();
  });
});
