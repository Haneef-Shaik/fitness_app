# QA-9 review: commit 8b29511 and the two after-commit notes (read-only, 27 Oct 2026)

**Verdict:** there are no critical, high or medium findings, and two lows, both in the records. The commit holds exactly the 11 owned paths. The floor blob is unchanged, the raw finals are byte-identical, and `main` is still unanchored. The four 0705 corrections hold wherever I could check them. QA-9 is not Done. I edited, staged and committed nothing, ran no gate or test, and touched no database, Docker, Supabase or network.

## Findings

**Low 1: the "only uncommitted" statements are now out of date**
- **Where:** `handoff.md:7`, `checkpoint.md:101` and `:128`, and `final-2026-10-27T0905Z.md:19`.
- **Defect:** all four say only the checkpoint and handoff are uncommitted. The coordinator has since saved `docs/evidence/QA-9/final-2026-10-27T0905Z.md`, untracked, with sha256 `fa75b065c58e65e82a4af5dc6518fd73e8040b85215b6d068ec5cf47dd9d47a2`. The statements were true when written.
- **Failure scenario:** the next phase takes "two uncommitted paths" as its inventory, and its exact-path check fails or misses the final.
- **Fix:** the next records phase names the 0905 final with this hash in the Reviews and Git rows. Leave the final itself unedited.

**Low 2: the 0905 final misstates who runs `backend:test`**
- **Where:** `final-2026-10-27T0905Z.md:23` says `backend:test` is "to run in MB-1's database lane".
- **Defect:** MB-1's handoff (`handoff.md:44`, D7) says `backend:test` runs against the shared stack, "which MB-1 never touches". QA-9's own records (`checkpoint.md:132`) correctly say "serialised with" MB-1's lane.
- **Failure scenario:** the coordinator waits for MB-1 to run it, or assigns it into MB-1's lane against D7. Either way it never runs.
- **Fix:** add a note beside the 0905 final in the checkpoint's file index: QA-9 runs it, serialised with MB-1, not inside MB-1's lane.

## What I checked

**Executed by me:**
- **The commit:** `8b29511` sits on `961e1f4` and has 11 paths: 9 added, 2 modified, all under `docs/evidence/QA-9/` or `docs/plan/runs/QA-9/`. It is 2851 insertions and 15 deletions, with a subject line and no trailer. `git diff --check 961e1f4 8b29511` is clean.
- **The floor:** blob `0036eedaf6de63003294b9ff7aa3ef157ab57c74` at `961e1f4`, at `8b29511` and in the working tree.
- **`main`:** `c8a5d57`. It contains no `scripts/quality/` at all, so it is unanchored.
- **Hashes:**
  - All 11 files match phase 3M's run 7: the six finals, the 3I and 3J outputs, the floor, the lockfile and `coverage-baseline.md`.
  - `phase-3l-check-outputs.md` matches run 10 (`181775a9…`).
- **The after-commit notes:** only the checkpoint and handoff changed, 48 insertions and 4 deletions. `git diff --check` is clean, and every stated ID and count matches git.
- **Hooks:** the shared git directory has only `.sample` hooks and no `core.hooksPath`, which fits "no hook output".

**Inspected (reading only):**
- **Low 1:** the cut marker at `phase-3l-check-outputs.md:242` now reads "raw lines 121–702".
- **Low 2:** recorded at `handoff.md:17` and `:288`.
- **Low 3:**
  - The old sentence is struck through and corrected at `handoff.md:393`, with notes at `checkpoint.md:102` and `:411`; the 0635 final is unchanged.
  - The claim that the review's `checkpoint.md:348` meant `handoff.md:348` is consistent. Phase 3M added 38 lines above the sentence (now 386 in the commit), which puts it at 348 in phase 3L's state. That is arithmetic only, since 3L's state was never committed.
- **Low 4:** the final-state list at `checkpoint.md:676–681` labels inherited and executed facts correctly. `d57c3810…` equals run 7's hash.
- **The denial claim:** phase 3L's denied `node -e` count is recorded (`checkpoint.md:646`, `:672`), so "the count was denied" is true.

**Inherited, not re-checked:** the 285-test local CI-mode proof, the 0535 floor proof, the 0405 exports, and the raw-output figures behind Lows 2 and 3. I didn't retry the raw-output count or hash.

**Denied, sequence stopped, no other tool or form used:**
- `sed` of `phase-3l-check-outputs.md` lines 10–20. So I did not verify the header wording for Lows 1–3 in that file.
- `git for-each-ref` for the upstream ref. So "not pushed" is inherited.

## What `backend:test` needs (from the scripts and MB-1's handoff)

- **Inputs are identical to `main`'s:** QA-9 changes nothing under `supabase/`, `scripts/backend/` or `apps/mobile/src/data/`. The `backend:test` script and `supabase` 2.121.0 are unchanged. Its domain inputs (`contracts/*` and `fixtures/ac03-training.v1.json`) are unchanged too. The run is owed only because docs/23 §7 matches the `packages/domain/` path, so a failure would mean the stack has drifted, not a QA-9 defect.
- **Steps 1–2 need no database:** the pure tests use fakes, and `check-sql-sources` only reads git.
- **Steps 3–8 need the shared stack:**
  - `verify.mjs:7`, `verify-gym.mjs:5` and `verify-freezes.mjs:5` refuse anything except `127.0.0.1:55321`.
  - `verify-freeze-projection.mjs:12` hard-codes the database container `supabase_db_fitlog_rebuild_20261017`.
  - `verify-contracts` and `verify-fixtures` default to the same stack.
- **There is no isolated target today.** Without changes to shared scripts, `backend:test` cannot run on a replay. MB-1 has requested those changes (an allowlisted-environment executor, fixes to how `verify*.mjs` parse `supabase status`, and adding `verify-identity.mjs`), but they belong to another lane. If they land on `main` before QA-9 integrates, the test must be re-run.
- **MB-1's state:** it is interim after SF-7. Its candidate migration `20261026040045_mb1_live_session_guard.sql` exists only in its own worktree, no shared apply is authorised, and its replay is untouched. So 55321 should hold exactly `main`'s 15 migrations.

## Proposed next phase, 3N: one serialised `backend:test` run (not executed, not authorised)

**Targets:**
- **Worktree:** `fitlog-qa9`, branch `codex/qa9-quality-ratchets`, `HEAD` = `8b29511381c35b936eb2fe14a148cd21f4dedfed`.
- **Stack:** project `fitlog_rebuild_20261017`, API `127.0.0.1:55321`, database `127.0.0.1:55322`.
- **Node:** v22.23.1.

**Ownership checks (read-only; stop on any mismatch):**
1. `rtk proxy git status --porcelain=v1 -b -uall`: exactly checkpoint and handoff modified, plus the 0905 final untracked.
2. `rtk proxy git rev-parse HEAD main HEAD:scripts/quality/coverage-floor.json`: `8b29511…`, `c8a5d57…` and `0036eeda…`.
3. `rtk proxy git diff --name-only c8a5d57c3a0999760ad21fd1aca4899ca76b5adf HEAD -- supabase scripts/backend apps/mobile/src/data`: empty.
4. Read MB-1's latest checkpoint and `runs/local-supervision.json`. Expect:
   - no MB-1 phase running;
   - no lock or STOP;
   - nothing applied to 55321;
   - no other lane using 55321.

   Codex's brief must name the exclusive window.
5. `rtk proxy sha256sum` of the 11 files from run 7, plus the 0905 final.

**Stack checks (read-only; never echo `supabase status`, because it prints keys):**
1. `rtk proxy docker ps --filter label=com.supabase.cli.project=fitlog_rebuild_20261017 --format "{{.Names}} {{.Ports}}"`: Kong must publish 55321 and the database 55322. If the stack isn't running, stop; never `supabase start`.
2. `rtk proxy docker exec supabase_db_fitlog_rebuild_20261017 psql -U postgres -d postgres -X -At -c "select version from supabase_migrations.schema_migrations order by version"`: exactly `main`'s 15. Stop if `20261026040045` or anything else appears.
3. The same `psql` form for:
   - `select count(*) from public.exercises where id='20000000-0000-4000-8000-000000000001'`: expect 1. Stop rather than seed.
   - `select count(*) from auth.users where email like '%@example.invalid'`: record as N0.

**The gate, exactly once:** `rtk proxy pnpm backend:test` from the worktree root. No edits while it runs, and no re-run on failure.

**Checks afterwards:** repeat stack checks 2 and 3 and ownership checks 1, 2 and 5. Expect the user count to equal N0, still 15 migrations, and no "needs attention" line in the output.

**Effects:**
- **Temporary writes to the shared stack:**
  - at least 9 synthetic `@example.invalid` users;
  - their workout and body rows;
  - two disposable gyms with 50 receipts and their freezes.

  The scripts delete all of these with service-role DELETEs in `finally`. A failed delete only logs; it doesn't fail the run.
- **Rollback-only:** the fixtures SQL.
- **Read-only:** the projection function and the contracts check.
- **Unavoidable leftovers:** auth audit rows and advanced sequences.
- **Never touched:** schema, migrations, seed, RLS, grants, replay, MB-1 files, commits and pushes.
- **Network:** loopback and the Docker socket only.

**Stop conditions:** any denial (stop the sequence, no alternate form), any check mismatch, another lane active, the account limit, a non-zero exit, or leftover rows. Record leftovers; never clean them up by hand.

**Policy:** `verify-gym` asserts that staff never gain health access. A failure there is a critical stop, and nothing is weakened (PRD §16.1 and ADR 003). The launching-checkout override stays until QA-2 is integrated and the launching checkout is corrected.

**Records afterwards, uncommitted:**
- a new `phase-3n-backend-outputs.md`;
- updates to the checkpoint and handoff;
- the 0905 final named with its hash (Low 1);
- the note on the 0905 final's `backend:test` wording (Low 2).

**Still open after 3N:**
- The floor is anchored only by exact integration into `main`.
- Box 3's hosted lint-negative run needs a specifically authorised push.
- Final independent verification is still owed.
- No Done is claimed.