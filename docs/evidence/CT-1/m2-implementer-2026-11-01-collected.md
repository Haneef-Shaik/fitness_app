**COMPLETE.** The M2(b) unilateral-multiplier correction is in source, with regression tests written but not run. Nothing was executed, so nothing here shows that anything passes or works at runtime, and no Done box is claimed. Bands, M3 and the other gates are still open.

I used Read (14 calls), Grep (16) and Edit (21), and no Write. There were no permission denials. One Grep failed because ripgrep doesn't support look-ahead patterns; I reran it in a supported form. Nothing else ran: no shell, tests, installs, database, network, commits, status changes or subagents.

## Changed paths (exactly the eight allowed)
1. `scripts/content/catalogue.mjs`
2. `scripts/content/catalogue.test.mjs`
3. `scripts/content/seed.test.mjs`
4. `scripts/content/templates.test.mjs`
5. `content/exercises/dumbbell.json`
6. `content/README.md`
7. `docs/plan/runs/CT-1/handoff.md`
8. `docs/plan/runs/CT-1/checkpoint.md`

None of the accepted M1 work was touched (`seed.mjs`, `verify-seed.mjs`, `verify-seed.test.mjs`, the SQL files, and the existing tests in `seed.test.mjs`).

## How the multiplier is now worked out
- New exported function `volumeMultiplier({ loadBasis, repsPerSide })` in `catalogue.mjs:38`:
  - per hand, not reps-per-side (bilateral): **2**
  - per hand, reps-per-side: **1**
  - any other load basis: **1**
- This replaces the old rule (per hand and not single-arm gives 2) at `catalogue.mjs:445`.
- The single-arm check is unchanged: a single-arm record still needs per-hand load and reps-per-side, so every single-arm record still gets 1.
- The schema (`multiplier in (1,2)`), the domain model and the snapshot trigger already accept per-hand with multiplier 1, so no shared contract changed.

## Record changes
- **Who is affected:** 21 records are per-hand and reps-per-side. 16 are single-arm and were already 1. Only the five named records change, from 2 to 1: walking lunge, reverse lunge, Bulgarian split squat, step-up and split squat. None of them is labelled single-arm.
- **Logging cue:** each of the five instructions now ends with "Log the repetitions per leg and the weight of one dumbbell as the load per hand." The walking lunge says "steps per leg".
- **Sentence counts:** the walking and reverse lunges stay at 3 sentences (their old cue sentence was replaced). The other three go from 3 to 4.
- **Unchanged:** flags, names, muscles, provenance and `version: 1`. There's no version bump because these records have never been seeded.
- **Side effect:** the seed payload's sha256 changes. No test pins it.

## Regression tests written (none run)
- **`catalogue.test.mjs`, existing test "logging semantics follow PRD 6.1…":** the formula check over every record now uses reps-per-side, and it also checks that every single-arm record is 1.
- **`catalogue.test.mjs`, new M2 test.** It checks:
  - the formula for every load basis, with and without reps-per-side;
  - every per-hand reps-per-side record is 1, every bilateral per-hand record is 2, and every other load basis is 1;
  - the per-hand, reps-per-side, not-single-arm records are exactly the named five, each with the per-leg and per-hand cues, version 1 and its provenance;
  - the existing one-arm row is 1 and the bilateral bench press is 2;
  - two planted changes: removing reps-per-side from the split squat gives 2, and adding it to the bench press gives 1;
  - two single-arm rejections still work: single-arm without reps-per-side, and single-arm on a total-load record.
- **`seed.test.mjs`, new test:** the seed rows and the SQL payload carry 1 for the five and the one-arm row, and 2 for the bench press; the insert writes the payload's multiplier.
- **`templates.test.mjs`, new test:** starter-programme snapshots give 1 for the reverse lunge, Bulgarian split squat and one-arm row, and 2 for the bench press.
- **Handoff mutation check 9:** describes the change to make (restore the old rule, or remove a cue) and which tests should then fail.

## Gates not run
- frozen install
- `node --test scripts/content/*.test.mjs`
- `build-seed.mjs check` (the expected summary line is unchanged)
- mutation checks 1–9
- `verify-seed.mjs` against a database

## Still open, and who owns it
- **M2(a) bands (MB-2 contract prerequisite):** no band record, load type, contract, schema or domain code changed. A nominal band level is not claimed as a valid kg load. Band metrics and the first seed stay blocked.
- **MB-2:** storing reps-per-side (database column and snapshot key) and showing the per-side cue in the app. This fix cannot close that gate.
- **M3 wiring:** S1/CT-1.
- **Qualified review and legal evidence:** OW-13 and QA-5/DEC-16.
- **Concurrent member claims:** MB-2.
- **Findings L1–L9:** not acted on.
- **CT-1 Done boxes:** all four remain open.
