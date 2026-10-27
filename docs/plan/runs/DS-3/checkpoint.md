# Checkpoint — DS-3 · Motion and haptics

Attempt 1 · branch `codex/fitlog-ds3-motion` · base `main` `c8a5d57` · 27 October 2026 ·
**uncommitted working tree** (this phase was told not to commit).

## Where it stands

Implementation, tests, evidence and the handoff are done and ready for independent review. Nothing
is committed, and the status files were not touched.

## Steps done

1. Read the card, PRD §§19.1 and 23.1, docs/22 §5, docs/23 §§5, 7 and 9, the animate-expo skill and
   recipes, and the existing source. Confirmed QA-1 Done in `status.json`. DS-3 has no ledger rows.
2. Phase 1: Bash was denied for the whole session, so the `src/motion/` source files and the Reanimated
   test fake were drafted without being able to run anything.
3. Phase 2: shell available through `rtk proxy`. Frozen install (lockfile unchanged). Wrote the six test
   suites. RED on the set-commit test (spinner busy during the write), then the minimal
   `WorkoutScreen.tsx` change, then GREEN.
4. Mutation checks M1–M13, all failing a named test. M1 first survived, so the fake now records every
   frame drawn and the tests were strengthened.
5. Self-review fix: `useSpringValue` is keyed on the token's numbers (M13 guards it).
6. Final: mobile Jest 13 suites / 176 tests, typecheck and lint with the design guard all pass.
7. Evidence in `docs/evidence/DS-3/`: `motion-inventory.md`, `set-commit-trace.md`, `gates.md`.
   Handoff written.

## Next step (for whoever resumes)

- Independent review (code, security and TDD), as the coordinator arranges.
- At integration: commit with goal-id subjects, run `pnpm check` and the
  `expo export --platform ios --platform android` gate. Both were deferred in this phase by
  instruction.

## Surprises

- Reanimated 4 defaults a spring's mass to 4. Momentum's table is specified at mass 1, so mass is
  passed explicitly.
- Reanimated's `useReducedMotion` reads the setting once at launch. The shared hook follows
  `AccessibilityInfo` live instead.
- The logger's Log set button showed a spinner during the local write: an animation before the
  durable acknowledgement. It was removed.
- The logger fired a SUCCESS haptic for set logged. docs/22 §5 says CONFIRM.
