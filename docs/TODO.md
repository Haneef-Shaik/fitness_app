# TODO — what is left before the stores

> **The full path to publishing is [11-LAUNCH-PLAN.md](11-LAUNCH-PLAN.md)**, item by item with its
> evidence. This file is the short version: what only the owner can do, and what is dated.
> Milestone status lives in the [tracker](09-PROJECT-TRACKER.md).

**G11 (26 Sep 2026)** closed every *Build* item of the launch plan that code can close: the MVP
requirement gaps, account recovery and security, privacy and legal surfaces, rate limiting,
production infrastructure, the Expo SDK 57 upgrade (target API 36), the Play App Bundle, the food
and exercise content, supersets, imports from Strong / Hevy / MyFitnessPal, push, feedback,
product metrics and Apple Health / Health Connect — and a whole-branch security review with every
finding fixed. What remains needs
an account, a decision, money or a device.

---

## 1 · Needs the owner — in the order that unblocks the most

1. **Merge `launch/g11-readiness` into `main`** — G10 and G11 are committed and pushed on that
   branch; CI runs on a PR or on `main`, so open the PR, watch it go green, merge, and trigger
   `e2e.yml` once. Turn on branch protection.
2. **Decisions** in [launch plan §0](11-LAUNCH-PLAN.md#phase-0--decisions-the-owner-must-make-first):
   L2 (container host), L5 (barcode scanning — the one parity gap left open), L6 (paid tier /
   AI quota), L7 (launch scope), L8 (name and trademark). L1 (Supabase) and L3 (email: Resend) are
   built for.
3. **Accounts:** Supabase (Pro, staging + production), the container host, Resend (verified sending
   domain → `EMAIL_FROM`), Sentry, Anthropic key with a spend limit, Expo/EAS (`eas init` → project
   id, which also switches push on), Play Console ($25), Apple Developer ($99/yr).
4. **Hosting** by the runbook, [12-DEPLOYMENT.md](12-DEPLOYMENT.md): secrets, domain + HTTPS,
   `TRUSTED_PROXY_COUNT`, `ADMIN_TOKEN`, backups, **one restore drill**, uptime check, spend alerts.
5. **The real upload key** — generate, keep out of the repo, back it up twice; then
   `STORE=1 API_URL=https://… FITLOG_UPLOAD_…=… bash scripts/build-release-apk.sh` (or EAS).
6. **Legal:** finish the drafts at `/legal/privacy` and `/legal/terms` (every `[OWNER: …]` marker),
   support email, and a landing page; then the store forms drafted in
   [13-STORE-LISTING.md](13-STORE-LISTING.md).
7. **Artwork:** the real icon (replace the placeholders from `apps/mobile/scripts/make-icons.py`)
   and the Play feature graphic. The Android phone screenshots exist
   (`docs/store/screenshots/android/`, re-taken by `scripts/store-screenshots.sh`); the iPhone
   sets wait for the iOS build.
8. **Beta:** TestFlight, and Google Play's **12 testers × 14 days** closed test — start it the day a
   build talks to staging.

## 2 · Needs a device

- [ ] **iOS**: the first build (EAS), then prove D14 on an iPhone (kill mid-set, reopen) and a
      VoiceOver pass.
- [x] **Tap-to-set p95 on SDK 57** — **80.7 ms** on the phone (26 Sep, release APK, n=99; cold
      start 956 ms). The first reading was **164.6 ms, over budget**: G11's set editing had
      re-rendered every row on every commit. Fixed, with a test that fails if it comes back.
- [x] **#15b** Shift+Tab into a text field — **fixed and verified** (26 Sep) on the emulator's
      hardware keyboard: RN 0.86 lets a field take focus itself, so the old focus bridge was
      removed (it had become a second, invisible stop going backwards). Sign-in and the logger's
      load / reps: one stop per field, both directions, typing lands.
- [ ] **#28** (TalkBack formatting spans) — re-test on the phone with *Speak text formatting* on.
      Dated **2026-12-15**.
- [ ] Walk the new screens on the phone once: E-06, E-07, E-12, supersets, K-03, K-04, K-07, K-08,
      K-10, the imports, and a reset / verify link opened from a real inbox.
- [ ] **K-09 on real hardware:** Apple Health on an iPhone (both switches, a finished workout
      in the Health app), and one weigh-in from a real smart scale imported on each platform.
      Health Connect's write path and permission sheet are proven in the emulator; its read
      path has only met an empty store.

## Decided, and out of v1

- **H-17 barcode lookup** and branded products — Q1 was answered *internal catalog for v1*; the
  launch plan recommends reopening it (L5).

## Known limits, accepted

- A workout left unfinished on a phone **before local schema v2** is dropped by the migration.
  Queued writes from then are kept but belong to no account: Sync Center shows them under
  **Unattributed** and lets you discard them; they are never sent as whoever is signed in.
- Web is a development surface, not part of the release gate.
- The TalkBack pass was driven by keyboard (Alt+arrows), not by touch gestures — same traversal and
  speech, but touch exploration was not exercised ([how, and why](measurements/talkback-session.md)).
- Emailed links use the `fitlog://` scheme until the production domain exists for https App Links
  (security review L8).
