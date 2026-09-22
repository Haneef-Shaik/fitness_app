# TODO — active work

**Goal:** G5 · Retrieval — find the past without knowing its date →
[contract](10-EXECUTION-GOALS.md#g5--retrieval--find-the-past-without-knowing-its-date) ·
[tracker](09-PROJECT-TRACKER.md) · [charter](08-PROJECT-CHARTER.md)
**Exit:** **AC-03** timezone matrix green · **AC-05** returns the right session **and says when it
widened** · F-01…F-07 render · **6 of 12** acceptance criteria proven

> This file holds **only the work in flight**. Milestone status lives in the tracker — it is not
> repeated here, because a status maintained in two places drifts. When G5 closes, this file is
> replaced with G6's tasks.
>
> A task is done when it meets the [Definition of Done](08-PROJECT-CHARTER.md#4-definition-of-done):
> tests first, tests fail before the code exists, a deliberate mutation makes them fail again,
> and the spec doc is updated in the same change if behaviour changed.

**Entry gate — run before starting:**

```bash
pnpm --filter @volt/mobile test:ci          # 312 tests, coverage gate, must exit 0
pnpm --filter @volt/mobile typecheck
cd services/api && uv run pytest -q         # must exit 0
bash scripts/check-client-spec.sh           # the docs gate
```

And confirm the four acceptance criteria G4 recorded are still true, on the device:

```bash
bash scripts/e2e.sh all                     # needs the phone plugged in; see .maestro/README.md
```

If `e2e.sh` cannot run because no phone is attached, **say so and proceed** — do not mark H4.1–H4.3
unproven again on that basis. They were proven on hardware on 22 Sep and the run is recorded.

---

## 1 · The resolution rule (AC-05)

The rule is **normative and already written** — [PRD §7.2](01-PRD.md). Do not reinvent it.

- [ ] **1.1** Recursive CTE over the self-referencing muscle tree: most recent `completed` session
      containing an exercise whose `exercise_muscles` row is that group **or a descendant** with
      `role = 'primary'`, ordered by `completed_at DESC`. Write it once and share it — G6's muscle
      volume recurses the same tree, and two copies will drift
- [ ] **1.2** Test it against a **grandchild** group, not a child. A one-level join passes the
      child case and is wrong
- [ ] **1.3** Widening: when nothing matches `primary`, widen to `('primary','secondary')` **and
      return that fact in the payload**. The UI has to be able to say it widened
- [ ] **1.4** `GET /history/previous-occurrence`

## 2 · History and comparison

- [ ] **2.1** `GET /history/workouts` — filters + cursor pagination
- [ ] **2.2** `GET /history/compare` — the primitive G6's charts reuse (**H5.2**)
- [ ] **2.3** Cursor is opaque over `(started_at, id)`. **Settle the shape here**: every list
      endpoint after this copies it (**H5.1**). Not offset — history grows and offsets drift
      under inserts

## 3 · Screens F-01…F-07

- [ ] **3.1** F-01…F-07 through `DataBoundary`, with **filtered-empty ≠ empty** (**I13**) — a
      filter that matches nothing must not read as "you have no history"
- [ ] **3.2** Every new read gets a key in `queryKeys.ts` **and** a line in
      [03 §6.2](03-FRONTEND-ARCHITECTURE.md); the agreement test fails otherwise
- [ ] **3.3** AC-05's "it widened" is on screen, not only in the payload

## 4 · AC-03 — a unit matrix, not an E2E

- [ ] **4.1** Sessions started at 23:40 across **≥5 timezones including both DST directions**,
      asserted against `contracts/vectors/domain.json`'s existing `local_date` vectors. The vectors
      are already there — consume them rather than inventing new ones (**I7**)

## 5 · Close-out

- [ ] **5.1** Tracker: **6 of 12** ACs proven; append the G5 handoff record
- [ ] **5.2** Tick **H5.1**, **H5.2** in the [handoff ledger](10-EXECUTION-GOALS.md#3--the-handoff-ledger)
- [ ] **5.3** Replace this file with G6's tasks
- [ ] **5.4** Commit

---

## Carried over

- [ ] **The E2E workflow has never executed.** `.github/workflows/e2e.yml` was written in G4 and
      runs nightly / on demand. Its first run is its first test, and it builds a debug APK rather
      than using Expo Go, so the flows' `appId` and the `openLink` launch **will need
      parametrising**. The criteria themselves were proven on a physical phone, not in CI
- [ ] **Jest still force-exits a worker.** The torn-down-environment error is gone, but one handle
      outlives the run. `forceExit` is deliberately not coming back
- [ ] **E-05 / E-06 / E-07 / E-12** — advanced set editor, session notes UI, plate calculator. Swap
      reuses `ExercisePicker` (`max={1}`) but has no entry point on E-03 yet
- [ ] No row menus on D-01/C-02/C-03 (archive, duplicate, delete); C-04, C-08, C-09, D-04 unbuilt
- [ ] `apps/mobile` still ships `react-native-web`; web is deferred
      ([D1](08-PROJECT-CHARTER.md#6-decision-log)) and is no longer the only runnable target — the
      Android path is proven, so a web-only failure is no longer a reason to drop a dependency

## Blocked — needs a decision from the user

- [ ] **Q1** nutrition database provider — blocks M5/M6, and a licensing attribution requirement
- [ ] **Q9** minimum age / legal position — blocks A-07
