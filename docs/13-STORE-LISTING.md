# Store Listing & Compliance — drafts for Google Play and the App Store

**Status:** DRAFT for the owner. Every answer below was checked against what the code actually
collects and sends on 2026-09-26. If a feature changes what data is collected, update this file
in the same change. The Play Data Safety form and Apple's privacy labels must match the app; a
mismatch is a policy violation, not a typo.

Related: privacy policy and terms drafts are served by the API at `/legal/privacy` and
`/legal/terms` (source in `services/api/app/legal/`); account deletion on the web is at
`/account/delete`. Both need the owner's review before publishing.

---

## 1 · Listing copy

### Name
**FitLog** — confirm availability and trademark first (launch plan L8). Fallback: *FitLog: Workout & Food Log*.

### Google Play short description (≤ 80 characters)
> Log sets in seconds, track food with AI estimates, see if you're progressing

*(76 characters)*

### App Store subtitle (≤ 30 characters)
> Workouts, food and progress

### App Store promotional text (≤ 170 characters)
> Your last chest day, your protein left today and your weight trend — in one app. Fast set logging that works offline, and meal photos turned into editable estimates.

### Full description (both stores, ≤ 4000 characters)

> **Train, eat and track in one place — and actually find it again.**
>
> FitLog is a workout log and food diary built for people who train seriously. Logging is fast
> enough to do between sets, and everything you log stays searchable, so the questions that matter
> have answers: *What did I do last chest day? Am I eating enough protein on training days? Is my
> weight moving?*
>
> **Workouts**
> • Log a set in a couple of taps — load, reps, and "same as last set"
> • Your previous performance for each exercise, right on the logger
> • Programs and plan days, with target sets, reps, load and rest
> • Warm-up, drop and failure sets; RPE and RIR if you track effort
> • Rest timer and plate calculator
> • Works offline — nothing you log waits for a signal
> • Find your previous chest (or any muscle) day without remembering the date
> • Volume, personal records and estimated 1RM over time
>
> **Food**
> • Search foods, or add your own and your recipes
> • Describe a meal in words, or photograph it, and get an estimate you review and correct before
>   it counts
> • Calories and macros by meal, day, week and month, against your own targets
>
> **Progress**
> • Weight with a smoothed trend, body measurements and private progress photos
> • Goals for weight, strength and nutrition
> • A dashboard with today's workout, what you have left to eat, and your trend
>
> **Your data is yours**
> • Export everything, or delete your account and all of it, from inside the app
> • Photos are stripped of location data and stored privately
>
> FitLog shows estimates. It is not a medical device and does not give medical advice. For people
> aged 16 and over.

### Keywords — App Store (≤ 100 characters, comma-separated, no spaces needed)
> workout,gym,log,tracker,calorie,macro,protein,food,diary,lifting,strength,weight,progress,fitness

### Category
- Google Play: **Health & Fitness**
- App Store: primary **Health & Fitness**, secondary **Food & Drink**

### Screenshots
Required sizes: Play — phone screenshots (min 2, 16:9 or 9:16, 320–3840 px, long side at most twice
the short) and a 1024×500 feature graphic; App Store — 6.9" (1320×2868) and 6.5" (1284×2778) iPhone
sets.

**The Play phone set is taken** — six at 1080×1920 in
[`docs/store/screenshots/android/`](store/screenshots/android/), from the release build on an
emulator, by `bash scripts/store-screenshots.sh` (re-run it after any UI change). It seeds its own
account (`services/api/scripts/seed_screenshots.py`: eight weeks of Push / Pull / Legs imported
through the real Strong importer, a weigh-in most mornings, two-thirds of today's food), makes the
screen 9:16 and freezes the status bar. In order, with suggested captions:

1. `01-log-a-set` — the logger mid-workout, last time's sets above the entry — "Log a set in seconds"
2. `02-previous-chest-day` — F-05 — "Find your last chest day without the date"
3. `03-food-diary` — 1,566 of 2,340 kcal, 774 left — "Know what's left today"
4. `04-describe-and-confirm` — the AI review, each item matched and editable — "Describe it — you confirm"
5. `05-weight-trend` — I-03, the 7-day average under the daily line — "See the trend, not the noise"
6. `06-progression` — bench e1RM over eight weeks — "Know you're progressing"

Shot 4 comes from the development AI stub. The two items in view are matched to catalog foods, so
their figures are the catalog's, not invented — but the item names and portions are the stub's, so
re-take it against staging with the real provider before submitting.

Still to make: the **feature graphic** (needs the real icon and name, L8) and **both iPhone sets**
(need the iOS build — Android screenshots are not used for the App Store).

---

## 2 · Google Play — Data safety form

**Does your app collect or share any of the required user data types?** Yes.
**Is all of the user data collected by your app encrypted in transit?** Yes (HTTPS only; store
builds refuse `http://` API URLs and ship without cleartext traffic).
**Do you provide a way for users to request that their data is deleted?** Yes — in the app
(Profile → Data and privacy → Delete my account) and on the web at `https://<api-domain>/account/delete`.

"Shared" in Play's sense excludes service providers processing on FitLog's behalf (hosting,
database/storage, the AI provider, crash reporting, email). **FitLog shares no data** in Play's
sense. Everything below is **Collected**, not shared.

| Data type (Play) | Collected | Optional? | Purpose(s) | Where in FitLog |
|---|---|---|---|---|
| Personal info → **Email address** | Yes | Required | Account management, App functionality | Sign-up, sign-in, password reset |
| Personal info → **Name** | Yes | Optional | App functionality | Display name in profile |
| Personal info → **Other info** (birth date, sex) | Yes | Optional | App functionality | Calorie target estimate; age check (16+) |
| Health and fitness → **Health info** (weight, body measurements, height) | Yes | Optional | App functionality | Body metrics, targets |
| Health and fitness → **Fitness info** (workouts, sets, programs, goals) | Yes | Optional | App functionality | The training log |
| Photos and videos → **Photos** | Yes | Optional | App functionality | Meal photos (AI estimate), progress photos |
| App activity → **Other user-generated content** (meal descriptions, notes, feedback) | Yes | Optional | App functionality | Food diary, notes, "Send feedback" |
| App info and performance → **Crash logs**, **Diagnostics** | Yes, **only if crash reporting is enabled** in the build (`EXPO_PUBLIC_SENTRY_DSN`) | Required when enabled | Analytics (app stability) | No personal data in reports (scrubbed) |
| Device or other IDs | **No** | — | — | No advertising ID, no device ID is collected |
| Location | **No** | — | — | EXIF location is stripped from photos on the phone and again on the server |
| Financial info, Messages, Contacts, Calendar, Audio, Files, Web browsing | **No** | — | — | — |

Food "nutrition" data (meals, calories) is declared under **Fitness info** / **Health info** as
Play's closest categories; if Play's form offers a nutrition-specific type at submission time, use it.

## 3 · Google Play — Health apps declaration

- Does the app have health features? **Yes**: *Activity and fitness* (workout logging), *Nutrition
  and weight management* (food diary, calorie/macro targets, weight tracking).
- Is it a medical device, or does it diagnose/treat? **No.** Every calculated figure is labelled an
  estimate (PRD guardrail); no medical claims.
- Does it use Health Connect? **Yes (K-09), opt-in:** `READ_WEIGHT` (weigh-ins from a smart scale
  appear in Progress) and `WRITE_EXERCISE` (finished workouts saved as strength training). Play
  Console's **Health Connect permissions declaration** needs one justification per permission —
  use those two sentences — and the privacy policy must say the same. Nothing is read in the
  background, and neither permission is requested until the user switches the feature on.

## 4 · Google Play — other declarations

- **Target audience:** 16 and over (the server enforces a 16+ birth date — Q9). Not designed for
  children; do not opt into the Families programme.
- **Content rating (IARC questionnaire):** no violence, sexual content, profanity, drugs, gambling,
  user-to-user communication or location sharing → expected rating *Everyone / PEGI 3*.
- **Ads:** No ads.
- **Account deletion URL:** `https://<api-domain>/account/delete`.
- **Permissions justification:** Camera (meal and progress photos, only when the user taps "Take a
  photo"); Notifications (reminders the user switches on). Microphone and "draw over other apps"
  are explicitly removed from the manifest (`app.config.js`).
- **App access for review:** see §7.

## 5 · App Store — App Privacy ("nutrition label")

**Tracking:** FitLog does **not** track (no data used for advertising or shared with data brokers;
no IDFA; no App Tracking Transparency prompt needed).

**Data Linked to You** (all used for *App Functionality* only):
- Contact Info — **Email Address**, **Name**
- Health & Fitness — **Health** (weight, body measurements), **Fitness** (workouts)
- User Content — **Photos or Videos** (meal and progress photos), **Other User Content** (meal
  descriptions, notes, feedback)
- Identifiers — **User ID** (the FitLog account id)
- Sensitive Info — none (birth date and sex are declared under *Other Data* → *Other Data Types* if
  App Store Connect has no closer category)

**Data Not Linked to You:**
- Diagnostics — **Crash Data**, **Performance Data** (only if crash reporting is enabled; scrubbed)

**HealthKit (K-09):** the app reads body mass and writes workouts only when the user switches each
on; it never uses HealthKit data for advertising, never stores it in iCloud, and the privacy policy
states both (App Review 5.1.3). Enable the HealthKit capability on the App ID (EAS does this from
the entitlement the config plugin adds).

**Export compliance:** `ITSAppUsesNonExemptEncryption = false` is set in `app.config.js` (HTTPS only).

## 6 · App Store — review guidelines checklist

| Guideline | How FitLog meets it |
|---|---|
| 5.1.1(v) account deletion in-app | Profile → Data and privacy → Delete my account |
| 5.1.1(i) privacy policy link | In the app (Profile → About) and in App Store Connect |
| 5.1.2 data use | No tracking, no third-party advertising |
| 1.4.1 health & safety | Estimates labelled as estimates; no medical claims; not a medical device |
| 2.1 app completeness | Demo account with data (§7); AI works with the production key |
| 2.3 accurate metadata | Screenshots from the real app; no features promised that are not built |
| 4.2 minimum functionality | Full training + nutrition + progress app |
| 5.1.1(ii) permission strings | Camera string in `app.json` (image-picker plugin); microphone disabled |

## 7 · Reviewer notes and demo account (both stores)

Create the account on the **production** API — never with the public defaults:

```bash
FITLOG_API=https://<api-domain> DEMO_EMAIL=review@<your-domain> DEMO_PASSWORD='<long random>' \
  uv run python services/api/scripts/seed_demo.py
```

Paste into *App Review Information* / *App access*:

> Sign in with the demo account above. It has a training program (Push / Pull / Legs), two
> completed workouts, and food entries. To try the core loop: Train → Start workout → log a set
> (it saves instantly, also offline). To try AI food estimation: Nutrition → Add food → Describe
> ("2 eggs and toast") or Photo; you review and confirm the estimate before it counts. Account
> deletion: Profile → Data and privacy → Delete my account. FitLog shows estimates only and gives
> no medical advice.

## 8 · Support and web presence (owner)

- A support email (also set as `EXPO_PUBLIC_SUPPORT_EMAIL` so the About screen shows it).
- A landing page linking: privacy policy, terms, account deletion, support. The API-served pages
  can be those links until a site exists.
