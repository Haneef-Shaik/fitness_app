import { IMPERIAL_PLATES_LB, METRIC_PLATES_KG, platesFor } from '../plates';

describe('E-12 · plates per side', () => {
  it('100 kg on a 20 kg bar is 25 + 15 a side', () => {
    expect(platesFor(100, 20, METRIC_PLATES_KG)).toEqual({ perSide: [25, 15], achieved: 100, exact: true });
  });

  it('uses the small change plates', () => {
    expect(platesFor(102.5, 20, METRIC_PLATES_KG).perSide).toEqual([25, 15, 1.25]);
  });

  it('finds a load greedy loading would miss', () => {
    // Heaviest-first takes 25 and is stuck; 15 + 15 is exact.
    expect(platesFor(80, 20, [25, 15])).toEqual({ perSide: [15, 15], achieved: 80, exact: true });
  });

  it('offers the nearest load when the exact one cannot be made — the lighter on a tie', () => {
    const r = platesFor(101, 20, METRIC_PLATES_KG);
    expect(r.exact).toBe(false);
    expect(r.achieved).toBe(100);
  });

  it('an empty bar needs no plates', () => {
    expect(platesFor(20, 20, METRIC_PLATES_KG)).toEqual({ perSide: [], achieved: 20, exact: true });
  });

  it('a target below the bar is just the bar', () => {
    expect(platesFor(10, 20, METRIC_PLATES_KG)).toMatchObject({ perSide: [], achieved: 20 });
  });

  it('works in pounds', () => {
    // 225 lb: two 45s a side on a 45 lb bar.
    expect(platesFor(225, 45, IMPERIAL_PLATES_LB)).toEqual({ perSide: [45, 45], achieved: 225, exact: true });
  });

  it('prefers fewer plates among exact answers', () => {
    expect(platesFor(60, 20, [20, 10, 5]).perSide).toEqual([20]);
  });
});
