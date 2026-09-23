# TODO — active work

**Goal:** G9 · Body, goals and the dashboard that tells the truth →
[contract](10-EXECUTION-GOALS.md) · [tracker](09-PROJECT-TRACKER.md) · [charter](08-PROJECT-CHARTER.md)
**Exit:** **AC-11** — B-01 shows real training, nutrition and body state for the user's local date,
in **one call** · B-01's request count measurably drops · **12 of 12** acceptance criteria proven

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
grep -n "H8.1\|H8.2" docs/10-EXECUTION-GOALS.md | grep "✅"
cd services/api && uv run pytest -q
cd ../.. && pnpm --filter @volt/mobile test
./scripts/verify-containment.sh
```

**H8.1 and H8.2 must be recorded**, and the tracker must show **11 of 12**. The containment script
must still pass: G9 adds a third domain to the dashboard, and the one thing that must not happen is
a dashboard that a dead AI service can take down.

## What you inherit — verify, do not assume

| ID | From | Claim | Check |
|----|------|-------|-------|
| **H6.2** | G6 | Analytics aggregations do not scan every set | The dashboard reads them in one request. If the plan changes, the two query-plan tests will say so |
| **H7.2** | G7 | Only `confirmed = true` nutrition counts | The dashboard's nutrition figure goes through `day_totals` like everything else. Do **not** add a second sum |
| **H3.2** | G3 | The outbox is generic | A weigh-in is an offline write. It uses `store.enqueue`, which G7 added — no third queue |
| **H8.2** | G8 | No AI failure touches training | The dashboard must render with the analysis worker dead. Add that to the containment script |

## 1 · One call, one local date

- [ ] **1.1** `GET /dashboard` returns training, nutrition and body for **one local date**,
      resolved **server-side** from the profile timezone (**I7**). The client never computes "today"
- [ ] **1.2** It replaces B-01's fan-out. **Measure the request count before and after** and write
      the number down — "fewer requests" without a figure is not a result
- [ ] **1.3** An empty domain renders its **empty state**, never a 404. A dashboard that fails
      because someone has not logged a meal is a dashboard nobody opens twice

## 2 · Body metrics

- [ ] **2.1** `body_metrics`, with a reversible migration and `alembic check` clean
- [ ] **2.2** **Q5 is answered: the first weigh-in of a day is canonical.** Assert it directly —
      log two on one day and check which one the day reports
- [ ] **2.3** `/analytics/body` — trend, moving average, and the **two stacked charts sharing one
      x-axis** that [06-NUTRITION §H-14](wireframes/06-NUTRITION.md) is explicit about. A dual-axis
      chart is prohibited by the design system and is the single most misleading chart this product
      could ship
- [ ] **2.4** Weigh-ins go through the **outbox** (H3.2 + G7's `enqueue`). Stepping on a scale
      happens in a bathroom, which is where the signal is worst

## 3 · `daily_summaries`

- [ ] **3.1** A **cache, never a source of truth** ([02 §4.4](02-SYSTEM-ARCHITECTURE.md)). Every
      figure must be reproducible from base tables, and a disagreement resolves in favour of the
      base tables — with a test that proves it does
- [ ] **3.2** It unblocks **H-14 nutrition analytics**, which G7 left undone for exactly this reason

## 4 · The profile gap G7 found

- [ ] **4.1** **Nothing in the app sets `birth_date`, `sex` or `height_cm`.** The API has accepted
      all three since M1; onboarding does not collect them and no profile screen exists
- [ ] **4.2** H-15's calculator needs them and currently names the gap and falls back to a rougher
      weight-and-activity estimate. Closing this makes Mifflin–St Jeor usable
- [ ] **4.3** Once bodyweight is tracked, H-15 should read it rather than asking — it asks today
      only because Volt does not know

## 5 · Screens I-01…I-06, J-01…J-04, B-02…B-05

- [ ] **5.1** Every screen tested, and the coverage ratchet raised afterwards (D18) — never lowered
- [ ] **5.2** Charts come from the **existing kit** (H6.1). A new one-off chart component is how a
      design system stops being one

## 6 · Close the goal

- [ ] **6.1** Tracker: **12 of 12**, screens, test counts, the migration
- [ ] **6.2** Tick **H9.1** in the [handoff ledger](10-EXECUTION-GOALS.md#3--the-handoff-ledger)
- [ ] **6.3** Answer or restate **Q8** (are calorie targets versioned?) — H-15 is currently narrower
      than its wireframe because the schema cannot support the wireframe's claim
- [ ] **6.4** Replace this file's active section with **G10**'s tasks
- [ ] **6.5** Commit: `feat: body, goals and a dashboard that tells the truth (G9)`

---

## Carried forward from G8

- **Q1 is still open, and now matters more.** An AI estimate can only resolve to what the catalog
  contains; everything else stays unresolved with the model's own macros. That works, and it is
  exactly the gap a provider would close. Ask before M6 is called finished, because a third-party
  catalog carries a **licensing attribution requirement** that has to appear in the UI
- **No hardware flow for AC-07 through AC-10.** `scripts/e2e.sh` covers AC-01/02/04/05 only. Four
  acceptance criteria rest on API and client tests alone
- **H-09 uses the system camera**, not the in-app preview the wireframe draws, and submits **one
  photo per analysis** even though it accepts four. Both are single-file changes when a device is
  available to test them on
- **Nothing notifies on completion.** H-07 is dismissible and the analysis is waiting when the user
  comes back, but no push exists. It belongs with the rest of the notification work
- **H-14 and H-17 remain unbuilt.** H-14 is waiting on `daily_summaries` (§3 above); H-17 is waiting
  on Q1
- **The `__DEV__` performance budget is still missed.** D16 wants p95 < 100 ms for tap → set; G4
  measured **396.4 ms** over 99 commits. That is G10's, and it is the oldest open number in the
  project
