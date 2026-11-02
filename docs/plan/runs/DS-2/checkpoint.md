# Checkpoint — DS-2 · Type ramp and fonts

| Field | Value |
|---|---|
| Attempt | 1, two sessions, 27 October 2026 |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-ds2-type/fitness_app`, branch `codex/fitlog-ds2-type` (name kept as instructed) |
| Base / HEAD | `c8a5d57`; **no commits** (the coordinator ruled out commits). Every change is in the working tree |
| Lane | S3 Design. Scope set by the coordinator: typography in `theme/tokens.ts`, the theme's typography mapping, new typography helpers and tests, and the font licence registry. Colour files are DS-1's; shared guard wiring is a patch request |
| State | **Ready for independent review. Not verified, not Done.** Boxes 1 and 2 have run evidence. Box 3 is blocked on a real Android release build |

## Steps

1. **Session 1 (no shell: Bash was denied in don't-ask mode).** Read the card, PRD §§19.1/23.1,
   DEC-16, docs/22 §4, docs/23 §§5/7/9, THEMING.md and the existing theme, loader and lint guard.
   Wrote the tests first: `typography.test.ts`, `font-licences.test.ts`, `font-files.test.ts`,
   `typography-guard.test.ts`. Then wrote `typography.ts` and `font-licences.ts`, the typography
   section of `tokens.ts`, and the narrow `theme.ts` and `index.ts` changes. Nothing ran.
2. **Session 2 (`rtk proxy` single commands allowed).**
   - Ran `pnpm install --frozen-lockfile` with no package changes. All 6 theme suites passed first
     time (60 tests).
   - Typecheck failed: the mobile tsconfig has no Node types. Fixed with the typed test shim
     `__tests__/node.ts` and `DataView`. Lint failed on `require()`; fixed with `jest.requireActual`.
3. Read RN 0.86's Android text code (`CustomLineHeightSpan`, `TextAttributes`, `PixelUtil`,
   `DisplayMetricsHolder`) and measured the bundled fonts. Added a test that sample glyphs fit RN's
   half-leading line box. **RED:** Display Large 56/64 descenders overflow on both platforms.
   **GREEN:** Display Large is now 56/68, and the words floor is 1.15.
4. Ran mutation checks M1–M7. Every one failed a named test and was restored.
5. The Expo export listed a fourth bundled font, Material Symbols, pulled in transitively through
   expo-router → expo-symbols. **RED:** new lockfile-inventory and byte-identical-notice tests failed.
   **GREEN:** added its Apache-2.0 notice (byte-identical to the shipped `LICENSE_FONT`) and its registry
   entry. Mutation M8 passed (an altered notice fails the test).
6. Verified a lint-selector patch for DS-1 from a temporary script outside the repo:
   - today's rule misses 6 bypass forms;
   - the proposal catches all 6;
   - the proposal flags 0 existing lines.
7. Gates passed: typecheck, lint plus design rules, mobile `test:ci` (11 suites, 181 tests), and the
   iOS and Android export. Wrote the evidence and the handoff.

## Next

- Independent review and the goal verifier, from the [handoff](handoff.md).
- Box 3 needs the procedure in `docs/evidence/DS-2/android-text-scaling.md`. It first needs request R1
  (`AppText`) and a specimen screen (R5).
- If this branch is resumed, start from the handoff's "Left undone" and "Requests" sections. Do not
  redo steps 1–7.

## Surprises

- Material Symbols (971 KB, Apache-2.0) ships in the Android bundle without any app import. The 002
  inventory missed it.
- Google Sans Flex's metrics (1.252 em) exceed M3's Display Large ratio. A plain 56/64 trims descenders
  on Android.
- RN 0.86 converts `lineHeight` from sp separately from `fontSize`. On Android 14+ a non-linear
  converter may shrink leading at 200%. Only a device can settle it.
- The existing `test-design-rules.cjs` still passes when `fontFamily` is removed from the guard (M1).
