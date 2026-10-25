# QA-1 · Bootstrap reproducibility fix (G-1 and R-1)

**Date:** 25 Oct 2026 · **Author:** Claude foundation-fix worker for the Codex orchestrator
**Status:** these are source changes only. No gate result is claimed here. This note meets no QA-1
Done-when box. Codex will recreate the isolated local stack and run fresh gates.

## 1. Observed RED

- **G-1 (seed).** `bootstrap-gates.md` records that the first `pnpm backend:test` on a newly started
  database failed because it had no development catalogue. `verify.mjs:39-40` needs exercise
  `20000000-0000-4000-8000-000000000001`. `config.toml` seeded only `./seed.sql`, which holds no
  rows. The suites passed only after someone ran `seed-development.mjs` by hand, so a fresh stack could
  not pass by itself (`bootstrap-code-review.md` G-1).
- **R-1 (callback allow-list).** For the path `'/auth/callback'`, `expo-linking` `createURL` produces
  `fitlog:///auth/callback` (three slashes) in a standalone build. Codex confirmed this by reading the
  installed `src/createURL.ts`. The local allow-list listed only `fitlog://auth/callback` (two
  slashes), so GoTrue's exact match would reject the native `redirectTo`
  (`auth-callback-verification.md` R-1). Web served from `localhost` and Expo Go on loopback were not
  listed either.
- **Drift (F-up 3).** `AuthScreen.tsx:21` built `redirectTo` from the literal `'/auth/callback'`,
  while `MemberProvider.tsx:30` builds the expected URL from `AUTH_CALLBACK_PATH`.

## 2. Changes

| File | Change |
|---|---|
| `supabase/config.toml` `[db.seed]` | `sql_paths = ["./seed.sql", "./development-catalogue.sql"]`. A fresh `supabase start` or `db reset` loads the existing authored catalogue (20 rows, `on conflict (id, version) do nothing`). The catalogue file itself is unchanged. |
| `supabase/config.toml` `[auth]` | `additional_redirect_urls` keeps both existing entries and adds four exact URLs: `fitlog:///auth/callback`, `http://localhost:8081/auth/callback`, `exp://127.0.0.1:8081/--/auth/callback` and `exp://localhost:8081/--/auth/callback`. There are no wildcards and no guessed LAN addresses. |
| `apps/mobile/src/features/auth/AuthScreen.tsx` | Imports `AUTH_CALLBACK_PATH` from `@/lib/auth-callback` and passes it to `Linking.createURL`. The string value is the same, so behaviour does not change. The sender and the receiver now use one constant. |

## 3. Not changed, and limits

- No migrations, scripts, tests, status files or other config were touched. No commands, gates or
  git actions were run by this worker.
- Seed files are local only. `db push` skips them unless given `--include-seed`, so this does not
  affect a hosted database. The catalogue is still development content that needs human review
  before release.
- Expo Go on a LAN IP is still not allow-listed. A developer using that mode must add their exact
  URL locally. Hosted allow-lists stay with PL-2/PL-4.
- Still open: whether GoTrue accepts each new URL, a fresh-stack `backend:test` run, and the end-to-end
  sign-up and reset check on a device and on web (`auth-callback-verification.md` F-up 6).
