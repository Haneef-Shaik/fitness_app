# TODO — active work

**Goal:** G1 · Client spine → [contract](10-EXECUTION-GOALS.md#g1--give-the-client-a-spine-generated-types-cached-reads-a-test-harness) ·
[prompt](prompts/G1.md) · [tracker](09-PROJECT-TRACKER.md) · [charter](08-PROJECT-CHARTER.md)
**Exit:** H1.1 generated types · H1.2 query keys + invalidation map · H1.3 `DataBoundary` ·
H1.4 a mobile test harness gating coverage in CI

> This file holds **only the work in flight**. Milestone status lives in the tracker — it is not
> repeated here, because a status maintained in two places drifts. When G1 closes, this file is
> replaced with G2's tasks.
>
> A task is done when it meets the [Definition of Done](08-PROJECT-CHARTER.md#4-definition-of-done):
> tests first, tests fail before the code exists, a deliberate mutation makes them fail again,
> and the spec doc is updated in the same change if behaviour changed.

**Entry gate — run before starting:** `bash scripts/check-client-spec.sh` must exit 0.

---

## 0 · What G1 inherits from G0 — verify, do not assume

- [ ] **0.1** `docs/03` §2 lists the packages to install. They were checked as **available**, not as
      **installing cleanly into this tree**. If one fails, that is a G0 defect — fix it here and say
      so in the handoff (H0.1).
- [ ] **0.2** Use the **SDK-52-pinned** versions, not `latest`. G0 verified these specifically:
      `jest-expo@52.0.6` and `@testing-library/react-native@13.3.3`. The current majors
      (`jest-expo@57`, RTL `@14`) target later SDKs and will not match Expo 52.0.49.
- [ ] **0.3** Read [D15](08-PROJECT-CHARTER.md#6-decision-log) before choosing any test tooling — the
      E2E runner is already decided (Maestro, installed in G4), so do not introduce a second one.

## 1 · `packages/api-types` — generated, never hand-written  *(closes D3b)*

- [ ] **1.1** `openapi-typescript` against the running server
      (`http://localhost:8000/v1/openapi.json`), output **checked in**
- [ ] **1.2** CI drift gate beside the existing three jobs in `.github/workflows/ci.yml` —
      regenerate, then `git diff --exit-code`. A stale type is a failed build
- [ ] **1.3** **See the gate fail.** Delete a field from a Pydantic schema in
      `services/api/app/schemas/`, run the job, watch it fail, put the field back.
      Record *which field* in the handoff — a gate nobody has seen fail is not a gate
- [ ] **1.4** One source only. A hand-written type shadowing a generated one is drift with extra
      steps — if the generated shape is awkward, fix the Pydantic schema

## 2 · Query layer

- [ ] **2.1** Write the **invalidation map** as a table in [`docs/03` §6.2](03-FRONTEND-ARCHITECTURE.md)
      **first**, then implement against it. Written afterwards it documents what you did, not what is
      correct (**I15**)
- [ ] **2.2** `@tanstack/react-query` v5 provider mounted in `apps/mobile/app/_layout.tsx`
- [ ] **2.3** `lib/query/queryKeys.ts` — the registry from `docs/03` §6.1, so invalidation is
      greppable rather than guessed
- [ ] **2.4** Caching policy from `docs/03` §6.3 applied as `staleTime` per key family
- [ ] **2.5** Envelope unwrapped in **exactly one place** (**I9**) — every response, errors included,
      carries a `request_id`

## 3 · `DataBoundary` — four states, one component

- [ ] **3.1** Loading · empty · **filtered-empty** · error, per `docs/03` §6.4
- [ ] **3.2** **Filtered-empty is not empty** (**I13**). "No exercises match *chest + barbell*. Clear
      filters." is a different message with a different action from "You haven't added any exercises
      yet." Three states is the bug this task exists to prevent
- [ ] **3.3** State precedence fixed and tested: `offline-with-no-cache → error → loading → empty →
      content`
- [ ] **3.4** One test per state, named for the state

## 4 · Test harness — start where silence is most dangerous

- [ ] **4.1** `jest-expo@52.0.6` + `@testing-library/react-native@13.3.3`; replace
      `"test": "echo \"no mobile tests yet\""` in `apps/mobile/package.json` with `jest --coverage`
- [ ] **4.2** Test `apps/mobile/src/lib/api.ts`, which exists and is **entirely untested**:
      envelope unwrapping → `ApiError` with `code`, `status`, `fields`, `request_id`
- [ ] **4.3** Test the 401 → refresh → retry path, **including refresh failure clearing the token**
- [ ] **4.4** Test LAN host derivation from `Constants.expoConfig.hostUri` — web vs device vs
      `EXPO_PUBLIC_API_URL`. This is what will break first on a real phone (DR4)
- [ ] **4.5** CI job with a coverage gate. Record the **starting number** and the intent to raise it
      toward the 80% house floor — a gate pinned to today's number and never raised is theatre
- [ ] **4.6** `pnpm --filter @volt/mobile typecheck` passes

## 5 · Prove the spine on real code

- [ ] **5.1** Migrate **B-01 only** (`apps/mobile/app/home.tsx`) onto the query layer, and confirm it
      still renders against the **live** API
- [ ] **5.2** Do **not** migrate the other five screens. A wide migration hides whether the substrate
      is actually good

## 6 · Close-out

- [ ] **6.1** Tracker: client test count 0 → n, coverage starting number, quality snapshot
- [ ] **6.2** Charter §6: record the coverage floor and its ramp; **close D3b**
- [ ] **6.3** Tick **H1.1–H1.4** in the [handoff ledger](10-EXECUTION-GOALS.md#3--the-handoff-ledger)
      with the date. An unticked row means the handoff did not happen
- [ ] **6.4** Append the G1 handoff record to the tracker changelog
- [ ] **6.5** Replace this file with **G2**'s tasks
- [ ] **6.6** Commit: `feat(client): generated types, query layer, DataBoundary and a test harness (G1)`

---

## Carried over

- [ ] **DR4** — verify on a physical device via Expo Go; LAN connectivity is untested.
      The runner is now decided (**Maestro**, [D15](08-PROJECT-CHARTER.md#6-decision-log)) but not
      installed — **G4** installs it
- [ ] **D3b** — OpenAPI → TypeScript codegen. **§1 above closes this**
- [ ] `docs/05-DESIGN-SYSTEM.md` still references the web stack — raised by G0, out of its scope
- [ ] The Android SDK is installed but unconfigured (`ANDROID_HOME` unset, no device attached).
      Decide in **G4** whether to wire it up or stay on Expo Go only
- [ ] `apps/mobile` still ships `react-native-web`. Harmless, but web is deferred
      ([D1](08-PROJECT-CHARTER.md#6-decision-log)) — make it a deliberate keep, not an accident
- [x] **Q3** — "max reps" PR is the most reps in a single working set, any load. Recorded as **D11**
      in the [charter](08-PROJECT-CHARTER.md#6-decision-log) and implemented

## Blocked — needs a decision from the user

- [ ] **Q1** nutrition database provider — blocks M5/M6, and a licensing attribution requirement
- [ ] **Q9** minimum age / legal position — blocks A-07
