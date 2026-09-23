# TODO — active work

**Goal:** G10 · Hardening — make it shippable →
[contract](10-EXECUTION-GOALS.md) · [tracker](09-PROJECT-TRACKER.md) · [charter](08-PROJECT-CHARTER.md)
**Exit:** every NFR in [PRD §11](01-PRD.md) has evidence · one alert **deliberately triggered** ·
an a11y audit done **on the built app**, not on a scan · export produces a complete archive and
delete leaves nothing behind · **the five acceptance criteria that have never run on hardware do**

> This file holds **only the work in flight**. Milestone status lives in the tracker — it is not
> repeated here, because a status maintained in two places drifts.
>
> A task is done when it meets the [Definition of Done](08-PROJECT-CHARTER.md#4-definition-of-done):
> tests first, tests fail before the code exists, a deliberate mutation makes them fail again,
> and the spec doc is updated in the same change if behaviour changed.

---

## Entry gate — run this first

```bash
cd /Users/Adya/personals/fitness_app
grep -n "H9.1" docs/10-EXECUTION-GOALS.md | grep "✅"
cd services/api && uv run pytest -q && uv run ruff check . && uv run alembic check
cd ../.. && pnpm --filter @volt/mobile test
./scripts/verify-containment.sh
```

**H9.1 must be recorded** and the tracker must show **12 of 12**. All three suites and the
containment script must be green before a line is written: G10 changes things everywhere, and a red
baseline makes every later failure ambiguous.

## 0 · 🔴 Five acceptance criteria have never run on hardware

**This is the largest single gap in the project.** `scripts/e2e.sh` covers AC-01, AC-02, AC-04 and
AC-05. **AC-03, AC-06, AC-07, AC-08, AC-09, AC-10 and AC-11 rest entirely on API and client tests.**
They are good tests — every one is mutation-checked — but G4 found *eight* real defects on a phone
that no suite had caught, and nothing since G4 has run on one.

- [ ] **0.1** Get a device attached, or an emulator that can drive touch. G4's finding stands:
      **the emulator could not deliver `onPress`** after ruling out overlays, input injection,
      coordinates, GPU and keyboard config, and the New Architecture. The next thing untried is a
      different system image (API 35/36)
- [ ] **0.2** Maestro flows for **AC-07** (log a meal, watch the day move) and **AC-11** (write in
      all three domains, then read B-01). Both assert against the **API** as well as the screen,
      the way G4's do
- [ ] **0.3** AC-08/09/10 need the AI path on a device. The stub gateway makes this affordable —
      `AI_PROVIDER=stub` produces deterministic items with no key and no cost
- [ ] **0.4** `.github/workflows/e2e.yml` **has never executed** (H4.1, ⚠️ since G4). Its `appId`
      and `openLink` launch still need parametrising for a debug APK. A workflow that has never
      run is not a workflow

## 1 · The performance budget, measured and missed

- [ ] **1.1** **tap → set rendered p95 is 396.4 ms over 99 commits** against D16's 100 ms
      ([write-up](measurements/commit-p95.md)). 118.7 ms over 9 — so it **grows with list length**,
      which points at the list, not the commit path
- [ ] **1.2** Measure a production build. G4's numbers are `__DEV__`, and the gap is usually large
- [ ] **1.3** Fix or re-argue the budget. A budget nobody meets and nobody changes is not a budget
- [ ] **1.4** Cold start → dashboard interactive < 2.5 s, on a mid-tier Android. **B-01 is now one
      request** (G9), which was the first half of this

## 2 · Offline, end to end

- [ ] **2.1** **L-02 sync centre** — the failed queue is surfaced, not silently retried forever.
      G3 built `markFailed` and nothing renders it yet
- [ ] **2.2** **L-07 conflict** — what a user sees when the server refuses a queued write
- [ ] **2.3** Body metrics and meals both ride the outbox now (G7, G9). Prove the whole queue
      drains after a long offline period with **three** domains queued at once

## 3 · Observability

- [ ] **3.1** RED metrics and the alert table in [02 §9](02-SYSTEM-ARCHITECTURE.md)
- [ ] **3.2** **Deliberately trigger one alert** and show it firing. An alert that has never fired
      is a configuration file, not an alert
- [ ] **3.3** The AI worker needs its own signals: queue depth, failure rate by `error_code`, and
      time in `processing`. A silently stuck worker is the failure G8's design makes possible

## 4 · Accessibility — on the built app

- [ ] **4.1** **Not an automated scan.** Log a full session with a screen reader. Navigate the
      diary with an external keyboard
- [ ] **4.2** "Colour never carries meaning alone" is already in the design system; this is where
      it gets checked on the running app. G8's estimated-item treatment (dashed border + "Est." chip
      + the words in the accessible name) is the pattern to hold everything else to
- [ ] **4.3** Findings fixed, or logged with a date. Not "noted"

## 5 · Export and deletion

- [ ] **5.1** A complete archive: sessions, sets, meals, foods, body metrics, photos, goals,
      **and the AI analyses**
- [ ] **5.2** Deletion leaves nothing behind — and the test asserts it. **`food_analysis_items` is
      append-only and its FK from `meal_items` is `RESTRICT`**, so a naive delete will fail; the
      order matters and the trap list names it
- [ ] **5.3** Progress photos are files in the object store as well as rows. Both go

## 6 · Close the goal

- [ ] **6.1** Tracker: NFR evidence, the p95 figure on a production build, the a11y findings
- [ ] **6.2** Tick **H10.1** in the [handoff ledger](10-EXECUTION-GOALS.md#3--the-handoff-ledger)
- [ ] **6.3** Commit: `feat: hardening — observability, accessibility, export and the release gate (G10)`

---

## Carried forward from G9

- **H-14 nutrition analytics is still unbuilt.** `daily_summaries` now exists, which is what it was
  waiting for. It was not in G9's scope list
- **No profile screen.** Nothing in the app sets `birth_date`, `sex` or `height_cm`. H-15's
  calculator names the gap and falls back to a weight-and-activity estimate. It is a small screen
  and it is the only thing between the calculator and Mifflin–St Jeor
- **I-01's projection** ("at this rate, around 12 Nov") is not built. It needs a rate over a 4-week
  window and an explicit "an estimate, not a prediction"
- **Reminders do not send.** B-04 stores preferences and says so plainly; `expo-notifications` and
  a permission flow are what it needs
- **Q1 is still open** — the nutrition database provider. An AI estimate can only resolve to what
  the catalog contains, and a third-party catalog carries a **licensing attribution requirement**
  that has to appear in the UI
- **Q8 is still open** — are calorie targets versioned? H-15 says only that nothing already logged
  is rewritten, because the schema cannot support the wireframe's stronger claim
