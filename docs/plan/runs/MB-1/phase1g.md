# MB-1 phase 1G: review bbe2fbba's four lows fixed test-first, with the nonvacuous M2 (pure code only, no live run)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3 (as phase 2). Box 3 is **not met**; B1 and B2 stay open |
| Authorization | Codex AUTH-01: **one pure-code, test-first phase**. Phase 2 attempt 4 (worker c5b052c9, completed) had stopped. Scope: all four lows of review bbe2fbba ([verbatim](../../../evidence/MB-1/review-bbe2fbba-final.md)), fixed test-first in the `scripts/backend` replay helpers and their tests, plus the MB-1 docs. Persist the latest result accurately. **Not allowed:** any database, network, Supabase, Docker, runner or CLI invocation; any change to the replay directory; environment, schema, SQL, contract or root-package changes; dependencies; commits; status, GOALS, the ledger or `main`; pushes; external services; subagents. One writer only. **Every later runner or database phase needs a fresh independent safety review and an explicit coordinator scope** |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed |
| Node | `rtk proxy node --version` gave `v22.23.1` |
| Times | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` gave `2026-10-26T18:33:47Z` (after the reading, before any edit), `2026-10-26T19:11:40Z` (after the final code test run, before these records) and `2026-10-26T19:15:48Z` (records written; the full pure run repeated after the `phase1.md` R7 edit: 120 pass, 0 fail) |
| Result | **All four lows are fixed in code, test-first, and the review's nonvacuous M2 is implemented.** RED first: 67 MB-1 tests, 51 pass, 16 fail, each for the intended reason (§7.1). GREEN: `rtk proxy node --test scripts/backend/*.test.mjs` gives **120 pass, 0 fail** (112 before, plus 8 net new tests). All eight `node --check` pass (the seven of phase2-plan §0.2, plus the new `mb1-replay-order.mjs`). 23 guard mutations each fail a named test; two of them only on the message (§7.4). **No replay, database, CLI, Docker or network command ran.** The candidate SQL, `verify-identity.mjs`, the 27 checks and every evidence and review file are unchanged. **The independent review this phase needs has not run** (subagents are forbidden): it is the next step |
| Read | The RTK rules (`/Users/Adya/.claude/RTK.md`, `/Users/Adya/.codex/RTK.md` through `AGENTS.md`); GOALS.md MB-1; [checkpoint.md](checkpoint.md); [phase2-plan.md](phase2-plan.md); [phase2.md](phase2.md) (attempt 4); [phase1f.md](phase1f.md); [phase1.md](phase1.md) R7; `/tmp/fitlog-c5b052c9-final.md` and `/tmp/fitlog-bbe2fbba-final.md` in full; `phase2-2-red-2.txt`; `verify-identity.mjs` (its `brief()` and the ban step); `member_core.sql` lines 24–31; `supabase/config.toml` (the paths it names); the three runner modules and their two test files in full |

## 1. What this phase did, and did not do

- **Did:**
  - wrote the tests first and saw them fail (§7.1);
  - changed `mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs` and their two test files, and added
    `mb1-replay-order.mjs` (the plan-order rules, moved out of the runner unchanged so it stays under 800 lines, plus this
    phase's rules);
  - ran the pure tests, the eight syntax checks and 23 guard mutations, each restored (§7);
  - wrote this record and updated [checkpoint.md](checkpoint.md), [phase2-plan.md](phase2-plan.md) and
    [phase1.md](phase1.md) R7 (one added paragraph, outside the hash-pinned §7 block).
- **Did not:**
  - run the Supabase CLI, Docker, any database query or any runner command;
  - read, open, list or check the running replay project or its directory;
  - change the candidate SQL, `verify-identity.mjs`, its test, `config.toml`, any review copy or any evidence file;
  - commit;
  - use subagents, so the `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not run. §9 is my own review,
    not the independent one this phase needs;
  - compute file hashes: every hashing command was denied (§8, §12).

## 2. The latest result, as attempt 4 left it (persisted, not re-observed)

This phase never opened the replay, so this is attempt 4's record ([phase2.md](phase2.md) A4.2–A4.4), unchanged:
- **RED is met on the disposable replay**: `suite red --evidence phase2-2-red-2`, runner exit 0. Codex accepted it under
  review bbe2fbba. The reference ban answer is **`banned`** (GoTrue `user_banned`).
- The candidate is **`absent`**. There is **no GREEN**, and nothing was applied anywhere.
- The replay project `/tmp/fitlog-mb1-replay-20261026` was left running with **no lock**. Its `state.json` holds generation
  1, the `before` snapshot, attempt 3's failed red (`ok false`, `ban null`), attempt 4's red (`ok true`, `ban "banned"`),
  reference `ban "banned"` and `sharedApplied` false.
- 55321 has had no SQL and no Supabase command from MB-1.
- **B1 and B2 are open. Box 3 is not met.**

The new code reads that state as it is: it has no `sharedApplyAttempted` field and no `m2Stopped` entry, and the new rules
treat both as absent.

## 3. Finding 3: the verdict keeps each detail line and requires the caller's own row

**The gap.** `parseSuiteLog` skipped the line under each `not ok`. So an expected `profile_read` failure reading `HTTP 500 …`
counted the same as `HTTP 200, 1 row(s)`.

**The fix (`mb1-replay-evidence.mjs`).**
- `parseSuiteLog` keeps the detail: each check is `{ name, ok, detail }`. `detail` is the indented line after a `not ok`,
  without its two spaces, or `null` when there is none.
- `PROFILE_ROW_DETAIL` is `HTTP 200, 1 row(s)`. That is what `verify-identity.mjs`'s `brief()` prints for a read that
  returned one row. The suite filters on `id=eq.<member>` and the policy keeps `id = auth.uid()`, so that one row is the
  caller's own.
- `judgeSuite` adds one problem for each **expected** failure whose detail is not exactly that string, in RED, M1, M2 and
  M3 alike:
  `"<check>" failed with "<detail>" (or no detail line), not "HTTP 200, 1 row(s)" (the caller's own row): a failure for another reason is not the expected one (review bbe2fbba finding 3)`.
  The comparison is exact: a trailing space, `http 200`, `2 row(s)` or `0 row(s)` fails too.
- An **unexpected** failure already fails by name, so its detail adds nothing.
- The return shape is unchanged: `{ ok, problems, ban, failures }`.
- **Tied to live output:** attempt 4's `phase2-2-red-2.txt`, up to its summary line, still meets RED under the reference
  `banned`. Changing one of its five detail lines to `HTTP 500 …` fails it.

## 4. Finding 2 and the nonvacuous M2

**The gap.** Under `ended`, a zero-failure M2 passed, which proves nothing about the ban clause and opened the
`shared-apply` gate. Under `banned`, phase 1F refused M2 outright, so no M2 could ever pass on this replay.

**The rule, as review bbe2fbba proposed and Codex accepted** ([phase2.md](phase2.md) A4.5):
- `M2_BAN_CLASSES` is now **`live` and `banned`**.
- Under either class, M2 expects exactly **`a banned account reads no profile`** (`M2_CHECK`), with the detail
  `HTTP 200, 1 row(s)`. It also needs exit 1, the exact summary, the reference class, and every other check ok.
- **Under `ended`, M2 fails closed** whatever the run shows, a vacuous zero-failure run included. The problem reads:
  `M2 has no sound expectation under the "ended" ban answer (GoTrue session_not_found): the ban ended member C's session, so the session clause of member_active() refuses its read with or without the ban clause, and no M2 run can show the ban clause is needed; M2 stays refused on this replay (review bbe2fbba finding 2)`.
- **27 ok is never a kill.** A complete M2 run in which the banned check passed adds the problem `M2_UNKILLED`. It says
  something other than the ban clause refused member C, most likely an ended session; that this never counts; to record it
  and stop; and that the fallback is M2b, reviewed separately.
  - A setup failure or an incomplete run fails without that stop.
  - The banned check failing for another reason (finding 3) is no kill and no stop, so the run may be repeated.

**In the runner.**
- **`mutate m2`:**
  - Under **`ended`** it is refused before any SQL is sent: `mutate m2 is refused: the reference ban answer is "ended": … M2 needs a fresh replay whose reference is "live" or "banned", or the separately reviewed M2b`.
  - Under **`banned`** it is allowed. It still needs the usual order: candidate applied, `after` snapshot, no mutation
    active, the last restore proved, and M2 not already applied.
  - Without a reference it is refused: `no reference ban answer of "live" or "banned" is recorded`.
- **`suite m2`:** when the verdict carries `M2_UNKILLED`, the runner prints
  `# STOP: M2 is stopped on this replay: "a banned account reads no profile" passed with the ban clause removed, so no later suite m2 runs here and shared-apply stays blocked; the fallback is M2b, reviewed separately`.
  It records `m2Stopped: true` on that suite entry, which is written once and never rewritten. Every later `suite m2` on
  the replay is then refused before the suite runs, so a later pass cannot be chosen instead. `shared-apply` stays blocked,
  because it still needs a passing `suite m2`.
- **`banNote(ban)`** (it no longer takes the expectation) prints on every verdict:
  - under `banned`: the class limit and M2's exact kill;
  - under `ended`: that M2 is refused on the replay, so `shared-apply` stays blocked there.

**The direct session proof: designed, and not needed as a separate read.**
- Under M2, `profile_read` is still the candidate's `id = auth.uid() and (select private.member_active())`. Snapshot `m2`
  must show exactly `P1.fn_definition_md5` changed, so the policy is intact.
- Without its ban clause, `member_active()` is true only if `exists(select 1 from auth.sessions s where s.id::text = jwt.session_id and s.user_id = u.id)`
  (`member_core.sql:30`) and the other clauses hold.
- So `HTTP 200, 1 row(s)` for member C's own row **can only happen if member C's session row still existed** when it was
  read. The run is its own session evidence. It is real output, and nothing is inferred to manufacture it.
- The other checks staying ok (revoked session, disabled, deletion-pending) show those clauses survived the mutation.
- **What it does not show:** the session state in GREEN's own run. That rests on the same images, code path and fixture
  flow. A per-run read (phase1f.md §9 option (a): a read-only, replay-only count of member C's `auth.sessions` row) would
  need a suite change or a new hash-pinned read-only block, with its own review. It is recorded as an option for the
  reviewer and **not implemented**.
- **Not observed live:** whether GoTrue's ban keeps member C's session. If the live M2 shows 27 ok, the runner stops M2,
  and the fallback is M2b (the session clause removed instead), which needs its own reviewed plan.

## 5. Finding 4: the `before` snapshot is taken once and never retaken

**The gap.** `snapshotNeeds('before')` allowed a retake while the candidate was absent, and `recordSnapshot` then replaced
the reference with nothing to compare it against.

**The fix.**
- `snapshotNeeds('before')` refuses whenever a `before` snapshot exists. The refusal comes before any SQL is sent (the
  command list is `inspect` only):
  `snapshot before is the reference every later snapshot is compared with, so it is taken once and never retaken (review bbe2fbba finding 4): the one taken at <ISO time> stands`.
- A failed attempt (for example a session that was not read-only) records nothing, so it is no reference and may be
  followed by a good one.
- **Why there is no second barrier at the write.** I added one first, at `recordSnapshot`, then removed it. The only path
  that records `before` is `snapshot before`, refused under the lock on the same condition, so that barrier could never be
  reached or killed by a test.
- On the live replay, a retake of attempt 3's `before` (taken at epoch ms `1793032873158`) is now refused.

## 6. Finding 1: a runner-owned staging copy, the attempt recorded, every guard after, and 55321 proved

**The gap.** `migration up --local --workdir <repository>` read the live repository after the last check. Only the
candidate was re-hashed afterwards, and an exit 0 was recorded as success without looking at 55321.

**(a) Staging: the CLI never reads the repository.** `shared-apply` now writes, once, a runner-owned copy at
`/tmp/fitlog-mb1-replay-YYYYMMDD/shared-apply/` (`STAGING`), and `migration up` runs with that as its `--workdir`.
- **The copy:**
  - `supabase/config.toml`: the repository's bytes, **read once**, bound by `sharedConfigProblems` (the shared project,
    `[db] port` 55322, and the config the replay was prepared from), and those same bytes written;
  - `supabase/seed.sql`, `supabase/development-catalogue.sql` and the 16 migrations: **the replay's own manifest-pinned
    copies**, the bytes the replay ran, re-hashed as they are read. The staged candidate must also hash to
    `CANDIDATE_SHA256`;
  - 19 files in all.

  The config's only file references are the two seed paths. The template paths are commented out.
- **Written exclusively and pinned.** Every file is written with `wx`, then all 19 are pinned in `manifest.json` as
  `shared-apply/…`, so `checkOwnedDir` re-hashes them before every command.
- **Never rewritten.** A copy that already exists is only verified. Its pins must equal the bytes it would stage now, or:
  `the staged shared-apply input differs from what would be staged now (…); a staged copy is never rewritten: apply nothing`.
- **Owned.** `shared-apply`, `shared-apply/supabase` and `shared-apply/supabase/migrations` are optional owned
  directories, required to be plain directories when present. The CLI's `shared-apply/supabase/.temp` and `.branches`
  are allowed, as for the replay's own. Anything else under the replay directory still stops every command. Teardown
  removes the copy one entry at a time, like the rest.
- **The `.env` scope** now includes the staged workdir and its `supabase/` (and their real paths).

**The order inside `shared-apply`.**
1. The existing early checks: the repository's candidate pinned, its migrations equal to the replay's, `sharedRunning`, and
   the fresh read-only 55321 snapshot equal to the replay's `before`.
2. Staging, as above.
3. **A guard pass before the next child process** (`inputGuards`, silent): `SUPABASE_*`, `.env`, the repository's config
   binding, the repository's candidate pin, and its migrations (kept as cross-checks: the apply is this repository's
   candidate), plus **the staged input** (`stagedInputProblems`):
   - no entry the runner did not create;
   - the staged directories plain;
   - the manifest pinning exactly the 19 files migration up reads;
   - each one a plain file with its pinned sha256;
   - each seed and migration with the replay's own pin;
   - the staged candidate pinned;
   - the staged config bound to 55322 and to the replay's.
4. **The environment proof on the actual input:** `supabase status -o json --workdir <staging>` must answer at exactly
   `http://127.0.0.1:55321`, with its `DB_URL` at exactly `127.0.0.1:55322`. Its output is never printed.
5. **The same guards immediately before `migration up`**, synchronous, with no await before the child starts. Printed as
   the existing `# rechecked immediately before migration up: …` line, plus
   `# rechecked immediately before migration up, the staged input it reads: exactly the 19 file(s) pinned under shared-apply/, …`.
6. **(c) The attempt record:** `state.json` gets `sharedApplyAttempted: { at, workdir: "shared-apply" }`, written
   synchronously **before** the CLI starts. Even a runner killed outright leaves it.
7. `migration up --local --workdir <staging>`.
8. **(b) After the CLI returns, whatever its exit**, anything below fails with a `# STOP: …; what 55321 applied is unknown, so shared-apply never runs again: …`
   line and exit 1, never a refusal:
   - the repository's candidate is hashed again (phase 1F's line, unchanged);
   - every guard runs again, the staged input included. A failure is `# STOP: after migration up: <reason>; …`;
   - the CLI's exit: a timeout or a non-zero exit is a STOP;
   - only the candidate may appear in `Applying` lines;
   - **a read-only 55321 snapshot that must equal the replay's `after` snapshot**: P1, P2 and P3, each `statements_md5`
     included. Only then is it recorded as `55321-after`, `sharedApplied` set true, and the command exits 0. A difference
     is `# STOP: 55321 does not equal the replay's after snapshot after migration up; …`.

**What an attempt blocks, and what stays allowed.**
- `shared-apply` refuses for good once an attempt is recorded:
  `a shared-apply was already attempted at <ISO> (migration up started), so it never runs again: the coordinator reviews 55321 …`.
  After a verified apply it reads `the candidate was already applied to 55321`, as before.
- `shared-snapshot before` refuses after an attempt.
- **`shared-snapshot after` is allowed after any attempt**, a timeout and an unexpected migration included. That is the
  review's point (c).
- `shared-suite` still needs `sharedApplied` (a verified apply) and the `55321-after` snapshot.
- **Changed meaning:** phase 1F set `sharedApplied: true` on a STOP, so the apply was never repeated. The attempt record
  now does that, and `sharedApplied` means a verified apply only.

## 7. Tests

### 7.1 RED (before any implementation)

- First run (the two MB-1 files): both **failed to load**. `SyntaxError: The requested module './mb1-replay-evidence.mjs' does not provide an export named 'M2_CHECK'`.
- I then added only the three interface constants (`PROFILE_ROW_DETAIL`, `M2_CHECK`, `M2_UNKILLED`), with no behaviour.
  Spec report (`/tmp/fitlog-mb1-phase1g-red.txt`): **`ℹ tests 67`, `ℹ pass 51`, `ℹ fail 16`**. Each failure was read, and
  each is the intended one:
  - the old `ended` M2 pass;
  - `M2_BAN_CLASSES` still `live, ended`;
  - the `ended` M2 passing;
  - the missing notes;
  - no detail check;
  - four `shared-apply` command lists without the staged status and the `after` snapshot;
  - test 68's STOP never reached (the old code migrated the repository);
  - the old no-reference message;
  - `mutate m2` refused under `banned`;
  - no `ended` note;
  - a `before` retake allowed;
  - no staging, no attempt record and no STOP.

### 7.2 GREEN

- The two MB-1 files: `ℹ tests 67`, `ℹ pass 67`, `ℹ fail 0`. That was the first run after implementing, and again after
  moving the plan-order rules (`/tmp/fitlog-mb1-phase1g-green-2.txt`).
- **The final run**, `rtk proxy node --test scripts/backend/*.test.mjs` (plain form, phase2-plan §0.2):
  **`1..120`, `# tests 120`, `# pass 120`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`,
  `# duration_ms 9317.823584`**.
- **Repeated after the docs were written,** because two evidence tests read `phase1.md`, whose R7 gained a paragraph:
  `# tests 120`, `# pass 120`, `# fail 0`, `# duration_ms 10024.404792`.
- `rtk proxy node --check` exits 0 with no output for each of: `mb1-replay.mjs`, `mb1-replay-target.mjs`,
  `mb1-replay-evidence.mjs`, `mb1-replay-order.mjs`, `verify-identity.mjs`, `mb1-replay.test.mjs`,
  `mb1-replay-evidence.test.mjs` and `verify-identity.test.mjs`.

### 7.3 New and changed tests

**New (8 net: 112 → 120).**

| File | Test |
|---|---|
| evidence | finding 2: M2 holds under `live` or `banned` only on the exact kill; 27 ok, at exit 0 or 1, gives exactly the three expectation problems plus `M2_UNKILLED`; a `HTTP 500` or missing detail is no kill and no stop; one failure too many, or RED's five, fail; a setup failure or an incomplete run is no stop (this replaces the F6 "M2 fails closed under banned" test) |
| evidence | finding 2: M2 fails closed under `ended`, whatever the run shows; any class against another reference is a mismatch |
| evidence | F6 and finding 2: `banNote(ban)`, with the `banned` and `ended` texts on every verdict, and `null` otherwise (replaces the F6 `banNote` test) |
| evidence | finding 3: every expected failure, in RED, M1, M2 (`live` and `banned`) and M3, with eight wrong details each (server error, 401, 403, 2 rows, 0 rows, a trailing space, lower case, none), gives exactly one detail problem while the failing names still match; attempt 4's recorded output passes, and fails with one detail changed |
| runner | finding 2: under `banned`, `mutate m2` sends the pinned `sql/m2.sql` to the replay only; `HTTP 500` is NOT met with no STOP; the exact kill is met with the new note; on a second replay, 27 ok is NOT met, prints `M2_UNKILLED` and the STOP line, records `m2Stopped: true`, and the next `suite m2` is refused before the suite runs; the restore still runs; `shared-apply` stays blocked |
| runner | finding 2: under an `ended` reference, RED prints the `ended` note; `mutate m2` is refused with no SQL sent (evidence file written); `shared-apply` stays blocked |
| runner | finding 4: a failed `before` attempt records nothing; after a good one, two retakes (the same and another output) are refused with `inspect` only and the reference unchanged; again after RED, with the evidence file |
| runner | finding 1 (staging): the staged status naming the replay's API or DB refuses before migration up, with no attempt (first run "staged", second "already staged, verified unchanged"); the copy holds exactly the 19 files (config byte-equal to the repository's; the rest byte-equal to the replay's copies; candidate pinned; each pinned in the manifest); an edited staged file is refused by `check`, `shared-snapshot after` and `shared-apply`; an edit re-pinned in the manifest is refused as "differs from what would be staged now"; a planted `config.json` stops every command; six changes made during the staged status call (staged migration, staged candidate, staged `[db]` port, a `config.json`, a link, a `.env` in the staged workdir) are each refused immediately before migration up with no attempt; the success run's `migration up` and staged status use the staged workdir, `migration up` never runs on the repository, the workdir holds exactly the staged files and the attempt is already on disk while it runs; `retain` and `teardown` remove the copy |
| runner | finding 1 (attempt): a timeout, exit 1, an unexpected migration, and a 55321 differing from `after` in P3 `statements_md5`: each a STOP (not a refusal), the attempt on disk before the CLI ran, `sharedApplied` false and no `55321-after`; then `shared-apply` and `shared-snapshot before` refused and `shared-suite` refused; `shared-snapshot after` runs (exit 0 or 1, as 55321 holds) |
| runner | finding 1 (after): eight changes made while migration up runs (a `.env` in the repository and in the staged workdir, a `SUPABASE_*` variable, the repository's `config.json`, its `[db]` port, an added repository migration, an edited staged migration, a planted staged migration): each `# STOP: after migration up: <reason>`, with no `after` snapshot and no exit 0; then the clean apply prints both "rechecked after migration up" lines, records `55321-after` (generation 2) and `sharedApplied`, and `shared-suite` runs |

**Changed existing assertions (none weakened).**
- **Evidence test "M2's expectation follows GoTrue's ban answer".** The `ended` zero-failure M2 expected no problem, which
  was the vacuous pass. It now expects exactly the fail-closed problem. That is stricter.
- **The F6 "M2 fails closed under banned" test** is replaced by the finding 2 test above.
  - The one superseded assertion: "exactly the banned check failing never holds under `banned`". The accepted nonvacuous
    M2 replaces it, and the replacement holds only with the exact detail, exit, summary and reference.
  - Its other assertions are kept with exact problem lists: zero failures fails, RED's five fails, a mismatch fails.
  - `M2_BAN_CLASSES` changes from `live, ended` to `live, banned`.
- **The F6 `banNote` test.** `banNote` takes the class only. The `banned` text names M2's exact kill. `ended` now has a
  note on every verdict, where before it had one only for `m2`.
- **Runner test 62 (read-only runner).** The not-read-only case moved before the first good `before` snapshot, because a
  retake is now refused. It also asserts that the failed case records nothing. The same assertions otherwise.
- **Runner tests 65, 66, 67 (the shared-apply paths).**
  - The command lists now include the staged `status` and the post-apply `psql-read`.
  - The `migration up` workdir is asserted to be the staged copy, where it was the repository.
  - New assertions cover the post-apply snapshot, the staged recheck line, and no attempt on a refusal.
- **Runner test 68 (the candidate STOP).**
  - The trigger is the staged migrate.
  - `sharedApplied: true` becomes `sharedApplyAttempted: { at, workdir }` with `sharedApplied` false.
  - The follow-up refusal is the attempt message, with `inspect` only.
- **Runner test 72 (F6 end to end).** The two `mutate m2` refusals under `banned` (the superseded rule) are removed; the
  finding 2 tests cover M2 under `banned`. The no-reference refusal text now reads "live" or "banned", and it also asserts
  `inspect` only and the evidence flag.

**Harness (test only).**
- The in-memory world answers `status` for the staged workdir, with `onStatus`, `stagedApi` and `stagedDb` for tests.
- A staged `migration up` makes 55321 hold the `after` snapshot, or `afterApply`, and can return `migrateResult`.
- `psqlOutput` takes per-migration `statements`, and `suiteLog` takes per-check `details`.
- New helpers: `atSharedApply`, `suiteWith`, `atM2` and `listFiles`.

### 7.4 Guard mutations

Each mutation was applied, run (the two MB-1 files, spec report to `/tmp/fitlog-mb1-phase1g-mut-<x>.txt`), and restored.
A Grep for every mutation marker (`false &&`, `[] ||`, commented calls, the swapped lines) then found none, and the final
120/120 run came after all of them.

| # | Mutation | Killed by |
|---|---|---|
| A | detail lines not checked | evidence F3, evidence F2, runner F2 (`banned`) |
| B | the parser keeps only that a detail exists, not its text | the same 3 |
| C | `ended` back in M2 with the zero-failure expectation | evidence "M2's expectation…", evidence F2 (`ended`) |
| D | no `M2_UNKILLED` | evidence F2, runner F2 (`banned`) |
| E | the stop without a complete run | evidence F2 (the incomplete-run case) |
| F | no `m2Stopped` gate in `suiteNeeds` | runner F2 (`banned`) |
| G | `mutate m2` allowed under `ended` | runner F2 (`ended`) |
| H | `snapshot before` retakable | runner F4 |
| I | `migration up` on the repository again | 7 tests (65–68, and F1 staging, attempt and after) |
| J | no recheck immediately before `migration up` | 67, F1 staging |
| K | no guard pass before the staged status call | 67 |
| L | the staged input unguarded | F1 staging, F1 after |
| M | no inventory of the replay directory in the staged guard | F1 staging, F1 after |
| N | staged bytes not re-hashed | F1 staging, F1 after |
| O | the attempt recorded after the CLI instead of before | F1 staging, F1 attempt |
| P | no guards after `migration up` | F1 after |
| Q | exit 0 on CLI success, with no `after` snapshot | 6 tests |
| R | `shared-apply` allowed after an unverified attempt | 68, F1 attempt |
| S | `shared-snapshot after` needs a verified apply (the old rule) | F1 attempt |
| T | staging copies the seeds and migrations from the repository | 67, **by message only**: the copy staged during an earlier refused run no longer matches, so "differs from what would be staged now" refuses instead |
| U | the CLI's exit status ignored | F1 attempt (timeout, exit 1) |
| V | no staged-status environment proof | 6 tests |
| W | the staged config not bound | F1 staging, **by message only**: the staged file's hash check still refuses |

T and W are defence in depth: removing either leaves the same input refused by another guard, with another message.

## 8. Hashes (not computed: every hashing command was denied)

`rtk proxy sha256sum <files>`, `rtk proxy shasum -a 256 <file>` and `rtk proxy node -e "<crypto hash>"` were each denied.
I did not retry them, and computed no hash any other way. **The reviewer should hash these changed or new files first:**
- `scripts/backend/mb1-replay.mjs`
- `scripts/backend/mb1-replay-target.mjs`
- `scripts/backend/mb1-replay-evidence.mjs`
- `scripts/backend/mb1-replay-order.mjs` (new)
- `scripts/backend/mb1-replay.test.mjs`
- `scripts/backend/mb1-replay-evidence.test.mjs`
- `docs/plan/runs/MB-1/phase1g.md`, `checkpoint.md`, `phase2-plan.md` and `phase1.md`

**Unchanged by this phase**, so they should still equal review bbe2fbba and phase1e.md §8. This was not re-hashed here:
- `verify-identity.mjs` `944ba934…cdbf81`;
- its test `902bb699…521021`;
- the candidate `ac262f39…2c1bdc3`. The evidence test `the candidate migration is the pinned one, byte for byte` passes,
  so its bytes are still `ac262f39…bdc3`;
- `supabase/config.toml` `67a35911…1b94`.

The evidence test for the reviewed preconditions block (`ca683771…d913ed769a`) passes too. The four CLI files were not
touched, read or hashed.

Line counts after this phase, from Grep:
- `mb1-replay.mjs` 759 (733 before);
- `mb1-replay-target.mjs` 430;
- `mb1-replay-evidence.mjs` 580;
- `mb1-replay-order.mjs` 85;
- `mb1-replay.test.mjs` 1723 (1381 before);
- `mb1-replay-evidence.test.mjs` 589.

## 9. Self-review (not independent), and open issues for the reviewer

I found nothing critical or high. I fixed two things before the final run:
- the unreachable `before` backstop (§5);
- the runner had reached 836 lines, over the 800 limit. The plan-order rules moved, verbatim, to `mb1-replay-order.mjs`.

**Open, low:**
- **Live CLI behaviour with the staged workdir is not observed.** That `migration up --local --workdir <staging>` connects
  to the staged config's `[db] port` and compares only the staged migrations with 55321's history is inferred from:
  - attempt 2, where `start --workdir <replay>` with `cwd` the repository applied 15 migrations, not the repository's 16;
  - review 19eea0f3's reading of the binary.

  The staged `status` proof checks that the CLI resolves the staged config to 55321 and 55322. Whether the CLI writes
  anything under the staged workdir other than `supabase/.temp` or `.branches` is unknown. Anything else stops every later
  command (fail closed), and after an apply that would be a STOP.
- **The staged copy is protected by ownership and hashes, not file permissions.** It sits under `/tmp`, outside the
  worktree, and is verified before every command, twice before the CLI, and after it. A same-user writer during the CLI
  run is caught only afterwards, as a STOP: as before, detection after the fact.
- **The M2 kill's reach.** It shows member C's session survived the ban **in the M2 run**. GREEN's run is inferred (§4).
- **`retain` before `shared-apply`** would freeze a manifest without the staged pins, and teardown would then refuse,
  because evidence is never overwritten. Plan order runs §6 before §7.
- **`55321-before` can still be retaken** while no attempt exists. It is anchored to the replay's `before`, so it is not
  the unanchored reference finding 4 is about.
- **File size:** `mb1-replay.test.mjs` is 1723 lines, over the 800-line guideline (1381 already before). Splitting the
  harness into a shared test module is a separate refactor.
- **Scratch files** from the test runs are in `/tmp` (`fitlog-mb1-phase1g-*.txt`, spec reports only). They are not
  evidence, and were not removed.

## 10. State left untouched

- **The replay project** `/tmp/fitlog-mb1-replay-20261026` was not opened, read, listed or checked. It stays as attempt 4
  left it (§2).
- **55321** got no query, command or inspect from this phase.
- **Unchanged:**
  - the candidate SQL, `verify-identity.mjs` and its test;
  - `supabase/config.toml`, `local-stack.mjs`, `package.json` and the lockfile;
  - every evidence and review file;
  - `phase1b.md` to `phase1f.md` and [phase2.md](phase2.md);
  - `status.json`, GOALS and the ledger.
- `git status --short` (before and after) shows only untracked MB-1 paths. After this phase there are 11: the earlier 10
  and `scripts/backend/mb1-replay-order.mjs`.

## 11. Next bounded phase (the coordinator decides)

1. **A fresh, independent review of the phase 1G diff, before any runner or database step.** Hash the files in §8 first.
   It covers:
   - finding 3's exact detail;
   - finding 2's classes, the `M2_UNKILLED` stop and its record;
   - finding 4;
   - finding 1's staging, its ownership and `.env` scope, the guard order, the attempt record, the post-apply STOP path and
     the `after` snapshot;
   - the open issues in §9.
2. **If accepted, the replay steps that do not need 55321**, each with its own authorization on the same running replay:
   - §3 (`add-candidate`, `migrate`, `snapshot after`, `suite green`: GREEN must answer `banned`);
   - then M1 and M3;
   - then M2 under `banned` (`mutate m2`, `snapshot m2`, `suite m2`: the exact kill, or a STOP that sends M2 to M2b);
   - then restore and §5.
3. **§6 (55321)** needs, in order: item 1 accepted; a passing nonvacuous M2; every other replay proof; and its own
   authorization. It is **not authorized**.
4. The replay keeps running until a stop is authorized. **B1 and B2 stay open. Box 3 is not met.**
5. **Permissions that would help:** `rtk proxy sha256sum` (denied in this session).

## 12. Permissions observed

| Command | Result |
|---|---|
| A compound `cd … && git status --short && git log … && ls … && node --version` (my first command) | Denied. Not retried in that form |
| `rtk proxy node --version`, `rtk proxy git status --short`, `rtk proxy date -u …` | Allowed |
| `rtk proxy node --test scripts/backend/*.test.mjs` (plain form) | Allowed (output persisted to a file by the tool, read with Grep) |
| `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-phase1g-*.txt <two files>` | Allowed (exit 1 on RED and under mutations, 0 on GREEN) |
| `rtk proxy node --check <file>` | Allowed (eight commands) |
| `rtk proxy node -e "<sha256 of files>"`, `rtk proxy shasum -a 256 <file>`, `rtk proxy sha256sum <files>` | Denied; not retried, and no hash was computed another way |
| `rtk proxy wc -l <files>` | Denied; Grep's line count replaced it |
| Read, Grep, Glob of the worktree, the two `/tmp` final messages and the scratch reports | Allowed |
| Subagents | Not used: the brief forbids them |
