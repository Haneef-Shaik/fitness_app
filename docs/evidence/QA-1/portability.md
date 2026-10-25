# QA-1 · Backend script portability (prepared, not verified)

**Date:** 25 Oct 2026 · **Status:** edits prepared on the uncommitted `v2/develop` bootstrap checkout. QA-1 is
not claimed and OW-1 still gates it. No suite has run against these edits yet.

**Scope item.** [GOALS.md QA-1](../../plan/GOALS.md#qa-1--land-the-post-reset-foundation-on-main), scope 5:
`scripts/backend/*.mjs` must not need the local `rtk` tool at runtime.

## Change

Each script used `execFileSync('rtk', ['proxy', …])` to reach `pnpm` or `docker`. Each call now runs
`pnpm` or `docker` directly. Every other argument, the `stdio`/`input`/`encoding` options, the
`127.0.0.1:55321` guards, the container name, the SQL and the assertions are unchanged.

| File | Line | Before | After |
|---|---|---|---|
| `scripts/backend/environment.mjs` | 3 | `rtk proxy pnpm exec supabase status -o json` | `pnpm exec supabase status -o json` |
| `scripts/backend/preview-account.mjs` | 5 | `rtk proxy pnpm exec supabase status -o json` | `pnpm exec supabase status -o json` |
| `scripts/backend/verify.mjs` | 6 | `rtk proxy pnpm exec supabase status -o json` | `pnpm exec supabase status -o json` |
| `scripts/backend/verify-gym.mjs` | 4 | `rtk proxy pnpm exec supabase status -o json` | `pnpm exec supabase status -o json` |
| `scripts/backend/verify-freezes.mjs` | 4 | `rtk proxy pnpm exec supabase status -o json` | `pnpm exec supabase status -o json` |
| `scripts/backend/seed-development.mjs` | 34 | `rtk proxy docker exec -i supabase_db_fitlog_rebuild_20261017 psql …` | `docker exec -i supabase_db_fitlog_rebuild_20261017 psql …` |
| `scripts/backend/verify-freeze-projection.mjs` | 12 | `rtk proxy docker exec supabase_db_fitlog_rebuild_20261017 psql …` | `docker exec supabase_db_fitlog_rebuild_20261017 psql …` |

Seven call sites in seven files. A search of `package.json`, `.github/` and `scripts/**/*.mjs` finds no
other programmatic `rtk` call. People typing commands in a shell still use `rtk`. Only subprocesses that
the scripts start call `pnpm` or `docker` directly.

## Verification still needed

None of these steps has run yet. Do not print `supabase status` output, `apps/mobile/.env.local` or
`/private/tmp/fitlog-preview-account.json`, because they contain keys or passwords.

1. **Static.** `rg -n rtk scripts/backend` returns nothing, and `node --check` passes for all seven files.
2. **Suites, with the local stack running** (`supabase_db_fitlog_rebuild_20261017` up, API on
   `127.0.0.1:55321`). `pnpm backend:test` runs `verify.mjs`, `verify-gym.mjs`,
   `verify-freeze-projection.mjs` and `verify-freezes.mjs`, and all four pass. Record the result lines.
3. **No `rtk` on `PATH`.** Repeat step 2 with a `PATH` that leaves out the directory that holds `rtk`
   (`command -v rtk` prints nothing). This is the actual portability proof.
4. **`pnpm backend:env`.** It writes `apps/mobile/.env.local` with mode `0600`. This overwrites the
   existing file, which was already the behaviour. Check only the exit code and the console line.
5. **Optional, since they write data.** `node scripts/backend/seed-development.mjs` rewrites
   `supabase/development-catalogue.sql` and inserts with `on conflict do nothing`.
   `node scripts/backend/preview-account.mjs` creates a synthetic local account. Run them only if the
   orchestrator wants coverage of the `docker -i` stdin path beyond `verify-freeze-projection.mjs`.
6. **QA-1 done-when (later).** `pnpm backend:test` passes on a fresh clone of `main`, as the second
   done-when line requires. That cannot happen until OW-1 clears and the foundation is on `main`.

## Known limits (not fixed here)

- `execFileSync('pnpm', …)` without `shell: true` does not resolve `pnpm.cmd` on Windows. CI is
  `ubuntu-latest` and the team uses macOS, so this is out of scope. File it against the goal that owns
  Windows support if one is added.
- `.github/workflows/mobile-ci.yml` does not run `backend:test`. Adding a Supabase-backed CI job is not
  part of this change.
- The container name `supabase_db_fitlog_rebuild_20261017` is still hard-coded in two scripts. Changing
  it was out of scope.

## Coordinator verification after the worker handoff

Codex subsequently checked all seven files with `node --check`, loaded the existing authored
development fixtures into the isolated local stack, and ran all four backend suites successfully.
The same suites then passed with RTK absent from PATH (the harness asserted that `which rtk`
failed first). See [bootstrap-gates.md](bootstrap-gates.md) for result lines and limits. The
fresh-clone-of-main gate remains pending. Environment-file generation and optional preview-account
creation were not rerun because they overwrite existing local configuration or create additional
fixture accounts.
