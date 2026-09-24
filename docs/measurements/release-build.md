# Release build · measured

<!-- First reading taken by scripts/measure-release.sh on 24 Sep. The script
     stopped before its p95 half (the phone was disconnected), so this file was
     written from its printed trials; re-run the script to regenerate it. -->

The numbers TODO 2.2 said were unmeasured: an installed **release** APK
(`assembleRelease`, Hermes bytecode in the APK, no Metro, no Expo Go).

| | |
|---|---|
| **Cold start → dashboard with its data** | `median 1232 ms · best 1073 ms · worst 2522 ms · n=5` · budget < 2.5 s |
| Per trial | 2522 · 1265 · 1151 · 1073 · 1232 ms |
| Android's first frame (`am start -W` TotalTime) | 1196 · 944 · 807 · 698 · 693 ms |
| **tap → set rendered** | not yet measured on the release APK — see [commit-p95-prod.md](commit-p95-prod.md) for the production bundle |
| APK | 91.4 MB (all four ABIs, unsplit) |
| Device | SM-E546B, Android 16 |
| Measured | 2026-09-24 12:57 |

**Verdict: within budget.** Median 1.23 s against 2.5 s. The first trial
(2.52 s) is the first launch after install — Android's first-run verification
and a cold filesystem cache — and is kept, not dropped. The Expo Go dev figure
this replaces was a 5.97 s median, fetching and compiling a 14.5 MB bundle on
every launch.

**What the span covers.** From the process starting (logcat's `Start proc
…:com.volt.app/`) to the app logging `VOLT_DASHBOARD_READY` — the moment the
dashboard has its data, **including its API call over Wi-Fi** to the laptop —
both stamped by logcat, so no test driver is inside the span.

**An earlier method, discarded.** The same five launches timed with Maestro
(launch → `dashboard-date` visible) read 6.0–11.4 s against a first frame of
0.7–2.3 s: the driver's own launch handshake and polling were most of it. The
logcat span is the one reported.

**What differs from a store build.** Signed with the debug key;
`usesCleartextTraffic` on so it can reach the API on the LAN over HTTP; the
marker and the latency line are compiled in (`EXPO_PUBLIC_MEASURE=1`). None of
these is on the measured path. The native project is generated
(`expo prebuild`) and not committed.
