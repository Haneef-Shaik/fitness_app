**Verdict:** H1 is fixed for buttons that can be pressed, but I can't accept it yet. The change hides focus on disabled and loading buttons, which can still take focus. M1's comment fix is correct, but nothing enforces it yet. This was a source-only review, using only Read and Grep. I ran nothing, and no tool call was denied. One read failed because `apps/mobile/node_modules/react-native/.../Pressable.js` doesn't exist; that wasn't a denial, so I read the copy in the root `node_modules`. All the contrast ratios below are my own hand calculations and are approximate.

## Findings

**1. High: focus disappears on buttons that are disabled or loading but still focusable**
- **Location:** `apps/mobile/src/ui/AppButton.tsx:24,37`. The new tests require this behaviour at `src/ui/__tests__/app-button-focus.test.tsx:111-122,132-134`.
- **Defect:** `focusVisible = focused && !unavailable` takes the ring away from a button that still holds focus. It recreates H1's problem (a focused button looks unfocused) in the disabled and loading states.
  - In the React Native source, `Pressable.js:258` keeps the button `focusable` when disabled, and `Pressability.js:433-444` passes focus events through regardless. The test's own comment at lines 69-74 says the same.
  - Before this change, the same states drew a visible `primary` ring on the `surfaceHigh` fill: about 13.7:1 in Dark and 5.04:1 in Light.
- **Failure scenario:**
  - On Android with a keyboard or D-pad, focus "Log set" (`WorkoutScreen.tsx:59`, which uses `large loading={busy}`) and press Enter.
  - While the save runs, the border goes back to the fill colour. No blur event fires, so focus stays on the button, but nothing on screen shows where it is.
  - At `GymHomeScreens.tsx:40`, pressing "Next" onto a last page with fewer than 50 visits disables the focused button. The indicator stays gone until the user moves focus.
  - The always-disabled and always-loading buttons in `ComponentGalleryScreen.tsx:21-22` show nothing when focused.
- **Fix:**
  - Use `borderColor: focused ? foreground : pressed ? colors.primary : background`. A disabled or loading button's label colour is `onSurfaceVariant` on `surfaceHigh`, about 7.1:1 in Dark and 5.04:1 in Light, and the matrix already requires it to be at least 4.5:1. No palette change is needed.
  - Change the 16 disabled/loading tests to expect a ring of at least 3:1 on the `surfaceHigh` fill, and add a focus-ring row for that pair.
  - Taking these buttons out of the focus order (`focusable={!unavailable}`) would also work, but Android would then move focus away in the middle of a save.

**2. Medium: the evidence overstates how many tests catch H1, and one planned mutation tests the wrong thing**
- **Location:** `docs/evidence/DS-1/focus-correction-2026-10-27T1605Z.md:76-82,117-119`, `checkpoint.md:73`, `handoff.md:128,283-292`.
- **Defect:** The records say 21 of the 29 new tests should fail against the old code, as if all 21 catch H1.
  - Only 4 fail because of the 1.00:1 problem: Dark primary focus, the large Dark button, and the two Dark primary preconditions in the "made unavailable while focused" test.
  - 3 fail only because the test checks the exact ring colour (Dark secondary 7.8, Light primary 4.9, Light secondary 4.5).
  - The remaining 14 fail because the old code drew a visible ring on disabled and loading buttons. The records never say this was a regression.
- **Failure scenario:** Mutation F2 ("drop `&& !unavailable`, expect 16 failures") would count the fix for Finding 1 as a failed guard.
- **Fix:** After fixing Finding 1, recount and redescribe the cases, and rewrite F2 so it checks that the ring survives a change in availability.

**3. Low: the ring-against-surface figure needs correcting (the reviewer was asked to judge this)**
- **Location:** `focus-correction…md:102-104`.
- **Defect:** The note says "about 2:1". By my calculation, the Dark primary ring `#495E00` measures about 2.25:1 on `surfaceHigh` and 2.64:1 on `surface`.
- **My judgement:** this doesn't block WCAG 2.4.7 (AA). The ring's pixels change by 6.09:1 around the whole 2 dp edge, and the ring contrasts 6.09:1 with the fill inside it. Only Dark primary is affected; the other combinations measure above 3:1.
- **Fix:** Record the measured range.

**4. Low: miscount in the handoff**
- **Location:** `handoff.md:56`.
- **Defect:** It says there are 8 light-lime test cases. The source has 9 (5 + 1 + 1 + 2). This wording is inherited from attempt 1.
- **Fix:** Change it to 9.

## What I checked and found sound
- **Ring contrast against the fill actually drawn** (my calculations): Dark primary 6.09, Dark secondary 6.05, Light primary 6.09, Light secondary 6.07. These match the evidence table.
- **No layout shift:** the border is 2 dp in every state, and focus changes only its colour.
- **Catching the original H1:** the Dark primary case fails both at line 92 (exact ring colour) and at line 93 (1.00 is below 3), and the large-button case at line 107 also fails. Mutation F1 would catch H1.
- **Test setup:** the explicit scheme preference, hydrating only once, reading the flattened style, and the claims about how `fireEvent` and Pressability handle disabled buttons all match the installed source (RN Testing Library 13.3.3).
- **Case counts:** 29 UI cases and 143 contrast cases are correct. F2's expected 16 failures is the right number.
- **Matrix rows:** the 4 new focus-ring rows can't fail unless the existing 4.5:1 label rows also fail. The evidence says this openly.
- **M1:** the comment now covers conditions (a) to (c). It no longer counts violet ink as identifying a proposal, which was the review's condition (d). The 2.7 measurement and its "below 3" assertion are unchanged. Nothing in `src` uses `coachOutline` outside the theme files today.

## Source-only verdicts
- **H1: not accepted as it stands.** Available buttons are fixed in the source, and the tests would catch the original defect. Finding 1 is a regression in the disabled and loading states and needs fixing, then a new review.
- **M1: DS-1's part is correct in the source; M1 overall stays open.** DS-4's Done-when at `GOALS.md:474-477` still has no line for conditions (a) to (c). Recording it is the coordinator's job; then DS-4 needs a visible label and tests.

## Still open (none accepted)
- **Runtime:** mobile `tsc`, `pnpm lint`, `jest src/theme src/ui`, root `pnpm check` and the native export have not been run. Mutations F1 to F3 have not been run, and F2 needs rewriting.
- **Box 1:** not met.
- **Guard (box 2, partly met):** the guard is not wired into `eslint.config.js`. The 26 fills in `momentum-assets.ts` must be resolved first, and the L2 bypasses go with that wiring.
- **Release (box 3, blocked):** the Android release capture beside Figma page 02 has not been done.
- **Docs:** the wording in `THEMING.md:82-84` and `contrast-matrix.md:8` still needs updating.
- **No Done box is accepted.**
