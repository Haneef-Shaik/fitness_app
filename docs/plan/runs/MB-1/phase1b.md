# MB-1 PHASE1B — remediation after the independent security review (box 3 candidate)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3: "A revoked session fails on its next request, and a user can read only their own profile (cross-user test)" |
| Attempt | 1, PHASE1B, a bounded remediation phase. Local Claude executor; the Codex coordinator acts under the owner's AUTH-01 delegation, and routine decisions were made here |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed |
| State | **A corrected candidate, ready for review.** Nothing was applied, and no database, Supabase or Docker call was made. No GREEN result exists. Box 3 is **not met**, and two MB-1 completion blockers (B1, B2) stay open |
| Read | RTK rules; the `run-goal` skill; [checkpoint.md](checkpoint.md); [phase1.md](phase1.md); PRD §5.1 and §22.3; 003 §3.7, §4.5 and §10; the MB-1 and G16.api cards; the review session's final message, and nothing else from that transcript |
| Review | [security-phase1.md](../../../evidence/MB-1/security-phase1.md), verbatim. No critical or high finding; finding 1 medium; findings 2–8 low; one documentation nit |

## 1. Files

All are uncommitted.

| Path | Change |
|---|---|
| `scripts/backend/verify-identity.mjs` | Reworked for findings 4–8 and the replay target (§3) |
| `scripts/backend/verify-identity.test.mjs` | New. Eight unit tests of the status step and `main()`'s refusal; no database and no network. Not run in this phase; **run since: 8/8 pass** (§4) |
| `docs/evidence/MB-1/security-phase1.md` | New. The review, verbatim, under a provenance header |
| `docs/plan/runs/MB-1/phase1.md` | Claims corrected; D6 and D7 added; §4, §5, §6 and §7 updated |
| `docs/plan/runs/MB-1/phase2-plan.md` | New. The reproducible plan for the authorized database phase |
| `docs/plan/runs/MB-1/phase1b.md` | New. This record |
| `docs/plan/runs/MB-1/checkpoint.md` | Updated |

**Unchanged on purpose:**
- `supabase/migrations/20261026040045_mb1_live_session_guard.sql`: the review found no defect, and the probes now
  cover every state its comment names.
- Every other migration.
- `docs/evidence/MB-1/phase1-red.log`: historical. It records the 25-check suite.
- The root `package.json`, mobile, domain, CI, the lockfile, contracts, `status.json`, the ledger and `GOALS.md`.

## 2. Dispositions

| # | Severity | Finding | Disposition | Where |
|---|---|---|---|---|
| 1 | Medium | A GREEN run would not prove box 3 | **Accepted. Recorded as MB-1 completion blockers.** **B1** is the named G16.api linked-policy prerequisite: `role_read`, `register_read`, `plans_read` and `gym_read`, fixed by a narrow cross-lane change that Codex coordinates before MB-1 Done. **B2**: `401 UNAUTHENTICATED` stays required at the published API, with no contract relaxation; `200 []` is defence in depth only. G16.api's card needs MB-1, so waiting for G16.api to be Done would deadlock; hence the narrow fix | phase1.md D6, R2, R4, §8; [phase2-plan.md](phase2-plan.md) §9; checkpoint |
| 2 | Low | The recursion precondition query checks too little | **Fixed.** P1–P3 check `prosecdef`, `provolatile`, `proconfig`, `relrowsecurity`, `relforcerowsecurity`, both owners, `rolsuper`, `rolbypassrls`, the owner's inherited privileges, a hash of the function definition, every policy on `profiles`, and the applied versions with a hash of their statements. 55321 must match a replay project of the same files row for row. Wording fixed: recursion shows as `54001` | phase1.md R1, §7 |
| 3 | Low | The mutation step commits a weaker policy to the shared stack | **Superseded by a stricter rule (D7).** No mutation on 55321 at all. Mutations run only on a disposable replay project, through a runner that refuses the shared stack by URL and container | phase1.md D7; phase2-plan.md §4 |
| 4 | Low | The disable step is checked only for HTTP success | **Fixed.** `setStatus` asserts that the returned row has the new status (`disabled`, then `deletion_pending`) | `verify-identity.mjs`, `setStatus` |
| 5 | Low | A vacuous GraphQL check, and an overclaiming summary | **Fixed.** The revoked-session GraphQL check is removed. The tripwire is named `tripwire: GraphQL is closed (pg_graphql is not enabled)`, and the pass line says "GraphQL closed (tripwire)" | `verify-identity.mjs`; phase1.md D4 |
| 6 | Low | Claimed coverage is wider than the tests | **Probes added; claims narrowed.** Deletion-pending on a live session: one check. Banned: a live control, then the read after the ban, with GoTrue's answer to the session printed (R7). Unverified and soft-deleted states are claimed only from reading the code; a hard delete cascades the profile away | `verify-identity.mjs`; phase1.md D1, R7 |
| 7 | Low | The status parse can echo key material | **Fixed.** `stackStatus()` uses `spawnRunner` (argument array, 120 s timeout), `--workdir`, `cwd: REPO_ROOT`, and the loopback check. Every failure has a fixed message, and the URL and both keys are checked. The unit test pins it; it has since passed 8/8 (§4) | `verify-identity.mjs`; `verify-identity.test.mjs` |
| 8 | Low | Cleanup deletes only body entries; Ctrl-C skips it | **Fixed.** `verify.mjs`'s 13 owner tables, children first, filtered to this run's IDs. Each failure is named, and a cleanup failure fails a run that otherwise passed. `SIGINT` and `SIGTERM` run the same cleanup | `verify-identity.mjs`, `removeFixtures` |
| Nit | — | Sign-ins are 6, not 7 | **Fixed** in the records | phase1.md §4, R6 |

## 3. Decisions in this phase

- **Exported `main()` and `stackStatus()`, run only when invoked directly** (`invokedDirectly`), as `verify-fixtures.mjs`
  and `verify-contracts.mjs` do. This lets the unit test import the status step with no side effect. It also lets the
  next phase point the suite at a disposable replay project, `main({ projectDir, expectedApiUrl })`, as AR-1 ran its
  runners. Run directly, the default target is still 55321 only.
- **The SQL is unchanged.** There is no concrete defect.
- **The ban probe records GoTrue's behaviour instead of assuming it** (R7). Whether the admin ban ends sessions decides
  which clause of `member_active()` the check proves, and the phase 2 M2 mutation reads it from the run.
- **A cleanup failure fails a run that otherwise passed.** This is stricter than `verify.mjs`, because a leaked fixture
  on the shared stack is a real problem.
- **The unit test sits where `backend:test`'s glob (`scripts/backend/*.test.mjs`) runs it.** It needs no database, so
  `backend:test` gains a check without changing the root `package.json`.

## 4. Evidence

| Command | Result |
|---|---|
| `rtk proxy node --check scripts/backend/verify-identity.mjs` | Exit 0, no output |
| `rtk proxy node --check scripts/backend/verify-identity.test.mjs` | Not run in this phase: the session's permission mode refused it. **Run since:** exit 0, no output, in review 39fe1fb5's run ([verbatim](../../../evidence/MB-1/review-39fe1fb5-final.md)) |
| `rtk proxy node --test scripts/backend/verify-identity.test.mjs` | Not run in this phase: refused the same way. **Run since:** 8 tests, 8 pass, 0 fail, in Codex's 06:45 UTC run and in review 39fe1fb5's run (52.79 ms). Phase 1C's fresh results are in [phase1c.md](phase1c.md) §4 |
| `rtk proxy pnpm check` | Passed. `tsc` for domain and mobile, ESLint with `--max-warnings=0`, `Design rules verified`; domain `# pass 37`, `# fail 0`; mobile `Tests: 126 passed, 126 total`; plan `# pass 22`, `# fail 0`; `GOALS.md: 114 goals, 230 needs, 10 lanes; ACCEPTANCE.md: 94 ledger rows, every PRD scenario and decision covered` and `plan.json and board.html match GOALS.md`. 185 tests. Its scope does not include `scripts/backend/`, so it is a regression check only |
| `git status`, `git diff` | Not run: refused. §1 lists this phase's own writes |

The unit test was checked by reading only. Each of its eight expected messages was traced through `stackStatus()` and
`main()`. Its import of the suite is guarded the same way as `verify-fixtures.test.mjs`'s import of
`verify-fixtures.mjs`, which already runs under `backend:test`.

**Expected results, not evidence.** On a database without the candidate, the 27-check suite should give 22 ok and 5
not ok, all from `profile_read`. With the candidate, it should give 27 ok (phase1.md §4). Neither has run.

## 5. Not done, and requests

- **Not done:**
  - any run of the 27-check suite (its unit test has run since: §4);
  - any database, Supabase, Docker or psql call; fixture creation; migration application; reset;
  - any commit, push, status, ledger or `GOALS.md` edit.
  - Box 3 is not claimed. No GREEN is claimed.
- **Coordinator:** authorize and run [phase2-plan.md](phase2-plan.md). Then wire the suite into `backend:test` (root
  `package.json`).
- **Codex, cross-lane, before MB-1 Done:** B1.
- **MB-1 contract work:** B2, with a new contract version.
- **Owners of `verify.mjs:6` and `verify-gym.mjs:4` (outside this phase's writes):** both parse `supabase status`
  with the pattern of finding 7. They could take the same fixed-message handling.
