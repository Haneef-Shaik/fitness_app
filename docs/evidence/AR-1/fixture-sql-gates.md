# AR-1 shared fixture coordinator checks — 26 October 2026

Primary independently ran `rtk proxy pnpm check` from the isolated AR-1 goal worktree: PASS,
37 domain +126 mobile +22 planner tests =185; TypeScript server/client, lint/design and planner sync pass.

SQL ran against cached image `public.ecr.aws/supabase/postgres:17.11.0.004` in owned container
`fitlog_ar1_formula_20261026` (label `com.fitlog.test=ar1-formula`), no network, no ports, no host mounts,
no persistent volume; tmpfs cluster initialized using real initdb. Only the private schema and anon /
authenticated roles were bootstrapped before this one migration. This is a formula test, not full
Supabase migration replay or API isolation acceptance. Existing rebuild and historical data untouched.

`psql -X -h /tmp -U postgres -d postgres -v ON_ERROR_STOP=1 -v fixture=<exact file bytes>` consumed
`scripts/backend/sql/training-fixtures.sql` over stdin via docker exec. Python subprocess passed
UTF-8 file text directly as argv, without shell substitution or newline removal. Fixture SHA256:
`bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877`.

RED before migration: exit3 missing private.training_set_eligible_v1. Applied only
`20261025234317_training_formula_v1.sql` in this disposable cluster. GREEN:16 set vectors and2
session vectors pass, transaction ROLLBACK. One pending no-eligible-session aggregate vector remains
explicitly assigned MB-4 and is not asserted or counted as passing.

Mutation probes all pass their expected outcome: wrong expected e1RM, null changed to zero,
formula denominator changed30 to31, missing fixture variable and PUBLIC execute grant each fail.
Formula/grant changes occur inside the test transaction and roll back on connection close after
failure. Normal fixture re-runs after each group pass. Details: [fixture-sql-probes.json](fixture-sql-probes.json).
Reproduction input files are the branch fixture, SQL script and migration. Local raw logs are
`/tmp/fitlog-ar1-sql-{bootstrap,red,migration,green,bad-expected,null-is-not-zero,bad-formula,restored,missing-fixture,public-grant,after-grant-rollback}.log`.

Independent checkpoint review pending. Goal unmerged; full empty-to-head replay/schema diff,
persisted contract comparison and final owner ADR approval remain due.
