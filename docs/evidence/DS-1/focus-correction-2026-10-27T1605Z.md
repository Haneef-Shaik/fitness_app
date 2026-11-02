# DS-1 · Focus-visibility correction after the 2026-10-27T1605Z review (H1, M1), revised after the 2026-10-31 review

**Status: source only, UNRUN.** Nothing was executed in any correction phase: no tests, type check,
lint, mutation, install, build or device. No PASS, RED or GREEN is claimed, and Done is neither claimed
nor implied.
- Every expected count below is a **prediction** reasoned from the source, not an observation.
- These corrections stay pending until a **fresh independent review** and **runtime and mutation proof**.

- **Authority:** the Codex AUTH-01 delegated decision allows bounded corrections of material findings on
  the existing DS-1 work, under the review and merge freeze. The coordinator assigned this shared
  AppButton prerequisite to DS-1, because DS-4 needs DS-1 and cannot wait for itself.
- **Phases:**
  - **First correction**, 27 Oct 2026 (records finished 31 Oct 2026): H1 and the M1 comment.
  - **Revision**, 1 Nov 2026: the 31 Oct review's finding 1 (high) and finding 2 (medium), with its lows
    3 and 4.
  - **Records correction**, 1 Nov 2026, after the review of that date. It covers M1 (native focus while
    unavailable) and L1 (the pressed border on a quick tap), plus the THEMING and contrast-matrix wording.
    It changed comments and records only. Ring logic, props, tests, assertions, palette and contracts are
    unchanged. See "The revision's records, corrected" below.
- **Tools used:** Read, Grep, Edit and Write in every phase. No tool call was denied.
- **Reviews, kept unchanged:** [review-2026-10-27T1605Z-collected.md](review-2026-10-27T1605Z-collected.md),
  [review-2026-10-31-collected.md](review-2026-10-31-collected.md) and
  [review-2026-11-01-collected.md](review-2026-11-01-collected.md).

## H1 · The defect

AppButton's only focus indicator was its 2 dp border, drawn in `colors.primary`. In Dark, `primary` and
`primaryContainer` are both `#CAFD00`, so on a focused primary (default) button the border changed from
`#CAFD00` to `#CAFD00`: 1.00:1, since the hex values are identical. Nothing on screen changed (WCAG 2.2
SC 2.4.7, required by PRD §23.1). The contrast matrix had no focus-ring rows, so it could not catch this.

## 31 Oct review, finding 1 · The first correction hid focus on unavailable buttons

The first correction drew the ring only while `focused && !unavailable`.
- **Why that is wrong.** It hid focus that React Native reports. In RN's JS layer an unavailable button
  can still receive focus events:
  - Pressable keeps `focusable` when disabled (`Pressable.js:258`);
  - Pressability forwards focus and blur whatever `disabled` says (`Pressability.js:433-444`, cited by
    the review).
- **Corrected 1 Nov 2026 (review of that date, M1).** The 31 Oct review and these records went further:
  the review said an unavailable button is "still focusable" and that "focus stays on the button", and
  these records said it can still hold focus. Only the JS layer was read for that. On Android,
  Pressable merges `disabled` into `accessibilityState` (`Pressable.js:235-236`), View forwards it to
  native (`View.js:94-99`), and `BaseViewManager.java:387-389` calls `view.setEnabled(false)`.
  - Whether a device gives or keeps focus on a disabled or loading button is **unverified**.
  - The finding stands on the narrower ground: the gate hid a focus state that RN can report.
- **What the user would see.** Whenever RN reported focus on a button that was, or became, disabled or
  loading, the first correction showed nothing. The reviewer's examples, where such focus could arise
  (whether it does on a device is unverified):
  - "Log set" (`WorkoutScreen.tsx:59`, `large loading={busy}`) during a save;
  - "Next" at `GymHomeScreens.tsx:40` when it moves onto the last page;
  - the always-disabled and always-loading gallery buttons.
- **A regression the records did not report.** The source before either correction drew a visible
  `primary` ring in those states. The first correction introduced the regression, and its records did not
  call it one.

## The correction (`apps/mobile/src/ui/AppButton.tsx`), as revised

- **Ring colour.** Whenever React Native reports focus, the border is drawn in the button's own label
  colour (`foreground`):
  - `onPrimaryContainer` on `primaryContainer` (primary variant, available);
  - `onSecondaryContainer` on `secondaryContainer` (secondary variant, available);
  - `onSurfaceVariant` on `surfaceHigh` (either variant, disabled or loading).

  All three are existing semantic roles that already pass as label pairs at ≥4.5:1 in both schemes.
- **Expression:** `borderColor: focused ? foreground : pressed ? colors.primary : background`. The
  first correction's `focusVisible` gate is removed.
- **Focus handling is unchanged.** `focusable` is not set, and nothing moves focus. The ring follows the
  focus and blur events React Native reports, so it is right whatever a device does.
  - Whether a device gives or keeps focus on a disabled or loading button is **unverified** (see "The
    test's constraint" below).
  - **Withdrawn (1 Nov 2026):** the earlier reason given here, "taking them out of the focus order would
    make Android move focus away in the middle of a save" (from the 31 Oct review). It assumed Android
    keeps focus on a disabled button, which nobody has shown. These records no longer claim that Android
    moves focus mid-save, or that it keeps focus there.
- **Geometry.** The border is still `dimensions.focusRing` (2 dp) wide in every state, and at rest it is
  drawn in the fill colour. Focus changes only its colour, so it reads as an inset ring with no wrapper
  and no layout shift. Size, radius and padding are unchanged.
- **Pressed:** unchanged.
  - A button that is pressed but not focused still uses `colors.primary`.
  - When a button is both focused and pressed, the focus ring wins.
  - A disabled or loading button refuses a new press (`Pressability.js:448-450`).
  - **Corrected 1 Nov 2026 (review of that date, L1).** This line used to say unavailable buttons "never
    show the pressed border". That is wrong for a quick tap.
    - Pressability defers press-out until the press has lasted 130 ms (`Pressability.js:264`, `775-792`),
      and it calls `onPress` before that timer fires (`:757`).
    - `WorkoutScreen.tsx:29` and `:59` set `busy`, and so `loading`, inside `onPress`.
    - So after a short tap, `pressed` can still be true once loading has started, and the button can show
      the pressed border (`primary` on `surfaceHigh`) briefly, until the deferred press-out. The source bounds
      that at 130 ms or less; nothing was timed on a device.
    - This predates both corrections and is not a focus defect. Nothing was changed.
- **Unchanged:** the palette, tokens, props, accessibility role and state, action blocking and layout.

The incumbent Momentum tokens govern this narrow accessibility fix. The craft-floor reference was read
in the first correction. This is not a redesign.

| Scheme | Button state | Fill | Ring | Ratio (inherited DS-1 matrix value) |
|---|---|---|---|---:|
| dark | primary | `#CAFD00` | `#495E00` | 6.09 |
| dark | secondary | `#414B24` | `#CAD6A3` | 6.05 |
| dark | disabled or loading | `#1F201A` | `#ACABA4` | 7.12 |
| light | primary | `#CAFD00` | `#495E00` | 6.09 |
| light | secondary | `#DCE8B4` | `#4C562E` | 6.07 |
| light | disabled or loading | `#EFEEE4` | `#65655E` | 5.04 |

- **Hex values:** from `momentum.json`.
- **Ratios:** from [contrast-matrix.md](contrast-matrix.md), computed in the attempt-1 run and inherited
  without re-running. The 31 Oct reviewer's hand figures for the unavailable pair agree: about 7.1 in
  Dark and 5.04 in Light.
- **Why each ratio is also the visible change:** at rest the border is the fill colour, so focus changes
  the ring's pixels by exactly this ratio.

## Tests authored first, in source, UNRUN

### `apps/mobile/src/ui/__tests__/app-button-focus.test.tsx` (29 cases)

The unavailable groups were rewritten in the revision. Each case renders inside `ThemeProvider` with an
explicit stored preference and checks the resolved scheme. It then reads the flattened style the button
actually draws.

| Cases | What each asserts |
|---|---|
| 4 = {dark, light} × {primary, secondary} (unchanged) | At rest the border is the fill colour, 2 dp wide, `buttonHeight` tall. On `focus` the fill is unchanged, the border is the variant's ring role, and its ratio to the drawn fill is ≥ 3. Every box property other than the colours is unchanged. On `blur` the drawn style is identical to the rest state. |
| 1, default large action, Dark (unchanged) | `loggerButtonHeight` (96 dp) holds. The focused ratio is ≥ 3, and the box is unchanged. |
| 8 = schemes × variants × {disabled, loading}: focus lands while unavailable | At rest the fill is `surfaceHigh`, the border equals it, and it is 2 dp wide. On focus the fill is unchanged, the border is ≥ 3:1 on it and is `onSurfaceVariant`, and the box is unchanged. Press stays blocked. On blur the style is identical to the rest state. |
| 8, same matrix: focus persists through unavailability | Focused while available: the ring as in the first row. Made unavailable while still focused: the ring stays visible as `onSurfaceVariant` on `surfaceHigh` at ≥ 3:1, and the box is unchanged. Press is blocked, the button is disabled, and `busy` matches loading. Made available again while still focused: identical to the focused available style. Blurred: identical to the available rest style. |
| 8, same matrix: blur while unavailable | Focused while available, then made unavailable: the ring is visible as above. Blurred while unavailable: the border is back to the `surfaceHigh` fill, and the box is unchanged. Made available again: identical to the available rest style, with no ring. |

The three unavailable groups model focus and blur as React Native **reports** them, defensively. Their
titles say focus "lands" or "persists", but they do not show that a device gives or keeps focus on an
unavailable button. On Android that is unverified, and focus landing while unavailable may never happen
there (see the next section). Their logic and titles are unchanged. The ring has to be right whenever
focus is reported.

**How focused states are checked.** The three unavailable groups check every focused state with
`expectVisibleRing`. It checks, in order:
1. the fill;
2. that the border is at least 3:1 on that fill;
3. that the border is the exact ring role;
4. the box.

Because the 3:1 check runs before the exact role, a ring drawn in its fill's own colour fails as
invisible, not merely as the wrong colour. The two unchanged groups keep their original order.

**The test's constraint, and what it models.** For unavailable buttons the test calls the host's own
`onFocus` and `onBlur` directly, because `fireEvent` can't reach a disabled host. It is a defensive model
of a reported event, not evidence that a device produces one. From the installed sources (read, not
run):
- RNTL 13.3.3's `fireEvent` drops every event on a host whose responder refuses touches
  (`fire-event.js:47-52`).
- **React Native's JS layer:** Pressable keeps `focusable` (`Pressable.js:258`), and Pressability
  forwards focus and blur whatever `disabled` says (`Pressability.js:433-444`).
- **React Native's Android layer does the opposite:**
  - `AppButton.tsx` sets `accessibilityState.disabled` and `disabled={unavailable}`;
  - Pressable merges `disabled` into `accessibilityState` (`Pressable.js:235-236`);
  - View forwards it to native (`View.js:94-99`);
  - `BaseViewManager.java:387-389` calls `view.setEnabled(false)`.

  Android's own rules on focus for a disabled View are not in this tree and were not read.

**What follows.** Whether a device gives focus to a disabled or loading button, or keeps focus on one, is
**unverified**.
- The tests show what the button draws if React Native reports focus or blur while it is unavailable.
- They do not exercise device focus.
- **Withdrawn (1 Nov 2026):** the earlier statement that device delivery of focus to a disabled button
  "comes from reading the React Native source". Only the JS layer was read, and the Android layer points
  the other way.

### `apps/mobile/src/theme/__tests__/contrast.test.ts` (+6 focus-ring cases; 145 authored, none run)

The attempt-1 file had 139 cases. Six focus-ring rows are added:
- `$scheme · focus ring · onPrimaryContainer on primaryContainer ≥ 3:1`, in both schemes;
- the matching `onSecondaryContainer on secondaryContainer` row, in both schemes;
- added in the revision: the `onSurfaceVariant on surfaceHigh` row, in both schemes.

Known gaps do not filter these rows. Each of the six pairs is already a 4.5:1 label or ink row, so these
rows cannot fail unless those rows also fail. They record that the pairs are focus rings, and the UI
test's check of the exact role ties them to the component. H1 is **not** pinned as an accepted gap, and no
threshold changed.

## Expected results: predictions, UNRUN

These are reasoned from the source. The runtime phase must confirm or refute each one. Apply each
mutation on its own, run `pnpm exec jest --runInBand src/ui/__tests__/app-button-focus.test.tsx` in
`apps/mobile`, then restore it (empty diff on `AppButton.tsx`).

- **Revised source:** all 29 UI cases and all 145 contrast cases pass.
- **F1, the source before either correction** (`borderColor: focused || pressed ? colors.primary :
  background`). All 29 UI cases should fail, for two different reasons:
  - **4 detect H1's 1:1 ring.** The old ring is `#CAFD00` on `#CAFD00`, which is 1.00. The 4 cases:
    - the available Dark primary case. Its first failing assertion is the exact ring role, and its ≥3:1
      assertion would fail too;
    - the Dark large case, where ≥3:1 is the only colour check;
    - the Dark primary disabled and loading cases of the "focus persists" group, where ≥3:1 runs first.
  - **25 fail only on the exact-colour policy.** The old ring was visible but was not the label colour.
    These 25 are not evidence about H1:
    - 3 available cases, where the old `primary` ring measures about 7.8 (Dark secondary), 4.9 (Light
      primary) and 4.5 (Light secondary). These are the 31 Oct reviewer's figures;
    - the other 6 cases of the "focus persists" group;
    - all 16 cases of the "focus lands while unavailable" and "blur while unavailable" groups. There the
      old ring was `primary` on `surfaceHigh`, at 13.72 in Dark and 5.04 in Light (inherited matrix
      values).
- **F2, reintroduce the unavailable gate.** That is the first correction's form:
  `const focusVisible = focused && !unavailable;` with `borderColor: focusVisible ? foreground : pressed ?
  colors.primary : background`.
  - **Expected:** 24 failures, which are all 24 unavailable cases. Each fails at the ≥3:1 visibility
    assertion with a received ratio of 1, because the border equals the fill.
  - The 5 available and large cases should pass.
  - Here a failure is the desired result: it shows the tests catch finding 1's regression. F2 now checks
    that the ring survives a change in availability.
- **F3, border width only while focused** (`borderWidth: focused ? dimensions.focusRing : 0`). All 29
  should fail, at a border-width or box-equality assertion, which shows the layout shift.
- **None of the mutations affects the matrix.** The 6 focus-ring matrix rows pass on the current palette
  whatever the component does.

## The first correction's records, corrected

The first-correction records claimed two things:
- 21 of the 29 then-authored UI cases should fail against the previous source, as if all 21 caught H1;
- mutation F2 should "drop `&& !unavailable`, expect 16 failures".

The 31 Oct review found both wrong:
- only 4 of those 21 cases caught the 1.00:1 defect;
- 3 failed only on the exact ring colour;
- 14 failed because the old source showed a visible ring on unavailable buttons, which those records did
  not call a regression;
- F2 as planned would have counted the fix for finding 1 as a failed guard.

Those claims are withdrawn here, in the checkpoint and in the handoff. The counts in the previous section
replace them, and they are predictions too.

## The revision's records, corrected (review of 1 Nov 2026)

Source: [review-2026-11-01-collected.md](review-2026-11-01-collected.md), kept unchanged. It found C0, H0,
M1 and L1. It closed H1 and the 31 Oct high finding **in source only**, with every runtime gate and
mutation UNRUN, and 0 of 3 Done-when boxes met. This phase changed comments and records only. The ring
expression, the `disabled` and `accessibilityState` props, the tests and their assertions, the palette
and the contracts are unchanged.

- **M1: native focus while unavailable.** The records had treated "a device gives focus to a disabled
  button" as read in the React Native source. Only the JS layer was read. RN Android disables the native
  view, and device focus there is **unverified**. Corrected:
  - in this file: the finding-1 rationale, "Focus handling is unchanged", the test note and "The test's
    constraint", and "Not claimed";
  - the comments in `AppButton.tsx`, `app-button-focus.test.tsx` and `contrast.test.ts`;
  - in `contrast-matrix.md`, the focus-ring section;
  - the handoff and the checkpoint.

  The inferences that Android would move focus mid-save, or that it necessarily keeps focus, are
  withdrawn. They came from the 31 Oct review, which is kept verbatim.
  `final-2026-11-01-collected.md:23` ("That a real device delivers focus to a disabled button is read in
  the React Native source") is a historical final and is kept verbatim. This correction supersedes that
  line.
- **L1: the pressed border on a quick tap.** "Unavailable buttons … never show the pressed border" is
  replaced. A quick tap can keep `pressed` briefly after loading starts, until the deferred press-out:
  130 ms or less according to the source, not timed on a device. This predates the corrections and is not
  a focus defect.
- **Line numbers after this phase.** The longer comments move later lines. The review's line references
  use the earlier numbering:
  - `AppButton.tsx`: +3 after its comment, so the ring expression at :36 is now :39;
  - `app-button-focus.test.tsx`: +3 after the native-focus comment, so the groups at :130-187 are now
    :133-190. Lines up to :84, including `expectVisibleRing`, are unmoved;
  - `contrast.test.ts`: +1 after the focus-ring comment, so the known-gap comment and pin at :74-87 are
    now :75-88.
- **Wording obligations from the same review.** Done in records:
  - `docs/THEMING.md:82-84` no longer claims the matrix covers "every … pair". It names what the matrix
    measures and what it does not prove.
  - `contrast-matrix.md`'s known-gap section records the Codex decision. Curated violet is decoration
    only and is not accessibility evidence. Conditions (a) to (c) are DS-4's to build and test, and the
    attempt-1 sentence that counted violet ink as an identifier is withdrawn.

## M1 · Light coach outline wording (`contrast.test.ts` known-gap comment)

The comment no longer counts violet ink as an identifier. It now states that the 2.70:1 dashed border
may only decorate, and that this holds only while every AI proposal:
- shows a visible text label naming it a proposal (a screen-reader label alone is not enough);
- if it can be acted on, is identifiable as interactive by a visible text control, or by a boundary of
  at least 3:1;
- has no state (accepted, unsure, ticked) that depends on the outline.

**Codex decision:** keep the approved palette and its 33 curated pins. The measured 2.70 pin and its
`< 3` assertion are unchanged. Nothing changes the palette, and no claim is made about Figma.

**Where the DS-4 contract lives.** The coordinator states that main's GOALS.md already carries DS-4's
visible-label, interactivity and state contract. This worktree's GOALS.md is an older, stale copy, so the
31 Oct review's "no line at `GOALS.md:474-477`" reflects that copy. GOALS.md is not edited here, and no
contract is claimed missing from main.

**Status.** The 31 Oct review accepted DS-1's part of M1 in source. What remains of M1 is DS-4's: the
card's visible label, its interactivity and its tests.

## Not claimed

- **Contrast of the ring against the surface outside the button.** These are approximate hand
  calculations; no tool or test computed them.
  - **Dark primary ring `#495E00`:**
    - about 2.25:1 on `surfaceHigh` and 2.64:1 on `surface` (31 Oct reviewer);
    - about 2.10:1 on `surfaceHighest` (this phase).

    So the range across the five Dark surfaces is about 2.1 to 2.64. It replaces the first correction's
    "about 2:1".
  - **Reviewer's judgement (31 Oct):** this does not block SC 2.4.7 (AA). The ring's pixels change by
    6.09:1 around the whole 2 dp edge, and the ring contrasts 6.09:1 with the fill inside it. The reviewer
    also found that the other combinations measure above 3:1.
  - **Unavailable ring:** `onSurfaceVariant` is already in the matrix against all five surfaces: 6.62 to
    8.35 in Dark and 4.80 to 5.72 in Light (inherited).
  - The coordinator specified measuring against the drawn fill. The button's own boundary at rest is
    unchanged.
- **Pressed-only feedback on the Dark primary button** is still lime on lime. It was kept by
  instruction and is not a focus indicator. Owner if wanted: DS-4 (component states).
- **Platform-drawn indicators** (TalkBack, iOS Full Keyboard Access) are not tested.
- **Device focus on a disabled or loading button** is unverified, and the tests do not exercise it. RN's
  JS layer keeps the button focusable and forwards focus, but RN Android disables the native view
  (`BaseViewManager.java:387-389`). Nothing here claims a device gives, keeps or moves that focus.
- **Other focus treatments**, for example AppearanceScreen's choice cards, are out of scope and were not
  changed.

## Runtime proof still required (next authorized runtime phase)

1. In `apps/mobile`: `pnpm exec tsc --noEmit`, `pnpm lint`,
   `pnpm exec jest --runInBand src/theme src/ui` (predicted 29 of 29 and 145 of 145) and
   `pnpm theme:generate`. Then root `pnpm check`.
2. Mutations F1, F2 and F3 as described above, each applied alone, recorded against its prediction, and
   restored. Build F1 from the base file (`c8a5d57:apps/mobile/src/ui/AppButton.tsx`), or confirm that the
   expression written above matches it.
3. An independent review of the runtime results.

Recorded, not scheduled. Whether a device gives or keeps focus on a disabled or loading AppButton is
unverified. No Done-when box depends on it, and the ring logic is right either way.
