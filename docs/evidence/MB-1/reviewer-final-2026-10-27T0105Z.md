I found nothing critical, high or medium. The four `phase2-3` evidence files agree with each other, with the before snapshot and with the parsers that produced them. The "what changed" claim holds exactly. An M1/M2/M3 restore phase is safe to authorize under the conditions below. Two lows are records and process issues, not safety defects.

Bash was denied in this session, so I computed no hashes and ran no tests, including the pure backend tests. Everything below comes from reading files.

## Findings

**1. Low: the secret-scan result is now out of date (two hits, not one)**
- **Location:** `docs/evidence/MB-1/implementer-final-2026-10-27T0035Z.md:23` and `reviewer-final-2026-10-27T0005Z.md:106`. The out-of-date claim of one hit is in `handoff.md:33`, `checkpoint.md:34-36` and `phase2.md:118-125`.
- **The defect:** the §8 patterns, outside the existing 39fe1fb5 exclusion, now match two lines. The implementer's own report also quotes `sb_secret_fixture-must-never-print-0001`. It was written after the 00:08:08Z scan, so "one line" was only true at scan time. The literal is the committed fake (`mb1-replay.test.mjs:40`, `mb1-replay-evidence.test.mjs:17`), not a key.
- **Failure scenario:** the coordinator excludes only the review copy, as recorded, and §8's "must print nothing" still fails before commit. The likely pressure is then to widen the glob, which is the broad suppression to avoid.
- **Fix:** the narrow exclusion below covers both lines.

**2. Low (process): a refused command still writes its evidence file, and suites must be 75 s apart**
- **Location:** `mb1-replay.mjs:792-793` (evidence is written on refusal) and `mb1-replay-order.mjs:10-16` (spacing).
- **The defect:** in an M phase, each suite follows a restore, a snapshot, a mutate and another snapshot, which may finish in under 75 s. The spacing refusal happens before any write, but it still writes `phase2-4-mN-suite.txt`. That uses up the evidence name, and under "any refusal stops the phase" it ends the phase.
- **Fix:** add an explicit time gate before each suite (G below).

Informational, not repeated as findings:
- `phase2-plan.md:5` and `:214` are behind the code. The §4 M2 row still opens with "`banned`: refused … review owed". The authorization for the next phase should state the current M2 rule itself.
- The four assigned design lows are not on the M-phase path:
  - low 1 and low 2 concern a STOP recorded after `migrate`, `diff` or `lint`, and none of those runs in an M phase;
  - low 3 doesn't apply, because `mutate` and `snapshot` read their pinned SQL into memory once and send it on stdin;
  - low 4 doesn't apply, because nothing edits the runner.

## What I established independently vs. what the implementer claims

**Independent (read-only):**
- **Before and after snapshots, compared by hand:**
  - P1 is byte-identical, `fn_definition_md5` `e446cfc1…` included.
  - `profile_update` is identical.
  - P3 rows 1–15 are identical, each `statements_md5` included.
  - The only P2 change is `profile_read.qual`, from `(id = ( SELECT auth.uid() AS uid))` to `… AND ( SELECT private.member_active() …)`.
  - One P3 row was added, `20261026040045`.
  - `diffSnapshots` and `SNAPSHOT_RULES.after` (`mb1-replay-evidence.mjs:446-457`) produce exactly evidence line 22.
- **GREEN parses as met:**
  - The 27 check names match `IDENTITY_CHECKS` in order, 14 before the ban line and 13 after.
  - `user_banned` classifies as `banned`, which equals the reference.
  - The summary prefix matches, and there are no unexpected lines.
- **GREEN is not vacuous:** `noRows` requires exactly `HTTP 200` and `[]` (`verify-identity.mjs:41`). RED had those five checks at `HTTP 200, 1 row(s)`, so the flip is a real change.
- **`migrate` output order:** stdout is rendered before stderr (`:98`). That explains why "up to date" prints before "Applying".
- **The withheld lines can't hide another migration:**
  - `appliedMigrations` reads the raw output (`mb1-replay.mjs:435-438`), so a withheld line cannot hide an `Applying` line.
  - The after snapshot binds P3 to exactly 16 rows.
  - The steady count of 2, also seen in `migrations-2`, fits the CLI's two-line update notice. That part is inference only.
- **File counts:** 24 pinned files is the 23 at prepare plus the candidate.
- **55321's container did not restart around `migrate`:** a failed `sharedUnchanged` check after a lifecycle command would replace exit 0 with a refusal, and the evidence shows exit 0.
- **Hashes are consistent across the records:** all 12 FINAL hashes in `handoff.md` and phase2 A5.4 equal phase1i §6 "after". The candidate hash equals `CANDIDATE_SHA256` (`evidence.mjs:21`) and the `add-candidate` output.
- **Timestamps:** the epoch-ms values match the ISO times (00:07:00.610Z, 00:07:20.652Z, 16:41:13Z, 18:05:45Z).
- **The restore and mutation SQL:**
  - `member_active()` is defined only in `member_core.sql:24-31`, so `restore-member-active` reproduces the live definition.
  - Each swap in `mutationSql` matches exactly once.
  - M2 removes only the ban clause, and M3 only widens `status`.
- **Secret shapes:** the four new runner files match no JWT, `postgres(ql)://` or URL-with-password shape.

**The implementer's word only:**
- Every sha256 value, including the four CLI files and the four evidence files. Neither the 0005Z review nor I took any. Only the candidate's bytes are corroborated independently, by the 0005Z pin test and the runner refusing any other bytes.
- 282/282 tests and the nine `node --check` runs in this attempt.
- The contents of `state.json` and the absence of a lock. I did not open the replay directory.
- That the jobs exited 0 and were never signalled. This is consistent with each file's `exit 0` line.
- The exclusive-writer condition.
- That `ddcb1b5c…` is the md5 of the candidate's statement. A mismatch would fail closed later, because 55321's after snapshot must equal it.

## Exact boundaries

The claims are not overstated.
- **Measured:** "only `profile_read.qual` plus the migration changed" holds for the P1–P3 scope that the snapshot measures.
- **Inferred:** outside P1–P3 it holds only because one pinned, single-statement file ran under a single writer.
- **Not measured:** GREEN under `banned` doesn't show which clause refused the banned read; M2 exists for that.
- **Not met:** box 3 and the goal. No Done is claimed.

## B1, B2 and the 55321 apply

- **B1 is open in the source.** `gym_role()` calls `member_active()`, but the `user_id=auth.uid()` / `linked_user_id=auth.uid()` branches do not. They are in `role_read`, `register_read` and `plans_read` (`gym_operations.sql:107-109`) and `gym_read` (`gym_command_guards.sql:2`).
- **B2 is open.** Nothing in this phase changed the contract.
- **`shared-apply` is blocked by the code itself.** `sharedApplyNeeds` still lacks suites m1, m2 and m3, a generation 2 green, a clean generation 2 diff and lint, images, and the 55321-before snapshot. It also needs its own `--confirm` token and has no authorization. Even after the M phase, five of those would still be missing.

## Is the M1/M2/M3 restore phase safe?

**Yes**, if the 16 hashes are unchanged and one writer is recorded:
- **Replay only:** `mutate` sends only pinned SQL, in one transaction, to the replay container by name (`:265`, `:461`).
- **Read-only snapshots:** each is pinned to the reviewed constant, with the session default set to read-only.
- **Suite target:** the suite refuses unless the replay's status answers at 56421 (`verify-identity.mjs:31`).
- **Fail-closed outcome:** M2 under `banned` passes only on its exact kill. Any `ok` on the banned check records `m2Stopped`, which blocks `shared-apply` on this replay but nothing else.
- **Health data:** M3 widening `member_active()` touches fixture users on the disposable replay only. It opens no path for staff to reach health data (PRD §16.1).

**Proposed commands (not executed).** `MB1` is `rtk proxy node scripts/backend/mb1-replay.mjs`. Run each as a background job with no tool timeout, one at a time, never signalled.

```
P0  rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ
P1  rtk proxy sha256sum <the 12 FINAL files + 4 CLI files>   → all equal handoff.md:112-126
P2  Grep "version" in both CLI package.json                   → 2.121.0
P3  rtk proxy node --check scripts/backend/<file>   ×9
P4  rtk proxy node --test scripts/backend/*.test.mjs          → 1..133, # tests 282, # pass 282, # fail 0
P5  Read state.json; Glob .fitlog-mb1-replay.lock            → candidate applied, active null, mutations [], ban "banned",
                                                                no stopRecorded/m2Stopped/sharedApplyAttempted, no lock
P6  Record the exclusive writer in checkpoint.md (before the first runner command)

G   Before every suite: now − last suites[].endedAt ≥ 90 s (rtk proxy date -u +%s vs state.json)

M1.1 MB1 mutate   /tmp/fitlog-mb1-replay-20261026 m1        --evidence phase2-4-m1-apply     sql/m1.sql 5bc259c9…836fb; ALTER POLICY; exit 0
M1.2 MB1 snapshot /tmp/fitlog-mb1-replay-20261026 m1        --evidence phase2-4-m1-proof     "changes from after: P2.profile_read.qual"
M1.3 G; MB1 suite /tmp/fitlog-mb1-replay-20261026 m1        --evidence phase2-4-m1-suite     RED's five, each "  HTTP 200, 1 row(s)"; banned; m1 met
M1.4 MB1 mutate   /tmp/fitlog-mb1-replay-20261026 restore-m1 --evidence phase2-4-m1-restore  candidate ac262f39…bdc3; ALTER POLICY
M1.5 MB1 snapshot /tmp/fitlog-mb1-replay-20261026 restored  --evidence phase2-4-m1-restored  "no rule broken" with no "changes" clause
M2.1 MB1 mutate   … m2                    --evidence phase2-4-m2-apply     sql/m2.sql 295f7ad8…57c740; CREATE FUNCTION
M2.2 MB1 snapshot … m2                    --evidence phase2-4-m2-proof     "changes from after: P1.fn_definition_md5"
M2.3 G; MB1 suite … m2                    --evidence phase2-4-m2-suite     only "a banned account reads no profile", HTTP 200, 1 row(s);
                                                                           "1 of 27 …"; banned; m2 met
M2.4 MB1 mutate   … restore-member-active --evidence phase2-4-m2-restore   37d4e00b…41c904
M2.5 MB1 snapshot … restored              --evidence phase2-4-m2-restored  fn_definition_md5 back to e446cfc1…
M3.1 MB1 mutate   … m3                    --evidence phase2-4-m3-apply     sql/m3.sql 16a9542b…ddbb50
M3.2 MB1 snapshot … m3                    --evidence phase2-4-m3-proof     "changes from after: P1.fn_definition_md5"
M3.3 G; MB1 suite … m3                    --evidence phase2-4-m3-suite     only "a deletion-pending account reads no profile"; m3 met
M3.4 MB1 mutate   … restore-member-active --evidence phase2-4-m3-restore
M3.5 MB1 snapshot … restored              --evidence phase2-4-m3-restored  no changes; e446cfc1…
F.1  G; MB1 suite … green                 --evidence phase2-4-green        27 ok, banned, green met
F.2  Repeat P1 and P5; the §8 scan with the agreed exclusion; date
```

Every `…` in a command stands for the literal `/tmp/fitlog-mb1-replay-20261026`. The block boundaries (M1, M2, M3 plus F) are where you can split the authorization. Plan order is M1, M2, M3. The runner doesn't enforce that order.

**When to stop:**
- **Stop at once, no retry:** any `mb1-replay refused:`, `STOP:`, `# problem:` or `NOT met` line, or a runner exit other than 0.
- **Decide one contingency up front:** if an Mi suite fails or M2 stops after that Mi's proof snapshot passed, allow only that Mi's restore and `snapshot restored`, then stop.
- **No further write:** if `mutate` or a proof snapshot fails, the replay's state is unknown.
- **Never in this phase:**
  - `snapshot before` or `snapshot after`;
  - `add-candidate`, `migrate` or `migrations`;
  - `diff`, `lint` or `images`;
  - `start`, `stop`, `teardown` or `retain`;
  - any `shared-*`;
  - a raw CLI, psql or Docker command;
  - an edit to `state.json` or the lock.

## The narrow scan exclusion

- **Recommended: allow exact hits, with no new glob.** Keep §8's command unchanged and document that it may print exactly these two lines and nothing else. Each must be the committed fake, and each file must still match its recorded hash:
  - `reviewer-final-2026-10-27T0005Z.md:106`, sha256 `cef2fc2d…7f08`;
  - `implementer-final-2026-10-27T0035Z.md:23`, whose hash still needs recording.
- **Add a token check:** `rtk proxy rg -n -o -e 'sb_secret_[A-Za-z0-9_-]*' --glob '!review-39fe1fb5-final.md' docs/evidence/MB-1` must print exactly those two lines, each ending `:sb_secret_fixture-must-never-print-0001`.
- **Fallback, following the 39fe1fb5 precedent:** a glob for that single file name, tied to its hash, with the line and literal documented.
- **Never:** a wildcard glob (`!*review*`, `!implementer-*`), dropping the `sb_secret_` pattern, or any other weakening of the patterns.
- **Outside §8:** the same literal is in three run docs that §8 doesn't scan. They add no new kind of hit beyond the two test files.
