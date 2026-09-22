# Wireframes · K — Profile & Settings

[← Conventions](00-CONVENTIONS.md) · [Index](../README.md)

Screens K-01 … K-11. Implements FR-C01 (BRD §15) and the user-facing half of BRD §18.

---

## K-01 · Profile
**Route** `/settings` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Home              Profile                  │
│         ( AB )   Aditya B.                   │
│                  you@example.com  ✓ verified │
│                  Member since Aug 2026       │
│                                       Edit › │
│                                              │
│  ┌──────────┬──────────┬──────────┐          │
│  │ 84       │ 412      │ 24       │          │
│  │ workouts │ meals    │ PRs      │          │
│  └──────────┴──────────┴──────────┘          │
│                                              │
│  YOU                                         │
│   Height            178 cm                ›  │
│   Birth date        12 Mar 1996           ›  │
│   Activity level    Moderate              ›  │
│                                              │
│  SETTINGS                                    │
│   ⚖  Units, time zone & week start        ›  │
│   📝 Logging preferences                  ›  │
│   🎯 Calorie & macro targets              ›  │
│   🏠 Dashboard layout                     ›  │
│   🔔 Notifications & reminders            ›  │
│   ✦  AI preferences                       ›  │
│   🔒 Data & privacy                       ›  │
│   🔑 Account & security                   ›  │
│   🔌 Integrations                  [soon] ›  │
│   ℹ  About                                ›  │
│                                              │
│  ( Sign out )                                │
└──────────────────────────────────────────────┘
```

**Controls.** Each row navigates to its screen. "Edit ›" edits display name and avatar. Height,
birth date and activity level edit inline in a sheet and write to `user_profiles`.

**Edge cases.** Changing height recalculates BMI-derived displays but **never** rewrites historical
`body_metrics`. Changing birth date or activity level offers to recalculate targets (→ H-15) but does
not do it silently. Sign out warns if an active session draft exists: "You have an unfinished
workout on this device. It'll still be here when you sign back in."

---

## K-02 · Account & Security
**Route** `/settings/account` · **Type** Stacked · **Priority** P0

```
│  EMAIL                                       │
│   you@example.com          ✓ verified    ›   │
│  PASSWORD                                    │
│   Change password                        ›   │
│   Last changed 3 months ago                  │
│  SIGNED IN ON                                │
│   ● This device · Chrome, macOS · now        │
│   ○ iPhone · Safari · 2 days ago      Sign out│
│   ( Sign out everywhere else )               │
│  ( Delete my account )                       │
```

**Change email** requires the current password and re-verifies the new address; the old address is
notified. **Change password** requires the current password and revokes all other sessions, stating
so before confirming. **Delete my account** → K-07.

**Edge cases.** The current device's row cannot be signed out from here (Sign out in K-01 does that).
Signing out everywhere else does not touch local workout drafts. If the password was changed on
another device, this device's next request gets a 401 → L-05.

---

## K-03 · Units, Time Zone & Week Start
**Route** `/settings/units` · **Type** Stacked · **Priority** P0

```
│  UNIT SYSTEM                                 │
│   [ Metric ]  ( Imperial )                   │
│    kg · cm · g · ml · km                     │
│   Or set each one:                      ⌄    │
│    Body weight  [kg] (lb)                    │
│    Load         [kg] (lb)                    │
│    Height       [cm] (ft/in)                 │
│    Distance     [km] (mi)                    │
│    Food         [g/ml] (oz/fl oz)            │
│                                              │
│  TIME ZONE                                   │
│   [ Asia/Kolkata ⌄ ]   ☑ Follow this device  │
│   Your day runs 00:00 – 23:59 here. It       │
│   decides which day a workout or meal        │
│   belongs to.                                │
│                                              │
│  WEEK STARTS ON                              │
│   ( Sun )  [ Mon ]  ( Sat )                  │
│                                              │
│  ⓘ Changing units only changes what you see. │
│    Your stored data doesn't change.          │
```

**The ⓘ line is required copy.** It is the user-facing statement of the canonical-units principle
(BRD §7) and prevents the reasonable fear that switching to lb will corrupt history.

**Edge cases.** Per-measure overrides allow the common real-world case of lifting in kg while
weighing in lb. Changing the timezone re-buckets days; a one-time dialog explains that past daily
totals and workout dates may shift, and asks for confirmation. "Follow this device" re-detects on
each launch and notifies on a change (travel) rather than silently re-bucketing a month of data.
Changing the week start re-buckets every weekly chart and adherence figure.

---

## K-04 · Logging Preferences
**Route** `/settings/logging` · **Type** Stacked · **Priority** P0

```
│  WHAT TO SHOW WHILE LOGGING                  │
│   ☑ RPE (rate of perceived exertion)         │
│   ☐ RIR (reps in reserve)                    │
│   ☑ Rest timer                               │
│   ☐ Duration       ☐ Distance                │
│   ☑ Set type (warm-up, drop, failure)        │
│   ☑ Per-set notes                            │
│                                              │
│  DEFAULTS                                    │
│   Load step        ( 1 ) [ 2.5 ] ( 5 ) kg    │
│   Rest default     [ 120 s ⌄ ]               │
│   Auto-start rest timer            ☑         │
│   Keep the screen on during a workout  ☑     │
│   Rest sound  ☐   Rest vibration  ☑          │
│                                              │
│  HOW NUMBERS ARE CALCULATED                  │
│   Count warm-up sets in volume         ☐     │
│   Secondary muscles count as     [ 50% ⌄ ]   │
│   1RM formula    [ Epley ⌄ ]                 │
│   ⓘ These change what your charts show.      │
│     They never change your stored sets.      │
│                                              │
│  PLATE INVENTORY                        ›    │
│   25 · 20 · 15 · 10 · 5 · 2.5 · 1.25 kg      │
```

These are the switches behind decisions D6, D7 and D8, and behind FR-C01.7. Changing any of them
re-renders analytics immediately; none of them writes to `workout_sets`.

**Edge cases.** Turning off a field that already has data (RPE on 200 existing sets) hides it from
entry and display but preserves it — re-enabling restores everything. Changing the secondary weight
or the 1RM formula re-renders G-02/G-07 on next view, with the chart footnote updating to match.

---

## K-05 · Dashboard Layout
**Route** `/settings/dashboard` → redirects to **B-02**. · **Priority** P1

---

## K-06 · Notifications & Reminders
**Route** `/settings/notifications` · **Type** Stacked · **Priority** P1

```
│  ⚠ Notifications are off for this app.       │
│    ( Turn them on )                          │
│                                              │
│  WORKOUTS                                    │
│   Workout reminder          ☑  07:00  ⌄      │
│    on scheduled days only         ☑          │
│   Unfinished workout        ☑                │
│    after 2 hours                  ⌄          │
│  NUTRITION                                   │
│   Meal reminders            ☑                │
│    Breakfast 08:00 · Lunch 13:00 ·           │
│    Dinner 20:00                          ›   │
│    only if nothing's logged       ☑          │
│   Food analysis finished    ☑                │
│  BODY                                        │
│   Weigh-in reminder    ( Off ) [Weekly] (Daily)│
│    Sunday 08:00                          ⌄   │
│  OTHER                                       │
│   New personal records      ☑                │
│   Sync problems             ☑                │
│  QUIET HOURS                                 │
│   ☑ 22:00 – 07:00                            │
```

**"only if nothing's logged"** is the setting that separates a useful reminder from an annoying one,
and it defaults **on**.

**Edge cases.** OS permission denied → the warning banner appears and every toggle still works, with
a note that reminders will appear in B-04 only. Permission is requested via L-06 at the moment a
reminder is first enabled — never at app launch. Reminder times use the profile timezone. Quiet hours
suppress delivery but not the in-app inbox.

---

## K-07 · Data & Privacy
**Route** `/settings/privacy` · **Type** Stacked · **Priority** P0 · BRD §18

```
│  YOUR DATA                                   │
│   Export everything                      ›   │
│    JSON or CSV, emailed to you               │
│   Food analyses & photos                 ›   │  → H-18
│    6 photos · 42 analyses                    │
│   ( Delete all food photos )                 │
│   ( Delete all progress photos )             │
│                                              │
│  HOW PHOTOS ARE STORED                       │
│   🔒 Encrypted, private, and only reachable   │
│      through short-lived links we generate    │
│      for you. There is no public address for  │
│      your images.                             │
│   Keep food photos for  [ 90 days ⌄ ]        │
│                                              │
│  ANALYTICS                                   │
│   ☑ Share anonymous usage data               │
│    Helps us find bugs. Never your food        │
│    photos, meals or measurements.             │
│                                              │
│  ──────────────────────────────────────────  │
│  [ Delete my account ]                       │
```

**Delete account flow**
```
   Step 1  What gets deleted
           "84 workouts · 1,840 sets · 412 meals · 6 photos ·
            96 weight entries. All of it, permanently."
           ( Export it first )   [ Continue ]
   Step 2  Confirm
           Type DELETE to confirm  ┌──────────┐
           Enter your password     ┌──────────┐
           [ Delete my account ]
   Step 3  Grace period
           "Your account is scheduled for deletion on 21 Oct.
            Log in before then to cancel it."
```

A 30-day grace period `[ASSUMPTION]` with a cancel-on-login path, then a hard purge of rows **and**
every object-storage asset. "Export it first" is offered inline because losing data you meant to keep
is the worst outcome of this screen.

**Edge cases.** An export for a very large account is generated asynchronously and emailed; the
screen says so rather than appearing to hang. Deleting all food photos keeps the confirmed nutrition
(the numbers are in `meal_items`) and says exactly that. Individual image deletion is immediate;
account deletion is the only thing with a grace period.

---

## K-08 · AI Preferences
**Route** `/settings/ai` · **Type** Stacked · **Priority** P1

```
│  FOOD ANALYSIS                               │
│   Today's usage   ━━━━━━░░░░  6 of 20        │
│    Resets at midnight                        │
│                                              │
│   Flag items below   [ 50% ⌄ ] confidence    │
│    Low-confidence items start unticked so     │
│    you check them.                            │
│                                              │
│   ☑ Always show me the result before saving   │
│    ⓘ This can't be turned off. Estimates are  │
│      never saved without you seeing them.     │
│                                              │
│   Keep analyses for  [ 90 days ⌄ ]           │
│   View past analyses                     ›   │
│                                              │
│  HOW IT WORKS                                │
│   Photos and descriptions are sent to a       │
│   vision model to identify foods and estimate │
│   portions, then matched against a nutrition  │
│   database. Confidence is how sure we are we  │
│   spotted the food — not how accurate the     │
│   calories are.                               │
│   Model: <provider/model@version>             │
```

**"Always show me the result before saving" is displayed as a locked-on setting**, not a toggle
(open question Q7, BRD §12.7). Auto-confirming AI estimates would break the confirmed-vs-estimated
distinction the entire data model is built around, so it is presented as a guarantee rather than a
preference.

---

## K-09 · Integrations `[P2]` · K-10 · About · K-11 · Subscription `[P2]`

**K-09** — Apple Health / Google Fit / Garmin / Fitbit. Shown at MVP as a single "Coming soon" row
that opens a short explanation with an optional "notify me". Never a broken toggle.

**K-10 · About** (`/settings/about`, P0) — app version + build, "What's new", Terms, Privacy Policy,
open-source licences, nutrition-data attribution (a licensing requirement for most providers),
`[ Contact support ]` which pre-fills the app version, platform, user ID and the last `request_id`,
and `[ Copy diagnostics ]`.

**K-11 · Subscription** `[P2]` — not present at MVP. No pricing surface, no locked features, no
upsell placeholders.

---

## Settings — cross-cutting

| Concern | Rule |
|---------|------|
| **Saving** | Toggles save immediately with a quiet confirmation. Forms with multiple fields use an explicit Save |
| **Failure** | A failed save reverts the control and shows an inline retry — never a silent no-op that leaves the UI lying about the stored state |
| **Offline** | Changes are queued through the outbox; the screen says "Will apply when you're back online" |
| **Destructive** | Account deletion, photo deletion and "sign out everywhere" all name exactly what they affect before confirming |
| **Consequence disclosure** | Any setting that changes displayed numbers (units, weighting, formula, week start, timezone) states that it changes the *display*, not the data |
| **Search** | Settings search over all K-* rows `[P1]` |
| **a11y** | Every toggle uses `accessibilityRole="switch"` with its state in `accessibilityState`; each grouped section is one accessibility container whose title carries `accessibilityRole="header"` |
