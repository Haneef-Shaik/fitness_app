# Design System
## Fitness & Nutrition Tracking Platform

Tokens, components, chart specifications and accessibility rules used by every wireframe in
[wireframes/](wireframes/).

---

## 1. Design principles

| # | Principle | What it forbids |
|---|-----------|-----------------|
| 1 | **Speed beats beauty in the logger.** The set-entry screen is a tool, not a showcase. | Decorative animation, elegant-but-small tap targets, anything between a tap and a result |
| 2 | **Estimated and confirmed never look the same.** (BRD §18) | Displaying an AI estimate in the same style as a confirmed value |
| 3 | **Every number states its range and unit.** (BRD §10, §11) | "Volume: 12,400" with no unit and no period |
| 4 | **Empty is a first-class state.** A new user sees the whole app empty. | A blank screen, a zeroed chart, or a spinner that never resolves |
| 5 | **The thumb owns the bottom third.** | Primary actions in the top-right on mobile |
| 6 | **Read-only history is visibly read-only.** (AC-12) | Editable-looking fields on a past session that aren't in edit mode |
| 7 | **One-handed operation is the default assumption.** | Flows requiring two-finger gestures or precise drag on mobile |

---

## 2. Color tokens

### 2.1 Surfaces & ink

| Role | Light | Dark |
|------|-------|------|
| `--page` | `#F7F8F7` | `#0E0F11` |
| `--surface-1` (card / chart surface) | `#FFFFFF` | `#17181A` |
| `--surface-2` (raised: sheets, popovers) | `#FFFFFF` | `#1F2124` |
| `--surface-sunken` (input wells, timer) | `#F1F3F2` | `#101214` |
| `--ink-primary` | `#0B0C0D` | `#FFFFFF` |
| `--ink-secondary` | `#52544F` | `#C4C6C1` |
| `--ink-muted` (axis, labels, hints) | `#898B85` | `#898B85` |
| `--border-hairline` | `rgba(11,12,13,0.10)` | `rgba(255,255,255,0.10)` |
| `--gridline` | `#E3E5E1` | `#2C2E2C` |
| `--baseline` | `#C4C6C1` | `#383A38` |

### 2.2 Brand & interaction

**Iris** — a blue-violet at OKLCH hue ~292°. Chosen by measurement, not taste; see §2.3.

| Role | Light | Dark | Use |
|------|-------|------|-----|
| `--brand` | `#5A31C4` | `#B0A4FF` | Primary action, active tab, live-session pulse, calorie meter, links |
| `--brand-hover` | `#4A2AA6` | `#C3BAFF` | Hover / pressed |
| `--brand-subtle` | `#EFEBFB` | `#1E1A33` | Selected rows, active chips |
| `--on-brand` | `#FFFFFF` | `#0E0F11` | Text on a brand fill |
| `--focus-ring` | `#5A31C4` | `#B0A4FF` | 2 px ring + 2 px offset, never removed |

**The brand hue is deliberately outside the chart series palette.** A brand fill is never used as a
series color and a series color is never used as a control fill — a control and a data mark must
never imply a relationship. *(This supersedes an earlier version of this document, which made the
brand the same family as series slot 1 and so contradicted its own rule: a blue button sat beside a
blue protein bar.)*

### 2.3 Why Iris — the measured case

The accent has an unusually tight constraint set. It must sit on the primary action **and** the
calorie meter **and** the active tab, so it has to be semantically neutral between training and
nutrition — neither a food color nor an alarm color. Meanwhile the 8-slot series palette and the
4 status colors already occupy most of the hue circle.

The whole hue circle was swept and scored on worst-case CVD separation (OKLab ΔE ×100, protan and
deutan simulated) against the four **used** series and all four status colors, under a ≥ 4.5:1
contrast floor in both modes. Iris was the joint optimum.

| Iris vs | Dark CVD ΔE | Light CVD ΔE |
|---------|-------------|--------------|
| protein (s1) — the binding constraint | **11.1** | **11.9** |
| carbs (s2) | 29.0 | 33.7 |
| fat (s3) | 20.4 | 31.1 |
| fiber (s4) | 28.5 | 45.8 |
| status-good | 28.6 | 35.8 |
| status-warning | 29.0 | 49.5 |
| status-serious | 23.1 | 35.6 |
| status-critical | 28.9 | 26.0 |

Target is ΔE ≥ 8; everything clears it, and the margin against **status-critical (28.9 / 26.0)**
is what guarantees the primary action can never be mistaken for the destructive one.

Contrast: `#B0A4FF` is **8.12:1** on the dark surface and **8.77:1** with near-black text on the
fill; `#5A31C4` is **7.86:1** on white, both directions.

**Rejected, with reasons:**

| Candidate | Why it fails |
|-----------|--------------|
| Lime / volt green | CVD ΔE **0.3** vs series green and **3.4** vs status-critical in light mode — effectively invisible as a distinct color to a red-green colorblind user. Also competes with `--status-good`. |
| Amber / gold | CVD ΔE **1.8** vs `--status-warning`. The primary button would *be* the warning color. |
| Magenta / hot pink | CVD ΔE **7.4** vs `--status-critical`. Primary action reads as destructive. |
| Red / orange | Color theory favours red for effort and force, but orange is series slot 2 (carbs), coral is `--status-serious` and red is `--status-critical`. A three-way collision; structurally unavailable in this system. |
| Blue / cyan | Blue is series slot 1 (protein) and the entire sequential ramp. |
| Tailwind violet `#A78BFA/#6D28D9` | The obvious off-the-shelf violet: CVD ΔE **4.9** vs protein blue. Fails. |

**Color theory.** Red-family hues raise arousal and are the classic "effort" signal, but this system
has spent them on alarm states. Blue-family hues read calm and trustworthy but are spent on data.
Iris sits between the two — read as focus, capability and performance rather than urgency or rest —
which is the correct register for an app used both mid-set and while reviewing a food estimate. It
is also the only remaining family that does not read as a **food** color, which matters because the
same token fills the calorie meter directly above the macro bars.

### 2.4 Status (reserved — never reused as a series color)

| Role | Hex (both modes) | Meaning in this product | Always paired with |
|------|------------------|-------------------------|--------------------|
| `--status-good` | `#0CA30C` | Target met · PR achieved · synced | ✓ icon + label |
| `--status-warning` | `#FAB219` | Approaching a limit · low AI confidence · pending sync | ⚠ icon + label |
| `--status-serious` | `#EC835A` | Over target · unresolved food · stale data | icon + label |
| `--status-critical` | `#D03B3B` | Failed write · destructive action · sync failure | icon + label |

On the light surface `warning` (1.79:1) and `serious` (2.57:1) are below 3:1 by design — **the icon
and label are the mitigation**. Status never carries meaning through color alone.

### 2.5 Semantic data roles

| Role | Token | Note |
|------|-------|------|
| Confirmed nutrition | `--ink-primary`, solid fills | Full opacity, normal weight |
| **Estimated / unconfirmed** | `--ink-secondary` + dashed 1.5 px border + an "Est." chip | Never a solid fill; never the same weight as confirmed |
| Target / goal line | `--ink-muted`, 1.5 px dashed | Reference, not data |
| Previous performance | `--ink-muted` on `--surface-sunken` | Context, recessive to today's entry |
| Improvement vs previous | `--status-good` + ▲ + value | Icon + sign, not color alone |
| Regression vs previous | `--ink-secondary` + ▼ + value | **Deliberately not red** — a lighter day is not an error |

> Rule 7 of this system: a down-arrow on a lift is *information*, not a failure. Reserve
> `--status-critical` for things the user must fix.

---

## 3. Chart system

Validated with the skill's checker against this system's own surfaces.
**Light (`#FFFFFF`): ALL CHECKS PASS** — worst adjacent CVD ΔE 9.1, worst adjacent normal-vision
ΔE 19.6, three slots below 3:1 contrast (relief rule applies).
**Dark (`#17181A`): ALL CHECKS PASS** — worst adjacent CVD ΔE 8.4, normal-vision ΔE 19.3, all slots ≥ 3:1.

### 3.1 Categorical series — fixed order, never cycled

| Slot | Hue | Light | Dark | Assigned to |
|------|-----|-------|------|-------------|
| 1 | blue | `#2A78D6` | `#3987E5` | **Protein** · primary muscle volume · current session |
| 2 | orange | `#EB6834` | `#D95926` | **Carbs** · secondary muscle volume · previous session |
| 3 | aqua | `#1BAF7A` | `#199E70` | **Fat** · third comparison session |
| 4 | yellow | `#EDA100` | `#C98500` | Fiber (when shown) |
| 5 | magenta | `#E87BA4` | `#D55181` | Reserved |
| 6 | green | `#008300` | `#008300` | Reserved |
| 7 | violet | `#4A3AA7` | `#9085E9` | **Spacer only — not assignable** (brand-adjacent, see below) |
| 8 | red | `#E34948` | `#E66767` | Reserved |

The **macro trio (slots 1–3)** passes the stricter *all-pairs* gate in both modes
(light: CVD ΔE 9.2, normal-vision 24.0 · dark: CVD ΔE 9.4, normal-vision 20.9), which is required
because macros appear in donuts and small multiples, not only stacks.

Aqua (`#1BAF7A`, 2.82:1) sits below 3:1 on the light surface → **fat is always directly labelled**
and every macro chart ships a table view.

**Slot 7 is a spacer, not a usable series.** It sits ΔE 9.6 (dark) / 5.4 (light) from `--brand`
Iris, so assigning it would put a data mark next to a control in the same hue. It cannot simply be
deleted either: removing it makes magenta and red adjacent, which **fails** the normal-vision floor
at ΔE 13.2 — every 7-slot reordering was tested and all of them fail. Violet is load-bearing in the
*ordering* and unavailable in *assignment*. The practical ceiling is therefore **6 assignable
series**; past six, fold the tail into "Other" or facet into small multiples, which the chart rules
require at that count anyway.

### 3.2 Sequential ramp (magnitude — muscle heatmap, calendar intensity)
One hue, blue, light → dark: `#CDE2FB · #B7D3F6 · #9EC5F4 · #86B6EF · #6DA7EC · #5598E7 · #3987E5 · #2A78D6 · #256ABF · #1C5CAB · #184F95`.
For **ordinal** use (discrete tiers) start no lighter than `#86B6EF` on light, no darker than
`#184F95` on dark.

### 3.3 Diverging (vs target — calorie surplus/deficit, weight vs goal)
Blue ↔ red with a **gray** midpoint (`#F0EFEC` light, `#383835` dark). Equal steps per arm.
Never a hue at the midpoint — "exactly on target" must read as neutral.

### 3.4 Chart-type assignments

| Surface | Data's job | Form | Color job |
|---------|-----------|------|-----------|
| Dashboard calories | one ratio against a limit | **Meter** (same-ramp track) | sequential |
| Dashboard macros | part-to-whole, 3 classes | **Stacked horizontal bar**, direct-labelled | categorical 1–3 |
| Dashboard weight | current value + trend | **Stat tile + sparkline** | single hue |
| Dashboard consistency | 7 discrete states | **Week dot strip** with icon states | status + muted |
| Weight trend (I-03) | change over time, one series | **Line** (raw, thin) + **7-day moving average** (heavier, same hue, darker step) | 1 hue, 2 shades |
| Calorie history (H-14) | magnitude over time vs a limit | **Column** + dashed target line | sequential |
| Macro history (H-14) | part-to-whole over time | **Stacked column** | categorical 1–3 |
| Session volume (G-02) | trend over time | **Column** | sequential |
| Muscle-group volume (G-02) | compare magnitude across ~8 groups | **Horizontal bar, sorted** | sequential |
| Muscle frequency (G-05) | magnitude over a grid | **Heatmap** (week × muscle) | sequential |
| e1RM / load progression (G-03, G-07) | trend, one series is the point | **Line with emphasis** — selected exercise in brand, comparison in muted | 1 hue + gray |
| PR board (G-04) | a handful of headline numbers | **KPI row of stat tiles** | none |
| Adherence (G-06) | ratio against a plan | **Meter** + a per-week dot strip | sequential |
| Session comparison (F-06) | before → after per exercise | **Dumbbell chart** | 1 hue, 2 shades |
| Body measurements (I-04) | trend over time | **Line** | 1 hue |

**Never** in this product: a dual-axis chart (weight and calories on one plot is the single most
tempting mistake here — use two stacked charts sharing an x-axis); a pie with more than three
slices; a 3D anything; a generated 9th hue.

### 3.5 Mark & anatomy rules
- Bars/columns: 4 px rounded **data-end only**, square at the baseline. 2 px surface-colored gap
  between stacked segments and adjacent bars.
- Lines: 2 px stroke. Moving-average line 2.5 px in a darker step of the same hue. Raw points ≥ 8 px
  on hover, 4 px at rest.
- Overlapping marks carry a 2 px surface-colored ring.
- Grid: horizontal hairlines only, `--gridline`. No vertical grid. No chart border.
- Axes: `--ink-muted`, tabular figures on ticks.
- **Selective direct labels** — first, last, max, and the hovered point. Never a number on every point.
- Values, labels and legends wear ink tokens, **never the series color**.

### 3.6 Interaction
Every chart ships a hover layer by default: crosshair + tooltip on line/area, per-mark tooltip on
bar/column/cell. Touch targets are larger than the mark. Filters (date range, muscle group,
granularity) sit in **one row above** the charts, never inside them. Tooltips show the full precision;
the axis shows the rounded value.

### 3.7 Accessibility of charts
- ≥ 2 series → a legend is always present; ≤ 4 series are **also** directly labelled, so identity is
  never color-alone. A single series needs no legend — the title names it.
- Every chart has a **table view** toggle. This is mandatory, not optional, for the macro charts
  (contrast relief) and for any chart a user might need to read precisely.
- Dark mode uses its **own selected steps** from the same ramps — never a filter or an automatic flip.
- A texture fill (45° / 135° lines, tone-on-tone) is available for full-CVD users, print and
  `forced-colors`. Off by default, never decorative.
- Charts respect Reduce Motion (`AccessibilityInfo.isReduceMotionEnabled`): no entry animation, no animated transitions between ranges.

---

## 4. Typography

System sans everywhere: `system-ui, -apple-system, "Segoe UI Variable", "Segoe UI", Roboto, sans-serif`.
No display face, no serif.

| Token | Size / line | Weight | Use |
|-------|-------------|--------|-----|
| `--text-hero` | 48 / 52 | 600 | The one number a screen leads with (calories remaining, session volume) |
| `--text-display` | 32 / 38 | 600 | Screen titles on large surfaces |
| `--text-h1` | 24 / 30 | 600 | Page titles |
| `--text-h2` | 20 / 26 | 600 | Section headers |
| `--text-h3` | 17 / 24 | 600 | Card titles |
| `--text-body` | 16 / 24 | 400 | Default. **Never smaller for primary content.** |
| `--text-body-strong` | 16 / 24 | 600 | Values in a label/value pair |
| `--text-caption` | 14 / 20 | 400 | Secondary info, helper text |
| `--text-micro` | 12 / 16 | 500 | Chips, badges, axis ticks. **Never for anything actionable or essential.** |
| `--text-numeric` | inherits | 600 | `font-variant-numeric: tabular-nums` — set/rep/load tables, axis ticks, any aligned column |

Proportional figures for hero and stat-tile values; **tabular figures for every vertically aligned
column** (the set table, history rows, axis ticks) so digits don't jitter as they change.

---

## 5. Spacing, radius, elevation

4 px base scale: `0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`.

| Token | Value | Use |
|-------|-------|-----|
| `--space-gutter` | 16 px | Screen side gutter (mobile). 24 px ≥ 768 px |
| `--space-card` | 16 px | Card padding |
| `--space-section` | 24 px | Between sections |
| `--radius-sm` | 8 px | Chips, inputs |
| `--radius-md` | 12 px | Buttons, list rows |
| `--radius-lg` | 16 px | Cards, sheets |
| `--radius-full` | 999 px | FAB, avatars, pills |
| `--elev-0` | none | Flat on the page |
| `--elev-1` | `0 1px 2px rgba(0,0,0,.06)` + hairline | Cards |
| `--elev-2` | `0 4px 12px rgba(0,0,0,.10)` | Sheets, popovers |
| `--elev-3` | `0 8px 24px rgba(0,0,0,.14)` | Dialogs, FAB |

Dark mode reduces shadow and leans on `--surface-2` lightening plus the hairline border, because
shadows are nearly invisible on a dark page.

---

## 6. Touch targets & motion

| Context | Minimum |
|---------|---------|
| Any interactive element | 44 × 44 px |
| **Logger controls** (✓, +, −, set row) | **56 × 56 px** |
| Spacing between adjacent destructive and safe actions | ≥ 12 px |
| Swipe-to-delete | Always paired with an undo toast, never an immediate delete |

| Motion | Duration / curve |
|--------|------------------|
| Micro (button press, checkbox) | 100 ms, `ease-out` |
| Sheet / dialog entry | 220 ms, `cubic-bezier(.2,.8,.2,1)` |
| Route transition | 180 ms |
| Rest-timer tick | No animation — a discrete numeric update |
| PR celebration | 600 ms, **once**, dismissible, skipped entirely when Reduce Motion is on |

With Reduce Motion enabled, all of the above collapse to opacity changes at 0 ms except
the sheet, which becomes a 100 ms fade.

---

## 7. Component inventory

### 7.1 Primitives
`Button` (primary / secondary / ghost / destructive; sm / md / lg; loading; icon-only with a required
`accessibilityLabel`) · `IconButton` · `Input` · `NumericStepper` (unit-aware ± steps) · `Select` · `Combobox`
· `Switch` · `Checkbox` · `RadioGroup` · `SegmentedControl` · `Slider` (RPE/RIR) · `Chip` / `FilterChip`
· `Badge` · `Avatar` · `Tooltip` · `Popover` · `Sheet` · `Dialog` · `Toast` · `Tabs` · `Accordion`
· `ProgressRing` · `Meter` · `Skeleton` · `Divider`.

### 7.2 Domain components

| Component | Where | Notes |
|-----------|-------|-------|
| `SetRow` | E-03, F-03, F-04 | Set # · type · load · reps · RPE · ✓. Read-only and editable variants are **visually distinct** |
| `SetEntryPad` | E-03 | Large numeric controls, prefill, repeat-set, unit toggle |
| `PreviousPerformanceStrip` | E-03 | Last time's sets + per-set delta; skeleton / never-performed / failed states |
| `ExerciseCard` | E-02, C-05 | Name, muscle chips, target vs done, drag handle |
| `RestTimer` | E-04 | Countdown, ±15 s, skip, persists across navigation and backgrounding |
| `SessionSummaryStats` | E-08, F-03 | Duration · sets · volume · PRs, each with its unit |
| `PRBadge` | E-03, E-08, F-03, G-04 | Record type + value + icon. Never color-alone |
| `MacroBar` | H-01, H-02, B-01 | Stacked, direct-labelled, table-view toggle |
| `CalorieMeter` | H-01, B-01 | Consumed / target / remaining; over-target uses the diverging warm arm |
| `FoodItemRow` | H-02, H-08 | Name · portion · calories · **confirmed vs estimated styling** · source icon |
| `ConfidenceIndicator` | H-08 | Value + band + the sentence "detection confidence, not nutritional certainty" |
| `EstimateChip` | everywhere AI touches | The single, consistent marker of an unconfirmed value |
| `DateNavigator` | H-01, F-01, G-01 | ◀ date ▶ + picker + "Today" |
| `RangePicker` | G-*, H-14 | Week / Month / 3M / Custom, with the active range always stated in words |
| `MuscleChips` | D-01, D-02, C-05 | Primary filled, secondary outlined |
| `EmptyState` | everywhere | Icon + title + one sentence + one primary action |
| `SyncDot` | E-03, L-02 | pending / syncing / synced / failed, with an accessible label |
| `OfflineBanner` | global | Non-blocking, states what still works |

### 7.3 Card anatomy (dashboard)
Every dashboard card follows one structure so B-02 can reorder them freely:
```
┌────────────────────────────────────────────┐
│ TITLE                            [action ›]│  ← h3 + optional single action
│ ─────────────────────────────────────────  │
│  PRIMARY VALUE          secondary context  │  ← hero or stat tile
│  [ visualisation, optional ]               │
│  [ footer: range + unit statement ]        │  ← e.g. "last 7 days · kg"
└────────────────────────────────────────────┘
```
A card must render in all four states (loading / empty / error / content) and must never be taller
than 2× its collapsed height.

---

## 8. Iconography
Outline set, 24 px default, 1.75 px stroke, `currentColor`. 20 px in dense rows, 28 px in the tab bar.
An icon **never** conveys meaning alone in a status context — always icon + label.
Domain icons: dumbbell (training), apple (nutrition), chart (progress), scale (weight), camera (photo
analysis), sparkle (AI-derived), timer (rest), trophy (PR), cloud-off (offline).

The **sparkle** icon is reserved for AI-derived content and appears nowhere else. Seeing it must
always mean "a machine estimated this".

---

## 9. Accessibility — WCAG 2.2 AA `[ASSUMPTION]`

| Requirement | Rule |
|-------------|------|
| Contrast | Body text ≥ 4.5:1; large text and UI components ≥ 3:1. Verified per token pair in both themes |
| Color alone | Never the sole carrier of meaning — status, confidence, sync state, PRs and deltas all pair color with an icon, a label, or both |
| Focus | A visible 2 px ring with 2 px offset whenever focus is driven by an **external keyboard or Switch Control**. Touch has no focus ring, which is not a licence to leave the focused state undefined |
| Screen reader & keyboard | The **entire workout logger is operable with VoiceOver and TalkBack**: every control carries a role, a label and a state; swipe order matches visual order; committing a set never requires sighted targeting. Where a hardware keyboard is attached, Tab moves between fields, Enter commits a set and Esc closes a sheet |
| Targets | 44 px minimum (2.5.8), 56 px in the logger |
| Motion | Reduce Motion (`AccessibilityInfo.isReduceMotionEnabled`) respected everywhere, including the PR celebration |
| Announcements | `AccessibilityInfo.announceForAccessibility` announces: set committed, rest-timer completion, sync failures, AI completion. Ambient status on Android may use `accessibilityLiveRegion`. Charts expose a data-table alternative |
| Labels | Every icon-only button has an `accessibilityLabel`. Every input has a persistent visible label — placeholders are never labels |
| Errors | Programmatically associated with their field, announced, and phrased as a fix |
| Zoom | Usable at 200% without horizontal scroll; no fixed-height text containers |
| Orientation | Both orientations supported; nothing locks to portrait |
| Language | `lang` set; copy written at a plain-language reading level |

---

## 10. Content & voice

Plain, concrete, second person. No hype, no coach-speak, no moralising about food or missed workouts.

| Situation | Write | Don't write |
|-----------|-------|-------------|
| Over calorie target | "320 kcal over your target." | "You blew your budget!" |
| Missed workouts | "No sessions logged this week." | "You've been slacking." |
| AI estimate | "Estimated from your photo. Check it before saving." | "We found your meal!" |
| Low confidence | "Low confidence — please check this item." | "Probably chicken?" |
| Error | "Couldn't save that set. It's queued and will retry." | "Oops! Something went wrong." |
| Empty state | "Your completed sessions will appear here." | "Nothing to see here 👀" |

**Units are always written**, never implied. **Estimates always say "estimated"**. The app never makes
a health, medical or clinical recommendation.
