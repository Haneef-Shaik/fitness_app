import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { loadCatalogue } from './catalogue.mjs';
import { buildExerciseSeedSql, seedRows, seedSqlFromRows, sqlLiteral } from './seed.mjs';

// Static checks of the generated seed. They prove its shape and its guards are present; whether PostgreSQL runs it
// twice over member data without touching that data is proved by scripts/content/verify-seed.mjs in the serialized
// database phase, not here. Nothing in this file reaches a database.
const catalogue = loadCatalogue();
const CONTRACT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const PAYLOAD_START = "'[";
const PAYLOAD_END = "]'::jsonb";

/** The SQL with its one JSON payload literal removed, so keyword scans see statement text only. */
function statementText(sql) {
  const start = sql.indexOf(PAYLOAD_START);
  const end = sql.indexOf(PAYLOAD_END);
  assert.ok(start > 0 && end > start, 'the seed holds one payload literal');
  return sql.slice(0, start) + sql.slice(end + PAYLOAD_END.length);
}
function payloadOf(sql) {
  const start = sql.indexOf(PAYLOAD_START);
  const end = sql.indexOf(PAYLOAD_END);
  return JSON.parse(sql.slice(start + 1, end + 1).replaceAll("''", "'"));
}

test('the seed is deterministic: two builds give the same bytes and the header states the payload hash', () => {
  const first = buildExerciseSeedSql(catalogue);
  const second = buildExerciseSeedSql(loadCatalogue());
  assert.equal(second.sql, first.sql);
  const payload = JSON.stringify(first.rows);
  assert.equal(first.payloadSha256, createHash('sha256').update(payload, 'utf8').digest('hex'));
  assert.match(first.sql, new RegExp(`^-- FitLog launch exercise catalogue \\(CT-1\\), content ${catalogue.contentVersion}: ${first.rows.length} catalogue rows, payload sha256 ${first.payloadSha256}\\.\n`));
  assert.equal(statementText(first.sql).match(/^do \$ct1_seed\$$/gm)?.length, 1, 'one dollar-quoted block');
});

test('one row per catalogue exercise, in the catalogue key space, with provenance carried in source', () => {
  const rows = seedRows(catalogue);
  assert.equal(rows.length, catalogue.exercises.length);
  assert.equal(new Set(rows.map((row) => `${row.id}/${row.version}`)).size, rows.length, 'distinct (id, version) keys');
  const muscleName = new Map(catalogue.muscles.map((muscle) => [muscle.id, muscle.name]));
  rows.forEach((row, index) => {
    const exercise = catalogue.exercises[index];
    assert.match(row.id, CONTRACT_UUID);
    assert.ok(!row.id.startsWith('20000000-0000-4000-8000-'), 'never the development fixture key space');
    assert.equal(row.id, exercise.id);
    assert.equal(row.multiplier, exercise.multiplier);
    assert.equal(row.equipment, exercise.equipmentName);
    assert.deepEqual(row.primaryMuscles, exercise.primary.map((id) => muscleName.get(id)));
    assert.deepEqual(row.secondaryMuscles, exercise.secondary.map((id) => muscleName.get(id)));
    const { source, sourceVersion, licence } = exercise.provenance;
    assert.equal(row.source, `${source}@${sourceVersion}; licence ${licence}; slug ${exercise.slug}`);
    assert.deepEqual(Object.keys(row), ['id', 'version', 'name', 'loggingType', 'loadBasis', 'multiplier', 'equipment', 'primaryMuscles', 'secondaryMuscles', 'instructions', 'aliases', 'source']);
  });
});

test('the payload inside the SQL round-trips to exactly the rows', () => {
  const { sql, rows } = buildExerciseSeedSql(catalogue);
  assert.deepEqual(payloadOf(sql), rows);
});

test('by construction the seed only inserts catalogue rows: no update, delete, upsert or schema change', () => {
  const statements = statementText(buildExerciseSeedSql(catalogue).sql);
  assert.doesNotMatch(statements, /\b(?:update|delete|truncate|drop|alter|grant|revoke|create|commit|rollback)\b/i);
  assert.doesNotMatch(statements, /\bon\s+conflict\b/i, 'no silent skip or overwrite on conflict');
  assert.equal(statements.match(/\binsert into public\.exercises\b/g)?.length, 1);
  assert.match(statements, /values \(\(rec->>'id'\)::uuid, \(rec->>'version'\)::integer, null, /, 'owner_id is always null');
  assert.match(statements, /, false, rec->>'source'\);/, 'archived is false on insert');
});

test('an existing key stops the seed when a member owns it or when its content drifted, and is otherwise left alone', () => {
  const statements = statementText(buildExerciseSeedSql(catalogue).sql);
  assert.match(statements, /if existing\.owner_id is not null then\n\s+raise exception 'CT-1 seed: catalogue key % version % is held by a member-owned row'/);
  for (const column of ['name', 'logging_type', 'load_basis', 'multiplier', 'equipment', 'primary_muscles', 'secondary_muscles', 'instructions', 'aliases', 'source']) {
    assert.match(statements, new RegExp(`existing\\.${column} is distinct from `), `drift check covers ${column}`);
  }
  assert.match(statements, /raise exception 'CT-1 seed: catalogue row % version % differs from this seed; publish a new version instead of editing it'/);
  assert.match(statements, /\n\s+continue;\n\s+end if;\n\s+insert into public\.exercises/, 'an identical existing row is skipped, never rewritten');
  assert.match(statements, /with ordinality as t\(x, n\) order by t\.n/, 'array order is preserved when comparing and inserting');
});

test('a member-owned row on any version of a catalogue id stops the seed before the (id, version) lookup and the insert (review M1)', () => {
  const statements = statementText(buildExerciseSeedSql(catalogue).sql);
  const precheck = statements.match(/\n\s+select m\.version into member_version from public\.exercises m where m\.id = \(rec->>'id'\)::uuid and m\.owner_id is not null order by m\.version limit 1;\n\s+if found then\n\s+raise exception 'CT-1 seed: catalogue key % version % is held by a member-owned row', rec->>'id', member_version using errcode = '23505';\n\s+end if;\n/);
  assert.ok(precheck, 'one id-wide member check, raising the member-owned error with the version the member holds');
  assert.equal(statements.match(/\bm\.owner_id is not null\b/g)?.length, 1, 'exactly one id-wide member check');
  assert.doesNotMatch(precheck[0], /rec->>'version'|\bversion\s*=/, 'the member check is not limited to the seed row version');
  const loop = statements.indexOf('for rec in select value from jsonb_array_elements(seed) loop');
  const lookup = statements.indexOf("select e.* into existing from public.exercises e where e.id = (rec->>'id')::uuid and e.version = (rec->>'version')::integer;");
  const insert = statements.indexOf('insert into public.exercises');
  assert.ok(loop >= 0 && lookup >= 0 && insert >= 0);
  assert.ok(loop < precheck.index && precheck.index < lookup && lookup < insert, 'per record: member check, then the (id, version) lookup, then the insert');
  assert.match(statements, /if existing\.owner_id is not null then/, 'the same-version member check stays as a backstop');
});

// Review M2: the multiplier the seed writes is the catalogue's repsPerSide-derived one. repsPerSide itself is not a
// public.exercises column yet, so the row cannot say "per side" on its own; persisting it is MB-2's.
const M2_MULTIPLIERS = Object.freeze({
  'dumbbell-walking-lunge': 1, 'dumbbell-reverse-lunge': 1, 'dumbbell-bulgarian-split-squat': 1, 'dumbbell-step-up': 1, 'dumbbell-split-squat': 1,
  'dumbbell-one-arm-row': 1, 'dumbbell-bench-press': 2,
});

test('seed rows and the SQL payload carry the PRD 6.1 multiplier: two-dumbbell one-leg x1, one-arm x1, bilateral per-hand x2 (review M2)', () => {
  const { sql, rows } = buildExerciseSeedSql(catalogue);
  const payload = payloadOf(sql);
  for (const [slug, multiplier] of Object.entries(M2_MULTIPLIERS)) {
    const index = catalogue.exercises.findIndex((exercise) => exercise.slug === slug);
    assert.ok(index >= 0, `${slug} is in the catalogue`);
    for (const [label, row] of [['row', rows[index]], ['payload', payload[index]]]) {
      assert.equal(row.id, catalogue.exercises[index].id, `${slug} ${label} id`);
      assert.equal(row.loadBasis, 'per_hand', `${slug} ${label} load basis`);
      assert.equal(row.multiplier, multiplier, `${slug} ${label} multiplier`);
    }
  }
  assert.match(statementText(sql), /rec->>'loadBasis', \(rec->>'multiplier'\)::integer, rec->>'equipment'/, 'the insert writes the payload load basis and multiplier');
});

test('literals double apostrophes and refuse NUL; text that could escape the literal or the dollar quote is refused', () => {
  assert.equal(sqlLiteral("farmer's carry"), "'farmer''s carry'");
  assert.throws(() => sqlLiteral('a\u0000b'), /NUL/);
  const [row] = seedRows(catalogue);
  assert.throws(() => seedSqlFromRows([{ ...row, instructions: 'End the block. $ct1_seed$ select 1.' }]), /dollar sign/);
  assert.throws(() => seedSqlFromRows([{ ...row, instructions: 'A back\\slash here. Then more.' }]), /backslash/);
  assert.throws(() => seedSqlFromRows([{ ...row, name: 'Say "squat"' }]), /backslash/, 'JSON escapes a double quote with a backslash');
  assert.throws(() => seedSqlFromRows([]), /at least one row/);
});
