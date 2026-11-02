# MB-1 phase 1E independent security review, final verdict (verbatim, provenance 19eea0f3)

| Field | Value |
|---|---|
| Source | `/tmp/fitlog-19eea0f3-final.md`, the review's final message, as the Codex coordinator supplied it to phase 2 attempt 3 under AUTH-01 ("Codex AUTH-01 explicitly accepts independent phase1E review19eea0f3 for DISPOSABLE RED ONLY … Persist final review verbatim in MB1 evidence"). `19eea0f3` is the reviewing session's id block as the file name gives it. The coordinator supplied no longer session id, and none is invented here. No transcript was read |
| Reviewed | The uncommitted phase 1E work on `codex/mb1-identity` (base local `main` `2a95726`): the F5, F3 and F4 fixes in `scripts/backend/mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs` and their tests, at the bytes [phase1e.md](../../plan/runs/MB-1/phase1e.md) §8 records. Attempt 3 re-hashed all eight files before any runner command, and each equals §8 ([phase2.md](../../plan/runs/MB-1/phase2.md) A3.1) |
| Verdict, as the review states it | Not blocked. **Three low findings. No critical, high or medium finding.** 104 of 104 pure tests pass. It accepts only the disposable RED steps (`migrations` → `snapshot before` → `suite red`) on the existing replay. It does **not** authorize `shared-apply`. B1 and B2 stay open, box 3 is not met, and no box is Done |
| Copied | 26 October 2026, in phase 2 attempt 3 (which began at 16:38:59Z), by reading that file. No source, test or config file changed in that attempt. Everything below the rule is the file's text, unedited, apart from a final newline if the source lacks one. The `git diff --no-index` against the source is in [phase2.md](../../plan/runs/MB-1/phase2.md) A3.5 |
| Dispositions (Codex AUTH-01) | Accepted **for the disposable RED checkpoint only**. **Finding 1** (the `[db] port` comes from the repository's `config.toml`, and a `supabase/config.json` is not refused) and **finding 2** (rerun the guards immediately before the `migrate` call; re-hash the candidate after it) are **assigned to MB-1 as pending**. Each must be fixed test-first and independently reviewed **before** any `shared-apply` authorization. Neither is fixed in this phase, which authorizes no code change. **Finding 3** is accepted: the `migrations` rerun may show `# 0 line(s) withheld` or `# 2 line(s) withheld` (non-table notice lines) alongside the exact manifest summary line. That explanation is the reviewer's inference from the installed CLI code; no notice line was captured. Any other count, any refusal or any `STOP:` line stops the phase. This file records what the reviewer said, not what has changed since |

---

# MB-1 phase 1E safety review: not blocked; no critical, high or medium findings; 3 low

The F5 and F4 fixes hold, and F3 is fixed for the replay. F3 still has one real gap on the 55321 path, so it is not closed for §6. You can resume the disposable RED steps (`migrations` → `snapshot before` → `suite red`) on the existing replay once you explicitly accept this review. This review does not authorize `shared-apply`. B1 and B2 stay open, box 3 is not met, and no box is Done.

## Test evidence (this session)
- **Tests:** `rtk proxy node --test scripts/backend/*.test.mjs` gave **104 pass, 0 fail** twice, once before the interruption and once after it.
- **Syntax:** all seven `rtk proxy node --check` runs exit 0.
- **Candidate bytes, rechecked after the resume:** still `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3`. The other seven MB-1 file hashes equal phase1e.md §8, and the four CLI hashes equal the checkpoint values.
- **Git:** `git status` shows only the 10 untracked MB-1 paths.

## Findings

### 1. Low: F3 checks the running port, but `migration up` uses the config port (blocks §6 sign-off)
- **Location:** `mb1-replay.mjs:183`, `:187` and `:513-514`.
  - Supporting lines in the installed CLI binary, read as a file:
    - `11089990`: the runtime mode defaults to `{kind:"legacy"}`.
    - `11097538`: in that mode, a `--local` connection is `{host, port:T.port}`, with the config loaded from the workdir.
    - `11107335`, `11107311` and `11088355`: `status` builds `DB_URL` from what `docker inspect .NetworkSettings.Ports` reports for the running containers.
    - `11088725`: the CLI uses `supabase/config.json` in preference to `config.toml`.
- **Defect:**
  - The `DB_URL` check proves the running 55321 container publishes 55322. `migration up` connects to the `[db] port` in the repository's config, read at the moment it runs.
  - The `.env` and `SUPABASE_*` refusals close the environment route to changing that port. Nothing checks the repository's `config.toml` bytes, and nothing refuses a repository `supabase/config.json`.
- **Failure scenario:**
  - The repository's `[db] port` is edited to 56322 after 55321 has started.
  - `status` still reports 55322, so the check passes.
  - `migration up` then writes the candidate into another local project, such as AR-1's replay.
  - 55321's after snapshot only catches this once that write has happened.
- **Fix, test-first:**
  - In `sharedRunning` or `shared-apply`, require `sha256(replayConfig(<repository config.toml>, target))` to equal the manifest's `supabase/config.toml` hash. That proves the repository config is unchanged since `prepare`, because `replayConfig` refuses any port that is not 553xx.
  - Refuse while the repository has a `supabase/config.json`.
- **Not affected:** the replay. Its config is pinned by the manifest and checked before every command, and unknown entries are refused (`mb1-replay-target.mjs:256-270`).

### 2. Low: the guards are checked once, before the CLI reads the files
- **Location:** `mb1-replay.mjs:584-585` (the `.env` scan, once per command); `:506-507` (the candidate pin and the migration comparison) against `:514` (where the CLI reads the files).
- **Failure scenario:** a local writer plants a `.env` file, or edits the candidate or adds a migration, during the seconds of status and snapshot that come before `migration up`.
- **Fix:**
  - Rerun `envFiles`, `pinnedCandidate` and `repositoryMatchesReplay` immediately before the `migrate` call.
  - Re-hash the candidate after the apply and print a STOP if it changed.
  - This is for §6 only.

### 3. Low (process): the rerun will probably show 2 withheld lines, which could trigger another needless STOP
- **Location:** `mb1-replay-evidence.mjs:166-167`; the expectation in `checkpoint.md:153-154`.
- **What the CLI code shows:**
  - Binary lines `11088921-22` hold a two-line "new version available" notice with no `|` in it.
  - Line `11088922` shows `fetchLatestTag()` and the `<workdir>/supabase/.temp/cli-latest` cache.
  - Phase 2's record (A2.3) says that cache file exists in the replay.
  - So attempt 2's 17 withheld lines were most likely 15 rows plus this notice. That is inferred from the code, not seen live.
- **Fix:** before the rerun, state that `# 2 line(s) withheld` (or 0) together with the exact summary line is the expected result. Refusals still stop the phase.
- **Residual:** the CLI makes its own update-check network call. No user data goes with it.

## Checked, with no finding
- **F5:** the transcribed grammar matches the installed binary exactly:
  - `POn` wraps every cell in backticks (`` ` ` `` when empty);
  - `Da` prints a blank line, a two-space line, the header, the rule, the rows, then a blank line;
  - `_me` turns a version's digits into a UTC time.

  The verdict fails closed: no recognised row fails whatever the exit code, as does an unknown table line or a wrong count, set, order, local/remote state or time. Refusals name only versions and counts. The test fixtures are taken from the CLI's code, not from live output, and they agree with that code.
- **F3, `.env` scope:** the CLI's `.env` loader and config loader read only `<workdir>/supabase` and `<workdir>`; the config loader runs with `search:false`. The runner checks both workdirs, plus every parent directory by literal and real path. It only lists directory names and never reads a file (test `:518`). `status` builds `postgresql://…@127.0.0.1:<port>`, so the exact 55322 check fits real output.
- **F4:** I read the candidate as it is now. It is one `alter policy profile_read`, adding `(select private.member_active())`. It only narrows access, and it is the same guard `profile_update` and every owner policy already use. The pin is sound. Whether these bytes equal what earlier reviewers read cannot be proven, but today's bytes are acceptable.

## Disposable RED readiness
The replay path is bound end to end:
- its config is pinned and its `status` must report 56421 and 56422;
- the snapshot goes to `supabase_db_fitlog_mb1_replay_20261026` by name, in a read-only session;
- the suite uses the API URL that `status` reports.

Conditions:
1. Use `phase2-1-migrations-2` and the same directory. Run each command as a background job with at least a 660 s limit, and never SIGKILL it.
2. Any refusal stops the phase: record it and change nothing. That includes a `.env*` named in `~`, `/Users` or `/` (do not move the file), a `STOP:` line, or a changed 55321 pin.
3. Re-hash the four CLI files after `suite red`.
4. No `add-candidate`, shared command, `stop` or `teardown`. §6 needs finding 1 fixed test-first, a new review, and its own authorization.

## What I could not run
- Denied: `rtk git status --porcelain…` and a name-only `rtk proxy ls -d …/.env*`.
- `.env*` name searches of `~`, `/Users` and `/` timed out, so those three are unobserved; the runner checks them itself. `~/.codex`, `~/.codex/worktrees` and `/private` have no `.env*` directly in them.
- I made no edits and no database, Docker, CLI or network calls, and did not open the replay directory.
