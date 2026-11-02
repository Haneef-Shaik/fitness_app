I've corrected M1 and L1 and the two wording items, in comments and records only. Nothing was run and box 1 is still not met, so DS-1 stays at 0 of 3 Done-when boxes. I used only Read, Grep, Edit and Write, and none was denied. Before writing, I read the cited React Native lines in the installed sources, and they say what the review says.

**M1: whether a device focuses a disabled or loading button is now recorded as unverified.**
- React Native's JS layer keeps the button focusable and passes focus and blur through (`Pressable.js:258`, `Pressability.js:433-444`).
- On Android, `disabled` reaches the native view (`Pressable.js:235-236`, `View.js:94-99`), and `BaseViewManager.java:387-389` disables it.
- So whether an Android device gives or keeps focus on that button is not known. The records now say so in every place the review listed.
- I withdrew two claims that came from the 31 Oct review: that Android would move focus in the middle of a save, and that it keeps focus on such a button. The handoff now tells DS-4 not to take either as fact.
- The tests now say they model *reported* focus defensively. Their logic, titles and assertions are unchanged.

**L1: the pressed border.** The evidence no longer says unavailable buttons "never show the pressed border". A quick tap can show it briefly after loading starts, until the delayed press-out. The source bounds that delay at 130 ms or less; nothing was timed on a device.

**Wording.**
- `THEMING.md:82-84` no longer claims the matrix covers "every … pair". It lists what the matrix measures and what it doesn't prove: the light coach outline gap, some unmeasured pairs, and that it is not a pixel check.
- The violet known-gap section of `contrast-matrix.md` now records the decision. The curated violet is decoration only and not accessibility evidence. The proposal card needs a visible text label, interaction that can be identified without the violet, and no state shown only by the outline, and DS-4 builds and tests those. That section's old sentence treating violet ink as an identifier is withdrawn. I didn't read main's DS-4 contract, so the record cites the coordinator's statement that main carries it.

**Kept as they were:** the ring logic, the `disabled` and `accessibilityState` props, all tests and assertions, the palette, the contracts, every collected review and final, GOALS and status. `final-2026-11-01-collected.md:23` still contains the claim M1 corrects; it stays verbatim, and my records mark it as superseded.

**Line numbers moved.** The longer comments shift later lines, so the review's references are now off:
- `AppButton.tsx`: +3, so the ring expression is now :39, not :36.
- `app-button-focus.test.tsx`: +3 after line 86, so the unavailable groups are now :133-190.
- `contrast.test.ts`: +1 after line 46.

The mapping is in the focus evidence.

**Changed paths (8):**
1. `apps/mobile/src/ui/AppButton.tsx` (comment only, lines 33-38)
2. `apps/mobile/src/ui/__tests__/app-button-focus.test.tsx` (comments only, lines 15-21 and 86-96)
3. `apps/mobile/src/theme/__tests__/contrast.test.ts` (comment only, lines 40-46)
4. `docs/THEMING.md`
5. `docs/evidence/DS-1/focus-correction-2026-10-27T1605Z.md`
6. `docs/evidence/DS-1/contrast-matrix.md`
7. `docs/plan/runs/DS-1/handoff.md`
8. `docs/plan/runs/DS-1/checkpoint.md`

Your instruction forbade sub-agents, so the code-reviewer, security-reviewer and tdd-guide passes didn't happen. I re-read the three code files and confirmed only comment lines changed.

**Still to do (named, not started):**
- In `apps/mobile`: `tsc`, `pnpm lint`, `jest src/theme src/ui` (predicted 29/29 and 145/145) and `theme:generate`; then root `pnpm check`.
- Mutations F1–F3, with F1 built from `c8a5d57:apps/mobile/src/ui/AppButton.tsx` or checked against it.
- An independent review of those runtime results.
- Box 2: resolve `momentum-assets.ts`, wire the colour guard with the known bypasses, and see it fail.
- Box 3: the Android release capture.
- The native export at integration.
- Device focus on a disabled or loading button stays unverified; no box depends on it.

```
GOAL: DS-1
BRANCH: codex/fitlog-ds1-theme
HEAD: c8a5d57 (uncommitted working tree; no commit by instruction)
HANDOFF: docs/plan/runs/DS-1/handoff.md
BOXES: 0/3 Done-when boxes met
STATUS: blocked
NOTES: Records-only M1/L1 and wording correction; device focus while disabled/loading is UNVERIFIED and the "Android moves focus mid-save" inference is withdrawn; nothing run; runtime gates, F1–F3, guard wiring and Android capture still pending.
```
