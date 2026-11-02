**Verdict: COMPLETE.** The M2(b) multiplier correction matches PRD §6.1 in source. I found no Critical, High or Medium issues and two Low ones, neither blocking. This checks the source only. Nothing was run, so no test is shown to pass, and no CT-1 box or goal is accepted.

## Introduced findings (C0 / H0 / M0 / L2)

| # | Where | Finding | Owner |
|---|---|---|---|
| L-a | `docs/plan/runs/CT-1/handoff.md:213-214` | Mutation check 9 can't be applied as written. It says to put `!singleArm` back into the function, but `volumeMultiplier` (`scripts/content/catalogue.mjs:38`) has no `singleArm` input. The change has to be made where it's called, at `catalogue.mjs:445` (pass `repsPerSide: singleArm`). The list of tests expected to fail is still correct for that version. The formula checks at `catalogue.test.mjs:167-171` would stay green, which is expected. | CT-1, handoff wording, not blocking |
| L-b | `handoff.md:70`, `checkpoint.md:75` | Both say the session used "Read, Grep, Edit and Write". The implementer's collected report says it used Edit 21 times and never used Write. The collected report is the authoritative tool record. | CT-1, record accuracy, not blocking |

## Formula and how it spreads (source only)

**Formula**
- `catalogue.mjs:38` gives `per_hand` without reps-per-side 2, and every other case 1. That matches `docs/PRD.md:267-268`.
- It is used at `catalogue.mjs:440,445`.
- The `singleArm` check at `catalogue.mjs:282-285` is unchanged.

**Content**
- 21 records are `per_hand` with reps-per-side: 12 dumbbell and 9 kettlebell. 16 of them are single-arm.
- Exactly five are not single-arm: `dumbbell.json:215, 223, 231, 239, 359`.
- Every other `per_hand` record without reps-per-side is a genuine two-implement bilateral lift. I checked every dumbbell record, plus `kettlebell.json:87` and `:95`.
- All five carry both cues, "per leg" and "load per hand"; the walking lunge says "steps per leg".
- Sentence counts are 3, 3, 4, 4 and 4. There are no claim words or forbidden characters, and all are under 600 characters.
- Provenance, `version: 1`, flags, names, aliases, muscles and the `G14.hi` marker are unchanged.
- The one-arm row (`:103`, single-arm) gives 1, and the bench press (`:7`) gives 2.

**Propagation**
- The seed rows take the catalogue multiplier at `seed.mjs:29`. The drift check compares it at `:81`, and the insert writes it at `:93`.
- Template snapshots copy the seed row at `templates.mjs:12` and are built from it at `:19-20`.
- Nothing ties `per_hand` to 2 in the database, domain model or contract: `20261017161031_member_core.sql:43`, `packages/domain/src/models.ts:17` and the JSON in `20261017164336_validated_contracts.sql` all allow 1 or 2.
- Volume uses `exercise.multiplier` (`calculations.ts:23`), so once seeded, volume will follow the new values.
- No shared contract changed.

**Authored tests (plausible, not run)**
- The new catalogue test pins specific records and values. It plants a change in both directions, keeps both `singleArm` rejections, and confirms each planted change is valid content (`catalogue.test.mjs:160-164`).
- The all-records formula line (`:147`) just repeats the code's formula, so on its own it proves little. The specific pins are what make the tests meaningful.
- The seed test checks both the rows and the parsed payload at the same position, and its insert pattern matches `seed.mjs:93`.
- The template test only uses exercises the starter programmes actually prescribe: `starter-programmes.json:27, 46, 48, 112, 155`.
- The handoff says removing a cue turns only the M2 catalogue test red. That holds: the instructions would still have 2–4 sentences, and no test pins the payload hash.

**No regressions**
- In `seed.test.mjs` the change only adds a test after line 96.
- `seed.mjs` isn't in the diff. Its any-version member check is still described at `:5-6`. I did not re-review M1.
- Bands, load types, `ALLOWED_LOAD`, the schema and the domain are untouched.
- No document outside the evidence folder still states the old rule. `content/README.md:26-29` is updated, and the architecture docs don't state the rule at all.
- The docs don't overclaim. They say the tests are unrun and that bands and MB-2 are still open.

## Limitations of a source-only review
- No test, mutation, build check or database run was done, so it's unknown whether anything passes.
- I compared `catalogue.mjs` and `dumbbell.json` in full against the diff's "after" text. The other six files I spot-checked by line position only, and I didn't hash-compare against `m2-phase-before-2026-11-01.json`.
- The new payload sha256, and whether the snapshot trigger accepts these rows at runtime, are unverified.
- Tools used: Read 14, Grep 20. No errors or permission denials, and nothing else ran.

## Still open, and who owns it
- **M2(a) bands:** an MB-2 contract prerequisite, owned by Codex. Band metrics and the first seed stay blocked.
- **MB-2 (S8):** storing reps-per-side (database column and snapshot key) and showing the per-side cue in the app. The concurrent member-claim race also sits here (MB-2 / QA-1 F-6).
- **M3 wiring:** S1/CT-1.
- **External reviews:** OW-13 qualified content review and QA-5/DEC-16 legal evidence.
- **L1–L9:** owners as set in the disposition.
- **Runtime gates** for the coordinator's serialized phase: frozen install, `node --test`, `build-seed.mjs check`, mutation checks 1–9, and `verify-seed.mjs` against a database. Earlier denied tries stay parked.
- **CT-1 Done boxes:** all four remain unproved.
