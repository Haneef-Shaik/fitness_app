# MB-1 phase 1F independent safety review, final verdict (verbatim, provenance bbe2fbba)

| Field | Value |
|---|---|
| Source | `/tmp/fitlog-bbe2fbba-final.md`, the review's final message, as the Codex coordinator supplied it to phase 2 attempt 4 under AUTH-01 ("Codex AUTH-01 authorizes ONE disposable RED command under independent phase1F review bbe2fbba … Persist full review verbatim"). `bbe2fbba` is the reviewing session's id block as the file name gives it. The coordinator supplied no longer session id, and none is invented here. No transcript was read |
| Reviewed | The uncommitted phase 1F work on `codex/mb1-identity` (base local `main` `2a95726`): review 19eea0f3's findings 1 and 2, and F6, in `scripts/backend/mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs` and their two test files, at the sha256 values the review lists. Attempt 4 re-hashed all five, plus `verify-identity.mjs`, its test, the candidate and `supabase/config.toml`, before the runner command. Each equals the review ([phase2.md](../../plan/runs/MB-1/phase2.md) A4.1) |
| Verdict, as the review states it | Not blocked. **Four low findings. No critical, high or medium finding.** 112 of 112 pure tests pass; seven syntax checks pass. It accepts **one** disposable step, `suite red --evidence phase2-2-red-2` on the replay already running, under its conditions 1–4. It does **not** authorize `shared-apply`. Box 3 is not met, B1 and B2 stay open, and no goal is Done |
| Copied | 26 October 2026, in phase 2 attempt 4 (which began at 18:03:50Z), by reading that file. No source, test, config or SQL file changed in that attempt. Everything below the rule is the file's text, unedited, apart from a final newline if the source lacks one. That includes its first line, a progress sentence from the reviewing session that comes before the review's title. The `git diff --no-index` against the source is in [phase2.md](../../plan/runs/MB-1/phase2.md) A4.5 |
| Dispositions (Codex AUTH-01) | Accepted **for the one disposable RED only**, under the review's conditions 1–4. **All four lows are assigned to MB-1, pending**, each to be fixed test-first and independently reviewed **before** any `shared-apply` authorization: **finding 1**, a pinned staging copy for `migration up`, a post-apply recheck with a 55321 snapshot that must equal the replay's `after`, and a recorded apply attempt; **finding 2**, M2 under `ended` fails closed, and the nonvacuous M2 strategy is the one under `banned`; **finding 3**, exact enforcement of each expected failure's detail line; **finding 4**, the `before` snapshot made immutable. **No code correction in this phase**, and `shared-apply` stays unauthorized. Routine decision: the review's proposed nonvacuous M2 is accepted as the plan for a later pure-code, test-first phase with its own review. It is not implemented here. A zero-failure M2 under `ended` never counts. This file records what the reviewer said, not what has changed since |

---

The fixtures are labelled placeholders, and the test JWT is built at runtime, so no real key shapes are committed. One last check: confirm the evidence tests pin the vacuous-M2 refusal.

# MB-1 phase 1F: independent safety review

**Verdict: not blocked.** I found no critical, high or medium issues, and four low ones. Phase 1F holds for one disposable step: a new `suite red --evidence phase2-2-red-2` on the replay that is already running, under the conditions below. `shared-apply` stays unauthorized, and the runner blocks it on its own because M2 cannot pass under `banned`. Box 3 is not met, B1 and B2 stay open, and no goal is Done. I edited nothing.

## What I ran

- **Node:** v22.23.1.
- **Syntax:** all seven `rtk proxy node --check` runs exit 0.
- **Tests:** 112 pass, 0 fail (`rtk proxy node --test` over the six `scripts/backend/*.test.mjs` files, listed by name).
- **Git status:** only the 10 untracked MB-1 paths. No tracked file has changed.
- **Hashes, computed with Node `crypto`:**

| sha256 | File |
|---|---|
| `c61e0e3c614a09e04363fc85e7f023b1ba3fe28d109c9a6fd62455d432fb9264` | `mb1-replay.mjs` (changed in 1F) |
| `d114e6901b7d51a278690a67a6469e3bb1979e417f6e83ca165d61f98bd46524` | `mb1-replay-target.mjs` (changed) |
| `7380f5e75fb000a9fdcf7c10252392197088f0ea6e5de1f775d594dd16e63116` | `mb1-replay-evidence.mjs` (changed) |
| `75dd544931b1684e9b1c1f5f207b1a7057be1547bbfa1f46e614943b420f18c7` | `mb1-replay.test.mjs` (changed) |
| `c8eb51630a27aabcf1f387f7dc660b6555685606426029cf6d14bbd5761011ed` | `mb1-replay-evidence.test.mjs` (changed) |
| `944ba934…cdbf81`, `902bb699…521021`, `ac262f39…2c1bdc3` | `verify-identity.mjs`, its test, the candidate: all equal phase1e.md §8 |
| `67a3591105da6cc41032b8c4dc72680ae65cd93751dc594ee5918f7654481b94` | `supabase/config.toml` (tracked, unchanged) |

- **Denied:** my first Bash call, a compound `cd … && git status --porcelain … && git log … && git diff --stat HEAD && ls …`. I did not retry that form. Every later single `rtk proxy` command was allowed.
- **Footprint:** the test run creates and removes its own temporary fixture directories. No manual scratch files, database, Docker, Supabase CLI, runner or network. I did not open the replay directory.
- **Coverage:** I read the three changed modules in full, plus the phase 1F tests (runner `:938-1077` and `:1140-1201`, evidence `:272-341`). For the rest of the test files I relied on the passing run.

## Findings, most severe first

### 1. Low: the CLI still reads the live repository after the last check; only the candidate is checked afterwards, and an exit 0 from `shared-apply` proves nothing
- **Location:** `mb1-replay.mjs:584-588` and `:593-595` (and `:551-567`).
- **The defect.**
  - `guardsBeforeMigrate` is synchronous, and the child starts in the same tick: `runCommand` calls `spawnImpl` inside the Promise executor. So everything up to the child's start is covered.
  - But `migration up --workdir <repository>` then reads `config.toml`, `supabase/.env*` and `supabase/migrations` itself.
  - After the apply, only the candidate is hashed again.
  - Success (exit 0, `sharedApplied: true`) is recorded without looking at 55321.
- **Failure scenario.**
  - A migration file appears in this worktree while the CLI is starting up. The CLI applies it to 55321. The runner prints a problem and exits 1, but `sharedApplied` stays false. That is an unreviewed write to the shared stack (D7), detected only after it happened.
  - Port variant: `[db] port` changes in the same window. The candidate, plus anything that project lacks, goes to whichever local project listens on that port. If that project already has the 15, `shared-apply` even exits 0 with `sharedApplied: true`. Only a later `shared-snapshot after` would notice.
  - Both cases need a writer in MB-1's own worktree within that sub-second window. Local stacks only, no user data.
- **Fix (before §6; not needed for the disposable RED).**
  - (a) Run `migration up` from a runner-owned, manifest-pinned copy: the repository's `config.toml` and the 16 migrations, byte-equal to the checked files. Then no edit to the worktree can reach the CLI.
  - (b) After the CLI returns, rerun all of `guardsBeforeMigrate` as a `STOP`. Then, inside `shared-apply`, take the read-only 55321 snapshot and require it to equal the replay's `after`, including P3 `statements_md5`, before exiting 0.
  - (c) Record any apply that started (for example `sharedApplyAttempted`), so that no outcome allows another apply without coordinator review. Keep the read-only `shared-snapshot after` allowed; today a timeout or an unexpected migration blocks it.

### 2. Low: under `ended`, M2 still passes vacuously, and that opens the `shared-apply` gate
- **Location:** `mb1-replay-evidence.mjs:207` and `:241`; `mb1-replay.mjs:312` and `:330`.
- **The defect.** `ended` is still in `M2_BAN_CLASSES`, with an expectation of zero failures. Under `ended`, member C's session row is gone, so the session clause refuses member C with or without the ban clause. The 27-ok run proves nothing about the ban clause, yet it counts as a passing `suite m2`.
- **Failure scenario.** If this rerun, or a later fresh replay, records `ended` as the reference, M2 passes with 27 ok and the gate opens. A broken ban clause would then pass every proof, because GREEN's banned check also passes through the session clause. The printed narrowed-claim note does not stop this.
- **Fix.** Fail closed under `ended`, exactly as under `banned`. Under `ended` the only nonvacuous route is the isolating M2b: remove the session clause instead.

### 3. Low: the suite verdict never reads why an expected check failed
- **Location:** `mb1-replay-evidence.mjs:257` (the detail line is skipped) and `:283-293`.
- **The defect.** `parseSuiteLog` drops the detail line after each `not ok`. So an expected failure that reads `HTTP 500 …` or `HTTP 401 …` counts the same as `HTTP 200, 1 row(s)`.
- **Failure scenario.** For RED, M1 and M3, the other checks make a pass for the wrong reason unlikely. For any M2 plan, the detail line *is* the evidence: a kill that is really a server error does not show that the ban clause is needed.
- **Fix.** Keep the detail lines, and require exactly `HTTP 200, 1 row(s)` for every expected profile-read failure. For the RED step now, no code change is needed: the coordinator checks the five detail lines by hand. All five in attempt 3 read exactly that.

### 4. Low (process, from before 1F): `snapshot before` can be retaken, and it silently replaces the reference
- **Location:** `mb1-replay.mjs:297` and `:282`; `mb1-replay-evidence.mjs:409`.
- **The defect.** `snapshotNeeds` allows `before` again while the candidate is absent, and `recordSnapshot` overwrites it. The `before` snapshot has no reference to compare with, and 55321's `before` must later equal it.
- **Failure scenario.** Rerunning it during this resume would replace attempt 3's verified reference with no comparison.
- **Fix.** Refuse `snapshot before` once one exists, or require it to equal the existing one. For now, do not rerun it.

## Checked, with no finding

- **Port 55322 and the status binding** (`mb1-replay-target.mjs:96-106`). The committed config has exactly nine lines the replay rewrites (`:5`, `:10`, `:34`, `:36`, `:48`, `:98`, `:109`, `:389`, `:398`), and no literal 564xx or 8283. Given the nine-line count, the only config that reaches the manifest pin is the one prepared from, byte for byte. The explicit port check is a second barrier, so its "message only" mutation result is expected. There is no `[remotes]` section and no `env()` on any port or host. Status's `DB_URL` must still be exactly `127.0.0.1:55322`.
- **`config.json`.** The installed binary (`@supabase/cli-darwin-arm64/bin/supabase`, read as a file) shows the CLI checks for `supabase/config.json` first and uses it if it exists, otherwise `config.toml`. A failed check counts as absent. The runner refuses the file by name, in any case and of any type, at `:669`, before the first `docker inspect` at `:670`. The tests assert zero child processes and no read.
- **Late recheck and the post-apply hash.** The recheck covers the `SUPABASE_*` variables, the `.env` files, the config binding, the candidate pin and the migration set. The re-hash runs whatever the CLI's exit code. A `STOP` sets `sharedApplied`, so the apply is never repeated.
- **`banned` and `ended`.** `banned` is correctly neither live nor ended. The ban parser is exact for anything the suite can print: `brief()` always rewrites GoTrue's body as one line of exactly `{code, message}`, and lookups are own-property only. Attempt 3's failed RED stays failed.
- **M2 fails closed under `banned`.** `mutate m2` sends no SQL; the only child is the read-only `inspect` of 55321. No M2 verdict passes, a zero-failure run included. `shared-apply` still needs a passing `suite m2`.
- **Fixtures and dependencies.** Test values are labelled placeholders, and the test JWT is built at runtime. No new dependency.

## Decision: a new disposable RED is safe; `shared-apply` is not

**Safe:** one new `MB1 suite /tmp/fitlog-mb1-replay-20261026 red --evidence phase2-2-red-2`, keeping `phase2-1-migrations-2` and `phase2-2-before` as they stand. Phase 1F adds no path to 55321 for replay commands: the only contact is the read-only `docker inspect`, and the suite's fixture accounts live on 56421 and are cleaned up by the suite. Conditions:
1. **Before the run:** the hashes above are unchanged, the seven syntax checks pass, 112 of 112 tests pass, and the four CLI hashes equal the checkpoint. Check the CLI hashes again afterwards.
2. **Only that command,** as a background job, never killed. No rerun of `migrations` or `snapshot before`. No `add-candidate`, `mutate`, `shared-*`, `stop` or `teardown`.
3. **Accept only all of these:**
   - exactly the five `profile_read` failures, each with the detail line `  HTTP 200, 1 row(s)`;
   - the exact summary line;
   - `GoTrue's answer after the ban: banned`;
   - `the red expectation is met` and the `banned` note line;
   - runner exit 0.

   `live` or `ended` from the same GoTrue that answered `user_banned` at 16:41Z means something changed: stop and record.
4. **A pass fixes `banned` as this replay's reference for good.** The M2 plan below works under it. Any plan that needs another class needs a fresh replay.

**Not safe, and not authorized:** `shared-apply`.

## The smallest nonvacuous M2 (a proposal; not implemented or run)

Keep member C's session live, check the ban deterministically, and let the M2 kill itself prove the session survived.

- **What stays the same:** the 27-check suite, 55321 and `sql/m2.sql`. The ban stays GoTrue's admin ban, and setup already fails unless the reply's `banned_until` is in the future (`verify-identity.mjs:187-188`): that is the deterministic ban check. The check just before it, `an active account reads its own profile before it is banned`, proves member C's session was live under `member_active()` right before the ban.
- **When M2 passes under `banned`:** only when exactly `a banned account reads no profile` fails, with the detail `HTTP 200, 1 row(s)`, together with exit 1, the exact summary, the `banned` answer, and every other check ok.
- **Why that cannot be vacuous.** Under M2, `profile_read` is `id = auth.uid()` and `member_active()` without the ban clause.
  - A row returned for member C's token means `member_active()` returned true. So member C's `auth.sessions` row still existed after the ban: the run is its own direct session evidence.
  - GREEN refused the same read with the clause present, so the ban clause did the refusing.
  - The revoked-session, disabled and deletion-pending checks staying ok show the other clauses survived the mutation.
- **Fails closed:** 27 ok means the ban ended the session. Record it and stop, with no narrowed pass; the fallback is M2b, reviewed separately. Any other result fails.
- **Code to change, test-first, then review:**
  - M2's expectation under `banned`: exactly that one failure;
  - the verdict keeps detail lines and requires that one (finding 3);
  - `mutate m2` allowed under `banned`;
  - `ended` refused (finding 2);
  - the note text updated.

  No new SQL and no change to 55321.

## Phase readiness

- **Phase 1F:** accepted for the disposable RED only.
- **`suite red --evidence phase2-2-red-2`:** ready under conditions 1–4.
- **M2:** not ready. It needs the plan above, reviewed, then a test-first change.
- **§6 (`shared-apply` on 55321):** not ready and not authorized. Before it can be: findings 1–3 fixed and reviewed, a nonvacuous M2 passing, every §§3–5 proof, and its own authorization.
- **Box 3** is not met; B1 and B2 are open; no goal is Done. This one review is finished; I'm stopping here.
