import { HINDI_BACKLOG } from './catalogue.mjs';
import { dayId, prescriptionId, programmeId } from './ids.mjs';
import { seedRows } from './seed.mjs';

// Starter programmes as templates in the persisted `days` contract shape (packages/domain contracts), so MB-2 can
// copy one into a member-owned programme. There is no global template table yet (public.programmes.owner_id is
// not null), so nothing here writes to a database. The G14.hi backlog lists every record still waiting for Hindi.

/** The exercise snapshot a prescription carries, built from a seed row. */
export function exerciseSnapshot(row) {
  return {
    id: row.id, version: row.version, name: row.name, type: row.loggingType, loadBasis: row.loadBasis, multiplier: row.multiplier,
    equipment: row.equipment, primaryMuscles: [...row.primaryMuscles], secondaryMuscles: [...row.secondaryMuscles],
    instructions: row.instructions, aliases: [...row.aliases], ownerId: null, archived: false,
  };
}

export function buildStarterTemplates(catalogue) {
  const rows = seedRows(catalogue);
  const bySlug = new Map(catalogue.exercises.map((exercise, index) => [exercise.slug, rows[index]]));
  return catalogue.programmes.map((programme) => ({
    id: programmeId(programme.slug),
    slug: programme.slug,
    version: programme.version,
    name: programme.name,
    description: programme.description,
    level: programme.level,
    days: programme.days.map((day) => ({
      id: dayId(programme.slug, day.slug),
      name: day.name,
      notes: day.notes,
      weekdays: [...day.weekdays],
      exercises: day.items.map((item, index) => ({
        id: prescriptionId(programme.slug, day.slug, index + 1),
        exercise: exerciseSnapshot(bySlug.get(item.exercise)),
        sets: item.sets,
        repsMin: item.repsMin,
        repsMax: item.repsMax,
        loadKg: null,
        durationSeconds: item.durationSeconds ?? null,
        distanceMetres: item.distanceMetres ?? null,
        restSeconds: item.restSeconds,
        supersetId: null,
      })),
    })),
    provenance: { ...programme.provenance },
    review: structuredClone(programme.review),
  }));
}

/** Every record whose Hindi is listed for G14.hi, with the fields G14.hi must translate. */
export function hindiBacklog(catalogue) {
  const entries = [];
  const add = (kind, key, hi, fields) => {
    if (hi === HINDI_BACKLOG) entries.push({ kind, key, gate: HINDI_BACKLOG, fields });
  };
  for (const region of catalogue.regions) add('region', region.id, region.hi, ['name']);
  for (const muscle of catalogue.muscles) add('muscle', muscle.id, muscle.hi, ['name']);
  for (const item of catalogue.equipment) add('equipment', item.id, item.hi, ['name']);
  for (const exercise of catalogue.exercises) add('exercise', exercise.slug, exercise.hi, ['name', 'instructions']);
  for (const programme of catalogue.programmes) {
    add('programme', programme.slug, programme.hi, ['name', 'description']);
    for (const day of programme.days) add('day', `${programme.slug}/${day.slug}`, day.hi, day.notes ? ['name', 'notes'] : ['name']);
  }
  return entries;
}
