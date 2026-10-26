# FitLog master plan: every goal

> **Reconciled 25 October 2026** with the [11 October reset](../RESET-BASELINE.md), [PRD v2.1](../PRD.md)
> and the uncommitted 17–19 October implementation. The PRD owns requirements; this file owns
> sequencing and the definition of done. All 94 earlier goal IDs keep their statuses. Twenty goals
> were added where the reset left required work without an owner; each is marked *new 25 Oct*.
> What changed and why is in [docs/23 §4](../23-MASTER-PLAN.md#4-the-25-october-reconciliation).

**This file is the source of the plan board.** Each `### ID · Title` card becomes one node.
Statuses live in [`status.json`](status.json) and change only through `node scripts/plan/status.mjs`
or the board (`node scripts/plan/serve.mjs`), never by editing this file. After changing a card, run
`node scripts/plan/build.mjs`. The build refuses a card without a contract, and refuses a plan that
leaves any PRD acceptance scenario or external decision without a row in
[ACCEPTANCE.md](ACCEPTANCE.md). The rules and the narrative are in
[docs/23](../23-MASTER-PLAN.md). Run a goal with `/run-goal <ID>` (see
[SESSION-PROMPT.md](SESSION-PROMPT.md)).

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
    {"name": "S6 Food, AI & Pro", "colour": "#c2410c"},
    {"name": "S7 Quality", "colour": "#475569"},
    {"name": "S8 Member backend", "colour": "#4d7c0f"},
    {"name": "Milestones", "colour": "#18212b"}
  ],
  "tracks": {
    "M0": "Ground truth",
    "M1": "Production platform",
    "M2": "Momentum foundations",
    "M3": "Member core",
    "M4": "Launch foundations: phone, Hindi, AI, Pro",
    "M5": "Store launch (MVP-M)",
    "M6": "Gym pilot (MVP-G)",
    "M7": "Gym Phase 2 (after the pilot gate)",
    "M8": "Depth and polish",
    "M9": "Exercise media and project complete"
  },
  "syncPoints": [
    {"id": "SP0", "goals": ["AR-1"], "text": "SP0 contract freeze: S8 hands the architecture record, the versioned contract package and the fixture runner to every lane"},
    {"id": "SP1", "goals": ["DS-5"], "text": "SP1 kit + shell freeze: S3 hands tokens, components and both shells to every screen session"},
    {"id": "SP2", "goals": ["G14.app"], "text": "SP2 string catalog: S4 hands t(), the locale formatters and the literal guard to every screen session"},
    {"id": "SP3", "goals": ["MB-1", "MB-2", "MB-3", "MB-4", "MB-5", "MB-6", "MB-7", "G15.api", "G16.api", "G17.api", "G18.api", "G19.api", "G20.api", "G21.api", "G22.api"], "text": "SP3 data contract: a backend goal merges its migrations, commands and regenerated contracts before the screens that use them start"}
  ],
  "config": {
    "subtitle": "From docs/plan/GOALS.md, reconciled 25 Oct 2026. Lanes are parallel Claude Code sessions plus you. Columns are the earliest wave a goal can start.",
    "milestone": "MS-5",
    "milestoneLabel": "Store launch",
    "sizes": {"S": "one short session (half a day or less)", "M": "one full session", "L": "two or three sessions; work through the card's steps in order"},
    "firstStepLabel": "Wave 0",
    "stepLabel": "Wave",
    "workflowHint": "Pick the top Ready goal in your lane and run /run-goal <ID>. A goal is Done only after goal-verifier passes every Done-when box and it is merged to main; a milestone only after milestone-gatekeeper passes its Exit checks and `status.mjs gate MS-n` shows nothing open.",
    "refPlaceholder": "branch, PR or commit, e.g. plan/ds-1-colour-tokens",
    "hubs": [
      {"key": "T", "ids": ["QA-1"], "text": "T = QA-1, the foundation on main"},
      {"key": "C", "ids": ["AR-1"], "text": "C = AR-1, the frozen architecture and contract"},
      {"key": "F", "ids": ["MS-2"], "text": "F = MS-2, Momentum foundations"},
      {"key": "L", "ids": ["MS-5"], "text": "L = MS-5, the store launch"}
    ],
    "acceptanceGates": {"member": "MS-5", "gym": ["MS-6", "MS-7"]},
    "slug": "fitlog-master-plan"
  }
}
```

## How to read a card

- **Lane** is the session that owns the goal ([docs/23 §5](../23-MASTER-PLAN.md#5-lanes-and-file-ownership)).
  `You` means only the owner can do it: accounts, money, legal, devices, decisions.
- **Needs** are goals that must be **Done** first. Ready and blocked are derived from them.
- **Size**: S = a short session, M = one full session, L = two or three sessions.
- **Milestone** is the release the goal ships in. `MS-*` cards are the milestone gates themselves.
- **PRD** names the requirement sections, acceptance scenarios (`ACnn`), budgets (`NF-nn`) and
  screen codes the goal must satisfy. If a card and the PRD disagree, the PRD wins and the card is
  corrected.
- **Existing work** points at local code from 17–19 October that the goal verifies and adopts or
  replaces. It is never evidence on its own.
- **Done when** is the contract. Every box needs evidence a verifier can check
  ([docs/23 §7](../23-MASTER-PLAN.md#7-evidence-and-gates)). One unmet box means not Done.
- **Exit checks** is a milestone's contract. `node scripts/plan/status.mjs gate MS-n` shows its
  open needs and open ledger rows; `milestone-gatekeeper` verifies every box.

Terms used in the boxes: **release build** (a release-variant build of a `main` commit, never a
debug or Expo Go build), **reference device**, **journey suite**, **the standard gates** and
**evidence folder** (`docs/evidence/<ID>/`) are defined in docs/23 §7. How a goal, a milestone, a
release and the whole project are declared done is in
[docs/23 §8](../23-MASTER-PLAN.md#8-declaring-done).

---

## M0 · Ground truth

### OW-1 · Record the selected Momentum direction and its Figma gaps
- **Lane:** You · **Size:** S · **Milestone:** M0 · **Label:** Momentum recorded
- **Needs:** —

**Outcome.** The owner's choice of Momentum is on record (volt lime, dark/light/system, the native
five-tab member shell, the staff shell, no trainer UI), and the designer has the list of frames
still to draw.

**PRD.** §§2, 3, 16, 19; DEC-01 (UI part), DEC-13. [docs/22](../22-UI-MOMENTUM.md) scope delta.

**Scope.** Confirm PROD-01, PROD-02 and TECH-01 in the tracker as the UI decision. Hand the
designer the gaps: O-23 programme templates, O-24 programme offers, full Hindi frames, full iOS
coverage, and the retired T-01–T-05 entry points. Brand clearance stays with DS-6 (DEC-01).

**Done when.**
- [ ] The tracker decision log has an owner-dated entry: Momentum is the only UI direction and the trainer UI is retired
- [ ] `docs/evidence/OW-1/figma-gaps.md` lists every frame still to draw (O-23, O-24, Hindi, iOS), each with the goal that needs it

### OW-2 · Register every external launch dependency
- **Lane:** You · **Size:** S · **Milestone:** M0 · **Label:** launch dependencies
- **Needs:** —

**Outcome.** Every external decision in PRD §27 (DEC-01 to DEC-17) has an owner goal, a gate and a
current state, so no release gate is discovered late. Product scope is already selected
(PROD-01 to PROD-12); this goal does not reopen it.

**PRD.** §27; tracker PROD-02.

**Scope.** Work the OW-2 owner pack. For each DEC: who decides, what proof closes it, by which
milestone, and what stays blocked meanwhile. Record the India region and provider preferences that
are already known. Never record an approval that has not happened.

**Done when.**
- [ ] `docs/evidence/OW-2/dependency-register.md` gives every DEC row in [ACCEPTANCE.md](ACCEPTANCE.md) its current state and the proof that will close it
- [ ] DEC-15 is answered: no legacy-user cutover (its ledger row set to `n/a · <reason>`), or a migration goal is added to this plan
- [ ] No entry claims an approval, account or licence without dated proof

### QA-1 · Land the post-reset foundation on main
- **Lane:** S7 Quality · **Size:** S · **Milestone:** M0 · **Label:** foundation on main
- **Needs:** OW-1

**Outcome.** `main` holds the reset baseline and a reviewed, green foundation, so every later goal
branches from code that exists and passes. From then on `main` is the integration branch
([docs/23 §6](../23-MASTER-PLAN.md#6-branches-and-integration)).

**PRD.** §§21, 23.2, 26.1 (M0).

**Existing work.** Untracked on `v2/develop`: `apps/mobile/`, `packages/domain/`, `supabase/`
(14 migrations), `scripts/backend/`, `.github/workflows/mobile-ci.yml`, `pnpm-lock.yaml` and the
workspace files; records [001](../architecture/001-mobile-foundation.md) and
[002](../architecture/002-connected-member-and-gym.md).

**Scope.**
1. Review the foundation with `code-reviewer` and `security-reviewer`. Fix critical and high
   findings; file the rest against the goals that own them.
2. Commit it in reviewable pieces. Keep build output (`apps/mobile/dist*`, `supabase/.temp`,
   `supabase/.branches`) and secrets out of git.
3. Bring `v2/develop` (the reset and the foundation) onto `main`. The owner performs or approves the
   merge and any push.
4. Map each partly built feature to its goal in the handoff ("Found for other goals"), so no goal
   assumes it is done.
5. Make the backend suites portable. `scripts/backend/*.mjs` call `rtk proxy pnpm exec supabase
   status`; `rtk` is a local developer tool, so CI and other machines need plain
   `pnpm exec supabase status`.

**Done when.**
- [ ] `main` contains the foundation; `git ls-files` shows no build output, and a secret scan of the tree is clean
- [ ] On a fresh clone of `main`, `pnpm install --frozen-lockfile`, `pnpm check` and (local Supabase running) `pnpm backend:test` pass; result lines are in the handoff
- [ ] Android and iOS JavaScript exports pass from the same clone
- [ ] Review reports are in `docs/evidence/QA-1/`, and every finding left open names its owning goal

### AR-1 · Freeze the architecture and the versioned data contract *(new 25 Oct)*
- **Lane:** S8 Member backend · **Size:** M · **Milestone:** M0 · **Label:** contract freeze
- **Needs:** QA-1

**Outcome.** One approved architecture record and one versioned contract package, so member, gym
and client work can run in parallel without guessing interfaces. The PRD requires this freeze
before dependent teams implement.

**PRD.** §§21.1–21.4, 22.1, 26.1 (M0), 26.2; DEC-02 (technical part).

**Existing work.** Local Supabase with RLS and a private schema (002); Zod contracts in
`packages/domain`; generated JSON Schema checked in Postgres (`validated_contracts.sql`).

**Scope.** Decide and record:
- Postgres (Supabase) as the system of record.
- How the RPC surface maps to PRD §21.3: version, error envelope and codes including
  `PRO_REQUIRED`, operation IDs, base revisions, cursor pagination, and decimal and money encoding.
- Workers and scheduler, private object storage, and the AI, messaging and subscription adapters.
- Monitoring.

Version the contract package. Add one fixture-vector runner shared by the TypeScript and SQL tests.
Write the SP3 rule: a contract merges before the screens that use it.

**Done when.**
- [ ] `docs/architecture/003-architecture-freeze.md` covers every PRD §21.1 component and §21.3 rule, and the owner's or an explicitly delegated decision-maker's approval is in the tracker decision log
- [ ] `packages/domain` exports a contract version, and a test fails when a schema changes without a version bump (seen to fail once)
- [ ] All migrations replay from empty to head, and a schema diff against the replay is empty (command and result in the handoff)
- [ ] One shared fixture vector (AC03 volume and e1RM) runs in both the TypeScript tests and a SQL test, from one file

### QA-2 · Reconcile the docs with the code
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M0 · **Label:** docs reconciled
- **Needs:** QA-1, AR-1

**Outcome.** Every current document agrees with `main` and the frozen architecture. Nothing tells a
session to use a deleted path, command or document.

**Scope.** These files: docs/README, 09, 22, 23, RESET-BASELINE, architecture 001 and 002,
implementation/PROGRESS (a derived view of this plan), plan/README, SESSION-PROMPT, INBOX, and the
`.claude/` agents and skills. Historical sections may stay, labelled historical.

**Done when.**
- [ ] `docs/evidence/QA-2/stale-paths.md` records the search (`services/api`, `uv run`, `jest.config.js`, `docs/1[0-9]-`, `Maestro`, `config.py` …) and every hit is fixed or labelled historical
- [ ] The tracker states that the board owns goal status and [ACCEPTANCE.md](ACCEPTANCE.md) owns acceptance results
- [ ] Every command in docs/23 §7 and in the skills runs on `main` as written

### QA-9 · Lint, type and coverage gates that only go up
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M0 · **Label:** lint + coverage
- **Needs:** QA-1

**Outcome.** Parallel sessions cannot quietly lower quality: lint, types and coverage run in CI with
thresholds that only rise.

**Scope.**
- Coverage for `@fitlog/mobile` (all of `src/`, not only theme and ui) and `@fitlog/domain`.
- For the backend suites: SQL function coverage, or an inventory mapping each RPC to its test.
- Thresholds at today's measured values. The 80% target is QA-10's.
- Prettier on touched files only.

**Done when.**
- [ ] `apps/mobile/jest.config.cjs` collects coverage from all of `src/` with thresholds at the measured values, and `pnpm check` fails when one is lowered (seen once)
- [ ] Domain coverage is measured with a threshold, and the backend inventory lists every exposed RPC with its test
- [ ] CI fails on a lint error (seen once, run linked), and the ratchet rule is in docs/23 §9

### PL-1 · Hosted CI green and main protected
- **Lane:** S1 Platform · **Size:** S · **Milestone:** M0 · **Label:** CI green
- **Needs:** QA-1

**Outcome.** GitHub, not just a laptop, says `main` is green, and nothing merges without it.

**Scope.** Run `mobile-ci.yml` on `main`. Add a backend job that starts the local Supabase stack,
replays the migrations and runs `pnpm backend:test`. The owner turns on branch protection with both
jobs required. Pushing is the owner's call.

**Done when.**
- [ ] A green run of both CI jobs on `main`'s head is linked in the tracker
- [ ] A deliberately failing check on a branch is shown to block merging (run linked)
- [ ] Branch protection with the required checks is on (owner; capture in `docs/evidence/PL-1/`)

### MS-0 · Ground truth
- **Lane:** Milestones · **Size:** S · **Milestone:** M0 · **Label:** M0 ground truth
- **Needs:** OW-1, OW-2, AR-1, QA-2, QA-9, PL-1

**Exit.** One UI direction, every external dependency registered, a frozen architecture and
contract, a clean green `main`, docs that agree with the code, and quality gates that only go up.

**Exit checks.**
- [ ] Every goal this gate needs is Done, with its handoff in the tracker
- [ ] On a fresh clone of `main`, `pnpm check` and `pnpm backend:test` pass, and hosted CI is green on the same commit
- [ ] The architecture record is approved and the contract package is versioned
- [ ] `node scripts/plan/build.mjs --check` passes: every card has a contract, and every PRD scenario and decision has a ledger row
- [ ] Every DEC row in the ledger has an owner goal and a recorded state; none claims an unproven approval

---

## M1 · Production platform

### OW-3 · Open the platform accounts
- **Lane:** You · **Size:** M · **Milestone:** M1 · **Label:** platform accounts
- **Needs:** OW-2, AR-1

**Outcome.** Every account the frozen architecture needs exists in the owner's name, with spend caps.

**PRD.** §§21.1, 23.2, 27 (DEC-02, DEC-08, DEC-09).

**Do.**
- A Supabase organisation with separate staging and production projects in the chosen region.
- A domain and DNS.
- Transactional email (SMTP) with a verified sending domain.
- Error monitoring with two projects.
- An AI provider key with a low staging spend cap.
- Google OAuth clients for web, Android and iOS.
- An Expo/EAS project.

Put spend alerts on everything that bills.

**Done when.**
- [ ] `docs/evidence/OW-3/accounts.md` lists each account, its owner and region, with no secret in it; secrets are in a password manager
- [ ] Spend alerts are set on every billing account (one note or capture per account)

### PL-2 · Staging environment end to end
- **Lane:** S1 Platform · **Size:** M · **Milestone:** M1 · **Label:** staging live
- **Needs:** OW-3, PL-1

**Outcome.** A staging backend, deployed from `main` by CI, that a staging build of the app uses for
a day.

**PRD.** §§21.1, 22.1, 23.2.

**Scope.**
- CI applies migrations and server functions to staging from `main`.
- Staging auth settings: redirect URLs, password rule, email templates.
- Private storage buckets.
- `apps/mobile/.env.example` listing every `EXPO_PUBLIC_*` variable.
- No privileged key in any client bundle.
- Error monitoring in the app and on the server.

**Done when.**
- [ ] A CI run deploys `main` to staging and records the migration version (run linked)
- [ ] A staging Android build signs in, logs a workout and a meal, and the rows appear in staging (`docs/evidence/PL-2/`)
- [ ] A scan of the built bundle finds no service-role key, and error monitoring received one app and one server test event

### PL-3 · Auth email that arrives
- **Lane:** S1 Platform · **Size:** S · **Milestone:** M1 · **Label:** email + reset
- **Needs:** PL-2, MB-1

**Outcome.** Sign-up verification, password reset and email change reach a real inbox from staging.

**PRD.** §5.1.

**Done when.**
- [ ] SPF and DKIM pass for the sending domain (header capture in `docs/evidence/PL-3/`)
- [ ] Verify, reset and email change are each walked on a phone against staging, with captures in `docs/evidence/PL-3/`

### PL-4 · Production environment
- **Lane:** S1 Platform · **Size:** M · **Milestone:** M1 · **Label:** production live
- **Needs:** PL-2

**Outcome.** Production runs apart from staging (identity, data, storage, keys) on the owner's
domain, and deploys only through a required reviewer.

**PRD.** §§22.1, 23.2.

**Done when.**
- [ ] A production deploy passes through the required reviewer, and the public health/version endpoint reports the release over HTTPS
- [ ] Staging and production share no key, bucket or user pool (settings evidence in `docs/evidence/PL-4/`)

### PL-5 · Backups and the restore drill
- **Lane:** S1 Platform · **Size:** S · **Milestone:** M1 · **Label:** restore drill
- **Needs:** PL-4

**Outcome.** A restore has been done once, within the selected RPO of 15 minutes and RTO of 4 hours,
so backups are proven rather than assumed.

**PRD.** §§22.3, 23.1 (backup row), 23.2; NF-11; DEC-09.

**Done when.**
- [ ] `docs/evidence/PL-5/restore-drill-<date>.md` records a point-in-time restore into an isolated project, the measured RPO and RTO, and yesterday's data found
- [ ] The object and photo backup policy is in the architecture record: a nightly copy, or an explicitly accepted gap (DEC-09)
- [ ] The NF-11 and DEC-09 ledger rows have pass results pointing at the drill

### PL-6 · Push notifications switched on
- **Lane:** S1 Platform · **Size:** S · **Milestone:** M1 · **Label:** push on
- **Needs:** PL-2

**Outcome.** Transactional pushes arrive on a real device, for example "your analysis is ready", and
private content never appears on the lock screen.

**PRD.** §19.3.

**Done when.**
- [ ] A push sent through the server's push adapter from staging arrives on an Android device (capture in `docs/evidence/PL-6/`)
- [ ] A test shows push payloads carry no meal text, body values or names; with notifications denied, in-app notices still work

### PL-9 · Monitoring, alerts, feature flags and the runbook *(new 25 Oct)*
- **Lane:** S1 Platform · **Size:** M · **Milestone:** M1 · **Label:** ops + runbook
- **Needs:** PL-4

**Outcome.** Operators see problems before members do. They can switch off AI, messaging or the gym
layer without touching workouts, and have a written response for each known incident.

**PRD.** §§23.1 (availability), 23.2; AC32; NF-05, NF-06.

**Done when.**
- [ ] Alerts exist for the §23.2 signals, each with a threshold and a route, and one is seen to fire (`docs/evidence/PL-9/`). The signals: errors, latency, outbox age, job failures, AI cost, webhook lag, receipt numbering, deletion and export deadlines, and backup success
- [ ] Feature flags disable AI, messaging and the gym layer while workout logging keeps working (tested)
- [ ] `docs/operations/RUNBOOK.md` covers provider outage, tenant leak, billing mismatch, failed deletion, backup restore and incident or breach, and one is exercised as a drill
- [ ] Logs are redacted and correlated by request and operation ID (a test asserts no phone, meal text or token appears in a log line)

### AI-1 · Production AI provider, guarded
- **Lane:** S6 Food, AI & Pro · **Size:** S · **Milestone:** M1 · **Label:** real AI, guarded
- **Needs:** PL-2

**Outcome.** Deployed environments call the real model through the AI gateway and cannot silently
fall back to a test provider.

**PRD.** §§10, 21.1, 23.2; DEC-08.

**Done when.**
- [ ] A test shows a deployed configuration with the test provider refuses to start
- [ ] The model ID is checked against the provider's current list and pinned in config, and the gateway enforces a monetary spend cap (tested with a tiny cap)
- [ ] The cost of a sample text and a sample photo request on staging is recorded in `docs/evidence/AI-1/cost.md`

### MS-1 · Production platform
- **Lane:** Milestones · **Size:** S · **Milestone:** M1 · **Label:** M1 platform
- **Needs:** PL-3, PL-4, PL-5, PL-6, PL-9, AI-1

**Exit.** Staging and production run on the owner's accounts, deployed from `main` by CI, with email,
push, the real guarded AI provider, alerts, flags, a runbook and a proven restore.

**Exit checks.**
- [ ] Every goal this gate needs is Done, with its handoff in the tracker
- [ ] `main`'s head is deployed to staging by CI, and production deploys only through the required reviewer
- [ ] `node scripts/plan/status.mjs gate MS-1` shows no open ledger row (NF-11, DEC-02, DEC-09)
- [ ] The restore drill met RPO ≤15 min and RTO ≤4 h

---

## M2 · Momentum foundations

### DS-1 · Colour tokens and theme
- **Lane:** S3 Design · **Size:** M · **Milestone:** M2 · **Label:** colour tokens
- **Needs:** QA-1

**Outcome.** Every colour comes from Momentum's semantic roles, in dark and light, with a
system/light/dark preference.

**PRD.** §19.1; [docs/22 §4](../22-UI-MOMENTUM.md); [THEMING.md](../THEMING.md).

**Existing work.** `apps/mobile/src/theme/`: `themes/momentum.json`, `theme.ts`,
`ThemeProvider.tsx`, the preference store and their tests. Also `scripts/generate-palette.ts` and
the design-rule lint.

**Done when.**
- [ ] The palette regenerates from seed `#C6F432` by script with no diff, and contrast tests pin every text, action, error, coach and gym pair in both themes, including the light-lime-as-container rule
- [ ] The lint guard rejects a literal colour outside theme files (seen to fail)
- [ ] Today in both themes on an Android release build sits beside Figma page 02 in `docs/evidence/DS-1/`

### DS-2 · Type ramp and fonts
- **Lane:** S3 Design · **Size:** M · **Milestone:** M2 · **Label:** type + fonts
- **Needs:** QA-1

**Outcome.** Words, figures and Hindi each have the right licensed typeface and the Momentum ramp.

**PRD.** §§19.1, 23.1 (text scaling); DEC-16 (font rights); docs/22 §4.

**Existing work.** Google Sans Flex, Roboto Condensed and Noto Sans Devanagari bundled with OFL
notices (002).

**Done when.**
- [ ] The ramp (Display 56/44/36, numbers up to 112) is in the tokens with tests, and the lint guard rejects a literal font size or family (seen to fail)
- [ ] Each bundled font's licence file is in the repo and listed in the in-app licences data
- [ ] English and Devanagari samples render at 100% and 200% text on an Android release build without clipping (`docs/evidence/DS-2/`)

### DS-3 · Motion and haptics
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M2 · **Label:** motion + haptics
- **Needs:** QA-1

**Outcome.** One motion system with spring tokens and haptics. It respects Reduce Motion everywhere
and never slows the set commit.

**PRD.** §§19.1, 23.1 (Reduced Motion); docs/22 §5.

**Done when.**
- [ ] Spring tokens and a shared `useReducedMotion` exist, and with Reduce Motion on every animated primitive renders its end state at once (one test per primitive)
- [ ] Haptics map to moments (confirm on set logged; success on rest end, PR and check-in), each with a non-haptic equivalent, and are tested
- [ ] No animation runs on the set-commit path before the durable acknowledgement (test or trace in the handoff)

### DS-4 · Component kit
- **Lane:** S3 Design · **Size:** L · **Milestone:** M2 · **Label:** component kit
- **Needs:** DS-1, DS-2, DS-3

**Outcome.** Every Momentum component exists once, tested, so screen sessions compose rather than
invent.

**PRD.** §§19.1, 19.3, 23.1 (accessibility); docs/22 §§3–5.

**Existing work.** `apps/mobile/src/ui/`: AppButton, AppText, Card, Choice, Field, Header,
ProgressRing, Screen. The dev gallery.

**Scope.** Wavy progress (linear and circular), the 96 dp primary action, the connected button
group, shape badges, the ring, the AI proposal card (neutral card, violet ink, dashed border), tonal
chips, cards on the corner tokens, Material Symbols Rounded icons, list rows, sheets, dialogs,
banners, and the building blocks of the §19.3 states.

**Done when.**
- [ ] Each component has tests for its states, Reduce Motion, 200% text and its screen-reader label and role
- [ ] Touch targets are at least 48 dp, and the logger sizes (96 dp primary, at least 56 dp secondary) are asserted in tests
- [ ] The dev gallery is captured in both themes on an Android release build in `docs/evidence/DS-4/`

### DS-5 · Shell and navigation
- **Lane:** S3 Design · **Size:** M · **Milestone:** M2 · **Label:** shell + tabs
- **Needs:** DS-4

**Outcome.** The app's frame is Momentum on both platforms: the member and staff shells, the
workspace seam, deep-link resolution and safe denial.

**PRD.** §19.1; DEC-12 (minimum OS); docs/22 §§7–8.

**Existing work.** `src/app/(member)/_layout*.tsx`, `src/app/gym/[gymId]/(tabs)/`.

**Done when.**
- [ ] Shell tests cover both tab sets through one `tabsFor(workspace, role)` seam. Member: Today · Train · Food · Progress · Gym, with Gym hidden until enabled and Join gym when unlinked. Staff: Today · Members · Money · Visits · More, with restricted actions absent for front desk
- [ ] Deep-link tests resolve identity, then tenant, consent and entitlement before showing content; a denied or missing route returns to the current workspace
- [ ] The minimum Android and iOS versions and the native dependency versions are in the architecture record, and the DEC-12 (MS-2) ledger row has a pass result

### G14.app · Strings catalog, locale formats and the Hindi spine
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M2 · **Label:** i18n spine
- **Needs:** QA-1, AR-1

**Outcome.** Every screen speaks through `t()` with en-IN and hi-IN formats, so complete Hindi
(G14.hi) is translation work, not a rewrite.

**PRD.** §§2, 5.3, 19.1, 23.1; ID04–ID06.

**Existing work.** `apps/mobile/src/lib/i18n/`: typed `en.ts` and `hi.ts`, with a parity test.

**Done when.**
- [ ] The catalog parity test and a source scan for user-facing literals each fail on a planted literal, and the scan covers every directory that holds screens
- [ ] en-IN and hi-IN formatter tests pass (₹1,00,000, dates, plurals, units)
- [ ] The language preference persists locally and through the profile contract, and docs/23 §9 states the rule: every string on a screen goes through the catalog

### MS-2 · Momentum foundations
- **Lane:** Milestones · **Size:** S · **Milestone:** M2 · **Label:** M2 foundations
- **Needs:** DS-5, G14.app

**Exit.** Tokens, type, motion, the component kit, both shells and the strings catalog are on
`main`. Screen sessions can now run in parallel.

**Exit checks.**
- [ ] Every goal this gate needs is Done, with its handoff in the tracker
- [ ] The colour, font-size and string guards each fail on a planted violation on `main` (the gatekeeper re-runs them)
- [ ] The kit gallery and both shells render in both themes on an Android release build from `main`
- [ ] `node scripts/plan/status.mjs gate MS-2` shows no open ledger row (DEC-12 minimum OS)

---

## M3 · Member core

After the reset, M3 builds the member product rather than restyling one. Each `MB` goal delivers
one domain's schema, policies, commands and contract (SP3). The `SC` and `AP` goals deliver its
screens against the Figma frames. QA-11 and QA-3 prove the result on release builds.

### CT-1 · Exercise catalogue and three starter programmes *(new 25 Oct)*
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M3 · **Label:** exercise content
- **Needs:** AR-1

**Outcome.** At least 200 source-reviewed exercises and three reviewed starter programmes, seeded
idempotently, so a new member can train on day one.

**PRD.** §§6.1, 21.4, 27 (PROD-02 counts); DEC-16 (seed rights); TR01–TR03.

**Existing work.** `supabase/development-catalogue.sql`, a development fixture rather than launch
content.

**Done when.**
- [ ] At least 200 distinct exercises with muscles, equipment, English instructions and source, licence and version metadata; a test counts them and rejects a record without provenance
- [ ] Three starter programmes with prescriptions exist, with the reviewer and date recorded in `docs/evidence/CT-1/`
- [ ] The seed is idempotent and never touches user rows (a test seeds twice over existing user data)
- [ ] Every record has a Hindi name and instructions, or is listed for G14.hi

### MB-1 · Identity, adult onboarding, sessions and preferences *(new 25 Oct)*
- **Lane:** S8 Member backend · **Size:** L · **Milestone:** M3 · **Label:** identity + profile
- **Needs:** AR-1

**Outcome.** Adults create and recover accounts by email, Google or Apple. They finish resumable
onboarding and keep their preferences, and can list and revoke their sessions. Phone sign-in is G13.

**PRD.** §§4.2, 5.1–5.3, 22.1–22.2; ID01–ID06; AC16, AC30 (identity part).

**Existing work.** Email sign-in, signup and reset initiation, and the server-side adult check (002);
`features/auth/`.

**Done when.**
- [ ] Integration tests cover email signup, verify and reset; Google and Apple sign-in through their adapters (local test configuration); unverified email; a reused reset token; and linking without automatic account merge
- [ ] The server rejects under-18 dates of birth, notice versions and acceptances are recorded, and onboarding resumes at the right step after a kill (tests)
- [ ] A revoked session fails on its next request, and a user can read only their own profile (cross-user test)
- [ ] AC16 fixtures (timezone and unit changes, DST and date boundaries) pass in TypeScript and SQL, and the contract is published (SP3)

### MB-2 · Exercises, programmes, schedule and occurrences *(new 25 Oct)*
- **Lane:** S8 Member backend · **Size:** L · **Milestone:** M3 · **Label:** plans + schedule
- **Needs:** MB-1, CT-1

**Outcome.** Members customise exercises, build programmes and days, and schedule them. Every
workout attaches to the right planned occurrence.

**PRD.** §§4.1, 6.1–6.3; TR01–TR03; AC15 (training part), AC38.

**Existing work.** Programme snapshots, a rolling one-year schedule horizon and explicit occurrence
selection (002); `scheduling_and_history.sql`.

**Done when.**
- [ ] Custom exercise versions and programme, day and prescription create/edit/order/archive with base revisions pass integration tests, and archived items stay findable
- [ ] AC38 fixtures pass: missed Monday vs Tuesday vs unscheduled, completion up to 7 days late, one session per occurrence, and deletion resets the occurrence
- [ ] AC15, training part: editing or archiving after a completed session leaves its snapshot unchanged (test)
- [ ] Every table has RLS with cross-user tests, and the contract is published (SP3)

### MB-3 · Live logging and the durable offline outbox *(new 25 Oct)*
- **Lane:** S8 Member backend · **Size:** L · **Milestone:** M3 · **Label:** logger + outbox
- **Needs:** MB-2

**Outcome.** A set is durable on the phone the moment the member sees it logged. It survives a
process kill and syncs exactly once.

**PRD.** §§7.1–7.3, 20.1–20.3; TR04–TR07, TR10; AC01, AC14, AC29 (M), AC32 (M); NF-01, NF-07.

**Existing work.** Encrypted local store (SQLCipher with a SecureStore key; IndexedDB with AES-GCM on
web). Serialized mutations, and an outbox with stable identity, base revisions and replay semantics
(002). `src/data/member-store.ts`, `src/data/cache.*.ts`.

**Done when.**
- [ ] Fault tests pass (AC14, AC29 member part): a double tap makes one set; a kill right after local feedback leaves the set there on relaunch; a replay returns the original outcome; changed replay input or a stale revision goes to conflict review
- [ ] Logging out or switching user with queued work never sends it under another account (test)
- [ ] The rest timer, plate calculator and superset rules have domain fixtures, and logging works with the backend down (AC32 member part)
- [ ] Durable commit p95 is under 100 ms over at least 200 commits in 20 sessions, on a release build on the reference Android device, recorded in `docs/evidence/MB-3/`

### MB-4 · History, corrections and training analytics *(new 25 Oct)*
- **Lane:** S8 Member backend · **Size:** M · **Milestone:** M3 · **Label:** history + analytics
- **Needs:** MB-3

**Outcome.** Members find previous work instantly. Volume, frequency, e1RM, PRs and adherence match
the formula contract and recompute after corrections.

**PRD.** §§8.1–8.2; TR08–TR09; AC02, AC03, AC17.

**Done when.**
- [ ] Shared formula vectors (volume, versioned e1RM, PR, frequency, adherence) pass in TypeScript and SQL from one fixture file, including AC03: 1,920 kg·reps and e1RM 101.333…
- [ ] AC02: the previous occurrence is the latest earlier completed work, never the current draft (test)
- [ ] AC17: deleting or editing the strongest set recomputes the next-best PR and the summaries, and a past session keeps its timestamps and duration unless explicitly corrected (test)

### MB-5 · Food catalogue, diary, recipes and targets *(new 25 Oct)*
- **Lane:** S6 Food, AI & Pro · **Size:** L · **Milestone:** M3 · **Label:** food diary
- **Needs:** MB-1

**Outcome.** Members log food with household portions, quick add, custom foods, recipes and copy,
against effective-dated targets. Unknown values show as unknown.

**PRD.** §§9.1–9.3, 20.1 (drafts), 27 (PROD-12); FD01–FD05; AC04 (manual part), AC15 (food part), AC18.

**Existing work.** Manual meals and targets with online confirmation, and separate unsaved drafts
(002); `features/food/`.

**Done when.**
- [ ] Food versions, servings and household portions, custom foods, quick add, recipes, copy and favourites pass integration tests, with RLS cross-user tests
- [ ] AC18: null macros count as unknown, not zero; coverage is shown; negative remaining is allowed (tests)
- [ ] AC15, food part: editing a food or recipe leaves logged meals unchanged (test)
- [ ] Unsaved drafts survive relaunch and never change totals, and Save needs a connection (tests); the contract is published (SP3)

### MB-6 · Body records, private photos, goals and Today *(new 25 Oct)*
- **Lane:** S8 Member backend · **Size:** M · **Milestone:** M3 · **Label:** body + goals
- **Needs:** MB-4, MB-5

**Outcome.** Body entries, private progress photos and goals are stored and calculated as specified,
and Today agrees with every source.

**PRD.** §§11.1–11.3, 18.1; PG01–PG04; AC05 (Today part), AC19, AC42, AC44 (storage part).

**Done when.**
- [ ] AC19 and AC42 fixtures pass: the latest daily value, means of measured days with the sample count, no interpolation, and the strength-goal rules for load basis, window and baseline
- [ ] Photos are in private storage behind signed URLs, and the 1 GiB / 2,000-image cap reserves atomically under concurrent uploads (AC44 storage part)
- [ ] Today's aggregates equal the source records after edits and deletes (AC05 Today part, test)

### MB-7 · Account lifecycle: export, erasure, notifications and support *(new 25 Oct)*
- **Lane:** S1 Platform · **Size:** M · **Milestone:** M3 · **Label:** export + erasure
- **Needs:** MB-6

**Outcome.** Members export everything and erase their account on the selected timeline. They get
transactional notices and reminders, and can reach support. An erased user never comes back after a
restore.

**PRD.** §§5.3, 19.3, 22.3; AC05 (export and deletion), AC30 (M), AC31 (M, notifications).

**Done when.**
- [ ] An export job produces a complete manifest of every personal entity within 24 hours (a test checks the manifest against the entity list)
- [ ] Erasure follows the §22.3 lifecycle; restoring a pre-erasure snapshot into a scratch database and replaying tombstones does not resurrect the user (test)
- [ ] The notification inbox keeps read and unread state with direct destinations, reminders follow the selected days, time and opt-out, and no fake "missed workout" push exists (tests)
- [ ] The account-deletion request endpoint used by the public web page is tested; QA-5 checks the page in production

### QA-11 · Critical-journey and fault suite on release builds *(new 25 Oct)*
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M3 · **Label:** journey suite
- **Needs:** MB-3, DS-5

**Outcome.** Acceptance scenarios run as scripted journeys on a release build, locally and in CI, with
fault injection, so every result in the ledger can be reproduced.

**PRD.** §§23.1 (reference device, network profile), 23.2 (critical journeys in CI), 25; PD-04.

**Done when.**
- [ ] The journey tool is chosen and recorded, and AC01 and AC14 (including a process kill after local feedback) run on an Android release build from one command
- [ ] CI runs the journeys on an emulator, nightly or on demand, and keeps the results by date (run linked)
- [ ] `docs/evidence/devices.md` names the reference Android device(s), their OS versions and the fixed network profile
- [ ] A deliberately broken journey fails the suite (seen once)

### SC-1 · Live logger hero loop
- **Lane:** S3 Design · **Size:** L · **Milestone:** M3 · **Label:** logger loop
- **Needs:** MS-2, MB-4

**Outcome.** The screens a member uses every session are built in Momentum with real data: logging,
rest, finish and records. Rewards appear only for real events.

**PRD.** §§7, 8.2 (provisional and final PR), 19.2 (E); AC01, AC14; NF-01. Screens E-03 logger, E-04
rest, E-08 complete, E-11 PR (docs/22 page 02).

**Existing work.** `features/training/WorkoutScreen.tsx`, `app/workout/[id].tsx`.

**Done when.**
- [ ] Screen tests cover data, empty, offline, pending, durable, synced and rejected states, and every string goes through `t()`
- [ ] AC01 and AC14 pass through the UI on an Android release build (journey runs linked in the handoff)
- [ ] Tap-to-durable p95 through the UI is under 100 ms on the reference device (at least 200 commits in 20 sessions), recorded in `docs/evidence/SC-1/`
- [ ] Each screen in both themes sits beside its Figma frame in `docs/evidence/SC-1/`

### SC-2 · Train, logger details and history
- **Lane:** S4 Member app · **Size:** L · **Milestone:** M3 · **Label:** train + history
- **Needs:** SC-1

**Outcome.** Everything under Train works in Momentum: programmes, the library, the schedule, the rest
of the logger and history.

**PRD.** §§6, 7, 8.1, 19.2 (C, D, E, F); AC01, AC02, AC15, AC38. Screens C-01…C-09, D-01…D-04, E-01,
E-02, E-05, E-06, E-07, E-09, E-10, E-12, E-13 supersets and F-01…F-07 (docs/22 pages 07–08).

**Existing work.** `features/training/`: Train, Programme, ExercisePicker, ExerciseDetail,
CustomExercise, Schedule, History, EditSet and Plates screens.

**Done when.**
- [ ] Each listed screen exists with the §19.3 states and tests, and every string goes through `t()`
- [ ] AC02, AC15 (training part) and AC38 pass through the UI on an Android release build (journey runs linked)
- [ ] Recovery (E-10) resumes an interrupted session after a kill on a release build (journey)
- [ ] The screens in both themes sit beside their Figma frames in `docs/evidence/SC-2/`

### SC-3 · Today, progress, body and goals
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M3 · **Label:** today + progress
- **Needs:** MS-2, MB-6

**Outcome.** Today, analytics, body and goals screens show real data, and the charts work by touch
and by screen reader.

**PRD.** §§8.2, 11, 19.2 (B, G, I/J); AC03, AC05, AC19, AC42. Screens B-01…B-05, G-01…G-07,
I-01…I-06 and J-01…J-04.

**Existing work.** `features/today/`, `features/progress/`.

**Done when.**
- [ ] Each listed screen exists with the §19.3 states and tests, and charts have a touch read-out and a text equivalent (tests)
- [ ] AC03, AC05 (Today part), AC19 and AC42 pass through the UI on an Android release build
- [ ] No screen shows invented progress to a new user (an empty-state test per screen)
- [ ] The screens in both themes sit beside their Figma frames in `docs/evidence/SC-3/`

### SC-4 · Food screens
- **Lane:** S6 Food, AI & Pro · **Size:** M · **Milestone:** M3 · **Label:** food screens
- **Needs:** MS-2, MB-5

**Outcome.** Manual food logging works end to end in Momentum. The AI screens belong to AI-3 and
the Pro locked state to G15.app.

**PRD.** §§9, 19.2 (H); AC04 (manual part), AC15 (food part), AC18. Screens H-01…H-05 and H-10…H-16.

**Existing work.** `features/food/`: FoodScreen, AddFoodScreen, TargetsScreen.

**Done when.**
- [ ] Each listed screen exists with the §19.3 states and tests, and every string goes through `t()`
- [ ] AC04 (manual part), AC15 (food part) and AC18 pass through the UI on an Android release build
- [ ] An unsaved meal draft survives an offline relaunch and never changes totals (journey)
- [ ] The screens in both themes sit beside their Figma frames in `docs/evidence/SC-4/`

### SC-5 · Auth and onboarding
- **Lane:** S3 Design · **Size:** M · **Milestone:** M3 · **Label:** auth + onboarding
- **Needs:** MS-2, MB-1

**Outcome.** First run works from splash to the first planned workout. Phone sign-in screens (A-11,
A-12) belong to G13 and gym join (A-13, A-14) to G18.app.

**PRD.** §§5, 19.2 (A auth); AC16; DEC-14. Screens A-01…A-10, including A-07a–f and the A-08 target
review.

**Existing work.** `features/auth/`: AuthScreen, OnboardingScreen; `app/auth/callback.tsx`.

**Done when.**
- [ ] Email, Google and Apple sign-in and sign-up, reset and verify run as journeys on an Android release build against local auth
- [ ] Onboarding resumes at the right step after a kill, and an under-18 user is refused with a clear message (journeys)
- [ ] Target estimates on A-08 stay behind a flag until the DEC-14 review passes, and manual targets always work (tests)
- [ ] The screens in both themes sit beside their Figma frames in `docs/evidence/SC-5/`

### SC-6 · Settings, privacy and account
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M3 · **Label:** settings screens
- **Needs:** MS-2, MB-7

**Outcome.** Every settings screen works in Momentum, including export, deletion, AI permission and
notifications. The Pro screens belong to G15.app.

**PRD.** §§5.3, 19.2 (K), 22; AC05 (export and deletion), AC30 (M), AC31 (M). Screens K-01…K-04,
K-06, K-07, K-07b, K-08 (reconciled to the AI permission setting) and K-10. K-09 connected apps is
P2 (AP-10).

**Existing work.** `features/settings/`: Settings, Profile, Appearance and Sync screens.

**Done when.**
- [ ] Each listed screen exists with the §19.3 states and tests, and every string goes through `t()`
- [ ] Export and account deletion run end to end from the UI on an Android release build (AC05 export and deletion, AC30 member part)
- [ ] With photo and notification permissions denied, at 200% text, with Reduce Motion and with TalkBack, every settings path stays usable (AC31 member part; journey plus audit notes)
- [ ] The licences screen (K-10) lists every bundled font and seed source

### SC-7 · System states
- **Lane:** S3 Design · **Size:** S · **Milestone:** M3 · **Label:** system states
- **Needs:** DS-4

**Outcome.** Each of these states exists once and every screen uses it: empty, filtered empty,
loading, offline, the sync centre, error, not found, session expired, permission primer, conflict and
maintenance.

**PRD.** §§19.3, 20.3; screens L-01…L-08.

**Existing work.** `features/settings/SyncScreen.tsx`.

**Done when.**
- [ ] Each state component has tests, including cached content kept with "Last updated" and a support reference without stack traces
- [ ] A permission primer appears once before the native prompt and never again after denial (test)
- [ ] Every state is captured in both themes in `docs/evidence/SC-7/`

### AP-1 · Manage programmes, exercises and custom foods
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M3 · **Label:** manage menus
- **Needs:** SC-2, SC-4

**Outcome.** Members can rename, duplicate, archive and delete what they own, safely.

**PRD.** §§4.3, 6.1–6.2, 9.2.

**Done when.**
- [ ] Rename, duplicate, archive and delete for programmes, plan days, custom exercises and custom foods each have a test asserting the command and the cache update
- [ ] Destructive actions confirm first, archived items can be found and restored, and a near-duplicate exercise name warns (tests)

### AP-2 · Edit a past session (F-04)
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M3 · **Label:** past-session edit
- **Needs:** SC-2

**Outcome.** Editing a finished session never reopens it as live or stretches its duration.

**PRD.** §8.1; AC17. Screen F-04.

**Existing work.** Completed-set corrections and delete with undo, kept as revision snapshots (002).

**Done when.**
- [ ] A test edits a session from three days ago: its start, end and duration are unchanged unless explicitly corrected
- [ ] AC17 passes through the UI on an Android release build, and analytics and PRs recompute (test)

### QA-3 · Member core verified on Android release builds
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M3 · **Label:** verify member core
- **Needs:** SC-1, SC-2, SC-3, SC-4, SC-5, SC-6, SC-7, AP-1, AP-2, QA-11

**Outcome.** The member core is proven on the reference Android device: acceptance journeys, both
themes, large text, the screen reader and the performance budgets.

**PRD.** §§23.1, 25; NF-01, NF-07, NF-10, NF-12; DEC-13.

**Done when.**
- [ ] Every member scenario M3 owns passes on an Android release build, with results and run links in `docs/evidence/QA-3/`: AC01–AC03, AC05, AC14–AC19, AC38, AC42, AC04's manual part, and the member parts of AC29–AC32
- [ ] `docs/evidence/a11y-audit.md` has a dated section (TalkBack, 200% text, Reduce Motion, contrast) with every finding fixed or accepted with a reason
- [ ] Set-commit p95, cold start and the Android download size (60 MB or less) are measured on the reference device in `docs/evidence/QA-3/`
- [ ] No member screen renders sample or invented data (the search and the screen tests are listed), and the DEC-13 (MS-3) ledger row has a pass result

### MS-3 · Member core
- **Lane:** Milestones · **Size:** S · **Milestone:** M3 · **Label:** M3 member core
- **Needs:** QA-3

**Exit.** On an Android release build, a member can sign up, plan, log, review history and analytics,
log food by hand, track body and goals, and manage their account. Every M3 acceptance scenario
passes.

**Exit checks.**
- [ ] Every goal this gate needs is Done, with its handoff in the tracker
- [ ] QA-3's evidence shows each M3-owned scenario passing on an Android release build made from `main` after the last M3 merge
- [ ] Set-commit p95 is under 100 ms, the Android download is 60 MB or less, and every open accessibility finding is within budget or accepted
- [ ] Every member table has RLS with cross-user tests, and the client's contract version matches the server's
- [ ] `node scripts/plan/status.mjs gate MS-3` shows no open ledger row (DEC-13 scope)

---

## M4 · Launch foundations: phone, Hindi, AI and Pro

### OW-5 · Start the SMS and WhatsApp registrations
- **Lane:** You · **Size:** M · **Milestone:** M4 · **Label:** DLT + Meta setup
- **Needs:** OW-2

**Outcome.** The long-lead registrations for +91 OTP and gym utility messaging are underway early;
they take weeks.

**PRD.** §§5.1, 14.2, 27 (DEC-05).

**Do.** Register the entity and the OTP template on DLT (TRAI) with the chosen SMS provider. Start
Meta Business verification for the WhatsApp platform number. Set real-send budgets.

**Done when.**
- [ ] The SMS provider can send a DLT-approved OTP to an Indian number (dated proof in `docs/evidence/OW-5/`, no secrets)
- [ ] Meta Business verification is approved (dated proof)

### OW-7 · Set the Pro price and the store products
- **Lane:** You · **Size:** S · **Milestone:** M4 · **Label:** Pro price + products
- **Needs:** OW-4

**Outcome.** Member Pro exists as localized subscription products in both stores and the billing
service, so G15 can be wired end to end. Old indicative prices are not approved prices.

**PRD.** §§18, 27 (DEC-06).

**Done when.**
- [ ] The owner-approved price, trial eligibility and SKUs are in the tracker decision log
- [ ] The products are visible in both store consoles and the billing service, with sandbox testers (`docs/evidence/OW-7/`)

### G13 · Phone sign-in for India (+91)
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M4 · **Label:** phone sign-in
- **Needs:** MB-1, OW-5, PL-2

**Outcome.** Phone-only adult accounts work and email is optional. The E.164 structure stays
international while production delivery is +91 only.

**PRD.** §§5.1, 14.1, 22, 27 (DEC-05); ID01–ID03; AC07 and AC23 (phone parts). Screens A-11, A-12.

**Done when.**
- [ ] Phone-only signup and sign-in, OTP expiry, resend and attempt limits, safe linking and re-authentication pass integration tests, and under-18 is refused
- [ ] Provider webhook signatures and abuse limits are tested, and production config refuses non-+91 numbers (test)
- [ ] A real +91 OTP arrives on staging through the approved provider (`docs/evidence/G13/`), and the DEC-05 (MS-4) ledger row has a pass result
- [ ] A-11 and A-12 work in English and Hindi with every error state (journeys on an Android release build)

### G14.data · Licensed Indian foods and Hinglish search
- **Lane:** S6 Food, AI & Pro · **Size:** M · **Milestone:** M4 · **Label:** Indian food 500+
- **Needs:** MB-5

**Outcome.** At least 500 distinct India-focused foods and dishes with reviewed household conversions
and English, Hindi and Hinglish aliases. Aliases do not inflate the count.

**PRD.** §§9.1, 21.4, 27 (PROD-02, DEC-16).

**Done when.**
- [ ] At least 500 distinct reviewed records carry source, licence and version metadata (count test), and the licensed acquisition record is in `docs/evidence/G14.data/`
- [ ] Missing density or nutrition never becomes 1:1 or 0 (tests)
- [ ] Search fixtures pass for dal/daal, roti/chapati, chawal/rice, paneer and biryani in English, Hindi and Hinglish

### G14.hi · Complete Hindi for every member flow *(new 25 Oct)*
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M4 · **Label:** complete Hindi
- **Needs:** MS-3, G14.app

**Outcome.** Every shipped member flow is complete and natural in Hindi, reviewed by a qualified
reader. Gym flows are proved at G23 (AC13).

**PRD.** §§2, 5.3, 19.1, 23.1; PROD-02; ID04.

**Done when.**
- [ ] Catalog parity is 100% for member flows, including exercise and starter-programme content (test)
- [ ] A qualified Hindi reviewer's sign-off and date are in `docs/evidence/G14.hi/`
- [ ] Every member screen family is captured in Hindi on an Android release build at 100% and 200% text, without clipping

### AI-3 · Food AI: uploads, jobs, proposals and confirmation *(new 25 Oct)*
- **Lane:** S6 Food, AI & Pro · **Size:** L · **Milestone:** M4 · **Label:** food AI
- **Needs:** SC-4, AI-1

**Outcome.** Members describe or photograph a meal, review editable proposals and confirm the rows
they choose. Nothing counts until confirmed, and a failure always leaves a manual path.

**PRD.** §§10.1–10.3, 20.1, 21.3 (AI); FD06–FD09; AC04 (AI part), AC28; NF-09. Screens H-06, H-07,
H-08, H-09, H-18.

**Scope.** Every AI entry point calls the entitlement check that G15.api implements. Until G15.api
lands, only test accounts are entitled.

**Done when.**
- [ ] AC04, AI part: proposals never change totals, corrected confirmed values count exactly once, and raw output stays unchanged (tests)
- [ ] AC28: malformed output, timeouts and a hit cap keep the input and the manual path, and double confirmation gives one result (tests)
- [ ] Uploads are private, size-checked and consent-gated. Accepted status under 1 s server time is asserted, and ready and terminal timings are measured on staging (NF-09, `docs/evidence/AI-3/`)
- [ ] The AI screens pass through the UI on an Android release build against staging with the real provider

### AI-2 · Food-AI accuracy harness
- **Lane:** S6 Food, AI & Pro · **Size:** M · **Milestone:** M4 · **Label:** AI accuracy
- **Needs:** AI-3

**Outcome.** A measured accuracy and cost table for Indian meals, for at least two models. It sets
the launch model and feeds the gym go memo (OW-10) and the register reader (G30).

**PRD.** §§10, 27 (DEC-08).

**Done when.**
- [ ] A re-runnable script and a weighed-meal protocol produce the error per macro and per dish class for at least two models, in `docs/evidence/AI-2/`
- [ ] The chosen launch model, its measured cost and the spend cap are in the tracker decision log, and the DEC-08 ledger row has a pass result

### G15.api · Pro entitlements and the AI allowance lifecycle
- **Lane:** S6 Food, AI & Pro · **Size:** M · **Milestone:** M4 · **Label:** entitlements API
- **Needs:** OW-7, AI-3

**Outcome.** Billable personal AI needs a verified trial or Pro plus current AI permission. The quota
is 20 text and 10 photo analyses per UTC day, with two concurrent jobs. Reserve, consume and release
all use the original day bucket.

**PRD.** §§10.3, 18, 18.1; PR01–PR03; AC12, AC27, AC40, AC44 (Pro part).

**Done when.**
- [ ] AC12: a free user calling an AI route gets `PRO_REQUIRED` and the provider is called zero times (the test counts calls)
- [ ] AC27: pending, success, cancel, restore, replayed and out-of-order webhooks, and refunds all leave the entitlement equal to the verified store state (tests)
- [ ] AC40: cancel, permission withdrawal and expiry races reserve, consume or release exactly once in the original bucket (concurrency tests)
- [ ] The contract is published (SP3), and no legacy 20-total AI quota remains

### G15.app · Paywall and guarded Pro flows
- **Lane:** S6 Food, AI & Pro · **Size:** M · **Milestone:** M4 · **Label:** paywall + ProGate
- **Needs:** G15.api, MS-2

**Outcome.** Localized trial, purchase, restore and manage, with honest Free, locked, pending and
verifying states.

**PRD.** §§18, 19.2 (P); AC12, AC27, AC44; DEC-06. Screens P-01…P-04.

**Done when.**
- [ ] Every personal AI entry point checks the server-backed entitlement and permission (one test per entry point)
- [ ] Sandbox purchase and restore work on Android and iOS, including pending verification and conflicts (`docs/evidence/G15.app/`), and the DEC-06 ledger row has a pass result
- [ ] After Pro ends, a ready proposal can still be confirmed without a new AI call, and nothing is evicted (AC44 Pro part, test)

### MS-4 · Launch foundations
- **Lane:** Milestones · **Size:** S · **Milestone:** M4 · **Label:** M4 phone/Hindi/AI/Pro
- **Needs:** G13, G14.data, G14.hi, G15.app, AI-2

**Exit.** Phone sign-in, complete Hindi, Indian food depth, real guarded food AI and Pro are on
`main`, proven on an Android release build against staging.

**Exit checks.**
- [ ] Every goal this gate needs is Done, with its handoff in the tracker
- [ ] AC04 (in full), AC12, AC27, AC28, AC40 and AC44 pass on an Android release build against staging (evidence linked)
- [ ] A real +91 OTP sign-in and a sandbox purchase are shown on the same build
- [ ] `node scripts/plan/status.mjs gate MS-4` shows no open ledger row (DEC-05 phone, DEC-06, DEC-08)

---

## M5 · Store launch (MVP-M)

### OW-4 · Store accounts and signing keys
- **Lane:** You · **Size:** S · **Milestone:** M5 · **Label:** store accounts
- **Needs:** OW-2

**Outcome.** The app can be signed and submitted on both stores.

**Do.**
- Play Console and the Apple Developer Program.
- A real Android upload key, kept out of the repo, with two backups.
- Play App Signing, with both SHA fingerprints on the Android OAuth client.
- Sign in with Apple configured.

**Done when.**
- [ ] Both accounts are active and the upload key's two backups are confirmed (`docs/evidence/OW-4/`, no secrets)

### OW-6 · Legal pages and qualified review for the selected scope
- **Lane:** You · **Size:** M · **Milestone:** M5 · **Label:** legal + review
- **Needs:** OW-2, OW-3, PL-4

**Outcome.** Qualified people have reviewed the terms, the privacy notice and the gym notices, DPA
and retention statements, for an India launch with adult-only accounts and no staff access to
personal health data.

**PRD.** §§22.2, 27 (DEC-03, DEC-04, DEC-14).

**Done when.**
- [ ] Qualified reviewer sign-off and effective notice versions are recorded, and the processor list matches the real accounts (`docs/evidence/OW-6/`)
- [ ] The pages are served over HTTPS and linked in the app, with no placeholder text, and the DEC-04 (MS-5) ledger row has a pass result
- [ ] Estimate suitability (DEC-14) and the gym financial and tax receipt policy (DEC-03) are reviewed by the relevant qualified people

### DS-6 · App icon, splash and store art
- **Lane:** S3 Design · **Size:** S · **Milestone:** M5 · **Label:** icon + store art
- **Needs:** OW-1, OW-2

**Outcome.** The icon, adaptive icon, splash, notification colour and store art are Momentum, under
the cleared final name.

**PRD.** §27 (DEC-01).

**Done when.**
- [ ] The assets are generated by script into `apps/mobile/assets/`, and the owner's approval is recorded
- [ ] The final name's trademark clearance is recorded, and the DEC-01 ledger row has a pass result

### OW-13 · Review the exercise instructions and starter programmes
- **Lane:** You · **Size:** S · **Milestone:** M5 · **Label:** review exercise texts
- **Needs:** CT-1

**Outcome.** A person has read every exercise instruction and the three starter programmes once
before the public sees them.

**Done when.**
- [ ] Corrections are filed as one list against CT-1 and G14.hi, or "no changes" is recorded in the tracker with the date

### PL-7 · Android store build
- **Lane:** S1 Platform · **Size:** S · **Milestone:** M5 · **Label:** Android store build
- **Needs:** OW-4, PL-4, DS-6

**Outcome.** An AAB signed through Play App Signing and pointing at production is on the Play
internal track.

**Done when.**
- [ ] The internal-track build installs from Play and signs in against production
- [ ] App Links open the app from a browser (`assetlinks.json` served on the domain)

### PL-8 · iOS build and device proof
- **Lane:** S1 Platform · **Size:** L · **Milestone:** M5 · **Label:** iOS build
- **Needs:** OW-4, PL-4, DS-6

**Outcome.** The iOS app is built, signed and proven on a real iPhone. Apple Health is P2 (AP-10).

**Done when.**
- [ ] A TestFlight internal build passes the offline and recovery journeys (AC14; kill mid-set and reopen) on a real iPhone
- [ ] Sign in with Apple and Universal Links work on the device (capture in `docs/evidence/PL-8/`)

### PL-10 · Product analytics events *(new 25 Oct)*
- **Lane:** S1 Platform · **Size:** M · **Milestone:** M5 · **Label:** analytics events
- **Needs:** PL-4, MS-3

**Outcome.** Launch success can be measured without personal data in analytics: signup to first
workout, weekly logging, AI confirmation, history retrieval and conversion.

**PRD.** §§2 (success), 23.3 (events); PD-02 (event catalog).

**Done when.**
- [ ] Every §23.3 member event is emitted with pseudonymous IDs, a version, a timestamp and the operation ID (one test per event)
- [ ] A test fails if a name, phone, meal text, weight, image URL or health value enters an event payload
- [ ] The event catalog is in `docs/operations/EVENTS.md`, and a staging dashboard shows the launch funnel

### QA-12 · Pre-launch security and privacy review *(new 25 Oct)*
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M5 · **Label:** security review
- **Needs:** MS-3, MS-4

**Outcome.** Before the public can sign up, an independent review finds no open critical or high
security or privacy defect.

**PRD.** §§21.1, 22.1, 23.2.

**Done when.**
- [ ] `docs/evidence/QA-12/security-review-<date>.md` covers RLS and RPC authorization, storage policies, the AI gateway, webhooks, secrets in history, log redaction and dependencies, and every critical or high finding is fixed
- [ ] Every exposed table and RPC has a cross-user denial test (an inventory with test names)
- [ ] The dependency audit shows no unaccepted high or critical advisory, and a secret scan of the full git history is clean

### QA-4 · Release builds on both platforms: acceptance and accessibility
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M5 · **Label:** both platforms
- **Needs:** PL-7, PL-8, MS-3, MS-4

**Outcome.** Every member acceptance scenario passes on Android and iOS release builds against
staging, including with the screen readers.

**PRD.** §§23.1, 25; every M row; NF-01, NF-05, NF-09, NF-10, NF-12; DEC-12.

**Done when.**
- [ ] Every M row in [ACCEPTANCE.md](ACCEPTANCE.md) has `pass · <date> · Android <build> + iOS <build> · <evidence>` from release builds of one `main` commit
- [ ] VoiceOver and TalkBack passes over the logger, the diary and settings are in the a11y audit, with findings fixed or accepted
- [ ] The NF-01, NF-05, NF-09, NF-10, NF-12 and DEC-12 (MS-5) rows have pass results with measurements on the reference devices
- [ ] AC30's member run includes a backup restore that does not resurrect an erased test account

### QA-5 · Store listings and compliance forms
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M5 · **Label:** listings + forms
- **Needs:** OW-6, OW-13, PL-7, PL-8, MS-3, MS-4

**Outcome.** Every store form is filled in from the app that ships and matches its real data flows.

**PRD.** §§22, 26.2; PD-01, PD-06; DEC-16 (fonts and seed content).

**Done when.**
- [ ] `docs/release/STORE-LISTING.md` records each form as submitted, matching OW-6's processor list: Play Data safety, content rating, Apple privacy labels and review notes
- [ ] Screenshots for both stores come from release builds in both languages, and the listing covers Pro and Hindi
- [ ] The reviewer demo account and the public web account-deletion page both work on production
- [ ] The licence inventory covers every dependency, font and seed source, and the DEC-16 (MS-5), PD-01 and PD-06 rows have pass results

### OW-8 · Recruit the beta testers
- **Lane:** You · **Size:** S · **Milestone:** M5 · **Label:** beta testers
- **Needs:** OW-2

**Outcome.** 12–20 adult testers in India are committed for 14 days, with a feedback channel.

**Done when.**
- [ ] The tester list (kept private) and the feedback channel exist, and the testers know the dates (note in the tracker)

### QA-6 · Beta on both stores
- **Lane:** S7 Quality · **Size:** L · **Milestone:** M5 · **Label:** beta 14 days
- **Needs:** QA-4, QA-5, QA-12, OW-8, MS-1, PL-10

**Outcome.** A Play closed test (at least 12 testers for 14 continuous days) and a TestFlight external
beta have run, and their findings are fixed.

**PRD.** §23.1 (crash-free); NF-08.

**Done when.**
- [ ] Play's 14-day requirement is met and TestFlight external passed review (dates in the tracker)
- [ ] Crash-free sessions of 99.5% or more, with the sample count, are recorded in the NF-08 row
- [ ] Every beta finding is fixed, or deferred with a reason in the tracker, and the acceptance suite is re-run after the fixes

### QA-7 · Launch: staged rollout and launch-week watch
- **Lane:** S7 Quality · **Size:** M · **Milestone:** M5 · **Label:** launch
- **Needs:** QA-6

**Outcome.** FitLog is public in India on both stores and watched through its first week.

**PRD.** §§2, 23.1, 23.2; NF-06, NF-07; PD-05.

**Done when.**
- [ ] The India releases on both stores reach 100% through staged and phased rollout
- [ ] The launch-week numbers are in the tracker, with any guardrail breach handled: crash-free rate, error rate, AI cost per user, signup to first set, lost sessions under 0.1%, and set-commit p95
- [ ] The NF-06, NF-07 and PD-05 rows have pass results from production monitoring and the runbook

### MS-5 · Store launch (MVP-M)
- **Lane:** Milestones · **Size:** S · **Milestone:** M5 · **Label:** M5 STORE LAUNCH
- **Needs:** QA-7

**Exit.** FitLog is live in India on Google Play and the App Store with the complete MVP-M: Momentum,
four sign-in methods, complete English and Hindi, food AI behind Pro, production infrastructure, and
every member acceptance scenario passing.

**Exit checks.**
- [ ] Every goal this gate needs is Done, with its handoff in the tracker
- [ ] `node scripts/plan/status.mjs gate MS-5` shows no open ledger row: every M scenario, member budget, MS-5 decision and MS-5 deliverable has a pass (or n/a with a reason)
- [ ] The passes name Android and iOS release builds of the version that shipped
- [ ] Both store listings are public in India at 100% rollout

---

## M6 · Gym pilot (MVP-G)

Gym build goals start when their needs are Done. Activating real gyms (G23) also waits for the go
memo (OW-10), approved templates (OW-11) and the member launch (MS-5), because PROD-02 releases
members before gyms. No goal here may add a trainer role or any staff access to personal fitness
data (PROD-01).

### OW-9 · Field validation and frozen pilot cohorts
- **Lane:** You · **Size:** L · **Milestone:** M6 · **Label:** pilot field work
- **Needs:** —

**Outcome.** Real owner and member interviews, five signed India gyms, reviewed baseline registers
and ledgers, and external legal readiness. The product rules are already selected; this is field
evidence, not another question pack.

**PRD.** §§15, 23.3, 27 (DEC-04, DEC-07).

**Scope.** Interview 20–30 owners and 30–50 adult members. Sign a pilot protocol that freezes the
§23.3 windows, denominators, minimum cohorts and exclusions. Capture at least 20 fully observed
baseline renewal terms and at least 50 eligible adults per gym. Record stated Owner Pro price
responses without claiming any purchase.

**Done when.**
- [ ] Interviews, signed terms, baseline samples and counsel notices are in private research records, indexed (without personal data) in `docs/evidence/OW-9/`
- [ ] The pilot metric protocol is signed before day 1, and no unknown outcome is labelled as measured
- [ ] The DEC-04 (MS-6) and DEC-07 (MS-6) gates pass, or pilot activation stays blocked and that is recorded

### OW-10 · Evidence-based gym go/no-go memo
- **Lane:** You · **Size:** S · **Milestone:** M6 · **Label:** gym go memo
- **Needs:** OW-9, AI-2

**Outcome.** A written Go or No-go for the trainer-free India gym pilot. This is field readiness, not
the later Scale gate, and the member launch is independent of it.

**Done when.**
- [ ] The memo links the field records, signed gym agreements, qualified notices, baseline evidence and the AI quality and cost report
- [ ] It states Go or No-go with reasons; No-go puts G23 on hold through the normal status workflow

### OW-11 · WhatsApp utility templates approved
- **Lane:** You · **Size:** S · **Milestone:** M6 · **Label:** Meta templates
- **Needs:** OW-5, OW-10

**Outcome.** The invite, receipt, renewal and exit templates are approved by Meta as utility messages
in English and Hindi, using counsel-approved copy.

**Done when.**
- [ ] Each template's approval and ID are recorded in `docs/evidence/OW-11/`, and the DEC-05 (MS-6) ledger row has a pass result

### G16.api · Gym tenancy, operational roles, permissions, audit and jobs
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M6 · **Label:** tenancy API
- **Needs:** AR-1, MB-1

**Outcome.** Organisation and gym tenants with owner, manager and front-desk roles, operational
permissions, audits and jobs, all isolated on the server. There is no trainer role and no path to
personal health data.

**PRD.** §§12.1, 16.1, 20.1.1, 21, 22; GC01; AC09, AC21 (role parts).

**Existing work.** `gym_operations.sql` and `gym_command_guards.sql`: owner workspace, roles read on
each request, private schema (002).

**Done when.**
- [ ] AC09: a foreign tenant ID returns not-found, every staff read or write of private health data is denied, and a retired trainer role value is rejected (tests)
- [ ] Role changes and revocation take effect on the next request (AC21 role part, test)
- [ ] Every gym table and RPC has a cross-tenant test and a per-role test (inventory with test names in the handoff)
- [ ] The contract and migrations are published (SP3)

### G16.app · Personal and operational gym workspaces
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** workspace switcher
- **Needs:** G16.api, MS-2

**Outcome.** Staff switch between Personal and the gyms they are permitted, inside the owner, manager
or front-desk shell.

**PRD.** §§12.1, 19.1; AC13 (part). Screens O-01, O-01b.

**Existing work.** `features/gym/WorkspaceScreen.tsx`, `GymProvider.tsx`, `app/gym/[gymId]/(tabs)/`.

**Done when.**
- [ ] Navigation, role-revocation and permission tests cover owner, manager, front desk and member contexts, with restricted actions absent rather than disabled
- [ ] Retired trainer routes cannot be reached by direct link or by a stale workspace preference (test)
- [ ] Both languages, both themes and the §19.3 states are covered

### G17.api · Register, imports, membership and append-only finance
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M6 · **Label:** owner core API
- **Needs:** G16.api

**Outcome.** The register, imports, plans, renewals, freezes, ledger, receipts, export and offboarding
work with the selected date rules and integer money. A reversal corrects a mistake; a refund records
real money returned; principal portions never overlap.

**PRD.** §§12.2–12.3, 13.1–13.5, 20.1.1, 22.3; GC02–GC06; AC06, AC11, AC20, AC21, AC22, AC30 (G),
AC33, AC35, AC36, AC43; NF-02.

**Existing work.** Register search with pagination, plan versions, sold memberships, freezes (atomic
approval, renewal shift, early return), an integer-paise ledger, gap-free receipt numbering, and
refund, reversal and waiver commands (002). `gym_freezes.sql`, `gym_read_models.sql`,
`scripts/backend/verify-gym.mjs`, `verify-freezes.mjs`.

**Done when.**
- [ ] AC06 import: a preview of up to 2,000 rows shows row errors and duplicates, saves only the selected rows, and creates no invite or payment (tests)
- [ ] The AC11, AC20, AC22, AC35, AC36 and AC43 fixtures pass exactly as written, including 50 parallel payments with gap-free receipts and a concurrent refund plus reversal that returns 409
- [ ] AC30 (gym part) and AC33: gym export and offboarding keep members' personal histories, and ledger retention follows policy (tests)
- [ ] Owner list p95 is under 300 ms for a 1,000-member tenant (at least 500 requests, at most 20 concurrent) on staging-like data, recorded in `docs/evidence/G17.api/`; the contract is published (SP3)

### G17.app · Owner, manager and front-desk screens
- **Lane:** S5 Gym app · **Size:** L · **Milestone:** M6 · **Label:** owner screens
- **Needs:** G17.api, G16.app

**Outcome.** The register, imports, plans, dues, payments, receipts, staff, reports and exports work
in Momentum, with role controls, front-desk requests, correction previews and the offline roster.

**PRD.** §§12–13, 19.2 (O), 20.1.1; AC06, AC13, AC21, AC29 (G), AC35–AC37, AC43. Screens O-02…O-11,
O-15…O-17, O-19, O-20.

**Existing work.** `features/gym/`: members, plans, payment, receipt and freeze screens.

**Done when.**
- [ ] AC06 timed setup: someone who did not build it imports and configures 150 members within 90 minutes (timing record in `docs/evidence/G17.app/`)
- [ ] An offline payment gets a provisional acknowledgement only, and authorized reconciliation issues exactly one receipt (AC37 journey)
- [ ] The cached roster stops staff mutations at 24 hours, purges at 72 hours and holds no sensitive fields (tests)
- [ ] Every listed screen works in English and Hindi and both themes, and receipt print, PDF and share are checked on a device

### G18.api · Adult gym linking and purpose-aware utility messages
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M6 · **Label:** join + messages API
- **Needs:** G17.api, G13

**Outcome.** Invites, phone-bound claims and gym-branded utility messages through the messaging
adapter. Development uses a test provider; real sends wait for OW-11 at G23.

**PRD.** §§14.1–14.2, 16.1, 22; GE01–GE03; AC07, AC10 (dispatch adapter), AC23.

**Done when.**
- [ ] AC07 and AC23: a wrong phone, a non-adult, a replayed or expired token, a duplicate identity and an already-linked claim are each rejected or routed idempotently (tests)
- [ ] The messaging purpose guard fails closed (no marketing to gym-supplied numbers), and ambiguous provider results reconcile (tests)
- [ ] A link exposes no personal health data to staff (test), and the contract is published (SP3)

### G18.app · Join gym, gym card and operational permissions
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** join + gym card
- **Needs:** G18.api, G17.app

**Outcome.** An invited adult reaches the right gym card after minimal onboarding and controls their
operational permissions. There are no health-sharing switches.

**PRD.** §§14.1, 16.1, 19.2 (A gym join, N); AC07, AC13. Screens A-13a/b, A-14, N-01, N-04, N-05, N-10.

**Done when.**
- [ ] AC07 passes on an Android release build in English and Hindi (journey)
- [ ] A declined invite leaves a working personal app, and no trainer, body-sharing or diet fields exist (tests)
- [ ] N-05 explains operational ownership and the private personal-data boundary (screen test and capture)

### G19.api · Visits, historical eligibility and offline reconciliation
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M6 · **Label:** visits API
- **Needs:** G18.api

**Outcome.** QR, staff and device attendance keep the original time, the validation and the
membership evidence at the time of the visit. Operational visits, participation eligibility and
challenge enrolment stay separate.

**PRD.** §§15.1, 17, 20.1.1; GE04; AC08, AC24, AC37, AC39.

**Done when.**
- [ ] AC24 (tampered poster, duplicate import, backdated correction, revoked staff) and AC39 (historical eligibility survives a later expiry) pass (tests)
- [ ] No raw user coordinates reach requests, storage or logs (test), and an attendance failure never blocks a personal workout
- [ ] Import idempotency and eligibility state versions are tested, and the contract is published (SP3)

### G19.app · Check-in, visits and offline operational review
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** check-in + visits
- **Needs:** G19.api, G18.app

**Outcome.** Member check-in and staff attendance work offline within the permitted roster
freshness, with truthful pending, unverified and Needs attention states.

**PRD.** §§15.1, 20.1.1; AC08, AC13, AC37; NF-03, NF-04. Screens N-02, N-03, O-12, O-13.

**Done when.**
- [ ] AC08: scan to durable result p95 is under 3 s on the reference device with the fixed 3G profile (`docs/evidence/G19.app/`)
- [ ] Gym cold start to a cached, actionable gym card has p95 under 3.5 s over at least 30 cold starts
- [ ] A stale cache cannot grant staff writes, and the original time and eligibility reasons can be inspected (tests)

### G20.api · Attendance-based retention and renewal dispatch
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M6 · **Label:** retention API
- **Needs:** G19.api

**Outcome.** Operational absence and praise lists with data-quality confidence and evidence-based
precision, and once-only renewal reminders in gym local hours.

**PRD.** §§14.2, 15.2, 23.3; GE05–GE06; AC10, AC11 (coverage), AC36 (reminders), AC41 (precision
fixture).

**Done when.**
- [ ] AC10: one logical dispatch per due key, within 09:00–20:00 gym time; replays send nothing twice; invalidated reminders are suppressed (tests)
- [ ] The Jan 31 → Feb 28 inclusive example and its reminder dates match finance, and the 4 verified / 2 false alarm / 4 unknown example gives 4/6 precision (tests)
- [ ] Owner alerts expose no training, nutrition or body detail (test), and the contract is published (SP3)

### G20.app · Today's calls and follow-up outcomes
- **Lane:** S5 Gym app · **Size:** S · **Milestone:** M6 · **Label:** today's calls
- **Needs:** G20.api, G17.app

**Outcome.** O-14 lists permitted utility follow-ups with their confidence explained. Contact and
absence-verification outcomes are separate, and the member's calling or chat app opens only when
staff tap.

**PRD.** §15.2; AC11, AC13. Screen O-14.

**Done when.**
- [ ] Unknown evidence never becomes a confirmed absence, and contact and verification outcomes are separate fields (tests)
- [ ] The calling or chat app opens only on a deliberate tap, and no automated AI call exists (test)

### G21.api · Owner/manager programme offers and member-owned copies
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M6 · **Label:** programme offers API
- **Needs:** G18.api, MB-2

**Outcome.** Owners and managers version gym templates and offer them to linked adults, and see the
offer state only. Accepting makes one private, member-owned copy. Trainer assignment, private reads
and staff measurement writes are withdrawn; GT01–GT04 are retired.

**PRD.** §§6, 16.2; AC09, AC26.

**Done when.**
- [ ] AC26: a v1 offer stays v1 after a v2 edit, accepting twice yields one owned copy, and the copy survives unlink, offboarding and template archive (tests)
- [ ] Staff cannot read the member's edits or performance on the copy, or record measurements, and trainer role values are invalid (tests)
- [ ] The contract and permissions are published (SP3)

### G21.app · Programme template and offer screens
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** programme offer screens
- **Needs:** G21.api, G18.app

**Outcome.** Owners and managers manage templates and offers under More → Programmes. Members preview,
accept or decline a gym offer.

**PRD.** §16.2; AC13, AC26. Screens O-23 and O-24 (to be drawn; see OW-1's gap list) and N-06.

**Done when.**
- [ ] AC26 passes through the UI in English and Hindi and both themes, covering accept, decline, withdrawn and error states
- [ ] No T-route, trainer roster, coaching dashboard or measurement editor exists (route test)
- [ ] O-23 and O-24 are built from frames the designer delivered and captured beside them in `docs/evidence/G21.app/`

### G22.api · Optional challenges, independent streaks and referrals
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M6 · **Label:** challenges API
- **Needs:** G19.api

**Outcome.** Gym challenges are opt-in. The ordinary private visit streak does not depend on
enrolment. Referrals have deterministic attribution and historical eligibility.

**PRD.** §17; GE07–GE08; AC25, AC39.

**Done when.**
- [ ] AC25 and AC39 pass: streaks without a challenge, opt-out and rejoin, a later expiry, a backdated freeze and the fixed tie rule (tests)
- [ ] Minors, unverified visits and visits frozen at occurrence never rank, and no phone or health field is exposed (tests); the contract is published (SP3)

### G22.app · Challenge, leaderboard and referral screens
- **Lane:** S5 Gym app · **Size:** M · **Milestone:** M6 · **Label:** challenge screens
- **Needs:** G22.api, G19.app

**Outcome.** Members see their gym's challenge and their standing, share gym-named cards and refer
friends.

**PRD.** §17; AC25. Screens O-18, N-07, N-08.

**Done when.**
- [ ] Standings and referral screens work in English and Hindi and both themes, with masked names (tests)
- [ ] Share cards show the gym name, and no name when the member opts out (test)

### G23 · India five-gym pilot release
- **Lane:** S7 Quality · **Size:** L · **Milestone:** M6 · **Label:** pilot release
- **Needs:** G17.app, G18.app, G19.app, G20.app, G21.app, G22.app, OW-6, OW-10, OW-11, MS-5

**Outcome.** The gym MVP (owner, manager, front desk and member gym) runs in five signed India gyms,
with complete English and Hindi, clear operational permissions, and no trainer or private-health
sharing.

**PRD.** §§23, 25, 26.2; every G row; NF-02–NF-04; DEC-03, DEC-04, DEC-05, DEC-13; PD-02, PD-03,
PD-04, PD-07, PD-08.

**Done when.**
- [ ] Every G row gated at MS-6 has `pass · <date> · Android <build> + iOS <build> · <evidence>` from release builds of one `main` commit, including AC13 in Hindi on the low-end reference device
- [ ] The NF-02, NF-03 and NF-04 rows have pass results, and every gym route has a tenant-isolation test (inventory)
- [ ] `docs/operations/PILOT-RUNBOOK.md`, the staff guide and member help exist, and the legal, provider and template proofs are linked in the DEC-03, DEC-04 (MS-6), DEC-05 (MS-6) and DEC-13 (MS-6) rows
- [ ] The pilot protocol and baselines are frozen before day 1, each gym's start date and timezone are recorded, and the PD rows gated at MS-6 have pass results

### MS-6 · Gym pilot (MVP-G)
- **Lane:** Milestones · **Size:** S · **Milestone:** M6 · **Label:** M6 gym pilot
- **Needs:** G23

**Exit.** The gym MVP runs in the five pilot gyms with every gym acceptance scenario passing. With
MS-5, **the expanded MVP is complete**. The pilot gate (OW-12) decides what comes next.

**Exit checks.**
- [ ] Every goal this gate needs is Done, with its handoff in the tracker
- [ ] `node scripts/plan/status.mjs gate MS-6` shows no open ledger row: every G scenario except the pilot-outcome rows (MS-7), the gym budgets, and the MS-6 decisions and deliverables
- [ ] Five gyms are live, with signed agreements and day-1 records
- [ ] No trainer or private-health route can be reached (AC09 and AC26 evidence)

---

## M7 · Gym Phase 2 (only after the pilot says Scale)

If OW-12 decides Fix or Stop, the P2 goals go on hold with the memo as the reason. MS-7 is then
declared with `--override "OW-12 <decision>"`, so Phase 2 does not block depth (M8) or media (M9).

### OW-12 · Measure the pilot and decide Scale, Fix or Stop
- **Lane:** You · **Size:** L · **Milestone:** M7 · **Label:** pilot gate call
- **Needs:** MS-6

**Outcome.** A written ten-week Scale, Fix or Stop decision against PRD §23.3's frozen denominators.

**Gate.** Every gym needs a day-60 adult link rate of at least 40% (minimum cohort 50) and weekly
personal logging of at least 25% (minimum cohort 20), and the aggregates must pass too. All five
gyms need at least 20 fully observed baseline and pilot expiry samples. At least three gyms must
improve renewal by at least 5 percentage points, and at least two owners must accept the stated
Owner Pro price. Incomplete windows or samples mean Fix and extend, never an invented 0%. Security,
cost and operational guardrails must pass.

**Done when.**
- [ ] The AC34, AC41 and DEC-07 (MS-7) rows have pass results: the memo has stable denominators, per-gym counts, window versions, costs and incidents, and discloses no private health detail
- [ ] The signed memo states Scale, Fix or Stop. Scale unblocks P2; Fix or Stop puts the P2 goals on hold with the memo as the reason
- [ ] No protocol change removed observed non-renewers from a denominator

### G24 · Owner Pro operational AI assistance
- **Lane:** S6 Food, AI & Pro · **Size:** L · **Milestone:** M7 · **Label:** Owner Pro
- **Needs:** OW-12, G15.api, G20.api

**Outcome.** Gym-entitled help with permitted operational questions about the register, dues and
attendance: risk explanations and reviewed utility-message drafts. Nothing is sent automatically and
nothing analyses member health. The diet digitizer and plan copilot are withdrawn.

**PRD.** §24 (Owner Pro row); PR04; DEC-17.

**Done when.**
- [ ] Every AI call checks gym entitlement, role and the cost cap, and no request can reach personal health tables (tests)
- [ ] Grounding, prompt-injection, confirmation and utility-purpose negative cases pass, and nothing is sent automatically
- [ ] The P2 acceptance fixtures are signed off by the owner and pass, and the DEC-17 (MS-7) row has a pass result

### G25 · Member AI set logging and weekly review
- **Lane:** S6 Food, AI & Pro · **Size:** L · **Milestone:** M7 · **Label:** member AI
- **Needs:** OW-12, G15.app

**Outcome.** Pro members log sets by text or voice (confirm-only), and get a weekly AI review and
ask-your-data.

**PRD.** §§24, 24.1 (member AI rows); PR04. Screens P-06, P-06b.

**Done when.**
- [ ] Nothing the AI proposes is saved without the member's confirmation, and the manual set-commit p95 is unchanged (tests and measurement)
- [ ] The weekly review and ask-your-data use only the user's own records, state their coverage and link to their sources (tests)
- [ ] The P2 acceptance fixtures are signed off and pass

### G26 · AI calling (closed until approved)
- **Lane:** S6 Food, AI & Pro · **Size:** L · **Milestone:** M7 · **Label:** AI calling
- **Needs:** OW-12, G24

**Outcome.** The Owner Pro usage tier for AI calls, with consent, disclosure, triggers, outcomes,
metering and retention. It ships only with counsel's opinion and a vendor contract.

**PRD.** §24 (AI calling row); DEC-11. Screen O-22.

**Done when.**
- [ ] Counsel's opinion, the vendor contract and the calls consent purpose are recorded, and the DEC-11 row has a pass result
- [ ] Calls happen only with that consent, within quiet hours and caps, with opt-out and human handoff, and never to minors or unconsented numbers (tests)

### G27 · Online collection and autopay
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M7 · **Label:** online payments
- **Needs:** OW-12, G17.api

**Outcome.** Members pay fees online through an approved provider that settles directly to the gym.
FitLog never holds the money.

**PRD.** §24 (online collection row); GC07; DEC-10.

**Done when.**
- [ ] The provider and gym onboarding are approved with settlement direct to the gym, and the DEC-10 row has a pass result
- [ ] One verified payment creates exactly one receipt despite webhook replay, and autopay needs explicit consent with revocation (tests)

### G28 · Web console and multi-branch
- **Lane:** S5 Gym app · **Size:** L · **Milestone:** M7 · **Label:** web console
- **Needs:** OW-12, G17.app

**Outcome.** Owners run the desk from a browser, and multi-branch gyms switch branches explicitly.

**PRD.** §24 (web and multi-branch row).

**Done when.**
- [ ] The web console uses the same policies and passes the same tenant and role isolation tests as the app
- [ ] Branch switching is explicit, and organisation totals need organisation scope (tests)

### G29.api · Operational retention depth without coaching
- **Lane:** S2 Backend · **Size:** L · **Milestone:** M7 · **Label:** retention depth API
- **Needs:** OW-12, G22.api

**Outcome.** Automatic device feeds, break mode, a voluntary expiring passport, cohorts, approved
broadcast credits and a gym-owned WhatsApp sender. PT packs, assessments and the coaching floor view
are out of the committed roadmap.

**PRD.** §§24, 24.2 (gym P2 rows).

**Done when.**
- [ ] Device feeds, break mode, the passport, cohorts, broadcast credits and the gym-owned sender each have numeric or state fixtures, permission and idempotency tests, and a published contract
- [ ] The broadcast source guard, the caps and the revocable passport pass, and no removed coaching endpoint exists

### G29.app · Operational retention depth screens
- **Lane:** S5 Gym app · **Size:** L · **Milestone:** M7 · **Label:** retention depth screens
- **Needs:** G29.api, G22.app

**Outcome.** N-09 break mode, the voluntary passport, and the cohort, broadcast, device-feed and
sender screens. There is no PT pack, assessment day, coaching floor or trainer workspace.

**PRD.** §24; screen N-09.

**Done when.**
- [ ] Every retained feature passes its P2 acceptance in both languages and both themes
- [ ] Removed coaching frames are not reused to show private health data

### G30 · Paper-register reader (the one free AI)
- **Lane:** S6 Food, AI & Pro · **Size:** M · **Milestone:** M7 · **Label:** register reader
- **Needs:** OW-12, AI-2

**Outcome.** An owner photographs the paper register and gets member rows to confirm. It is free
because it is how a gym goes live.

**PRD.** §24 (paper-register row). Screen O-06b.

**Done when.**
- [ ] Accuracy on real registers is measured with the AI-2 harness and meets the agreed gate
- [ ] Nothing is imported without row-by-row confirmation through the normal import, and the images stay private (tests)

### G31 · Gym-bought member seats *(new 25 Oct)*
- **Lane:** S2 Backend · **Size:** M · **Milestone:** M7 · **Label:** gym seats
- **Needs:** OW-12, G15.api

**Outcome.** A gym can fund Pro seats for its members without gaining any access to their health
data.

**PRD.** §24 (gym-bought seats row).

**Done when.**
- [ ] Seat allocation and removal are audited and never grant health access (tests)
- [ ] Member data survives losing a seat, and fallback ownership of a personal subscription is defined before any sale (decision log and test)

### MS-7 · Gym Phase 2
- **Lane:** Milestones · **Size:** S · **Milestone:** M7 · **Label:** M7 Phase 2
- **Needs:** G24, G25, G26, G27, G28, G29.app, G30, G31

**Exit.** Phase 2 has shipped with its acceptance, or OW-12 decided Fix or Stop and Phase 2 is held.

**Exit checks.**
- [ ] OW-12 is Done and its signed memo is linked
- [ ] On Scale, every goal this gate needs is Done and its P2 acceptance fixtures pass. On Fix or Stop, each P2 goal is On hold citing the memo, and this gate is declared with `--override "OW-12 <decision>"`
- [ ] `node scripts/plan/status.mjs gate MS-7` shows each row (AC34, AC41, DEC-07, DEC-10, DEC-11, DEC-17) as pass, or n/a with the memo as the reason

---

## M8 · Depth and polish

### AP-3 · Progression engine: next session's targets, by rule
- **Lane:** S4 Member app · **Size:** L · **Milestone:** M8 · **Label:** progression engine
- **Needs:** MS-5

**Outcome.** When a session opens, the targets are already right and each one says why.

**PRD.** §§24 (progression row), 24.1; DEC-17. The rules come from training methodology, never from
AGPL code (openGym).

**Done when.**
- [ ] Linear, double progression through a rep range, an AMRAP top set, added time and bodyweight reps have shared vectors that pass in TypeScript and SQL; missed reps never advance the load; a stall proposes a deload
- [ ] The starter programmes carry structured rules, the logger shows each target and its reason, the member can override it, and performed sets are never rewritten (tests)
- [ ] The DEC-17 (MS-8) row has a pass result

### AP-4 · Muscle body map
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M8 · **Label:** body map
- **Needs:** MS-5

**Outcome.** Exercise detail, muscle balance and the session summary show the muscles worked on a
body diagram.

**PRD.** §24 (body map row); DEC-16. Screens D-02, G-05, E-08.

**Done when.**
- [ ] D-02, G-05 and E-08 show the map with an accessible text equivalent (tests)
- [ ] We convert the outlines ourselves from a permissively licensed source such as MuscleMap (MIT), never by copying openGym's conversion, and the notice is in the in-app licences

### AP-5 · Small parity wins and imports
- **Lane:** S3 Design · **Size:** M · **Milestone:** M8 · **Label:** parity wins
- **Needs:** MS-5

**Outcome.** The small things lifters notice, and a way in from other apps.

**PRD.** §§21.4, 24 (parity row); DEC-17.

**Done when.**
- [ ] Opt-in keep-awake, one-off date reschedule, and e1RM v2 (no estimate above 12 reps, stored formula versions) each have tests, and old values keep their version
- [ ] FitNotes, Strong and Hevy workout imports and the food CSV import preview units, timezone and duplicates before saving (tests per format)

### AP-6 · Offline reads
- **Lane:** S1 Platform · **Size:** M · **Milestone:** M8 · **Label:** offline reads
- **Needs:** MS-5

**Outcome.** History, analytics and the diary show the last known data offline, with how stale it is.

**PRD.** §24 (broad offline reads row).

**Done when.**
- [ ] History, analytics and the diary open after a cold start in airplane mode with a last-sync time (journey on a release build)
- [ ] Gym and staff data are not cached offline beyond PRD §20.1.1 (test)

### AP-7 · Barcode scanner (H-17)
- **Lane:** S6 Food, AI & Pro · **Size:** M · **Milestone:** M8 · **Label:** barcode scanner
- **Needs:** MS-5

**Outcome.** Packaged food is logged by scanning, through the normal portion review and confirmation.

**PRD.** §24 (barcode row); DEC-16. Screen H-17.

**Done when.**
- [ ] Permission, scan, product, portion review and a normal confirmed item work, and an unknown product offers custom or manual entry (journey)
- [ ] The database licence and attribution are recorded and shown in K-10, and the DEC-16 (MS-8) row has a pass result

### AP-8 · Home-screen widgets
- **Lane:** S3 Design · **Size:** M · **Milestone:** M8 · **Label:** widgets
- **Needs:** MS-5

**Outcome.** Today's workout and protein on the home screen on Android and iOS. Watch apps stay out
of scope.

**PRD.** §24 (widgets row).

**Done when.**
- [ ] Widgets on both platforms refresh after a committed set or meal and never show stale figures as live (device recordings)
- [ ] The lock-screen privacy choice and the deep links work (tests)

### AP-10 · Health Connect and Apple Health *(new 25 Oct)*
- **Lane:** S1 Platform · **Size:** M · **Milestone:** M8 · **Label:** health apps
- **Needs:** MS-5

**Outcome.** Body weight syncs with Health Connect and Apple Health, with the types the member
chooses. It starts with weight.

**PRD.** §24 (health and wearables row); DEC-13. Screen K-09.

**Done when.**
- [ ] Weight reads and writes use explicitly selected types, de-duplicate by external ID, keep source provenance and cannot loop (tests)
- [ ] Revoking stops sync without erasing personal history, and a device recording shows a sync on each platform

### AP-11 · Exercise substitution *(new 25 Oct)*
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M8 · **Label:** substitution
- **Needs:** MS-5

**Outcome.** When equipment is busy, the member picks a suitable substitute and keeps honest history.

**PRD.** §24 (substitution row); TR11.

**Done when.**
- [ ] Suggestions filter by equipment, movement and primary muscles and say why each fits; the member chooses (tests)
- [ ] Old performed sets are preserved, and the new exercise keeps its own history (test)

### AP-12 · Nutrition depth *(new 25 Oct)*
- **Lane:** S6 Food, AI & Pro · **Size:** M · **Milestone:** M8 · **Label:** nutrition depth
- **Needs:** MS-5

**Outcome.** Available micronutrients are shown honestly, and any personalised suggestion is
explained and approved.

**PRD.** §24 (nutrition depth row); FD10.

**Done when.**
- [ ] Available micronutrients carry their source units and nullability, and unknowns never become zero (tests)
- [ ] Any personalised suggestion needs explicit inputs, an explanation, the user's approval and a recorded qualified review

### QA-8 · Close the accessibility findings deferred at launch
- **Lane:** S7 Quality · **Size:** S · **Milestone:** M8 · **Label:** a11y follow-up
- **Needs:** MS-5

**Outcome.** No accessibility finding accepted for launch stays open indefinitely.

**Done when.**
- [ ] Every a11y finding accepted at QA-3, QA-4 or QA-6 is closed or re-dated in the a11y audit, each with a device recording

### QA-10 · Client coverage to 80%
- **Lane:** S7 Quality · **Size:** L · **Milestone:** M8 · **Label:** coverage 80%
- **Needs:** QA-9, MS-3

**Outcome.** The 80% coverage target is met and held by CI.

**Done when.**
- [ ] The global coverage thresholds for `@fitlog/mobile` (`apps/mobile/jest.config.cjs`) and `@fitlog/domain` are at 80%, and CI passes

### MS-8 · Depth and polish
- **Lane:** Milestones · **Size:** S · **Milestone:** M8 · **Label:** M8 depth
- **Needs:** AP-3, AP-4, AP-5, AP-6, AP-7, AP-8, AP-10, AP-11, AP-12, QA-8, QA-10

**Exit.** Progression by rule, the body map, parity wins and imports, offline reads, barcode,
widgets, health apps, substitution, nutrition depth and the coverage target have all shipped.

**Exit checks.**
- [ ] Every goal this gate needs is Done, with its handoff in the tracker
- [ ] Each P2 member feature's acceptance fixtures are signed off and pass on release builds of both platforms
- [ ] `node scripts/plan/status.mjs gate MS-8` shows no open ledger row (DEC-16 barcode and map licences, DEC-17 member P2)

---

## M9 · Exercise media and project complete

### OW-14 · Choose the exercise media source
- **Lane:** You · **Size:** S · **Milestone:** M9 · **Label:** pick media source
- **Needs:** MS-7, MS-8

**Outcome.** One licensed source for exercise images or animations, chosen after everything else is
done (owner, 7 Oct 2026).

**Options.**
- RepDB community edition: free, 609 exercises, flat stills, credit required.
- RepDB Standard: $499 one-time, with looping animations.
- Gym visual: about $0.90 a GIF, around $270 for 297 exercises or $1,190 for the full set.
- The owner's own artwork.

openGym's mirror and the GIFs redistributed in hasaneyldrm's dataset are not licensed to FitLog.

**Done when.**
- [ ] The licence is bought or accepted, and a dated copy of it is stored outside the public repo

### AP-9 · Exercise media in the app
- **Lane:** S4 Member app · **Size:** M · **Milestone:** M9 · **Label:** exercise media
- **Needs:** OW-14

**Outcome.** Exercises show their image or animation in the library, the detail screen and the logger.

**PRD.** §24 (exercise media row); DEC-16.

**Done when.**
- [ ] Every library exercise has licensed media or an explicit "unavailable" state, and accessible instructions remain
- [ ] No media file is in git, credits are in About and the licences list, and the DEC-16 (MS-9) row has a pass result

### QA-13 · Maintenance handoff and known limitations *(new 25 Oct)*
- **Lane:** S7 Quality · **Size:** S · **Milestone:** M9 · **Label:** final handoff
- **Needs:** AP-9

**Outcome.** Whoever maintains FitLog next has everything they need, and nothing open is hidden.

**PRD.** §26.2 (last bullet); PD-08.

**Done when.**
- [ ] `docs/operations/HANDOFF.md` lists known limitations, deferred items, every outstanding external decision, and how to run and maintain each system
- [ ] `node scripts/plan/status.mjs ledger --open` prints only the PD-08 (MS-9) row, and this goal sets it to pass

### MS-9 · Project complete
- **Lane:** Milestones · **Size:** S · **Milestone:** M9 · **Label:** M9 complete
- **Needs:** AP-9, QA-13

**Exit.** Everything in this plan has shipped or has been closed by a recorded decision, and the PRD's
condition for a complete project holds: no required acceptance scenario fails and no release-blocking
decision is blank.

**Exit checks.**
- [ ] MS-0 to MS-8 are Done, and every goal is Done or On hold citing OW-12's memo
- [ ] `node scripts/plan/status.mjs ledger --open` prints nothing: every row is pass, or n/a with a reason
- [ ] The maintenance handoff is merged, and the tracker records the project-complete declaration

---

## Not planned

These have no goal on purpose. Adding one needs a new approved scope and a PRD change first.

- **Trainer role and private gym health access.** GT01–GT04 and T-01–T-05 are retired (PROD-01).
- **Coaching depth.** PT and session packs, assessments, the coaching floor view and the diet/plan
  copilot are removed (PRD §24).
- **Ads.** P3 only, after a separate specification and review (PR06).
- **Legacy-user migration.** Planned only if DEC-15 says existing users will be redirected.
