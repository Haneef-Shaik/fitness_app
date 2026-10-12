# FitLog — complete product requirements and implementation contract

| Field | Value |
|---|---|
| Version | 2.1 — owner-delegated product decisions; no trainer role |
| Updated | 11 October 2026 |
| Status | Selected product rules; external release gates remain unfulfilled |
| Product | Personal fitness tracking and a consent-based gym operating workspace |
| Platforms | Android/iOS member and staff apps; gym web console in Phase 2 |
| Design | Momentum; [screen inventory and tokens](22-UI-MOMENTUM.md) |
| Delivery | [Master plan](23-MASTER-PLAN.md) and [goal cards](plan/GOALS.md) |
| Baseline | [Fresh reset](RESET-BASELINE.md): no application implementation exists on this branch |

This specification is for a product designer, implementation partner, engineers and QA team to
build the same product without inventing business rules. It defines scope, workflows, permissions,
calculations, records, failure behavior and acceptance checks. It does not claim the product has
been built or that external accounts, pricing, legal policies or provider approvals exist.

## Contents

1. [Using this specification](#1-using-this-specification)
2. [Product, users and success](#2-product-users-and-success)
3. [Scope and releases](#3-scope-and-releases)
4. [Shared product rules](#4-shared-product-rules)
5. [Account, onboarding and preferences](#5-account-onboarding-and-preferences)
6. [Exercises and workout planning](#6-exercises-and-workout-planning)
7. [Live workout logging](#7-live-workout-logging)
8. [History and training analytics](#8-history-and-training-analytics)
9. [Food, meals, recipes and targets](#9-food-meals-recipes-and-targets)
10. [AI food estimation](#10-ai-food-estimation)
11. [Body progress, goals and Today](#11-body-progress-goals-and-today)
12. [Gym organisation, staff and register](#12-gym-organisation-staff-and-register)
13. [Memberships, freezes, dues and payments](#13-memberships-freezes-dues-and-payments)
14. [Gym invitations and messaging](#14-gym-invitations-and-messaging)
15. [Attendance, coverage and retention](#15-attendance-coverage-and-retention)
16. [Gym programme offers and operational permissions](#16-gym-programme-offers-and-operational-permissions)
17. [Challenges, streaks and referrals](#17-challenges-streaks-and-referrals)
18. [Pro, billing and entitlements](#18-pro-billing-and-entitlements)
19. [Navigation, screens and system states](#19-navigation-screens-and-system-states)
20. [Offline behavior and synchronisation](#20-offline-behavior-and-synchronisation)
21. [Data model and service contract](#21-data-model-and-service-contract)
22. [Privacy, security and data lifecycle](#22-privacy-security-and-data-lifecycle)
23. [Quality, operations and measurement](#23-quality-operations-and-measurement)
24. [Phase 2 and Phase 3](#24-phase-2-and-phase-3)
25. [Acceptance scenarios](#25-acceptance-scenarios)
26. [Delivery and third-party handoff](#26-delivery-and-third-party-handoff)
27. [Assumptions and external decisions](#27-assumptions-and-external-decisions)
28. [Requirement traceability](#28-requirement-traceability)

## 1. Using this specification

- **Must** means required within the stated release. **May** means implementation freedom.
- **MVP-M** is member store launch. **MVP-G** is the later five-gym pilot. Together they form the
  expanded MVP; member launch does not wait for gym features.
- **P2/P3** are separately accepted later releases, not unfinished launch requirements.
- **Selected rule** is a concrete product decision. On 11 October 2026 the owner selected removal
  of the trainer role and delegated the remaining product decisions. Defaults retained or resolved
  in this version are selected development/acceptance rules; external approvals are still separate.
- **External decision** is an account, vendor, commercial or legal choice that cannot be inferred.
  Section 27 identifies its fallback and release gate.

Existing IDs (`ID01`, `TR01`, `FD01`, etc.) remain stable. This PRD governs behavior; goal cards govern
delivery sequencing; Momentum governs visual references. Old planner paths/test counts are historical
after the reset. A Figma annotation cannot override scope: supersets are MVP-M even where the screen
inventory marks them P2. Do not mark implementation goals complete because this document is complete.

The original `fitness_nutrition_tracking_BRD_data_model.docx` informs the personal-tracking model.
This specification incorporates the expanded gym requirements and overrides its older release
assignments. The supplier delivers clients, API, database, workers, integrations, seed content,
tests, operational tooling and release artifacts. Static screens are not feature completion.
Freeze a versioned architecture and API contract before dependent teams implement.

| Term | Definition |
|---|---|
| User/member | Adult FitLog account owner; a gym relationship is optional |
| Gym member record | Gym-owned register row, possibly without an app account |
| Linked member | Register row linked to an authenticated adult after confirmation |
| Organisation / gym | Business owner / operational tenant with a register and timezone |
| Staff membership | User's active scoped gym role, independent of personal account |
| Programme / prescription | Reusable plan / intended sets, reps, load, time, distance, rest |
| Session / set | Actual workout / first-class performed effort |
| Confirmed item / AI proposal | Saved consumed nutrition / candidate that never counts in totals |
| Entitlement | Server-verified permission to use a commercial feature |
| Archive | Hide reusable configuration from new selections while preserving history |
| Local date | Calendar date saved using the event's recorded timezone |

## 2. Product, users and success

FitLog helps people plan training, record every set quickly, retrieve previous performance, log food
with reviewable estimates and see progress. Gyms operate registers, memberships, receipts, attendance
and programme offers while members retain their personal fitness data. There is no trainer role,
trainer workspace, staff health-data access or staff measurement recording in the delivered scope.

The first public release is **India only**, for both member store availability and gym pilot,
with two complete languages, English/Hindi, and India-focused food content/Hinglish search. US/Europe
remain a possible later expansion, gated separately by regional notices, stores, support, billing,
data-flow and provider readiness; the old broader-audience answer is long-term intent, not launch scope.
Retain international units/IANA timezones/E.164 identity structure so expansion does not require a
data-model rewrite. No GPS/IP restriction prevents an existing user travelling abroad from using
personal tracking. Production phone OTP initially enables +91 delivery only; other country codes
remain structurally supported but unavailable until provider/expansion gates pass. Email/Google/Apple
remain supported sign-in methods. Both complete languages cover every shipped member/staff flow.

Linked users must be 18+. The product gives fitness records and estimates, never diagnosis, treatment,
clinical promises or supposedly measured nutrition from photographs. Free personal use requires
neither gym membership nor Pro.

| Persona | Primary job |
|---|---|
| Beginner | Start a manageable plan, understand fields and see useful progress |
| Experienced lifter | Log one-handed, inspect last performance, customize plans and review PRs |
| Nutrition-focused member | Use household portions, correct estimates, maintain recipes/targets |
| Invited/lapsed member | Verify phone, join the right gym and see dues without full fitness setup |
| Owner/manager | Import members, manage renewals/payments, review visits and retention |
| Front desk | Maintain permitted register data, mark visits and record payments |
| Programme recipient | Accept an owner/manager gym template as a private member-owned copy |
| Operator/support | Diagnose service issues through restricted, audited tooling |

Success requires the acceptance scenarios in section 25. Measure signup-to-first-completed-workout,
weekly logging, AI confirmation rate, history retrieval and subscription conversion; establish
baselines before setting growth targets. Set commit p95 is below 100 ms, and a locally acknowledged
set survives process termination. Gym setup imports at least 150 records within one 90-minute visit.
The five-gym, ten-week pilot has a written scale/fix/stop gate (section 23) before gym P2.

## 3. Scope and releases

| Capability | MVP-M | MVP-G | Later |
|---|---|---|---|
| Phone/email/Google/Apple identity, onboarding, settings | Required | Invite shortcut | More languages |
| Exercise catalog, plans, logger, rest, plates, supersets | Required | Owner/manager programme offers | Substitution/progression/media |
| History, comparison, volume, frequency, e1RM, PRs, adherence | Required | Personal only | Body map/formula refinements |
| Manual food, quick add, custom foods, recipes, targets/analytics | Required | Personal only | Barcode/micronutrients/personalization |
| Text/photo food AI | Required behind trial/Member Pro | Same personal entitlement | Dictation/multiple photos |
| Body, private photos, goals, Today | Required | Gym/programme-offer cards | Wearables/widgets |
| Durable writes/recovery | Workouts | Visits/staff payments | Broad cached offline reads |
| Privacy, export/deletion, notifications/support | Required | Gym offboarding/export | More integrations |
| Gym roles/register/import/memberships/dues/receipts | No | Required | Web/multi-branch/online collection |
| Invite/utility messages/visits/retention | No | Required | Device feeds/approved broadcasts |
| Gym programme offers/operational permissions/challenges/referrals/freezes | No | Required | Break mode/passport; renewed coaching needs separate scope |
| Member AI sets/review/ask-your-data | No | No | P2 Member Pro |
| Owner operational AI | No | No | P2 Owner Pro; diet/plan coaching copilot removed from committed roadmap |
| Paper-register AI reader | No | No | P2 onboarding exception |
| AI calling | No | No | P2 after legal/pilot/consent gates |
| Ads | No | No | P3 after a separate approved specification |

Excluded: global feed/social graph, cross-gym discovery, public health photos, health-data ad targeting,
medical advice, automatic AI changes, launch hardware gates, watch app, marketplace and FitLog holding
gym payment funds. Gym core does not require Owner Pro during the pilot.

Minimal workout context is persisted for MVP logging; full offline history/analytics/diary reads are
P2. Connected health apps are P2 despite an old generic acceptance reference to health integrations.
This is a selected release boundary recorded in DEC-13. Trainer/coaching scope is removed, not
merely postponed into an existing P2 goal. Restoring private-sharing/coaching needs a new approved scope.

## 4. Shared product rules

### 4.1 Ownership and history

1. User owns personal plans, sessions, sets, meals, private foods/recipes, body entries and goals.
2. Gym owns register, memberships, fees, receipts, attendance and staff records. Personal account
   deletion unlinks private data; gym-ledger lifecycle follows section 22.
3. Session start snapshots prescriptions, names, muscles and load semantics. Later plan/catalog
   edits never rewrite performed history.
4. Confirmed meal items snapshot nutrition, serving conversion and source version. Later food/recipe
   edits affect future additions only. Raw AI observations and user corrections remain separate.
5. Payments/reversals/adjustments, receipts, consent events and access audits are append-only.
6. Derived summaries can be rebuilt from authoritative records and retained formula inputs/versions.
7. AI/gym failures and consent revocation never prevent personal tracking.

### 4.2 Dates and units — specified defaults

- Store UTC timestamp, IANA timezone at creation and stable local date. Workout date = start;
  meal = consumption; body = measurement; visit = occurrence in gym timezone. A midnight-crossing
  workout stays under its start date.
- Timezone changes affect new events/schedules, not old dates. Explicit backdated edits recalculate
  affected dates/summaries. Gym memberships/reminders/reports use gym timezone.
- Week = Monday–Sunday; month = calendar month; custom date endpoints inclusive. Implement time
  intervals as start-inclusive/next-day-exclusive. DST days are not assumed to be 24 hours.
- Canonical units: kg, cm, metres, seconds, kcal, grams; finance = integer minor units + ISO currency.
  Pilot = INR/paise. Never sum currencies or use floating-point money.
- Conversions: lb × 0.45359237 = kg; inch × 2.54 = cm; mile × 1609.344 = m;
  kJ × 0.239005736 = kcal. Preserve original entered value/unit metadata.
- Display defaults: load/weight 2 decimal places with trailing zeros trimmed; measurements/macros 1;
  distance 2; kcal nearest integer; money 2. Round display only, never intermediate totals.
- Missing optional values are null, not zero. Accept locale decimal separator and unambiguous dates.

### 4.3 Validation and destructive operations

Enforce equivalent client/server validation: no non-finite values, negative nutrition, invalid enums
or dates. Names 1–100 trimmed characters; notes up to 2,000; AI text 2,000; search 100. Treat text as
plain data. Names may repeat; IDs are unique. Field errors preserve unsaved inputs.

Archive/restore reusable configuration without deleting history. Confirm deletion of a past session,
meal, body entry or account with consequences stated. Live set delete offers five-second undo while
remaining durable if the app closes. Financial bulk actions require preview and confirmation.
An empty filtered result differs from an account with no data.

## 5. Account, onboarding and preferences

**IDs:** ID01–ID06. **Release:** MVP-M; gym shortcut at MVP-G.

### 5.1 Identity

Phone OTP, email/password, Google and Apple must be supported where the platform/provider permits.
Phone is required to claim a phone-addressed invite, not for personal email signup. Email may be null.
Store phone as E.164; default country India, with only enabled delivery countries selectable at launch. Never automatically merge accounts
because names/emails match. Linking identity methods requires authentication of the existing account
and verification of the new identity.

Specified auth defaults: six-digit OTP, five-minute expiry, 60-second resend delay, five verification
attempts per challenge and five sends per phone/hour, plus IP/device limits. Resend invalidates old
code. Show wrong/expired/delivery-failed/rate-limited states; never log codes. Provider contract must
meet or explicitly replace these defaults. Email signup verifies email before cloud writes; passwords
require 12 characters minimum with password-manager/paste support. Reset/change links are single-use,
expire after 30 minutes and have generic responses that do not reveal account existence.

Account states: pending verification → active → disabled or deletion pending → deleted. Expired
sessions prompt login while retaining encrypted pending work. Security settings allow changing verified
email/phone/password, linking providers, listing sessions and revoking other sessions. A phone change
does not claim unrelated gym records. Disabled users cannot read/write protected cloud data.

### 5.2 Age, notices and onboarding

Collect date of birth and versioned terms/privacy acceptance before activation; calculate age using
local date. Under-18 users cannot activate/link. Declining required terms ends signup. Optional AI,
marketing, location, photos and challenge permissions are separate and off by default. Gym linking
never requests training/nutrition/body sharing.

Personal onboarding: display name, units/timezone, experience, training days/equipment, goal and
optional height/weight/activity. Optional steps have Skip; progress resumes after interruption.
Completion must not duplicate starter plans on retry. Provide at least three human-reviewed editable
starter programmes: three-day full body, four-day upper/lower and beginner bodyweight. They are general
templates, not medical recommendations.

Invite onboarding needs only verification, adult eligibility, notices and gym confirmation, then opens
the gym card. Fitness setup is offered later. Height, weight and sharing are never required for dues
or attendance. A denied/expired invite must not trap a user who wants personal tracking.

### 5.3 Preferences and utilities

Persist English/Hindi, metric/imperial, timezone, system/dark/light, dashboard order, optional logger
fields, rest default, sound/haptics and notification choices. Default language follows supported device
locale, otherwise English; theme follows system. Workspace choice is device-local and checked against
current roles before restoration.

Feedback has category, description, optional diagnostics preview and submission reference ID; private
meals/photos/phone are not included automatically. About has version, support, status, terms/privacy
and licenses. Account export/deletion follows section 22. Global personal search covers owned
programmes/exercises/history, never other members' private data.

## 6. Exercises and workout planning

**IDs:** TR01–TR03, TR11. **Release:** MVP-M; TR11 P2.

### 6.1 Exercise catalog

Fields: stable ID, name/localized names, aliases, equipment, movement, primary/secondary muscles,
logging type, load basis, instructions and active/archive status. Global catalog is read-only;
custom exercises are private. Search is case-insensitive name/alias matching; filters combine with AND.
Launch default: at least 200 human-reviewed exercises across barbell/dumbbell/machine/cable/bodyweight/
kettlebell/band/cardio with 2–4 instruction sentences. Media licenses are not a launch dependency.

Logging types: resistance (reps/load), bodyweight (reps, optional added/assistance load), timed
(duration, optional load) and distance/time (both required). Custom creation selects type/muscles.
Changing semantics after use creates an exercise version; old history keeps its version.

Load basis: total external, per-hand or assistance. Bilateral per-hand dumbbell volume uses multiplier
2; unilateral reps-per-side uses multiplier 1 and says so. Machine variants are compared only within
the same equipment identity. Assistance is never counted as lifted load. MVP bodyweight e1RM is absent.
Members edit/archive/restore their own aliases/mappings; archived items stay in history but leave the
default picker. Similar-name creation warns but is allowed. Global merges are P2.

### 6.2 Programme editor and schedule

Programme = name/description/status plus ordered days. Day = name/notes plus ordered exercise instances;
the same exercise may occur twice. Prescriptions include set type/count, rep min/max, optional load,
time/distance and rest. Set count 1–50, reps 1–1,000, rest 0–3,600; min ≤ max. Unset load is permitted.
Support add/edit/remove/duplicate/reorder days/exercises and deep-copy programme duplication.

Incomplete plans save as drafts; scheduling requires at least one exercise. Archive cancels future
pending occurrences after confirmation, preserving old occurrences/history. Restore does not silently
recreate cancelled schedules. One current weekly programme is selected; others can be started manually.
Days recur on selected weekdays from an effective date. Multiple days/date warn but are allowed.
Persist versioned occurrences: pending/completed/missed/cancelled. Recurrence edits affect future
pending occurrences only. A session links to at most one occurrence; cancelled occurrences never
count for adherence. Unscheduled workouts count as activity. One-off calendar rescheduling is P2.

Gym programme offers become member-owned copies with provenance (section 16); member edits never update the
template, and template edits never alter accepted copies or sessions.


### 6.3 Matching actual sessions to scheduled occurrences

On Start, show **Counts toward: [named occurrence/date]** with change choice. Starting from an exact
Today/calendar occurrence preselects that occurrence and the user confirms it with Start; programme,
repeat or scratch starts default to Unscheduled and offer today's and missed occurrences no more
than seven calendar days overdue. Never infer “the oldest missed workout” from exercise similarity.
A Tuesday session may complete Monday's missed day **only if Monday is explicitly selected**;
otherwise selecting Tuesday completes Tuesday, or Unscheduled completes neither. These choices do
not move calendar dates or recurrence (one-off rescheduling stays P2).

Link is reserved to the active session with matching revisions. Finish atomically completes that
occurrence; at most one non-deleted completed session can link to one occurrence. Simultaneous finish
or relink fails 409 with review choices; no silent last-write-wins. Late workout retains Tuesday's
actual history date while adherence credits Monday's planned occurrence and labels Completed late.
Eligibility uses original performed start date in the saved occurrence timezone, with time-tamper
review; a valid within-window offline completion does not fail merely because sync is later.
After seven days, missed occurrences cannot be completed by a newly performed session without a future approved
administrative correction feature; log as Unscheduled. Missed days stay in their original denominator.

Deleting the linked completed session atomically unlinks it and resets a non-cancelled occurrence to
Pending if its local due date is Today/later, otherwise Missed. Cancellation remains Cancelled.
Discarding an active session releases its reservation without completing anything. Explicit historic
relink requires preview/revisions, an eligible occurrence, and one-session/one-occurrence constraints;
deletion/relink recomputes affected weekly adherence. A historic valid late completion is not undone
merely because seven days subsequently elapse.

Fixture: Monday 12 October and Tuesday 13 October occurrences; an actual Tuesday 13 workout selecting
Monday gives Monday Completed late and Tuesday Pending, actual history Tuesday. A second session
cannot complete Monday. Deleting the first makes Monday Missed and allows a reviewed new completion
within the seven-day window; it must not turn Tuesday into Completed automatically.

## 7. Live workout logging

**IDs:** TR04–TR07, TR10. **Release:** MVP-M.

### 7.1 Lifecycle

Start from Today, a plan day, previous session or scratch. Snapshot plan and previous-performance
context into durable local storage. Previous-session copy creates pending prescriptions, not new
performed sets. One server-active session/user: another start offers Resume or Finish/Discard.
Offline multi-device conflicts follow section 20.

States: in_progress → completed or discarded. Pause is a timer attribute. Store start/end/paused
intervals; duration = elapsed minus explicit pauses. Background counts unless paused. App close
never finishes/discards. Recovery shows saved sets, name, elapsed and sync status with Resume/Finish/
Discard. Draft stays until resolved. Finish needs at least one completed set; otherwise discard.
Confirm pending/skipped prescriptions without fabricating performance. Summary shows duration,
exercise count, working sets, external-load volume and records. Offline finish is provisional.

### 7.2 Set fields and commit

| Field | Rule |
|---|---|
| Reps | Integer 1–1,000 where required |
| Load | 0–2,000 kg canonical; zero valid for non-loaded work |
| Duration | 1–86,400 integer seconds where required |
| Distance | Positive, ≤1,000,000 metres where required |
| RPE | Optional 0–10 in 0.5 increments |
| RIR | Optional integer 0–10, independent of RPE |
| Type | Warm-up/working/drop/failure; default working |
| Rest | Actual and target seconds separate |
| Notes/time | Optional note; performed time captured at commit |

Validate fields by exercise type; empty sets fail. Each drop segment is a separate row. Optional
field visibility never erases stored values. `Log set` atomically saves set + outbox locally, then
renders feedback/rest and synchronizes. No network/AI call on this path. p95 tap-to-durable-confirmation
<100 ms. Prevent double tap locally; repeated mutation delivery creates one set.

Prefill priority: explicit prescription, matching prior-session set, preceding local set, then empty.
Prefill/Repeat stays pending until Log set. Display prior date and load basis. Previous-read failure
does not block input. Add/reorder/skip/remove/swap instances during logging. Removing performed work
requires confirmation. Swap retains old performed sets under the old exercise and adds a new instance
for subsequent work. Live edits never modify the source plan.

### 7.3 Timer, plates and supersets

Rest uses a durable deadline so background/restart recovers remaining time. +15/−15 (minimum zero),
Skip and sound/haptics controls; local notification if permitted. Another commit restarts relevant
rest. Respect OS notification/silent constraints. Never rely on timer ticks for elapsed truth.

Plate inputs: target total, bar and available plate pairs. Subtract bar, split equally, use largest
available pairs without exceeding target; show remainder instead of silently rounding. At 100 kg
with 20 kg bar, each side needs 40 kg. Save plate presets and support chosen units.

Supersets group ≥2 instances, advance A1 → B1 → A2 → B2, allow manual override and default rest after
the last exercise/round; intra-round rest optional. Sets remain ordinary rows, never multiplied by rounds.

## 8. History and training analytics

**IDs:** TR08–TR09. **Release:** MVP-M.

### 8.1 Retrieval and correction

History shows completed sessions newest-first with local date/source/duration/summary. Filter by
inclusive dates, programme/day, exercise and muscle; OR within a filter, AND across filters. Muscle
uses snapshotted primary mappings, with Include secondary optional. Calendar and empty states required.

Previous occurrence = latest completed session strictly before current start, matching plan-day
lineage or containing requested exercise/muscle. Exclude current draft/discarded. Stable-ID tie-break
for identical start times. Last chest session must be retrievable without its date. No match says so.
Comparison aligns exercise ID/version and repeated-instance order, shows unmatched rows, per-set
reps/load deltas and volume change. Percentage with zero denominator is unavailable; load bases must
match. Show performed work and original prescription separately.

Past edit mode preserves original timestamps/duration by default; changing time is an explicit
action. Edits/deletes invalidate summaries/records/adherence and keep versions/audit. Deleting best
performance reveals next-best record; stale PRs must not remain.

### 8.2 Formula contract — specified defaults

Use completed non-deleted sets in completed sessions. Working/drop/failure eligible; warm-ups excluded
from headline volume/PRs, optionally shown separately. Calculate unrounded canonical values.

| Metric | Definition |
|---|---|
| External set volume | reps × load_kg × saved multiplier, eligible resistance or externally weighted bodyweight sets |
| Exercise/session/range volume | Sum external set volume; labelled kg·reps external-load volume |
| Non-loaded/assisted/timed work | Show reps/sets/time/distance separately, no invented kg volume; weighted bodyweight counts external load only |
| Muscle volume | Equal allocation across primary muscles; secondary excluded from headline total |
| Muscle working sets | Count once per primary muscle; explicitly non-additive exposure |
| Session/exercise/muscle frequency | Distinct completed sessions with an eligible matching set |
| Epley e1RM v1 | load_kg × (1 + reps/30), resistance positive external load and 1–30 reps |
| e1RM chart | Daily maximum per exercise/version, with formula/unit/load-basis label |
| Max-load PR | Highest eligible load; equality is not a new record |
| Rep PR | Highest reps at same exercise/version and canonical load |
| Volume PR | Highest eligible exercise volume in one completed session |
| e1RM PR | Highest eligible e1RM at same exercise/version/load basis |
| Adherence | completed linked occurrences ÷ due non-cancelled occurrences ×100 |

e1RM uses displayed load basis (e.g. per hand), not bilateral volume multiplier. First performance
establishes First record. Live PR is provisional until finish; emit one celebration/event, never
replay it on historic edits. P2 ≤12-rep e1RM introduces a formula version, preserving v1 history.

Adherence through Today counts ended-day due occurrences plus today's completed ones; pending today
becomes missed at day end. Future days do not lower current adherence. Zero denominator = Not scheduled.
Example: 3×80 kg×8 = 1,920 kg·reps; 40×10 warm-up adds nothing; e1RM for 80×8 =101.333… kg. Two primary
muscles receive 960 kg·reps each and three working-set exposures each.
Charts support 7/30/90-day/custom ranges, accessible point readouts and gaps for unmeasured days.

## 9. Food, meals, recipes and targets

**IDs:** FD01–FD05, FD10. **Release:** MVP-M; FD10 P2.

### 9.1 Diary and portions

Today diary has date selector, consumed/target/remaining kcal/protein/carbs/fat/fibre and timed meals.
Categories default Breakfast/Lunch/Dinner/Snack. Add/rename/reorder/archive custom categories, preserving
historical labels. Empty meal is a draft, contributes nothing.

Manual flow: choose meal/date/time → food search → quantity/unit → review calculated values/source →
Save confirmed item → update totals. Edit/delete item or meal recomputes immediately. Search ranks
private foods/recipes, exact names/aliases, then global fuzzy matches. Supply ≥500 distinct Indian
foods/dishes (aliases do not count), English/Hindi/Hinglish aliases and reviewed household portions.
Fixtures include dal/daal, roti/chapati, chawal/rice, paneer and biryani. Retain source/version/license.

Reference basis is 100 g, 100 ml or explicit serving. Household conversion is food-specific.
No unknown liquid density may silently become 1 ml =1 g. Unsupported serving asks for known weight/
volume. Quantity positive, ≤100,000 g/ml equivalent or 1,000 servings. Scale by quantity/reference;
snapshot conversion/nutrition. Unknown nutrition stays null and visibly incomplete.

Custom food: name, optional brand, reference quantity/unit, kcal/macros/fibre, portions/source note;
at least kcal or one macro required. Macro-energy mismatch against 4P+4C+9F warns, never silently
overwrites source calories. Private custom foods require review before global publication.

### 9.2 Quick add, recipes and copy

Quick add = label + kcal and/or macros, tagged estimate; blank macros unknown. Favorites/recents reuse
data but still require consumption Save. Recipe = name, ingredient snapshots, positive serving yield,
optional cooked g/ml yield. Per-serving totals = ingredients ÷ yield. Missing nutrition carries an
incomplete flag. Recipe changes create versions and never update past consumption. Saved meal is a
bundle that creates new confirmed items, not a live link.

Copy meal/day previews source/destination; defaults to category/time-of-day preserved in destination
timezone. Append to existing entries with warning, never overwrite. New IDs and provenance; do not
copy unconfirmed proposals or duplicate raw photos. Retrying one copy creates no duplicate entries.
Archive/restore foods/recipes; snapshots remain readable even when source is unavailable.

### 9.3 Targets and analytics

Targets are effective-dated kcal/macro/fibre versions. Manual or labelled TDEE estimate, reviewed
before Save. Default effective date Today; changing targets never changes historical intake. Backdated
target replacement is explicit with comparison preview.

Specified estimate: Mifflin–St Jeor `10×kg +6.25×cm −5×age +s`, where member explicitly selects equation
constant +5 or −161 or uses manual entry. Do not infer it from identity. Activity factors 1.2/1.375/
1.55/1.725/1.9 with explanations. TDEE = result × factor; editable default goal adjustment maintenance
0%, loss −10%, gain +10%. Missing inputs → manual entry. Suggested editable macro allocation is
25% protein/25% fat/50% carbs by calories, converted using 4/9/4 kcal/g; fibre has no automatic target.
These defaults require qualified suitability/copy review (DEC-14); they are not a diet prescription.
Manual kcal positive, macros nonnegative; warn on mismatched macro energy and allow acknowledgment.

Only confirmed non-deleted items count. Sum known values and flag incomplete if any component unknown.
Remaining = target − known intake; over-target is negative. Incomplete metric shows known subtotal,
not a falsely precise completion ring. Diary absence means Not logged, not fasting. Week/month/custom
sum known values; daily average uses logged days and states denominator/coverage. Optional calendar-day
average labelled separately. Default target adherence: kcal within ±10%, protein ≥target, separately
reported for complete logged days; unknown days excluded with coverage shown.

## 10. AI food estimation

**IDs:** FD06–FD09. **Release:** MVP-M, trial/Member Pro only.

### 10.1 Text and photo journeys

Text: select meal/date → enter description such as “2 eggs, 3 rotis, 200 g chicken” → submit → queued/
processing → editable candidates → correct/select → Confirm selected → diary. Preserve original text
on parse failure. Hindi/Hinglish inputs are supported; unknown names remain editable rather than
silently resolving to a different food. Text must describe food; unrelated input returns an actionable
error without fabricating a meal.

Photo: explain purpose → request camera/library permission → capture/select one image → preview/
retake → disclose AI processing and confirm upload → private upload → asynchronous analysis → review.
Camera denial leaves library/manual options. Accept JPEG/PNG/HEIC, up to 10 MB input; normalize format,
strip EXIF/location and resize longest edge to at most 2,048 px before provider submission. The server
validates media signature, ownership, size and sanitized output. Unsupported/corrupt images give Retry
or Manual. Do not log image URLs or raw bytes. Multi-photo input is P2.

Statuses: queued → dispatch committed → processing → ready or failed. A pre-dispatch cancellation
ends as Cancelled; permission/entitlement loss before dispatch ends Permission blocked with released
allowance. Post-dispatch cancellation is a request attribute until provider reconciliation; it cannot
promise that already submitted work was unsent. Ready proposals can be
partially confirmed and later closed/dismissed. Leaving the screen does not cancel the job. History
shows original text/photo availability, model/version, timestamps, status and confirmed-item links.
Push/in-app notice opens the exact analysis if notifications are allowed. A notification denial does
not affect processing. Never require the user to remain on the processing screen.

### 10.2 Proposal contract and confirmation

Each candidate contains stable candidate ID, detected name, resolved food ID/version if any,
quantity/unit/conversion, kcal/protein/carbs/fat/fibre (nullable), detection confidence, resolution
confidence/source, missing assumptions and provenance. Resolve against owned/global catalog where
possible; model-only nutrition is visibly an AI estimate. Confidence is detection uncertainty, not
accuracy of the nutrient values. Do not show spurious precision.

Specified confidence display: High ≥0.80; Review 0.50–<0.80; Unsure <0.50 or missing. Unsure candidates
start unselected and need individual review/select; missing portion or food resolution always requires
review regardless of score. User may change food, quantity, unit, conversion or nutrition, remove a
row or add manual rows. Recalculate deterministic quantities from selected food, never by another
model request. Show inferred household weights so the user can correct them.

Confirmation atomically creates selected confirmed meal items with snapshots and links to candidate
IDs. It never changes raw model output. Store corrected proposal versions and user-corrected flags.
One candidate can be confirmed at most once; concurrent/retried confirmations return the existing
result. Later corrections edit the confirmed item with history, not the raw analysis. Unselected rows
never affect totals. No valid selection disables confirmation with an explanation. There is no
auto-confirm after timeout or navigation.

### 10.3 Entitlement, jobs, limits and failures

Check server entitlement before every provider call, including billable retry. Core manual food
never needs AI permission. A ready proposal remains readable/editable/confirmable after Pro expiry
or AI-permission withdrawal because confirmation saves the user's existing data without a model
call. Withdrawal also stops further AI notifications/reanalysis; a member can delete the input/result.

Allowance: 20 text and 10 photo analyses/user/UTC day (window shown), max two queued/processing jobs.
Maintain append-only reserve/consume/release events with exactly one terminal allowance result/job.
Validation/storage rejection consumes nothing. Accepted job reserves one allowance against its
original day's bucket; pending reservations count against availability. Midnight does not move it
to a new bucket, and releasing yesterday's reservation does not increase today's allowance.

| Job transition | Allowance and provider effect |
|---|---|
| Accepted/queued | Reserve once plus monetary cap reservation; no provider call yet |
| Queued cancellation | Cancel + release allowance/cost reservation atomically, once |
| AI withdrawal or entitlement expiry before dispatch | Cancel/permission-block + release once; no provider call, retry requires new permitted submission |
| Worker claims queue | Still reserved; a worker claim is not permission to call |
| Dispatch committed | Under job lock recheck current entitlement, AI permission, quotas and cost reservation; atomically consume allowance and mark authorized dispatch |
| Ready | Keep consumed allowance; release unused monetary reservation, record actual provider cost |
| Terminal provider failure/timeout | Restore allowance once to original bucket; actual incurred provider cost remains charged to operational cap, not magically refunded |
| Cancel/withdraw after dispatch committed | Stop later retries, request provider cancellation where supported; result may finish privately. Keep consumed allowance unless provider confirms no billable work, in which case release once |

Dispatch committed is the ordering point for consent/cancellation races. If withdrawal/cancel wins
the lock, dispatch is forbidden. If authorized dispatch wins, the already authorized request may be
in flight and cannot be promised unsent; client shows cancellation requested, no subsequent calls.
Worker crash/lease recovery must reconcile provider acceptance using dispatch ID before retry; an
ambiguous acceptance cannot create another surprise billable request. A retry of the same attempt
requires a fresh permission check and uses the same logical job allowance. New manual Retry after
terminal state reserves a new job. Monetary user/platform caps must be configured before activation;
actual cost never exceeds reserved maximum without an explicit disabled-by-default approval rule.

Async queue deduplicates requests. Retry transient timeout/429/5xx at 5/30/120 seconds, maximum three
retries; permanent invalid input/schema failure fails safely. Job times out at five minutes total.
After failure show preserved input, Retry and Manual. Retry is a new linked job after entitlement/
quota check. If confirmation lost its response, retrieve it by operation ID instead of re-running AI.

Provider abstraction must support structured schema validation, model/prompt version and cost records.
Never accept model output as executable commands or instructions. Submit only necessary sanitized
food input, no unrelated gym/body/profile data. Staging accuracy report compares at least two models
on ≥50 weighed Indian meals, documenting portion/calorie/macro error by dish class, failed detection
and human correction rate. Model selection and acceptable errors are release decisions (DEC-08),
not unsubstantiated accuracy claims.

## 11. Body progress, goals and Today

**IDs:** PG01–PG05. **Release:** MVP-M; PG05 gym surfaces at MVP-G.

### 11.1 Body records and photos

Log timestamped weight, optional body-fat %, measurements and notes. Defaults: waist/chest/arm/thigh;
custom numeric fields choose cm, kg, %, or explicit unit and can be renamed/reordered/archived.
Weight >0–500 kg, length >0–500 cm, body-fat 0–100%; warn on implausible changes without pretending
to validate health. At least one metric/photo/note required; note-only entries do not generate values.
Edit/delete historical values with summary invalidation. Body records are written by the member
or a separately enabled personal health connector, never gym staff.

Multiple weights/day are allowed. Daily value is the latest non-deleted measurement by recorded time,
stable-ID tie-break. Seven-day moving average = mean of available daily values in day D−6 through D;
show sample count, never interpolate missing days. Weekly comparison uses available daily values in
each local Monday–Sunday period. Charts distinguish raw and average values and show missing intervals.

Progress photos are optional private dated assets with caption and front/side/back/custom label.
Camera/library permission and metadata stripping as for food; no AI processing by default. Compare
two user-selected dates/views. Photos have no public URL and are never gym-visible;
there is no launch measurement-sharing switch. Delete removes originals/thumbnails under section 22.

### 11.2 Goals

Support multiple active/paused/completed goals: loss, gain, maintenance, strength and custom. Fields:
name/type, linked metric, canonical unit, baseline value/date, target or maintenance range, start and
optional target date, notes/status. Start ≤target date; custom goals without a numeric metric are
manual checklists/completion. Select a metric the system actually tracks; no unsupported prediction.

Numeric progress = clamp((current−baseline)/(target−baseline), 0, 1) with directional change handled
by signs. Equal target/baseline is already met; no divide by zero. For loss 80→75 and latest 78,
progress =40%. Maintenance reports In range/Outside range against explicit bounds. Use latest valid
value for linked metric, identify its date; no data = Not measured. Strength uses the explicit
metric/version and date rules below. No projected completion date at launch. Reaching target suggests completion;
member confirms. Paused goals stop reminders but retain history. Target edit creates a goal revision,
not a rewrite of baseline records. Delete goal leaves measurements/sessions intact.


Strength goals must select exercise ID/version, load basis, and one supported metric: maximum load
(kg), Epley e1RM with formula version (kg), or reps at a specified positive/zero canonical fixed load
(reps; zero only for nonloaded bodyweight). Assistance-based strength targets are unsupported in MVP;
do not convert assistance to maximum lifted load. e1RM eligibility stays section 8. A per-hand target
is never satisfied by total-bar or bilateral multiplied volume. Historical maximum-volume PR is an
analytics metric, not an implicitly selectable strength-goal target.

Baseline is an explicitly chosen eligible set snapshot or a user-entered reference value with date,
clearly labelled reference. Store start local date, baseline cutoff timestamp, metric/unit/version
and optional target date. Goal current value is best qualifying **post-baseline** measurement within
start date through target date inclusive (or through Today if no deadline). Use performed timestamp
strictly after baseline cutoff; pre-start sets do not prove progress. No qualifying post-baseline set
shows Baseline only — no new measurement, with no fabricated current improvement. Target reached
before start does not auto-complete a new goal. Later sets after deadline are shown Outside goal window;
extend deadline by explicit goal revision if desired. Pause stops reminders but does not erase eligible
records. If chosen baseline source is corrected/deleted, flag Baseline needs review and suspend numeric
progress until member confirms a revised baseline; never silently change denominator.

Fixture: baseline bench maximum80 kg on 11 October, start12 October, target100 kg total, deadline31
October. A10 October100 kg set is ignored; without a post-baseline set show no new measurement.
12 October90 kg produces50%; per-hand90 kg of another exercise is ignored. A1 November100 kg set
does not claim the October goal was reached. e1RM and maximum-load goals can give different results.

### 11.3 Today dashboard

Default card order: active/scheduled workout, nutrition, latest body trend, active goals, gym card
(only with linked gym), weekly consistency. User can hide/reorder all except active-session recovery.
Cards link to source screens and expose date/unit/staleness; dashboard totals use the same formulas
as domain screens. Default date is user's Today, refreshed at local midnight/foreground.

Workout card: Resume active, otherwise Start scheduled, otherwise Choose workout. Nutrition: consumed/
target/remaining plus Add food. Body: latest and seven-day average with Log. Goals: next relevant
measurement action. Gym: selected linked gym, membership/dues, check-in and programme offers. Multiple
gyms have a selector; no blended gym balance or ranking. A widget failure must not hide other cards.
Earned praise refers to stored achievements; no random points, shame copy or fabricated improvement.

## 12. Gym organisation, staff and register

**IDs:** GC01–GC02, GC05–GC06. **Release:** MVP-G.

### 12.1 Organisation setup and permissions

Create organisation/gym with name, logo/brand, address, contact, timezone, INR currency, opening days,
check-in configuration and notice version. Default one branch; organisation structure supports later
branches. Owner can switch Personal/Gym without changing identity. A user may have staff roles in
several gyms; each request names and validates a single tenant. Role changes/revocation take effect
on the next request, not after token expiry. Gym owner cannot create a platform operator account.

Selected permission matrix; gym staff receive operational data only:

| Action | Owner | Manager | Front desk | Linked member |
|---|---|---|---|---|
| Gym settings/staff roles/offboard/export all | Yes | No | No | No |
| Register create/edit/import/archive/invite | Yes | Yes | Yes, nonfinancial register fields only | Own linked card only |
| Base membership issue/renew/freeze/cancel | Yes | Yes | Prepare request only; no final state/date/fee change | Own view; request freeze |
| Membership plans/prices/tax/discount/waiver | Yes | Yes | No | View purchased snapshot |
| Record received payment/view receipt | Yes | Yes | Yes, existing charges or unallocated credit | Own view |
| Financial reversal/refund/adjustment/report | Yes | Yes | No | Own receipt/dues |
| Visits view/mark/import | Yes | Yes | Yes | Own/self check-in |
| Gym programme templates/offers | Yes | Yes | No | Accept/decline private copy |
| Personal training/nutrition/body reads or measurement writes | No | No | No | Own only |
| Challenge setup/retention outcomes | Yes | Yes | Attendance only | Opt in/own standing |

There is no trainer role, trainer assignment or trainer workspace. Staff-role API rejects retired
role values; owner/manager status never grants personal-data access. Staff invitations verify identity
and permitted role before activation. One owner must remain; transfer needs reauthentication/accepted
successor. Another tenant's ID returns404; known in-tenant forbidden action403 without private data.

Front desk can prepare create/renew/freeze/cancel requests with proposed plan/dates and reason, and
view Pending/Approved/Rejected; owner/manager must approve with current price/date/conflict preview.
Approval atomically creates membership/fee/freeze event under approving actor and revisions. A front-desk request is not a
financial charge or a membership activation. Front
desk cannot approve their request, alter terms, waive charges, change dates directly or issue a receipt
for an unreceived payment. Receiving money before renewal approval creates unallocated credit against
that member, clearly labelled Pending membership approval; it does not activate/renew membership.
Owner/manager rejection leaves that real credit and offers refund/application via authorized finance
flow. Payment permissions do not imply membership permissions.

### 12.2 Register fields and lifecycle

Gym member fields: gym-scoped number, name, optional verified/unverified phone/email, adult eligibility
status (adult/minor/unknown), join date, tags, administrative notes, notice version, active/
archived, optional linked user and invitation status. Administrative notes must not become an
uncontrolled health-record store; label purpose. Minimum create: name and age eligibility. Phone not
required for an unlinked adult register row. Unknown age cannot link/rank until adult verified.
Minors are disabled at pilot creation/import unless a separately approved policy exists (DEC-04).

Search by name/phone/member number; filters membership status, due amount, tag, invite/link
state and join date. Pagination/default 50, max 100, deterministic sort; lazy load is not a 1,000-row
download. Detail shows operational history, memberships, due ledger, receipts, visits and permitted
actions. Archive hides from active lists, cancels future utility reminders and disallows new check-in;
it preserves ledger and personal account. Restore does not automatically renew membership.

Within one gym, duplicate normalized phone/member number flags a possible existing row; do not auto-
merge. Phone sharing requires explicit owner review and leaves linking unresolved; only one adult
record per gym may link to the same user. The same person may be in different gyms independently.
Merge of financial member records is outside MVP; provide correction guidance/export instead.

### 12.3 CSV/XLSX import

Accept UTF-8 CSV or .xlsx (no macros/formulas executed), ≤10 MB and ≤2,000 data rows/file. Template
columns: external_member_id, name, phone, email, age_status, joined_on, plan_code, starts_on, ends_on,
opening_due, tags. Date format YYYY-MM-DD, opening_due INR decimal converted exactly to paise.
Support column mapping, sample preview and file-level errors. Validate every row, referenced plans,
date order, numeric amounts and duplicates; preserve original row number. Never silently coerce a
bad phone/date. Existing financial history is not fabricated from opening_due: create an explicitly
labelled opening-balance ledger entry dated at migration.

Preview valid/error/possible-duplicate counts. Owner chooses Create valid only or cancel; invalid rows
never import. Existing-row update is a separate explicit option, limited to nonfinancial register
fields, with a before/after preview. Imported membership dates/fees are snapshots. New rows persist
in one documented import batch; report each saved/skipped/error row and download errors. File/batch
retry is idempotent. Invites are not sent automatically on import; a separate reviewed action sends
eligible invitations. Support ≥150-member setup without writing scripts.

## 13. Memberships, freezes, dues and payments

**IDs:** GC03–GC07, GE08. **Release:** MVP-G; online collection GC07 P2.

### 13.1 Plans and membership dates

Membership plan: code/name, duration (calendar months or fixed days), list fee in paise, optional
approved tax configuration, freeze allowance, active/archive. Version plans; sold memberships keep
price/duration/tax snapshots. Custom amount requires permission, reason and preview. Deleting a plan
used in history is forbidden; archive instead. Pilot recurring automatic billing is absent.

Store start-inclusive/end-exclusive local dates and prominently display **Valid through [last
included date]**. Fixed-day plan is exact day count:30 days from1 October 2026 is valid through30
October, exclusive end31 October.

**Selected calendar-month convention:** Calculate the month anniversary directly from original
start plus N calendar months, preserving original day if it exists. When that day exists, exclusive
end is that anniversary (valid through previous day). When the original day does not exist in the
target month, exclusive end is the first day of the following month, so the member gets the whole
last day of the shorter month. Do not iteratively clamp month by month or keep an undocumented sticky
month-end flag. Example:31 January 2027 +1 month → valid through28 February, exclusive end1 March;
31 January 2028 → valid through29 February;15 January 2027 → valid through14 February, exclusive15
February;31 January 2027 +2 months → valid through30 March, exclusive31 March.

This intentionally replaces v2.0's31 January→exclusive28 February/last included27 February rule:
showing the entire final February day is more predictable for members. It is a product date rule,
not a statement about statutory billing requirements. Renewal starts the previous exclusive end;
Jan31→Feb28 membership therefore renews on1 March, then is valid through31 March for one month.
Purchased snapshot saves duration basis and calculated dates; changing future plan policy never
rewrites a sold period. Finance due date remains start, not expiry. Reminder D0 uses the displayed
last included date:28 February 2027; D−7=21 February, D−3=25 February, D+3=3 March. An early renewal
suppresses unsent old offsets; fees remain separately recorded per sold term.

Membership state is separate from payment state. Scheduled = before start; Active = within period and
not frozen; Frozen = approved current interval; Lapsed = on/after exclusive end; Cancelled = explicit
audited termination. Payment outstanding does not automatically lapse an otherwise active membership.
Renewal creates a new membership and fee, starting prior exclusive end if renewed early, otherwise
selected date default Today. Overlaps warn and require owner/manager resolution; no hidden second fee.
One active base membership per member/gym; PT/session packs are removed from this roadmap.

### 13.2 Freezes and cancellation

Member submits interval (start inclusive/end exclusive), reason and membership; pending/approved/
rejected/cancelled. **The sold plan snapshot is authoritative:** plan creation default allowance30
days, but explicit0/7/15/etc. days remain that membership's allowance. Subsequent plan edits cannot
grant old sales30 days. Pending requests reserve no allowance; approval atomically checks remaining
allowance across approved freezes. Each consumes elapsed approved calendar dates, minimum one day.
Start must be within the effective period and not already frozen. A request can cross original expiry
if within allowance; it extends effective end by the full approved frozen-day count. Overlapping
freeze intervals are rejected; days counted by local dates, not24-hour UTC arithmetic.

Before approval, lock current membership and all sold dependent future renewals. Compute proposed
end and all downstream date shifts preserving each purchased term's duration basis. If extension
overlaps a sold renewal, approval requires one **atomic** reviewed action accepting both freeze and
future-renewal shift; prices/charges/payment allocations do not change. A renewed term already started
cannot be moved. If shift is declined or no legal non-overlap can be achieved, reject the whole freeze
approval with shorter-interval suggestion; leave current/renewal dates, fees, allowance and reminders
unchanged. Do not approve freeze first and fix overlap later. Concurrent renewal invalidates stale
preview and requires conflict review. Future schedule reminders change only after committed dates.

Early unfreeze terminates remaining frozen interval; recompute extension/consumed allowance from
actual elapsed dates, restoring unused days. Preview moving sold future renewals earlier; owner/
manager may accept the atomic shift. If earlier shift is declined, leave sold renewals at their
already agreed dates and explicitly show the resulting inactive gap; do not gift extra current
membership days to fill it. Frozen days not elapsed never count against allowance. Backdated correction
is owner/manager-only, audited and must satisfy the same date locks/conflict rule.

Fixture: base valid1–31 October 2026 (exclusive1 November), sold renewal starts1 November, allowance7.
Freeze30 October–3 November exclusive =4 dates, giving current exclusive end5 November. Approval
requires moving future renewal to5 November, valid through4 December under its one-month rule.
Declining shift rejects the freeze entirely. If member returns on1 November (after2 frozen dates),
current exclusive end becomes3 November; remaining allowance5. Accept earlier renewal shift to3
November or retain5 November with explicit gap3–4 November; no overlap, silent refund or altered fee.
A30-day default plan with only2 days remaining rejects a3-day request, even if new plan version has
more allowance. Leap-year/DST fixtures count calendar dates identically.

Membership cancellation requires reason/effective date, stops future attendance eligibility/reminders
and retains fee/payment history. Any waived fee/refund is a separate append-only finance operation;
cancel is not a hidden refund. Rejection shows an explanation to the member. Request spam/racing
approvals cannot produce duplicate extensions.

### 13.3 Fee ledger and balance

Use separate append-only charge, allocation and cash-principal events; never treat two related
events as two returns of the same money. All values are integer paise/currency. Charge C = sold fees
+debit adjustments−discount/waiver/credit adjustments. Valid received principal P = recorded payment
amounts−erroneous-payment reversals−actual refunds. Allocation A is the valid principal explicitly
applied to open charges. Outstanding charge dues =max(C−A,0); unapplied credit U=P−A, always≥0.
Account net balance C−P may be shown separately; **dues and unallocated credit must not be silently
netted** until credit application is confirmed. Sum allocations≤valid remaining principal, and each
charge's allocation≤its nonnegative corrected amount. Waiver/credit cannot exceed that charge's unreduced
amount. A charge reduction atomically releases now-excess allocation into unapplied credit; it never
erases received money. Standalone waiver200 on a fully paid1,000 charge gives C800/P1,000/A800/U200,
due0 and collections1,000; a subsequent actual200 refund consumes that credit once.

Payment applies to oldest open charge by default within currency or reviewed specific charges;
excess becomes unallocated credit. Applying credit later is a new allocation event, not new cash.
Opening balances are labelled charges, never invented historical collections. Due date defaults
membership start, overdue is outstanding after that date. Taxes stay disabled until reviewed setup;
enabled rate/basis/rounding are snapshotted under DEC-03, not a compliance promise.

| Operation | Charge/allocation effect | Collections/principal effect |
|---|---|---|
| Reverse erroneous payment | Leave charges; unwind specified allocations first, then associated unapplied credit; linked correction increases dues if applied money was fictitious | Subtract erroneous amount from recorded receipts; no actual outgoing money is claimed |
| Refund actual received money | Leave charges by default; use unapplied credit first, then explicitly chosen allocations; refunding applied money reopens corresponding dues | Subtract actual refunded amount; issue linked refund record, never an additional payment reversal |
| Fee reduction/service cancellation with refund | Append reviewed charge credit/waiver and separately record actual refund; allocation released once for refunded portion | Only the refund reduces collections; charge credit is not another cash outflow |
| Reversal + replacement | Atomic correction group reverses erroneous recorded amount/allocations and records correct actual payment with new allocations/receipt | Net correction old receipt−reversal+replacement; not a refund/second real collection |

Reversal is for a record that did not represent the claimed receipt (wrong amount/member/duplicate),
not a shortcut for returning real money. Refund means money was actually returned, requires reason,
returned_at/method/reference, and consumes remaining valid refundable principal. Each payment's
reversed and refunded portions must be disjoint; total≤original principal. A grouped refund+waiver
may be atomic, but refund+payment-reversal cannot both consume the same portion. Already refunded
amount cannot later be reversed as if it were unreturned cash. Wrong-member correction uses linked
reversal/replacement across both authorized records, with net gym cash unchanged. An erroneous refund
record is corrected by its own append-only refund-correction event with reason, not by pretending
another payment occurred. Actual provider/store refunds use their own immutable external event IDs.

**Worked finance fixtures (INR):**

| Starting state and action | Required result |
|---|---|
| Charge1,000; entered payment400 but nothing received; reverse400 | C1,000/P0/A0/U0, due1,000, corrected collections0 |
| Charge1,000; actual payment1,000; refund200 without fee waiver | C1,000/P800/A800/U0, due200, collections800 |
| Same, refund200 plus approved charge credit200 | C800/P800/A800/U0, due0, collections800; not600 |
| Charge1,000; recorded400, actually500; reverse400 + replace500 | C1,000/P500/A500/U0, due500, collections500; old receipt retained as reversed |
| Charge1,000; received1,200; refund150 from unused credit | C1,000/P1,050/A1,000/U50, due0, collections1,050 |
| Payment1,000 already refunded200, caller reverses same200 | Reject overlap409; C/P/A/U and collections unchanged |
| Payment1,000 assigned wrong member, correction group to right member | Wrong member's dues reopen, right member's dues reduce; total gym collections still1,000 |

Operations use payment/charge revisions and idempotency keys. Concurrent refund/reversal/credit
application cannot exceed remaining principal or reuse allocation. Summary displays fee charges,
outstanding due, unapplied credit, collections and adjustments separately, with correction links.

### 13.4 Payment recording and receipts

Record amount >0, method cash/UPI/bank/card-external/other, received time, optional reference and note.
Method indicates an already received payment; MVP does not process a card/UPI transaction. Show
member, charge allocation, resulting due/credit and Confirm. Atomic commit creates ledger allocation,
payment and immutable receipt, then updates due. Unique external reference warning helps avoid human
duplicates; mutation idempotency prevents network duplicates. Staff actor always recorded.

Receipt fields: gym identity/contact, member name/number snapshot, server receipt number, issue time,
received time, amounts/tax lines if enabled, method/reference, allocations and remaining due at issue.
Render downloadable/shareable PDF; English/Hindi labels. Sharing opens OS share sheet; external
messages require template/purpose rules. Receipt is private to member and authorized finance staff.

Specified numbering: `{gym-code}/{issue-year}/{six-digit-sequence}`, gym-local calendar year, unique
per gym/year. Assign number transactionally only on committed payment; rollbacks never consume one.
50 parallel successful recordings get unique gap-free numbers. Reversals keep original numbers;
never reuse deleted/voided numbers. Archived gym code cannot collide. Final receipt cannot be issued
offline: show local Pending payment acknowledgment with operation ID, then replace with server receipt.

Settled payments cannot be edited/deleted. Owner/manager correction appends full/partial reversal
(never more than remaining unreversed/unrefunded principal), reason, original reference, then optional replacement payment.
Section13.3 defines disjoint reversal/refund principal and exact cash/allocation effects. Owner/manager
can perform them; front desk cannot. Replacement/refund has its own numbered financial record linked
to the original; original receipt snapshot remains immutable. Refund-note numbering uses a separate
`{gym-code}/{year}/RF/{sequence}` transactionally committed sequence, not the payment receipt sequence.
Replacements get a normal new payment receipt; reversals have an audit event reference, not a claim
of outgoing cash. Export includes status/correction groups.

### 13.5 Money screens, reports and offboarding

Money tab: dues/overdue, received payments, receipts, date/method filters and member search. Reports
show active/frozen/lapsed/scheduled register counts, charges, collections, outstanding, reversals and
attendance by chosen local period. Collections are recorded receipts corrected by erroneous-payment reversals and reduced by actual
refunds, as section 13.3 defines; they are not profit/revenue recognition. Charges and collections
are separately labelled; correction groups are never counted twice. No tax return/accounting suite.

Owner export includes every gym table in machine-readable CSV, receipt assets/index, schema version
and manifest, ready within 24 hours. Neutralize spreadsheet formula injection in exported strings.
Download is time-limited and audited. Offboard: preview impact → request export → confirm read-only
closure/stop future jobs → unlink gym access under policy. Member account/personal history survives.
Retention/deletion follows section 22, not “delete every receipt now”.

## 14. Gym invitations and messaging

**IDs:** GE01–GE03. **Release:** MVP-G.

### 14.1 Invite and claim

Owner selects eligible row → preview gym-branded utility invite and purpose → send once → record
delivery/claim state. Token is random, non-enumerable, gym/row-bound, single-use and expires in seven
days by default. Code entry supports users without clickable links; rate limit incorrect attempts.
Do not expose phone/name/dues before authentication. Deep link survives install/login via a safe
deferred route/code; never rely on a hidden link that the member cannot recover.

Claim flow: gym name preview → sign in/verify addressed phone → age/notices → confirm register link →
operational notice/permissions review (no fitness sharing) → gym card. Token is not proof of identity. Phone mismatch cannot claim
without owner-reviewed register correction; existing-account matching never auto-merges. If linked to
another account, stop with support route and no disclosure. If already claimed by same user, open
card idempotently. Reject revoked/expired/wrong-gym tokens; owner can issue replacement after preview.

Invite statuses: not sent, queued, sent, delivered, failed, expired, revoked, claimed. An eligible
record has at most one live invite; resend cooldown 24 hours, original token revoked. Utility invite
permission/source must be recorded under approved enrollment notice, not assumed from imported phone.

### 14.2 Templates, scheduling and delivery

Only approved utility templates for invite, receipt, renewal and permitted exit follow-up. Registry
stores purpose, provider ID, language, approved copy/version, variables and authorization basis.
No marketing template may target a gym-supplied phone, even if a caller chooses the wrong enum.
Member marketing opt-in is separate; future broadcasts must establish a permitted recipient source.

Renewal default schedule: D−7, D−3, D0, D+3 relative to the **last included membership date** shown to
the member. Dispatch at 10:00 gym time, only 09:00–20:00. D−7/−3 require not already renewed; D0/+3
suppressed after renewal/cancellation/archive, during freeze, after opt-out or with invalid phone.
Recompute future events after end-date changes; never retro-send all missed reminders. New import
does not trigger backdated messages. SMS fallback, if permitted, occurs only after definitive WhatsApp
failure and shares the logical reminder key to avoid deliberate dual delivery.

Unique logical key = gym/member/membership/purpose/offset; schedule/notice versions are metadata,
not a way to resend an offset already dispatched. An end-date change reschedules only unsent offsets.
Queue/integrations must use an
idempotent dispatch record and provider key where supported. Retry transient failures (1/5/30 minutes,
max three), stop permanent/template/consent failures, verify webhook signatures and deduplicate events.
Late delivery callbacks do not downgrade Delivered to Sent. An ambiguous provider acceptance is held
for reconciliation, not blindly resent. Exactly-once in AC10 means one logical dispatch; external
transport cannot guarantee one handset delivery if the provider lacks idempotency.

Show queued/sent/delivered/failed, reason, timestamps and per-gym cost; no raw secrets. Spend reservation
is atomic across jobs. Configured daily/monthly gym caps and platform cap prevent dispatch over limit;
default real-send cap is zero until owner configures budget/provider/templates. Budget-paused message
shows why. Do not bill unapproved overage or send renewal text containing unconsented health details.

## 15. Attendance, coverage and retention

**IDs:** GE04–GE06. **Release:** MVP-G.

### 15.1 Visit sources and verification

Gym can record poster QR scans, staff marks and device-file imports; workout-at-gym creates a visit
candidate only after member chooses gym. Visit stores user/record, occurred_at/gym-local date, source,
verification class/reason, received_at, actor/import/QR reference and mutation key. No raw latitude/
longitude is stored in visit payloads, tables, analytics or logs. Configured gym location may be stored
as gym configuration; user location is evaluated transiently on device.

Poster is server-signed gym/version payload, no member data, downloadable printable PDF. Rotate/revoke
when compromised; old cached posters accepted only if not revoked at sync. A client-provided distance
band is low-assurance evidence, never proof against location spoofing. Tamper/signature tests required.

Check-in: select gym → permission primer → scan valid poster → evaluate location if permitted → durable
local record → success/sync status. Default radius 150 m, location reading age ≤60 seconds, accuracy
≤100 m; convert to inside/outside/unknown band and discard raw coordinates. Invalid QR is rejected;
out-of-radius/denied/unavailable location still saves an **unverified** visit. Manual self-check-in
without QR is unverified. Staff mark or recognized device import is **staff verified** with actor/source.
Valid QR + acceptable band is **self verified**. Original occurrence time survives offline sync.

Default dedupe: one counting visit/member/gym/local date; additional source events retained for audit,
highest valid evidence wins. Duplicate scans return existing visit rather than inflating counts.
Membership must be active/not frozen on occurrence date for challenge eligibility; lapsed member can
record an unverified visit and see renewal action. Staff may still record lapsed attendance for
operations, but it does not rank. Visits cannot block starting/logging personal workouts.

Client clock >10 minutes from known server time or offline sync later than 72 hours marks Needs review,
excluded from rankings until staff resolves. Staff correction/revocation is audited and standings/
alerts recompute. Future timestamps >5 minutes are rejected. Operational record is retained even if
participation eligibility fails. Participation eligibility is independent of challenge enrollment
and uses historical membership/freeze/link/age evidence at occurrence, as section 17 defines. Device-file import maps member ID/time/source, previews unknown/duplicate
rows and deduplicates by gym/device/external event ID; imports never create payments or identities.

### 15.2 Attendance coverage and alerts

Coverage is a data-quality signal, not inferred attendance completeness. Gym chooses coverage mode:
complete staff/device capture or partial app-only. Show missing import days and capture-health status.
Owners can verify operational coverage day by day; changing it is audited. Do not infer that an
unlinked member is absent because they have no app visits.

Specified absence rule: active, non-frozen membership, adult, not archived, at least 14 days elapsed
membership history, and no counting visit across the last seven open gym-local dates. **Higher confidence** requires
complete capture on all seven open dates plus at least two prior visits in the preceding 14-day period.
Otherwise alert says **Low confidence — attendance may be incomplete**. Closed days do not count;
unknown history gives coverage prompt, not a confident churn prediction.

Praise rule: three participation-eligible visits in current week or a new ordinary gym streak
milestone. Never mention private training/nutrition/body changes; staff do not have those reads. Alert record includes evidence period,
rule/version, confidence explanation, created time and status. Owner Today’s calls sorts overdue
renewals, high-confidence absence, low-confidence coverage and praise separately. Manual click-to-call/
WhatsApp opens the owner's selected app; MVP does not make automated AI calls.

Outcomes: not contacted, contacted, already attending/false alarm, plans to return, renewed, wrong
number, declined, no response. Store operational disposition separately from **absence verification**:
Verified absence, Verified false alarm or Unknown, with period/evidence/actor. Member explicitly
confirming no attendance in evaluated interval or complete verified capture can support absence;
verified visit in that interval or explicit member confirmation of attendance supports false alarm.
“Plans to return” supports absence only with explicit confirmation of the evaluated interval.
Contacted/renewed/wrong number/declined/no response do not automatically prove either state.
Absent evidence remains Unknown. Precision =verified absence÷(verified absence+verified false alarm);
Unknown/unresolved excluded with count shown, low-confidence alerts separately reported. Fixture:
10 resolved contact outcomes:4 verified absence,2 verified false alarms,4 unknown → precision4/6=66.7%,
coverage6/10; no-response cases cannot inflate precision. Snooze default7 days; resolve suppresses
same-rule duplicate period. Exit reason remains optional cost/relocation/schedule/service/personal/
other/prefer-not-to-say, without clinical detail.

## 16. Gym programme offers and operational permissions

**Removed IDs:** GT01–GT04 are retired, not reassigned: private trainer reads, trainer assignments/
measurement writes, gym health-sharing controls and their purpose-specific consent audit requirements
are removed. General operational/AI/challenge consent audit remains under ID06/GC01/GE01/GE07/section 22.
G21.api/G21.app retain their original template-to-member-copy portion with the reduced scope below;
their dedicated trainer workspace/member-data parts are withdrawn. No T-family screen is a build task.

| Retired requirement | Former behavior | Current disposition |
|---|---|---|
| GT01 | Consented trainer reads of training/body/nutrition | Removed; no gym staff health-read permission |
| GT02 | Trainer assignments and staff-recorded measurements | Removed; staff measurements forbidden. Original member-owned template-copy capability remains under TR02/G21, not a reuse of GT02 |
| GT03 | Per-gym personal health-sharing controls | Removed; N-05 now controls independently required operational permissions |
| GT04 | Consent/audit contract for trainer health sharing | Removed with that purpose; general append-only operational/AI/challenge audits remain required under existing account/gym requirements |

### 16.1 Data boundary and permissions

Gym linking exposes only register/membership/payment/visit records owned by that gym. Owner, manager
and front desk cannot read/write personal sessions, food, body entries, goals, private photos or raw
AI results. There is no launch switch that enables it. Deny every such staff read/write even when a
legacy sharing/assignment flag appears in a request. A gym programme offer is not fitness-data consent.
A future coaching/private-sharing product would require a new approved role-free scope, notices,
permissions, retention and acceptance scenarios; it is not included in the committed P2 roadmap.

Keep operational enrollment/utility permission, challenge opt-in, AI permission and future voluntary
passport access as distinct, append-only purpose events. N-05 becomes Gym permissions: explains
operational access and permits utility/challenge choices, unlinking and future passport revocation,
without training/nutrition/body switches. Staff-cache rules in section 20 concern operational data only.

### 16.2 Owner/manager programme offers

Owner/manager create/edit/archive/reorder gym programme templates under More → Programmes. Template
contains the same prescription fields as personal plans, never private member health history. Choose
an eligible linked adult, select version, preview programme/name/gym and send in-app offer. Front desk
cannot offer/edit templates. Member sees proposed plan and Accept/Decline; there is no automatic replace.
Acceptance deep-copies exactly offered version into member ownership once, with gym/source/version/date
provenance. Member optionally selects it as current weekly programme in a separate explicit action.

Owner/manager can see only offer status pending/accepted/declined/withdrawn, not the member's edits,
sets, progress or whether workouts were performed. Editing template creates a future version; existing
offer and accepted copy stay stable. Withdrawal cancels only pending offers; accepted copy is member
property and survives gym unlink/offboard/template deletion. Member edits never update gym template.
No staff body measurement editor, roster of clients or health-read route is created.

Fixture: owner offers templatev1 to member, edits gym template tov2, member acceptsv1 twice. Exactly
one owned v1 copy results; owner sees Accepted only. User edits copy and unlinks; own plan/history
remain, gym cannot read changes or revoke owned copy. Manager health-read and measurement-write
requests fail; retired trainer role cannot be issued.

## 17. Challenges, streaks and referrals

**IDs:** GE07–GE08. **Release:** MVP-G; automatic rewards/break mode P2.

Define three distinct visit concepts so private consistency does not require joining a challenge:

1. **Operational visit:** valid retained attendance event; may be unlinked/lapsed/unverified and visible
   to authorized staff. One deduplicated attendance date per member/gym, other evidence retained.
2. **Participation-eligible visit:** adult linked at occurrence, active non-frozen membership on that
   gym-local occurrence date, non-archived then, accepted self/staff verification and no unresolved time
   review. This fuels the member's ordinary private gym streak, without any challenge opt-in.
3. **Challenge-counted visit:** participation eligible **and** occurred within challenge period and
   after current enrollment opt-in timestamp. One/date. Challenge participation is optional.

Later normal membership expiry, new future freeze or gym offboarding does not erase historically valid
participation/challenge visits. Snapshot occurrence eligibility and its supporting revisions. Explicit
backdated membership/freeze correction, visit evidence revoke or mistaken link/age correction rebuilds
affected history with audit, rather than applying today's status to all old visits. Unverified events
do not rank or build streaks but remain operational. Workout/food logging is unrelated to eligibility.

Gym challenges are attendance-only: name, local start/end-exclusive dates, adult opt-in, visit target,
active/closed. Default monthly calendar challenge. Owner cannot award hidden points. Leaderboard sorts
count descending, time reaching count ascending, stable ID last; rule labelled. Name first+last initial
or safe alias, no phone/fees/body. Opt-out immediately removes current public standing and future share
cards, retains private attendance/streak. Rejoin is allowed while open, counting only visits after new
opt-in timestamp; it does not restore pre-opt-out challenge credits. Prevent same-date double count
across enrollment sessions. Closed snapshots retain aggregate results, but a later privacy opt-out
removes member identity/row and permitted corrections update standings. No cross-gym ranking.

Weekly ordinary streak =≥3 participation-eligible dates/Monday–Sunday, regardless of challenge
enrollment. Evaluate at week close; current partial labelled. One explicit streak-freeze token/calendar
month can preserve one missed week without adding visit credit, separate from membership freeze.
User applies within7 days after week close. Disable streak display if desired without destroying
attendance; there is no public ordinary-streak board. Membership freeze does not automatically consume
a streak token or grant challenge points.

Fixture: adult with three valid visits but no challenge enrollment earns ordinary streak and has no
leaderboard row. Enroll10 October, visit11 October counts; opt out12 October removes row; rejoin13
October makes only new13+ visits count. A membership ending15 October leaves11/13 valid visits in
standings. Backdating a legitimate freeze over11 October invalidates that visit's participation and
recalculates standings/streak with reason. Membership renewal later does not make a formerly lapsed
visit retroactively eligible.

Share card previews gym branding, voluntarily selected achievement/alias and no private details.
Gym branding can be omitted by member. OS share sheet requires deliberate action; no automatic public
post. Referral code belongs to member/gym, expires/revokes with gym relationship, tracks referred
lead → joined → linked. Prevent self-referral and duplicate attribution; earliest valid confirmed
code wins, with owner-reviewed correction/audit. Collect lead phone only with the lead's notice/
authorization. No automatic financial reward at MVP; owner sees attribution without a fabricated
payout. Member freeze request is section 13, not gamification reward.

## 18. Pro, billing and entitlements

**IDs:** PR01–PR06. **Release:** Member Pro MVP-M; owner/expanded AI P2; ads P3.

Free includes unlimited ordinary manual training/food/body/goals/history/analytics and gym core, subject
to documented anti-abuse/storage limits. Member Pro MVP includes text/photo food AI. No ads at launch.
All billable AI checks server entitlement, not hidden-button state. A gym employee's entitlement does
not unlock members' personal AI; gym-bought seats are P2.

Paywall shows real localized store price, billing period, renewal, trial terms, benefits, purchase,
restore, terms/privacy and dismissal. Specified default seven-day store trial only where eligible;
eligibility comes from store, no repeat trial after reinstall/account recreation. Final price/SKUs
are DEC-06; ₹149/month and ₹999/year in old packs are indicative, never hardcoded promises.

Entitlement states: free, trial_active, pro_active, grace, expired, revoked. Store events are signed,
deduplicated and mapped to account via stable purchase identity. Grace lasts exactly the provider's
verified period; stale client receipts do not extend it. Cancelled renewal remains active until paid
expiry; refund/revocation removes future AI permission after verified event. Purchase pending is not
active. Handle cancelled/failed/pending/success purchases, Restore and Manage subscription deep link.
If store succeeds but backend confirmation fails, show Verifying and reconcile; do not charge again.

Store purchase restoration cannot attach the same purchase to two users; conflicting identity prompts
reauthentication/support. Account deletion does not itself cancel a store subscription; deletion
screen explains how to manage it. Expiry never deletes meals, programmes, photos or prior analyses.
Ready-result review/confirmation remains available. Offline cannot start new AI and cannot rely on
a cached entitlement to call a provider.

Record trial/purchase/renewal/expiry/revocation events, AI use/cost and webhook reconciliation outcomes
without card details. Admin grant/revoke is restricted, expires, states reason and is audited. Owner
Pro will have separate gym-scoped entitlement and billing, not an accidental reuse of member SKUs.


### 18.1 Personal storage and anti-abuse policy

Free manual training/food/body/history has no lifetime entry cap. Free/Member Pro both include **1 GiB
(1,073,741,824 bytes) active personal image storage and2,000 image assets**, whichever reached first;
counts include normalized food/progress originals+thumbnails and reserved pending uploads, not gym
receipts, locally generated share cards or temporary export bundles. No different cap/downgrade
eviction for Pro. Max input10 MB, stored normalized original≤5 MB/image; oversized normalization asks
compress/retake. At most10 open upload reservations/user, expiring after10 minutes. Temporary AI
input occupies space until section 22 expiry or explicit deletion; saved diary image is a retention
choice, not an unlimited-storage entitlement.

Atomically reserve bytes/assets before signed upload; finalize validates actual bytes and adjusts
reservation, rejects over-cap race, cleans unattached object. Limit-reached UI shows usage/limit,
choose existing photos to download/delete or continue manual logging without photo. No model call/
AI allowance consumption for rejected storage reservation. Member can view/export/delete existing
records/photos even at limit; ordinary text tracking remains usable. Never automatically erase
existing assets to make room. Lowering a future limit requires notice; over-limit existing data stays
readable and only new image uploads pause. Confirmed nutrition survives image deletion/expiry.

New personal write requests limited to120/minute and5,000/day/user, reads600/minute; mutation replay
returns prior result without creating/counting another record. API429 shows wait/retry with draft
preserved. Import/export/deletion use separately controlled job limits (one active export, one import,
one erasure request/account) and are not blocked by personal-image quota. These are anti-abuse traffic
limits, not paid manual-tracking caps. Gym operational budgets and provider caps remain separate.
Progress/saved food images retained until deletion; ordinary unsaved AI images30 days, unattached/
failed uploads24 hours. Individual delete removes primary image/thumbnails within24 hours; quota
releases after confirmed primary deletion, pending status visible; full account/backup lifecycle
remains section 22. Export link48 hours, regeneration available without increasing personal quota.

## 19. Navigation, screens and system states

### 19.1 Workspaces and visual rules

Member navigation: Today · Train · Food · Progress · Gym. Before gym pilot is enabled, hide Gym;
after enablement, unlinked members get Join gym rather than an empty card. This no-membership state
is the selected navigation rule (DEC-01). Global quick actions: start/resume workout, add food,
AI photo/text if entitled and log body. Active session has a persistent recovery affordance.

Owner/manager navigation: Today · Members · Money · Visits · More. Front desk uses same shell with
unauthorized actions absent. No trainer navigation exists. Workspace switcher lists only
active authorized gym memberships and Personal. Deep links resolve identity, tenant, consent and
entitlement before opening content. Denied/not-found routes return safely to current workspace.

Momentum: near-black/light themes, volt lime seed #C6F432, accent/neutral hierarchy, violet only for
AI proposals, gym color only on branded surfaces and error red only for errors/dues. One prominent
purpose/action per screen, 96 dp Log set action, platform-native Android/iOS behavior. No green chart
series that conflicts with lime. Use approved font licenses and Hindi glyph support. Do not copy
visual sample coach suggestions into live app when the underlying feature is deferred.

### 19.2 Screen completeness checklist

The screen codes refer to the locally documented Momentum inventory; layout verification requires
the actual Figma file during implementation. The table lists functional destinations, including
states not visible in a single hero frame.

| Family | Required destinations and states | Release |
|---|---|---|
| A auth | Splash/welcome, signup/login, reset/verify, phone/OTP, age/notices, resumable onboarding, target review, starter plan, completion | MVP-M |
| A gym join | Invite/code, gym preview, claim/consent, expired/wrong-phone/already-linked | MVP-G |
| B Today | Today, card customize, quick-action menu, notifications, personal search | MVP-M; gym cards MVP-G |
| C plans | Train hub, programme list/detail/edit, day editor, picker, prescription, schedule/archive | MVP-M |
| D exercises | Library, detail/instructions, custom editor/muscles; names/merge later | MVP-M; merge P2 |
| E logging | Start/resume, session list, logger, rest, add/swap, advanced set, notes, finish/discard/recovery, plates, supersets, provisional/final PR | MVP-M |
| F history | List/filter/detail/edit, previous occurrence, comparison/calendar | MVP-M |
| G analytics | Overview, volume, exercise progression, records, muscle balance, adherence, formula explanation | MVP-M |
| H food | Diary/meal, input chooser/search/portion, text/photo/processing/review, custom food, recipes, copy/quick add, analytics/targets/categories, analysis audit | MVP-M |
| I/J progress | Body log/weight/measurements/photos/fields, goals list/create/detail/outcome | MVP-M |
| K settings | Profile/security, units/language/theme, logging/reminders, privacy/export/delete, AI permission, feedback/about/licenses | MVP-M |
| P Pro | Paywall/trial/manage, locked/loading/verifying/restore states | MVP-M |
| N gym member | Gym card/scanner/check-in outcome, receipts/dues, operational permissions, gym programme offer, challenge/referral/freeze | MVP-G |
| O owner | Create/switch gym, Today, register/detail/add/import, plans/renew/freeze, payment/receipt/dues, visits/import, calls, staff, reports, challenge, export/coverage | MVP-G |
| T retired | T-01–T-05 removed; historical Figma frames are not build requirements | Not delivered |
| L system | Empty/filtered empty, loading/offline/sync centre, error/not found/session expired, permission primer, conflict, degraded/maintenance | Both MVPs |
| Deferred | Barcode/connected apps, voice sets/review/questions, Owner Pro/calling/register reader, break mode/passport/web; PT/assessment/floor/coaching removed | P2 |

### 19.3 Shared UI states

Every data screen has initial loading, data, empty, filtered-empty, stale offline, recoverable error
and unauthorized states where applicable. Retain valid cached content during refresh failure with
Last updated; never replace successful existing data with a spinner indefinitely. A submit shows
pending/durable/synced or rejected state; retries keep input and mutation identity. Errors explain
the action the user can take and include a support reference without stack trace/secrets.

Permission primers occur only before use, followed by native prompt; do not repeatedly prompt after
denial. Allow manual alternatives. System maintenance banner states affected capability; read-only
maintenance preserves workout local writes. Notification inbox persists transactional notices,
supports read/unread and direct destination; private content is hidden from lock-screen payloads.
Local user reminders obey selected days/time and opt-out, are updated after preference changes and
do not send fake “you missed a workout” pushes based on unavailable data.

## 20. Offline behavior and synchronisation

### 20.1 Capability matrix

| Operation | Offline MVP behavior |
|---|---|
| Start/log/edit/finish workout | Works with saved catalog/plan context or locally defined exercise; durable outbox |
| Prior performance | Last downloaded workout context with date/stale label; unavailable data never blocks |
| History/analytics/food diary reads | Already-open cached data may display; full persistent read cache P2 |
| Meal/body/configuration mutation | Online in MVP; preserve unsaved input, explicitly require reconnect |
| Gym self/staff visit | Durable outbox with original occurrence time, pending verification |
| Staff payment record | Durable provisional record, no final receipt number until server commit |
| Permission/role/programme offer/freeze/reversal | Online only; no cached permission used to commit sensitive changes |
| AI/purchase/invite/export | Online only, with preserved input/recoverable state |

Minimum persisted context includes owned active plan, associated exercise versions, previous values,
current session, outbox, permitted gym poster metadata and user's own gym card. Do not download
arbitrary member health data for offline staff use. Connectivity UI says what is available, never
“saved to cloud” merely because a local transaction completed.


### 20.1.1 Minimum operational offline cache

Owner/manager/front desk may explicitly download their gym operational roster encrypted/account-
isolated: gym/member stable ID+number, display name, archived flag, adult eligibility status, linked
flag, purchased membership start/end/freeze intervals, currency, open charge IDs/remaining amount,
unallocated credit and last-sync revision/time. Do **not** cache phone/email/address/admin notes,
payment references/receipt images, personal fitness/body/food/photos or provider tokens in the roster.
Own member gym card may retain their own dates/dues/verified poster, labelled stale; no other member data.

Roster freshness: refresh on foreground/network and after operational changes; display Last synced.
Offline marking/payment requires cache≤24 hours old and prior authorized staff session for same gym;
older cache may show minimal names/numbers with warning but cannot create new staff mutations.
Purge all downloaded roster after72 hours without successful authorization refresh, logout/account
switch, detected revocation or gym offboarding. A cached role is never authority at server sync.

Queue captures roster revisions and occurrence/received time. On sync, server checks **current** staff
role and gym state plus historical member membership/archive status at event time. If current member
is archived/lapsed after occurrence but was eligible then, retain original visit and historical
eligibility. If archived/frozen/lapsed at occurrence, attendance can remain operational but cannot
rank. Conflicting backdated changes require review. Payment received against a now-archived row is
Needs attention: owner/manager verifies receipt and current allocation, not automatic rejection of
real money or accidental reactivation. Changed charge balance/revision does not silently apply stale
allocation: review current charge list or keep real received money as reviewed unallocated credit.

Rejected/revoked-staff visits/payments stay encrypted local Needs attention with no receipt/verified
visit issued. Staff cannot push it through with cached credentials. Reauthenticate with an active
owner/manager on the **same device** to review listed operational events after explicit local handoff;
or active owner grants a one-use signed secure reconciliation upload channel for specific event IDs.
This is an explicit local handoff creating a new owner-authorized operation; account switching never
relabels/sends the former user's original outbox as the owner. Original revoked user
does not regain roster/finance access. Owner verifies actual receipt/attendance, selects accept/reject
and submits a new authorized reconciliation referencing original operation ID/actor/time. Unique
reconciliation key permits one accepted replacement and rejects later original replay. Never edit
receipt time to “now” or imply former actor currently authorized. Cancel/reject stores local reason
and offers owner-controlled dispute follow-up; no fake payment/refund is generated. Self-visit with
gym link revoked before sync needs authorized attendance review; personal workout queue is unaffected.

### 20.2 Durable outbox and acknowledgments

Use encrypted local database, account-isolated, with one transaction for record + operation. Each
operation has UUID, user/tenant, entity ID, type, base revision, payload, local time, dependencies,
attempt count and status. FIFO within dependent entity chains; one failed entity need not starve
independent work. Create session precedes sets, sets precede finish; queue replay preserves order.
Server remembers mutation outcomes for at least 90 days; entity unique IDs additionally prevent
duplicates after dedupe retention. Delete tombstones propagate before summaries rebuild.

Automatic retry on transient failures uses exponential backoff with jitter, starting 2 seconds,
capped 5 minutes. Permanent validation/auth/consent errors enter Needs attention, not infinite retry.
401 pauses sync, prompts login; it does not silently discard queue. If role revoked while staff payment
queued, reject and preserve it for authorized reconciliation, without issuing a receipt. Outbox centre
shows pending/syncing/synced/rejected/conflict, safe reason and retry/export/discard actions as permitted.

Logout with pending work warns and offers Sync first or explicit discard; account switch cannot send
another user's queue. Account deletion cancels uploads and clears local data after request acknowledgment.
Device storage full gives unsaved error rather than success; logging must never acknowledge an uncommitted
local write. Model calls cannot be queued for later surprise billing.

### 20.3 Conflicts and multi-device sessions

Different new set IDs may merge; same-set edits/deletes require matching revision. Server sends conflict
with current authorized state and proposed local version. User chooses Keep server or apply a reviewed
new correction; no silent last-write-wins for performance or finance. Payments are independent append-
only events; identical operation deduplicates, suspected distinct real-world duplicate needs finance review.

If two devices start offline workouts, first accepted session is server-active. Second is retained as
Conflict draft. Options: finish/discard server session then sync local as separate session, or discard
local after explicit review. Never erase it automatically or mark two sessions active. Finished offline
sessions may sync as completed historical sessions with preserved start/end once collision resolved.
Local provisional PR/dues can change after reconciliation and must be labelled until verified.

## 21. Data model and service contract

### 21.1 Technical responsibilities

Required logical components: mobile clients, authenticated versioned API, relational transactional
store, private object storage, durable worker/jobs, scheduler, identity provider, subscription adapter,
AI gateway, messaging adapter and monitoring. PostgreSQL is the recommended relational baseline;
React Native/Expo is a proposed mobile default, not proof an old app remains. Provider/hosting choices
require architecture record. Do not recreate removed file paths without deciding the new structure.

Clients never receive service-role secrets. Database constraints enforce ownership/foreign keys,
unique mutations and receipts, ledger integrity and active-session uniqueness. Cross-tenant composite
references cannot point to a different gym's member. Cached derived tables are not sources of truth.
Permission-filtered queries and signed objects must use the same policy contract.

### 21.2 Logical entities

All mutable entities have ID, created/updated time and revision; archived/deleted fields where relevant.
Append-only entities have creation/actor/correlation references and correction links, never destructive
updates. UUIDs are recommended. The supplier's migrations must document exact types/nullability,
indexes, constraints and cascade/retention behavior for these minimum fields.

| Entity | Minimum fields and relationships |
|---|---|
| User/Identity | status, nullable verified phone/email, provider identity unique ID, DOB/age check, accepted notices |
| Profile/Preferences | user 1:1, name, locale/units/timezone, optional canonical inputs, activity, UI/reminders |
| Exercise/ExerciseVersion | global or owner, type/load semantics, names/aliases/instructions, active/version |
| Muscle/ExerciseMuscle | canonical muscle hierarchy; exercise-version M:M role/weight mapping |
| Programme/PlanDay/Prescription | owner or gym template, lineage/version, ordered days/instances, target fields |
| ScheduleOccurrence | owner/day-version/date, expected start optional, status, linked completed session unique |
| Session/SessionExercise | user/source/snapshot, start/end/timezone/date, pause intervals/status, order/notes |
| Set/SetRevision | instance, reps/load/time/distance/RPE/RIR/type, performed time, multiplier, mutation/revision |
| PersonalRecord/TrainingSummary | user/exercise/version/type/value/unit, contributing IDs, formula version, period |
| Food/FoodSource/Serving | global or owner, nutrient basis/nullability, source/license/version, supported conversions |
| Recipe/RecipeVersion/Ingredient | owner, yield/unit, ingredient snapshots/order and incomplete flags |
| Meal/Category/MealItem | owner/consumed time/date/category snapshot; item quantity/conversion/nutrition/source/confirmation |
| FoodAnalysis/Candidate/Correction | owner/input asset or text, job/model/prompt/status, raw result, candidates/corrections/item links |
| NutritionTarget/Version | owner/effective dates, kcal/macros, formula inputs/version, approval timestamp |
| BodyField/BodyEntry/Photo | owner/field/unit/value/time/date, personal source/provenance, private asset IDs/caption/view |
| Goal/GoalRevision | owner/type/metric/baseline/target/range/dates/status, formula and revisions |
| Organisation/Gym | ownership, settings, brand, timezone/currency, location config, status/notice/tax config |
| StaffMembership/ProgrammeOffer | gym/user/owner-manager-front-desk role/status; offered template version/member/status; no health assignment |
| GymMember/ImportBatch/Row | gym-number/external ID, name/contact/age/tags/notice, optional linked user, import result |
| MembershipPlan/Version/Membership | gym/plan snapshot/member, start/end, due date, status-history references |
| FreezeRequest/FreezeEvent | membership, interval/reason/status/approver, extension/correction references |
| LedgerEntry/Allocation | gym/member/currency/minor amount/type/effective date/charge, reversal links, actor |
| Payment/Receipt | ledger/payment method/reference/received time, immutable snapshot, number/year/sequence/status events |
| Invite | gym/member/token hash/expiry/status, verified recipient/claim operation and send references |
| ConsentEvent/CurrentConsent | user/gym/category/purpose/notice/grant-or-revoke/time; materialized current scope |
| Visit/VisitEvidence | gym/member/time/date/source/band/verification/review, source IDs; no user coordinates |
| CoverageDay/RetentionAlert/Outcome | gym/date/capture state; member/rule/period/confidence/evidence/outcome |
| Challenge/Enrollment/Standing/Streak | gym/date/rules/version; opt-in member, eligible event references, totals/token events |
| Referral/Attribution | gym/referrer/token/referred record/stage, consent/source/correction |
| Entitlement/Event/UsageReservation | user or gym/product/source/expiry/status, verified event IDs, quota/cost |
| Message/Delivery/Template | gym/member/purpose/language/version/logical key, provider ID/status/cost/auth basis |
| Asset | private owner/scope/key/type/size/sanitized status/retention/deletion; no permanent public URL |
| Job/Mutation/Audit/Export | operation identity/dependencies/status/result; scoped actor/target/action/reason and export manifest |

Indexes must support user+local-date history/diary, exercise history, active membership ranges,
gym+member lookup, due amounts, visit date/source, consent lookup, job availability and dedupe keys.
Deleting a linked User must SET NULL the gym link and apply retention policy, never cascade-delete
gym receipts. Personal deletion removes private entity graph/assets and recalculates derived rows.
An export must not rely on an ORM silently omitting archived entities.

### 21.3 API semantics

Version prefix `/v1`; authenticated identity derives owner, not caller-supplied user ID. Resource
names below are logical minimum interfaces; exact paths may be finalized in OpenAPI while preserving
behavior. Success has data/revision/request_id; errors have code/message/field_errors/request_id,
retryability and authorized conflict details. List cursor, limit (default 50/max100) and stable sort;
date/range/timezone semantics match section 4. Mutation header/key required for retriable writes.
PATCH requires base revision/If-Match where mutable. Server commits before returning success.

| Domain | Minimum operations |
|---|---|
| Identity/profile | Verify/link identities; get/update profile/preferences; session list/revoke; notices |
| Catalog/plans | Exercise search/detail/custom create/edit/archive; programme/day/prescription CRUD/order/schedule |
| Sessions/sets | Start/get active/recover; instance/set create/edit/delete; finish/discard; mutation-result lookup |
| History/analytics | Filter/calendar/detail/compare/previous; volume/frequency/e1RM/PR/adherence ranges |
| Food | Search/servings/custom CRUD/archive; recipes/categories/favorites; meals/items/copy/quick add |
| AI | Private upload intent/finalize; text/photo job create/status/cancel/retry; candidate correction/confirmation |
| Nutrition/body/goals | Targets/version preview; totals/analytics; fields/entries/photos; goals/status/revisions |
| Gym setup/staff | Create/update gym; permitted gym list; roles/owner transfer |
| Register/import | Member list/detail/create/edit/archive; template/map/validate/commit/results |
| Membership/finance | Plan versions; renew/freeze decision; charges/allocations/payment/reversal/refund/receipt/report |
| Invitation/member gym | Invite/send/revoke/claim; own gym card/dues/receipts/operational permissions/programme offers/requests |
| Attendance/retention | Self/staff visits; device preview/commit; coverage; calls/outcomes/exit reason |
| Programme offers/challenges | Owner/manager templates/offer/accept/decline; enrollment/standing/referral; no staff health API |
| Pro/messages | Entitlement/quota; verified subscription webhook; message statuses/provider webhook/cost |
| Account/gym lifecycle | Export job/status/download; deletion request/status; gym offboarding |
| Operations | Public minimal health/version/status; private readiness/metrics/job retry/audited support |

Status codes: 400 invalid shape; 401 missing/expired identity; 403 known forbidden action; 404 missing/
cross-tenant resource; 409 state/revision/identity conflict; 413 oversize; 422 field rule violation;
429 rate/quota with retry_after; 503 temporary unavailable. AI feature denial has code
`PRO_REQUIRED`, plus permitted paywall metadata, before any provider call. Async operations return
202/job ID, not fake completion. Signed webhooks use raw-body verification and provider event dedupe.

Illustrative set request (exercise semantics come from authorized instance; client cannot override them):

```json
{
  "operation_id": "client-generated-uuid",
  "set_id": "client-generated-uuid",
  "session_exercise_id": "authorized-instance-uuid",
  "base_revision": 1,
  "reps": 8,
  "load": { "value": "80", "unit": "kg" },
  "set_type": "working",
  "performed_at": "2026-10-11T13:30:00Z"
}
```

Illustrative candidate confirmation: `{operation_id, analysis_id, meal_id, candidate_ids,
correction_versions}`. Server validates ownership/current correction versions and responds with
confirmed item IDs and revised totals. Request replay returns the same IDs. Decimal JSON must have
one documented precision-safe encoding; money uses integer minor units. Shared client/server fixture
vectors verify conversions/calculations so different languages cannot drift.

### 21.4 Reference content and migration

Deliver licensed/source-reviewed exercises, starter templates, ≥500 Indian foods, aliases/servings,
muscles, English/Hindi string catalogs and safe demo fixtures. Seed script is idempotent and preserves
user rows. Fresh reset does not imply importing the old database. Account/workout/food migration from
old versions is an external decision (DEC-15). Gym CSV migration is required as specified.
Strong/Hevy workout and food CSV imports are P2 defaults here; old deleted screens are not launch
evidence. All accepted import formats need preview, timezone/unit mapping, duplicates and row errors.

## 22. Privacy, security and data lifecycle

### 22.1 Access and information protection

TLS in transit, encrypted managed storage/database/backups, secrets only server-side, scoped sessions
and short-lived private URLs. Signed asset URL default five minutes, upload URL ten minutes, bound
to owned object/size/type; issuance rechecks access. No permanent public progress/food/receipt URLs.
Use authorized proxy or revocable access where immediate revocation is required; staff never receive
URLs for personal health assets. Future passport links are independently revocable. Lock-screen notifications carry generic copy + safe destination ID.

Enforce user ownership and tenant/operational-permission policies on every endpoint, worker and download.
Route inventory isolation tests include filters, guessed IDs, exports, assets and jobs. Staff role
cache cannot extend revoked permission. Audit gym finance, consent, roles, export, support access and
sensitive reads. Access/audit logs retained at least one year, with payload minimization; never log
OTP, token, raw AI input, photos, health values or location. Audit access itself is restricted.

App local secrets use platform secure storage; local database is encrypted and account-isolated.
No analytics SDK receives private screen input/health values. Operators cannot impersonate users
by default. Any support data access needs a ticket, scoped time-bound grant, reason and audit;
no public “admin read everything” API. Security review covers input/file abuse, webhook forgery,
replay, prompt injection, credential leakage and cross-tenant object access.

### 22.2 Consent and legal gates

Record purpose/notice version for terms, AI processing, gym operational linking, utility contact,
challenge opt-in, future passport grants and optional
future marketing/calls independently. Explain revocation consequences plainly. Gym enrollment notice,
controller/processor allocation, DPA, minors policy, messaging basis, retention and international
deployment require qualified review. This PRD specifies behavior; it is not a legal compliance opinion.
No legal/calling/minors approval is assumed from a draft owner pack. Gym pilot must not start without
approved notices/terms and utility template setup.

### 22.3 Export and erasure — specified operational defaults

Personal export within 24 hours: machine-readable JSON/CSV, schema/unit/timezone/version manifest,
plans/sets/history, confirmed meals/raw analysis retained, body/goals, profile/preferences and consent
events. Private assets available through authenticated bundle/download. Exclude another member's data
and gym staff-only notes. Link expires after 48 hours; allow regeneration. Export does not delete data.

Personal delete: reauthenticate → show pending sync/subscription/gym-ledger consequences → confirm →
revoke sessions and access immediately → background purge. No mandatory retention of personal photos
to keep a subscription usable. Default primary-store erasure ≤30 days, with gym receipts/legally required
security records handled under the reviewed schedule. Progress visible by request ID; web deletion
request route supports users without installed app. A failed purge alerts operators and retries.

Default personal assets persist until user deletion; temporary failed/unattached food uploads expire
after 24 hours; AI food photos expire after 30 days unless member explicitly saves them to diary;
raw analysis/corrections remain until deletion. Warn before input image expiry and show Image expired
in history without losing nutrition records. Retention worker removes orphan originals/thumbnails.

Gym unlink/deletion: revoke operational link and future voluntary passport grants, stop reminders to that account, retain gym-owned
operational records only under approved purpose/retention, handle identifying fields per counsel and
stop unnecessary outreach. No hardcoded statutory financial retention period; DEC-04 is a release
gate. Gym erasure request is logged/reviewed; records subject to lawful hold are restricted and
explained, not silently promised erased. Offboarding stops future jobs while allowing export.

Backups have documented expiry ≤90 days by default; purge tombstone register prevents deleted users
being resurrected after restore. Backup retention exception needs a recorded reason/review. Photo
backup/PITR choice must be explicit before production; no assumption database backup includes objects.

## 23. Quality, operations and measurement

### 23.1 Nonfunctional acceptance budgets

| Area | Required budget / verification |
|---|---|
| Set commit | p95 <100 ms tap→durable local confirmation, release build, ≥200 commits across ≥20 sessions |
| Owner list | p95 server response <300 ms for paginated 1,000-member tenant, ≥500 requests, ≤20 concurrent clients |
| Self check-in | p95 <3 s scan recognized→durable result on reference device/3G; cold permission negotiation reported separately |
| Gym cold start | p95 <3.5 s process start→cached actionable own gym card, ≥30 cold starts; fresh-login network flow measured separately |
| Common API | Selected default p95 <300 ms excluding file transfer/AI, staging-like data/load; report end-to-end network separately |
| Availability | Selected launch SLO 99.5% monthly for API core; local logging continues during service outage |
| Reliability | Zero acknowledged local-set loss in fault suite; production lost-session rate <0.1% guardrail |
| Crash-free | Selected ≥99.5% sessions during beta, with sample count; investigate repeated core-path crash before release |
| AI | Async status accepted <1 s server time; selected p95 ready <60 s, terminal status within five minutes |
| Package size | Selected Android download ≤60 MB excluding future optional exercise media |
| Backup recovery | Selected production RPO ≤15 min database, RTO ≤4 h; photo policy/accepted gap separately recorded |
| Accessibility | WCAG 2.2 AA principles, ≥48 dp target, logger ≥56 dp secondary actions/96 dp primary, screen readers/large text |

Reference low-end Android default: 4 GB RAM Android 12-class ₹8–10k device, exact model/OS recorded
before performance acceptance. Also test current Android and an older supported real iPhone. Selected
minimum OS Android 10/iOS 16 pending dependency/native feasibility decision (DEC-12). No claim these
budgets were measured. Fix a test network profile (e.g. 1 Mbps down/256 kbps up/300 ms RTT) for 3G
reproducibility; report actual radio tests separately. Use release builds, never debug timing as proof.

Reduced Motion replaces spatial/celebration motion with immediate state changes; no flashing. Text
scaling up to 200%, Hindi wrapping and accessible point readouts without clipping. TalkBack/VoiceOver
announce logger values/actions/status. Contrast is tested in both themes; color alone never means
due/verified/PR. Timer sound/haptics have alternatives. Avoid a chart-only explanation of progress.

### 23.2 Operations and release controls

Separate staging/production identity, data, storage, keys, subscriptions and messaging budgets. Real
production AI cannot silently fall back to a stub. Staging demo data is synthetic. Versioned migrations
run with rollback/recovery plan; financial numbering and consent continuity require migration tests.
CI checks types/lint, domain fixtures, API policy tests, migrations, localization completeness and
critical journeys. Backend health exposes minimal status/version; detailed readiness/metrics private.

Monitor request/error/latency, queued/rejected writes, outbox age, job failures, AI duration/cost,
entitlement webhook lag, message reconciliation/cost, receipt numbering, deletion/export deadlines
and backup success. Alert owners with documented thresholds/on-call route; logs are redacted and
correlated by IDs. Feature flags can disable AI, messaging or gym layer without disabling workouts.
Runbook includes provider outage, tenant leak, billing mismatch, failed deletion, backup restore and
incident/breach handling. Demonstrate at least one restore to an isolated environment, including
deleted-user tombstone replay and object-asset policy.

### 23.3 Events and pilot calculations

Event names: signup_started/completed, onboarding_completed, workout_started/set_committed/workout_finished,
history_previous_opened, meal_confirmed, analysis_started/ready/confirmed/failed, paywall_opened/purchase_verified,
gym_import_completed/invite_sent/gym_linked/visit_saved/payment_recorded/freeze_decided/programme_offer_accepted.
Record pseudonymous user/gym, event/version, timestamp and operation IDs; no names, phones, meal text,
weight, image URLs or health values in general product analytics. Audit/domain data is separately controlled.

Freeze pilot metric definitions, eligibility/exclusion codes and observation windows in the signed
pilot protocol **before day 1**. No post-outcome denominator redefinition or invented measurements.

| Metric | Selected denominator/window and gate |
|---|---|
| Day60 link | Per gym: linked adult active-base records (including approved frozen relationship)÷eligible adult active-base records at day 60. At least50 eligible adults/gym; unknown-age/minor/archived exclusions separately shown. Every one of5 gyms must reach≥40%; aggregate must also reach≥40%, using gym-record units. |
| Weekly personal logging | Per gym: among adults linked and active-base at start of last fully completed Monday–Sunday week ending≤day 60, count those with≥1 completed workout/confirmed meal/measured body entry that week. Visits do not qualify; new links after week start excluded numerator/denominator until next week. Minimum20 linked adults/gym. Every gym≥25%, aggregate≥25% using user-gym cohort records. |
| Renewal | Freeze eligible sold base-term IDs at day 1 whose snapshot last included date is in days1–63. Renewal must be issued by actual corrected last date+7 days (early issued term counts; money-only request/credit does not). Cancellations/non-renewals remain denominator outcomes. Only predeclared documented duplicate/void/test/gym-service-closure exclusions allowed. New terms sold after day 1 reported separately, never silently added to this cohort. |
| Baseline renewal | If pilot starts date D, baseline last-date window is D−70 through D−8 inclusive (63 days), follow-up through D−1. Freeze actual reviewed term IDs/outcomes before D with same exclusion/renewal definition. Use ledger/register evidence, not owner guess; seasonal comparison is not causal proof. |
| Renewal improvement | At least3/5 gyms improve by≥5 **percentage points** absolute, each with≥20 eligible fully observed expiries in both baseline and pilot.60%→65% passes;60%→62% fails even if positive.20 pilot terms with13 renewals vs20 baseline with12 gives65% vs60%=+5 points. |
| Price willingness | ≥2/5 owners explicitly accept stated Owner Pro price; record presented price/date/answer. A satisfaction rating is not willingness. |

All5 gyms need valid minimum link/logging cohorts and renewal comparison samples; incomplete gym or
outcome follow-up gives **Fix/extend measurement**, not Scale and not an artificial failed0%.
Exact pilot start dates/timezones are recorded per gym; final ten-week memo at day 70 permits full
day 63+7 renewal follow-up. Approved freeze/date corrections may move a fixed-cohort term's true deadline beyond day 70. Keep that
term in denominator and mark window Incomplete until actual deadline+7 is observed; extend pilot
measurement (Fix) rather than dropping it or treating it0%. Changes are audited with counts; exclusion
cannot selectively remove non-renewers. Aggregate link/logging use
record counts (one user in two gyms is two relationships), stated explicitly, never average unweighted
percentages. Gym-facing engagement reports are aggregate only with cell size≥10; no member list or
personal exercise/meal/body detail is exposed. Platform evaluates protected events under disclosed
pilot-measurement purpose, independent of forbidden gym health reads.

Absence precision maps only section15's evidence-based Verified absence/Verified false alarm; Unknown
outcomes are excluded and shown. All contact statuses remain operational dispositions, not proof.
Final decision: Scale only if every metric gate and security/operational release guardrail passes;
Fix for incomplete samples/fixable misses; Stop for failed product validation or unacceptable harms.
Memo records denominators, counts, window versions, cost, incidents and owner price evidence. Fix/Stop
keeps gym P2 closed; member releases remain independent.

## 24. Phase 2 and Phase 3

Deferred features are scoped below so a supplier can estimate them. Each P2 release still requires
signed-off acceptance fixtures and provider/license decisions; it cannot be represented as MVP-ready.

| Feature / plan link | Required behavior and gate |
|---|---|
| Member AI set text/voice (G25) | Transcribe only on deliberate microphone action; preserve transcript; resolve exercise/reps/load/unit into editable proposal; commit only explicit confirmation using normal set path. No auto-log, record fabrication or slowed manual commit. Trial/Member Pro and microphone notice. |
| Weekly review/ask-your-data (G25) | Use only authenticated user's records, state date/coverage and link to underlying sessions/meals. Distinguish observed/calculated/estimated. No unsupported medical claims, personal data leakage or writes. Empty data produces insufficiency. Member Pro. |
| Owner Pro assistance (G24) | Gym-scoped operational risk explanations/draft utility messages/ask-the-gym from permitted register/finance/attendance data. Check gym entitlement/role every call. No private health inputs, diet digitizer or coaching plan copilot; never automatically send a message. Renewed coaching needs separately approved future scope. |
| AI calling (G26) | Closed by default. Requires pilot scale, counsel, vendor, explicit separate calls consent, recorded AI disclosure, quiet hours, call/cost caps, opt-out and human handoff. Outcomes/recordings use approved retention. Prohibited on minors/unconsented numbers. Final telephony state machine requires vendor contract before build acceptance. |
| Online collection/autopay (G27) | Provider-approved gym onboarding; settlement direct to gym, FitLog never custodies money. Signed create/verify/webhooks; pending/failed/paid/refunded/disputed states. One verified payment creates one receipt despite replay. Autopay mandate requires explicit consent/revocation, never implied by membership. |
| Gym web/multi-branch (G28) | Responsive owner console using same policies/API. Branch-specific register/finance/staff context, explicit switch, organization aggregation only with scope. Cross-branch access covered by tests; no global role shortcut. |
| Automatic attendance feeds (G29) | Source-specific authenticated import connector, member mapping, original timestamp, duplicate external ID prevention, downtime/coverage indicator; unavailable feed cannot prove absence. |
| Retired coaching depth (former G29 portion) | PT/session packs, assessments and coaching floor view removed from committed P2, not rebuilt through owner permissions. A new role-free service-credit product would need separate approved scope; G29 retains operational retention features below. |
| Break mode (G29) | Member declares a temporary non-attendance interval, pauses eligible outreach and explains membership end does not change unless separate freeze approved. Distinct from pause goal/streak freeze. |
| Fitness passport (G29) | Member-controlled summary of personal activity and consented gym history; preview/select recipients/expire access. No automatic cross-gym member discovery or transfer of gym ledgers. |
| Cohorts/broadcast credits/gym WhatsApp (G29) | Cohorts have stable join/renewal denominators. Broadcast uses separately approved purpose/recipient-source/consent and reserved credit/cost caps. Sender migration isolates gyms, approved templates and webhook ownership. Gym-supplied phone marketing prohibition remains. |
| Paper-register reader (G30) | Photograph paper register → candidate rows → row-by-row correction/import preview → confirmation through normal import. Source images private; no raw register model output becomes a member/payment automatically. Limited free gym-onboarding AI exception, separate from Member Pro, with quota/budget and accuracy gate. |
| Progression engine (AP-3) | Structured linear/double/AMRAP/time/bodyweight rules, saved versions/inputs; missed reps never advance; stall rule proposes deload. Show next target/reason, permit override, never rewrite sets. Fixture each rule and increment unit before shipping. |
| Exercise substitution (TR11) | Filter by equipment/movement/primary muscles; show why suitable and let user choose. Preserve old performed sets; new exercise has its own version/history. No injury treatment claims. |
| Body map (AP-4) | Licensed original/attributed outlines showing primary/secondary role and selected-period work; accessible text equivalent. No copying a differently licensed conversion. |
| Parity refinements (AP-5) | Opt-in keep-awake during workout; one-off date reschedule preserving recurrence; e1RM v2 excludes >12 reps with reproducible historical versions; FitNotes import with preview/units/duplicates. Strong/Hevy and food CSV adapters get equivalent import contracts. |
| Broad offline reads (AP-6) | Persist personal history/analytics/diary cache with last-sync timestamp and offline staleness; cold-start readable after prior fetch. Do not extend gym health consent into offline staff caching. Full offline mutation of every entity remains unscoped. |
| Barcode (AP-7) | Permission → scan → source product → portion review → normal confirmed item. Unknown product offers custom/manual. Chosen database/license/attribution verified, no speculative branded nutrition. |
| Widgets (AP-8) | Today's workout/protein on Android/iOS, refresh after committed data, lock-screen privacy choice, deep link and no stale figures presented as live. Watch apps excluded. |
| Nutrition depth (FD10) | Add available micronutrients with source units/nullability; never fill unknowns with zero. Optional personalized suggestions require explicit relevant inputs, explanation, user approval and qualified review. Multi-photo/dictation never bypass food confirmation. |
| Health/wearables | Apple Health/Android Health Connect first: explicit selected read/write types, dedupe external IDs, source provenance, no read→write loop. Default initial type weight; revocation stops jobs without erasing legitimate personal history. Broader sleep/recovery needs separate contract, no diagnosis. |
| Gym-bought seats | Gym-funded entitlement allocation/removal is auditable and does not grant health access. Member data survives loss of seat; fallback personal subscription ownership defined before sale. |
| Exercise media (AP-9/M9) | Last planned feature after source/license selection; every exercise gets licensed media or explicit unavailable state. Private licensed delivery/caching as required, credits, accessible instructions remain. No license asset committed publicly by default. |
| Ads (PR06/P3) | Separate future specification and review. Free-only, never in active workout, no health/body/food targeting, reviewed compliant brands, no deceptive reward prompts. No launch implementation. |

The paper-register exception reconciles the retained G30 goal (“one free AI”) with the general paid-AI
rule: personal AI and Owner Pro AI are paid; limited reviewed onboarding extraction is the explicit
P2 exception. It is disabled in both MVP releases. Any other free AI requires a new approved rule.

### 24.1 Member P2 implementation defaults

The following new defaults make deferred behavior implementable without inventing algorithms.
Review them with the release scope; a different rule needs a versioned replacement, not an undocumented
developer choice.

**Progression rules:** Rules are opt-in per prescription, versioned with explicit parameters, and use
the last completed eligible instance of the same exercise/version. Warm-ups/skipped sets never satisfy
a rule. No history means use member-entered starting target. Compare exact canonical values and round
a recommended increment to the selected equipment's supported increment; do not silently exceed it.

| Rule | Default decision |
|---|---|
| Linear | If all prescribed working sets meet minimum reps, recommend adding configured increment; otherwise hold. Defaults: barbell 2.5 kg total, dumbbell 1 kg per hand; member must confirm available increment. |
| Double progression | Keep load while raising reps through configured range. Once every prescribed working set reaches upper bound, recommend increment and return target to lower bound. A single high-rep set does not qualify all sets. |
| AMRAP top set | Member marks exactly one final working set AMRAP; default top-set threshold is upper rep bound. All preceding sets must meet minimum and AMRAP must meet threshold before increment. No top-set marker means hold, not inferred AMRAP. |
| Timed | Once all working sets reach target duration, recommend +5 seconds/set, capped at chosen maximum. At cap, hold and offer user-approved new rule. |
| Bodyweight | Default +1 rep/set after all sets meet target, within configured max. Added-load progression requires explicit weighted rule; assistance reduction requires an explicit separate rule/version. |
| Stall/deload | Three consecutive completed attempts failing required reps/time at same load/target propose 10% load reduction (or 10% target reps/time for nonloaded work), rounded down to supported increment. Member must accept; cancelled/incomplete workouts do not count attempts. |

Recommendations affect pending next-session prescriptions only after acceptance; they never write
performed sets. Persist evidence session/set IDs and reason. Require fixtures for success, one-set
failure, skipped set, different load basis, absent history, unsupported increment and stall reset.
Accepting a deload resets failure streak; overriding a suggestion records override and starts a new
comparison baseline for that rule.

**AI set/review/questions:** Text/voice input maximum 2,000 characters; microphone stops after 60
seconds or manual stop. Show transcript then candidate exercise/instance, reps, load/unit and type.
Ambiguous “80 for 8” asks which load unit/exercise rather than guessing. One utterance may propose
multiple rows; select/review each. A single Confirm selected atomically creates ordinary sets with
candidate dedupe keys; permissions/session state are rechecked. Voice audio defaults deleted after
transcription or within 24 hours, with no reuse/training absent explicit separate permission.
Weekly review generates on Monday at 08:00 profile timezone for preceding Monday–Sunday, only after
opt-in, at most once/week/version; no data gives insufficient-data summary. Training/nutrition/body
sections state coverage and cite records; member can regenerate within quota. Ask-your-data is read-only,
defaults to last 30 days if no range given, displays that range, and returns no unsupported fact when
underlying data is missing. The same disclosure, model schema validation, consent and cost controls
as food AI apply.

**Additional imports:** Strong/Hevy/FitNotes adapters map published/exported fixtures, not guessed
column names. Food CSV minimum fields consumed_at, timezone, meal_name, food_name, quantity/unit and
provided nutrition. Accept ≤10 MB/2,000 rows, preview grouped sessions/meals, report unsupported rows,
and dedupe source-file/import external ID. Re-import only selected corrections, never overwrite
recorded work without a diff/confirmation. Imported numeric data is user-provided, not catalog-certified.

**Health sync:** Initial read/write type weight only. User can choose read, write or both, separately
for each platform account; no automatic export of photos/food/gym data. Each imported sample stores
provider record ID/version and source timestamp; latest timestamp daily rule still applies. Manual
entry and provider entry are separate sources, not silently merged. Imported samples are never
written back, avoiding loops. Provider edits/deletes update the linked imported sample and derived
trend unless user previously detached/overrode it; overrides become owned entries with provenance.
Permission revocation cancels queued sync, preserves already imported entries and offers deletion
of source-linked imports. Initial foreground sync retrieves last 90 days then incremental changes.

**Nutrition depth:** Initial additional nutrient units: sodium/potassium/calcium/iron mg and vitamin D
µg. Preserve source version and missingness; daily summaries show known subtotal/coverage. No automatic
supplement or deficiency recommendation. Personal suggestions may use chosen goals/targets, allergies
or food exclusions only after explicit permission; never declare allergy safety from uncertain source
data. Member approves suggested recipe/target changes through normal versioned editors.

### 24.2 Gym P2 implementation defaults

**PT/session packs, staff assessments and coaching floor view:** Removed from this roadmap. Old
quantitative defaults are historical, not a requirement to invent owner-led coaching or private
measurement access. A future service-credit product may reuse append-only finance primitives only
after separate approved scope; no trainer role is revived.

**Break/passport:** Break request interval 1–90 days, future start, no overlaps; member can end early.
Suppress absence/praise outreach during break; renewal utility messages still follow membership
rules unless explicitly opted out. Membership dates/fees do not change. Passport is generated from
member-selected personal categories and permitted own attendance summaries; excludes gym notes,
other members and financial ledgers. Default shared access expires after seven days, revocable
immediately, with view audit. A receiving gym can see only the explicitly granted, expiring passport artifact, never live personal
health APIs; the original gym's standing or membership is not transferred.

**Broadcasts/credits:** Eligible source is independently app-collected, explicit purpose-specific
opt-in; a gym-supplied source remains ineligible for marketing even when the UI is misconfigured.
Audience preview shows eligibility/exclusions/count/estimated cost; send needs authorized confirmation,
approved template and reserved per-recipient budget. Unsubscribe applies before each dispatch. Default
quiet hours are 20:00–09:00 recipient local time (gym time only when recipient timezone unknown).
Credit ledger purchase/reserve/consume/release is append-only; failed or suppressed messages release
reserved credit once. Purchased price/expiry are external commercial decisions, never hardcoded.
Cohorts group by first membership start calendar month and show same-defined link/renewal/logging
metrics at 30/60/90 days; incomplete observation windows are labelled, not extrapolated.

**Calling:** Once gates open, call job states scheduled/consent-blocked/dialing/answered/completed/
failed/cancelled; terminal provider callbacks deduplicate by call ID. Default maximum one attempt/
member/day, three/week, only 09:00–20:00 recipient local time; opt-out cancels pending attempts.
Reserve maximum authorized cost before dialing, stop on cap; no repeated surprise retry after ambiguous
answer. Opening disclosure identifies AI, gym and purpose before sensitive conversation. Human transfer
can be offered to current authorized operational staff, with no private-health data exposed. Recording defaults off until
approved recording notice/consent/retention chosen. Store minimal outcome tags; transcript access is
separately restricted. Vendor-specific recording/dial rules must satisfy counsel, not be inferred.

**Gym seats:** Owner purchases a defined seat pool; allocate only to consenting linked adults, with
audited assignment and expiry. No duplicate active allocation per user from same pool. Member with
personal paid entitlement uses personal entitlement first; gym seat extends access only where
personal entitlement is absent. Removing seat ends only gym-funded future AI use, retains data and
offers personal Pro. Purchasing seats never grants personal-health access.

Acceptance of P2 must include each rule's negative/concurrent/replayed-operation cases, with numeric
fixtures frozen before release. DEC-17 records these selected product rules; actual vendor/legal
proof remains required and a rule change requires a recorded scope revision.

## 25. Acceptance scenarios

These are release blockers, not optional demonstrations. Test on clean test accounts with deterministic
fixtures and release mobile builds. Each check needs a recorded result; passing UI screenshots alone
cannot prove persistence, isolation or business rules. AC01–AC13 preserve the original outcome IDs;
AC14 onward make the contract executable. P2 acceptance is attached to its own release, not MVP launch.

| ID / release | Given and action | Required observable result |
|---|---|---|
| AC01 / M | Adult creates Chest day, adds two exercises, starts and logs prescribed sets, finishes and reloads | Every actual set persists; pending sets are not invented; session appears on start-local date even across midnight |
| AC02 / M | Two completed chest sessions and a new draft; open previous occurrence without knowing date | Latest earlier completed chest work found, current draft excluded; repeat plan shows per-set source/date and valid deltas |
| AC03 / M | Three 80×8 bench working sets and 40×10 warm-up, complete session | Volume 1,920 kg·reps; e1RM 101.333…; frequency one; correct versioned records/adherence; same calculation after reload |
| AC04 / M | Log manual meal, request eligible text/photo analysis, correct quantity and confirm selected rows | Manual item updates totals; proposals do not; corrected confirmed values count exactly once; raw output stays unchanged |
| AC05 / M | Log body/goal/food/workout, change preferences and edit/delete source entries, export/delete | Today agrees with source screens; trends/goals recalculate; canonical history stable; export/deletion/recovery deadlines met |
| AC06 / G | Owner imports ≥150 valid rows plus duplicate/invalid fixtures and configures plan/register in timed visit | Setup ≤90 minutes; preview/row errors visible; only explicitly selected rows saved; no unsolicited invite or fabricated payment |
| AC07 / G | Adult opens invite, verifies addressed phone, confirms gym; repeat with under-18 DOB | Adult reaches correct gym card without full fitness setup; minor cannot activate/link/rank; wrong phone cannot claim |
| AC08 / G | Scan valid gym QR online/offline on reference device, then restart/reconnect | Durable check-in p95 <3 s; original time/date survive; one counting visit; unverified/Needs review entries never rank |
| AC09 / G | Staff reads foreign tenant ID, owner/manager requests personal health data, retired role value submitted | Foreign gym404; all staff private reads/writes denied; trainer role invalid; member personal data intact |
| AC10 / G | Schedule D−7/−3/0/+3 renewal, replay job/webhook, then renew/freeze/opt out | One logical dispatch per due key within 09–20 gym time; invalidated future reminders suppressed; no marketing to gym-supplied number |
| AC11 / G | Partial coverage/no-visit case; erroneous ₹400 receipt against ₹1,000 charge when no money was actually received, then reverse mistake | Confidence/coverage reason explicit; initial due ₹600, immutable receipt; reversal restores ₹1,000 due and remains linked, no actual refund claimed |
| AC12 / M | Free user calls AI route directly; then Pro expires after a ready proposal | Free gets PRO_REQUIRED with zero model calls; expiry locks new jobs, retains all data and ready-result confirmation |
| AC13 / G | Run all owner/manager/front-desk/member-gym flows in Hindi on low-end Android | Complete strings/glyphs, accessibility, performance budgets and functional parity; no English-only critical message |
| AC14 / M | Double tap Log set, lose network response, force-kill immediately after local feedback, replay queue | Exactly one set; acknowledged local set survives; status accurate; p95 <100 ms durable commit |
| AC15 / M | Edit/archive programme/exercise after completed session; update food/recipe after logged meal | Historical prescriptions/muscles/load/nutrition remain snapshots; new records use new versions |
| AC16 / M | Change timezone/units with previous records; include DST/date boundary fixtures | Canonical values and historic local dates stay unchanged; ranges/conversions agree across client/server |
| AC17 / M | Delete/edit strongest completed set and a past session three days ago | Next-best PR and summaries recompute; original timestamps/duration stay unless explicitly corrected |
| AC18 / M | Null-macro quick add and unlogged day in week; enter over-target food | Unknown is incomplete, not zero; coverage/denominator shown; negative remaining allowed without false precise rings |
| AC19 / M | Two weights on one day, gaps across week, 80→75 goal with latest78 | Latest daily value used; mean only measured daily values with sample count; goal40%; no interpolation |
| AC20 / G | 50 parallel payments, rollback one attempted transaction, replay successful keys | Unique gap-free committed receipt sequence; replays same receipt; no edited/deleted settled payment |
| AC21 / G | Front desk attempts reversal/export; manager changes own gym role; revoked staff has queued payment | Forbidden actions denied; role change immediate; revoked queued operation Needs attention, no receipt issued |
| AC22 / G | Calendar-month/fixed-day plans, freeze overlap, early unfreeze and renewal during freeze | Exact section 13 dates/extension applied; overlap rejected; sold renewal shift needs preview, no hidden charges |
| AC23 / G | Invite token replay, expiry, wrong phone, duplicate-account identity and claim already linked to another user | Safe idempotent same-user route; invalid claims rejected; no identity auto-merge or private disclosure |
| AC24 / G | Tampered poster, denied location, duplicate imported event, late/off-clock attendance | Invalid QR rejected; legitimate denied-location visit saved unverified; imports deduped; questionable time excluded pending review |
| AC25 / G | Challenge opt-out, unknown age, lapsed/frozen membership, equal-score ties and correction | Only eligible adult opt-ins rank under fixed tie rule; removal/recompute immediate; no phone/health fields exposed |
| AC26 / G | Owner/manager offers templatev1 then edits tov2; member acceptsv1 twice then edits/unlinks | One owned v1 copy persists; gym sees status only, not edits/history; no staff measurement editor or T-workspace |
| AC27 / M | Purchase pending/success/cancel/restore, replay/out-of-order webhook, refund | Entitlement matches verified store state; no duplicate trial/purchase ownership; refund stops new AI without erasing records |
| AC28 / M | AI malformed response/timeout/cap hit, offline input, double confirmation | Preserved input + manual path; no unvalidated write, no over-cap call, one confirmation result, correct quota restoration |
| AC29 / M/G | Two devices create/edit offline workouts; logout/switch user with queued work | Explicit conflict review, no silent data loss/overwrite; queue never crosses accounts/tenants |
| AC30 / M/G | Request personal/gym export, account erasure, then restore backup containing deleted user | Authorized manifest complete, ≤24 h export; erasure lifecycle met; gym ledger retained only by policy; tombstones prevent resurrection |
| AC31 / M/G | Reject photo permissions, disable push, enable large text/Reduce Motion, use screen reader | Manual alternatives; no lost processing/records; accessible controls/status and no clipped critical values |
| AC32 / M/G | Service/AI/gym provider outage and worker crash mid-operation | Manual local workout usable; jobs/mutations replay safely; accurate degraded state; alerts/runbook exercised |
| AC33 / G | Offboard gym with queued reminders and two members' private FitLog histories | Gym closed/read-only under policy, future sends stopped, export available; both personal accounts/history continue |
| AC34 / G | Run five-gym ten-week pilot with recorded baselines and completed day 60 windows | Written scale/fix/stop memo with stable denominators, costs and incidents; P2 remains closed absent approved scale |
| AC35 / G | Execute every finance fixture in section 13.3, including concurrent refund+reversal of same principal | Exact charge/principal/allocation/credit/dues/cash result; overlap409; replay never double-impacts |
| AC36 / G | Sold allowance7, cross-expiry freeze/renewal conflict, decline shift, early unfreeze and DST/month-end | Atomic date/allowance result from section 13.2; rejected approval changes nothing; explicit gap if shift-back declined |
| AC37 / G | Cached roster24h+, role revoked, archived/backdated member, payment balance changed, authorized reconciliation | Cache field/freshness bounds enforced; Needs attention; one accepted replacement with original actor/time; no stale staff authority |
| AC38 / M | Tuesday workout selects missed Monday vsTuesday vsUnscheduled, concurrent finish then delete/relink | Section6.3 occurrence/date/late rules; no double completion; deletion resets correct occurrence and recomputes adherence |
| AC39 / G | Three eligible visits without challenge, later expiry, opt-out/rejoin and backdated freeze | Private streak independent, historical valid visits stable until legitimate correction; rejoin counts new visits only |
| AC40 / M | Cancel queued AI, withdraw permission/expire entitlement before dispatch; race after dispatch commit | Reserve/consume/release once in correct original bucket; no forbidden dispatch; in-flight cancel truthfully explained; ready confirmation retained |
| AC41 / G | Freeze pilot protocol, per-gym rates,20+ expiry samples and outcomes with unknown evidence | Section23.3 exact gates;≥5 percentage points in≥3 gyms, all per-gym cohorts pass; incomplete→Fix, no invented0%; precision4/6 example |
| AC42 / M | Strength goal fixture before/start/after-deadline, wrong load basis, deleted baseline | No pre-baseline or outside-window progress;50% correct eligible load; missing new measurement/baseline review explicit |
| AC43 / G | Front desk prepares renewal, records real money before approval and attempts approval/waiver | No role escalation; credit retained; only owner/manager issues final membership/fee; rejection does not erase received money |
| AC44 / M | Concurrent image uploads reach1 GiB/2,000 limits; Pro expires, export/delete, full quota manual log | Atomic reservation; usable view/manual/export/delete and drafts; no eviction/downgrade loss or AI call on rejected photo |

Fixture pack must include English/Hindi/Hinglish, imperial and metric, Asia/Kolkata/UTC and DST timezone,
unlinked/linked adult/unknown-age/minor rejection, one user in two gyms, every staff role, AI/challenge/utility permission denied and
revoked operational permissions, partial food data, credit/refund/reversal, archived sources, clock drift and no network.
Every gym route needs a tenant-isolation test beyond these end-to-end scenarios.

## 26. Delivery and third-party handoff

### 26.1 Build sequence and gates

| Milestone | Deliverable and exit gate |
|---|---|
| M0 ground truth | Product rules selected in v2.1; reconcile reset-aware goals, external gates and versioned architecture/API contract |
| M1 platform | Auth/storage/API/workers/monitoring/environments, deployment, secure secrets and restore drill |
| M2 design foundations | Momentum tokens/components/navigation, localization catalog, shared validation/domain fixtures |
| M3 member core | Accounts/plans/logger/history/food/body/goals/settings; source persistence and AC01–05/14–19/29–32 |
| M4 launch foundations | Phone delivery, Indian catalog/Hinglish, real guarded AI, store Pro; AC12/27/28 |
| M5 store launch | Real Android/iPhone beta, performance/accessibility/security/legal/store declarations, staged rollout |
| M6 gym pilot | Approved pilot/legal/messaging setup; tenancy/register/finance/visits/operational permissions/programme offers/engagement; all G checks |
| M7 gym P2 | Written scale decision; separate calling/payment/provider gates and approved P2 acceptance |
| M8 depth | Accepted member depth/offline reads/barcode/widgets/health/progression with licenses and measurements |
| M9 media | Chosen licensed media integrated last, accessible fallback and attribution |

Member API/data foundations must exist before screen delivery; after reset, a goal referring to an
existing deleted service is not permission to skip them. Work may run in parallel only after shared
contracts/components freeze. P2 payment/calling blockers do not prevent MVP manual finance/attendance.
Changing scope updates this PRD, decision log and delivery dependencies, not only a Figma frame.

### 26.2 Supplier deliverables

- Complete source and dependency/license inventory under owner-controlled repositories/accounts;
  reproducible local startup, builds, migrations, seeds and environment examples without secrets.
- Versioned OpenAPI/interfaces, database diagram/dictionary, constraints/indices/retention matrix,
  domain calculation fixtures, event catalog and permission/consent test inventory.
- Full screen/state inventory matched to Momentum with actual live data, both languages/themes,
  navigation/deep links, permission and offline states.
- Automated unit/integration/critical journey results and real-device recordings/measurements linked
  to each AC; actual new implementation evidence, not old deleted test counts.
- Deployable staging/production, workers/schedules, backup/restore evidence, runbooks, alerts,
  feature flags and support/export/erasure tools.
- Store-ready Android/iOS artifacts, signing/account custody instructions, reviewer demo credentials
  stored securely, accurate listings/privacy disclosures and subscription test evidence.
- Gym import/message/pilot onboarding materials, notices approved by owner/counsel, user help and
  staff guide explaining refunds/reversals, verification, offline reconciliation and operational permissions.
- Known limitations/deferred items, all outstanding external decisions and a maintenance handoff.

The supplier may choose internal code structure but cannot omit a capability because a particular
library is inconvenient. Acceptance requires complete end-to-end behavior, documentation and evidence.
No final “complete project” handoff while a required AC fails or a release-blocking decision is blank.

## 27. Assumptions and external decisions

### 27.1 Selected product decisions

The owner selected trainer removal and delegated the remaining product decisions on 11 October 2026.
This version selects India public launch, member/gym release split, four auth methods,≥200 exercises/
≥500 Indian foods/three starter templates, two complete languages, workouts offline and meal/body saves
online with durable local **unsaved draft** preservation. Drafts are not diary/body records and never
affect totals; reconnect requires explicit Save. Photo draft assets stay local until deliberate upload.

Sections6/10–13/15–18/20/23 resolve occurrence matching, allowance lifecycle, strength goals, roles,
finance, freeze/month-end dates, visits/streaks, storage and pilot gates. Other specified defaults in
v2.0 are retained as selected rules under this delegated authority, including performance budgets,
validation, units, job states, server isolation and P2 member depth. This does not grant external
licenses, create vendors, establish tax/legal approvals or mark build goals Done.

GT01–GT04/T-01–T-05 and coaching/PT/assessment/floor portions are retired; owner/manager template offers
retain only member-owned copy behavior in G21.api/G21.app. G24/G29 cannot reintroduce private gym health
reads or a renamed trainer workspace. A new private-sharing/coaching proposal needs separate scope.

Selected product decisions are recorded as PROD-01–PROD-12 in the tracker. No routine product-review
question is left pending; only actual external procurement, review and verification gates below remain.

No silent guessing is permitted on these external choices. Preparation using adapters/sandbox fixtures
can continue, but the stated release gate remains closed until the decision is recorded.

| ID | Current state | Accountable owner / milestone | Remaining external requirement |
|---|---|---|---|
| DEC-01 | Momentum/navigation selected; brand external open | Product owner / M5 | Final name/trademark/assets clearance; no alternate-theme decision reopened |
| DEC-02 | India launch selected; technical/vendor external open | Technical lead + owner / M1 | Freeze architecture/provider accounts/India launch region and contracts; international public expansion separately gated |
| DEC-03 | Month/freeze/ledger/receipt product rules selected; tax external open | Owner + accounting reviewer / M6 | Review statutory receipt/tax setup; taxes off until approved, product calendar no longer undecided |
| DEC-04 | Adult-only/private personal data selected; legal external open | Owner + counsel / M5/M6 | Terms/privacy/DPA/utility basis/financial retention and notices; no under18 linking or staff health access |
| DEC-05 | Dispatch/cap policy selected; provider approvals open | Owner / M4 and M6 | Phone registrations and +91 delivery, WhatsApp/SMS templates/credentials, real-send budgets |
| DEC-06 | Paid AI/seven-day eligible trial selected; commerce open | Owner / M4 | Actual localized price/SKUs/store/billing accounts; old indicative prices are not approved |
| DEC-07 | Five-gym/ten-week metrics selected; field evidence open | Owner / M6/M7 | City, signed gyms, actual baseline/sample records and scale memo |
| DEC-08 | Quota/job/confirmation rules selected; AI evidence open | Technical lead + owner / M4 | Model/vendor/DPA, real quality measurements and monetary spend caps |
| DEC-09 | RPO/RTO/lifecycle targets selected; infrastructure proof open | Technical lead + owner / M1 | Backup/PITR/object recovery provisioning and verified restore drill; no unstated photo gap |
| DEC-10 | Direct-to-gym P2 collection only; vendor approval open | Owner + counsel / M7 | Payment-provider/submerchant/autopay contract and authenticated reconciliation proof |
| DEC-11 | Calling closed until approvals | Owner + counsel / M7 | Vendor/counsel/disclosure/recording/retention/consent approvals and pilot Scale |
| DEC-12 | Android10/iOS16 target and device class selected; proof open | Technical lead / M2/M5 | Exact supported dependency versions/reference devices and actual performance/accessibility evidence |
| DEC-13 | Resolved product scope | Product decision / M3/M6 | Supersets MVP; health/imports P2; Gym Join state; no dedicated trainer/private-sharing/PT scope |
| DEC-14 | Editable estimate behavior selected; qualified review open | Qualified reviewer + owner / M3/M5 | Formula suitability and explanation review before enabling estimates; manual targets available |
| DEC-15 | Fresh build/no automatic old-data migration selected | Owner + technical lead / before any legacy-user cutover | Only if redirecting actual existing users: approve and verify migration; otherwise not a launch blocker |
| DEC-16 | Required provenance selected; licensing open | Owner + technical lead / M3/M5 and M8/M9 | Actual font/seed rights before stores, barcode/map licenses P2, media license last |
| DEC-17 | P2 product defaults selected, coaching removed | Product decision / M7/M8 | Numeric fixtures/implementation verification still required; vendor/legal gates cannot be bypassed |

Record decision/date/approver/rationale and affected sections in [project tracker](09-PROJECT-TRACKER.md).
Blank draft owner-pack answers do not count as approval. The international-audience answer is retained
context, not proof that geographic legal/hosting decisions have been completed. Current default values
can be tested locally; legal/vendor/price decisions cannot be manufactured by the supplier.

## 28. Requirement traceability

| Existing requirements | Detailed specification | Primary acceptance |
|---|---|---|
| ID01–ID03 | Sections5/14/22 identity, age, linking | AC07/16/23/30 |
| ID04–ID06 | Sections4/5/19/22/23 language/preferences/privacy | AC05/13/16/30/31 |
| TR01–TR03 | Sections6/16 catalog/programmes/templates | AC01/15/26 |
| TR04–TR07 | Sections7/20 session/set/recovery/previous | AC01/02/14/29 |
| TR08–TR09 | Section8 history/calculations | AC02/03/17 |
| TR10 | Section7 timer/plates/supersets | AC01/14/31 plus component/domain fixtures |
| TR11 | Section24 substitutions/progression/media | Separate P2/M9 acceptance |
| FD01–FD05 | Section9 diary/recipes/copy/targets | AC04/15/18 |
| FD06–FD09 | Sections10/18 AI review/quota/Pro | AC04/12/27/28 |
| FD10 | Section24 nutrition depth/barcode | Separate P2 acceptance |
| PG01–PG04 | Section11 body/goals/Today | AC05/19/31 |
| PG05 | Sections13–17 member gym | AC07/08/11/25/26 |
| GC01–GC02 | Section12 roles/register/import | AC06/09/21 |
| GC03–GC04 | Section13 memberships/ledger/receipts | AC11/20/22 |
| GC05–GC06 | Sections12/13/22 owner reports/export | AC06/30/33 |
| GC07 | Section24 online payments | Separate gated P2 acceptance |
| GE01–GE03 | Section14 invites/utility dispatch | AC07/10/23 |
| GE04–GE06 | Section15 visits/coverage/retention | AC08/11/24 |
| GE07–GE08 | Sections13/17 challenges/referral/freezes | AC22/25 |
| GT01–GT04 — retired | Section16 explicitly removes private trainer reads/measurement writes/health sharing; no ID reuse | Removal checks in AC09/26; general purpose audit remains elsewhere |
| PR01–PR03 | Section18 store billing/entitlement | AC12/27/28 |
| PR04–PR05 | Section24 member/owner AI/calling | Separate gated P2 acceptance |
| PR06 | Section24 ads boundary | No MVP/P2 ad implementation; separate P3 gate |
| Shared invariants/quality | Sections4/19–23 | AC14–16/20/29–34 |

This PRD is a complete functional specification for the expanded MVP and a bounded specification of
the deferred roadmap. Product rules are selected under delegated authority; external approvals remain visibly unfulfilled
rather than disguised as facts. Implementers must use this document together with its frozen API/
architecture artifacts and actual Momentum designs, and attach evidence to the acceptance scenarios.
