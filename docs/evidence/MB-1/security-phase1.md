# MB-1 phase 1 — independent security review (verbatim)

| Field | Value |
|---|---|
| Source | Claude Code session `e838e80b-1670-48ed-bf89-b6815e56226c`, titled "MB1 phase1 independent security review"; transcript line 390, the session's final assistant message (`msg_011CgQEsp4YvQ74meUYrwrQz`, 2026-10-26T04:47:27.928Z, `claude-opus-5-5`) |
| Reviewed | The uncommitted phase 1 candidate on `codex/mb1-identity`, base local `main` `2a95726` |
| Copied | 26 October 2026, during PHASE1B remediation, by reading the transcript's JSON text field and decoding its escapes. Nothing below the rule is edited |
| Dispositions | [phase1b.md](../../plan/runs/MB-1/phase1b.md) §2. This file is the record of what the reviewer said, not of what has since changed |

---

# MB-1 phase 1 security review: the candidate is safe to apply locally once one stronger precondition check passes

I found no critical or high issue. The one-line SQL change is correct and consistent with the other member policies. I found no way around it. One medium finding is about what the GREEN run would and would not prove; the rest are low.

**Nothing is proved yet.** No migration was applied, no GREEN run happened, and box 3 is not met. I made no database calls, edits, commits or external actions. Bash was denied, so I reviewed by reading files only, and I did not run `git diff`. The session-start status showed only the 4 new untracked paths and no changed tracked files.

## Findings

### 1. Medium: a GREEN run would not prove box 3
- **Location:** `docs/plan/runs/MB-1/phase1.md:31,109-111,151`; `docs/plan/GOALS.md:565`; `20261017164708_gym_operations.sql:107-109`; `20261019120627_gym_command_guards.sql:2`; `docs/architecture/003-architecture-freeze.md:404`
- **Defect:** Box 3 says "a revoked session fails on its next request". After this candidate, two gaps remain:
  - The gym linked-member reads (`role_read`, `register_read`, `plans_read`, `gym_read`) still serve a revoked or disabled session's token for up to 3600 s. That includes the register row: name, phone, email, staff notes and tags.
  - Direct reads by a revoked session return `200 []`, not the `401 UNAUTHENTICATED` that 003 §3.7 requires.
- **Scenario:** The suite reports 25 ok and box 3 gets ticked. A member taps "sign out other devices". A copied token on a stolen phone can still read their gym phone, email and staff notes for an hour.
- **Fix:**
  - Keep box 3 open until G16.api adds `and (select private.member_active())` to the four linked branches, with a revoked-session probe for each.
  - Record an explicit decision on whether `200 []` counts as "fails" or whether the 401 envelope from 003 §4.5 is needed (R4). The docs already say "not claimed"; this is so the coordinator doesn't treat GREEN as completion.

### 2. Low: the recursion precondition query checks too little
- **Location:** `phase1.md:135-136` (also `:103-108`)
- **Defect:** Ownership is only part of the precondition. The query does not check:
  - `p.prosecdef`: if the function were not a definer, its inner read would run as `authenticated` and recurse.
  - `c.relrowsecurity`: if RLS were off, the policy would do nothing.
  - `r.rolsuper`, or role membership with the table owner.
  - Whether some other permissive SELECT or ALL policy on `profiles` exists. Permissive policies are OR'd, so such a policy would bypass the new guard.

  A small wording error too: going through a SECURITY DEFINER function, recursion would show up at runtime as `stack depth limit exceeded` (54001), not as "infinite recursion detected in policy".
- **Scenario:** The shared 55321 database has drifted, for example a hand-made policy or another worktree's migration. The current query passes. GREEN would then fail loudly (a 500, or the 3 checks), so this is not a silent hole, but the gate is incomplete.
- **Fix:** Run these read-only queries instead.

```sql
select c.relowner::regrole table_owner, c.relrowsecurity, c.relforcerowsecurity,
       p.proowner::regrole fn_owner, p.prosecdef, p.proconfig, r.rolsuper, r.rolbypassrls,
       pg_has_role(p.proowner, c.relowner, 'USAGE') fn_owner_has_owner_privs
from pg_class c, pg_proc p, pg_roles r
where c.oid='public.profiles'::regclass and p.oid='private.member_active()'::regprocedure and r.oid=p.proowner;
select policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname='public' and tablename='profiles' order by 1;
```

  Proceed only if all of these hold:
  - `prosecdef` and `relrowsecurity` are both true.
  - `rolsuper` or `rolbypassrls` is true, or `fn_owner_has_owner_privs` is true and `relforcerowsecurity` is false.
  - There are exactly two policies:
    - `profile_read`: PERMISSIVE, `{authenticated}`, SELECT, qual `id = (SELECT auth.uid())`.
    - `profile_update`: UPDATE.
  - `supabase migration list --local` shows the 15 applied versions matching the files.

### 3. Low: the policy mutation step commits to the shared stack
- **Location:** `phase1.md:139-141`
- **Defect:** The mutation step deliberately commits the weaker policy. If the run is interrupted before the restore, the migration history says `20261026040045` is applied but the old policy is live. The suite is not wired into `backend:test` until step 7, so step 5 would not catch it. Other worktrees that use 55321 also see the weaker policy during the window.
- **Fix:**
  - Capture `select qual from pg_policies where tablename='profiles' and policyname='profile_read'` right after applying.
  - Do the mutation and the restore in one `ON_ERROR_STOP` psql script, then check that the qual matches the captured text exactly.
  - Make sure no other session uses 55321 during the window.

### 4. Low: the disable step is checked only for HTTP success
- **Location:** `scripts/backend/verify-identity.mjs:72`
- **Defect:** A PATCH that matches no rows still returns 200. This cannot cause a false pass, because the 3 disabled checks would then fail, but it makes a failure harder to diagnose.
- **Fix:** `assert.equal(disabled.data?.[0]?.status, 'disabled', \`Disabling member B failed: ${brief(disabled)}\`);`

### 5. Low: one GraphQL check passes without testing anything, and the summary overclaims
- **Location:** `verify-identity.mjs:98,101`
- **Defect:** `pg_graphql` is off, so "GraphQL serves no profile to a revoked session" passes trivially but still counts toward the 25. The pass message says revoked sessions are refused on GraphQL, which is not exercised.
- **Fix:** Rename the check "(vacuous while pg_graphql is off)" or fold it into the tripwire. Change the summary to "…refused on GoTrue and PostgREST; GraphQL closed (tripwire)".

### 6. Low: claimed coverage is wider than the tests
- **Location:** `phase1.md:40-42`; migration comment, line 2
- **Defect:** The docs say the predicate covers deletion-pending, banned and unverified accounts. Only disabled accounts and revoked sessions are tested.
- **Fix:** Either narrow the claim, or add checks:
  - After the disabled checks, PATCH B to `deletion_pending` (asserting the returned status), then `noRows(await profile(b, b1))`.
  - Keep C's token from line 69, ban C with `PUT /auth/v1/admin/users/{id}` and `{ban_duration:'1h'}`, then `noRows` on C's profile. Record whether GoTrue's ban also deleted the session.

### 7. Low: the status parse can echo key material if it fails
- **Location:** `verify-identity.mjs:10` (the same pattern exists in `verify.mjs:6`)
- **Defect:** On a non-zero exit, `execFileSync` throws an error that carries `stdout`. A failed `JSON.parse` includes a snippet of the input. Either error, uncaught, could print part of the `supabase status` output, which holds keys. There is also no `--workdir` and no timeout.
- **Fix:** Use the existing helpers in `local-stack.mjs`:

```js
import { LOCAL_API_URL, REPO_ROOT, spawnRunner } from './local-stack.mjs';
const out = spawnRunner('pnpm', ['exec','supabase','status','-o','json','--workdir',REPO_ROOT], { cwd: REPO_ROOT });
if (out.status !== 0) throw new Error('supabase status failed; output withheld because it holds keys');
let status; try { status = JSON.parse(out.stdout); } catch { throw new Error('supabase status did not print JSON; output withheld'); }
```

### 8. Low: cleanup only deletes body entries
- **Location:** `verify-identity.mjs:104`
- **Defect:** If a future regression lets a revoked RPC write rows into other owner tables, the account delete fails because of the foreign keys. The fixture then leaks, though with a "needs attention" message. An interrupted run (Ctrl-C) skips `finally` altogether.
- **Fix:** Loop over the same table list as `verify.mjs:71`.

**Documentation nit:** the suite signs in 6 times, not 7 (`phase1.md:81,123`).

## The areas you asked about
- **Recursion:** No migration forces RLS, changes an owner or makes `member_active` an invoker. It remains `security definer`, `search_path=''`, and is created by the same role as `profiles`. Its inner read should therefore skip RLS. That can only be confirmed on the live database, with the queries in finding 2.
- **Caller and session binding:** `member_active` ties the token's user, the auth user row and the token's `session_id` to the same `auth.sessions` row (`member_core.sql:26-30`). The token is signed, and there is no exposed path to set `request.jwt.claims`.
  - Tokens without a `session_id` are refused, so it fails closed. There are no Edge Functions in the repo.
  - Residual R5 is confirmed: a session counts as live while its row exists. That ignores `not_after` and refresh-token family revocation, which matches GoTrue's own `/user` check.
- **Disabled profiles:** R3 is confirmed in the app code:
  - `getUser` succeeds for a disabled account, the profile comes back `null`, and the app routes to onboarding (`api.ts:20-25`, `MemberProvider.tsx:52`). Onboarding then refuses with `42501` (`validated_contracts.sql:80`).
  - A revoked session's `getUser` throws, so the app falls back to the cached profile on that device only (`MemberProvider.tsx:50`).
  - Already true before this change: `ProfileScreen.tsx:17` reports success when a disabled account's update changes no rows.
- **Expected profile UPDATE effects:** None. An UPDATE already requires `profile_update` (which calls `member_active`) together with `profile_read` on the existing row. Members cannot write `status` or `id` (column grant at `member_operations.sql:115`), so checking the new row against the stricter `profile_read` cannot newly fail. No definer function updates `profiles`, and the service role bypasses RLS.
- **Bypasses:** I found no other policy on `profiles`.
  - Insert, delete and anon access are blocked by grants. The `private` schema is not exposed.
  - The onboarding wrapper only passes through the definer's result. That definer checks the session (`:74`) and active status (`:80`) before returning an existing profile.
  - Embedding `profiles` through `linked_user_id` is still filtered by `profile_read`, so staff cannot read member dates of birth (I17). Realtime has no publication.

## Verdict
The candidate is safe for a coordinator-controlled apply to 55321 if the queries in finding 2 pass and nobody else is using the stack during the apply and mutation steps. Fixes 4–8 can be made before or after the apply. GREEN, the mutation run, the replay and diff, and box 3 all remain unproved.

## What I checked
- **Goal and PRD:** the MB-1 card; PRD §5.1 and §22.1–22.3; QA-1 F-2; 003 §3.3 and §3.7.
- **Run records:** `phase1.md`, the checkpoint and the RED log.
- **Database:** the new migration; every policy, grant and SECURITY DEFINER function touching `profiles` across all 15 migrations; `member_active`; both versions of `complete_onboarding`; `config.toml` (auth, schemas, sessions, anonymous sign-ins).
- **Scripts:** `verify-identity.mjs` line by line, compared with `verify.mjs` and `local-stack.mjs`.
- **App:** the mobile profile, onboarding and sign-out code paths.
- **Unchanged areas:** secrets in the repo (none), PII in output (only status codes and synthetic fixtures), new dependencies (none), new endpoints needing rate limits (none). AI, messaging and location are not touched.
