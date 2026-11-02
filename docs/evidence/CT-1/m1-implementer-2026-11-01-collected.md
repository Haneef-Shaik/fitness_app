**COMPLETE.** M1 is fixed in source. The code is written, but none of its tests have been run, and no box or goal is claimed Done. I used only Read, Grep, Edit and Write. No tool call was denied.

**Changed files (these six only):**
- `scripts/content/seed.mjs`
- `scripts/content/seed.test.mjs`
- `scripts/content/verify-seed.mjs`
- `scripts/content/verify-seed.test.mjs`
- `docs/plan/runs/CT-1/handoff.md`
- `docs/plan/runs/CT-1/checkpoint.md`

**Design**
- **The seed (`seed.mjs:64-69`):** each record now starts with a check for any member-owned row that holds that id, at any version:
  `select m.version into member_version from public.exercises m where m.id = … and m.owner_id is not null order by m.version limit 1`.
  - It runs before the `(id, version)` lookup and before the insert.
  - If it finds a row, the seed stops with the existing error, `CT-1 seed: catalogue key % version % is held by a member-owned row` (errcode 23505). The error names the lowest version the member holds. The whole block is one statement, so nothing is written.
  - The old same-version member check is kept as a backstop.
  - Unchanged: the drift check, the skip of an identical row, the single insert with `owner_id` null, and the absence of `on conflict`.
  - The payload and its sha256 are unchanged. Only the statement text and one header comment line in the generated SQL differ.
- **The verifier (`verify-seed.mjs`):** a fourth run, `crossVersion`, wrapped in `begin` … `rollback` like the others.
  - It runs the setup SQL, plants a member row at `(PROBE_ID, 2)`, then runs the probe seed carrying `(PROBE_ID, 1)`.
  - It passes only if stderr contains the error for exactly `PROBE_ID` at version 2.
  - Run order: twice → conflict → crossVersion → drift.
  - The existing twice, conflict and drift runs, and how they are detected, are unchanged (L1 not touched).
  - The result line gains one clause for the new run.

**Regression cases written**
- `seed.test.mjs`, one new static test. It checks that there is exactly one id-wide member check, that it ignores the seed row's version, that it reports the member's version, that it comes after the loop start and before the `(id, version)` lookup and the insert, and that the backstop is still there.
- `verify-seed.test.mjs`, fake-runner tests:
  - The existing tests now expect four runs, each ending in rollback.
  - The cross-version run plants only version 2 and seeds the probe at version 1, after the synthetic member exists.
  - A cross-version run that exits 0 is reported. That is what the seed did before this fix.
  - Near-miss errors are rejected: the probe at version 1, another key at version 2, the probe at version 20, and the drift error.
  - A failure for another reason is reported in all three guard runs.
  - The result line is updated.
- The existing same-version conflict, seed-twice and drift cases are kept.

**Gates not run**
- Frozen install
- `node --test scripts/content/*.test.mjs`, including the new tests
- `build-seed.mjs check`
- Every mutation check, including new check 8 (delete the id-wide check, or limit it to one version)
- The database run of `verify-seed.mjs`, now four rolled-back transactions. You choose the target; I didn't change target selection.

**Unresolved issues**
- **Race:** if a member inserts the same id at another version while the seed is running, after the check but before the insert, the seed won't see it. A same-version insert is still caught, by the backstop or by the primary key. Closing this needs the member-side guard planned in MB-2 (QA-1 F-6), or a table lock. Both are out of scope here.
- **Already-claimed ids:** if a member already holds an id, the seed only stops. Recovering is a decision for whoever operates the database.
- **Still open:** M2 (your decision on band logging and the multiplier for unilateral exercises), M3 (adding these tests to `pnpm test` / `backend:test`), all of L1–L9 (not acted on), and every runtime and external gate.

The handoff and checkpoint record all of this. The handoff's own mutation note says that removing the old same-version backstop now turns only the static test red, because the new check catches that case too.
