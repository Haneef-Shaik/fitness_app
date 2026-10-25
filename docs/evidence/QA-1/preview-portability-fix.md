# QA-1 · Preview-account credential path portability (F-8i, prepared, not verified)

**Date:** 25 Oct 2026 · **Status:** one-file edit on `main`, uncommitted. No command has run against it yet.

**Finding.** Low finding F-8i from the independent verification
([verdict-attempt-1.json](verdict-attempt-1.json)) blocked Done-when box 4.
`scripts/backend/preview-account.mjs` wrote credentials to the hard-coded path
`/private/tmp/fitlog-preview-account.json`. That directory exists only on macOS, so the write fails on Linux.

## Change

| File | Line | Before | After |
|---|---|---|---|
| `scripts/backend/preview-account.mjs` | 4–5 | — | `import { tmpdir } from 'node:os';` and `import { join } from 'node:path';` |
| `scripts/backend/preview-account.mjs` | 17 | `writeFileSync('/private/tmp/fitlog-preview-account.json', …)` | `writeFileSync(join(tmpdir(), 'fitlog-preview-account.json'), …)` |

The rest of the file is unchanged:

- **Basename:** still `fitlog-preview-account.json`.
- **File mode:** still `0o600`.
- **Safety guard:** the `supabase status` call and the `127.0.0.1:55321` guard are the same.
- **API calls:** the admin user create, password login and `complete_onboarding` calls are the same.
- **Account values:** the synthetic `@example.invalid` email, random password, profile name, date of birth, timezone, locale and notice values are the same.
- **Payload:** the file still holds `{ email, password, id }`.
- **Console output:** the script still prints one line with no credentials in it.

No other file changed.

## Behaviour note

On Linux, `tmpdir()` usually resolves to `/tmp`. On macOS it resolves to the per-user `$TMPDIR`
(`/var/folders/…/T`), not `/private/tmp`. So on macOS the file now lands in a different directory.
Anyone who used to open `/private/tmp/fitlog-preview-account.json` for browser testing should now look in
`$TMPDIR`. [portability.md](portability.md) line 32 still names the old path. I did not edit it because
it is outside this fix's scope.

## Verification still needed

None of these steps has run. Do not print the credential file's contents.

1. **Static.** `node --check scripts/backend/preview-account.mjs` passes, and
   `rg -n '/private/tmp' scripts/backend` returns nothing.
2. **Path resolution, no account created.** Confirm that
   `node -e "console.log(require('node:path').join(require('node:os').tmpdir(), 'fitlog-preview-account.json'))"`
   prints a path under `/tmp` on Linux (or CI) and under `$TMPDIR` on macOS.
3. **Optional: this step creates a synthetic local account.** Run it only if the orchestrator wants it.
   With the local stack up on `127.0.0.1:55321`, run `node scripts/backend/preview-account.mjs`. Record only
   the exit code and the single console line. Then check the file's mode with
   `stat -c %a` (Linux) or `stat -f %Lp` (macOS) and expect `600`. Do not print the file.

## Known limits (unchanged by this fix)

- `writeFileSync`'s `mode` applies only when the file is created. If a file with looser permissions is
  already at that path, it keeps those permissions. The old code behaved the same way.
