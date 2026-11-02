# MB-1 phase 1 — live-session enforcement and profile ownership (box 3)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3: "A revoked session fails on its next request, and a user can read only their own profile (cross-user test)" |
| Attempt | 1, phase 1 only. Local Claude executor under the Codex coordinator (AUTH-01 delegation) |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726` (AR-1 Done). Nothing committed |
| State | **Corrected candidate after the independent security review (PHASE1B, [phase1b.md](phase1b.md)), with the replay runner of phase 1C ([phase1c.md](phase1c.md)).** RED was proven on 55321 with the earlier 25-check suite. The SQL is written, **not applied and not green**. The 27-check suite has **not run anywhere**; its pure unit tests have (§5). Box 3 is **not met**, and two completion blockers stay open whatever the suite reports (§2 D6) |
| Read | `GOALS.md` MB-1 card; PRD §4.2, §5.1–5.3, §22.1–22.2; 003 §3.3, §3.7, §4.2–§4.5, §4.15, §8, §10, §12; AR-1 handoff; QA-1 security review F-2; all 15 migrations' identity, policy and grant lines; `verify.mjs`, `verify-gym.mjs`, `local-stack.mjs`; the app's profile, onboarding and sign-out calls |
| Review | [security-phase1.md](../../../evidence/MB-1/security-phase1.md), verbatim: no critical or high finding; one medium (box 3 not provable by GREEN alone) and seven low. Dispositions: [phase1b.md](phase1b.md) §2 |

## 1. Audit: every exposed identity and profile request path

"Revoked" means a signed-out session whose access token is still unexpired (`jwt_expiry` 3600 s). Results are from the
RED run ([phase1-red.log](../../../evidence/MB-1/phase1-red.log)) unless marked *read*.

| Path | Guard today | Revoked session | Disabled profile | Other member | Action |
|---|---|---|---|---|---|
| GoTrue `GET /auth/v1/user` | GoTrue loads the JWT's session | **403 `session_not_found`** | n/a (auth layer) | n/a | None. Pinned |
| GoTrue `POST /auth/v1/logout?scope=local\|others` | GoTrue | Deletes the session rows | — | — | Used by the tests; `others` revokes the other devices' sessions |
| `GET /rest/v1/profiles` | `profile_read`: `id=auth.uid()` only (`20261017161031_member_core.sql:34`) | **RED: HTTP 200, own row** | **RED: HTTP 200, own row** | 200 `[]` (guessed ID and unfiltered) | **Fix (candidate)** |
| `PATCH /rest/v1/profiles` | `profile_update` with `member_active()` (`20261017161225_member_operations.sql:116`); column grant (`:115`) | 200 `[]`, row unchanged | 200 `[]`, row unchanged | 200 `[]`, row unchanged | None. Pinned |
| `POST /rest/v1/profiles` (direct insert, skipping the adult check) | No insert grant (`20261017162313_explicit_api_grants.sql:2-6`) | — | — | **403 `42501`**, no profile row | None. Pinned |
| anon `GET /rest/v1/profiles` | No anon grant | **401 `42501`** | — | — | None. Pinned |
| `POST /rest/v1/rpc/complete_onboarding` | Invoker wrapper → `private.complete_onboarding`, which checks the user **and the JWT session** (`20261017164336_validated_contracts.sql:74`) and refuses a non-active profile (`:80`) | **403 `42501`**, no profile row; a new session then onboards | **403 `42501`** | No parameter names a user | None. Pinned (see D2) |
| `private.*` over the API (`Content-Profile: private`) | `private` not in `[api].schemas` (`supabase/config.toml:13`) | **406 `PGRST106`**, no profile row | — | — | None. Pinned |
| `POST /graphql/v1` | `graphql_public` exposed, but the extension is off | Body `pg_graphql extension is not enabled.`; no profile | — | — | Tripwire only (D4). No GraphQL check counts as a session test |
| `POST /rest/v1/rpc/refresh_schedules_v1` (first call of every sync) | `member_active()` in `private.refresh_my_schedules` (`20261017163754_scheduling_and_history.sql:55`, wrapped at `:60`) | **403 `42501`** | *read*: same guard | — | None. Pinned |
| Personal tables, read and insert (`body_entries` as the probe) | `owner_read`/`owner_insert` with `member_active()` (`member_core.sql:155,158`) | read 200 `[]`; insert **403 `42501`** | *read*: same guard | QA-1 suites | None. Pinned |
| Storage `personal-images` | `member_active()` in all three policies (`member_core.sql:169-174`) | *read*: guarded | *read*: guarded | owner prefix | None (MB-6 owns storage) |
| Realtime | No migration adds a publication (grep: no `publication`) | *read*: nothing broadcast | — | — | None. Not run-time verified |
| Gym linked-member branches: `role_read`, `register_read`, `plans_read` (`20261017164708_gym_operations.sql:107-109`), `gym_read` (`20261019120627_gym_command_guards.sql:2`) | `auth.uid()` only in the linked or self branch; the staff branches go through `private.gym_role()`, which calls `member_active()` (`gym_operations.sql:14`) | *read*: still readable (QA-1 F-2) | *read*: still readable | Own link only | **Not in this phase. MB-1 completion blocker B1** (D6): the G16.api linked-policy prerequisite |

Other sessions of the same account stay live after a local sign-out, and the device that revokes the others stays live
(both checked). PHASE1B adds two account states to the `GET /rest/v1/profiles` row, written but **not yet run**: a
deletion-pending profile on a live session, and a banned user (`auth.users.banned_until`). Both are expected RED on a
database without the candidate (§4).

## 2. Decisions

- **D1 — one bounded fix.** `profile_read` gets `and (select private.member_active())`, through `alter policy` in an
  append-only migration. It is QA-1 F-2's stated fix, 003 §3.7's rule (the session check in every policy) and §10's
  routing (profiles are MB-1's), and it matches every other member policy. **What the suite tests** (once it runs, §4):
  a revoked session, a session revoked from another device, a disabled profile, a deletion-pending profile on a live
  session, and a banned user. For the ban, the run also records whether GoTrue's ban ended the session, so the record
  shows whether the ban clause or the session clause refused the read (§6 R7). **Covered by reading `member_active()`
  only, not tested:** an unverified identity (with email confirmation on, no password session can be issued, so an API
  test cannot reach this state) and a soft-deleted user (`deleted_at`). A hard-deleted user loses the profile row through
  `on delete cascade`, so there is nothing left to read. Rejected alternatives:
  - *A session-only helper* that lets a disabled user still read their profile. PRD §5.1 says disabled users read no
    protected cloud data, and 003 §3.7 defines the live check as `member_active()`.
  - *Raising `PT401` from the policy* to get 003 §3.7's `401 UNAUTHENTICATED`. That changes the wire format of a direct
    read, which is transitional (003 §4.2), and the error envelope belongs to the later contract work (§4.5, §8). Direct
    reads keep today's documented behaviour: no rows.
- **D2 — `complete_onboarding` is not changed.** The phase brief said it checks a verified active user but not the JWT
  session. That was true of its first definition (`member_core.sql:181`), but `20261017164336_validated_contracts.sql:70-85`
  replaced it with a check of the JWT's `session_id` against `auth.sessions`. The RED run confirms it: a revoked session
  gets `403 42501` and no profile row, and a fresh session then onboards. The suite pins this so a later rewrite cannot
  drop it.
- **D3 — gym linked-member branches stay with G16.api** (003 §10; QA-1 F-2 "Owner: MB-1 (`profiles`) and G16.api (gym
  tables)"). The same one-line fix applies there. The residual is in §6. *PHASE1B:* it is now MB-1 completion blocker
  B1 (D6), not just a residual.
- **D4 — GraphQL.** The live-session control first failed because `pg_graphql` is not enabled, so GraphQL serves no
  profile on any session. A test cannot be green on a path that does not exist, so the control became a tripwire:
  it fails, naming the checks to add, if anyone enables `pg_graphql`. *PHASE1B:* the revoked-session GraphQL check
  passed without testing anything (review finding 5), so it is gone. The tripwire is the only GraphQL line, named
  `tripwire: …`, and the pass line says "GraphQL closed (tripwire)", not "refused on GraphQL".
- **D5 — no contract change.** The candidate changes which rows a policy returns, not a schema, column, RPC or wire
  format, so contract 0.1.0 and `database.types.ts` are untouched (003 §8). Recorded for the freeze phase: `401
  UNAUTHENTICATED` with the §4.5 envelope, and an account-state read for disabled accounts (§6 R3), each need a new
  contract version.
- **D6 — MB-1 completion blockers (review finding 1, medium; PHASE1B).** A GREEN run of this suite, however many checks
  pass, does **not** prove box 3 and does **not** make MB-1 Done. Two blockers stay open until each has its own proof:
  - **B1 — the G16.api linked-policy prerequisite.** `role_read`, `register_read`, `plans_read` and `gym_read` still
    serve a revoked or disabled session's unexpired token for up to `jwt_expiry` (3600 s), including the register row
    (name, phone, email, staff notes, tags). The fix is `and (select private.member_active())` on each `auth.uid()`-only
    branch, with a live, a revoked-session and a disabled probe per policy. These tables are G16.api's. G16.api's own
    card needs MB-1, so waiting for G16.api to be Done would deadlock. Codex coordinates a **narrow cross-lane fix** of
    exactly these four branches before MB-1 is marked Done. It lands as its own append-only migration, proved on a
    disposable replay project first.
  - **B2 — `401 UNAUTHENTICATED` at the published API.** 003 §3.7 and §4.5 require a missing or revoked session to get
    `401 UNAUTHENTICATED` with the §4.5 envelope. That requirement is **not relaxed**. The `200 []` a revoked session gets
    from a direct table read is **defence in depth only**: it is not the box 3 "fails" proof. The published `/v1` paths
    (today `refresh_schedules_v1`, the member and gym commands, and `complete_onboarding` once it is versioned) must
    raise `401 UNAUTHENTICATED` for a revoked session, under a new contract version (D5). The suite's present `403
    42501` pins on those paths record today's behaviour; the contract work replaces them deliberately.
  - D1's rejection of raising `PT401` *from the RLS policy* stands. It concerns the direct-read layer only, and the 401
    belongs to the published API, so D1 is not a contract relaxation.
- **D7 — mutation runs only on a disposable replay project (PHASE1B, coordinator rule).** No policy, function or grant
  on the shared 55321 database is weakened, not even for a moment and not inside a restore script. The suite's own
  disposable fixtures are the only rows it changes there. Every mutation check
  runs on a disposable, isolated replay project with its own `project_id` and ports, in a later authorized phase
  ([phase2-plan.md](phase2-plan.md)). On 55321, the only change is applying the committed candidate migration once the
  read-only preconditions (§7) pass. This replaces the earlier §7 step 4 and the review's finding 3 fix, both of which
  committed the weaker policy to 55321.

## 3. Candidate (not applied)

`supabase/migrations/20261026040045_mb1_live_session_guard.sql`, created with
`rtk proxy pnpm exec supabase migration new mb1_live_session_guard`; it sorts after `20261025234317` and matches the
guard's `MIGRATION_NAME`. No existing migration is edited.

```sql
alter policy profile_read on public.profiles using (id=(select auth.uid()) and (select private.member_active()));
```

`alter policy` keeps the name and the `to authenticated` role list. `(select …)` makes the check an init-plan, once per
statement.

*PHASE1B:* the SQL is unchanged. The review found no defect in it. Its comment (line 2) names a revoked session, a
disabled or deletion-pending profile and a banned user; the suite now probes each of those, so the comment needs no
narrowing once GREEN runs. No existing migration was touched.

## 4. Tests

*As corrected in PHASE1B ([phase1b.md](phase1b.md)) and phase 1C ([phase1c.md](phase1c.md)). The suite itself has not
run anywhere; its pure unit tests have (§5).* `scripts/backend/verify-identity.mjs` exports `stackStatus()` and `main()`,
and runs only when invoked directly.

- **Target.** By default this project's stack at `http://127.0.0.1:55321` (`LOCAL_API_URL`). A caller may pass
  `main({ projectDir, expectedApiUrl })` for a disposable loopback replay project, as AR-1's runners allow. Anything that
  is not `http://127.0.0.1:<port>` is refused before `supabase status` runs.
- **Status.** One `pnpm exec supabase status -o json --workdir <project>` through `spawnRunner` (argument array, no
  shell, 120 s timeout), from `REPO_ROOT`. A non-zero exit, a spawn error, non-JSON output, another `API_URL` or a missing
  key is refused with a fixed message. The status output, which holds keys, is never printed, even on failure.
- **Output.** `ok - <name>` or `not ok - <name>` plus one line holding only an HTTP status, an error code and message, or
  a row count. One `#` line records GoTrue's answer to member C's session after the ban. Then a count line.
- **Fixtures.** Three accounts `fitlog-mb1-identity-<run id>-<a|b|c>@example.invalid` (one random run id per run)
  through the local admin API (email confirmed, so no mail is sent), **six** password sign-ins (A three, B one, C two),
  one body entry. Cleanup deletes only this run's rows, by `owner_id`, from the 13 owner tables `verify.mjs` cleans
  (children first), then this run's accounts. It names each failure, makes a run that otherwise passed exit 1, and also
  runs on `SIGINT` or `SIGTERM`. It touches no other row. *Phase 1C (review 39fe1fb5 finding 5):* on a signal no new
  request starts except cleanup's; cleanup first waits up to 30 s for account creations in flight, deletes every account
  that was created (even one created after the signal), and names by email any account whose creation never answered.
- **27 checks**, every one run and reported:

| Group | Checks | Expected without the candidate | Expected with it |
|---|---|---|---|
| Ownership | 5 | ok | ok |
| Onboarding bypass (C has no profile yet; C's first session is revoked, then a new one onboards) | 4 | ok | ok |
| Disabled account (B) | 3 | **not ok:** `a disabled account reads no profile` | ok |
| Deletion-pending account (B, session still live) | 1 | **not ok:** `a deletion-pending account reads no profile` | ok |
| Banned account (C): a live control before the ban, then the read after it | 2 | control ok; **not ok:** `a banned account reads no profile` | ok |
| One revoked session (A) | 8 | **not ok:** `a revoked session reads no profile` | ok |
| Revoked from another device (A) | 3 | **not ok:** `a session revoked from another device reads no profile` | ok |
| GraphQL tripwire | 1 | ok while `pg_graphql` is off | ok while `pg_graphql` is off |

  So: without the candidate, **22 ok and 5 not ok, all `profile_read`**; with it, **27 ok**. Reverting `profile_read`
  alone (the M1 mutation, replay project only) must fail exactly those 5.
- **Unit test.** `scripts/backend/verify-identity.test.mjs` covers the status step and `main()`'s refusal with an
  injected runner and a `fetch` that fails the test if called, and proves that no failure path prints a key. PHASE1B's
  eight tests passed 8/8 (§5). Phase 1C added four signal and cleanup tests with an injected fetch double and signal
  emitter (12 in all). `backend:test` picks it up through its existing `node --test scripts/backend/*.test.mjs` glob.
- **Check names are unique** (phase 1C): the onboarding-bypass check on C's revoked session is now `a session revoked
  before onboarding cannot complete it`, so no two of the 27 names are equal and the runner can judge them by name.
- The suite itself is **not** wired into `backend:test`: that is the root `package.json`, outside this phase's writes
  (§8).

## 5. Evidence

| Run | Command | Result |
|---|---|---|
| Frozen install | `rtk proxy pnpm install --frozen-lockfile` | `Lockfile is up to date`, `Done in 5.4s` |
| **RED** (historical), current 55321, before the candidate existed, **with the earlier 25-check suite** | `rtk proxy node scripts/backend/verify-identity.mjs` | Exit 1. 22 ok, **3 not ok, all `profile_read`**: disabled account, revoked session, session revoked from another device, each `HTTP 200, 1 row(s)`. [Verbatim log](../../../evidence/MB-1/phase1-red.log). It stands as the record of that run; the 27-check suite has not run |
| Standard gate (no file in its scope changed) | `rtk proxy pnpm check` | Reached `plan.json and board.html match GOALS.md`; domain `# pass 37`, mobile `Tests: 126 passed, 126 total`, plan `# pass 22`: 185 tests, no TypeScript or lint error |
| PHASE1B: syntax of the corrected suite | `rtk proxy node --check scripts/backend/verify-identity.mjs` | Exit 0, no output |
| PHASE1B: syntax and run of the unit test | `rtk proxy node --check scripts/backend/verify-identity.test.mjs`; `rtk proxy node --test scripts/backend/verify-identity.test.mjs` | Refused in the PHASE1B session itself. **Run since:** 8 tests, 8 pass, 0 fail, both in Codex's 06:45 UTC run and in review 39fe1fb5's own run (52.79 ms; `node --check` exit 0 for both files), as that review records ([verbatim](../../../evidence/MB-1/review-39fe1fb5-final.md)) |
| Phase 1C: every pure backend unit test | `rtk proxy node --test scripts/backend/*.test.mjs` | Before phase 1C's changes: `# tests 47`, `# pass 47`, `# fail 0` (the 8 identity tests among them). After: `# tests 83`, `# pass 83`, `# fail 0` (12 identity tests). Details in [phase1c.md](phase1c.md) §4 |
| PHASE1B: standard gate | `rtk proxy pnpm check` | Same result lines as above, 185 tests. Its scope does not include `scripts/backend/`, so this is a regression check only |
| RED of the 27-check suite; GREEN | — | **Not run.** No database call was made in PHASE1B. Both belong to the authorized DB phase ([phase2-plan.md](phase2-plan.md)) |

**Pinned HTTP values (part of 003 §12 row 2).** On local PostgREST, `42501` from an authenticated caller (a definer
refusal or an RLS insert violation) is **403**, and from anon is **401**. A schema outside `[api].schemas` is **406
`PGRST106`**. GoTrue refuses a revoked session with **403 `session_not_found`**. `40001` and `22023` are not pinned in
this phase.

## 6. Security risks and residuals

- **R1 — check before applying: RLS recursion.** `member_active()` is a `security definer` that reads
  `public.profiles`. With the candidate, `profile_read` calls it. If the function's owner did not bypass RLS on
  `profiles`, the definer's read would apply `profile_read` again and recurse. Through a definer function this shows up
  at run time as `stack depth limit exceeded` (`54001`), not as `infinite recursion detected in policy` (*PHASE1B
  correction*, review finding 2). Both were created by the migration role, so the owner should be the table owner, and
  table owners bypass RLS unless it is forced. `profile_update` already calls it, but that is an UPDATE policy, so it does
  not prove this. Ownership is only part of the precondition: the read-only queries in §7 also check `prosecdef`,
  `relrowsecurity`, the owner's bypass, every policy on `profiles` and the applied migrations. The GREEN run's first
  check would fail with a 500 if R1 were wrong.
- **R2 — the gym linked-member part of F-2 stays open (G16.api).** Until it is fixed, a revoked or disabled
  session's unexpired token, for up to `jwt_expiry` (3600 s), still reads the linked register row (name, phone, email,
  staff notes and tags), linked gyms and plans, and its own staff roles. *PHASE1B:* this is MB-1 completion blocker B1
  (D6), not a residual MB-1 can close without.
- **R3 — client behaviour for a disabled account.** `loadProfile` (`apps/mobile/src/data/api.ts:19-26`) gets `null`
  instead of a row, so the app routes to onboarding, where `complete_onboarding` refuses with `42501`. No data leaks,
  but the screen is wrong. A later MB-1 phase (with SC-5) needs an account-state read or the `UNAUTHENTICATED` and
  account-unavailable codes, with a new contract version (D5).
- **R4 — revoked sessions get `403` or empty rows, not 003 §3.7's `401 UNAUTHENTICATED`.** The client cannot yet tell
  "sign in again" from "forbidden" by status. This belongs to the envelope and error-code work (003 §4.5), not here.
  *PHASE1B:* it is MB-1 completion blocker B2 (D6). The 401 stays required at the published API, and `200 []` is defence
  in depth only.
- **R5 — session timebox and inactivity.** `member_active()` checks that the session row exists, not
  `auth.sessions.not_after`. `[auth.sessions]` is unset locally (`config.toml:280-284`), so this cannot happen today.
  If PL-2 enables a timebox, an expired session whose row still exists would pass the database checks until its access
  token expires (at most 1 h; GoTrue refuses the refresh). Testing it needs an auth configuration change, which this
  phase may not make.
- **R6 — test-run limits.** Each run makes **six** password sign-ins (*PHASE1B correction*; this record said seven)
  against GoTrue's `sign_in_sign_ups = 30` per five minutes per IP (`config.toml:215`). Running it beside the other
  suites several times in five minutes can produce a `429` in setup, which fails loudly with `Fixture sign-in failed:
  HTTP 429`, not as a false pass. Keep to four runs per five minutes on one stack. *Phase 1C:* the replay runner enforces
  at least 75 s between suite runs on one stack, and its verdict treats a setup failure as a failure, never as a kill.
- **R7 — what the ban check proves (PHASE1B).** Whether GoTrue's admin ban also deletes the user's sessions is not
  assumed. The run prints GoTrue's answer to member C's session after the ban. `HTTP 200` means the session row is still
  there, so with the candidate the ban clause of `member_active()` is what refuses the read, and the M2 mutation can
  prove it. `403 session_not_found` means the ban ended the session. Then the session clause refused the read, and the
  claim narrows to "a ban ends access", with the ban clause itself unproved through the API. *Phase 1C (review 39fe1fb5
  finding 4):* any other answer stops the phase and is recorded, and every later run (55321's included) must give the
  same answer as the first. *Phase 1F (F6, [phase1f.md](phase1f.md) §4):* phase 2 attempt 3's replay answered `403
  user_banned`. That is a third class, `banned`. It says the user is banned, not whether the session row still exists, so it
  is neither of the two above. RED, GREEN, M1 and M3 keep their exact expectations under it, and it becomes the reference
  like any recognised answer. M2 fails closed: `mutate m2` is refused and an M2 verdict never holds, so `shared-apply`
  stays blocked until a separately reviewed plan adds direct session evidence. Attempt 3's failed run is not reclassified.
  *Phase 1G (review bbe2fbba finding 2 and its nonvacuous M2, [phase1g.md](phase1g.md) §4; review owed):* the narrowed
  claim under `ended` no longer counts: M2 is refused under `ended`, so `shared-apply` stays blocked on such a replay.
  Under `live` or `banned`, M2 holds only when exactly `a banned account reads no profile` fails with `HTTP 200, 1 row(s)`.
  With the ban clause removed, member C's own row coming back shows that its session row still existed, so the run is its
  own session evidence. A complete M2 run whose banned check passed is never a kill: it stops M2 on that replay, and the
  fallback is M2b.
- **Not a risk here.** The script holds the local secret key in memory, as `verify.mjs` does, only to create and delete
  its own fixtures, and never prints it, including when `supabase status` fails (the unit test pins this once it runs).
  Every request goes to the checked loopback URL.

## 7. Preconditions before the candidate is applied anywhere (PHASE1B)

*Superseded and never run:* the earlier version of this section had a single ownership query and a step that committed
the weaker policy to 55321 to mutation-test it. D7 forbids that step. The full next phase, run on a disposable replay
project first, is [phase2-plan.md](phase2-plan.md).

The queries below are read-only: one read-only transaction, rolled back. *Phase 1C:* the replay runner
(`scripts/backend/mb1-replay.mjs`) extracts this block verbatim at `prepare`, refuses it unless it passes a read-only SQL
check (no transaction control, setting change, write, side-effect function or psql meta-command), pins its sha256 in the
replay manifest, and runs it with the session default set to read-only (`PGOPTIONS=-c default_transaction_read_only=on`)
and a proof query first. Run it on the replay project first. Its output is the reference: the same 15 migration files
must produce the same rows on 55321. Changing this block after `prepare` changes nothing that runs; a new replay
directory picks it up.

```sql preconditions
begin transaction read only;
-- P1. The guard function and the table it reads: definer, fixed search_path, RLS on, and an owner that bypasses RLS on
-- profiles (superuser, BYPASSRLS, or the table owner's privileges while RLS is not forced). The md5 pins the definition.
select c.relowner::regrole as table_owner, c.relrowsecurity, c.relforcerowsecurity,
       p.proowner::regrole as fn_owner, p.prosecdef, p.provolatile, p.proconfig,
       r.rolsuper, r.rolbypassrls, pg_has_role(p.proowner, c.relowner, 'USAGE') as fn_owner_has_owner_privs,
       md5(pg_get_functiondef(p.oid)) as fn_definition_md5
from pg_class c, pg_proc p, pg_roles r
where c.oid = 'public.profiles'::regclass and p.oid = 'private.member_active()'::regprocedure and r.oid = p.proowner;
-- P2. Every policy on profiles. Permissive policies are OR'd, so any other SELECT or ALL policy would bypass the guard.
select policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' and tablename = 'profiles' order by policyname;
-- P3. Applied migration versions, with a hash of the statements the CLI recorded for each.
select version, name, md5(array_to_string(statements, E'\n')) as statements_md5
from supabase_migrations.schema_migrations order by version;
rollback;
```

**Proceed only if every line holds.** Otherwise stop, record the output, and apply nothing.

| Query | Must hold |
|---|---|
| P1 | `prosecdef` = `t`; `relrowsecurity` = `t`; `provolatile` = `s`; `proconfig` holds exactly one setting, `search_path=""`; and `rolsuper` or `rolbypassrls` is `t`, **or** `fn_owner_has_owner_privs` is `t` with `relforcerowsecurity` = `f`; `fn_definition_md5` equals the replay project's |
| P2 | Exactly two rows, both `PERMISSIVE` with roles `{authenticated}`: `profile_read` (`SELECT`, no `with_check`) and `profile_update` (`UPDATE`, `qual` and `with_check` both `id = auth.uid()` and `member_active()`, `member_operations.sql:116`). Before the candidate, `profile_read`'s `qual` renders as `(id = ( SELECT auth.uid() AS uid))`; after it, as `((id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.member_active() AS member_active))`. Those renderings are the expected text; the binding test is that every column equals the replay project's row at the same migration point |
| P3 | Before the apply: exactly the 15 committed versions, `20261017161031` to `20261025234317`, each `name` matching its file and each `statements_md5` equal to the replay's; `20261026040045` absent. `pnpm exec supabase migration list --local` agrees (15 applied, the candidate local only). After the apply: 16 rows, the 16th equal to the replay's |

Also before the apply on 55321: no other lane is using 55321 during the apply and the GREEN run (coordinator).

## 8. Not done in this phase, and requests

- Not done: applying SQL; GREEN; the mutation run; replay and diff; any commit, status, ledger, 003 or tracker edit.
  Box 3 is **not claimed**. *PHASE1B and phase 1C:* also not done: any run of the 27-check suite, and any database,
  Supabase or Docker call. (Its pure unit tests have run: §5.)
- Coordinator: [phase2-plan.md](phase2-plan.md), after authorization. After GREEN, 003 §3.7's "Missing" line on F-2 can
  say that MB-1's part (`profile_read`) is closed; that file was outside this phase's writes. Wire
  `node scripts/backend/verify-identity.mjs` into `backend:test` in the root `package.json` (outside this phase's writes).
- Codex (cross-lane, before MB-1 Done): blocker B1, the four gym linked-member branches (D6, R2).
- MB-1 contract work: blocker B2, `401 UNAUTHENTICATED` at the published API with a new contract version (D6, R4).
- Later MB-1 phases or SC-5: R3 and R4 with a contract version; the rest of the 003 §12 status pins (`40001`, `22023`).
- PL-2: R5 if a session timebox or inactivity timeout is configured.
