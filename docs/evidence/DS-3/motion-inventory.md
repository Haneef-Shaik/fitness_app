# DS-3 · Motion inventory and Reduce Motion coverage

27 October 2026 · branch `codex/fitlog-ds3-motion` from `main` `c8a5d57` · method: source review
of `apps/mobile/src` plus Jest runs (see `gates.md`). Nothing here comes from a device. How the
motion feels must still be judged on a release build on the reference low-end Android (docs/22 §5).

## What moved in the app before DS-3

A search of `apps/mobile/src` for `react-native-reanimated`, `Animated.`, `LayoutAnimation`,
`withSpring`/`withTiming`, `entering`/`exiting` and `animation:` found **no app-owned animation**.
Reanimated 4.5.1 and react-native-worklets 0.10.1 were installed but never imported. What does move:

| Element | Where | Kind | Reduce Motion handling | Owner |
|---|---|---|---|---|
| Native-stack push transition | `src/app/_layout.tsx` (root `Stack`) and `src/app/gym/[gymId]/_layout.tsx` | Platform screen transition | Not yet switched. `stackAnimation(useReducedMotion())` from `@/motion` returns `'none'` under Reduce Motion (tested). Requested for DS-5, so both stacks change in one place | S3 (root) and S5 (gym), via DS-5 |
| Tab switches | `(member)/_layout*.tsx`, `gym/[gymId]/(tabs)/_layout*.tsx` | `NativeTabs` (native) and `Tabs` (web), no slide | Nothing to remove: tabs don't slide | — |
| `ActivityIndicator` | `AppButton` (loading), `_layout.tsx` (font load), `MemberProvider` (data load) | System indeterminate progress indicator | Platform-owned. It has no end state to jump to, and iOS and Android keep their own spinners under Reduce Motion. DS-3 removed the one on the set-commit path (see `set-commit-trace.md`) | S3 |
| `ProgressRing` | `src/ui/ProgressRing.tsx` | Static SVG, no animation yet | Nothing to remove. The Momentum ring draw-in (0.8 s) is DS-4 work and should build on `useSpringValue` | S3 / DS-4 |

## The DS-3 motion system (`apps/mobile/src/motion/`)

| Piece | What it is | Reduce Motion behaviour | Test |
|---|---|---|---|
| `tokens.ts` | The five docs/22 §5 springs (ratio and stiffness, at mass 1), press 0.94/100 ms, pop 0.6 (never from 0), rise 28 dp/60 ms, banner hold 2 s, ease-out curve | — | `tokens.test.ts` |
| `useReducedMotion` | The one shared answer. It follows `AccessibilityInfo` live, and uses Reanimated's launch reading until the first answer arrives | — | `reduced-motion.test.tsx` |
| `useSpringValue` | The core: a shared value that springs to its target on the UI thread | Holds the target from the first frame. Switching Reduce Motion on mid-animation jumps it there | Covered through each primitive below |
| `Pop` | Grows content into place once (logged chip, check badge, record burst) | Only the end state is ever drawn, and no animation is scheduled | `primitives.test.tsx` › Pop |
| `Rise` | Card or banner entrance, staggered 60 ms | Only the end state is ever drawn, and no animation is scheduled | `primitives.test.tsx` › Rise |
| `usePressScale` | Press feedback | Stays at scale 1 through a press, and no animation is scheduled | `primitives.test.tsx` › usePressScale |
| `haptics.ts` / `moments.ts` | Confirm and success haptics, mapped to the four Momentum moments | Haptics aren't motion, so they still play. Every moment is also spoken, and the screen shows its visual | `haptics.test.ts`, `moments.test.ts` |

Three animated primitives, one Reduce Motion test each, and a mid-animation switch test for each.

## Decisions

- **Reduce Motion means "end state at once".** No fade is kept either: PRD §23.1 says spatial and
  celebration motion become immediate state changes, and DS-3's first box asks for the end state at once.
- **The setting is followed live.** Reanimated's `useReducedMotion` reads the setting only at launch
  (its own docs say a change does not re-render), so it is used only as the starting value.
- **Springs pass mass 1 explicitly.** Reanimated 4's default mass is 4. The docs/22 table's damping
  values (33.9, 31.2, 22.6, 80, 123) only hold at mass 1.
- **Reanimated's own `ReduceMotion.System` stays at its default** as a second safety net. In the one
  case where it is out of date (Reduce Motion switched off after launch), it can only give less motion.
