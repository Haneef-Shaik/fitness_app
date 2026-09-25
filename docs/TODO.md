# TODO — after the release gate

**G10 is closed** (25 Sep 2026): the release gate's four lines in [charter §4](08-PROJECT-CHARTER.md#4-definition-of-done)
are ticked, each with its evidence, and **H10.1** is recorded in the
[handoff ledger](10-EXECUTION-GOALS.md#3--the-handoff-ledger). Milestone status lives in the
[tracker](09-PROJECT-TRACKER.md); this file holds only what is left.

---

## 1 · Needs the owner

- [ ] **Push `main`.** The build machine has no GitHub credentials, so every G10 commit — including
      the CI fixes for the red runs of `9781d3c` and `0a85d25` — exists only locally. Then watch the
      five CI jobs and trigger `e2e.yml` once (`workflow_dispatch`): its first GitHub run is its first
      real test. It passed as a dry run on the local emulator.

## 2 · Before a store listing — not in G10's charter

The release gate measured an installed release APK built for a laptop API. A **store build** now
exists as a mode of the same script, checked on the APK it produces:

- [x] A **release keystore** — `plugins/withReleaseSigning.js` signs release builds with the upload
      key named by `VOLT_UPLOAD_STORE_FILE` / `…_PASSWORD` / `VOLT_UPLOAD_KEY_ALIAS` / `…_PASSWORD`,
      never kept in the repo. Verified 25 Sep with a throwaway key: `apksigner` reports the upload
      certificate, and the build refuses the debug key
- [x] `usesCleartextTraffic` off — `STORE=1 bash scripts/build-release-apk.sh` regenerates the
      native project, skips the dev cleartext patch and fails if `aapt2` finds it in the APK; it
      refuses an `http://` API URL outright
- [ ] **A hosted API over HTTPS**, and the real upload key — the owner's: choosing a host and
      generating the key (keep it out of the repo and back it up; a lost upload key means a reset
      request to the store). Then: `STORE=1 API_URL=https://… VOLT_UPLOAD_…=… bash
      scripts/build-release-apk.sh`

## 3 · Dated

- [ ] **#15b** Shift+Tab cannot enter a text field (RN 0.76) — arrives with the Expo SDK that
      carries [react-native#48547](https://github.com/react/react-native/pull/48547) — *2026-12-15*.
      The owner kept the date rather than upgrade the SDK inside the release gate. Not a trap: Tab
      forward always leaves.
- [ ] **#28** With TalkBack's *Speak text formatting* on, every text is followed by its size and
      colour spans — re-test on that same SDK upgrade — *2026-12-15*

## Decided, and out of v1

- **H-17 barcode lookup** and branded products — Q1 was answered *internal catalog for v1*.

## Known limits, accepted

- A workout left unfinished on a phone **before local schema v2** is dropped by the migration.
  Queued writes from then are kept but belong to no account: Sync Center shows them under
  **Unattributed** and lets you discard them; they are never sent as whoever is signed in.
- Web is a development surface, not part of the release gate.
- The TalkBack pass was driven by keyboard (Alt+arrows), not by touch gestures — same traversal and
  speech, but touch exploration was not exercised ([how, and why](measurements/talkback-session.md)).
