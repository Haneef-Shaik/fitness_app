# Product Requirements Document v2
## FitLog for Gyms — gym-owner platform and gym-member app (India first)

| Field | Value |
|-------|-------|
| Version | 2.0 |
| Status | Draft for review. Built behind the validation gate **G12** ([17 §G12](17-GYMS-IMPLEMENTATION-PLAN.md)) |
| Sources | [R3 strategy report](research/R3-gym-b2b2c-strategy.md) (§15 = the owner's decisions of 2 Oct 2026) · [PRD v1](01-PRD.md) · charter decisions **D31–D35** |
| Owner | Product |
| Last updated | 2026-10-02 |
| Implementation plan | [17-GYMS-IMPLEMENTATION-PLAN.md](17-GYMS-IMPLEMENTATION-PLAN.md) |

---

## 0. How this relates to PRD v1

**PRD v1 still holds.** [PRD v1](01-PRD.md) specifies the consumer app that is built: training, nutrition, body, analytics, and their 12 acceptance criteria. Every v1 requirement stands unless **§15 Changes to PRD v1** below changes it.

**What v2 adds:**
- the gym platform for owners, staff and trainers;
- the member's gym surfaces inside FitLog;
- phone-number sign-in;
- a Hindi/Hinglish UI;
- the **Pro** tier that gates all AI;
- absence alerts;
- **[P2]** AI workout logging, the AI analytics agent, owner AI assistance and AI calling;
- **[P3]** ads.

**Markers used throughout:**

| Marker | Means |
|--------|-------|
| **[MVP]** | In the v2 pilot release |
| **[P2]** | After the pilot passes its gate (§6.1). Never half-built in the MVP |
| **[P3]** | After scale gates: 50+ gyms in one city or 100k linked members, with gym churn under 2% a month (R3 §10.4). Ads also need 50,000+ monthly active users (R3 §15.3) |
| **[GATED]** | Ships only after a named external gate, such as a legal review |
| **[OPEN]** | Needs the owner's decision (§17) |

---

## 1. Problem statement

The gym and its members work on the same thing — showing up, following a plan, making progress, renewing — with **no shared system**:

- **The gym's tools don't know what members do.**
  - Records live in a register, Excel or a ₹2,500-a-year app.
  - Plans and diet charts are on paper or WhatsApp.
  - Renewals go out as bare invoices.
  - Nobody notices a member drifting until the membership has lapsed.
- **The member's app doesn't know the gym exists.**
  - Gym-issued member apps go uninstalled: GymBook's has 500+ installs against 50,000+ for its owner app.
  - Consumer apps have no trainer, no gym friends and no gym.
  - The app relationship dies with the membership.

The evidence and its sources are in [R3 §3–§4](research/R3-gym-b2b2c-strategy.md).

## 2. Vision

> FitLog for Gyms is the shared system between a gym and its members. For the owner it is free gym software that makes renewals visible. For the member it is FitLog: their gym card, their trainer's plan, and a training and nutrition record that stays theirs.

### 2.1 Product principles

These principles are normative: a requirement that breaks one is wrong.

| # | Principle | Source |
|---|-----------|--------|
| **P1** | **The owner's core is free forever. AI is what anyone pays for.** | D33 |
| **P2** | **Nothing gates entry.** Attendance is captured, never enforced. The gym has no receptionist and no automated door. | D32 |
| **P3** | **The member's data is the member's; the gym's records are the gym's.** Consent sits in between, per purpose, revocable. | R3 §13.2 |
| **P4** | **The gym is the brand the member sees, and we never point a member to another gym.** No other-gym ads, ever. | D35, owner-safety charter (§12) |
| **P5** | **Messages go out in the gym's name.** We never send marketing to numbers a gym supplied. | R3 §13.2 |
| **P6** | **AI output is an estimate the user confirms.** This extends v1's D5 and I12 to every AI feature. | v1 |
| **P7** | **It works on a ₹8–10k Android phone, in Hindi, on a gym-basement network.** | R3 §6.4 |
| **P8** | **Training is never blocked by the gym layer.** No gym, network or AI failure delays a set commit. | v1 I10, I14 |

---

## 3. Users and the ideal customer

### 3.1 The ideal gym (ICP)

An **independent, owner-run gym**:

| Trait | Target |
|---|---|
| Members | ~150–500 |
| Member fees | ₹700–1,500 a month |
| Trainers | At least 2, with some personal training |
| Current records | A register, Excel or a cheap app |
| Entry | **No receptionist and no automated entry** |
| Location | In one dense city cluster the team can visit weekly |

**Not the ICP:** chains, franchises, Cult.fit-operated centres, boutique studios built around class booking.

### 3.2 Personas

#### O1 — Owner, "Vikram" (primary buyer, MVP)

- Runs a 280-member gym.
- Lives on WhatsApp.
- Uses an Android phone, not a PC.
- Speaks Hinglish.
- Collects fees in cash and by UPI QR.
- Chases dues by memory.
- Knows members leave but not who or why.

**Kills adoption:**
- setup that takes more than one visit;
- anything that needs a desk computer;
- renewal price hikes;
- support that doesn't answer;
- any sign the platform will send his members elsewhere.

#### S1 — Manager or front desk (optional)

- Often absent at ICP gyms.
- When present, records payments and marks attendance for the owner.

#### T1 — Trainer, "Rahul" (activation channel, MVP)

- Earns ₹15–25k a month.
- Coaches 20–40 members on the floor.
- Writes plans on paper or sends them on WhatsApp.
- Changes gyms every year or two.

**Kills adoption:**
- extra work with no visible benefit;
- tools that expose him without helping him.

#### M1 — Gym member, "Priya" (the majority, MVP)

- Beginner to intermediate.
- Joined for appearance and health.
- Follows the trainer's routine or improvises.
- Eats home food.

**Kills adoption:**
- forms;
- English-only screens;
- an app that does nothing for her.

#### M2 — Structured Lifter (v1 Persona 1)

- Unchanged from v1.
- The member most likely to buy Pro and to post share cards.
- Often already uses Strong or Hevy. FitLog's importers exist for this.

#### M3 — Lapsed member

- Membership ended. A "temporary break" or home workouts.
- 48% would rejoin [R3 §4.1].
- Keeps the FitLog account.

**v1 Personas 2–3** (Body Recomposition Tracker, Returning Analyst) are unchanged.

---

## 4. Jobs to be done

| JTBD | Persona | Screen(s) | Success measure |
|------|---------|-----------|-----------------|
| Get my whole register into the app in one sitting | O1 | O-06, O-05 | ≥ 150 members live within one 90-minute visit |
| Know today who owes money and collect it | O1, S1 | O-02, O-11, O-09 | Dues visible in ≤ 1 tap; a payment recorded in ≤ 15 s |
| Know who is drifting before they leave, and what to say | O1 | O-14 | A daily list; one tap to a drafted WhatsApp |
| Get members onto the app without begging | O1, T1 | O-20, N-13 | ≥ 40% of active members linked by day 60 (target) |
| Give my client a plan they'll follow, and see if they did | T1 | T-03, T-02 | Assign in ≤ 2 taps; adherence visible next day |
| Know what to do today at the gym | M1 | N-06 → E-03 | One tap from home to the first set |
| See my membership, dues and receipts without asking the desk | M1 | N-01, N-04 | Always on the home screen |
| Feel progress and be seen | M1, M2 | B-01 progress card, N-07, share card | Weekly "one thing improved"; challenge standing |
| Keep training through a break, and come back | M3 | N-09 [P2] | Account active 60 days after a lapse (≥ 30%) |
| Get AI help with food and training, and pay only if it's worth it | M1, M2 | P-01, H-08, P-05 | Trial → paid conversion measured from day 1 |

---

## 5. Scope

### 5.1 In scope — v2 MVP (the pilot release)

**Foundations**
1. **Phone-number sign-in** (OTP), alongside email, Google and Apple (FR-A01).
2. **Hindi and Hinglish UI** for the owner core, the trainer core and the member's gym surfaces (FR-L01).
3. **Indian food depth:** more Indian dishes, household units, Hinglish search (FR-M03).

**Owner and staff**

4. Organisation and gym, staff roles, permissions, audit log (FR-GYM01).
5. Member register: add, edit, import from Excel/CSV, invite status (FR-GYM02).
6. Membership plans, memberships, renewals, freezes (FR-GYM03).
7. Fees ledger: charges, payments (cash/UPI/other), dues, numbered receipts (FR-GYM04).
8. WhatsApp utility messages in the gym's name: invites, receipts, renewal reminders (FR-GYM05).
9. Attendance without a gate (FR-GYM06):
   - self check-in poster;
   - a workout logged at the gym;
   - manual marking;
   - fingerprint-device Excel import.
10. **Free absence alerts** and the "today's calls" list, with a data-quality rule (FR-GYM07).
11. Trainer workspace: members, plan assignment, consented training view, measurements (FR-GYM08).
12. Reports: collections, dues, active members, renewals, peak hours (FR-GYM13).
13. Export and offboarding (FR-GYM14).

**Member**

14. Join a gym through an invite, pre-linked by phone number; the gym card (FR-GYM09).
15. Consent and sharing controlled by the member (FR-GYM10).
16. Monthly gym challenge (attendance) and leaderboard; PR share card with the gym's name (FR-GYM11).
17. Referral link with gym-funded rewards, recorded by hand (FR-GYM12).

**Pro and AI**

18. **Pro entitlement and paywall.** All AI is behind Pro, with a 7-day trial. Existing AI food analysis is gated (FR-PRO01, FR-PRO02).

### 5.2 In scope — Phase 2 `[P2]`

- **Member Pro features:**
  - AI workout logging by text and voice (FR-PRO03);
  - the weekly AI analytics agent (FR-PRO04);
  - next-set progression suggestions;
  - portion memory.
- **Owner Pro:**
  - AI assistance: explanations, drafted messages, Q&A (FR-PRO05);
  - trainer plan copilot;
  - diet-chart digitiser;
  - register-photo reader (free, see FR-GYM02.9).
- **AI calling** with usage tiers, **[GATED]** by counsel review (FR-PRO06).
- Online fee collection through a licensed payment aggregator; UPI Autopay.
- Web console; multi-branch.
- Automatic biometric import; gym-floor screen.
- PT packs, assessment day, break mode, fitness passport.
- WhatsApp marketing broadcasts as at-cost credits.
- Lead pipeline; first-month cohort report.
- Barcode scanning.

### 5.3 In scope — Phase 3 `[P3]`

- Relevant ads and sponsorship (FR-AD01).
- City events and inter-gym challenges.
- Verified-activity partnerships with insurers and employers.
- Coaching marketplace; membership EMI.
- Supplement inventory; aggregator payout reconciliation.

### 5.4 Explicitly out of scope

| Item | Why |
|------|-----|
| App-gated entry, turnstiles, rotating desk codes | **D32**: the ICP has no receptionist or automated entry |
| A global social feed, friends graph, global leaderboards | No evidence they raise activity; non-comparable lifts [R3 §8.3] |
| Gym discovery and lead-gen marketplace | Promise 5; recommended never [OPEN Q21] |
| Video workout logging | Unreliable recognition; research item [R3 §15.2] |
| Holding members' money | Unauthorised payment aggregation [R3 §13.2] |
| Aadhaar collection; storing biometric templates | Aadhaar Act; DPDP [R3 §13.2] |
| FitLog accounts for under-18s in India (unless Q33 decides otherwise) | DPDP children's rules (Q33 confirms raising charter Q9's 16+ to 18+) |
| Chains and franchises | Not the ICP |
| Medical or clinical claims | v1 guardrail, unchanged |

---

## 6. Goals and success metrics

### 6.1 The pilot gate (from R3 §14.8)

Measured over the 10-week pilot in 5 gyms. **"Scale" needs all four** to proceed to Phase 2. This owner-approved gate (the executive summary) supersedes R3 §10.3. Row 1 is pooled across the gyms, and no single gym may be under 25%.

| # | Metric | Scale | Pivot signal (response per R3 §14.9) |
|---|--------|-------|-------|
| 1 | Active members linked to FitLog by day 60 | ≥ 40% pooled; no gym under 25% | < 15% (stops Track B) |
| 2 | Linked members who log a workout or meal weekly | ≥ 25% | < 10% |
| 3 | Renewal rate versus each gym's own baseline | Up in ≥ 3 of 5 gyms | Flat or down everywhere |
| 4 | Owners who say yes to the Pro price (pre-sold) | ≥ 2 of 5 | 0 of 5 |

### 6.2 Product health metrics (instrumented from the MVP)

| Area | Metric | Target |
|------|--------|--------|
| Owner | Gym live within 7 days of signing | ≥ 80% |
| Owner | Owner or staff active ≥ 3 days a week | ≥ 70% of gyms |
| Owner | Alerts actioned within 48 h | Measure; ≥ 50% |
| Data | Alert precision: alerted members who truly hadn't visited | ≥ 85% for "confident" alerts |
| Data | Share of real visits captured (vs the biometric reader, where present) | Measure per source |
| Member | New joiners linked within 7 days | ≥ 70% |
| Member | Members with a trainer-assigned plan | ≥ 30% of linked |
| Pro | Trial starts and trial → paid conversion | Measure; RevenueCat benchmark 37.7% median trial-to-paid (global H&F) |
| Cost | Cost to serve per gym per month (core) | ≤ ₹700 |
| Trust | Member complaints about messages ("how did you get my number?") | 0 tolerated without root-cause |

### 6.3 Guardrails, which must not regress from v1

- Tap-to-set p95 **< 100 ms** (D16).
- Sessions lost to client error **< 0.1%**.
- The AI-down containment test passes (I14).

---

## 7. Key user journeys

Notation: `screen → screen`.

**New screen-ID families:**

| Family | Area |
|---|---|
| **O-** | Owner and staff |
| **T-** | Trainer |
| **N-** | Member gym surfaces |
| **P-** | Pro |
| **A-11…A-14** | New auth screens |

The full list is in §18.

### 7.1 A gym goes live in one visit (rep-assisted)

`A-11 Phone sign-in → A-12 OTP → O-01 Create gym (name, location pin, plans; only for users an operator has enabled during the pilot) → O-06 Import members (Excel/CSV → map columns → preview → commit) or O-05 Add member ×n → O-07 Plans → O-16 Settings (enrolment notice, check-in poster PDF, alert rules) → O-02 Gym today`

**Also covered:**
- **A paper register.**
  - In the MVP, our rep types it in O-05, or into a spreadsheet that O-06 imports.
  - **[P2]** O-06 reads a photo of the register (FR-GYM02.9).
- **Duplicates.** Rows with the same phone number are merged in preview; the owner chooses.
- **Minors.** Members marked under 18 are imported as gym records only and are never invited (FR-GYM02.7).

### 7.2 A member joins through the gym

`(WhatsApp invite in the gym's name | QR at joining | trainer) → install → A-11 Phone → A-12 OTP → A-13 "Iron Temple Gym invited you" → A-14 Age 18+ and FitLog consent → N-05 Sharing defaults → B-01 Home with N-01 gym card`

**Also covered:**
- **Different phone number.** The member's phone differs from the gym's record: they enter the 6-character invite code from the message (FR-GYM09.3).
- **Existing FitLog user.** The link appears in Settings, and their data is untouched.
- **Already uses Strong or Hevy.** Offer Settings → Import (`settings/import`) on the first visit to N-01.
- **Declines.** The gym record stays "unlinked". The member gets WhatsApp receipts only.

### 7.3 Self check-in (no gate)

`N-02 Scan poster → (location permission once) → N-03 "Checked in · 3rd visit this week"`

**Also covered:**
- **Location denied, or more than 150 m away.** Recorded as `unverified`. It counts for the member's own history but not for challenge standings.
- **No network.** Queued in the outbox; the timestamp is kept.
- **A second scan within 3 hours.** "Already checked in".
- **A workout logged at the gym without scanning.** Counts as a visit (`workout_at_gym`).

### 7.4 The plan loop

`T-01 Trainer today → T-04 Plan templates → T-03 Assign to Priya → (member) N-06 Today's plan → E-01…E-08 (existing logger) → (trainer) T-02 sees the session the next time they open it`

**Also covered:**
- **Template edited after assigning.** The member's copy is unchanged (v1 I1) until the trainer re-assigns.
- **Member revokes "share workouts with trainer".** T-02 shows "not shared". The plan still works for the member.
- **Trainer leaves the gym.** Their assignments stay with the members; the owner reassigns the trainer.

### 7.5 An absence alert becomes a call

`(alerts computed 07:00, push 08:00 gym time) → O-14 Today's calls → "Ravi · no visit in 8 days · confident" → one-tap WhatsApp (owner's own app, drafted message) → mark outcome`

**Also covered:**
- **Low-confidence alert.** Labelled "may be visiting without scanning".
- **Dismissed.** Not raised again for 7 days.
- **[P2] AI call.** For Pro Calls owners (FR-PRO06).

### 7.6 Renewal and payment

`D-7/D-3/D0 WhatsApp utility reminder (amount, date; progress line only with consent) → member pays cash/UPI at the gym → O-09 Record payment → receipt to WhatsApp and N-04`

**Also covered:**
- **Part payment.** Dues stay open.
- **Freeze.** The end date is extended.
- **Reminder already sent.** Never duplicated (idempotent).
- **Member opted out of WhatsApp.** In-app only.

### 7.7 A member lapses

`membership end → status lapsed the next day → end + 3 days: D+3 reminder and exit-reason quick reply → O-14 "lapsed window" items → owner's win-back message`

**[P2]:** N-09 Break mode with home routines.

**Throughout:** no other gym is shown to the member (P4).

### 7.8 Pro, trial and paywall (member)

`AI entry point (photo food, describe food, [P2] voice log, [P2] weekly review) → P-01 Paywall → start 7-day trial → feature works → day 7 → P-01 subscribe or lose AI (data kept)`

**Also covered:**
- **Restore purchases.**
- **Already used the trial.** No second trial.
- **Pilot members.** Pro is granted (PRO01.6) only during the concierge phase, and ends when their gym moves to the MVP. From then they meet the paywall and trial, so trial → paid can be measured.
- **Offline.** Cached entitlement honoured for 72 h.

### 7.9 Owner Pro and AI calling `[P2]`

`O-21 Owner Pro (learn) → purchase on the web (no in-app purchase prompt) → O-22 AI calling settings (tier, windows, rules) → alerts can trigger approved calls → outcomes logged`

### 7.10 Lifecycle edges that need product decisions

| Situation | Behaviour |
|-----------|-----------|
| A member belongs to two gyms | Allowed. Two gym cards. Consent is per gym. Each check-in is matched by the scanned poster |
| One phone, two family members | One FitLog account per phone. The second person signs in by email or Google. Gym records may share a phone; the invite code disambiguates |
| A member changes phone number | Updated in FitLog (OTP on the new number). The gym record is updated by staff, or by the member's request |
| A member deletes their FitLog account | Their FitLog data is deleted (v1). The **gym record stays** (the gym's data). The link is removed, and so is trainer access |
| A gym closes or offboards | Export is offered. Gym data is deleted after 30 days. **Members' FitLog accounts are untouched** |
| A staff member is removed | Access ends on the next request. Their past actions stay in the audit log |
| The owner wants a member's workout data without consent | Not possible. The gym sees attendance, membership and payments. Training data needs the member's consent |
| A member turns out to be under 18 | The link is removed and the FitLog account is suspended pending age confirmation. The gym record continues with parental consent |
| A gym sets a fee in a non-INR currency | Not supported in v2. INR only |


---

## 8. Functional requirements

Each family lists testable sub-requirements, with the owning screen and phase. **Roles:** `owner`, `manager`, `front_desk`, `trainer` (staff); `member` (a FitLog user linked to a gym record).

### FR-A01 · Phone-number sign-in

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| A01.1 | Sign in or sign up with an Indian mobile number and a 6-digit OTP. Email, Google and Apple sign-in remain | A-11, A-12 | MVP |
| A01.2 | OTP is sent by SMS from a DLT-registered sender and template. Resend is allowed after 30 s, at most 5 sends an hour per number | A-12 | MVP |
| A01.3 | A phone number belongs to at most one FitLog account | A-11 | MVP |
| A01.4 | An email-based account can add and verify a phone number, which links any pending gym invites | K-02 | MVP |
| A01.5 | OTP over WhatsApp as an alternative channel | A-12 | P2 |

### FR-L01 · Hindi and Hinglish

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| L01.1 | The UI language can be English or Hindi. The default follows the device, with the gym's default suggested at join | K-03, A-13 | MVP |
| L01.2 | Every owner-core, trainer-core and member gym screen, notification and WhatsApp template exists in both languages | O-*, T-*, N-* | MVP |
| L01.3 | Exercise names carry Hindi and Hinglish aliases for search ("squat", "बैठक") | D-01 | MVP |
| L01.4 | Food search matches Hinglish dish names ("dal chawal", "paneer bhurji") | H-04 | MVP |
| L01.5 | Numbers, currency (₹, Indian grouping 1,00,000) and dates are formatted for `en-IN` and `hi-IN` | all | MVP |
| L01.6 | Regional languages (Tamil, Telugu, Kannada, Marathi, Bengali…) | all | P2 |

### FR-M01 · Member onboarding for gym-invited users

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| M01.1 | An invited user skips program creation and lands on the dashboard with the gym card. Profile basics may be completed later | A-13 → B-01 | MVP |
| M01.2 | **Age gate: 18+ in India** **[OPEN Q33]**. Today's server rule is 16+ (charter Q9, `app/domain/age.py`). A-14 collects a date of birth (picker); joining a gym refuses no birth date or under-age. Under India's DPDP Act an under-18 is a child, and behavioural monitoring of children is prohibited. Under the age cannot proceed; the gym record is unaffected | A-14 | MVP |
| M01.3 | FitLog's own notice and consent (AI processing, photos, measurements) are separate from the gym's enrolment notice | A-14 | MVP |

### FR-M02 · Home for gym members

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| M02.1 | B-01 shows the **gym card** for each linked gym: status, days left, dues, check-in button, current challenge | B-01, N-01 | MVP |
| M02.2 | B-01 shows **"Today's plan from <trainer>"** when a plan is assigned for today | B-01, N-06 | MVP |
| M02.3 | Weekly "one thing that improved" card (PR, visits, volume, protein days), shareable | B-01 | MVP |

### FR-M03 · Indian food depth

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| M03.1 | The Indian dish catalog grows from 138 to ≥ 500 common dishes. Every value comes from public-domain USDA records or standard recipes computed from them ([data-sources.md](data-sources.md); IFCT cannot be shipped) | H-04 | MVP |
| M03.2 | Household units per dish: katori, roti/piece, glass, ladle, plate, with grams per unit | H-05 | MVP |
| M03.3 | Each dish shows its source and its basis (recipe or USDA record), as today | H-05 | MVP |

### FR-GYM01 · Organisation, gyms, staff and roles

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM01.1 | An **organisation** (the business) owns one or more **gyms** (locations). The MVP creates one gym per organisation | O-01 | MVP |
| GYM01.2 | A gym has: name, address, map pin, check-in radius (default 150 m, range 50–500), timezone (default Asia/Kolkata), default language, logo, optional GSTIN | O-16 | MVP |
| GYM01.3 | Staff are invited by phone number with a role: `owner`, `manager`, `front_desk`, `trainer`. One person may hold roles in several gyms | O-15 | MVP |
| GYM01.4 | Permissions follow the matrix in **§8.1**. The server enforces them on every request | — | MVP |
| GYM01.5 | A staff member with any role sees a **workspace switcher**: *Personal* ↔ *<Gym name>* | O-01 | MVP |
| GYM01.6 | Every staff read of a member's training, body or nutrition data, and every money or membership change, is written to an **audit log** the owner can view | O-04 | MVP |
| GYM01.7 | Multiple gyms per organisation, branch switcher, org-level reports | O-* | P2 |

#### 8.1 Permission matrix

| Capability | owner | manager | front_desk | trainer |
|---|:-:|:-:|:-:|:-:|
| Gym settings, staff, plans, export, offboarding | ✓ | — | — | — |
| Members: add, edit, import | ✓ | ✓ | ✓ | — |
| Memberships, freezes, cancel | ✓ | ✓ | ✓ | — |
| Record payments, view dues and receipts | ✓ | ✓ | ✓ | — |
| Reports (money) | ✓ | ✓ | — | — |
| Attendance: view, mark, import | ✓ | ✓ | ✓ | view own members |
| Alerts and today's calls | ✓ | ✓ | — | own members |
| Assign plans, record measurements | ✓ | ✓ | — | own members |
| View member training data (with consent) | ✓ | ✓ | — | own members |
| Challenges | ✓ | ✓ | — | — |
| Audit log | ✓ | — | — | — |
| Owner Pro, AI calling `[P2]` | ✓ | ✓ (use) | — | — |

### FR-GYM02 · Member register and import

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM02.1 | A gym member record has: name, phone (E.164, optional for minors), gender (optional), date of birth or "under 18" flag, joined date, assigned trainer, notes, member code (gym-unique, short). Phone is **not unique** within a gym: a parent's phone may appear on a minor's record (§7.10) | O-05 | MVP |
| GYM02.2 | List with search (name, phone, code) and filters: active, dues, expiring ≤ 10 days, lapsed, unlinked, trainer | O-03 | MVP |
| GYM02.3 | Import from **CSV/XLSX** up to 2,000 rows: map columns → preview (errors, duplicates by phone) → commit. Re-running the same file creates no duplicates | O-06 | MVP |
| GYM02.4 | Import can include current plan, end date and amount due, so dues are correct on day one | O-06 | MVP |
| GYM02.5 | Member detail shows membership history, payments, attendance (30/90 days), link status, consented training summary | O-04 | MVP |
| GYM02.6 | Archive a member (left). Never hard-delete except through offboarding or a member's verified erasure request | O-04 | MVP |
| GYM02.7 | Members flagged under 18 are never invited, never linked to FitLog, and never shown in challenges. Parental consent is recorded on the gym record | O-05 | MVP |
| GYM02.8 | Coverage view: invited, linked and unlinked counts, with a resend invite (max 1 resend per member, staff-triggered) | O-20 | MVP |
| GYM02.9 | **Register reader:** photo(s) of a paper register → AI-extracted rows → the owner confirms each row. **Free**, because it is how a gym goes live (D33 exception) | O-06 | P2 |

### FR-GYM03 · Membership plans and memberships

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM03.1 | Plans: name, duration (days or months), price, admission fee (optional), PT sessions included (optional), active flag | O-07 | MVP |
| GYM03.2 | A membership: member, plan, start, end (computed, editable), price agreed (snapshot), discount note | O-08 | MVP |
| GYM03.3 | Renew: a new membership starting the day after the current end, or today if lapsed | O-08 | MVP |
| GYM03.4 | Freeze: date range → end date extends by the frozen days. At most the gym's freeze limit per membership (setting) | O-04, N-10 | MVP |
| GYM03.5 | Status is derived daily in the gym's timezone: `active`, `expiring` (≤ 10 days), `lapsed` (from the day after the end date), `frozen`, `cancelled` | — | MVP |
| GYM03.6 | A member can **request** a freeze in N-10. Staff approve | N-10 | MVP |
| GYM03.7 | PT packs with session counters | O-08, T-01 | P2 |

### FR-GYM04 · Fees, dues, payments and receipts

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM04.1 | Money is stored in **integer paise**, INR only | — | MVP |
| GYM04.2 | Charges are created by memberships (plan price, admission fee) or manually (other) | O-08, O-09 | MVP |
| GYM04.3 | Payments: amount, method (`cash`, `upi`, `card`, `bank`, `other`), date, received by, reference (optional). Part payments are allowed | O-09 | MVP |
| GYM04.4 | Dues = charges − payments, per member and gym-wide, with ageing (0–7, 8–30, 31+ days) | O-11 | MVP |
| GYM04.5 | Each payment produces a **receipt** numbered per gym (`IRT-2026-000123`), viewable by the member (N-04) and sendable on WhatsApp | O-10, N-04 | MVP |
| GYM04.6 | Correcting a payment is a reversal plus a new entry. Payments are never edited in place (audit) | O-10 | MVP |
| GYM04.7 | If the gym has a GSTIN, receipts show the tax lines the owner configures. **We do not compute tax liability** | O-16 | MVP |
| GYM04.8 | Online collection (UPI intent links, UPI Autopay, cards) through a licensed payment aggregator, settling **directly to the gym**. We never hold funds | N-04, O-09 | P2 |

### FR-GYM05 · Messaging in the gym's name

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM05.1 | WhatsApp **utility** templates in English and Hindi, sent in the gym's name from the platform's verified number: invite ("your membership card"), receipt, renewal reminder, freeze confirmation | — | MVP |
| GYM05.2 | Renewal reminders go at D-7, D-3 and D0 of the end date, and D+3 if lapsed, **exactly once each**, between 09:00 and 20:00 gym time | — | MVP |
| GYM05.3 | The reminder adds one progress line ("38 visits · squat 40 → 60 kg") **only if** the member consented to share that data with the gym | — | MVP |
| GYM05.4 | **No marketing-category template is ever sent to a gym-supplied number.** Enforced in code, with an audit report | — | MVP |
| GYM05.5 | Members can stop WhatsApp messages from a gym (reply STOP or a toggle in N-05). Receipts stay visible in-app | N-05 | MVP |
| GYM05.6 | Owner "message on WhatsApp" actions open **the owner's own WhatsApp** with a drafted text (click-to-chat). Free; nothing is sent by us | O-14, O-04 | MVP |
| GYM05.7 | A message log per member: channel, template, status, time | O-04 | MVP |
| GYM05.8 | Marketing broadcasts to opted-in members, paid as **at-cost message credits** | O-* | P2 |
| GYM05.9 | Optional sending from the gym's own WhatsApp Business number | O-16 | P2 |

### FR-GYM06 · Attendance without a gate (D32)

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM06.1 | Each gym has a printable **check-in poster**: a QR code with a signed payload naming the gym. It can be regenerated, which invalidates the old one | O-16 | MVP |
| GYM06.2 | **Self check-in:** the member scans the poster in FitLog. If location permission is given and the phone is within the gym's radius, the visit is `verified`; otherwise `unverified`. **Raw coordinates are not stored** (only the distance band) | N-02, N-03 | MVP |
| GYM06.3 | At most one check-in per member per gym per 3 hours. Offline scans are queued with their original time | N-02 | MVP |
| GYM06.4 | A workout session started while the phone is within the gym's radius records a `workout_at_gym` visit, if the member has no check-in in that window | — | MVP |
| GYM06.5 | Staff can mark a member present (`manual`), today or back-dated ≤ 7 days | O-12 | MVP |
| GYM06.6 | **Fingerprint and face-reader import:** upload the device software's Excel/CSV export → map device user IDs to members (remembered) → import `device` visits. Re-uploading the same file creates no duplicates | O-13 | MVP |
| GYM06.7 | **Nothing about attendance ever blocks a member, a workout or entry** (P2, P8) | — | MVP |
| GYM06.8 | The attendance view shows today's visits, history per member, and peak hours | O-12 | MVP |
| GYM06.9 | Automatic device import (push or scheduled) | O-13 | P2 |
| GYM06.10 | Opt-in automatic check-in on arrival (background location), only if the earlier methods prove insufficient | N-05 | P2 |

### FR-GYM07 · Absence alerts and today's calls (free)

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM07.1 | Rules, configurable per gym, evaluated daily at 07:00 gym time:<br>**R1** no visit in N days (default 7; options 5/7/10);<br>**R2** new member (joined ≤ 30 days) with < 4 visits by day 14 or day 30;<br>**R3** membership ends ≤ 10 days and visits in the last 14 days are under half the member's usual rate;<br>**R4** lapsed ≤ 30 days ago | O-16 | MVP |
| GYM07.2 | **Confidence:** an alert is `confident` when the member's attendance is reliably captured — mapped to a device, **or** ≥ 4 recorded visits in the previous 28 days — otherwise `low` and labelled "may be visiting without scanning" | O-14 | MVP |
| GYM07.3 | **Today's calls:** a ranked list (R2 > R3 > R1 > R4, then by value at risk), each with reason, last visit, dues and a drafted message (EN/HI) opening the owner's WhatsApp | O-14 | MVP |
| GYM07.4 | Each item can be marked `called`, `messaged`, `no answer`, `not needed` or `dismissed`. Dismissed items return no earlier than 7 days | O-14 | MVP |
| GYM07.5 | A daily push to the owner (and to managers who opt in) summarising the count. Trainers see alerts only for their own members | — | MVP |
| GYM07.6 | **Praise moments** in the same list: PRs, 30-day streaks, measurement milestones | O-14 | MVP |
| GYM07.7 | Precision is measured (§6.2). An alert later contradicted by a back-filled visit is recorded as a false positive | — | MVP |

### FR-GYM08 · Trainer workspace and the plan loop

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM08.1 | **Trainer today:** my members (assigned by owner or manager), who trained yesterday or today, who is absent ≥ 5 days | T-01 | MVP |
| GYM08.2 | **Gym plan templates:** trainers and owners author programs with the existing builder (C-03…C-07), owned by the gym | T-04 | MVP |
| GYM08.3 | **Assign:** a template → member (with start date) creates a **member-owned copy** with provenance (`assigned_by`, template version). Later template edits don't change the copy (v1 I1). Re-assigning creates a new copy | T-03 | MVP |
| GYM08.4 | **Training view:** the member's sessions, PRs, adherence and measurements, **only while the member's consent "share workouts/measurements with my trainer" is on** | T-02 | MVP |
| GYM08.5 | Trainers can record weight and measurements **for** a member (source `trainer`, recorded_by). They appear in the member's body tracking | T-05 | MVP |
| GYM08.6 | Trainer plan copilot (AI draft from goal, history and equipment; the trainer approves). **Owner Pro** | T-03 | P2 |
| GYM08.7 | PT session counting against packs; trainer performance view for owners | T-01, O-17 | P2 |

### FR-GYM09 · Member linking and the gym card

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM09.1 | Invites carry a deep link and a 6-character code, sent once by WhatsApp (GYM05.1) or shown as a QR at the counter | A-13 | MVP |
| GYM09.2 | A FitLog sign-in with a verified phone matching a gym record **auto-links** after the member confirms "Yes, I'm a member of <Gym>" | A-13 | MVP |
| GYM09.3 | Otherwise the member enters the invite code. Codes expire after 30 days and are single-use | A-13 | MVP |
| GYM09.4 | **Gym card (N-01):** gym name and logo, member code, plan, status, end date, days left, dues, receipts (N-04), check-in button (N-02), freeze request (N-10), today's plan | N-01 | MVP |
| GYM09.5 | A member can **unlink** from a gym. Trainer access ends immediately; the gym record is unaffected | N-05 | MVP |

### FR-GYM10 · Consent and sharing (member-controlled)

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM10.1 | Per-gym purposes and defaults:<br>**attendance and membership** — always (the gym's own record);<br>**share workouts with my trainer** — on;<br>**share measurements with my trainer** — on;<br>**share nutrition** — off;<br>**progress line in renewal messages** — on;<br>**WhatsApp messages from the gym** — on;<br>**photos** — never (not a purpose) | N-05 | MVP |
| GYM10.2 | Every change is a versioned consent record (purpose, value, time, how collected). Revocation takes effect on the next request | N-05 | MVP |
| GYM10.3 | **[P2] AI calls from the gym** is a separate purpose, off by default, collected by the gym at enrolment or in N-05 | N-05 | P2 |
| GYM10.4 | The gym's **enrolment notice** (template provided by us, edited by the owner) names "the FitLog member app, operated for us by FitLog" as part of the gym's service. Its version is recorded on each member | O-16 | MVP |

### FR-GYM11 · Challenges, leaderboard and share cards

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM11.1 | Monthly **attendance challenge** created from a template (target visits; prize text). Only **verified, manual or device** visits count | O-18, N-07 | MVP |
| GYM11.2 | Leaderboard by **league** (beginner / regular / veteran by tenure), showing first name and last initial, and opt-out | N-07 | MVP |
| GYM11.3 | PR share card and weekly-improvement card carry the gym's name (opt-out per member) | E-11, B-01 | MVP |
| GYM11.4 | Volume and lift-to-bodyweight challenges; buddy streaks; kudos inside the gym | N-07 | P2 |
| GYM11.7 | **Weekly visit streak:** a week counts when it has ≥ N recorded visits (gym setting, default 3); one freeze a month; only `verified`, `staff` or `device` visits count. The member's reason to scan (R3 §15.1) | N-01, N-07 | MVP |
| GYM11.5 | Gym-floor screen (web page for the gym TV) | — | P2 |
| GYM11.6 | Inter-gym city challenges | — | P3 |

### FR-GYM12 · Referrals

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM12.1 | A member shares a personal referral link or card. The friend's enquiry is attributed to the member and shown to the owner | N-08, O-04 | MVP |
| GYM12.2 | The reward (e.g. extra days) is recorded by staff as a membership extension | O-08 | MVP |
| GYM12.3 | Automatic reward on the friend's first payment | — | P2 |

### FR-GYM13 · Reports

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM13.1 | Collections by month and method; dues ageing; active, expiring and lapsed counts; renewals due and done; visits by day and hour; coverage | O-17 | MVP |
| GYM13.2 | First-month cohort: of members who joined in month M, how many are still active and visiting | O-17 | P2 |

### FR-GYM14 · Export and offboarding

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| GYM14.1 | The owner exports all gym data as CSV files (members, memberships, payments, receipts, attendance, staff, consent versions) at any time, free, delivered within 24 h | O-19 | MVP |
| GYM14.2 | Offboarding deletes the gym's data 30 days after the owner confirms. Members' FitLog accounts and their own data are untouched; links are removed | O-19 | MVP |
| GYM14.3 | A member's verified erasure request for their gym record is routed to the gym (the gym is the fiduciary) and tracked to closure | O-04 | MVP |

### FR-PRO01 · Pro entitlement and paywall (D33)

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| PRO01.1 | Products: **Member Pro** (monthly and yearly, in-app purchase on iOS and Android); **Owner Pro Assist** and **Owner Pro Calls** tiers (web purchase) `[P2]` | P-01, O-21 | MVP / P2 |
| PRO01.2 | **Every AI capability checks the entitlement on the server** before any model call. Without it the API returns `PRO_REQUIRED` and no model is called | — | MVP |
| PRO01.3 | **7-day free trial** through the stores' introductory offer, once per account. P-01 is shown once at the end of onboarding (after A-10 or A-14), dismissible, and again at any AI entry point. That is how R3's "trial at signup" is met. The store may ask for a payment method; the paywall says so. Pilot access is a server-side grant (PRO01.6), not a trial | P-01, P-02 | MVP |
| PRO01.4 | The paywall states price, renewal period and how to cancel, before purchase. No pre-ticked boxes, no countdown pressure, no hidden auto-renewal | P-01 | MVP |
| PRO01.5 | Restore purchases. Manage and cancel links to the store. Pro status shown in Settings | P-03 | MVP |
| PRO01.6 | Admin grants: `pilot` and `gym_seat` entitlements with end dates | — | MVP |
| PRO01.7 | When Pro ends, **no data is lost**. AI entry points show the locked state (P-04); past AI analyses stay readable | P-04 | MVP |
| PRO01.8 | Cached entitlement honoured offline for 72 h | — | MVP |
| PRO01.9 | Fair-use caps even for Pro (e.g. 20 AI food analyses a day), to bound cost | — | MVP |
| PRO01.10 | Gym-bought Pro seats for its members, subject to store-policy review (Q29) | O-* | P2 |
| PRO01.11 | Pro removes ads `[P3]` | — | P3 |

### FR-PRO02 · AI food analysis (existing, now Pro)

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| PRO02.1 | v1's photo (H-09) and text (H-06) analysis behave exactly as v1 specifies (review, confidence, confirm, raw output kept), **for Pro and trial users** | H-06…H-09 | MVP |
| PRO02.2 | Without Pro, H-03 shows these entry points with a Pro badge leading to P-01. Manual search, quick add, recipes and copy stay free | H-03 | MVP |

### FR-PRO03 · AI workout logging by text and voice `[P2]`

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| PRO03.1 | In a session, the member types or speaks a set ("bench 60 kilo 8 reps, 3 sets"; Hindi/Hinglish numerals included). AI proposes structured sets for the current exercise or a matched one | P-05 | P2 |
| PRO03.2 | Proposals are **never committed automatically**. The member confirms them, and they enter through the normal set-commit path (I10 unaffected) | P-05 | P2 |
| PRO03.3 | A photo of a handwritten workout notebook page → proposed past session for review | P-05 | P2 |
| PRO03.4 | Video logging: research only | — | — |

### FR-PRO04 · AI analytics agent `[P2]`

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| PRO04.1 | **Weekly review** card: training and nutrition trends in plain language, each statement citing the underlying numbers | P-06 | P2 |
| PRO04.2 | Ask about **your own data** ("am I eating enough protein on training days?"). Answers only from the member's records; no medical, diagnostic or drug advice (v1 guardrail) | P-06 | P2 |

### FR-PRO05 · Owner AI assistance (Owner Pro) `[P2]`

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| PRO05.1 | **Why this member:** a short explanation for each alert, from attendance, membership and consented training data | O-14 | P2 |
| PRO05.2 | **Drafted messages** tuned to the reason, in English, Hindi or Hinglish | O-14 | P2 |
| PRO05.3 | **Ask the gym:** read-only questions over gym data ("who hasn't paid this month?"). It never takes an action without explicit confirmation | O-02 | P2 |
| PRO05.4 | Diet-chart digitiser: a photo of a trainer's chart → structured meal plan and targets for a member (with consent) | T-03 | P2 |

### FR-PRO06 · AI calling (Owner Pro Calls) `[P2]` `[GATED]`

**Gate:** Indian counsel has signed off the call script, the consent purpose, the numbering (service or promotional; 140-series and DLT where needed), DND scrubbing and recording retention [R3 §15.4].

| ID | Requirement | Screen | Phase |
|----|-------------|--------|-------|
| PRO06.1 | Calls only to members with the **AI calls** consent (GYM10.3), 18+, not opted out, within the gym's calling window (default 10:00–20:00) | O-22 | P2 |
| PRO06.2 | Each call **opens by saying it is an automated call on behalf of <Gym>** (TRAI pre-declaration), offers a spoken opt-out, and never sells anything other than the member's own gym | — | P2 |
| PRO06.3 | Triggered by an alert, either approved by the owner or by an owner-set rule. At most one AI call per member per 14 days | O-14, O-22 | P2 |
| PRO06.4 | The outcome (reached, reason given, wants trainer slot or freeze, opted out) and the transcript summary are logged on the member | O-04 | P2 |
| PRO06.5 | **Metered:** minutes count against the tier. Overage is billed per minute. The owner sets a hard monthly cap | O-22 | P2 |
| PRO06.6 | Recordings and transcripts are kept 90 days, then deleted (configurable down) | — | P2 |

### FR-AD01 · Ads and sponsorship `[P3]` (D35)

| ID | Requirement | Phase |
|----|-------------|-------|
| AD01.1 | Ads only for free users. Never in the logger (E-*), never during a session, never other gyms | P3 |
| AD01.2 | Contextual placement only, e.g. a nutrition brand in H-01. **No targeting on body, food or health data**; no personalised ads without explicit consent | P3 |
| AD01.3 | Verified brands only. Health claims follow ASCI rules | P3 |
| AD01.4 | A gym can opt its members out of supplement ads, or join a revenue share | P3 |
| AD01.5 | Direct sponsorship (challenge sponsor, diary placement) before ad networks (AdMob) | P3 |


---

## 9. Free and Pro — the entitlement matrix

| Capability | Free | Member Pro | Owner Pro Assist `[P2]` | Owner Pro Calls `[P2]` |
|---|:-:|:-:|:-:|:-:|
| Logger, programs, history, analytics charts | ✓ | ✓ | | |
| Manual food logging, quick add, recipes, copy meals | ✓ | ✓ | | |
| Body tracking, progress photos, goals, imports, export | ✓ | ✓ | | |
| Gym card, self check-in, receipts, challenges, consent | ✓ | ✓ | | |
| **AI food analysis (photo, text)** | trial only | ✓ | | |
| **AI workout logging (text, voice)** `[P2]` | trial only | ✓ | | |
| **Weekly AI review and ask-your-data** `[P2]` | trial only | ✓ | | |
| No ads `[P3]` | — | ✓ | | |
| Owner core: members, plans, fees, receipts, reminders, visits, **absence alerts**, today's calls, trainer tools, reports, export | ✓ | | ✓ | ✓ |
| Register reader (photo → members) `[P2]` | ✓ | | ✓ | ✓ |
| Why-this-member, drafted messages, ask-the-gym, trainer copilot, diet-chart digitiser | — | | ✓ | ✓ |
| **AI calling**, metered by minutes | — | | — | ✓ |
| Marketing broadcasts (at-cost credits) `[P2]` | pay as you go | | pay as you go | pay as you go |

**Indicative prices** (pre-sold in G12; member price set in G15, owner prices in G24; [R3 §15.4](research/R3-gym-b2b2c-strategy.md)):

| Product | Price |
|---|---|
| Member Pro | ₹99–199 a month, or ₹799–1,499 a year |
| Owner Pro Assist | ₹799 a month |
| Owner Pro Calls 100 | ₹1,999 a month |
| Owner Pro Calls 400 | ₹5,999 a month |
| Extra AI-calling minutes | ₹15 a minute |

Owner prices are before GST.

---

## 10. Non-functional requirements (additions to v1 §9)

| Area | Requirement |
|------|-------------|
| **Tenant isolation** | Staff of one gym can never read or write another gym's data. An unknown or other-tenant gym returns **404**, never 403, so a gym's existence does not leak. An automated test walks **every** route under `/v1/gyms/{gym_id}` |
| **Consent enforcement** | Member training, body and nutrition data reach staff only through a server-side consent check on each request. Revocation applies on the next request |
| **Auditability** | Payments, consent records and the audit log are **append-only**, enforced in the database (the v1 m6 trigger pattern) |
| **Performance** | Owner lists (members, dues, visits) return in < 300 ms p95 for 1,000 members. Self check-in completes in < 3 s on 3G. v1 budgets are unchanged |
| **Low-end Android** | On the reference phone (₹8–10k class, Android 12+, 3–4 GB RAM): cold start to the gym card < 3.5 s; tap-to-set p95 < 100 ms; install size tracked, with a budget set in G23 |
| **Offline** | Self check-in, payments recorded by staff, and attendance marks queue in the existing outbox. Owner reads show cached data with the offline banner |
| **Localisation** | 100% of the owner core, trainer core and member gym flows exist in English and Hindi, checked by a catalog-completeness test |
| **Messaging** | WhatsApp sends are queued, retried with backoff, and idempotent on a deterministic key (one reminder per member per due date per offset). Delivery status is recorded |
| **Cost guardrails** | Per-gym monthly ceilings on platform-paid WhatsApp spend. Per-user daily AI fair-use caps. Daily cost report per gym (AI, WhatsApp, SMS) |
| **Security** | Staff sign in with phone OTP. Role changes take effect on the next request. Removed staff lose access immediately. The admin surface stays operator-token-only (v1) |
| **Privacy** | DPDP-ready by design ahead of the Rules' main obligations on 13 May 2027 (or earlier if MeitY shortens the window): notice and consent records, breach runbook (72 h), access logs kept ≥ 1 year, erasure flows, 18+ consumer app |
| **Observability** | Gym activation funnel, alert precision, message delivery, entitlement events and cost per gym are computed from tables, as v1's product metrics are |

---

## 11. Data ownership, privacy and consent

**Roles under India's DPDP Act** (our reading; counsel review is part of G12):

| Data | Fiduciary | Our role |
|---|---|---|
| Gym records: member register, memberships, payments, receipts, attendance, staff, enrolment-notice versions | **The gym** | **Processor**, under a data processing agreement (DPA) in the gym terms |
| The member's FitLog account: training, nutrition, body, photos, AI analyses, consents to FitLog | **FitLog** | Fiduciary |
| A check-in made *in FitLog* | Both: the gym's attendance record **and** the member's own activity record, under their FitLog consent | — |

**Rules:**

1. **Invites** are sent once, in the gym's name, under the gym's enrolment notice (GYM10.4). No FitLog marketing goes to gym-supplied numbers (GYM05.4).
2. **Consent purposes** are those in GYM10.1, versioned and append-only. Withdrawal is as easy as granting.
3. **Minors:**
   - The consumer app is 18+ in India (M01.2), unless Q33 decides otherwise.
   - Gym records of under-18s need parental consent captured by the gym.
   - Under-18s get no FitLog link, no challenges, no AI calls, and appear in no analytics.
4. **No Aadhaar** numbers or copies, anywhere. Identity is a phone OTP.
5. **Biometrics:** no fingerprint or face templates ever reach FitLog. Device imports carry only the device user ID and timestamps.
6. **Location:** used only at the moment of a check-in. Only the verified/unverified result and a distance band are stored.
7. **Deletion:**
   - A member's FitLog deletion removes FitLog data and the link; the gym record remains.
   - A gym's offboarding removes gym data after 30 days; members' accounts remain (G14).
8. **Cross-border:** AI providers may process outside India. Disclosed in FitLog's notice (v1 behaviour).

## 12. The owner-safety charter (product policy)

Written into the gym terms and shown at sign-up (O-01):

1. We never show another gym to your active members.
2. We take no commission on members you bring, including through your own QR codes.
3. Your member data is yours. Export it at any time, free.
4. Inside the app, your members see your gym's name.
5. If a member leaves, we tell you, give you the tools to win them back, and show them no other gym for at least 30 days. **[OPEN Q21]** Whether this becomes "never".

---

## 13. Acceptance criteria (v2)

v1's AC-01…AC-12 must still pass unchanged.

| # | Criterion | Verified on |
|---|-----------|-------------|
| AC-13 | An owner with a register of ≥ 150 members goes live within one 90-minute visit, using import plus manual entry | O-01 → O-06 → O-02 |
| AC-14 | A member invited by WhatsApp signs in with a phone OTP and sees the gym card pre-filled, typing nothing but the OTP (A-14's date of birth is a picker) | A-11 → A-13 → N-01 |
| AC-15 | Self check-in records a visit within 3 s of scanning. With no network it is queued and lands later with the original time. **Nothing blocks the member** | N-02, N-03 |
| AC-16 | A scan > radius from the gym, or with location denied, is stored as `unverified` and excluded from challenge standings | N-03, N-07 |
| AC-17 | Staff of gym A get 404 on every route of gym B (route-walker test covers 100% of `/v1/gyms/{gym_id}` routes) | — |
| AC-18 | A trainer sees a member's sessions only while the consent is on; revoking it removes access on the next request | T-02, N-05 |
| AC-19 | A reliably tracked member with no visit for 7 days appears in today's calls at 07:00 gym time as `confident`; a rarely-scanning member appears as `low` | O-14 |
| AC-20 | Renewal reminders go out at D-7, D-3, D0 and D+3 (if lapsed) exactly once each, in the gym's name, between 09:00 and 20:00, with a progress line only under consent | message log |
| AC-21 | Recording a payment updates dues immediately and produces a gym-numbered receipt viewable in N-04 and sendable to WhatsApp. A correction is a reversal, never an edit | O-09, O-10, N-04 |
| AC-22 | Every AI endpoint returns `PRO_REQUIRED` for a user without Pro, **without calling the model**; trial and Pro users succeed | H-06, H-09 |
| AC-23 | The message log shows **zero** marketing-category templates sent to gym-supplied numbers | audit report |
| AC-24 | An owner export delivers every gym table as CSV within 24 h. Offboarding a gym leaves its members' FitLog accounts intact | O-19 |
| AC-25 | Every A-11…A-14, O-, T-, N- and P- screen can be completed in Hindi. Reused v1 screens (the C- builder, the E- logger) stay English in the MVP | — |
| AC-26 | On the reference low-end phone: cold start to gym card < 3.5 s, and tap-to-set p95 < 100 ms | Maestro measure flows |
| AC-27 | A member flagged under 18 is never invited, never linked, and never shown in a challenge | O-05, N-07 |
| AC-28 | Ending Pro or a trial loses no data. AI entry points show the locked state and past analyses stay readable | P-04 |

---

## 14. Release plan

| Milestone | Contents | Goals ([17](17-GYMS-IMPLEMENTATION-PLAN.md)) | Exit criterion |
|-----------|----------|----------------|----------------|
| M9 — Validation | Interviews, counsel review, weighed-meal test, 2-gym concierge pilot | G12 | Go / no-go memo; Q21–Q33 answered or defaulted |
| M10 — Foundations (serves the store launch too) | Phone sign-in; i18n spine; Indian food depth; Pro and paywall | G13, G14, G15 | AC-22, AC-28 |
| M11 — Gym core | Tenancy, roles, policy, audit, consent, jobs; owner core and fees | G16, G17 | AC-13, AC-17, AC-21 (O-09/O-10), AC-24 |
| M12 — Members and visits | Linking, gym card, messaging; attendance without a gate | G18, G19 | AC-14, AC-15, AC-16 (stored unverified), AC-21 (N-04, WhatsApp), AC-23, AC-27 (invite, link) |
| M13 — Retention and the plan loop | Alerts and renewals; trainer workspace; challenges, referrals, share cards | G20, G21, G22 | AC-16 (standings), AC-18, AC-19, AC-20, AC-27 (challenges) |
| M14 — Pilot release | Hindi completion, low-end hardening, pilot instrumentation and runbook | G23 | AC-25, AC-26; the pilot gyms move onto the MVP release |
| M15+ — Phase 2 | Owner Pro, member AI logging and review, AI calling [GATED], payments, web console | G24–G30 | §6.1 gate passed first |

---

## 15. Changes to PRD v1

| v1 location | Was | Now | Reason |
|-------------|-----|-----|--------|
| §3 Personas | Coach `[P2]` | **Trainer role in the MVP**, scoped to a gym (T1). Owner, member and lapsed-member personas added | R3 §1.2 |
| §5.3 Out of scope | Social feed / friends / leaderboards | **Gym-scoped** challenges, leaderboards and share cards in scope. A global feed is still out | R3 §1.2, §8 |
| §5.3 Out of scope | Payments and subscription management | Gym **payment records** in scope; **Pro** subscription in scope; online collection P2 | D33, R3 §5 |
| §5.3 Out of scope | Multi-language content | **Hindi/Hinglish UI** in scope (FR-L01) | R3 §1.2 |
| §8 FR (H-06…H-09) AI nutrition | Free, with a daily quota of 25 for everyone | **Pro-gated** (FR-PRO02), with fair-use caps | D33 |
| §13 Q6 | "Is there a paid tier? No; K-11 is a stub" | **Closed by D33**: Pro for all AI; K-11 becomes P-03 | D33 |
| Auth (A-01…A-10) | Email, Google, Apple | **+ phone OTP** (FR-A01). An account may have no email | R3 §6.4 |
| Onboarding A-07…A-10 | Program setup | Gym-invited members skip it (M01.1) | R3 §1.4 |
| Charter Q9, minimum age | 16+ (owner, 25 Sep), enforced in `app/domain/age.py` | **18+ for India** (M01.2) **[OPEN Q33]** | DPDP: under-18 is a child; tracking and behavioural monitoring are prohibited |
| B-01 Dashboard | Training, nutrition and body cards | **+ gym card, today's plan, weekly improvement** (FR-M02) | R3 §5 B1, B3, B5 |
| H-17 Barcode | Out of v1 (Q1); L5 to reopen | **P2** | R3 §1.2 |
| Indian catalog | 138 dishes | **≥ 500 dishes**, household units, Hinglish search, all USDA-derived (FR-M03) | R3 §1.1 |
| Body metrics | Recorded by the member | May also be recorded **by a trainer** for the member (GYM08.5) | R3 §5 C4 |
| Programs | Owned by the user | Also **gym templates**, assigned as member-owned copies with provenance (GYM08.3) | R3 §5 C1 |
| Charter non-goals | No social, no coaches, no payments, no paywall | Revised by **D31–D35** | Owner decisions, 2 Oct 2026 |

## 16. Risks (product level)

Full register: [R3 §13](research/R3-gym-b2b2c-strategy.md).

| # | Risk | Mitigation in this PRD |
|---|------|------------------------|
| PR1 | Members don't link without an entry gate | Trainer-led activation; gym card; challenges count only recorded visits; coverage view (GYM02.8); the §6.1 gate |
| PR2 | Attendance is partial, so alerts are wrong | Confidence rule (GYM07.2); precision metric; device import (GYM06.6) |
| PR3 | Owners use only the ledger | Invites in the joining flow; alerts get richer as coverage grows |
| PR4 | Privacy complaints | P3/P5; consent records; one invite in the gym's name; GYM05.4 enforced in code |
| PR5 | The paywall hurts AI adoption | Trial; launch with the wall (no take-away); measure trial → paid |
| PR6 | Free costs too much | AI only behind Pro; at-cost credits; per-gym cost report |
| PR7 | AI calling breaks telecom rules | [GATED] by counsel; pre-declaration; consent; caps (FR-PRO06) |

## 17. Open questions

| # | Question | Decides | Default if unanswered |
|---|----------|---------|-----------------------|
| **Q21** | Make promise 5 permanent ("never show another gym") and drop gym discovery for good? | §12, P3 scope | Keep the 30-day wording; build no discovery |
| Q22 | Pilot city and cluster | G12, G23 | The founding team's city |
| Q23 | WhatsApp sending: one platform number naming the gym, or each gym's own number? | G18 | **Platform number** at MVP; gym numbers P2 (GYM05.9) |
| Q24 | SMS OTP provider and DLT registration | G13 | **MSG91** through Supabase's Send-SMS hook; Twilio as fallback |
| Q25 | In-app purchase stack | G15 | **RevenueCat** (launch-plan L6) |
| Q26 | Member Pro price and trial length | G15 | ₹149 a month / ₹999 a year; 7-day trial |
| Q27 | Owner Pro tiers and prices | G24 | §9 indicative prices |
| Q28 | Teen members: gym records only? | G16 | Yes, with parental consent; never linked |
| Q29 | Gym-bought Pro seats versus store rules (Apple 3.1.3) | P2 | Not offered until reviewed |
| Q30 | Voice-AI vendor for calling | G26 | Evaluate Bolna, Exotel and others on Hindi quality and price |
| Q31 | Payment aggregator for P2 collection | G27 | Razorpay or Cashfree sub-merchant onboarding |
| Q32 | Name and trademark: "FitLog for Gyms" (launch-plan L8) | Store, terms | Check before printing posters |
| **Q33** | Raise the minimum age from 16 (charter Q9) to **18 for India**? | M01.2, G18 | **18+**: the stricter rule is the lawful one under DPDP. Counsel confirms in G12 |

---

## 18. Screen inventory additions

**Naming rule.** In UI copy a gym visit can be called a *check-in*. In code, APIs and tables it is always a **`visit`**: "check-in" already means the body-measurement check-in (I-02, `/v1/body/checkins`).

| ID | Screen | Type | Phase |
|----|--------|------|-------|
| A-11 | Phone sign-in | FS | MVP |
| A-12 | OTP verify | FS | MVP |
| A-13 | Join a gym (invite landing, code entry, confirm) | FS | MVP |
| A-14 | Age and FitLog consent | FS | MVP |
| N-01 | Gym card (home card + full screen) | ST | MVP |
| N-02 | Check-in scanner | FS | MVP |
| N-03 | Check-in result | SH | MVP |
| N-04 | Receipts and dues | ST | MVP |
| N-05 | Sharing and consent (per gym) | ST | MVP |
| N-06 | Today's plan from trainer (entry to E-01) | ST | MVP |
| N-07 | Challenge and leaderboard | ST | MVP |
| N-08 | Refer a friend | SH | MVP |
| N-09 | Break mode | ST | P2 |
| N-10 | Freeze request | SH | MVP |
| P-01 | Paywall | FS | MVP |
| P-02 | Trial started | SH | MVP |
| P-03 | Manage Pro (replaces K-11) | ST | MVP |
| P-04 | Locked feature state (inline) | — | MVP |
| P-05 | AI workout logging (text/voice) | SH | P2 |
| P-06 | Weekly AI review and ask-your-data | ST | P2 |
| O-01 | Create gym / workspace switcher | FS / SH | MVP |
| O-02 | Gym today | ST | MVP |
| O-03 | Members list | ST | MVP |
| O-04 | Member detail (membership, payments, visits, link, trainer, messages, audit) | ST | MVP |
| O-05 | Add or edit member | FS | MVP |
| O-06 | Import members | FS | MVP |
| O-07 | Membership plans | ST | MVP |
| O-08 | New membership, renew, freeze | FS | MVP |
| O-09 | Record payment | SH | MVP |
| O-10 | Receipt | ST | MVP |
| O-11 | Dues | ST | MVP |
| O-12 | Visits (today, history, mark) | ST | MVP |
| O-13 | Visit import (device Excel) | FS | MVP |
| O-14 | Today's calls (alerts and praise) | ST | MVP |
| O-15 | Staff and roles | ST | MVP |
| O-16 | Gym settings (profile, location and radius, poster, alert rules, notice, language) | ST | MVP |
| O-17 | Reports | ST | MVP |
| O-18 | Challenges | ST | MVP |
| O-19 | Export and offboarding | ST | MVP |
| O-20 | Coverage and invites | ST | MVP |
| O-21 | Owner Pro (information; purchase on web) | ST | P2 |
| O-22 | AI calling settings and log | ST | P2 |
| T-01 | Trainer today | ST | MVP |
| T-02 | Member training view (consented) | ST | MVP |
| T-03 | Assign plan | SH | MVP |
| T-04 | Gym plan templates | ST | MVP |
| T-05 | Record measurements for a member | SH | MVP |

Types follow [04 §1](04-SCREEN-ARCHITECTURE.md): **FS** full screen · **ST** stack screen · **SH** sheet.
