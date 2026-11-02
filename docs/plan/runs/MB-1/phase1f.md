# MB-1 phase 1F: review 19eea0f3 findings 1 and 2, and F6, fixed test-first (pure code only, no live run)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3 (as phase 2). Box 3 is **not met**; B1 and B2 stay open |
| Authorization | Codex AUTH-01: one bounded **pure-code** phase, 1F. Fix test-first the pending shared-target findings 1 and 2 of review 19eea0f3 ([verbatim](../../../evidence/MB-1/review-19eea0f3-final.md)) and the new F6 ([phase2.md](phase2.md) A3.3). Worker 6ff89e71 had stopped; no database lane was active. Writes limited to `scripts/backend` and the MB-1 docs and evidence. **Not allowed:** any database, network, Supabase CLI, Docker, runner, fixture or replay-file action; `shared-apply`, `stop` or teardown; dependencies, the root package, CI, GOALS, status, ACCEPTANCE or `main`; commits or pushes; subagents; auth switches; overage. A fresh independent review is required before any further database step |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed |
| Node | `node --version` gave `v22.23.1` |
| Times | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` gave `2026-10-26T17:04:38Z` (after the reading, before any edit), `2026-10-26T17:22:55Z` (after the last mutation was restored) and `2026-10-26T17:26:59Z` (after the final run: 112 pass, 0 fail, `# duration_ms 6047.410292`, with these records written) |
| Result | **Findings 1 and 2 and F6 are fixed in code, test-first.** RED first: the evidence test file could not load, and 5 of 31 runner tests failed. GREEN: `rtk proxy node --test scripts/backend/*.test.mjs` gives **112 pass, 0 fail** (104 before, plus 8 new tests). All seven `node --check` pass. 15 guard mutations each fail a named test (§5). **No replay or database command ran.** The candidate SQL, `verify-identity.mjs`, the 27-check list and every evidence file are unchanged |
| Read | The RTK rules (`/Users/Adya/.codex/RTK.md`, through `AGENTS.md`); [checkpoint.md](checkpoint.md); [phase1e.md](phase1e.md); [phase2-plan.md](phase2-plan.md); [phase2.md](phase2.md) (attempt 3); review 19eea0f3 ([verbatim](../../../evidence/MB-1/review-19eea0f3-final.md)); `/tmp/fitlog-6ff89e71-final.md` (attempt 3's final message); the Codex scratch probe `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-mb1-config-independent-dtnep7zc/probe.test.mjs` (its two probe tests, lines 1159-1179); `phase2-2-red.txt`; [phase1.md](phase1.md) R7; `member_core.sql` lines 24-31; the runner, target and evidence modules and their tests |

## 1. What this phase did, and did not do

- **Did:**
  - wrote the tests first and saw them fail;
  - changed only `mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs` and their two test files;
  - ran the pure tests, the seven syntax checks and 15 guard mutations;
  - wrote this record and updated [checkpoint.md](checkpoint.md), [phase2-plan.md](phase2-plan.md) and [phase1.md](phase1.md) R7 (one added paragraph, outside the hash-pinned §7 block).
- **Did not:**
  - run the Supabase CLI, Docker, any database query or any runner command;
  - read, open or check the running replay project or its directory;
  - change the candidate SQL, `verify-identity.mjs`, its test, any review copy or any evidence file;
  - commit;
  - use subagents. So the `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not run. §7 is my own review, not the independent one the brief requires.

## 2. Review 19eea0f3 finding 1: the repository's config is bound to 55322 and to the replay's

**The gap.** `migration up --local --workdir <repository>` connects to the `[db] port` of the repository's config, read when it
runs. CLI 2.121.0 also prefers `supabase/config.json` to `config.toml`, by the reviewer's reading of the installed code. The
phase 1E check proves only where the running 55321 container publishes: status's `DB_URL` at `127.0.0.1:55322`. So a
`[db] port` edited to 56422 after 55321 started would pass every check, and the candidate would go to another local project.
The Codex probe shows this: config at 56422 and status at 55322, and `shared-snapshot before` and `shared-apply` both ran.

**The fix: `sharedConfigBound` in `mb1-replay.mjs`, with `sharedConfigProblems` and `configPorts` in `mb1-replay-target.mjs`.**
It reads files only, with no child process and no await:

1. **No `supabase/config.json`** in the repository, in any case and of any type (file, directory or link). The repository's
   `supabase/` is listed by name; no file is opened. The refusal names the path only:
   `<path> is present; the Supabase CLI prefers config.json to config.toml, so nothing runs on 55321 while it is there (names
   only: no file was read, changed or removed)`. A directory that cannot be listed, for any reason but absence, is refused.
2. **The repository's `config.toml` names `fitlog_rebuild_20261017`.** This replaces the old container-name check, with the
   same effect.
3. **Its `[db] port` is exactly `55322`**, where status's `DB_URL` must also be. That binds the config's port to the status
   port. A port written any other way is absent and refused, including a quoted string or an `env()` reference. Message:
   `the repository's supabase/config.toml sets [db] port <port or (none)>, not 55322, where its status DB_URL must be;
   migration up --local connects to the config's port`.
4. **It is the config the replay was prepared from.** `sha256(replayConfig(text))` must equal the manifest's
   `supabase/config.toml` pin, as review 19eea0f3 proposed. `replayConfig` changes exactly nine lines and refuses any other
   553xx port, so only the same text can reach the pin. Messages: `… no longer yields the replay's config (<the replayConfig
   refusal>)` or `… is not the one the replay was prepared from (its replay config's sha256 differs from manifest.json's)`.

**Where it runs.**
- In `dispatch`, for the three 55321 commands (`shared-snapshot`, `shared-apply` and `shared-suite`, newly flagged
  `shared: true`). It runs after the owned-directory, lock and state checks, which are all file reads, and **before any child
  process**, the shared-pin `docker inspect` included. So the probe's case refuses with an empty command list.
- Again in `sharedRunning`, right before the repository's `status` call.
- Again immediately before `migration up` (finding 2).

**The replay's own directory** never holds a `config.json`: `checkOwnedDir` refuses any entry the runner did not create. A
new test asserts it for `check`, `migrations` and the four 55321 command forms.

## 3. Review 19eea0f3 finding 2: the guards run again immediately before `migration up`, and the candidate is hashed after it

**The gap.** `shared-apply` checked the `.env` files, the candidate pin and the migration comparison once each. Then came the
status call and the fresh read-only snapshot, which take seconds, and only then `migration up`, which reads the same files.

**The fix (`mb1-replay.mjs`).**
- **`guardsBeforeMigrate`.** It runs right after the fresh snapshot, synchronously, with no await between it and the start of
  the `migration up` child. It checks:
  - no `SUPABASE_*` variable (`refuseSupabaseVariables`, now shared with `dispatch`);
  - no `.env*` file the CLI may load (`refuseEnvFiles`, the same scope as phase 1E);
  - finding 1's config binding;
  - the pinned candidate;
  - the repository's migrations equal the replay's, byte for byte.

  Any change refuses, and nothing is applied. On success it prints `# rechecked immediately before migration up: …`.
- **`candidateChangedAfter`.** After the CLI returns, whatever its exit code, the candidate is hashed again.
  - **Same bytes:** it prints `# after migration up: <rel> still has the pinned sha256 <hash>`.
  - **Changed or unreadable:** it prints `# STOP: <rel> changed while migration up ran (sha256 …, pinned …)` (or `could not be
    read after migration up (<code>)`), then `; what 55321 applied is unknown, so shared-apply never runs again: the
    coordinator reviews 55321 (a read-only shared-snapshot after shows what it holds)`. The exit is 1, and `sharedApplied` is
    recorded as `true`, so the apply that may have written is **never repeated**. That is a deliberate fail-closed choice: it
    is a STOP line, not a refusal, because the state must be saved.

**What is still open.** The CLI reads the config, the `.env` files and the migrations **after** it starts, so a change in that
window is not ruled out. Only the candidate, the one SQL that reaches 55321, is rechecked after the apply. The config and the
migration set are not. §7 lists this for the reviewer.

## 4. F6: GoTrue's `user_banned` answer is its own class, `banned`

**The decision.** `HTTP 403` with the JSON `code` exactly `user_banned` is a third class, **`banned`**. It is never `live` and
never `ended`. The answer says the user is banned. It does not say whether member C's `auth.sessions` row still exists, and
that is what tells `member_active()`'s ban clause (`u.banned_until is null or u.banned_until < now()`) from its session clause
(`exists(select 1 from auth.sessions s …)`, `member_core.sql:28,30`). The Codex coordinator cites Supabase's official
error-codes guide (`https://supabase.com/docs/guides/auth/debugging/error-codes`): it names `user_banned` as an error code, not
as a session revocation. **This phase made no network call, so that page was not fetched here.** The changelog was unavailable
this cycle, as the coordinator reported.

**`classifyBan` (`mb1-replay-evidence.mjs`).**

| Answer | Class |
|---|---|
| `HTTP 200` | `live` |
| `HTTP 403` with a JSON object whose own `code` is exactly `session_not_found` | `ended` |
| `HTTP 403` with a JSON object whose own `code` is exactly `user_banned` | **`banned`** |
| Anything else | `null` (unknown: the run stops) |

The "anything else" row is tested shape by shape:
- other statuses: 400, 401, or 200 with a body;
- other codes: case variants, prefixed, suffixed or padded codes, and other GoTrue codes;
- no code at all: `null`, a message alone, or `error_code`;
- the wrong JSON shape: arrays, strings, broken JSON, a `__proto__` wrapper, inherited names such as `constructor`;
- extra or trailing spaces, `null`, an empty answer and a non-string.

**What each check expects under `banned`.**
- **RED, GREEN, M1 and M3 keep their exact expectations.** Those expectations never depended on the ban class (only M2's
  does), so accepting `banned` for them is sound.
- **The class does not loosen RED.** A sixth or a missing failure, the wrong exit, the wrong summary or a stray line still
  fails it.
- **The first recognised answer is still the reference.** Every later run, 55321's included, must equal it. Tested every way:
  `banned` against a `live` or `ended` reference, and `live` or `ended` against a `banned` one.
- **M2 fails closed.**
  - **In the verdict:** under `banned`, M2 never holds, whatever the run shows. That includes a vacuous run with zero failures
    and exit 0, and a run with exactly `a banned account reads no profile` failing. The one problem is `M2 has no sound
    expectation under the "banned" ban answer (GoTrue user_banned): …; M2 stays refused until a separately reviewed plan adds
    direct session evidence`.
  - **In `expectedFailures`:** it now throws for M2 under any class but `live` or `ended`.
  - **In plan order:** `mutate m2` is refused **before any SQL is sent**: `mutate m2 is refused: the reference ban answer is
    "banned", under which M2 has no sound expectation (GoTrue's user_banned does not show whether the ban ended the session);
    it needs a separately reviewed plan with direct session evidence`. A reference that is neither `live` nor `ended` refuses
    too. That case cannot be reached in plan order, but it is tested.
  - **So `shared-apply` stays blocked.** `sharedApplyMissing` still needs a passing `suite m2`.
- **Nothing is silent.** The runner prints a `banNote` line with each verdict:
  - under `banned`, on every run: `# ban answer "banned" (GoTrue HTTP 403 user_banned): the user is banned, but whether its
    session row still exists is not shown, so this is neither "live" nor "ended"; RED, GREEN, M1 and M3 do not depend on it,
    and M2 is refused until a separately reviewed plan adds direct session evidence`;
  - under `ended`, for M2: the existing narrowed claim of phase1.md R7, stated explicitly: `# m2 under "ended": … 27 ok proves
    nothing about the ban clause; the ban claim narrows to "a ban ends access" (phase1.md R7)`. The `ended` verdict itself is
    unchanged. Whether it should fail closed too is left to the reviewer (§7).

**Attempt 3's failed RED stays as it ran, with no reclassification.**
- Nothing here re-judges a stored run. A suite entry is written once, and later runs only append. A new test runs an
  unknown-answer RED first (as attempt 3 ended), then a passing one. It asserts that the first entry is byte for byte
  unchanged (`red:false:null`) and that `add-candidate` refused in between.
- A test also pins `phase2-2-red.txt` as it was written: `unrecognised`, `the red expectation is NOT met`, exit 1.
- That file's exact suite output is used only as a fixture for a **new** run (`phase2-2-red-2` in the sandbox). Under the new
  code it would pass RED with the reference `banned`. That shows what a rerun would give. It is **not** a RED for attempt 3.
- `state.json` in `/tmp/fitlog-mb1-replay-20261026` was not opened. It still holds `ok false` and `ban null`.

**No contract or check-count change.**
- `verify-identity.mjs` is unchanged: still 27 checks, and still the same "after the ban" line.
- The candidate SQL is unchanged. The evidence test that pins it to `ac262f39…bdc3` passes.
- No published contract was touched.
- **One consequence for the plan:** under `banned`, phase2-plan §4's M2 row cannot pass, so §6 stays blocked until a
  separately reviewed M2 plan exists (§9).

## 5. Tests

**RED (before any implementation), after the tests were written.**
- `rtk proxy node --test` over the three MB-1 test files gave **46 tests, 40 pass, 6 fail**:
  - `mb1-replay-evidence.test.mjs` failed to load (`SyntaxError: … does not provide an export named 'M2_BAN_CLASSES'`);
  - 5 runner tests failed.
- Alone, `mb1-replay.test.mjs` gave **31 tests, 26 pass, 5 fail**. The F6 runner test failed exactly where expected: the
  recorded `user_banned` output was still `unrecognised` (`suite red with the recorded user_banned output: … 1 !== 0`). The
  other four failure details fell in the truncated part of the tool output, so they are known by count only.

**GREEN.**
- The three MB-1 files: `# tests 73`, `# pass 73`, `# fail 0` (65 before).
- `rtk proxy node --test scripts/backend/*.test.mjs`: **`# tests 112`, `# pass 112`, `# fail 0`**. This was the final run,
  after every mutation was restored and the §7 fixes made. 104 before, plus 8 new.
- `rtk proxy node --check` passes for `mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs`,
  `verify-identity.mjs`, `mb1-replay.test.mjs`, `mb1-replay-evidence.test.mjs` and `verify-identity.test.mjs`: all exit 0, no
  output.

**New tests (8).**

| File | Test |
|---|---|
| evidence | F6: the recorded `user_banned` answer is `banned`, distinct from live and ended; every other shape stays unknown; `phase2-2-red.txt` still reads NOT met |
| evidence | F6: under `banned`, RED, GREEN, M1 and M3 keep their exact expectations, and the reference must match every way |
| evidence | F6: M2 fails closed under `banned`, whatever the run shows, a vacuous zero-failure run included |
| evidence | F6: the runner states each class limit (`banNote`) |
| runner | Finding 1: every 55321 command binds the `[db]` port to 55322 and to the replay's config, before any child process. It covers 7 config variants × 4 command forms, the Codex probe first, each with an empty command list. Then `config.json` in three cases and as a directory, never read. Then the replay directory's `config.json`, and a clean pass at the end |
| runner | Finding 2: a change made after the fresh snapshot, just before `migration up`, applies nothing. 8 late changes, each made while the in-memory 55321 answers the fresh snapshot: a `.env` in the repository, a `.env` in a parent, a `SUPABASE_*` variable, a `config.json`, the `[db]` port, the candidate, an added migration and an edited migration. Each gives `inspect, status, names, psql-read, inspect`: no `migration up` |
| runner | Finding 2: a candidate changed or unreadable after `migration up` is a STOP (exit 1, no refusal, saved to the evidence file), `sharedApplied` is true, and `shared-apply` refuses after it |
| runner | F6: the user_banned path end to end in the in-memory world. Covers the earlier failed RED kept, the recorded output passing as a new RED with reference `banned`, and a live GREEN refused as a mismatch while a `banned` GREEN passes. Then M1 and M3 pass, `mutate m2` is refused twice with no SQL sent, `shared-apply` is still missing `suite m2`, and a null reference refuses M2 too |

**Harness changes (test only):** the in-memory world calls `onRead` while answering a read-only snapshot and `onMigrate`
while answering `migration up`. A test can then change the repository at exactly those moments. `suiteLog` takes the ban
line as a parameter.

**Changed existing assertions (none weakened).**
- `mb1-replay-evidence.test.mjs`, the M2 test. `classifyBan('HTTP 403 {"code":"user_banned",…}') === null` and the
  "unrecognised `user_banned`" judgement were the pre-F6 rule. F6 replaces that rule. Both assertions now use another
  still-unknown GoTrue code (`bad_jwt`), with the same strength. `user_banned` itself is now asserted as `banned` in the new
  tests, which are stricter, M2 refusal included.
- `mb1-replay.test.mjs`, the mechanical-verdict test. Its `user_banned` case now uses `bad_jwt` for "unrecognised", and a
  new case asserts that `user_banned` against a `live` reference is the exact mismatch problem.

**Guard mutations.** Each was applied, run, then restored. The final 112/112 run is after every restore, and a Grep for each
mutated line confirmed the restored code.

| # | Mutation | Killed by |
|---|---|---|
| M7 | `user_banned` removed from the known codes | evidence F6 classify, F6 RED/GREEN, F6 M2 (3 failures) |
| M8 | `banned` treated like `ended` for M2 (no M2 branch, `expectedFailures` gives `[]`): the vacuous pass | evidence F6 M2 (`0 failure(s), reference null`: `true !== false`) |
| M10 | no `banNote` for `banned` | evidence F6 banNote |
| M9 | no M2 refusal at `mutate` | runner F6 (the M2 SQL was sent, exit 0) |
| M1 | no config binding in `dispatch`, so only `sharedRunning`'s remains | runner finding 1 (the probe case ran `inspect` first) |
| M2 | no `config.json` refusal | runner finding 2 (the `config.json` case reached `migration up`). A second failure fell in the truncated output, consistent with finding 1's `config.json` part, so it is known by count only |
| M3 | no `[db] port` check | runner findings 1 and 2, **by message only**: the moved port is still refused by the manifest binding ("changed 8 line(s)"). The explicit port check is a clearer second barrier |
| M4 | no manifest-hash comparison | runner finding 1 (a config edited after prepare passed) |
| M5 | no `guardsBeforeMigrate` call | runner finding 2 (`migration up` ran) |
| M5b | `guardsBeforeMigrate` without the `.env` check | runner finding 2 |
| M5c | … without the `SUPABASE_*` check | runner finding 2 |
| M5d | … without the config binding | runner finding 2 |
| M5e | … without the candidate pin | runner finding 2, **by message only**: the migration comparison still refuses the edited candidate |
| M5f | … without the migration comparison | runner finding 2 (an added migration reached `migration up`) |
| M6 | no re-hash after `migration up` | runner finding 2 STOP test (`changed`: exit 0), and finding 2's success line |

That is 15 mutations, each its own run (M5b–M5f are five). M3 and M5e are defence in depth: removing either leaves the same input
refused by another guard, with another message.

## 6. Unknowns, recorded rather than guessed

- **Whether the ban ended member C's session** on the replay's GoTrue. `user_banned` does not say, and nothing here claims it.
- **Live CLI behaviour.** This phase did not observe whether CLI 2.121.0 actually prefers `config.json`, or reads the
  `[db] port` when `migration up` runs. Both are review 19eea0f3's reading of the installed binary.
- **The Supabase error-codes page** was not fetched in this phase (no network). The coordinator's citation is relied on.
- **The four RED runner failure details.** They were truncated in the tool output. Their count is known (5), and the F6 one
  is shown.
- **The sha256 of the changed files.** `rtk proxy sha256sum` (several files, then one) and `rtk proxy shasum -a 256` were
  denied in this session, so no new hashes are recorded. The candidate's bytes are still the pinned `ac262f39…bdc3`: the
  evidence test `the candidate migration is the pinned one, byte for byte` computes that hash and passes. The reviewer should
  hash the five changed files before reviewing.

## 7. Self-review (not independent), and residuals for the reviewer

I found nothing critical or high. I fixed two small items before the final run:
- the M2 refusal named `user_banned` even with no reference recorded (it now has its own message, tested);
- the `guardsBeforeMigrate` comment overstated how close the recheck sits to the CLI's own reads.

Low items left open:
- **The window inside the CLI.** The config, the `.env` files and the migrations can still change after the pre-migrate
  recheck and before the CLI reads them. Only the candidate is rechecked after. Running `guardsBeforeMigrate` again after
  the apply, as a STOP rather than a refusal, would cover them.
- **`sharedApplied: true` on a STOP.** After a candidate change during the apply, `shared-snapshot after` and `shared-suite`
  are allowed again (read-only and API-only). The STOP line stops the phase by plan rule, but the runner does not enforce
  that by itself.
- **`ended` M2.** It still passes with zero failures under R7's narrowed claim, now with a note printed. Should it fail closed
  as `banned` does?
- **`banned` RED as the reference.** If a later run, such as 55321's, answers `live` or `ended`, the mismatch fails it. That
  is intended (one reference), but it means 55321 must answer `user_banned` too.
- **Scope of the `config.json` check.** Only the repository's `supabase/` is checked, by name, case-insensitively. Parent
  directories are not, because the CLI's upward search runs only when both config files are missing in `<dir>/supabase`.
- **File size.** `mb1-replay.test.mjs` is 1381 lines, over the 800-line guideline (about 1150 before). `mb1-replay.mjs` is
  733 lines.

## 8. State left untouched

- **The replay project** (`/tmp/fitlog-mb1-replay-20261026`) was not opened, read, globbed or checked. It stays as attempt 3
  left it: running, no lock, generation 1, candidate `absent`, the `before` snapshot, one red suite with `ok false`, and
  `ban null`.
- **55321** got no query, command or inspect from this phase.
- **Unchanged:**
  - the candidate SQL (pinned `ac262f39…bdc3`, re-proved by its test), `verify-identity.mjs` and its test;
  - every review copy and evidence file, `phase2-2-red.txt` included;
  - `phase1b.md` to `phase1e.md`, and [phase2.md](phase2.md);
  - `local-stack.mjs`, `package.json`, the lockfile and `config.toml`;
  - `status.json`, GOALS and the ledger.
- **[phase1.md](phase1.md):** one paragraph was added to R7, outside the hash-pinned §7 block. The preconditions-block test
  still passes.

## 9. Next bounded phase (the coordinator decides)

1. **A fresh, independent review of the phase 1F diff, before any database step.** It covers:
   - finding 1: `sharedConfigBound`, its order before any child process, the `config.json` scope and the manifest binding;
   - finding 2: `guardsBeforeMigrate`, `candidateChangedAfter` and the `sharedApplied` choice;
   - F6: the `banned` class, M2 failing closed, and the residuals in §7.

   Hash the five changed files first.
2. **If accepted, for the disposable replay only:** on the **same, still running** `/tmp/fitlog-mb1-replay-20261026`, never
   prepared again, `MB1 suite red --evidence phase2-2-red-2` as a background job, never killed. Then hash the four CLI files
   again.
   - The runner allows this: candidate `absent`, the `before` snapshot present, and the last suite at 16:41:29Z.
   - Expect exactly the five `profile_read` failures and the exact summary. The ban line should read `# suite exit 1;
     GoTrue's answer after the ban: banned` (or `live` or `ended`, if GoTrue answers so), followed by `# verdict: the red
     expectation is met` and, under `banned`, the `banNote` line.
   - Any refusal, `STOP:` line or other answer stops the phase.
   - The first recognised answer becomes the reference.
3. **M2 needs its own separately reviewed, nonvacuous plan** before §6 can be reached under `banned`. Options to review (none
   is implemented):
   - **(a) Direct session evidence.** After the ban, a read-only, replay-only count of member C's `auth.sessions` row: by
     user id and the session id from the JWT, the count only, no token printed. If the row exists, M2's expectation is
     `live`'s; if not, `ended`'s. It needs either a new hash-pinned read-only block (and a review), or a suite change that
     prints a line without adding a check.
   - **(b) An isolating mutation.** M2b removes `member_active()`'s *session* clause instead. Then only the ban clause can
     refuse member C, so `a banned account reads no profile` passing under M2b proves the ban clause, whatever the session
     state. The revoked-session checks would fail, and their exact expected set must be derived and reviewed. It changes the
     mutation set and phase2-plan §4.
   - **(c) Accept the narrowed claim under `banned`**, as under `ended`. This needs an explicit coordinator decision to change
     the `shared-apply` gate. It is not recommended without review.

   Until one is reviewed and authorized, M2 stays refused and `shared-apply` stays blocked.
4. **§6 (55321)** still needs, in order: the review in item 1 to accept findings 1 and 2; a passing M2 under a reviewed plan
   (item 3); every other replay proof; and its own authorization.
5. **The replay project keeps running** until a stop is authorized. B1 and B2 stay open. Box 3 is not met.
6. **Permissions that would help:** `rtk proxy sha256sum` for the changed files (denied this session); the running-only
   `docker ps` and `pgrep` for the next live phase.

## 10. Permissions observed

| Command | Result |
|---|---|
| A compound `cd … && git status --short && git log … && ls … && node --version` | Denied. It broke the one-command rule, and was not retried in that form |
| `git status --short`, `rtk git status` | Denied |
| `node --version` | Allowed: `v22.23.1` |
| `rtk proxy git status --short` | Allowed: only the 10 MB-1 paths, before and after |
| `rtk proxy node --test <files>` (plain form) | Allowed |
| `rtk proxy node --test --test-name-pattern=… <file>` | Denied; the plain form was used, and failure details in truncated output are known by count only |
| `rtk proxy node --check <file>` | Allowed (seven commands) |
| `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | Allowed |
| `rtk proxy sha256sum` (eight files, then one) and `rtk proxy shasum -a 256 <file>` | Denied; not retried further, and no hash was computed another way |
| Read of `/tmp/fitlog-6ff89e71-final.md` and the Codex probe file; a name-only Glob of `supabase/*onfig*` | Allowed: only `supabase/config.toml` exists |
| Subagents | Not used: the brief forbids them |
