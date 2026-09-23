# tap → set rendered · measured

<!-- Written by scripts/measure-p95.sh. Re-run it rather than editing this. -->

| | |
|---|---|
| **Reading** | `tap → rendered · p50 184.8 ms · p95 296.5 ms · worst 310.4 ms · n=99 · OVER BUDGET` |
| Device | SM-E546B, Android 16 |
| Build | Expo Go over LAN, `__DEV__` (a release build can only be faster) |
| Flow | `measure-commit-p95.yaml` |
| Measured | 2026-09-23 16:32 |
| Budget | p95 < 100 ms (D16) |

**What the span covers.** `performance.now()` at the top of the tap handler, to a
`requestAnimationFrame` inside `runAfterInteractions` after the commit — so it
includes validate → reduce → publish → paint, and excludes the upload, which is
not on the commit path (I10).

**Why a dev build.** DR4 rules out a release build on this machine. The number is
therefore pessimistic: it carries the dev bundle's overhead. It is reported as
measured rather than adjusted.
