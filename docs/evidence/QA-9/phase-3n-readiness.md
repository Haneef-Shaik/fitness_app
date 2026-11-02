# QA-9 phase 3N-prep: is `backend:test` ready to run? (records and plan only)

| Field | Value |
|---|---|
| Written | 27 October 2026, from 09:07:49Z, in phase 3N-prep, by session `3c30d1cc-1c80-4d9e-bd68-30939646faf5`, under Codex's brief (AUTH-01) after the [0905 review](final-2026-10-27T0905Z-collected.md) |
| What ran | Read-only Git commands and `sha256sum` only. **No Docker, Supabase, database, SQL, network, gate or test command ran.** Every live step below is a plan, not a result |
| Labels | **Executed:** run in this phase. **Inspected:** read only. **Inherited:** another session's run. **UNRUN:** nobody in QA-9 has run it |
| Status | 3N is **not authorised**, and this record doesn't ask for it yet (§1). QA-9 is not Done |

## 1. Decision: a named fix lane comes first

**As written, the harness can't prove its own cleanup or that it reached the right stack.** So QA-9 isn't asking for a 3N window on the unchanged scripts. *(Inspected.)*

**What the harness does preserve, by reading:**
- **User files.** The three pure tests write only in OS temporary folders and remove them in `t.after`. `check-sql-sources` reads Git with optional locks off. `verify-contracts` and `verify-fixtures` only read files. The Supabase CLI may create the ignored `supabase/.temp/`, which is absent today. No tracked path is written.
- **Unrelated rows.** Every delete is filtered by IDs the run made itself: users by ID, member rows by `owner_id`, and gym rows by `gym_id`. Nothing deletes by pattern. This can be shown only as counts (§4), not as unchanged content.

**What it can't prove:**

| # | Gap | Where | Effect |
|---|---|---|---|
| G1 | A failed delete only logs, and the exit code stays 0 | `verify.mjs:72`, `:74`; `verify-gym.mjs:63`, `:67`; `verify-freezes.mjs:79`, `:83` | Exit 0 doesn't mean the stack was cleaned |
| G2 | Two deletes aren't checked at all | `gyms` at `verify-gym.mjs:65` and `verify-freezes.mjs:81`; `body_entries` at `verify-gym.mjs:67` | Silent leftovers. A leftover `body_entries` row then blocks the user delete through its foreign key (`member_core.sql:129`), and only that delete logs |
| G3 | Nothing checks the stack after cleanup | All three suites | Nothing shows that zero rows remain |
| G4 | `fetch` has no timeout, and no signal is handled | `call()` in all three suites | A hang ends only when the process is killed, which skips `finally`. Its rows stay behind, and nobody may delete them by hand |
| G5 | The `supabase status` output is parsed unguarded | `verify.mjs:6`, `verify-gym.mjs:4`, `verify-freezes.mjs:4` | A crash may print part of the status output, which holds keys. This is MB-1's carried request (MB-1 `phase1d.md:129`). `local-stack.mjs:43` already guards its own parse |
| G6 | The target is chosen by name and by a configured URL, not by proven identity | The URL is a string from `supabase status` (`verify.mjs:7`). `docker exec` uses the container name (`verify-freeze-projection.mjs:12`, `local-stack.mjs:39` and `:49`) | The shared scripts have MB-1's M1 gap |
| G7 | Every run uses the same namespace | `fitlog-integration-<uuid>` and `gym-integration-<uuid>` emails, and fixed gym names | An outside count can compare before with after, but it can't tell this run's rows from earlier leftovers |

**Why an outside count isn't enough.** The census in §4 would detect G1, G2, G3 and G7, and §3 only brackets G6. Nothing outside the scripts can prevent G4's leftovers or G5's exposure. A detected cleanup failure would leave synthetic rows on a stack other lanes use, with no one allowed to remove them by hand.

**The named fix lane: "backend harness: provable cleanup and a bound target".**
- **Owners, by docs/23 §5:**
  - S8 for `verify.mjs`;
  - S2 for `verify-gym.mjs`, `verify-freezes.mjs` and `verify-freeze-projection.mjs`;
  - Codex assigns `local-stack.mjs` and the root `backend:test` line, which §5's table doesn't list.
- **Merged with MB-1's carried requests** for the same files (MB-1 `handoff.md:78–83`), so there is one executor and one review:
  - the allowlisted executor in `local-stack.mjs`;
  - the status-parsing fixes;
  - `verify-identity.mjs` in `backend:test`.
- **The fixes,** each test-first on fakes, with no assertion, threshold or check weakened:
  - **F1** (G1, G2): every cleanup result is checked, `gyms` and `body_entries` included. Any failure makes the exit non-zero, even after a passing run.
  - **F2** (G3): after cleanup, a service-role read by the run's own IDs shows zero rows left in every table the run wrote, and in `auth.users`. It prints counts only.
  - **F3** (G4): every request and child process has a timeout. SIGINT and SIGTERM run the cleanup, then exit non-zero.
  - **F4** (G5): the guarded parse that `local-stack.mjs` already uses, with a fixed message and the output never shown.
  - **F5** (G6): a target bound to proven container IDs, using MB-1's binding once M1 closes. It can be injected, so the suites can run on a disposable replay that holds exactly `main`'s migrations and seed. That choice is Codex's.
  - **F6** (G7): a tag for each run in every synthetic email and gym name and code, so a census can name this run's rows exactly.
- **QA-9 changes none of these.** They are other lanes' files.

**Considered and not recommended:** running the unchanged harness on 55321 inside §3 and §4. That would detect every gap, but it couldn't undo G4's leftovers or prevent G5.

## 2. What each step needs and writes (inspected)

The gate is `package.json:18`, unchanged from `main` (executed: run 7). The CLI is `supabase` 2.121.0, with `@supabase/cli-darwin-arm64` present in this worktree (inspected). **QA-9 has never run the CLI (UNRUN).**

| Step | Target | What it writes | Cleanup |
|---|---|---|---|
| 1. Pure tests: `check-sql-sources`, `verify-contracts` and `verify-fixtures` `.test.mjs` | Fakes and OS temporary folders | Temporary folders and files. `check-sql-sources.test.mjs:250` also runs the check itself on this repository, which only reads Git | `t.after` |
| 2. `check-sql-sources` | Git, read-only | Nothing | — |
| 3. `verify.mjs` | `127.0.0.1:55321`, checked only as a string (`:7`) | 2 users `fitlog-integration-<uuid>@example.invalid`, their 2 profiles, 1 `body_entries` row, and 1 workout with its set, revisions and `mutation_outcomes` | `finally`: the 13 member tables at `:71`, by `owner_id`, then the users |
| 4. `verify-gym.mjs` | The same | 3 users `gym-integration-<uuid>@example.invalid` and their profiles, and 1 gym `T` + 10 hex characters, "Disposable local integration gym". In it: roles, 51 members, a plan, a membership, charges, 51 payments with receipts and allocations, a refund, a waiver, commands and audit rows. Also 1 `body_entries` row for its owner | `finally`: 15 gym tables by `gym_id`, then the `gyms` row (unchecked), `body_entries` (unchecked) and the users |
| 5. `verify-freeze-projection` | `docker exec` by the name `supabase_db_fitlog_rebuild_20261017` | Nothing. It calls `private.freeze_projection`, declared `STABLE` (`20261019140429_gym_freezes.sql:105`) | — |
| 6. `verify-freezes.mjs` | The API | 4 users `gym-integration-…`, and 1 gym `F` + 10 hex characters, "Disposable freeze fixture". In it: a member linked to a user (`:29`), two plan versions, 3 memberships, freezes, visits, commands and audit rows | `finally`: 15 gym tables, then the `gyms` row (unchecked) and the users |
| 7. `verify-contracts` | The status, then `docker exec` by name | Nothing: one `select` on `private.contracts` | — |
| 8. `verify-fixtures` | The same | Nothing: `begin` (`training-fixtures.sql:15`), then `rollback` (`:111`) | — |

**Prerequisites.** Each must hold before any write. If one fails, stop; never fix it.
- The stack of `project_id` `fitlog_rebuild_20261017` (`config.toml:5`) is running, with the API at 55321 (`:10`) and the database at 55322 (`:34`).
- It holds **exactly `main`'s 15 migrations**, `20261017161031` to `20261025234317`, the files in `supabase/migrations/`. Not MB-1's `20261026040045` (0905 review), and nothing else.
- The seed exercise `20000000-0000-4000-8000-000000000001` is present (`verify.mjs:39–40`). QA-9 never seeds it.
- The service role can still delete from public tables. `explicit_api_grants.sql:2` revokes only `anon` and `authenticated` (inspected). No migration has a delete-blocking trigger (inspected).
- QA-9's diff touches nothing under `supabase/`, `scripts/backend/` or `apps/mobile/src/data/` (executed: run 5). The run is owed only because `packages/domain/` changed (run 6), which docs/23 §7 names.

**Leftovers that no cleanup removes.** These are expected and recorded, not failures: auth audit-log rows, advanced sequences and database statistics. Identities, sessions and refresh tokens should cascade from the user delete; the census checks their totals.

**Network: not verified.** The scripts call loopback HTTP and Docker. Nobody has checked whether the CLI makes any other call during `status`, such as an update check or telemetry. So the 0905 plan's "loopback and the Docker socket only" isn't asserted here.

## 3. Read-only preflight before any shared write (plan only)

**The window.** One serialised window, named in Codex's brief. In it, no other lane uses 55321, and MB-1 has no phase running, no lock, no STOP and no shared apply (from Codex's brief and `runs/local-supervision.json`).

**Identity: MB-1's M1 live read, run once.** QA-9 doesn't keep a second command list. MB-1's next step (MB-1 `checkpoint.md:627–632`) is:
- one binding inspect with the final arguments, `docker inspect --type container --format '{{.Id}}|{{.Name}}|{{index .Config.Labels "com.supabase.cli.project"}}|{{json .NetworkSettings.Ports}}'`, of `supabase_db_…` and `supabase_kong_…` (`mb1-replay-binding.mjs:9–29`);
- the Docker context's endpoint;
- `lsof -nP -iTCP:55321,55322 -sTCP:LISTEN`.

MB-1's 0935 review is writing the exact commands and their redaction now. 3N may start only when that read, run in this window and from the gate's own session environment, has established all four facts below, and Codex's brief records them:
- **P1, the endpoint:** the Docker endpoint the gate's environment resolves to is the local daemon, recorded as a `unix://` path. No `DOCKER_HOST` or `DOCKER_CONTEXT` points anywhere else. Only those values are read, never credential variables or a whole inspect.
- **P2, typed IDs:** each container name resolves, with `--type container`, to one 64-character ID, labelled `com.supabase.cli.project=fitlog_rebuild_20261017`. The database publishes `5432/tcp` only at 55322, and Kong publishes `8000/tcp` only at 55321. No other container on that endpoint publishes either port.
- **P3, the listeners:** every listening socket on 55321 and 55322 belongs to the port forwarder of P1's runtime, and to no other process.
- **P4, the rule:** Codex accepts a reviewed listener rule, which closes M1.

If any of the four is unproved, 3N doesn't start.

**QA-9's own checks.** Each is one read-only `rtk proxy` command, run once before the gate and once after it.
- **Q1:** `git status --porcelain=v1 -b -uall`. It must show exactly §5's paths, plus each final the coordinator saves after this phase, named with its hash in Codex's 3N brief. Any other path stops the run.
- **Q2:** `git rev-parse HEAD main HEAD:scripts/quality/coverage-floor.json`. It must give §5's values, or the commits Codex's brief names.
- **Q3:** `git diff --name-only <main> HEAD -- supabase scripts/backend apps/mobile/src/data`. It must be empty.
- **Q4:** `git status --porcelain=v1 --ignored`, recorded. Afterwards, only `supabase/.temp/` may be new.
- **Q5:** `sha256sum` of every records path and final, the floor, `coverage-baseline.md` and the lockfile.
- **Q6:** `docker inspect --type container --format '{{.Id}} {{.State.StartedAt}} {{.RestartCount}}'` of both container names. The IDs must equal P2's. If M1's agreed format already records these three fields, the before read is M1's and isn't repeated.
- **Q7:** `docker exec -e PGOPTIONS=-cdefault_transaction_read_only=on <P2 database ID> psql -U postgres -d postgres -X -At -v ON_ERROR_STOP=1 -c "select version from supabase_migrations.schema_migrations order by version"`. It must list exactly the 15. The session is read-only on the server's side, and it is reached by ID, never by name. This form is UNRUN. Codex's 3N brief fixes the exact quoting, and if the read-only option isn't accepted, the check stops; it doesn't fall back to a writable session.
- **Q8:** the census, §4, in the same form as Q7.

**The gate.** `rtk proxy pnpm backend:test`, **once**, from this worktree, in the same session and environment as the checks. It runs in the background, with no edits until it exits, and no retry.

## 4. The census, before (C0) and after (C1)

It is one read-only statement, in Q7's form. It prints **counts only**: no email, name or ID.

**The run's own namespaces, each counted separately:**
- **A1:** `auth.users` with email `like 'fitlog-integration-%@example.invalid'` (`verify.mjs:15`).
- **A2:** `auth.users` with email `like 'gym-integration-%@example.invalid'` (`verify-gym.mjs:13`, `verify-freezes.mjs:13`).
- **A3:** `public.profiles` rows whose `id` is an A1 or A2 user.
- **A4:** `public.gyms` named "Disposable local integration gym" with a code matching `^T[0-9A-F]{10}$`, or named "Disposable freeze fixture" with a code matching `^F[0-9A-F]{10}$`.
- **A5:** for each of the 15 gym tables, the rows whose `gym_id` is an A4 gym. The tables are `gym_roles`, `gym_members`, `gym_plans`, `gym_memberships`, `gym_freezes`, `gym_charges`, `gym_charge_adjustments`, `gym_payments`, `gym_principal_events`, `gym_allocations`, `gym_receipt_counters`, `gym_receipts`, `gym_visits`, `gym_commands` and `gym_audit`.
- **A6:** for each of the 13 member tables at `verify.mjs:71`, the rows whose `owner_id` is an A1 or A2 user. The tables are `body_entries`, `workout_sessions`, `performed_sets`, `workout_revisions`, `mutation_outcomes`, `goals`, `meal_items`, `nutrition_targets`, `schedule_occurrences`, `programme_schedules`, `programmes`, `foods` and `exercises`.
- **A7:** `gym_members` rows whose `linked_user_id` is an A1 or A2 user.
- **A8:** A1, A2, A3 and A4 rows with `created_at` at or after the window's start, which Codex's brief records.

**Totals, so unrelated data is checked as counts:**
- every one of the 30 public tables in `main`'s 15 migrations;
- `auth.users`, `auth.identities`, `auth.sessions` and `auth.refresh_tokens`;
- `storage.objects`;
- `private.contracts`, which should hold 8 rows.

**It passes only if all of these hold:**
- the gate exits 0, and no output line contains "needs attention";
- C1 equals C0 for **every** A1–A7 entry, not only the total of `example.invalid` users;
- A8 is 0 after the run;
- for every table, the total minus the run's own rows is the same in C1 as in C0;
- Q1–Q7 are unchanged, with the IDs, start times and restart counts identical, and the only possible new ignored path is `supabase/.temp/`.

The change in the auth audit log is recorded, not judged.

**It fails, even with exit 0,** on any "needs attention" line, any change in an A count, any A8 row, any change in an unrelated count, or any change in a bracket. Then the run is recorded exactly, and stops. **No manual cleanup, delete, seed or re-run.** Codex decides what follows.

**C0 is recorded, not judged.** Leftovers from earlier runs are written down as found. They aren't assumed absent, and they aren't removed. **QA-9 doesn't know how clean 55321 is today.**

**Policy.** `verify-gym.mjs:51` asserts that staff never gain health access, and a failure there is a critical stop. Under PRD 16.1 and ADR 003, gym staff never read or write a member's private health data, whatever the consent. That rule stays in force until QA-2 is integrated and the launching checkout is corrected.

## 5. Inventory now (executed)

At 09:07:49Z, before this phase's edits:
- `HEAD` was `8b29511381c35b936eb2fe14a148cd21f4dedfed`, `main` was `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, and the floor blob was `0036eedaf6de63003294b9ff7aa3ef157ab57c74` (run 3);
- four paths were uncommitted (run 2).

| Path | State | sha256 (run 4) |
|---|---|---|
| `docs/plan/runs/QA-9/checkpoint.md` | Modified: phase 3M's after-commit notes | `ba0ecf2e86bb25d3a7cb29ee6190024d80ffdaa788a18c0811be08c08028a4a2` |
| `docs/plan/runs/QA-9/handoff.md` | Modified: the same | `c6e4ec1f35acd3fde04d995252984ea0515bb0ece7735a662f600330fefc9ef0` |
| `docs/evidence/QA-9/final-2026-10-27T0905Z.md` | Untracked. **Phase 3M's implementer report**, saved in the 08:35 cycle under a 0905 name (Codex: mislabelled) | `fa75b065c58e65e82a4af5dc6518fd73e8040b85215b6d068ec5cf47dd9d47a2` |
| `docs/evidence/QA-9/final-2026-10-27T0905Z-collected.md` | Untracked. **The 0905 review**, saved in the 09:05 cycle | `1b3a3705f01647ef0ab122a37a82e9a13312c531e236b5d79531ac5489961627` |

The eleven files phase 3M hashed in its run 7 are unchanged: the six finals from 0435 to 0705, the 3I and 3J outputs, the floor, `coverage-baseline.md` and the lockfile. `phase-3l-check-outputs.md` is still `181775a9…`.

**After this phase** there are five uncommitted paths. The checkpoint and handoff are modified, with new hashes in the checkpoint's run list. Three files are untracked: the two finals above, both unchanged, and this file. The coordinator will then save this phase's own final as another untracked file, and 3N's Q1 must name it.

## 6. Who runs `backend:test` (the 0905 review's Low 2)

**QA-9 runs its own `backend:test`, in its own worktree,** serialised with MB-1's database lane: never at the same time as any MB-1 step on 55321, and **not inside MB-1's lane**. MB-1's D7 (MB-1 `phase1.md:89–95`) keeps MB-1 itself off 55321, apart from its own authorised apply.

`final-2026-10-27T0905Z.md:23` says "to run in MB-1's database lane". That is wrong. The file stays as written, with a note in the checkpoint's file index.

## 7. Not done here

- **Not run:** the gate, any test, Docker, Supabase, SQL, network, the replay or the runner.
- **Not changed:** code, config, other lanes' files, `main`, status, `GOALS.md`, `ACCEPTANCE.md`, the integration records, commits and rebases.
- **Inherited, not re-run:** the local CI-mode proof with 285 tests (phase 3L, audited by the 0705 review, acceptance (16)).
- **Not claimed:** M1, the fix lane, the stack's state and the census figures. All are UNRUN.
