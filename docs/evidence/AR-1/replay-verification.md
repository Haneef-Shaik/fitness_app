# AR-1 isolated full replay — coordinator, 26 October 2026

All 15 migrations replayed from empty successfully using installed Supabase CLI2.121.0, then both
configured seeds ran. [Start log](replay-start.log); [source hashes](replayed-migrations.json).
A new directory `/tmp/fitlog-ar1-replay-20261026` was created exclusively for this test. It contains
only copied supabase/config.toml, migrations/, seed.sql and development-catalogue.sql. No environment,
credentials or data was copied. Config project_id changed to `fitlog_ar1_replay_20261026`, ports553xx
to563xx and edge inspector8183 to8283, after socket checks. Existing project/data remain untouched.

Commands from isolated AR-1 worktree (each prefixed `rtk proxy`):

```text
pnpm exec supabase --workdir /tmp/fitlog-ar1-replay-20261026 db start
pnpm exec supabase --workdir /tmp/fitlog-ar1-replay-20261026 db diff --local --schema public,private,storage --strict-coverage
pnpm exec supabase --workdir /tmp/fitlog-ar1-replay-20261026 db lint --local --schema public,private --level warning
```

All exit0. Final strict diff JSON has `diff:""` and `dropStatements:[]`; no schema changes found.
[Final diff](replay-final-diff.log), [lint](replay-lint.log). CLI initialized genuine auth and storage
schemas; no application auth/storage stubs were used. Query of supabase_migrations.schema_migrations
returned15. The initial formula-only test was separately bootstrapped and is not this replay.

Drift sensitivity: created only in the copied scratch migration directory a later migration
`29991231235959_ar1_drift_probe.sql` containing `create table public.ar1_drift_probe(id integer);`.
Ran db diff --local --schema public,private. CLI exit0 returned nonempty JSON diff containing
`DROP TABLE "public"."ar1_drift_probe";`, as expected (shadow has table, replay live does not).
No migration up ran; the scratch probe was removed in finally. Final strict diff above is empty.
[Probe detail](replay-drift-probe.json), [raw output](replay-drift-probe.log). The first harness
incorrectly required an --output file; normal-mode CLI returned diff in JSON stdout instead.
Actual structural detection succeeded; evidence was parsed from that JSON, then the clean run repeated.

On this replay database `supabase_db_fitlog_ar1_replay_20261026`, psql returned all eight stored
private.contracts; parsed objects exactly match snapshot0.1.0 persisted section:
[persisted comparison](persisted-compare.json). Exact shared fixture re-run PASS16sets+2sessions,
SHA256bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877:
[fixture output](replay-fixture.log). Formula ACL properties were asserted by that runner.

The original four local backend isolation/regression suites separately pass on the established
55321 stack, without applying the new migration: [backend log](baseline-backend.log). This is
regression evidence for existing behavior, not HTTP coverage of the new private formula functions.
No hosted CI, native-device or acceptance-ledger completion is claimed.

TypeScript missing mutations now run in an independent scratch copy of domain source and fixtures:
[mutation record](ts-mutations.json). Baseline/pass, formula30→31/fail namingAC03, bodyweight-no-load
null→0/fail namingthatset, restored/pass. Scratch contents restored byte-for-byte; original worktree
calculator and fixture never changed and matched original bytes. Initial scratch harness imported
from a missing dependency link and failed before tests; corrected to installed root node_modules;
those import failures are not counted as mutation evidence. M4.4 is set-level, while MB-4 owns the
still-pending no-eligible-session aggregate case.

Cleanup: labelled no-network tmpfs formula container fitlog_ar1_formula_20261026 removed after tests.
The exclusively owned full-replay Supabase DB remains available on56322 for testing the new guard
runners. Do not reset or stop any other project. Its temp source marker AR1-OWNED-TEST.txt establishes
ownership; later cleanup must target only fitlog_ar1_replay_20261026. No existing/user/historical data
was reset, upgraded or migrated. Cached image digest is [recorded](postgres-image-digests.json).

These are intermediate coordinator results. Final fixture hardening/runner wiring, SQL source guards,
independent final verification, owner G-1 approval and integration still remain.
