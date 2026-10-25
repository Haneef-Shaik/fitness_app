# QA-1 · F-1 auth-callback fix: independent verification

**Date:** 25 Oct 2026 · **Verifier:** independent Claude security verifier under the Codex orchestrator.
I did not write the fix.
**Status:** this is evidence for F-1 from
[bootstrap-security-review.md](bootstrap-security-review.md) only. It does not make QA-1 Done; OW-1
still gates QA-1.

## 1. Scope and limits

- **Read:** `apps/mobile/src/lib/auth-callback.ts`, `lib/__tests__/auth-callback.test.ts`,
  `lib/supabase.ts`, `lib/auth-storage.{native,web}.ts`, `data/MemberProvider.tsx`,
  `features/auth/AuthScreen.tsx`, `app/auth/callback.tsx`, `app/_layout.tsx`, `app.config.ts`, and the
  `[auth]` section of `supabase/config.toml`. I also searched `apps/mobile` for every session-setting
  or URL-reading API (`setSession(`, `access_token`, `refresh_token`, `exchangeCodeForSession`,
  `getInitialURL`, `addEventListener('url'`, `useURL`, `verifyOtp`, `signInWithOAuth`,
  `signInWithOtp`, `updateUser`, `PASSWORD_RECOVERY`, `detectSessionInUrl`).
- **Not done:** I did not run any tests, typecheck, lint, build, git command or database command. I
  did not test on a real device, Expo Go, a browser, a local GoTrue server or any OAuth provider.
- **Coordinator results (reported to me, not run by me):** Codex saw the new tests fail (RED) before
  the module existed. It then reported that `pnpm check` passed: 126 mobile tests, 10 domain tests,
  22 planner tests, typecheck and lint.
- **Library sources:** the installed `expo-linking` and `supabase-js` sources could not be opened in
  this checkout. Statements about their behaviour come from their known and documented behaviour and
  from the fix's own test fixtures. They are not from reading the installed code.

## 2. Verdict on F-1

**F-1 is closed, based on reading the code.** I found no remaining critical or high security issue in
the deep-link sign-in path. One medium *functional* issue remains (§4, R-1). It fails closed: users
are blocked, but nothing is exposed.

| Question | Finding |
|---|---|
| Crafted-link token injection | **Closed.** No code in `apps/mobile/src` calls `setSession` or reads `access_token`/`refresh_token`; the search above found them only in the test file's attack fixtures. The handler type `CallbackAuth` (`auth-callback.ts:5-8`) offers only `getSession` and `exchangeCodeForSession`. `detectSessionInUrl: false` (`supabase.ts:9`) stops supabase-js from reading the web URL by itself. `MemberProvider.tsx:30-32` passes both the initial URL and later `url` events through the handler. No other part of the app reads incoming URLs. |
| Exact callback URL | **Holds.** The match is a raw string prefix: `${expected}?`. No URL parser is used, so no normalisation can turn a different origin into a match. Any URL containing `#` is refused (`auth-callback.ts:20`). The query must be exactly one non-empty `code` (`:11`): extra parameters, a duplicate `code`, or tokens sent as query parameters all fail. If the expected URL itself contains `?` or `#`, every link is refused. The tests cover lookalike paths, trailing slashes, other schemes and hosts, other ports, `user@host` tricks and Expo `/--/` variants on all four URL shapes (`auth-callback.test.ts:57-99`). |
| Sender and receiver URLs agree | **Holds in the client.** Sign-up and reset build `redirectTo` with `Linking.createURL('/auth/callback')` (`AuthScreen.tsx:21-23`). The handler expects `Linking.createURL(AUTH_CALLBACK_PATH)`, which is the same input to the same function in the same runtime. That gives the same string on native, Expo Go and web. **The server allow-list does not match the native URL; see R-1.** |
| PKCE configured | **Holds.** The client sets `flowType: 'pkce'` (`supabase.ts:9`). `signUp` and `resetPasswordForEmail` save the code verifier in `authStorage`: SecureStore on native, `localStorage` on web, which every tab of the origin shares. A code exchanges only together with this device's verifier. So a forged link, a code from the attacker's own account, or a code that another app registered for `fitlog://` intercepts cannot sign this device in. |
| Signed-in user silently swapped | **Closed.** `exchangeWhenSignedOut` (`auth-callback.ts:25-32`) refuses when a session exists, when `getSession` returns an error, and when it throws. All three cases are tested (`auth-callback.test.ts:114-130`). |
| Concurrent callbacks | **Holds by reading.** A per-client promise queue (`auth-callback.ts:13,38-39`) runs callbacks one at a time. It is keyed on the singleton `supabase.auth`, so the queue survives a remount of `MemberProvider`. The chain cannot reject, because every error becomes `false`. A second callback, or the same URL delivered twice through `getInitialURL` and a `url` event, runs only after the first exchange has finished, then sees the new session and is refused. A user sign-in that lands between `getSession` and the exchange cannot be swapped by an attacker's code, because the exchange still needs this device's verifier. **This queue has no test (F-up 4).** |
| Malformed URLs | **Holds.** `null`, an empty string, non-URLs and relative paths return `false`. A bad percent-encoding decodes to `''` and is refused (`:15,22`). A hostile but well-formed code value reaches the server only as an opaque `auth_code`, and the server rejects it. A replayed initial URL after a reload uses a code that has already been spent, so it fails harmlessly. |

## 3. Remaining high or critical issues

**None found.**

## 4. Remaining lower issues and deferred follow-ups

| # | Severity | Item | Owner |
|---|---|---|---|
| R-1 | **Medium (functional; fails closed)** | `supabase/config.toml:164` allows `fitlog://auth/callback` (two slashes). For the path `'/auth/callback'`, `Linking.createURL` produces `fitlog:///auth/callback` (three slashes) in a standalone or development build. The fix's own main native fixture uses that form (`auth-callback.test.ts:8`). GoTrue treats allow-list entries without wildcards as exact matches. By my reading, it would therefore reject the native `redirectTo` and fall back to `site_url` (`http://127.0.0.1:8081`, `:160`). The code would then arrive at the web root, where the handler correctly refuses it. Expected result on the local stack: native sign-up confirmation and password reset never finish inside the app. The same happens for Expo Go on a LAN IP and for web served from `localhost`; only URLs with host `127.0.0.1` pass, through GoTrue's `site_url` host rule. **Fix:** list the exact URLs that `createURL` emits, or derive both sides from one helper. Then check end to end on a device. No security impact. | MB-1; hosted allow-list PL-2/PL-4 |
| R-2 | Low | Residual login CSRF that comes with PKCE email links. If a signed-out victim types the *attacker's* email into sign-up or reset on their own device, and then opens a link the attacker forwards, the victim's stored verifier matches and the victim is signed into the attacker's account. This needs the victim to act first. It cannot replace an existing session. | MB-1 |
| R-3 | Low | A forged link with an invalid code may use up the device's pending verifier, if supabase-js clears it after a failed exchange. The user's genuine link then fails, and they must request a new email. This is a nuisance only. | MB-1 |
| F-up 1 | Functional | Password recovery is incomplete. The search found no `PASSWORD_RECOVERY` handling and no `updateUser({ password })` call. A reset link signs the user in but never asks for a new password. | MB-1 / SC-5 |
| F-up 2 | UX | `MemberProvider` ignores the handler's `false` result. A refused, expired or failed link, including a genuine link opened while signed in, gives the user no feedback. | SC-5 |
| F-up 3 | Drift | `AuthScreen.tsx:21` repeats the literal `'/auth/callback'` instead of importing `AUTH_CALLBACK_PATH`. | MB-1 |
| F-up 4 | Test gap | Add tests for: two concurrent callbacks where only the first exchanges; `AuthScreen`'s `redirectTo` equals the URL the handler expects; the wiring in `MemberProvider`; and a run against a real supabase-js client with no verifier. | MB-1 |
| F-up 5 | Hardening | For production, use Android App Links and iOS Universal Links instead of the `fitlog://` scheme only. Re-validate the callback flow if OAuth sign-in is added; there is none today. | PL-2 / MB-1 |
| F-up 6 | Validation | Run one end-to-end sign-up and one reset on a real device and on web against the local stack, after R-1 is fixed. This review cannot claim that check. | QA-1 / MB-1 |

## 5. Disposition

From the security side, F-1 can be recorded as **fixed (static verification)**, which clears the one
High blocker in bootstrap review §6. R-1 should be fixed or filed against MB-1 before anyone relies on
email confirmation or reset on native. F-up 6 remains open until someone runs it on a device.
