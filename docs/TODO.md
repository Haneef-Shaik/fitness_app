# TODO — active work

**Goal:** G6 · Analytics — turn the archive into a trend →
[contract](10-EXECUTION-GOALS.md) · [tracker](09-PROJECT-TRACKER.md) · [charter](08-PROJECT-CHARTER.md)
**Exit:** **AC-06** asserted across E-08, F-03 and G-02 for the same session · charts pass the
design-system checks in both themes · every analytics endpoint has an integration test ·
**7 of 12** acceptance criteria proven

> This file holds **only the work in flight**. Milestone status lives in the tracker — it is not
> repeated here, because a status maintained in two places drifts. When G6 closes, this file is
> replaced with G7's tasks.
>
> A task is done when it meets the [Definition of Done](08-PROJECT-CHARTER.md#4-definition-of-done):
> tests first, tests fail before the code exists, a deliberate mutation makes them fail again,
> and the spec doc is updated in the same change if behaviour changed.

**Entry gate — run before starting:**

```bash
grep -n "6 of 12" docs/09-PROJECT-TRACKER.md        # 6 of 12 recorded?
pnpm --filter @volt/mobile test:ci                  # 370 tests + the 54/50/50/55 ratchet
pnpm --filter @volt/mobile typecheck
cd services/api && uv run pytest -q && uv run ruff check . && uv run alembic check
bash scripts/check-client-spec.sh
```

---

## 1 · The rule that decides whether AC-06 holds

**Do not re-derive any number in a SQL aggregate.** Every figure already has a definition in
`app/domain/training.py` and a vector in `contracts/`. A second definition is exactly how
"matching across all three screens" fails.

- [ ] **1.1** Where an aggregate must run in SQL for performance, add a test asserting the SQL
      result **equals the domain function over the same rows**. Not "looks right" — equal
- [ ] **1.2** Muscle volume is **primary ×1.0, secondary ×0.5** (D7) and must recurse the muscle
      tree **exactly as G5's rule does** — import `muscle_subtree_ids`, do not write a second CTE.
      G5 mutation-proved that a one-level join passes every fixture and is still wrong

## 2 · Endpoints

- [ ] **2.1** `/analytics/workouts`, `/muscle-volume`, `/exercises/{id}`, `/personal-records`,
      `/frequency`, `/adherence`
- [ ] **2.2** Every list among them uses **H5.1's cursor** (`CursorEnvelope` + `app/api/cursor.py`).
      The shape was settled in G5 precisely so this goal copies it rather than inventing one
- [ ] **2.3** Reads that do **not** scan every set on every request (**H6.2**)

## 3 · Charts (H6.1)

Per [05-DESIGN-SYSTEM §3](05-DESIGN-SYSTEM.md):

- [ ] **3.1** Fixed series order, **never cycled**; **slot 7 is a spacer and not assignable**
      (assignable ceiling is 6)
- [ ] **3.2** One axis, never two. Legend always present for ≥2 series
- [ ] **3.3** **A regression is never red** — a lighter week is information, not a failure
- [ ] **3.4** Empty state, and **filtered-empty ≠ empty** (I13), as F-01 does

## 4 · Screens G-01 … G-07

- [ ] **4.1** Every new read gets a key in `queryKeys.ts` **and** a line in
      [03 §6.2](03-FRONTEND-ARCHITECTURE.md); the agreement test fails otherwise.
      **G5's lesson:** ask what makes each read *stale*, not just what creates it — the reopen case
      was missed because only "finish" looked like a write
- [ ] **4.2** Charts render in both themes

## 5 · AC-06

- [ ] **5.1** The **same session's** volume asserted equal on E-08, F-03 and G-02

## 6 · Close-out

- [ ] **6.1** Tracker: **7 of 12**; append the G6 handoff record
- [ ] **6.2** Tick **H6.1**, **H6.2** in the [handoff ledger](10-EXECUTION-GOALS.md#3--the-handoff-ledger)
- [ ] **6.3** Re-measure the coverage remainder and **raise the ratchet** (D18)
- [ ] **6.4** Replace this file with G7's tasks
- [ ] **6.5** Commit

---

## Carried over

- [ ] **F-04 is an entry point, not an editor.** Editing a past session belongs with the
      session-mutation work; the screen says so rather than presenting a form that does not save
- [ ] **The E2E CI workflow has never executed.** `.github/workflows/e2e.yml` builds a debug APK,
      so the flows' `appId` and the Expo Go `openLink` still need parametrising. The criteria are
      proven on a physical phone, not in CI
- [ ] **D16 is missed**: tap → set rendered p95 **396.4 ms** over 99 commits, **118.7 ms** over 9,
      against 100 ms. A baseline near 110 ms **plus** growth with list length, because every commit
      re-renders the whole set list. Memoising the row or virtualising the list is the fix;
      the budget stays at 100 ms until then
- [ ] **Jest still force-exits a worker.** One handle outlives the run. `forceExit` is deliberately
      not coming back
- [ ] **E-05 / E-06 / E-07 / E-12** — advanced set editor, session notes UI, plate calculator
- [ ] No row menus on D-01/C-02/C-03 (archive, duplicate, delete); C-04, C-08, C-09, D-04 unbuilt

## Blocked — needs a decision from the user

- [ ] **Q1** nutrition database provider — blocks M5/M6, and a licensing attribution requirement
- [ ] **Q9** minimum age / legal position — blocks A-07
