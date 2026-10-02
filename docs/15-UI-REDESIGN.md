# UI Redesign — "Kinetic Performance"
## Making the app guide by nature, and feel simple

**Status:** in progress on the `ui/redesign` branch, in its own worktree
(`../fitness_app-ui`), so the launch pipeline on `launch/g11-readiness` is untouched
until this is reviewed and merged. **Started:** 27 Sep 2026.

> The first UI pass (docs/05, docs/design) was rejected in review: it read as a
> wireframe — flat cards, tiny uppercase labels, grey ghost buttons everywhere,
> raw dates and enum slugs on screen, and nothing that told a new user what to do.
> This document records what was wrong, the direction that replaces it, and how
> far the rebuild has got. Where it disagrees with docs/05, **this document wins**;
> the accessibility rules in docs/05 §9 still stand and are still tested.

---

## 1 · What the review found

Taken from the store screenshots (`docs/store/screenshots/android/`) and the code.

| # | Where | Problem |
|---|-------|---------|
| 1 | Home | Four stacked cards, each ending in a small grey button. Nothing says what to do next. A brand-new account saw three "nothing yet" cards instead of the checklist the wireframe specified. |
| 2 | Logger (E-03) | The one button that matters — **Save set** — sat below the timer, the previous-performance strip and the set list; on a phone it was off screen. "Notes" and "Discard" were tiny text links; "1 of 3 · 1 set" was cryptic. |
| 3 | Everywhere | Raw data on screen: `2026-09-20` as a hero figure, `2026-09-26 · 07:05` on every weigh-in, `fat loss` / `active` from `replace('_', ' ')`, `epley_v1`, "Found by: exercises with chest as a primary muscle". |
| 4 | Diary | The inverted hierarchy: "774 LEFT" as a micro label beside a huge "67%". No way to add to a meal from the meal. Six management rows on a daily screen. |
| 5 | Quick actions | The FAB opened a full page titled "What now" with a column of plain buttons. |
| 6 | Empty states | Text only, centred, with a small ghost button — they did not invite. Loading was the word "Loading…". |
| 7 | Visual | Light theme in the screenshots, Iris violet, condensed numerals, pill shapes and glows: the look the owner did not want. |

## 2 · The direction

The reference is the owner's Stitch project *Polished App UI Design* and its design
system **Kinetic Performance**: dark OLED canvas, tonal layering, one blue accent,
Hanken Grotesk for headlines and figures, Inter for everything else, tight corners,
no glows, no pills. Adapted here so every text tone still meets 4.5:1
(`src/theme/__tests__/contrast.test.ts` is the arbiter).

### Principles

1. **One primary action per screen, in the thumb zone.** A sticky footer holds it: *Save set 3*, *Add food*, *Log a weigh-in*.
2. **Home says what to do next.** An "up next" line (`nextUp`) decided in a fixed order — open workout → first run → unchecked estimates → training → a meal → a weigh-in → done — and a checklist instead of empty cards on a new account.
3. **Cards carry their own label.** The uppercase eyebrow lives *inside* the card ("TODAY'S WORKOUT"), with the fact or control that belongs with it opposite. No floating labels.
4. **Words, not data.** "Today", "Yesterday", "Sun 20 Sep"; "Fat loss", "Reached"; "Estimated with the Epley formula". A slug or an ISO date on screen is a bug.
5. **Empty is an invitation.** Icon + title + one sentence + one button, always. Loading is a shape (`SkeletonCard`), never a spinner or a word.
6. **Icons lead rows.** Every navigation row and menu choice starts with an icon in a square so the list scans by shape.
7. **Everything docs/05 §9 says about accessibility still holds**: one stop per figure, labels on every control, no meaning by colour alone, 44 px targets and 56 px in the logger.

### Tokens (`apps/mobile/src/theme/tokens.ts`)

| Token | Dark | Light | Note |
|---|---|---|---|
| page / surface / surface2 | `#0E0F11` / `#16181C` / `#1E2025` | `#F4F5F3` / `#FFFFFF` / `#EFEFF0` | canvas → card → panel |
| ink / ink2 / ink3 | `#FFFFFF` / `#C4C6C1` / `#8E918F` | `#0B0C0D` / `#4B4D48` / `#696B65` | all ≥ 4.5:1 on every surface |
| line / line2 | `#272A30` / `#3F4248` | `#E2E4E6` / `#C9CCD0` | hairlines, solid not translucent |
| accent / accentInk | `#6BA5FF` / `#0B1A33` | `#2368C0` / `#FFFFFF` | one blue cannot carry white text *and* read as text on dark, so dark uses a lighter blue with navy ink |
| s1 / s2 / s3 | `#3987E5` / `#FF8A65` / `#34D399` | unchanged | protein · carbs · fat — on bars and dots only, never on text |
| status | unchanged | unchanged | pinned by test; text uses the `*Ink` shades |

Type: Hanken Grotesk 800 for figures (`record 44 · hero 40 · entry 34 · display 32 · stat 24`), 700 for `h1 26 · h2 22`, 600 for `title 17`; Inter for `body 15 · caption 13 · label 11` (label = uppercase eyebrow, +0.7 tracking). Radius: `tag 6 · row 10 · btn 12 · card 16`. Fonts load in `app/_layout.tsx`.

### Primitives (`apps/mobile/src/ui/`)

| Component | What it is |
|---|---|
| `Text` | `variant`, `tone`, and now `weight` (Inter regular/medium/semi/bold) |
| `Card` | `label` (eyebrow inside), `labelTone`, `right`, `hero`, `accent`, `nested` (panel), `pad` |
| `Button` | `primary · secondary · ghost · danger`, `sm 44 · md 52 · lg 56`, optional `icon` |
| `Pill` | tag-shaped, `mute · accent · good · warn · serious`, optional icon |
| `IconTile` | an icon in a bordered square; decorative |
| `EmptyState` | icon + title + one sentence + one action (+ secondary); `compact` inside a card |
| `Skeleton` / `SkeletonCard` | the loading shape; one "Loading" stop |
| `StickyFooter` | the thumb-zone footer; aware of the tab bar's inset |
| `SectionHeader` | uppercase eyebrow above a group, with a "See all" link |
| `MenuList` | big obvious choices (quick actions, add-food chooser) |
| `Checklist` | the first-run guide |
| `NavRow` / `NavGroup` | icon square + label + hint + fact + chevron |
| `ScreenScaffold` | now takes `eyebrow`, `headerRight`, `footer` |
| `DataBoundary` | renders `EmptyState` and `SkeletonCard`; `empty.icon` |

Helpers: `lib/datetime/humanDate` ("Today" / "Sun 20 Sep"), `features/dashboard/nextUp`,
`features/body/goalLabels`, `features/nutrition/MacroTrio`, `features/nutrition/MealSection`.

## 3 · Screens

| Screen | State | What changed |
|---|---|---|
| B-01 Home | **done** | Up-next line; first-run checklist; training / nutrition / weight cards with the eyebrow, one figure, one button each; macro trio; goals in words |
| B-03 Quick actions | **done** | Big icon rows; the suggested one (resume / start) marked; Photograph a meal added |
| H-01 Diary | **done** | "1,620 kcal left" leads; eaten-of-target beside it; macro trio; a dashed "check N estimated items" banner with *Review*; each meal a section with its own "+"; items with a macro-hue bar; *Add food* pinned in the footer; management under *More* |
| E-03 Logger | **done** | Eyebrow header with icon buttons; rest timer as a sticky bar; exercise card; set table with sync glyphs; step-sized ± controls; **Save set N pinned in the footer** |
| C-01 Train hub, E-01 Start, I-01 Progress | **done** | Hero card with one primary action; rows with hints; empty states with icons |
| H-03 Add food | **done** | Search field, then the four ways in as big rows (describe, photograph, quick add, new food) above the catalog |
| F-05 Previous occurrence | **done** | "Sun 20 Sep" as the headline, "6 days ago" as the eyebrow; "Picked because it trained chest as a primary muscle." |
| I-03 Weight trend | **done** | Segmented range; human dates; counted / also logged tags; delete as an icon; *Log a weigh-in* pinned |
| G-03 Progression | **done** | Card with the exercise as its label; the formula explained in words |
| Tab bar | **done** | Square accent FAB, 11 px labels |
| Everything else | not started | Inherits the tokens, fonts, `Card`, `Button`, `EmptyState` and skeletons automatically; layout unchanged |

### Next (in order)

1. H-08 *Check this before saving*: one figure per item, details folded; confidence as words.
2. A-02 Welcome and the auth screens (after the Supabase auth work on `launch/g11-readiness` lands — those files are modified there).
3. K-01 Settings grouped into Account / Preferences / Data / Support (same reason).
4. E-08 Finish summary, F-01 History rows with muscle tags, D-02 Exercise detail.
5. H-01 date navigation (needs the hook to take a date).

## 4 · How to review and merge

**Screenshots first:** open `docs/preview/ui-redesign/index.html` — every redesigned screen
captured from the real app on the emulator (27 Sep), with before/after pairs for the logger
and the diary.

```bash
cd ../fitness_app-ui                 # the worktree, branch ui/redesign
pnpm install
cd apps/mobile && npx jest           # the client suite
npx tsc --noEmit
pnpm start                           # then open it on the emulator / phone
```

Merging: the branch touches `app/_layout.tsx` (font imports only) and
`apps/mobile/package.json` (font packages only), both of which the Supabase auth work
on `launch/g11-readiness` also modifies — two small, obvious conflicts. Nothing else
overlaps. Merge `launch/g11-readiness` first, then this branch.

Tests changed on this branch, and why: three assertions pinned the *old* presentation
(the ISO date on the weight card, "1,620 left" as one string, the ISO date on a
weigh-in row); each now asserts the same fact in its new form, with a comment.
