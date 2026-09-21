# Wireframes · H — Nutrition & AI Food Analysis

[← Conventions](00-CONVENTIONS.md) · [Index](../README.md)

Screens H-01 … H-18. Implements FR-N01 … FR-N05 and acceptance criteria AC-07, AC-08, AC-09, AC-10.

> **The governing rule for this whole file** (BRD §7, §12.9, §18, decision D5):
> **AI output is an estimate; only user-confirmed values are truth.**
> `food_analysis_items` are append-only and are never mutated by a correction. Only
> `meal_items.confirmed = true` counts toward any total. Estimated values never look like confirmed
> values — they carry the ✦ sparkle, a dashed border and an "Est." chip.

---

## H-01 · Nutrition Diary
**Route** `/nutrition?date=YYYY-MM-DD` · **Type** Tab root · **Priority** P0

```
┌──────────────────────────────────────────────┐
│  ◀   Today · Tue 21 Sep   ▶        📅   ⋮    │
├──────────────────────────────────────────────┤
│ ①┌──────────────────────────────────────────┐│
│  │           1,180 kcal left                ││  hero
│  │       1,160 of 2,340 consumed            ││
│  │  ━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░     ││  meter
│  │                                          ││
│  │  Protein ████████░░░░░   78 / 176 g      ││
│  │  Carbs   ██████░░░░░░░  104 / 234 g      ││
│  │  Fat     █████████░░░░   41 /  78 g      ││
│  │  Fiber                    12 g           ││
│  └──────────────────────────────────────────┘│
│                                              │
│ ②┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐│
│  │ ✦ 1 item waiting for you to check        ││
│  │   Chicken biryani · ~620 kcal    [Review]││
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘│
│                                              │
│ ③ BREAKFAST                     420 kcal  +  │
│  ┌──────────────────────────────────────────┐│
│  │ Oats, rolled        80 g      304 kcal  ›││
│  │ Milk, whole        200 ml     124 kcal  ›││
│  └──────────────────────────────────────────┘│
│   LUNCH                          740 kcal  + │
│  ┌──────────────────────────────────────────┐│
│  │ ✦ Chicken biryani  350 g  ─ 620 kcal ─  ›││ dashed = estimated
│  │ Curd               120 g      74 kcal   ›││
│  └──────────────────────────────────────────┘│
│   DINNER                     not logged    + │
│   SNACKS                     not logged    + │
│                                              │
│ ④ ( 📊 Week & month )   ( 🎯 Targets )       │
├──────────────────────────────────────────────┤
│   🏠      🏋️     ╭─+─╮      🍎       📈      │
└──────────────────────────────────────────────┘
```

### Regions
| # | Region | Notes |
|---|--------|-------|
| ① | Day totals | Hero = **remaining**, because that is the number people act on. A meter, not a pie. Confirmed items only |
| ② | Pending band | Unconfirmed AI items, visually separated and **excluded from ①**. This band is how D5 becomes visible |
| ③ | Meals | Grouped by `meal_type` in chronological order. Custom categories (H-16) appear in their configured position |
| ④ | Links | → H-14, H-15 |

### Controls
| Control | Action | Result |
|---------|--------|--------|
| ◀ / ▶ | navigate | Previous/next day. Swipe too. **▶ is disabled on today** — a future diary is meaningless |
| Date label | open | Date picker; "Today" jump |
| 📅 | navigate | A week strip / calendar view of logging streaks |
| ⋮ | menu | Copy this day to… (H-12) · Clear this day · Nutrition settings |
| Meter / macro bars | expand | Reveals per-meal distribution and a table view |
| `[ Review ]` ② | navigate | → H-08 for that analysis |
| `+` per meal | open sheet | → H-03 with `meal_type` and `date` preset |
| Item row tap | open sheet | → H-05 portion editor for that item |
| Item row swipe left | delete | Undo toast; totals recompute immediately |
| Item row long-press | menu | Edit · Duplicate · Move to another meal · Add to recipes · View AI original (H-18) |
| Meal header tap | navigate | → H-02 |
| Meal header long-press | menu | Rename · Copy meal · Delete meal · Log this again tomorrow |
| Pull to refresh | refetch | |

### States
| State | Behaviour |
|-------|-----------|
| Nothing logged | The meter shows the full target as remaining with "Nothing logged yet"; meal sections all read "not logged" with a `+`. **Never "0 kcal" styled as an achievement** |
| No targets set | The hero becomes total consumed; a `[ Set a target ]` action replaces "remaining" |
| Over target | Remaining goes negative: "320 kcal over" using the diverging warm arm + a status icon. Neutral copy, no judgement |
| Pending items only | ① shows 0 consumed and ② explains "Check these to add them to your day" |
| Incomplete macro data | A footnote: "1 item has no macro data — totals are incomplete." The item shows "—", never 0 |
| Past day | Identical, minus "Today". Fully editable |
| Future day | Blocked; ▶ disabled |
| Loading | Skeleton meter + skeleton meal cards |
| Offline | Cached day renders; manual add works; AI entry modes are disabled with a reason |

### Data
`GET /meals?date=` + profile targets, or the `daily_summaries` row when it is fresh.
Totals = Σ over `meal_items WHERE meal.local_date = date AND confirmed = true`.
`local_date` is derived with `user_profiles.timezone` (N05.8).

### Edge cases
- **Local midnight rollover while open** → the view advances to the new day with a toast; yesterday's
  totals do not linger.
- **An item logged at 01:30** belongs to that calendar day; the long-press menu offers "Move to
  yesterday" for people who log after a late meal.
- **Timezone change** → the day's contents can shift. A one-time explainer states this.
- **Target changed today** → today's meter uses the new target; **past days keep the target they had**
  if a target history exists, otherwise the day shows consumed only with a note. `[ASSUMPTION — target
  history is not versioned at MVP; past days render consumed-only when the target changed after them]`
- **Deleting the last item in a meal** → the meal row stays as an empty labelled section, not deleted,
  so the `+` remains where the user expects it.
- **An unconfirmed item older than 7 days** → the pending band offers "Confirm or remove these" so
  stale estimates don't accumulate invisibly.

### a11y
The meter is `role="meter"` with a text alternative ("1,160 of 2,340 kilocalories, 1,180 remaining").
Macro bars are directly labelled and have a table view (contrast relief for the aqua fat series).
Each item row's accessible name includes "estimated, not yet confirmed" when applicable — the dashed
border is never the only signal.

### Events
`nutrition.diary_viewed{date, has_pending}` · `nutrition.item_deleted` · `nutrition.day_copied`

---

## H-02 · Meal Detail
**Route** `/nutrition/meals/[mealId]` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Diary            Lunch                  ⋮  │
│  Tue 21 Sep · 13:20                          │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │  740 kcal                                ││
│  │  P 44 g · C 78 g · F 26 g · Fiber 6 g    ││
│  │  ████████████████░░░░  32% of your day   ││
│  └──────────────────────────────────────────┘│
│                                              │
│  ITEMS                                    +  │
│  ┌──────────────────────────────────────────┐│
│  │ ✦ Chicken biryani            ─ ─ ─ ─ ─  ││
│  │   350 g · 620 kcal · P31 C70 F23        ││
│  │   ⚠ 82% confidence · from a photo    ›  ││
│  │   [ Looks right ]   ( Edit )            ││
│  ├──────────────────────────────────────────┤│
│  │ Curd, plain                             ││
│  │   120 g · 74 kcal · P4 C5 F4         ›  ││
│  └──────────────────────────────────────────┘│
│                                              │
│  📝 "Ate out at the canteen"                 │
│                                              │
│  ( Save as a recipe )   ( Copy to another day)│
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| ⋮ | menu | Rename · Change time · Change meal type · Delete meal · View the original AI result (H-18) |
| `+` | sheet | → H-03 |
| Item row | sheet | → H-05 portion editor |
| `[ Looks right ]` | confirm | Sets `confirmed = true`, `user_corrected = false`. The dashed border and ✦ resolve to normal styling and the day total moves **at this moment** |
| `( Edit )` | navigate | → H-08 (for an AI item) or H-05 (for a manual one) |
| `›` on an AI item | navigate | → H-18 showing the raw analysis row |
| Save as a recipe | sheet | → H-11 create, prefilled with these items |
| Copy to another day | sheet | → H-12 |
| Swipe an item | delete | Undo toast |

**The confirm affordance is the heart of AC-10.** Until `[ Looks right ]` or an edit-and-save
happens, the item exists but contributes nothing. Afterwards, `food_analysis_items` still holds the
untouched original.

**Edge cases.** An empty meal → "No items yet" + `[ Add food ]`. Deleting a meal that has a linked
`food_analysis` deletes the analysis row and its stored image too (BRD §18 deletion right), stated in
the confirmation. Changing `meal_type` re-sorts it in H-01. Changing `consumed_at` across midnight
moves the meal to another day, with a confirmation naming both dates. An item whose `food_id` was
deleted still renders from its stored `display_name` and snapshotted macros.

---

## H-03 · Add Food — Mode Chooser
**Type** Sheet · **Priority** P0

```
┌──────────────────────────────────────────────┐
│               ───                            │
│  Add to Lunch · Tue 21 Sep          Change › │
│                                              │
│  🔍  Search foods                         ›  │
│  ✍️  Describe what you ate            ✦   ›  │
│  📷  Take a photo                     ✦   ›  │
│  ⚡  Quick add calories                   ›  │
│  📖  Recipes & saved meals                ›  │
│  🕐  Recent                               ›  │
│  ▦   Scan a barcode              [soon]      │
│                                              │
│  RECENTLY LOGGED                             │
│   Oats, rolled 80 g          +               │
│   Curd, plain 120 g          +               │
│   Chicken breast 150 g       +               │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Destination | Note |
|---------|-------------|------|
| Change › | Sheet | Change the meal and date this entry attaches to |
| Search foods | H-04 | |
| Describe what you ate | H-06 | ✦ AI. Disabled offline with a reason |
| Take a photo | L-06 → H-09 | ✦ AI. Disabled offline |
| Quick add calories | H-13 | Works offline |
| Recipes & saved meals | H-11 | |
| Recent | A list of the last 20 distinct items | One tap re-logs at the same portion |
| Scan a barcode | H-17 | `[P2]` — visibly "soon", never a dead tap |
| A recent row `+` | Immediate add | Adds at the previous portion with `confirmed = true`, plus an undo toast. **The fastest path for repeat eaters** |

---

## H-04 · Food Search
**Route** `/nutrition/search` · **Type** Full-screen · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ ✕  🔍 ┌──────────────────────────────────┐   │
│       │ chicken breast                   │   │
│       └──────────────────────────────────┘   │
│  [ All ] ( My foods ) ( Recent ) ( Verified )│
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ Chicken breast, grilled, skinless     ✓ ││
│  │ 165 kcal · P31 C0 F3.6  per 100 g       ││
│  ├──────────────────────────────────────────┤│
│  │ Chicken breast, raw                   ✓ ││
│  │ 120 kcal · P23 C0 F2.6  per 100 g       ││
│  ├──────────────────────────────────────────┤│
│  │ Chicken breast tandoori   ✎ my food     ││
│  │ 182 kcal · P29 C2 F7    per 100 g       ││
│  └──────────────────────────────────────────┘│
│                                              │
│  Can't find it?                              │
│  [ + Create "chicken breast" ]               │
│  ( ✍️ Describe it instead )                  │
└──────────────────────────────────────────────┘
```

**Controls.** Debounced 300 ms search across provider foods + custom foods + aliases · filter tabs ·
a row tap → H-05 portion sheet · `✓` marks a verified provider food, `✎` a custom one ·
`[ + Create ]` → H-10 with the query prefilled · "Describe it instead" → H-06 with the query carried over.

**Edge cases.** Zero results → creating a custom food becomes the primary action, because a missing
food is the most common reason nutrition logging is abandoned. Offline → searches cached and custom
foods only, with a banner. A very generic query returns too many results → the tabs and a "narrow by
brand" hint appear. Provider timeouts fall back to local results with a partial-results note rather
than an error.

---

## H-05 · Food Detail & Portion
**Type** Sheet · **Priority** P0

```
┌──────────────────────────────────────────────┐
│               ───                            │
│  Chicken breast, grilled, skinless        ✓  │
│                                              │
│  How much?                                   │
│  ┌──────────┐  ┌──────────────────────────┐  │
│  │   150    │  │ g                     ⌄  │  │
│  └──────────┘  └──────────────────────────┘  │
│   ( 100 g )  ( 1 breast ≈ 174 g )  ( 1 cup ) │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │  248 kcal                                ││
│  │  Protein  46.5 g   ███████████████       ││
│  │  Carbs     0.0 g                         ││
│  │  Fat       5.4 g   ██                    ││
│  │  Fiber     0.0 g                         ││
│  └──────────────────────────────────────────┘│
│                                              │
│  Add to  [ Lunch ⌄ ]   Tue 21 Sep ⌄          │
│                                              │
│  ( Details & source ⌄ )       [  Add  ]      │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| Quantity | numeric | Recomputes macros live. `inputMode="decimal"` |
| Unit ⌄ | select | g · ml · piece · serving · cup · tbsp — only the units this food defines |
| Portion presets | one tap | Common portions from `foods.serving_size`/`serving_unit` |
| Macro panel | — | Recomputed as `per_100g × grams ÷ 100`, or serving-based for count units |
| Add to / date | select | Retargets the meal and date |
| Details & source ⌄ | expand | Brand, provider, full nutrient list, "per 100 g" basis |
| `[ Add ]` | `POST /meals/:id/items` | Writes with `source = manual`, `confirmed = true`, macros **snapshotted**. Closes and returns to the caller |

**Edit mode.** Opening an existing item shows the same sheet with `[ Save ]` and `( Remove )`.

**Edge cases**
- A count unit ("1 piece") with no gram equivalent → macros are computed from the serving definition
  and the panel notes "per 1 serving", not per 100 g.
- A food with null macros → those rows show "—" and the item is flagged as incomplete data; it is
  still addable, because a food with only calories is better than no record.
- Quantity 0 or blank → `[ Add ]` disabled with "Enter how much you ate."
- An implausible quantity (5 kg of butter) → a soft confirm, never a block.
- Unit changed after typing → the number is preserved, not converted (150 g → 150 ml is a different
  measurement, and silently converting it would be wrong).

---

## H-06 · Describe Your Meal (text AI)
**Route** `/nutrition/describe` · **Type** Full-screen · **Priority** P0 · AC-08

```
┌──────────────────────────────────────────────┐
│ ✕            Describe your meal          ✦   │
│  Adding to Lunch · Tue 21 Sep                │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ 2 eggs, 3 rotis and 200g chicken curry   ││
│  │                                          ││
│  │                                          ││
│  └──────────────────────────────────────────┘│
│  Write it however you'd say it. Amounts help.│
│                                              │
│  TRY                                         │
│  ( a bowl of dal and 2 rotis )               │
│  ( 250 ml milk with 2 scoops whey )          │
│                                              │
│  ⓘ We'll estimate the nutrition and show it  │
│    to you before anything is saved.          │
│                                              │
│  [        Estimate nutrition        ]        │
│  ( 🎤 Dictate )                              │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| Textarea | free text | ≤ 1000 chars, multi-line, autosaved as a draft |
| Example chips | fill | Replaces the text, demonstrating the expected shape |
| 🎤 Dictate | speech-to-text | Uses the platform API; falls back silently to typing where unavailable |
| Estimate nutrition | `POST /food-analysis/text` | 202 + `analysis_id` → H-07 → H-08 |
| ✕ | intercept | "Discard what you typed?" if non-empty |

**Validation.** Empty → the button is disabled. Under 3 characters → "Tell us a bit more."

**Edge cases**
- **Unparseable input** ("food") → H-08 opens with zero items and a message: "We couldn't pick out
  any foods. Try including amounts, like '2 eggs'." **The user's text is preserved** and editable —
  making someone retype their meal is unforgivable.
- **Ambiguous quantities** ("a bowl of dal") → a default portion with an explicit "estimated amount"
  flag, editable in H-08 (N03.3).
- **Mixed languages / transliteration** → handled by the model; unresolved items keep the model's
  proposed macros and are flagged (resolution ladder step 5).
- **Offline** → the screen is reachable but the button is disabled with "Needs a connection", and the
  text is saved as a draft so it can be submitted later.
- **Quota exhausted** → stated **before** the button is pressed, with the reset time and a link to
  manual entry.
- **Very long input** → the character counter appears at 80%; over the limit it blocks with a
  suggestion to split it into two meals.

---

## H-07 · AI Processing
**Type** Overlay / dismissible card · **Priority** P0

```
┌──────────────────────────────────────────────┐
│                  ✦  ⟳                        │
│         Working out what's in there…         │
│                                              │
│   ✓ Uploaded                                 │
│   ⟳ Identifying foods                        │
│   · Estimating portions                      │
│   · Looking up nutrition                     │
│                                              │
│   Usually about 10 seconds.                  │
│                                              │
│   ( Do something else — we'll tell you )     │
└──────────────────────────────────────────────┘
```

**Behaviour**
- **Dismissible from the first second.** The job continues server-side; completion raises a
  notification and a diary badge that deep-link to H-08 (FR-N02.4).
- Polls `GET /food-analysis/:id` at 2 s, backing off to 5 s, capped at 90 s.
- On `completed` → auto-navigates to H-08 if the user is still here; otherwise it notifies.
- On `failed` → the error state below.

**Failure state**
```
│              ⚠                               │
│      We couldn't analyse that photo          │
│   The service didn't respond. Your meal      │
│   hasn't changed.                            │
│      [ Try again ]   ( Enter it manually )   │
│      ( Delete the photo )                    │
│   Reference: req_8f2a19c                     │
```

| `error_code` | Message | Actions |
|--------------|---------|---------|
| `ai_unavailable` | "The service didn't respond." | Retry · Manual |
| `ai_invalid_output` | "We got a result we couldn't read." | Retry · Manual |
| `image_unreadable` | "That image was too blurry or dark to read." | Retake · Manual |
| `no_food_detected` | "We couldn't find any food in that photo." | Retake · Manual · Keep the photo on the meal |
| `quota_exceeded` | "You've used all {n} analyses for today. Resets at {time}." | Manual only |
| `timeout` (client, 90 s) | "This is taking longer than usual." | Keep waiting · Check later · Manual |

**Every failure leaves the meal intact.** A failed analysis never deletes, blocks or corrupts
anything the user already logged (BRD §19 availability, §5.3 failure containment).

---

## H-08 · AI Review & Correct ★
**Route** `/nutrition/analysis/[analysisId]` · **Type** Full-screen · **Priority** P0 · AC-09, AC-10

**The screen where BRD §12.7 ("user reviews and corrects") becomes real.**

```
┌──────────────────────────────────────────────┐
│ ✕          Check this before saving      ✦   │
│  ┌────────┐  From your photo · 13:20          │
│  │ [img]  │  3 foods found                    │
│  └────────┘  Adding to Lunch · Tue 21 Sep     │
│                                              │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐│
│ │ ☑ Chicken biryani                      ✕  ││
│ │   ┌──────┐ ┌────┐                         ││
│ │   │ 350  │ │ g ⌄│    620 kcal              ││
│ │   └──────┘ └────┘    P31 · C70 · F23      ││
│ │   ●●●●●●●●○○  82% confident                ││
│ │   ✓ matched to "Chicken biryani"  Change › ││
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘│
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐│
│ │ ☑ Raita                                ✕  ││
│ │   ┌──────┐ ┌────┐                         ││
│ │   │ 100  │ │ g ⌄│     74 kcal              ││
│ │   └──────┘ └────┘    P3 · C5 · F4         ││
│ │   ●●●●○○○○○○  41% confident  ⚠ please check││
│ │   ⚠ no nutrition match — using our estimate││
│ │                                   Find it ›││
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘│
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐│
│ │ ☐ Salad, mixed                         ✕  ││
│ │   ┌──────┐ ┌────┐                         ││
│ │   │  60  │ │ g ⌄│     18 kcal              ││
│ │   └──────┘ └────┘                         ││
│ │   ●●●●●●○○○○  63% confident                ││
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘│
│                                              │
│  [ + Add something we missed ]               │
│  ──────────────────────────────────────────  │
│  Selected total   694 kcal                   │
│                   P34 · C75 · F27            │
│  ⓘ Confidence is how sure we are we spotted  │
│    the food — not how accurate the calories   │
│    are. Check the amounts.                    │
├──────────────────────────────────────────────┤
│  ( Discard )        [  Save 2 items  ]       │
└──────────────────────────────────────────────┘
```

### Controls
| Control | Action | Result |
|---------|--------|--------|
| ☑ / ☐ per item | toggle | Only checked items are saved. Items below the low-confidence threshold `[ASSUMPTION: 0.5]` start **unchecked** (N04.3) |
| Item name tap | edit | Free-text rename, which triggers a re-resolution against the food database |
| Quantity field | numeric | Recomputes macros from the resolved food; for an unresolved item it scales the model's proposal proportionally |
| Unit ⌄ | select | g · ml · piece · serving · cup |
| Macro values tap | edit | **Every macro is directly editable** (N04.1). Editing any macro sets `user_corrected = true` and decouples that item from automatic recomputation, with a visible note |
| `Change ›` | sheet | → H-04 food search to attach a different canonical food |
| `Find it ›` (unresolved) | sheet | → H-04 to attach a food; accepting the estimate instead is also offered |
| `✕` per item | remove | Excludes the item. Undo available. **The analysis row is not deleted** |
| `+ Add something we missed` | sheet | → H-04; the added item joins the list with `source = manual` (N04.4) |
| Confidence dots | tap | Popover explaining detection vs nutritional certainty |
| Image thumbnail | tap | Full-screen viewer with pinch-zoom |
| `[ Save N items ]` | `POST /food-analysis/:id/confirm` | Writes `meal_items` with `confirmed = true`, `source = image_ai\|text_ai`, `analysis_item_id`, `user_corrected`, and snapshotted macros. **`food_analysis_items` are untouched** |
| `( Discard )` | dialog | "Discard this analysis? The photo will be deleted." Nothing is written to the meal |
| ✕ | intercept | "Save what you've checked, or leave it for later?" → Save · Keep for later (stays pending in H-01) · Discard |

### Confidence presentation (N04.2)
| Band | Dots | Treatment |
|------|------|-----------|
| ≥ 0.8 | ●●●●●●●●○○ | Checked by default, normal styling |
| 0.5 – 0.79 | ●●●●●●○○○○ | Checked, no warning |
| < 0.5 | ●●●●○○○○○○ | **Unchecked** by default + "⚠ please check" |

The explanatory sentence — *confidence is detection, not nutritional accuracy* — is **required on
the screen**, not hidden in a tooltip. It is the single most important piece of copy in the product
for keeping the AI honest (BRD §13, Risk R1).

### States
| State | Behaviour |
|-------|-----------|
| Zero items detected | "We couldn't identify any food." + `[ Add it manually ]` + `( Try another photo )`. The user's photo/text is retained |
| All items low confidence | All unchecked; the save button reads "Check at least one item" and is disabled |
| Analysis already confirmed | Read-only, showing what was saved vs what was proposed — this is the AC-10 audit view |
| Offline | The cached analysis renders; saving is queued through the outbox |
| Re-opened later from a notification | Identical; the analysis is still `pending` and the meal is unchanged |

### Edge cases
- **Editing the quantity of a resolved item** recomputes macros from `foods`. **Editing a macro
  directly** stops that recomputation for the item and says so: "Using your numbers."
- **Changing the food match** re-derives all macros from the new food at the current quantity.
- **An item the resolver could not match** keeps the model's proposed macros, is labelled
  "using our estimate", and saves with `food_id = NULL` and a `display_name` — this is what makes
  home-cooked and regional food loggable at all (architecture §5.2 step 5).
- **The same analysis confirmed twice** (double tap, or two devices) → idempotent on `analysis_id`;
  no duplicate `meal_items`.
- **A meal deleted while its analysis is pending** → the analysis is orphaned; H-08 offers to attach
  it to a different meal rather than discarding the user's photo.
- **Total macros don't sum to the calories** (model inconsistency) → a footnote shows the
  macro-derived calories alongside, and lets the user take either. Never silently overwritten.
- **Very many items detected (> 10)** → the list is scrollable with a sticky total; the save button
  always states the count.

### a11y
Each item is a `group` with an accessible name including its confidence
("Chicken biryani, 350 grams, 620 kilocalories, 82 percent confidence, selected"). The dashed border
is never the only cue — "estimated, not yet confirmed" is in the accessible name. Editing a macro
announces the recomputed total via a live region. Full keyboard operation: Tab through items, Space
toggles selection, Enter opens the field.

### Events
`ai.analysis_completed{duration_ms, item_count, mean_confidence, unresolved_count}` ·
`ai.item_edited{field, confidence_before}` ·
`ai.analysis_confirmed{edited_item_count, removed_count, added_count, unchecked_count}` ·
`ai.analysis_discarded`

---

## H-09 · Photo Capture
**Route** `/nutrition/photo` · **Type** Full-screen · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ ✕                                       💡   │
│                                              │
│                                              │
│          ┌──────────────────────┐            │
│          │                      │            │
│          │    (camera preview)  │            │
│          │                      │            │
│          └──────────────────────┘            │
│      Fit the whole plate in the frame.       │
│      Shoot from above if you can.            │
│                                              │
│  ┌────┐                              ┌────┐  │
│  │ 🖼 │          (  ◉  )             │ 🔄 │  │
│  └────┘                              └────┘  │
│  library          shutter            flip    │
│                                              │
│  ▣ ▣ +          2 photos added               │
│                 [ Analyse 2 photos ]         │
└──────────────────────────────────────────────┘
```

**Controls.** Shutter captures and adds a thumbnail · 🖼 opens the library (multi-select) ·
🔄 flips camera · 💡 toggles the torch · a thumbnail tap previews and offers removal ·
`[ Analyse N photos ]` uploads and → H-07.

**Client-side pipeline before upload** (FR-N02.2): downscale to ≤ 1600 px on the long edge, compress
to JPEG q80 (target < 500 KB), **strip EXIF including GPS**, then `POST /uploads/sign` → direct PUT
→ `POST /food-analysis/image`.

**Edge cases**
- **Camera permission denied** → L-06 explains why, then the screen falls back to the library picker;
  it never becomes a dead screen. A "Open settings" link is offered but the flow does not depend on it.
- **No camera available** (desktop) → the screen opens directly as a file picker with drag-and-drop.
- **A file that isn't an image** → rejected with "Pick a photo" before upload.
- **File too large / unsupported format (HEIC)** → converted client-side where possible; otherwise a
  clear message naming the accepted formats.
- **Upload fails mid-way** → the photo is kept locally and retried; the user is not made to retake it.
- **Max photos (4 `[ASSUMPTION]`)** → the `+` disables with "That's enough for one meal."
- **Offline** → capture works and the analysis is **queued**: the photo is stored locally and
  submitted when connectivity returns, with a pending card in H-01. The user is told this explicitly.
- **Quota exhausted** → stated on entry, before a photo is taken.

---

## H-10 · Create / Edit Custom Food
**Route** `/nutrition/foods/new` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ ✕            New food                  [Save]│
│  Name *      ┌────────────────────────────┐  │
│              │ Mum's rajma                │  │
│  Brand       ┌────────────────────────────┐  │
│                                              │
│  NUTRITION PER                               │
│  [ 100 g ]  ( 100 ml )  ( 1 serving )        │
│                                              │
│  Calories *  ┌──────┐ kcal                   │
│              │ 142  │                        │
│  Protein     ┌──────┐ g     Carbs ┌──────┐ g │
│              │  8.2 │           │ 19.4 │     │
│  Fat         ┌──────┐ g     Fiber ┌──────┐ g │
│              │  3.1 │           │  6.8 │     │
│                                              │
│   ⓘ Macros suggest ~138 kcal. Close enough.  │
│                                              │
│  A TYPICAL SERVING                           │
│  ┌──────┐ ┌────────────┐                     │
│  │ 200  │ │ g       ⌄  │  = 284 kcal         │
│  └──────┘ └────────────┘                     │
└──────────────────────────────────────────────┘
```

**Validation.** Name and calories required. Macros optional but the cross-check line compares
`4P + 4C + 9F` against the stated calories and warns (never blocks) past a 15% divergence — a
genuine, common data-entry catch. All values ≥ 0; calories ≤ 900 per 100 g (a soft warning above).

**Edge cases.** A near-duplicate name warns with a link to the existing food. Editing a custom food
that past `meal_items` reference **does not change those items**, because macros were snapshotted at
confirm time (architecture §4.2 invariant 4); the screen states this so the user isn't surprised that
correcting a food didn't fix last week's totals, and offers "Recalculate items from today onward"
`[ASSUMPTION]`. Creating offline works with a client-side ID and syncs later.

---

## H-11 · Recipes & Saved Meals
**Route** `/nutrition/recipes` · **Type** Stacked · **Priority** P1

```
┌──────────────────────────────────────────────┐
│ < Diary          Recipes                [ + ]│
│  🔍 Search                                   │
│  ┌──────────────────────────────────────────┐│
│  │ Morning oats            4 items          ││
│  │ 428 kcal · P24 C52 F12   per serving  ›  ││
│  │                           [ Log it ]     ││
│  ├──────────────────────────────────────────┤│
│  │ Post-gym shake          3 items          ││
│  │ 340 kcal · P42 C28 F6                 ›  ││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

A recipe is a named, reusable set of items with a serving count. `[ Log it ]` adds all items to the
chosen meal in one action, scaled by servings. The detail view edits items and servings.
**Editing a recipe never changes meals already logged from it** — the same snapshot rule as foods.

---

## H-12 · Copy Meal / Copy Day
**Type** Sheet · **Priority** P1

```
│  Copy "Lunch · Tue 21 Sep"                   │
│  ◉ Tomorrow, Wed 22 Sep                      │
│  ○ A specific date…         ┌──────────┐     │
│  ○ Every day this week                       │
│  Add to:  [ Lunch ⌄ ]                        │
│  ☑ Keep the original amounts                 │
│  [ Copy 2 items ]                            │
```

Copying a day duplicates every meal and item to the target date, with the new `consumed_at` mapped to
the same clock times. Items copy as `confirmed = true` with fresh IDs. **The AI provenance is not
copied** — a copy is a manual entry, not a new estimate. An existing target meal prompts to merge or
replace.

---

## H-13 · Quick Add
**Type** Sheet · **Priority** P1

```
│  Quick add to Lunch                          │
│  Calories *  ┌──────┐ kcal                   │
│  Protein     ┌──────┐ g   Carbs ┌──────┐ g   │
│  Fat         ┌──────┐ g                      │
│  Label       ┌────────────────────────────┐  │
│              │ Canteen lunch              │  │
│  [ Add ]                                     │
```

Writes a `meal_item` with `food_id = NULL`, `source = manual`, `confirmed = true`, a `display_name`
and the entered macros. This is the escape hatch that keeps the diary complete when nothing else
fits, and it works fully offline.

---

## H-14 · Nutrition Analytics
**Route** `/nutrition/analytics` · **Type** Stacked · **Priority** P0 · BRD §11

```
┌──────────────────────────────────────────────┐
│ < Diary       Nutrition                      │
│  ( Week ) [ Month ] ( 3 mo ) ( Custom )      │
│  1 – 21 Sep 2026 · 21 days                   │
│                                              │
│  ┌────────────────┬─────────────────────────┐│
│  │ 2,280 kcal     │ 168 g                   ││
│  │ daily average  │ protein average         ││
│  ├────────────────┼─────────────────────────┤│
│  │ 18 of 21 days  │ 12 days                 ││
│  │ logged         │ within 10% of target    ││
│  └────────────────┴─────────────────────────┘│
│                                              │
│  DAILY CALORIES · kcal                       │
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ target 2,340 │
│  │ ▆ █ ▅ ▇ ▄ ▆ █ ▅ ▇ ▆ ▅ ▇ ▆ █ ▄ ▆ ▇ ▅      │
│  └──────────────────────────────────────────  │
│   1        7        14       21              │
│                              Table view      │
│                                              │
│  MACRO SPLIT · daily average                 │
│  │ Protein ████████  168 g  29%              │
│  │ Carbs   ██████████ 241 g  42%             │
│  │ Fat      ██████     73 g  29%             │
│                                              │
│  TRAINING vs REST DAYS                       │
│   Training (12)  2,410 kcal · 181 g protein  │
│   Rest      (6)  2,020 kcal · 142 g protein  │
│                                              │
│  WEIGHT & INTAKE                             │
│  │ weight   ╲__                              │
│  │ ────────────────── 78.4 kg                │
│  └──────────────────────────────────────────  │
│  │ calories ▆█▅▇▄▆█▅▇                        │
│  └──────────────────────────────────────────  │
│   Two charts, one shared time axis.          │
└──────────────────────────────────────────────┘
```

**Note the last block.** Weight and calories are shown as **two stacked charts sharing an x-axis**,
never as a dual-axis chart. Two measures on two y-scales is the single most misleading chart this
product could ship, and it is prohibited by the design system.

**"Training vs rest days"** answers a BRD §22 query directly, joining `daily_summaries.session_count`
with nutrition totals.

**Edge cases.** Unlogged days are **excluded from averages** and the count of logged days is always
shown beside the average — otherwise a week with three logged days reports a meaningless "average".
A footnote states "Averages use the 18 days you logged." Days with incomplete macro data are counted
for calories but flagged in the macro split. Ranges with fewer than 3 logged days show
"Not enough data yet" rather than a noisy chart.

---

## H-15 · Calorie & Macro Targets
**Route** `/nutrition/targets` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Diary           Targets              [Save]│
│  ◉ Calculate for me       ○ Set my own       │
│                                              │
│  CALCULATED                             ✦    │
│   Activity  [ Moderate ⌄ ]                   │
│   Goal      [ Lose fat ⌄ ]   −10%            │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│   │        2,340 kcal / day              │   │
│   │ BMR 1,680 × 1.55 = 2,604 → −10%      │   │
│   │ Mifflin–St Jeor. An estimate.        │   │
│   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│                                              │
│  MACROS                                      │
│   Protein  ├────●──────┤  30%   176 g        │
│   Carbs    ├──────●────┤  40%   234 g        │
│   Fat      ├────●──────┤  30%    78 g        │
│                       total 100% ✓           │
│   ( Balanced ) ( High protein ) ( Low carb ) │
│                                              │
│  ⓘ Changing targets affects today onward.    │
│    Your past days keep the numbers they had. │
└──────────────────────────────────────────────┘
```

**Controls.** Mode radio · activity and goal selects that recompute live · macro sliders that are
**interlocked to always total 100%** (moving one redistributes the others proportionally, and the
locked total is shown) · preset splits · gram values editable directly, which back-computes the
percentages.

**Validation.** Calories 800–8000 with a soft warning below 1200. Percentages must total exactly 100%.
Protein above 4 g/kg bodyweight warns once.

**Edge cases.** Switching from calculated to manual keeps the last calculated values as a starting
point and drops the ✦. Missing profile data (birth date, sex) → the calculator explains what it is
missing and offers a link to fill it in, falling back to a weight-and-activity estimate meanwhile.
The ⓘ note about historical targets is required so users understand why yesterday's meter didn't move.

---

## H-16 · Meal Category Manager
**Route** `/nutrition/categories` · **Type** Stacked · **Priority** P1 · BRD §15

Reorder and rename the four default categories, add custom ones (e.g. "Pre-workout",
"Post-workout"), set a default time for each, and hide unused ones.
**A category with logged meals cannot be deleted**, only hidden — the same soft-delete principle as
exercises and programs. Hidden categories still render in history.

---

## H-17 · Barcode Scanner `[P2]`
**Route** `/nutrition/barcode` · **Priority** P2

Camera scanner → `GET /foods/barcode/:code` → H-05 portion sheet. Unknown barcode → offers H-10 with
the code attached. Shown as "soon" in H-03 at MVP, never as a broken entry point.

---

## H-18 · Analysis History (AI audit)
**Route** `/nutrition/analyses` · **Type** Stacked · **Priority** P1 · BRD §18

```
┌──────────────────────────────────────────────┐
│ < Settings      Food analyses                │
│  ┌──────────────────────────────────────────┐│
│  │ [img] 21 Sep 13:20 · photo               ││
│  │ 3 foods · 2 saved · you edited 1      ›  ││
│  ├──────────────────────────────────────────┤│
│  │ ✍️  20 Sep 08:10 · text                  ││
│  │ "2 eggs, 3 rotis…" · 3 foods · 3 saved › ││
│  └──────────────────────────────────────────┘│
│  ( Delete all photos )                       │
└──────────────────────────────────────────────┘
```

**Detail view** shows, side by side, **what the AI proposed** and **what was saved** — the visible
proof of AC-10 and the auditability requirement in BRD §18.

```
│  WHAT WE ESTIMATED      WHAT YOU SAVED       │
│  Chicken biryani 350 g  Chicken biryani 300 g│
│  620 kcal · 82%         531 kcal  (edited)   │
│  Raita 100 g            Raita 100 g          │
│  74 kcal · 41%          74 kcal              │
│  Salad 60 g             — not saved          │
│  Model: <provider/model@version>             │
```

**Controls.** Delete an individual analysis (removes the row and its image) · "Delete all photos"
removes every stored food image while keeping the confirmed nutrition (BRD §18 deletion right) ·
a row `›` → this detail view · a link to the meal it fed.

**Edge cases.** An analysis whose meal was deleted shows "meal deleted" and remains deletable.
Retention is configurable in K-08 with a default of 90 days `[ASSUMPTION]`, after which images are
purged automatically and only the structured result remains.
