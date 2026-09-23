# cold start → dashboard · measured

<!-- Written by scripts/measure-cold-start.sh. Re-run it rather than editing this. -->

| | |
|---|---|
| **Reading** | `median 5973 ms · best 5669 ms · worst 6343 ms · n=5` |
| Device | SM-E546B, Android 16 |
| Build | **Expo Go over LAN, `__DEV__`** |
| Expo Go's first frame | `+625ms +713ms +479ms +585ms +596ms ` (Android's own `Displayed` figure, per trial) |
| Budget | < 2.5 s to interactive |
| Measured | 2026-09-23 17:45 |

**What the span covers.** From the moment Maestro asks Expo Go to open the app
(the app already stopped) to `dashboard-date` being on screen — Expo Go
starting, **the JS bundle being fetched from Metro over Wi-Fi and compiled on the
phone**, React mounting, the dashboard's single request returning, and the date
painting.

**Why this is not the release number, and is not comparable to the budget.**
The dev bundle fetched on every trial is **14.5 MB of unminified JavaScript**
(14,503,229 bytes, served by Metro), which Hermes then has to compile on the
device. A release build instead loads [4.33 MiB of precompiled Hermes
bytecode](bundle-size.md) from the APK and fetches nothing. DR4 rules out a
release build on this machine, so this reading is an **upper bound**, and the
release figure is **unmeasured**.

**The two numbers.** *First frame* is Android's own `Displayed` figure — Expo Go
drawing its first frame, ~0.6 s. *To the dashboard* is this app being usable.
How the ~5.4 s between them splits between download, on-device compilation,
mounting and the API call has **not** been broken down; no part of it is
claimed to be the dominant one.

**Resolution.** The span is bracketed by `Date.now()` inside one Maestro run
([measure-cold-start.yaml](../../apps/mobile/.maestro/measure-cold-start.yaml)),
whose on-device driver checks the screen every few hundred ms — so a reading is
good to well under a second. A first attempt polled from the host with
`maestro hierarchy` and was useless: each call costs ~20 s of JVM and driver
start-up, so it measured the poll, not the app. Raw `uiautomator dump` returns
an empty tree for this app and cannot be used at all.
