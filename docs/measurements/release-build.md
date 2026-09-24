# Release build · measured

<!-- Written by scripts/measure-release.sh. Re-run it rather than editing this. -->

The numbers TODO 2.2 said were unmeasured: an installed **release** APK
(`assembleRelease`, Hermes bytecode in the APK, no Metro, no Expo Go).

| | |
|---|---|
| **Cold start → dashboard** | `median 1019 ms · best 948 ms · worst 1481 ms · n=5` · budget < 2.5 s |
| Android's first frame | `+1024ms +747ms +667ms +648ms +697ms ` |
| **tap → set rendered** | `tap → rendered · p50 54.7 ms · p95 67.4 ms · worst 79.3 ms · n=99 · within budget` · budget p95 < 100 ms (D16) |
| APK | 95832546 bytes |
| Device | SM-E546B, Android 16 |
| Measured | 2026-09-24 23:26 |

**What differs from a store build.** Signed with the debug key, and
`usesCleartextTraffic` is on so it can reach the API on the LAN over HTTP; the
reading line is compiled in (`EXPO_PUBLIC_MEASURE=1`). None of these is on the
measured paths.

**What the spans cover.** Cold start: from the process starting (logcat's
`Start proc`) to the app logging `VOLT_DASHBOARD_READY` — the moment the
dashboard has its data, including its one API call over Wi-Fi — both stamped
by logcat. *First frame* is `am start -W`'s TotalTime.
tap → set: `performance.now()` at the top of the tap handler to a frame after
the commit (commitTiming.ts), excluding the upload (I10).
