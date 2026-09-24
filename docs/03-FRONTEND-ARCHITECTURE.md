# Frontend Architecture
## Fitness & Nutrition Tracking Platform

Companion to [04-SCREEN-ARCHITECTURE](04-SCREEN-ARCHITECTURE.md) (what the screens are) and
[wireframes/](wireframes/) (what each screen does). This document covers *how the client is built*.

---

## 1. The constraint that shapes everything

> **A user logs a set standing at a rack, one-handed, with 40 seconds of rest left.**

Everything below follows from that:

- A set commit **never awaits the network**. It writes to local state, renders instantly, and
  syncs behind the scenes.
- The active session is **durable** — survives a refresh, a crash, a call, a battery death.
- No spinner may ever appear between "user typed reps" and "set is on screen".
- Tap targets in the logger are ≥ 56 px tall. Numeric inputs open a numeric keypad.
- Previous performance is **already on screen**, never behind a tap.

Screens outside the logger (planning, analytics, settings) may be conventional request/response.

---

## 2. Stack

Every row below is a package that **installs in this app**. Expo-family rows are pinned by the
installed SDK — `node_modules/expo/bundledNativeModules.json` (SDK **52.0.49**, 114 modules) — which
also means they are present in the **Expo Go** runtime, the constraint
[DR4](08-PROJECT-CHARTER.md#7-delivery-risks) puts on this project. Checked 22 Sep; the check itself
is recorded in [D14](08-PROJECT-CHARTER.md#6-decision-log).

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | **Expo SDK 52 + `expo-router` 4** · React Native 0.76.9 · React 18.3.1 · TypeScript | [D1](08-PROJECT-CHARTER.md#6-decision-log) — iOS + Android. File-based routing; Expo Go keeps the native toolchain out of the dev loop. New Architecture is on (`app.json: newArchEnabled`) |
| Styling | RN `StyleSheet` + design tokens in `src/theme/tokens.ts`, applied through `src/theme` | RN has no CSS, so no utility-class framework applies. Tokens stay plain TypeScript so [05-DESIGN-SYSTEM](05-DESIGN-SYSTEM.md) keeps one source |
| Components | Hand-rolled `src/ui`, grown as screens need it | The component kit the web spec named is Radix over the DOM and does not render here. RN's own `accessibilityRole` / `accessibilityState` / `accessibilityLabel` props carry what Radix carried |
| Server state | **TanStack Query v5** (`@tanstack/react-query`) | Caching, invalidation, optimistic mutations, retry. Platform-agnostic. Lands in **G1** (H1.2) |
| Client state | **Zustand** slices | Active workout draft, filters, UI prefs — small and non-server |
| Forms | `react-hook-form` + Zod resolvers | One validation definition per boundary |
| Long lists | RN `FlatList` behind `src/ui/VirtualList` | Screens never import a list implementation, so swapping one is a one-file change. **`@shopify/flash-list` was tried and removed in G2:** rendering one crashed the web build with *"Invalid hook call … more than one copy of React"*, isolated by swapping that single file. It may be fine on a device, but there is none to check on until **G4** (DR4), and an unverified list is not a claim this project makes. At 29 catalog rows `FlatList` is not the bottleneck; G4 can put FlashList back behind the same interface |
| Charts | `react-native-svg` (SDK-pinned **15.8.0**) as the substrate; `victory-native@41.x` is the candidate kit | Recharts is DOM-only. **`victory-native@42` is not usable here** — it peers `@shopify/react-native-skia >=2.6.0` and Expo Go SDK 52 ships Skia **1.5.0**; `41.26.0` peers `>=1.2.3 <3.0.0` and fits. The final call belongs to **G6** (H6.1) |
| **Local persistence** | **`expo-sqlite` ~15.1.4** — session draft + write outbox | **[D14](08-PROJECT-CHARTER.md#6-decision-log).** Real transactions (`withTransactionAsync`, `withExclusiveTransactionAsync`), and it is in Expo Go. Schema in **§5.3** |
| Connectivity | `@react-native-community/netinfo` (SDK-pinned **11.4.1**) + RN `AppState` | There is no `window` `online` event on a phone. These are the outbox flush triggers in **§7** |
| Screen wake | `expo-keep-awake` (SDK-pinned **~14.0.3**) | E-03 holds a wake lock for the duration of an active session |
| Secrets | `expo-secure-store` ~14.0.1 *(already installed)* | [D10](08-PROJECT-CHARTER.md#6-decision-log) — refresh token in the device keychain |
| Dates | `date-fns` + `date-fns-tz` | Profile-timezone day bucketing (**I7**). `date-fns-tz` needs `Intl.DateTimeFormat` with a `timeZone`, which is a **Hermes build option — not verified on a device here**. **G1** must assert one DST case in the harness before the logger depends on it; if Hermes lacks it, the fallback is to send the offset with the write and let the server bucket |
| Unit / component tests | `jest-expo@52.0.6` + `@testing-library/react-native@13.3.3` | The pair pinned to **this** SDK — the current majors (`jest-expo@57`, RTL `@14`) target later SDKs. Lands in **G1** (H1.4) |
| **E2E** | **Maestro**, driving Expo Go over the LAN | **[D15](08-PROJECT-CHARTER.md#6-decision-log).** No native build, therefore no local Xcode or Android SDK required. See **§11** |
| i18n | `i18next` + `react-i18next` + `expo-localization` | `next-intl` is bound to the web framework this project left behind ([D1](08-PROJECT-CHARTER.md#6-decision-log)). English-only content at MVP; strings externalised from day one |

---

## 3. Project structure

Organised **by feature/domain, not by file type** (house rule), with the shared kernel outside the
app as a workspace package.

### 3.1 What is in `apps/mobile` today

This is `find apps/mobile -type f` on 22 Sep, not a plan — **6 of 103 screens**:

```
apps/mobile/
├── app.json                          # expo config: scheme "volt", typedRoutes, newArchEnabled
├── app/                              # expo-router — file-based routes, thin
│   ├── _layout.tsx                   #   root: fonts, ThemeProvider, SessionProvider
│   ├── index.tsx                     #   boot → redirect by auth state
│   ├── welcome.tsx                   #   A-01
│   ├── login.tsx                     #   A-02
│   ├── register.tsx                  #   A-03
│   ├── onboarding.tsx                #   A-07
│   └── home.tsx                      #   B-01 dashboard
└── src/
    ├── lib/     api.ts · session.tsx · storage.ts
    ├── theme/   index.tsx · tokens.ts
    └── ui/      index.tsx
```

### 3.2 The shape it grows into

Route groups `(…)` do not appear in the URL — they exist to give each area its own `_layout.tsx`,
which is where the tab bar, the auth guard and the outbox mount live.

```
apps/mobile/
├── app/                              # routing and layout composition ONLY
│   ├── _layout.tsx                   #   root: fonts, theme, session, QueryClientProvider (G1)
│   ├── (auth)/                       #   unauthenticated group
│   │   ├── login.tsx  register.tsx  reset-password.tsx
│   ├── (onboarding)/[step].tsx
│   ├── (tabs)/                       #   authenticated shell
│   │   ├── _layout.tsx               #   the 5-tab bar (D2) + auth guard + outbox mount
│   │   ├── index.tsx                 #   B-01 Dashboard
│   │   ├── train/…                   #   C-*, D-*, F-*, G-*
│   │   ├── nutrition/…               #   H-*
│   │   ├── progress/…                #   I-*, J-*
│   │   └── settings/…                #   K-*
│   └── session/[id]/…                #   E-02/E-03 — full-screen, outside the tab bar (§4.1)
│
└── src/
    ├── features/                     # one folder per domain; the app's real surface area
    │   ├── auth/            { api/ components/ hooks/ schemas/ }
    │   ├── onboarding/
    │   ├── dashboard/       { cards/ registry.ts }        ← dashboard cards are a registry (C01.6)
    │   ├── exercises/
    │   ├── programs/
    │   ├── workout-session/ { store/ components/ engine/ }← the logger; see §5
    │   ├── history/
    │   ├── workout-analytics/
    │   ├── nutrition/       { diary/ food-search/ ai-review/ recipes/ }
    │   ├── food-ai/         { upload/ polling/ }
    │   ├── body-metrics/
    │   ├── goals/
    │   └── settings/
    │
    ├── ui/                           # cross-feature, domain-free primitives
    │   ├── (Button, Sheet, Field, Chip…)   ← hand-rolled; see §2
    │   ├── layout/                   #   AppScaffold, TabBar, ScreenHeader
    │   ├── feedback/                 #   EmptyState, ErrorState, Skeleton, Toast, OfflineBanner
    │   ├── data/                     #   DataBoundary, VirtualList, FilterChips
    │   └── charts/                   #   themed react-native-svg wrappers (G6)
    │
    ├── lib/
    │   ├── api/                      #   typed client, envelope unwrap, error mapping, idempotency
    │   ├── query/                    #   QueryClient config, queryKeys registry, invalidation map
    │   ├── db/                       #   expo-sqlite open + migrations (§5.3)
    │   ├── offline/                  #   draft repository, outbox, sync engine, conflict detection
    │   ├── units/                    #   kg↔lb, cm↔in, g↔oz — conversion ONLY at the display edge
    │   ├── datetime/                 #   profile-tz day bucketing, local_date helpers
    │   ├── nutrition/                #   macro math, target/remaining, confirmed-only aggregation
    │   ├── analytics-events/         #   the client event taxonomy
    │   └── auth/                     #   token handling (expo-secure-store), route guards
    │
    └── theme/                        # tokens.ts — the design-token source of truth
```

**The shared kernel lives outside the app.** `packages/domain` (`@volt/domain`, already a dependency
of `apps/mobile`) holds the pure types and formula implementations, pinned against the Python side by
`contracts/vectors/domain.json`. Nothing framework-specific goes in it.

**Rules of the structure**
1. `app/` contains routing and layout composition only. No business logic, no data fetching beyond a
   prefetch call.
2. A `features/*` folder may not import from another `features/*` folder. Shared needs move down into
   `lib/`, `ui/` or `@volt/domain`.
3. `@volt/domain` is pure TypeScript with no React and no React Native imports — it is the half of the
   client the server's Python domain is pinned against.
4. Files stay under ~400 lines; a component over 200 lines is a refactor signal.
5. **Immutability everywhere.** Store updates return new objects; no in-place mutation of server
   cache, draft state or props (house rule).

---

## 4. App shell & routing

### 4.1 Shell

The MVP client is a **phone app** ([D1](08-PROJECT-CHARTER.md#6-decision-log)). There is no viewport
to respond to — there is a device class and an orientation.

| Surface | Chrome |
|---------|--------|
| **Phone, portrait (primary — the only MVP target)** | Contextual top bar + **bottom tab bar, 5 items** ([D2](08-PROJECT-CHARTER.md#6-decision-log)) + centre FAB. Insets from `react-native-safe-area-context`, so the tab bar clears the home indicator and the top bar clears the notch |
| Phone, landscape | Same tabs. The logger (E-03) keeps its one-handed column and does not reflow into two |
| Tablet (`app.json` sets `ios.supportsTablet`) | Same tabs, content column capped for line length, two-column cards where a card has a natural pair |

**Full-screen routes that escape the tab bar** (no tab bar, no swipe-back-to-tab): the active workout
session, camera capture, AI review, and any modal wizard. These are *tasks*, and leaving one must be a
deliberate, confirmed act — see §4.3.

#### Deferred to Phase 2 — the desktop/web surface

Not wrong, just not now. [D1](08-PROJECT-CHARTER.md#6-decision-log) deferred web; `react-native-web`
is still in `apps/mobile/package.json` and the app runs in a browser, which is how M1 was verified
end to end. When the web surface is picked up, the previously specified rules apply unchanged:

| Breakpoint | Chrome |
|------------|--------|
| 768–1023 px | Same tabs, wider content column, two-column cards where useful |
| ≥ 1024 px | **Left navigation rail** (labelled), no bottom bar, multi-column dashboards, side-by-side compare views |

### 4.2 Route table
See [04-SCREEN-ARCHITECTURE §4](04-SCREEN-ARCHITECTURE.md#4-route-table) for the complete list of
routes mapped to screen IDs.

### 4.3 Navigation rules

`expo-router` 4 sits on React Navigation 7 (`@react-navigation/native@7.4.1`), which is what makes
the first and third rules below mechanisms rather than aspirations.

- Tab switches **preserve each tab's navigation stack and scroll position**. Each tab is its own
  stack inside `(tabs)/_layout.tsx`; switching tabs never resets one.
- Sheets and modals are **route-addressable** where the content is shareable or deep-linkable (a
  route presented with `presentation: 'modal'`), and local component state where it is not (the rest
  timer).
- **System back always does the least surprising thing.** On Android that is the hardware/gesture
  back; on iOS the edge swipe. It closes a sheet before popping a route, and it asks for
  confirmation before abandoning an active session or an unsaved AI review — the session route
  intercepts removal (`usePreventRemove`) rather than letting a gesture silently destroy work.
- Deep links arrive through `expo-linking` on the `volt://` scheme (`app.json`) and resolve to the
  correct **authenticated** destination after login (`?next=`).
- Routes are typed — `app.json` enables `experiments.typedRoutes`, so a route that does not exist is
  a type error rather than a blank screen.

---

## 5. The workout-session engine (the critical path)

The one place where a standard "form → mutation → refetch" pattern is unacceptable.

### 5.1 State shape
```ts
// features/workout-session/store — Zustand in memory, expo-sqlite for durability
type SessionDraft = Readonly<{
  sessionId: string            // server-issued, or a client UUID until the server confirms
  planDayId: string | null
  startedAt: string            // ISO, UTC
  status: 'in_progress'
  exercises: readonly DraftExercise[]
  notes: string
  revision: number             // bumps on every local change; drives outbox ordering
}>

type DraftExercise = Readonly<{
  clientId: string
  exerciseId: string
  orderIndex: number
  targetSnapshot: PrescriptionSnapshot | null   // frozen from the plan at start
  previousPerformance: PreviousPerformance | null | 'loading' | 'never'
  sets: readonly DraftSet[]
  notes: string
}>

type DraftSet = Readonly<{
  clientId: string             // idempotency key for the server write
  setIndex: number
  setType: 'warmup' | 'working' | 'drop' | 'failure'
  reps: number | null
  loadKg: number | null
  loadUnitEntered: 'kg' | 'lb'
  durationSeconds: number | null
  distanceM: number | null
  rpe: number | null
  rir: number | null
  completed: boolean
  performedAt: string
  syncState: 'pending' | 'syncing' | 'synced' | 'failed'
}>
```

### 5.2 Set-commit flow
```
user taps ✓ on a set
   │
   ├─▶ validate locally (domain/rules/set-validity)      ~0 ms
   ├─▶ reducer returns a NEW draft with the set appended  ~0 ms   ← UI updates here
   ├─▶ ONE SQLite transaction (§5.3)                     ~2 ms
   │     • rewrite session_draft, revision + 1
   │     • insert the outbox row, idempotency_key = set.clientId
   │     └ both or neither — a torn pair is a lost set or a duplicated one
   ├─▶ start the rest timer if configured
   └─▶ prefill the next set from this one
                     │
                     ▼  (background, invisible unless it fails)
              outbox flush → 200 → syncState = 'synced'
                           → 5xx/offline → retry with backoff, stays 'pending'
                           → 4xx validation → syncState = 'failed', surface inline (never a modal)
```
The UI is **never** blocked on the network. A per-set sync dot communicates state without
demanding attention.

Two properties of this order are normative for **G3**, not stylistic. The render happens **before**
any persistence, so the commit never awaits I/O (**I10**). And the draft write and the outbox
enqueue are **one transaction** — that single requirement is why §5.3 uses a database rather than a
key-value store ([D14](08-PROJECT-CHARTER.md#6-decision-log)).

### 5.3 Durability & recovery

The draft and the outbox live in **`expo-sqlite`** ([D14](08-PROJECT-CHARTER.md#6-decision-log)),
opened once in `lib/db`. SQLite is here for exactly one property the alternatives do not have: an
**atomic multi-row transaction**. Dequeuing an outbox entry means "mark this row sent *and* update the
draft's sync state" — as two key-value writes that pair can tear, and a torn pair is a duplicate set
or a lost one.

```sql
-- session_draft: exactly one row; the whole draft as JSON, rewritten per committed change
CREATE TABLE session_draft (id INTEGER PRIMARY KEY CHECK (id = 1),
                            revision INTEGER NOT NULL, updated_at TEXT NOT NULL, json TEXT NOT NULL);
-- outbox: one row per pending write, ordered, idempotent on client_id
CREATE TABLE outbox (id INTEGER PRIMARY KEY AUTOINCREMENT,
                     aggregate_id TEXT NOT NULL, method TEXT NOT NULL, path TEXT NOT NULL,
                     body TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE,
                     attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TEXT NOT NULL,
                     state TEXT NOT NULL DEFAULT 'pending', last_error TEXT);
CREATE INDEX ix_outbox_ready ON outbox (aggregate_id, id) WHERE state = 'pending';
```

**The asymmetry between the two tables is the design.**

- The **draft is one JSON blob** because it is read and written **whole**. A session is opened once
  and re-rendered from memory; the row exists so that a process death does not lose it. Normalising
  it into `exercises` and `sets` tables would buy queries nobody runs and cost a multi-statement write
  on the one path that must never be slow (§5.2). `revision` makes a stale write detectable.
- The **outbox is rows** because it is dequeued **in order and partially**. A flush takes the ready
  entries for one aggregate, not the whole queue; entries fail individually; `idempotency_key UNIQUE`
  makes an enqueue that happens twice a no-op rather than a duplicate set. The partial index is the
  flush query — pending entries only, already ordered per aggregate.

**One contract, two implementations.** `expo-sqlite` declares
`"platforms": ["apple", "android"]` — there is **no web build**, and importing it on web throws
`Cannot find native module 'ExpoSQLite'` and takes the app down. Web is currently the only runnable
target ([DR4](08-PROJECT-CHARTER.md#7-delivery-risks)), so `src/lib/db` is an **interface** with two
implementations behind it: SQLite on iOS and Android, and an in-memory store on web, selected by
Metro's platform resolution (`index.ts` vs `index.web.ts`). The web store warns on start that drafts
do not survive a reload, because a durability layer that is silently not durable is worse than one
that is absent. Both are exercised by the same contract suite, so the reducers, the outbox ordering
and the recovery rules are proven without a device; only the SQL itself waits for **G4**.

**Recovery**
- The draft is written on **every committed change**, not on an interval or a debounce. §5.2 places
  that write after the render, so it costs the user nothing.
- On app start, `lib/offline/recover` reads `session_draft`. If a draft with `status = in_progress`
  exists → **E-10 Recovery** offers *Resume*, *Finish now*, or *Discard*.
- The server is also asked for `GET /workout-sessions/active`. If both exist and disagree, the one
  with more sets wins and the difference is reconciled by replaying the outbox — sets are idempotent
  on `clientId`, so replay is safe.
- A draft older than 24 h prompts before resuming rather than silently continuing.
- **If the database is gone, say so and start clean.** iOS may purge an app's storage under pressure
  and Android "Clear data" wipes it outright; both look identical from inside the app — no row. That
  is not an error state, it is an empty one (see [06-EDGE-CASES](06-EDGE-CASES.md) O13).

### 5.4 Previous performance
Fetched per exercise as the session opens, **in parallel and non-blocking**. Cached by
`['previous-performance', exerciseId]`. While loading, the slot shows a skeleton and entry stays
fully usable. A failure degrades to "couldn't load last time" with a retry chip — never an error
screen, never a blocked input.

---

## 6. Data layer

### 6.1 Query keys

One registry (`src/lib/query/queryKeys.ts`) so invalidation is **greppable rather than
guessed**. Keys are hierarchical and share prefixes on purpose: invalidating `['sessions']`
reaches the list, every detail and the active session in one call, while `['sessions','detail',id]`
reaches exactly one.

```ts
export const qk = {
  // identity
  me:                  ()                  => ['me'] as const,
  profile:             ()                  => ['profile'] as const,
  goals:               (status?: string)   => ['goals', 'list', status ?? 'all'] as const,
  goal:                (id: string)        => ['goals', 'detail', id] as const,

  // catalog
  muscleGroups:        ()                  => ['muscle-groups'] as const,
  exercises:           (f: ExerciseFilters = {}) => ['exercises', 'list', f] as const,
  exercise:            (id: string)        => ['exercises', 'detail', id] as const,

  // planning
  programs:            ()                  => ['programs', 'list'] as const,
  program:             (id: string)        => ['programs', 'detail', id] as const,
  programTemplates:    ()                  => ['programs', 'templates'] as const,

  // training
  sessions:            (f: SessionFilters = {}) => ['sessions', 'list', f] as const,
  session:             (id: string)        => ['sessions', 'detail', id] as const,
  activeSession:       ()                  => ['sessions', 'active'] as const,
  records:             (exerciseId: string) => ['records', exerciseId] as const,
  exerciseHistory:     (exerciseId: string) => ['exercise-history', exerciseId] as const,
  exerciseStats:       (exerciseId: string) => ['exercise-stats', exerciseId] as const,
  previousPerformance: (exerciseId: string, before?: string) =>
                         ['previous-performance', exerciseId, before ?? 'latest'] as const,
} as const
```

**Every key above maps to an endpoint that exists today.** The reads the later goals add —
`dashboard(date)` (**G9**), `diary(date)` and `meal(id)` (**G7**), `analysis(id)` (**G8**),
`nutritionRange` / `workoutAnalytics` (**G6**) and `bodyMetrics` (**G6**) — join this registry in the
goal that builds them, with a row added to §6.2 in the same change. A key without an invalidator is
a stale screen waiting to happen.

### 6.2 Invalidation map

**Normative.** Every cached read has one key (§6.1) and one documented invalidator here. The code in
`src/lib/query/invalidation.ts` implements this table and a test asserts the two agree, so a row
added here without code — or code without a row — fails the build rather than drifting quietly.

| Mutation | Invalidates | Why exactly this |
|----------|-------------|------------------|
| Sign in / sign out | **everything** (`queryClient.clear()`) | Cached data belongs to the previous identity. A stale read across an account switch is a data-leak bug, not a refresh bug |
| `PATCH /profile` | `profile`, `dashboard(*)`, `bodyCheckins` | Targets and timezone are read from the profile everywhere; the day-bucketing rule (**I7**) depends on it. The check-in interval lives there too, and moves when the next check-in is due |
| Create / edit a goal | `goals`, `goal(id)`, `dashboard(*)` | The list shows progress, the detail shows the same numbers |
| Create / edit / archive an **exercise** | `exercises`, `exercise(id)` | Catalog filters and the picker read the list; the detail reads one |
| Create / edit / duplicate / archive / delete a **program** | `programs`, `program(id)` — **never** `sessions`, `records` or any analytics | **AC-12.** A performed session snapshots its prescription; editing the plan must not appear to rewrite history |
| Edit a **plan day** or reorder its exercises | `program(id)` | A day is only ever read through its program |
| Start a session | `activeSession`, `sessions`, `dashboard(*)` | The dashboard's "resume" affordance and the history list both change |
| Commit / edit / delete a **set** | `session(id)` — **optimistically, with no refetch** | **I10.** The set-commit path never awaits the network; the local draft is authoritative while the session is in progress (§5) |
| Add / remove / reorder a session exercise | `session(id)` | Same reason; the session is one aggregate |
| **Finish** a session | `activeSession`, `sessions`, `session(id)`, `records(*)`, `exerciseHistory(*)`, `exerciseStats(*)`, `history(*)`, `previousOccurrence(*)`, `sessionComparison(*)`, `analytics(*)`, `dashboard(*)` | Volume, e1RM and PRs are computed inside the finish transaction, so the server's numbers are authoritative from this moment. **D-02 is session-derived too** — its recent-sessions list and e1RM trend are stale the instant a workout ends. **So is all of G5's retrieval and G6's analytics**: F-01's list, AC-05's lookup, F-06's comparison and every G-screen read completed sessions. One `analytics` prefix covers volume, muscle balance, PRs, frequency and adherence, because they all go stale together |
| Cancel / reopen a session | `activeSession`, `sessions`, `session(id)`, `history(*)`, `previousOccurrence(*)`, `sessionComparison(*)`, `analytics(*)`, `dashboard(*)` | A cancelled session leaves history; a reopened one **stops being completed** and leaves it too. Without invalidating the retrieval keys it stays on F-01, and AC-05 would still resolve to a session the server no longer counts as finished |
| Log / edit / delete a **meal** or item | `nutrition(*)`, `dashboard(*)` | The diary and the day's totals are the same fact. Foods are deliberately **not** invalidated: logging a meal changes no food, and the item's macros were snapshotted so it never will |
| Create / edit / delete a **food** | `foods(*)` | Correcting a food changes the picker and **nothing already logged** ([02 §4.2](02-SYSTEM-ARCHITECTURE.md)). Invalidating the diary here would imply otherwise and refetch for nothing |
| Create / rename / reorder / hide / delete a **meal category** | `meal-categories(*)`, `nutrition(*)` | The diary renders a category's **name**, so a rename has to reach it. `foods` is deliberately absent — a category is not a food and the picker is unmoved |
| Create / edit / delete a **recipe** | `recipes(*)`, `recipe(id)` — **never** `nutrition` | A recipe is a **plan**. Editing one changes what it will produce next time and nothing it already produced, because logging it snapshotted the macros. The same rule as a program edit not touching sessions (**AC-12**) |
| Submit a **food analysis** (text or photo) | `analyses(*)` — **never** `nutrition` | A submitted analysis has changed no total; it has not even run. Invalidating the diary here would be the "count it just for the preview" bug in cache form (**I12**) |
| Confirm a **food analysis** into a meal | `nutrition(*)`, `dashboard(*)`, `analyses(*)`, `analysis(id)` | **Now** the day moves, because `meal_items` were written. The analysis is invalidated too: afterwards it is read-only and shows what was saved against what was proposed — the AC-10 audit view |
| Delete the stored **analysis photos** | `analyses(*)` | The photographs go and the records stay (BRD §18), so only the list re-reads |
| Log / delete a **body measurement** | `body(*)`, `dashboard(*)`, `goals(*)` | B-01 carries the body card, and a goal's progress is measured against the latest weigh-in. `nutrition` and `analytics` are deliberately absent — stepping on a scale changes neither |
| Add / delete a **progress photo** | `progressPhotos` | Nothing else reads them |
| Retry / discard a queued write in the **Sync Center** | `outbox(*)` | The write has not landed, so no server read has moved. Only L-02's own view changes |
| Change the profile **timezone** | **everything** (`queryClient.clear()`) | A timezone change moves a **boundary**: the server re-files every session, meal and weigh-in onto the day it now falls on (**T4**). Every cached read keyed by a day is therefore wrong, which is all of them |
| Outbox flush (`/sets/batch`) | `session(id)` per affected session, `outbox(*)` | The flush is the network catching up to state the UI already shows |

Two rules the table encodes, both of which have cost this project before:

1. **Editing a plan never invalidates performed data.** That is AC-12 expressed as a cache rule.
2. **A set commit invalidates nothing eagerly.** Refetching a session after every set would put the
   network back on the critical path the whole design exists to keep it off.

### 6.3 Caching policy
| Data | staleTime | Notes |
|------|-----------|-------|
| Dashboard | 30 s | Refetch on focus and on any relevant mutation |
| Active session | ∞ | Local draft is authoritative while in progress |
| Previous performance | 5 min | Immutable for the duration of a session |
| Exercise catalog | 1 h | Rarely changes; prefetch at app start for instant pickers |
| History list | 2 min | Cursor-paginated, `keepPreviousData` on filter change |
| Analytics | 5 min | Expensive; show the previous range while the new one loads |
| Diary | 30 s | |
| Food search | 5 min per query string | Debounced 300 ms, request deduped |
| AI analysis | poll 2 s → 5 s backoff, cap 90 s | Stop on `completed`/`failed` |

### 6.4 The `DataBoundary` component
Every async surface renders through one component so that loading / empty / error / offline states
are **structurally impossible to forget**:

```tsx
<DataBoundary
  query={q}
  skeleton={<SessionListSkeleton/>}
  empty={{ icon: 'dumbbell', title: 'No workouts yet',
           body: 'Your completed sessions will appear here.',
           action: { label: 'Start a workout', href: '/train/start' } }}
  error={{ retry: true, supportRef: true }}
  offline={{ allowStale: true }}   // renders cached data + an offline badge
>
  {(data) => <SessionList sessions={data}/>}
</DataBoundary>
```
State precedence is fixed: `offline-with-no-cache → error → loading → empty → content`.

---

## 7. Offline & sync

| Capability | MVP | Phase 2 |
|------------|-----|---------|
| Active session logging offline | ✅ Full — the entire session works with no network | |
| Write outbox with retry + idempotency | ✅ Sets, session finish, meal items, body metrics | |
| Read cached data offline | ✅ Whatever TanStack Query has, flagged stale | |
| Create a *new* meal offline | ✅ (manual entry; AI requires network and says so) | |
| Full bidirectional sync of all entities | — | ✅ `/sync/push`, `/sync/pull` |
| Conflict resolution UI | Minimal (L-07, last-writer-wins + notice) | Field-level merge |

**Outbox design** (`lib/offline/outbox`):
- FIFO per aggregate, parallel across aggregates.
- Each entry: `{ id, method, path, body, idempotencyKey, aggregateId, attempts, nextAttemptAt, createdAt }`.
- Retries: exponential backoff 1 s → 2 s → 4 s … capped at 60 s, with jitter.
- `4xx` (except 408/409/429) is terminal → the entry moves to a **failed** list surfaced in the
  Sync Center (L-02), never silently dropped.
- Flush triggers: a `netinfo` reachability change, `AppState` returning to `active`, a successful
  auth refresh, and manual retry. There is no `online` window event on a phone.
- The user sees outbox state only when it matters: a pending count in the Sync Center, and an
  inline badge on a failed item.

---

## 8. Units, dates and numbers

**Three rules that prevent an entire class of bug:**

1. **Canonical in, canonical out.** State and the API hold `kg`, `cm`, `g`, `ml`, seconds, metres.
   Conversion happens in `lib/units` at render time and at input parse time, nowhere else.
   A converted value is never written back to state.
2. **Round for display, never for storage.** Display rounds to the sensible precision
   (load 0.5 kg / 1 lb, weight 0.1, macros 1 g, calories 1 kcal). Stored values keep full precision.
   `100 kg → 220.5 lb → back to kg` must still be exactly `100`.
3. **The day is the profile's day.** `lib/datetime/toLocalDate(instant, profile.timezone)` is the
   only way to derive a calendar date. `new Date().toDateString()` is banned by lint rule.

Number inputs in the logger set `keyboardType="decimal-pad"`, accept both `.` and `,`, and never
use a stepper control supplied by the OS. Increment/decrement steppers sit beside the field with
unit-aware steps (±2.5 kg / ±5 lb by default, configurable).

---

## 9. Performance budget

A phone cannot answer the web's questions, so these are the ones it can
([D16](08-PROJECT-CHARTER.md#6-decision-log)):

| Metric | Budget | Measured by |
|--------|--------|-------------|
| **tap → set rendered (p95)** | **< 100 ms** | `performance.now()` around the reducer plus a post-commit frame callback, logged in dev builds |
| cold start → dashboard interactive | < 2.5 s on a mid-tier Android | manual stopwatch against the `expo-router` mount log |
| JS bundle | tracked, not capped yet | `npx expo export` output size, recorded per release |

**The one that matters is the first.** It is the same number the old web budget carried, because it
is the only one that was ever about the product rather than the platform — it is the constraint in
§1 expressed as a measurement, and [wireframes/04](wireframes/04-WORKOUT-LOGGER.md) states it as a
hard budget. **G4** (H4.3) measures it on real hardware and writes the number down; until then it is
a budget, not a result.

**Techniques.** Route-level lazy loading, with the logger route warmed from the dashboard the moment
a "Start workout" affordance is visible. `@shopify/flash-list` for history, food search and the
exercise catalog. The active session screen contains no chart code. The set-commit path does no
`JSON.parse`, no network call and no `await` before the render (§5.2) — the SQLite write happens
after it.

---

## 10. Error handling

Four levels, and nothing is allowed to fall through:

1. **Field** — inline, below the input, with the fix stated ("Reps must be at least 1").
2. **Action** — a toast with an undo or retry affordance. Destructive actions always offer undo
   instead of a pre-confirmation, *except* irreversible ones (delete account, discard session).
3. **Surface** — the `DataBoundary` error state with a retry and a support reference (`request_id`).
4. **App** — a route-level error boundary with a reload path, reporting to the error tracker.

**Never**: a raw stack trace, an error code with no plain-language sentence, an alert that blocks the
workout logger, or a silently swallowed failure (house rule).

Full taxonomy in [06-EDGE-CASES](06-EDGE-CASES.md).

---

## 11. Testing strategy (80% floor, TDD per house rules)

| Layer | Tool | What must be covered |
|-------|------|----------------------|
| Domain rules | Vitest, in `packages/domain` | Volume, e1RM, PR evaluation, set validity, previous-performance selection, unit conversion round-trips, timezone bucketing incl. DST |
| Stores/reducers | `jest-expo` | Session draft reducers — add/edit/delete set, reorder, densify indices, recovery merge |
| Components | `@testing-library/react-native` | Every state of `DataBoundary`; logger tap flows; AI review edit paths |
| Offline | `jest-expo` + an in-memory SQLite double | Outbox ordering, idempotent replay, terminal-failure handling, torn-transaction recovery |
| Integration | RTL-RN + MSW | Full flows against a mocked API |
| **E2E** | **Maestro** ([D15](08-PROJECT-CHARTER.md#6-decision-log)) | AC-01…AC-12, plus: log a session offline and watch it sync; recover a killed session; correct an AI item and verify totals move only on confirm |
| A11y | RN accessibility props + a manual device pass | TalkBack/VoiceOver on the diary and the logger; every logger control has a label and a ≥ 56 px target |
| Visual | Maestro screenshots | Both themes, phone portrait and landscape |

**Why Maestro.** The browser-driven runner the old spec named cannot see a native app at all, and
Detox needs a custom native build; there is **no Xcode on this machine** (only Command Line
Tools), so an iOS build cannot be produced here regardless of what the Android side has. Maestro
drives **Expo Go** over the LAN, which is the runtime [DR4](08-PROJECT-CHARTER.md#7-delivery-risks)
says the app must be verified on. It is not installed yet — **G4** installs it and is the goal that
turns this row into evidence (H4.1, H4.2).

The unit and component rows are real as of **G1**: `jest-expo` + `@testing-library/react-native` run
**69 client tests** with a coverage gate in CI, where there were none. The gate is a ratchet
([D18](08-PROJECT-CHARTER.md#6-decision-log)) — `src/lib/query` and `DataBoundary` are held at 90%+,
and the remainder rises as the pre-existing screens get covered. **G1** (H1.4) builds the harness and puts the coverage gate
in CI, before the logger is written rather than after.

---

## 12. Client analytics events

Named `domain.object_action`, with `request_id` correlation where a server call is involved.

| Event | Key properties |
|-------|----------------|
| `session.started` | `source: plan\|template\|empty\|repeat`, `plan_day_id` |
| `session.set_committed` | `set_type`, `has_rpe`, `interaction_ms`, `was_prefilled`, `offline` |
| `session.finished` | `duration_s`, `exercise_count`, `set_count`, `volume_kg`, `pr_count` |
| `session.abandoned` | `sets_logged`, `reason: discard\|timeout\|crash` |
| `session.recovered` | `age_minutes`, `choice` |
| `history.previous_occurrence_viewed` | `filter_type`, `widened: bool` |
| `nutrition.entry_started` | `mode: search\|text\|photo\|quick\|recent\|recipe\|barcode` |
| `ai.analysis_requested` | `input_type`, `image_count` |
| `ai.analysis_completed` | `duration_ms`, `item_count`, `mean_confidence`, `unresolved_count` |
| `ai.item_edited` | `field`, `confidence_before` |
| `ai.analysis_confirmed` | `edited_item_count`, `removed_count`, `added_count` |
| `ai.analysis_failed` | `error_code` |
| `offline.outbox_flushed` | `entries`, `max_age_s`, `failures` |
| `target.updated` | `type: calories\|macro\|weight` |

`ai.item_edited` volume against `ai.analysis_confirmed` is the product's honest measure of model
quality (Risk R1).
