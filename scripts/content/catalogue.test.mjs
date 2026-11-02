import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CATEGORIES, HINDI_BACKLOG, MIN_EXERCISES, MIN_PER_CATEGORY, ORIGINAL_LICENCE, QUALIFIED_REVIEW_GATE, STARTER_PROGRAMMES,
  loadCatalogue, readContent, summarise, validateContent, volumeMultiplier,
} from './catalogue.mjs';

// Every case starts from a deep copy of the repository's real content and breaks one thing, so each guard is shown
// to fail on a planted defect while the untouched content passes. Nothing here writes a file.
const base = readContent();
const fresh = () => structuredClone(base);
const problemsOf = (content) => validateContent(content).problems;
function expectProblem(content, pattern) {
  const found = problemsOf(content);
  assert.ok(found.some((line) => pattern.test(line)), `expected a problem matching ${pattern}, got:\n${found.join('\n') || '(none)'}`);
}
function record(content, slug) {
  for (const file of content.exerciseFiles) {
    const found = file.data.exercises.find((item) => item.slug === slug);
    if (found) return found;
  }
  throw new Error(`no exercise ${slug} in the content`);
}
const programmes = (content) => content.programmes.programmes;
function itemFor(content, exercise) {
  for (const programme of programmes(content)) for (const day of programme.days) {
    const item = day.items.find((candidate) => candidate.exercise === exercise);
    if (item) return item;
  }
  throw new Error(`no starter programme uses ${exercise}`);
}

test('the launch content validates with no problems', () => {
  assert.deepEqual(problemsOf(fresh()), []);
});

test('box 1 count: at least 200 distinct exercises, every category covered, each with muscles, equipment, instructions and provenance', () => {
  const catalogue = loadCatalogue();
  const { exercises } = catalogue;
  assert.ok(exercises.length >= MIN_EXERCISES, `${exercises.length} exercises`);
  for (const field of ['slug', 'id']) assert.equal(new Set(exercises.map((item) => item[field])).size, exercises.length, `distinct ${field}`);
  assert.equal(new Set(exercises.map((item) => item.name.toLowerCase())).size, exercises.length, 'distinct names');
  for (const category of CATEGORIES) {
    const count = exercises.filter((item) => item.category === category).length;
    assert.ok(count >= MIN_PER_CATEGORY, `${category} has ${count}`);
  }
  const sources = catalogue.sources;
  for (const item of exercises) {
    assert.ok(item.primary.length >= 1 && item.equipmentName && item.instructions.length >= 40, item.slug);
    const { source, sourceVersion, licence, method } = item.provenance;
    assert.ok(sources[source], `${item.slug} source`);
    assert.equal(licence, sources[source].licence, `${item.slug} licence`);
    assert.ok(sources[source].versions.includes(sourceVersion) && sources[source].methods.includes(method), item.slug);
  }
});

test('the count guard fails at 199 exercises', () => {
  const content = fresh();
  let excess = content.exerciseFiles.reduce((sum, file) => sum + file.data.exercises.length, 0) - (MIN_EXERCISES - 1);
  for (const file of content.exerciseFiles) {
    while (excess > 0 && file.data.exercises.length > 1) { file.data.exercises.pop(); excess -= 1; }
  }
  assert.equal(excess, 0);
  expectProblem(content, /^exercises: at least 200 exercises are required; found 199$/);
});

test('a category below its minimum fails', () => {
  const content = fresh();
  const band = content.exerciseFiles.find((file) => file.data.category === 'band');
  band.data.exercises.splice(MIN_PER_CATEGORY - 1);
  expectProblem(content, new RegExp(`^exercises: category band needs at least ${MIN_PER_CATEGORY} exercises; found ${MIN_PER_CATEGORY - 1}$`));
});

test('a record without provenance, or with any provenance field missing, is rejected and named', () => {
  const missing = fresh();
  delete record(missing, 'barbell-back-squat').provenance;
  expectProblem(missing, /^exercises\/barbell\.json barbell-back-squat: provenance is missing$/);
  for (const field of ['source', 'sourceVersion', 'licence', 'method']) {
    const content = fresh();
    delete record(content, 'dumbbell-bench-press').provenance[field];
    expectProblem(content, new RegExp(`^exercises/dumbbell\\.json dumbbell-bench-press: provenance\\.${field} is missing$`));
  }
});

test('provenance must resolve to a registered source, its licence, a listed version and method', () => {
  const unknown = fresh();
  record(unknown, 'plank').provenance.source = 'somewhere-on-the-internet';
  expectProblem(unknown, /plank: provenance\.source somewhere-on-the-internet is an unknown source$/);
  const licence = fresh();
  record(licence, 'plank').provenance.licence = 'MIT';
  expectProblem(licence, new RegExp(`plank: provenance\\.licence MIT does not match source fitlog-original \\(${ORIGINAL_LICENCE}\\)$`));
  const version = fresh();
  record(version, 'plank').provenance.sourceVersion = '1999-01-01';
  expectProblem(version, /plank: provenance\.sourceVersion 1999-01-01 is not a version of source fitlog-original$/);
  const method = fresh();
  record(method, 'plank').provenance.method = 'adapted';
  expectProblem(method, /plank: provenance\.method adapted is not a method of source fitlog-original$/);
});

test('an external source needs an https URL, a permitted licence and a recorded verification', () => {
  const external = (overrides) => {
    const content = fresh();
    content.manifest.sources['example-db'] = {
      kind: 'external', title: 'Example dataset', url: 'https://example.invalid/dataset', licence: 'MIT', versions: ['1.0.0'],
      methods: ['adapted'], retrievedOn: '2026-10-27', verified: { by: 'Reviewer', on: '2026-10-27', evidence: 'docs/evidence/CT-1/example.md' },
      ...overrides,
    };
    return content;
  };
  assert.deepEqual(problemsOf(external({})), [], 'a complete external source is accepted');
  expectProblem(external({ licence: 'CC-BY-NC-4.0' }), /^catalogue\.json sources\.example-db: licence CC-BY-NC-4\.0 is not a permitted licence/);
  expectProblem(external({ licence: ORIGINAL_LICENCE }), /sources\.example-db: licence LicenseRef-FitLog-Original is not a permitted licence/);
  expectProblem(external({ url: 'http://example.invalid/dataset' }), /sources\.example-db: url must be an https URL$/);
  expectProblem(external({ verified: undefined }), /sources\.example-db: verified is missing$/);
  expectProblem(external({ verified: { by: 'Reviewer', on: '2026-10-27', evidence: 'notes.md' } }), /sources\.example-db: verified\.evidence must be a file under docs\/evidence\/CT-1\/$/);
  expectProblem(external({ methods: ['authored'] }), /sources\.example-db: methods of an external source must be imported or adapted$/);
});

test('names, slugs and aliases are distinct across the catalogue', () => {
  const name = fresh();
  record(name, 'barbell-front-squat').name = 'BARBELL BACK SQUAT';
  expectProblem(name, /barbell-front-squat: duplicate name BARBELL BACK SQUAT \(also barbell-back-squat\)$/);
  const slug = fresh();
  record(slug, 'barbell-front-squat').slug = 'barbell-back-squat';
  expectProblem(slug, /: duplicate slug barbell-back-squat$/);
  const alias = fresh();
  record(alias, 'barbell-front-squat').aliases = ['Barbell back squat'];
  expectProblem(alias, /barbell-front-squat: alias Barbell back squat collides with barbell-back-squat$/);
});

test('logging semantics follow PRD 6.1: per-hand bilateral x2, per-hand reps-per-side x1, assistance only for bodyweight', () => {
  const catalogue = loadCatalogue();
  const bySlug = new Map(catalogue.exercises.map((item) => [item.slug, item]));
  assert.equal(bySlug.get('dumbbell-bench-press').multiplier, 2);
  assert.equal(bySlug.get('dumbbell-one-arm-row').multiplier, 1);
  assert.equal(bySlug.get('dumbbell-one-arm-row').repsPerSide, true);
  assert.equal(bySlug.get('barbell-back-squat').multiplier, 1);
  assert.equal(bySlug.get('machine-assisted-pull-up').loadBasis, 'assistance');
  for (const item of catalogue.exercises) {
    assert.equal(item.multiplier, item.loadBasis === 'per_hand' && !item.repsPerSide ? 2 : 1, item.slug);
    if (item.singleArm) assert.equal(item.multiplier, 1, `${item.slug}: single-arm is always reps-per-side, so x1`);
    if (item.loadBasis === 'assistance') assert.equal(item.loggingType, 'bodyweight', item.slug);
  }
  const distance = fresh();
  record(distance, 'outdoor-run').loadBasis = 'per_hand';
  expectProblem(distance, /outdoor-run: loggingType distance does not allow loadBasis per_hand$/);
  const assistance = fresh();
  record(assistance, 'barbell-back-squat').loadBasis = 'assistance';
  expectProblem(assistance, /barbell-back-squat: loggingType resistance does not allow loadBasis assistance$/);
  const singleArm = fresh();
  record(singleArm, 'barbell-back-squat').singleArm = true;
  expectProblem(singleArm, /barbell-back-squat: singleArm needs loadBasis per_hand$/);
  const perSide = fresh();
  delete record(perSide, 'dumbbell-one-arm-row').repsPerSide;
  expectProblem(perSide, /dumbbell-one-arm-row: singleArm needs repsPerSide$/);
});

/** Two dumbbells, one leg at a time: per-hand load, reps per side, never single-arm (review M2). */
const TWO_DUMBBELL_PER_LEG = Object.freeze(['dumbbell-bulgarian-split-squat', 'dumbbell-reverse-lunge', 'dumbbell-split-squat', 'dumbbell-step-up', 'dumbbell-walking-lunge']);
function derived(content, slug) {
  const { problems, catalogue } = validateContent(content);
  assert.deepEqual(problems, [], 'the planted change is valid content');
  return catalogue.exercises.find((item) => item.slug === slug);
}

test('the multiplier derives from repsPerSide, not singleArm alone: two-dumbbell one-leg work x1, bilateral per-hand x2 (review M2)', () => {
  assert.equal(volumeMultiplier({ loadBasis: 'per_hand', repsPerSide: false }), 2, 'bilateral per-hand');
  assert.equal(volumeMultiplier({ loadBasis: 'per_hand', repsPerSide: true }), 1, 'per-hand reps-per-side');
  for (const loadBasis of ['total', 'assistance', 'none']) {
    for (const repsPerSide of [false, true]) assert.equal(volumeMultiplier({ loadBasis, repsPerSide }), 1, `${loadBasis}, repsPerSide ${repsPerSide}`);
  }

  const catalogue = loadCatalogue();
  const bySlug = new Map(catalogue.exercises.map((item) => [item.slug, item]));
  const perHandPerSide = catalogue.exercises.filter((item) => item.loadBasis === 'per_hand' && item.repsPerSide);
  assert.ok(perHandPerSide.length > TWO_DUMBBELL_PER_LEG.length, 'single-arm records are in the per-hand reps-per-side set too');
  for (const item of perHandPerSide) assert.equal(item.multiplier, 1, `${item.slug}: per-hand reps-per-side is x1`);
  for (const item of catalogue.exercises.filter((entry) => entry.loadBasis === 'per_hand' && !entry.repsPerSide)) assert.equal(item.multiplier, 2, `${item.slug}: bilateral per-hand is x2`);
  for (const item of catalogue.exercises.filter((entry) => entry.loadBasis !== 'per_hand')) assert.equal(item.multiplier, 1, `${item.slug}: ${item.loadBasis} is x1`);

  const twoHandOneLeg = perHandPerSide.filter((item) => !item.singleArm).map((item) => item.slug).sort();
  assert.deepEqual(twoHandOneLeg, TWO_DUMBBELL_PER_LEG, 'exactly the five two-dumbbell one-leg records are per-hand, reps-per-side and not single-arm');
  for (const slug of TWO_DUMBBELL_PER_LEG) {
    const item = bySlug.get(slug);
    assert.deepEqual([item.loadBasis, item.repsPerSide, item.singleArm, item.multiplier], ['per_hand', true, false, 1], slug);
    assert.equal(item.version, 1, `${slug}: never seeded, so the correction needs no version bump`);
    assert.match(item.instructions, /\b(?:repetitions|steps) per leg\b/, `${slug}: says repetitions or steps are logged per leg`);
    assert.match(item.instructions, /\bweight of one dumbbell as the load per hand\b/, `${slug}: says load is logged per hand`);
    assert.deepEqual(item.provenance, { source: 'fitlog-original', sourceVersion: '2026-10-27', licence: 'LicenseRef-FitLog-Original', method: 'authored' }, `${slug}: provenance kept`);
  }
  const row = bySlug.get('dumbbell-one-arm-row');
  assert.deepEqual([row.loadBasis, row.repsPerSide, row.singleArm, row.multiplier], ['per_hand', true, true, 1], 'existing one-arm row stays x1');
  const bench = bySlug.get('dumbbell-bench-press');
  assert.deepEqual([bench.loadBasis, bench.repsPerSide, bench.singleArm, bench.multiplier], ['per_hand', false, false, 2], 'bilateral bench stays x2');

  // Planted: the repsPerSide flag, not the singleArm label, sets the multiplier.
  const unflagged = fresh();
  delete record(unflagged, 'dumbbell-split-squat').repsPerSide;
  assert.equal(derived(unflagged, 'dumbbell-split-squat').multiplier, 2, 'without repsPerSide a two-dumbbell record is bilateral again');
  const flagged = fresh();
  record(flagged, 'dumbbell-bench-press').repsPerSide = true;
  assert.equal(derived(flagged, 'dumbbell-bench-press').multiplier, 1, 'repsPerSide alone gives x1 with no singleArm label');
  // singleArm validation is unchanged: it still needs per_hand and repsPerSide.
  const singleArmNoSide = fresh();
  record(singleArmNoSide, 'dumbbell-one-arm-row').repsPerSide = false;
  expectProblem(singleArmNoSide, /dumbbell-one-arm-row: singleArm needs repsPerSide$/);
  const singleArmTotal = fresh();
  record(singleArmTotal, 'dumbbell-goblet-squat').singleArm = true;
  expectProblem(singleArmTotal, /dumbbell-goblet-squat: singleArm needs loadBasis per_hand$/);
});

test('muscles and equipment resolve against the hierarchy and taxonomy', () => {
  const muscle = fresh();
  record(muscle, 'barbell-back-squat').primary.push('quadzilla');
  expectProblem(muscle, /barbell-back-squat: unknown muscle quadzilla$/);
  const overlap = fresh();
  const squat = record(overlap, 'barbell-back-squat');
  squat.secondary.push(squat.primary[0]);
  expectProblem(overlap, new RegExp(`barbell-back-squat: muscle ${squat.primary[0]} is both primary and secondary$`));
  const none = fresh();
  record(none, 'barbell-back-squat').primary = [];
  expectProblem(none, /barbell-back-squat: primary needs at least one muscle$/);
  const equipment = fresh();
  record(equipment, 'barbell-back-squat').equipment = 'dumbbell';
  expectProblem(equipment, /barbell-back-squat: equipment dumbbell belongs to dumbbell, not barbell$/);
  const region = fresh();
  region.muscles.muscles[0].region = 'tail';
  expectProblem(region, /: region tail is unknown$/);
});

test('instructions have 2-4 sentences, carry no health or safety claim, and hold no character that could break the seed', () => {
  const short = fresh();
  record(short, 'plank').instructions = 'Hold a straight line from head to heels for the set time.';
  expectProblem(short, /plank: instructions must have 2–4 sentences; found 1$/);
  const long = fresh();
  record(long, 'plank').instructions = 'One step here. Two steps here. Three steps here. Four steps here. Five steps here.';
  expectProblem(long, /plank: instructions must have 2–4 sentences; found 5$/);
  const unfinished = fresh();
  record(unfinished, 'plank').instructions = 'Hold a straight line from head to heels. Keep breathing steadily';
  expectProblem(unfinished, /plank: instructions must end with a full stop, question mark or exclamation mark$/);
  for (const claim of ['This position is safe for every back.', 'It helps prevent back injuries.', 'Great for fat loss and lower blood pressure.']) {
    const content = fresh();
    record(content, 'plank').instructions = `Hold a straight line from head to heels. ${claim}`;
    expectProblem(content, /plank: instructions contains a health or safety claim \(/);
  }
  for (const bad of ['Hold the line. Then use a \\ slash.', 'Hold the line. It costs $5 nothing.', 'Hold the line. Say "brace" quietly.']) {
    const content = fresh();
    record(content, 'plank').instructions = bad;
    expectProblem(content, /plank: instructions contains a quote, backslash, dollar sign or control character$/);
  }
});

test('unknown or misspelt fields are rejected rather than ignored', () => {
  const content = fresh();
  record(content, 'barbell-back-squat').secundary = ['glutes'];
  expectProblem(content, /barbell-back-squat: unknown field secundary$/);
  const programme = fresh();
  programmes(programme)[0].days[0].items[0].loadKg = 20;
  expectProblem(programme, /item 1: unknown field loadKg$/);
});

test('box 4: every record has Hindi text or is listed for G14.hi', () => {
  assert.equal(HINDI_BACKLOG, 'G14.hi');
  const missing = fresh();
  delete record(missing, 'plank').hi;
  expectProblem(missing, /plank: hi is missing$/);
  const wrongMarker = fresh();
  record(wrongMarker, 'plank').hi = 'G14';
  expectProblem(wrongMarker, /plank: hi must be "G14\.hi" or Hindi text$/);
  const latin = fresh();
  record(latin, 'plank').hi = { name: 'Plank', instructions: 'Hold it. Breathe.' };
  expectProblem(latin, /plank: hi\.name must contain Devanagari text$/);
  const translated = fresh();
  record(translated, 'plank').hi = { name: 'प्लैंक', instructions: 'सिर से एड़ी तक शरीर सीधा रखें। तय समय तक रुकें।' };
  assert.deepEqual(problemsOf(translated), [], 'a Hindi record is accepted');
  const muscle = fresh();
  delete muscle.muscles.muscles[0].hi;
  expectProblem(muscle, /: hi is missing$/);
  const day = fresh();
  delete programmes(day)[0].days[0].hi;
  expectProblem(day, /day-1: hi is missing$/);
});

test('content files must be listed in catalogue.json', () => {
  const content = fresh();
  content.strayFiles = ['exercises/extra.json'];
  expectProblem(content, /^content\/exercises\/extra\.json is not listed in catalogue\.json$/);
});

test('box 2: three starter programmes with prescriptions and a recorded technical review; qualified review stays pending', () => {
  const catalogue = loadCatalogue();
  assert.equal(catalogue.programmes.length, STARTER_PROGRAMMES);
  for (const programme of catalogue.programmes) {
    assert.ok(programme.days.length >= 1 && programme.days.every((day) => day.items.length >= 1), programme.slug);
    assert.ok(programme.review.technical.length >= 1 && programme.review.technical.every((entry) => entry.by && /^\d{4}-\d{2}-\d{2}$/.test(entry.on)), programme.slug);
    assert.deepEqual(programme.review.qualified, { status: 'pending', gate: QUALIFIED_REVIEW_GATE }, `${programme.slug}: no qualified review is claimed`);
  }
  const fewer = fresh();
  programmes(fewer).pop();
  expectProblem(fewer, /^programmes: at least 3 starter programmes are required; found 2$/);
  const unknown = fresh();
  programmes(unknown)[0].days[0].items[0].exercise = 'moon-squat';
  expectProblem(unknown, /item 1: unknown exercise moon-squat$/);
  const range = fresh();
  Object.assign(programmes(range)[0].days[0].items[0], { repsMin: 12, repsMax: 8 });
  expectProblem(range, /item 1: repsMin 12 exceeds repsMax 8$/);
  const sets = fresh();
  programmes(sets)[0].days[0].items[0].sets = 0;
  expectProblem(sets, /item 1: sets must be an integer from 1 to 50$/);
  const rest = fresh();
  programmes(rest)[0].days[0].items[0].restSeconds = 3601;
  expectProblem(rest, /item 1: restSeconds must be an integer from 0 to 3600$/);
  const timed = fresh();
  delete itemFor(timed, 'plank').durationSeconds;
  expectProblem(timed, /: timed exercise plank needs durationSeconds$/);
  const weekday = fresh();
  const [first, second] = programmes(weekday)[0].days;
  second.weekdays = [...first.weekdays];
  expectProblem(weekday, new RegExp(`: weekday ${first.weekdays[0]} is used by more than one day$`));
  const technical = fresh();
  programmes(technical)[0].review.technical = [];
  expectProblem(technical, /: review\.technical needs at least one entry with by, on and method$/);
  const approved = fresh();
  programmes(approved)[0].review.qualified = { status: 'approved' };
  expectProblem(approved, /: review\.qualified must be pending at OW-13, or approved with by, on and qualification$/);
});

test('the catalogue review block records a technical review and leaves the qualified review pending', () => {
  const { review } = loadCatalogue();
  assert.ok(review.technical.length >= 1);
  assert.deepEqual(review.qualified, { status: 'pending', gate: QUALIFIED_REVIEW_GATE });
  const content = fresh();
  delete content.manifest.review;
  expectProblem(content, /^catalogue\.json: review is missing$/);
});

test('the summary line states the counts and the open gates', () => {
  const line = summarise(loadCatalogue());
  assert.match(line, /^CT-1 content \S+ valid: \d{3} exercises \(barbell \d+, dumbbell \d+, machine \d+, cable \d+, bodyweight \d+, kettlebell \d+, band \d+, cardio \d+\), \d+ muscles in \d+ regions, \d+ equipment types, 3 starter programmes \(\d+ days, \d+ prescriptions\); Hindi: \d+ records complete, \d+ listed for G14\.hi; qualified review pending at OW-13$/);
});
