# Edge Cases, States & Failure Modes

A consolidated catalog. The wireframes state edge cases per screen; this document groups them by
*cause* so they can be tested systematically and so no class of failure is handled inconsistently
across screens.

---

## 1. Time, dates and timezones

The single largest source of subtle bugs in this product. **One normative rule governs everything:**

> Every instant is stored in UTC. Every calendar date shown to the user, and every day-bucket used
> in aggregation, is computed from that instant using `user_profiles.timezone`. Nothing else.

| # | Case | Required behaviour |
|---|------|--------------------|
| T1 | Workout started 23:40 local, finished 00:20 local | Filed under the **start** date. E-02 shows a banner naming the date |
| T2 | Meal logged at 01:30 local | Belongs to that calendar day. H-01 offers "Move to yesterday" |
| T3 | Session still `in_progress` at local midnight | Date stays the start date; the banner states it |
| T4 | User flies across timezones | Instants are unchanged; day buckets recompute. A one-time notice explains that daily totals may shift |
| T5 | "Follow this device" timezone changes silently | Detected at launch; the user is notified rather than having a month of data silently re-bucketed |
| T6 | DST transition — a 23-hour day | Day boundaries follow local wall-clock. A 23-hour day is still one day |
| T7 | DST transition — a 25-hour day, and a meal at the repeated hour | Stored UTC disambiguates; the day bucket is unaffected |
| T8 | Device clock is wrong | Server timestamps are authoritative for `created_at`; client `performed_at` is accepted but a > 24 h skew triggers a warning |
| T9 | Backdated session or metric | Allowed. Sorts by its own date. **Future dates are rejected** everywhere except a planned session |
| T10 | Week start = Sunday vs Monday | Every weekly bucket (G-02, G-05, G-06, H-14) uses `user_profiles` week start |
| T11 | Month boundaries in a non-Gregorian locale | Out of scope at MVP; Gregorian only, stated in K-03 |
| T12 | A range crossing a year boundary | Charts label the year on the first tick of each year |

**Test matrix.** Every date-bucketing test runs against: UTC, UTC+5:30 (half-hour offset),
UTC+13 (extreme positive), UTC−11 (extreme negative), and a timezone with DST in both directions.

---

## 2. Units and numbers

| # | Case | Required behaviour |
|---|------|--------------------|
| U1 | kg → lb → kg round-trip | Must return the **exact** original value. Conversion never writes back to canonical storage |
| U2 | Load entered in lb while the profile is metric | Stored as `load_kg`; `load_unit_entered = 'lb'` so the display can echo the entry |
| U3 | Unit system changed mid-session | Committed sets re-render from `load_kg`. No stored value changes |
| U4 | Height entered as ft+in | Stored as `height_cm` |
| U5 | Display rounding | Load 0.5 kg / 1 lb · weight 0.1 · macros 1 g · calories 1 kcal. Storage keeps full precision |
| U6 | Decimal separator `,` vs `.` | Both accepted on input |
| U7 | Quantity unit changed after typing (150 g → 150 ml) | The number is **preserved, not converted** — they are different measurements |
| U8 | Food with only calories, no macros | Contributes calories; macro totals flagged "incomplete". Shows "—", never 0 |
| U9 | Bodyweight exercise, null load | Valid. Contributes 0 to load×reps volume; counted in a separate "sets" measure with a footnote |
| U10 | Duration/distance exercise | Excluded from volume entirely, reported separately |
| U11 | Float accumulation over 1,000 sets | Aggregate in a decimal type server-side; never sum floats in JS for a displayed total |

---

## 3. Offline, sync and durability

| # | Case | Required behaviour |
|---|------|--------------------|
| O1 | Entire session logged offline | Indistinguishable from online except for per-set pending dots |
| O2 | App killed, swiped away or crashed mid-session | Draft recovered from the on-device SQLite draft row → E-10 |
| O3 | Set write retried after a timeout | Idempotent on the set's `clientId`. **Never a duplicate set** |
| O4 | Outbox entry gets a terminal 4xx | Moves to "Couldn't upload" in L-02 with a plain-language reason. Never dropped |
| O5 | Outbox entry's target was deleted server-side | Offered a re-target ("Add to another meal") rather than a bare failure |
| O6 | Two devices log the same session | Sets merge by `clientId`; session metadata conflicts → L-07 |
| O7 | Two *different* in-progress sessions across devices | Both listed in E-10; the user picks. Neither is deleted automatically |
| O8 | Draft belongs to a different user (account switch) | Quarantined, never merged (L-07) |
| O9 | Offline at first launch, no cache | A-02 with a clear message; no infinite splash |
| O10 | Offline with cache | Full read access + full workout logging. Only AI entry is disabled |
| O11 | Connection returns mid-flush | Flush is serialised per aggregate; no interleaved partial state |
| O12 | Device storage full — a SQLite write fails | Cached reads and downloaded images are dropped first; the **active draft and the outbox are never dropped**. The user is warned before the logger degrades |
| O13 | App storage wiped by the OS — iOS purging under memory pressure, or Android "Clear data" | Identical from inside the app: there is no draft row. This is an **empty** state, not an error — start clean, say plainly that an in-progress workout could not be recovered, and never block the user behind it |
| O14 | Clock changes while offline | `performed_at` values stay monotonic within a session by clamping to the previous set's time |

---

## 4. AI food analysis

| # | Case | Required behaviour |
|---|------|--------------------|
| A1 | AI gateway down | `status = failed`, `error_code = ai_unavailable`. Meal untouched. Retry + manual fallback |
| A2 | Malformed model output | One reprompt with the schema, then `ai_invalid_output`. **Never partially parsed** |
| A3 | No food detected | `completed` with zero items and a reason — not an error |
| A4 | Image too dark / blurry | `image_unreadable` + retake |
| A5 | Food can't be resolved to the DB | `food_id = NULL`, model macros retained, flagged "using our estimate". This is a **supported outcome**, not a failure |
| A6 | User leaves during processing | The job continues; a notification + diary badge deep-link back to H-08 |
| A7 | User confirms without editing | `confirmed = true`, `user_corrected = false`. Analysis rows untouched |
| A8 | User edits a macro directly | That item decouples from recomputation; a visible "Using your numbers" note |
| A9 | Same analysis confirmed twice | Idempotent on `analysis_id`. No duplicate items |
| A10 | Meal deleted while its analysis is pending | The analysis is orphaned; H-08 offers to attach it elsewhere |
| A11 | Macros don't sum to the stated calories | Both figures shown; the user picks. Never silently overwritten |
| A12 | Quota exhausted | Stated **before** the user takes a photo, with the reset time |
| A13 | Offline photo capture | Photo stored locally, analysis queued, pending card in H-01 |
| A14 | Analysis completes after 90 s client timeout | The notification still fires; H-07 shows "check later" |
| A15 | More than 10 items detected | Scrollable list with a sticky total; the save button always states the count |
| A16 | Unconfirmed item older than 7 days | The pending band prompts "Confirm or remove these" |
| A17 | **Any** AI failure | Workout logging, manual food entry, history and analytics remain fully functional |

---

## 5. Data lifecycle and referential integrity

| # | Case | Required behaviour |
|---|------|--------------------|
| D1 | Program edited after sessions used it | **Zero effect on history** (AC-12). Sessions are self-describing |
| D2 | Plan day deleted with history | Allowed. Sessions keep their records; `plan_day_id` dangles harmlessly |
| D3 | Program deletion attempted while referenced | **Blocked.** Archive only, with the reason stated |
| D4 | Exercise archived with history | History and analytics keep working; the exercise leaves pickers |
| D5 | Exercise muscle mapping edited | **Retroactively changes muscle-volume analytics**, because analytics join live. Stated in a dialog before saving |
| D6 | Custom food edited after items referenced it | Past items **do not change** — macros were snapshotted at confirm. Stated on the screen |
| D7 | Food deleted | Items render from `display_name` + snapshotted macros |
| D8 | Session deleted or edited | PRs are recomputed by a **full re-scan** of that exercise's history, because a PR can be demoted |
| D9 | Session cancelled | Never appears in history or analytics; rows retained |
| D10 | Meal category with logged meals | Cannot be deleted, only hidden. History still renders it |
| D11 | Measurement field disabled | History preserved; re-enabling restores the full chart |
| D12 | Targets changed | Today onward uses the new target. Past days are unaffected |
| D13 | Account deleted | 30-day grace, then a hard purge of rows **and** all storage objects |
| D14 | Recipe edited | Meals already logged from it are unchanged |

---

## 6. Concurrency and validation boundaries

| # | Case | Required behaviour |
|---|------|--------------------|
| C1 | Two `in_progress` sessions attempted | Blocked by a partial unique index; E-01 offers finish/discard |
| C2 | Double-tap on a commit button | Debounced + idempotency key |
| C3 | Set deleted → indices | Re-densified in one transaction, client and server |
| C4 | Reorder applied offline then again online | The bulk order call is idempotent and last-writer-wins on the whole array |
| C5 | Set with no reps, duration or distance | **Invalid.** Load alone is not a set |
| C6 | Load > 1000 kg, reps > 50, weight change > 5%/day | **Soft** confirm, never a block. The answer is remembered per exercise |
| C7 | Rep max < rep min | Silently swapped with a hint |
| C8 | Macro percentages ≠ 100% | Sliders are interlocked; the total is always shown |
| C9 | Calories below 1,200 | Clamped with an explanation; below 800 blocked |
| C10 | Custom food macros vs stated calories diverge > 15% | Warned, not blocked |
| C11 | Exercise with no primary muscle | **Blocked** — muscle analytics and "previous chest day" depend on it |
| C12 | Analytics range beyond the server cap | Clamped with an explanation, never a timeout |
| C13 | Very long names | Truncated with the full value in the accessible name and a tooltip |
| C14 | Adherence > 100% from extra sessions | The meter caps at 100%; extras reported separately |

---

## 7. Empty, first-run and sparse data

| # | Case | Required behaviour |
|---|------|--------------------|
| E1 | Brand-new account | B-01 shows a getting-started checklist, **not** zeroed charts |
| E2 | One data point | Value shown; trend replaced by "one more and the trend appears" |
| E3 | Gap longer than the smoothing window | The line **breaks**; never interpolated across missing weeks |
| E4 | Range with zero data | "—" and a range restatement, never "0" (which reads as a measured zero) |
| E5 | Filtered-empty vs genuinely-empty | **Always distinguished.** Different copy, different action |
| E6 | Analytics with < 2 sessions | "Not enough data for this range" + widen |
| E7 | Nutrition averages over partially logged periods | Averages use logged days only, and the logged-day count is always shown beside the average |
| E8 | No program scheduled | Adherence says "needs a schedule", never "0%" |
| E9 | First-time exercise in the logger | "First time logging this" — not an error, not an empty box |
| E10 | Week with no sessions | Zero-height column with a visible gap, not a missing category |

---

## 8. Permissions and platform

| # | Case | Required behaviour |
|---|------|--------------------|
| P1 | Camera denied | Library fallback; the flow still completes |
| P2 | Notifications denied | In-app inbox only; no repeated prompting |
| P3 | No camera (desktop) | Direct file picker with drag-and-drop |
| P4 | HEIC / unsupported image | Converted client-side where possible, else a clear message naming accepted formats |
| P5 | Wake lock unsupported or denied | Logging unaffected |
| P6 | `prefers-reduced-motion` | PR celebration skipped; all transitions become opacity-only |
| P7 | 200% zoom | Usable with no horizontal scroll |
| P8 | Forced-colors / high contrast | Charts fall back to texture fills; status never relies on color |
| P9 | Screen reader | Set commits, sync failures, AI completion and rest-timer completion are announced |
| P10 | Hardware keyboard only | The entire logger is operable; Enter commits a set |
| P11 | Very small viewport (320 px) | Single column, 16 px gutters, no clipped controls |
| P12 | Landscape phone | Supported; nothing locks orientation |

---

## 9. Security boundaries

| # | Case | Required behaviour |
|---|------|--------------------|
| S1 | Direct URL to another user's resource | 403 with generic copy. No existence disclosure |
| S2 | Image URL shared or leaked | Signed URLs are short-TTL and re-issued per view. **No public URL pattern exists** |
| S3 | Token expired mid-action | L-05 re-auths in place; the original request retries; nothing is lost |
| S4 | Refresh-token reuse detected | The token family is revoked; forced re-login with a security message |
| S5 | Login attempt on a nonexistent account | Identical response to a wrong password. No enumeration |
| S6 | Password reset for a nonexistent email | Identical confirmation. No enumeration |
| S7 | Rate limit hit | Countdown shown, never a bare "try later" |
| S8 | EXIF GPS in a food photo | Stripped client-side **and** server-side |
| S9 | PII in logs | `user_id` + `request_id` only. Never emails, food text, image contents or tokens |
| S10 | Account switch on a shared device | Query cache cleared; local drafts quarantined per user, never merged |

---

## 10. Error taxonomy

| Level | Surface | Example | Rule |
|-------|---------|---------|------|
| **Field** | Inline, under the input | "Reps must be at least 1." | States the fix, not just the fault |
| **Action** | Toast with undo or retry | "Couldn't save that set. Queued — it'll retry." | Never blocks the next action |
| **Surface** | `DataBoundary` error state | "Couldn't load your history." | Retry + copyable `request_id` |
| **App** | Route error boundary | "Something went wrong." | Reload path + error reported |

**Absolutely never:** a raw stack trace · a bare error code with no sentence · a modal over the
workout logger · a silently swallowed failure · the word "Oops".

---

## 11. Priority test matrix

The cases that must have automated coverage before MVP ships:

| Suite | Cases |
|-------|-------|
| Timezone | T1–T10 against 5 timezones incl. both DST directions |
| Units | U1–U7, especially the U1 round-trip property test |
| Offline | O1–O8, O12 — including "log a full session offline, kill the app, relaunch, sync" |
| AI | A1–A11, A17 — especially A17: every AI failure with the training flow verified unaffected |
| Lifecycle | D1, D5, D6, D8, D12 — the ones that silently corrupt trust if wrong |
| Concurrency | C1–C5 |
| Empty states | E1, E5, E7 — the three most commonly wrong |
| A11y | P9, P10 — keyboard-only session logging, screen-reader diary pass |
| Acceptance | AC-01 … AC-12 end-to-end (see [07-TRACEABILITY](07-TRACEABILITY.md)) |
