/**
 * Runs the SHARED cross-language vectors in contracts/vectors/domain.json.
 * The Python suite in services/api/tests/test_vectors.py loads the same file.
 * If these two ever disagree, a user's session summary changes after it syncs — so
 * this file is the thing that makes that impossible to ship.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  totalVolumeKg, estimated1rmKg, evaluateRecords, validateSet,
  kgToLb, lbToKg, cmToIn, toLocalDate, dayTotals,
  KG_PER_LB, CM_PER_IN, E1RM_FORMULA_VERSION,
  type WorkoutSet, type SetType,
} from '../src/index';

const here = dirname(fileURLToPath(import.meta.url));
const V = JSON.parse(readFileSync(resolve(here, '../../../contracts/vectors/domain.json'), 'utf8'));
const TOL = V.tolerance as number;

const toSet = (s: any): WorkoutSet => ({
  setType: s.set_type as SetType,
  loadKg: s.load_kg ?? null,
  reps: s.reps ?? null,
  completed: s.completed,
});

describe('constants match the contract', () => {
  it('unit constants are exact', () => {
    expect(KG_PER_LB).toBe(V.constants.KG_PER_LB);
    expect(CM_PER_IN).toBe(V.constants.CM_PER_IN);
  });
  it('e1RM formula version is pinned', () => {
    expect(E1RM_FORMULA_VERSION).toBe(V.constants.e1rm_formula);
  });
});

describe('volume', () => {
  for (const c of V.volume) {
    it(c.name, () => {
      expect(totalVolumeKg(c.sets.map(toSet))).toBeCloseTo(c.expected_volume_kg, 9);
    });
  }
});

describe('estimated 1RM', () => {
  for (const c of V.e1rm) {
    it(c.name, () => {
      const got = estimated1rmKg(c.load_kg ?? null, c.reps ?? null);
      if (c.expected_e1rm_kg === null) expect(got).toBeNull();
      else expect(got!).toBeCloseTo(c.expected_e1rm_kg, 9);
    });
  }
});

describe('personal records', () => {
  const c = V.personal_records;
  it(c.name, () => {
    const got = evaluateRecords(c.sets.map(toSet));
    expect(got.maxLoadKg).toBeCloseTo(c.expected.max_load_kg, 9);
    expect(got.maxReps).toBe(c.expected.max_reps);
    expect(got.volumeKg).toBeCloseTo(c.expected.volume_kg, 9);
    expect(got.estimated1rmKg!).toBeCloseTo(c.expected.estimated_1rm_kg, 9);
  });
});

describe('units', () => {
  for (const c of V.units.conversions) {
    it(c.name, () => {
      if ('expected_lb' in c) expect(kgToLb(c.kg)).toBeCloseTo(c.expected_lb, 9);
      if ('expected_in' in c) expect(cmToIn(c.cm)).toBeCloseTo(c.expected_in, 9);
    });
  }
  for (const kg of V.units.roundtrip_kg as number[]) {
    it(`round-trip ${kg} kg is lossless`, () => {
      expect(Math.abs(lbToKg(kgToLb(kg)) - kg)).toBeLessThan(TOL);
    });
  }
});

describe('local date bucketing', () => {
  for (const c of V.local_date) {
    it(`${c.timezone} — ${c.note}`, () => {
      expect(toLocalDate(c.instant, c.timezone)).toBe(c.expected_local_date);
    });
  }
});

describe('set validity', () => {
  for (const c of V.set_validity) {
    it(c.name, () => {
      const r = validateSet({
        reps: c.set.reps ?? null,
        loadKg: c.set.load_kg ?? null,
        durationSeconds: c.set.duration_seconds ?? null,
        distanceM: c.set.distance_m ?? null,
      });
      expect(r.valid).toBe(c.expected_valid);
      if (!c.expected_valid && c.expected_error) {
        expect(r.valid === false && r.error).toBe(c.expected_error);
      }
    });
  }
});

describe('nutrition day totals', () => {
  for (const c of V.nutrition_day_totals) {
    it(c.name, () => {
      const got = dayTotals(c.items.map((i: any) => ({
        calories: i.calories, proteinG: i.protein_g, carbsG: i.carbs_g,
        fatG: i.fat_g, confirmed: i.confirmed,
      })));
      expect(got.calories).toBeCloseTo(c.expected.calories, 9);
      expect(got.proteinG).toBeCloseTo(c.expected.protein_g, 9);
      expect(got.carbsG).toBeCloseTo(c.expected.carbs_g, 9);
      expect(got.fatG).toBeCloseTo(c.expected.fat_g, 9);
      expect(got.pendingCount).toBe(c.expected.pending_count);
      expect(got.incomplete).toBe(c.expected.incomplete);
    });
  }
});
