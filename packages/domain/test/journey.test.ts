/**
 * Goal milestones and the projection (G10, the owner's review: "track the
 * body measurements and the weight as checkpoints or milestones").
 *
 * A goal of 84 → 76 kg has milestones a quarter of the way apart. Each is
 * reached or not by the latest check-in, the next one is named, and the
 * finish date is projected from the pace ACTUALLY achieved once there is a
 * week of data — the chosen pace before that.
 */
import { describe, expect, it } from 'vitest';
import { goalJourney } from '../src/body/journey';

const goal = {
  start: 84, target: 76, direction: 'down' as const,
  startDate: '2026-09-01', weeklyRate: 0.5,
};

describe('milestones', () => {
  it('are a quarter of the way apart, the last one being the target', () => {
    const j = goalJourney({ ...goal, current: 84, today: '2026-09-01' });
    expect(j.milestones.map((m) => m.value)).toEqual([82, 80, 78, 76]);
    expect(j.milestones.every((m) => !m.reached)).toBe(true);
    expect(j.next?.value).toBe(82);
  });

  it('are reached by the latest check-in, going the right way', () => {
    const j = goalJourney({ ...goal, current: 79.4, today: '2026-10-06' });
    expect(j.milestones.map((m) => m.reached)).toEqual([true, true, false, false]);
    expect(j.next?.value).toBe(78);
    expect(j.remaining).toBeCloseTo(3.4, 5);
  });

  it('work upwards too', () => {
    const j = goalJourney({
      start: 70, target: 76, direction: 'up', startDate: '2026-09-01', weeklyRate: 0.25,
      current: 73.2, today: '2026-11-01',
    });
    expect(j.milestones.map((m) => m.value)).toEqual([71.5, 73, 74.5, 76]);
    expect(j.milestones.map((m) => m.reached)).toEqual([true, true, false, false]);
  });

  it('all reached means done, with no next milestone', () => {
    const j = goalJourney({ ...goal, current: 75.8, today: '2026-12-01' });
    expect(j.done).toBe(true);
    expect(j.next).toBeNull();
  });

  it('with no check-in yet nothing is reached and progress is unknown, not zero', () => {
    const j = goalJourney({ ...goal, current: null, today: '2026-09-02' });
    expect(j.progress).toBeNull();
    expect(j.milestones.every((m) => !m.reached)).toBe(true);
  });
});

describe('the projection', () => {
  it('before a week of data, uses the chosen pace', () => {
    // 8 kg at 0.5 kg/week = 16 weeks from the start.
    const j = goalJourney({ ...goal, current: 83.8, today: '2026-09-04' });
    expect(j.pace).toBe('planned');
    expect(j.projectedDate).toBe('2026-12-22');
  });

  it('after a week, uses the pace actually achieved — not the one planned', () => {
    // 3 kg in 4 weeks = 0.75 kg/week (the plan said 0.5); 5 kg left → 6⅔
    // weeks = 47 days from today. The planned pace would have said 22 Dec.
    const j = goalJourney({ ...goal, current: 81, today: '2026-09-29' });
    expect(j.pace).toBe('actual');
    expect(j.actualWeeklyRate).toBeCloseTo(0.75, 5);
    expect(j.projectedDate).toBe('2026-11-15');
  });

  it('going the wrong way has no projected date — and says so', () => {
    const j = goalJourney({ ...goal, current: 85, today: '2026-09-29' });
    expect(j.projectedDate).toBeNull();
    expect(j.pace).toBe('off-track');
  });

  it('no change at all is steady, not "moving away" (G10, seen on the phone)', () => {
    // Start 78.4, a month later still 78.4: the card said "Moving away from
    // the target lately" about a weight that had not moved.
    const j = goalJourney({ ...goal, current: goal.start, today: '2026-09-29' });
    expect(j.pace).toBe('steady');
    expect(j.projectedDate).toBeNull();
  });

  it('no pace chosen and no data: no date rather than an invented one', () => {
    const j = goalJourney({ ...goal, weeklyRate: null, current: null, today: '2026-09-02' });
    expect(j.projectedDate).toBeNull();
  });
});
