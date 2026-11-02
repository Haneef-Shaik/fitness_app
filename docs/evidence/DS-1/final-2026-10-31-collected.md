I finished the H1 correction to DS-1. It is source only: nothing was run, so no test pass or fail is known and none of the three Done-when boxes is met. Box 1 now waits on a fresh independent review plus a test and mutation run. Box 2 is partly met. Box 3 still needs an Android release build and a device.

**The fix.** In Dark, a focused primary button changed nothing on screen: its 2 dp border was drawn in `primary`, the same lime (`#CAFD00`) as the fill. Now:
- A focused button that can be pressed draws the border in its own label colour (`onPrimaryContainer` or `onSecondaryContainer`). That colour measures 6.05–6.09:1 against the fill in both themes; these ratios come from the first session's contrast matrix and were not re-run.
- Disabled and loading buttons show no focus ring. If a button stays focused while it is unavailable, the ring comes back when it becomes available again.
- The border is always 2 dp and is drawn in the fill colour at rest, so focus only changes its colour and nothing moves.
- The pressed-only border, the palette, the props, the sizes and the blocking of disabled and loading presses are unchanged.

**Files changed:**
- `apps/mobile/src/ui/AppButton.tsx`: the ring colour, and no ring while unavailable.
- `apps/mobile/src/ui/__tests__/app-button-focus.test.tsx` (new, written before the fix): 29 cases. They cover focus and blur in both themes and both variants, a ratio of at least 3:1 against the drawn fill, the 96 dp button, and disabled, loading and losing availability while focused.
  - Against the old code, 21 of these 29 should fail. I worked that out by reading the code; it has not been run.
  - The test library ignores focus events on disabled buttons, but React Native still delivers them. For those cases the test calls the button's own focus handlers directly.
- `apps/mobile/src/theme/__tests__/contrast.test.ts`:
  - 4 new focus-ring rows at 3:1 (143 cases in total). No threshold was lowered, and H1 is not pinned as an accepted gap.
  - The coach-outline comment (M1) no longer counts violet colour as what identifies a proposal. It now requires a visible text label, a visible text control or a 3:1 boundary for anything tappable, and no proposal state that depends on the outline.
- `docs/evidence/DS-1/focus-correction-2026-10-27T1605Z.md` (new).
- `docs/plan/runs/DS-1/handoff.md` and `checkpoint.md`:
  - Box 1 changed from "yes" to "not met", and the "every action pair is pinned" claims are narrowed.
  - First-session results are marked as inherited from 27 Oct and kept apart from the new, unrun tests.
  - Codex's decision (keep the palette, the 33 curated pins and the light coach outline under those conditions) is recorded.
  - The guard sequencing is recorded: DS-1 clears its guard prerequisite (the 26 hard-coded fills in `momentum-assets.ts`) and this fix before DS-4 starts, so DS-1 never waits on DS-4.

Nothing else was changed in this phase: palette, tokens, SVG assets, guard wiring, `eslint.config.js` and GOALS are untouched. No commit was made.

**Still open:**

| Item | Owner |
|---|---|
| Fresh independent review of this fix | reviewer |
| Run the mobile type check, lint and the theme and UI tests, then the root check. Also break the fix three ways on purpose to confirm the new tests catch it | DS-1, in a phase that allows running commands |
| Clear the `momentum-assets.ts` prerequisite, then wire the colour guard, including the guard gaps the review listed as L2 | DS-1, before DS-4 |
| Correct wording in `docs/THEMING.md:82-84` and `contrast-matrix.md:8` (outside this phase's allowed files), plus L4 | DS-1, later |
| L5 and L6 | DS-1, deferred and optional |
| M2, light-theme selected and logged states shown by colour alone | DS-4 (Choice), SC-3 (Today week strip) |
| Proposal-card condition as a DS-4 Done-when line | coordinator |
| L1 docs/22 overstatements | QA-2 |
| L3 undeclared parser dependency | QA-9 |
| Box 3, Android release capture | needs a release build and a device |

Not claimed: how the ring contrasts with the surface outside the button (about 2:1 for Dark primary, my estimate). The pressed-only border on Dark primary is also still lime on lime.

I used only Read, Grep, Edit and Write, and no call was denied. The computer went to sleep partway through. After resuming I re-read every file I had already changed: the source, tests and evidence were intact, and I finished only the handoff Decisions section and the checkpoint.

```
GOAL: DS-1
BRANCH: codex/fitlog-ds1-theme
HEAD: c8a5d57 (base; all DS-1 work and this correction uncommitted by instruction)
HANDOFF: docs/plan/runs/DS-1/handoff.md
BOXES: 0/3 Done-when boxes met
STATUS: blocked
NOTES: H1 focus fix and M1 wording in source only; 29 + 4 new tests UNRUN; box 1 needs fresh review plus test and mutation run, box 2 needs DS-1 guard wiring before DS-4, box 3 needs a release build and device; no acceptance or merge claimed.
```
