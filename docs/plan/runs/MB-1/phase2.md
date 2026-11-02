# MB-1 phase 2 runs

Attempt 8 (first below) ran the M2 block of §4 on the disposable replay and met each of its expectations. Attempt 7 (next,
unchanged) ran the M3 block of §4 there and met each of its expectations. Attempt 6 (unchanged) ran the M1 block of §4
there and met each of its expectations. Attempt 5 (unchanged) ran §3 on the disposable replay and met GREEN there. Attempt
4 (unchanged) ran §2.2 again, as `phase2-2-red-2`, and met RED on the disposable replay. Attempt 3 (unchanged) stopped at
§2.2. Attempt 2 (unchanged) stopped after §1.4. Attempt 1 (last, unchanged) stopped at §0. Sections §1–§7 are attempt 1's,
and other records cite them. Attempt 2's sections are A2.1–A2.7, attempt 3's are A3.1–A3.8, attempt 4's are A4.1–A4.8,
attempt 5's are A5.1–A5.8, attempt 6's are A6.1–A6.8, attempt 7's are A7.1–A7.8, and attempt 8's are A8.1–A8.8.

## Attempt 8: the M2 block of §4 on the disposable replay: M2 applied and proved, the exact M2 kill, restored and proved, GREEN again

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3, as in attempts 1–7. **Box 3 is not met**; B1 and B2 stay open, and so do §5 and the 55321 apply. This is partial `profile_read` evidence on the disposable replay only: it shows that `member_active()`'s `banned_until` clause is what refuses the banned account's profile read, and that member C's session row still existed after the ban. It does not meet box 3 or the goal, and says nothing about 55321 |
| Authorization | Codex AUTH-01 (owner delegation), 27 October 2026, under the independent read-only review [`reviewer-final-2026-10-27T0305Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0305Z.md) (no critical, high or medium finding; one low, assigned to the split-first phase), which Codex accepted together with its M2 recommendation (steps 1–7) and its conditions C1–C7, quoted verbatim in the brief. **The coordinator's own statements, not re-run here:** it hashed all 53 handoff files independently this cycle (all equal); the source is unchanged; MB-1 alone owns the database lane; the previous three MB-1 sessions are explicitly stopped; the other seven lanes are owned elsewhere and unchanged. **Authorized, in order, and nothing else:** `mutate m2 --evidence phase2-4-m2-apply`; `snapshot m2 --evidence phase2-4-m2-proof`; `suite m2 --evidence phase2-4-m2-suite`; `mutate restore-member-active --evidence phase2-4-m2-restore`; `snapshot restored --evidence phase2-4-m2-restored`; `suite green --evidence phase2-4-m2-green`. Each runs on the literal, existing `/tmp/fitlog-mb1-replay-20261026` as a background Bash job, one at a time, with no tool timeout, never signalled; `state.json` and the lock are read after each. **At most one `suite m2`**, even after NOT met or a STOP. Codex accepted up front that this single-use replay may need M2b or a fresh replay later, with no retry now. **Before them:** the 16 hashes, both CLI versions, nine syntax checks, the exact state, no lock, the six evidence names absent, and the M2 SQL read against the restore file and the manifest pins. **Before each suite:** at least 90 s since the last `suites[].endedAt`, or wait without the runner. **C1–C7** (review 0305Z) override "any nonzero exit stops the phase" only as stated. **Not authorized:** §5–§7, any `shared-*`, raw CLI, SQL or Docker, `stop`, `teardown`, restart, re-prepare; edits to code, tests, SQL, config, `state.json` or the lock; status, GOALS, ledger, `main` or integration edits; commits; subagents |
| Exclusive writer | **Recorded in [checkpoint.md](checkpoint.md) before the first runner command** (after the 03:04:30Z clock reading and the pre-flight, before the 03:05:27Z one). For this cycle MB-1 alone owns the database lane. No other worker has database authority, and no session or process other than this phase's runner writes to `/tmp/fitlog-mb1-replay-20261026` or to this worktree's `supabase/`; no other replay or Supabase writer runs. This session's only writes were MB-1 docs, none while a runner job ran |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726` (the session-start snapshot). `rtk proxy git status --short` at the start and after the runs lists the same 12 untracked MB-1 paths and no tracked change. Nothing committed or staged |
| Run date and times | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ`: `2026-10-27T03:04:30Z` (after reading, before the pre-flight); `03:05:27Z` (before `mutate m2`); `03:05:44Z` (before `snapshot m2`); `03:06:34Z` (before the restore); `03:06:49Z` (before `snapshot restored`); `03:08:08Z` (after the rehash). Before each suite, `rtk proxy date -u +%s` (A8.2). `state.json` dates the `m2` snapshot `1793070348622` (03:05:48.622Z), the M2 suite's end `1793070372755` (03:06:12.755Z), the `restored` snapshot `1793070413577` (03:06:53.577Z) and the GREEN suite's end `1793070472840` (03:07:52.840Z) |
| Result | **All six commands met their expectations, each runner exit 0, with no refusal, `STOP:`, `# problem:` or `NOT met` line.** The apply sent the pinned `sql/m2.sql` `295f7ad8…c740` (`CREATE FUNCTION`, 0 withheld). The M2 proof changed exactly `P1.fn_definition_md5`, from `e446cfc1…` to `0e3be56b99cc97c1c2ee56f11e132a11` (neither the original nor M3's `4ad75fcd…`). **The M2 suite was the exact kill:** only `a banned account reads no profile` failed, `HTTP 200, 1 row(s)`, the exact `1 of 27` summary, `banned`, `the m2 expectation is met`. `state.json` read at once: the last entry `m2`, generation 1, `ok true`, `banned`, no `m2Stopped`, no lock. The restore sent `37d4e00b…c904`. The restored snapshot showed no change from `after`. **GREEN again:** 27 ok, `banned`, `the green expectation is met`. None of C1–C7 was triggered. Nothing touched 55321 except the runner's own read-only start-time pin check |
| Background command tool | **Allowed.** Six runner jobs, one at a time, each with no tool timeout. None was signalled; each ended on its own with exit 0 |
| Read | `/Users/Adya/.codex/RTK.md` (first); [checkpoint.md](checkpoint.md); [handoff.md](handoff.md); the review [`reviewer-final-2026-10-27T0305Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0305Z.md) in full; attempt 7 below (A7.1–A7.8); phase2-plan's rules, §4 and §8; this session's launch file `/tmp/fitlog-mb1-m20305-launch.json` (read only, for its allowed-command list); the replay's `manifest.json` pins (Grep) and both SQL files; `supabase/migrations/20261017161031_member_core.sql:24-31`; `mutateNeeds`, `suiteNeeds`, `firstStop` and `firstM2Pass` (`mb1-replay-order.mjs:35-79`); `M2_BAN_CLASSES`, `unkilled` and `judgeSuite` (`mb1-replay-evidence.mjs:218`, `:284-326`); the ban step of `verify-identity.mjs:184-191`; the replay's `state.json` (read only: before, after each command, and after) |

### A8.1 Before the runner commands

Every shell command was one `rtk proxy …` command, run from this worktree. `MB1` is
`rtk proxy node scripts/backend/mb1-replay.mjs <command> /tmp/fitlog-mb1-replay-20261026`, as in A3.1.

| Step | Command | Result (executed here) |
|---|---|---|
| Reviewed bytes, before | `rtk proxy sha256sum` of the 12 FINAL files (phase1i.md §6 "after") and the four CLI files (one command, 16 paths) | **All 16 equal** to handoff.md's table, compared line by line (values in A8.4, unchanged after) |
| CLI version | Grep tool, `"version"` in `node_modules/supabase/package.json` and `node_modules/@supabase/cli-darwin-arm64/package.json` (read as files) | Both `"version": "2.121.0",` (line 3). Nothing installed or upgraded |
| Syntax | `rtk proxy node --check scripts/backend/<file>`, nine commands: `mb1-replay.mjs`, `mb1-replay-evidence.mjs`, `mb1-replay-order.mjs`, `mb1-replay-target.mjs`, `verify-identity.mjs`, `mb1-replay.test.mjs`, `mb1-replay-evidence.test.mjs`, `mb1-replay-order.test.mjs`, `verify-identity.test.mjs` | Each exit 0, no output |
| Pure tests | Not run: the brief's pre-flight list was the hashes, the versions, the syntax checks, the state, the evidence names and the SQL | **Inherited only:** review 0205Z ran 282/282; the 12 source hashes are the same |
| Replay state | Read tool, `/tmp/fitlog-mb1-replay-20261026/state.json` in full | **Exactly the brief's state:** generation 1; candidate `"applied"`; active `null`; proven `null`; restoredProof `true`; mutations `["m1","m3"]`; ban `"banned"`; sharedApplied `false`; `checks {}`; seven suites, the last `green` `ok true` `banned` ended **`1793066864185`**; **no** `stopRecorded`, `m2Stopped` or `sharedApplyAttempted` key anywhere. Also: shared pin `true 2026-10-26T12:51:50.578854542Z`; CLI `2.121.0`; snapshots `before`, `after`, `m1`, `restored` (`1793066801858`) and `m3` |
| Lock | Glob `.fitlog-mb1-replay.lock`, then Glob `.*`, in the replay directory | **No lock.** The `.*` Glob lists the hidden owner sentinel `.fitlog-mb1-replay`, so Glob does see dotfiles there |
| Pins and the M2 SQL | Grep tool on the replay's `manifest.json`; `rtk proxy sha256sum` of both SQL files; Read of both and of `member_core.sql:24-31` | `sql/m2.sql` **`295f7ad8e7a01ddbaab707ea07f592510c1d061474389fada0f37d73d557c740`** and `sql/restore-member-active.sql` **`37d4e00b606283b69e3f99ab9d9203beedbe29b29363e1b56bf227205941c904`**: each file's sha256 equals its manifest pin. The restore file equals `member_core.sql:24-31` with `create or replace`. `m2.sql` equals the restore file except line 5, where ` and (u.banned_until is null or u.banned_until < now())` is removed; the status, `deleted_at`, confirmation and session clauses are intact. Neither file adds a grant or policy |
| Runner order (inspected, not run) | Read `mutateNeeds` (`mb1-replay-order.mjs:52-64`) | `mutate m2` is allowed from this state: ban `banned` is in `M2_BAN_CLASSES` (`['live','banned']`), nothing active, candidate applied on generation 1 with `after`, the last restore proved, `m2` not yet applied |
| Evidence names | Glob, `docs/evidence/MB-1/phase2-4-m2-*` | None of the six existed before the first command |
| Exclusive writer | Edit tool, [checkpoint.md](checkpoint.md) | Recorded before the first runner command (field above) |

### A8.2 The runner commands and their results

| Step | Command (background job) | Result |
|---|---|---|
| 1 (M2.1) | `MB1 mutate m2 --evidence phase2-4-m2-apply` | **Runner exit 0.** `# sql/m2.sql sha256 295f7ad8e7a01ddbaab707ea07f592510c1d061474389fada0f37d73d557c740, as manifest.json records; sent to supabase_db_fitlog_mb1_replay_20261026 only`; `$ docker exec -i supabase_db_fitlog_mb1_replay_20261026 psql --single-transaction -f - < sql/m2.sql`; **`CREATE FUNCTION`**; **`# 0 line(s) withheld …`**; `# exit 0`; `# mb1-replay mutate: exit 0`. `state.json` then: active `m2`, mutations `["m1","m3","m2"]`, proven `null`, restoredProof `false`; no stop key; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m2-apply.txt) |
| 2 (M2.2) | `MB1 snapshot m2 --evidence phase2-4-m2-proof` | **Runner exit 0.** The preconditions line (`ca683771…d913ed769a`, read-only check passed); `# session: default_transaction_read_only=on, transaction_read_only=on`; P1, two P2 rows, 16 P3 rows; **`# snapshot m2: 16 applied migration(s); no rule broken; changes from after: P1.fn_definition_md5`**; `# mb1-replay snapshot: exit 0`. P1 reads **`fn_definition_md5=0e3be56b99cc97c1c2ee56f11e132a11`**. `state.json` then: active `m2`, proven `m2`, snapshot `m2` at `1793070348622`; no stop key; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m2-proof.txt) |
| G | `rtk proxy date -u +%s` against the last `suites[].endedAt` | `1793070365` − `1793066864.185` = **3500.82 s ≥ 90 s**: run |
| 3 (M2.3) | `MB1 suite m2 --evidence phase2-4-m2-suite` (**the only `suite m2` this phase**) | **Runner exit 0.** 27 checks in GREEN's order (14 before the ban line, 13 after); exactly one `not ok`, **`a banned account reads no profile`**, followed by **`  HTTP 200, 1 row(s)`**; the ban line `HTTP 403 {"code":"user_banned","message":"User is banned"}`; **`1 of 27 identity checks failed: a banned account reads no profile`**; `# suite exit 1; GoTrue's answer after the ban: banned`; **`# verdict: the m2 expectation is met`**; the `banned` note; `# mb1-replay suite: exit 0`. No `STOP:` line. [Evidence](../../../evidence/MB-1/phase2-4-m2-suite.txt) |
| 4 | Read `state.json` **at once** (the review's interim control for 0205Z low 1); Grep count for the stop keys; Glob `.*` | The last suite entry: **`expect "m2"`, `ok true`, `ban "banned"`, generation 1**, ended `1793070372755`. Stop keys (`stopRecorded`, `m2Stopped`, `sharedApplyAttempted`) anywhere in the file: **0**. **No lock.** Exactly one `"expect": "m2"` entry |
| 5 (M2.4) | `MB1 mutate restore-member-active --evidence phase2-4-m2-restore` | **Runner exit 0.** `# sql/restore-member-active.sql sha256 37d4e00b606283b69e3f99ab9d9203beedbe29b29363e1b56bf227205941c904, as manifest.json records; sent to supabase_db_fitlog_mb1_replay_20261026 only`; `CREATE FUNCTION`; `# 0 line(s) withheld …`; `# exit 0`; `# mb1-replay mutate: exit 0`. Byte-identical to M3's restore file (both `14de81b3…6cdc`). `state.json` then: active `null`, proven `null`, mutations `["m1","m3","m2"]`, restoredProof `false`; no stop key; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m2-restore.txt) |
| 6 (M2.5) | `MB1 snapshot restored --evidence phase2-4-m2-restored` | **Runner exit 0.** The preconditions and read-only session lines; P1 with **`fn_definition_md5=e446cfc1e224dec2a5439fef806a22cc`**, two P2 rows, 16 P3 rows; **`# snapshot restored: 16 applied migration(s); no rule broken`**, with no `changes` clause; `# mb1-replay snapshot: exit 0`. **Byte-identical** to `phase2-4-m1-restored.txt` and `phase2-4-m3-restored.txt` (all three `518acf3f…342d`). `state.json` then: restoredProof `true`, snapshot `restored` at `1793070413577` (it replaces M3's entry, by label); no stop key; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m2-restored.txt) |
| G | `rtk proxy date -u +%s`, repeated, against `1793070372755` | `1793070425` (52.25 s), `…433` (60.25 s), `…440` (67.25 s), `…444` (71.25 s), `…448` (75.25 s), `…452` (79.25 s), `…455` (82.25 s), `…459` (86.25 s), `…462` (89.25 s): **too soon each time; waited without running the runner** (read-only Read, Grep, Glob and sha256sum in between). Then `1793070466`: **93.25 s ≥ 90 s**: run. `date +%s` truncates, so each real elapsed time was at least the reading; 89.25 s was not taken as proof of 90 |
| 7 (F) | `MB1 suite green --evidence phase2-4-m2-green` | **Runner exit 0.** 27 `ok` lines in order, no `not ok`; the same ban line; `Local identity integration passed, 27 checks: …`; `# suite exit 0; GoTrue's answer after the ban: banned`; **`# verdict: the green expectation is met`**; the `banned` note; `# mb1-replay suite: exit 0`. The file is **byte-identical** to `phase2-3-green.txt`, `phase2-4-m1-green.txt` and `phase2-4-m3-green.txt` (all four `8d94be72…6d05`). `state.json` then: a suite `expect "green"`, `ok true`, `ban "banned"`, generation 1, ended `1793070472840`; no stop key; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m2-green.txt) |

Each background job's output and the evidence file the runner wrote hold the same lines (read both, each time; the job
output adds only the tool's `[exited with code 0]`). After each command, `state.json` was read and the lock looked for
(Glob `.*`): no lock and no halt after any of them. Between the suites' end times: 3508.57 s (the previous GREEN to M2),
then 100.09 s (M2 to GREEN).

### A8.3 Acceptance, condition by condition (the brief and review 2026-10-27T0305Z's steps 1–7 and C1–C7)

| Condition | Observed (by hand unless stated) | Met |
|---|---|---|
| 1. Pre-flight: the 16 hashes, both CLI `2.121.0`, nine `node --check`, the exact state with last `endedAt` `1793066864185`, no lock, six evidence names absent, the M2 SQL against the restore file and both pins | A8.1 | Yes |
| 2. Exclusive writer recorded before the first runner command | A8.1; this session wrote only MB-1 docs, none during a runner job | Yes (as recorded; other sessions' processes cannot be shown from here, and no process check ran) |
| 3. Each command a background job, sequential, no tool timeout, never signalled; state and lock read after each | Six background jobs, each started only after the previous one had ended; none signalled; each ended on its own, exit 0; A8.2 | Yes |
| 4. 90 s before each suite, waiting without the runner when too soon | A8.2 rows G (3500.82 s; then 52.25–89.25 s waited, 93.25 s run) | Yes |
| 5a. Step 1: `295f7ad8…c740`, `CREATE FUNCTION`, 0 withheld | A8.2 step 1, its first, third and fourth lines in full | Yes |
| 5b. Step 2: only `P1.fn_definition_md5` changes, to a value that is neither `e446cfc1…` nor `4ad75fcd…` | The runner's line says exactly that. **Against `state.json`'s `after`, line by line:** P1's ten other keys identical; `fn_definition_md5` from `e446cfc1e224dec2a5439fef806a22cc` to **`0e3be56b99cc97c1c2ee56f11e132a11`**, which is neither the original nor M3's `4ad75fcd2758c080ada584e3d96664e6`; both P2 rows identical (`profile_read.qual` keeps the candidate's `member_active()` clause); all 16 P3 rows identical, each `statements_md5`, `ddcb1b5c…` included; the read-only session line present | Yes |
| 5c. Step 3: the exact kill. Only `a banned account reads no profile`, `HTTP 200, 1 row(s)`; 27 checks; the exact `1 of 27` summary; `banned`; `m2` met; runner exit 0 | As A8.2 step 3. Grep counts: 27 check lines, 26 `ok -`, 2 lines that are `not ok` or an HTTP detail (one of each). By hand against `phase2-4-m3-green.txt`: lines 1–15 equal (14 checks and the ban line); line 16 is GREEN's line 16 as `not ok`; line 17 its detail; lines 18–29 equal GREEN's 17–28; then the summary, exit, verdict and note. A Grep for `STOP\|# problem\|NOT met\|refused\|setup failed\|cleanup\|signal\|withheld` finds nothing in it | Yes |
| 5d. Step 4: at once, the last entry `m2`, generation 1, `banned`, `ok true`, no `m2Stopped`, no lock | A8.2 step 4 | Yes |
| 5e. Step 5: the restore sends `37d4e00b…c904` | Its first line, in full | Yes |
| 5f. Step 6: no `changes` clause, the md5 back to `e446cfc1…`, byte-identical to the earlier restored files (`518acf3f…`) | `no rule broken`, no `changes` clause. **Against `after`:** P1, both P2 rows and the 16 P3 rows identical; byte-identical to both earlier restored files | Yes |
| 5g. Step 7: GREEN, 27 ok under `banned`, byte-identical to the earlier GREENs (`8d94be72…`) | As A8.2 step 7; byte-identical to all three earlier GREENs | Yes |
| 6. No refusal, `STOP:`, `# problem:`, `NOT met` or nonzero runner exit | The Grep above over all six M2 files: the only hits are P3's migration name `function_lint_cleanup` (proof and restored) and the word "refused" in GREEN's summary line, as in attempts 6 and 7. Every runner exit 0. The runner's pin check passed on every command, and `state.json` keeps the same pin | Yes |
| 7. At most one `suite m2` | Exactly one invocation; exactly one `"expect": "m2"` suite entry | Yes |
| 8. C1–C7 | None triggered: step 1 exit 0 (C1); step 2 exactly as expected (C2); step 3 ran (C3) and was the exact kill (C4); step 4 matched, and no refusal named a state or evidence write error (C5); steps 5 and 6 passed (C6); step 7 met (C7) | Not needed |
| 9. After: the 16 pins rehashed; final state mutations `["m1","m3","m2"]`, active and proven `null`, restoredProof `true`, nine suites, no stop keys, no lock | A8.4 | Yes |

**So the M2 block is met on the disposable replay**, under the reference `banned`. Removing `member_active()`'s
`banned_until` clause, and nothing else, brought back exactly the banned account's own profile read, `HTTP 200, 1
row(s)`. Because the session clause stayed, that row shows member C's session row still existed after the ban; so in
GREEN the ban clause alone refuses it (review 0305Z, "Why a kill is real"). Restoring the pinned original brought back
exactly the `after` state and GREEN. This is partial `profile_read` evidence only: **not box 3, not the goal**, and not
55321.

### A8.4 State left behind (for the coordinator)

- **The replay project is running.** Stop is not authorized. Its containers were not listed.
- **The directory** `/tmp/fitlog-mb1-replay-20261026` (read only, through `state.json` and Globs):
  - **no lock**; the runner released it after each command;
  - generation 1; candidate **`applied`**; active **`null`**; proven **`null`**; **restoredProof `true`**; mutations
    **`["m1","m3","m2"]`**; shared pin `true 2026-10-26T12:51:50.578854542Z`; CLI `2.121.0`;
  - snapshots: `before` (`1793032873158`), `after` (`1793059620610`), `m1` (`1793063157060`) and `m3` (`1793066730032`)
    **unchanged**; new `m2` (`1793070348622`); `restored` now `1793070413577` (replacing M3's `1793066801858`, by label);
  - **nine suite entries:** the seven earlier ones unchanged, then **`m2` `ok true` `banned`** (ended `1793070372755`)
    and **`green` `ok true` `banned`** (ended `1793070472840`), both generation 1;
  - reference `ban` `"banned"`; `checks` `{}`; `sharedApplied` **false**; **no `stopRecorded`, `m2Stopped` or
    `sharedApplyAttempted`** (Grep count 0).

  Only the runner wrote under the directory. No replay file was changed by hand.
- **What the runner now allows (read from `mb1-replay-order.mjs:17-79`, not run):** every §4 mutation is used up on this
  replay. `mutate m1`, `m2` and `m3` are refused (`… was already applied once`), and `suite m2` is refused (`suite m2
  already passed on this replay at …`, `firstM2Pass`). By `sharedApplyMissing` (`:80-88`), red, m1, m2 and m3 now count
  as passed; `shared-apply` still lacks a generation 2 GREEN, a clean generation 2 `diff` and `lint`, matching images and
  the `55321-before` snapshot, and it is **not authorized**. The next suite must start at least 90 s after
  `1793070472840`.
- **55321.** This attempt sent it no SQL and no Supabase command. The runner's only contact is its read-only `docker
  inspect` of the pinned start time; no `STOP:` line printed.
- **Processes.** Each runner job ended on its own with exit 0. No process check ran (none authorized), so "no process
  left" is not shown independently.
- **Hashes after the run** (`rtk proxy sha256sum`, one command, 31 paths): **all 16 sources and CLI files unchanged.**

  | sha256 | File |
  |---|---|
  | `fd76c04b0fa656d811831c6b103ef652313e281d77a648e23a0b368b73e83334` | `scripts/backend/mb1-replay.mjs` |
  | `6d52d70ce4c059ce89e32efa5d0d6162b9b59f2cf0c106ba3195bac6f681bb89` | `scripts/backend/mb1-replay-evidence.mjs` |
  | `fb6edb395cfe01edfc99e4ef70c8bcdfc6d6d206af0f0963aee4c42d248c3b37` | `scripts/backend/mb1-replay-order.mjs` |
  | `9c18e4238f36275e1a24ba740fe9fc034f703fe220717e37ec1698d13f55e81c` | `scripts/backend/mb1-replay.test.mjs` |
  | `89421648df0583a9cc1c811c7afc9c7003c023eb27cc908ce1c6c77a87918583` | `scripts/backend/mb1-replay-evidence.test.mjs` |
  | `95fdb69a52161801dc8e672a83ad60b42294882d138cefcce7b59e9126f89ad7` | `scripts/backend/mb1-replay-order.test.mjs` |
  | `42219dee18756927f32ca7aec1c8a6c5139499097c81bc1be5d5a52370f9eb5c` | `scripts/backend/mb1-replay-target.mjs` |
  | `944ba934a93a369cf6382ddea79620cdf35215d218dc1fde9eea634cc1bcdf81` | `scripts/backend/verify-identity.mjs` |
  | `902bb69924b929ac0b06c8fc44e3102318cf6f5fc06c212ccd3d51ce45521021` | `scripts/backend/verify-identity.test.mjs` |
  | `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3` | `supabase/migrations/20261026040045_mb1_live_session_guard.sql` |
  | `67a3591105da6cc41032b8c4dc72680ae65cd93751dc594ee5918f7654481b94` | `supabase/config.toml` |
  | `8ba686dbdea606484af49fbfe6836283945c27805355fa2586e61614fae34f78` | `docs/plan/runs/MB-1/phase1.md` |
  | `21d25b4bfb1870db0aaf0963c028b10d0b0b431485f119abd704c1396c7991e6` | `node_modules/.bin/supabase` |
  | `21d25b4bfb1870db0aaf0963c028b10d0b0b431485f119abd704c1396c7991e6` | `node_modules/supabase/dist/supabase.js` |
  | `6e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc` | `node_modules/@supabase/cli-darwin-arm64/bin/supabase` |
  | `fd5f2364521870ad9bb485ce9796e16d9b75fad21b306ad4955a382ea7533813` | `node_modules/@supabase/cli-darwin-arm64/bin/supabase-go` |
  | `54daa8d3801ecf97f22d3aa89a7ef71307cab841aea7bad39d34fb301959d22b` | `docs/evidence/MB-1/phase2-4-m2-apply.txt` (new, by the runner) |
  | `c97d42d55898443ec592f31aaf1a944e35a6f929437cb73371237ecdfc93724f` | `docs/evidence/MB-1/phase2-4-m2-proof.txt` (new, by the runner) |
  | `f5630a394e973faa65cc5625727d14e981ccb7c56c83853ad3674530b75b7ae9` | `docs/evidence/MB-1/phase2-4-m2-suite.txt` (new, by the runner) |
  | `14de81b36d4df598ab8473309a23761428d0aeaf1d98dc124b9faf0fcd8f6cdc` | `docs/evidence/MB-1/phase2-4-m2-restore.txt` (new, by the runner; equal to `phase2-4-m3-restore.txt`) |
  | `518acf3fae834472285c8ff404e90606d53176a0d3da4cf20c1ca9a279ed342d` | `docs/evidence/MB-1/phase2-4-m2-restored.txt` (new, by the runner; equal to `phase2-4-m1-restored.txt` and `phase2-4-m3-restored.txt`, both rehashed) |
  | `8d94be725a89ae3d282c04f4dcec439677ee90bd93b2d629bc2fd65f7d2c6d05` | `docs/evidence/MB-1/phase2-4-m2-green.txt` (new, by the runner; equal to `phase2-3-green.txt`, `phase2-4-m1-green.txt` and `phase2-4-m3-green.txt`, all rehashed) |
  | `cef2fc2d6646dc394821a1fe8972487695193d589f9055f9d5d76e78b9757f08` | `docs/evidence/MB-1/reviewer-final-2026-10-27T0005Z.md` (not edited; §8 inventory, equal) |
  | `fb019b3a929809058f22d558e25324e083f6a9a1364c25e14f9ecf5ec0dc68e9` | `docs/evidence/MB-1/implementer-final-2026-10-27T0035Z.md` (not edited; §8 inventory, equal) |
  | `34df6934ebac611e5a6bccd3c4764f06f4d52584294a97a7add9a317836a5436` | `docs/evidence/MB-1/reviewer-final-2026-10-27T0105Z.md` (not edited; §8 inventory, equal) |
  | `c5f39490ad1a427a1329e9e0d5e7fa6ca34d9cf77e820061a4e98c20ca135d7f` | `docs/evidence/MB-1/implementer-final-2026-10-27T0135Z.md` (not edited; clean report copy, equal) |
  | `f52210f4abe85a3e93aba157e368b53224f79f2503c430c75477491ab4f434f8` | `docs/evidence/MB-1/reviewer-final-2026-10-27T0205Z.md` (not edited; clean review copy, equal) |
  | `dba22b0d94f45c2ba0f55cab3b96bb54838db50c1c756e6c597b25c665660449` | `docs/evidence/MB-1/implementer-final-2026-10-27T0235Z.md` (not edited; clean report copy; first recorded here, as review 0305Z asks) |
  | `e953113a217d9eeb24c530df0ffa426cb37ed4e49e1058ec5757d2ece19eaaf7` | `docs/evidence/MB-1/reviewer-final-2026-10-27T0305Z.md` (read, not edited; clean review copy; first recorded here) |
- **Secret scan (§8), Grep tool, after every evidence file was written.** §8's five patterns, with its one exclusion
  (`review-39fe1fb5-final.md`), over `docs/evidence/MB-1`: **exactly the five inventory lines in three files, and nothing
  else** (0005Z:106, 0035Z:23, 0105Z:9, :140, :142), each file's sha256 equal to its §8 row. The token check (Grep tool
  with `-o`, the equivalent of §8's `rg -n -o` form; `rg` itself was not run) gives exactly the six recorded tokens.
  **The inventory is unchanged:** the six new runner files and the report copies 0235Z and 0305Z add no §8 hit, so they
  need no row. On a wider case-insensitive pass over those eight files (any Supabase key prefix, JWT shapes, Postgres
  URLs, a URL with a password, `service_role`, `apikey`, `bearer`, `secret`, `password`, `token`), the only hits are the
  runner's `… or secret-shaped)` boilerplate (apply and restore, line 4) and prose naming the §8 scan (0305Z:36-37,
  0235Z:29). None holds a key.

### A8.5 Review 2026-10-27T0305Z: provenance and dispositions

- **The review.** [`reviewer-final-2026-10-27T0305Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0305Z.md) was
  already in the evidence directory before this phase. It was read, not edited or copied; its sha256 is
  `e953113a…eaf7` (A8.4). The brief calls it "saved final-2026-10-27T0305Z.md"; this is the only `*0305Z*` file there.
- **Its verdict.** No critical, high or medium finding; one new low. The six M3 files support every M3 expectation; M2 is
  not blocked if its authorization carries C1–C7. Its Bash was denied, so its hashes, the 53 handoff hashes and the 282
  tests are inherited in it, as it says.
- **Codex's disposition (AUTH-01):** accepted, with its M2 recommendation, steps 1–7 and C1–C7 verbatim. **Only the M2
  block was authorized.** This attempt followed it exactly; no condition was triggered.
- **Low 1 (the M2 failure path conflicts with "any nonzero exit stops the phase"; a NOT met without `m2Stopped` could be
  rerun):** the authorization half is **done** (C3–C5 were in the brief). The runner half (refuse a second `suite m2`
  once any M2 suite entry exists, with a test) is **assigned** to the MB-1 split-first phase. Not exercised here: the
  first and only M2 run was the exact kill, and after a pass `firstM2Pass` already refuses any later `suite m2`.
- **Its "where the lows go" table (SF-0 to SF-6, 0205Z lows 1 and 2):** unchanged, all in the split-first phase. The
  single-writer condition (SF-3) was recorded for this cycle. SF-4's 90 s gate ran before both suites. 0205Z low 1's
  interim control (read `state.json` right after `suite m2`) ran as step 4.
- **Informational, observed (SF-6):** the `restored` snapshot entry in `state.json` was replaced by M2's, by label. M1's
  and M3's durable restore proofs are their evidence files; all three restored files are byte-identical (`518acf3f…`).
- **Policy restated by the coordinator.** PRD §16.1 and frozen 003 override any stale agent text: gym staff never read or
  write private health data, whatever the consent. This stays mandatory until QA-2 is merged **and** the launching
  checkout has corrected `security-reviewer` instructions. M2 and its restore change only `private.member_active()`'s
  ban clause on the disposable replay, for one suite run and then back. Every use of `member_active()` sits beside an
  owner or uid check or `gym_role()` (review 0305Z); no grant or policy was added; the evidence prints only check names
  and row counts. No cross-user, consent, staff or health-data path opened.
- **No new review ran.** The brief forbids subagents, and this attempt changed no source, test, config or SQL file, so the
  `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not run.

### A8.6 Permissions observed

| Command | Result |
|---|---|
| `rtk proxy ls -la docs/evidence/MB-1/` (the second command) | **Denied** (not in this session's allowed list; "don't ask" mode). Not retried in any form; Glob replaced it |
| `rtk proxy git status --short` (×2), `rtk proxy date …` (×17: six ISO readings, eleven `+%s`), `rtk proxy sha256sum …` (×7 before these records, then one more for the handoff's tables), `rtk proxy node --check …` (×9) | Allowed |
| The six runner commands, as background Bash jobs | Allowed |
| Read of the replay's `state.json`, both `sql/` files and the launch file; Grep of `manifest.json`; Glob for its lock, its dotfiles and evidence names; Read, Grep and Glob over the evidence directory, the scripts, `member_core.sql` and the CLI `package.json` files | Allowed |
| Background output files | Steps 1 and 2: each output file was read once before the completion notice arrived; each already held the tool's exit line. Step 3: read once while it ran (empty), then not again until the notice. Steps 4–6: read only after the notice. No job was signalled or waited on with `sleep` |

The user message that carried the brief also held the coordinator's launcher script, which starts the MB-1, QA-9 and
QA-2 sessions. It is the coordinator's tool, outside this phase's scope, and was **not run**.

### A8.7 Files changed in this attempt

| Path | Change |
|---|---|
| `docs/evidence/MB-1/phase2-4-m2-apply.txt`, `-proof.txt`, `-suite.txt`, `-restore.txt`, `-restored.txt`, `-green.txt` | New, written by the runner |
| `docs/plan/runs/MB-1/phase2.md` | This attempt 8 record, and the opening paragraph's attempt list; attempts 1–7 unchanged |
| `docs/plan/runs/MB-1/checkpoint.md` | The exclusive-writer record (before the runner), then the status and the resume point |
| `docs/plan/runs/MB-1/phase2-plan.md` | The status row's current pointer only. §4, §8's command, patterns and inventory are unchanged |
| `docs/plan/runs/MB-1/handoff.md` | Interim handoff for this attempt |

**Unchanged:** every script, test, migration, SQL, config and package file; `phase1*.md`; every review copy, report copy
and earlier evidence file; `status.json`, the ledger, `GOALS.md` and `main`. Nothing is staged, committed or pushed.
Box 3 is **not met**; B1 and B2 stay open.

### A8.8 Next bounded checkpoint (the coordinator decides)

1. **The MB-1 split-first design and refactor phase** (SF-0 to SF-6, review 0205Z's lows 1 and 2, and review 0305Z's low
   1: refuse a second `suite m2` once any M2 suite entry exists, with a test), pure code, test-first, then a fresh
   independent review, before §5 and before any runner edit.
2. **§5** (stop, a fresh start with all 16, `diff`, `lint`, images) is **not authorized**. It needs its own authorization,
   after item 1 and its review (SF-3's single-writer condition at least).
3. **§6 (55321) and §7** are **not authorized**. On this replay the four suites `shared-apply` needs from §§2–4 have now
   passed, M2 among them with no stop; §5's proofs, the `55321-before` snapshot and §6's own authorization are still
   missing. B1 and B2 stay open.
4. **Records:** before any commit, rerun §8 and compare its output with phase2-plan §8's inventory (unchanged by this
   attempt). A report saved into `docs/evidence/MB-1` that spells the fixture literal needs its own exact row first.
5. The replay keeps running until a stop is authorized. The next suite must start at least 90 s after
   `1793070472840`. If 55321's database container restarts first, every command on this directory refuses: record
   that, and do not work around it.

## Attempt 7: the M3 block of §4 on the disposable replay: M3 applied and proved, M3 met, restored and proved, GREEN again

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3, as in attempts 1–6. **Box 3 is not met**; B1 and B2 stay open, and so do M2, §5 and the 55321 apply. This is partial `profile_read` evidence on the disposable replay only: it shows that `member_active()`'s `p.status='active'` clause is what refuses the deletion-pending account's profile read. It does not meet box 3 or the goal, and says nothing about 55321 |
| Authorization | Codex AUTH-01 (owner delegation), 27 October 2026, under the independent read-only review [`reviewer-final-2026-10-27T0205Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0205Z.md) (no critical, high or medium finding; two lows; it recommends the M3 block next), which Codex accepted together with its M3 recommendation. **The coordinator's own statements, not re-run here:** it checked all 45 handoff hashes (all equal) and read `state.json` (generation 1, candidate `applied`, active and proven `null`, restoredProof `true`, mutations `["m1"]`, `banned`, sharedApplied `false`, `checks {}`, no halt flag); every earlier MB-1 session is stopped; MB-1 holds the database lane exclusively; the seven blocked external lanes are untouched. **Authorized, in order, and nothing else:** `mutate m3 --evidence phase2-4-m3-apply`; `snapshot m3 --evidence phase2-4-m3-proof`; `suite m3 --evidence phase2-4-m3-suite`; `mutate restore-member-active --evidence phase2-4-m3-restore`; `snapshot restored --evidence phase2-4-m3-restored`; `suite green --evidence phase2-4-m3-green`. Each runs on the literal, existing `/tmp/fitlog-mb1-replay-20261026` as a background Bash job, one at a time, with no tool timeout, never signalled. **Before them:** the 12 FINAL and four CLI hashes, both CLI versions, nine syntax checks, the exact state, no lock, and the six evidence names absent. **Before each suite:** at least 90 s since the last `suites[].endedAt`, or wait without the runner. **Contingency (decided up front):** only if the apply and the proof pass but the M3 suite fails, run only the restore and `snapshot restored`, then stop with no GREEN; if the apply or the proof fails, run nothing more. **Not authorized:** M2, restart, re-prepare, `stop`, `teardown`, `diff`, `lint`, `images`, `migrate`, any `shared-*`, raw CLI, SQL or Docker, network; edits to code, tests, SQL, config, `state.json` or the lock; status, GOALS, ledger, `main` or integration edits; commits; subagents. Any refusal, `STOP:`, `# problem:`, `NOT met` or nonzero exit stops the phase with no retry and no lock or state clearing |
| Exclusive writer | **Recorded in [checkpoint.md](checkpoint.md) before the first runner command** (after the 02:04:12Z clock reading and the pre-flight, before the 02:05:06Z one). For this cycle MB-1 owns the database lane exclusively. No other worker has database authority, and no session or process other than this phase's runner writes to `/tmp/fitlog-mb1-replay-20261026` or to this worktree's `supabase/`; no other replay or Supabase writer runs. This session's only writes were MB-1 docs, none while a runner job ran |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726` (the session-start snapshot; no git command ran, A7.6). Nothing committed or staged |
| Run date and times | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ`: `2026-10-27T02:04:12Z` (after reading, before the pre-flight); `02:05:06Z` (before `mutate m3`); `02:05:25Z` (before `snapshot m3`); `02:06:19Z` (before the restore); `02:06:37Z` (before `snapshot restored`); `02:07:59Z` (after the rehash). Before each suite, `rtk proxy date -u +%s` (A7.2). `state.json` dates the `m3` snapshot `1793066730032` (02:05:30.032Z), the M3 suite's end `1793066763147` (02:06:03.147Z), the `restored` snapshot `1793066801858` (02:06:41.858Z) and the GREEN suite's end `1793066864185` (02:07:44.185Z) |
| Result | **All six commands met their expectations, each runner exit 0, with no refusal, `STOP:`, `# problem:` or `NOT met` line.** The apply sent the pinned `sql/m3.sql` `16a9542b…bb50` (`CREATE FUNCTION`, 0 withheld). The M3 proof changed exactly `P1.fn_definition_md5` (`e446cfc1…` to `4ad75fcd…`). The M3 suite failed exactly `a deletion-pending account reads no profile`, `HTTP 200, 1 row(s)`, under `banned`, and `the m3 expectation is met`. The restore sent the pinned `restore-member-active.sql` `37d4e00b…c904`. The restored snapshot showed no change from `after`. **GREEN again:** 27 ok, `banned`, `the green expectation is met`. The contingency was not needed. Nothing touched 55321 except the runner's own read-only start-time pin check |
| Background command tool | **Allowed.** Six runner jobs, one at a time, each with no tool timeout. None was signalled; each ended on its own with exit 0 |
| Read | `/Users/Adya/.codex/RTK.md` (first) and `~/.claude/RTK.md` (session instructions); [checkpoint.md](checkpoint.md); [handoff.md](handoff.md); the review [`reviewer-final-2026-10-27T0205Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0205Z.md) in full; attempt 6 below (A6.1–A6.8); phase2-plan's rules, §4 and §8; this session's launch file `/tmp/fitlog-mb1-m30205-launch.json` (read only, for its allowed-command list); the replay's `manifest.json` pins for `sql/m3.sql` and `sql/restore-member-active.sql`, and both files (read only); `SNAPSHOT_RULES.m3` and `expectedFailures('m3')` (`mb1-replay-evidence.mjs:253`, `:460`, `:595-596`); `mutateNeeds` and `suiteNeeds` (`mb1-replay-order.mjs:52-79`); the replay's `state.json` (read only: before, after each command, and after) |

### A7.1 Before the runner commands

Every shell command was one `rtk proxy …` command, run from this worktree. `MB1` is
`rtk proxy node scripts/backend/mb1-replay.mjs <command> /tmp/fitlog-mb1-replay-20261026`, as in A3.1.

| Step | Command | Result (executed here) |
|---|---|---|
| Reviewed bytes, before | `rtk proxy sha256sum` of the 12 FINAL files (phase1i.md §6 "after") and the four CLI files (one command, 16 paths) | **All 16 equal** to handoff.md's table, compared line by line (values in A7.4, unchanged after) |
| CLI version | Grep tool, `"version"` in `node_modules/supabase/package.json` and `node_modules/@supabase/cli-darwin-arm64/package.json` (read as files) | Both `"version": "2.121.0",` (line 3). Nothing installed or upgraded |
| Syntax | `rtk proxy node --check scripts/backend/<file>`, nine commands: `mb1-replay.mjs`, `mb1-replay-evidence.mjs`, `mb1-replay-order.mjs`, `mb1-replay-target.mjs`, `verify-identity.mjs`, `mb1-replay.test.mjs`, `mb1-replay-evidence.test.mjs`, `mb1-replay-order.test.mjs`, `verify-identity.test.mjs` | Each exit 0, no output |
| Pure tests | Not run: the brief's pre-flight list was the hashes, the versions, the syntax checks, the state and the evidence names | **Inherited only:** review 0205Z ran 282/282 on the same 12 hashes |
| Replay state | Read tool, `/tmp/fitlog-mb1-replay-20261026/state.json` in full | **Exactly the brief's state:** generation 1; candidate `"applied"`; active `null`; proven `null`; restoredProof `true`; mutations `["m1"]`; ban `"banned"`; sharedApplied `false`; `checks {}`; **no** `stopRecorded`, `m2Stopped` or `sharedApplyAttempted` key. Also: shared pin `true 2026-10-26T12:51:50.578854542Z`; CLI `2.121.0`; snapshots `before` (`1793032873158`), `after` (`1793059620610`), `m1` (`1793063157060`), `restored` (`1793063210760`); five suites, the last `green` `ok true` `banned` ended `1793063274142` |
| Lock | Glob `.fitlog-mb1-replay.lock`, then Glob `.*`, in the replay directory | **No lock.** The `.*` Glob lists the hidden owner sentinel `.fitlog-mb1-replay`, so Glob does see dotfiles there |
| Pins | Grep tool on the replay's `manifest.json`; Read of both SQL files | `sql/m3.sql` `16a9542b90971163d930fed68e5f14be2bce2a549014695479d583626cddbb50` and `sql/restore-member-active.sql` `37d4e00b606283b69e3f99ab9d9203beedbe29b29363e1b56bf227205941c904`, as the brief. The two files differ only on line 4: `p.status in ('active','deletion_pending')` against `p.status='active'`. The ban, `deleted_at`, confirmation and session clauses are intact in both; neither adds a grant or policy |
| Evidence names | Glob, `docs/evidence/MB-1/phase2-4-m3-*` | None of the six existed before the first command |
| Exclusive writer | Edit tool, [checkpoint.md](checkpoint.md) | Recorded before the first runner command (field above) |

### A7.2 The runner commands and their results

| Step | Command (background job) | Result |
|---|---|---|
| M3.1 | `MB1 mutate m3 --evidence phase2-4-m3-apply` | **Runner exit 0.** `# sql/m3.sql sha256 16a9542b90971163d930fed68e5f14be2bce2a549014695479d583626cddbb50, as manifest.json records; sent to supabase_db_fitlog_mb1_replay_20261026 only`; `$ docker exec -i supabase_db_fitlog_mb1_replay_20261026 psql --single-transaction -f - < sql/m3.sql`; **`CREATE FUNCTION`**; **`# 0 line(s) withheld …`**; `# exit 0`; `# mb1-replay mutate: exit 0`. `state.json` then: active `m3`, mutations `["m1","m3"]`, proven `null`, restoredProof `false`; no stop key; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m3-apply.txt) |
| M3.2 | `MB1 snapshot m3 --evidence phase2-4-m3-proof` | **Runner exit 0.** The preconditions line (`ca683771…d913ed769a`, read-only check passed); `# session: default_transaction_read_only=on, transaction_read_only=on`; P1, two P2 rows, 16 P3 rows; **`# snapshot m3: 16 applied migration(s); no rule broken; changes from after: P1.fn_definition_md5`**; `# mb1-replay snapshot: exit 0`. `state.json` then: proven `m3`, snapshot `m3` at `1793066730032`; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m3-proof.txt) |
| G | `rtk proxy date -u +%s` against the last `suites[].endedAt` | `1793066749` − `1793063274.142` = **3474.86 s ≥ 90 s**: run |
| M3.3 | `MB1 suite m3 --evidence phase2-4-m3-suite` | **Runner exit 0.** 27 checks in GREEN's order (14 before the ban line, 13 after); exactly one `not ok`, **`a deletion-pending account reads no profile`**, followed by **`  HTTP 200, 1 row(s)`**; the ban line `HTTP 403 {"code":"user_banned","message":"User is banned"}`; **`1 of 27 identity checks failed: a deletion-pending account reads no profile`**; `# suite exit 1; GoTrue's answer after the ban: banned`; **`# verdict: the m3 expectation is met`**; the `banned` note; `# mb1-replay suite: exit 0`. `state.json` then: a suite `expect "m3"`, `ok true`, `ban "banned"`, generation 1, ended `1793066763147`; no `m2Stopped`; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m3-suite.txt) |
| M3.4 | `MB1 mutate restore-member-active --evidence phase2-4-m3-restore` | **Runner exit 0.** `# sql/restore-member-active.sql sha256 37d4e00b606283b69e3f99ab9d9203beedbe29b29363e1b56bf227205941c904, as manifest.json records; sent to supabase_db_fitlog_mb1_replay_20261026 only`; `CREATE FUNCTION`; `# 0 line(s) withheld …`; `# exit 0`; `# mb1-replay mutate: exit 0`. `state.json` then: active `null`, proven `null`, mutations `["m1","m3"]`, restoredProof `false`; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m3-restore.txt) |
| M3.5 | `MB1 snapshot restored --evidence phase2-4-m3-restored` | **Runner exit 0.** The preconditions and read-only session lines; P1 with **`fn_definition_md5=e446cfc1e224dec2a5439fef806a22cc`**, two P2 rows, 16 P3 rows; **`# snapshot restored: 16 applied migration(s); no rule broken`**, with no `changes` clause; `# mb1-replay snapshot: exit 0`. The file is **byte-identical** to attempt 6's `phase2-4-m1-restored.txt` (both `518acf3f…342d`). `state.json` then: restoredProof `true`, snapshot `restored` at `1793066801858` (it replaces M1's entry, as review 0205Z noted; M1's durable proof is its evidence file); no lock. [Evidence](../../../evidence/MB-1/phase2-4-m3-restored.txt) |
| G | `rtk proxy date -u +%s`, repeated, against `1793066763147` | `1793066817` (53.85 s), `1793066828` (64.85 s), `1793066838` (74.85 s), `1793066846` (82.85 s): **too soon each time; waited without running the runner** (read-only sha256sum, Grep and Read in between). Then `1793066856`: **92.85 s ≥ 90 s**: run. `date +%s` truncates, so each real elapsed time was at least the reading |
| F | `MB1 suite green --evidence phase2-4-m3-green` | **Runner exit 0.** 27 `ok` lines in order, no `not ok`; the same ban line; `Local identity integration passed, 27 checks: …`; `# suite exit 0; GoTrue's answer after the ban: banned`; **`# verdict: the green expectation is met`**; the `banned` note; `# mb1-replay suite: exit 0`. The file is **byte-identical** to `phase2-3-green.txt` and `phase2-4-m1-green.txt` (all three `8d94be72…6d05`). `state.json` then: a suite `expect "green"`, `ok true`, `ban "banned"`, generation 1, ended `1793066864185`; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m3-green.txt) |

Each background job's output and the evidence file the runner wrote hold the same lines (read both, each time; the job
output adds only the tool's `[exited with code 0]`). After each command, `state.json` was read and the lock looked for
(Glob `.*`): no lock and no halt after any of them. Between the suites' end times: 3489.01 s (the previous GREEN to M3),
then 101.04 s (M3 to GREEN).

### A7.3 Acceptance, condition by condition (the brief and review 2026-10-27T0205Z's M3 block)

| Condition | Observed (by hand unless stated) | Met |
|---|---|---|
| 1. Pre-flight: the 12 FINAL and four CLI hashes, both CLI `2.121.0`, nine `node --check`, the exact state, no lock, six evidence names absent | A7.1 | Yes |
| 2. Exclusive writer recorded before the first runner command | A7.1; this session wrote only MB-1 docs, none during a runner job | Yes (as recorded; other sessions' processes cannot be shown from here, and no process check ran) |
| 3. Each command a background job, sequential, no tool timeout, never signalled | Six background jobs, each started only after the previous one's completion notice; none signalled; each ended on its own, exit 0 | Yes |
| 4. 90 s before each suite, waiting without the runner when too soon | A7.2 rows G (3474.86 s; then 53.85–82.85 s waited, 92.85 s run) | Yes |
| 5a. Apply: `16a9542b…bb50`, `CREATE FUNCTION`, 0 withheld | A7.2 M3.1, its first, third and fourth lines in full | Yes |
| 5b. M3 proof changes only `P1.fn_definition_md5` from `after`, to a new value | The runner's line says exactly that. **Against `state.json`'s `after`, line by line:** P1's ten other keys identical; `fn_definition_md5` from `e446cfc1e224dec2a5439fef806a22cc` to `4ad75fcd2758c080ada584e3d96664e6`; both P2 rows identical (`profile_read.qual` keeps the candidate's `member_active()` clause); all 16 P3 rows identical, each `statements_md5`, `ddcb1b5c…` included | Yes |
| 5c. M3 suite: exactly `a deletion-pending account reads no profile`, `HTTP 200, 1 row(s)`; `banned`; `m3` met | As A7.2 M3.3. Grep counts: 27 check lines; 2 lines that are `not ok` or an HTTP detail (one of each). By hand against `phase2-4-m1-green.txt`: lines 1–12 equal; line 13 is GREEN's line 13 check as `not ok`; line 14 its detail; lines 15–29 equal GREEN's 14–28; then the summary, exit, verdict and note | Yes |
| 5d. The restore sends `37d4e00b…c904` | Its first line, in full | Yes |
| 5e. The restored snapshot equals `after`, no changes | `no rule broken`, no `changes` clause, `fn_definition_md5` back to `e446cfc1…`. **Against `after`:** P1, both P2 rows and the 16 P3 rows identical; byte-identical to M1's restored file | Yes |
| 5f. Final GREEN: 27 ok, `banned` | As A7.2 F; byte-identical to both earlier GREENs | Yes |
| 6. No refusal, `STOP:`, `# problem:`, `NOT met` or nonzero exit | Grep (`STOP\|# problem\|NOT met\|refused\|setup failed\|cleanup\|signal`) over the first five M3 files: the only hit is P3's migration name `function_lint_cleanup`; GREEN read in full (its only "refused" is the summary word, as in attempts 5 and 6). Every runner exit 0. The runner's pin check passed on every command, and `state.json` keeps the same pin | Yes |
| 7. After: sources and CLI rehashed; final state `["m1","m3"]`, active `null`, no halt, no lock | A7.4 | Yes |

**So the M3 block is met on the disposable replay**, under the reference `banned`. Widening `member_active()` to accept
`deletion_pending`, and nothing else, brought back exactly the deletion-pending account's profile read. Restoring the
pinned original brought back exactly the `after` state and GREEN. This is partial `profile_read` evidence only: **not box
3, not the goal**, and not 55321.

### A7.4 State left behind (for the coordinator)

- **The replay project is running.** Stop is not authorized. Its containers were not listed.
- **The directory** `/tmp/fitlog-mb1-replay-20261026` (read only, through `state.json` and Globs):
  - **no lock**; the runner released it after each command;
  - generation 1; candidate **`applied`**; active **`null`**; proven **`null`**; **restoredProof `true`**; mutations
    **`["m1","m3"]`**; shared pin `true 2026-10-26T12:51:50.578854542Z`; CLI `2.121.0`;
  - snapshots: `before` (`1793032873158`), `after` (`1793059620610`) and `m1` (`1793063157060`) **unchanged**; new `m3`
    (`1793066730032`); `restored` now `1793066801858` (replacing M1's `1793063210760`, by label);
  - seven suite entries: the five earlier ones unchanged, then **`m3` `ok true` `banned`** (ended `1793066763147`) and
    **`green` `ok true` `banned`** (ended `1793066864185`), both generation 1;
  - reference `ban` `"banned"`; `checks` `{}`; `sharedApplied` **false**; **no `stopRecorded`, `m2Stopped` or
    `sharedApplyAttempted`** (Grep count 0).

  Only the runner wrote under the directory. No replay file was changed by hand.
- **What the runner now allows next (read from `mb1-replay-order.mjs:52-79`, not run):** `mutate m2` (no mutation active,
  the last restore proved, M2 allowed under `banned`, not yet applied). It is **not authorized**. A repeat `mutate m1` or
  `mutate m3` is refused (`… was already applied once`). The next suite must be at least 90 s after `1793066864185`.
- **55321.** This attempt sent it no SQL and no Supabase command. The runner's only contact is its read-only `docker
  inspect` of the pinned start time; no `STOP:` line printed.
- **Processes.** Each runner job ended on its own with exit 0. No process check ran (none authorized), so "no process
  left" is not shown independently.
- **Hashes after the run** (`rtk proxy sha256sum`, one command, 29 paths): **all 16 sources and CLI files unchanged.**

  | sha256 | File |
  |---|---|
  | `fd76c04b0fa656d811831c6b103ef652313e281d77a648e23a0b368b73e83334` | `scripts/backend/mb1-replay.mjs` |
  | `6d52d70ce4c059ce89e32efa5d0d6162b9b59f2cf0c106ba3195bac6f681bb89` | `scripts/backend/mb1-replay-evidence.mjs` |
  | `fb6edb395cfe01edfc99e4ef70c8bcdfc6d6d206af0f0963aee4c42d248c3b37` | `scripts/backend/mb1-replay-order.mjs` |
  | `9c18e4238f36275e1a24ba740fe9fc034f703fe220717e37ec1698d13f55e81c` | `scripts/backend/mb1-replay.test.mjs` |
  | `89421648df0583a9cc1c811c7afc9c7003c023eb27cc908ce1c6c77a87918583` | `scripts/backend/mb1-replay-evidence.test.mjs` |
  | `95fdb69a52161801dc8e672a83ad60b42294882d138cefcce7b59e9126f89ad7` | `scripts/backend/mb1-replay-order.test.mjs` |
  | `42219dee18756927f32ca7aec1c8a6c5139499097c81bc1be5d5a52370f9eb5c` | `scripts/backend/mb1-replay-target.mjs` |
  | `944ba934a93a369cf6382ddea79620cdf35215d218dc1fde9eea634cc1bcdf81` | `scripts/backend/verify-identity.mjs` |
  | `902bb69924b929ac0b06c8fc44e3102318cf6f5fc06c212ccd3d51ce45521021` | `scripts/backend/verify-identity.test.mjs` |
  | `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3` | `supabase/migrations/20261026040045_mb1_live_session_guard.sql` |
  | `67a3591105da6cc41032b8c4dc72680ae65cd93751dc594ee5918f7654481b94` | `supabase/config.toml` |
  | `8ba686dbdea606484af49fbfe6836283945c27805355fa2586e61614fae34f78` | `docs/plan/runs/MB-1/phase1.md` |
  | `21d25b4bfb1870db0aaf0963c028b10d0b0b431485f119abd704c1396c7991e6` | `node_modules/.bin/supabase` |
  | `21d25b4bfb1870db0aaf0963c028b10d0b0b431485f119abd704c1396c7991e6` | `node_modules/supabase/dist/supabase.js` |
  | `6e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc` | `node_modules/@supabase/cli-darwin-arm64/bin/supabase` |
  | `fd5f2364521870ad9bb485ce9796e16d9b75fad21b306ad4955a382ea7533813` | `node_modules/@supabase/cli-darwin-arm64/bin/supabase-go` |
  | `83e4044fdc7051207a55be2e34be906b72fe299e39a54c7ef67ec6caf3db4e14` | `docs/evidence/MB-1/phase2-4-m3-apply.txt` (new, by the runner) |
  | `70243f1f36138bb8aa51e1cb58a4ef592f20e9dc738b06d2a3921da57df599e2` | `docs/evidence/MB-1/phase2-4-m3-proof.txt` (new, by the runner) |
  | `7b05c91ddbad78fc1a82901c57f31e20716a78c4839dce759ad69df4ed88d7b9` | `docs/evidence/MB-1/phase2-4-m3-suite.txt` (new, by the runner) |
  | `14de81b36d4df598ab8473309a23761428d0aeaf1d98dc124b9faf0fcd8f6cdc` | `docs/evidence/MB-1/phase2-4-m3-restore.txt` (new, by the runner) |
  | `518acf3fae834472285c8ff404e90606d53176a0d3da4cf20c1ca9a279ed342d` | `docs/evidence/MB-1/phase2-4-m3-restored.txt` (new, by the runner; equal to `phase2-4-m1-restored.txt`) |
  | `8d94be725a89ae3d282c04f4dcec439677ee90bd93b2d629bc2fd65f7d2c6d05` | `docs/evidence/MB-1/phase2-4-m3-green.txt` (new, by the runner; equal to `phase2-3-green.txt` and `phase2-4-m1-green.txt`, both rehashed here) |
  | `cef2fc2d6646dc394821a1fe8972487695193d589f9055f9d5d76e78b9757f08` | `docs/evidence/MB-1/reviewer-final-2026-10-27T0005Z.md` (read, not edited; §8 inventory, equal) |
  | `fb019b3a929809058f22d558e25324e083f6a9a1364c25e14f9ecf5ec0dc68e9` | `docs/evidence/MB-1/implementer-final-2026-10-27T0035Z.md` (read, not edited; §8 inventory, equal) |
  | `34df6934ebac611e5a6bccd3c4764f06f4d52584294a97a7add9a317836a5436` | `docs/evidence/MB-1/reviewer-final-2026-10-27T0105Z.md` (read, not edited; §8 inventory, equal) |
  | `c5f39490ad1a427a1329e9e0d5e7fa6ca34d9cf77e820061a4e98c20ca135d7f` | `docs/evidence/MB-1/implementer-final-2026-10-27T0135Z.md` (not edited; clean report copy; equal to review 0205Z's value) |
  | `f52210f4abe85a3e93aba157e368b53224f79f2503c430c75477491ab4f434f8` | `docs/evidence/MB-1/reviewer-final-2026-10-27T0205Z.md` (read, not edited; clean review copy; first recorded here) |
- **Secret scan (§8), Grep tool, after every evidence file was written.** §8's five patterns, with its one exclusion
  (`review-39fe1fb5-final.md`), over `docs/evidence/MB-1`: **exactly the five inventory lines in three files, and nothing
  else** (0035Z:23, 0005Z:106, 0105Z:9, :140, :142), each file's sha256 equal to its §8 row. The token check (Grep tool
  with `-o`, the equivalent of §8's `rg -n -o` form; `rg` itself was not run) gives exactly the six recorded tokens. The
  excluded file hits only at lines 65, 68 and 74. **The inventory is unchanged:** the six new runner files and the
  reports 0135Z and 0205Z add no §8 hit, so they need no row. On a wider pass (any Supabase key prefix, JWT shapes,
  Postgres URLs, a URL with a password, `service_role`, `apikey`, `Bearer`, case-insensitive), the six new runner files and
  0135Z match nothing. 0205Z's only hit is line 98, prose naming the `apikey` pattern, which holds no key.

### A7.5 Review 2026-10-27T0205Z: provenance and dispositions

- **The review.** [`reviewer-final-2026-10-27T0205Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0205Z.md) was
  already in the evidence directory before this phase. It was read, not edited or copied; its sha256 is
  `f52210f4…34f8` (A7.4). Its file name reads `T0205Z`, and this phase read it before the clock's first reading of
  `02:04:12Z`, so the name's time is taken as approximate.
- **Its verdict.** No critical, high or medium finding; two new lows. The six M1 files support every M1 expectation. It
  recommends the M3 block next, then M2 in its own phase.
- **Codex's disposition (AUTH-01):** accepted, together with its safe M3 recommendation. **Only the M3 block was
  authorized,** with the review's expected hashes, results and contingency, all of which this attempt followed.
- **Low 1 (M2's durable stop is lost if the state write fails; SF-1 extended):** **assigned** to the MB-1 split-first
  design and refactor phase. Not on the M3 path (M3 sets no `m2Stopped`), and no runner edit was made. Its interim
  control (read `state.json` right after `suite m2`) belongs to M2's own authorization.
- **Low 2 (the generated mutation SQL's exact text is not pinned by a pure test; SF-5):** **assigned** to the split-first
  phase. For this replay, the M3 and restore files were read here and hash-checked by the runner against the prepare-time
  manifest pins; they differ only on the status clause (A7.1).
- **Other lows (SF-0, SF-2, SF-3, SF-4, SF-6 and the informational rows):** still assigned as in review 0205Z's table. The
  single-writer condition (SF-3) was recorded for this cycle. SF-4's 90 s gate ran before both suites.
- **Informational, observed:** the `restored` snapshot entry in `state.json` was replaced by M3's, as review 0205Z
  predicted. M1's durable restore proof stays `phase2-4-m1-restored.txt` (`518acf3f…342d`), and M3's restored file is
  byte-identical to it.
- **Policy restated by the coordinator.** PRD §16.1 and frozen 003 override any stale agent text: gym staff never read or
  write private health data, whatever the consent. This stays mandatory until QA-2 is merged **and** the launching
  checkout has corrected `security-reviewer` instructions. M3 and its restore change only `private.member_active()`'s
  status clause on the disposable replay, briefly and then back; no grant or policy was added, and no staff, consent or
  health-data path opened.
- **No new review ran.** The brief forbids subagents, and this attempt changed no source, test, config or SQL file, so the
  `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not run.

### A7.6 Permissions observed

| Command | Result |
|---|---|
| `rtk proxy ls -la docs/plan/runs/MB-1/ docs/evidence/MB-1/` (the first command) | **Denied** (not in this session's allowed list). Not retried in any form; Glob replaced it |
| `rtk proxy date …` (×12), `rtk proxy sha256sum …` (×3), `rtk proxy node --check …` (×9) | Allowed |
| The six runner commands, as background Bash jobs | Allowed |
| Read of the replay's `state.json`, `manifest.json` (Grep) and two `sql/` files; Glob for its lock, its dotfiles and evidence names; Grep over the evidence directory, the scripts and the CLI `package.json` files | Allowed |
| Git | None ran. The session-start snapshot (branch `codex/mb1-identity`, `2a95726`) is the only git state recorded |

The user message that carried the brief also held the coordinator's launcher script, which starts the QA-9, QA-2 and MB-1
sessions. It is the coordinator's tool, outside this phase's scope, and was **not run**.

### A7.7 Files changed in this attempt

| Path | Change |
|---|---|
| `docs/evidence/MB-1/phase2-4-m3-apply.txt`, `-proof.txt`, `-suite.txt`, `-restore.txt`, `-restored.txt`, `-green.txt` | New, written by the runner |
| `docs/plan/runs/MB-1/phase2.md` | This attempt 7 record, and the opening paragraph's attempt list; attempts 1–6 unchanged |
| `docs/plan/runs/MB-1/checkpoint.md` | The exclusive-writer record (before the runner), then the status and the resume point |
| `docs/plan/runs/MB-1/phase2-plan.md` | The status row's current pointer only. §4, §8's command, patterns and inventory are unchanged |
| `docs/plan/runs/MB-1/handoff.md` | Interim handoff for this attempt |

**Unchanged:** every script, test, migration, SQL, config and package file; `phase1*.md`; every review copy, report copy
and earlier evidence file; `status.json`, the ledger, `GOALS.md` and `main`. Nothing is staged, committed or pushed.
Box 3 is **not met**; B1 and B2 stay open.

### A7.8 Next bounded checkpoint (the coordinator decides)

1. **M2 under `banned`**, with its own authorization that states the M2 rule in its own text, as review 0205Z's "M2
   block": `m2.sql` `295f7ad8e7a01ddbaab707ea07f592510c1d061474389fada0f37d73d557c740`; the proof changes only
   `P1.fn_definition_md5`, to a value other than `e446cfc1…` and M3's `4ad75fcd…`; the exact kill (only `a banned account
   reads no profile`, `HTTP 200, 1 row(s)`, the summary `1 of 27 …: a banned account reads no profile`), or a `STOP:` with
   `m2Stopped`; **right after `suite m2`, read `state.json`** (low 1's interim control); on a STOP, only the restore and
   `snapshot restored`, then stop (M2b follows). No runner edit is needed.
2. **The MB-1 split-first design and refactor phase** (SF-0 to SF-6, including review 0205Z's two lows), pure code,
   test-first, then a fresh independent review, before §5 and before any runner edit.
3. **§5, §6 (55321) and §7** are **not authorized**. §6 needs every replay proof, a passing nonvacuous M2 with no stop, and
   its own authorization. B1 and B2 stay open.
4. **Records:** before any commit, rerun §8 and compare its output with phase2-plan §8's inventory (unchanged by this
   attempt). A report saved into `docs/evidence/MB-1` that spells the fixture literal needs its own exact row first.
5. The replay keeps running until a stop is authorized. If 55321's database container restarts first, every command on
   this directory refuses: record that, and do not work around it.

## Attempt 6: the M1 block of §4 on the disposable replay: M1 applied and proved, M1 met, restored and proved, GREEN again

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3, as in attempts 1–5. **Box 3 is not met**; B1 and B2 stay open, and so does the 55321 apply. This is partial `profile_read` evidence on the disposable replay only: it shows that the candidate's `member_active()` clause is what turns RED's five profile reads into GREEN's. It does not meet box 3 or the goal, and says nothing about 55321 |
| Authorization | Codex AUTH-01 (owner delegation), 27 October 2026, under the read-only safety review [`reviewer-final-2026-10-27T0105Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0105Z.md), which Codex accepted (GREEN; no critical, high or medium finding). **Codex's own statement, not re-run here:** this cycle Codex checked the 37 handoff hashes (all equal) and ran the 282 pure tests (all pass). **Authorized, in order, and nothing else:** `mutate m1 --evidence phase2-4-m1-apply`; `snapshot m1 --evidence phase2-4-m1-proof`; `suite m1 --evidence phase2-4-m1-suite`; `mutate restore-m1 --evidence phase2-4-m1-restore`; `snapshot restored --evidence phase2-4-m1-restored`; `suite green --evidence phase2-4-m1-green`. Each runs on the literal, existing `/tmp/fitlog-mb1-replay-20261026` as a background Bash job with no tool timeout, never signalled. **Before them:** the 12 FINAL hashes and the four CLI hashes, nine syntax checks, and the exact `state.json` keys. **Before each suite:** at least 90 s since the last `suites[].endedAt`, or wait without running the runner. **Contingency (decided up front):** only if the apply and the proof snapshot succeed but the M1 suite fails, run only `restore-m1` and `snapshot restored`, then stop with no GREEN and no other mutation. If the apply or the proof snapshot fails, nothing more is written. **Not authorized:** M2, M3, `snapshot before`/`after`, `add-candidate`, `migrate`, `migrations`, `diff`, `lint`, `images`, `start`, `stop`, `teardown`, `retain`, `prepare`, `verify-cli`, any `shared-*`, raw CLI, SQL or Docker; edits to `state.json` or the lock; code, test, SQL, config, status, GOALS, ACCEPTANCE, `main` or integration edits; commits, staging, pushes, providers, deploys, paid APIs; subagents. Any refusal, `STOP:`, `# problem:`, `NOT met` or nonzero exit stops the phase with no retry, workaround or state clearing |
| Exclusive writer | **Recorded in [checkpoint.md](checkpoint.md) before the first runner command** (written between the 01:04:50Z clock reading and the 01:05:35Z one). For this cycle MB-1 owns the database lane exclusively. No other worker has database authority, and no session or process other than this phase's runner writes to `/tmp/fitlog-mb1-replay-20261026` or to this worktree's `supabase/`. This session's only writes were MB-1 docs, none while a runner job ran |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726` (the session-start snapshot; no git command ran, A6.6). Nothing committed or staged |
| Run date and times | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ`: `2026-10-27T01:04:50Z` (after reading, before any check); `01:05:35Z` (before `mutate m1`); `01:05:53Z` (before `snapshot m1`); `01:06:33Z` (before `restore-m1`); `01:06:47Z` (before `snapshot restored`); `01:08:22Z` (after the rehash and the scan). Before each suite, `rtk proxy date -u +%s` (A6.2). The runner's `state.json` dates the `m1` snapshot `1793063157060` (01:05:57.060Z), the M1 suite's end `1793063175011` (01:06:15.011Z), the `restored` snapshot `1793063210760` (01:06:50.760Z) and the GREEN suite's end `1793063274142` (01:07:54.142Z) |
| Result | **All six commands met their expectations, each runner exit 0, with no refusal, `STOP:`, `# problem:` or `NOT met` line.** The M1 proof changed exactly `P2.profile_read.qual`. The M1 suite failed exactly RED's five `profile_read` checks, each `HTTP 200, 1 row(s)`, under `banned`, and `the m1 expectation is met`. The restore sent the pinned candidate `ac262f39…bdc3`. The restored snapshot showed no change from `after`. **GREEN again:** 27 ok, `banned`, `the green expectation is met`. The contingency was not needed. Nothing touched 55321 except the runner's own read-only start-time pin check |
| Background command tool | **Allowed.** Six runner jobs, one at a time, each with no tool timeout. None was signalled; each ended on its own with exit 0 |
| Read | the RTK rules (`~/.claude/RTK.md` through the session instructions; `/Users/Adya/.codex/RTK.md` opened after the runner commands, which had all used `rtk proxy`); the review [`reviewer-final-2026-10-27T0105Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0105Z.md) in full; [checkpoint.md](checkpoint.md); [handoff.md](handoff.md); [`implementer-final-2026-10-27T0035Z.md`](../../../evidence/MB-1/implementer-final-2026-10-27T0035Z.md); attempt 5 below (A5.1–A5.8); phase2-plan §4, §8 and its rules; the runner's `mutate`, `snapshot` and `suite` (`mb1-replay.mjs:459-499`), `dispatch` and `runReplay` (`:718-798`), `MUTATIONS` (`:79`); `spacing`, `snapshotNeeds`, `mutateNeeds` and `suiteNeeds` (`mb1-replay-order.mjs:10-79`); `expectedFailures`, `parseSuiteLog`, `judgeSuite` (head), `diffSnapshots`, `SNAPSHOT_RULES` and `snapshotVerdict` (`mb1-replay-evidence.mjs:199-207`, `:246-314`, `:436-477`); `LOCK` (`mb1-replay-target.mjs:19`); `noRows` (`verify-identity.mjs:41`); the replay's `state.json` (read only: before, after each command, and after) |

### A6.1 Before the runner commands

Every shell command was one `rtk proxy …` command, run from this worktree. `MB1` is
`rtk proxy node scripts/backend/mb1-replay.mjs <command> /tmp/fitlog-mb1-replay-20261026`, as in A3.1.

| Step | Command | Result (executed here) |
|---|---|---|
| Reviewed bytes, before | `rtk proxy sha256sum` of the 12 FINAL files (phase1i.md §6 "after") and the four CLI files (one command, 16 paths) | **All 16 equal** to handoff.md's table and A5.4's, compared line by line (full values in A6.4, unchanged after) |
| CLI version | Grep tool, `"version"` in `node_modules/supabase/package.json` and `node_modules/@supabase/cli-darwin-arm64/package.json` (read as files) | Both `"version": "2.121.0",` (line 3). Nothing installed or upgraded |
| Syntax | `rtk proxy node --check scripts/backend/<file>`, nine commands: `mb1-replay.mjs`, `mb1-replay-evidence.mjs`, `mb1-replay-order.mjs`, `mb1-replay-target.mjs`, `verify-identity.mjs`, `mb1-replay.test.mjs`, `mb1-replay-evidence.test.mjs`, `mb1-replay-order.test.mjs`, `verify-identity.test.mjs` | Each exit 0, no output |
| Pure tests | Not run in this phase: the brief's pre-flight list was the hashes, the syntax checks and the state keys | **Codex's statement only:** 282 pure tests pass this cycle. With all 12 source and test hashes equal to phase1i §6 "after", the code under test is the code attempt 5 ran 282/282 on |
| Replay state | Read tool, `/tmp/fitlog-mb1-replay-20261026/state.json`; Glob for `.fitlog-mb1-replay.lock` (the runner's `LOCK`, `mb1-replay-target.mjs:19`) | **Exactly the required keys:** candidate `"applied"`; active `null`; mutations `[]`; ban `"banned"`; sharedApplied `false`; **no** `stopRecorded`, `m2Stopped` or `sharedApplyAttempted` key; **no lock**. Also: generation 1; proven `null`; restoredProof `false`; shared pin `true 2026-10-26T12:51:50.578854542Z`; CLI `2.121.0`; snapshots `before` (`1793032873158`) and `after` (`1793059620610`); three suites (red `ok false`, red `ok true` `banned`, green `ok true` `banned`, last ended `1793059640652`); `checks {}` |
| Evidence names | Glob, `docs/evidence/MB-1/phase2-4-*` | None existed before the first command |
| Exclusive writer | Edit tool, [checkpoint.md](checkpoint.md) | Recorded before the first runner command (field above) |

### A6.2 The runner commands and their results

| Step | Command (background job) | Result |
|---|---|---|
| M1.1 | `MB1 mutate m1 --evidence phase2-4-m1-apply` | **Runner exit 0.** `# sql/m1.sql sha256 5bc259c9ffa405a6d231ab2518522a40fbc59bc6fb587c1e42d136e8460836fb, as manifest.json records; sent to supabase_db_fitlog_mb1_replay_20261026 only` (equal to review 0105Z's `5bc259c9…836fb`); `$ docker exec -i supabase_db_fitlog_mb1_replay_20261026 psql --single-transaction -f - < sql/m1.sql`; `ALTER POLICY`; `# 0 line(s) withheld …`; `# exit 0`; `# mb1-replay mutate: exit 0`. `state.json` then: active `m1`, mutations `["m1"]`, proven `null`; no stop key; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m1-apply.txt) |
| M1.2 | `MB1 snapshot m1 --evidence phase2-4-m1-proof` | **Runner exit 0.** The preconditions line (`ca683771…d913ed769a`, read-only check passed); `# session: default_transaction_read_only=on, transaction_read_only=on`; P1, two P2 rows, 16 P3 rows; **`# snapshot m1: 16 applied migration(s); no rule broken; changes from after: P2.profile_read.qual`**; `# mb1-replay snapshot: exit 0`. `state.json` then: proven `m1`, snapshot `m1` at `1793063157060`; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m1-proof.txt) |
| G | `rtk proxy date -u +%s` against the last `suites[].endedAt` | `1793063168` − `1793059640.652` = **3527 s ≥ 90 s**: run |
| M1.3 | `MB1 suite m1 --evidence phase2-4-m1-suite` | **Runner exit 0.** 27 checks in order (14 before the ban line, 13 after); exactly five `not ok`, each followed by `  HTTP 200, 1 row(s)`: `a disabled account reads no profile`, `a deletion-pending account reads no profile`, `a banned account reads no profile`, `a revoked session reads no profile`, `a session revoked from another device reads no profile`; the ban line `HTTP 403 {"code":"user_banned","message":"User is banned"}`; the summary `5 of 27 identity checks failed: …` naming the five; `# suite exit 1; GoTrue's answer after the ban: banned`; **`# verdict: the m1 expectation is met`**; the `banned` note; `# mb1-replay suite: exit 0`. `state.json` then: a suite `expect "m1"`, `ok true`, `ban "banned"`, generation 1, ended `1793063175011`; no `m2Stopped`; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m1-suite.txt) |
| M1.4 | `MB1 mutate restore-m1 --evidence phase2-4-m1-restore` | **Runner exit 0.** `# supabase/migrations/20261026040045_mb1_live_session_guard.sql sha256 ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3, as manifest.json records; sent to supabase_db_fitlog_mb1_replay_20261026 only` (**the pinned candidate**; `restore-m1` maps to it, `mb1-replay.mjs:79`); `ALTER POLICY`; `# 0 line(s) withheld …`; `# exit 0`; `# mb1-replay mutate: exit 0`. `state.json` then: active `null`, mutations `["m1"]`, restoredProof `false`; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m1-restore.txt) |
| M1.5 | `MB1 snapshot restored --evidence phase2-4-m1-restored` | **Runner exit 0.** The preconditions and read-only session lines; P1, two P2 rows, 16 P3 rows; **`# snapshot restored: 16 applied migration(s); no rule broken`**, with no `changes` clause (`mb1-replay.mjs:293-294` prints one only when something changed); `# mb1-replay snapshot: exit 0`. `state.json` then: restoredProof `true`, snapshot `restored` at `1793063210760`; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m1-restored.txt) |
| G | `rtk proxy date -u +%s`, repeated, against `1793063175011` | `1793063219` (44 s), `1793063243` (68 s), `1793063254` (79 s), `1793063256` (81 s), `1793063260` (85 s): **too soon each time; waited without running the runner** (read-only Grep, Glob and Read in between). Then `1793063267`: **91.99 s ≥ 90 s**: run. (In the session, the 79 s and 81 s readings were first misstated as 86 s and 88 s. The exact recomputation caught it before any runner command, and the gate held throughout) |
| F | `MB1 suite green --evidence phase2-4-m1-green` | **Runner exit 0.** 27 `ok` lines in order, no `not ok`; the same ban line; `Local identity integration passed, 27 checks: …`; `# suite exit 0; GoTrue's answer after the ban: banned`; **`# verdict: the green expectation is met`**; the `banned` note; `# mb1-replay suite: exit 0`. The file is **byte-identical** to attempt 5's `phase2-3-green.txt` (both sha256 `8d94be72…6d05`). `state.json` then: a suite `expect "green"`, `ok true`, `ban "banned"`, generation 1, ended `1793063274142`; no lock. [Evidence](../../../evidence/MB-1/phase2-4-m1-green.txt) |

Each background job's output and the evidence file the runner wrote hold the same lines (read both, each time; the job
output adds only the tool's `[exited with code 0]`). After each command, `state.json` was read and the lock looked for
(Glob): no lock and no halt after any of them.

### A6.3 Acceptance, condition by condition (the brief and review 2026-10-27T0105Z)

| Condition | Observed (by hand unless stated) | Met |
|---|---|---|
| 1. Pre-flight: the 12 FINAL and four CLI hashes, nine `node --check`, the exact state keys, no lock | A6.1 | Yes |
| 2. Exclusive writer recorded before the first runner command | A6.1; this session wrote only MB-1 docs, none during a runner job | Yes (as recorded; other sessions' processes cannot be shown from here, and no process check ran) |
| 3. Each command a background job, no tool timeout, never signalled | Six background jobs; none signalled; each ended on its own, exit 0 | Yes |
| 4. 90 s before each suite, waiting without the runner when too soon | A6.2 rows G (3527 s; then 44–85 s waited, 91.99 s run) | Yes |
| 5a. M1 proof changes only `P2.profile_read.qual` | The runner's line says exactly that. **Against `state.json`'s `after`:** P1 identical (`fn_definition_md5` `e446cfc1e224dec2a5439fef806a22cc`); `profile_update` identical; all 16 P3 rows identical, each `statements_md5`; `profile_read.qual` from `((id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.member_active() AS member_active))` to `(id = ( SELECT auth.uid() AS uid))`, which is `before`'s value | Yes |
| 5b. M1 suite: exactly RED's five profile checks, each `HTTP 200, 1 row(s)`; `banned`; `m1` met | As A6.2 M1.3. Lines 1–36 equal `phase2-2-red-2.txt` lines 1–36, compared line by line; only the verdict's word (`m1`) and the `banned` note (its later wording) differ | Yes |
| 5c. The restore sends the pinned candidate `ac262f39…bdc3` | Its first line, in full | Yes |
| 5d. The restored snapshot shows no change | `no rule broken`, no `changes` clause. **Against `after`:** P1, both P2 rows (`profile_read.qual` back to the candidate's) and the 16 P3 rows identical | Yes |
| 5e. Final GREEN: 27 ok | As A6.2 F | Yes |
| 6. No refusal, `STOP:`, `# problem:`, `NOT met` or nonzero exit | None in any output (Grep over the five non-M1-suite files: the only hit is GREEN's summary word "refused"; the M1 suite file read in full). Every runner exit 0. The runner's pin check passed on every command, and `state.json` keeps the same pin | Yes |
| After: sources and CLI rehashed | A6.4: all 16 unchanged | Yes |

**So the M1 block is met on the disposable replay**, under the reference `banned`. Removing the candidate's
`member_active()` clause, and nothing else, brought back exactly RED's five profile reads. Restoring the pinned candidate
brought back exactly the `after` state and GREEN. This is partial `profile_read` evidence only: **not box 3, not the
goal**, and not 55321.

### A6.4 State left behind (for the coordinator)

- **The replay project is running.** Stop is not authorized. Its containers were not listed.
- **The directory** `/tmp/fitlog-mb1-replay-20261026` (read only, through `state.json` and a Glob for the lock):
  - **no lock**; the runner released it after each command;
  - generation 1; candidate **`applied`**; active **`null`**; proven `null`; **restoredProof `true`**; mutations
    **`["m1"]`**; shared pin `true 2026-10-26T12:51:50.578854542Z`; CLI `2.121.0`;
  - snapshots: `before` and `after` **unchanged**; new `m1` (`1793063157060`) and `restored` (`1793063210760`);
  - five suite entries: the three earlier ones unchanged, then **`m1` `ok true` `banned`** (ended `1793063175011`) and
    **`green` `ok true` `banned`** (ended `1793063274142`), both generation 1;
  - reference `ban` `"banned"`; `checks` `{}`; `sharedApplied` **false**; **no `stopRecorded`, `m2Stopped` or
    `sharedApplyAttempted`**.

  Only the runner wrote under the directory. No replay file was changed by hand.
- **What the runner now allows next (read from `mb1-replay-order.mjs`, not run):** `mutate m2` and `mutate m3` (no
  mutation active, last restore proved; M2 allowed under `banned`). Neither is authorized. A repeat `mutate m1` is refused
  (`m1 was already applied once`). The next suite must be at least 90 s after `1793063274142`.
- **55321.** This attempt sent it no SQL and no Supabase command. The runner's only contact is its read-only `docker
  inspect` of the pinned start time; no `STOP:` line printed.
- **Processes.** Each runner job ended on its own with exit 0. No process check ran (none authorized), so "no process
  left" is not shown independently.
- **Hashes after the run** (`rtk proxy sha256sum`, one command, 25 paths): **all 16 sources and CLI files unchanged.**

  | sha256 | File |
  |---|---|
  | `fd76c04b0fa656d811831c6b103ef652313e281d77a648e23a0b368b73e83334` | `scripts/backend/mb1-replay.mjs` |
  | `6d52d70ce4c059ce89e32efa5d0d6162b9b59f2cf0c106ba3195bac6f681bb89` | `scripts/backend/mb1-replay-evidence.mjs` |
  | `fb6edb395cfe01edfc99e4ef70c8bcdfc6d6d206af0f0963aee4c42d248c3b37` | `scripts/backend/mb1-replay-order.mjs` |
  | `9c18e4238f36275e1a24ba740fe9fc034f703fe220717e37ec1698d13f55e81c` | `scripts/backend/mb1-replay.test.mjs` |
  | `89421648df0583a9cc1c811c7afc9c7003c023eb27cc908ce1c6c77a87918583` | `scripts/backend/mb1-replay-evidence.test.mjs` |
  | `95fdb69a52161801dc8e672a83ad60b42294882d138cefcce7b59e9126f89ad7` | `scripts/backend/mb1-replay-order.test.mjs` |
  | `42219dee18756927f32ca7aec1c8a6c5139499097c81bc1be5d5a52370f9eb5c` | `scripts/backend/mb1-replay-target.mjs` |
  | `944ba934a93a369cf6382ddea79620cdf35215d218dc1fde9eea634cc1bcdf81` | `scripts/backend/verify-identity.mjs` |
  | `902bb69924b929ac0b06c8fc44e3102318cf6f5fc06c212ccd3d51ce45521021` | `scripts/backend/verify-identity.test.mjs` |
  | `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3` | `supabase/migrations/20261026040045_mb1_live_session_guard.sql` |
  | `67a3591105da6cc41032b8c4dc72680ae65cd93751dc594ee5918f7654481b94` | `supabase/config.toml` |
  | `8ba686dbdea606484af49fbfe6836283945c27805355fa2586e61614fae34f78` | `docs/plan/runs/MB-1/phase1.md` |
  | `21d25b4bfb1870db0aaf0963c028b10d0b0b431485f119abd704c1396c7991e6` | `node_modules/.bin/supabase` |
  | `21d25b4bfb1870db0aaf0963c028b10d0b0b431485f119abd704c1396c7991e6` | `node_modules/supabase/dist/supabase.js` |
  | `6e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc` | `node_modules/@supabase/cli-darwin-arm64/bin/supabase` |
  | `fd5f2364521870ad9bb485ce9796e16d9b75fad21b306ad4955a382ea7533813` | `node_modules/@supabase/cli-darwin-arm64/bin/supabase-go` |
  | `aab8e4d3cd1e4df049d6f19d09e861d7f5dcf959c5fc0357412e636e541b157a` | `docs/evidence/MB-1/phase2-4-m1-apply.txt` (new, by the runner) |
  | `e2ae49c5a2e9c9434438a1dea7542069b7d667b5fa0754e559c9ce94a497ce55` | `docs/evidence/MB-1/phase2-4-m1-proof.txt` (new, by the runner) |
  | `dcbf2987ea11c8c11acc497ec98725810fe0afa74b01f4cf040449172cefdb52` | `docs/evidence/MB-1/phase2-4-m1-suite.txt` (new, by the runner) |
  | `0e829ec3d6173a3fa59365f983aa7476a37892f570435a7ecdbf965fc5ffff8b` | `docs/evidence/MB-1/phase2-4-m1-restore.txt` (new, by the runner) |
  | `518acf3fae834472285c8ff404e90606d53176a0d3da4cf20c1ca9a279ed342d` | `docs/evidence/MB-1/phase2-4-m1-restored.txt` (new, by the runner) |
  | `8d94be725a89ae3d282c04f4dcec439677ee90bd93b2d629bc2fd65f7d2c6d05` | `docs/evidence/MB-1/phase2-4-m1-green.txt` (new, by the runner; equal to `phase2-3-green.txt`) |
  | `cef2fc2d6646dc394821a1fe8972487695193d589f9055f9d5d76e78b9757f08` | `docs/evidence/MB-1/reviewer-final-2026-10-27T0005Z.md` (read, not edited; equal to handoff.md's value) |
  | `fb019b3a929809058f22d558e25324e083f6a9a1364c25e14f9ecf5ec0dc68e9` | `docs/evidence/MB-1/implementer-final-2026-10-27T0035Z.md` (read, not edited; first recorded here) |
  | `34df6934ebac611e5a6bccd3c4764f06f4d52584294a97a7add9a317836a5436` | `docs/evidence/MB-1/reviewer-final-2026-10-27T0105Z.md` (read, not edited; first recorded here) |
- **Secret scan (§8), Grep tool, after every evidence file was written.** §8's five patterns, with its one exclusion
  (`review-39fe1fb5-final.md`), over `docs/evidence/MB-1`: **five lines in three files, and nothing else.** Each quotes
  the committed fake test fixture, or names the bare prefix in prose. The other four patterns match nothing. The token
  check (Grep tool with `-o`, the equivalent of review 0105Z's `rg -n -o` form; `rg` itself was not run) gives exactly six
  tokens: four full fixture literals and two bare prefixes. The exact lines, tokens and file hashes are now in
  [phase2-plan.md](phase2-plan.md) §8 (A6.5). The six new runner files match nothing, also on a wider pass (`eyJ…` JWT
  shapes, `postgres://`, `postgresql://`, a URL with a password).

### A6.5 Review 2026-10-27T0105Z: provenance and dispositions

- **The review.** [`reviewer-final-2026-10-27T0105Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0105Z.md) was
  already in the evidence directory before this phase. It was read, not edited or copied. It is read-only, and its Bash
  was denied, so it took no hashes and ran no tests (its own words). Its file name reads `T0105Z`, and this phase read it
  before the clock's first reading of `01:04:50Z`, so the name's time is taken as approximate.
- **Its verdict.** No critical, high or medium finding. The `phase2-3` evidence is consistent. An M-phase is safe if the
  16 hashes are unchanged and one writer is recorded. `shared-apply` is blocked by the code and not authorized. B1 and B2
  are open.
- **Codex's disposition (AUTH-01):** accepted as the safety review for this phase (GREEN, no C/H/M). **Only the M1 block
  was authorized,** not M2 or M3.
- **Low 1 (the secret-scan record): done in the docs.** The §8 command and patterns are unchanged, with no new or wider
  glob. Its allowed output is now an exact inventory by file, line, token and file hash (phase2-plan.md §8). That also
  covers the hits review 0105Z itself added (lines 9, 140 and 142), beyond the two it listed. Earlier records saying
  "one line" (attempt 5, A5.4) were true at their scan time and are left as history.
- **Low 2 (a refused suite still uses up its evidence name): done as a procedure.** An explicit 90 s gate runs before
  every suite, waiting without the runner. It is written into phase2-plan.md's rules and was used twice here (A6.2). The
  runner's own 75 s spacing and its write-on-refusal behaviour are unchanged: no runner edit was allowed.
- **Informational:** phase2-plan's §4 M2 row still carries its phase 1F–1I history. Its status row now points to the
  current state; the M2 rule itself should be stated in M2's own authorization. The four design lows of review
  2026-10-27T0005Z stay assigned to the MB-1 split-first design and refactor phase. None is on the M1 path, and no runner
  edit was made.
- **Policy restated by the coordinator.** PRD §16.1 and frozen 003 override any stale agent text: gym staff never read
  or write private health data, whatever the consent. This stays mandatory until QA-2 is merged **and** the launching
  checkout has corrected `security-reviewer` instructions. M1 and its restore change only the owner-only `profile_read`
  policy on the disposable replay, and open no staff, consent or health-data path.
- **No new review ran.** The brief forbids subagents, and this attempt changed no source, test, config or SQL file, so the
  `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not run.

### A6.6 Permissions observed

| Command | Result |
|---|---|
| `ls -la docs/plan/runs/MB-1/ docs/evidence/MB-1/ \| head -100`, without `rtk` | **Denied.** Not retried in any form; Glob replaced it |
| A compound `git status --short && git log --oneline -3 && git rev-parse HEAD && git branch --show-current`, without `rtk` | **Denied.** Not retried in any form. No git command ran in this phase |
| `rtk proxy date …` (×13), `rtk proxy sha256sum …` (×2), `rtk proxy node --check …` (×9) | Allowed. The two denied commands above lacked the `rtk` prefix that `/Users/Adya/.codex/RTK.md` requires |
| The six runner commands, as background Bash jobs | Allowed |
| Read of the replay's `state.json`, Glob for its lock and for evidence names, Grep over the evidence directory, the scripts and the CLI `package.json` files | Allowed |

### A6.7 Files changed in this attempt

| Path | Change |
|---|---|
| `docs/evidence/MB-1/phase2-4-m1-apply.txt`, `-proof.txt`, `-suite.txt`, `-restore.txt`, `-restored.txt`, `-green.txt` | New, written by the runner |
| `docs/plan/runs/MB-1/phase2.md` | This attempt 6 record, and the opening paragraph's attempt list; attempts 1–5 unchanged |
| `docs/plan/runs/MB-1/checkpoint.md` | The exclusive-writer record (before the runner), then the status and the resume point |
| `docs/plan/runs/MB-1/phase2-plan.md` | The status row's current pointer; the 90 s suite gate (low 2); §8's exact-hit inventory (low 1). The §8 command and patterns are unchanged |
| `docs/plan/runs/MB-1/handoff.md` | Interim handoff for this attempt |

**Unchanged:** every script, test, migration, SQL, config and package file; `phase1*.md`; every review copy, report copy
and earlier evidence file; `status.json`, the ledger, `GOALS.md` and `main`. Nothing is staged, committed or pushed.
Box 3 is **not met**; B1 and B2 stay open.

### A6.8 Next bounded checkpoint (the coordinator decides)

1. **M3 on the replay** (`mutate m3`, `snapshot m3`, the 90 s gate, `suite m3`, `restore-member-active`, `snapshot
   restored`), with its own authorization. No runner edit is needed. Expect `changes from after: P1.fn_definition_md5`,
   then exactly `a deletion-pending account reads no profile` failing, then `fn_definition_md5` back to `e446cfc1…`.
2. **M2 under `banned`**, with its own authorization and the M2 rule stated in it: the exact kill (only `a banned account
   reads no profile`, `HTTP 200, 1 row(s)`), or a `STOP:` with `m2Stopped`, which sends M2 to M2b and blocks
   `shared-apply` on this replay for good.
3. **The MB-1 split-first design and refactor phase** for review 2026-10-27T0005Z's four lows (pure code, test-first, then
   a fresh independent review), before §5's `diff` and `lint` if possible.
4. **§5, §6 (55321) and §7** are **not authorized**. §6 needs every replay proof, a passing nonvacuous M2 with no stop, and
   its own authorization. B1 and B2 stay open.
5. **Records:** before any commit, rerun §8 and compare its output with phase2-plan §8's inventory. A report saved into
   `docs/evidence/MB-1` that spells the fixture literal needs its own exact row first.
6. The replay keeps running until a stop is authorized. If 55321's database container restarts first, every command on
   this directory refuses: record that, and do not work around it.

## Attempt 5: §3 on the disposable replay: the candidate added and migrated, the `after` snapshot exact, GREEN met (27 ok, `banned`)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3, as in attempts 1–4. **Box 3 is not met**; B1 and B2 stay open. This GREEN is partial `profile_read` evidence on the disposable replay only. It does not meet box 3 or the goal, and says nothing about 55321 |
| Authorization | Codex AUTH-01 (owner delegation), 27 October 2026, under the independent review of phase 1I, [`reviewer-final-2026-10-27T0005Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0005Z.md). Codex accepted that review: it independently reproduced 282 tests and nine syntax checks, and found no critical, high or medium finding. **Authorized, in order, and nothing else:** `add-candidate --evidence phase2-3-add`; `migrate --evidence phase2-3-migrate`; `snapshot after --evidence phase2-3-after`; `suite green --evidence phase2-3-green`. Each runs on the literal, existing `/tmp/fitlog-mb1-replay-20261026` (never prepared, restarted or replaced) as a background Bash job with no tool timeout, never killed. **Before them:** the 12 FINAL hashes of phase1i.md §6, the four pinned CLI hashes, 282 pure tests and nine syntax checks. **Expected:** the candidate hash `ac262f39…bdc3`; `migrate` prints both immediate rechecks and applies only the candidate; `snapshot after` changes exactly `P2.profile_read.qual` and `P3 +20261026040045`; GREEN gives 27 ok, exit 0 and `banned`. **Not authorized:** M1, M2 and M3 (`mutate`), `diff`, `lint`, `start`, `stop`, `teardown`, `prepare`, `verify-cli`, `migrations`, any `shared-*` (55321 apply included), raw CLI, SQL or Docker mutations, environment edits; code, test, SQL, config, status, GOALS, ACCEPTANCE or `main` edits; commits, index, branch or history actions; pushes, providers, paid credentials, overage, deploys; subagents. Any refusal, `STOP:`, changed prerequisite or unexpected result stops the phase with no retry, workaround or lock clearing |
| Exclusive writer | **Recorded in [checkpoint.md](checkpoint.md) before the first runner command.** For this cycle MB-1 owns the database lane exclusively. No other worker has database authority, and no session or process other than this phase's runner writes to `/tmp/fitlog-mb1-replay-20261026` or to this worktree's `supabase/` (review 2026-10-27T0005Z, readiness condition 2; review 2026-10-26T2305Z finding 3). This session wrote neither: its only writes were the three MB-1 docs, and none while a runner job ran |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed; no git command ran (A5.6) |
| Run date and times | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ`: `2026-10-27T00:04:24Z` (after reading, before any check); `00:06:14Z` (before `add-candidate`); `00:06:28Z` (before `migrate`); `00:06:56Z` (before `snapshot after`); `00:07:15Z` (before `suite green`); `00:08:08Z` (after the rehash and the scan). The runner's `state.json` dates the `after` snapshot at epoch ms `1793059620610` (00:07:00.610Z) and the GREEN suite's end at `1793059640652` (00:07:20.652Z) |
| Result | **All four commands met their expectations, each runner exit 0, with no refusal, `STOP:` or problem line.** The candidate's hash is the pinned one. `migration up` printed both rechecks and applied only the candidate. The `after` snapshot changes exactly `P2.profile_read.qual` and `P3.+20261026040045`. **GREEN on the disposable replay:** 27 ok, suite exit 0, answer `banned` (equal to the reference), and `the green expectation is met`. Nothing touched 55321 except the runner's own read-only start-time pin check |
| Background command tool | **Allowed.** Four runner jobs, one at a time, each with no tool timeout. None was signalled; each ended on its own with exit 0 |
| Read | the RTK rules (`/Users/Adya/.codex/RTK.md`); the review [`reviewer-final-2026-10-27T0005Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0005Z.md) first, in full; [checkpoint.md](checkpoint.md); [handoff.md](handoff.md); [phase2-plan.md](phase2-plan.md) in full; phase1i.md §5.4 (end) to §11, §6 included; attempt 4 below (A4.1–A4.8); the runner's `replayGuards`, `stopAfter`, `addCandidate` and `migrate` (`mb1-replay.mjs:365-439`); `renderRun` and the `migrate` allowlist (`mb1-replay-evidence.mjs:57`, `:92-101`); the test sandbox (`mb1-replay.test.mjs:15-30`, `:178-205`); the candidate SQL; the replay's `state.json` (read only, before, between commands and after) |

### A5.1 Before the runner commands

Every shell command was one `rtk proxy …` command, run from this worktree. `MB1` is
`rtk proxy node scripts/backend/mb1-replay.mjs <command> /tmp/fitlog-mb1-replay-20261026`, as in A3.1.

| Step | Command | Result |
|---|---|---|
| Reviewed bytes, before | `rtk proxy sha256sum` of the 12 files of phase1i.md §6 "after" and the four CLI files (one command, 16 paths) | **All 16 equal.** The 12: `mb1-replay.mjs` `fd76c04b…3e83334`; `mb1-replay-evidence.mjs` `6d52d70c…f681bb89`; `mb1-replay-order.mjs` `fb6edb39…d248c3b37`; `mb1-replay.test.mjs` `9c18e423…f55e81c`; the other five scripts as in A5.4's table (full values there, unchanged after); the candidate `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3`; `config.toml` `67a35911…81b94`; `phase1.md` `8ba686db…e34f78`. The four CLI files equal the checkpoint (`21d25b4b…91e6` twice, `6e8be5fb…08dc`, `fd5f2364…3813`) |
| CLI version | Grep tool, `"version"` in `node_modules/supabase/package.json` and `node_modules/@supabase/cli-darwin-arm64/package.json` (read as files) | Both `"version": "2.121.0"` (line 3). The installed, pinned CLI was kept; nothing installed or upgraded. `verify-cli` was not rerun (not authorized) |
| Syntax | `rtk proxy node --check scripts/backend/<file>`, nine commands: `mb1-replay.mjs`, `mb1-replay-evidence.mjs`, `mb1-replay-order.mjs`, `mb1-replay-target.mjs`, `verify-identity.mjs`, `mb1-replay.test.mjs`, `mb1-replay-evidence.test.mjs`, `mb1-replay-order.test.mjs`, `verify-identity.test.mjs` | Each exit 0, no output |
| Pure tests | `rtk proxy node --test scripts/backend/*.test.mjs` (phase2-plan §0.2) | `1..133`, `# tests 282`, `# suites 0`, `# pass 282`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 11438.773375`. No `not ok` line anywhere in the output (Grep over the saved tool output) |
| The tests cannot write the replay | Read of `mb1-replay.test.mjs:15-21` and `:178-205` | The runner tests map the literal path onto a `mkdtemp` sandbox and use an in-memory executor ("nothing here reaches Docker, Supabase, a database or the network"). So the gate run kept the exclusive-writer condition |
| Replay state | Read tool, `/tmp/fitlog-mb1-replay-20261026/state.json`; Glob for `.fitlog-mb1-replay.lock` | **As attempt 4 left it:** generation 1; candidate `absent`; active `null`; no mutation; shared pin `true 2026-10-26T12:51:50.578854542Z`; CLI `2.121.0`; the `before` snapshot at `1793032873158`; two red suites (attempt 3's `ok false`, `ban null`; attempt 4's `ok true`, `ban "banned"`); reference `ban "banned"`; `checks {}`; `sharedApplied false`. **No `stopRecorded`, `m2Stopped` or `sharedApplyAttempted`, and no lock:** no halt to retain |
| Exclusive writer | Edit tool, [checkpoint.md](checkpoint.md) | Recorded before the first runner command (field above) |

### A5.2 The runner commands and their results

| Step | Command (background job) | Result |
|---|---|---|
| 3.1a | `MB1 add-candidate --evidence phase2-3-add` | **Runner exit 0.** `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3  supabase/migrations/20261026040045_mb1_live_session_guard.sql (equals the repository file and the pinned candidate); added to manifest.json`, then `# mb1-replay add-candidate: exit 0`. `state.json` then: candidate `added`, no stop, no lock. [Evidence](../../../evidence/MB-1/phase2-3-add.txt) |
| 3.1b | `MB1 migrate --evidence phase2-3-migrate` | **Runner exit 0.** Line 1: `# rechecked immediately before migration up on the replay: … the 24 file(s) pinned in manifest.json each sha256 equal and unchanged since this command began, nothing else in /tmp/fitlog-mb1-replay-20261026, and its config.toml naming fitlog_mb1_replay_20261026 at the eight 564xx ports`. Then `$ node_modules/.bin/supabase migration up --local --workdir /tmp/fitlog-mb1-replay-20261026`, `Local database is up to date.`, `Connecting to local database...`, **`Applying migration 20261026040045_mb1_live_session_guard.sql...`** (the only `Applying` line), `# 2 line(s) withheld (not on the migrate allowlist, or secret-shaped)`, `# exit 0`. Line 8: `# rechecked after migration up on the replay: …` (the same 24 files, the same wording). Then `# migration up: 20261026040045_mb1_live_session_guard.sql; the after snapshot (P3) is the proof` and `# mb1-replay migrate: exit 0`. `state.json` then: candidate `applied`, no `stopRecorded`, no lock. [Evidence](../../../evidence/MB-1/phase2-3-migrate.txt) |
| 3.2 | `MB1 snapshot after --evidence phase2-3-after` | **Runner exit 0.** `# sql/preconditions.sql sha256 ca683771f22935ff97c26f3101e93634f1611132963d2e44db7bc9d913ed769a, as manifest.json records and the reviewed constant; read-only check passed`; `# session: default_transaction_read_only=on, transaction_read_only=on`; P1, two P2 rows, 16 P3 rows; **`# snapshot after: 16 applied migration(s); no rule broken; changes from before: P2.profile_read.qual, P3.+20261026040045`**; `# mb1-replay snapshot: exit 0`. [Evidence](../../../evidence/MB-1/phase2-3-after.txt) |
| 3.3 | `MB1 suite green --evidence phase2-3-green` | **Runner exit 0.** 27 `ok` lines in order, no `not ok`, the ban line `# after the ban, GoTrue answers member C's session with HTTP 403 {"code":"user_banned","message":"User is banned"}`, the summary `Local identity integration passed, 27 checks: profile ownership; no direct or private onboarding path; disabled, deletion-pending and banned accounts and revoked sessions refused on GoTrue and PostgREST; GraphQL closed (tripwire).`, then `# suite exit 0; GoTrue's answer after the ban: banned`, **`# verdict: the green expectation is met`**, the `banned` note line and `# mb1-replay suite: exit 0`. [Evidence](../../../evidence/MB-1/phase2-3-green.txt) |

Each background job's output and the evidence file the runner wrote hold the same lines (read both, each time). After each
command, `state.json` was read and the lock looked for (Glob): no lock and no halt after any of them.

**Two readings of the `migrate` output, checked against the code (not guessed):**
- `Local database is up to date.` prints before `Connecting…` and `Applying…` because `renderRun` prints all of the
  CLI's stdout lines, then all of its stderr lines (`mb1-replay-evidence.mjs:98`). It is a rendering order, not the CLI's
  event order.
- The 2 withheld lines cannot hide another `Applying` line. `appliedMigrations` reads the raw, unfiltered stdout and
  stderr (`mb1-replay.mjs:435`), and any `Applying` line for another file prints `# problem: …` and exits 1 (`:436-438`).
  Their content is **not observed**. (Attempt 3's `migrations` also withheld 2, inferred to be the CLI's update notice.)
  The plan sets no withheld count for `migrate`, so they were not treated as a stop.

### A5.3 Acceptance, condition by condition (review 2026-10-27T0005Z readiness §1–5 and the brief)

| Condition | Observed | Met |
|---|---|---|
| 1. Pre-flight: 282/282, nine `node --check`, the 12 phase1i §6 hashes and the four CLI hashes | A5.1 | Yes |
| 2. Exclusive writer recorded; nothing else writes the replay or the worktree's `supabase/` | Recorded before the first runner command; this session's only writes were three MB-1 docs, none during a runner job; the gate tests are sandboxed (A5.1) | Yes (as recorded; other sessions' processes cannot be shown from here, and no process check ran) |
| 3. Each command a background job, no tool timeout, never killed, no SIGKILL or SIGHUP | Four background jobs; none signalled; each ended on its own, exit 0 | Yes |
| 4a. `add-candidate` prints `ac262f39…` | `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3`, in full | Yes |
| 4b. `migrate` prints both immediate `# rechecked … migration up` lines and applies only the candidate | Lines 1 and 8; exactly one `Applying` line, the candidate's; `# migration up: 20261026040045_mb1_live_session_guard.sql` | Yes |
| 4c. `snapshot after` changes exactly `P2.profile_read.qual` and `P3 +20261026040045` | The runner's line says exactly that. **Checked by hand against `state.json`'s `before`:** P1 identical (`fn_definition_md5` `e446cfc1e224dec2a5439fef806a22cc`); `profile_update` identical; `profile_read.qual` from `(id = ( SELECT auth.uid() AS uid))` to `((id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.member_active() AS member_active))`; the 15 earlier P3 rows each with the same `statements_md5`; one new row `20261026040045 mb1_live_session_guard ddcb1b5c06928c2226450c7f3f1f8128` | Yes |
| 4d. `suite green`: 27 ok, exit 0, the answer `banned` | 27 `ok` (14 before the ban line, 13 after), the same names in the same order as `phase2-2-red-2.txt` (compared by hand), `# suite exit 0; GoTrue's answer after the ban: banned`, the met verdict, runner exit 0 | Yes |
| 5. No refusal, `STOP:` line or unexpected result; 55321's container not restarted | None in any output. The runner's pin check passed on every command (a restart refuses every command) and `state.json` keeps the same pin | Yes |
| After: the sources and the four CLI files rehashed | A5.4: all 16 unchanged | Yes |

**So GREEN is met on the disposable replay**, under the reference `banned`. It is partial `profile_read` evidence only:
**not box 3, not the goal**, and not 55321.

### A5.4 State left behind (for the coordinator)

- **The replay project is running.** Stop is not authorized. Its containers were not listed.
- **The directory** `/tmp/fitlog-mb1-replay-20261026` (read only, through `state.json` and a Glob for the lock):
  - **no lock**; the runner released it after each command;
  - generation 1; candidate **`applied`**; active `null`; `proven` `null`; `restoredProof` false; no mutation; shared
    pin `true 2026-10-26T12:51:50.578854542Z`; CLI `2.121.0`;
  - snapshots: `before` **unchanged** (`at` `1793032873158`); **`after`** new (`at` `1793059620610`), equal to A5.2's
    evidence;
  - three suite entries: attempt 3's and attempt 4's unchanged, and the new **`expect green`, `ok true`, `ban "banned"`**,
    generation 1, ended `1793059640652`;
  - reference `ban` `"banned"`; `checks` `{}`; `sharedApplied` **false**; **no `stopRecorded`, `m2Stopped` or
    `sharedApplyAttempted`**.

  Only the runner wrote under the directory (the candidate copy, `manifest.json`, `state.json`, and its lock, created
  and released each time). No replay file was changed by hand.
- **55321.** This attempt sent it no SQL and no Supabase command. The runner's only contact is its read-only `docker
  inspect` of the pinned start time; no `STOP:` line printed.
- **Processes.** Each runner job ended on its own with exit 0, and the runner awaits its children. No process check ran
  (none authorized; `pgrep` was denied in attempts 2 and 3), so "no process left" is not shown independently.
- **Hashes after the run** (`rtk proxy sha256sum`, one command, 20 paths): **all 16 sources and CLI files unchanged.**

  | sha256 | File |
  |---|---|
  | `fd76c04b0fa656d811831c6b103ef652313e281d77a648e23a0b368b73e83334` | `scripts/backend/mb1-replay.mjs` |
  | `6d52d70ce4c059ce89e32efa5d0d6162b9b59f2cf0c106ba3195bac6f681bb89` | `scripts/backend/mb1-replay-evidence.mjs` |
  | `fb6edb395cfe01edfc99e4ef70c8bcdfc6d6d206af0f0963aee4c42d248c3b37` | `scripts/backend/mb1-replay-order.mjs` |
  | `9c18e4238f36275e1a24ba740fe9fc034f703fe220717e37ec1698d13f55e81c` | `scripts/backend/mb1-replay.test.mjs` |
  | `89421648df0583a9cc1c811c7afc9c7003c023eb27cc908ce1c6c77a87918583` | `scripts/backend/mb1-replay-evidence.test.mjs` |
  | `95fdb69a52161801dc8e672a83ad60b42294882d138cefcce7b59e9126f89ad7` | `scripts/backend/mb1-replay-order.test.mjs` |
  | `42219dee18756927f32ca7aec1c8a6c5139499097c81bc1be5d5a52370f9eb5c` | `scripts/backend/mb1-replay-target.mjs` |
  | `944ba934a93a369cf6382ddea79620cdf35215d218dc1fde9eea634cc1bcdf81` | `scripts/backend/verify-identity.mjs` |
  | `902bb69924b929ac0b06c8fc44e3102318cf6f5fc06c212ccd3d51ce45521021` | `scripts/backend/verify-identity.test.mjs` |
  | `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3` | `supabase/migrations/20261026040045_mb1_live_session_guard.sql` |
  | `67a3591105da6cc41032b8c4dc72680ae65cd93751dc594ee5918f7654481b94` | `supabase/config.toml` |
  | `8ba686dbdea606484af49fbfe6836283945c27805355fa2586e61614fae34f78` | `docs/plan/runs/MB-1/phase1.md` |
  | `21d25b4bfb1870db0aaf0963c028b10d0b0b431485f119abd704c1396c7991e6` | `node_modules/.bin/supabase` |
  | `21d25b4bfb1870db0aaf0963c028b10d0b0b431485f119abd704c1396c7991e6` | `node_modules/supabase/dist/supabase.js` |
  | `6e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc` | `node_modules/@supabase/cli-darwin-arm64/bin/supabase` |
  | `fd5f2364521870ad9bb485ce9796e16d9b75fad21b306ad4955a382ea7533813` | `node_modules/@supabase/cli-darwin-arm64/bin/supabase-go` |
  | `4c6dbb7906dd099dfb9dd0583e1f4c7f9d2482a9c6c924eba3b76317f9a1abb5` | `docs/evidence/MB-1/phase2-3-add.txt` (new, by the runner) |
  | `58e8b1fd42b80b35a30a908dbe834436b82857019e492ce76292c6bdd96e650a` | `docs/evidence/MB-1/phase2-3-migrate.txt` (new, by the runner) |
  | `fd61308c95b310257d8443812ea8b01119c25a2502b8ad8d0dfa4428b0f84c51` | `docs/evidence/MB-1/phase2-3-after.txt` (new, by the runner) |
  | `8d94be725a89ae3d282c04f4dcec439677ee90bd93b2d629bc2fd65f7d2c6d05` | `docs/evidence/MB-1/phase2-3-green.txt` (new, by the runner) |
- **Secret scan (§8).** The Grep tool ran §8's patterns, with its one exclusion (`review-39fe1fb5-final.md`), over
  `docs/evidence/MB-1`. **It prints one line, so §8's "must print nothing" does not hold as written:**
  `reviewer-final-2026-10-27T0005Z.md:106` names the test fixture `sb_secret_fixture-must-never-print-0001` in prose. That
  string is the repository's committed fake (`mb1-replay.test.mjs:40`, `mb1-replay-evidence.test.mjs:17`), not a key. The
  four new runner files match nothing, and a wider pass over them (`eyJ…` JWT shapes, `postgres://`, `postgresql://`, a URL
  with a password) matches nothing either. **Not changed here:** the review copy and phase2-plan §8 are left as they
  are. Before any phase 2 evidence is committed, the coordinator decides an exclusion for that review copy, as for
  review 39fe1fb5.

### A5.5 Review 2026-10-27T0005Z: provenance and dispositions

- **The review.** [`reviewer-final-2026-10-27T0005Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0005Z.md),
  session `c315be3a-5890-42c5-9c14-55d3ee924dbd`, was already in the evidence directory before this phase. It was read,
  not edited or copied. Its file name reads `T0005Z`, and this phase read it before the local clock's first reading of
  `00:04:24Z`, so the name's time is taken as approximate.
- **Its verdict.** No critical, high or medium finding in phase 1I; it independently reproduced 282/282 and the nine
  syntax checks; a bounded §3 run on the disposable replay is not blocked; `shared-apply` stays blocked and not
  authorized; B1 and B2 open; no box met.
- **Codex's dispositions (AUTH-01, recorded here).** The review is accepted as phase 1I's safety review. **Its four lows are
  assigned to an MB-1 design and refactor phase, pending,** with the split first:
  1. **Low (new):** a STOP after a CLI is lost if the `state.json` write after it fails, and the lock is then released.
     Fix: keep the lock and print a STOP naming both failures when a result carries `stopRecorded` and the write fails;
     print `renderRun` after `stopAfter`. In the finding 3 design phase.
  2. **Low (carried, design):** a recorded STOP blocks `stop`, `teardown` and the read-only `shared-snapshot before`, with
     no written clearing procedure. **Direction recorded:** clearing a halt needs a fresh independent review plus a
     separately authorized read-only 55321 check, then removal by hand; never in a runner phase like this one.
  3. **Low (carried):** finding 3 (a change written and undone during a CLI run) is deferred, and `start`,
     `migrations` and `stop` have no recheck after the CLI. The design records `lstat` `ino` and `ctimeNs` under the lock.
     The single-writer condition stands until then.
  4. **Low (carried):** file sizes. `mb1-replay.mjs` is 798 of 800 lines, and `mb1-replay.test.mjs` is 2210 lines.
     **Split the runner (and the test harness) before any new runner edit;** this is a prerequisite for item 3.

  None of the four is on the §3 path, and the review found §3 not blocked by them. **No code was changed in this phase.**
- **Policy restated by the coordinator.** PRD §16.1 and frozen 003 override any stale reviewer instruction: gym staff
  never read or write private health data, whatever the consent. The candidate that ran is one owner-only policy,
  `alter policy profile_read on public.profiles using (id=(select auth.uid()) and (select private.member_active()))`, and
  opens no staff, consent or health-data path.
- **No new review ran.** The brief forbids subagents, and this attempt changed no source, test, config or SQL file, so the
  `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not run.

### A5.6 Permissions observed

| Command | Result |
|---|---|
| A first compound `cd … && git status --short && git branch --show-current && git rev-parse HEAD && ls … && date -u …`, without `rtk` | **Denied.** Not retried in that form or any other form. No git command ran in this phase; Glob and Read replaced the listing |
| `rtk proxy node --test --test-reporter=tap --test-reporter-destination=/tmp/fitlog-mb1-phase2-5-pretest.tap scripts/backend/*.test.mjs` | **Denied.** Not retried in that form; the plain form of phase2-plan §0.2 ran instead (as attempt 4 did after its piped form was denied). No scratch file was created |
| `rtk proxy date -u …`, `rtk proxy sha256sum …`, `rtk proxy node --check …` (×9), `rtk proxy node --test scripts/backend/*.test.mjs` | Allowed |
| The four runner commands, as background Bash jobs | Allowed |
| Read of the replay's `state.json`, Glob for its lock, Grep over the evidence directory, the scripts and the CLI `package.json` files | Allowed |

### A5.7 Files changed in this attempt

| Path | Change |
|---|---|
| `docs/evidence/MB-1/phase2-3-add.txt`, `phase2-3-migrate.txt`, `phase2-3-after.txt`, `phase2-3-green.txt` | New, written by the runner |
| `docs/plan/runs/MB-1/phase2.md` | This attempt 5 record, above attempt 4's, which is unchanged |
| `docs/plan/runs/MB-1/checkpoint.md` | The exclusive-writer record (before the runner), then the status and the resume point |
| `docs/plan/runs/MB-1/handoff.md` | Interim handoff for this attempt |

**Unchanged:** every script, test, migration, SQL, config and package file; `phase1*.md`; `phase2-plan.md` (its status
row and §3/§8 text are now behind this record: for the coordinator); every review copy and earlier evidence file;
`status.json`, the ledger and `GOALS.md`. Nothing is staged, committed or pushed. Box 3 is **not met**; B1 and B2 stay
open.

### A5.8 Next bounded checkpoint (the coordinator decides)

1. **The MB-1 design and refactor phase for review 2026-10-27T0005Z's four lows** (pure code, test-first, then a fresh
   independent review): first split `mb1-replay.mjs` (798/800) and the test harness; then finding 3's `ino`/`ctimeNs`
   detection and the post-CLI rechecks for `start`, `migrations` and `stop`; low 1's lock-kept STOP on a failed state
   write; low 2's written clearing procedure (fresh independent review, a separately authorized read-only 55321 check,
   then removal by hand).
2. **M1 and M3 on the replay**, each with its own authorization (`mutate`, `snapshot` proof, `suite`, restore, `snapshot
   restored`). They need no runner edit. **M2 under `banned`** needs its own authorization (finding 1 of the earlier
   review no longer blocks it).
3. **§5 `diff` and `lint`** stay under the single-writer condition, ideally after the finding 3 design.
4. **§6 (55321)** is **not authorized**: it needs every replay proof, a passing nonvacuous M2 with no stop, and its own
   authorization. B1 and B2 stay open.
5. **Records:** before committing phase 2 evidence, decide the §8 exclusion for `reviewer-final-2026-10-27T0005Z.md`
   (A5.4), and bring phase2-plan's status row and §3 up to date with this attempt.
6. The replay keeps running until a stop is authorized. If 55321's database container restarts first, every command on
   this directory refuses: record that, and do not work around it.

## Attempt 4: §2.2 rerun as `phase2-2-red-2`: RED met on the disposable replay; the reference ban answer is `banned`

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3, as in attempts 1–3. Box 3 is **not met**; B1 and B2 stay open |
| Authorization | Codex AUTH-01, 26 October 2026: **one** disposable RED command, under the independent phase 1F review bbe2fbba ([verbatim](../../../evidence/MB-1/review-bbe2fbba-final.md)). The command: `rtk proxy node scripts/backend/mb1-replay.mjs suite /tmp/fitlog-mb1-replay-20261026 red --evidence phase2-2-red-2`, as a background Bash job, never killed. It runs on the existing replay only, which keeps its migrations and its `before` snapshot. **Before it:** 112 pure tests, seven syntax checks, and the source, candidate and four CLI hashes equal to the review and the checkpoint. **After it:** the four CLI hashes again. **Accepted only with:** the 27 checks in order; exactly the five `profile_read` failures, each `HTTP 200, 1 row(s)`; the exact summary; the class `banned`; `the red expectation is met` and the `banned` note; runner exit 0. `live` or `ended` stops the phase. **Not authorized:** `migrations`, `snapshot`, `prepare`, `start`, `verify-cli`, `add-candidate`, `mutate`, any `shared-*`, `stop` or `teardown`; any other database or local-network action; any bypass, retry or direct CLI call; code, test, config, SQL, package, contract, status, GOALS, ACCEPTANCE or `main` edits; commits or pushes; external providers, auth switches or overage; subagents. Docs and evidence only |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed |
| Run date and times | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` gave `2026-10-26T18:03:50Z` (after the reading, before any check), `18:05:38Z` (before `suite red`), `18:05:51Z` (after it) and `18:08:56Z` (records written; `rtk proxy git status --short` again shows only the 10 MB-1 paths). The runner's `state.json` dates the new suite's end at epoch ms `1793037945807` (18:05:45Z) |
| Result | **RED met on the disposable replay.** All 27 checks ran in order. Exactly the five `profile_read` checks failed, each with the detail line `  HTTP 200, 1 row(s)`. The summary line is exact. GoTrue answered member C's session with `HTTP 403 {"code":"user_banned","message":"User is banned"}`, the same answer as attempt 3, which the runner now classes as **`banned`**. The verdict reads `the red expectation is met`, with the `banned` note, and the runner exited 0. **`banned` is now this replay's reference ban answer** (review bbe2fbba condition 4). The candidate is still `absent`: **no GREEN** and nothing applied |
| Background command tool | **Allowed.** One runner job, with no tool timeout. It was not signalled, and it ended on its own with exit 0 |
| Read | `/tmp/fitlog-bbe2fbba-final.md` in full; the RTK rules (`/Users/Adya/.codex/RTK.md`); [checkpoint.md](checkpoint.md); [phase1f.md](phase1f.md); [phase2-plan.md](phase2-plan.md); attempt 3 below; phase1e.md §8 (the full hashes); the runner's suite verdict and `banNote` (`mb1-replay-evidence.mjs:200-299`, `mb1-replay.mjs:490-491`); the replay's `state.json` (read only, before and after) |

### A4.1 Before the runner command

Every shell command was one `rtk proxy …` command, run from this worktree. The `MB1` shorthand is as in A3.1.

| Step | Command | Result |
|---|---|---|
| 0.1 | `rtk proxy git status --short` | Only the 10 untracked MB-1 paths |
| 0.2 | `rtk proxy node --check scripts/backend/<file>` for `mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs`, `verify-identity.mjs`, `mb1-replay.test.mjs`, `mb1-replay-evidence.test.mjs`, `verify-identity.test.mjs` (seven commands) | All exit 0, no output |
| 0.2 | `rtk proxy node --test scripts/backend/*.test.mjs` | `# tests 112`, `# pass 112`, `# fail 0`, `# skipped 0`, `# duration_ms 6362.36075`. All 112 ran by name, including the four F6 evidence tests (32–35) and the phase 1F runner tests (66–68, 72) |
| Reviewed bytes | `rtk proxy sha256sum` of the seven MB-1 scripts, the candidate and `supabase/config.toml` | All nine equal review bbe2fbba exactly: `mb1-replay.mjs` `c61e0e3c…9264`; `mb1-replay-target.mjs` `d114e690…6524`; `mb1-replay-evidence.mjs` `7380f5e7…3116`; `mb1-replay.test.mjs` `75dd5449…18c7`; `mb1-replay-evidence.test.mjs` `c8eb5163…11ed`; `config.toml` `67a35911…1b94`. The three files 1F did not change equal phase1e.md §8 in full: `verify-identity.mjs` `944ba934…cdbf81`, its test `902bb699…521021`, the candidate `ac262f39…2c1bdc3`. So the runner that ran is the code review bbe2fbba read |
| F2, before | `rtk proxy sha256sum node_modules/.bin/supabase node_modules/supabase/dist/supabase.js node_modules/@supabase/cli-darwin-arm64/bin/supabase node_modules/@supabase/cli-darwin-arm64/bin/supabase-go` | All four equal the checkpoint values (`21d25b4b…91e6` twice, `6e8be5fb…08dc`, `fd5f2364…3813`) |
| CLI version | Grep tool, `"version"` in both CLI `package.json` files (read as files) | Both `"version": "2.121.0"` (line 3). `verify-cli` was not rerun: the brief forbids it |
| Replay state | Read tool, `/tmp/fitlog-mb1-replay-20261026/state.json` (read only); Glob for `.fitlog-mb1-replay.lock` | As attempt 3 left it: generation 1; candidate `absent`; shared pin `true 2026-10-26T12:51:50.578854542Z`; CLI `2.121.0`; the `before` snapshot (at `1793032873158`); one red suite with `ok false` and `ban null`; reference `ban` `null`; `sharedApplied` false. **No lock** found. No prerequisite had changed |
| Review copy | Write tool, then `rtk proxy git diff --no-index` | A4.5 |

### A4.2 The runner command and its result

| Step | Command | Result |
|---|---|---|
| 2.2 (rerun) | `MB1 suite red --evidence phase2-2-red-2` (background job) | **Runner exit 0.** 27 check lines, in order. Exactly five `not ok`, each followed by `  HTTP 200, 1 row(s)`: `a disabled account reads no profile`, `a deletion-pending account reads no profile`, `a banned account reads no profile`, `a revoked session reads no profile`, `a session revoked from another device reads no profile`. Summary: `5 of 27 identity checks failed: a disabled account reads no profile; a deletion-pending account reads no profile; a banned account reads no profile; a revoked session reads no profile; a session revoked from another device reads no profile`. Ban line: `# after the ban, GoTrue answers member C's session with HTTP 403 {"code":"user_banned","message":"User is banned"}`. Then `# suite exit 1; GoTrue's answer after the ban: banned`, `# verdict: the red expectation is met`, the `banned` note line, and `# mb1-replay suite: exit 0`. **Met** (A4.3). [Evidence](../../../evidence/MB-1/phase2-2-red-2.txt) |
| F2, after | The same `rtk proxy sha256sum` of the four CLI files | All four equal the checkpoint values again: nothing was installed or changed |

The background job's output and the evidence file the runner wrote hold the same 39 lines. In 2.2, `suite exit 1` is
the identity suite's own exit code, which RED expects. The runner's exit 0 comes from its verdict. The runner's own checks
ran first and none refused. Those checks are listed in A3.1: no `SUPABASE_*` variable or `.env*` name, the owned directory
and its manifest, the lock, 55321's pinned start time, and the live replay.

### A4.3 Acceptance, condition by condition (review bbe2fbba conditions 1–3)

| Condition | Observed | Met |
|---|---|---|
| 1. Before: hashes unchanged, seven syntax checks, 112 of 112, four CLI hashes equal the checkpoint | A4.1 | Yes |
| 1. After: the four CLI hashes again | A4.2 | Yes |
| 2. Only that command, as a background job, never killed; no `migrations`, `snapshot before`, `add-candidate`, `mutate`, `shared-*`, `stop` or `teardown` | One runner job, ended on its own. No other runner, CLI, Docker or database command was sent | Yes |
| 3. The 27 checks, in order | 27 `ok`/`not ok` lines. The verdict compares names and order with `IDENTITY_CHECKS` (`judgeSuite`, `mb1-replay-evidence.mjs:276`) and raised no problem. Lines 1–33 are also byte-identical to attempt 3's `phase2-2-red.txt` | Yes |
| 3. Exactly the five `profile_read` failures, each with `  HTTP 200, 1 row(s)` | Evidence lines 10/11, 14/15, 18/19, 21/22 and 30/31. **The five detail lines were checked by hand**, as the review asks, because the verdict skips them (finding 3) | Yes |
| 3. The exact summary line | Line 35 equals the expected string (`mb1-replay-evidence.mjs:296`) | Yes |
| 3. `GoTrue's answer after the ban: banned` | Line 36 | Yes |
| 3. `the red expectation is met` and the `banned` note line | Lines 37 and 38. Line 38 equals `banNote('red', 'banned')` (`mb1-replay-evidence.mjs:230`) character for character | Yes |
| 3. Runner exit 0 | Line 39 `# mb1-replay suite: exit 0`, and the background job's exit code 0 | Yes |
| No `live` or `ended`; no setup, cleanup, refusal, signal, problem or `STOP:` line | None. The answer is the same `user_banned` that GoTrue gave at 16:41Z | Yes |

**So RED is met on the disposable replay, with the reference `banned`.** This is a RED for the replay only. It is not a
GREEN, and it says nothing about 55321. Attempt 3's run is **not** reclassified: its entry in `state.json` and
`phase2-2-red.txt` are unchanged and still read `ok false`, `ban null` and `NOT met`.

### A4.4 State left behind (for the coordinator)

- **The replay project is running.** Stop is not authorized. The runner's live check passed before the suite. Its containers
  were not listed.
- **The directory** `/tmp/fitlog-mb1-replay-20261026` (read only, through `state.json` and a Glob for the lock):
  - **no lock**: the runner released it when it exited normally;
  - generation 1; candidate `absent`; active `null`; no mutation; shared pin `true 2026-10-26T12:51:50.578854542Z`;
    CLI `2.121.0`;
  - the `before` snapshot **unchanged**: same `at` (`1793032873158`), and its P1, P2 and P3 (15 versions, each
    `statements_md5`) read the same as before the run;
  - two suite entries: attempt 3's (`ok false`, `ban null`, ended `1793032889031`), unchanged, and the new one: `stack
    replay`, `expect red`, **`ok true`**, **`ban "banned"`**, generation 1, ended `1793037945807` (18:05:45Z);
  - reference `ban` **`"banned"`**; `checks` empty; `sharedApplied` **false**.

  No replay file was changed by hand. Only the runner wrote `state.json` (and created and released its lock).
- **Migrations and the `before` evidence.** `phase2-1-migrations-2.txt` and `phase2-2-before.txt` were not written in this
  attempt: the runner never overwrites, and no `migrations` or `snapshot` command ran. They were not re-hashed.
- **Fixtures.** The suite printed no setup or cleanup failure line, and the verdict would have failed on one. The replay's
  auth users were not queried (no authorization), so cleanup rests on the suite's own report.
- **55321.** This attempt sent it no SQL and no Supabase command. The runner's only contact is its read-only
  `docker inspect` of the pinned start time. It printed no `STOP:`, and `state.json` still holds the same pin.
- **Processes.** The runner job ended on its own with exit 0, and the runner awaits its children before it exits. No
  process check was run: the brief allows no other command against the local stack, and `pgrep` was denied in attempts 2
  and 3. So "no process left" is not shown independently.
- **Secret scan (§8).** The Grep tool ran the §8 patterns, with the same exclusion, over `docs/evidence/MB-1`: no
  matches, including the new runner file and the new review copy. A wider pass over `phase2-*.txt` and the new review copy
  found nothing either: any `eyJ…` JWT shape, `postgres://` or `postgresql://`, or a URL with a password.

### A4.5 Review bbe2fbba: provenance and dispositions

- **The copy.** [review-bbe2fbba-final.md](../../../evidence/MB-1/review-bbe2fbba-final.md) holds the review under a
  provenance header. `rtk proxy git diff --no-index -U0 /tmp/fitlog-bbe2fbba-final.md docs/evidence/MB-1/review-bbe2fbba-final.md`
  shows only the 12-line header added, plus a final newline the source lacks (`\ No newline at end of file`). Nothing else
  differs. The source's first line is a progress sentence from the reviewing session, which comes before the review's
  title. It is kept, because the copy is verbatim.
- **Its verdict.** Four low findings. **No critical, high or medium finding.** 112 of 112 tests and seven syntax checks
  pass. It accepts one disposable `suite red --evidence phase2-2-red-2` under its conditions 1–4. It does **not**
  authorize `shared-apply`, which the runner blocks on its own because M2 cannot pass under `banned`.
- **Codex's dispositions (AUTH-01).** Accepted for the disposable RED only. **All four lows are assigned to MB-1, pending.**
  Each must be fixed test-first and independently reviewed **before** any `shared-apply` authorization:
  - **Finding 1 (low):** the CLI reads the live repository after the last check, and an exit 0 from `shared-apply` proves
    nothing. Fix: run `migration up` from a runner-owned, manifest-pinned staging copy; after the CLI returns, rerun
    `guardsBeforeMigrate` as a `STOP` and require a read-only 55321 snapshot equal to the replay's `after`; record the
    attempt (for example `sharedApplyAttempted`) so no outcome allows another apply.
  - **Finding 2 (low):** under `ended`, M2 still passes vacuously and opens the gate. Fix: M2 under `ended` fails closed,
    as under `banned`. The nonvacuous strategy is the review's M2 under `banned`.
  - **Finding 3 (low):** the verdict never reads why an expected check failed. Fix: keep the detail lines, and require
    exactly `HTTP 200, 1 row(s)` for every expected `profile_read` failure. For this RED, the five lines were checked by
    hand (A4.3).
  - **Finding 4 (low, process):** `snapshot before` can be retaken and silently replaces the reference. Fix: make the
    `before` snapshot immutable (refuse a retake, or require it to equal the existing one). It was not rerun.
- **Routine decision (Codex).** The disposable-only conditions are accepted. The review's proposed nonvacuous M2 is
  accepted as the plan for a **later pure-code, test-first** phase with its own independent review. It keeps member C's
  session live, and M2 passes under `banned` only when exactly `a banned account reads no profile` fails with
  `HTTP 200, 1 row(s)`; 27 ok fails closed. **It is not implemented here.** A zero-failure M2 under `ended` never counts.
- **No code correction** was made in this phase. `shared-apply` is **not** authorized.
- **No new review ran.** The brief forbids subagents, and this attempt changed no source, test, config or SQL file. So
  the `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not run.

### A4.6 Permissions observed

| Command | Result |
|---|---|
| A runner command as a background Bash job | Allowed |
| `rtk proxy date -u …`, `rtk proxy git status --short`, `rtk proxy node --check …`, `rtk proxy node --test scripts/backend/*.test.mjs`, `rtk proxy sha256sum …`, `rtk proxy git diff --no-index …` | Allowed |
| A first compound `ls -la …; wc -l …; ls -la …`, without `rtk proxy` | Denied. Not retried in that form; the Read and Glob tools replaced it |
| `rtk proxy node --test scripts/backend/*.test.mjs 2>&1 \| rtk proxy tail -n 12` (a pipe) | Denied. Not retried in that form; the plain form of phase2-plan §0.2 ran instead |
| Read of the replay's `state.json`, Glob for its lock, Grep over the CLI `package.json` files and the evidence directory | Allowed |

### A4.7 Files changed in this attempt

| Path | Change |
|---|---|
| `docs/evidence/MB-1/review-bbe2fbba-final.md` | New. Review bbe2fbba, verbatim, under a provenance header with Codex's dispositions |
| `docs/evidence/MB-1/phase2-2-red-2.txt` | New, written by the runner |
| `docs/plan/runs/MB-1/phase2.md` | This attempt 4 record, above attempt 3's, which is unchanged |
| `docs/plan/runs/MB-1/checkpoint.md` | Status and resume point |
| `docs/plan/runs/MB-1/phase2-plan.md` | Status row; the 2.2 note (RED met, reference `banned`); the M2 row (the proposal and finding 2); §6's prerequisites (the four lows) |

Unchanged: every script, test, migration, SQL and config file; `phase1*.md`; every earlier review copy and evidence file;
`status.json`, the ledger and `GOALS.md`. Nothing is committed or pushed. Box 3 is **not met**; B1 and B2 stay open.

### A4.8 Next bounded checkpoint (the coordinator decides)

1. **One pure-code, test-first phase for review bbe2fbba's four lows and the nonvacuous M2**, then a fresh, independent
   review, before any `mutate m2` or `shared-apply`:
   - finding 3: keep the detail lines, and require `HTTP 200, 1 row(s)` for every expected `profile_read` failure;
   - finding 2: M2 refused under `ended`. Under `banned`, M2 expects exactly `a banned account reads no profile`, with
     `mutate m2` allowed; 27 ok fails closed and stops (the fallback is M2b, reviewed separately);
   - finding 4: the `before` snapshot immutable;
   - finding 1: the pinned staging copy, the post-apply guards and 55321 `after` snapshot inside `shared-apply`, and a
     recorded apply attempt.
2. **§3 and M1/M3 on the replay** (`add-candidate`, `migrate`, `snapshot after`, `suite green`; then M1 and M3) do not
   depend on the M2 change. Each needs its own authorization. GREEN must answer `banned`, the reference. A `live` or
   `ended` answer is a mismatch and fails.
3. **§6 (55321)** still needs, in order: item 1 done and reviewed; a passing nonvacuous M2; every other replay proof; and
   its own authorization.
4. **The replay project keeps running** until a stop is authorized. If 55321's database container restarts first, the pin
   refuses every command on this directory: record that, and do not work around it.
5. **Permissions that would help:** a read-only `rtk proxy pgrep -fl` for `mb1-replay.mjs` and the CLI, and the
   running-only container list.

## Attempt 3: stopped at §2.2 (`suite red`: GoTrue gave a ban answer the runner does not recognise)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3, as in attempts 1 and 2 |
| Authorization | Codex AUTH-01, 26 October 2026. Codex explicitly accepted the independent phase 1E review 19eea0f3 ([verbatim](../../../evidence/MB-1/review-19eea0f3-final.md)) **for the disposable RED only**. It authorized continuing the existing, still running `/tmp/fitlog-mb1-replay-20261026` from phase2-plan 1.4, serially, each runner command as a background job: `migrations --evidence phase2-1-migrations-2`, `snapshot before --evidence phase2-2-before`, `suite red --evidence phase2-2-red`. **Not authorized:** `prepare`, `start` or `verify-cli` again; `add-candidate`, `migrate` or `mutate`; any shared command; `stop` or `teardown`; changing replay files by hand; any bypass, retry or direct CLI call; source, test, config, SQL, dependency, contract, status, GOALS, ACCEPTANCE or `main` edits; commits or pushes; network-provider or auth switches; subagents; suite GREEN or any extension |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed |
| Run date and times | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` gave `2026-10-26T16:38:59Z` (phase begins), `16:41:00Z` (before `migrations`), `16:41:09Z` (before `snapshot before`), `16:41:23Z` (before `suite red`) and `16:42:03Z` (STOP recorded). The runner's `state.json` dates the `before` snapshot at epoch ms `1793032873158` (16:41:13Z) and the suite's end at `1793032889031` (16:41:29Z) |
| Result | **STOP at §2.2.** `migrations` and `snapshot before` each met the plan. `suite red` ran all 27 checks in order, with exactly the five `profile_read` failures and the exact summary line. But GoTrue answered the banned member's session with **`HTTP 403 {"code":"user_banned","message":"User is banned"}`**. That is neither `HTTP 200` nor `HTTP 403` with `session_not_found`, so the runner's verdict reads `the red expectation is NOT met`, and the runner exited 1. phase2-plan 2.2 and phase1.md R7 say any other answer stops the phase and is recorded. **No RED is claimed, and there is no reference ban answer** |
| Background command tool | **Allowed.** Each runner command ran as a background job with no tool timeout. None was signalled, and each ended on its own (exits 0, 0 and 1) |
| Read | `/tmp/fitlog-19eea0f3-final.md` in full; the RTK rules (`/Users/Adya/.codex/RTK.md`); GOALS MB-1; [checkpoint.md](checkpoint.md); [phase1e.md](phase1e.md); [phase2-plan.md](phase2-plan.md); attempts 1 and 2 below; [phase1.md](phase1.md) R7; the runner's `migrations`, `snapshot` and `suite` code, its command table and its suite verdict (`mb1-replay.mjs`, `mb1-replay-evidence.mjs`); the ban line in `verify-identity.mjs:190` |

### A3.1 Before any runner command

Every shell command was one `rtk proxy …` command, run from this worktree. Runner commands are written
`MB1 <command> …` for `rtk proxy node scripts/backend/mb1-replay.mjs <command> /tmp/fitlog-mb1-replay-20261026 …`.

| Step | Command | Result |
|---|---|---|
| 0.1 | `rtk proxy git status --short` | Only the 10 untracked MB-1 paths |
| 0.2 | `rtk proxy node --check scripts/backend/<file>` for `mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs`, `verify-identity.mjs`, `mb1-replay.test.mjs`, `mb1-replay-evidence.test.mjs`, `verify-identity.test.mjs` (seven commands) | All exit 0, no output |
| 0.2 | `rtk proxy node --test scripts/backend/*.test.mjs` | `# tests 104`, `# pass 104`, `# fail 0`, `# duration_ms 3373.20925` |
| Reviewed bytes | `rtk proxy sha256sum` of the candidate and the seven MB-1 scripts | All eight equal [phase1e.md](phase1e.md) §8 exactly: the candidate `ac262f39…bdc3`; `mb1-replay.mjs` `2bc49a62…9b57`; `mb1-replay-target.mjs` `fa041372…7045`; `mb1-replay-evidence.mjs` `29d73cdb…f857`; `mb1-replay.test.mjs` `0483301e…75a3`; `mb1-replay-evidence.test.mjs` `9cf1d7e9…ec68`; `verify-identity.mjs` `944ba934…bf81`; `verify-identity.test.mjs` `902bb699…1021`. So the runner that ran is the code review 19eea0f3 read |
| F2, before | `rtk proxy sha256sum node_modules/.bin/supabase node_modules/supabase/dist/supabase.js node_modules/@supabase/cli-darwin-arm64/bin/supabase node_modules/@supabase/cli-darwin-arm64/bin/supabase-go` | All four equal the checkpoint values (`21d25b4b…91e6` twice, `6e8be5fb…08dc`, `fd5f2364…3813`) |
| CLI version | Grep tool, `"version"` in `node_modules/supabase/package.json` and `node_modules/@supabase/cli-darwin-arm64/package.json` (read as files) | Both `"version": "2.121.0"` (line 3). Attempt 2's live `verify-cli` read exactly `2.121.0`. It was not rerun, because the brief forbids it |
| Replay state | Read tool, `/tmp/fitlog-mb1-replay-20261026/state.json` (read only); Glob for `.fitlog-mb1-replay.lock` | As attempt 2 left it: generation 1, candidate `absent`, shared pin `true 2026-10-26T12:51:50.578854542Z`, CLI `2.121.0`, no snapshot, suite or ban answer, `sharedApplied` false. **No lock** |
| Review copy | Write tool, then `rtk proxy git diff --no-index` | A3.5 |

§0.3 (`lsof`, container names) was not repeated: the replay is running on purpose. Before each of the three commands the
runner itself checked: no `SUPABASE_*` variable and no `.env*` name in any directory the CLI may load from (paths only);
the owned directory, its manifest hashes and no unknown entry; the lock; 55321's pinned start time; and the live replay
(`status` at `http://127.0.0.1:56421`, its database at `127.0.0.1:56422`, `supabase_db_fitlog_mb1_replay_20261026`
running). All three commands are `live: 'running'` (`mb1-replay.mjs:539`, `:545`, `:547`). None refused.

### A3.2 Runner commands and results

| Step | Command | Result |
|---|---|---|
| 1.4 (rerun) | `MB1 migrations --evidence phase2-1-migrations-2` (background job) | Exit 0. The header, the rule and **15 backticked rows**, `20261017161031` to `20261025234317`, each listed local and remote, each with its own time. Then `Connecting to local database...`, **`# 2 line(s) withheld (not on the migrations allowlist, or secret-shaped)`**, `# exit 0` and **`# migration list: 15 row(s), equal to the manifest's 15 migration(s), 15 of them applied`**. That is finding 3's accepted count (0 or 2) with the exact summary: **met**. [Evidence](../../../evidence/MB-1/phase2-1-migrations-2.txt) |
| 2.1 | `MB1 snapshot before --evidence phase2-2-before` (background job) | Exit 0. `sql/preconditions.sql` sha256 `ca683771f22935ff97c26f3101e93634f1611132963d2e44db7bc9d913ed769a`, as the manifest and the reviewed constant record; read-only check passed; session `default_transaction_read_only=on, transaction_read_only=on`. P1: `table_owner=postgres relrowsecurity=t relforcerowsecurity=f fn_owner=postgres prosecdef=t provolatile=s proconfig={"search_path=\"\""} rolsuper=f rolbypassrls=t fn_owner_has_owner_privs=t fn_definition_md5=e446cfc1e224dec2a5439fef806a22cc`. P2, two rows: `profile_read` with `qual=(id = ( SELECT auth.uid() AS uid))`, which lacks `member_active()` (the gap the candidate closes), and `profile_update` with `member_active()` in both `qual` and `with_check`. P3: the 15 versions, no candidate. `# snapshot before: 15 applied migration(s); no rule broken`: **met**. [Evidence](../../../evidence/MB-1/phase2-2-before.txt) |
| 2.2 | `MB1 suite red --evidence phase2-2-red` (background job) | **Runner exit 1.** 27 check lines, in order. Exactly five `not ok`, each `HTTP 200, 1 row(s)`: `a disabled account reads no profile`, `a deletion-pending account reads no profile`, `a banned account reads no profile`, `a revoked session reads no profile`, `a session revoked from another device reads no profile`. The summary line matches exactly: `5 of 27 identity checks failed: …`. **Ban line:** `# after the ban, GoTrue answers member C's session with HTTP 403 {"code":"user_banned","message":"User is banned"}`. The runner printed `# problem: unrecognised ban answer "HTTP 403 {"code":"user_banned","message":"User is banned"}": stop and record it`, then `# suite exit 1; GoTrue's answer after the ban: unrecognised` and `# verdict: the red expectation is NOT met`. **STOP** (A3.3). [Evidence](../../../evidence/MB-1/phase2-2-red.txt) |
| F2, after | The same `rtk proxy sha256sum` of the four CLI files | All four equal the checkpoint values again: nothing was installed or changed |

In 2.2, `suite exit 1` is the identity suite's own exit code, which RED expects. The runner's exit 1 comes from its
verdict.

### A3.3 The STOP

- **What held.** All 27 checks ran in order, exactly the five expected `profile_read` checks failed, and the summary line
  and the suite's exit code are the ones RED expects. No setup, cleanup, refusal or signal line appeared, and there was no
  unexpected line.
- **What did not.** The ban answer. The verdict recognises only two answers (`classifyBan`,
  `mb1-replay-evidence.mjs:205-209`): `HTTP 200` (`live`) and `HTTP 403` whose JSON `code` is `session_not_found`
  (`ended`), as phase1.md R7 and review 39fe1fb5 finding 4 set them. `user_banned` is neither. phase2-plan 2.2 says "any
  other answer: stop and record", and R7 says the same. So the phase stopped here, and nothing was retried or worked
  around.
- **Why it matters (an inference, not observed).** GoTrue refused member C's session because the **user** is banned.
  That answer does not say whether the session row still exists, and R7 needs exactly that to know which clause of
  `member_active()` refused the read:
  - a live session row means the ban clause refused it, and M2 can prove that;
  - an ended session means the session clause did.

  So `user_banned` cannot be mapped to `live` or `ended` from this run alone. Mapping it would also change
  `classifyBan`, a code change this phase does not authorize.
- **What the run showed, unclaimed.** Without the candidate, `profile_read` returned one row (`HTTP 200`) to a disabled,
  a deletion-pending, a banned, a revoked and a remotely revoked session. That is the pre-candidate shape RED expects. But
  the runner's verdict is **NOT met**, so this record claims **no RED**. `state.json` records the run as `ok: false` and
  holds **no reference ban answer**.
- **The runner holds the line itself.** `add-candidate` refuses until a red suite has passed (`mb1-replay.mjs:540`), so
  nothing after §2 can run on this directory until one does.
- **New low finding F6 (MB-1; not fixed).** The suite verdict and phase1.md R7 know two GoTrue ban answers. The replay's
  GoTrue gave a third, `HTTP 403` `user_banned`, which by itself does not tell whether the ban ended the session. Any fix
  touches `classifyBan` (and so M2's expectation in phase2-plan §4), R7 and plan 2.2. It must be test-first and
  independently reviewed before `suite red` runs again.

### A3.4 State left behind (for the coordinator)

- **The replay project is running.** Stop is not authorized. Its containers were not listed in this attempt. The runner's
  live check passed before each of the three commands (A3.1).
- **The directory** `/tmp/fitlog-mb1-replay-20261026` (read only, through `state.json` and a Glob for the lock):
  - **no lock**: each command released it when it exited normally;
  - `state.json`: generation 1; candidate `absent`; active `null`; no mutation; shared pin
    `true 2026-10-26T12:51:50.578854542Z`; CLI `2.121.0`;
  - snapshot `before` (generation 1, 16:41:13Z), with the P1–P3 above;
  - one suite entry: `stack replay`, `expect red`, **`ok false`**, `ban null`, generation 1, ended 16:41:29Z;
  - reference `ban` **`null`**; `checks` empty; `sharedApplied` false.

  No replay file was changed by hand. Only the runner wrote `state.json` (and created and released its lock).
- **Fixtures.** The suite printed no setup or cleanup failure line. The verdict would have caught `Fixture cleanup needs
  attention` or `The checks passed, but fixture cleanup failed`. The disposable replay's auth users were not queried, because
  no database read beyond the pinned snapshot is authorized. So cleanup rests on the suite's own report.
- **55321.** This attempt sent it no SQL and no Supabase command. The runner checked its database container's pinned start
  time (`docker inspect`) before each command, and a change would have refused with `STOP:`. None did, and `state.json`
  still holds `true 2026-10-26T12:51:50.578854542Z`.
- **Processes.** All three runner jobs ended on their own, as the background-job notices reported, with no timeout or
  signal. Each runner awaits its children before it exits. `rtk proxy pgrep -fl mb1-replay.mjs` was **denied** and not
  retried, so "no process left" is not shown independently, and no absolute no-orphan claim is made.
- **F2, after.** All four CLI hashes are unchanged (A3.2).
- **Secret scan (§8).** The Grep tool ran the §8 patterns, with the same exclusion, over `docs/evidence/MB-1`: no matches,
  the new review copy and the three new runner files included. A wider pass over `phase2-*.txt` (any `eyJ…` JWT shape, a
  URL with a password, `postgres://` or `postgresql://`) found nothing either.

### A3.5 Review 19eea0f3: provenance and dispositions

- **The copy.** [review-19eea0f3-final.md](../../../evidence/MB-1/review-19eea0f3-final.md) holds the review under a
  provenance header. Running `rtk proxy git diff --no-index -U0 /tmp/fitlog-19eea0f3-final.md docs/evidence/MB-1/review-19eea0f3-final.md`
  shows only the 12-line header added, plus a final newline the source lacks (`\ No newline at end of file`). Nothing
  else differs. The first comparison caught a dropped sentence at the end of the source's line 75. It was restored before
  this final comparison.
- **Its verdict.** Three low findings. **No critical, high or medium finding.** 104 of 104 tests pass. It accepts the
  disposable RED steps only, and it does not authorize `shared-apply`.
- **Codex's dispositions (AUTH-01):**
  - **Finding 1 (low):** `migration up` connects to the repository's configured `[db] port`, and nothing pins
    `config.toml` or refuses a `supabase/config.json`. **Assigned to MB-1, pending.** It must be fixed test-first and
    independently reviewed **before** any `shared-apply` authorization.
  - **Finding 2 (low):** the `.env`, candidate-pin and migration-comparison guards run once, before the CLI reads the
    files; it asks for them again immediately before `migrate`, and a re-hash of the candidate after the apply. **Assigned
    to MB-1, pending**, on the same terms as finding 1.
  - **Finding 3 (low, process):** **accepted.** `migrations` may show 0 or 2 withheld non-table lines alongside the exact
    manifest summary. The reviewer's explanation, a two-line "new version available" notice, is inferred from the
    installed code; no notice line was captured. **Observed this attempt:** `# 2 line(s) withheld` with the exact
    summary. What the two lines were stays **unobserved**.
- **Not fixed in this phase:** findings 1 and 2. No code change is authorized.
- **No new review ran.** The brief forbids subagents, and this attempt changed no source, test or config file. So the
  `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not run.

### A3.6 Permissions observed

| Command | Result |
|---|---|
| A runner command as a background Bash job | Allowed |
| `rtk proxy git status --short`, `rtk proxy date -u …`, `rtk proxy node --check …`, `rtk proxy node --test …`, `rtk proxy sha256sum …`, `rtk proxy git diff --no-index …` | Allowed |
| A first compound `ls -la …; wc -l …` and a bare `ls -la docs/…`, both without `rtk proxy` | Denied. Not retried in that form; the Read and Glob tools replaced them |
| `rtk proxy pgrep -fl mb1-replay.mjs` | Denied. Not retried |

### A3.7 Files changed in this attempt

| Path | Change |
|---|---|
| `docs/evidence/MB-1/review-19eea0f3-final.md` | New. Review 19eea0f3, verbatim, under a provenance header with Codex's dispositions |
| `docs/evidence/MB-1/phase2-1-migrations-2.txt`, `phase2-2-before.txt`, `phase2-2-red.txt` | New, written by the runner |
| `docs/plan/runs/MB-1/phase2.md` | This attempt 3 record, above attempt 2's, which is unchanged |
| `docs/plan/runs/MB-1/checkpoint.md` | Status and resume point |
| `docs/plan/runs/MB-1/phase2-plan.md` | Status row; the 1.4 withheld-count expectation (finding 3); the 2.2 note on F6; §6's prerequisites (findings 1 and 2) |

Unchanged: every script, test, migration, SQL and config file; `phase1*.md`; every earlier review copy and evidence file;
`status.json`, the ledger and `GOALS.md`. Nothing is committed or pushed. Box 3 is **not met**; B1 and B2 stay open.

### A3.8 Next bounded checkpoint (the coordinator decides)

1. **Decide how to treat GoTrue's `user_banned` answer (F6).** Whatever is chosen changes `classifyBan`, and through it
   M2's expectation, phase1.md R7 and plan 2.2. So it is a code change: test-first, with an independent review, in its
   own authorized phase. It must also settle the question `user_banned` leaves open: did the ban end member C's session?
   This attempt does not guess that.
2. **Then, if authorized:** on the **same, still running** `/tmp/fitlog-mb1-replay-20261026`, never prepared again,
   `MB1 suite red --evidence phase2-2-red-2`, as a background job, never killed. The runner allows it: the candidate is
   `absent`, the `before` snapshot exists, and the last suite ended at 16:41:29Z, more than 75 s ago. The `before` snapshot
   still stands, because nothing was applied or mutated since (generation 1, candidate `absent`). Then the four CLI hashes
   again. Any refusal, `STOP:` line or unexpected result stops it.
3. **Findings 1 and 2 of review 19eea0f3** are MB-1's, pending: each fixed test-first and independently reviewed before any
   `shared-apply` authorization (§6).
4. **The replay project keeps running.** Stopping it needs its own authorization (`MB1 stop --confirm
   fitlog-mb1-replay-20261026`, or §7). If 55321's database container restarts first, the pin refuses every command on
   this directory: record that, and do not work around it.
5. **Permissions that would help:** a read-only `rtk proxy pgrep -fl` for `mb1-replay.mjs` and the CLI, and the
   running-only container list.

## Attempt 2: stopped after §1.4 (`migrations` kept no row)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3, as in attempt 1 |
| Authorization | Codex AUTH-01, renewed 26 October 2026 for phase2-plan §§0–2 **only**, on the literal `/tmp/fitlog-mb1-replay-20261026`. The authorized runner commands are `prepare`, `verify-cli`, `start`, `migrations`, `snapshot before` and `suite red`, each run as a background job. Also allowed: `date -u`, read-only `sysctl` and the 8283 `lsof`. Not authorized: §§3–7; candidate add or migrate; stop or teardown; any 55321 SQL, suite or apply; source, test or config edits; subagents; commits |
| Coordinator's statement (not relied on) | Codex started Docker Desktop with `docker desktop start --detach`, and the existing containers restarted automatically. Codex also confirmed, independently, the API at `http://127.0.0.1:55321`, the container `supabase_db_fitlog_rebuild_20261017` and a read-only `select 1` (exit 0), with no shared SQL change, start, reset or migration. This attempt rechecked its own preconditions (A2.1) and did not infer shared health from that statement |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed |
| Run date and times | Literal date `20261026`. `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` gave `2026-10-26T12:53:41Z` (§0 begins), `12:54:32Z` (before `prepare`), `12:54:58Z` (before `start`), `12:55:47Z` (after `start`) and `12:57:27Z` (STOP recorded) |
| Result | **STOP after §1.4.** §0 held. `prepare`, `verify-cli`, `start` and `migrations` each exited 0. But `migrations` kept **no migration row** (17 lines withheld), and plan 1.4 expects "the CLI's own list, rows only". The plan's rules say any unexpected result stops the phase, so `snapshot before` and `suite red` were **not run**. There is no RED. The replay project is **left running** (stop is not authorized) |
| Background command tool | **Allowed.** Each runner command ran as a background job with no tool timeout, and none was signalled |
| Read | RTK rules (`/Users/Adya/.codex/RTK.md`); GOALS MB-1; [checkpoint.md](checkpoint.md); attempt 1 below; [phase2-plan.md](phase2-plan.md); `phase1.md` §7 (P1–P3); the runner's allowlist, verdict and command table (`mb1-replay-evidence.mjs`, `mb1-replay.mjs`) |

### A2.1 Steps and results

Every shell command was one `rtk proxy …` command, run from this worktree. Runner commands are written
`MB1 <command> …` for `rtk proxy node scripts/backend/mb1-replay.mjs <command> /tmp/fitlog-mb1-replay-20261026 …`.

| Step | Command | Result |
|---|---|---|
| 0.1 | `rtk proxy git status --short` | Only the 10 untracked MB-1 paths, as in attempt 1 |
| 0.2 | `rtk proxy node --check scripts/backend/<file>` for `mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs`, `verify-identity.mjs`, `mb1-replay.test.mjs`, `mb1-replay-evidence.test.mjs`, `verify-identity.test.mjs` (seven commands) | All exit 0, no output |
| 0.2 | `rtk proxy node --test scripts/backend/*.test.mjs` | `# tests 95`, `# pass 95`, `# fail 0`, `# duration_ms 6121.964541` |
| 0.2a | (the runner) | `prepare` passed the runner's `SUPABASE_*` check, and the `verify-cli` evidence reads `no SUPABASE_* variable is set` |
| 0.3 | `rtk proxy lsof -nP -iTCP:56420-56429 -sTCP:LISTEN` | Exit 1, no output: nothing listens |
| 0.3 (extra) | `rtk proxy lsof -nP -iTCP:8283 -sTCP:LISTEN` | Exit 1, no output: nothing listens |
| 0.3 | `rtk proxy docker ps -a --format '{{.Names}}'` | 24 names, none containing `fitlog_mb1_replay`: six `*_fitlog_rebuild_20261017` (55321: db, storage, rest, inbucket, auth, kong), fourteen `supabase_*_fitlog`, then `fitlog-db`, `fitlog-db-test`, `n8n` and `infallible_shirley` |
| 0.3 | Read `/tmp/fitlog-mb1-replay-20261026` (Read tool) | "File does not exist": the directory is fresh |
| 0.3 (extra) | Glob `docs/evidence/MB-1/phase2*` | No files |
| 0.4 | `rtk proxy docker ps --format '{{.Names}}'` (running containers only) | **Denied** by the permission mode. Not retried. §0.4 then rests on `prepare`'s own pin (1.1), as the plan provides |
| Host | `rtk proxy sysctl -n hw.memsize hw.ncpu` | `17179869184` (16 GiB) and `10` |
| F2, before | `rtk proxy sha256sum node_modules/.bin/supabase node_modules/supabase/dist/supabase.js node_modules/@supabase/cli-darwin-arm64/bin/supabase node_modules/@supabase/cli-darwin-arm64/bin/supabase-go` | All four equal the checkpoint values |
| 1.1 | `MB1 prepare --evidence phase2-1-prepare` (background job) | Exit 0: "23 files; sentinel and manifest written; shared stack pinned at `true 2026-10-26T12:51:50.578854542Z`". The 15 committed migrations and both seeds each "equals the repository file", with no candidate. The `sql/preconditions.sql` line reads `ca683771f22935ff97c26f3101e93634f1611132963d2e44db7bc9d913ed769a`, which **equals the pinned value exactly**. [Evidence](../../../evidence/MB-1/phase2-1-prepare.txt) |
| 1.2 | `MB1 verify-cli --evidence phase2-1-cli` (background job) | Exit 0. The CLI is `node_modules/.bin/supabase`, run directly by node. The child environment holds `PATH, HOME, USER, LOGNAME, TMPDIR, LANG, LC_ALL, LC_CTYPE` (names only). Seven lines, each `supabase 2.121.0 <command> --help: lists …`, all **exactly `2.121.0`**. Every flag the runner sends is listed, and `stop --help` lists `--project-id`, `--no-backup` and `--workdir`. F2's live check holds. [Evidence](../../../evidence/MB-1/phase2-1-cli.txt) |
| 1.3 | `MB1 start --evidence phase2-1-start` (background job) | Exit 0 in about 49 s. Kept lines: `Starting database...`, `Initialising schema...`, `Seeding globals from roles.sql...`, 15 `Applying migration` lines from `20261017161031_member_core.sql` to `20261025234317_training_formula_v1.sql` (no candidate), both seeds, `Started supabase local development setup.` 70 lines withheld. The runner prints "the replay answers at http://127.0.0.1:56421 in supabase_db_fitlog_mb1_replay_20261026", and its after-check of 55321's pin passed. [Evidence](../../../evidence/MB-1/phase2-1-start.txt) |
| 1.4 | `MB1 migrations --evidence phase2-1-migrations` (background job) | Exit 0. Kept: the table header (`Local \| Remote \| Time (UTC)`), its rule line and `Connecting to local database...`. Then `# 17 line(s) withheld (not on the migrations allowlist, or secret-shaped)`, and **no migration row**. **STOP** (A2.2). [Evidence](../../../evidence/MB-1/phase2-1-migrations.txt) |

**Not run:** `MB1 snapshot before --evidence phase2-2-before` (2.1) and `MB1 suite red --evidence phase2-2-red` (2.2). So
there is no P1–P3 snapshot, no RED, and no GoTrue ban answer.

### A2.2 The STOP

- **Why it stopped.** Plan 1.4 expects "the CLI's own list, rows only", but the evidence holds no row. The runner exited 0
  and printed no refusal or `STOP:` line. phase2-plan's rules still apply: "A refusal, a `STOP:` line or any unexpected
  result stops the phase. Record it and report; do not work around it." The brief, for its part, runs the plan to RED
  "or first refusal". Where the two differ, this attempt took the stricter one and stopped.
- **Likely cause (an inference, not observed).** The 15 version rows did not match the runner's row pattern,
  `^\s*(\d{14})?\s*[|│]\s*(\d{14})?\s*[|│]\s*[\d: -]*$` (`mb1-replay-evidence.mjs:41`). The pure test feeds it a
  hand-written row (`mb1-replay.test.mjs:97`), not real 2.121.0 output. AR-1's evidence holds no `migration list` table to
  compare with. Fifteen rows plus two other lines would make 17, which fits, but the withheld lines cannot be seen.
  Showing them means printing raw CLI output, and changing the allowlist means a source edit. The brief forbids both.
- **It failed closed.** The allowlist withheld lines it did not know, as designed, and nothing secret was printed. The gap
  is in the evidence, not in the replay: `start` applied 15 migrations, and plan 1.3 makes P3 in `snapshot before` the
  proof of the 15.
- **The rule stopped it, not the runner.** Later commands do not depend on `migrations`: `OPS.migrations` has no `needs`
  and writes nothing to `state.json`. So `snapshot before` would not have been refused.

### A2.3 State left behind (for the coordinator)

- **The replay project is running.** `rtk proxy docker ps -a --format '{{.Names}}'` at the STOP lists eight
  `*_fitlog_mb1_replay_20261026` containers (pg_meta, storage, rest, realtime, inbucket, auth, kong, db), above the same
  24 names as at §0.3. Their running state was not listed, because the running-only `docker ps` was denied. They are not
  stopped: stop and teardown are not authorized.
- **The directory** `/tmp/fitlog-mb1-replay-20261026` holds the sentinel, `manifest.json`, `state.json` and the 23 prepared
  files, plus the CLI's own `supabase/.temp/cli-latest` and `supabase/.branches/_current_branch`, which the runner allows.
  There is **no lock**: each command released it when it exited normally. `state.json` has generation 1; candidate
  `absent`; shared pin `true 2026-10-26T12:51:50.578854542Z`; CLI `2.121.0`; no snapshot, suite or ban answer; and
  `sharedApplied` false.
- **55321.** This attempt sent it no SQL and no Supabase command. The runner read its database container's start time
  (`docker inspect`) at `prepare`, before each later command and again after `start`. It was unchanged every time, at
  `2026-10-26T12:51:50.578854542Z`, the time of the Docker restart. A second stack now shares the Docker VM with it.
- **Processes.** All four runner jobs ended on their own with exit 0, as the background-job notices reported. So no
  timeout or signal happened, and each runner outlived its children. `rtk proxy pgrep -fl` for `mb1-replay.mjs`,
  `cli-darwin-arm64/bin/supabase` and `node_modules/.bin/supabase` was **denied**, and not retried. So "no process left"
  is not shown independently, and no absolute no-orphan claim is made.
- **F2, after.** The same `sha256sum` at the STOP gives the four checkpoint values again: nothing was installed or changed.
- **Secret scan (§8).** `rtk proxy rg …` was denied, so the Grep tool ran the same patterns with the same exclusion over
  `docs/evidence/MB-1`: no matches. A wider pass over `phase2-*.txt`, for any JWT shape, a URL with a password or a
  `postgres://` URL, also found nothing.

### A2.4 Review provenance

- This run carries out phase2-plan as review b75d1e73 accepted it
  ([verbatim](../../../evidence/MB-1/review-b75d1e73-final.md); its header gives the provenance: the review's final
  message, supplied by the Codex coordinator, with the session id block `b75d1e73`). Its four low findings keep the
  dispositions in §1 below:
  - **F1** held: background jobs, no tool timeout and no signal.
  - **F2** held: the hashes before and after, a live `2.121.0`, and `stop --help` listing `--project-id`.
  - **F3, F4:** still open, to be fixed and re-reviewed before any shared stage.
- No new review ran. The brief forbids subagents, and this attempt changed no source, test or config file. So the
  `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not run.
- **A new low finding for MB-1, F5:** the runner keeps no `migration list` row from real 2.121.0 output (A2.2). A fix would
  go into `mb1-replay-evidence.mjs` test-first, with a row fixture taken from real output, and needs a review. It was not
  attempted.

### A2.5 Permissions observed

| Command | Result |
|---|---|
| A runner command as a background Bash job | Allowed |
| `rtk proxy date -u …`, `rtk proxy sysctl -n hw.memsize hw.ncpu`, `rtk proxy lsof -nP -iTCP:8283 -sTCP:LISTEN` | Allowed |
| `rtk proxy git rev-parse --short HEAD` | Denied (the session's start snapshot gives HEAD `2a95726`) |
| `rtk proxy docker ps --format '{{.Names}}'` (running only) | Denied |
| `rtk proxy pgrep -fl …` (three patterns) | Denied |
| `rtk proxy rg …` (the §8 scan) | Denied; the Grep tool was used instead |
| A first compound `ls …; git log …; git status --short`, without `rtk proxy` | Denied. It broke the plan's one-`rtk proxy`-command rule, and `rtk proxy git status --short` replaced it |

### A2.6 Files changed in this attempt

| Path | Change |
|---|---|
| `docs/evidence/MB-1/phase2-1-prepare.txt`, `phase2-1-cli.txt`, `phase2-1-start.txt`, `phase2-1-migrations.txt` | New, written by the runner |
| `docs/plan/runs/MB-1/phase2.md` | This attempt 2 record, above attempt 1's, which is unchanged |
| `docs/plan/runs/MB-1/checkpoint.md` | Status and resume point |

Unchanged: every script, test, migration and config file; [phase2-plan.md](phase2-plan.md), whose status row still names
attempt 1 only (this record supersedes that row); the `phase1*.md` files; `status.json`, the ledger and `GOALS.md`.
Nothing is committed. Box 3 is **not met**; B1 and B2 stay open.

### A2.7 Next bounded checkpoint (the coordinator decides)

1. **Decide on the 1.4 result. Either:**
   - **(a)** accept it as an evidence gap only (plan 1.3: P3 is the proof of the 15), and authorize resuming at §2.1 on
     the **same**, still running, directory:
     - `MB1 snapshot before --evidence phase2-2-before`: P1 holds, P2 has two rows, and P3 lists the 15 versions
       without the candidate;
     - then `MB1 suite red --evidence phase2-2-red`: exactly the five `profile_read` failures, `the red expectation is
       met`, and a ban answer of `HTTP 200` or `HTTP 403` with `session_not_found`;
     - then the four CLI hashes again.

     The directory is never prepared again. It keeps its `20261026` name, even on a later day.
   - **(b)** or first fix F5 test-first and have it re-reviewed. Then run `migrations` again under a new evidence name
     (`phase2-1-migrations-2`; the runner never overwrites), then §2.
2. **The replay project keeps running until then.** Stopping it needs its own authorization
   (`MB1 stop --confirm fitlog-mb1-replay-20261026`, or §7). If 55321's database container restarts in the meantime (a
   Docker restart, or running out of memory with two stacks up), the pin no longer matches and the runner refuses every
   later command on this directory. Record that, and do not work around it.
3. **F3 and F4** must be fixed before any shared stage, as before.

## Attempt 1: stopped at §0 (Docker daemon not reachable)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3: "A revoked session fails on its next request, and a user can read only their own profile (cross-user test)" |
| Authorization | Codex AUTH-01: phase2-plan §§0–2 **only**, on the disposable `/tmp/fitlog-mb1-replay-20261026`. The authorized runner commands are `prepare`, `verify-cli`, `start`, `migrations`, `snapshot before` and `suite red`, with the literal date. Nothing from §§3–7: no candidate copy or migrate, no stop or teardown, no 55321 SQL, suite or apply |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed |
| Run date | 26 October 2026 (literal date `20261026`). The clock time is **not recorded**: the permission mode denied `rtk proxy date -u …`, and no runner `state.json`, which would carry timestamps, was ever created |
| Result | **STOP at §0.3, before `prepare`.** `docker ps -a` could not reach the Docker daemon, so the "no replay container" precondition could not be shown, and §0.4 (55321 running) cannot hold. **No runner command ran.** No Docker container, Supabase, database or network call was made. No replay directory, state, lock or `phase2-*` runner evidence exists |
| Read | RTK rules (`/Users/Adya/.codex/RTK.md`); GOALS MB-1; [checkpoint.md](checkpoint.md); [phase2-plan.md](phase2-plan.md); [phase1d.md](phase1d.md); the full review `/tmp/fitlog-b75d1e73-final.md`; `mb1-replay.mjs` and `mb1-replay-target.mjs`; the CLI's `package.json` files (read as files) |

## 1. The review and its accepted conditions

Review b75d1e73 ([verbatim](../../../evidence/MB-1/review-b75d1e73-final.md)) accepts the disposable-only run. It has no
critical, high or medium finding and four low ones, and it records 95 of 95 tests passing. Codex accepted the four low
findings **for this disposable RED checkpoint only**, on these conditions:

| # | Finding (low) | Condition (AUTH-01) | Done in this attempt |
|---|---|---|---|
| F1 | A runner killed outright leaves its detached CLI group unsupervised | Runner commands get a shell-tool timeout of at least 660 000 ms (the runner's own limit is 600 s) and never SIGKILL. Any timeout or signal: STOP, keep the lock, inspect processes before any later action. Correct the absolute no-orphan claim to a guarantee that holds only while the runner is alive | The claim is corrected in [phase2-plan.md](phase2-plan.md) (rules) and [checkpoint.md](checkpoint.md). No runner ran, so no timeout or signal happened. **Tool limit:** this executor's foreground shell timeout is capped at 600 000 ms, under 660 000. The next run has to start each runner command as a background job, which has no tool timeout; review condition 3 allows this ("or as a background job") |
| F2 | Nothing pins the CLI that actually runs | At `verify-cli`: exactly `2.121.0`, and `stop --help` lists `--project-id`. No install or file change between commands. Record the sha256 of the actual shim and platform executables in the checkpoint (names and hashes only) | Hashes recorded (§3; [checkpoint.md](checkpoint.md)). Both `package.json` files read `2.121.0`, as files only. `verify-cli` did **not** run, so the version and the `stop --help` flags are **not** checked live. phase2-plan 1.2 now states the exact-version and hash checks |
| F3 | 55321 commands not tied to `DB_URL`; `.env*` files get past the `SUPABASE_*` refusal | Shared stage only: assigned to MB-1 before any 55321 authorization; no shared apply now | Recorded as an MB-1 prerequisite of phase2-plan §6. Not fixed: no source edits were authorized |
| F4 | The SQL that reaches 55321 is tied to what the replay ran, not to the reviewed text | Same as F3 | Same as F3 |

## 2. Steps and results

Every shell command was a single `rtk proxy …` command, run from this worktree.

| Step | Command | Result |
|---|---|---|
| 0.1 | `rtk proxy git status --short` | Only the 10 untracked MB-1 paths (the 7 `scripts/backend/mb1-replay*` and `verify-identity*` files, the candidate migration, `docs/evidence/MB-1/`, `docs/plan/runs/MB-1/`) |
| — | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | Denied by the permission mode. Not retried |
| 0.2 | `rtk proxy node --check scripts/backend/<file>` for `mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs`, `verify-identity.mjs`, `mb1-replay.test.mjs`, `mb1-replay-evidence.test.mjs`, `verify-identity.test.mjs` (seven commands) | All exit 0, no output |
| 0.2 | `rtk proxy node --test scripts/backend/*.test.mjs` | `# tests 95`, `# pass 95`, `# fail 0`, `# duration_ms 3040.421458` |
| 0.2a | (no command) | **Not checked.** The runner checks for `SUPABASE_*` at `prepare`, which did not run, and printing the environment would print values |
| 0.3 | `rtk proxy lsof -nP -iTCP:56420-56429 -sTCP:LISTEN` | Exit 1, no output: nothing listens on 56420–56429 |
| 0.3 (extra) | `rtk proxy lsof -nP -iTCP:8283 -sTCP:LISTEN` | Denied by the permission mode. Not retried. phase2-plan §0.3 does not require it (it checks 56420–56429 only) |
| 0.3 | `rtk proxy docker ps -a --format '{{.Names}}'` | **Exit 1:** `failed to connect to the docker API at unix:///Users/Adya/.docker/run/docker.sock; check if the path is correct and if the daemon is running: dial unix /Users/Adya/.docker/run/docker.sock: connect: no such file or directory`. **STOP** |
| 0.3 | Read `/tmp/fitlog-mb1-replay-20261026` (Read tool) | "File does not exist": the directory is fresh |
| 0.3 (extra) | Glob `docs/evidence/MB-1/phase2*` | No files, so every `--evidence phase2-…` name is new |
| 0.4 | (no command) | Not met as far as this attempt could see: with no daemon, 55321's containers cannot be running. `prepare` would refuse here (`sharedFingerprint` gives `absent`), but it was not run (§4) |
| F2 | `rtk proxy sha256sum node_modules/.bin/supabase node_modules/supabase/dist/supabase.js node_modules/@supabase/cli-darwin-arm64/bin/supabase node_modules/@supabase/cli-darwin-arm64/bin/supabase-go` | §3 |
| — | `rtk proxy sysctl -n hw.memsize hw.ncpu` | Denied by the permission mode. Not retried |

**Not run** (in the authorized order, all after the STOP): `prepare`, `verify-cli`, `start`, `migrations`,
`snapshot before`, `suite red`. So there is no `phase2-1-prepare` line to compare with `ca683771…d913ed769a`, no live CLI
version, no RED, and no GoTrue ban answer. The `ca683771f22935ff97c26f3101e93634f1611132963d2e44db7bc9d913ed769a`
pin is still proven only by pure test 36 (above: pass).

## 3. Evidence

**CLI files (F2).** Names and sha256 only, taken 26 October 2026 before any CLI run. Nothing was installed or changed.

| sha256 | File |
|---|---|
| `21d25b4bfb1870db0aaf0963c028b10d0b0b431485f119abd704c1396c7991e6` | `node_modules/.bin/supabase` (the invoked path) |
| `21d25b4bfb1870db0aaf0963c028b10d0b0b431485f119abd704c1396c7991e6` | `node_modules/supabase/dist/supabase.js` (the same bytes as `.bin/supabase`; still unconfirmed whether it is a link or a copy) |
| `6e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc` | `node_modules/@supabase/cli-darwin-arm64/bin/supabase` |
| `fd5f2364521870ad9bb485ce9796e16d9b75fad21b306ad4955a382ea7533813` | `node_modules/@supabase/cli-darwin-arm64/bin/supabase-go` |

`node_modules/supabase/package.json` and `node_modules/@supabase/cli-darwin-arm64/package.json` both read
`"version": "2.121.0"`, read as files and not from the CLI.

**The review copy.** `rtk proxy git diff --no-index /tmp/fitlog-b75d1e73-final.md docs/evidence/MB-1/review-b75d1e73-final.md`
shows only the provenance header added (11 lines), plus a final newline the source lacks (`\ No newline at end of file`).
Nothing else differs.

**Secret scan (phase2-plan §8 patterns).** Grep tool over `docs/evidence/MB-1` with
`sb_secret_|sb_publishable_|eyJhbGci|JWT secret|S3 (Access|Secret) Key` and the glob `!review-39fe1fb5-final.md`:
**no matches**, the new review copy included.

**Images, for the next run (read, not observed).** The repository's `supabase/.temp` holds only `cli-latest`, so it pins
no image version. AR-1 replayed all 15 migrations from empty with this same CLI 2.121.0
(`docs/evidence/AR-1/replay-verification.md:3`), on cached images such as
`public.ecr.aws/supabase/postgres:17.11.0.004` (`docs/evidence/AR-1/fixture-sql-gates.md:6`). So the replay's `start`
should find its images cached. Whether it does is not observable through the runner's allowlist: pull lines are withheld
and counted.

## 4. The STOP and why nothing more ran

- **The brief:** fresh directory, free ports and no old replay containers first; "if not fresh STOP". Two of the three
  held (directory, ports 56420–56429). The third could not be checked: `docker ps -a` could not reach a daemon.
- **phase2-plan §0.4** needs the shared 55321 stack running, because `prepare` pins its database container's start time.
  With no daemon, it is not running.
- **Running `prepare` anyway was not done.** It would have been the next step past a failed precondition. With the
  daemon down it would only have refused (`sharedFingerprint` gives `absent`, then "must be running at prepare") and
  written a refusal evidence file. It could not have changed the outcome.
- **Starting Docker, or the shared stack, is outside AUTH-01.** The brief allows no direct Docker or Supabase action but
  the read-only container-name listing and `lsof`, and 55321 is shared with other lanes. Neither was attempted.

**The shared container.** No command of this attempt reached any Docker daemon or Supabase stack, so this attempt changed
nothing on 55321 or on any other project, AR-1's 563xx replay included. Its database container,
`supabase_db_fitlog_rebuild_20261017`, could not be inspected, and no start time was pinned, because `prepare` never ran.
With the daemon down, 55321 was not serving at the time of the check. That is a fact for the coordinator, not something
this attempt caused or may fix.

## 5. Resource constraints

- **Docker:** the daemon at `unix:///Users/Adya/.docker/run/docker.sock` was not running, so no Docker memory, CPU or
  disk was available or measured. Review b75d1e73's residual still applies to the next run: a second stack next to 55321
  needs memory headroom, and an out-of-memory restart of 55321 shows up as the runner's start-time STOP.
- **Host:** not measured. `sysctl` was denied, and Docker stats or info are outside the brief.
- **Executor:** the foreground shell timeout is capped at 600 000 ms, under F1's 660 000 ms. Runner commands must
  therefore run as background jobs (§1, F1). `date`, `sysctl`, `wc` and the 8283 `lsof` are denied in this permission
  mode. Whether `rtk proxy node scripts/backend/mb1-replay.mjs …` itself is permitted is **unknown**: it was never
  attempted.
- **No subagents** (the brief). So the `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not run. This
  attempt changed no source, test or config file, only the documents in §6.

## 6. Files changed in this attempt

| Path | Change |
|---|---|
| `docs/evidence/MB-1/review-b75d1e73-final.md` | New. Review b75d1e73, verbatim, under a provenance header |
| `docs/plan/runs/MB-1/phase2.md` | New. This record |
| `docs/plan/runs/MB-1/phase2-plan.md` | Status row (§§0–2 authorized, attempt 1 stopped at §0). F1: the no-orphan sentence becomes a guarantee that holds only while the runner is alive, with the timeout, never-SIGKILL and process-check rules. F2: the exact-version and hash checks at 1.2. F3/F4: §6 needs both fixed and re-reviewed before it can be authorized |
| `docs/plan/runs/MB-1/checkpoint.md` | Phase 2 attempt 1 status, the CLI hashes, the corrected group-stop sentence, and the next bounded checkpoint |

Unchanged on purpose: every script, test, migration and config file; `phase1.md` (its §7 block is pinned by sha256);
`phase1d.md` (a historical record; its "stops the whole group" line describes the design, and the conditional guarantee
now lives in phase2-plan); `status.json`, the ledger and `GOALS.md`. Nothing committed. Box 3 is **not met**; B1 and B2
stay open.

## 7. Next bounded checkpoint

1. **Coordinator, outside MB-1:** bring the Docker daemon up and the shared 55321 stack running, and confirm no other lane
   needs it held still. This is a shared-stack action, so MB-1 does not take it.
2. **Coordinator:** confirm that AUTH-01 still covers §§0–2 and give the literal run date. `/tmp/fitlog-mb1-replay-20261026`
   was never created, so it is still fresh for a run dated 26 October. A later day uses its own date in the directory
   and both tokens.
3. **Permissions (request):** allow `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` for clock times, and confirm that the runner
   command `rtk proxy node scripts/backend/mb1-replay.mjs …` may run as a background job.
4. **Then, from the top:**
   - §0 again: git status, seven `node --check`, 95 tests, `lsof`, container names with no `fitlog_mb1_replay`, and a
     fresh directory.
   - The four CLI hashes must equal §3.
   - `prepare`: compare its `sql/preconditions.sql` line with `ca683771…d913ed769a` exactly.
   - `verify-cli`: exactly `2.121.0`, and `stop --help` lists `--project-id`.
   - `start`, `migrations`, `snapshot before`, then `suite red`: exactly the five `profile_read` checks, and the
     verdict `the red expectation is met`.
   - Each runner command runs as a background job and is never killed. Stop at the reviewer-ready RED, or at the first
     refusal or `STOP:` line.
5. Before §6 is ever authorized: F3 and F4 fixed in code, test-first, and re-reviewed.
