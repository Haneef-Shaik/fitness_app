# MB-1 phase 1D independent review, final verdict (verbatim, provenance b75d1e73)

| Field | Value |
|---|---|
| Source | `/tmp/fitlog-b75d1e73-final.md`, the review's final message, as the Codex coordinator supplied it to phase 2 attempt 1 under AUTH-01 ("Read … full independent review /tmp/fitlog-b75d1e73-final.md … Persist full review with provenance in MB1 evidence"). `b75d1e73` is the reviewing session's id block as the file name gives it; the coordinator did not supply a longer session id, and none is invented here. No transcript was read |
| Reviewed | The uncommitted phase 1D work on `codex/mb1-identity` (base local `main` `2a95726`): `scripts/backend/mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs`, their tests, `verify-identity.mjs` and its test, `docs/evidence/MB-1/review-a102fb68-final.md` and `docs/plan/runs/MB-1/` |
| Copied | 26 October 2026, during phase 2 attempt 1, by reading that file, with no source, test or config change in that attempt. Everything below the rule is the file's text, unedited, apart from a final newline if the source lacks one (`git diff --no-index` against the source: [phase2.md](../../plan/runs/MB-1/phase2.md) §3) |
| Dispositions | The Codex coordinator (AUTH-01) accepted the four low findings **for the disposable RED checkpoint only**, on conditions F1–F4: [phase2.md](../../plan/runs/MB-1/phase2.md) §1. Findings 3 and 4 are assigned to MB-1, to be fixed before any authorization of phase2-plan §6 (55321). This file records what the reviewer said, not what has changed since |

---

I accept the bounded phase 2 run on the disposable replay project only (phase2-plan §0–§5), on the conditions below. I found nothing critical, high or medium, and four low findings. This is not a goal verdict: B1, B2 and the other boxes stay open, and box 3 is not met.

**The five fixes for review a102fb68 are all in the code and tested (95 of 95 pass):**
1. **Environment and project binding.**
   - Children get only the allowlisted environment (`mb1-replay.mjs:47`, `:63-65`, `:591-592`).
   - Any `SUPABASE_*` variable is refused, by name only (`:545-546`).
   - `stop` is tied to the replay twice: it sends the literal `--project-id` (`:57`), and the replay's pinned config names the same project.
2. **Suite output after a signal.** The runner passes the suite its own signals, CLI and status runner, plus an exit that does nothing. Test 56 proves this with the real `main()`.
3. **SQL pin.** The constant is at `mb1-replay-evidence.mjs:15`, checked at prepare (`mb1-replay-target.mjs:89-91`) and before every snapshot (`mb1-replay.mjs:213-215`). Test 36 ties it to `phase1.md` byte for byte, and I read the pinned block: it is clean.
4. **Shared apply.** It needs its own token (`:556-557`), and a fresh read-only snapshot is the last step before `migration up` (`:473-478`).
5. **Lock and process group.** Both work as long as the runner itself stays alive (see finding 1).

## Findings

### 1. Low: if the runner is killed outright, the CLI keeps running with nothing supervising it
- **Location:** `mb1-replay.mjs:80` (`detached: true`), `:96-100` (only SIGINT and SIGTERM are handled), `:94` and `:112-117` (after SIGKILL, it waits for `close` only), `:40` (`LONG` is 600 s).
- **Defect:**
  - `detached` starts the CLI in a new session, so only the runner can stop it.
  - If the runner gets SIGKILL or SIGHUP, the CLI runs on with no timeout.
  - If a process outside the group holds the output pipes, the runner never finishes and keeps its lock.
- **Failure scenario:**
  - The coordinator's shell tool times out `MB1 start` or `diff` and SIGKILLs the process group.
  - The runner dies, but the CLI goes on, and no state or evidence is written. The lock stays, which is the safe outcome.
  - At §6.3 the same thing would let `migration up` finish on 55321 without any record, while the state still says the candidate is not applied.
  - The plan's claim that "no CLI process outlives its command" only holds while the runner is alive. Before phase 1D, a group kill did reach the CLI.
- **Fix:**
  - Also handle SIGHUP in `runCommand`.
  - After the final SIGKILL, give up after one more grace period and report "group did not exit", instead of waiting forever.
  - Correct that sentence in phase2-plan, and apply condition 3 below.

### 2. Low: nothing pins the CLI that actually runs, and it is a deeper process tree than phase 1D assumed
- **Location:** `mb1-replay.mjs:45`, `:331-345`; the version check is at `:334`.
- **Defect:**
  - `verify-cli` accepts any `x.y.z` version and checks no file hashes.
  - I read `node_modules/.bin/supabase`: it is the 2.121.0 ESM shim with a node shebang. It starts `@supabase/cli-darwin-arm64/bin/supabase`, and that package also ships `bin/supabase-go`. The supabase package's build script makes a Bun binary plus a Go sidecar, so the tree is likely three levels deep.
  - Nobody has observed whether the sidecar stays in the process group, or which layer reads `--project-id`, config and `.env` files.
- **Failure scenario:**
  - A `pnpm install` between steps changes the CLI, and the earlier `verify-cli` result still stands.
  - If the "Applying" lines change shape, `migrate` passes on its exit code alone. The snapshots still catch a wrong result, but later.
- **Fix:**
  - Require exactly `2.121.0`, since the output allowlists were built from it.
  - Record the sha256 of `node_modules/supabase/dist/supabase.js` and of both platform binaries in the state, and check them again before every Supabase command.

### 3. Low: the 55321 commands aren't tied to the database port, and `.env` files get around the `SUPABASE_*` refusal
- **Location:** `mb1-replay.mjs:171-179` (compare the replay's check at `:160`), `:477-478`; `mb1-replay-target.mjs:24`.
- **Defect:**
  - `sharedRunning` checks the API at 55321 and the container, but not `DB_URL`, and `migration up --local` connects to `db.port`.
  - The CLI loads `.env` files. `supabase/.env` is where the `env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)`-style secrets in `config.toml` are meant to live, and `SUPABASE_*` names in such a file override the config.
  - In the replay directory, a `.env` is refused as an unknown file. For `--workdir REPO_ROOT`, nothing checks. No `.env*` file exists in the repository today.
- **Failure scenario:**
  - Box 1's Google and Apple work adds `supabase/.env` containing `SUPABASE_DB_PORT`.
  - `status` still answers at 55321, and the fresh snapshot (run by container name) still reads 55321.
  - `migration up` then writes to another local database, for example AR-1's 563xx replay project, which the plan says must stay untouched. 55321's after snapshot fails safely, but the other project has already been written to.
- **Fix:**
  - Require `onPort(status.DB_URL, '55322')` in `sharedRunning`.
  - Refuse, naming files only, while any `.env*` exists in `REPO_ROOT`, `REPO_ROOT/supabase` or `/tmp` (2.121.0's `.env` search path is unverified).

### 4. Low: the only SQL that reaches 55321 is tied to what the replay ran, not to the reviewed text
- **Location:** `mb1-replay.mjs:355-361`, `:302-307`; `mb1-replay-evidence.mjs:15`.
- **Defect:**
  - The candidate migration is untracked, and `add-candidate` copies whatever is in the repository at that moment.
  - The P1–P3 snapshots only see the `profiles` policies, `member_active()` and the migration rows, so an extra statement anywhere else would pass every proof.
- **Failure scenario:** the candidate is edited after this review, say a grant is added. Every replay proof still passes, and §6.3 applies the edit to 55321.
- **Fix:** add a `CANDIDATE_SHA256` constant, checked at `add-candidate` and at `shared-apply`, or commit the candidate first and compare against the committed file. This has no effect on the disposable phase.

## Conditions for the disposable-only run
1. Write the literal date into every `YYYYMMDD`, run the §0 checks as written, and confirm that `phase2-1-prepare` shows `ca683771…d913ed769a`.
2. `phase2-1-cli` must show exactly `2.121.0`, and `stop --help` must list `--project-id`. Anything else: stop.
3. Run each MB1 command with a tool timeout above 605 s, or as a background job, and never SIGKILL the runner. After any timeout or kill, stop the phase. Before removing the lock, check that no `mb1-replay.mjs`, `.bin/supabase`, `cli-darwin-arm64/bin/supabase` or `supabase-go` process is left, and run `docker ps -a` for replay containers.
4. Only §0–§5. §6 (55321) and §7 (teardown) each need their own authorization. Fix or explicitly accept findings 3 and 4, then re-review, before §6.

## Residuals (not findings)
- **Telemetry:** the supabase package lists `posthog-node` among the dependencies built into the binary. The allowlist drops `DO_NOT_TRACK`. What 2.121.0 sends is unverified, and no user data passes through it.
- **Unpinned CLI files:** `supabase/.temp/**` in the replay directory is not hash-checked, and the CLI reads image versions from there. Only a local operator could plant files there.
- **SQL deny-list:** `U&"…"` identifiers get past the name check. That doesn't matter while the constant pins the exact bytes.
- **`local-stack.mjs` follow-up:** confirmed. The runner imports only pure helpers from it and never uses `spawnRunner`. §6.6's `pnpm backend:test` still inherits the full environment through `local-stack.mjs`, so repeat the `SUPABASE_*` name check by hand before it.
- **Docker memory:** a second stack next to 55321 needs memory headroom. If 55321 restarts from running out of memory, the start-time check shows it as a STOP.

## What I ran and read
- `rtk proxy node --test scripts/backend/*.test.mjs`: **95 pass, 0 fail**, about 3 s.
- `rtk proxy git status --short`: only the 10 untracked MB-1 paths.
- `rtk proxy git diff --stat`: empty, so `local-stack.mjs`, `package.json`, the lockfile and `config.toml` are unchanged.
- Read: the RTK rules, GOALS MB-1, `checkpoint.md`, `phase1d.md`, `phase2-plan.md`, `phase1.md` §7 and review a102fb68. Also all four scripts with their tests, `local-stack.mjs`, the CLI shim and its package files, `pnpm-workspace.yaml` (`nodeLinker: hoisted`), `.npmrc` and `config.toml`.
- **Gaps:**
  - `rtk proxy ls -la node_modules/.bin/supabase` and `wc` were denied. So whether `.bin/supabase` is a symlink or a copy is unconfirmed; with the hoisted layout, both resolve the platform package.
  - The CLI was not run, so nothing about its runtime behaviour was observed.
- I made no edits and no database, Docker, Supabase or network calls, and did not run the replay runner live.
