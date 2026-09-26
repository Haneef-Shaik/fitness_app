# Wireframes · A — Auth & Onboarding

[← Conventions](00-CONVENTIONS.md) · [Index](../README.md)

Screens A-01 … A-10. Read [00-CONVENTIONS](00-CONVENTIONS.md) first — universal rules are not repeated here.

---

## A-01 · Splash / Session Bootstrap
**Route** `/` · **Type** FS · **Priority** P0

**Purpose.** Decide where the user belongs before showing them anything, and never lose an
in-progress workout.

**Wireframe**
```
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│                  ( logo )                    │
│                                              │
│                   ~~~~~~                     │   subtle indeterminate bar
│                                              │
└──────────────────────────────────────────────┘
```

**Routing decision table**
| Condition | Destination |
|-----------|-------------|
| No token, or refresh fails | A-02 Welcome |
| Token valid, `user_profiles` incomplete | A-07 Onboarding (first incomplete step) |
| Token valid, email unverified, grace period active | B-01 with a persistent verify banner |
| Token valid, email unverified, grace expired | A-06 Verify Email |
| Token valid, profile complete, **local session draft exists** | B-01 **+ E-10 recovery overlay** |
| Token valid, profile complete, server has an `in_progress` session | B-01 + active-session bar |
| Token valid + a `?next=` deep link | The deep-link target |
| Account status `disabled` | L-08 with a support contact |
| Account soft-deleted, within the grace window | A-04 with a "Restore account?" prompt |

**Data.** `POST /auth/refresh` · `GET /profile` · local SQLite draft check.

**Edge cases**
- Bootstrap exceeds 3 s → render A-02 with a quiet retry rather than holding the splash.
- Refresh-token reuse detected → force A-04 with "You were signed out for security."
- Clock skew makes the token look expired → attempt one refresh before concluding logged-out.
- Offline at launch with a cached session → go straight to B-01 with cached data + the offline banner.
  **The user must be able to open the app and log a workout with no network at all.**

**a11y.** The splash announces "Loading" with `AccessibilityInfo.announceForAccessibility`; it does not trap focus.

---

## A-02 · Welcome
**Route** `/welcome` · **Type** FS · **Priority** P0

```
┌──────────────────────────────────────────────┐
│                  ( logo )                    │
│                                              │
│        Train. Eat. See what changed.         │
│                                              │
│   Log workouts in seconds. Track calories    │
│   from a photo. Watch the numbers move.      │
│                                              │
│   ┌────────────────────────────────────┐     │
│   │  ( illustration / 3-frame preview )│     │
│   └────────────────────────────────────┘     │
│                                              │
│          [   Create account   ]              │
│          (   I already have one )            │
│                                              │
│   By continuing you agree to the Terms       │
│   and Privacy Policy.                        │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| Create account | navigate | → A-03 |
| I already have one | navigate | → A-04 |
| Terms / Privacy | open | In-app browser view (K-10 content) |

**Edge cases.** Deep link arrived while logged out → `?next=` is preserved through the whole auth
flow and honoured after onboarding completes.

---

## A-03 · Sign Up
**Route** `/register` · **Type** FS · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Back                                       │
│                                              │
│  Create your account                         │
│                                              │
│  Email                                       │
│  ┌────────────────────────────────────────┐  │
│  │ you@example.com                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Password                                    │
│  ┌────────────────────────────────────────┐  │
│  │ ••••••••••                       (👁)  │  │
│  └────────────────────────────────────────┘  │
│  ━━━━━━━━━━░░░░░  Strong                     │
│  At least 10 characters.                     │
│                                              │
│  ☐ Email me reminders and product updates    │
│                                              │
│          [   Create account   ]              │
│                                              │
│  ──────────────  or  ──────────────          │
│  ( Continue with Apple )   [P2]              │
│  ( Continue with Google )  [P2]              │
│                                              │
│  Already have an account? Log in             │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result / failure |
|---------|--------|------------------|
| Email field | `type=email`, `autocomplete=email` | Validated on blur |
| Password field | `autocomplete=new-password` | Strength meter is advisory, never blocking above the minimum |
| 👁 reveal | toggle | Announced as "Password shown/hidden" |
| Marketing checkbox | toggle | **Unchecked by default.** Never pre-consented |
| Create account | `POST /auth/register` | 201 → A-07 · 409 → inline "An account already uses this email. Log in instead." with a link · 429 → "Too many attempts. Try again in {n} minutes." |
| Log in | navigate | → A-04, carrying any typed email |

**Validation**
| Field | Rule | Message |
|-------|------|---------|
| Email | RFC-shaped, ≤ 254 chars | "Enter a valid email address." |
| Password | ≥ 10 chars, not in a common-password list | "Use at least 10 characters." / "That password is too common." |

**Edge cases**
- Submit tapped twice → the button enters a loading state and the request is idempotent.
- Offline → "You need a connection to create an account." The form retains its input.
- Password manager autofill must not break the strength meter or the submit state.
- The email exists but is soft-deleted within the grace window → offer restore, do not create a duplicate.

**a11y.** Focus order email → password → reveal → checkbox → submit. Errors announced and tied to
their field via `accessibilityHint`. Nothing depends on the strength meter's color.

---

## A-04 · Log In
**Route** `/login` · **Type** FS · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Back                                       │
│  Welcome back                                │
│                                              │
│  Email     ┌──────────────────────────────┐  │
│            │                              │  │
│            └──────────────────────────────┘  │
│  Password  ┌──────────────────────────────┐  │
│            │ ••••••••            (👁)     │  │
│            └──────────────────────────────┘  │
│                          Forgot password?    │
│                                              │
│          [       Log in       ]              │
│                                              │
│  ──────────────  or  ──────────────          │
│  ( Continue with Apple / Google )   [P2]     │
│                                              │
│  New here? Create an account                 │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result / failure |
|---------|--------|------------------|
| Log in | `POST /auth/login` | 200 → A-01 routing logic · 401 → "Email or password is incorrect." (**never** which one) · 423 → "Account locked. Check your email." · 429 → cooldown message with a countdown |
| Forgot password? | navigate | → A-05, carrying the typed email |
| Create an account | navigate | → A-03 |

**Edge cases**
- Arriving here from L-05 (session expired) → the screen keeps the `?next=` target and shows
  "Log back in to continue where you left off."
- **An unsynced local session draft exists for a different user** → after login, the draft is *not*
  merged. It is held in quarantine and L-07 explains it, because sets must never migrate between accounts.
- Repeated failures → progressive delay, communicated as a countdown rather than a silent block.
- Autofill submits before hydration → the form is functional as plain HTML before JS loads.

---

## A-05 · Forgot / Reset Password
**Route** `/forgot-password` (request, `?email=` carried from A-04) and `/reset-password` (+ `?token=`) · **Type** FS · **Priority** P0

Two states, **built as two routes**: the emailed link `fitlog://reset-password?token=…` lands
directly on the second, so it has its own path. The email also carries the token on a line of its
own; "I have a code" on the request screen opens `/reset-password` with a paste field for a phone
that will not open the link (webmail can strip custom schemes). Both routes, and A-06, are public:
their links arrive signed out.

```
STATE 1 — request                    STATE 2 — set a new password (?token=)
┌────────────────────────────┐       ┌────────────────────────────────────┐
│ < Back                     │       │  Choose a new password             │
│  Reset your password       │       │                                    │
│  We'll email you a link.   │       │  New password  ┌────────────────┐  │
│                            │       │                │ ••••••   (👁)  │  │
│  Email ┌────────────────┐  │       │                └────────────────┘  │
│        │                │  │       │  ━━━━━━━░░░  Good                  │
│        └────────────────┘  │       │  Confirm       ┌────────────────┐  │
│    [  Send reset link  ]   │       │                │ ••••••         │  │
│                            │       │                └────────────────┘  │
└────────────────────────────┘       │     [  Update password  ]          │
                                     └────────────────────────────────────┘
STATE 1b — sent (always shown, regardless of whether the account exists)
  "If an account exists for {email}, we've sent a reset link.
   Didn't get it? Resend in 0:45"   ← countdown, then a Resend button
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| Send reset link | `POST /auth/password/forgot` | Always the same confirmation — **account existence is never disclosed** |
| Resend | same | Enabled after a 60 s cooldown |
| Update password | `POST /auth/password/reset` | 200 → all other sessions revoked → A-04 with "Password updated. Log in." · 400 invalid/expired token → "This link has expired." + a request-new-link action |

**Edge cases.** Token already used → same expired message. Token for a different account than the
one currently logged in → sign the current session out first. Reset while a workout session is in
progress on this device → the local draft survives (it is device-local, not session-local).

**As built.** The link is single-use and lasts 30 minutes; requesting again kills the older link.
Unknown, used, superseded and expired all return `400 LINK_EXPIRED` with one sentence — telling them
apart would tell a guesser which tokens existed. A second request inside 60 s is answered
identically and sends nothing, so the form cannot flood someone's inbox. A completed reset revokes
**every** session, this device's included, so the app signs out locally and lands on A-04 with
"Password updated. Log in with your new password." Opening the link also marks the address
verified (it proves the inbox). The strength meter states its level in words ("Too short" below the
10-character minimum, then "Good", "Strong") — shared with A-03 and K-02.

---

## A-06 · Verify Email
**Route** `/verify-email` · **Type** FS · **Priority** P1

```
┌──────────────────────────────────────────────┐
│                  ( ✉ icon )                  │
│          Confirm your email                  │
│   We sent a link to {email}.                 │
│                                              │
│          [  Open mail app  ]                 │
│          (  Resend link  )   0:45            │
│          (  Use a different email  )         │
│                                              │
│   Skip for now →       (grace period only)   │
└──────────────────────────────────────────────┘
```

**Rules.** Verification is required within a grace period (7 days `[ASSUMPTION]`). During the grace
period the app is fully usable with a dismissible banner. After it expires, **read access and workout
logging continue** — only sharing, export and email-dependent features lock. *Losing the ability to
log a workout because of an unverified email would violate the product's core promise.*

**Edge cases.** Changing the email restarts verification and revokes any outstanding link.
Verifying in another tab → this screen detects it on focus and advances automatically.

**As built (launch).** Sign-up sends the link (24 h, single use); `fitlog://verify-email?token=…`
verifies on arrival, signed in or not, and the code can be pasted instead. Resend is on this screen,
on a K-01 banner ("Verify your email · Resend") and in K-02, counting down from 60 s. **The grace
period is not enforced and nothing locks** — not export, not logging, not password reset, which
emails verified and unverified addresses alike. Whether anything should lock after 7 days is an
open product decision; until it is taken, verification is informational. Not built: "Open mail app"
and "Skip for now" (the screen is never forced on anyone, so there is nothing to skip). The same
link also completes a K-02 email change.

---

## A-07 · Onboarding Wizard
**Route** `/onboarding/[step]` · **Type** FS · **Priority** P0

Six steps. Progress is saved per step, so abandoning and returning resumes in place.

```
┌──────────────────────────────────────────────┐
│ < Back              ●●●○○○            Skip → │   step 3 of 6
├──────────────────────────────────────────────┤
│                                              │
│              {  STEP CONTENT  }              │
│                                              │
├──────────────────────────────────────────────┤
│              [    Continue    ]              │
└──────────────────────────────────────────────┘
```

| Step | Route | Collects | Writes | Skippable |
|------|-------|----------|--------|-----------|
| 1 Basics | `/onboarding/basics` | Name, birth date, sex, height | `user_profiles.height_cm`, `birth_date`, `sex` | Birth date + sex are skippable; targets then become less accurate and say so |
| 2 Units | `/onboarding/units` | Metric / imperial, timezone (detected, editable), week start | `preferred_unit_system`, `timezone` | No — everything downstream depends on it |
| 3 Activity | `/onboarding/activity` | Activity level, 5 options with plain descriptions | `activity_level` | Yes → defaults to moderate |
| 4 Goal | `/onboarding/goal` | Goal type + target weight + target date | `fitness_goals` row | Yes |
| 5 Targets | `/onboarding/targets` | → **A-08** | calorie + macro targets | Yes → sensible defaults |
| 6 Schedule | `/onboarding/schedule` | Training days per week, preferred days | `user_profiles`, seeds a program shape | Yes |

**Step 2 detail (the one that cannot be skipped)**
```
│  How should we show your numbers?            │
│                                              │
│  ┌──────────────┐  ┌──────────────┐          │
│  │  ◉ Metric    │  │  ○ Imperial  │          │
│  │  kg · cm · g │  │ lb · in · oz │          │
│  └──────────────┘  └──────────────┘          │
│                                              │
│  Time zone                                   │
│  ┌────────────────────────────────────────┐  │
│  │ Asia/Kolkata  (detected)            ⌄  │  │
│  └────────────────────────────────────────┘  │
│  This sets when your day starts and ends     │
│  for calories and workouts.                  │
│                                              │
│  Week starts on   ( Sun ) [ Mon ] ( Sat )    │
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| Continue | `PATCH /profile` for this step | Advances. On failure the step is retained locally and retried |
| Back | navigate | Previous step, values intact |
| Skip → | navigate | Applies the documented default and advances. **Never silently skips step 2** |
| Progress dots | — | Not interactive; purely indicative |

**Edge cases**
- Abandoning mid-wizard → A-01 returns the user to the first incomplete step.
- Height entered in imperial → captured as ft+in, stored as `height_cm`.
- An implausible value (height 300 cm, weight 500 kg) → a soft warning, "That looks unusual — is it
  right?", with a confirm. **Never a hard block** — outliers exist.
- Timezone detection fails → default UTC, with the field visibly highlighted as needing attention.
- Age under **16** → stop, explain the policy, offer account deletion. **Q9 closed 25 Sep by the owner** — the server refuses a younger birth date too (`app/domain/age.py`).

**a11y.** Each step is an `h1` change announced on navigation. The progress indicator has
`accessibilityLabel="Step 3 of 6"`. Segmented controls use `accessibilityRole="radiogroup"`.

---

## A-08 · Target Review
**Route** `/onboarding/targets` · **Type** FS · **Priority** P0

**Purpose.** Propose calorie and macro targets from the collected profile, and make it unmistakable
that they are an estimate the user owns.

```
┌──────────────────────────────────────────────┐
│ < Back              ●●●●●○                   │
│  Your starting targets                       │
│                                              │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │  ✦ Estimated from your profile         │  │
│  │                                        │  │
│  │        2,340 kcal / day                │  │  ← hero figure
│  │                                        │  │
│  │   Protein  ███████  176 g   (30%)      │  │
│  │   Carbs    ███████  234 g   (40%)      │  │
│  │   Fat      ███████   78 g   (30%)      │  │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                                              │
│  How we got there ⌄                          │
│   BMR 1,680 · activity ×1.55 → 2,604         │
│   fat-loss adjustment −10% → 2,340           │
│   Mifflin–St Jeor. An estimate, not medical  │
│   advice. Adjust anytime in Settings.        │
│                                              │
│  ( Adjust targets )      [ Looks good ]      │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| How we got there ⌄ | expand | Shows the formula, inputs and adjustment. **Transparency is required** — the user must be able to see why |
| Adjust targets | navigate | → H-15 in an onboarding variant; returning re-renders with the manual values and drops the ✦ |
| Looks good | `PATCH /profile` | Writes targets, advances to step 6 |

**Edge cases**
- Missing birth date or sex → fall back to an activity-and-weight-based estimate, and state the
  reduced accuracy explicitly.
- The computed target falls below a safe floor (1,200 kcal `[ASSUMPTION]`) → clamp to the floor and
  display "We've set a minimum. Talk to a professional before going lower."
- Goal is muscle gain → surplus adjustment, same disclosure structure.
- Macro percentages must always total 100%; the split is derived from protein g/kg first, then fat,
  with carbs taking the remainder.

---

## A-09 · Program Starter
**Route** `/onboarding/program` · **Type** FS · **Priority** P1

**Purpose.** Prevent the empty-app problem. A user who reaches the dashboard with no program has
nothing to start.

```
┌──────────────────────────────────────────────┐
│  Pick a starting point                       │
│  You can change everything later.            │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ ◉ Push / Pull / Legs         3 days    │  │
│  │   Chest+shoulders · back · legs        │  │
│  │   18 exercises                     ⌄   │  │
│  ├────────────────────────────────────────┤  │
│  │ ○ Upper / Lower              4 days    │  │
│  ├────────────────────────────────────────┤  │
│  │ ○ Full Body                  3 days    │  │
│  ├────────────────────────────────────────┤  │
│  │ ○ Build my own               —         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ( Skip — I'll log as I go )   [ Use this ]  │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| A template row | select | Expands to preview the plan days and exercises |
| Use this | `POST /workout-programs` from the template | Deep-copies into the user's own program → A-10 |
| Build my own | navigate | → C-04 in onboarding mode |
| Skip | navigate | → A-10. E-01 will still offer "Empty workout" |

**Edge cases.** Template copy fails → advance anyway and surface a retry on the dashboard; onboarding
must never dead-end on a non-essential step. The copy must be a **deep copy** — later changes to the
platform template must not alter the user's program.

---

## A-10 · Onboarding Complete
**Route** `/onboarding/done` · **Type** FS · **Priority** P1

```
┌──────────────────────────────────────────────┐
│                  ( ✓ icon )                  │
│              You're all set                  │
│                                              │
│  Here's what happens next:                   │
│   • Your first workout is {Push} on {Monday} │
│   • Daily target: 2,340 kcal · 176 g protein │
│   • Log your weight to start the trend       │
│                                              │
│       [  Log my weight now  ]                │
│       (  Go to my dashboard  )               │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| Log my weight now | open sheet | → I-02, then B-01. Seeds the weight trend with a first point so I-03 is not empty |
| Go to my dashboard | navigate | → B-01, or the `?next=` deep-link target if one survived |

**Edge cases.** If steps were skipped, the summary only lists what was actually set, and the
dashboard shows a "Finish setting up" card instead of fabricating values.

---

## Auth & onboarding — cross-cutting

| Concern | Rule |
|---------|------|
| Token storage | Access token in memory; refresh token in the **device keychain** via `expo-secure-store` — never a cookie, because a native client cannot use one ([D10](../08-PROJECT-CHARTER.md#6-decision-log)), and never in plain key-value storage. The web build falls back to browser storage, which is acceptable only because web is a development surface and not a shipping platform ([D1](../08-PROJECT-CHARTER.md#6-decision-log)) |
| Session expiry mid-use | L-05 dialog re-authenticates **in place** — the user never loses the screen they were on, and never loses an active session draft |
| Sign out | Clears server state and query cache. **If a session draft exists, it is retained on-device and quarantined to that user** — sign-out is not a reason to destroy a workout |
| Multiple devices | Allowed. A workout started on one device shows on the other via the active-session bar after sync |
| Rate limiting | Every auth endpoint; the UI shows a countdown, never a bare "try later" |
| Enumeration | Login and password reset never reveal whether an account exists |
| Deep links | `?next=` survives register → onboarding → dashboard |
| Analytics | `auth.registered`, `auth.logged_in`, `auth.failed{reason}`, `onboarding.step_completed{step}`, `onboarding.skipped{step}`, `onboarding.completed{steps_skipped}` |
