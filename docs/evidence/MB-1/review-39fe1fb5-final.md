# MB-1 PHASE1B independent review, final verdict (verbatim, provenance 39fe1fb5)

| Field | Value |
|---|---|
| Source | `/tmp/fitlog-39fe1fb5-final.md`, the review's final message as the Codex coordinator supplied it to phase 1C ("full independent review /tmp/fitlog-39fe1fb5-final.md"). Provenance id `39fe1fb5` is the id in that file name, as the coordinator gave it. No transcript was read |
| Reviewed | The uncommitted PHASE1B candidate on `codex/mb1-identity` (base local `main` `2a95726`): `verify-identity.mjs`, its unit test, `phase2-plan.md` and the candidate SQL |
| Copied | 26 October 2026, during phase 1C, by reading that file. Everything below the rule is the file's text, unedited; the only byte added is a final newline, which the source lacks (`git diff --no-index` against the source shows nothing else). Its first line, a working note that came before the verdict, is part of the file and is kept |
| Dispositions | [phase1c.md](../../plan/runs/MB-1/phase1c.md) §2. This file records what the reviewer said, not what has changed since |

---

B1's four-policy scope holds: the command paths go through `gym_role()` or `gym_record_access()`. A quick check for invoker-side reads of `profiles` that the stricter `profile_read` could break:
**Verdict:** Review findings 4–8 are closed in the code, the 8 unit tests pass, and the SQL is still correct. But `phase2-plan.md` needs one fix before Codex authorizes it: the raw Supabase commands, including `stop --no-backup` and `migration up`, have no check on which stack they hit. If `$R` is empty they fall back to the shared 55321 stack. Findings: no critical, one high, one medium, four low.

I made no edits or commits, and no database, Docker, Supabase or network calls.

## Commands and results

| Command | Result |
|---|---|
| `rtk proxy node --test scripts/backend/verify-identity.test.mjs` | Exit 0: 8 tests, 8 pass, 0 fail, 52.79 ms. That speed means importing the suite started no real `supabase status`. |
| `rtk proxy node --check scripts/backend/verify-identity.mjs` | Exit 0, no output |
| `rtk proxy node --check scripts/backend/verify-identity.test.mjs` | Exit 0, no output |
| `rtk proxy git status …` / `git log` / `git branch` | Refused by the permission mode; not retried |

- **Not run:** `pnpm check`. It's optional, it doesn't cover `scripts/backend/` or `supabase/`, and it writes tool caches.
- **Not run:** the Python launcher at the end of the brief, since the brief forbids launcher scripts.

## Findings 4–8: are they closed?

| # | Closed? | Evidence |
|---|---|---|
| 4 | Yes | `verify-identity.mjs:85`: `setStatus` checks the returned row's status. |
| 5 | Yes | `:155-157`, `:161`: only the GraphQL tripwire is left, and the pass line says "GraphQL closed (tripwire)". |
| 6 | Yes | `:124-134`: deletion-pending and banned probes added. Unverified and soft-deleted accounts are honestly claimed from reading the code only (`phase1.md:46-49`). The ban proof still depends on finding 4 below. |
| 7 | Yes | `:23-31`: no shell, `--workdir`, loopback check, fixed error messages, both keys checked. Pinned by the 8 tests, which I ran. Small gap: `verify-freezes.mjs:4` has the same pattern and runs in `backend:test`, but `phase1b.md:89-90` doesn't list it. |
| 8 | Yes, on the normal path | 13 tables, children first, scoped to this run's IDs; failures named; a cleanup failure fails a passing run. The Ctrl-C path still has a gap (finding 5 below). |

## Findings

### 1. High: replay commands can hit the shared 55321 stack
- **Location:** `docs/plan/runs/MB-1/phase2-plan.md:28-29` (`D` and `R` are only named, never set), `:79-81`, `:102-103`, `:141-145`, `:165`.
- **Defect:**
  - Only the SQL runner (`REPLAY_PSQL`) and the suite runner (`SUITE_REPLAY`) check the target port 56421 and the replay container.
  - The raw commands take `$R` on trust: `supabase --workdir "$R" start`, `migration up --local`, `db diff`, `db lint`, `stop --no-backup`, and `rm -rf "$R"`.
  - Shell variables don't carry over between tool calls, so in a fresh shell `$R` is empty.
  - From my reading of how the CLI resolves its workdir (not run here), an empty `--workdir` counts as unset. The CLI then searches up from the current directory, finds this worktree's `supabase/config.toml`, and uses project `fitlog_rebuild_20261017`: the 55321 stack.
- **Failure scenario:**
  - Step 5.1 or 7 run in a fresh shell: `stop --no-backup` stops 55321 and deletes its data volumes. The 5.1 restart then rebuilds 55321 from all 16 migrations, which applies the candidate without the 6.2 precondition gate.
  - Step 3.1 alone applies the candidate to 55321 with no precondition check.
  - A mistyped `R=$PWD` makes step 7 `rm -rf` this worktree and all uncommitted MB-1 work.
  - Any of these breaks D7 and the "never weaken 55321" rule.
- **Fix:**
  - Write literal values for `D` and `R` into the plan when it's authorized; use no shell variables.
  - Add one guarded runner, `REPLAY_CLI`, in the same style as `REPLAY_PSQL`. Before calling `pnpm exec supabase --workdir <R> …`, it refuses unless:
    - `R` matches `^/tmp/fitlog-mb1-replay-\d{8}$`;
    - the project ID from `<R>/supabase/config.toml` matches `^fitlog_mb1_replay_\d{8}$`;
    - the API port is 56421.
  - Send every replay `start`, `migration`, `db`, `stop` and the `rm -rf` through it.
  - At step 0, record when 55321's database container started; at step 7, require it unchanged.

### 2. Medium: the plan would save `supabase start` output, which contains keys, in a public repo
- **Location:** `phase2-plan.md:21-22`, `:79-80`, `:141-142`, `:158`.
- **Defect:**
  - Line 22 says no command in the plan prints status output. But `supabase start` ends by printing the full status block: the API keys, the S3 access and secret keys, the database URL with its password, and (in some CLI versions) the JWT secret.
  - The plan says to save every command's output verbatim under `docs/evidence/MB-1/phase2-*`.
  - Step 6.6 runs `backend:test`. Its suites `verify.mjs:6`, `verify-gym.mjs:4` and `verify-freezes.mjs:4` read `supabase status` with a call whose error, if it crashes the script, would print the captured status output.
- **Failure scenario:** The step 1.5 evidence file is committed with `sb_secret_…` keys. These are the CLI's local defaults (`config.toml` sets no JWT secret or signing keys), so the real exposure is small. But it breaks the public repo's no-secrets rule, trips secret scanning, and makes the record's claim false.
- **Fix:**
  - Pass `start` output through a filter that keeps only `Applying migration`, `Seeding` and `Started` lines.
  - Prove the 15 and 16 migration counts with `migration list --local` and P3 instead.
  - Correct line 22.
  - Before any phase 2 evidence is committed, require this to print nothing:
    `rtk proxy rg -n -e sb_secret_ -e sb_publishable_ -e eyJhbGci -e 'JWT secret' -e 'S3 (Access|Secret) Key' docs/evidence/MB-1`

### 3. Low: a mutation "kill" is judged by exit code, which a setup failure also gives
- **Location:** `phase2-plan.md:19-20`, `:129-137`.
- **Defect:**
  - M1, M3, and M2 when the ban leaves GoTrue answering `HTTP 200`, all expect exit 1. A setup failure also exits 1, with no check lines: a `429` from the sign-in limit, a fetch error, or a cleanup failure.
  - The plan runs the suite six times on the replay (36 sign-ins against a limit of 30 per 5 minutes) with no required wait between runs.
  - A mutation that silently doesn't apply is fail-safe: it can only fail the expectation or narrow the ban claim. The real risk is a `429` read as a kill.
- **Fix:**
  - Make the pass rule mechanical: each mutation log has exactly 27 `ok`/`not ok` lines, exactly the expected `not ok` names, and no `setup failed` or cleanup line. `REPLAY_PSQL` must exit 0.
  - After each mutation, take a precondition snapshot showing the policy (M1) or function hash (M2, M3) has changed from step 3.2.
  - Wait at least 75 s between suite runs on one stack.

### 4. Low: the ban outcome has only two branches, and the two stacks may run different auth server versions
- **Location:** `phase2-plan.md:98`, `:132`; `phase1.md:203-207`; `verify-identity.mjs:132-133`.
- **Defect:**
  - M2's expectation depends on GoTrue answering a banned user's session with either `HTTP 200` or `session_not_found`. Any other answer, such as a `403` with a different code, has no rule, and R7 would wrongly read it as "the session ended".
  - `supabase/.temp` holds only `cli-latest`, so no image versions are pinned. The plan compares database state between the replay and 55321, but not the service images.
  - The 55321 run (step 6.5) prints its own "after the ban" line, and nothing compares it with the replay's (step 2.2).
- **Fix:**
  - Add "any other answer: stop and record".
  - Require 6.5's "after the ban" line to equal 2.2's.
  - Record the images for both projects with `docker ps --format '{{.Names}} {{.Image}}'`, and require the database, auth and REST images to match.

### 5. Low: Ctrl-C during setup can leak a fixture account without naming it
- **Location:** `verify-identity.mjs:43-53`, `:70-75`, `:88-92`.
- **Defect:** The signal handler starts cleanup while the suite is still running, and exits as soon as cleanup finishes. An account whose creation request is still in flight is never deleted and never reported.
- **Failure scenario:** Ctrl-C during setup on 55321 leaves a synthetic `…@example.invalid` account behind. It's harmless data, but it breaks the "every leak is named" claim.
- **Fix:** Either option closes the gap:
  - Set a `stopping` flag in the handler, have `account()` delete and report any account created after it, and wait for in-flight creations before cleanup.
  - Or put a per-run ID into the fixture emails, so cleanup can find strays by prefix.

### 6. Low: the "read-only" SQL runner trusts its input file, and the SQL that ran isn't kept
- **Location:** `phase2-plan.md:34-39`, `:82-89`, `:151-156`; `phase1.md:222-239`.
- **Defect:**
  - `PSQL` runs any file as `postgres`. It is read-only only because the file starts with `begin transaction read only;`.
  - That file is extracted from an uncommitted markdown file into `/tmp`. The step 1.6 check looks only at the first and last lines, so a `commit;` in the middle would pass. The same file then runs against 55321 in steps 6.2 and 6.4.
  - Step 7 deletes `preconditions.sql`, `m1.sql`–`m3.sql` and the restore file, so the evidence doesn't hold the SQL that actually ran.
- **Fix:**
  - Record each generated file's SHA-256 in `phase2-replay-inputs.txt`, and have `PSQL` refuse a file whose hash differs.
  - Refuse any transaction-control, DDL or DML keyword between the first and last line.
  - Copy the generated files into evidence before teardown.

## Checked, no finding
- **SQL:** `alter policy` keeps `for select to authenticated`, the guard runs once per statement, and re-running it (the M1 restore) is harmless. Foreign-key checks bypass row-level security. `complete_onboarding` (`validated_contracts.sql:74-80`) checks the same account and session conditions as `member_active()`, including the ban clause, so it is no bypass.
- **B1 scope:** the four policies are the complete set. `gym_record_read` goes through `gym_record_access` (`gym_operations.sql:29`), and staff paths through `gym_role` (`:14`); both call `member_active()`.
- **Plan arithmetic:**
  - 27 checks; RED gives 22 ok and 5 not ok, as named.
  - `member_core.sql:24-31` is exactly `member_active()`, and each text swap matches exactly once.
  - The migration glob gives 15 files.
  - `config.toml` has exactly 7 `553xx` lines (all ports) plus inspector port 8183.
  - `invokedDirectly` stays false under `node -e`.
  - `SUITE_REPLAY` and `REPLAY_PSQL` both refuse an empty `$R`.
- **Other surfaces:** no new dependency, endpoint, AI, messaging or location code. Output holds only HTTP codes, error codes, row counts and synthetic UUIDs.
- **Stale records (not edited):** `checkpoint.md:31`, `phase1b.md:19,66-67` and `phase1.md:149,162` still say the unit test hasn't run. It has now passed 8/8, both in Codex's 06:45 UTC run and in mine.
