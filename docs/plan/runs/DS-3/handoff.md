# Handoff — DS-3 · Motion and haptics        attempt 1 · `codex/fitlog-ds3-motion` · base `c8a5d57` (uncommitted)

27 October 2026. Implementer: local Claude, under the Codex coordinator (AUTH-01). The working tree
is **uncommitted** because this phase was told not to commit. HEAD is still `c8a5d57`. The diff is
`git status`: `M apps/mobile/src/features/training/WorkoutScreen.tsx`, new
`apps/mobile/src/motion/`, new `docs/evidence/DS-3/` and `docs/plan/runs/DS-3/`.

**Outcome claimed.** The app now has one motion system (`@/motion`). It has the five Momentum spring
tokens at mass 1, and one shared `useReducedMotion` that follows the setting live. Three animated
primitives (`Pop`, `Rise`, `usePressScale`) draw only their end state under Reduce Motion. Confirm
and success haptics map to the four Momentum moments, and each is also spoken and has an on-screen
visual. The set logger now gives feedback only after the durable local write, with no spinner and
the correct CONFIRM haptic.

## Done when

| Box (verbatim) | Met | Evidence |
|---|---|---|
| Spring tokens and a shared `useReducedMotion` exist, and with Reduce Motion on every animated primitive renders its end state at once (one test per primitive) | yes (Jest) | Tokens: `src/motion/tokens.ts`, tested by `tokens.test.ts`, which pins all five docs/22 §5 values and mass 1. Hook: `src/motion/ReducedMotionProvider.tsx` and `reduced-motion.ts`, tested by `reduced-motion.test.tsx` (10 tests: live changes, race, failure, detach, AccessibilityInfo wiring, launch fallback). One Reduce Motion test per primitive in `primitives.test.tsx`: Pop › *with Reduce Motion on, renders its end state on the first frame and schedules no animation*; Rise › *…renders in place on the first frame…*; usePressScale › *…keeps full size through a press…*. Each asserts the only frame drawn is the end state, and that nothing was scheduled. Each also has a mid-animation switch test. The app had no animated primitives before this goal (`docs/evidence/DS-3/motion-inventory.md`). Command: `rtk proxy pnpm --filter @fitlog/mobile test:ci` → `Tests: 176 passed, 176 total` |
| Haptics map to moments (confirm on set logged; success on rest end, PR and check-in), each with a non-haptic equivalent, and are tested | yes (Jest), with call sites for three moments pending | Map: `src/motion/moments.ts`, tested by `moments.test.ts` › *%s plays %s once, and is also spoken and shown as %s* (four cases). Each moment speaks its message through `announceForAccessibility` and names its on-screen visual; a blank message plays nothing. Platform mapping in `haptics.test.ts`: Android `performAndroidHapticsAsync(Confirm)`, iOS light impact, success notification, silent on web. Live call site: set logged in `WorkoutScreen.tsx`, tested end to end in `set-commit-feedback.test.tsx`. **Rest end, PR and check-in have no call site yet.** Their screens belong to SC-1 (E-04 rest, E-11 PR) and G19.app (check-in), which call `signalMoment('restEnded' / 'personalRecord' / 'checkedIn', t(…))` |
| No animation runs on the set-commit path before the durable acknowledgement (test or trace in the handoff) | yes (Jest plus trace) | Trace: `docs/evidence/DS-3/set-commit-trace.md`. Test: `set-commit-feedback.test.tsx` › *confirms a logged set only after the durable local write, with no spinner while it is written*, which holds the real store's cache write open and asserts no haptic, no announcement, no chip and a button that isn't busy; and › *gives no logged feedback when the durable write fails*. RED before the change (`not.toBeBusy` failed); mutation M11 fails both tests |

## Acceptance evidence

`status.mjs`/`ACCEPTANCE.md` list no ledger row for DS-3. No row was written. Reduced-motion
journeys (AC31) and accessibility audits belong to SC-6 and QA goals.

## Gates

| Gate | Command | Result |
|---|---|---|
| Frozen install | `rtk proxy pnpm install --frozen-lockfile` | `Lockfile is up to date` · `Done in 11.7s`; no lockfile or package change |
| Mobile tests | `rtk proxy pnpm --filter @fitlog/mobile test:ci` | `Test Suites: 13 passed, 13 total` · `Tests: 176 passed, 176 total` |
| Types | `rtk proxy pnpm --filter @fitlog/mobile typecheck` | `tsc --noEmit`, exit 0 |
| Lint and design guard | `rtk proxy pnpm --filter @fitlog/mobile lint` | `Design rules verified: raw visual values fail; semantic tokens pass.` |
| `pnpm check` | not run | Deferred by instruction (no full all-suite in this parallel phase). Its other parts (domain, planner, plan build) have no input in this diff |
| Native JS export | not run | Deferred by instruction (no builds in this phase). It is required at integration because `apps/mobile/` changed. Only `moments.ts` and `haptics.ts` are reachable from routes; the Reanimated primitives aren't imported by any screen yet |
| `pnpm backend:test` | not required | No `supabase/`, `packages/domain/`, `scripts/backend/` or `src/data/` change |

Full detail and the TDD record: `docs/evidence/DS-3/gates.md`.

## Inherited and used

| From | Claim | Held? |
|---|---|---|
| QA-1 (Done, `67e6d1c`) | Foundation on `main`; mobile Jest, typecheck and lint gates work | Yes. All three ran green on this branch |
| `member-store.ts` (MB-3 existing work) | `logSet` resolves only after `cache.write` | Yes, by source trace and by the held-write test |
| `package.json` | expo-haptics 57.0.3, Reanimated 4.5.1 and worklets 0.10.1 installed | Yes. APIs checked against the installed type definitions: `performAndroidHapticsAsync`, `AndroidHaptics.Confirm`, `SpringConfig` (default mass 4), launch-only `useReducedMotion` |
| i18n catalog | `setLogged` ("Set saved" / "सेट सेव हुआ") exists in both locales | Yes. It was unused until now; no catalog change was needed |

## Mutation checks

Thirteen guards were each broken and caught by a named failing test, then restored. The full table
is in `docs/evidence/DS-3/gates.md`: first frame (M1), mid-animation jump (M2), press (M3), never
from 0 (M4), no haptic without words (M5), contained haptic failure (M6), set logged = CONFIRM (M7),
change beats slow answer (M8), late answer ignored (M9), mass 1 (M10), feedback after durable ack
(M11), live setting wins (M12), inline token stability (M13). M1 first **survived** a weaker test;
the fake and tests were strengthened until it failed.

## Review findings left open

Sub-agent reviews (code-reviewer, security-reviewer, tdd-guide) were **not run**. This phase was
told "no nested subagents; independent review follows". Self-review fixed one finding (inline-token
restart, now guarded by M13). Left open, all low:

- low · `src/motion/moments.ts:47` · `announce` isn't wrapped in try. React Native's
  `announceForAccessibility` calls an optional native module and does not throw, and haptic failures
  are already contained.
- low · `member-store.ts` duplicate-mutation early return would let `log()` signal a second time. It
  can't be reached from the UI: the ref blocks re-entry, and the mutation id rotates after every
  durable success.
- low · Test-first order can't be shown for the `src/motion` sources (phase 1 had no shell).
  Mutation checks M1–M13 stand in for it.
- info · The tests use a Reanimated fake (`__tests__/reanimated-fake.ts`). It proves our scheduling
  and first-frame logic, not native rendering or feel, which need a release build on the reference
  Android.

Security and privacy, by source review: no data access, network, storage, secrets or new
permissions. Android CONFIRM uses the system haptics engine (no VIBRATE). The spoken message is the
fixed string "Set saved", with no load, reps or other health values. Nothing changes what gym staff
can read.

## Left undone, and why

- The rest-end, PR and check-in call sites: their screens are SC-1 and G19.app.
- Switching the native-stack transitions to `none` under Reduce Motion: the root layout is S3's and
  the shell is DS-5's (request below).
- `pnpm check` and the native export: deferred by this phase's instruction to integration.
- No commits: this phase was told not to commit.

## Found for other goals

- **SC-1:** wire `signalMoment('restEnded', …)` when the rest deadline passes (not on skip), with a
  visible "rest over" state, plus `'personalRecord'` once per real record (PRD §8.2: provisional, never
  replayed on edits). The new strings go through `t()`. Optionally use `Pop` for the newly logged chip
  (docs/22: 0.6 → 1).
- **G19.app:** `signalMoment('checkedIn', t(…))` after a durable check-in result, with the check
  badge (`Pop from={0.4}`).
- **DS-4:** build the ring draw-in, wavy progress and press feedback on `useSpringValue`,
  `usePressScale`, `Pop` and `Rise`. Each component's Reduce Motion test can use
  `fixedReducedMotionStore(true)` and the frame-recording fake.
- **SC-6 / MB-1:** pass the member's sound and haptics preference (PRD §5.3) to
  `createMomentFeedback({ hapticsEnabled })`.

## Requests for other lanes' files

- **S3 / DS-5** (`src/app/_layout.tsx`, and the gym stack `src/app/gym/[gymId]/_layout.tsx` together
  with S5): add `animation: stackAnimation(useReducedMotion())` to both `Stack` `screenOptions`, so
  screen changes are immediate under Reduce Motion (PRD §23.1).
- **S7 / QA-9** (`apps/mobile/jest.config.cjs`): add `src/motion/**/*.{ts,tsx}` (excluding
  `__tests__`) to `collectCoverageFrom` so the ratchet covers it.
- **S3 / SC-1** (`WorkoutScreen.tsx`): this goal changed `SetEntry.log()` and the Log set button
  minimally (no spinner during the local write; feedback after the try). Keep that ordering when the
  logger is rebuilt. `set-commit-feedback.test.tsx` guards it.

## Decisions forced (for the tracker decision log)

1. **Reduce Motion = end state at once**, with no fade kept (PRD §23.1 over the generic skill's
   "fewer and gentler").
2. **No spinner on Log set during the local write.** It is an animation before the durable
   acknowledgement, and a flicker at a sub-100 ms write. The double tap stays blocked by the ref.
3. **Set logged plays CONFIRM, not SUCCESS** (docs/22 §5). Android uses
   `performAndroidHapticsAsync(Confirm)`, iOS a light impact; the web is silent.
4. **Springs at mass 1**, passed explicitly (Reanimated 4's default is 4).
5. **A moment can't play a haptic without a spoken and shown message** (the haptic is never the only
   feedback).

## Traps hit

- In phase 1 every Bash call was denied, `rtk` and plain forms alike. In phase 2, `rtk proxy …` worked
  for git status/log/diff and pnpm, but `rtk proxy git branch` and `rtk proxy ls` were denied.
- Reanimated's official Jest mock rebuilds shared values on every render, so it can't tell "jumped"
  from "animated". A purpose-built fake was needed, and it had to record every drawn frame before M1
  could be caught.


## Independent acceptance — 27 October 2026

Codex independently reviewed the local Claude implementation and ran frozen install, full
`pnpm check` (235 tests total) and iOS/Android JS exports on Node22.23.1. All pass.
Verdict: `docs/evidence/DS-3/verdict-attempt-1.json`; details in independent-verification.md.
All3 boxes are met for this shared system; future screen wiring retains its named owners.
Commit/integration are now authorized by the owner's explicit review-and-merge instruction.
