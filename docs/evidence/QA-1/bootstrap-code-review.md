# QA-1 · Bootstrap foundation code review (preparation)

**Date:** 25 Oct 2026 · **Reviewer:** independent `code-reviewer` role for the Codex orchestrator
**Status:** preparation evidence only. QA-1 is not claimed, and this report meets no Done-when box. Security F-1 is being fixed separately. Its files (`MemberProvider.tsx`, `lib/auth-callback.ts` and its test) were read, but the fix was not reviewed. Line numbers in those files are as read today.

## 1. Scope and method

- **Read, statically:** `apps/mobile/src/data/*`, `src/lib/{supabase,auth-storage*}.ts`, `app.config.ts`, `jest.config.cjs`; `packages/domain/src/*`; `scripts/backend/*`; `supabase/config.toml`, `seed.sql`; `mobile-ci.yml`; root `package.json`, `.npmrc`, `pnpm-workspace.yaml`, `.gitignore`; and `scripts/plan/build.mjs` in check mode only.
- **Library behaviour:** one point was confirmed by reading the installed `@supabase/auth-js` 2.118.0 source.
- **No commands were run.** Every pass result quoted here is the coordinator's (`bootstrap-gates.md`).

## 2. Verdict

- **QA-1 gate blocker: 1 (G-1).** On a fresh local stack, `pnpm backend:test` cannot pass, because nothing seeds the catalogue row that `verify.mjs` needs. A one-line config fix is below.
- **Gate prerequisite (G-2).** Files the clean clone needs are untracked today, so they must go into the commit pieces.
- **No critical or high code defects outside F-1.** The medium and low defects C-1 to C-5 are filed against their owning goals. None of them blocks QA-1.

## 3. Clean-clone gate (QA-1 Done-when 2 and 3)

### G-1 · HIGH (gate blocker) · A fresh stack has no catalogue, so `backend:test` fails

- **Where:** `scripts/backend/verify.mjs:39-40` asserts that exercise `20000000-0000-4000-8000-000000000001` exists ("Run seed-development.mjs first"). `supabase/config.toml:67-72` seeds only `./seed.sql`, which holds two comments and no rows (`seed.sql:1-2`). Only `seed-development.mjs:33-34` loads the 20 rows, and nothing in `package.json:18` runs it.
- **Failure path:** a clone runs `supabase start` (a new volume gets the 14 migrations and the empty seed), then `pnpm backend:test`. The first suite aborts at `verify.mjs:40`, and the `&&` chain skips the other three. This matches the coordinator's first run.
- **Masking risk:** `config.toml:5` fixes `project_id`. A clone on the same machine therefore attaches to the *existing* containers and volume, which were seeded by hand and migrated from the working tree. Without a reset, a "fresh clone" run would pass without testing either the clone's migrations or its seed path.
- **Required fix (recommended):** set `sql_paths = ["./seed.sql", "./development-catalogue.sql"]` at `config.toml:72`, and commit the generated `supabase/development-catalogue.sql` (`seed-development.mjs` produces the same output every run). A fresh `start` and every `db reset` then load it. Seed files are local only: `db push` skips them unless given `--include-seed`. PL-1's future backend CI job gets a seeded database from the same change.
- **Alternatives:** prefix `backend:test` with `node scripts/backend/seed-development.mjs &&`, which rewrites a tracked file on every run and depends on the hard-coded container name. Or have `verify.mjs` create its own member-owned exercise, which is the most self-contained option but changes the test.

### G-2 · Gate prerequisite · The commit pieces must include untracked files the clone needs

- `scripts/plan/build.mjs:22` imports the untracked `scripts/plan/sync.mjs`. Leave it out and `pnpm check` fails with `ERR_MODULE_NOT_FOUND`. `build.mjs:44` exits if the untracked `docs/plan/ACCEPTANCE.md` is missing.
- `mobile-ci.yml:28` reads the untracked `.node-version`. `pnpm install` needs the untracked `pnpm-lock.yaml`, `pnpm-workspace.yaml` (hoisted linker; `onlyBuiltDependencies` includes `supabase`) and `.npmrc` (`engine-strict`).
- Keep `apps/mobile/.env.local` out; `.env.*` already ignores it. `error.log` and `artifacts/` are not ignored (security review §5).

### G-3 · Proposed gate procedure (for the coordinator; not run here)

From the clone, in order:

1. `pnpm install --frozen-lockfile --strict-peer-dependencies` (the CI flags, `mobile-ci.yml:31`)
2. `pnpm check`
3. `pnpm --filter @fitlog/mobile exec expo install --check` (`:33`; needs network)
4. The Android and iOS `expo export`
5. `pnpm exec supabase start`, then `pnpm exec supabase db reset`
6. `pnpm backend:test`

**`db reset` wipes the shared local stack**, including development data and the preview account, so the owner should approve it first. The coordinator's observations do not cover `--strict-peer-dependencies` or `expo install --check`. Run both, so that this gate predicts what PL-1's CI will do.

## 4. Foundation defects deferred to owning goals (not QA-1 blockers)

### C-1 · MEDIUM · An offline cold start after token expiry shows sign-in, and the cached workspace is unreachable

- **Where:** `apps/mobile/src/data/MemberProvider.tsx:27` maps any `getSession()` error to `session = null`, and `:36` then renders `AuthScreen`. In the library, `auth-js` `GoTrueClient.js:2544-2570` returns `{ session: null, error }` when the refresh fails and the stored access token has expired. A retryable (network) error leaves the stored session in place (`:4296-4313`).
- **Failure path:** the member last used the app more than `jwt_expiry` ago (3600 s, `config.toml:166`) and opens it with no signal, which is common in gyms. The refresh fails and the sign-in screen appears. The encrypted cache, the queued outbox and the offline profile fallback at `:50`, which was built for exactly this case, are never reached, so the member cannot log a set. Nothing is lost; the workspace comes back once a refresh succeeds online.
- **A defect, not a missing feature:** the foundation already ships the offline path, and this line defeats it.
- **Fix:** on `AuthRetryableFetchError`, keep the stored session's user ID, open the local workspace offline, and refresh when connectivity returns. Keep this out of the F-1 change. **Owner:** MB-3 (AC32, "logging works with the backend down"), with MB-1 (sessions).

### C-2 · MEDIUM · A missing database key with an existing database file bricks the workspace

- **Where:** `apps/mobile/src/data/cache.native.ts:11-15` creates and stores a new key whenever none is found, without checking whether a database file already exists. `:18-19` checks only `PRAGMA cipher_version`, which reports the library version; it does not prove the key opens the file. The error screen at `MemberProvider.tsx:69` offers only Retry, with no sign-out.
- **Failure path:**
  1. The keychain entry is gone but `fitlog_<id>.db` remains, for example after a restore onto a new phone. The key is `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, so it is not restored, while backups include app files by default and `app.config.ts:11-12` sets no exclusion.
  2. A new key is stored, `:20` fails with "file is not a database", and the raw error is shown.
  3. Every Retry repeats the failure, now with the new key persisted. Recovery needs the app's data cleared.
- **Fix:** verify the key with a real read right after `PRAGMA key`. If the key is new or the check fails, delete the unreadable file (its contents cannot be recovered) and recreate it. Exclude the database from backups, and add sign-out to the error screen. **Owner:** MB-3 (encrypted local store).

### C-3 · LOW · A cache handle leaks when the first profile load fails

- **Where:** `MemberProvider.tsx:46` opens the cache. If `loadProfile` fails and there is no cached profile, `:50` rethrows without `cache.close()`.
- **Failure path:** a fresh install is signed in but the server is unreachable. Each Retry opens another SQLCipher connection.
- **Fix:** close the cache in a `catch`. **Owner:** MB-1.

### C-4 · LOW · Synced operations are never pruned (adds to security F-5)

- **Where:** `member-store.ts:55` marks operations `synced` but never removes them, and `:20` already ignores them. The `session.create` and `session.update` payloads carry the full session (`:93`, `:102`).
- **Failure path:** the array grows with every workout ever logged, and `cache.native.ts:27` re-serialises all of it on each set commit. That adds to the risk to MB-3's p95 < 100 ms budget.
- **Fix:** compact synced operations once they are past an idempotency horizon. **Owner:** MB-3.

### C-5 · LOW · Session-storage chunking has no test

- **Where:** `apps/mobile/src/lib/auth-storage.native.ts:14-24`. The write order (chunks, then metadata, then deleting old chunks) is crash-safe by reading, but no test pins it. `getItem` returns `null` if any chunk is missing (`:12`).
- **Fix:** unit tests against a mocked SecureStore for interrupted writes and size limits. **Owner:** MB-1.

## 5. Future features versus foundation defects

These are absent by design, not defects; security review §4 already lists them: member–gym linking (G18.api); staff management (G16.api); the provisional acknowledgement for offline gym payments (G17.app); the conflict-review UI (MB-3); the CI backend job (PL-1); and test coverage beyond `theme`/`ui` (`jest.config.cjs:5`, QA-9).

C-1 and C-2 are different: they are defects in partly built features. MB-3 must not assume that offline cold start or key recovery works.

## 6. Checked by reading, no material findings

- **Error codes:** the member RPCs raise only `22023`, `40001` and `42501` (`member_operations.sql`, `workout_correction_commands.sql`, `function_lint_cleanup.sql`), which matches the client classifier at `member-store.ts:58-59`. The gym codes, including `PT404`, match `gym-outbox.ts:23`.
- **Sync:** the per-operation status updates and the remote merge read the snapshot inside `serialize`, so concurrent local writes are not overwritten. Entities with unsynced operations keep their local state (`member-store.ts:65-74`).
- **Session storage:** concurrent `setItem` calls leave the metadata pointing at intact chunks, and the keys use only characters SecureStore allows.
- **Domain:** local dates come from `Intl` in the profile's zone (`calculations.ts:3-7`). Nonexistent DST times are refused (`dates.ts:5-18`). Paise are exact integers (`finance.ts:5-9`). Month boundaries are end-exclusive (`calculations.ts:118-125`).
- **Backend suites:** the projection fixtures use fixed dates, and the other suites use today's date in `Asia/Kolkata`; no clock-dependent failures found. Every suite refuses a non-local host.
- **Plan check:** `plan:build --check` (`build.mjs:62-71`) only reads files. It runs no Python and does not depend on the date, so it works on a clean clone once G-2 holds.

## 7. Limits (unverified)

- This reviewer ran no tests, builds, installs, database commands or git commands. Every "pass" above is the coordinator's observation.
- C-1's library behaviour comes from reading the installed `auth-js` source, not from a run. C-2's trigger depends on platform backup defaults and on where expo-sqlite stores its files. Neither was tested on a device.
- That the Supabase CLI seeds on the first `start` and on `db reset`, and skips seeds on `db push`, comes from its documentation. It was not run.
- Not reviewed: the F-1 fix and its new tests, screens under `features/`, migration SQL beyond its error codes (the security review covers it), and the plan tooling beyond check mode.
- The CI action SHA pins were not checked against GitHub (no network). The results of `--strict-peer-dependencies` and `expo install --check` are unknown.
