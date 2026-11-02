## MB-1 attempt 7: read-only review of the M3 evidence and M2 readiness

I found nothing critical, high or medium, and one new low. The six `phase2-4-m3-*` files support every M3 expectation, and the replay is in the state Codex reported. M2 is not blocked, as long as its authorization includes the failure-path conditions C1–C7 below. This is partial evidence from the disposable replay only. Box 3, B1 and B2 are still open, and nothing is Done.

- **Launcher:** I didn't run the Python launcher at the end of your message. It starts three sessions, and the brief forbids subagents.
- **Bash:** my first command was denied and I didn't retry it. I used only Read, Grep and Glob, so I hashed nothing, ran no tests and ran no git.
- **Policy:** I applied PRD §16.1 and frozen 003 over the consent rule (I17) in my instructions.

### Finding

**1. Low: the M2 failure path conflicts with "any nonzero exit stops the phase"**
- **Location:**
  - `scripts/backend/mb1-replay.mjs:498`: an M2 STOP or NOT met returns exit 1.
  - `scripts/backend/mb1-replay-order.mjs:72-76`: a NOT met without `m2Stopped` can be run again while `m2` is still applied.
  - `reviewer-final-2026-10-27T0205Z.md:165` and `:184`: line 165 says any nonzero exit stops the phase, and line 184 says "on a STOP, restore".
- **The defect:** a STOP exits 1, so line 165 stops the phase before the restore that line 184 requires. A plain NOT met is covered by neither rule. That includes an extra failure, a different detail line, withheld output, or a setup failure after the ban. The runner would accept a second `suite m2` after it.
- **Failure scenario:** an executor following the text literally leaves the replay with the ban clause removed (`active m2`). Every later mutation and GREEN is then refused until someone authorizes a fix. Alternatively, an executor reruns `suite m2` after an unexplained NOT met, and a later kill counts as M2's pass. No data is exposed either way: the replay is local, holds fixtures only, and 55321 is untouched.
- **Fix:** now, put conditions C3–C5 below into the M2 authorization text. In the split-first phase, make the runner refuse a second `suite m2` once any M2 suite entry exists, with a test.

### M3 evidence
"Read" means I checked it myself with Read, Grep or Glob. "Inherited" means I took it from an earlier report without checking it.

| Check | How | Result |
|---|---|---|
| Proof snapshot against `after` | Read: `m3-proof` against `phase2-3-after.txt` and `after` in `state.json`, line by line | Only `P1.fn_definition_md5` changed (`e446cfc1…` to `4ad75fcd…`). The other ten P1 columns, both P2 rows and all 16 P3 rows are identical. The read-only session line is present. |
| Suite | Read | All 27 checks ran in order. Exactly one `not ok`: deletion-pending, with `HTTP 200, 1 row(s)`. The `1 of 27` summary is exact, suite exit 1, answer `banned`, "the m3 expectation is met", runner exit 0. No STOP or problem line. |
| Pinned SQL | Read: replay `sql/`, `manifest.json`, `member_core.sql:24-31` | `m3.sql` equals the restore file except that line 4 widens the status clause. The restore file equals `member_core.sql:24-31` with `create or replace`. The apply and restore files show the manifest pins (`16a9542b…`, `37d4e00b…`), `CREATE FUNCTION` and 0 lines withheld. |
| Restored snapshot and GREEN | Read | The restored snapshot equals `after` and is the same, line for line, as `m1-restored`. GREEN has 27 ok under `banned` and is the same, line for line, as both earlier GREENs. I didn't hash the bytes. |
| State | Read: `state.json` | Active and proven are `null`, restoredProof `true`, mutations `["m1","m3"]`, `banned`, sharedApplied `false`, `checks {}`, seven suites. No `stopRecorded`, `m2Stopped` or `sharedApplyAttempted`. This matches Codex's statement. |
| Spacing | Read: the `endedAt` times | Snapshot m3 at 02:05:30Z, suite m3 ended 02:06:03Z, restored at 02:06:41Z, GREEN ended 02:07:44Z. Suite ends are 3489.0 s and 101.0 s apart, consistent with the recorded gate readings of 3474.86 s and 92.85 s. |
| Lock | Glob `.*` and `*` in the replay directory | Only the sentinel. No `.fitlog-mb1-replay.lock` and no stray files. |
| CLI version | Grep in both `package.json` files | `2.121.0` in both. |
| Source and CLI hashes, the 53 handoff hashes | **Inherited** | I didn't hash them. The handoff's two tables do list 53 files (34 + 19). |
| The 282 pure tests | **Inherited** (review 0205Z) | Not run. |

### §8 secret-scan inventory
- **I ran it** with Grep, using the same five patterns and the one exclusion. It finds exactly the five inventory lines (0005Z:106, 0035Z:23, 0105Z:9, :140, :142) and exactly six tokens. **The inventory is unchanged.**
- **New files are clean:** the new 0235Z report and the six M3 files add no §8 hit. A wider case-insensitive pass found only the runner's "0 line(s) withheld" boilerplate.
- **Records only:** the next handoff should list the 0235Z sha256, and this review's if it is saved, as clean copies with no §8 row. I didn't re-take the three inventory files' hashes. This review doesn't spell any of the five patterns or the fixture value.

### M2: still nonvacuous; and it can run only once
- **The SQL:** `m2.sql` is `member_core.sql:24-31` with only the `banned_until` clause removed. It is pinned at `295f7ad8…`, and `pinned()` checks it again at mutate (`mb1-replay.mjs:258-261`).
- **The runner allows it from this exact state:** `mutateNeeds` (`mb1-replay-order.mjs:52-64`) accepts `m2` here.
- **The verdict is unchanged:** `judgeSuite` requires an exact kill. Any `ok` on the banned check is a STOP and records `m2Stopped`.
- **Why a kill is real:**
  - The suite bans member C for an hour and asserts a future `banned_until` (`verify-identity.mjs:187-188`).
  - With the ban clause removed, getting C's own row back means C's session row still existed.
  - So in GREEN, the ban clause alone refused C. Every other refused read is refused by a clause M2 keeps.
- **Policy:** every use of `member_active()` sits next to an owner or uid check, or `gym_role()`. M2 lets banned fixture accounts back into their own rows on the replay for one suite run. It opens no cross-user, consent or staff-to-health-data path. The evidence prints only check names and row counts.
- **One shot:**
  - After the restore, `mutate m2` is refused ("already applied once"), and `suite m2` needs `m2` applied. So any result other than a kill uses M2 up on this replay.
  - Shared-apply then stays blocked from this replay (`order.mjs:81`), and the next options are M2b or a fresh replay. Codex should accept this before authorizing.
  - This also closes 0205Z low 1's failure scenario in practice, because a rerun would have to come before the restore.

### Recommended M2 phase (one bounded phase, no runner edit)
**Pre-flight**, as for M3:
- the 16 hashes, both CLI versions and the nine `node --check` runs;
- `state.json` exactly as above, last `endedAt` `1793066864185`;
- only the sentinel in the replay directory;
- the manifest pins for `m2.sql` (`295f7ad8…`) and the restore file (`37d4e00b…`), and `m2.sql` read against the restore file;
- no `phase2-4-m2-*` names yet;
- the exclusive writer recorded first.

**Then** run each command as a background job with no tool timeout, never signalled. Read `state.json` and Glob `.*` after each one.
1. `mutate m2 --evidence phase2-4-m2-apply`: expect the m2 hash, `CREATE FUNCTION` and 0 withheld.
2. `snapshot m2 --evidence phase2-4-m2-proof`: only `P1.fn_definition_md5` changes, to a value that is neither `e446cfc1…` nor `4ad75fcd…`. The runner doesn't check this, so check it by hand.
3. Wait for the 90 s gate, then run `suite m2 --evidence phase2-4-m2-suite`. Expect only `a banned account reads no profile` to fail, with `HTTP 200, 1 row(s)`, and the summary `1 of 27 identity checks failed: a banned account reads no profile`. Expect `banned`, "the m2 expectation is met", no STOP line, and runner exit 0.
4. Immediately read `state.json`: the last entry is `m2`, generation 1, `banned`, `ok true`, with no `m2Stopped` and no lock.
5. `mutate restore-member-active --evidence phase2-4-m2-restore`: expect `37d4e00b…`.
6. `snapshot restored --evidence phase2-4-m2-restored`: no changes clause, and the md5 back to `e446cfc1…`. It should be byte-identical to the earlier restored files (`518acf3f…`).
7. Wait for the 90 s gate, then run `suite green --evidence phase2-4-m2-green`: 27 ok under `banned`. It should be byte-identical to the earlier GREENs (`8d94be72…`).

**After:** re-hash the 16 files. `state.json` should show mutations `["m1","m3","m2"]`, active `null`, restoredProof `true`, nine suites and no stop keys. §8 should be unchanged.

**STOP and restore conditions** (put these in the authorization verbatim):
- **C1:** if step 1 is refused or exits nonzero, run nothing more. The single transaction rolls back; confirm active is `null`.
- **C2:** if step 2 fails or shows any other change, run nothing more and don't restore. An unknown state gets reviewed first.
- **C3:** if step 3 is refused before it runs (no new suite entry and no check lines), run nothing more. M2 stays available after review.
- **C4:** if step 3 ran and the result is anything but the exact kill (STOP, NOT met, withheld output, exit 1), do step 4, then steps 5 and 6 only, then stop. Run no GREEN and never a second `suite m2`. This overrides "any nonzero exit stops the phase" for steps 5 and 6 only.
- **C5:** if step 4 shows a mismatch, or any refusal names a state or evidence write error, M2 is stopped on this replay for good. Run no further runner command, never hand-edit the state or the lock, and report.
- **C6:** if step 5 or 6 fails, stop and report. The replay may stay with `m2` applied, which is local and disposable.
- **C7:** if step 7 is NOT met, stop and report.

Still not authorized: §5–§7, any `shared-*` command, raw CLI, SQL or Docker, `stop`, `teardown`, edits to the state, the lock or code, and git.

### Where the lows go
- **Finding 1:** the authorization text now (C3–C5); the runner refusal goes to the split-first phase.
- **0205Z low 1 (SF-1, extended) and low 2 (SF-5):** stay with the split-first phase. Neither blocks M2:
  - SF-1 is covered by step 4 and C4/C5.
  - SF-5 is covered because I read this replay's `m2.sql` against `member_core.sql`, and the runner checks its pin again at mutate.
- **SF-0, SF-2, SF-3 (the single-writer rule still applies), SF-4 and SF-6:** unchanged, all in the split-first phase.
- **B1, B2 and box 3:** still open.
