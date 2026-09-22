# TODO — active work

**Goal:** G4 · Prove the critical path on hardware → [contract](10-EXECUTION-GOALS.md) ·
[prompt](prompts/G4.md) · [tracker](09-PROJECT-TRACKER.md) · [charter](08-PROJECT-CHARTER.md)
**Exit:** **AC-01 · AC-02 · AC-04** proven by E2E · **DR4 closed** · H4.1 suite · H4.2 device build ·
H4.3 the measured p95, written down

> This file holds **only the work in flight**. Milestone status lives in the tracker — it is not
> repeated here, because a status maintained in two places drifts. When G4 closes, this file is
> replaced with G5's tasks.
>
> A task is done when it meets the [Definition of Done](08-PROJECT-CHARTER.md#4-definition-of-done):
> tests first, tests fail before the code exists, a deliberate mutation makes them fail again,
> and the spec doc is updated in the same change if behaviour changed.

**Entry gate — run before starting:**

```bash
pnpm --filter @volt/mobile test:ci     # 251 tests, coverage gate, must exit 0
pnpm --filter @volt/mobile typecheck
bash scripts/check-client-spec.sh
cd services/api && uv run pytest -q && uv run ruff check . && uv run alembic check
```

> **G4's prompt also says to re-run G3's airplane-mode check "on the simulator/web target" first.
> That half cannot pass on web, and it is not a G3 defect.** `expo-sqlite` declares
> `"platforms": ["apple", "android"]` and has **no web build**, so the web store is in-memory by
> design and nothing survives a reload. Offline logging, flush and zero-duplicates **were** verified
> for real on web (see the G3 handoff record); **kill-and-relaunch is precisely what this goal
> exists to prove.** Do it on the device, in task 1.

## 0 · The three things this goal exists to settle

- [ ] **0.1** **Open a SQLite database on a real phone.** `src/lib/db/sqlite.ts` is written, typed
      and held to the same contract suite as the in-memory store — and **has never executed**.
      If it does not open, **D14 is wrong**, and that is a finding, not a workaround
- [ ] **0.2** `PRAGMA journal_mode = WAL` — record what it returns. Still unverified since G0
- [ ] **0.3** Measure **tap → set rendered p95** on hardware and **write the number down** (H4.3).
      G3 proved the commit path is *synchronous*; that is a different claim from *under 100 ms*

## 1 · Device setup (DR4)

- [ ] **1.1** Expo Go on a physical phone over the LAN. `src/lib/api.ts` derives the host from
      `Constants.expoConfig.hostUri` — tested in G1, **never run on a device**
- [ ] **1.2** Install `expo-sqlite` on the device build and confirm `index.ts` (not `index.web.ts`)
      is the module Metro resolves
- [ ] **1.3** **The airplane-mode run, in full**: log a session with the radio off, force-quit the
      app, relaunch, resume, finish, restore the network, and assert the server matches with
      **zero duplicate sets**. The first four steps are what web could not do
- [ ] **1.4** Decide whether to configure the local Android SDK or stay on Expo Go only

## 2 · Maestro (D15)

- [ ] **2.1** Install Maestro. It was chosen in G0 and has never been run
- [ ] **2.2** Flows for **AC-01** (build a Chest workout, ≥2 exercises, target sets/reps),
      **AC-02** (record every set; `set_index` dense; loads and reps match) and **AC-04**
      (start the same plan day again; **previous performance shows before any input**)
- [ ] **2.3** The offline flow from 1.3, as a repeatable Maestro run
- [ ] **2.4** Wire it into CI if it can run headless; if it cannot, say so and record how it is run

## 3 · Close the gaps G3 left

- [ ] **3.1** **Component tests for the route files.** `app/session/[id].tsx` and
      `app/train/start.tsx` have none, and **both of G3's late bugs were in that layer** — a summary
      computed after the draft was cleared, and a sync dot that read "Synced" while offline
- [ ] **3.2** `src/lib/session.tsx` is still 0% covered, unchanged since G1
- [ ] **3.3** Reconsider `forceExit: true` in `jest.config.js`, carried since G1
- [ ] **3.4** Put `@shopify/flash-list` back behind `src/ui/VirtualList` if the device tolerates it,
      or record that FlatList is the answer
- [ ] **3.5** C-05's reorder is ↑/↓ buttons; the wireframe wants a `⠿` drag handle

## 4 · Invariants this goal must measure, not assume

- [ ] **4.1** **I10** — tap → set rendered, p95, on hardware
- [ ] **4.2** **I8** — zero duplicates after a real force-quit and replay
- [ ] **4.3** **I7** — confirm Hermes on the device formats a zoned date, or that the fallback reads
      acceptably. G3 established the client never *buckets* days, so this is cosmetic, not correctness

## 5 · Close-out

- [ ] **5.1** Tracker: AC status, the measured p95, DR4
- [ ] **5.2** Tick **H4.1–H4.3** in the [handoff ledger](10-EXECUTION-GOALS.md#3--the-handoff-ledger)
- [ ] **5.3** Append the G4 handoff record to the tracker changelog
- [ ] **5.4** Replace this file with **G5**'s tasks
- [ ] **5.5** Commit

---

## Carried over

- [ ] **E-05 / E-06 / E-07 / E-12** — advanced set editor, session notes UI, plate calculator. Swap
      reuses `ExercisePicker` (`max={1}`) but has no entry point on E-03 yet
- [ ] No row menus on D-01/C-02/C-03 (archive, duplicate, delete); C-04, C-08, C-09, D-04 unbuilt
- [ ] `apps/mobile` still ships `react-native-web`; web is deferred ([D1](08-PROJECT-CHARTER.md#6-decision-log))
      but is currently the **only** runnable target, which is why DR4 matters so much

## Blocked — needs a decision from the user

- [ ] **Q1** nutrition database provider — blocks M5/M6, and a licensing attribution requirement
- [ ] **Q9** minimum age / legal position — blocks A-07
