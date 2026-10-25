# QA-1 · F-1 fix: deep-link auth callback (RED observed, GREEN pending)

**Date:** 25 Oct 2026 · **Implementer:** Claude implementation worker for the Codex orchestrator
**Finding:** F-1 (HIGH) in [bootstrap-security-review.md](bootstrap-security-review.md): the deep link
accepted attacker-supplied session tokens (login CSRF / session swap).
**Status:** the fix is implemented and **not yet verified**. GREEN is not claimed here. Codex runs the
suite and records the result. This note is not evidence that any QA-1 Done-when box is met.

## 1. RED (observed by Codex, not by this worker)

- **Command:** `jest src/lib/__tests__/auth-callback.test.ts --runInBand` (in `apps/mobile`)
- **Result reported by Codex:** the suite fails because `../auth-callback` does not exist.
- **Log:** `/tmp/fitlog-auth-red.log`, written by Codex. This worker was denied read permission for that
  path, so the log is cited, not quoted. This worker ran no shell commands, tests, type checks or lint.

## 2. Regression contract (`apps/mobile/src/lib/__tests__/auth-callback.test.ts`, unchanged)

`createAuthCallbackHandler(auth, expectedCallbackUrl)(url)` resolves `true` only when every one of
these holds; otherwise it resolves `false` without throwing:

1. The URL is the exact runtime callback URL followed by a query. This is checked for the native
   (`fitlog:///auth/callback`), alternate-authority (`fitlog://auth/callback`), Expo Go and web forms.
   Other schemes, hosts, ports, user-info tricks, paths, trailing slashes and suffixes are refused.
2. There is no fragment and no token in the query (`access_token`, `refresh_token`, in either place,
   with or without a `code`).
3. There is exactly one non-empty `code`. Missing, empty, valueless and duplicated codes are refused.
4. `getSession` reports no current session, no error and does not throw.
5. `exchangeCodeForSession(code)` is called once with that code and reports no error and does not throw.

`setSession` is never called, on any path.

## 3. Change

| File | Change |
|---|---|
| `apps/mobile/src/lib/auth-callback.ts` (new) | `createAuthCallbackHandler`, the `CallbackAuth` interface and `AUTH_CALLBACK_PATH = '/auth/callback'`. |
| `apps/mobile/src/data/MemberProvider.tsx` | The raw `acceptUrl` parser has been removed, including its `setSession` implicit-token branch. `getInitialURL` and the `url` listener now feed `createAuthCallbackHandler(supabase.auth, Linking.createURL(AUTH_CALLBACK_PATH))`. |

**Design notes**

- **Exact match without a URL parser.** The handler compares the raw incoming string with
  `${expectedCallbackUrl}?`. Only the query after that prefix is parsed, and it must match
  `^code=([^&]+)$`. This avoids parser differentials between Hermes/Expo's `URL`, Node's `URL` and
  GoTrue's Go `url.Parse` (for example `fitlog:///x` against `fitlog://x`, or `host:port@evil`). It also
  means malformed URLs cannot throw. GoTrue's PKCE redirect appends only `code` to `redirect_to`, so
  the strict query loses no genuine callback.
- **Same URL on both sides.** The expected URL is `Linking.createURL('/auth/callback')`, which is the
  call `AuthScreen.tsx:21` makes for `redirectTo`/`emailRedirectTo`. `AuthScreen` still uses the
  string literal because it was outside this change's edit scope. Switching it to `AUTH_CALLBACK_PATH`
  is a follow-up.
- **Fail closed on misconfiguration.** If the expected URL is empty or already contains `?` or `#`,
  every link is refused.
- **Serialised processing.** Calls are chained on a queue per auth client (`WeakMap` keyed by the auth
  object). Each callback's signed-out check and exchange therefore finish before the next callback's
  check starts. Two links, such as `getInitialURL` and a `url` event, or the double effect run under
  React StrictMode, cannot both pass the preflight. The queue never rejects, because every step is
  caught and turned into `false`.
- **Minimal injected interface.** `CallbackAuth` exposes only `getSession` and
  `exchangeCodeForSession`, so the handler cannot call `setSession`. Supabase's `AuthClient` and the
  test fixture both satisfy it structurally.

## 4. Behaviour changes to note

- A signed-in member who opens a confirmation or password-reset link now stays in their current
  session, and the link does nothing. Previously the exchange replaced the session. F-1 allows
  "refuse or require explicit confirmation". This fix refuses, and a confirmation prompt is a possible
  MB-1/SC-5 follow-up.
- Links with any fragment, including Supabase error redirects (`#error=…`), are ignored. They were
  already ignored in practice, because they carry no code.
- Everything else in `MemberProvider` is unchanged: session bootstrap, `onAuthStateChange`, the
  auto-refresh `AppState` hook, cleanup and the workspace logic.

## 5. Not established here (pending Codex)

- GREEN for `auth-callback.test.ts`, and that the rest of the mobile Jest suite still passes.
- `tsc --noEmit` and `eslint` for the two edited source files.
- On-device confirmation that the OS delivers the callback string exactly as `Linking.createURL`
  builds it (native, Expo Go and web).
- The production Supabase redirect allow-list (owners PL-2/PL-4/MB-1). It should list only the exact
  callback URLs.

## 6. Coordinator verification after implementation

Codex ran `pnpm check` after the changes: **pass**, with 126 mobile tests (including the new
callback regression cases), 10 domain tests, 22 planner tests, TypeScript and lint/design guards.
In an isolated scratch copy of the handler and its regression suite, removing `url.includes('#')`
caused **four behavioral test failures**. The source in the working checkout was not mutated.
This establishes GREEN and a mutation check of the fragment guard; it does not establish native
device or real provider acceptance. Independent security review is recorded separately.
