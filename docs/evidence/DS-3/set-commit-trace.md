# DS-3 · Set-commit path trace: durable acknowledgement before any feedback

27 October 2026 · branch `codex/fitlog-ds3-motion` from `main` `c8a5d57` · method: source trace plus
a Jest integration test that drives the real logger over the real member store. This is not a device
timing. The p95 budget for tapping Log set to a durable write (under 100 ms) is measured by MB-3 and
SC-1 on a release build.

## The path, in order

1. **Tap Log set.** `WorkoutScreen.tsx` `SetEntry.log()`. The `committing` ref blocks a double tap.
   Nothing visual changes: `setError('')` is a no-op when there is no error, and there is no
   spinner (see below).
2. **`await store.logSet(...)`** (`src/data/member-store.ts`). Serialized. It validates the set, then
   `saveSession` → `persist` → `await cache.write(data, operations, drafts)`, the encrypted local
   write. Only after the write resolves does `notify()` publish the new snapshot. Only after that
   does `logSet` resolve.
3. **Durable acknowledgement.** `durable = true` is set only after `logSet` resolves. A rejected
   write lands in `catch`: an error is shown, and there is no feedback or chip.
4. **Feedback, after the acknowledgement only.** `signalMoment('setLogged', t('setLogged'))` speaks
   "Set saved" through TalkBack or VoiceOver and plays the CONFIRM haptic. Android uses
   `performAndroidHapticsAsync(Confirm)`; iOS uses a light impact. This is fire and forget, and a
   haptic failure never reaches the logger.
5. **The visual.** The new tonal set chip appears because the store notified after the write in
   step 2. It cannot render earlier.
6. **`void store.sync()`.** The network is never awaited on this path.

## What DS-3 changed on the path

| Before | After | Why |
|---|---|---|
| `AppButton loading={busy}` showed an `ActivityIndicator` from tap until the write resolved | No spinner; the double tap is still blocked by the ref | A spinner is an animation running before the durable acknowledgement, and at a sub-100 ms write it flickers on every set (PRD §23.1: "no flashing") |
| `Haptics.notificationAsync(Success)` after the write | `signalMoment('setLogged', …)`: the CONFIRM haptic, plus the spoken "Set saved" | docs/22 §5 maps set logged to CONFIRM; SUCCESS belongs to rest end, PR and check-in. The haptic gains a non-haptic equivalent |
| Haptic and sync inside `try` | Feedback and sync after the `try` | A feedback problem can never be reported as a failed save |

## Test evidence

`apps/mobile/src/motion/__tests__/set-commit-feedback.test.tsx`:

- *confirms a logged set only after the durable local write, with no spinner while it is written.*
  The cache write is held open. While it is in flight there are no haptic calls, no announcement,
  no chip, and the button is not busy. After the write resolves, exactly one light impact plays
  (iOS, jest-expo's default platform), "Set saved" is announced once, and the chip appears.
- *gives no logged feedback when the durable write fails.* A rejected write shows "Storage full",
  plays no haptic, announces nothing, shows no chip and stores no set.

Results are in `gates.md`. Without the WorkoutScreen change, the first test failed on
`not.toBeBusy()` (RED). Moving `signalMoment` before the `await` fails both tests (mutation M11).
