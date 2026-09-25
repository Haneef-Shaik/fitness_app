/** How a starter program's exercise reads on its card: "5 × 5", "3 × 8–12", "3 × 30 s". */
import { prescription } from '../prescription';

const e = (over: Partial<Parameters<typeof prescription>[0]>) => ({
  sets: 3, reps_min: null, reps_max: null, duration_seconds: null, ...over,
});

it('writes fixed reps as sets × reps', () => {
  expect(prescription(e({ sets: 5, reps_min: 5, reps_max: 5 }))).toBe('5 × 5');
});

it('writes a rep range with an en dash', () => {
  expect(prescription(e({ reps_min: 8, reps_max: 12 }))).toBe('3 × 8–12');
});

it('writes a hold in seconds, and a long one in minutes', () => {
  expect(prescription(e({ duration_seconds: 30 }))).toBe('3 × 30 s');
  expect(prescription(e({ sets: 1, duration_seconds: 90 }))).toBe('1 × 1.5 min');
});

it('writes open-ended reps as 5+, and bare sets when nothing more is given — never "null"', () => {
  expect(prescription(e({ sets: 1, reps_min: 5, reps_max: null }))).toBe('1 × 5+');
  expect(prescription(e({ sets: 2 }))).toBe('2 sets');
  expect(prescription(e({ sets: 1 }))).toBe('1 set');
});
