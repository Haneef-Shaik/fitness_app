# Release build · measured

<!-- Written by scripts/measure-release.sh. Re-run it rather than editing this. -->

The numbers TODO 2.2 said were unmeasured: an installed **release** APK
(`assembleRelease`, Hermes bytecode in the APK, no Metro, no Expo Go).

| | |
|---|---|
| **Cold start → dashboard** | `median 956 ms · best 903 ms · worst 1108 ms · n=5` · budget < 2.5 s |
| Android's first frame | `+823ms +655ms +650ms +720ms +671ms ` |
| **tap → set rendered** | `tap → rendered · p50 61.6 ms · p95 80.7 ms · worst 95 ms · n=99 · within budget` · budget p95 < 100 ms (D16) |
| APK | 114112131 bytes |
| Device | SM-E546B, Android 16 |
| Measured | 2026-09-26 20:42 |

**What differs from a store build.** Signed with the debug key, and
`usesCleartextTraffic` is on so it can reach the API on the LAN over HTTP; the
reading line is compiled in (`EXPO_PUBLIC_MEASURE=1`). None of these is on the
measured paths.

**What the spans cover.** Cold start: from the process starting (logcat's
`Start proc`) to the app logging `FITLOG_DASHBOARD_READY` — the moment the
dashboard has its data, including its one API call over Wi-Fi — both stamped
by logcat. *First frame* is `am start -W`'s TotalTime.
tap → set: `performance.now()` at the top of the tap handler to a frame after
the commit (commitTiming.ts), excluding the upload (I10).
