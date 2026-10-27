# DS-3 · Gates, TDD record and mutation checks

27 October 2026 · worktree `/Users/Adya/.codex/worktrees/fitlog-ds3-motion/fitness_app` · branch
`codex/fitlog-ds3-motion` · base `main` `c8a5d57` · **uncommitted working tree** (this phase was
told not to commit) · Node 22.23.1, pnpm 10.27.0 · Jest via jest-expo 57.0.6 (default platform
iOS). All of this is runtime proof in Jest only. No device, release build or native export was run.

## Environment

```text
rtk proxy pnpm install --frozen-lockfile
  Lockfile is up to date, resolution step is skipped
  Packages: +1095 … Done in 11.7s using pnpm v10.27.0
```

No package or lockfile change: `git status --short` shows only
`M apps/mobile/src/features/training/WorkoutScreen.tsx` and `?? apps/mobile/src/motion/`, plus the
DS-3 docs.

## TDD record (honest order)

- Phase 1 (an earlier session in this run) had no shell: every Bash call was denied, so nothing
  could be installed or run. The motion source files were drafted then, **before** their tests could
  be executed, and nothing was committed. Test-first order therefore **cannot** be shown for the
  `src/motion/*.ts(x)` sources. To show each guard's test can fail, every one was mutation-checked
  (M1–M13 below).
- Phase 2 (this session): tests written, then run.
  - **RED**, before touching `WorkoutScreen.tsx`:
    `jest --ci src/motion` → `Tests: 1 failed, 48 passed, 49 total`. The failure was
    `set commit feedback › confirms a logged set only after the durable local write, with no spinner
    while it is written`: `expect(element).not.toBeBusy() — Received element is busy:
    accessibilityState {"busy": true, "disabled": true}`.
  - **GREEN** after the `WorkoutScreen.tsx` change:
    `jest --ci src/motion` → `Test Suites: 6 passed, 6 total · Tests: 49 passed, 49 total`.
  - Mutation M1 at first **survived**: the fake re-rendered after the effect, so the first-frame
    flash was invisible. The fake now records every frame drawn, the Reduce Motion tests assert that
    only the end state was ever drawn, and M1 then failed as it should.

## Final gate results (after all fixes)

```text
rtk proxy pnpm --filter @fitlog/mobile test:ci
  Test Suites: 13 passed, 13 total
  Tests:       176 passed, 176 total
rtk proxy pnpm --filter @fitlog/mobile typecheck
  tsc --noEmit   (exit 0, no output)
rtk proxy pnpm --filter @fitlog/mobile lint
  eslint . --max-warnings=0 && node scripts/test-design-rules.cjs
  Design rules verified: raw visual values fail; semantic tokens pass.
```

Not run in this phase, by instruction (no full all-suite or builds while lanes run in parallel):

- `pnpm check`. Its other parts are the domain tests, planner tests and the plan build check, and
  this diff touches none of their inputs (no `packages/`, `scripts/plan/`, `GOALS.md` or
  `ACCEPTANCE.md` change).
- The `expo export --platform ios --platform android` gate, required because `apps/mobile/`
  changed. One risk is worth noting: no route imports `@/motion`'s Reanimated primitives yet. The
  logger imports only `@/motion/moments`, which does not load Reanimated, so the exported bundle's
  module graph gains only `moments.ts` and `haptics.ts`.
- `pnpm backend:test`: not required; the diff touches no `supabase/`, `packages/domain/`,
  `scripts/backend/` or `src/data/` file.

## Mutation checks (each guard broken on purpose, then restored)

| # | Guard (file) | How it was broken | Named test that failed |
|---|---|---|---|
| M1 | First frame under Reduce Motion (`useSpringValue.ts`) | `useSharedValue(from ?? target)` | Pop › *with Reduce Motion on, renders its end state on the first frame…* and Rise › *…renders in place on the first frame…* (frames drew `scale 0.6` / `translateY 28` first) |
| M2 | Mid-animation jump (`useSpringValue.ts`) | Removed `value.set(target)` in the reduced branch | Pop › *jumps to its end state when Reduce Motion turns on mid-animation*; Rise › *jumps into place…* |
| M3 | Press under Reduce Motion (`usePressScale.ts`) | Removed `if (reduced) return;` | usePressScale › *with Reduce Motion on, keeps full size…* (a 0.94 timing was scheduled) |
| M4 | Never from scale 0 (`tokens.ts` `popScale`) | `Math.min(1, from)` | Pop › *never starts from scale 0*; tokens › *never pops from scale 0…* |
| M5 | No haptic without words (`moments.ts`) | Removed `if (!text) return false;` | moments › *never plays a haptic without words to show and speak* |
| M6 | Haptic failure contained (`haptics.ts`) | `void driver(kind)` without `.catch(report)` | playHaptic › *reports a failed haptic instead of passing it to the caller* |
| M7 | Set logged = CONFIRM (`moments.ts`) | `setLogged: { haptic: 'success' }` | set commit feedback › *confirms a logged set only after…* (received `notification success`, expected `impact light`) |
| M8 | Change beats slow first answer (`reduced-motion.ts`) | Dropped `!heardChange` | reduced motion store › *never lets a slow first answer overwrite a newer change* |
| M9 | Late answer after detach ignored (`reduced-motion.ts`) | Dropped `generation++` on detach | reduced motion store › *subscribes to the platform once, detaches…and ignores a late answer* |
| M10 | Mass 1 (`tokens.ts`) | `SPRING_MASS = 4` | tokens › all five *…at mass 1* cases |
| M11 | Feedback only after durable ack (`WorkoutScreen.tsx`) | Moved `signalMoment` before `await store.logSet` | set commit feedback › both tests (haptic recorded while the write was in flight, and on a failed write) |
| M12 | Live setting wins (`ReducedMotionProvider.tsx`) | Returned only the launch reading | useReducedMotion › all three tests |
| M13 | Inline token does not restart the spring (`useSpringValue.ts`) | Effect keyed on the token object | useSpringValue › *does not restart the spring when re-rendered with an equal inline token* |

After restoring M1–M13, the final gate runs above passed.
