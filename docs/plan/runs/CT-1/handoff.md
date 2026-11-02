# Handoff — CT-1 · Exercise catalogue and three starter programmes        attempt 1 · codex/fitlog-ct1-content · c8a5d57 + uncommitted worktree changes

**Outcome claimed.** The code and content are complete for independent review: 238 original exercises
with provenance, a muscle hierarchy, an equipment taxonomy, three starter programmes, a validator, an
insert-only seed builder, a template builder, a G14.hi backlog and a serialized-phase database verifier.
**Nothing has been executed.** The shell was denied for the whole session, so every runtime gate below is
blocked, not passed. No box is claimed met on runtime evidence.

## Review M1 correction (1 Nov 2026, owner delegation AUTH-01)

This fixes only material M1 from `docs/evidence/CT-1/source-review-2026-11-01-collected.md`. **The code is
written, but its tests have not been run.** This session used only Read, Grep, Edit and Write. It used no
shell and ran no tests or installs. It made no database, Docker, Supabase or network calls, no commits and
no sub-agent calls. Nothing here is runtime evidence, and no box or goal is claimed Done.

- **Design (`seed.mjs`).** Each record's loop iteration now opens with one check that covers the whole id.
  It runs before the `(id, version)` lookup and before the insert:
  `select m.version into member_version from public.exercises m where m.id = <id> and m.owner_id is not null order by m.version limit 1`.
  If a member-owned row holds that id at any version, the block raises the existing member-owned error
  (`CT-1 seed: catalogue key % version % is held by a member-owned row`, errcode 23505), naming the lowest
  version the member holds. The `DO` block is one statement, so it writes nothing.
  - Unchanged: the same-version `existing.owner_id is not null` branch, which stays as a backstop.
  - Unchanged: the drift check, the skip of an identical row, the single `insert` with `owner_id` null, and
    the absence of `on conflict`.
  - Unchanged: the payload and its sha256. Only the statement text and one header comment line of the
    generated SQL differ.
- **Static regression (`seed.test.mjs`).** New test: "a member-owned row on any version of a catalogue id
  stops the seed before the (id, version) lookup and the insert (review M1)". It asserts that:
  - there is exactly one check covering the whole id;
  - that check does not filter on the seed row's version, and it reports the member's version;
  - the order is loop start, then the id check, then the `(id, version)` lookup, then the insert;
  - the same-version backstop is still present.
- **Verifier variant (`verify-seed.mjs`).** A fourth rolled-back run, `crossVersion`, runs in one
  `begin` … `rollback` transaction. It runs the setup SQL, plants a member-owned row at `(PROBE_ID, 2)`,
  then runs the probe seed carrying `(PROBE_ID, 1)`.
  - It passes only if psql fails and stderr contains exactly
    `CT-1 seed: catalogue key <PROBE_ID> version 2 is held by a member-owned row`.
  - The existing `twice`, same-version `conflict` and `drift` runs are unchanged, and so is how they are
    detected. That includes the broader `MEMBER_HELD`/`DRIFTED` patterns; L1 was not acted on.
  - The runs go in this order: twice → conflict → crossVersion → drift.
  - The result line gains "a member-owned row on another version of a catalogue id stopped the seed".
- **Fake-runner tests (`verify-seed.test.mjs`).** They cover:
  - four runs, each `begin` … `rollback`;
  - the cross-version run plants only version 2 and seeds the probe at version 1;
  - a cross-version run that exits 0 (what the seed did before this fix) is reported;
  - only the exact probe-id, version-2 error is accepted. Each of these is rejected: the probe at version 1,
    another key at version 2, the probe at version 20, and the drift error;
  - a failure for another reason is reported for all three guard runs;
  - the updated result line.
- **Not changed:** content, logging semantics, multipliers, schema, shared packages, contracts,
  `scripts/backend/local-stack.mjs`, target selection, and the three `seed-check-*.sql` files.
- **Gates still unrun:** frozen install, `node --test scripts/content/*.test.mjs` (including the new tests),
  `build-seed.mjs check`, every mutation check (including new check 8 below) and the database run of
  `verify-seed.mjs`, now four rolled-back transactions on a target the coordinator chooses.
- **Unresolved:**
  - Under READ COMMITTED, the check misses one case: a member insert at another version, committed between
    this check and the insert. The same version is still caught, by the backstop or by the primary key.
    Closing that gap needs the member-side half of QA-1 F-6 (MB-2) or a table lock. Both are out of scope
    here.
  - If a member has already claimed an id, the seed only stops. Recovery is an operator decision.
- **Still open:** M2 (the owner's decision on band logging and the unilateral multiplier), M3 (wiring into
  `test`/`backend:test`), every L finding, and every runtime and external gate in this handoff.

## Review M2(b) correction: unilateral multiplier (1 Nov 2026, owner delegation AUTH-01)

This fixes only the unilateral-multiplier half of material M2 (M2(b) below) from
`docs/evidence/CT-1/source-review-2026-11-01-collected.md`. It applies the PRD §6.1 decision recorded in
`docs/evidence/CT-1/source-review-disposition-2026-11-01.md`: bilateral per-hand multiplier 2, unilateral
reps-per-side multiplier 1. It is a separate bounded phase, not new goal work or polish. **The code is
written, but its tests have not been run.** This session used only Read, Grep, Edit and Write: no shell,
tests, installs, imports, database, Docker, Supabase or network calls, no commits, no status changes, no
sub-agents. Nothing here is runtime evidence, and no box or goal is claimed Done. The accepted M1 source is
untouched: `seed.mjs`, `verify-seed.mjs`, `verify-seed.test.mjs`, the SQL files, and every existing test in
`seed.test.mjs`.

- **Derivation (`catalogue.mjs`).** New exported pure function `volumeMultiplier({ loadBasis, repsPerSide })`:
  `per_hand` without `repsPerSide` gives 2; `per_hand` with `repsPerSide` gives 1; every other load basis
  gives 1. `validateContent` uses it instead of `loadBasis === 'per_hand' && !singleArm ? 2 : 1`. The
  `singleArm` validation (needs `per_hand` and `repsPerSide`) is unchanged, so every single-arm record
  still gets 1.
- **Effect, by Grep of the content.** 21 records are `per_hand` with `repsPerSide` (kettlebell 9,
  dumbbell 12). 16 are single-arm and were already 1. The other five change from 2 to 1:
  `dumbbell-walking-lunge`, `dumbbell-reverse-lunge`, `dumbbell-bulgarian-split-squat`,
  `dumbbell-step-up` and `dumbbell-split-squat`. No other record's multiplier changes. None of the five is
  labelled `singleArm`, because each uses two dumbbells.
- **Content (`content/exercises/dumbbell.json`, those five records only).** Each instruction now ends with
  an explicit cue: "Log the repetitions per leg and the weight of one dumbbell as the load per hand." The
  walking lunge says "steps per leg".
  - Walking and reverse lunge: the old per-leg sentence is replaced, so they stay at 3 sentences.
  - Bulgarian split squat, step-up and split squat: the cue is added, going from 3 to 4 sentences.
  - Unchanged: flags, names, aliases, muscles, `version` 1 and provenance.
  - **No version bump.** These records have never been seeded, so the drift guard has no stored row to
    compare. The seed payload and its sha256 change; no test pins either.
- **Docs.** The `content/README.md` formula line, and decision 5 below.
- **Authored regression source (unrun):**
  - `catalogue.test.mjs` › "logging semantics follow PRD 6.1…": the all-records formula now uses
    `repsPerSide` (the old `singleArm` form would turn red on the five) and asserts every single-arm record
    is 1.
  - `catalogue.test.mjs` › new "the multiplier derives from repsPerSide, not singleArm alone… (review M2)":
    - the pure formula for `per_hand`, `total`, `assistance` and `none`, each with and without
      `repsPerSide`;
    - every per-hand reps-per-side record is 1, every bilateral per-hand record is 2, every other load basis
      is 1;
    - the per-hand, reps-per-side, not-single-arm set is exactly the named five. Each is
      `per_hand`/`repsPerSide`/not single-arm/1 at version 1, states "repetitions (or steps) per leg" and
      "weight of one dumbbell as the load per hand", and keeps its provenance;
    - existing `dumbbell-one-arm-row`: `per_hand`, reps-per-side, single-arm, 1. Bilateral
      `dumbbell-bench-press`: `per_hand`, not reps-per-side, not single-arm, 2;
    - planted: removing `repsPerSide` from the split squat gives 2; adding it to the bench gives 1 with no
      single-arm label;
    - planted: single-arm with `repsPerSide` false, and single-arm on a `total` record, are still refused.
  - `seed.test.mjs` › new "seed rows and the SQL payload carry the PRD 6.1 multiplier… (review M2)": the
    rows and the parsed SQL payload give 1 for the five and the one-arm row and 2 for the bench, all
    `per_hand`, and the insert writes the payload's load basis and multiplier.
  - `templates.test.mjs` › new "starter templates snapshot the PRD 6.1 multiplier… (review M2)": the
    starter snapshots of the reverse lunge, Bulgarian split squat and one-arm row are `per_hand`/1, and the
    bench is `per_hand`/2. No starter programme prescribes the walking lunge, step-up or split squat.
- **Not changed:**
  - bands and every band record (M2(a));
  - load types, `LOGGING_TYPES`, `LOAD_BASES` and `ALLOWED_LOAD`;
  - schema, shared packages, contracts and the domain;
  - `seed.mjs`, `templates.mjs`, `build-seed.mjs`, `verify-seed.mjs` and the SQL files;
  - other content files, `catalogue.json` and its `contentVersion`.

  The schema (`multiplier in (1,2)`), the domain model and the snapshot trigger already accept `per_hand`
  with multiplier 1, which the single-arm rows use today.
- **Gates still unrun:** frozen install, `node --test scripts/content/*.test.mjs` (now including the three
  M2 tests), `build-seed.mjs check` (its expected line is unchanged, since counts do not move), mutation
  checks 1–9 and the database run of `verify-seed.mjs`.
- **Not closed by this correction:**
  - **M2(a) bands.** 16 band records are still `resistance`/`total`, so the domain can treat a nominal
    band level as kg in volume and e1RM. No band record, load type or contract was changed, and no nominal
    band level is claimed to be a valid kg load. Band metrics and the first seed stay blocked until MB-2
    defines a contract-compatible way to mark unmeasured band resistance and suppress those derived
    metrics. That is the disposition's Codex-owned technical requirement, not an owner question.
  - **MB-2 side semantics.** `repsPerSide` is still not persisted: there is no `public.exercises` column and
    no snapshot key in contract 0.1.0. There is also no logging-UI cue, so the app cannot yet "say so" as
    PRD §6.1 requires. The five text cues do not close that gate.
  - **First seed** stays blocked by M2(a), MB-2 and the unrun runtime gates.
  - Also open: M3 wiring (S1/CT-1), OW-13 qualified review, QA-5/DEC-16 legal evidence, the concurrent
    member-claim race (MB-2, from M1), L1–L9 (L2 not acted on beyond these five records) and all four Done
    boxes.

## Session limits that shape this handoff

- **Bash was denied** ("don't ask" mode), including `rtk`-prefixed commands. Nothing ran: no
  `status.mjs show`, no `pnpm install`, no `node --test`, no git. No commit exists (the coordinator also
  forbade commits). The changes sit uncommitted in this worktree on top of `main` c8a5d57.
- **No web tools** (WebFetch and WebSearch were not available). No licence or source page could be read,
  so no external content was adopted. See `docs/evidence/CT-1/provenance-and-review.md` §1.
- **No sub-agent reviews.** The coordinator's brief said "no nested subagents, independent review
  follows". The `code-reviewer`, `security-reviewer` and `tdd-guide` passes are left to that review. A
  manual self-review was done instead (below).
- Entry gate checked by reading `docs/plan/status.json`: AR-1 is `done` (73e3f63).

## Done when

| Box | Met | Evidence |
|---|---|---|
| At least 200 distinct exercises with muscles, equipment, English instructions and source, licence and version metadata; a test counts them and rejects a record without provenance | **Source-complete; runtime unproven** | 238 records in `content/exercises/*.json` (hand count: barbell 37, dumbbell 46, machine 32, cable 29, bodyweight 46, kettlebell 17, band 17, cardio 14). Each has `primary`/`secondary` muscles, `equipment`, `instructions` and `provenance {source, sourceVersion, licence, method}`. Tests: `scripts/content/catalogue.test.mjs` › "box 1 count…", "the count guard fails at 199 exercises", "a record without provenance, or with any provenance field missing, is rejected and named". **Not run:** `rtk node --test scripts/content/*.test.mjs` is blocked (Bash denied) |
| Three starter programmes with prescriptions exist, with the reviewer and date recorded in `docs/evidence/CT-1/` | **Partly: technical reviewer only** | `content/programmes/starter-programmes.json` (3 programmes, 10 days, 56 prescriptions by hand count). Reviewer and date: `docs/evidence/CT-1/starter-programmes-review.md`, with Claude Opus 5.5 technical self-review on 2026-10-27. The qualified review is **pending at OW-13** and not claimed. Test: `catalogue.test.mjs` › "box 2: three starter programmes…" (not run). The verifier and owner decide whether a technical reviewer satisfies the box |
| The seed is idempotent and never touches user rows (a test seeds twice over existing user data) | **No: database phase pending** | Static proof: `scripts/content/seed.test.mjs` (insert-only, no update, delete or upsert; owner_id null; stops on a member-held key at any version of the id, and on drift). Database proof: `scripts/content/verify-seed.mjs` with `scripts/content/sql/seed-check-*.sql` seeds twice over a synthetic member's rows in a rolled-back transaction, plus same-version conflict, cross-version conflict (member at version 2, seed at version 1; added for review M1, 1 Nov) and drift runs. Only its injected-runner tests exist (`verify-seed.test.mjs`, not run). **Blocked gate:** the coordinator's serialized database phase must run `rtk node scripts/content/verify-seed.mjs` |
| Every record has a Hindi name and instructions, or is listed for G14.hi | **Source-complete; runtime unproven** | Every region, muscle, equipment type, exercise, programme and day carries `"hi": "G14.hi"`; 306 records by hand count. The validator rejects a record with neither the marker nor Devanagari text (`catalogue.test.mjs` › "box 4…"). `templates.test.mjs` › "box 4: the G14.hi backlog…" checks the list. `rtk node scripts/content/build-seed.mjs hi-backlog` prints it. Not run |

## Acceptance evidence

| Ledger row | Run (build or environment, date) | Result | Evidence | Row written here? |
|---|---|---|---|---|
| DEC-16 · Font and seed-content rights before the stores | none | — (open) | Per-record provenance and the original-authorship statement: `docs/evidence/CT-1/provenance-and-review.md`. AI-authored text ownership is flagged for counsel | No. CT-1 is not the last prover (QA-5 is) |

## Gates

| Gate | Command | Result |
|---|---|---|
| Frozen install | `rtk pnpm install --frozen-lockfile` | **Blocked**: Bash denied |
| CT-1 unit tests | `rtk node --test scripts/content/*.test.mjs` | **Blocked**: Bash denied. Six files: ids, catalogue, seed, templates, build-seed and verify-seed tests |
| Content check | `rtk node scripts/content/build-seed.mjs check` | **Blocked**: Bash denied. Expected line begins `CT-1 content 2026-10-27.1 valid: 238 exercises (barbell 37, dumbbell 46, machine 32, cable 29, bodyweight 46, kettlebell 17, band 17, cardio 14), 21 muscles in 7 regions, 27 equipment types, 3 starter programmes (10 days, 56 prescriptions); Hindi: 0 records complete, 306 listed for G14.hi` |
| `pnpm check` | `rtk pnpm check` | Not run: coordinator asked to avoid full suites in this phase, and Bash is denied. The diff does not touch `apps/mobile/`, `packages/domain/`, `supabase/` or `scripts/backend/`. `scripts/content/*.test.mjs` is not yet wired into `pnpm test` (request below) |
| `pnpm backend:test` | — | Not required by path (no file under `supabase/`, `packages/domain/`, `scripts/backend/` or `apps/mobile/src/data/` changed). The CT-1 database proof is `verify-seed.mjs`, in the serialized phase |
| Expo export | — | Not required (no `apps/mobile/` change) |

## Inherited and used

| From | Claim | Held? |
|---|---|---|
| AR-1 (`scripts/backend/local-stack.mjs`) | `localDatabase()` refuses any target but the local loopback stack, and psql runs from argument arrays | Read and reused unchanged by `verify-seed.mjs`; not executed |
| AR-1 (`scripts/backend/check-sql-sources.mjs`) | No SQL under `supabase/` except migrations and configured seeds | Held. CT-1 adds no SQL under `supabase/`. The CLI refuses `--out` into `supabase/migrations/` |
| Member schema (`20261017161031_member_core.sql`, `20261017164336_validated_contracts.sql`) | `public.exercises` columns and checks; the `programmes` days contract and snapshot trigger | Read. The seed targets the existing columns. Templates use exactly the contract's keys (`templates.test.mjs` reads `packages/domain/contracts/<latest>.json`) |
| QA-1 F-6 | Seeds must fail loudly on a key they do not own | Implemented in source (untested): the seed raises on a member-held key at any version of the id (since the 1 Nov M1 correction) or on drift. There is no `on conflict do nothing` |

## Mutation checks

**None performed.** Each needs a test run, and the shell was denied. Planned checks for the verifier or
the next session; each should turn the named test red:

1. In `catalogue.mjs` `checkProvenance`, drop the `provenance.${field} is missing` loop. Expect red:
   "a record without provenance…".
2. Change `MIN_EXERCISES` to 199. Expect red: "the count guard fails at 199 exercises".
3. Delete `CLAIM_TERMS` from `text()` (pass `claims: false`). Expect red: "instructions have 2-4
   sentences…".
4. In `seed.mjs`, remove the `existing.owner_id is not null` branch. Expect red: "an existing key stops
   the seed…". In the database phase, the conflict run in `verify-seed.mjs` would also fail. (Since the
   1 Nov M1 correction, the check across all versions also catches this case. Only the static test turns
   red; the conflict run still passes.)
5. In `seed.mjs`, replace the drift `if` with `continue`. Expect red in the static test and in the drift
   run.
6. In `checkHindi`, treat a missing `hi` as the backlog. Expect red: "box 4…" (`hi is missing`).
7. In `checkOutPath`, drop the `supabase/migrations` check. Expect red: "the seed is never written into
   supabase/migrations/…".
8. (M1, 1 Nov) In `seed.mjs`, delete the member check that covers the whole id, or scope it with
   `and m.version = (rec->>'version')::integer`. Expect red: "a member-owned row on any version of a
   catalogue id…". In the database phase, the `crossVersion` run would exit 0 and be reported.
9. (M2(b), 1 Nov) In `catalogue.mjs`, restore the old derivation (`!singleArm` in place of
   `repsPerSide !== true`). Expect red: "logging semantics follow PRD 6.1…", "the multiplier derives from
   repsPerSide…", and the two M2 seed and template tests. Separately, removing the per-leg or per-hand cue
   from any of the five instructions turns only "the multiplier derives from repsPerSide…" red.

## Self-review (manual; independent review follows)

- Fixed during self-review:
  - `isDate` threw a `RangeError` on impossible dates; it now returns false.
  - A provenance `source` of `__proto__` resolved to `Object.prototype`; the lookup now uses
    `Object.hasOwn`.
  - Double "hi is missing" reports.
  - A convoluted timed/distance rule.
- Security and privacy:
  - The seed inserts only rows with `owner_id null`. It never reads or writes member data beyond two
    existence checks: whether a member holds the id at any version, then whether the `(id, version)` key
    exists. It stops instead of overwriting.
  - The verifier's synthetic member uses `@example.invalid` and is always rolled back.
  - No gym table and no staff path is touched, so the gym-staff/private-health boundary is unaffected.
  - Text is restricted so it cannot escape the SQL literal or the dollar quoting, enforced by both the
    validator and the builder.
  - No secrets are read or printed; the verifier test asserts no `sb_secret` output.
- Residual risks, all untested:
  - Any JSON syntax slip in 3,000+ lines of content.
  - Inserting into `auth.users` with the column list in `seed-check-setup.sql` may need adjusting for the
    local GoTrue schema.
  - The `uuidv5` test vector (Python's `uuid5(NAMESPACE_DNS, 'python.org')`) is quoted from memory.

## Review findings left open

None from sub-agent reviewers, because none ran. All automated review is deferred to the coordinator's
independent review.

Independent source review of 1 Nov (`docs/evidence/CT-1/source-review-2026-11-01-collected.md`):
- M1 is fixed in source only; its tests are unrun.
- M2(b), the unilateral multiplier, is fixed in source only (1 Nov); its tests are unrun.
- M2(a) bands (MB-2 contract prerequisite), M3 and L1–L9 are open and were not acted on.

## Left undone, and why

- Runtime proof of every box: Bash was denied.
- Database proof of box 3: the coordinator serializes database work; `verify-seed.mjs` is ready for it.
- Starter programmes are not seeded into the database. There is no global template table
  (`public.programmes.owner_id` is `not null`). They ship as validated content plus
  `build-seed.mjs templates`, in contract shape.
- Hindi text: listed for G14.hi rather than drafted, as box 4 allows; G14.hi needs a qualified reader
  anyway.
- A qualified human review of instructions and programmes: OW-13.

## Found for other goals

- **MB-2 (S8):**
  - Side semantics (review M2): persist `repsPerSide` in the exercise row and the prescription snapshot,
    and show the per-side and per-hand cue in logging, so the app "says so" (PRD §6.1). CT-1 now supplies
    only the derived multiplier and the text cue in five records.
  - Bands (review M2(a)): a contract-compatible way to mark unmeasured band resistance and suppress volume
    and e1RM for it. Until then, band metrics and the first seed stay blocked. CT-1 changed no band record,
    load type or contract.
  - A global starter-template store, or catalogue-owned programmes, plus the adoption flow that copies
    a template into a member programme with fresh ids.
  - Exercise columns the content already carries but the schema lacks: `category`, `movement`,
    `reps_per_side`, `single_arm`, source licence and version, Hindi name and instructions.
  - `Muscle`/`ExerciseMuscle` tables for the hierarchy (role and weight 1 / 0.5), per architecture 003 §7.
  - The member-side half of QA-1 F-6: reject a member insert whose `id` exists with `owner_id is null`,
    or use server-generated ids. The seed half is written here: since the 1 Nov M1 correction it checks
    every version of the id. It is untested, and the race noted in the M1 section stays open until this
    member-side half lands.
- **G14.hi (S4):** 306 records to translate (`build-seed.mjs hi-backlog`).
- **OW-13 (owner):** read 238 instructions and 3 programmes once; file corrections against CT-1.
- **QA-5 / DEC-16:** record the original-authorship statement. Counsel should note that the text is
  AI-written.

## Requests for other lanes' files

- **Shared `package.json`:** run `node --test scripts/content/*.test.mjs` inside `pnpm test`, for example
  a `content:test` script added to `test`, so `pnpm check` covers CT-1. Smallest diff. Not done here,
  because package files were out of bounds.
- **S1 `supabase/config.toml`:** when wiring, write the seed with
  `node scripts/content/build-seed.mjs sql --out supabase/catalogue-seed.sql` (or a CI step), and list
  it in `[db.seed] sql_paths`. Decide whether `development-catalogue.sql` stays as a dev-only fixture.
  `scripts/backend/check-sql-sources.test.mjs:209` pins the current seed list and must change in the
  same diff.
- **Coordinator, serialized database phase:** run `rtk node scripts/content/verify-seed.mjs` on the
  local stack, or on a disposable replay project through `expectedApiUrl`/`projectDir`, and record its
  one-line result for box 3. It only runs rolled-back transactions, but per the shared-stack rule the
  coordinator chooses the target.

## Decisions forced (for the tracker decision log)

1. **Launch catalogue is original text.** No external text was imported or adapted. Provenance is
   `fitlog-original` / `LicenseRef-FitLog-Original` / `2026-10-27` / `authored`. Rationale: no external
   licence could be verified in this session; DEC-16 forbids unverified rights.
2. **Permitted external licences** for future imports: CC0-1.0, Unlicense, 0BSD, MIT, BSD-2/3-Clause,
   Apache-2.0 and CC-BY-4.0. NC, ND and SA terms are excluded until the owner decides otherwise.
3. **Catalogue ids** are UUIDv5(namespace `0b6c3c8e-5d7a-4f1e-9a42-6f3d2c1b8e90`, `fitlog:catalogue:exercise:<slug>`).
   Slugs are permanent.
4. **The seed is insert-only.** It stops on a member-held key at any version of the id, or on drift (no
   `on conflict do nothing`).
   A content change needs a version bump.
5. **The multiplier is derived** (corrected 1 Nov for review M2(b), per PRD §6.1). Per-hand without
   reps-per-side gives 2. Per-hand with reps-per-side gives 1, whether one-arm or two dumbbells worked one
   leg at a time. Any other load basis gives 1. `singleArm` is a validated label (it needs per-hand and
   reps-per-side) and no longer sets the multiplier. This supersedes the earlier "per-hand and not
   single-arm gives 2", which gave 2 to five two-dumbbell, one-leg records. Persisting reps-per-side, so
   the app "says so", is MB-2's.
6. **Muscle weights:** primary 1, secondary 0.5.
7. **Instructions make no health, medical or safety claims.** This is enforced by a term list.

## Traps hit

- The shell was denied for the entire session, even with the `rtk` prefix.
- Any new `.sql` under `supabase/` fails `check-sql-sources` unless `config.toml` lists it, so the seed is
  generated, not committed.
- `public.programmes.owner_id` is `not null`, so starter programmes cannot be seeded yet.
- psql does not interpolate variables inside quoted literals. The verifier passes its parameters as
  literals through `set_config`, never as `-v` variables, so content cannot become psql syntax.

## Files in this change (all new)

- `content/README.md`, `content/catalogue.json`, `content/exercises/{muscles,equipment,barbell,dumbbell,machine,cable,bodyweight,kettlebell,band,cardio}.json`, `content/programmes/starter-programmes.json`
- `scripts/content/{ids,catalogue,seed,templates,build-seed,verify-seed}.mjs` and a `*.test.mjs` for each
- `scripts/content/sql/seed-check-{setup,after-first,assert}.sql`
- `docs/evidence/CT-1/{provenance-and-review,starter-programmes-review}.md`
- `docs/plan/runs/CT-1/{checkpoint,handoff}.md`

No existing file was modified. No status, activity, ACCEPTANCE, EXECUTION, supervision, migration,
config, package or development-seed file was touched.


## M1 independent source acceptance — 2026-11-01T16:47:03.005054+00:00

Reviewer76f2aad6 COMPLETE C0/H0/M0/L0 introduced; Read12/Grep10/no errors or denials, six hashes unchanged. Codex independently inspected source/diff and accepts only source correction. See `docs/evidence/CT-1/m1-source-accepted-2026-11-01.md`. M1 runtime remains UNRUN; concurrency MB-2, M2/M3/external gates and all four CT1 boxes remain open. Historical denied commands stay parked; no repeated source/wording loop or integration claim.


## M2(b) independent source acceptance — 2026-11-01T17:49:13.534790+00:00

Reviewer7dfe6009 COMPLETE C0/H0/M0/L2, Read14/Grep20, no errors/denials, eight hashes unchanged, exited. Codex AUTH01 accepts ONLY source correction; see `docs/evidence/CT-1/m2-source-accepted-2026-11-01.md`. Two nonblocking lows assigned CT1 (mutation9 recipe before eventual mutation proof; permitted versus actual tool wording). No optional polish loop. Tests/DB remain UNRUN; historical denied sequences parked. M2(a)/MB2/M3/external gates and all four CT1boxes remain open; no integration/Done claim.
