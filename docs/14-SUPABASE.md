# Supabase — database, storage and auth

**Decision (26 Sep 2026, owner):** Supabase is FitLog's platform for **Postgres, Storage and Auth**,
including **Google and Apple sign-in** and **photo thumbnails** from Storage's image
transformations. This supersedes L1's "FitLog keeps its own auth" — the database and storage half
of L1 stands as built.

What does **not** change: the FitLog API stays the only way to FitLog's data. The app uses
Supabase's client **for signing in and nothing else** — no Data API, no RLS, no Realtime — because
every write has to pass the API's rules (the offline outbox, idempotency keys, the workout
invariants). `scripts/migrate.sh` keeps revoking the Data API's grants on every release.

---

## Decisions

| # | Decision | Why |
|---|----------|-----|
| S1 | **One identity:** `users.id` = Supabase's `auth.users.id`. The FitLog row is created on the first authenticated request, with the email from the token | No mapping table to drift; every existing foreign key keeps pointing at `users.id` |
| S2 | **The API verifies Supabase's access token** — signature (the project's JWKS for asymmetric keys, or the legacy HS256 secret), issuer, audience `authenticated`, expiry | Current projects and the local stack sign with asymmetric keys (ES256, published as JWKS); older hosted projects with a shared HS256 secret. Both paths are tested |
| S3 | **Sign-out is immediate:** a token whose Supabase session no longer exists (`auth.sessions`) is refused, as a revoked refresh family was before | "Sign out other devices" and account deletion must not leave a working token for up to an hour |
| S4 | **Access tokens live 15 minutes** (`jwt_expiry = 900`), as FitLog's did | Same exposure window as before the move |
| S5 | **Deleting an account** needs a sign-in in the last 10 minutes (the token's `amr` timestamp) plus the typed confirmation; the API deletes FitLog's data, then the auth user through the Admin API (service-role key, server only) | Google and Apple users have no password to re-enter; a recent sign-in works for every method |
| S6 | **The web deletion page** (Play's requirement) proves the address with a one-time code emailed by Supabase, then deletes | Works for password, Google and Apple accounts alike |
| S7 | **Google:** native Google Sign-In → `signInWithIdToken`. **Apple:** native on iOS (`expo-apple-authentication`) → `signInWithIdToken`; not offered on Android. A button shows only when its provider is configured | Native flows are what both stores expect; Apple requires Sign in with Apple on iOS once Google is offered (App Store 4.8) |
| S8 | **Email confirmation is ON** — a password sign-up confirms its address before its first sign-in. *Changed on 26 Sep from "off, as A-06 decided"*, found in the security pass: with confirmation off, Supabase treats a password sign-up's address as verified, and it links sign-ins that share a verified address automatically (this cannot be switched off). Someone could sign up with **your** address and a password they know; your later "Continue with Google" would be linked into **their** account, which they can still open with that password. Google and Apple verify their addresses themselves | Account pre-hijacking is the standard attack on social sign-in; confirming the address closes it. The cost is one email before a password account's first use |
| S9 | **Auth email** (reset, confirm, change address, one-time codes) is sent by Supabase through the project's SMTP (Resend) | FitLog's own mail sender is no longer needed for auth |
| S10 | **Thumbnails** come from Storage's image transformation (signed render URLs with width/quality); the original upload is unchanged | Lists and grids stop downloading full-size photos |

## Phases

1. **Local Supabase, database and storage** — `pnpm supabase start` (Docker). Migrations and the
   Data-API hardening against Supabase's Postgres through its transaction-mode pooler; the full API
   suite; photo uploads through Storage's S3 endpoint.
2. **Thumbnails** — signed render URLs from Storage.
3. **Auth, server** — token verification (S2, S3), provisioning (S1), deletion (S5, S6); the
   API's own login, refresh, reset, verification and password endpoints removed.
4. **Auth, app** — `@supabase/supabase-js` for sign-in only, the session in the device keychain;
   email and password, Google, Apple; reset and change-address links back into the app.
5. **Proof** — the acceptance suite on the emulator against the local stack; this doc, the runbook
   (docs/12) and the launch plan updated.

## Running it locally

```bash
pnpm install                      # the Supabase CLI is a root dev dependency
pnpm supabase start               # Docker: Postgres, pooler, Auth, Storage, Studio, Mailpit
pnpm supabase status              # URLs and keys for the local stack
```

Studio: <http://127.0.0.1:54323> · emails the stack sends: <http://127.0.0.1:54324>.

## Status

### Phase 1 — database and storage: done (26 Sep)

Proven against a local Supabase (CLI 2.118, Postgres 17.6, Storage 1.77):

| Check | Result |
|---|---|
| The API suite on Supabase's Postgres, direct | 1,054 pass |
| The API suite **through the transaction-mode pooler** (`DB_POOL_MODE=transaction`) | 1,054 pass |
| `scripts/migrate.sh` through the pooler: migrations, Data API lockdown, reference data | at head; `anon`, `authenticated` revoked; 7,838 foods, 297 exercises |
| The Data API with the public anon key, on `users`, `foods`, `exercises` | `42501 permission denied` on each |
| The storage tests against Storage's S3 endpoint | 42 pass (moto: 41 + 1 skipped) |

What it found — none of it visible to the fakes the suite used before:

- **Deleting photos failed on Supabase Storage.** botocore sends `DeleteObjects` without a
  `Content-Type`, and Storage then reads no body at all. The store now says `application/xml`; a
  test pins the header.
- **An expired signed URL is a 400 on Supabase, 403 on AWS.** Expiry is enforced; the test now
  accepts either refusal and requires the "expired" code.
- **The suite could not run through a pooler.** Its own engines, the limiter's engine under test,
  and the release-script test's environment all bypassed the pool mode. Every test engine is now
  built like the API's (`make_engine`), and a scratch database is dropped `WITH (FORCE)` because the
  pooler holds its own connection to it.

### Phase 2 — thumbnails: done (26 Sep)

`GET /v1/progress-photos` now returns a `thumbnail_url` per photo: a **signed render URL** from
Storage's image transformation (288 × 384, cover, quality 70 — twice the grid's 96 × 128 tile), and
the grid draws from it; `image_url` stays the original. A 1200 × 1600 test photo renders to about
**1 KB** against 30 KB.

- Signed one photo per request: Storage's batch-sign endpoint ignores transforms. Twelve at a time,
  and each URL is reused until half its life is gone, so scrolling back does not re-sign.
- Needs `SUPABASE_URL` and `SUPABASE_SECRET_KEY` on the server; the secret key never reaches the app.
  Without them, or if Storage refuses, there is no thumbnail and the grid shows the original.
- Hosted, image transformations are a **Pro** feature (the runbook already specifies Pro).
- Tests: `test_thumbnails.py` (8, one of them against real Storage when `SUPABASE_TEST_URL` is set),
  and the grid test in `shellScreens.test.tsx`.

### Phase 3 — auth, server: done (26 Sep)

The API no longer signs anybody in. It accepts a Supabase access token and nothing else:

| What | How | Proven by |
|---|---|---|
| **Verification** (S2) | ES256/RS256 against the project's JWKS (cached 10 min, re-fetched at once for an unknown key), or the legacy HS256 secret when configured; `iss`, `aud=authenticated`, expiry, `sub`, `session_id` required; anonymous sign-ins refused | `test_supabase_auth.py` — expired, wrong audience, other project, forged key, HS256 without a secret (no algorithm confusion), unsigned, anonymous, no session, key rotation, Supabase unreachable |
| **Sign-out is immediate** (S3) | the token's `session_id` must still be in `auth.sessions` | "sign out other devices" against the real stack: the other device's token 401s at once |
| **One identity** (S1) | `users.id` = `auth.users.id`; account + profile created on the first call, name from sign-up or Google/Apple; address follows Supabase | concurrent first calls make one account; an address held by another account is a 409, never a merge |
| **Deleting** (S5) | a sign-in in the last 10 minutes (`amr`) + DELETE; data first and committed, then the Supabase user (Admin API) | an old sign-in gets 403 REAUTH_REQUIRED; Supabase down mid-delete leaves no data and a retry finishes |
| **Web deletion page** (S6) | email → Supabase emails a 6-digit code → code + DELETE | against the real stack and a real email (Mailpit): wrong code deletes nothing, the right one deletes both, an unknown address gets the same page |
| **Push** | a token names its Supabase session; tokens of ended sign-ins are dropped before a send | `test_push.py` |

Removed with it: FitLog's login, sign-up, refresh, logout, password reset, email verification, change
password / email and "sign out other devices" endpoints; the password hash, refresh-token and
emailed-link tables (migration m18); FitLog's mail sender; the JWT, email and login rate-limit
settings. Signing in is limited by Supabase Auth.

- **The code email needs a template** that contains `{{ .Token }}`: the default Magic Link email is a
  link alone. Local: `supabase/templates/magic_link.html` (config.toml). Hosted: paste it into
  *Authentication → Email Templates → Magic Link*.
- **Scripts sign in through Supabase**: `scripts/supabase_signin.py` (seeds, acceptance checks,
  drills). Locally it asks `supabase status` for the URL and keys, so no key is in the repository.
- The suite runs the real verification path: tokens signed by a test key, published in a test JWKS
  over a mock transport, and a minimal `auth` schema on plain Postgres (the real one on Supabase's):
  **981 pass on plain Postgres, 981 on Supabase through the pooler.**

Run it yourself:

```bash
pnpm supabase start
docker exec supabase_db_fitlog psql -U postgres -c "CREATE DATABASE fitlog_test"   # once
DB_POOL_MODE=transaction \
TEST_DATABASE_URL=postgresql+asyncpg://postgres.pooler-dev:postgres@127.0.0.1:54329/postgres \
  uv run --directory services/api pytest
```

### Phase 4 — auth, app: done (26 Sep)

The app signs in with Supabase Auth and sends its access token to the FitLog API; nothing else in it
talks to Supabase.

| What | How |
|---|---|
| **The client** (`src/lib/supabase.ts`) | `@supabase/supabase-js`, **PKCE**, the session in the keychain (SecureStore, in 1,800-character pieces — Android's store is only promised ~2 KB a value); refreshed while the app is in front, stopped behind it |
| **The session** (`src/lib/session.tsx`) | the same four states as before. **Offline is not signed out** (O10): a stored sign-in that cannot be refreshed for want of signal opens the app on the last account; only an *answer* from Supabase ends it. An ended sign-in is said over the open screen (L-05), and signs back in with the password, Google or Apple |
| **The API client** (`src/lib/api.ts`) | a 401 asks Supabase for one refresh, shared by every request refused at once (a refresh token presented twice ends the sign-in), then replays once |
| **Sign-up** (A-03) | email and password → "Check your email" (S8), with the link sent again on request; the link signs the phone in (`app/auth/callback.tsx`). Opened on another device, it still confirms the address — log in on the phone |
| **Log in** (A-04) | a wrong password under the password; an address not yet confirmed offers its link again |
| **Reset** (A-05) | the email carries a link **and a 6-digit code**: the link works only on the phone that asked (PKCE), so an email read on a laptop is not a dead end — "I have a code" takes it. The new password signs every other device out |
| **Security** (K-02) | changing the password or address asks for the current password first; an address changes once links at **both** addresses are opened (the first says "halfway", not "failed"). Google and Apple accounts see how they signed in instead of forms that cannot work |
| **Deleting** (K-07) | typed DELETE; a sign-in older than 10 minutes gets REAUTH_REQUIRED, and the screen asks for the password — or Google / Apple — and retries |
| **Google, Apple** (S7) | `ProviderButtons`: native Google Sign-In, and Apple's own button on iOS only, each shown only when configured. Without client ids the build shows the email form alone |
| **Emails** | Supabase's templates in `supabase/templates/`: confirm, reset (link + code), one-time code, and security notices when a password or an address changes |

Proven against the local stack (Auth, Mailpit): the reset email carries both, a wrong code is
refused (`otp_expired`) and the right one signs in; a password under 10 characters is refused; a
changed password emails a notice; an address change needs both links, the first redirecting with
`?message=` and the second with a PKCE `?code=`. App suite: **1,311 tests, 127 files** — the
Supabase client replaced by a steerable fake (`src/lib/__mocks__/supabase.ts`), with tests for every
new screen and state.

**A review of the app's auth code (26 Sep) found 2 high, 3 medium and 4 low; all fixed, each with a
test**, checked against auth-js 2.117's source:

- **High — the new-password form trusted any signed-in phone.** `fitlog://reset-password` opened on
  an unlocked phone set a new password without the old one (and so could then pass the deletion
  re-check). It now shows only after a reset link — known from the `redirectType` Supabase recorded
  when the reset was asked for, not from anything in the link — or the reset code.
- **High — signing out offline did not.** With an expired token and no signal, supabase-js's
  `signOut()` returns an error and **keeps** the session; the next online launch signed the same
  person back in. The app now forgets the stored session itself, and a refresh already in flight
  cannot bring it back.
- **Medium — an offline cold start sat on the splash for ~25 s**: `getSession()` retries an expired
  token's refresh with backoff before answering. The app waits 3 s, then opens on the stored
  sign-in, and loads the account when a refresh succeeds or the app returns to the front.
- **Medium — after an offline start, the account was unknown for the rest of the run**, so the
  session-expired dialog could not sign back in. The stored session now supplies the address and how
  they signed in.
- **Medium — re-signing in with Google or Apple accepted a different account**, switching whose data
  was on screen (and a deletion would have deleted the other account). It is refused; Google's
  chooser is now always shown, and forgotten on sign-out.
- **Low:** Apple's one-time name reaches the account (a token refreshed after it is saved); "other
  devices signed out" is no longer claimed when they could not be; a spent link with the API out of
  reach signs in offline instead of "that link did not work"; a link's own error text is never shown
  (anyone can write a link).
- **Kept deliberately:** sign-up says when an address already has an account. Supabase hides it;
  without it, someone who forgot they had an account waits for an email that never comes. Sign-up is
  rate-limited by Supabase Auth.
- **Inherent to native Google sign-in:** on Android, choosing the phone's Google account needs no
  password, so for a Google account "sign in again" proves the phone, not the person. The deletion
  re-check (S5) is as strong as the sign-in method.

**Owner items:** the Google OAuth clients and the Apple capability (docs/12 §2.1); until then the
buttons are simply absent. Local runs: `eval "$(scripts/supabase-api-env.sh)"` gives the API the
local stack's settings.
