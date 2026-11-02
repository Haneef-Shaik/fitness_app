I fixed both lows from the 11:05 review (L1 and L2) test-first. The one full test run did not come back green: 307 of 308 passed. The failure was my own header comment, which I fixed and rechecked with that test file alone (3/3). The brief allows the full suite once, so a green full run on the final code is not shown. That run is left to the independent review. Nothing is Done and no Done-when box is met.

**What changed** (`mb1-replay-live.mjs`, `mb1-replay-shared.mjs`):
- **L1:** right after the second binding read, `shared-apply` checks the proven database container's start time again, by its ID. That check is now the last step before the final guards, the attempt record and the start of `migration up`, with no `await` between them.
  - A restart or a stop during the staged status, the migration list or that binding read now refuses there.
  - No attempt is recorded and `state.json` is byte-for-byte unchanged.
- **L2:** after `migration up`, whatever its exit, the start time is checked right after the binding recheck, before the after snapshot. It is checked once more after the snapshot, before the verified state is returned to be written.
  - Any change or failed check is a STOP: the attempt stays recorded, with no `sharedApplied` and no `55321-after`.
  - The second check goes beyond the review's suggested placement. Without it, a restart during the after snapshot would still end in a STOP with `sharedApplied: true` recorded, which the brief forbids.

**Tests (Node v22.23.1):**
- **Executed:**
  - **RED on 7 files:** 37 tests, 15 failing, each for its intended reason. 11 lacked the new inspect calls in their expected order. The 4 new tests showed the defects: `migration up` ran after a restart, and a run that ended in STOP recorded `sharedApplied`.
  - **GREEN:** 37/37 on the first run. No assertion changed after the code.
  - **Full suite, once:** `1..159`, 308 tests, 307 pass, 1 fail. The failure was the scope test: my second header line in `live.mjs` pushed its required "Internal" comment past line 5. I moved the mention onto one line and reran only the scope test file: 3/3.
  - **Secret scan:** exactly the known five lines and six tokens.
- **Inspected:** before the full run I checked the 20 test files' side effects. Writes go only to temporary directories, and the new test file starts no process.
- **Inherited:** the 304/304 baseline from the 11:05 review.
- **UNRUN:**
  - every mutation: SF-7b's eight, SF-7c's four and the five I planned for this phase;
  - any file hashes: `sha256sum` was denied to the 11:05 reviewer, so I didn't retry it;
  - `date`, which was denied this phase. It wasn't retried or replaced, so no times are recorded.

**Still open:**
- **M1:** open and unchanged.
- **A new window I can't close within the allowed files:** after the verified state is written, the entry file `mb1-replay.mjs` checks the start time by name once more. A restart in that gap ends the run in STOP with the verified apply already on disk. The verification itself held: the start time matched at both checks around the snapshot. Fixing it needs that file, which this brief excludes.
- **Stale wording:** the entry file's header still calls the binding read the last step before the guards. One SF-7 test title says the same; I left it unchanged so test names stay comparable across runs.
- **Also open:** I-b, SF-1 to SF-6, B1, B2, box 3 and any shared apply.

No commands touched Docker, a database, SQL, the network or the runner. Nothing was staged or committed, and GOALS, status and ACCEPTANCE are untouched. Both 10:05 and 11:05 review reports are unedited.

Files are in `scripts/backend/` and `docs/plan/runs/MB-1/`:
- `mb1-replay-live.mjs`
- `mb1-replay-shared.mjs`
- `mb1-replay-sf7d.test.mjs` (new)
- expectations only: the `sf7`, `sf7b`, `sf7c`, `phase1f`, `phase1g` and `plan` test files
- `sf7d.md` (new)
- `checkpoint.md`
- `handoff.md`
- `sf7c.md` (a one-line pointer to this phase)

```
GOAL: MB-1
BRANCH: codex/mb1-identity
HEAD: 2a95726 (uncommitted working tree; nothing staged or committed)
HANDOFF: docs/plan/runs/MB-1/handoff.md
BOXES: 0/4 Done-when boxes met
STATUS: blocked
NOTES: SF-7d fixed review 1105Z L1 and L2 test-first (RED 15/37 as intended, GREEN 37/37); single full run 307/308, the scope-header failure fixed and its file rerun 3/3, a full green on the final bytes not shown; mutations and hashes UNRUN, date denied; M1 and the entry's after-write window open; fresh independent review of SF-7d next.
```