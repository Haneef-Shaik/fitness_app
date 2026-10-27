# QA-9 · Backend RPC test inventory (phase 1)

| Field | Value |
|---|---|
| Goal | QA-9, attempt 1, phase 1. This is the card's "inventory mapping each RPC to its test" (scope line 2), in place of SQL function coverage |
| Date | 26 October 2026 |
| Head | `main` at `2a95726`: the 15 migrations in `supabase/migrations/`, `20261017161031_member_core.sql` to `20261025234317_training_formula_v1.sql` |
| Method | Read-only source reading of the migrations, `supabase/config.toml` and `scripts/backend/`. **No database, Docker, Supabase or test user was used, and no backend test was run in this phase** (MB-1 owns the only database test lane). Whether each suite passes is not re-checked here; AR-1's records report the four live suites passing on the coordinator's stack (`docs/plan/runs/AR-1/checkpoint.md`) |
| Exposed | PostgREST serves only `schemas = ["public", "graphql_public"]` (`supabase/config.toml:13`). An **exposed RPC** here is a function in `public` that a client role (`anon` or `authenticated`) may execute at head |

Final grants were worked out by following every `create`, `create or replace` (which keeps existing
privileges), `alter … rename`, `alter … set schema`, `drop`, `grant` and `revoke` in migration order.
No migration grants any public function to `anon`. Each one revokes `PUBLIC` and `anon` at its own grant
site, and `20261017162313_explicit_api_grants.sql:7` revokes them for everything created before it.

## 1. Exposed RPCs: 9

Test references are `file:line` in `scripts/backend/`. They run in `pnpm backend:test` steps 3–6
(`verify.mjs`, `verify-gym.mjs`, `verify-freeze-projection.mjs`, `verify-freezes.mjs`).

### 1.1 `complete_onboarding(text,date,text,text,text,text)`

- **Defined:** `20261017161225_member_operations.sql:7` (a `security invoker` wrapper; the definer was
  moved to `private` at :4 and redefined at `20261017164336_validated_contracts.sql:70`).
- **Grants:** `authenticated` (`…161225:11–12`, `…162313:8`).
- **Tested:**
  - `verify.mjs:25`: an under-18 date of birth is refused ("Under-18 activation must fail").
  - `verify.mjs:26–27`: adults are accepted.
  - Used as setup in `verify-gym.mjs:17` and `verify-freezes.mjs:17`.
- **No test:**
  - a call without a session (`anon`) is refused;
  - notice versions and acceptances are stored;
  - repeating or resuming onboarding;
  - the unsuffixed name (003 §4.15).
- **Owner of the missing tests:** **MB-1**. Box 2 covers under-18, notice versions and resume after a
  kill; box 3 covers own-profile only.

### 1.2 `apply_operation_v1(jsonb)`

- **Defined:** `20261017163754_scheduling_and_history.sql:134`. It wraps
  `private.apply_member_operation` (:75, replaced at `20261017164212_workout_correction_commands.sql:1`),
  which dispatches to `private.apply_member_operation_core` (`20261019122347_function_lint_cleanup.sql:22`).
- **Grants:** `authenticated` (`20261017161225_member_operations.sql:111–112`).
- **Kinds:** 11 (`packages/domain/src/models.ts:107`).
- **Tested** (all in `verify.mjs`):

  | Kind or behaviour | Lines |
  |---|---|
  | `session.create` | 44–46 |
  | Exact replay is idempotent | 47 |
  | A reused ID with changed input is refused | 48–49 |
  | A second active workout is refused | 50 |
  | `set.commit` | 51–54 |
  | A stale base revision is refused | 55 |
  | `session.finish` | 58–59 |
  | `set.edit` | 60–63 |
  | `session.delete` | 64–65 |
  | `session.restore` | 66 |
  | Another member cannot read the resulting rows (tables, not the RPC) | 57, 67 |

- **No test:**
  - `session.update`, `set.delete` and `set.restore`: owner **MB-3** (sessions and sets, 003 §5; box 1
    fault tests);
  - `programme.save` and `programme.archive`: owner **MB-2** (box 1, with base revisions);
  - a call without a session is refused: owner **MB-1**, the first API goal (003 §4.15).

### 1.3 `schedule_programme_v1(uuid,integer,date,text)`

- **Defined:** `20261017163754_scheduling_and_history.sql:51`, wrapping `private.schedule_programme`
  (:32).
- **Grants:** `authenticated` (:52–53).
- **Tested:** **none.** No backend suite calls it. Its only caller is `apps/mobile/src/data/api.ts:47`,
  which no test covers either (0 %).
- **No test:** every behaviour, including `anon` refusal.
- **Owner:** **MB-2** (box 2, the AC38 fixtures; box 4, RLS with cross-user tests).

### 1.4 `refresh_schedules_v1()`

- **Defined:** `20261017163754_scheduling_and_history.sql:60`, wrapping `private.refresh_my_schedules`
  (:54).
- **Grants:** `authenticated` (:61–62).
- **Tested:** **none.** Its only caller is `apps/mobile/src/data/api.ts:28`, at 0 %.
- **No test:** every behaviour, including the cost of a full horizon walk on each sync (QA-1 F-8f) and
  `anon` refusal.
- **Owner:** **MB-2.**

### 1.5 `gym_command_v1(jsonb)`

- **Defined:** `20261019120824_gym_api_errors.sql:10`. It wraps `private.gym_command` (:3), which
  calls `private.gym_command_core` (renamed at :1, latest body at `20261019121035_gym_read_models.sql:2`).
- **Grants:** `authenticated` (`20261017164708_gym_operations.sql:275–276`).
- **Kinds:** 12.
- **Tested:**

  | Kind or behaviour | Where |
  |---|---|
  | `gym.create` | `verify-gym.mjs:24`; `verify-freezes.mjs:26` |
  | An outsider gets 404 | `verify-gym.mjs:25` |
  | `member.save`: a minor is refused; front desk saves an adult; 50 concurrent saves | `verify-gym.mjs:28`, :29, :55 |
  | `plan.save`: front desk is refused; owner saves; a later catalogue edit | `verify-gym.mjs:31`, :32; `verify-freezes.mjs:58` |
  | `membership.issue`: front desk is refused; month-end dates; overlap refused | `verify-gym.mjs:34`, :35, :36 |
  | `membership.issue`: a renewal chain | `verify-freezes.mjs:33–34`, :50 |
  | `payment.record`: credit; a replay reuses its receipt; 50 concurrent gap-free receipts | `verify-gym.mjs:37–38`, :39, :56–58 |
  | `payment.refund`: front desk is refused; owner refunds | `verify-gym.mjs:41`, :42 |
  | `payment.reverse`: refused after a refund (the only case) | `verify-gym.mjs:43` |
  | `charge.waive` | `verify-gym.mjs:45` |
  | `visit.record`: 404 after role revocation; eligibility follows freezes | `verify-gym.mjs:52–53`; `verify-freezes.mjs:37`, :42, :56, :63 |

- **No test:**
  - `member.archive`, `membership.cancel` and `credit.apply`;
  - a successful `payment.reverse`, and the concurrent refund plus reversal that must return 409;
  - the `manager` role on any kind. The role exists (`20261017164708_gym_operations.sql:9`) but no
    suite creates one;
  - `anon` refusal.
- **Owners:**
  - **G16.api** box 3: a cross-tenant and per-role test for every gym RPC, with the inventory in its
    handoff;
  - **G17.api** box 2: the AC fixtures, including the 409 race;
  - **G19.api** box 1: `visit.record` cases (AC24).

### 1.6 `gym_account_v1(uuid,uuid)`

- **Defined:** `20261019121035_gym_read_models.sql:152`, then replaced at
  `20261019140429_gym_freezes.sql:174–183` to add `freezes`. The replace keeps its grants.
- **Grants:** `authenticated` (`…121035:153–154`).
- **Tested:**
  - `verify-gym.mjs:46`: the account agrees with the committed ledger;
  - `verify-gym.mjs:47`: an outsider gets 404;
  - `verify-freezes.mjs:35`: read by the owner before and after each freeze step (:38, :41, :48, :52,
    :55, :62, :73).
- **No test:**
  - reads by front desk or a manager;
  - a linked member reading their own account;
  - an assertion that no health field is returned;
  - `anon` refusal.
- **Owners:** **G16.api** box 3, and **G18.api** box 3 (a link exposes no health data).

### 1.7 `gym_dashboard_v1(uuid)`

- **Defined:** `20261019121035_gym_read_models.sql:172`.
- **Grants:** `authenticated` (:173–174).
- **Tested:** `verify-freezes.mjs:36`, the `activeMembers` count, owner only, at :42, :56 and :63.
- **No test:**
  - cross-tenant 404;
  - per-role reads;
  - every dashboard field except `activeMembers`;
  - `anon` refusal.
- **Owners:** **G16.api** box 3 (tenant and roles) and **G17.api** (figures).

### 1.8 `freeze_command_v1(jsonb)`

- **Defined:** `20261019140429_gym_freezes.sql:150`. It wraps `private.freeze_action(p, false)`, whose
  latest body is at `20261019140839_freeze_preview_binding.sql:3`.
- **Grants:** `authenticated` and `service_role` (`…140429:160`, :196–202).
- **Tested** (all in `verify-freezes.mjs`):

  | Kind or behaviour | Lines |
  |---|---|
  | `request` by the owner, front desk and a linked member | 39, 57, 59, 65 |
  | A replay returns the same result | 40 |
  | `approve`, then its replay | 53–54 |
  | A refused shift returns 409 | 47 |
  | A stale preview returns 409 | 51 |
  | A preview bound to another freeze returns 409 | 70 |
  | Only one of two concurrent approvals commits | 71–72 |
  | `unfreeze` | 61 |
  | `reject` | 64 |
  | `cancel` by a linked member | 65 |
  | Finance is unchanged throughout | 48, 55, 62, 73 |

- **No test:** the `manager` role, and `anon` refusal.
- **Owners:** **G16.api** box 3, and **G18.api** for the linked-member path.

### 1.9 `freeze_preview_v1(jsonb)`

- **Defined:** `20261019140429_gym_freezes.sql:162`, wrapping `private.freeze_action(p, true)`.
- **Grants:** `authenticated` and `service_role` (:172, :204–210).
- **Tested** (all in `verify-freezes.mjs`):

  | Behaviour | Lines |
  |---|---|
  | Front desk gets 403 | 43 |
  | A linked member gets 403 | 44 |
  | An outsider gets 404 | 45 |
  | Approval previews | 46, 49, 52, 69 |
  | An overlap is refused | 57 |
  | An allowance overrun is refused | 59 |
  | Unfreeze preview, with `remainingDays` and `gapDays` | 60 |

- **No test:** the `manager` role, and `anon` refusal.
- **Owner:** **G16.api** box 3.

**Totals.** Of the 9 exposed RPCs, 7 have at least one integration test and 2 have none
(`schedule_programme_v1`, `refresh_schedules_v1`).

**Gaps that cut across every RPC:**
- no suite calls any RPC without a session, so none of the `anon` revocations is tested;
- no suite uses the `manager` role.

## 2. Private functions that `authenticated` may execute (not exposed)

`private` is not an API schema (`supabase/config.toml:13`), and `anon` has no `usage` on it
(`20261017161031_member_core.sql:3`). These functions run only through the wrappers above or inside
RLS policies. Their tests are the tests of the wrapper or table that reaches them.

| Function | Reached through |
|---|---|
| `private.member_active()` | Member RLS policies |
| `private.complete_onboarding(…)` | §1.1 |
| `private.apply_member_operation(jsonb)` | §1.2 |
| `private.schedule_programme(…)` | §1.3 |
| `private.refresh_my_schedules()` | §1.4 |
| `private.gym_role(uuid)`, `private.gym_record_access(uuid,uuid)` | Gym RLS policies and gym definers |
| `private.gym_command(jsonb)` | §1.5 |
| `private.gym_account(uuid,uuid)` | §1.6 |
| `private.gym_dashboard(uuid)` | §1.7 |
| `private.freeze_action(jsonb,boolean)` | §1.8, §1.9 |

These private functions are closed to every API role and tested directly through SQL:
- `private.freeze_projection(…)`, by `verify-freeze-projection.mjs:10–30` through `docker exec … psql`;
- `private.training_set_eligible_v1`, `external_set_volume_v1` and `epley_e1rm_v1`, by
  `scripts/backend/sql/training-fixtures.sql` through `verify-fixtures.mjs` (AR-1 box 4).

These private functions have every API role revoked and no direct test, and are reached only from the
definers above:
- `refresh_schedule`, `apply_member_operation_core`, `gym_command_core`, `membership_end`,
  `gym_balance`, `allocate_credit(uuid,uuid,uuid,uuid)`, `assert_contract` and `validate_member_record`
  (a trigger).
- The three-argument `allocate_credit` is dropped (`20261019122347_function_lint_cleanup.sql:21`).

## 3. Exposed by the platform, not by a migration

`graphql_public` is in the API schema list (`supabase/config.toml:13`). Its `graphql` entry point
comes from Supabase's `pg_graphql`, not from these migrations, and it reads through the same table
grants and RLS. No project test touches it. The S1 Platform lane owns `supabase/config.toml`
(docs/23 §5). That lane should decide whether to keep the schema exposed. If it stays, the
cross-user and cross-tenant suites (MB-1 to MB-6, G16.api) should include one GraphQL read. No goal
card names this yet; it is for Codex to assign.

## 4. Proposals for later phases (not done here)

- **A staleness guard (QA-9 ratchet phase, database-free).**
  - A `node --test` check lists every `create [or replace] function public.<name>` in
    `supabase/migrations/` that is not later dropped, renamed or moved.
  - It fails when a name has no row in this inventory, so a new RPC cannot ship unlisted.
  - It sits beside the other database-free checks in `pnpm check`. Choosing that file and lane is part
    of the ratchet phase.
- **SQL function coverage (MB-1's database lane, optional).**
  - Run `pnpm backend:test` with `track_functions = 'pl'`, then read `pg_stat_user_functions` for the
    `public` and `private` schemas. That gives a per-function call count for every PL/pgSQL function.
  - Inlined `language sql` wrappers may not be counted, so the inventory above stays the record for
    them.
  - This has not been tried here; it needs the local stack.
