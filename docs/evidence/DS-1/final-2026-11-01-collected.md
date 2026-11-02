I've fixed the review's high finding in source: a focused button now keeps a visible ring while it is disabled or loading. The tests and records are corrected to match. Nothing was run, every prediction below is UNRUN, and no Done box is met. Only Read, Grep, Edit and Write were used, and none was denied. There was no commit, and GOALS, the palette and both review files are untouched.

**Changed paths (all seven allowed, nothing else):**
- `apps/mobile/src/ui/AppButton.tsx`
- `apps/mobile/src/ui/__tests__/app-button-focus.test.tsx`
- `apps/mobile/src/theme/__tests__/contrast.test.ts`
- `docs/evidence/DS-1/focus-correction-2026-10-27T1605Z.md` (rewritten)
- `docs/evidence/DS-1/contrast-matrix.md`
- `docs/plan/runs/DS-1/checkpoint.md` (rewritten)
- `docs/plan/runs/DS-1/handoff.md`

**Source decision.**
- The border is now `focused ? foreground : pressed ? colors.primary : background`, and the `focusVisible` gate is gone.
- A focused disabled or loading button draws `onSurfaceVariant` on `surfaceHigh`: 7.12 in Dark, 5.04 in Light (matrix values from the earlier run, not re-run).
- Focus is not moved and `focusable` is not set. The palette, props, action blocking, layout, 2 dp width and pressed-only border are unchanged.

**Tests.**
- **Focus test, still 29 cases.** The 5 cases for buttons that can be pressed are unchanged. The three groups of 8 for disabled and loading buttons are rewritten:
  - focus that arrives while the button is unavailable shows a ring, and blur removes it;
  - focus stays visible when a focused button becomes disabled or loading and when it becomes available again, and blur then removes it;
  - blur while unavailable removes the ring, and it stays gone once the button is available again.
- **How focused states are checked.** A new helper checks each focused state in order: fill, then at least 3:1 on the drawn fill, then the exact colour, then an unchanged layout. Checking 3:1 before the exact colour means an invisible ring fails as invisible, not just as the wrong colour.
- **Test constraint.** For disabled and loading buttons the test calls the button's own focus and blur handlers directly, because the test library drops events on a disabled button. That a real device delivers focus to a disabled button is read in the React Native source, not tested.
- **Contrast test.** Two focus-ring cases are added for `onSurfaceVariant` on `surfaceHigh`, one per theme, bringing the file to 145 cases. They can only fail if the existing 4.5:1 rows for the same pairs also fail.

**Predictions (UNRUN):**

| Mutation | Expected failures | Why |
|---|---|---|
| Revised source | 0 of 29 UI, 0 of 145 contrast | — |
| F1: code before either correction | 29 of 29 | 4 catch the original invisible ring (1:1); 25 fail only because the ring isn't the exact label colour |
| F2: put the availability gate back | 24 of 29 | all 24 disabled/loading cases, at the 3:1 check (received ratio 1); the 5 others pass |
| F3: border only while focused | 29 of 29 | border-width or layout assertions |

**Records.**
- **Withdrawn:** the "21 cases catch H1" claim and the old F2 plan, in the checkpoint, the handoff and the evidence note.
- **Ring-against-background range:**
  - The Dark primary ring measures about 2.25 on `surfaceHigh` and 2.64 on `surface` (the reviewer's figures), and about 2.10 on `surfaceHighest` (my figure).
  - All three are approximate hand calculations, not run.
- **Light-lime count:** corrected from 8 to 9.
- **Contrast-matrix file:** count line resolved (139 from the earlier run, 145 now) and six focus-ring rows added.
- **Beyond the brief:** a one-line note in the contrast-matrix header flags its known-gap section as superseded wording.
- **GOALS:** the records now say main's GOALS already has the DS-4 contract. The worktree copy is stale, and no contract is claimed missing.

**Not done:** the `code-reviewer`, `security-reviewer` and `tdd-guide` reviews, because sub-agents were excluded. Your review replaces them.

**Remaining work:**
- your review of this revision;
- the type check, `pnpm lint`, `jest src/theme src/ui` and root `pnpm check`;
- mutations F1–F3, each applied alone, compared with the prediction, then restored;
- the colour guard's wiring, after deciding on the 26 hard-coded colours in `momentum-assets.ts` (box 2);
- the Android release capture (box 3);
- `THEMING.md:82-84` wording;
- the native export at integration.

**To resume:** `docs/plan/runs/DS-1/checkpoint.md`, "Next step (resume here)".

```
GOAL: DS-1
BRANCH: codex/fitlog-ds1-theme
HEAD: c8a5d57
HANDOFF: docs/plan/runs/DS-1/handoff.md
BOXES: 0/3 Done-when boxes met
STATUS: blocked
NOTES: Bounded correction done, source only and UNRUN, uncommitted at base c8a5d57; next is coordinator review, then an authorized runtime phase (gates plus F1 29, F2 24, F3 29 predictions); box 3 needs a release build.
```
