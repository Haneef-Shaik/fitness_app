```json
{
  "goal": "DS-1",
  "attempt": "Focus-correction revision of 2026-11-01, after the 2026-10-31 review",
  "worktree": "/Users/Adya/.codex/worktrees/fitlog-ds1-theme/fitness_app",
  "branch": "codex/fitlog-ds1-theme",
  "base": "c8a5d57 (uncommitted working tree)",
  "method": "Source-only review using Read and Grep. Nothing was run: no tests, tsc, lint, mutations, git, network or DB. No tool call was denied. Three reads hit paths that don't exist (react-native/jest/setup.js, react-native/jest, and GOALS.md at the worktree root); none was a denial, and I read docs/plan/GOALS.md instead. Every contrast ratio of my own is an approximate hand calculation.",
  "verdict": "fail",
  "verdict_reason": "0 of 3 Done-when boxes are met, which matches the implementer's own 'BOXES 0/3, STATUS blocked'. The revision is accepted in source for H1 and for the 31 Oct finding 1. It still needs runtime and mutation proof, plus the records fix in M1 below.",
  "boxes": [
    {"box": 1, "text": "Palette regenerates from seed with no diff; contrast tests pin every text, action, error, coach and gym pair in both themes, including light-lime-as-container", "met": false, "evidence": "Only inherited attempt-1 results exist. The 29 UI cases and 145 contrast cases are written but have never run.", "missing": "Runtime gates, mutations F1 to F3, the THEMING.md:82-84 wording, and the superseded known-gap wording at contrast-matrix.md:106-114"},
    {"box": 2, "text": "Lint guard rejects a literal colour outside theme files (seen to fail)", "met": false, "evidence": "Partly met. The old selector is wired; the stronger no-literal-color.cjs rule is built but not wired into apps/mobile/eslint.config.js.", "missing": "Resolve the 26 fills in src/ui/momentum-assets.ts, wire colorGuardConfig() together with the L2 bypasses, and see it fail once"},
    {"box": 3, "text": "Today in both themes on an Android release build beside Figma page 02 in docs/evidence/DS-1/", "met": false, "evidence": "None. The work is blocked on a release build and a device.", "missing": "The capture itself, following docs/evidence/DS-1/release-capture.md"}
  ],
  "findings": {
    "critical": [],
    "high": [],
    "medium": [
      {
        "id": "M1",
        "title": "The records treat 'a device gives focus to a disabled button' as read in the React Native source, but RN's Android layer disables the native view",
        "location": "final-2026-11-01-collected.md:23; focus-correction-2026-10-27T1605Z.md:29-33, 54-55, 110-119, 224; app-button-focus.test.tsx:86-93; AppButton.tsx:34-35; contrast.test.ts:41-44; contrast-matrix.md:71-72; handoff.md:334-337, 361-364; checkpoint.md:173-175",
        "defect": "Only the JS layer was read: Pressable.js:258 keeps focusable, and Pressability.js:433-444 passes focus and blur through. The same tree's Android path does the opposite. AppButton.tsx:26 sets accessibilityState.disabled, Pressable.js:235-236 merges `disabled` into it, View.js:94-99 forwards it to native, and BaseViewManager.java:387-389 then calls view.setEnabled(false). By Android's framework rules a disabled View can't take focus; that code is not in this tree, so I didn't check it. Consequences: 'focus lands while unavailable' (test :130-146) may be unreachable on Android, and the decision 'taking them out of the focus order would make Android move focus away mid-save' (focus-correction:54-55, handoff:335-337) rests on a premise nobody has proved.",
        "impact": "No change to the source verdict. AppButton.tsx:36 draws the ring exactly when RN reports focus and removes it on blur, which is correct whatever Android does. The error is in the evidence basis and in the decision log that DS-4 inherits.",
        "fix": "Change wording only in the listed locations; leave the source logic and the tests as they are. State that the JS layer keeps the button focusable and passes focus through, but RN Android disables the native view (BaseViewManager.java:387-389). Whether a device gives or keeps focus on a disabled or loading button is therefore unverified. Mark the 'Android would move focus mid-save' reasoning as unverified."
      }
    ],
    "low": [
      {
        "id": "L1",
        "title": "'Unavailable buttons ... never show the pressed border' is wrong for quick taps",
        "location": "focus-correction-2026-10-27T1605Z.md:62",
        "defect": "Pressability defers onPressOut for up to 130 ms (Pressability.js:264, 775-792) and calls onPress after that (:757). WorkoutScreen.tsx:29 and :59 sets busy synchronously inside onPress. So after a tap shorter than 130 ms, pressed is still true while loading is already true, and the border is colors.primary on surfaceHigh until press-out. This behaviour predates the revision and is not a focus defect.",
        "fix": "Reword the line: a quick tap can show the pressed border briefly on a button that has just started loading, until the deferred press-out (130 ms or less)."
      }
    ]
  },
  "prior_findings_closure": {
    "H1 (2026-10-27)": "Closed in source, not yet accepted. Every state that can hold focus draws its ring in the label colour on the fill actually drawn, and the values match momentum.json and the matrix. Dark: 6.09, 6.05, 7.12. Light: 6.09, 6.07, 5.04. All are at least 3:1. Acceptance still needs runtime gates and F1 to F3.",
    "2026-10-31 finding 1 (High)": "Closed in source. The gate is gone (AppButton.tsx:36), no focusable prop is set, and test groups :130-187 require the ring while unavailable, through availability changes and after blur. Not yet run.",
    "2026-10-31 finding 2 (Medium)": "Closed in the records. The '21' claim and the old F2 are withdrawn at checkpoint.md:67-72, handoff.md:8-9, 126-127 and 170, and focus-correction.md:168-182. My trace confirms the new counts.",
    "2026-10-31 finding 3 (Low)": "Closed. The range is recorded at focus-correction.md:206-213. My figures for #495E00 are about 2.09 on #252620 and 2.64 on #0E0F0A, which agree.",
    "2026-10-31 finding 4 (Low)": "Closed. handoff.md:79 says 9 (5+1+1+2), which matches contrast.test.ts:152-171.",
    "M1 (2026-10-27)": "DS-1's part is closed in source. The comment at contrast.test.ts:74-84 covers conditions (a) to (c) and doesn't count violet ink as an identifier; the 2.7 pin and its '< 3' check at :85-87 and :125-130 are intact. The remainder belongs to DS-4. Per the coordinator, main's GOALS carries the DS-4 contract; I didn't read main, and this worktree's docs/plan/GOALS.md is the stale copy. contrast-matrix.md:110-111 still treats violet ink as an identifier; the header at :15-17 flags that section as superseded, and it stays a DS-1 wording obligation."
  },
  "verified_sound": [
    "Focus kept while disabled or loading: AppButton.tsx:36 is `focused ? foreground : pressed ? colors.primary : background`, with no availability gate and no focusable prop (:23-44).",
    "Contrast is measured against the drawn fill: the ring is checked against now.fill or focused.fill at test :81, :112 and :126, and the fill itself is pinned first at :80 and :110.",
    "Action blocking unchanged: disabled={unavailable} (:27) and accessibilityState (:26). The responder refuses when disabled (Pressability.js:448-450) and onClick is guarded (:545-546). Tests :141-142 and :159-162 cover it, and appearance.test.tsx:48-61 is unaffected.",
    "Layout unchanged: borderWidth is always dimensions.focusRing (:37; tokens.ts:12 = 2), and the box is asserted equal in every focused state.",
    "Case counts: 29 UI cases = 4 + 1 + 8 + 8 + 8 (:39-41, :99-187). 145 contrast cases = 119 + 6 + 1 + 2 + 9 + 8. No snapshot or other test pins AppButton's border.",
    "Revised source should pass: I traced all five groups through RNTL 13.3.3 fire-event.js:40-66 and the configure step in usePressability's insertion effect, and found no blocker.",
    "F1, 29 fail. Of the 4 that catch H1, three fail on the ratio check at ratio 1: the large case (:126) and the two Dark-primary 'focus persists' cases (:155→:81). The available Dark-primary case fails first on the exact colour (:111), as focus-correction:143-144 says. The other 25 fail only on the exact colour.",
    "F2, 24 fail at :81 with ratio 1 (:140, :158, :177); the other 5 pass. F3, 29 fail (:105, :127, :137, and the box checks at :155 and :177)."
  ],
  "remaining_obligations": [
    "Box 1: in apps/mobile run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm exec jest --runInBand src/theme src/ui` (expect 29/29 and 145/145) and `pnpm theme:generate`, then root `pnpm check`.",
    "Box 1: apply F1, F2 and F3 one at a time, score each against its prediction, and restore AppButton.tsx to an empty diff. Build F1 from the base file (c8a5d57:apps/mobile/src/ui/AppButton.tsx), or confirm the hand-written expression at focus-correction.md:140-141 matches it; source-only, I couldn't confirm that.",
    "Box 1: correct the wording at THEMING.md:82-84 and in the known-gap section at contrast-matrix.md:106-114, and make the M1 and L1 records fixes above. Then an independent review of the runtime results.",
    "Box 2: resolve momentum-assets.ts (a dated exemption naming the owner, or an authorized asset change), wire colorGuardConfig() into eslint.config.js with the L2 bypasses, and see it fail.",
    "Box 3: the Android release capture of Today in both themes beside Figma page 02.",
    "At integration: the native export (expo export)."
  ]
}
```

The revision fixes H1 and the 31 Oct high finding in the source, and its 29-case and F1 to F3 counts hold up when traced through the code. DS-1 still fails with 0 of 3 Done-when boxes met: nothing has run, and one medium records error remains (the claim that a device gives focus to a disabled button, which the Android source contradicts), plus one low wording error.
