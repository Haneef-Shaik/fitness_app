# FitLog master plan: every goal

> **Source of truth for the plan board.** Each `### ID · Title` card below becomes one node on the
> board. Statuses live in [`status.json`](status.json); change them with
> `node scripts/plan/status.mjs` or on the board (`node scripts/plan/serve.mjs`), never by
> editing this file. After changing a card's fields, run `node scripts/plan/build.mjs`.
> The narrative is [docs/23-MASTER-PLAN.md](../23-MASTER-PLAN.md); how to run a goal is
> [SESSION-PROMPT.md](SESSION-PROMPT.md).

Written 7 Oct 2026 from four read-only audits of the repo and docs (v1 launch status, gyms v2 plan,
UI directions, code reality) and the owner's decisions recorded in memory. Exercise media is
deliberately the **last** goal (owner, 7 Oct 2026).

```json
{
  "title": "FitLog master plan",
  "people": [
    {"name": "You", "colour": "#9a3412"},
    {"name": "S1 Platform", "colour": "#1f6feb"},
    {"name": "S2 Backend", "colour": "#0e7490"},
    {"name": "S3 Design", "colour": "#7c3aed"},
    {"name": "S4 Member app", "colour": "#15803d"},
    {"name": "S5 Gym app", "colour": "#be185d"},
    {"name": "S6 AI & Pro", "colour": "#c2410c"},
    {"name": "S7 Quality", "colour": "#475569"},
    {"name": "Milestones", "colour": "#18212b"}
  ],
  "tracks": {
    "M0": "Ground truth",
    "M1": "Production platform",
    "M2": "Momentum foundations",
    "M3": "Member app in Momentum",
    "M4": "Launch foundations: phone, Hindi, Pro",
    "M5": "Store launch",
    "M6": "Gym pilot (MVP)",
    "M7": "Gym Phase 2 (after the pilot gate)",
    "M8": "Depth and polish",
    "M9": "Exercise media (last)"
  },
  "syncPoints": [
    {"id": "SP1", "goals": ["DS-5"], "text": "SP1 kit + shell freeze: S3 hands tokens, components and the tab shell to every screen session"},
    {"id": "SP2", "goals": ["G14.app"], "text": "SP2 string catalog: S4 hands t(), the locale formatters and the guard ratchet to every screen session"},
    {"id": "SP3", "goals": ["G15.api", "G16.api", "G17.api", "G18.api", "G19.api", "G20.api", "G21.api", "G22.api"], "text": "SP3 API contract: the .api goal merges migrations, routes and regenerated packages/api-types before its .app goal starts"}
  ],
  "config": {
    "subtitle": "From docs/plan/GOALS.md (7 Oct 2026). Lanes are parallel Claude Code sessions plus you. Columns are the earliest wave a goal can start.",
    "milestone": "MS-5",
    "milestoneLabel": "Store launch",
    "sizes": {"S": "one short session (half a day or less)", "M": "one full session", "L": "two or three sessions; work through the card's steps in order"},
    "firstStepLabel": "Wave 0",
    "stepLabel": "Wave",
    "workflowHint": "Pick the top Ready goal in your lane. Claim it with `node scripts/plan/status.mjs set <ID> start --who <lane>`, run it with docs/plan/SESSION-PROMPT.md, set In review when the PR is up and Done when it is merged to main. Only Done unblocks the goals that wait on it.",
    "refPlaceholder": "branch, PR or commit, e.g. plan/ds-1-tokens",
    "hubs": [
      {"key": "T", "ids": ["QA-1"], "text": "T = QA-1, a clean main"},
      {"key": "F", "ids": ["MS-2"], "text": "F = MS-2, Momentum foundations"},
      {"key": "L", "ids": ["MS-5"], "text": "L = MS-5, the store launch"}
    ],
    "slug": "fitlog-master-plan"
  }
}
```

## How to read a card

- **Lane** is the session that owns the goal (see the lane charters in
  [docs/23 §5](../23-MASTER-PLAN.md#5-lanes-the-parallel-sessions)). `You` means only the owner can
  do it: accounts, money, legal, devices, decisions.
- **Needs** are goals that must be **Done** first. Ready and blocked are derived from them, never
  set by hand.
- **Size**: S = a short session, M = one full session, L = two or three sessions.
- **Milestone** is the release the goal ships in. `MS-*` cards are the milestone gates themselves.
- **Done when** is the contract. A goal with an unticked box is not done.

---

## M0 · Ground truth

### OW-1 · Choose the UI direction and settle its open rules
- **Lane:** You · **Size:** S · **Milestone:** M0 · **Label:** pick UI direction
- **Needs:** —

**Outcome.** One UI direction is chosen and written down, so the design and screen sessions build
one thing. Recommended: **Momentum** (docs/22). It is the latest direction and the only one that
matches the standing feedback (expressive, platform-native, one accent).

**Decide.**
1. Momentum: yes or no. If no, name the direction; the M2/M3 cards keep their shape with other tokens.
2. The uncommitted **Coach OS** diff (lime `#D7FF4F`, Hanken only, CoachPrompt, gym header icon).
   Keep the parts that fit Momentum (48 dp targets, Reduce Motion on press, default stack
   animation) and park the rest on a branch.
3. The "no green" rule: success state and the fat chart series are green today (`tokens.ts`).
4. Navigation: Today · Train · Food · Progress · Gym, plus the B-03 action menu.
5. Accent volt lime `#C6F432` (already chosen 4 Oct by the colour-blind test). Confirm, so the app
   icon can be redrawn and D9 superseded.

**Done when.**
- [ ] Charter decision **D47** records the direction and supersedes D9 (`docs/08` §6). D36–D46
  are reserved by docs/17 for the decisions G13–G21 record
- [ ] Each of the five points above has a one-line answer in D47

**Read first.** docs/22 §1–§2 and §7; memory notes momentum-figma and expressive-over-minimal.

### OW-2 · Make the launch decisions
- **Lane:** You · **Size:** S · **Milestone:** M0 · **Label:** launch decisions
- **Needs:** —

**Outcome.** Every open Phase 0 decision in the launch plan has an answer, so platform and store
work can start.

**Decide.**
- **L2** API and worker host: Railway, Fly.io or Render (`docs/11` L2, `docs/12` §7)
- **L3** transactional email: confirm Resend as Supabase SMTP
- **L5** barcode scanning: launch or v1.1 (AP-7)
- **L7** launch scope: which [v1.1] items move into launch
- **L8** name, brand and trademark check (blocks the icon, the feature graphic and the posters, Q32)
- PITR on or off, Sentry data region, and the photo-backup gap (`docs/12` §11)
- Confirm that **D33** (all AI behind Pro, 7-day trial) closes **L6 / Q6**
- Launch platforms: Android and iOS together, or Android first

**Done when.**
- [ ] Each answer is recorded in `docs/11` Phase 0 and, where it is a decision, in charter §6

### QA-1 · Triage the working tree
- **Lane:** S7 Quality · **Size:** S · **Milestone:** M0 · **Label:** clean main
- **Needs:** OW-1

**Outcome.** `main` is clean and green before parallel sessions start, so nobody builds on
half-finished work.

**Scope.**
1. Commit the docs that exist only in the working tree: 19, 20, 21, 22, `docs/plan/`, `scripts/plan/`.
2. Apply OW-1's ruling on the Coach OS diff (`tokens.ts`, `src/ui/index.tsx`, `ScreenScaffold.tsx`,
   `TabBar.tsx`, `_layout.tsx`, the four CoachPrompt insertions). Keep the parts that fit; move the
   rest to `wip/coach-os` with a note.
3. Park `app/gym/index.tsx` and `src/features/coach/CoachPrompt.tsx` on the same branch. G16.app
   and SC-1 rebuild them properly.
4. Decide what happens to `apps/mobile/DESIGN.md`, `PRODUCT.md` and `.impeccable/`. They describe
   Coach OS; QA-2 rewrites them for the chosen direction.

**Done when.**
- [ ] `git status` is clean on `main`; nothing is lost (the parked work is on a named branch)
- [ ] `pnpm --filter @fitlog/mobile test` and `uv run pytest -q` pass on the result

### QA-2 · Reconcile the docs with reality
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M0 · **Label:** docs reconciled
- **Needs:** QA-1, OW-2

**Outcome.** Every doc says the same thing as the code and the tracker. The audit of 7 Oct found
29 disagreements ([docs/23 §10](../23-MASTER-PLAN.md#10-doc-discrepancies-qa-2-fixes-these)).

**Scope (the main ones).**
- Tracker: stale boxes TRK:114 (codegen exists), TRK:177 (H-14 is built), TRK:178 and the Q1
  text; one test count; "Blocked: Nothing"
- `docs/10`: a G11 section, handoff record and ledger row; the header and scoreboard
- `docs/11`: L3/L4/L6 rows, the half-done "push main" box, the CI job count (six, not five)
- Charter: Q3 and DR2 rows; a note reconciling "no cloud" with D30 hosting
- `docs/15` status line; `docs/README.md` rows for 18–20, 23 and the decision range
- `apps/mobile/DESIGN.md` and `PRODUCT.md` rewritten for the OW-1 direction (PRODUCT.md:27
  claims phone sign-in exists; it does not)
- `docs/17`: rename the runbook to `docs/24-PILOT-RUNBOOK.md` (18 is taken); one owner tab label
  set (Today · Members · Money · Visits · More); flag the visit-eligibility inconsistency
  (16:600 vs 16:604) to the owner
- `main.py` comment claiming the outbox drains through `/sets/batch` (it does not)

**Done when.**
- [ ] Every item in docs/23 §10 is fixed or explicitly accepted, each with a one-line note
- [ ] The tracker states that the plan board owns goal status from now on

### QA-9 · Lint and coverage gates
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M0 · **Label:** lint + coverage
- **Needs:** QA-1

**Outcome.** TypeScript has a linter and both languages have coverage gates that only go up, so
parallel sessions cannot quietly lower quality.

**Scope.** ESLint (typescript, react-hooks, no-unused) as a CI job, with today's errors fixed and
the stale `eslint-disable` comments resolved. Prettier as format-on-touch (no big-bang reformat
that would collide with every session). `pytest-cov` with a threshold at today's measured value.
The mobile Jest thresholds become a ratchet; the global target stays 80% (D18).

**Done when.**
- [ ] CI runs ESLint and fails on an error (seen to fail once)
- [ ] API coverage is measured in CI with a threshold
- [ ] The ratchet rule is written in `docs/23` §9

### PL-1 · CI green on GitHub, e2e run once, main protected
- **Lane:** S1 Platform · **Size:** S · **Milestone:** M0 · **Label:** CI green
- **Needs:** QA-1

**Outcome.** GitHub, not just a laptop, says `main` is green, and nothing merges without it.

**Scope.** Watch the six `ci.yml` jobs on `main` and fix anything red. Trigger `e2e.yml` with
`workflow_dispatch` and make it pass. The owner turns on branch protection with CI required
(`docs/11` Phase 1, `docs/12` §6).

**Done when.**
- [ ] A green `ci.yml` run on `main` is linked in the tracker
- [ ] A green `e2e.yml` run is linked in the tracker
- [ ] Branch protection is on (owner)

### MS-0 · Ground truth
- **Lane:** Milestones · **Size:** S · **Milestone:** M0 · **Label:** M0 ground truth
- **Needs:** OW-1, OW-2, QA-2, QA-9, PL-1

**Exit.** One UI direction, every launch decision answered, a clean green `main`, docs that agree
with the code, and quality gates that only go up.

---

## M1 · Production platform

### OW-3 · Open the platform accounts
- **Lane:** You · **Size:** M · **Milestone:** M1 · **Label:** platform accounts
- **Needs:** OW-2

**Outcome.** Every account and key the hosted stack needs exists, with spend caps.

**Do.** Supabase Pro for staging and production; the L2 host; a domain and DNS; Resend with a
verified sending domain; a Sentry organisation with two projects; an Anthropic key with a low
spend limit for staging; a GHCR `read:packages` token for the host; Google OAuth clients (web,
Android, iOS); `eas init` for the EAS project id. Put spend alerts on everything that bills
(`docs/12` §15 items 2–7).

**Done when.**
- [ ] Every account above exists, with its secrets in a password manager (never in the repo)
- [ ] Spend alerts are set on Anthropic, Supabase, the host and Sentry

### PL-2 · Staging environment end to end
- **Lane:** S1 Platform · **Size:** M · **Milestone:** M1 · **Label:** staging live
- **Needs:** OW-3, PL-1

**Outcome.** A staging API, worker and Supabase project, deployed by `deploy.yml`, that a staging
build of the app can use for a day.

**Scope.** Supabase staging settings (`docs/12` §15 item 2: Data API off, SSL, session pooler,
private bucket, S3 keys, auth redirect URLs, templates, password rule). Host services for the API
and the worker, including the worker command override (none is defined today). GitHub `staging`
environment secrets, then a green deploy. Sentry smoke test. Re-run `verify-containment.sh`
against staging (I14). Add `apps/mobile/.env.example` listing every `EXPO_PUBLIC_*` the app reads.
Fix `supabase/config.toml`'s pointer to a missing `seed.sql`.

**Done when.**
- [ ] `deploy.yml` deploys staging green and `/health` reports the release
- [ ] The containment script passes against staging
- [ ] A staging build signs in, logs a workout and a meal, and Sentry receives a test event

### PL-3 · Email that arrives
- **Lane:** S1 Platform · **Size:** S · **Milestone:** M1 · **Label:** email + reset
- **Needs:** PL-2

**Outcome.** Sign-up confirmation, password reset and email change reach a real inbox.

**Scope.** Resend as Supabase custom SMTP, SPF and DKIM on the domain, the five templates from
`supabase/templates/`, and a higher emails-per-hour limit. Walk A-05 (reset by link and by code)
and A-06 (verify) through a real inbox.

**Done when.**
- [ ] A-05 and A-06 are walked on a phone against staging, with screenshots in `docs/measurements/`

### PL-4 · Production environment
- **Lane:** S1 Platform · **Size:** M · **Milestone:** M1 · **Label:** production live
- **Needs:** PL-2

**Outcome.** Production runs on its own Supabase project behind HTTPS on the owner's domain,
watched by uptime checks and alerts.

**Scope.** Repeat staging for production with a required reviewer on the GitHub environment.
Domain and HTTPS, an HTTP → HTTPS redirect and HSTS. Uptime check. Scrape `/metrics` and route the
existing alert rules. The public web deletion page (`/account/delete`) goes live for Play Console.

**Done when.**
- [ ] A production deploy passes through the required reviewer and `/health` is green over HTTPS
- [ ] The uptime check and one routed alert are each seen to fire once

### PL-5 · Backups and the restore drill
- **Lane:** S1 Platform · **Size:** S · **Milestone:** M1 · **Label:** restore drill
- **Needs:** PL-4

**Outcome.** A restore has been done once, so backups are proven rather than assumed.

**Scope.** Apply the PITR decision from OW-2. Restore into a scratch project and find yesterday's
data. Photos are not in database backups: add a nightly copy, or record the gap as accepted.

**Done when.**
- [ ] `docs/measurements/restore-drill-<date>.md` records the drill
- [ ] The photo-backup answer is recorded in `docs/12` §11

### PL-6 · Push notifications switched on
- **Lane:** S1 Platform · **Size:** S · **Milestone:** M1 · **Label:** push on
- **Needs:** OW-3

**Outcome.** "Your analysis is ready" arrives as a real push.

**Scope.** Put the EAS project id in the app config (push registration returns `no-project` today,
`features/push/push.ts:24-35`). Set `PUSH_PROVIDER=expo` on staging and production. Verify on a
device.

**Done when.**
- [ ] A push from a finished food analysis is received on an Android device from staging

### AI-1 · Production AI provider, guarded
- **Lane:** S6 AI & Pro · **Size:** S · **Milestone:** M1 · **Label:** real AI, guarded
- **Needs:** PL-2

**Outcome.** Deployed environments use the real model and cannot silently fall back to the stub.

**Scope.** Make `validate_settings` refuse `AI_PROVIDER=stub` when deployed (`config.py:241-280`
allows it today). Check the default model id against the current model list (the code says
`claude-sonnet-5`). Measure cost per analysis on staging. Re-take store screenshot 4 against staging
with the real provider (`docs/13`:93-95).

**Done when.**
- [ ] A test shows a deployed config with the stub provider refuses to start
- [ ] Cost per text and per photo analysis is recorded in the tracker

### MS-1 · Production platform
- **Lane:** Milestones · **Size:** S · **Milestone:** M1 · **Label:** M1 platform
- **Needs:** PL-3, PL-4, PL-5, PL-6, AI-1

**Exit.** Staging and production run on the owner's accounts, with email, push, the real AI
provider, alerts and a proven restore.

---

## M2 · Momentum foundations

### DS-1 · Colour tokens and theme
- **Lane:** S3 Design · **Size:** M · **Milestone:** M2 · **Label:** colour tokens
- **Needs:** QA-1

**Outcome.** The app's colours come from Momentum's Material 3 scheme, in dark and light.

**Scope.** Generate the scheme from seed `#C6F432` with `@material/material-color-utilities`
(docs/22 §4). Add the roles Momentum uses: `data/train`, `data/fuel`, `data/gold`, `data/streak`,
`coach/*` violet, `gym/brand`. Apply OW-1's ruling on green. Volt lime is a container on light
paper, never a thin line (1.1:1). Keep the component-facing token names stable where possible, so
screens recolour without edits.

**Done when.**
- [ ] `contrast.test.ts` is re-pinned to the new palette, including the light-lime rule, and passes
- [ ] Dark and light screenshots of B-01 match the Figma page 02 colours

### DS-2 · Type ramp and fonts
- **Lane:** S3 Design · **Size:** M · **Milestone:** M2 · **Label:** type + fonts
- **Needs:** QA-1

**Outcome.** Words, figures and Hindi each have the right typeface and the Momentum ramp.

**Scope.** Google Sans Flex for words and Roboto Condensed for figures (confirm each licence before
bundling). The ramp includes Display 56/44/36 and number sizes up to 112 (docs/22 §4). On iOS, SF
Pro and SF Pro Rounded. A Devanagari slot (Noto Sans Devanagari or Mukta) shared with G14.app.
Drop the fonts nothing uses.

**Done when.**
- [ ] The ramp is in `tokens.ts` with tests; no screen uses a literal font size outside it
- [ ] A Devanagari sample renders on a release APK

### DS-3 · Motion and haptics
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M2 · **Label:** motion + haptics
- **Needs:** QA-1

**Outcome.** One motion system with spring tokens and haptics, which respects Reduce Motion
everywhere. (Lane S5 is otherwise idle until the gym server exists.)

**Scope.** Add `react-native-reanimated` and `expo-haptics`. Spring tokens and moments from docs/22
§5. A shared `useReducedMotion` hook. Press scale 0.94. Celebration primitives for the PR burst and
the check-in. Haptics: CONFIRM on set logged; SUCCESS on rest end, PR and check-in.

**Done when.**
- [ ] With Reduce Motion on, every animated primitive renders its end state (tested)
- [ ] p95 tap-to-set on a release APK is still under 100 ms (`scripts/measure-p95.sh`)

### DS-4 · Component kit
- **Lane:** S3 Design · **Size:** L · **Milestone:** M2 · **Label:** component kit
- **Needs:** DS-1, DS-2, DS-3

**Outcome.** Every Momentum component exists once, tested, so screen sessions compose rather than
invent.

**Scope.** Built in docs/22's order: wavy progress (linear and circular), the 96 dp primary button,
the connected button group, shape badges (svg), the ring, and the coach proposal card (neutral
card, violet ink, dashed border). Then tonal chips, cards on the new corner tokens, and Material
Symbols Rounded icons replacing Ionicons. A dev-only gallery screen shows each component in both
themes.

**Done when.**
- [ ] Each component has tests, including the Reduce Motion and large-text cases
- [ ] The gallery is screenshotted in both themes into `docs/screenshots/kit/`

### DS-5 · Shell and navigation
- **Lane:** S3 Design · **Size:** M · **Milestone:** M2 · **Label:** shell + tabs
- **Needs:** DS-4

**Outcome.** The app's frame is Momentum: navigation bar, tabs, action menu and screen scaffold.

**Scope.** Android M3 Expressive navigation bar with a pill indicator; the iOS floating bar
(docs/22 §8). Tabs Today · Train · Food · Progress · Gym. Gym appears only for a linked member;
until then it is hidden. Restyle the B-03 action menu and the large-title `ScreenScaffold`.
Leave a `tabsFor(workspace)` seam for G16.app.

**Done when.**
- [ ] Shell tests cover the tab sets, hidden routes and the Gym tab rule
- [ ] Every existing screen still renders inside the new shell (the shell screen suite passes)

### G14.app · Strings catalog, locale formats and the Hindi spine (G14 part 1)
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M2 · **Label:** i18n spine
- **Needs:** QA-1

**Outcome.** Every new or touched screen speaks through `t()`, so Hindi (G14, G23) is a
translation job rather than a rewrite. This lands before the screen sessions, which move strings as
they restyle.

**Scope (docs/17 §4 G14, 17:531–594).** A typed catalog (`src/lib/i18n/{en,hi,index}.ts`, D37).
en-IN and hi-IN formatters (₹1,00,000, dates, counts). A language setting in K-03 plus
`user_profiles.locale` (one small migration). The catalog-completeness guard. The source-scan
guard as a ratchet: it covers the directories already migrated, and each screen goal adds its own.
Devanagari loading per locale, with DS-2.

**Done when.**
- [ ] The catalog test and the source scan are each seen to fail on a planted literal
- [ ] en-IN and hi-IN formatter tests pass
- [ ] `docs/23` §9 states the rule: a screen you touch moves its strings into the catalog

### MS-2 · Momentum foundations
- **Lane:** Milestones · **Size:** S · **Milestone:** M2 · **Label:** M2 foundations
- **Needs:** DS-5, G14.app

**Exit.** Tokens, type, motion, the component kit, the shell and the strings catalog are on `main`.
Screen sessions can now run in parallel.

---

## M3 · Member app in Momentum

### SC-1 · Member hero loop
- **Lane:** S3 Design · **Size:** L · **Milestone:** M3 · **Label:** hero screens
- **Needs:** MS-2

**Outcome.** The screens a member sees every day are Momentum, with earned reward moments.

**Scope (docs/22 page 02).** B-01 Today (week strip, protein ring, win card). E-03 logger (96 dp
*Log set*, PR-pace chip). E-04 rest timer (wavy circle, ±15 s and Skip). E-08 workout complete.
E-11 PR celebration as its own overlay. I-01 strength view with the trophy shelf. H-01 food today
with concentric rings and date navigation (the hook takes a date; docs/15 "next"). H-08 check your
plate with violet dashed proposal cards. A weekly streak from real sessions; add a field to
`/dashboard` if one is needed. Rewards only for real events. Strings go through `t()`.

**Done when.**
- [ ] Each screen's presentation tests are updated, and the AC flows still pass on a release APK
- [ ] p95 tap-to-set stays under 100 ms with the new logger
- [ ] Screenshots in both themes sit next to their Figma frames in `docs/screenshots/momentum/`

### SC-2 · Train, logger details and history
- **Lane:** S4 Member app · **Size:** L · **Milestone:** M3 · **Label:** train + history
- **Needs:** SC-1

**Outcome.** Everything under Train is Momentum: programs, the library, the rest of the logger,
history.

**Scope (docs/22 pages 07–08).** C-01…C-08 (including the C-09 archive dialog), D-01…D-04 (D-04
muscle editing), E-01, E-02, E-05, E-06, E-07, E-09, E-10, E-12 and supersets, F-01…F-07. These
files are `app/train/**`, `app/session/**` and `features/workout-session/**`. It runs after SC-1
because both edit the logger.

**Done when.**
- [ ] The presentation tests are updated; ac-01, ac-02, ac-04, ac-05 and the offline flows pass on
  a release APK
- [ ] The touched directories are in the i18n source-scan guard

### SC-3 · Analytics, body and goals
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M3 · **Label:** analytics + body
- **Needs:** MS-2

**Outcome.** Progress screens are Momentum, and the charts work by touch.

**Scope (docs/22 page 09).** G-01…G-07, I-02…I-06, J-01…J-04. These are `app/train/analytics/**`
and `app/progress/**`, except I-01 (SC-1). Add the chart tooltip and touch equivalent left over
from G6.

**Done when.**
- [ ] ac-11 passes; the G-03 and G-04 chart tests cover the touch read-out
- [ ] The touched directories are in the i18n source-scan guard

### SC-4 · Food
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M3 · **Label:** food screens
- **Needs:** MS-2, SC-1

**Outcome.** Every food screen is Momentum.

**Scope (docs/22 page 10).** H-02…H-07, H-09…H-16, H-18 in `app/nutrition/**`. H-01 and H-08 are
SC-1's. The P-04 locked state waits for G15.app.

**Done when.**
- [ ] ac-07, ac-08, ac-09 and ac-10 pass on a release APK
- [ ] The touched directories are in the i18n source-scan guard

### SC-5 · Auth and onboarding
- **Lane:** S3 Design · **Size:** M · **Milestone:** M3 · **Label:** auth + onboarding
- **Needs:** MS-2

**Outcome.** First run is Momentum, from splash to the first plan.

**Scope (docs/22 page 06).** A-01…A-10, including the per-step onboarding (one route today). If
G13 has landed, A-11 and A-12 too.

**Done when.**
- [ ] The sign-in Maestro flows pass on a release APK; the onboarding tests are updated
- [ ] The touched files are in the i18n source-scan guard

### SC-6 · Settings
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M3 · **Label:** settings screens
- **Needs:** MS-2

**Outcome.** Every settings screen is Momentum.

**Scope (docs/22 page 11).** K-01…K-10, import, feedback and licences in `app/settings/**`. P-01…P-03
belong to G15.app.

**Done when.**
- [ ] The settings and privacy tests are updated; account export and delete still pass end to end
- [ ] The touched directories are in the i18n source-scan guard

### SC-7 · System states
- **Lane:** S3 Design · **Size:** S · **Milestone:** M3 · **Label:** system states
- **Needs:** DS-4

**Outcome.** Empty, error, offline, conflict, expired and maintenance states are Momentum.

**Scope (docs/22 page 15).** L-01…L-08: `EmptyState`, `DataBoundary`, `SyncBanner`, the sync
centre, the conflict screen, `SessionExpiredDialog`, `PermissionPrimer` and `ServiceNotices`.

**Done when.**
- [ ] `DataBoundary` keeps its 95% coverage gate; every state is screenshotted in both themes

### AP-1 · Manage programs, exercises and custom foods
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M3 · **Label:** manage menus
- **Needs:** DS-4

**Outcome.** Users can do in the app everything the API already lets them do.

**Scope.** These client functions exist with no UI (code audit 2.2): rename, duplicate, archive and
delete a program; delete a plan day; edit and archive an exercise; delete a custom food. Add the
D-01 long-press menu and the ⋮ menus on C-02 and C-03 (left over from G2). Add the warning on D-03
for a near-duplicate exercise name.

**Done when.**
- [ ] Each action has a test that asserts the request and the cache invalidation
- [ ] Destructive actions confirm first, and archived items can be found again

### AP-2 · Edit a past session properly (F-04)
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M3 · **Label:** past-session edit
- **Needs:** DS-4

**Outcome.** Editing an old session never stretches its duration to days (tracker TRK:335).

**Scope.** The specified F-04 edit mode: edit sets, exercises and notes on a finished session
without reopening it as live. Decide whether the unused `POST /workout-sessions/{id}/reopen` stays.

**Done when.**
- [ ] A test edits a session from three days ago; its start, end and duration are unchanged
- [ ] Analytics and PRs recompute after the edit (tested)

### QA-3 · Momentum verification pass
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M3 · **Label:** verify Momentum
- **Needs:** SC-1, SC-2, SC-3, SC-4, SC-5, SC-6, SC-7, AP-1, AP-2

**Outcome.** The restyled app is proven on a device: both themes, large text, a screen reader and
the performance budgets.

**Scope.** Native screenshots of every screen in dark and light, at the largest font scale and at
a narrow width. A TalkBack pass on every changed screen. Re-measure p95 tap-to-set, cold start and
bundle size on a release APK (Reanimated and the fonts are new weight). Refresh `docs/screenshots/`.

**Done when.**
- [ ] The a11y audit has a new dated section, with every finding fixed or accepted
- [ ] p95 under 100 ms, cold start and bundle size are recorded in `docs/nfr-evidence.md`

### MS-3 · Member app in Momentum
- **Lane:** Milestones · **Size:** S · **Milestone:** M3 · **Label:** M3 member app
- **Needs:** QA-3

**Exit.** Every member screen in the inventory is Momentum and verified, and the API's management
actions all have UI.

---

## M4 · Launch foundations: phone, Hindi, Pro

### OW-5 · Start the SMS and WhatsApp registrations
- **Lane:** You · **Size:** M · **Milestone:** M4 · **Label:** DLT + Meta setup
- **Needs:** OW-2

**Outcome.** The long-lead registrations are underway on day one. They take weeks, and both phone
sign-in and gym messaging wait on them.

**Do.** Register the entity and the OTP template on DLT (TRAI) with the SMS provider (Q24 default:
MSG91, Twilio fallback). Start Meta Business verification for the WhatsApp platform number (Q23).
See docs/17:1164–1171.

**Done when.**
- [ ] The SMS provider can send a DLT-approved OTP to an Indian number
- [ ] Meta Business verification is approved

### OW-7 · Set the Pro price and the store products
- **Lane:** You · **Size:** S · **Milestone:** M4 · **Label:** Pro price + products
- **Needs:** OW-4

**Outcome.** Pro exists as products in both stores and in RevenueCat, so G15 can be wired end to end.

**Do.** Confirm the member price (Q26 default: ₹149 a month, ₹999 a year, 7-day trial). Create the
RevenueCat project and the subscription products in Play Console and App Store Connect. Set up
sandbox testers.

**Done when.**
- [ ] The products are visible in RevenueCat for both platforms, with the sandbox tester accounts

### G13 · Phone sign-in
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M4 · **Label:** phone sign-in
- **Needs:** QA-1, OW-5

**Outcome.** An Indian mobile number and an OTP are enough to create and use an account; email
becomes optional (A01.1–A01.4).

**Scope (docs/17 §4 G13, 17:466–527).** `m19_phone_identity`: email nullable, unique `phone_e164`,
a CHECK constraint. Provisioning and `MeOut.phone`. `POST /v1/hooks/send-sms` with a Standard
Webhooks signature and `SmsSender`/MSG91. The `sms` rate policy. Supabase `[auth.sms]` on. Client
A-11 and A-12, `signInWithPhone`, phone re-auth. Fix every assumption that `.email` is present.
Record decision D36 (phone identity).

**Done when.**
- [ ] `test_phone_identity.py` and `test_send_sms_hook.py` pass; deletion and export work for a
  phone-only account
- [ ] Maestro `sign-in-phone.yaml` passes, and a real OTP arrives on staging

### G14.data · Indian food depth and Hinglish search (G14 part 2)
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M4 · **Label:** Indian food 500+
- **Needs:** QA-1

**Outcome.** Indian users find their food by the name they type, with household portions
(M03.1–M03.3, L01.3–L01.4).

**Scope (docs/17 17:563–569).** At least 500 USDA-derived Indian dishes; no IFCT
(`docs/data-sources.md`). Household units (katori, roti, glass, ladle, plate). Each dish shows its
source and basis. Hindi and Hinglish aliases for foods and exercises. Bump `SEED_VERSION`.

**Done when.**
- [ ] ≥ 500 `fitlog_indian` rows, each energy value checked against its macros (the existing test)
- [ ] The food search benchmark does not regress; the Hinglish searches find the intended food first

### G15.api · Pro entitlements on the server
- **Lane:** S6 AI & Pro · **Size:** M · **Milestone:** M4 · **Label:** entitlements API
- **Needs:** OW-7, AI-1

**Outcome.** No AI model is called without a server-side Pro check (I21, D33).

**Scope (docs/17 §4 G15, 17:598–655).** `m20_entitlements`. `app/billing/` with the RevenueCat
webhook, `GET /v1/me/entitlements`, `MeOut.pro` and admin grants. `CurrentProUser` and 403
`PRO_REQUIRED` on `/food-analysis/text` and `/image`, re-checked in the worker. A Pro cap of 20 a
day replaces `AI_DAILY_QUOTA`. Record decision D38.

**Done when.**
- [ ] `test_pro_gate.py` shows zero gateway calls for a non-Pro user; webhook replay changes nothing
- [ ] `packages/api-types` is regenerated and merged (SP3)

### G15.app · Paywall and Pro in the app
- **Lane:** S6 AI & Pro · **Size:** M · **Milestone:** M4 · **Label:** paywall + ProGate
- **Needs:** G15.api, MS-2

**Outcome.** Members can start a trial, buy, restore and manage Pro, and every AI entry point
respects it (AC-22, AC-28).

**Scope.** `react-native-purchases`, feature-detected (Expo Go cannot load it). P-01 paywall, P-02
trial started, P-03 manage Pro (replaces K-11), P-04 locked state, all in Momentum. `ProGate` on
every AI entry point listed at 17:627. The `entitlement.changed` mutation kind. Honest paywall copy
(no dark patterns).

**Done when.**
- [ ] Jest covers ProGate on every entry point; AC-22 and AC-28 pass
- [ ] Sandbox purchase and restore work on Android and on iOS

### MS-4 · Launch foundations
- **Lane:** Milestones · **Size:** S · **Milestone:** M4 · **Label:** M4 phone/Hindi/Pro
- **Needs:** G13, G14.data, G15.app

**Exit.** Phone sign-in, the strings catalog with Indian food depth, and Pro are on `main`. These
serve both the store launch and the gym platform (docs/17:30–32), and D33 puts Pro before the store
launch.

---

## M5 · Store launch

### OW-4 · Store accounts and signing keys
- **Lane:** You · **Size:** S · **Milestone:** M5 · **Label:** store accounts
- **Needs:** OW-2

**Outcome.** The app can be signed and submitted on both stores.

**Do.** Play Console ($25). Apple Developer Program ($99 a year). A real Android upload key, kept
out of the repo and backed up twice. Enrol in Play App Signing; give both SHA-1s to the Android
OAuth client. Configure Sign in with Apple, which iOS requires once Google sign-in is offered.

**Done when.**
- [ ] Both accounts are active; the upload key's two backups are confirmed

### OW-6 · Legal pages and counsel review
- **Lane:** You · **Size:** M · **Milestone:** M5 · **Label:** legal + counsel
- **Needs:** OW-2, OW-3, PL-4

**Outcome.** The privacy policy and terms are final, reviewed and public.

**Do.** Resolve every `[OWNER: …]` marker in `services/api/app/legal/privacy.html` and `terms.html`.
Name the processors (host, email, Sentry, Anthropic). Add the Health Connect and HealthKit
statements. State the age position: Q9 says 16+, Q33 says 18+ for India. Get counsel review, then
publish at the public URLs.

**Done when.**
- [ ] No `[OWNER:` marker remains; counsel's sign-off is recorded in charter §6
- [ ] The pages are served over HTTPS from production

### DS-6 · App icon, splash and store art
- **Lane:** S3 Design · **Size:** S · **Milestone:** M5 · **Label:** icon + store art
- **Needs:** OW-1, OW-2

**Outcome.** The icon and store art match the app; today they are still Iris violet (D9).

**Scope.** Icon, adaptive icon, splash and notification colour (`#5A31C4` today) in volt lime under
the L8 name. The Play feature graphic. The owner approves the final art.

**Done when.**
- [ ] New assets are in `apps/mobile/assets/`, regenerated by script, and approved by the owner

### OW-13 · Skim the drafted exercise instructions
- **Lane:** You · **Size:** S · **Milestone:** M5 · **Label:** skim exercise texts
- **Needs:** —

**Outcome.** A human has read the 238 drafted instruction texts once before the public sees them
(`docs/11`:162).

**Done when.**
- [ ] Corrections are filed as one list for S4, or "no changes" is recorded in the tracker

### PL-7 · Android store build
- **Lane:** S1 Platform · **Size:** S · **Milestone:** M5 · **Label:** Android store build
- **Needs:** OW-4, PL-4, DS-6

**Outcome.** An AAB signed through Play App Signing and pointing at production is on the Play
internal track.

**Scope.** `EXPO_PUBLIC_API_URL` set to the production HTTPS API, Sentry DSN and auth token, an EAS
production build, submission to the internal track. App Links with `assetlinks.json` on the domain
(closes the `fitlog://` scheme finding).

**Done when.**
- [ ] The internal-track build installs from Play and signs in against production
- [ ] An App Link opens the app from a browser

### PL-8 · iOS build and device proof
- **Lane:** S1 Platform · **Size:** L · **Milestone:** M5 · **Label:** iOS build
- **Needs:** OW-4, PL-4, DS-6

**Outcome.** iOS exists. It has never been built, which leaves charter goal "MVP on iOS and
Android" unmet.

**Scope.** EAS iOS credentials, the bundle id, the HealthKit capability, Sign in with Apple,
Universal Links, a TestFlight internal build. On a real iPhone: D14 (kill mid-set, reopen), the
offline and recovery Maestro flows, and an Apple Health weight read. The owner provides the iPhone.

**Done when.**
- [ ] A TestFlight internal build passes the offline and recovery flows on an iPhone
- [ ] An Apple Health weight sync is seen on a device

### QA-4 · Device walkthroughs and accessibility on both platforms
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M5 · **Label:** device walkthroughs
- **Needs:** PL-7, PL-8, MS-3, MS-4

**Outcome.** Every flow a user can reach has been walked on real phones, on both platforms, by
screen reader too.

**Scope.** Walk the new screens on a phone (`docs/TODO.md`:59–62), including the Supabase sign-in
paths and "Continue with Google". K-09 with a real smart scale. A VoiceOver pass on the logger and
the diary. TalkBack spot checks. Re-run every acceptance flow on release builds of both platforms
(iOS for the first time).

**Done when.**
- [ ] The acceptance suite is green on Android and iOS release builds, with the date in the tracker
- [ ] The VoiceOver findings are fixed or accepted in the a11y audit

### QA-5 · Store listings and compliance forms
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M5 · **Label:** listings + forms
- **Needs:** OW-6, OW-13, PL-7, PL-8, MS-3, MS-4

**Outcome.** Every store form is filled from the drafts in `docs/13`, against the app that ships.

**Scope.** Momentum screenshots (Android and both iPhone sets) and the feature graphic. Play Data
Safety, the Health apps and Health Connect declarations, Apple App Privacy labels, content rating
(age per OW-6). Reviewer notes and a production demo account. The listing copy updated for Pro and
Hindi. Support email and landing page (the owner hosts them on the domain).

**Done when.**
- [ ] Every form in `docs/13` is submitted and marked so in that file
- [ ] The demo account works on production

### OW-8 · Recruit the beta testers
- **Lane:** You · **Size:** S · **Milestone:** M5 · **Label:** beta testers
- **Needs:** OW-2

**Outcome.** 12–20 testers committed for 14 days, with a feedback channel.

**Done when.**
- [ ] The tester list and the feedback channel exist; testers know the dates

### QA-6 · Beta on both stores
- **Lane:** S7 Quality · **Size:** L · **Milestone:** M5 · **Label:** beta 14 days
- **Needs:** QA-4, QA-5, OW-8, MS-1

**Outcome.** A Play closed test (at least 12 testers for 14 continuous days) and a TestFlight
external beta have run, and their findings are fixed. The 14 days are the long pole: start the
moment a build talks to staging.

**Scope.** Weekly triage of the feedback, fixes, the acceptance suite re-run on both platforms
after the fixes, and the first App Review.

**Done when.**
- [ ] Play's 14-day requirement is met, and TestFlight external has passed review
- [ ] Every beta finding is fixed or deferred with a reason in the tracker

### QA-7 · Launch: staged rollout and launch-week watch
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M5 · **Label:** launch
- **Needs:** QA-6

**Outcome.** FitLog is public on both stores and watched through its first week.

**Scope.** A staged rollout on Play and a phased release on iOS. Watch crash-free rate, error rate,
AI cost per user, and sign-up → first set. Halt and fix if a guardrail breaks: tap-to-set p95 under
100 ms, under 0.1% of sessions lost.

**Done when.**
- [ ] Both stores are at 100% rollout; the launch-week numbers are in the tracker

### MS-5 · Store launch
- **Lane:** Milestones · **Size:** S · **Milestone:** M5 · **Label:** M5 STORE LAUNCH
- **Needs:** QA-7

**Exit.** FitLog is live on Google Play and the App Store, in Momentum, with phone sign-in, Hindi,
Pro and production infrastructure.

---

## M6 · Gym pilot (MVP)

### OW-9 · Field validation (G12): interviews, counsel, pilot gyms, pre-sell
- **Lane:** You · **Size:** L · **Milestone:** M6 · **Label:** G12 field work
- **Needs:** —

**Outcome.** The evidence for D31's go/no-go: whether owners and members want this, what counsel
allows, and five gyms ready to pilot.

**Do (docs/17 §4 G12, 17:401–462).** 20–30 owner and 30–50 member interviews. Counsel on invite and
consent copy, terms and DPA, the enrolment notice, minors (Q28, Q33) and the AI-calling opinion.
Recruit five gyms in one cluster with signed pilot terms and a baseline. A two-gym concierge pilot.
Pre-sell Owner Pro. Answer or default Q21–Q33.

**Done when.**
- [ ] Interview notes, counsel memo (copy marked "approved"), five signed gyms with baselines and
  pre-sell results are in `docs/research/`

### AI-2 · Food-AI accuracy harness (G12 part)
- **Lane:** S6 AI & Pro · **Size:** M · **Milestone:** M6 · **Label:** AI accuracy test
- **Needs:** QA-1, OW-3

**Outcome.** A measured accuracy table for food AI on Indian meals, for at least two models
(H12.3). It feeds the go memo and later the register reader (G30).

**Scope.** `services/api/scripts/measure_food_accuracy.py` and a weighed-meal protocol: photographs
and weights of real plates, with error per macro and per dish class.

**Done when.**
- [ ] The accuracy table for ≥ 2 models is in `docs/research/`, with the script re-runnable

### OW-10 · G12 go/no-go memo
- **Lane:** You · **Size:** S · **Milestone:** M6 · **Label:** G12 go memo
- **Needs:** OW-9, AI-2

**Outcome.** A written go or no-go for the gym platform (H12.1–H12.4). **No-go** stops every G16+
goal; mark them On hold. G13–G15 are kept either way.

**Done when.**
- [ ] `docs/research/R4-validation.md` states go or no-go, with the evidence and Q21–Q33 answered

### OW-11 · WhatsApp templates approved
- **Lane:** You · **Size:** S · **Milestone:** M6 · **Label:** Meta templates
- **Needs:** OW-5, OW-10

**Outcome.** The invite, receipt, renewal and exit templates are approved by Meta as utility
messages in English and Hindi, using the counsel-approved copy (H12.2). G18 and G20 need them to
start.

**Done when.**
- [ ] Each template's approval is recorded, with its id, in `docs/17` or the tracker

### G16.api · Gym tenancy, roles, policy, consent, audit and jobs
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M6 · **Label:** tenancy API
- **Needs:** OW-10, G13

**Outcome.** A gym exists as a tenant with staff roles. Every gym read goes through one policy
module. Another gym's data is a 404 (I16).

**Scope (docs/17 §4 G16, 17:659–722).** `m21_tenancy` (organizations, gyms, staff_memberships,
gym_members core, consents, audit_log, jobs). `app/policy/`. The `gyms` and `gym_staff` routes. The
route-walker isolation test. The D41 deletion and export rule for gym-owned tables (`SET NULL`).
`JobWorker` and the gym-time scheduler. The `gym_invites` and `visits` rate policies. Record D39,
D40 and D41.

**Done when.**
- [ ] AC-17 passes; the policy tests mirror the §8.1 matrix; the route walker covers every route
- [ ] The job and scheduler tests pass; packages/api-types is regenerated (SP3)

### G16.app · Workspaces and the gym shell
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** workspace switcher
- **Needs:** G16.api, MS-2

**Outcome.** Staff switch between Personal and their gym, and each role gets its own tabs.

**Scope.** `src/features/workspace/`, a preference-backed switcher under the avatar, and
`tabsFor(workspace)` on DS-5's seam. Owner tabs: Today · Members · Money · Visits · More. Trainer
tabs: Today · Members · Plans · More. O-01 create gym and switcher, an empty O-02, `api-gym.ts`.
This replaces the parked preview `app/gym/index.tsx`.

**Done when.**
- [ ] Jest covers `tabsFor` for each role and the workspace persistence
- [ ] All new strings are in the catalog, English and Hindi

### G17.api · Owner core on the server
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M6 · **Label:** owner core API
- **Needs:** G16.api

**Outcome.** Members, imports, plans, memberships, fees, receipts and export work on the server,
with money in paise and corrections by reversal only (I18).

**Scope (docs/17 §4 G17, 17:726–779).** `m22_owner_core`. `domain/memberships.py` with the
`nightly_status` job. Routes for members, imports (CSV/XLSX, at most 2,000 rows), plans,
memberships, money and export. Server-assigned, gap-free receipt numbers. Export and offboarding
jobs. Audit writes, freeze approval, GST lines, the notice version, erasure requests. Record D42.

**Done when.**
- [ ] AC-21: 50 parallel payments get gap-free receipt numbers; AC-24 passes; no float holds money
- [ ] p95 under 300 ms on the member list; packages/api-types is regenerated (SP3)

### G17.app · Owner screens
- **Lane:** S5 Gym app · **Size:** L · **Milestone:** M6 · **Label:** owner screens
- **Needs:** G17.api, G16.app

**Outcome.** An owner runs the front desk from the app: members, import, plans, payments, receipts,
dues, staff, reports, export.

**Scope.** O-02…O-11, O-15, O-16, O-17, O-19 and O-20 (counts only), in Momentum (docs/22 page 13).
Offline payments go through the outbox. AC-13 is timed.

**Done when.**
- [ ] AC-13 passes within its time; Jest covers O-03, O-06 and O-09 in English and Hindi
- [ ] A payment recorded offline syncs exactly once (tested)

### G18.api · Members join, on the server
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M6 · **Label:** join + WhatsApp API
- **Needs:** G17.api, G13, OW-11

**Outcome.** Invites, linking, per-gym consent and WhatsApp messages in the gym's name. Marketing to
a gym-supplied number is impossible in code (I22).

**Scope (docs/17 §4 G18, 17:783–834).** `whatsapp.py` `MessageSender`, the template registry,
`m23_messaging`, the WhatsApp webhook. The I22 guard and a per-gym spend ceiling. Invites and
linking. The member API. The age gate at the agreed minimum (Q33). Record D43.

**Done when.**
- [ ] AC-23 is seen to fail without the guard; AC-27 passes for invite and link; invites deduplicate
- [ ] packages/api-types is regenerated (SP3)

### G18.app · Join a gym and the gym card
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** join + gym card
- **Needs:** G18.api, G17.app

**Outcome.** A member taps an invite, confirms, and lands on their gym card; their consent is in
their own hands.

**Scope.** A-13 join (deep link and code), A-14 age and consent, N-01 gym card (home card and full
screen, the Gym tab appears), N-04 receipts and dues, N-05 sharing and consent, N-10 freeze request,
O-20 statuses and resend. Invited members skip program setup.

**Done when.**
- [ ] AC-14: Maestro `join-gym.yaml` passes on a release APK
- [ ] N-01 is screenshotted in Hindi and English

### G19.api · Visits without a gate
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M6 · **Label:** visits API
- **Needs:** G18.api

**Outcome.** Visits are recorded from the poster scan, workouts at the gym, staff marks and device
imports. No coordinates are stored (I23), and the gym layer never blocks training (I20).

**Scope (docs/17 §4 G19, 17:838–887).** `m24_visits`, signed poster payloads and a printable PDF,
`POST /v1/me/visits` with a distance band only, the workout-at-gym candidate, manual marks, the
device-import wizard API, a reliability flag. Record D44.

**Done when.**
- [ ] AC-16 (stored unverified) and the tamper test pass; no lat/lng column or log line exists
- [ ] The containment test (I20) passes; device import is idempotent

### G19.app · Check-in scanner and visit screens
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** check-in scanner
- **Needs:** G19.api, G18.app

**Outcome.** A member checks in by scanning the poster, offline too, in under three seconds.

**Scope.** `expo-camera` and `expo-location` behind the permission primer. N-02 scanner, N-03 "you're
in" with the celebration (DS-3), O-12 visits, O-13 visit import. The outbox path for offline scans.

**Done when.**
- [ ] AC-15: a check-in works offline with p95 under 3 s, measured on a release APK

### G20.api · Alerts, renewal reminders and exit reasons
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M6 · **Label:** retention API
- **Needs:** G19.api, OW-11

**Outcome.** Owners get confident "call these members today" lists and renewal reminders that go
out once each, in the gym's hours.

**Scope (docs/17 §4 G20, 17:891–936).** `m25_retention`, pure `domain/retention.py`, the
`evaluate_alerts`, `renewal_reminders` and `cost_report` jobs, the consented progress line, the
`gym_calls` push, exit reasons, the precision metric in `GET /v1/admin/gym-metrics`. Record D45.

**Done when.**
- [ ] AC-19 and AC-20 pass; reminders fire once each between 09:00 and 20:00 gym time (tested)

### G20.app · Today's calls
- **Lane:** S5 Gym app · **Size:** S · **Milestone:** M6 · **Label:** today's calls
- **Needs:** G20.api, G17.app

**Outcome.** O-14 lists today's calls with click-to-chat in the owner's own WhatsApp, and records
the outcomes.

**Done when.**
- [ ] A `gym_calls` push opens O-14 (tested); an outcome recorded on O-14 updates the precision metric

### G21.api · Trainer plan loop on the server
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M6 · **Label:** trainer API
- **Needs:** G18.api

**Outcome.** Gym templates, plan assignment as the member's own copy, and consented member views
for trainers.

**Scope (docs/17 §4 G21, 17:940–979).** `m26_plan_loop` (template columns on `workout_programs`,
`plan_assignments`, `body_metrics.recorded_by_user_id`), the deep-copy assignment, `member_data()`
reads. Record D46.

**Done when.**
- [ ] AC-18 and the I1 test pass; one trainer cannot read another trainer's member (policy test)

### G21.app · Trainer workspace
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** trainer screens
- **Needs:** G21.api, G18.app

**Outcome.** Trainers see today's members, assign plans and record measurements. Members see
"today's plan from <trainer>".

**Scope.** T-01…T-05 (no AI copilot in the MVP), N-06, and the B-01 trainer-plan and weekly
improvement cards.

**Done when.**
- [ ] Maestro `trainer-assigns-plan.yaml` passes on a release APK

### G22.api · Challenges, share cards and referrals on the server
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M6 · **Label:** challenges API
- **Needs:** G19.api

**Outcome.** Attendance challenges, a league leaderboard, weekly visit streaks and referral
attribution.

**Scope (docs/17 §4 G22, 17:983–1016).** `m27_challenges` and the standings and streak job. Standings
exclude unverified scans, minors and opt-outs; names are masked. The eligibility rule follows the
owner's QA-2 answer.

**Done when.**
- [ ] The standings tests cover each exclusion and the name masking; attribution is tested

### G22.app · Challenge, leaderboard and refer screens
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** challenge screens
- **Needs:** G22.api, G19.app

**Outcome.** Members see their gym's challenge and standing, share gym-named cards, and refer
friends.

**Scope.** O-18, N-07 (a Momentum hero), N-08, gym-named share cards with an opt-out
(`react-native-view-shot`, `expo-sharing`), the gym name on the E-11 PR card.

**Done when.**
- [ ] The share card renders the gym name, and none when the member opts out (tested)

### G23 · Pilot release
- **Lane:** S7 Quality · **Size:** L · **Milestone:** M6 · **Label:** pilot release
- **Needs:** G17.app, G18.app, G19.app, G20.app, G21.app, G22.app, PL-7, PL-8, OW-6, MS-4

**Outcome.** The five pilot gyms run on the MVP, in Hindi and English, on low-end Android phones.

**Scope (docs/17 §4 G23, 17:1020–1074).** A native-speaker Hindi review, with the i18n source scan
widened to all of `app/`. A reference ₹8–10k phone with an APK size budget. Instrumentation for the
pilot funnels. Legal pages updated for gym roles. The runbook at `docs/24-PILOT-RUNBOOK.md`. A
nightly Maestro gym suite. TestFlight and Play internal builds for pilot users.

**Done when.**
- [ ] AC-25 and AC-26 pass; the nightly gym suite is green; the runbook is reviewed
- [ ] The pilot gyms are live, with their funnels visible

### MS-6 · Gym pilot (MVP)
- **Lane:** Milestones · **Size:** S · **Milestone:** M6 · **Label:** M6 gym pilot
- **Needs:** G23

**Exit.** The gym MVP (G16–G23) runs in the pilot gyms. The pilot gate (OW-12) decides what comes
next.

---

## M7 · Gym Phase 2 (only after the pilot says "scale")

### OW-12 · Run the pilot and call the gate
- **Lane:** You · **Size:** L · **Milestone:** M7 · **Label:** pilot gate call
- **Needs:** MS-6

**Outcome.** A written scale, fix or stop decision against the §6.1 gate (16:259–268). The gate
needs ≥ 40% of active members linked by day 60, ≥ 25% of linked members logging weekly, renewals up
in ≥ 3 of 5 gyms, and ≥ 2 of 5 owners saying yes to the Pro price. Also decide Q31, the payment
aggregator.

**Done when.**
- [ ] The decision memo is in `docs/research/`. If the call is stop or fix, mark the M7 goals On hold
  and close MS-7 with a note

### G24 · Owner Pro and AI assistance
- **Lane:** S6 AI & Pro · **Size:** L · **Milestone:** M7 · **Label:** Owner Pro
- **Needs:** OW-12, G15.api, G20.api

**Outcome.** Owners pay for AI help: why this member is at risk, drafted messages, ask-the-gym, a
diet-chart digitiser and the trainer plan copilot (PRO05, GYM08.6, O-21), with web billing.

**Done when.**
- [ ] Every Owner Pro AI call is entitlement-checked (I21) and covered by the pro-gate tests

### G25 · Member AI set logging and weekly review
- **Lane:** S6 AI & Pro · **Size:** L · **Milestone:** M7 · **Label:** member AI
- **Needs:** OW-12, G15.app

**Outcome.** Pro members log sets by text or voice (confirm-only), and get a weekly AI review and
ask-your-data (PRO03, PRO04, P-05, P-06).

**Done when.**
- [ ] Nothing the AI proposes is saved without the member's confirmation (tested); p95 tap-to-set
  is unchanged

### G26 · AI calling (gated by counsel)
- **Lane:** S6 AI & Pro · **Size:** L · **Milestone:** M7 · **Label:** AI calling
- **Needs:** OW-12, G24

**Outcome.** The Owner Pro usage tier for AI calls: consent, pre-declaration, triggers, outcomes,
metering and retention (PRO06, O-22). It ships only with counsel's opinion (D34).

**Done when.**
- [ ] Counsel's opinion is recorded; calls happen only with the AI-calls consent purpose (tested)

### G27 · Online collection and Autopay
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M7 · **Label:** online payments
- **Needs:** OW-12, G17.api

**Outcome.** Members pay fees online through the aggregator chosen in Q31, settling directly to the
gym. FitLog never holds funds (GYM04.8).

**Done when.**
- [ ] A payment reconciles to a receipt exactly once, with webhook replay safety (tested)

### G28 · Web console and multi-branch
- **Lane:** S5 Gym app · **Size:** L · **Milestone:** M7 · **Label:** web console
- **Needs:** OW-12, G17.app

**Outcome.** Owners run the desk from a browser, and multi-branch gyms switch branches (GYM01.7).

**Done when.**
- [ ] The web console passes the same isolation tests as the app (I16)

### G29.api · Retention depth on the server
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M7 · **Label:** retention depth API
- **Needs:** OW-12, G22.api

**Outcome.** The server half of docs/17's G29: automatic device import, PT packs, break mode, the
fitness passport, the cohort report, broadcast credits, and the gym's own WhatsApp number.

**Done when.**
- [ ] Each item has its tests and its packages/api-types change merged

### G29.app · Retention depth in the app
- **Lane:** S5 Gym app · **Size:** L · **Milestone:** M7 · **Label:** retention depth app
- **Needs:** G29.api, G22.app

**Outcome.** The app half of G29: N-09 break mode, the floor screen, PT pack and assessment-day
screens, the passport.

**Done when.**
- [ ] Each screen has its tests in English and Hindi

### G30 · Register reader (the one free AI)
- **Lane:** S6 AI & Pro · **Size:** M · **Milestone:** M7 · **Label:** register reader
- **Needs:** OW-12, AI-2

**Outcome.** An owner photographs the paper register and gets member rows to confirm. It is free,
because it is how a gym goes live (D33, GYM02.9, O-06b).

**Done when.**
- [ ] Accuracy on real registers is measured with the AI-2 harness; nothing is imported without
  confirmation

### MS-7 · Gym Phase 2
- **Lane:** Milestones · **Size:** S · **Milestone:** M7 · **Label:** M7 Phase 2
- **Needs:** G24, G25, G26, G27, G28, G29.app, G30

**Exit.** Phase 2 is shipped, or OW-12 closed it with a stop or fix decision (record which in the
note).

---

## M8 · Depth and polish

### AP-3 · Progression engine: next session's weights, by rule
- **Lane:** S4 Member app · **Size:** L · **Milestone:** M8 · **Label:** progression engine
- **Needs:** MS-5

**Outcome.** When a session opens, the weights are already right, and each target says why. Today
the 14 templates store progression as free text (`program_templates.py`).

**Scope.** Pure functions in `packages/domain/src/training/progression.ts`, with shared contract
vectors: linear, double progression through a rep range, an AMRAP top set (GZCLP style), and added
time for timed sets. Missed reps never advance the load; stalls trigger a deload; bodyweight work
progresses in reps. Templates move from free text to structured rules. The rules come from training
methodology, not from any AGPL code (memory: opengym-licensing).

**Done when.**
- [ ] The vectors pass in both TypeScript and Python; each template's rule is covered
- [ ] The logger shows the target and its reason; the member can override it

### AP-4 · Muscle body map
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M8 · **Label:** body map
- **Needs:** MS-5

**Outcome.** Exercise detail, the muscle-balance view and the session summary show the muscles
worked on a body diagram.

**Scope.** Convert the MuscleMap outlines (melihcolpan/MuscleMap, MIT) to react-native-svg yourself.
Do not copy openGym's converted file. Credit MuscleMap in licences.

**Done when.**
- [ ] D-02, G-02 and E-08 show the map; the MIT notice is in `licences.json`

### AP-5 · Small parity wins
- **Lane:** S3 Design · **Size:** M · **Milestone:** M8 · **Label:** parity wins
- **Needs:** MS-5

**Outcome.** The small things lifters notice.

**Scope.** Keep the screen awake while a workout runs (`expo-keep-awake`, with a setting). Do not
estimate e1RM above 12 reps: bump `E1RM_FORMULA_VERSION`, keeping history reproducible. Move a day's
workout to another day without editing the weekly plan. Add a FitNotes CSV import next to Strong and
Hevy.

**Done when.**
- [ ] Each item has tests; old e1RM values keep their stored formula version

### AP-6 · Offline reads
- **Lane:** S1 Platform · **Size:** M · **Milestone:** M8 · **Label:** offline reads
- **Needs:** MS-5

**Outcome.** Read screens show the last known data offline. Today only writes work offline; there is
no persisted query cache.

**Scope.** Persist the query cache for read screens and set `networkMode` deliberately. Show
staleness in the UI. "Offline-first sync of every entity" stays in the backlog.

**Done when.**
- [ ] A Maestro flow opens history, analytics and the diary in airplane mode after a cold start

### AP-7 · Barcode scanner (H-17)
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M8 · **Label:** barcode scanner
- **Needs:** MS-5

**Outcome.** Packaged food is logged by scanning, from Open Food Facts, with ODbL attribution. If
OW-2's L5 answer moves it into launch, re-link this card under MS-5.

**Done when.**
- [ ] A scan finds a product and logs a portion; the ODbL notice is in K-10 and `data-sources.md`

### AP-8 · Home-screen widgets
- **Lane:** S3 Design · **Size:** M · **Milestone:** M8 · **Label:** widgets
- **Needs:** MS-5

**Outcome.** Today's workout and the protein ring on the home screen, Android and iOS (`docs/11`
[Later]). Watch apps stay in the backlog.

**Done when.**
- [ ] Both platforms show a widget that updates after a set or a meal is logged

### QA-8 · TalkBack formatting spans re-test (#28)
- **Lane:** S7 Quality · **Size:** S · **Milestone:** M8 · **Label:** TalkBack #28
- **Needs:** QA-3

**Outcome.** The one dated accessibility finding is closed. Its re-test date is 15 Dec 2026
(`docs/a11y-audit.md`).

**Done when.**
- [ ] #28 is closed or re-dated, with a phone recording, in the a11y audit

### QA-10 · Client coverage to 80%
- **Lane:** S7 Quality · **Size:** L · **Milestone:** M8 · **Label:** coverage 80%
- **Needs:** QA-9, MS-3

**Outcome.** The 80% global client coverage target (D18) is met. It measured 65% on 2 Oct.

**Done when.**
- [ ] The Jest global thresholds are at 80% in `jest.config.js`, and CI passes

### MS-8 · Depth and polish
- **Lane:** Milestones · **Size:** S · **Milestone:** M8 · **Label:** M8 depth
- **Needs:** AP-3, AP-4, AP-5, AP-6, AP-7, AP-8, QA-8, QA-10

**Exit.** Progression by rule, the body map, the parity wins, offline reads, barcode, widgets and
the coverage target are all shipped.

---

## M9 · Exercise media (last)

### OW-14 · Choose the exercise media source
- **Lane:** You · **Size:** S · **Milestone:** M9 · **Label:** pick media source
- **Needs:** MS-7, MS-8

**Outcome.** One licensed source for exercise images or animations, chosen after everything else is
done (owner, 7 Oct 2026).

**Options (memory: opengym-licensing).**
- RepDB community edition: free, 609 exercises, flat stills, credit required.
- RepDB Standard: $499 one-time, with looping animations.
- Gym visual: about $0.90 a GIF, around $270 for 297 exercises or $1,190 for the full set.
- Your own artwork.

openGym's mirror and the GIFs redistributed in hasaneyldrm's dataset are not licensed to FitLog.

**Done when.**
- [ ] The licence is bought or accepted; a dated copy of it is saved outside the public repo

### AP-9 · Exercise media in the app
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M9 · **Label:** exercise media
- **Needs:** OW-14

**Outcome.** Exercises show their image or animation in the library, on the detail screen and in the
logger.

**Scope.** A match script from the library to the media source, with a manual list for the misses.
Media lives in private storage, never in this public repo. Offline caching. The credit line in
About and `licences.json`. The attribution in `docs/data-sources.md`.

**Done when.**
- [ ] Every library exercise has media or an explicit "none"; no media file is in git

### MS-9 · Complete
- **Lane:** Milestones · **Size:** S · **Milestone:** M9 · **Label:** M9 complete
- **Needs:** AP-9

**Exit.** Everything in this plan is shipped.
