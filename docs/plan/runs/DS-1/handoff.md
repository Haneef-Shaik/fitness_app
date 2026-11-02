# Handoff — DS-1 · Colour tokens and theme        attempt 1 + focus correction (review 2026-10-27T1605Z) + revision (review 2026-10-31) + records correction (review 2026-11-01) + guard-wiring prerequisite (2026-11-01) · codex/fitlog-ds1-theme · base c8a5d57 (uncommitted)

> **Guard-wiring prerequisite, 1 Nov 2026 (AUTH-01; source and tests only, UNRUN).**
> - **What changed.**
>   - The 26 literal SVG fills in `src/ui/momentum-assets.ts` are `currentColor`, with a typed,
>     exhaustive role map beside them.
>   - `MomentumAsset` draws `tint ?? theme.colors[role]`.
>   - The L2 bypasses are closed in `no-literal-color.cjs`: `tint` props; Reanimated colour arguments
>     through import bindings; aliased, namespace and computed `PlatformColor`/`DynamicColorIOS`.
>   - `colorGuardConfig()` is wired into `eslint.config.js`, and `test-design-rules.cjs` asserts the
>     guard's rule id.
>   - **No exemption** was added, and nothing waits for DS-4.
> - **Authored, UNRUN:** `color-guard.test.ts` 101 (52 + 49) and `momentum-asset.test.tsx` 145 (new).
> - **Status:** 0 of 3 boxes. Box 2 stays open until the wired guard is seen to fail (G1). Box 1 runtime
>   and box 3 stay open.
> - **Superseded statements below:**
>   - the box-2 row's "built, not wired" and "26 literal SVG fills";
>   - "No … `eslint.config.js` … is changed" and "the SVG assets, the guard, `eslint.config.js` … are all
>     untouched";
>   - L2 "Not addressed here";
>   - Guard sequencing's open prerequisite;
>   - the DS-4 `momentum-assets.ts` note in Found for other goals;
>   - Requests item 1.
>
>   They are kept as history.
> - **Details:** "Guard-wiring prerequisite (1 Nov 2026)" at the end of this file, and
>   [guard-wiring-2026-11-01.md](../../../evidence/DS-1/guard-wiring-2026-11-01.md).

> **Records correction, 1 Nov 2026, after the independent review of 1 Nov.**
> - **What that review found:** C0, H0, M1 and L1. It closed H1 and the 31 Oct high finding **in source
>   only**. Every runtime gate and mutation is UNRUN, and 0 of 3 Done-when boxes are met.
>   - **M1:** the records treated "a device gives focus to a disabled button" as read in the React Native
>     source. Only the JS layer was read: Pressable keeps `focusable`, and Pressability forwards focus and
>     blur. On Android, `View.js:94-99` forwards `disabled`, and `BaseViewManager.java:387-389` calls
>     `setEnabled(false)`.
>   - **L1:** "never show the pressed border" is wrong for a quick tap.
> - **What changed: comments and records only.**
>   - Device focus on a disabled or loading button is now recorded as **unverified**. The tests model
>     *reported* focus defensively, and their logic is unchanged.
>   - The inference that Android would move focus mid-save, or necessarily keeps focus, is withdrawn.
>   - L1 is reworded: a quick tap can keep the pressed border briefly after loading starts, until the
>     deferred press-out, which the source bounds at 130 ms or less.
>   - `THEMING.md:82-84` and the known-gap section of `contrast-matrix.md` are corrected. Curated violet
>     is decoration only, not accessibility evidence.
>   - Ring logic, props, tests, assertions, palette and contracts are unchanged.
> - **Status: UNRUN.** Nothing was executed, and every Done box stays open.
> - **Details:** "The revision's records, corrected" in
>   [focus-correction-2026-10-27T1605Z.md](../../../evidence/DS-1/focus-correction-2026-10-27T1605Z.md).
>   [review-2026-11-01-collected.md](../../../evidence/DS-1/review-2026-11-01-collected.md) and
>   `final-2026-11-01-collected.md` are kept verbatim.

> **Revision, 1 Nov 2026, after the independent review of 31 Oct.**
> - **What that review found.**
>   - **Finding 1 (high):** the first correction's `focused && !unavailable` hid the ring on disabled
>     and loading buttons whenever React Native reported focus there. The source before the correction
>     had shown a ring there, so this was a regression. (The review and this handoff said such buttons
>     still hold focus. On a device that is unverified, per the 1 Nov review's M1.)
>   - **Finding 2 (medium):** the records said 21 cases caught H1. Only 4 do. The planned F2 would have
>     counted the fix for finding 1 as a failed guard.
> - **What exists now: source and records only.**
>   - Focus is drawn in the label colour whenever React Native reports focus, including `onSurfaceVariant`
>     on `surfaceHigh` while the button is disabled or loading.
>   - The unavailable tests are rewritten, and two matrix rows are added.
>   - The 21 and old F2 claims are withdrawn. The predictions are recounted, the ring-against-surface
>     range is recorded with attribution, and the light-lime count is corrected to 9.
> - **Status: UNRUN.** Nothing was executed. Every Done box stays open; runtime, guard wiring and the
>   release capture are pending.
> - **Details:** [focus-correction-2026-10-27T1605Z.md](../../../evidence/DS-1/focus-correction-2026-10-27T1605Z.md)
>   and [review-2026-10-31-collected.md](../../../evidence/DS-1/review-2026-10-31-collected.md), which is kept
>   unchanged.

> **Correction, 27 Oct 2026, after the independent review at 16:05Z.**
> - **What was overstated.** This handoff said box 1 was met and that every action pair was pinned. It
>   was not:
>   - the matrix had no focus-ring rows;
>   - a focused primary AppButton in Dark showed no visible change, at 1.00:1 (H1);
>   - the coach-outline comment counted violet ink as an identifier (M1).
> - **What exists now: a source-only correction.** It covers the AppButton ring, new behavioural tests,
>   new matrix rows and the M1 comment.
> - **Status: UNRUN.** Nothing was executed in that phase: no tests, type check, lint or mutation.
>   **Box 1 is not met.** The corrections are pending a fresh independent review **and** runtime plus
>   mutation proof. No PASS, RED, GREEN or Done is claimed or inferred.
> - **Details:** [focus-correction-2026-10-27T1605Z.md](../../../evidence/DS-1/focus-correction-2026-10-27T1605Z.md).
> - **Inherited results.** Anything marked *inherited* below comes from the attempt-1 run of
>   2026-10-27 (final report `final-2026-10-27T0505Z.md`). It predates the correction and was not
>   re-run.

**Outcome claimed.**
- **Roles.** Every Momentum colour now comes from 31 semantic roles in both schemes.
- **Regeneration (inherited).** The palette regenerates from seed `#C6F432` by script with no diff, and
  seed or library drift fails the build.
- **Contrast tests (inherited).** In both themes they pin:
  - the text, accent, data, error and coach inks, and the outline, on all five surfaces;
  - each label on its own container;
  - the light-lime-as-container rule.
- **What they did not cover.** Before the correction the matrix had no focus-ring pair, so it is not a
  claim about every action pair. It also tests the light coach outline only against its own card (M1).
- **Focus correction and revision (UNRUN).** They add focus-ring rows and a component test of the ring
  as actually drawn, whenever focus is reported, including while disabled or loading. Whether a device
  focuses a disabled or loading button is unverified.
- **Colour guard.** A stronger literal-colour guard is built, with mutation results inherited. Its
  wiring into the shared ESLint config is DS-1's own remaining work (see Requests).
- **Box 3.** The Android release capture is **not done**.

**State of the branch.** Nothing is committed: the coordinator forbade commits in this phase, so the
diff is the working tree of `codex/fitlog-ds1-theme` on base `c8a5d57`. No `package.json`, lockfile,
`eslint.config.js`, status, activity, ACCEPTANCE or EXECUTION file is changed. Dependencies came from
`pnpm install --frozen-lockfile` only.

**Files the focus-correction and revision phases changed** (on top of the attempt-1 working tree):
- `apps/mobile/src/ui/AppButton.tsx`: modified. The ring colour changed. The first correction's
  unavailable gate was removed in the revision;
- `apps/mobile/src/ui/__tests__/app-button-focus.test.tsx`: new. The unavailable groups were rewritten
  in the revision;
- `apps/mobile/src/theme/__tests__/contrast.test.ts`: focus-ring rows (the unavailable pair added in the
  revision) and the M1 comment;
- `docs/evidence/DS-1/focus-correction-2026-10-27T1605Z.md`: new, rewritten in the revision;
- `docs/evidence/DS-1/contrast-matrix.md`: revision only. The count line and the focus-ring rows;
- this handoff;
- `docs/plan/runs/DS-1/checkpoint.md`.

**The records correction (1 Nov 2026, after the review of that date) changed only:**
- comments in `apps/mobile/src/ui/AppButton.tsx`, `apps/mobile/src/ui/__tests__/app-button-focus.test.tsx`
  and `apps/mobile/src/theme/__tests__/contrast.test.ts`. No code, assertion or test title changed;
- `docs/THEMING.md`, the contrast-matrix paragraph that was at lines 82-84;
- `docs/evidence/DS-1/focus-correction-2026-10-27T1605Z.md` and `docs/evidence/DS-1/contrast-matrix.md`;
- this handoff and the checkpoint.

`docs/evidence/DS-1/review-2026-10-27T1605Z-collected.md`, `review-2026-10-31-collected.md` and
`review-2026-11-01-collected.md` were written by the coordinator, not by these phases, and are unchanged.
So are the historical `final-*` reports, including `final-2026-11-01-collected.md`. No other path changed: `appearance.test.tsx`, the palette, the tokens, the SVG
assets, the guard, `eslint.config.js` and GOALS are all untouched.

## Done when

| Box | Met | Evidence |
|---|---|---|
| The palette regenerates from seed `#C6F432` by script with no diff, and contrast tests pin every text, action, error, coach and gym pair in both themes, including the light-lime-as-container rule | **no, not met yet.** The source corrections are pending a fresh independent review **and** runtime and mutation proof. (Attempt 1 said "yes"; the 1605Z review found that overstated.) | **Inherited (attempt 1, 2026-10-27, not re-run):** `cd apps/mobile && pnpm theme:generate` → `momentum.json matches its recipe: seed #C6F432, Material vibrant 2025, 33 recorded curations, no diff.` `--write` is byte-identical (SHA-1 `1275a7d2…` before and after). `src/theme/__tests__/palette-generator.test.ts` (6 tests) runs the real CLI with the real Material library: no diff; all 33 pins fail for seed `#FF5A1F`; a hand edit fails naming `dark.coachInk`; formatting drift fails. `contrast.test.ts` had 139 cases covering both schemes × (5 surfaces × 10 inks/strokes, plus 10 container pairs). It asserts every non-decorative role is pinned and every family is present in both schemes, and has 9 light-lime cases (5 + 1 + 1 + 2; this record said 8 before, a miscount from attempt 1 that the 31 Oct review found). `jest src/theme` → 6 suites, 258 passed. **Gaps the 1605Z review found:** H1, no focus-ring row, and Dark primary focus at 1.00:1; M1, the coach-outline comment counted violet ink as an identifier. **Corrected in source, UNRUN (authored, none executed):** the AppButton ring now uses the label colour on the fill it is drawn on, whenever React Native reports focus. If focus is reported while the button is disabled or loading, that is `onSurfaceVariant` on `surfaceHigh` (whether a device focuses it then is unverified, per the 1 Nov review's M1). The first correction's hiding of focus there (31 Oct review, finding 1) is removed. **Wording corrected in records (1 Nov):** `THEMING.md:82-84` no longer claims "every … pair", and the known-gap section of `contrast-matrix.md` records violet as decoration only. `contrast.test.ts` has 6 focus-ring rows, 145 cases authored. The new `src/ui/__tests__/app-button-focus.test.tsx` has 29 cases. The M1 comment is reworded. One pinned known gap remains, light coachOutline 2.70:1 (Codex decision below). H1 is **not** pinned as a gap. [palette-regeneration.md](../../../evidence/DS-1/palette-regeneration.md), [contrast-matrix.md](../../../evidence/DS-1/contrast-matrix.md) (inherited ratios; its count line and focus-ring rows were added in the revision, UNRUN), [focus-correction-2026-10-27T1605Z.md](../../../evidence/DS-1/focus-correction-2026-10-27T1605Z.md) |
| The lint guard rejects a literal colour outside theme files (seen to fail) | **partly** | **Wired today:** the `eslint.config.js` selector rejects `color: "#ffffff"` in `src/ui`. Seen to fail in mutation W: `AssertionError … actual: 2, expected: 3` from `pnpm lint`'s fixture. **Built, not wired (by instruction):** `scripts/lint-rules/no-literal-color.cjs` closes the selector's holes: template literals, named colours, hex inside SVG/shadow strings, numeric colours, `PlatformColor`/`DynamicColorIOS`. It also narrows the exemption from `src/theme/**` to `src/theme/themes/**`. `color-guard.test.ts`: 52 passed; mutations A, B and C each fail named tests (inherited, attempt-1 run of 2026-10-27; not re-run). Full credit needs the wiring request below. That first needs `src/ui/momentum-assets.ts` (26 literal SVG fills) resolved by DS-1 before DS-4 starts, not by waiting for DS-4 (see Guard sequencing). Untouched in the correction phase. [mutation-checks.md](../../../evidence/DS-1/mutation-checks.md) |
| Today in both themes on an Android release build sits beside Figma page 02 in `docs/evidence/DS-1/` | **no — blocked** | No release build, device or emulator in this phase, and device builds were excluded. Reproducible steps: [release-capture.md](../../../evidence/DS-1/release-capture.md). No JS export or web preview is offered as a substitute. |

The outcome's "system/light/dark preference" is existing QA-1 work, adopted after verification (see
Inherited).

## Acceptance evidence

`status.mjs show DS-1` lists no acceptance-ledger rows for DS-1. No ledger row was written.

## Gates

**Not run after the focus correction or its revision (UNRUN; required in the next authorized runtime
phase).** Both phases were limited to Read, Grep, Edit and Write. These were authored but never executed:

| What | Authored | Result |
|---|---|---|
| `src/ui/__tests__/app-button-focus.test.tsx` | 29 cases: focus and blur × both themes × both variants against the drawn fill; the large action; then three groups of 8 for disabled and loading, rewritten in the revision. The groups cover focus landing while unavailable; focus persisting from available to unavailable and back, then blur; and blur while unavailable. Every focused state is checked at ≥ 3:1 against the drawn fill, with the box unchanged. | **UNRUN** |
| `src/theme/__tests__/contrast.test.ts` | 6 focus-ring rows (the unavailable pair added in the revision), 145 authored; M1 comment reworded | **UNRUN** |
| Mobile `tsc`, `pnpm lint`, `jest src/theme src/ui`, root `pnpm check` | none | **UNRUN** |
| Mutations F1 to F3 (focus-correction evidence) | Planned, with predicted counts. **F1** (source before either correction): 29 fail, of which 4 detect H1's 1:1 ring and 25 only the exact-colour policy. **F2** (reintroduce the unavailable gate): 24 fail at ≥ 3:1 with a received ratio of 1. **F3** (border width only while focused): 29 fail. | **UNRUN**. Predictions, reasoned and not observed. |

**Inherited from the attempt-1 run (2026-10-27, final report 0505Z), before the correction; not re-run.**
All from `apps/mobile`, Node 22.23.1, after `pnpm install --frozen-lockfile` at the root.

| Gate | Command | Result |
|---|---|---|
| Types (mobile) | `pnpm exec tsc --noEmit` | clean, no output |
| Lint + design fixture (mobile) | `pnpm lint` | `Design rules verified: raw visual values fail; semantic tokens pass.`, 0 warnings |
| Theme + UI tests | `pnpm exec jest --runInBand src/theme src/ui` | `Test Suites: 7 passed`, `Tests: 261 passed` (before the focus suite and rows existed) |
| Palette regeneration | `pnpm theme:generate` | `… 33 recorded curations, no diff.` |
| Root `pnpm check` (adds domain, planner, plan build) | **not run** | Coordinator asked for focused runs only in this parallel phase; domain, planner and plan files are untouched. Required at integration. |
| Native JS export (`expo export --platform ios --platform android`) | **not run** | Excluded in this phase; required at integration because `apps/mobile/` changed. Runtime app imports changed only through `momentum.json` (4 added keys) and `types.ts`. |

## Inherited and used

| From | Claim | Held? |
|---|---|---|
| QA-1 | `momentum.json`, `theme.ts`, `ThemeProvider`, preference store and their tests give a typed palette with a system/light/dark preference | yes (inherited, attempt-1 run of 2026-10-27; not re-run): `theme.test.ts` (6) and `preference-store.test.ts` (9) passed unchanged. They cover system-follow with a light fallback, explicit overrides, hydration races, write ordering and storage failure. |
| QA-1 | "The installed color-utilities version produces different values even for the original seed" (THEMING) | yes, measured: the best Material setting matches 3 of 36 values. That is why curations exist. |
| docs/22 §4 | Token values for `data/goldContainer`, `onGoldContainer`, `streakContainer`, `coach/onContainer` | used verbatim for the four added roles |
| docs/22 §4 | "every on-container pair ≥ 6.0:1" | **no**: the error pairs measure 4.53 (dark) and 4.54 (light). They still pass 4.5. Reported for QA-2. |

## Mutation checks

**Inherited (attempt 1, 2026-10-27; not re-run).** None of these covers the focus correction. Its
mutations F1 to F3 are planned and UNRUN (see Gates). F2 was rewritten in the revision so that it
reintroduces the unavailable gate. The earlier plan, "drop the gate, expect 16", is withdrawn. Details in
[mutation-checks.md](../../../evidence/DS-1/mutation-checks.md). Each was restored, and
restoration was confirmed (empty `git diff` on `eslint.config.js`, palette SHA-1 back to `1275a7d…`, no
markers left).

- W, wired selector → `#MUTATED` regex → `AssertionError … actual: 2, expected: 3`.
- A, hex detection removed → 17 failed, for example `✕ rejects a hex inside inline SVG markup`.
- B, exemption widened to `src/theme/**` → `✕ covers src/theme/theme.ts`,
  `✕ exempts only the palette definitions and tests`.
- C, named colours disabled → 7 failed, for example `✕ rejects a named colour on an SVG paint`.
- D, stale-pin check disabled → `✕ fails every curation when the seed moves…` (pure) and
  `✕ fails every pin when the seed changes…` (real library).
- E, light `dataTrain` set to lime `#CAFD00` → 14 failed, for example
  `✕ light · data · dataTrain on surface ≥ 4.5:1`, `✕ is not reused by any ink or stroke role`, and
  `✕ regenerates the committed palette from seed #C6F432 with no diff`.

## Review findings left open

### Independent review 2026-10-27T1605Z: dispositions

Source: [review-2026-10-27T1605Z-collected.md](../../../evidence/DS-1/review-2026-10-27T1605Z-collected.md).
It found 0 critical, 1 high, 2 medium and 6 low.

| Finding | Disposition | Owner |
|---|---|---|
| **H1** · Dark primary AppButton focus 1.00:1, no focus-ring row | **Corrected in source, UNRUN; not accepted yet.** The ring is drawn in the label colour on the fill it is drawn on, whenever React Native reports focus. The first correction hid it on disabled and loading buttons; the 31 Oct review (finding 1) rejected that, and the revision removed it. There are 29 UI cases and 6 matrix rows. It is **not** pinned as a known gap. Pending a fresh independent review and runtime and mutation proof. | DS-1 (assigned by the coordinator as the shared AppButton prerequisite for DS-4) |
| **M1** · The coach-outline comment counted violet ink as an identifier, and nothing requires a visible label | The comment is reworded (UNRUN; comment only), and the 31 Oct review accepted DS-1's part in source. The Codex decision is recorded under Decisions. The coordinator states that main's GOALS.md already carries DS-4's visible-label, interactivity and state contract. This worktree's GOALS.md is an older, stale copy, so it is neither edited nor cited as missing a line. Optional rows against the other surfaces were not added. | DS-1 comment (done in source); DS-4 card, label and tests |
| **M2** · In Light, lime is the only cue for selected and logged states | Not addressed in this phase, by instruction. | **DS-4** (Choice selected state); **SC-3** (Today week strip, logged day) |
| **L1** · docs/22 §1 and §4 overstatements, wider than "≥ 6.0" | Not addressed here. The scope is widened in Found for other goals. | **QA-2** |
| **L2** · Named-colour bypasses in the unwired guard (`tint`, colour helpers, aliased `PlatformColor`) | Not addressed here; it belongs with guard wiring. | **DS-1** (guard wiring) |
| **L3** · `@typescript-eslint/parser` is not declared by `apps/mobile` | Not addressed here. | **QA-9** |
| **L4** · `scheme-search.mjs` silent `catch`, and "no Material setting" wording | Later. | **DS-1** (evidence wording, later phase) |
| **L5** · `--write` does not name the seed roles it changed | Deferred, optional. | DS-1 (optional) |
| **L6** · The family-coverage test cannot fail except by editing its own arrays | Deferred, optional. It is not counted as evidence. | DS-1 (optional) |

### Independent review 2026-10-31: dispositions

Source: [review-2026-10-31-collected.md](../../../evidence/DS-1/review-2026-10-31-collected.md), kept
unchanged. It was a source-only review. It found 1 high, 1 medium and 2 low, and accepted no Done box.

| Finding | Disposition | Owner |
|---|---|---|
| **1 · High** · Focus disappears on buttons that are disabled or loading but still focusable | **Corrected in source, UNRUN.** `borderColor: focused ? foreground : pressed ? colors.primary : background`. While unavailable that is `onSurfaceVariant` on `surfaceHigh`: 7.12 Dark, 5.04 Light (inherited matrix values). Focus is not moved, and the palette, props, action blocking, layout and pressed-only border are unchanged. The 24 unavailable cases are rewritten to require a visible ring at ≥ 3:1 on the drawn fill, through availability changes, with blur removing it and the box unchanged. Two matrix rows are added. **Premise narrowed (1 Nov review, M1):** "still focusable" holds in RN's JS layer only. RN Android disables the native view, so device focus while unavailable is unverified, and the 24 cases model *reported* focus. | DS-1 |
| **2 · Medium** · The evidence overstated H1 detection, and F2 tested the wrong thing | **Records corrected.** The 21 claim and the old F2 are withdrawn from the focus evidence, the checkpoint and this handoff. The new predictions, all UNRUN: F1 29, of which 4 detect H1's 1:1 ring and 25 only the exact-colour policy; F2, which reintroduces the gate, 24; F3 29. | DS-1 |
| **3 · Low** · The ring against the surface was "about 2:1" | **Range recorded**, hand-calculated and approximate, not executed. The Dark primary ring `#495E00` measures about 2.25 on `surfaceHigh` and 2.64 on `surface` (reviewer), and about 2.10 on `surfaceHighest` (this phase). The reviewer judged that it does not block SC 2.4.7. | DS-1 |
| **4 · Low** · The handoff said 8 light-lime cases | **Corrected to 9** (5 + 1 + 1 + 2). | DS-1 |
| Still open per the review | Runtime gates and mutations; box 1; guard wiring (box 2); the release capture (box 3); `THEMING.md:82-84`. `contrast-matrix.md:8` is resolved in the revision. `THEMING.md:82-84` was corrected in records on 1 Nov (see below). | DS-1 |

### Independent review 2026-11-01: dispositions

Source: [review-2026-11-01-collected.md](../../../evidence/DS-1/review-2026-11-01-collected.md), kept
unchanged. It was a source-only review, with verdict **fail**: 0 of 3 boxes. It found C0, H0, M1 and L1.
It closed H1 (27 Oct) and the 31 Oct high finding in source only, with every runtime gate and mutation
UNRUN.

| Finding | Disposition | Owner |
|---|---|---|
| **M1 (medium)** · The records treat "a device gives focus to a disabled button" as read in the RN source, but RN Android disables the native view | **Records and comments corrected; logic unchanged.** The JS layer keeps the button focusable and forwards focus (`Pressable.js:258`, `Pressability.js:433-444`). On Android, `Pressable.js:235-236` merges `disabled` into `accessibilityState`, `View.js:94-99` forwards it, and `BaseViewManager.java:387-389` calls `setEnabled(false)`. Device focus on a disabled or loading button is now recorded as **unverified**. The tests model reported focus defensively, with their logic, titles and assertions unchanged. The inferences that Android would move focus mid-save, or necessarily keeps focus, are withdrawn. Corrected: the focus evidence; the comments in `AppButton.tsx`, `app-button-focus.test.tsx` and `contrast.test.ts`; `contrast-matrix.md`'s focus-ring section; this handoff (header, outcome, box 1, H1 row, finding-1 row, Decisions, Traps); and the checkpoint. `final-2026-11-01-collected.md:23` is a historical final and stays verbatim; this correction supersedes it. The longer comments move later lines by +3 in `AppButton.tsx` (ring expression :36 → :39) and the focus test (:130-187 → :133-190), and by +1 in `contrast.test.ts`. The mapping is in the focus evidence. | DS-1 |
| **L1 (low)** · "Unavailable buttons … never show the pressed border" is wrong for quick taps | **Reworded** in the focus evidence. A quick tap can keep `pressed` briefly after loading starts, until the deferred press-out: 130 ms or less according to the source (`Pressability.js:264`, `757`, `775-792`; `WorkoutScreen.tsx:29`, `:59`), not timed on a device. It predates the corrections, is not a focus defect, and nothing was changed. | DS-1 |
| Wording obligations (box 1) | **Done in records.** `THEMING.md:82-84` now names what the matrix measures and what it does not prove, instead of "every … pair". The known-gap section of `contrast-matrix.md` records the Codex decision: curated violet is decoration only and not accessibility evidence, under conditions (a) to (c), which are DS-4's. The attempt-1 sentence counting violet ink as an identifier is withdrawn. | DS-1 (wording); DS-4 (card contract) |
| Still open per the review | Runtime gates (`tsc`, `pnpm lint`, `jest src/theme src/ui`, `theme:generate`, root `pnpm check`); F1 to F3 (F1 built from `c8a5d57:apps/mobile/src/ui/AppButton.tsx`, or confirmed to match it); an independent review of the runtime results; box 2 (resolve `momentum-assets.ts`, wire `colorGuardConfig()` with the L2 bypasses, see it fail); box 3 (the Android release capture); the native export at integration. None was attempted in this phase. | DS-1 |

**Guard sequencing (no circular wait).** DS-4 needs DS-1, so a DS-1 prerequisite cannot wait for DS-4.
Both DS-1 items must be resolved inside DS-1's own sequencing **before DS-4 starts**:
- the AppButton focus correction (this phase, pending proof);
- the guard-wiring prerequisite: the 26 literal fills in `src/ui/momentum-assets.ts` need either a
  dated, owner-named exemption or a DS-1-authorized asset change.

Neither guard wiring nor the SVG assets were touched in this phase.

### Attempt-1 self-review (historical)

The coordinator ruled out nested sub-agents, so this was a self-review; an independent review followed
(above).

- Self code review: no critical or high findings. (The 1605Z review then found H1.)
- Self security review: the generator writes only the recipe and palette paths a local developer
  passes, with no network, secrets or user data. Privacy and health-data rules are unaffected.
- low · `apps/mobile/scripts/lint-rules/no-literal-color.cjs` · Named colours are flagged only in colour
  positions (colour-named keys, props, variables, assignments, defaults). A named colour passed through
  an unrelated helper argument, such as `tint('red')`, is not caught. This is deliberate, to avoid false
  positives on words like "gold" or "red" in non-colour strings.
- low · same file · A hex such as `#123` at the start of a string, or after a space, is treated as a
  colour. User-facing text goes through `t()`, so the false-positive risk is low. Today's `src/` has
  zero false positives (measured).
- low · `src/theme/__tests__/palette-generator.test.ts` · It spawns `node --import tsx` six times,
  about 1 s in total, because the ESM-only Material library cannot load in Jest.

## Left undone, and why

- **Box 1**: the focus correction and its revision are source only and UNRUN. The 1 Nov review closed
  them in source. They still need runtime and mutation proof (Gates), then an independent review of the
  runtime results.
  - Wording corrected in the 1 Nov records correction: `docs/THEMING.md:82-84` (no longer "every …
    pair") and `contrast-matrix.md`'s known-gap section (the Codex decision; violet is decoration only).
  - Still open as wording: the L4 evidence wording (later), and L5 and L6 (optional).

  `contrast-matrix.md:8` is resolved in the revision: 139 inherited, 145 authored, with the focus-ring
  rows. `final-2026-10-27T0505Z.md` is a historical report and stays as written.
- **Device focus on a disabled or loading AppButton**: unverified (1 Nov review, M1). Recorded and not
  scheduled. No Done-when box depends on it, and the ring is right whatever a device does.
- **Box 3**: no Android release build or device in this phase.
- **Guard wiring**: the coordinator's instruction is to hand off shared guard wiring; request below.
  It and its `momentum-assets.ts` prerequisite are DS-1 work to finish before DS-4 starts (see Guard
  sequencing).
- **Root `pnpm check` and native export**: the coordinator asked for focused runs; they are required
  at integration.
- **No commits**: by instruction. The checkpoint and handoff record the state.

## Found for other goals

- **DS-4 (component kit)**:
  - `src/ui/momentum-assets.ts` embeds dark-palette hex fills in 26 SVG strings. Icons without a
    `…Light` variant render dark-mode colours unless a `tint` is passed. All current consumers pass
    `tint` or have Light variants, so nothing renders wrong today, but it is latent. Suggested fix:
    map fills to semantic roles at render, or `currentColor` per layer.
    - **Sequencing correction:** wiring DS-1's guard must **not** wait for this fix, because DS-4 needs
      DS-1. DS-1 resolves the guard prerequisite first (see Guard sequencing). DS-4's later asset fix
      can then retire whatever exemption DS-1 adds.
  - **The AI proposal card** must meet the M1 conditions, because the light dashed coach outline is
    2.70:1 and may only decorate:
    - a visible text label naming it a proposal (not violet colour, and not only a screen-reader label);
    - if it can be acted on, a visible text control or a ≥3:1 boundary identifying it as interactive;
    - no state that depends on the outline.

    It needs tests for each. The coordinator states that main's GOALS.md already carries this
    contract for DS-4. This worktree's copy is stale and is not edited.
  - **M2:** in Light, a selected Choice differs from an unselected one only by lime fill, at about
    1.03:1 (review estimate). Add a check mark or a ≥3:1 outline.
  - **AppButton pressed-only feedback** on the Dark primary button is still lime on lime. It was kept
    unchanged by instruction and is not a focus indicator. Consider it when DS-4 covers component
    states.
  - The new roles (`dataGoldContainer`/`onDataGoldContainer` for win and record cards,
    `dataStreakContainer` for the freeze chip, `onCoachContainer` for coach-card body text) are ready
    for use.
- **QA-2 (docs)**: correct docs/22 §4's "every on-container pair ≥ 6.0:1". The measured minimum is
  4.53, for the error pairs. The 1605Z review (L1) widens this to docs/22 `:56` and `:192-195`:
  - "Secondary text ≥ 5.3" is false: light text is 4.80 on `surfaceHighest` and 5.04 on `surfaceHigh`.
  - "Accent 16.7:1 on Dark cards" is false: it is 14.64 on `surfaceContainer`.
  - "5.3:1 on Light cards" is false: it is 4.81 and 5.04.
  - "Every on-container pair ≥ 6.0" also fails for `onPrimary` on `primary` (5.34 dark, 5.88 light) and
    light `dataStreak` on its container (4.80).
  - §1's "generated with material-color-utilities from seed" now holds for 3 of 36 values.
- **SC-3 (Today)**: M2. On the week strip in Light, a logged day differs from an unlogged one only by
  lime fill, at about 1.02:1 (review estimate). Add a check mark or a ≥3:1 ring.
- **QA-9**: L3. `color-guard.test.ts` imports `@typescript-eslint/parser`, which `apps/mobile` does not
  declare. It resolves only through eslint-config-expo and hoisting. Declare it.
- **DS-2 / G14 (shared `no-restricted-syntax`)**: once the colour guard is wired, the colour selector in
  `no-restricted-syntax` is redundant and can be removed in the same change that touches that array.
- **Gym goals with per-gym branding**: `gymBrand`/`onGymBrand` are fixed defaults today. A gym-supplied
  brand colour will need its `on` colour chosen by contrast (`contrastRatio` in `src/theme/contrast.ts`).

## Requests for other lanes' files

1. **`apps/mobile/eslint.config.js`** (shared guard wiring, coordinator to assign).
   - **Prerequisite (DS-1, before DS-4 starts):** resolve `src/ui/momentum-assets.ts` inside DS-1's
     sequencing. Either add a dated, owner-recorded ignore for that one generated file, or make an
     asset change that DS-1 is authorized to make. Do not wait for DS-4, which needs DS-1. Otherwise
     lint fails with 26 reports. The L2 bypasses (`tint`, colour helpers, aliased `PlatformColor`)
     belong with this wiring.
   - Measured impact: `ESLint({ overrideConfig: [colorGuardConfig()] }).lintFiles(['src'])` →
     `src/ui/momentum-assets.ts: 26`, `TOTAL 26`.
   - Patch:
   ```diff
    const { defineConfig } = require('eslint/config');
    const expo = require('eslint-config-expo/flat');
   +const { colorGuardConfig } = require('./scripts/lint-rules/no-literal-color.cjs');

    module.exports = defineConfig([
      expo,
      …existing blocks unchanged…
   +  colorGuardConfig(),
    ]);
   ```
   - Optional, in `scripts/test-design-rules.cjs`: assert that the wired config also reports
     `fitlog-colors/no-literal-color` for ``color: `rgba(0,0,0,${a})` `` in `src/ui/guard-fixture.ts`.
2. No `package.json` change is needed. The regeneration check runs inside Jest (`test:ci`), so
   `pnpm check` already enforces it.

## Decisions forced (for the tracker decision log)

- **The approved palette is curated, and the generator records it.** No Material setting reproduces the
  Figma palette: 9 variants × 2 specs × 2 platforms × 5 contrast levels were searched, and the best
  matches 3 of 36 values. The recipe keeps docs/22's setting (Vibrant, 2025, phone, 0) and adds:
  - 33 curations, each recording the Material value it replaces;
  - 3 roles straight from the seed;
  - 9 aliases;
  - 4 brand values.

  "Regenerates from seed with no diff" therefore means: the script regenerates `momentum.json` from the
  seed plus recorded curations, byte-identical, and fails if the seed or the library moves. Routine
  engineering choice under the delegated authority.
  - **Codex decision (AUTH-01 delegated, 27 Oct 2026):** the approved palette and its 33 curated pins
    are **preserved**. No palette value, recipe or Figma file changed in the correction phase, and no
    Figma update is claimed.
- **Four docs/22 §4 roles added to `ThemeColors`**, with docs/22 values. Replacement themes must now
  supply 31 roles.
- **Light coach outline at 2.70:1** (`#9B7BFF` on `#EFEEE4`, below 3:1 non-text). It was open for Codex
  in attempt 1.
  - **Codex decision (AUTH-01 delegated, 27 Oct 2026):** keep the approved colour, which is option 1.
    The known-gap pin (measured 2.7, asserted `< 3`) is unchanged, and no threshold moved.
  - The border may only decorate. That holds only while every AI proposal:
    - (a) shows a visible text label naming it a proposal. Violet colour never identifies it, and a
      screen-reader label alone is not enough;
    - (b) if it can be acted on, is identifiable as interactive on its own, by a visible text control
      or by a boundary of at least 3:1;
    - (c) has no state (accepted, unsure, ticked) that depends on the outline.
  - `contrast.test.ts`'s comment now states (a) to (c) and no longer counts violet ink as an
    identifier (M1; UNRUN, comment only).
  - Since the 1 Nov records correction, the known-gap section of `contrast-matrix.md` and
    `docs/THEMING.md` say the same: the curated violet is decoration only and is not accessibility
    evidence.
  - The coordinator states that main's GOALS.md already carries the enforceable DS-4 contract (visible
    label, interactivity, no outline-dependent state). This worktree's GOALS.md is an older, stale copy
    and is not edited.
  - Option 2 (a `coachInk` border, with a Figma update) stays the fallback if DS-4 cannot guarantee
    (a) to (c). It is not adopted.
- **AppButton focus ring (H1).** The coordinator assigned this to DS-1 under AUTH-01, because it is a
  shared prerequisite for DS-4.
  - Whenever React Native reports focus, the button draws its existing 2 dp `focusRing` border in its
    own label colour:
    - `onPrimaryContainer` on `primaryContainer`;
    - `onSecondaryContainer` on `secondaryContainer`;
    - `onSurfaceVariant` on `surfaceHigh` while disabled or loading.

    The previous colour, `primary`, is the same lime as the primary fill in Dark.
  - **Revised after the 31 Oct review (finding 1).** The first correction hid the ring on unavailable
    buttons, and that is reversed. The ring follows reported focus and blur, with no availability gate.
    `focusable` is not set, and nothing moves focus.
  - **Basis corrected after the 1 Nov review (M1).**
    - This entry used to say that "a disabled or loading Pressable stays focusable, so it keeps a visible
      ring", and that taking these buttons out of the focus order "would make Android move focus away
      in the middle of a save". Both are withdrawn as unverified.
    - RN's JS layer keeps the button focusable and forwards focus. RN Android disables the native view
      (`BaseViewManager.java:387-389`), so whether a device gives or keeps focus on an unavailable button
      is unknown.
    - The decision stands on narrower ground. The ring is right whenever focus is reported, whatever a
      device does, and the change leaves focus handling as it was.
    - DS-4 should not inherit "Android keeps focus on a disabled button" or "Android moves focus
      mid-save" as facts.
  - The pressed-only border stays `primary`.
  - Palette, tokens, props, dimensions, layout and action blocking are unchanged.
  - H1 is fixed in source, **not** pinned as an accepted gap. Source only and UNRUN; see the
    focus-correction evidence.
- **Guard sequencing (no circular wait).** DS-1 resolves its guard-wiring prerequisite
  (`momentum-assets.ts`) and the H1 correction **before DS-4 starts**. Neither waits for DS-4, because
  DS-4 needs DS-1.

## Traps hit

- `@material/material-color-utilities` 0.4.0 has an extensionless ESM import. It loads under `tsx`
  only: plain `node` fails with `ERR_MODULE_NOT_FOUND …/dynamic_scheme`, and Jest cannot transform it.
  Hence the child-process end-to-end test.
- `@typescript-eslint/parser` must be imported as a namespace in Babel-transformed tests; a default
  import is `undefined`.
- Shell: bare and `rtk`-rewritten commands were denied in this session; `rtk proxy <cmd>` worked.
  Those denials stay parked; the correction phase did not retry any runtime.
- **Correction phase (27 Oct 2026; finished after a sleep interruption, 31 Oct 2026).** The only tools
  were Read, Grep, Edit and Write, and none was denied. Nothing was executed.
- **Revision phase (1 Nov 2026).** The only tools were again Read, Grep, Edit and Write, and none was
  denied. Nothing was executed, and no historical denied shell sequence was retried. One trap: hiding
  the ring on unavailable buttons looked like a tidy affordance rule, but React Native can still report
  focus there: a disabled Pressable keeps `focusable` in the JS layer, so the gate hid a reported focus.
  (This entry used to say the gate "hid focus that was still there". Whether a device keeps that focus
  is unverified; see the next entry and the 1 Nov review's M1.)
- **RNTL's `fireEvent` drops every event on a disabled Pressable**, because its responder refuses
  touches, but Pressability forwards focus and blur regardless. The focus test therefore calls the
  host's `onFocus`/`onBlur` directly for unavailable buttons. (This was read in the node_modules
  sources; it has not been run.)
  - **Corrected 1 Nov 2026 (M1).** That is the JS layer only. On Android, `disabled` reaches native
    through `accessibilityState` (`Pressable.js:235-236`, `View.js:94-99`), and
    `BaseViewManager.java:387-389` calls `setEnabled(false)`. The direct calls model a reported event.
    They do not show that a device delivers one.
- **Records-correction phase (1 Nov 2026, after the review of that date).** The only tools were Read,
  Grep, Edit and Write, and none was denied. Nothing was executed: no tests, type check, lint, mutation,
  install, network, DB, git or commit. Only comments and records changed. The instruction forbade
  sub-agents, so there was no code-reviewer, security-reviewer or tdd-guide pass. The self-check
  re-read the three code files and confirmed that only comment lines changed. Trap: a JS-layer reading
  ("focusable, forwards focus") was written up as device behaviour. The platform layer of the same tree
  says otherwise.
- **Guard-wiring phase (1 Nov 2026).** The only tools were Read, Grep, Edit and Write, and none was
  denied. Nothing was executed, and no historical denied sequence was retried. The instruction forbade
  sub-agents, so there was no code-reviewer, security-reviewer or tdd-guide pass; the coordinator
  supplies an independent review.
  - **Trap:** ESLint's `ESLint` class loads `eslint.config.js` with a native `import()`, which a Jest VM
    cannot run. The Jest test loads the config with `jest.requireActual` and lints with `Linter`.
  - **Trap:** in the effective-config test, `ruleFilter` is a runtime option of `Linter#verify` that the
    type omits. It goes in a non-literal options object, with no cast.

## Guard-wiring prerequisite (1 Nov 2026)

**Authority and scope.**
- AUTH-01 owner delegation, for one bounded checkpoint phase that closes DS-1's guard-wiring and
  26-SVG-fill prerequisite with no exemption and no DS-4 dependency cycle.
- `apps/mobile/eslint.config.js` and `scripts/test-design-rules.cjs` were assigned to this phase only.
  DS-2 is stopped, and there is no concurrent writer.
- Read first: [review-2026-10-27T1605Z-collected.md](../../../evidence/DS-1/review-2026-10-27T1605Z-collected.md)
  (L2) and [review-2026-11-01-collected.md](../../../evidence/DS-1/review-2026-11-01-collected.md)
  (box 2's obligations). Both are kept verbatim.

**Changed paths, this phase only:**
- `apps/mobile/scripts/lint-rules/no-literal-color.cjs`. Its exports and `.d.cts` are unchanged.
- `apps/mobile/eslint.config.js`
- `apps/mobile/scripts/test-design-rules.cjs`
- `apps/mobile/src/ui/momentum-assets.ts`
- `apps/mobile/src/ui/MomentumAsset.tsx`
- `apps/mobile/src/theme/__tests__/color-guard.test.ts`
- `apps/mobile/src/ui/__tests__/momentum-asset.test.tsx` (new)
- `docs/evidence/DS-1/guard-wiring-2026-11-01.md` (new)
- this handoff and the checkpoint

Nothing else changed: no screen, layout, palette, token, focus code, AppButton, `package.json`,
lockfile, raw export in `assets/momentum/`, GOALS, status, acceptance, contract or `.claude` file.

**What the source does now (UNRUN).**
- **Assets.**
  - All 26 bundled SVGs were inspected. Each is monochrome, with one non-`none` fill on its single
    path, so none was stopped.
  - Each such fill is now `currentColor`. Keys, order, geometry, `viewBox`, size, group and path ids,
    Cookie12's opacity and the root `fill="none"` are byte-for-byte unchanged. Grep finds 0 hex values
    in the file.
  - `momentumAssetRoles` maps every asset to a `ThemeColors` role
    (`as const satisfies Record<MomentumAssetName, ColorRole>`), using the instructed mapping by
    original fill: `ACABA4` → `onSurfaceVariant`, `CAFD00` → `primaryContainer`,
    `495E00` → `onPrimaryContainer`, `516700` → `onPrimary`, `414B24` → `secondaryContainer`,
    `CAD6A3` → `onSecondaryContainer`, `0E0F0A` → `surface`, `FBF9F1` → `onSurface`.
  - Each role's Dark value equals the original fill, so Dark looks the same. Light uses the same roles.
  - **Callsites:** Today's hero card confirms `onPrimaryContainer`. No callsite showed a more precise
    role, so none was changed.
  - The design's 7 unbundled `…Light.svg` exports all equal the same role's Light value.
- **MomentumAsset.**
  - It renders `color={tint ?? theme.colors[momentumAssetRoles[name]]}` with the XML unchanged, at
    `size ?? theme.dimensions.icon`.
  - The props `name`, `size` and `tint` are unchanged.
  - The render-time `.replace` and the dead `${name}Light` lookup are removed; no key ends in `Light`.
  - **Visible change (reasoned):** in Light, the untinted member tab icons now draw their Light roles,
    which match the design's Light exports, instead of Dark fills. Everything else, and all of Dark, is
    unchanged.
- **Guard.**
  - Colour props now include `tint` and `…Tint`.
  - `withTiming`/`withSpring` targets (strings only; numbers are animation targets) and
    `interpolateColor`'s output range (strings and numbers) are checked when the callee resolves
    through the file's scope chain to an import from `react-native-reanimated`. That covers named,
    aliased, namespace, default and static computed imports.
  - `PlatformColor`/`DynamicColorIOS` are caught by name as before, and also through an alias of
    react-native's export or static computed access.
  - Same-named local functions, parameters, declared variables and other modules' helpers are not
    flagged. Arbitrary dataflow is not followed.
  - Files and exemptions (`src/theme/themes/**`, `src/**/__tests__/**`) are unchanged.
- **Wiring.**
  - `eslint.config.js` appends `colorGuardConfig()`. The `no-restricted-syntax` block, including the
    typography/radius selector and the older colour selector, is unchanged.
  - `test-design-rules.cjs`, run by `pnpm lint` against the real config, asserts:
    - 4 typography/radius reports;
    - guard reports for a hex, a template literal, `tint="white"`, an aliased Reanimated target, an
      aliased `PlatformColor`, and a hex in `src/theme/` outside `themes/`;
    - the palette and test exemptions;
    - guard severity 2 on `momentum-assets.ts` and `MomentumAsset.tsx`;
    - clean semantic tokens.

**Gates (all UNRUN; the recipe is in the evidence, §5).**

| What | Authored | Result |
|---|---|---|
| `src/theme/__tests__/color-guard.test.ts` | 101 cases: 52 inherited, 34 new standalone L2 cases, 15 new effective-config cases | **UNRUN** |
| `src/ui/__tests__/momentum-asset.test.tsx` (new) | 145 cases | **UNRUN** |
| `scripts/test-design-rules.cjs` (in `pnpm lint`) | 13 assertions against the real config | **UNRUN** |
| `tsc`, `pnpm lint`, `jest src/theme src/ui`, `theme:generate`, root `pnpm check`, `expo export` (iOS and Android) | none | **UNRUN** |
| Mutations G1 (remove the wiring, **box 2 seen to fail**) to G5 | Predicted. **G1:** lint fails, and color-guard fails 10. **G2:** 2 + 1 + a lint report. **G3:** 4 + 1 + the script. **G4:** ≥ 4. **G5:** 46. | **UNRUN** |

**Box disposition after this phase.**
- **Box 1:** not met. It is unchanged by this phase; runtime and F1 to F3 are pending.
- **Box 2:** not met. The prerequisite, the L2 bypasses and the wiring are done in source, with no
  exemption. Box 2 is open until G1 is seen to fail in a permitted runtime, and until an independent
  review.
- **Box 3:** not met. The Android release capture beside Figma page 02 is blocked on a release build and
  a device.

**L2 disposition (review 2026-10-27T1605Z).** **Corrected in source, UNRUN.** Each named case is a test:
- `<MomentumAsset tint="white" />`;
- `withTiming('white')`;
- `interpolateColor(p, [0, 1], ['white', 'black'])`;
- `PlatformColor as PC`.

**Requests item 1 is satisfied in this worktree by DS-1 itself.** The `eslint.config.js` wiring and the
`test-design-rules.cjs` assertion are done. The `momentum-assets.ts` prerequisite is resolved by an
asset change, not an exemption, so DS-4 has nothing to retire.

**Unresolved findings and notes (for the reviewer and for other goals).**
- **DS-4:** `imgPlayArrowFill` and `imgSportsGymnastics` have no callsite and no Light export. Their role,
  `primaryContainer`, is lime in Light, which reads only on a dark or tonal tile. Choose a role per
  callsite when adopting them. `imgFitnessCenterLight.svg` shows the design keeping lime in Light for
  that glyph.
- **Integration:** after the rebase onto main, run `pnpm lint` over DS-3's `src/motion/**`, which was not
  read: it is another checkout. A named-colour Reanimated target there would now be reported. Fix it at
  the callsite, with no exemption.
- **DS-2/G14:** the older colour selector in `no-restricted-syntax` is now redundant except for malformed
  hex strings, and causes a second report on hex strings outside `src/theme/**`. Its owner may remove
  it.
- **QA-9 (L3):** `@typescript-eslint/parser` is still undeclared. No dependency or lockfile edit was made.
- **DS-1, later wording:** `docs/THEMING.md:105-108` still says the guard is not wired, and does not
  list the L2 positions or the asset roles. THEMING.md was not an allowed path in this phase.
- The Jest effective-config block loads Expo's ESLint plugins. If one cannot load in Jest, that block
  fails loudly in `beforeAll`, and `test-design-rules.cjs` still checks the wiring under Node.
- No screenshot, native, web or export verification is claimed.

**Decisions (routine, under the delegated authority).**
- The asset change was preferred to an exemption. Assets carry `currentColor`, and colour is a typed
  role per asset.
- The older colour selector was kept, so coverage is not reduced.
- Reanimated detection is bound to imports from `react-native-reanimated` only. Wrappers and re-exports
  are out of scope, as is any unknown dataflow.


## Guard prerequisite independent source review closed — 2026-11-01T10:47:47.268809+00:00

Complete review C0/H0/M0/L0 accepted by Codex in source only. See `docs/evidence/DS-1/guard-source-accepted-2026-11-01T1045Z.md` and verbatim review/audit. Reviewer6a95ddd3 stopped. All runtime/mutation/export/release gates remain UNRUN,0/3boxes; no new source or wording loop. The existing runtime recipe is pending and does not authorize retry of a denied sequence.
