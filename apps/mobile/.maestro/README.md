# Maestro flows

**D15** chose Maestro because it drives **Expo Go** over the LAN and needs no native
toolchain — there is no Xcode on the development machine ([DR4](../../docs/08-PROJECT-CHARTER.md#7-delivery-risks)).

## Running them

```bash
export PATH="$PATH:$HOME/.maestro/bin"
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home

# 1. the API, reachable from the phone (not localhost — the LAN address)
cd services/api && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2. Metro, so Expo Go can load the bundle
cd apps/mobile && npx expo start

# 3. open the app once on the device, then
maestro test apps/mobile/.maestro/
```

`java` is **not on PATH by default on this machine** — Homebrew's `openjdk@17` is
installed but unlinked, which is why `JAVA_HOME` is set above. Maestro needs it.

## What each flow proves

| Flow | Proves | Criterion |
|------|--------|-----------|
| `01-build-program` | A program persists with ≥2 prescribed exercises | **AC-01** |
| `02-record-sets` | Every set recorded, loads and reps match, indices dense | **AC-02** |
| `03-previous-performance` | Last time's sets are on screen **before any input** | **AC-04** |
| `04-offline` | Logging survives no network, and replay creates no duplicates | **AC-04 / DR4** |

## Why they are written against accessibility labels

Every selector below is an `accessibilityLabel` the app already sets for screen
readers. Testing through the same names a blind user navigates by means the flows
break when the app becomes unusable, rather than when a layout shifts — and it
keeps the labels honest, because a wrong one fails the build.
