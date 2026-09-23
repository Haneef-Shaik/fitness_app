# JS bundle size · measured

<!-- Re-measure: cd apps/mobile && pnpm exec expo export --platform android --output-dir <dir> -->

| | |
|---|---|
| **Hermes bytecode** (`entry-*.hbc`) | **4,535,659 bytes** (4.33 MiB) |
| Same, gzipped | 1,829,073 bytes (1.74 MiB) |
| Bundled assets | 3,706,851 bytes across 59 files |
| Export total | 8,212 KB |
| Build | `expo export --platform android`, production (minified, Hermes) |
| Measured | 2026-09-23, G10 |

**No budget is set** — `docs/03` §9 asks for the size to be *tracked*, not held
under a number. This is the first reading, so it is the baseline: a later
reading is compared to this one.

**Why it matters for cold start.** A release build loads this bytecode from the
APK. The Expo Go runs used for every other hardware number here instead fetch a
**14.5 MB unminified dev bundle** from Metro over Wi-Fi on each launch and compile
it on the phone — which is why the dev-mode [cold-start figure](cold-start.md)
cannot stand in for the release one.
