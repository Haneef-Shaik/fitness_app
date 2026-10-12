# FitLog master plan: every goal

> **11 October 2026 reset:** the old implementation was removed from this branch.
> Read the [fresh baseline](../RESET-BASELINE.md) and [PRD](../PRD.md) first. Historical code
> paths and references in individual legacy cards are not requirements and must not be recreated
> without a new foundation decision. The PRD owns requirements; this file owns sequencing only.


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

> **11 October product decisions:** PRD v2.1 removes the dedicated trainer role and all gym
> private-health reads/measurement writes. GT01–GT04 and T-01–T-05 are retired. G21.api/G21.app
> retain only the original gym-template/member-owned-copy deliverable for owner/manager offers;
> their trainer workspace and health-access portions are withdrawn. G24/G29 exclude diet/plan
> coaching copilots, PT packs, assessments and coaching floor screens. IDs/statuses remain stable.
> India launches first, with two complete languages and member launch before gym pilot. Product
> rules are selected; provider/legal/licenses/device proof remain actual gates. No build goal is
> marked Done by this documentation change. Use current PRD acceptance IDs, not old AC references.

## How to read a card

- **Lane** is the session that owns the goal (see the current
  [operating rules](../23-MASTER-PLAN.md#operating-rules)). `You` means only the owner can
  do it: accounts, money, legal, devices, decisions.
- **Needs** are goals that must be **Done** first. Ready and blocked are derived from them, never
  set by hand.
- **Size**: S = a short session, M = one full session, L = two or three sessions.
- **Milestone** is the release the goal ships in. `MS-*` cards are the milestone gates themselves.
- **Done when** is the contract. A goal with an unticked box is not done.

---

## M0 · Ground truth

### OW-1 · Record selected Momentum direction and scope delta
- **Lane:** You · **Size:** S · **Milestone:** M0 · **Label:** selected Momentum
- **Needs:** —

**Outcome.** Product direction is selected: Momentum/volt lime, no conflicting green, complete dark/
light/system themes, native five-tab member shell and documented workspace rules. Fresh reset means
no old Coach OS code needs merging. PROD-01/PROD-02 are the current decision record.

**Scope.** Record accepted product decisions, reconcile historical Figma trainer frames against the
current inventory, and pass actual font/token/asset verification to DS goals. No routine UI-choice
question remains; brand/license evidence remains external. Trainer role/navigation absent.

**Done when.**
- [ ] Tracker decision record and current PRD/Momentum inventory agree; owner-controlled planner status
  reflects this decision only after normal goal review (this edit does not change live status)
- [ ] Designer receives retired T-family/new owner programme destinations and known Figma gaps

**Read first.** PRD §§3/16/19/27; docs/22 current scope delta, not obsolete code references.

### OW-2 · Complete external launch dependencies for selected India scope
- **Lane:** You · **Size:** S · **Milestone:** M0 · **Label:** launch dependencies
- **Needs:** —

**Outcome.** India-first member Android/iOS launch, two complete languages, barcode/import/health P2,
paid AI/trial and member/gym split are selected. No request to choose scope again. Final name, actual
accounts/providers/regions, signed licenses/qualified reviews and store products remain real dependencies.

**Scope.** Work the current OW-2 pack and PRD DEC-01–DEC-16; record procurement/proof separately from
PROD-02 rules. Retain old India/US/Europe answer as long-term intent, not public launch permission.

**Done when.**
- [ ] Required M1/M4/M5 decisions have actual account/configuration/review evidence or explicit blocked gate
- [ ] Architecture/API freeze and backup/object policy are recorded; no vendor approval fabricated
- [ ] Release dependencies are reconciled with the reset baseline and selected scope

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

**Outcome.** Current specifications and the tracker agree with the reset baseline and actual
implementation evidence. Follow [what the current plan governs](../23-MASTER-PLAN.md#what-this-plan-governs).
The 7 Oct audit and the scope below are historical reconciliation evidence; deleted code and
old build claims must not be treated as current implementation proof.

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

**Scope (current PRD5/19/23).** A typed catalog (`src/lib/i18n/{en,hi,index}.ts`, D37).
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
- [ ] The presentation tests are updated; AC01/02/14/17/29/38 and the offline flows pass on
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
- [ ] AC03/05/19/42 pass; the G-03 and G-04 chart tests cover the touch read-out
- [ ] The touched directories are in the i18n source-scan guard

### SC-4 · Food
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M3 · **Label:** food screens
- **Needs:** MS-2, SC-1

**Outcome.** Every food screen is Momentum.

**Scope (docs/22 page 10).** H-02…H-07, H-09…H-16, H-18 in `app/nutrition/**`. H-01 and H-08 are
SC-1's. The P-04 locked state waits for G15.app.

**Done when.**
- [ ] AC04/15/18/28/40 pass on a release APK
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
- [ ] p95 under 100 ms, cold start and bundle size are recorded in `docs/PRD.md`

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
See docs/PRD.md:1164–1171.

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

### G13 · Phone sign-in with selected India delivery scope
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M4 · **Label:** phone sign-in
- **Needs:** QA-1, OW-5

**Outcome.** Phone-only adult account and phone-addressed gym claim work; email nullable, E.164
international structure, actual +91 production delivery first. Other public regions/delivery gated.

**Scope.** PRD5/14/27: selected OTP expiry/resend/attempt limits, safe linking/reauth/reset, verified
provider hook/abuse controls. Existing four identity methods remain. Exact provider/migration paths
are architecture decisions, not proof deleted services exist.

**Done when.**
- [ ] Phone-only sign-in, age rejection, export/deletion and wrong-phone claim checks pass
- [ ] Real +91 OTP arrives on staging through approved configured provider; signature/abuse tests pass
- [ ] English/Hindi errors and current ID01–ID03/AC07/23 acceptance covered

### G14.data · Licensed Indian foods and Hinglish search
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M4 · **Label:** Indian food 500+
- **Needs:** QA-1

**Outcome.** At least500 distinct India-focused foods/dishes, reviewed household conversions and
English/Hindi/Hinglish aliases. Aliases do not inflate catalogue count.

**Scope.** PRD9/21/27: source/license/version metadata, null nutrition/density rules, household fixtures
(dal/daal, roti/chapati, chawal/rice, paneer/biryani). Source must actually be permitted; an old
USDA-derived-only suggestion is not evidence licensing or composition has been reviewed.

**Done when.**
- [ ] ≥500 distinct reviewed records, quantity/macro/source checks and meaningful search fixtures pass
- [ ] Missing density/nutrition cannot silently become1:1 or0; licensed acquisition record exists
- [ ] AC04/15/18 and two-language food search acceptance pass

### G15.api · Pro entitlements and allowance lifecycle on server
- **Lane:** S6 AI & Pro · **Size:** M · **Milestone:** M4 · **Label:** entitlements API
- **Needs:** OW-7, AI-1

**Outcome.** Billable personal AI requires verified trial/Pro plus current AI permission. Quota
20 text/10 photo per UTC day, two concurrent jobs; reserve/consume/release tied to original day bucket.

**Scope.** PRD10.3/18: signed billing events, actual provider cost reservation, queued cancellation/
withdrawal/expiry dispatch races, job reconciliation, no auto-retry surprise billing. Ready-result
review/confirmation remains after expiry/withdrawal. G30 limited free P2 register reader is separate.

**Done when.**
- [ ] AC12/27/28/40/44 pass, denied request calls provider zero times
- [ ] Quota/spend/webhook/idempotency fixtures and concurrent permission race pass
- [ ] Current API/shared types published (SP3); no historical20-total-AI quota remains

### G15.app · Paywall and guarded Pro flows
- **Lane:** S6 AI & Pro · **Size:** M · **Milestone:** M4 · **Label:** paywall + ProGate
- **Needs:** G15.api, MS-2

**Outcome.** Verified localized trial/purchase/restore/manage and honest Free/locked/pending states.

**Scope.** PRD10/18, P-01–P-04. Actual price/SKUs from store; seven-day trial only when eligible.
No storage eviction or loss of old proposals on downgrade; limits/storage/AI permission explained.

**Done when.**
- [ ] AC12/27/28/40/44 pass; every personal AI entry point checks server-backed permission
- [ ] Sandbox purchase/restore works on both native platforms, conflicts/pending verification covered
- [ ] Ready proposal can be confirmed without a new AI call after entitlement/permission ends

### MS-4 · Launch foundations
- **Lane:** Milestones · **Size:** S · **Milestone:** M4 · **Label:** M4 phone/Hindi/Pro
- **Needs:** G13, G14.data, G15.app

**Exit.** Phone sign-in, the strings catalog with Indian food depth, and Pro are on `main`. These
serve both the store launch and the gym platform (docs/PRD.md:30–32), and D33 puts Pro before the store
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

### OW-6 · Actual legal pages and qualified review for selected scope
- **Lane:** You · **Size:** M · **Milestone:** M5 · **Label:** legal + review
- **Needs:** OW-2, OW-3, PL-4

**Outcome.** Public terms/privacy and required gym notices/DPA/retention statements are genuinely
reviewed for India launch, adult-only accounts and no staff personal-health sharing.

**Scope.** PRD22/27: processor list from actual accounts, purpose-specific AI/utility/challenge notices,
financial retention/tax receipt review; optional future health/calling/US-Europe expansion separately
gated. Do not reopen16+ or trainer consent questions. Draft copy is not counsel approval.

**Done when.**
- [ ] Qualified reviewer sign-off/effective notice versions and actual processor/data-flow records exist
- [ ] Pages served HTTPS and deletion route works; no required placeholder or false approval
- [ ] Estimate suitability DEC-14 and gym financial policy reviewed by relevant qualified people

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

**Scope.** Walk the new screens on a phone (`docs/PRD.md`:59–62), including the Supabase sign-in
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
- [ ] India releases on both stores are at 100% rollout; the launch-week numbers are in the tracker

### MS-5 · Store launch
- **Lane:** Milestones · **Size:** S · **Milestone:** M5 · **Label:** M5 STORE LAUNCH
- **Needs:** QA-7

**Exit.** FitLog is live in India on Google Play and the App Store, in Momentum, with phone sign-in, Hindi,
Pro and production infrastructure.

---

## M6 · Gym pilot (MVP)

### OW-9 · Field validation and frozen pilot cohorts
- **Lane:** You · **Size:** L · **Milestone:** M6 · **Label:** pilot field work
- **Needs:** —

**Outcome.** Actual owner/member interviews, five signed India gyms, reviewed baseline register/ledger
and external legal readiness; current product rules are selected, not another question pack.

**Scope.**20–30 owner/30–50 adult member interviews, selected operational template/offering workflow,
no trainer/private health access. Signed pilot protocol freezes PRD23.3 windows/denominators/minimum
cohorts/exclusions. Capture≥20 baseline fully observed renewal terms/gym and≥50 eligible adults.
Record stated indicative Owner Pro price responses without provisioning/purchase claims. Any two-gym
concierge exercise uses lawful notices/actual consent and is documented separately.

**Done when.**
- [ ] Interviews/signed terms/actual baseline samples and counsel notices exist in research records
- [ ] Pilot metric protocol selected before day1; no unknown outcome is labelled measured evidence
- [ ] DEC-04/07/08 actual gates passed or pilot activation remains blocked

### AI-2 · Food-AI accuracy harness (G12 part)
- **Lane:** S6 AI & Pro · **Size:** M · **Milestone:** M6 · **Label:** AI accuracy test
- **Needs:** QA-1, OW-3

**Outcome.** A measured accuracy table for food AI on Indian meals, for at least two models
(H12.3). It feeds the go memo and later the register reader (G30).

**Scope.** `services/api/scripts/measure_food_accuracy.py` and a weighed-meal protocol: photographs
and weights of real plates, with error per macro and per dish class.

**Done when.**
- [ ] The accuracy table for ≥ 2 models is in `docs/research/`, with the script re-runnable

### OW-10 · Evidence-based gym go/no-go memo
- **Lane:** You · **Size:** S · **Milestone:** M6 · **Label:** gym go memo
- **Needs:** OW-9, AI-2

**Outcome.** Written Go/No-go for selected trainer-free India gym pilot. This is field readiness,
not the later Scale gate. Member launch foundations remain independent either way.

**Done when.**
- [ ] Field records, signed gym agreements, qualified notices, baseline/minimum cohort evidence and AI
  quality/cost report are linked; no routine retired Q21–Q33 decisions requested again
- [ ] Memo states Go/No-go and reason; No-go holds gym activation under normal goal-status workflow

### OW-11 · WhatsApp templates approved
- **Lane:** You · **Size:** S · **Milestone:** M6 · **Label:** Meta templates
- **Needs:** OW-5, OW-10

**Outcome.** The invite, receipt, renewal and exit templates are approved by Meta as utility
messages in English and Hindi, using the counsel-approved copy (H12.2). G18 and G20 need them to
start.

**Done when.**
- [ ] Each template's approval is recorded, with its id, in `docs/17` or the tracker

### G16.api · Gym tenancy, operational roles, permissions, audit and jobs
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M6 · **Label:** tenancy API
- **Needs:** OW-10, G13

**Outcome.** Organisation/gym tenants, owner/manager/front-desk roles, operational purpose permissions,
audits/jobs and server-enforced isolation. No trainer role or personal-health permission path.

**Scope.** PRD §§12/16/20–23: reject retired role values; revoke staff on next request; protect register/
finance/visit/export; safe User unlink SET NULL for retained gym records; purpose audit and workers.
Freeze new API/data contracts before client work (SP3); old migration paths are historical.

**Done when.**
- [ ] AC09/21/30/37 pass and every gym route has cross-tenant/role coverage
- [ ] Owner/manager health reads and staff measurement writes fail; no hidden legacy flag unlocks them
- [ ] Current OpenAPI/shared contracts and migrations are published for client integration

### G16.app · Personal and operational gym workspaces
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** workspace switcher
- **Needs:** G16.api, MS-2

**Outcome.** Staff switch Personal/their permitted gym, with owner/manager/front-desk operational shell.

**Scope.** O-01 gym setup/switcher, Today·Members·Money·Visits·More; restricted actions absent. No trainer
tabs, assigned-health roster or T-family route. Gym-tab Join state follows PRD19. English/Hindi.

**Done when.**
- [ ] Navigation/role-revocation/permission tests cover all three staff roles and member context
- [ ] Retired trainer routes cannot be reached by direct links or stale workspace preference
- [ ] Both languages, themes and system states are covered

### G17.api · Owner register, membership and append-only finance
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M6 · **Label:** owner core API
- **Needs:** G16.api

**Outcome.** Register/imports/plans/renewals/freezes/ledger/receipts/export work with exact selected dates
and integer money. Reversal corrects mistakes; refund records real returns, disjoint principal.

**Scope.** PRD12–13/20/22: ≤2,000-row imports, versioned sold terms, month-end convention, sold freeze
allowance, atomic overlap resolution, separate dues/credit/cash, receipt numbering, export/offboarding.
Front desk prepares membership requests; owner/manager approve. Taxes disabled until actual review.

**Done when.**
- [ ] AC06/11/20–22/30/35–37/43 pass, including all numeric/date/correction fixtures
- [ ] Fifty committed payments produce unique gap-free receipts; no float money or reused refunded principal
- [ ] List p95<300 ms with1,000 members; contracts ready (SP3)

### G17.app · Operational owner and front-desk screens
- **Lane:** S5 Gym app · **Size:** L · **Milestone:** M6 · **Label:** owner screens
- **Needs:** G17.api, G16.app

**Outcome.** Register/import/plans/dues/payments/receipts/staff/reports/exports work in Momentum.

**Scope.** O-02–O-11/O-15–O-20 with current role controls, front-desk requests/approval status, finance
correction previews and offline operational roster/reconciliation. No health history fields.

**Done when.**
- [ ] AC06/13/21/35–37/43 pass in English/Hindi; timed150-member setup≤90 minutes
- [ ] Offline payment has provisional acknowledgment only; authorized reconciliation creates one receipt
- [ ] Roster24-hour mutation expiry/72-hour purge and sensitive field exclusion are verified

### G18.api · Adult gym linking and purpose-aware utility messages
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M6 · **Label:** join + messages API
- **Needs:** G17.api, G13, OW-11

**Outcome.** Invites/phone-bound claims/operational permissions and gym-branded approved utility messages.

**Scope.** PRD14/16/22: notice/source registry, no marketing to gym-supplied numbers, expiry/resend/
idempotent claim, +91 delivery, reviewed templates/cost caps. No fitness sharing or trainer assignment.

**Done when.**
- [ ] AC07/10/23 pass, including wrong-phone and non-adult linking rejection
- [ ] Purpose guard fails closed, provider dispatch reconciles ambiguity, API contracts ready (SP3)
- [ ] New links never expose personal health data to gym staff

### G18.app · Join gym, gym card and operational permissions
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** join + gym card
- **Needs:** G18.api, G17.app

**Outcome.** Invited adult opens correct gym card after minimal onboarding; controls operational
utility/challenge permissions without any health-sharing switches.

**Scope.** A-13/A-14, N-01/N-04/N-05 (revised Gym permissions), N-10, O-20 invite coverage.
N-06 programme offers handled by G21.app; personal training setup can wait.

**Done when.**
- [ ] AC07/13/23 pass on release builds with Hindi/English captures
- [ ] Invite denial has safe personal-app path; no trainer, body-sharing or diet fields required
- [ ] N-05 explains operational ownership and private personal-data boundary

### G19.api · Visits, historical eligibility and offline reconciliation
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M6 · **Label:** visits API
- **Needs:** G18.api

**Outcome.** QR/staff/device attendance records preserve original time, validation and historical
membership evidence. Operational visits, participation eligibility and challenge enrollment separate.

**Scope.** PRD15/17/20: no user coordinates, signed poster, dedupe, review questionable time, operational
cache revisions/revocation, one authorized reconciliation. Historical expiry never erases valid visits.

**Done when.**
- [ ] AC08/24/37/39 pass; tamper/duplicate/backdated correction and revoked-staff cases covered
- [ ] No raw user lat/lng in request storage/logs; no attendance failure blocks personal workout
- [ ] Import idempotency, eligibility state versions and client contracts ready (SP3)

### G19.app · Check-in, visits and offline operational review
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** check-in + visits
- **Needs:** G19.api, G18.app

**Outcome.** Member check-in and staff attendance work offline within permitted roster freshness,
with truthful pending/unverified/Needs attention statuses.

**Scope.** N-02/N-03, O-12/O-13; permission primers,24h staff cache mutation window,72h roster purge,
and owner/manager reconciliation after role/member/charge changes per PRD20.

**Done when.**
- [ ] AC08/13/24/37/39 pass, scan→durable p95<3s on reference release build/3G profile
- [ ] Stale cache cannot grant staff writes; original occurrence and eligibility reasons inspectable

### G20.api · Attendance-only retention and renewal dispatch
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M6 · **Label:** retention API
- **Needs:** G19.api, OW-11

**Outcome.** Operational absence/praise lists with data-quality confidence, evidence-based precision
and logically once-only renewal offsets in gym local hours.

**Scope.** PRD14–15/23: seven open dates absence, independent verification outcomes, no private
progress lines, updated month/freeze reminder dates, caps and ambiguous-send reconciliation.

**Done when.**
- [ ] AC10/11/36/41 pass; Jan31→Feb28 inclusive example and its reminder dates match finance
- [ ] Disposition never auto-labels absence;4 verified absence/2 false alarms/4 unknown gives4/6 precision
- [ ] No training/nutrition/body detail exposed in owner alerts; contracts ready (SP3)

### G20.app · Operational follow-up calls and evidence outcomes
- **Lane:** S5 Gym app · **Size:** S · **Milestone:** M6 · **Label:** today's calls
- **Needs:** G20.api, G17.app

**Outcome.** O-14 lists permitted utility follow-up with confidence explanations and separate contact/
absence-verification fields; user deliberately opens their calling/chat app.

**Done when.**
- [ ] AC11/13/41 pass; unknown evidence does not become a confirmed absence
- [ ] Utility template/purpose/cost state visible; no private health-progress card or automated AI call

### G21.api · Owner/manager gym programme offers and owned copies
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M6 · **Label:** programme offers API
- **Needs:** G18.api

**Scope reduction.** Stable G21.api retains its original gym-template/member-owned-copy capability.
Dedicated trainer assignments, private member_data reads and staff body writes are withdrawn;
GT01–GT04 retired, not reassigned.

**Outcome.** Owner/manager version gym templates, offer to linked adult and track offer state only;
acceptance makes one private member-owned copy.

**Scope.** PRD6/16: offers pending/accepted/declined/withdrawn, immutable offered version/provenance,
no automatic current-plan replacement; accepted copy survives unlink/offboard/template archive.

**Done when.**
- [ ] AC09/15/26 pass: v1 offer stays v1 after v2 edit; repeated accept yields one copy
- [ ] Staff cannot read member copy edits/performance or record measurements; trainer role invalid
- [ ] Updated contracts and permissions published (SP3)

### G21.app · Gym programme offer and template screens
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** programme offer screens
- **Needs:** G21.api, G18.app

**Scope reduction.** Stable G21.app retains member plan-copy delivery; trainer workspace/T-01–T-05,
health-sharing and staff measurement UI removed.

**Outcome.** Owner/manager More→Programmes (new O-23 templates/O-24 offers) and member N-06 gym offer
preview/Accept/Decline; N-05 operational permissions, not health switches. Today may show pending offer,
not “trainer says” or member private progress visible to gym.

**Done when.**
- [ ] AC13/26 pass, English/Hindi and both themes; accept/decline/withdrawn/error states covered
- [ ] No T routes, primary-trainer roster, coaching dashboard or measurement editor
- [ ] Figma scope delta acknowledged; new owner frames implemented/verified, not claimed already drawn

### G22.api · Optional challenges, independent streaks and referrals
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M6 · **Label:** challenges API
- **Needs:** G19.api

**Outcome.** Gym challenges opt-in, private ordinary visit streak independent of enrollment, referrals
with deterministic attribution and historical eligibility.

**Scope.** PRD17: distinct operational/participation/challenge visits, timestamped opt-in/rejoin,
masked names/tie rule, later expiry preserves valid events, legitimate corrections rebuild totals.

**Done when.**
- [ ] AC25/39 pass including no-challenge streak, opt-out/rejoin, later expiry and backdated freeze
- [ ] No minors/unverified/frozen-at-occurrence visits rank; contract fixtures ready (SP3)

### G22.app · Challenge, leaderboard and refer screens
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** challenge screens
- **Needs:** G22.api, G19.app

**Outcome.** Members see their gym's challenge and standing, share gym-named cards, and refer
friends.

**Scope.** O-18, N-07 (a Momentum hero), N-08, gym-named share cards with an opt-out
(`react-native-view-shot`, `expo-sharing`), the gym name on the E-11 PR card.

**Done when.**
- [ ] The share card renders the gym name, and none when the member opts out (tested)

### G23 · India five-gym pilot release
- **Lane:** S7 Quality · **Size:** L · **Milestone:** M6 · **Label:** pilot release
- **Needs:** G17.app, G18.app, G19.app, G20.app, G21.app, G22.app, PL-7, PL-8, OW-6, MS-4

**Outcome.** Owner/manager/front-desk/member gym MVP, no trainer or private-health sharing, runs in five
signed India gyms with complete English/Hindi and clear operational permissions.

**Scope.** PRD23/25: device budgets, runbook, actual legal/provider/template proofs, nightly critical
journeys, frozen metric protocol and reviewed baseline/sample data before day1.

**Done when.**
- [ ] All MVP-G ACs including35–44 applicable gym cases pass; current-role route isolation complete
- [ ] Pilot cohorts/window/exclusion rules and every external gate recorded; no fabricated outcomes
- [ ] New O-23/O-24/N-05/N-06 UI is reconciled and retired T-frame links excluded

### MS-6 · Gym pilot (MVP)
- **Lane:** Milestones · **Size:** S · **Milestone:** M6 · **Label:** M6 gym pilot
- **Needs:** G23

**Exit.** The gym MVP (G16–G23) runs in the pilot gyms. The pilot gate (OW-12) decides what comes
next.

---

## M7 · Gym Phase 2 (only after the pilot says "scale")

### OW-12 · Measure per-gym pilot gates and scale/fix/stop
- **Lane:** You · **Size:** L · **Milestone:** M7 · **Label:** pilot gate call
- **Needs:** MS-6

**Outcome.** Written ten-week Scale/Fix/Stop against PRD23.3's **selected** frozen denominators.

**Gate.** Every gym≥40% day60 adult link (minimum50 cohort),≥25% latest complete-week personal logging
(minimum20 start-week linked cohort), aggregates also pass; all five have≥20 fully observed baseline/
pilot expiry samples;≥3 gyms improve renewal≥5 percentage points absolute;≥2 accept stated Pro price.
Pilot expiry window days1–63 followed through day70. Incomplete windows/sample→Fix/extend, never fake0%.
Security/cost/operational guardrails must pass. Actual payment-provider choice remains external.

**Done when.**
- [ ] AC34/41 pass with source counts/evidence, no private health detail disclosed to gyms
- [ ] Memo signed; Scale unblocks P2, Fix/Stop holds it under normal status workflow
- [ ] No protocol change removes observed non-renewers from denominator

### G24 · Owner Pro operational AI assistance
- **Lane:** S6 AI & Pro · **Size:** L · **Milestone:** M7 · **Label:** Owner Pro
- **Needs:** OW-12, G15.api, G20.api

**Outcome.** Gym-entitled assistance for permitted operational register/dues/attendance questions,
risk explanations and reviewed utility-message drafts; no automatic send or member-health analysis.

**Scope.** PRD24: diet digitizer and coaching plan copilot are withdrawn from this goal/committed P2.
Neither owners nor managers acquire private fitness permissions through AI. Future coaching requires
new approved scope, not renamed trainer role. Billing and vendor approval remain actual gates.

**Done when.**
- [ ] Every AI call checks gym entitlement/role and cost cap; requests cannot join personal health tables
- [ ] Grounding/prompt-injection/confirmation/utility-purpose negative cases pass
- [ ] No diet/plan-copilot or private-health UI exposed; Scale gate approved

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

### G29.api · Operational retention depth without coaching
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M7 · **Label:** retention depth API
- **Needs:** OW-12, G22.api

**Outcome.** Automatic device feeds, break mode, voluntary expiring passport, cohorts, approved
broadcast credits and gym-owned WhatsApp sender under PRD24.

**Removed portion.** PT/session packs, staff assessments and coaching floor view are out of committed
roadmap. No trainer allocation/private health reads/writes. Passport grants specific artifact access,
not live gym health permissions. A new service-credit/coaching product needs separately approved scope.

**Done when.**
- [ ] Each retained feature has numeric/state fixtures, privacy/permission/idempotency tests and contracts
- [ ] Broadcast source guard, caps and revocable passport evidence pass; no removed endpoint recreated

### G29.app · Operational retention depth screens
- **Lane:** S5 Gym app · **Size:** L · **Milestone:** M7 · **Label:** retention depth screens
- **Needs:** G29.api, G22.app

**Outcome.** N-09 break mode, voluntary passport, operational cohort/broadcast/device-feed/sender screens.

**Scope.** No PT pack, assessment-day, coaching floor or trainer workspace. English/Hindi, explicit
consent/expiry/revoke and operational ownership. Template offering stays G21, not coaching copilot.

**Done when.**
- [ ] Every retained feature passes current P2 acceptance and both languages/themes
- [ ] Removed coaching frames are not reused for unauthorized private-health access

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
- [ ] A scan finds a product and logs a portion; the ODbL notice is in K-10 and `docs/PRD.md`

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
(`docs/PRD.md`).

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
About and `licences.json`. The attribution in `docs/PRD.md`.

**Done when.**
- [ ] Every library exercise has media or an explicit "none"; no media file is in git

### MS-9 · Complete
- **Lane:** Milestones · **Size:** S · **Milestone:** M9 · **Label:** M9 complete
- **Needs:** AP-9

**Exit.** Everything in this plan is shipped.
