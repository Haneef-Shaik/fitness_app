import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exerciseId } from './ids.mjs';

// Launch exercise catalogue and starter programmes (CT-1; PRD 6.1, 6.2, 21.4; DEC-16; docs/architecture/003 §7).
// readContent() reads content/ as listed in content/catalogue.json. validateContent() is pure: it returns every
// problem it finds, each naming its file and record, and a resolved catalogue only when there is none.

export const CONTENT_ROOT = fileURLToPath(new URL('../../content/', import.meta.url));
export const MANIFEST = 'catalogue.json';
export const MIN_EXERCISES = 200;
export const MIN_PER_CATEGORY = 8;
export const STARTER_PROGRAMMES = 3;
export const CATEGORIES = Object.freeze(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'cardio']);
export const MOVEMENTS = Object.freeze([
  'squat', 'hinge', 'lunge', 'push_horizontal', 'push_vertical', 'pull_horizontal', 'pull_vertical',
  'carry', 'core', 'isolation_upper', 'isolation_lower', 'power', 'conditioning', 'cardio',
]);
export const LOGGING_TYPES = Object.freeze(['resistance', 'bodyweight', 'timed', 'distance']);
export const LOAD_BASES = Object.freeze(['total', 'per_hand', 'assistance', 'none']);
/** PRD 6.1 logging semantics: which load basis each logging type may use. */
export const ALLOWED_LOAD = Object.freeze({
  resistance: ['total', 'per_hand'], bodyweight: ['none', 'assistance'], timed: ['none', 'total', 'per_hand'], distance: ['none'],
});
export const LEVELS = Object.freeze(['introductory', 'intermediate']);
export const HINDI_BACKLOG = 'G14.hi';
export const QUALIFIED_REVIEW_GATE = 'OW-13';
export const ORIGINAL_LICENCE = 'LicenseRef-FitLog-Original';
/** External text may enter only under one of these (no non-commercial, no-derivatives or share-alike terms). */
export const PERMITTED_EXTERNAL_LICENCES = Object.freeze(['CC0-1.0', 'Unlicense', '0BSD', 'MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'CC-BY-4.0']);
export const MUSCLE_WEIGHTS = Object.freeze({ primary: 1, secondary: 0.5 });
/**
 * PRD 6.1 volume multiplier, derived from repsPerSide (never from singleArm alone): bilateral per-hand work is 2;
 * per-hand reps-per-side work is 1, whether one-arm or two dumbbells worked one leg at a time; every other load basis
 * is 1. singleArm stays a validated flag (it needs per_hand and repsPerSide), so it always yields 1 here.
 */
export const volumeMultiplier = ({ loadBasis, repsPerSide }) => (loadBasis === 'per_hand' && repsPerSide !== true ? 2 : 1);
/** Health, medical and safety claims need a primary reference and qualified review, so launch text makes none. */
export const CLAIM_TERMS = /\b(?:safe\w*|injur\w*|pain\w*|prevent\w*|cure\w*|treat\w*|heal\w*|rehab\w*|therap\w*|medic\w*|doctor\w*|physio\w*|diseas\w*|diabet\w*|blood pressure|cholesterol|burn\w*|fat loss|weight loss|guarantee\w*|clinical\w*|diagnos\w*)\b/i;
/** Characters that could escape the seed's SQL literal or its dollar quoting, or that no catalogue text needs. */
const FORBIDDEN = /["\\$\u0000-\u001f\u007f]/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TAXONOMY_ID = /^[a-z][a-z0-9_]*$/;
const CONTENT_PATH = /^[a-z0-9-]+\/[a-z0-9-]+\.json$/;
const DEVANAGARI = /[\u0900-\u097f]/;
const SCHEMAS = { manifest: 'fitlog.content.v1', muscles: 'fitlog.muscles.v1', equipment: 'fitlog.equipment.v1', exercises: 'fitlog.exercises.v1', programmes: 'fitlog.starter-programmes.v1' };

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const normalise = (value) => value.toLowerCase().replace(/\s+/g, ' ');
function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}
const isInt = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

/** Instruction sentences: split after . ! or ? followed by white space. */
export const sentences = (text) => text.trim().split(/(?<=[.!?])\s+/).filter(Boolean);

/** Reads content/ as catalogue.json lists it. Unreadable or non-JSON files throw; stray JSON files are returned for validation. */
export function readContent(root = CONTENT_ROOT) {
  const json = (relative) => {
    let text;
    try { text = readFileSync(join(root, relative), 'utf8'); } catch (error) { throw new Error(`content/${relative} cannot be read (${error.code ?? error.message})`); }
    try { return JSON.parse(text); } catch (error) { throw new Error(`content/${relative} is not JSON (${error.message})`); }
  };
  const manifest = json(MANIFEST);
  const files = manifest?.files;
  if (!isObject(files) || !Array.isArray(files.exercises)) throw new Error('content/catalogue.json files must name muscles, equipment, exercises (a list) and programmes');
  const listed = [files.muscles, files.equipment, ...files.exercises, files.programmes];
  for (const path of listed) if (typeof path !== 'string' || !CONTENT_PATH.test(path)) throw new Error(`content/catalogue.json lists ${JSON.stringify(path)}, which is not a <dir>/<name>.json path inside content/`);
  const directories = [...new Set(listed.map((path) => path.split('/')[0]))].sort();
  const strayFiles = directories.flatMap((dir) => readdirSync(join(root, dir)).filter((name) => name.endsWith('.json')).map((name) => `${dir}/${name}`)).filter((path) => !listed.includes(path)).sort();
  return {
    manifest,
    muscles: json(files.muscles),
    equipment: json(files.equipment),
    exerciseFiles: files.exercises.map((path) => ({ path, data: json(path) })),
    programmes: json(files.programmes),
    strayFiles,
  };
}

/** Collects problems as "<where>: <message>" lines. */
function reporter() {
  const problems = [];
  const report = (where, message) => problems.push(`${where}: ${message}`);
  /** Required and optional keys; a key holding undefined counts as missing. Returns false when value is not an object. */
  const keys = (where, value, required, optional = []) => {
    if (!isObject(value)) { report(where, 'must be an object'); return false; }
    for (const key of required) if (value[key] === undefined) report(where, `${key} is missing`);
    for (const key of Object.keys(value)) if (!required.includes(key) && !optional.includes(key)) report(where, `unknown field ${key}`);
    return true;
  };
  const text = (where, field, value, { min = 1, max = 100, claims = false } = {}) => {
    if (value === undefined) return false;
    if (typeof value !== 'string') { report(where, `${field} must be a string`); return false; }
    if (value !== value.trim()) report(where, `${field} has leading or trailing white space`);
    if (value.length < min || value.length > max) report(where, `${field} must be ${min}–${max} characters`);
    if (FORBIDDEN.test(value)) report(where, `${field} contains a quote, backslash, dollar sign or control character`);
    const claim = claims ? CLAIM_TERMS.exec(value) : null;
    if (claim) report(where, `${field} contains a health or safety claim (${claim[0]})`);
    return true;
  };
  return { problems, report, keys, text };
}

function checkHindi(check, where, hi, fields) {
  if (hi === undefined) return false;
  if (hi === HINDI_BACKLOG) return false;
  if (!isObject(hi)) { check.report(where, `hi must be "${HINDI_BACKLOG}" or Hindi text`); return false; }
  check.keys(where, hi, fields);
  for (const field of fields) {
    const value = hi[field];
    if (check.text(where, `hi.${field}`, value, { min: field === 'notes' ? 0 : 1, max: field === 'name' ? 100 : 2000 }) && value.length > 0 && !DEVANAGARI.test(value)) {
      check.report(where, `hi.${field} must contain Devanagari text`);
    }
  }
  return true;
}

function checkReview(check, where, review) {
  if (!check.keys(where, review, ['technical', 'qualified'])) return;
  const technical = review.technical;
  const entryOk = (entry) => isObject(entry) && typeof entry.by === 'string' && entry.by.trim().length > 0 && isDate(entry.on)
    && typeof entry.method === 'string' && entry.method.trim().length > 0
    && Object.keys(entry).every((key) => ['by', 'on', 'method', 'scope'].includes(key));
  if (technical !== undefined && (!Array.isArray(technical) || technical.length === 0 || !technical.every(entryOk))) {
    check.report(where, 'review.technical needs at least one entry with by, on and method');
  }
  const qualified = review.qualified;
  if (qualified === undefined) return;
  const pending = isObject(qualified) && qualified.status === 'pending' && qualified.gate === QUALIFIED_REVIEW_GATE && Object.keys(qualified).length === 2;
  const approved = isObject(qualified) && qualified.status === 'approved' && typeof qualified.by === 'string' && qualified.by.trim().length > 0
    && isDate(qualified.on) && typeof qualified.qualification === 'string' && qualified.qualification.trim().length > 0 && Object.keys(qualified).length === 4;
  if (!pending && !approved) check.report(where, `review.qualified must be pending at ${QUALIFIED_REVIEW_GATE}, or approved with by, on and qualification`);
}

function checkSources(check, sources) {
  const where = (id) => `catalogue.json sources.${id}`;
  if (!isObject(sources) || Object.keys(sources).length === 0) { check.report('catalogue.json', 'sources must register at least one source'); return {}; }
  for (const [id, source] of Object.entries(sources)) {
    const at = where(id);
    if (!isObject(source)) { check.report(at, 'must be an object'); continue; }
    const versionsOk = Array.isArray(source.versions) && source.versions.length > 0 && source.versions.every((v) => typeof v === 'string' && v.trim().length > 0);
    if (source.kind === 'original') {
      check.keys(at, source, ['kind', 'title', 'licence', 'versions', 'methods', 'statement']);
      if (source.licence !== undefined && source.licence !== ORIGINAL_LICENCE) check.report(at, `licence of an original source must be ${ORIGINAL_LICENCE}`);
      if (source.methods !== undefined && (!Array.isArray(source.methods) || source.methods.length === 0 || source.methods.some((m) => m !== 'authored'))) check.report(at, 'methods of an original source must be authored');
      check.text(at, 'statement', source.statement, { max: 2000 });
    } else if (source.kind === 'external') {
      check.keys(at, source, ['kind', 'title', 'url', 'licence', 'versions', 'methods', 'retrievedOn', 'verified']);
      if (source.url !== undefined && (typeof source.url !== 'string' || !/^https:\/\/[^\s]+$/.test(source.url))) check.report(at, 'url must be an https URL');
      if (source.licence !== undefined && !PERMITTED_EXTERNAL_LICENCES.includes(source.licence)) check.report(at, `licence ${source.licence} is not a permitted licence (${PERMITTED_EXTERNAL_LICENCES.join(', ')})`);
      if (source.methods !== undefined && (!Array.isArray(source.methods) || source.methods.length === 0 || source.methods.some((m) => m !== 'imported' && m !== 'adapted'))) check.report(at, 'methods of an external source must be imported or adapted');
      if (source.retrievedOn !== undefined && !isDate(source.retrievedOn)) check.report(at, 'retrievedOn must be a YYYY-MM-DD date');
      if (source.verified !== undefined && check.keys(`${at}.verified`, source.verified, ['by', 'on', 'evidence'])) {
        const { by, on, evidence } = source.verified;
        if (typeof by !== 'string' || by.trim().length === 0 || !isDate(on)) check.report(at, 'verified needs by and an on date');
        if (typeof evidence !== 'string' || !/^docs\/evidence\/CT-1\/[A-Za-z0-9._-]+$/.test(evidence)) check.report(at, 'verified.evidence must be a file under docs/evidence/CT-1/');
      }
    } else {
      check.report(at, 'kind must be original or external');
      continue;
    }
    check.text(at, 'title', source.title, { max: 200 });
    if (source.versions !== undefined && !versionsOk) check.report(at, 'versions must list at least one version');
  }
  return sources;
}

const PROVENANCE_FIELDS = ['source', 'sourceVersion', 'licence', 'method'];

function checkProvenance(check, where, provenance, sources) {
  if (!isObject(provenance)) { check.report(where, 'provenance must be an object'); return; }
  for (const field of PROVENANCE_FIELDS) if (provenance[field] === undefined) check.report(where, `provenance.${field} is missing`);
  for (const key of Object.keys(provenance)) if (!PROVENANCE_FIELDS.includes(key)) check.report(where, `unknown field provenance.${key}`);
  if (provenance.source === undefined) return;
  const source = typeof provenance.source === 'string' && Object.hasOwn(sources, provenance.source) ? sources[provenance.source] : undefined;
  if (!isObject(source)) { check.report(where, `provenance.source ${provenance.source} is an unknown source`); return; }
  if (provenance.licence !== undefined && provenance.licence !== source.licence) check.report(where, `provenance.licence ${provenance.licence} does not match source ${provenance.source} (${source.licence})`);
  if (provenance.sourceVersion !== undefined && !(Array.isArray(source.versions) && source.versions.includes(provenance.sourceVersion))) check.report(where, `provenance.sourceVersion ${provenance.sourceVersion} is not a version of source ${provenance.source}`);
  if (provenance.method !== undefined && !(Array.isArray(source.methods) && source.methods.includes(provenance.method))) check.report(where, `provenance.method ${provenance.method} is not a method of source ${provenance.source}`);
}

function checkTaxonomy(check, content) {
  const regions = new Map();
  const muscles = new Map();
  const equipment = new Map();
  const names = () => {
    const seen = new Set();
    return (where, name) => {
      if (typeof name !== 'string') return;
      if (seen.has(normalise(name))) check.report(where, `duplicate name ${name}`);
      seen.add(normalise(name));
    };
  };
  const m = content.muscles;
  if (check.keys('exercises/muscles.json', m, ['schema', 'regions', 'muscles']) && m.schema !== SCHEMAS.muscles) check.report('exercises/muscles.json', `schema must be ${SCHEMAS.muscles}`);
  const regionName = names();
  for (const region of Array.isArray(m?.regions) ? m.regions : []) {
    const where = `exercises/muscles.json region ${region?.id}`;
    if (!check.keys(where, region, ['id', 'name', 'hi'])) continue;
    if (!TAXONOMY_ID.test(String(region.id)) || regions.has(region.id)) check.report(where, 'id must be a unique lower_snake_case id');
    check.text(where, 'name', region.name);
    regionName(where, region.name);
    checkHindi(check, where, region.hi, ['name']);
    regions.set(region.id, region);
  }
  const muscleName = names();
  for (const muscle of Array.isArray(m?.muscles) ? m.muscles : []) {
    const where = `exercises/muscles.json ${muscle?.id}`;
    if (!check.keys(where, muscle, ['id', 'name', 'anatomy', 'region', 'hi'])) continue;
    if (!TAXONOMY_ID.test(String(muscle.id)) || muscles.has(muscle.id)) check.report(where, 'id must be a unique lower_snake_case id');
    check.text(where, 'name', muscle.name);
    check.text(where, 'anatomy', muscle.anatomy, { max: 200 });
    muscleName(where, muscle.name);
    if (muscle.region !== undefined && !regions.has(muscle.region)) check.report(where, `region ${muscle.region} is unknown`);
    checkHindi(check, where, muscle.hi, ['name']);
    muscles.set(muscle.id, muscle);
  }
  if (muscles.size === 0) check.report('exercises/muscles.json', 'muscles must list at least one muscle');
  const e = content.equipment;
  if (check.keys('exercises/equipment.json', e, ['schema', 'equipment']) && e.schema !== SCHEMAS.equipment) check.report('exercises/equipment.json', `schema must be ${SCHEMAS.equipment}`);
  const equipmentName = names();
  for (const item of Array.isArray(e?.equipment) ? e.equipment : []) {
    const where = `exercises/equipment.json ${item?.id}`;
    if (!check.keys(where, item, ['id', 'name', 'category', 'hi'])) continue;
    if (!TAXONOMY_ID.test(String(item.id)) || equipment.has(item.id)) check.report(where, 'id must be a unique lower_snake_case id');
    check.text(where, 'name', item.name);
    equipmentName(where, item.name);
    if (item.category !== undefined && !CATEGORIES.includes(item.category)) check.report(where, `category ${item.category} is not one of ${CATEGORIES.join(', ')}`);
    checkHindi(check, where, item.hi, ['name']);
    equipment.set(item.id, item);
  }
  return { regions, muscles, equipment };
}

const EXERCISE_REQUIRED = ['slug', 'version', 'name', 'aliases', 'category', 'equipment', 'movement', 'loggingType', 'loadBasis', 'primary', 'secondary', 'instructions', 'hi', 'provenance'];
const EXERCISE_OPTIONAL = ['singleArm', 'repsPerSide'];

function checkMuscles(check, where, record, muscles) {
  const listed = new Set();
  for (const role of ['primary', 'secondary']) {
    const ids = record[role];
    if (ids === undefined) continue;
    if (!Array.isArray(ids)) { check.report(where, `${role} must be a list of muscle ids`); continue; }
    if (role === 'primary' && ids.length === 0) check.report(where, 'primary needs at least one muscle');
    const own = new Set();
    for (const id of ids) {
      if (!muscles.has(id)) check.report(where, `unknown muscle ${id}`);
      else if (own.has(id)) check.report(where, `duplicate muscle ${id}`);
      else if (listed.has(id)) check.report(where, `muscle ${id} is both primary and secondary`);
      own.add(id);
    }
    for (const id of own) listed.add(id);
  }
}

function checkExercise(check, where, record, category, taxonomy, sources) {
  if (!check.keys(where, record, EXERCISE_REQUIRED, EXERCISE_OPTIONAL)) return;
  if (record.slug !== undefined && (typeof record.slug !== 'string' || !SLUG.test(record.slug) || record.slug.length > 80)) check.report(where, 'slug must be lower-case words joined by hyphens, at most 80 characters');
  if (record.version !== undefined && !isInt(record.version, 1, Number.MAX_SAFE_INTEGER)) check.report(where, 'version must be a positive integer');
  check.text(where, 'name', record.name);
  if (record.aliases !== undefined) {
    if (!Array.isArray(record.aliases)) check.report(where, 'aliases must be a list');
    else record.aliases.forEach((alias, index) => check.text(where, `aliases[${index}]`, alias));
  }
  if (record.category !== undefined && record.category !== category) check.report(where, `category ${record.category} does not match the file's category ${category}`);
  const equipment = taxonomy.equipment.get(record.equipment);
  if (record.equipment !== undefined && !equipment) check.report(where, `unknown equipment ${record.equipment}`);
  else if (equipment && equipment.category !== category) check.report(where, `equipment ${record.equipment} belongs to ${equipment.category}, not ${category}`);
  if (record.movement !== undefined && !MOVEMENTS.includes(record.movement)) check.report(where, `movement ${record.movement} is not one of ${MOVEMENTS.join(', ')}`);
  const typeOk = record.loggingType === undefined || LOGGING_TYPES.includes(record.loggingType);
  if (!typeOk) check.report(where, `loggingType ${record.loggingType} is not one of ${LOGGING_TYPES.join(', ')}`);
  if (record.loadBasis !== undefined && !LOAD_BASES.includes(record.loadBasis)) check.report(where, `loadBasis ${record.loadBasis} is not one of ${LOAD_BASES.join(', ')}`);
  else if (typeOk && record.loggingType !== undefined && record.loadBasis !== undefined && !ALLOWED_LOAD[record.loggingType].includes(record.loadBasis)) {
    check.report(where, `loggingType ${record.loggingType} does not allow loadBasis ${record.loadBasis}`);
  }
  for (const flag of EXERCISE_OPTIONAL) if (record[flag] !== undefined && typeof record[flag] !== 'boolean') check.report(where, `${flag} must be true or false`);
  if (record.singleArm === true) {
    if (record.loadBasis !== 'per_hand') check.report(where, 'singleArm needs loadBasis per_hand');
    if (record.repsPerSide !== true) check.report(where, 'singleArm needs repsPerSide');
  }
  checkMuscles(check, where, record, taxonomy.muscles);
  if (check.text(where, 'instructions', record.instructions, { min: 40, max: 600, claims: true })) {
    const count = sentences(record.instructions).length;
    if (count < 2 || count > 4) check.report(where, `instructions must have 2–4 sentences; found ${count}`);
    if (!/[.!?]$/.test(record.instructions)) check.report(where, 'instructions must end with a full stop, question mark or exclamation mark');
  }
  checkHindi(check, where, record.hi, ['name', 'instructions']);
  if (record.provenance !== undefined) checkProvenance(check, where, record.provenance, sources);
}

/** Names and aliases are one search space (PRD 6.1 name/alias matching), so none may repeat. */
function checkDistinct(check, located) {
  const slugs = new Map();
  const terms = new Map();
  for (const { where, record } of located) {
    if (typeof record.slug === 'string') {
      if (slugs.has(record.slug)) check.report(where, `duplicate slug ${record.slug}`);
      slugs.set(record.slug, where);
    }
    if (typeof record.name === 'string') {
      const owner = terms.get(normalise(record.name));
      if (owner?.kind === 'name') check.report(where, `duplicate name ${record.name} (also ${owner.slug})`);
      else if (owner) check.report(where, `name ${record.name} collides with an alias of ${owner.slug}`);
      else terms.set(normalise(record.name), { kind: 'name', slug: record.slug });
    }
    for (const alias of Array.isArray(record.aliases) ? record.aliases : []) {
      if (typeof alias !== 'string') continue;
      const owner = terms.get(normalise(alias));
      if (owner) check.report(where, `alias ${alias} collides with ${owner.slug}`);
      else terms.set(normalise(alias), { kind: 'alias', slug: record.slug });
    }
  }
}

const PROGRAMME_REQUIRED = ['slug', 'version', 'name', 'description', 'level', 'days', 'hi', 'provenance', 'review'];
const DAY_REQUIRED = ['slug', 'name', 'notes', 'weekdays', 'items', 'hi'];
const ITEM_REQUIRED = ['exercise', 'sets', 'repsMin', 'repsMax', 'restSeconds'];
const ITEM_OPTIONAL = ['durationSeconds', 'distanceMetres'];

function checkItem(check, where, item, exercises) {
  if (!check.keys(where, item, ITEM_REQUIRED, ITEM_OPTIONAL)) return;
  const exercise = exercises.get(item.exercise);
  if (item.exercise !== undefined && !exercise) check.report(where, `unknown exercise ${item.exercise}`);
  if (item.sets !== undefined && !isInt(item.sets, 1, 50)) check.report(where, 'sets must be an integer from 1 to 50');
  for (const field of ['repsMin', 'repsMax']) if (item[field] !== undefined && !isInt(item[field], 1, 1000)) check.report(where, `${field} must be an integer from 1 to 1000`);
  if (isInt(item.repsMin, 1, 1000) && isInt(item.repsMax, 1, 1000) && item.repsMin > item.repsMax) check.report(where, `repsMin ${item.repsMin} exceeds repsMax ${item.repsMax}`);
  if (item.restSeconds !== undefined && !isInt(item.restSeconds, 0, 3600)) check.report(where, 'restSeconds must be an integer from 0 to 3600');
  if (item.durationSeconds !== undefined && !isInt(item.durationSeconds, 1, 86400)) check.report(where, 'durationSeconds must be an integer from 1 to 86400');
  if (item.distanceMetres !== undefined && !(typeof item.distanceMetres === 'number' && item.distanceMetres > 0 && item.distanceMetres <= 1_000_000)) check.report(where, 'distanceMetres must be a number above 0 and at most 1000000');
  if (!exercise) return;
  const type = exercise.loggingType;
  if (type === 'timed' && item.durationSeconds === undefined) check.report(where, `timed exercise ${item.exercise} needs durationSeconds`);
  if (type === 'distance' && item.durationSeconds === undefined && item.distanceMetres === undefined) check.report(where, `distance exercise ${item.exercise} needs durationSeconds or distanceMetres`);
  if ((type === 'timed' || type === 'distance') && (item.repsMin !== 1 || item.repsMax !== 1)) check.report(where, `${type} exercise ${item.exercise} takes repsMin and repsMax of 1`);
  if ((type === 'resistance' || type === 'bodyweight') && (item.durationSeconds !== undefined || item.distanceMetres !== undefined)) check.report(where, `${type} exercise ${item.exercise} takes no durationSeconds or distanceMetres`);
  if (type === 'timed' && item.distanceMetres !== undefined) check.report(where, `timed exercise ${item.exercise} takes no distanceMetres`);
}

function checkProgrammes(check, file, data, exercises, sources) {
  const where = file;
  if (!check.keys(where, data, ['schema', 'programmes'])) return [];
  if (data.schema !== SCHEMAS.programmes) check.report(where, `schema must be ${SCHEMAS.programmes}`);
  const list = Array.isArray(data.programmes) ? data.programmes : [];
  if (list.length < STARTER_PROGRAMMES) check.report('programmes', `at least ${STARTER_PROGRAMMES} starter programmes are required; found ${list.length}`);
  const slugs = new Set();
  const names = new Set();
  for (const programme of list) {
    const at = `${file} ${programme?.slug}`;
    if (!check.keys(at, programme, PROGRAMME_REQUIRED)) continue;
    if (typeof programme.slug !== 'string' || !SLUG.test(programme.slug) || slugs.has(programme.slug)) check.report(at, 'slug must be a unique lower-case hyphenated slug');
    slugs.add(programme.slug);
    if (programme.version !== undefined && !isInt(programme.version, 1, Number.MAX_SAFE_INTEGER)) check.report(at, 'version must be a positive integer');
    if (check.text(at, 'name', programme.name)) {
      if (names.has(normalise(programme.name))) check.report(at, `duplicate name ${programme.name}`);
      names.add(normalise(programme.name));
    }
    check.text(at, 'description', programme.description, { max: 600, claims: true });
    if (programme.level !== undefined && !LEVELS.includes(programme.level)) check.report(at, `level must be one of ${LEVELS.join(', ')}`);
    checkHindi(check, at, programme.hi, ['name', 'description']);
    if (programme.provenance !== undefined) checkProvenance(check, at, programme.provenance, sources);
    if (programme.review !== undefined) checkReview(check, at, programme.review);
    const days = Array.isArray(programme.days) ? programme.days : [];
    if (programme.days !== undefined && days.length === 0) check.report(at, 'days must list at least one day');
    const daySlugs = new Set();
    const dayNames = new Set();
    const weekdayOwner = new Map();
    for (const day of days) {
      const dayAt = `${at} ${day?.slug}`;
      if (!check.keys(dayAt, day, DAY_REQUIRED)) continue;
      if (typeof day.slug !== 'string' || !SLUG.test(day.slug) || daySlugs.has(day.slug)) check.report(dayAt, 'slug must be a unique lower-case hyphenated slug');
      daySlugs.add(day.slug);
      if (check.text(dayAt, 'name', day.name)) {
        if (dayNames.has(normalise(day.name))) check.report(dayAt, `duplicate day name ${day.name}`);
        dayNames.add(normalise(day.name));
      }
      check.text(dayAt, 'notes', day.notes, { min: 0, max: 600, claims: true });
      checkHindi(check, dayAt, day.hi, ['name', 'notes']);
      if (day.weekdays !== undefined) {
        if (!Array.isArray(day.weekdays) || day.weekdays.length === 0 || day.weekdays.some((w) => !isInt(w, 0, 6)) || new Set(day.weekdays).size !== day.weekdays.length) {
          check.report(dayAt, 'weekdays must list distinct integers from 0 (Sunday) to 6 (Saturday)');
        } else {
          for (const weekday of day.weekdays) {
            if (weekdayOwner.has(weekday)) check.report(at, `weekday ${weekday} is used by more than one day`);
            weekdayOwner.set(weekday, day.slug);
          }
        }
      }
      const items = Array.isArray(day.items) ? day.items : [];
      if (day.items !== undefined && (items.length === 0 || items.length > 20)) check.report(dayAt, 'items must list 1–20 prescriptions');
      items.forEach((item, index) => checkItem(check, `${dayAt} item ${index + 1}`, item, exercises));
    }
  }
  return list;
}

/** Validates read content. Returns { problems, catalogue }, where catalogue is null unless problems is empty. */
export function validateContent(content) {
  const check = reporter();
  const { manifest } = content;
  if (check.keys('catalogue.json', manifest, ['schema', 'contentVersion', 'files', 'sources', 'review'])) {
    if (manifest.schema !== SCHEMAS.manifest) check.report('catalogue.json', `schema must be ${SCHEMAS.manifest}`);
    if (manifest.contentVersion !== undefined && !(typeof manifest.contentVersion === 'string' && /^\d{4}-\d{2}-\d{2}\.\d+$/.test(manifest.contentVersion))) check.report('catalogue.json', 'contentVersion must look like YYYY-MM-DD.N');
    if (manifest.review !== undefined) checkReview(check, 'catalogue.json', manifest.review);
  }
  for (const path of content.strayFiles ?? []) check.problems.push(`content/${path} is not listed in catalogue.json`);
  const sources = checkSources(check, manifest?.sources);
  const taxonomy = checkTaxonomy(check, content);

  const located = [];
  const fileCategories = new Set();
  for (const { path, data } of content.exerciseFiles) {
    if (!check.keys(path, data, ['schema', 'category', 'exercises'])) continue;
    if (data.schema !== SCHEMAS.exercises) check.report(path, `schema must be ${SCHEMAS.exercises}`);
    if (!CATEGORIES.includes(data.category) || fileCategories.has(data.category)) check.report(path, `category must be one of ${CATEGORIES.join(', ')} and used by one file only`);
    fileCategories.add(data.category);
    for (const record of Array.isArray(data.exercises) ? data.exercises : []) {
      const where = `${path} ${record?.slug}`;
      checkExercise(check, where, record, data.category, taxonomy, sources);
      if (isObject(record)) located.push({ where, record, category: data.category });
    }
  }
  checkDistinct(check, located);
  if (located.length < MIN_EXERCISES) check.report('exercises', `at least ${MIN_EXERCISES} exercises are required; found ${located.length}`);
  for (const category of CATEGORIES) {
    const count = located.filter((entry) => entry.category === category).length;
    if (count < MIN_PER_CATEGORY) check.report('exercises', `category ${category} needs at least ${MIN_PER_CATEGORY} exercises; found ${count}`);
  }

  const bySlug = new Map(located.filter(({ record }) => typeof record.slug === 'string').map(({ record }) => [record.slug, record]));
  const programmes = checkProgrammes(check, 'programmes/starter-programmes.json', content.programmes, bySlug, sources);
  if (check.problems.length > 0) return { problems: check.problems, catalogue: null };

  const exercises = located.map(({ record }) => {
    const singleArm = record.singleArm === true;
    const repsPerSide = record.repsPerSide === true;
    const equipment = taxonomy.equipment.get(record.equipment);
    return {
      slug: record.slug, id: exerciseId(record.slug), version: record.version, name: record.name, aliases: [...record.aliases],
      category: record.category, equipment: record.equipment, equipmentName: equipment.name, movement: record.movement,
      loggingType: record.loggingType, loadBasis: record.loadBasis, multiplier: volumeMultiplier({ loadBasis: record.loadBasis, repsPerSide }),
      singleArm, repsPerSide,
      primary: [...record.primary], secondary: [...record.secondary],
      muscles: [...record.primary.map((id) => ({ id, role: 'primary', weight: MUSCLE_WEIGHTS.primary })), ...record.secondary.map((id) => ({ id, role: 'secondary', weight: MUSCLE_WEIGHTS.secondary }))],
      instructions: record.instructions, hi: record.hi, provenance: { ...record.provenance },
    };
  });
  const ids = new Set(exercises.map((item) => item.id));
  if (ids.size !== exercises.length) return { problems: ['exercises: two slugs derive the same id'], catalogue: null };
  return {
    problems: [],
    catalogue: {
      contentVersion: manifest.contentVersion,
      sources: structuredClone(sources),
      review: structuredClone(manifest.review),
      regions: content.muscles.regions.map((region) => ({ ...region })),
      muscles: content.muscles.muscles.map((muscle) => ({ ...muscle })),
      equipment: content.equipment.equipment.map((item) => ({ ...item })),
      exercises,
      programmes: structuredClone(programmes),
    },
  };
}

export class ContentError extends Error {
  constructor(problems) {
    super(`CT-1 content check failed:\n- ${problems.join('\n- ')}`);
    this.name = 'ContentError';
    this.problems = problems;
  }
}

/** The validated catalogue, or a ContentError listing every problem. */
export function loadCatalogue(root = CONTENT_ROOT) {
  const { problems, catalogue } = validateContent(readContent(root));
  if (problems.length > 0) throw new ContentError(problems);
  return catalogue;
}

const hasHindi = (value) => isObject(value);

/** One line: counts per category, taxonomy sizes, programmes, Hindi coverage and the open qualified-review gate. */
export function summarise(catalogue) {
  const perCategory = CATEGORIES.map((category) => `${category} ${catalogue.exercises.filter((item) => item.category === category).length}`).join(', ');
  const days = catalogue.programmes.reduce((sum, programme) => sum + programme.days.length, 0);
  const items = catalogue.programmes.reduce((sum, programme) => sum + programme.days.reduce((inner, day) => inner + day.items.length, 0), 0);
  const records = [
    ...catalogue.regions, ...catalogue.muscles, ...catalogue.equipment, ...catalogue.exercises,
    ...catalogue.programmes, ...catalogue.programmes.flatMap((programme) => programme.days),
  ];
  const complete = records.filter((item) => hasHindi(item.hi)).length;
  return `CT-1 content ${catalogue.contentVersion} valid: ${catalogue.exercises.length} exercises (${perCategory}), `
    + `${catalogue.muscles.length} muscles in ${catalogue.regions.length} regions, ${catalogue.equipment.length} equipment types, `
    + `${catalogue.programmes.length} starter programmes (${days} days, ${items} prescriptions); `
    + `Hindi: ${complete} records complete, ${records.length - complete} listed for ${HINDI_BACKLOG}; `
    + `qualified review pending at ${QUALIFIED_REVIEW_GATE}`;
}
