# M1 attempt 6: read-only security review of the evidence

**Verdict:** I found nothing critical, high or medium. Two new lows, neither blocking the next phase. The six `phase2-4-m1-*` files support every M1 expectation: M1 was met, its restore was proved, and GREEN came back with 27 ok under the reference ban answer `banned`. This is partial `profile_read` evidence on the disposable replay only. It is not box 3 (still unchecked at `docs/plan/GOALS.md:565`), not the goal, and says nothing about 55321; B1 and B2 stay open. I make no Done claim.

**Policy applied:** PRD §16.1 and frozen 003 override the stale consent rule (I17) in my instructions. Gym staff never read or write private health data, whatever the consent.

## Findings

**1. Low: M2's durable stop can be lost on a failed state write (same mechanism as review 0005Z low 1, now on the M path)**
- **Location:** `scripts/backend/mb1-replay.mjs:489-498`, `:745`, `:779-788`.
  - `:489-498`: the stop is decided, but `m2Stopped` exists only in the state the function returns.
  - `:745`: the single `state.json` write.
  - `:779-788`: a write error becomes an ordinary refusal, and `releaseHeld` frees the lock.
- **The defect:** review 0105Z judged low 1 to be off the M path, because it only concerns a STOP after `migrate`, `diff` or `lint`. But `m2Stopped` is also a durable stop, and it goes through the same write. If that write fails (ENOSPC or EACCES):
  - the `# STOP:` line survives only in stdout;
  - the lock is released;
  - `state.json` keeps `active m2`, `proven m2` and no M2 suite entry.
- **Failure scenario:**
  1. An M2 run comes back unkilled, and `/tmp` is full at the write. The evidence write at `:793` may fail too.
  2. `suiteNeeds` (`mb1-replay-order.mjs:72-76`) now allows another `suite m2`.
  3. If GoTrue's handling of the banned session differs between runs, a later exact kill is recorded as M2's pass.
  4. That defeats phase 1H's "first pass or first stop counts", and `sharedApplyNeeds` no longer counts M2 as missing.

  It needs a local write failure plus an overlooked STOP line. "Any STOP stops the phase" and shared-apply's separate authorization still hold.
- **Fix:**
  - Now, with no code: add the post-suite check under "M2 block" below.
  - In the split-first phase: extend low 1's fix to any result that carries `m2Stopped` (keep the lock, and print a STOP naming both failures). Add a test that injects a failing state write after an unkilled M2 run.

**2. Low: the pure test does not pin the generated mutation SQL's exact text**
- **Location:** test `scripts/backend/mb1-replay-evidence.test.mjs:687-703`; generator `mb1-replay-evidence.mjs:588-597`.
- **The defect:** for m2.sql the test asserts only that one line changed and that `banned_until` is gone. A regressed swap literal that also dropped `and u.deleted_at is null` (same line) would pass.
- **Failure scenario:** on a future replay (B1's, or M2b's), a broader M2 still shows only `P1.fn_definition_md5` in its proof snapshot. The claim "only the ban clause was removed" would then rest on text nothing checks.
  - This replay is not affected. I read its pinned `sql/m2.sql` (prepare pin `295f7ad8…c740`): it removes exactly the ban clause.
- **Fix:** in the split-first phase, assert the exact text (or sha256) of all four generated files against the committed `member_core.sql` and candidate.

**Informational only:**
- `recordSnapshot` keys snapshots by label (`mb1-replay.mjs:296`), so the next restore overwrites M1's `restored` entry in `state.json`.
  - M1's durable restore proof is `phase2-4-m1-restored.txt` (`518acf3f…342d`).
  - No gate reads old restored snapshots, so nothing is weakened.
- Evidence files carry no run time or nonce, so GREEN being byte-identical across attempts 5 and 6 is expected. Each run is tied to its file only by its `state.json` suite entry and the runner's create-only (`wx`) write.
  - The two GREEN entries end at `1793059640652` and `1793063274142`.
- §8's literal `rg` command has never run in any recorded attempt; the Grep tool (the same engine) was used instead. Before a commit, either run the literal command once or record that the equivalence is accepted.

## What the attempt 6 evidence shows

**Executed by me (read-only or pure):**

| Check | Result |
|---|---|
| sha256, one command, 33 paths | The 12 FINAL and 4 CLI files equal handoff.md:132-146. The six M1 files equal handoff.md:147-152. Both GREENs are `8d94be72…6d05`; `phase2-3-after` is `fd61308c…`; the three §8 hit files are `cef2fc2d…`, `fb019b3a…` and `34df6934…`; `phase2-plan`, `phase2` and `checkpoint` equal their handoff values |
| Hashes not recorded anywhere yet | 0135Z is `c5f39490ad1a427a1329e9e0d5e7fa6ca34d9cf77e820061a4e98c20ca135d7f`. `handoff.md` is `5b2bf9e9…` (it cannot record its own hash) |
| `member_core.sql` | `f920e116…`, equal to prepare line 5 |
| `rtk proxy node --test scripts/backend/*.test.mjs` | `1..133`, `# tests 282`, `# pass 282`, `# fail 0`. The run loaded all nine `node --check` files (four run, five imported); `node --check` itself was not run |
| Re-hash of the 12 FINAL files after the tests | All unchanged |
| Read `state.json`; Glob for the lock | Shown under "State, lock and halt"; no lock |
| Grep scans | Shown under "Secret-scan inventory" |

**Inspected by hand (`diff` was denied, so I compared line by line with Read, plus Grep counts and the `state.json` objects):**
- **Proof vs `after`:** the only difference is `P2.profile_read.qual`, now `(id = ( SELECT auth.uid() AS uid))`, byte-equal to `before`.
  - P1, including `fn_definition_md5 e446cfc1…`, is identical, and so is `profile_update`.
  - All 16 P3 rows are identical, including `ddcb1b5c…`.
  - `SNAPSHOT_RULES.m1` requires exactly that change.
- **Restored vs `after`:** identical except the trailer line, with no `changes` clause.
- **Apply:** `m1.sql 5bc259c9…`, equal to prepare line 21.
- **Restore:** `ac262f39…bdc3`, which is `CANDIDATE_SHA256` and the repository file's current hash. `restore-m1` maps to the candidate (`:79`), and `pinned()` enforces the manifest hash (`:258-262`).
- **M1 suite:** 22 ok and 5 not ok, each followed by `HTTP 200, 1 row(s)` (10 such lines, the same count as RED-2).
  - Lines 1-36 equal `phase2-2-red-2.txt`. Only the verdict word and phase 1G's banNote wording differ.
  - The verdict is mechanical: exact names, exact detail, exact summary, exit 1, and a ban answer equal to the reference.
- **No bad lines in any of the six files:** no `STOP`, `# problem`, `NOT met` or setup/cleanup line. The only "refused" is the summary word in GREEN, and both mutate files show 0 lines withheld.

**Inherited, not verifiable from here:**
- the six jobs ran in the background, were never signalled and exited 0 (consistent with each file's exit line);
- the exclusive-writer record and its timing;
- the gate readings themselves (I checked their arithmetic, not the readings);
- 55321 untouched, and the replay still running (no Docker);
- `state.json` before the run;
- the 12 patch hashes, review 2305Z, `phase2-3-add` and `-migrate`, and `phase1i.md`.

**State, lock and halt (read just now):**
- generation 1; candidate `applied`; active `null`; proven `null`; restoredProof `true`; mutations `["m1"]`; ban `banned`; sharedApplied `false`; `checks {}`;
- snapshots: `before` `1793032873158` and `after` `1793059620610`, both unchanged; `m1` `1793063157060`; `restored` `1793063210760`;
- five suites: red `false`/`null`; red `true`/`banned`; green `true`/`banned`; m1 `true`/`banned` ending `1793063175011`; green `true`/`banned` ending `1793063274142`;
- no `stopRecorded`, `m2Stopped` or `sharedApplyAttempted`. No lock file.

**Suite spacing:**
- **Gate before the M1 suite:** 1793063168 − 1793059640.652 = 3527.35 s.
- **Gate before GREEN:** readings at 43.99, 67.99, 78.99, 80.99 and 84.99 s, each followed by a wait; then 91.99 s, and GREEN ran. `date +%s` truncates, so the real elapsed time was at least the reading.
- **Between end times:** 3534.36 s, then 99.13 s.
- The runner's own 75 s floor held both times. All epoch values convert to ISO times consistent with the transcript's clock readings.

## Secret-scan inventory (§8)

Executed with the Grep tool, using §8's five patterns and its single exclusion:
- **Five lines in three files**, exactly the five rows: 0005Z:106, 0035Z:23, and 0105Z:9, :140 and :142. Each file's sha256 is equal to its row.
- **Token check:** six tokens, four full fixture literals and two bare prefixes, as recorded.
- **Excluded file:** hits only at lines 65, 68 and 74, as §8 says.
- **0135Z adds no hit.** Its phrase "the bare prefix in prose" describes the prefix without spelling it.
- **The six M1 files:** clean on a wider pass (JWT shapes, Postgres URLs, a URL with a password, any Supabase key prefix, service-role, apikey, Bearer).

**Inventory changes needed:** none to the five rows. Records only:
1. Add 0135Z's sha256 (above) to the next handoff hash table as a clean report copy. A clean file needs no §8 row.
2. This review spells neither the fixture literal nor any of the five patterns. If it is saved into `docs/evidence/MB-1`, rerun §8 afterwards; the output should be unchanged. If it differs, add an exact row before any commit, never a glob.
3. Outside §8's scope, the fake literal also appears in `phase2-plan.md` (9 times), `phase2.md` (2) and `checkpoint.md` (1), and in earlier AR-1 and QA-1 evidence. The repository has no secret-scanner config. This is harmless.

## M2 plan: nonvacuous as coded

- **SQL:**
  - The pinned `m2.sql` (read) is `member_core.sql:24-31` with only the `banned_until` clause removed. The status, `deleted_at`, confirmation and session clauses are intact.
  - Only `member_core.sql` defines `member_active()`.
  - `restore-member-active.sql` (read) is the original definition, `37d4e00b…c904`.
  - `CREATE FUNCTION` is on the psql allowlist (`evidence.mjs:61`).
- **Gate:** `mutateNeeds` allows `m2` only under `live` or `banned` (the reference is `banned`), with no mutation active, the last restore proved, and only once.
- **Verdict:** M2 holds only when:
  - all 27 checks ran in order;
  - exactly `a banned account reads no profile` failed, with `HTTP 200, 1 row(s)`;
  - the suite exited 1, the summary is exact, and the ban answer equals `banned`.

  Any run that prints the banned check `ok` (27 ok, partial or withheld) adds `M2_UNKILLED` and the STOP line and records `m2Stopped`. After that, `suiteNeeds` refuses `suite m2` and `sharedApplyNeeds` blocks shared-apply on this replay for good.
- **Why a kill is real evidence:** `profile_read` is the only SELECT policy on `profiles` (the P2 rule enforces exactly two policies). Under M2, one row back for member C means `member_active()` returned true, so member C's session row existed. So in GREEN, the ban clause alone refused that read.
- **Tests:** `evidence.test.mjs:337-390` cover the kill, the 27-ok stop, a wrong detail line, an extra failure, and `ended` failing closed. They passed in this run.
- **Policy:** M2 and M3 change only `member_active()`, on the disposable replay. `gym_role()` (`gym_operations.sql:14`) calls it, but it guards only gym operational tables; owner-only personal tables key on `owner_id=auth.uid()`. No grant or policy is added, so no staff path to private health data opens.

## Inherited lows, mapped to the MB-1 split-first design and refactor phase

| # | Low (source) | Disposition |
|---|---|---|
| SF-0 | Runner at 798 of 800 lines, test file at 2210 (0005Z L4; phase1i §8.6, §8.7) | The first step: split with no behaviour change. The 282 tests must still pass, and the 11 phase 1I mutations must be regenerated for the new layout, checked with `git apply --check` (closes §8.8) and still killed |
| SF-1 | A STOP is lost if the state write fails, and the lock is released (0005Z L1), plus finding 1 here | Keep the lock and print a STOP when a result carries `stopRecorded` or `m2Stopped`; print `renderRun` after `stopAfter` |
| SF-2 | No written way to clear `stopRecorded`; the halt also blocks `stop`, `teardown` and `shared-snapshot before` (0005Z L2; §8.3) | A written procedure, and a decision on which read-only commands are exempt from the halt |
| SF-3 | Rechecks compare content hashes only; no recheck after `start`, `migrations` or `stop` (2305Z F3; 0005Z L3; §8.1-2, §8.5) | `lstat` `ino` and `ctimeNs` under the lock, plus a re-hash per entry during teardown. The single-writer condition stands until this is reviewed |
| SF-4 | A refused suite still uses up its evidence name; the runner spaces suites 75 s apart, the coordinator 90 s (0105Z L2) | Closed as a procedure for now. Code change: write no evidence for a refusal before the run, or align the spacing |
| SF-5 | Mutation SQL text not pinned (finding 2 here) | Pin the exact text or hash |
| SF-6 | Evidence files carry no run time (informational) | Optional run-time line in each file |
| — | The after-`diff`/`lint` recheck has not been seen on a real CLI (§8.4) | Cannot be closed in pure code: it is observed at §5, after SF. SF must keep its tests |
| — | The §8 scan record (0105Z L1) | Closed; I verified it by running the scan here |
| — | The §4 M2 row in `phase2-plan.md` still carries its history (informational) | A doc update in the SF phase; until then the M2 rule is stated in M2's own authorization |
| — | Scratch files `/tmp/fitlog-mb1-phase1i-*.txt` (§8.9) | Housekeeping for the coordinator, not code |
| — | Owed code-reviewer, security-reviewer and tdd-guide passes | The SF phase's fresh independent review |

## Next bounded phase

**I recommend the M3 block next, then M2 in its own phase.** Neither is blocked, and swapping the order is equally safe. Running M2 first only learns its uncertain result sooner; if it stops, the M2b design could join SF. SF must come before §5 and before any runner edit, but not before M3 or M2.

**M3 block.** First, the pre-flight checks:
- the 16 hashes are equal, and both CLI `package.json` files read `2.121.0`;
- 282 of 282 tests pass, or the nine `node --check` runs succeed;
- `state.json` matches the state above exactly, and there is no lock;
- every `phase2-4-m3-*` evidence name is new;
- the exclusive writer is recorded before the first runner command.

Then, each command a background job with no tool timeout, never signalled, one at a time:
1. `mutate m3 --evidence phase2-4-m3-apply`: expect `16a9542b90971163d930fed68e5f14be2bce2a549014695479d583626cddbb50`, `CREATE FUNCTION`, 0 lines withheld.
2. `snapshot m3 --evidence phase2-4-m3-proof`: the only change from `after` is `P1.fn_definition_md5`, and the new value is not `e446cfc1…`.
3. The 90 s gate, then `suite m3 --evidence phase2-4-m3-suite`. Expect:
   - only `a deletion-pending account reads no profile` fails, with `HTTP 200, 1 row(s)`;
   - the summary `1 of 27 identity checks failed: a deletion-pending account reads no profile`;
   - suite exit 1, `banned`, and `the m3 expectation is met`.
4. `mutate restore-member-active --evidence phase2-4-m3-restore`: expect `37d4e00b606283b69e3f99ab9d9203beedbe29b29363e1b56bf227205941c904`.
5. `snapshot restored --evidence phase2-4-m3-restored`: no `changes` clause, and `fn_definition_md5` back to `e446cfc1e224dec2a5439fef806a22cc`.
6. The 90 s gate, then `suite green --evidence phase2-4-m3-green`: 27 ok, `banned`. It should be byte-identical to `8d94be72…`; record any difference, and let the verdict decide.

**If something goes wrong:**
- If steps 1 and 2 pass but step 3 fails: run only steps 4 and 5, then stop, with no GREEN.
- If step 1 or 2 fails: run nothing more.
- Any refusal, `STOP:`, `# problem:`, `NOT met` or nonzero exit stops the phase, with no retry.

**After the run:**
- re-hash the 16 files;
- `state.json` shows mutations `["m1","m3"]` and active `null`, has no stop keys, and there is no lock;
- §8 equals the inventory.

**Not authorized in the M3 phase:** M2, §5–§7, any `shared-*`, raw CLI, SQL or Docker, edits to `state.json` or the lock, code or test edits, and git.

**M2 block (the phase after).** The same conditions apply, plus:
- The authorization states the M2 rule in its own text.
- The apply must print `m2.sql` hash `295f7ad8e7a01ddbaab707ea07f592510c1d061474389fada0f37d73d557c740`.
- The proof snapshot changes only `P1.fn_definition_md5`, and the new value differs from both `e446cfc1…` and M3's.
- The expected kill is exactly `a banned account reads no profile`, `HTTP 200, 1 row(s)`, with the summary `1 of 27 identity checks failed: a banned account reads no profile`.
- **The interim control for finding 1:** right after `suite m2`, read `state.json`. The last entry must be `m2`, generation 1, `banned`, and either:
  - `ok true` with no `m2Stopped`, for a kill; or
  - `m2Stopped true`, whenever the output carries the STOP line.

  Any mismatch, or a refusal naming a state or evidence write error, means M2 is stopped on this replay for good. Never rerun it there, and never edit the state by hand.
- On a STOP: run only the restore and `snapshot restored`, then stop. M2b follows, designed and reviewed separately.

## Permissions observed
- **Allowed:**
  - my first command, a compound `cd … && rtk proxy git status --short && rtk proxy git log --oneline -3`. It was read-only but went against the brief's "separate `rtk proxy` commands"; every later command was a single one;
  - `rtk proxy sha256sum` ×3 and `rtk proxy node --test` ×1;
  - Read, Glob and Grep on the repository and, read-only, on the replay's `state.json` and `sql/`.
- **Denied:** five compound `diff` and `cmp` commands, then one plain `rtk proxy diff`. I did not retry further; hashes, line-by-line Reads and Grep counts replaced them.
- **Untouched:** I made no edits, no git writes, and ran no runner, SQL, CLI, Docker, network or database command.
