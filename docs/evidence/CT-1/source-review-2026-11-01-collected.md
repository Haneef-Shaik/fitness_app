# CT-1 independent source-only review: **SOURCE-ONLY PASS, with limits**

**Verdict:** I found no Critical or High issues. There are 3 Medium and 9 Low findings. M1 and the M2 decision should be dealt with before the first database seed run, because once a row is seeded any change to it needs a version bump. This is a review of the code and content only. It is not a goal-Done verdict, not a statement that the code is ready to integrate, and not proof that the seed works in a database.

**What I did and didn't do:** I used only Read and Grep. I ran no commands, tests, installs or database calls, and made no edits or commits. No permission was denied. All counts below come from reading the files and from Grep line counts, not from running the validator. This technical review is not a qualified exercise review, a legal review or a licence approval. OW-13 and QA-5 still hold the real external reviews.

## Done-when boxes: where each is met in source, and what remains

| Box | Where it is met in source | What remains |
|---|---|---|
| 1. ≥200 exercises with provenance; a test counts them and rejects a record without provenance | 238 records (barbell 37, dumbbell 46, machine 32, cable 29, bodyweight 46, kettlebell 17, band 17, cardio 14). Each has muscles, equipment and provenance. Every instruction is 40–600 characters, 2–4 sentences, and ends with `.`, `!` or `?`. Count guard: `catalogue.mjs:422`. Tests: `catalogue.test.mjs:37-83` | Run the unit tests and `build-seed.mjs check`; do mutation checks 1–3 from the handoff |
| 2. Three programmes with reviewer and date in `docs/evidence/CT-1/` | 3 programmes, 10 days, 56 prescriptions. Every referenced exercise exists. The reviewer of record is an AI self-review, marked "not independent" (`starter-programmes-review.md:9-18`) | **Owner decision:** does a technical reviewer satisfy this box? If not, a human reviewer and date must be recorded (OW-13 or the owner). This review can be recorded as an independent *technical* review only |
| 3. Seed is idempotent and never touches user rows; a test seeds twice over existing user data | Single PL/pgSQL `DO` block that only inserts, writes `owner_id` null, has no `on conflict`, and stops on a member-held key or on drift (`seed.mjs:53-89`). The database proof is written (`verify-seed.mjs` plus three SQL files) | Fix M1. Then run the tests, then `verify-seed.mjs` on a target the coordinator chooses, then wire it into `backend:test` (M3) |
| 4. Hindi text or listed for G14.hi | 306 `"hi": "G14.hi"` markers: 7 regions, 21 muscles, 27 equipment types, 238 exercises, 3 programmes, 10 days. Backlog builder: `templates.mjs:52-66`. G14.hi's parity box already includes exercise content (`GOALS.md:937`) | Run the tests; capture the `hi-backlog` output |

Runtime status: 0 of 4 boxes proven.

## What checks out (with evidence)

- **Seed never touches member rows:** the only write is one `insert into public.exercises` with `owner_id` null (`seed.mjs:85-86`). There are no triggers on `exercises` (only `validate_*` triggers exist: `validated_contracts.sql:57-61`).
- **Idempotence:** an identical existing row is skipped (`seed.mjs:83`). Any difference stops the run (`:71-81`), and arrays are compared in order (`:38`).
- **SQL injection safety:**
  - The validator refuses quotes, backslashes, `$` and control characters (`catalogue.mjs:36,95`).
  - The payload is checked again for backslashes and `$` (`seed.mjs:44-45`), and quotes are doubled (`:14-17`).
  - `contentVersion` must match a strict pattern (`catalogue.mjs:401`).
  - psql gets its input on stdin from an argument array, with no shell (`local-stack.mjs:16-18,49`). Verifier parameters are passed as `set_config` literals (`verify-seed.mjs:45-48`).
  - Content paths can't escape `content/` (`catalogue.mjs:39,66`).
- **Verifier transaction:** every script is `begin` … `rollback` with ON_ERROR_STOP on, contains no commit, and uses `on commit drop` temp tables (`verify-seed.mjs:43-53`). If it errors or is killed, the connection closes and Postgres rolls back.
- **Target identity:** the verifier only accepts a loopback URL that equals what `supabase status` reports, and takes the container name from `project_id`. It refuses any other target before psql runs (`local-stack.mjs:37-50`; test `verify-seed.test.mjs:121-125`). Content is validated before any command runs (`verify-seed.mjs:59-60`).
- **Credentials:** `supabase status` output is never echoed (`local-stack.mjs:41-44`). Failures print only psql's stderr. A test checks no `sb_secret` is ever printed (`verify-seed.test.mjs:150`).
- **Stable IDs:** UUIDv5 of a fixed namespace plus a permanent slug (`ids.mjs:7-33`). Catalogue IDs are version 5, so they can never collide with the dev fixture's version-4 IDs.
- **Contract shape:** template keys match the published contract exactly (`templates.mjs:10-48` against `0.1.0.json:134-148,201-212,240-246`). The database trigger checks type, load basis and multiplier against the seeded row (`contract_trigger_dispatch.sql:30-31`).
- **Logging semantics:**
  - Allowed load bases per logging type: `catalogue.mjs:23-25`.
  - Multiplier 2 for per-hand unless single-arm (`:438`); single-arm requires per-hand and reps-per-side (`:276-279`).
  - Assistance is used only on bodyweight records (`machine.json:151,159`, `band.json:111`), and the domain never counts it as volume (`calculations.ts:21`).
  - Bodyweight with load basis `none` still allows optional added load in the domain.
- **Programmes:** timed items have a duration and reps 1/1. Weekdays are unique within each programme and use 0 = Sunday, which matches `scheduling_and_history.sql:23`.
- **Provenance honesty:** AI authorship, the self-review's lack of independence, the unverified candidate sources and the unverified ACSM reference are all disclosed. Qualified review is recorded as `pending` at OW-13.
- **Tests:** tracing all six test files by hand against the modules and content, I found no assertion that should fail.
- **SQL file location:** `check-sql-sources` only scans `supabase/` (`check-sql-sources.mjs:107-129`), and there is precedent for harness SQL outside it (`scripts/backend/sql/training-fixtures.sql`).

## Findings

### Medium

**M1 · The seed's member check only looks at one version of an ID (owner: CT-1).**
- The lookup is by `(id, version)` (`seed.mjs:66-70`). The table's primary key is `(id, version)`, and members can insert any `id` as long as it carries their own `owner_id` (`member_core.sql:39,47,53-54`; insert grant at `explicit_api_grants.sql:5`).
- Catalogue IDs are predictable because the namespace and slugs are public in source. So a member who holds `(catalogueId, 2)` lets the seed silently insert `(catalogueId, 1)` next to it.
- That breaks the architecture rule "fail loudly on a conflict … a member cannot claim a catalogue ID" (`003:1065-1067`), and the handoff says this seed half is done (`handoff.md:120-121`). It also means one member's row will later block a catalogue v2 for everyone.
- The verifier only plants a same-version conflict (`verify-seed.mjs:32-33`).
- **Fix:** raise if any row with that `id` has `owner_id is not null`. Add a static test and a verifier variant with the member row at version 2.

**M2 · Two logging decisions need the owner's sign-off before the first seed (owner decision, recorded in CT-1; persistence goes to MB-2).**
- **(a) Bands:** 16 band exercises are `resistance`/`total` (e.g. `band.json:7`). The domain then requires a kg load (`calculations.ts:16`) and works out volume and e1RM from a nominal band number (`:20-28`).
- **(b) Two dumbbells, one leg at a time:** walking lunge, reverse lunge, Bulgarian split squat, step-up and split squat (`dumbbell.json:215,223,231,239,359`) get multiplier 2 under decision #5 (`catalogue.mjs:438`). PRD §6.1 literally says "unilateral reps-per-side uses multiplier 1 and says so" (`PRD.md:267-268`).
- Separately, `repsPerSide` isn't stored anywhere — not in the seed rows or the snapshot (`seed.mjs:20-36`, `templates.mjs:10-15`) — so the app can't "say so" (persistence: MB-2).
- After the first seed, the drift guard turns any change here into a version bump.

**M3 · No test suite or gate runs CT-1 (owner: package-owning lane, via an amended CT-1 request).**
- Neither `test` nor `backend:test` includes it (`package.json:15,18`).
- The handoff only asks to wire the unit tests (`handoff.md:129-131`). Box 3 says "a test", so `verify-seed.mjs` belongs in `backend:test` next to `verify-fixtures.mjs`, so that PL-1's CI runs it.

### Low

- **L1 (CT-1):** The verifier's error patterns accept any key, not just the probe (`verify-seed.mjs:22-23`). Its result line also doesn't record the content version, payload hash or migration head (`:75`; `seed-check-assert.sql:43-44`).
- **L2 (CT-1):** The provenance note says unilateral records explain how to log them (`provenance-and-review.md:67-68`), but 39 of the 57 per-side records give no logging cue (e.g. `dumbbell.json:105`, `barbell.json:281`, `kettlebell.json:17`). Fix the note or add the cue; editing text before the first seed is free.
- **L3 (CT-1):** The `--out` guard can be bypassed by case on macOS or through a symlink, and it silently overwrites an existing `.sql` such as `supabase/seed.sql` (`build-seed.mjs:37-45,83`).
- **L4 (MB-2):** An insert-only seed can't retire old versions or removed slugs. Equipment and muscle display names are stored in each row (`seed.mjs:29-31`), so renaming one forces version bumps on every affected exercise. MB-2 needs a "current version" rule and taxonomy IDs (`003:1074`).
- **L5 (S1 seed wiring):** The dev fixture's global rows share names with CT-1, e.g. `development-catalogue.sql:2,7,8,10` against `barbell.json:94` and `cable.json:6,30`. If both seeds load, the picker shows duplicates.
- **L6 (DEC-16/QA-5):** `catalogue.json:26` says no external text was copied and no source was consulted. An AI can't certify it reproduced nothing from training. Suggest wording such as "to the author's knowledge", and flag it for counsel.
- **L7 (G14.hi/coordinator):** Hindi text, once added, won't be screened for health claims (`catalogue.mjs:110`). G14.hi's Needs line also leaves out CT-1 (`GOALS.md:929`).
- **L8 (CT-1):** `checkProgrammes` (`catalogue.mjs:338-393`) and `validateContent` (`:396-460`) are over the 50-line function limit in your coding rules.
- **L9 (OW-13):** For the qualified reader: `cardio.json:9` says "Start the belt … and step on", i.e. stepping onto a moving belt.

**Runtime risks I can't settle from source:**
- The `auth.users` column list (`seed-check-setup.sql:5`); no other file in the repo inserts into `auth.users`.
- Whether the database copy of the contract matches the package contract exactly (`validated_contracts.sql:9`).
- The UUID test vector (`ids.test.mjs:11`) matches the Python docs value as I remember it, but I haven't run it.

**Shared stack:** the verifier defaults to 55321 (`local-stack.mjs:11`). It only runs rolled-back data changes and never changes policies or schema, so it doesn't weaken any guard. Which target it runs on is still the coordinator's choice.

## Next phase

1. **CT-1 source fix-up:** fix M1 (seed, test and verifier variant). Record the owner's M2 decision and apply any content change before the first seed. Fix L1, L2, L3 and L8. Amend the M3 request.
2. **Runtime gates (coordinator, with authority to run them):** frozen install, the content unit tests, `build-seed.mjs check` compared against the expected summary line, and the 7 + 1 mutation checks.
3. **Serialized database phase:** run `verify-seed.mjs` on the coordinator's chosen target and record its one-line result for box 3.
4. **Other lanes:** package wiring, the S1 `config.toml` seed plus the `check-sql-sources` pin and the dev-fixture decision (L5), MB-2 (template store, columns, L4), the box-2 reviewer decision and OW-13, G14.hi, and QA-5/DEC-16.
