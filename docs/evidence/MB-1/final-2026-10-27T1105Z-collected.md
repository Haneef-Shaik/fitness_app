I found no critical, high or new medium finding in SF-7c. The proven-ID start-time check does what sf7c.md says. The same-ID restart window you asked about is real, but it is **Low**: it can't redirect the write, and it is caught and fails closed, though only after `migration up`. The carried M1 medium is still open and unchanged. Nothing is Done and no Done-when box is met.

**Findings: C0 · H0 · M1 carried · L2 new · 3 informational**

## M1 · Medium · carried, unchanged
SF-7c doesn't touch it. Nothing yet proves that Docker's reads and the TCP write to 127.0.0.1:55322 reach the same Postgres. The fix is still the read-only live read (R0–R17), then a listener and endpoint rule. No `docs/evidence/MB-1/m1-live-read-*` file exists, so the plan has not been executed.

## L1 · Low · new: a same-ID restart just before `migration up` is caught only after the write
- **Location:** `mb1-replay-shared.mjs:126-139`, with `mb1-replay-binding.mjs:59` and `mb1-replay.mjs:149-152`.
- **Defect:**
  - The start-time check runs once, at `mb1-replay-live.mjs:127`. Four child processes then run before `migration up`: the fresh snapshot, the staged `status`, the route proof's `migration list` and the second binding read.
  - The second binding read compares the container ID, name, label and published ports, not the start time.
  - The control test pins this today: `mb1-replay-sf7c.test.mjs:103` expects no `inspect-id` after the second `binding`, and it passed in my run.
- **Failure scenario** (traced by reading, not executed):
  1. A Docker Desktop restart or a Postgres crash restarts the container during the route proof. The ID, mounts, label and ports stay the same.
  2. The binding still matches. The attempt is recorded and `migration up` writes.
  3. The after snapshot reads the same container by ID and matches. `state.json` is written with `sharedApplied: true`.
  4. Only then does the start-time check in `finally` STOP. Every later 55321 command is refused.
- **Why it is Low:**
  - It is the same container, data and published ports. Port 55322 can't be taken over by a restart: Docker can't re-bind a taken port, and a stopped container fails the binding check. That attack is M1's listener gap.
  - It fails closed.
  - It can't be reached today: §6 is not authorized and `sharedApplyNeeds` still blocks.
  - So it is not material for accepting SF-7c. It is worth closing before any `shared-apply` authorization.
- **Smallest test-first fix:**
  - **RED first:** in a new test, set `w.shared = RESTARTED` during each of `onStatus`, `onList` and the second `onBinding`, then a stopped container (`false …`). Each must refuse with the `AFTER_APPLY` message, with:
    - `kinds` ending `'binding', 'inspect-id', 'inspect'`;
    - `state.json` byte-equal, meaning no attempt and no `sharedApplied`;
    - no `migration up` call.

    Today these fail because `migration up` runs and an attempt is recorded.
  - **The control:** passing applies expect `… 'binding', 'inspect-id', 'migration up', …`. Keep the refusal expectations in `sf7`/`sf7b` (`BEFORE_UP`) ending at `'binding'`, and add a separate list for the passing paths.
  - **GREEN:**
    - export `provenStarted` from `live.mjs`; the scope test doesn't pin internal exports, so it needs no change;
    - add `await provenStarted(ctx, container);` right after `shared.mjs:135`, so the ID inspect is the last child process;
    - there is still no `await` between the final guards, the attempt record and the spawn.
  - **Planned mutation (unrun):** delete that call; the new tests should then fail because `migration up` runs.

## L2 · Low · new: a run that ends in STOP can still record `sharedApplied: true`
- **Location:** `mb1-replay-shared.mjs:158-164` with `mb1-replay.mjs:149-152`.
- **Defect:**
  - In L1's scenario, and also when the restart happens during `migration up` (which no pre-check can catch), the state is written before the STOP in `finally`.
  - `state.json` then says "verified apply" (`order.mjs:98`), even though the command exited 1 with a STOP.
  - The STOP itself is not recorded; only the start-time mismatch keeps later commands refused.
  - No test covers this path.
- **Failure scenario:** the coordinator's incident review (SF-2's path, not yet written) reads a "verified apply" for a run that ended in STOP.
- **Fix (optional, same phase):**
  - **The RED test:** in `onMigrate`, set `w.shared = RESTARTED` and leave the binding unchanged. Expect a `# STOP: after migration up: …` line, `sharedApplied` false, no `55321-after` entry, and the attempt recorded.
  - **GREEN:** right after `shared.mjs:158`, add `try { await provenStarted(ctx, container); } catch (error) { return stop(\`after migration up: ${reason(error)}\`); }`.
  - Give `provenStarted` a consequence argument, as `sharedBinding` already has.
  - The SF-7b L2 "late" test changes: it would now STOP at the ID inspect (`absent`).

## Informational
- **I-a:** In `shared-apply`, the ID check's own refusal message is replaced by the `finally` STOP text. You disclosed this in sf7c.md §2. Nothing is applied either way, and `state.json` shows no attempt.
- **I-b:** `shared-snapshot` and `shared-suite` don't recheck the start time when they finish. A restart after the ID check is caught by the next command, but `shared-suite` may be the last one run. This predates SF-7c.
- **I-c:** The gap you disclosed between the ID inspect and the exec is acceptable. A recreate fails the exec by ID, and a restart that keeps the ID still reads the same container.

## What I checked
**Executed:**
- **Git status, before and after:** the same 30 untracked MB-1 entries both times, and no tracked file modified, so GOALS, status and ACCEPTANCE are unchanged.
- **`node --version`:** v22.23.1.
- **The full pure suite, once,** on the 19 files named explicitly:
  - TAP went to `/tmp/fitlog-mb1-sf7c-review-final.tap`, a new file and my only write;
  - result: `1..155`, `# tests 304`, `# pass 304`, `# fail 0`, cancelled, skipped and todo all 0;
  - the three SF-7c tests are `ok 115`–`117`.

**Inspected by reading:**
- **Side effects, checked before the run:**
  - every write goes into a mkdtemp sandbox, including the planted `${REPO_ROOT}` paths;
  - fetch is replaced by doubles that throw;
  - the only real child processes are temporary node scripts, git in scratch repositories, and `check-sql-sources` on this repository, which runs read-only git only;
  - every entry point is guarded by `invokedDirectly`.
- **The guard:**
  - no child process runs between the binding and the ID check (`live.mjs:126-127`);
  - every failure refuses: no such container, a timeout, an unexpected value;
  - replay commands inspect by name only (`guards.test:137`);
  - your mutation predictions look sound.
- **Mutations not run:**
  - `/private/tmp/fitlog-mb1-sf7b` holds only the README and seven reports, with no `tree/`;
  - there is no `sf7b-` or `sf7c-mutations` directory;
  - so SF-7b's eight and SF-7c's four are UNRUN.
- **Gates still open:**
  - every Done-when row in handoff.md says "no", and GOALS.md:563-566 are unticked;
  - `sharedApplyMissing` still gates the apply;
  - SF-1 to SF-6, B1, B2 and box 3 as a whole stay open.
- **Privacy:** the candidate is one restrictive `alter policy` (owner read plus `member_active()`), so no staff path to health data opens. That satisfies the PRD §16.1 / ADR003 override.

**Inherited, not re-run:** your RED 17/42, GREEN 42/42 and 304 final runs; the hashes in sf7c.md §5; and the replay's `state.json` from attempt 8, which I didn't open.

**Not run:**
- **Denied:** `rtk proxy ls -la` and `rtk proxy sha256sum`. I didn't retry either or replace it with another tool, so this review is bound by reading, not by hash.
- **Not needed:** QA-9 phase 3N G1–G7, because I ran no `backend:test`.
- **Out of scope:** Docker, the database, SQL, Supabase, the network, the replay and the runner. Nothing was written to the repo, staged or committed, and the raw finals are untouched.

## Next bounded phase
1. **SF-7d, pure test-first code with fixtures only:** fix L1, with L2 optional, as above. Then run the full pure suite once. Run the planned mutation only if you explicitly authorize a scratch tree.
2. **Then, separately,** the read-only M1 live read (R0–R17) under its own authorization and database window, followed by the pure listener and endpoint rule.

Neither step authorizes a shared apply.

```
GOAL: MB-1 · REVIEW: SF-7c independent review (read-only)
HEAD: 2a95726 (uncommitted tree unchanged; nothing staged or committed)
FINDINGS: C0 H0 M1 (carried) L2 (new) I3
TESTS: executed once, Node v22.23.1: 1..155, 304/304
STATUS: SF-7c acceptable for code; not Done; 0/4 boxes
```