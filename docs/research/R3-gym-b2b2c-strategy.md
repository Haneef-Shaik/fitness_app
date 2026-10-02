# R3 — Gyms as the distribution channel: market research and strategy (India first)

| | |
|---|---|
| **Question** | Can free gym-management software, given to gym owners, become the distribution channel for FitLog's consumer app and grow into a fitness platform, not just another gym SaaS? |
| **Date** | 2 October 2026. All web sources were accessed on that date unless a date is given. |
| **Status** | Research and recommendation. Nothing here is built. It proposes changes to decisions in the [charter](../08-PROJECT-CHARTER.md) (§1.2 below); none are accepted yet. |
| **Revised** | 2 Oct 2026, after the owner's review: no app-gated entry, all AI behind Pro, ads later, paid AI calling, promise 5 clarified. See [§15](#15-owner-decisions-after-review-2-october-2026), which wins where it differs. |
| **Short versions** | [Executive summary](R3-executive-summary.md) (two pages) · [Presentation](R3-presentation.html) (18 slides; open in a browser, ← → to move, T for light/dark, print to PDF) |
| **Evidence** | Six research briefs in [R3-evidence/](R3-evidence/README.md), about 26,000 words and 350+ cited sources, plus the FitLog repository as it stands on `main`. |

---

## How to read this report

The brief asked for market facts, competitor behaviour, user feedback, analysis and hypotheses to be kept apart. Every claim that matters carries one of these labels:

| Label | Means | How much to trust it |
|---|---|---|
| **[F]** | **Market fact**: a filing, regulator, reputable press, peer-reviewed study or measured dataset | High. Still check the date. |
| **[C]** | **Competitor behaviour or claim**: a company's pricing page, press release or own numbers | Medium. Companies round up. |
| **[U]** | **User feedback**: reviews, complaints, forum posts, quoted | Anecdotal. Shows *that* a pain exists, not how common it is. |
| **[E]** | **Estimate**: a third-party modelled figure (market-research firms, app-intelligence tools) | Low. Treat as an order of magnitude. |
| **[A]** | **Our analysis**: an inference from the evidence | As good as the reasoning shown. |
| **[H]** | **Hypothesis**: something we believe but have not tested | Zero until tested. §14 lists how to test each one. |

Source pointers such as [A §3][A] lead to the evidence brief and section where the full citation, URL and date are. The briefs are:

- [A — Indian gym software and gym operations][A]
- [B — Indian consumer fitness and aggregators][B]
- [C — Global gym software, member apps and retention science][C]
- [D — Consumer apps, AI, virality and portability][D]
- [E — Free vertical SaaS as a B2B2C wedge: analog cases][E]
- [F — Indian regulation, payments and unit costs][F]

**Limits of the research.** The agents could not reach Reddit or the Economic Times, and the shared search budget ran out late in the run. So owner sentiment leans on Play Store reviews, and a few items are marked "not found" in the briefs. The Deloitte–HFA India report is the best market sizing available, but it is still modelled. Nothing here comes from talking to gym owners. That is the first gap to close (§14).

---

## Contents

0. [Executive summary](#0-executive-summary)
1. [Where we start: what FitLog already is](#1-where-we-start-what-fitlog-already-is)
2. [The thesis, stated precisely](#2-the-thesis-stated-precisely)
3. [Market research](#3-market-research)
4. [The market gap](#4-the-market-gap)
5. [Features that could make the product stand out](#5-features-that-could-make-the-product-stand-out)
6. [The gym owner → member acquisition loop](#6-the-gym-owner--member-acquisition-loop)
7. [The free gym-management strategy](#7-the-free-gym-management-strategy)
8. [Viral growth mechanisms](#8-viral-growth-mechanisms)
9. [A portable fitness identity](#9-a-portable-fitness-identity)
10. [Product strategy: MVP, Phase 2, Phase 3](#10-product-strategy-mvp-phase-2-phase-3)
11. [Go-to-market in India](#11-go-to-market-in-india)
12. [Competitive moat](#12-competitive-moat)
13. [Risks and failure modes](#13-risks-and-failure-modes)
14. [Final strategic assessment](#14-final-strategic-assessment)
15. [Owner decisions after review (2 October 2026)](#15-owner-decisions-after-review-2-october-2026)

---

## 0. Executive summary

**Short answer.** The idea can work, but not in the form first described, and not mainly because of a cross-gym network effect.

What can work is FitLog's member app acting as each gym's membership card, fee book and trainer's notebook. Members install it because their gym runs through it, and they keep using it because the logger and the Indian-food nutrition tracker are better than anything a gym app has had. In the research, the strong network effect sits *inside each gym*: members, trainers and the owner on one shared system. The *cross-gym* network (members carrying history between gyms, discovering other gyms, a marketplace) is real optionality. But every analog suggests it stays a thin layer for years, and it can turn gym owners against the platform if it looks like poaching.

### What the evidence says

| | Finding | Label |
|---|---|---|
| 1 | **The market is large and almost entirely long-tail.** India has about 46,500 gyms and 12.3M members (0.8% of adults). 80% of gyms are "value" gyms with about 258 members each, paying under ₹14,000 a year per member. 32,000 gyms are outside the top 10 cities. | [E] Deloitte–HFA 2025 [A §3][A] |
| 2 | **Gym software in India is commoditised and cheap.** About 40 Play Store products and 77 on Techjockey sell member records, renewals, WhatsApp reminders, QR and biometric attendance, at about **₹2,000–12,000 a year**. The owner complaints are support, bugs and price hikes at renewal. They are not about missing features. | [C][U] [A §1, §4][A] |
| 3 | **Members do not install apps their gym hands them, unless the app *is* how they use the gym.** GymBook's owner app has 50K+ installs and its member app 500+. DGymbook's member app has 100+ against a claimed 4,500 gyms. Vendors are retreating to WhatsApp. Planet Fitness reached 40%, then about 60%, adoption because the app is the door key. ABC's member app logged 57.5M check-ins but only 2M workouts. | [F][C] [A §2][A], [C §4][C] |
| 4 | **Cross-merchant consumer networks stay small even when they succeed.** Mindbody: about 22,000 first purchases a month through its app, against 60M monthly bookings. Fresha: the marketplace is about 10% of new clients after 11 years and $285M. ClassPass visitors convert to studio members at about 6%, and studios have left over payouts. | [C][F] [E §1][E] |
| 5 | **India removes the usual way "free" gym software is paid for.** PushPress funds its free plan with a 4.99% card fee. In India UPI carries no merchant fee below ₹2,000. From 15 Oct 2026 it carries 0.4% above that, and that fee goes to the payments chain, not to us. Indian free SMB apps reached tens of millions of installs and lost about as much as they earned (Khatabook FY24: ₹102.7 cr revenue, ₹116.2 cr loss). | [F] [C §2][C], [E §1][E], [F, correction note][F] |
| 6 | **Serving a gym for free is not free.** Our cost model puts a gym of 300 members at about ₹600–1,000 a month before any AI (the upper end includes one marketing broadcast), rising to about ₹1,800 a month if a quarter of app users log food photos daily on Claude Haiku. That is more than many Indian gyms pay a competitor today. | [E] [F §7][F] |
| 7 | **The retention science gives owners a concrete, measurable reason to push the app.** Four or more visits in the first month, staff contact, and making friends at the gym each strongly predict staying. 63% of new members stop attending before their third month. In India, 32% of leavers take a "temporary break" and 48% say they would rejoin. | [F][E] [C §5][C], [B §2][B] |
| 8 | **Gym-channel acquisition can be much cheaper than paid installs, *if* activation is high.** A paid fitness signup in India costs about ₹200. One gym signed by a field rep costs about ₹2,300. At 40% activation of 300 members that is about ₹19 per activated member; at 10% it is about ₹78. Add a year of serving the gym and those become about ₹70 and ₹280 (§6.8). | [E][A] [B §3][B], [F §6–7][F] |
| 9 | **FitLog already has the expensive half.** A logger measured at 80.7 ms p95 tap-to-set on a phone, an AI food pipeline with a review step (which a preliminary 2026 NIH accuracy study suggests is necessary, not a nicety), 138 Indian dishes, body tracking, imports from Strong, Hevy and MyFitnessPal, and full data export. None of the gym-software competitors has a consumer-grade logger or nutrition tracker. | [F] repo; [D §3][D] |

### The recommendation in one paragraph

Build **"FitLog for Gyms"** as a free, owner-first gym operating system whose member side is the existing FitLog app. Members join with their phone number and use the app for their fee status and receipts, their trainer's plan, and self check-in by scanning the gym's QR poster. It is not a gate: value gyms have no receptionist (§15.1). WhatsApp is the fallback for anyone who won't install. Put the network effect inside each gym first: trainer-assigned plans, gym challenges, a gym-floor leaderboard, and free absence alerts for the owner. Promise owners in writing that we will **never market another gym to their members, never take commission on members they bring, and always give their data back**. Plan revenue from day one, because India's payment rails will not fund the free tier:

1. **All AI behind Pro.** Members get AI food analysis, AI workout logging and an AI analytics agent. Owners get AI assistance, including **AI calling** priced in tiers by usage. Everything else stays free for owners (§15.2, §15.4).
2. Gyms can buy Pro seats for their members as part of a "gym + app" membership.
3. Later, relevant ads and brand sponsorship (never other gyms), and a revenue share on payment collection through a licensed payment aggregator (§15.3).
4. Later still, verified-activity partnerships with insurers and employers.

Treat cross-gym features (portable history, gym discovery, inter-gym challenges) as Phase 3, earned once one city has density.

### Before investing heavily

Run the **5-gym, 10-week validation pilot** in §14.7. It tests the one assumption everything depends on: when the gym runs through the app, do at least 40% of active members install it, do at least 25% of them log a workout or meal every week, and does the owner see more renewals or first-month visits as a result? If installs stay under 15% after 60 days, the B2B2C thesis is wrong in its current form; §14.9 lists the pivots.

---

## 1. Where we start: what FitLog already is

The brief says to build on what exists. Here is the honest inventory. Statuses come from the [tracker](../09-PROJECT-TRACKER.md): every milestone M0–M8 is done, with 2,534 tests passing, 125 API operations and 76 route screens on `main` as of 2 Oct 2026.

### 1.1 Inventory: what is built, and what it becomes

**Decisions:** **Keep** = no change needed. **Extend** = build on it for gyms. **Re-scope** = change what it is for. **De-prioritise** = stop investing for now.

**Training**

- **Live workout logger** (E-01…E-13). Built: set logging at 80.7 ms p95 tap-to-set on a phone, crash recovery, supersets, rest timer, plate calculator, exercise swap, PR celebration.
  - **Gym role:** the member's daily reason to open the app. No gym member app does this well; ABC's tracked 2M workouts against 57.5M check-ins [C §4][C].
  - **Decision: Keep.** It is the core. Add a "today's plan from your trainer" entry point.
- **Programs, plan days, templates, weekday scheduling** (C-01…C-09).
  - **Gym role:** becomes the trainer's tool for authoring and assigning plans.
  - **Decision: Extend.** Trainers write a plan once and assign it to many members. Members see it as "assigned by <trainer>".
- **Exercise catalog**: 297 exercises, custom exercises, muscle mapping (D-01…D-05).
  - **Gym role:** shared vocabulary between trainer and member.
  - **Decision: Keep, and extend later.** Add Hindi and Hinglish names and aliases (MVP). Add a per-gym equipment list so plans only use what the gym has (Phase 2).
- **History and retrieval**: "previous chest day", compare, calendar (F-01…F-07).
  - **Gym role:** what a trainer looks at before a session.
  - **Decision: Extend.** Trainer read access, with the member's consent.
- **Training analytics**: volume, frequency, muscles, PRs, e1RM, adherence (G-01…G-07).
  - **Gym role:** source of share cards, retention signals and progress reports.
  - **Decision: Keep.** Feed it into owner signals and member recaps.

**Nutrition**

- **Nutrition diary**: manual, quick add, natural-language text, AI photo with an editable review step, recipes, copy meals, categories, targets, analytics. Only *confirmed* values count (D5).
  - **Gym role:** the second daily reason to open the app, and a premium feature gyms can bundle.
  - **Decision: Re-scope.** Make it "honest Indian-food nutrition" (§5 B4, E2). In a preliminary 2026 NIH study (not yet peer-reviewed), all four photo apps tested underestimated calories by about a third [D §3][D], so the review step is a selling point. Add a trainer diet-plan template.
- **Food catalog**: 7,678 USDA foods, but only **138 Indian dishes**.
  - **Gym role:** decides whether Indian members trust the numbers.
  - **Decision: Extend, urgently.** 138 dishes is thin for Indian home food. More regional dishes should come before barcode. Value them the way the existing 138 are: from public-domain USDA records and standard recipes. IFCT 2017, which launch-plan L4 proposed, is © NIN with no redistribution licence and can't be shipped ([data-sources.md](../data-sources.md)). Asking NIN for a licence is still worth doing.

**Body**

- **Weight trend, measurements, progress photos, check-ins, goals** (I-01…I-06, J-01…J-04).
  - **Gym role:** what trainers record on assessment day, and what members show off.
  - **Decision: Extend.** Trainers can record measurements for a member. Photos stay **private by default** and the gym never sees them unless the member shares.

**Platform and account**

- **Configurable dashboard** (B-01…B-05).
  - **Gym role:** the home screen for gym members.
  - **Decision: Extend.** Add a gym card: membership status, days left, QR pass, today's plan, gym challenge.
- **Imports** from Strong, Hevy and MyFitnessPal; **Apple Health / Health Connect**; **full data export**; **account deletion**.
  - **Gym role:** answers "I already use another app" and backs the portability promise (§9).
  - **Decision: Keep.** Advertise it to members who already use other apps.
- **Push notifications and reminders.**
  - **Gym role:** in-app nudges.
  - **Decision: Keep.** WhatsApp becomes the main channel for anything the gym sends.
- **Sync center, outbox, conflict resolution.**
  - **Gym role:** reliability on poor gym-basement networks.
  - **Decision: Keep.**
- **Sign-in** (Supabase Auth: email, Google, Apple).
  - **Gym role:** Indian gyms identify members by phone number.
  - **Decision: Extend.** Phone OTP sign-in, by SMS and WhatsApp, is required for MVP.
- **AI containment**: a separate worker, with no AI failure affecting training (D25, I14).
  - **Gym role:** cost control.
  - **Decision: Keep.** Add per-member and per-gym quotas (§7.3).
- **Product metrics, feedback, admin token.**
  - **Gym role:** needed for the pilot's measurements.
  - **Decision: Extend.** Add gym-level activation funnels (§14.8).

**Nothing that is built should be removed.** Every piece above has a clear role in the gym strategy. Some things should get *no further investment* until the pilot says otherwise, because they serve the self-directed power user, a minority of gym members:

- Custom-range nutrition analytics.
- Recipe scaling.
- Meal categories.
- Advanced comparison screens.

These still work, but they should sit one level deeper in the gym member's default navigation (see §1.4).

### 1.2 Charter decisions this strategy would reverse, and why

| Decision today ([charter §3](../08-PROJECT-CHARTER.md#3-non-goals); [PRD §5.3](../01-PRD.md); [launch plan](../11-LAUNCH-PLAN.md) L5–L6) | Proposed | Reason |
|---|---|---|
| **No social features** (no feed, leaderboards or sharing) | **Gym-scoped social at MVP:** gym challenges, an in-gym leaderboard, share cards. Still **no** global feed or friends graph. | Social ties and staff contact are among the strongest measured predictors of staying (40% fewer cancellations among members who made friends, TRP/Hillsdon). Competition was the only social format with a lasting effect in the STEP UP trial [C §5][C], [D §4][D]. A global feed is the part with no evidence behind it. |
| **Coach accounts: Phase 2** | **Trainer role at MVP**, scoped to a gym | Trainer-to-member plan handoff is the activation hook (§6). PT is 14% of Indian gym revenue, heading for 20% [A §3][A]. The authorization layer was written as "can actor A read R" precisely so this is a policy change, not a rewrite ([PRD §3](../01-PRD.md)). |
| **No payments** | **Gym-side payment *records* at MVP** (cash/UPI ledger, receipts, dues). **Online collection in Phase 2** through a licensed payment aggregator, with money settling straight to the gym. Still no consumer paywall at MVP. | Fees and dues are the owner's top daily job [A §4][A]. Collecting money on a gym's behalf without a licence is unauthorised aggregation [F §4][F]. |
| **Web deferred** | **Owner app first, in the same Expo codebase** (role-based). Web console in Phase 2 for front desks and multi-branch. | Indian gym software is overwhelmingly Android apps (GoGym4U 100K+ installs, GymBook 50K+) [A §1][A]. Owners run the business from their phones. |
| **English-only content** | **Hindi and Hinglish UI** for the owner app and the member's gym surfaces at MVP | Owner reviews are often in Hinglish [A §2][A]. Healthify's assistant speaks 14 Indian languages [B §1.6][B]. The UI is already i18n-ready. |
| **Barcode scanning (L5) to be reopened** | **Phase 2**, behind the Indian-dish catalog | Indian gym members eat mostly home and restaurant food. Barcodes matter for whey, bars and packaged snacks, which is a real but smaller share. |
| **Paid tier (L6) open** | **All AI behind Pro**, for members and owners, with a 7-day trial; owners' non-AI features free (§15.2) | The AI food analysis is our largest variable cost [F §7][F]. |

### 1.3 What the codebase gives us, and what is missing

**Gives us** [A, from the repo]:
- A logger that never waits for the network (D14).
- Domain logic pinned by shared test vectors, so the server can trust client-computed PRs.
- AI kept separate from training (I14).
- An outbox and sync center.
- Imports and full export.
- The authorization pattern written for coaches.
- Supabase Postgres, Auth and Storage.
- Accessibility work, and a design system after the Kinetic redesign.

**Missing for gyms.** A multi-tenant **organisation model** that does not exist yet:
- Gym, branch, staff and roles.
- Membership plan, member's membership, invoice and payment record.
- Check-in.
- Consent records: purpose, version, timestamp, collected by.
- Message log.
- A gym-to-member link that the *member* controls.

This is the largest piece of new engineering, and it is mostly ordinary CRUD. The hard parts are **consent and data boundaries** (§13, risk R9) and **identity**: phone-first, with one account for one person across gyms.

### 1.4 The persona shift

FitLog's primary persona is the **Structured Lifter**, who trains 3–6 times a week on a self-written program ([PRD §3](../01-PRD.md)). A gym's member base is different:
- 78% of Indian gym members are in value gyms.
- First-time joiners join mainly for appearance (54%) [B §2][B].
- Value gyms give 1–2 weeks of free PT, then members mostly follow a trainer's routine or improvise [A §2][A].

**[A]** So the gym-invited member's default experience should be:
1. Open the app.
2. See the membership card and "today's workout from Rahul (trainer)".
3. Tap once to start.
4. Log with the existing logger.
5. See one number that improved.

Program building, analytics depth and nutrition ranges remain one tap away for the Structured Lifter, who is still the member most likely to become a paying user and an advocate.

---

## 2. The thesis, stated precisely

The brief's loop, written as a chain of claims. Each must hold for the business to work, and each is tested somewhere in this report.

| # | Claim | Type | Where tested |
|---|---|---|---|
| T1 | Gym owners will adopt free software and move their members onto it | [H] | §7.1, §14 |
| T2 | Owners will actively push members to the app | [H] | §6.2 |
| T3 | A meaningful share of members (≥40%) will install and keep using it | [H], and the evidence is mixed | §3.5, §6 |
| T4 | Member engagement produces value the owner can see: renewals, attendance, referrals | [H], partly supported by retention science | §4, §14 |
| T5 | This acquires consumers more cheaply than paid acquisition | [A] Supported *if* T3 holds | §6.8 |
| T6 | Members stay on the platform when they leave or change gyms | [H] | §9 |
| T7 | More gyms make the platform more valuable to each gym, and to each member | [A] Weak across gyms, strong within a gym | §12 |
| T8 | It can be monetised without breaking T1 or T2 | [H] | §7 |

The rest of the report is organised around which of these are supported by evidence, which are contradicted, and which are open.


---

## 3. Market research

### 3.1 The Indian market in numbers

| Metric | Value | Label, source |
|---|---|---|
| Fitness facilities (2024 → 2030) | ~46,500 → 65,500 | [E] Deloitte–HFA, Sep 2025 [A §3][A] |
| Gym and studio members | 12.3M (0.8% of adults) → 23.2M (1.7%) | [E] same |
| Industry revenue | ₹16,200 cr (US$1.9B) → ₹37,700 cr | [E] same |
| Value gyms (<₹8k–14k a year per member, 500–3,000 sq ft) | 37,200 centres (80%), 9.6M members (78%), 56% of revenue; about 258 members and about ₹24 lakh revenue per gym a year | [E] same; per-gym figures [A] derived |
| Premium / boutique | 5,400 centres, 2.2M members / 3,900 centres, 0.5M members (boutique fastest-growing, ~19% a year) | [E] same |
| Outside the top 10 cities | 32,000 centres, 7.1M members; "largely untapped" | [E] same |
| Personal training | ₹2,450 cr (14% of revenue), heading for 20% by 2030 | [E] same |
| Why people leave | 32% take a "temporary break", 32% switch to home workouts; **48% of dropouts would rejoin** | [E] survey of 3,004 consumers, same |
| Who pays | 28–35-year-olds dominate; joiners cite appearance 54%, health 26%, social influence 14% | [E] same [B §2][B] |
| GST on gym services | 5% **without** input tax credit, since 22 Sep 2025 | [F] CBIC [A §3][A] |
| Market leader | Cult.fit: 708 centres in 77 cities (218 owned, 288 franchise, **202 independent "marketplace" gyms**), 987k paid members, FY26 revenue ₹1,720.6 cr, net loss ₹251.9 cr; 90.44% of services revenue from four metros | [F] DRHP, Jul 2026 [B §1.1][B] |
| Indian willingness to pay for apps | Health & Fitness price index of **0.3×**, against about 1.3× for the UK, France and Germany; India and SE Asia have the lowest revenue per install worldwide; a paid fitness install costs about ₹31, and about ₹200 per signup | [E] Adapty, RevenueCat, Linkrunner [B §3][B] |

**[A]** Three things follow:

1. The long tail is the market. There are ~37,000 value gyms of ~250 members each, and Cult.fit, the largest operator, has about 1.5% of facilities (708 of ~46,500).
2. Members pay about ₹700–1,200 a month. Any member-side subscription has to be priced against that.
3. **India pays for access, people and drugs, not for tracking software.** Cult earns from gym access. Fittr (₹128 cr, profitable) earns 95% from human coaches. Healthify is pivoting to GLP-1 programmes. Ultrahuman's subscription revenue is ₹29 cr of ₹565 cr total revenue, 91% of it from rings [B §1][B].

### 3.2 How an independent Indian gym runs today

From owner reviews, vendor marketing and the Deloitte site visits [A §2][A]:

- **Records.** A register or diary, then Excel, then a ₹2–3k-a-year Android app. "Now I don't need any diary or register" is the typical upgrade review.
- **Money.** Cash and UPI (a QR code on the wall) side by side, with one-time admission fees. Plans run monthly, quarterly, half-yearly and annual, with **part payments and outstanding dues**. A missed instalment causes disputes (a member's annual plan was "changed to a 6-month plan because I am late to pay 2000").
- **Members are reached over WhatsApp:** reminders, broadcasts, diet charts. Vendor member apps go largely uninstalled. One vendor sells "no app store download required".
- **Attendance.** An eSSL or ZKTeco fingerprint or face reader (₹3,650–15,000), usually USB- or PC-bound, sometimes driving a door lock. Proxy entry is a known problem. Software doesn't come in the box; local integrators bundle it.
- **Trainers.** Freshers earn ₹15–25k a month. Value gyms include 1–2 weeks of free PT, after which PT is upsold. Owners ask for trainer attribution and session-pack counting, which their software lacks.
- **Economics.** A Tier-2 gym of 1,800 sq ft carries about ₹2 lakh a month of fixed cost and breaks even at about 200 members [E]. A Chennai owner says gyms price for "only 1 out of 2–3 clients actually showing up" [U].

**[A] The economic model of a value gym partly depends on members *not* coming.** This matters for the strategy. An owner may not *want* a product that brings everyone back at 7 pm. What they want is **renewals and referrals**. Our pitch therefore has to be about renewals, not "engagement" as such (§6.2).

### 3.3 Competitor landscape

The tables compress the briefs. Each row's evidence is in the brief named in its section heading. ▲ = strength, ▼ = weakness or complaint.

#### a) Indian gym-management software [A §1][A]

| Player | Offer and target | Model, price | Distribution | Network effect | ▲ / ▼ |
|---|---|---|---|---|---|
| **GoGym4U** | Owner and member in one app. Members, GST billing, QR/RFID/biometric attendance, WhatsApp/SMS, PT, diet, branches. Independents | ₹2,499 a year, unlimited members; ₹6,995 for 5 years [C] | Play Store, WhatsApp sales | None | ▲ cheapest at scale, 100K+ installs, 4.68★. ▼ "support… don't even respond"; "slow and buggy" after updates; ₹100→₹350 a month hike [U] |
| **GymBook** | Members, freezes, QR and biometric, digital cards, WhatsApp | ₹2,199–2,599 + GST a year | Play Store | None | ▲ 50K+ installs. ▼ **member app 500+ installs**; renewal ₹1,800→₹2,700+GST; "customer care worst" [U] |
| **DGymbook** | Billing, biometric/QR, PAR-Q, branches. India and the Gulf | ₹499 a month | Play Store | None | ▼ member app 100+ installs against "4,500+ gyms" claimed |
| **Gymzee** (2025) | Excel bulk import, part payments, face attendance, diet and workout PDFs, store | ₹590–5,900 in-app | Play Store | None | ▼ "very slow"; login bugs |
| **Okfit** | Tiered CRM, AI reminders, **workout logger**, branded member app, smart-scale integration | ₹500–3,000 a month | Web, Play Store | None | Closest Indian product to our idea. Member app 10K+ installs. Too few reviews to judge |
| **Easy Gym Software** | Receipts, plans and reminders delivered **inside WhatsApp, no app needed** | From ₹799 | Direct | None | Evidence that WhatsApp-first works for owners |
| **FitnessForce** (Daxko since 23 Jun 2026) | API-first CRM for chains and franchises | From ₹1,500 a month | Enterprise sales | None | **A global consolidator now owns India's chain-grade vendor**, so chains will be contested |
| **Long tail** (77 on Techjockey; IndiaMART integrators) | Member management, often bundled with biometrics and door locks | ₹2k–18k a year; local licences ₹10k–1.6L | Marketplaces, local resellers | None | Price competition, no differentiation |
| **Cult.fit partner tooling** | "Digitised centre operations and CRM, personalised AI-led workouts", co-branding money "up to ₹7 lakh" | Free with joining Cult's network; payout terms undisclosed | Cult sales team | Cult's | **The most dangerous competitor for owner attention:** it brings demand *and* software, at the price of becoming Cult's supply |

#### b) Indian aggregators and memberships [B §1][B]

| Player | Model | How it gets gyms / consumers | Network effect | ▲ / ▼ |
|---|---|---|---|---|
| **Cult.fit** (cultpass ELITE/PRO/HOME) | Owned, franchise and marketplace gyms. ELITE ₹1,277–8,104 a month depending on term | Gyms: franchise capital, per-member marketplace payouts. Consumers: brand; **39% of new members via referrals**; marketing cut to 10% of revenue | City-level access: more gyms, more pass value | ▲ retention up from 41% to 51%; PT revenue +73%. ▼ "We do not refund any amount"; Trustpilot 1.4★; members blame Cult for poor partner gyms |
| **FITPASS** | Multi-gym pass plus corporate wellness. FY25 revenue ₹61.7 cr, profitable | Commission on sessions; corporates and credit-card bundles | Weak | ▼ gyms drop out or restrict pass members; charges after cancellation [U] |
| **Fitternity** | Discovery and aggregator; bought by Cult 2021, brand impaired FY24 | — | — | 35 aggregators existed in 2016, "only a handful" by 2019. Aggregation "cannibalises the parent business" [F/U] |
| **Hudle / Playo** | Sports-venue booking | Player-side booking | Local, multi-venue | Small after years; Hudle raised $2.5M in 2025 |

#### c) Global gym software and member apps [C §1][C]

| Player | Model, price | Consumer app | Network effect | ▲ / ▼ |
|---|---|---|---|---|
| **Playlist** (Mindbody + ClassPass + Booker), merged with **EGYM** in Mar 2026 ($7.5B EV, $800M+ net revenue) | Mindbody from $99/location/month plus payments plus **20% first-booking fee capped at $30** | Mindbody app 3M+ monthly; ClassPass 88k venues; EGYM Wellpass 20k employers | **The only real cross-business consumer network.** Aim: "the entire consumer journey… to the gym floor" | ▼ studio conflict with ClassPass (London studios quit, 2016); lock-in and "rush you into signing"; reported backlash when client identity moved to Mindbody [U/unverified] |
| **ABC Fitness** (Ignite, Evo, Glofox, Trainerize) | Quote-based SaaS plus **$8.8B a year of payments** | Ignite Engagement: 5M active, sessions "just over one minute"; **57.5M check-ins vs 2M workouts tracked** | None | ▼ Glofox price hikes after acquisition; annual contracts; "roadblocks" to getting your own data [U] |
| **PushPress** | **$0 plan** with unlimited members, member app, AI assistant; funded by **4.99% + $0.30 per card payment**; Pro $159 | Free member app | None | Proves free gym SaaS works *when card fees pay for it*. The free plan's processing premium rose from 1% (2019) to about 2.1 points today |
| **Zen Planner, Wodify, TeamUp, GymMaster, ClubRight, Gymdesk** | $75–350 a month, per site or per active member; branded app a $39–99 add-on | Branded apps | Within one gym (leaderboards in Wodify) | Commoditised mid-market |
| **Keepme** | AI agents for sales, retention, voice, member services | None | None | Shows AI retention is now sold as a product |
| **EGYM, Technogym** | Software that pulls through equipment sales | EGYM Genius AI plans; the EGYM Fitness member app rates 3.7★ ("incredibly unintuitive") | Via employers (Wellpass) | ▼ members can't reach their own programmes [U] |

#### d) Trainer platforms, the closest analogs to our loop [C §1][C], [D §1][D], [B §1.7][B]

| Player | Model | Why it matters to us |
|---|---|---|
| **Hevy Coach** | From $25/month for 10 clients. Clients are coached **inside the consumer Hevy app**, which they get Pro for free | This is our loop with a trainer instead of a gym: the business tool acquires consumers onto a portable app. ▼ no nutrition, no billing, no branded app |
| **Trainerize** (ABC) | Free for 1 client, up to $275/month; 400k trainers, 1.6M clients | Scale of the trainer channel |
| **Fittr** (India) | Coach marketplace. FY25 revenue ₹128 cr (95% coaching), profit before tax ₹11 cr; 700+ coaches; started as a WhatsApp group | In India, people pay for *people*. Trainers are a monetisation channel, not just a feature |

#### e) Consumer workout apps [D §1–2][D]

| Player | Model | ▲ / ▼ |
|---|---|---|
| **Hevy** | $23.99/yr Pro; 17M+ claimed users | ▲ grew to 2M downloads on **$15k of ads**; share cards lifted installs 12%. ▼ its social graph is global and not tied to a place |
| **Strong** | $29.99/yr | ▲ simple. ▼ no iOS update since Aug 2025 |
| **Fitbod** | AI plans, $80–96/yr | ▼ trial-to-annual billing complaints; "the algorithm is broken" [U] |
| **Boostcamp** | 11,000+ free programmes | Programme libraries are commoditised |
| **Ladder** | Coach-led "teams", ~150k paid subscribers (Dec 2024) | ▲ "80% weren't using a fitness app before": community and coach beat features |
| **Strava** | 180M users, ~50M MAU, ~$415–500M revenue (est.) | ▲ the network-effect benchmark: segments, clubs, 14B kudos a year. ▼ cut off third-party apps in Nov 2024; weight training is growing on Strava itself |

#### f) Nutrition and AI [D §3][D], [B §1.6][B]

| Player | Model | ▲ / ▼ |
|---|---|---|
| **Healthify** | 45M registered, "six-digit" paid. FY24: ₹206.8 cr revenue, ₹88.3 cr loss. Snap photo logging, Ria assistant in 14 Indian languages | ▲ best Indian food database. ▼ hard-sell coaching ("pressuring me to make a payment"); refund complaints; pivoting to GLP-1 and the US |
| **MyFitnessPal** | 270M+ members; bought Cal AI | ▼ crowd-sourced Indian entries vary (one dish at "95 to 420 kcal"); barcode paywall backlash in 2022 |
| **Cal AI** | $30M+ ARR, 7 staff | ▼ underestimated calories by **345 kcal per meal** on average (102 weighed meals) in the preliminary NIH 2026 study; "if I still have to recheck all of my meals… it defeats the purpose" |
| **MacroFactor** | 400k users (Sep 2025); adaptive energy estimate | ▲ the loyalty case: an algorithm that learns *your* expenditure |

#### g) Attendance and check-in [A §2][A], [C §4][C]

- **Indian hardware.** Fingerprint ₹3,650–15,000; face ₹14,500–15,000; tripod turnstiles ₹38,500–1.35 lakh. Mostly offline or PC-bound, with no member-facing layer.
- **Apps as the door key.** Planet Fitness got 40–60% of members onto its app once the app *was* the key.

#### h) Communities and events [D §5][D]

- **Hyrox** grew from 650 participants (2018) to 175k (2023), with 5,000 affiliated gyms.
- **CrossFit Open** peaked at 415k (2018) and fell to 234k (2025) after a safety controversy.
- **Orangetheory** puts heart-rate "Splat Points" on studio screens and runs "Hell Week".

**[A]** What these have in common: competition anchored to a venue and run as recurring *events*. That builds community. A feed does not.

#### i) Corporate and insurance B2B2C

- **EGYM Wellpass:** employers pay and gyms get members; 20k employer partners [C §1][C].
- **FITPASS corporate:** claims 1.7M employees covered [B §1.2][B].
- **Aditya Birla Health Insurance, Activ Health.** Policyholders check in at partner gyms through the insurer's app. A 30-minute workout earns an "Active Day", and enough Active Days return **up to 100% of the premium** as HealthReturns ([ABHI](https://onelogin.adityabirlacapital.com/healthinsurance/wellness-and-rewards/active-dayz); [Ditto](https://joinditto.in/articles/health-insurance/aditya-birla-health-insurance-healthreturns/)) [C].

**[A] Verified gym attendance already has paying buyers in India.**

### 3.4 What gym owners complain about

| Complaint | Evidence | Label |
|---|---|---|
| **Vendor support and reliability.** The dominant complaint in Indian reviews | "Customer support is pathetic" (GGMS); "doesn't do any effort… don't even respond" (GoGym4U); Glofox "deactivated my entire business by accident" | [U] [A §4][A], [C §3][C] |
| **Price hikes at renewal** | GymBook ₹1,800 → ₹2,700+GST; GoGym4U ₹100 → ₹350/month; Glofox "price increases that do not correlate with improved functionality" | [U] |
| **Lock-in and data hostage** | Glofox "roadblocks" when asking for own data; reported Mindbody $500 export fee [unverified] | [U] |
| **Who owns the customer** | Booksy charged commission on clients who "walk into my shop, scan our QR code"; Mindbody marketplace fees on self-sourced clients | [U] [E §1][E] |
| **Aggregators** | FITPASS "does not make any payments after two or three months"; gyms restrict pass members | [U] [A §4][A], [B §1.2][B] |
| **Fees and dues** | "how many members have paid the fees" is the feature owners praise most; vendors lead with "72% dues reduction" | [U][C] |
| **PT and trainer workflow** | "no Trainer field in PT details"; "we have to manually count the number of sessions" | [U] |
| **Low-end Android, vernacular users** | Crash reports on Oppo and Motorola phones; Hinglish reviews | [U] |
| **Rent and economics** | "almost half the revenue would be funneled into rent"; "pray no one opens an identical location across from mine" | [U] Chennai owner, Nov 2025 |
| **Supplement retail** | "stock inventory and billing… I can pay extra amount for that feature" | [U] |

### 3.5 What members complain about, and the member-app adoption evidence

**Adoption** [F][C], from [C §4][C], [A §2][A] and [E §4][E]:

| Case | Adoption | Why |
|---|---|---|
| GymBook member app (India) | 500+ installs against 50K+ owner installs | Optional; it shows little beyond fee status |
| DGymbook member app (India) | 100+ installs against a claimed 4,500 gyms | Same |
| Total Fitness (UK, 2017) | ~13% of members in month one | Optional |
| PureGym (UK, 2013) | 40%+ in six months [unverified] | Needed to book classes |
| Planet Fitness (US) | 40%, then ~60%, of all members; 70% of new joiners | **The app is the check-in key** |
| ABC Ignite Engagement | 5M active, ~1-minute sessions, workouts = 3.5% of check-ins | Used as a key, not a training tool |

**[A]** Members install a gym app when it is *required*, and open it daily only when it does something *for them*. FitLog brings the second. The gym integration must bring the first.

**Member complaints** [U], from [B §4][B], [C §4][C] and [D §1, §3][D]:

- **Gym apps can't log training.** "How can you have a gym app that doesn't let you log custom workouts?" (Anytime Fitness). "End users should have access to their own workout programs" (EGYM).
- **Support ping-pong in B2B2C.** "If you do [get a response], it's often to contact the studio" (Mindbody app).
- **Refund and auto-renew traps** at Cult.fit, FITPASS, Healthify and Fitbod.
- **Coaching quality.** Coaches "just share YouTube videos"; a diet plan "like someone downloaded from chat gpt" (Healthify).
- **Indian food inaccuracy.** "wildly inaccurate"; crowd-sourced entries for one dish range from 95 to 420 kcal.
- **Paywalls on basics.** The MyFitnessPal barcode backlash.

### 3.6 What is commoditised

**[A]** These no longer differentiate anyone, so they should be done well and cheaply, but never pitched as the reason to switch.

- **Gym side:**
  - Member records, plans and expiry.
  - Renewal reminders over WhatsApp or SMS.
  - GST invoices.
  - QR and biometric attendance.
  - Enquiry tracking.
  - Basic reports.
  - Staff roles.
  - Diet and workout PDFs.
  - A branded app shell.
  - An "AI assistant" front desk (fast becoming table stakes globally: Mindbody, PushPress, ClubRight, TeamUp).
- **Consumer side:**
  - Set logging, PR and e1RM charts, timers.
  - Programme libraries (11,000 free on Boostcamp).
  - Barcode scanning.
  - AI photo calorie logging (now "table stakes" [D §3][D]).
  - Share cards, CSV export, Apple Health sync.
  - Generic AI workout plans, which ChatGPT writes passably for free.

### 3.7 Where the market is heading (2025–2026)

1. **Consolidation reaching India.** Playlist + EGYM ($7.5B), ABC's roll-up, and Daxko buying FitnessForce (Jun 2026). Chains will be fought over by well-funded global players. **[A]** Independents will not, because they are too small for those players' sales models.
2. **Embedded payments are the real business model in the West.** ABC $8.8B processed, Xplor $47B, PushPress. **[F]** India's UPI economics blunt this [F §4][F].
3. **AI front desks and AI retention agents** (Keepme, Mindbody AI Concierge). **[A]** In India the same job is done by a WhatsApp bot that answers "what's my due date?".
4. **Corporate and insurer B2B2C** (Wellpass, FITPASS corporate, ABHI Activ Health).
5. **Consumer apps moving towards medicine.** Healthify and Noom are pivoting to GLP-1 programmes. **[A]** This leaves the *training* half of body recomposition less served in India.
6. **Lifting is growing on Strava.** Gen Z is twice as likely as Gen X to call weight training their main sport [D §2][D]. **[A]** Demand for strength-training identity exists; nobody owns it at the level of the gym.


---

## 4. The market gap

The question is not "what features are missing". It is: **which problems persist, and why the existing products have not solved them.** A gap is only worth building for if its cause is something we can change. Each gap below covers what the evidence shows, why the gap exists, why the incumbents haven't closed it, and what that means for us.

### 4.1 Gym-owner side

**O1 · Retention is reported, not acted on.** *The biggest owner-side gap.*

- **Evidence.** These predict whether a member stays:
  - Four or more visits in the first month: such members stay at least 13 weeks longer.
  - Staff interactions: one a month lifts the odds of the member still using the club the next month by 20%; four lifts them by 80%.
  - A friend at the gym: 40% fewer cancellations.
  - 63% of new members stop attending before their third month.
  - **38% of dropouts return within 12 months, and more than half of those within the first month** [F] [C §5][C].
- **What Indian software offers instead.** Expiry lists and reminders [A §1][A].
- **Why the gap exists.**
  - A ₹2,500-a-year product cannot afford retention depth.
  - The vendor sees only fees and door swipes, not what members do.
  - Owners have no staff time for proactive calls.
  - Nobody shows the owner what retention is worth in rupees.
- **Why incumbents haven't closed it.**
  - Retention tools such as Keepme or ABC's analytics are priced for chains and quote-based.
  - Indian vendors compete on checklists and price.
  - No gym product holds *activity* data (workouts, nutrition, progress), which signals disengagement weeks before a missed renewal.
- **For us [A].** A daily **"today's five calls" list** built from the science, with a pre-written WhatsApp message for each call. Activity data from FitLog gives us earlier and better signals than anyone else has.

**O2 · Collecting fees and dues in a cash-and-UPI world.**

- **Evidence.**
  - Part payments, disputed instalments and "how many members have paid" dominate owner reviews [U] [A §2, §4][A].
  - UPI Autopay is now practical: under RBI's 2026 e-mandate framework, debits up to ₹15,000 need no extra authentication [F] [F §4][F].
- **Why the gap exists.**
  - Annual prepayment is the culture.
  - Small gyms avoid gateway fees by using a free static QR code, so payment is never linked to the member record and reconciliation is manual.
  - Onboarding each gym to a payment gateway (KYC, turnover thresholds) is real friction.
- **Why incumbents haven't closed it.** Vendors send reminders; they don't own the payment moment.
- **For us [A].**
  - **MVP:** the renewal reminder carries the amount, the due date and the member's progress (§5 C3), and payments are recorded in one tap.
  - **Phase 2:** UPI intent links and Autopay through a licensed payment aggregator, with money settling straight to the gym.

**O3 · A member channel that members actually use.**

- **Evidence.** Member apps have 100–500 installs, and one vendor sells "no app download required" [A §2][A]. Planet Fitness reached 40–60% because its app is the key [C §4][C].
- **Why the gap exists.** A gym app that only shows fee status gives a member no reason to install it.
- **Why incumbents haven't closed it.**
  - A consumer-grade app costs crores to build, which is beyond ₹2,500-a-year vendors.
  - Consumer apps like Hevy and Healthify have no reason to integrate with 37,000 small gyms one at a time.
- **For us [A].** This gap is our *asset*. FitLog is already the consumer-grade half. The integration makes it the member's card.

**O4 · Trainer workflow and accountability for personal training.**

- **Evidence.**
  - PT is 14% of revenue, heading for 20%; Cult's PT revenue grew 73% [E/F].
  - Owners complain there is "no trainer field" and they have to "manually count sessions" [U] [A §4][A].
  - Plans and diet charts travel as paper, PDFs or WhatsApp [U] [B §2][B].
- **Why the gap exists.**
  - Gym software is built for the front desk.
  - Floor trainers are low-paid, change jobs often, and aren't software users.
  - The owner cannot see what trainers deliver.
- **Why incumbents haven't closed it.**
  - Trainer platforms (Hevy Coach, Trainerize, TrueCoach) sell to *independent online coaches* in dollars.
  - Indian gym software records PT as a payment, not as sessions and outcomes.
- **For us [A].**
  - A trainer view where a plan is assigned in two taps.
  - The member's logged sessions show up automatically.
  - Owners see a trainer table: sessions delivered, client attendance, PT renewals.

**O5 · Not knowing why members leave, and not getting them back.**

- **Evidence.**
  - 32% of leavers call it a "temporary break" and 48% would rejoin [E] [B §2][B].
  - Most returns happen within a month [F] [C §5][C].
- **Why the gap exists.**
  - Members go silent rather than cancel.
  - The relationship ends when the membership expires.
- **Why incumbents haven't closed it.** The gym app dies with the membership, so no one keeps a channel open.
- **For us [A].**
  - The member keeps FitLog after their membership expires, because it is their own app.
  - The gym gets a structured exit reason (one WhatsApp quick reply) and a **first right to win the member back** (§6.7).

**O6 · Following up on enquiries and converting trials.**

- **Evidence.** Enquiry tracking exists but is commoditised [A §1][A]. Gyms are found through Google Maps "gym near me" and reviews.
- **Why the gap exists.** Enquiries arrive by walk-in, phone call, Instagram DM and Google, and nobody follows up quickly.
- **For us [A].** Phase 2, not a wedge.

**O7 · A vendor they can trust.**

- **Evidence.** Support failures, renewal price hikes and data roadblocks are the commonest complaints in both India and the West [U] [A §4][A], [C §3][C].
- **Why the gap exists.** Low revenue per gym leads to low support spend; vendors then use lock-in to recover their costs.
- **For us [A].** Support in Hindi and English over WhatsApp, free export at any time, and published pricing commitments. This is a positioning gap, and it is only credible if our cost to serve allows it (§7.3).

**O8 · Owners of 2–5 branches.**

- **Evidence.** Chains use FitnessForce (now Daxko) and its peers. Small multi-branch owners make do with per-branch apps.
- **For us [A].** A real but secondary gap, for Phase 2.

**O9 · Reconciling aggregator payouts** (cultpass PRO, FITPASS).

- **Evidence.** Payout delays and disputes [U] [A §4][A].
- **For us [A].** Niche, for Phase 3.

**O10 · Marketing the gym locally.**

- **Evidence.** "Gym near me" searches and Google reviews drive discovery (vendor guides; directional).
- **Why the gap exists.** Owners lack a steady flow of happy members' reviews and member-made content.
- **For us [A].**
  - Share cards carry the gym's name.
  - Review prompts go to *every* member at milestones. Google prohibits "review gating", meaning asking only happy customers, so prompts must not be filtered by sentiment.
  - Phase 2.

### 4.2 Gym-member side

**M1 · "What do I do today?"**

- **Evidence.**
  - Most members follow a trainer's routine or improvise [A §2][A].
  - Consumer apps assume you are self-directed. Fitbod's AI plan draws "the algorithm is broken" complaints [U] [D §1][D].
  - ChatGPT writes generic plans for free [D §3][D].
- **Why the gap exists.** The trainer's plan lives on paper. The logging app doesn't know the trainer exists.
- **Why incumbents haven't closed it.** It needs the gym, the trainer and a fast logger in *one* system. Nobody has all three.
- **For us [A].** "Today's workout from your trainer", one tap into the existing logger. The *trainer* is the plan's source of authority, not an AI.

**M2 · "Is my training working?"**

- **Evidence.** Members join mostly for appearance (54%) [B §2][B]. e1RM charts mean nothing to a beginner.
- **Why the gap exists.** Apps show raw data, not what it means.
- **For us [A].** FitLog already computes PRs, volume and adherence. Add a weekly **"one thing that improved"** card in plain language, plus trainer-recorded measurements that members trust more than self-taped ones.

**M3 · Accurate logging of Indian food.**

- **Evidence.**
  - Crowd-sourced entries for one dish range from 95 to 420 kcal [U].
  - In a preliminary 2026 NIH study (not yet peer-reviewed), all four photo apps tested underestimated calories by about a third, with errors worst for high-fat meals [F].
  - In Li et al. 2024, calorie estimates for mixed and culturally diverse dishes ranged from −76% to +270% [F].
  - Healthify, the strongest Indian database, sits behind a hard sell [U] [D §3][D], [B §4][B].
- **Why the gap exists.**
  - Indian meals are mixed dishes measured in katoris and roti counts, not grams.
  - Global databases are Western and crowd-sourced.
  - AI photo estimates of oil and ghee are blind guesses.
- **Why incumbents haven't closed it.**
  - It needs a curated Indian catalog *and* a review step that honestly shows uncertainty.
  - "Snap and done" sells better than "snap and check".
- **For us [A].** FitLog already has the review step and "only confirmed values count" (D5). The gap is breadth (138 dishes) and household portion units.

**M4 · Consistency and accountability.**

- **Evidence.**
  - The strongest predictors of staying are real-world: friends and staff contact [C §5][C].
  - Social features in apps show no significant effect on activity in a systematic review.
  - Competition outlasts support and collaboration (STEP UP trial).
  - Gamification effects fade about 14 weeks after an intervention ends [F] [D §4][D].
- **Why the gap exists.** Consumer apps' social graphs are online strangers or distant friends. Gym apps have no social layer.
- **For us [A].**
  - Accountability tied to *the gym people actually walk into*: monthly gym challenges, leagues matched by level, buddy streaks.
  - The trainer noticing when a member skips.
  - Recurring *events* rather than permanent feeds, because event formats are what renew the effect.

**M5 · Continuity through breaks and home workouts.**

- **Evidence.** 32% of leavers move to home workouts and 32% take a break [E] [B §2][B].
- **Why the gap exists.** The gym relationship and the app relationship end together.
- **For us [A].** FitLog continues without a gym: "break mode" with home routines, and the streak kept alive. When the member is ready to return, their old gym gets the first chance.

**M6 · Portable history across gyms and apps.**

- **Evidence.**
  - Import is now a competitive weapon among lifting apps ("switching costs you nothing").
  - Lifters log in Strong or Hevy even when they own a Garmin.
  - No study quantifies how much people value their history [D §6][D].
- **Why the gap exists.** Gym apps are siloed, and platforms fight over data (Strava's 2024 API cut-off; the Strava–Garmin suit).
- **For us [A].** Real but modest. Assessed in §9.

**M7 · Trust in pricing and membership terms.**

- **Evidence.** No-refund policies, auto-renewals and hard-sell complaints at Cult, FITPASS, Healthify and Fitbod [U].
- **For us [A].**
  - The member sees their own plan, dues, receipts and freeze status. That transparency also protects the owner from disputes.
  - Our own Premium tier must not use dark patterns.

**M8 · Finding gyms and trainers.**

- **Evidence.** Served by Google Maps and Cult.
- **For us [A].** A low-priority gap, and one that carries channel conflict (§6.7). Phase 3.

### 4.3 Where the gaps overlap: the strategic insight

**[A]** O1, O3, O4, O5, M1, M4 and M5 are **one gap seen from two sides**. The gym and the member have no shared system for the work they do together:
- assigning and following a plan;
- showing up;
- noticing who is drifting;
- celebrating progress;
- renewing.

The gym software doesn't know what the member does on the gym floor. The member's app (if any) doesn't know the gym exists. Closing that gap is what a B2B2C product can do and neither a pure SaaS nor a pure consumer app can. **It is also where FitLog's existing build is most valuable.**


---

## 5. Features that could make the product stand out

### How to read this section

- **Complexity** is for this codebase and team:
  - **S**: up to 2 developer-weeks.
  - **M**: 2–6 weeks.
  - **L**: 6–12 weeks.
  - **XL**: more than a quarter, or dependent on a regulated partner.
- **Value** is business value: how much the feature moves gym adoption, member activation, retention or revenue.
- **Phases** match §10.
- **Major features** get a full card. Smaller ones are in a table after each group.
- **[A]** Everything in this section is our analysis, built on the evidence cited in §3 and §4.

### A. Gym-owner platform

#### A1 · Ten-minute setup and member import — MVP · M · Value: High

- **Problem.** Switching means re-typing 200–400 members from a register or Excel. That friction kills adoption before any feature is seen.
- **Who benefits, and why they'd use it.** The owner and front desk. Import from Excel/CSV, from phone contacts, or from **a photo of the paper register** (Phase 2; see E1). Our onboarding rep does it on the first visit, typing a paper register by hand until E1 ships.
- **Why competitors haven't solved it.** Only Gymzee advertises Excel import [A §1][A]. Nobody reads paper registers, because it needs a vision model, and our AI pipeline (D25) already exists.
- **Business value.** It removes the top switching cost and lets sales close in one visit.

#### A2 · Memberships, dues and receipts ledger — MVP · M · Value: High (but commoditised)

- **Problem.** Plans (monthly to annual), part payments, dues, freezes, admission fees, GST invoices, cash or UPI.
- **Who benefits.** The owner and front desk, every day.
- **Why competitors haven't solved it.** They have. It is table stakes, so it must simply be *better*:
  - one-tap "mark paid (cash/UPI)";
  - an automatic receipt to the member over WhatsApp and in-app;
  - dues ageing.
- **Business value.** Without it nobody switches. It also creates the payment records the Phase 2 payments business needs.

#### A3 · Renewal and dues engine — MVP · M · Value: Highest

- **Problem.** Money leaks through late renewals and forgotten dues.
- **How it works.**
  - Automatic WhatsApp utility reminders before and on the due date (≈₹0.12–0.16 each [F §3][F]), from the gym's name.
  - The member's in-app card shows the dues.
  - One-tap reconciliation when paid.
  - Each reminder includes the member's own progress (C3).
- **Why competitors haven't solved it.** They send reminders, but none can include *progress*, because none has activity data.
- **Business value.** Fastest proof of value ("₹X collected this month that was overdue"). It is also the natural home of Phase 2 payment links.

#### A4 · Check-in without a gate: self check-in, imports, manual marking — MVP · M · Value: High

> **Revised (§15.1).** Value gyms have no receptionist or automated entry, so the app is not an entry checkpoint. The first version's rotating-QR desk screen is dropped.

- **Problem.** Attendance is the owner's main signal, and the member's reason to open the app.
- **How it works.**
  - **Self check-in poster:** the member scans the gym's printed QR poster in FitLog. With permission, a location check (~150 m) verifies it; without one, the visit is recorded as "unverified". No staff or hardware needed.
  - **A workout logged at the gym** counts as a visit.
  - **Existing eSSL or ZKTeco readers:** attendance exported to Excel and uploaded (by hand in the pilot, automatically in Phase 2). Gyms then don't have to throw away hardware they paid ₹4–15k for [A §2][A].
  - **No smartphone:** the owner or trainer marks the visit in one tap.
- **Why competitors haven't solved it.** QR and biometric attendance are commoditised. Without a gate we cannot use the Planet Fitness mechanism (the app as the key, behind its 40–60% adoption [C §4][C]). Scanning has to be worth it to the member: only recorded visits count for streaks, challenges and the leaderboard.
- **Business value.** Attendance feeds the absence alerts (A5, §15.4). Because it is now partial, the alerts carry a data-quality rule.

#### A5 · Retention cockpit: "today's five calls" — MVP (rule-based) · Phase 2 (scored) · M · Value: Highest (the differentiator)

- **Problem.** Owners know members leave. They don't know *who* to call *today*, or what to say.
- **How it works.** A daily ranked list built from the retention evidence [C §5][C]:
  1. New members under 4 visits in their first 30 days.
  2. Regulars silent for 10+ days.
  3. Renewals due within 10 days with low recent attendance.
  4. Lapsed members inside the first month after expiry, when most returns happen.
  5. "Praise" moments: a PR, a 30-day streak, a measurement milestone. Staff contact is protective, and a positive contact is easy to make.
  - Each item comes with a pre-written Hinglish or English WhatsApp message, opened in the owner's own WhatsApp (click-to-chat costs nothing).
  - Each call is marked done, and we track outcomes.
- **Why competitors haven't solved it.**
  - Indian vendors stop at expiry lists.
  - Western retention tools are enterprise-priced.
  - **Nobody else has workout and nutrition activity to see drift early.**
- **Business value.** This is the reason an owner keeps opening our product after setup, and the reason they *want* members on the app: more members on the app means better signals. It is also the core of the paid tier (§7).

#### A6 · Trainer workspace — MVP (basic) · Phase 2 (PT packs, performance) · M→L · Value: High

- **Problem.**
  - Plans are on paper.
  - PT sessions are counted by hand.
  - Owners can't see what trainers deliver.
  - Trainers can't see whether clients train.
- **How it works.**
  - **MVP:** the trainer's member list, assign a plan in two taps (from FitLog's program builder), see each client's logged sessions and attendance, and record measurements.
  - **Phase 2:** PT packs with sessions-left counters, trainer performance for the owner (sessions, client attendance, PT renewals), and trainer notes.
- **Why competitors haven't solved it.** Trainer platforms sell to online coaches in dollars. Gym software treats PT as an invoice line [A §4][A].
- **Business value.**
  - The trainer is the person who gets members to install: "your plan is in the app".
  - PT is the fastest-growing revenue line in Indian gyms.
  - Trainers who are happy with the app carry it to their next gym (§11.5, §11.8).

#### A7 · Online collection through a licensed payment aggregator — Phase 2 · XL (partner and compliance) · Value: High (revenue)

- **Problem.** Static UPI QR payments don't reconcile, and annual prepayment is a big ask for members.
- **How it works.**
  - Each gym is onboarded as its own sub-merchant with a licensed aggregator (Razorpay, Cashfree or PhonePe), so money settles directly to the gym.
  - We never hold funds. That avoids needing our own aggregator licence and marketplace tax duties [F §4][F].
  - Products: UPI intent links in reminders, **UPI Autopay for monthly plans** (no extra authentication up to ₹15,000), and card and EMI options for annual plans.
- **Why competitors haven't solved it.** Onboarding friction, and small gyms resist fees.
- **Business value.**
  - A partner revenue share and an optional convenience fee (§7).
  - Recurring billing may also improve retention, though Western evidence conflicts on this [C §5][C].

#### Smaller owner features

| Feature | Phase | Size | Value | Note |
|---|---|---|---|---|
| Staff roles (owner, manager, front desk, trainer) | MVP | S | Med | Needed for consent boundaries |
| Core reports: collections, dues, active members, renewal rate, peak hours | MVP | S–M | Med | Commoditised; keep simple |
| Data export and a written no-lock-in guarantee | MVP | S | High (trust) | Answers the commonest complaint about Western vendors [C §3][C] |
| Exit reason by WhatsApp quick reply on non-renewal | MVP | S | Med | Feeds O5 |
| First-month cohort report ("of 40 who joined in July, 22 still active") | Phase 2 | M | High | Makes retention visible in rupees |
| Enquiries and trial passes, with fast WhatsApp follow-up and referral attribution | Phase 2 | M | Med | |
| Web console and multi-branch | Phase 2 | L | Med | For front desks and 2–5-branch owners |
| Google-review and content prompts (no gating) | Phase 2 | S | Med | Local discovery for the gym |
| Supplement and store inventory | Phase 3 | M | Low–Med | Owners say they'd pay for it [A §4][A] |
| Aggregator payout reconciliation (cultpass PRO, FITPASS) | Phase 3 | M | Low | Niche |

### B. Gym-member app (FitLog)

#### B1 · The gym card — MVP · M · Value: Highest (the install reason)

- **Problem.** Members want to know "how many days left, what do I owe, where's my receipt", and today they must ask the desk.
- **How it works.** A card on the FitLog dashboard showing:
  - membership status and days left;
  - dues and the payment link (Phase 2);
  - receipts and a freeze request;
  - the **check-in QR scanner**;
  - the gym's current challenge.
- **Why competitors haven't solved it.** Gym member apps do this but nothing else, so they go uninstalled [A §2][A]. FitLog has the "everything else".
- **Business value.** It turns an optional app into the way you use your gym.

#### B2 · Phone-first join with no forms — MVP · M · Value: Highest

- **Problem.** Each sign-up step loses members. Indian gyms know members by phone number, not email.
- **How it works.**
  1. The gym's WhatsApp invite, QR poster or front-desk prompt opens a link.
  2. The member installs and signs in with phone OTP (WhatsApp or SMS).
  3. The account is **already linked** to their membership, with name, plan and expiry pre-filled.
  4. The member gives *their own* consent to FitLog's features (C2).
  5. Onboarding questions are deferred; the goal can come from the trainer.
- **Why competitors haven't solved it.** Consumer apps don't have the gym's member record; gym apps don't care about activation.
- **Business value.** Activation rate is the number the whole thesis depends on (§14).

#### B3 · "Today's workout from your trainer" — MVP · S–M · Value: High

- **Problem.** A beginner doesn't know what to do, and the plan is on paper.
- **How it works.** One tap from the dashboard into the existing logger with the assigned plan pre-loaded. Previous performance shows automatically (built). The trainer sees completion.
- **Why competitors haven't solved it.** It needs a trainer-to-member link *and* a fast logger (§4.2 M1).
- **Business value.** The daily-use hook that keeps members after the novelty of the card wears off.

#### B4 · Indian-first nutrition — MVP (catalog) · Phase 2 (portion memory) · M · Value: High

- **Problem.** Indian home food is badly served (§4.2 M3).
- **How it works.**
  - Grow the Indian catalog well beyond 138 dishes, with regional recipes valued from public-domain USDA ingredients, as the existing dishes are. IFCT 2017 can't be shipped without a licence from NIN ([data-sources.md](../data-sources.md)).
  - Add household units (katori, roti, piece, glass, ladle) and Hinglish search ("dal chawal", "paneer bhurji").
  - Keep the honest review step and the confidence display (built).
  - **Phase 2:** remember each member's portions ("your katori ≈ 150 g").
- **Why competitors haven't solved it.** Global apps are Western and crowd-sourced. Healthify is strong but gated behind sales calls [B §1.6][B].
- **Business value.** The second daily habit, and the core of member Premium (§7).

#### B5 · Weekly "one thing that improved" — MVP (light) · S · Value: Med–High

- **Problem.** Beginners can't read e1RM charts and quit when they feel no progress.
- **How it works.** A Sunday card in plain language: "Squat +7.5 kg since joining", "4 visits this week, your best month", "Protein on target 5 of 7 days". It is generated from existing analytics and can be shared (§8).
- **Why competitors haven't solved it.** Apps show raw data, not meaning.
- **Business value.** Retention, sharing, and material for renewal messages (C3).

#### B6 · Break mode — Phase 2 · S–M · Value: Med

- **Problem.** A third of leavers move to home workouts or take a break [B §2][B].
- **How it works.**
  - When a membership lapses, or the member says they're travelling, FitLog switches to home routines.
  - Streaks pause instead of breaking.
  - The original gym can send one win-back offer (§6.7).
- **Business value.** Keeps the consumer relationship (T6) and gives owners a win-back channel.

#### Smaller member features

| Feature | Phase | Size | Value | Note |
|---|---|---|---|---|
| Weekly attendance streak with a freeze (weeks, not days) | MVP | S | Med | Duolingo-style; weekly fits 3×/week training [D §4][D] |
| Hindi/Hinglish UI and exercise aliases | MVP | M | High | §1.2 |
| Imports from Strong, Hevy and MyFitnessPal; Health Connect / Apple Health | Built | — | High | Answers "I already use another app" |
| Member Premium (unlimited AI nutrition, deeper analytics, progression suggestions) | Phase 2 | M | High (revenue) | §7 |
| Barcode scanning for packaged foods and supplements | Phase 2 | M | Med | Launch-plan L5 |
| Gym and trainer discovery | Phase 3 | L | Med | Only with the owner-safe rules in §6.7 |

### C. Shared B2B2C features (one system, two beneficiaries)

#### C1 · The plan loop: assign → log → see → adjust — MVP · M · Value: Highest

- **Problem.** Trainer and member work on the same goal with no shared record.
- **How it works.**
  1. The trainer assigns a plan (A6).
  2. The member logs it (B3).
  3. The trainer sees adherence and loads.
  4. The trainer adjusts.
  5. The owner sees which trainers' clients show up.
- **Why competitors haven't solved it.** It needs three roles and one data model. FitLog's planned-vs-performed separation (built) is exactly that model.
- **Business value.** It creates the *within-gym network*: every trainer and member who joins makes it more useful to the others. It is the strongest network effect we can actually get (§12).

#### C2 · Consent and sharing panel controlled by the member — MVP · M · Value: Highest (trust and compliance)

- **Problem.** Members fear the gym seeing their weight, food or photos. The gym needs attendance. The law needs specific consent per purpose [F §1][F].
- **How it works.** Per-purpose switches the member controls:

  | Data | Default | Note |
  |---|---|---|
  | Attendance | Always shared with the gym | It is the gym's own data |
  | Workouts | On for the assigned trainer | Member can switch off |
  | Measurements | On for the assigned trainer | Member can switch off |
  | Nutrition | Off | Opt-in |
  | Photos | Never | Unless shared explicitly |

  - Everything is revocable, versioned, logged, and visible in Settings.
- **Why competitors haven't solved it.** Gym software is built for the gym. Consumer apps don't share at all.
- **Business value.** Without this, the B2B2C model fails on privacy (§13 R9). With it, "your data is yours" becomes a selling point to members.

#### C3 · Renewal backed by progress — MVP · S · Value: High [H]

- **Problem.** Renewal messages are bare invoices.
- **How it works.** The reminder reads "Renew by 12 Oct · since joining: 38 visits, squat 40 → 60 kg, waist −4 cm", using only data the member has shared with the gym.
- **Why competitors haven't solved it.** Nobody has the progress data.
- **Business value.** [H] Renewal rates rise when progress is visible. This is cheap to build and directly testable in the pilot (§14.7).

#### C4 · Assessment day — Phase 2 (the MVP covers only trainer-recorded measurements, in A6) · M · Value: Med–High

- **How it works.**
  1. At joining and every 4–8 weeks, the trainer records weight, measurements and baseline lifts in FitLog's body tracking (built).
  2. The member sees trusted before-and-after numbers.
  3. The owner sees outcomes by trainer.
- **Business value.** Creates "progress moments" for sharing and renewals, and a reason for staff to interact with members (retention).

#### C5 · Member referral funded by the gym — MVP (link and attribution) · Phase 2 (automated rewards) · S · Value: High

- **Problem.** Gyms already rely on word of mouth; 39% of Cult's new members come from referrals [B §1.1][B].
- **How it works.**
  - The member shares a personal link or card.
  - The friend gets a trial pass; the member gets extra days.
  - The gym funds the reward. Extra days cost the owner almost nothing at the margin.
- **Business value.** The growth loop that brings *new* people into both the gym and FitLog (§8).

| Smaller shared features | Phase | Size | Value |
|---|---|---|---|
| Gym announcements and class schedule | Phase 2 | S | Med |
| PT session booking and packs, visible to member and trainer | Phase 2 | M | Med–High |
| Freeze and pause requests handled in-app | MVP | S | Med |

### D. Network features (more valuable as gyms and members join)

**[A]** Be precise about which network a feature uses:
- **Within one gym** (members, trainers, owner): this network exists from the first gym.
- **Across gyms in one city:** needs density.
- **Across the platform:** needs scale.

#### D1 · Gym challenges and leagues — MVP (attendance challenge) · Phase 2 (richer) · M · Network: within the gym · Value: High

- **How it works.**
  - Monthly challenges set by the owner from templates: "12 visits in October", "most volume", "best squat as a multiple of bodyweight".
  - Leagues matched by experience level, so beginners compete with beginners. Duolingo's engagement-matched leaderboards raised learning time 17% [D §4][D].
  - Prizes come from the gym: merchandise, free days.
- **Why use it.** Competition was the only social format with a lasting effect in the STEP UP trial [D §4][D]. Venue-anchored competition is what Hyrox and Orangetheory build community on [D §5][D].
- **Why competitors haven't solved it.** Gym apps have no logger. Consumer apps have no gym.

#### D2 · Gym-floor screen — Phase 2 · S · Network: within the gym · Value: Med–High

- **How it works.** A web page for the TV most Indian gyms already have: challenge leaderboard, today's PRs, birthdays, new members.
- **Why use it.** Public recognition in the room, which is the Orangetheory "Splat Points" mechanism. It is also a constant advert for installing the app: you're not on the board unless you log.

#### D3 · Fitness passport (history that moves with the member) — Phase 2 · M · Network: across gyms · Value: Med

- **How it works.** When a member joins a *new* FitLog gym, they can share their history with the new trainer: lifts, measurements, injuries noted, attendance consistency. It is their data and their choice.
- **Assessment.** See §9. Valuable to engaged members; becomes a network effect only once there is gym density.

#### D4 · City events and inter-gym challenges — Phase 3 · M · Network: across gyms in a city · Value: Med–High

- **How it works.** "Pune October Challenge": gym vs gym, normalised per member, with a public city leaderboard.
- **Why use it.** Owners get local marketing; members get identity ("my gym"). Hyrox's growth shows how events spread through gyms [D §5][D].
- **Precondition.** A first pilot challenge at ~20 gyms in a city; full city events at 50+ (§6.7, Stage 3). Fewer, and it looks empty.

#### D5 · Gym discovery that owners can live with — Phase 3 · L · Network: across gyms · Value: Med

- **How it works.** "Find a gym" appears only to people with **no active membership**. Their previous gym gets a 30-day first right to win them back. **No commission on members a gym brings itself.**
- **Why so constrained.**
  - Every analog shows owner revolt over misattributed commissions (Booksy, Fresha, Mindbody) and over cannibalisation (ClassPass, Zomato Gold) [E §1][E].
  - Cult already offers owners demand *plus* software [A §1][A]. Our edge is neutrality.

#### D6 · Verified-activity partnerships (insurers, employers) — Phase 3 · XL · Network: platform · Value: High (revenue)

- **How it works.** Members opt in to share *verified* gym attendance (location-checked check-ins, biometric imports, trainer-attested sessions) with their insurer's wellness programme or their employer's benefit.
- **Why it's real.** Aditya Birla Health Insurance already returns up to 100% of premium for Active Days earned by partner-gym check-ins (§3.3 i). EGYM Wellpass has 20k employer partners [C §1][C].
- **Precondition.** Scale (tens of thousands of verified members), plus a consent design that survives DPDP scrutiny.

#### D7 · Benchmarks for owners — Phase 3 · M · Network: platform data · Value: Med

- **How it works.** "Your first-month retention: 54%; similar gyms in your city: 61%".
- **Caution.** Aggregation across gyms could make us a *joint data fiduciary* [F §1][F]. Data network effects are weak [E §5][E]. Useful, but not a moat.

### E. AI features that do real work

**[A]** The test is whether the AI removes real effort or catches something a human misses, *with a human checking where errors are costly*. Generic AI workout plans fail this test: ChatGPT gives them away for free, and AI-powered subscription apps (all categories, per RevenueCat) churn 30% faster [D §3][D].

> **Revised (§15.2).** Every feature below is **Pro**, except the register reader (E1), which stays free because it helps win the gym. Pro also adds AI workout logging by text and voice (video later) and a weekly AI analytics agent. AI calling for owners is Pro, priced by usage (§15.4).

| # | Feature | Real problem | Why it's not a gimmick | Phase | Size |
|---|---|---|---|---|---|
| **E1** | **Register reader**: photo of a paper register or Excel → structured member list for the owner to confirm | Switching cost (A1) | Replaces hours of typing; the owner checks every row | Phase 2 (our team types registers by hand at MVP) | M |
| **E2** | **Honest Indian food AI**: existing photo and text analysis plus Indian portion units, an uncertainty display, and **per-member portion memory** | §4.2 M3 | The preliminary NIH study suggests unchecked AI misses about a third of calories; our design keeps a human confirm step and learns from corrections | MVP (units) / Phase 2 (memory) | M |
| **E3** | **Why-this-member + next message**: ranked churn risk with a *reason* ("attendance down 60% since PT ended") and a drafted Hinglish WhatsApp | O1 | Rules first (MVP A5), then learned once there's outcome data; owner sends the message | Phase 2 | M–L |
| **E4** | **Trainer plan copilot**: draft a plan from the member's goal, history, injuries and the gym's equipment; the trainer edits and approves | O4, M1 | The trainer stays the authority; AI saves drafting time | Phase 2 | M |
| **E5** | **Diet-chart digitiser**: photo of a trainer's handwritten or PDF diet chart → structured meal plan and targets in FitLog | Diet charts live on paper and WhatsApp [B §2][B] | Turns an existing artefact into trackable targets | Phase 2 | M |
| **E6** | **Next-set progression**: suggested load and reps from the member's own history | PRD Phase 2 item | Users rate history-based suggestions useful (Alpha Progression, Fitbod at its best) [D §3][D] | Phase 2 | M |
| **E7** | **WhatsApp assistant**: members ask "kitne din bache hain?" ("how many days are left?"), owners ask "who hasn't paid?" | Front-desk load | Answers from our own data, not open-ended advice | Phase 2–3 | M–L |
| **E8** | **Weekly narrative**: B5 written in natural language, in Hindi or English | M2 | Summarises the member's own data; no advice | Phase 2 | S |

**AI we should not build, or not yet:**

- **A chat "AI coach" as the headline feature.** Commoditised, and carries medical-advice risk (PRD guardrail).
- **Body-fat estimates from photos.** Accuracy and privacy risk with progress photos.
- **Camera form-checking.** Complex, liability-prone, and adds nothing to the gym loop.
- **Fully automatic plans for gym members without a trainer in the loop.** It competes with the gym's own trainers, the channel we depend on.


---

## 6. The gym owner → member acquisition loop

### 6.1 The loop, with the number to watch at each step

```
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 1 GYM JOINS (free)        rep visits, imports members from register/Excel (A1)   │
 │     metric: gyms live within 7 days of signing                                   │
 └───────────────┬──────────────────────────────────────────────────────────────────┘
                 ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 2 MEMBERS INVITED         WhatsApp in the gym's name · QR at the desk ·          │
 │                           trainer says "your plan is in the app" · new joiners   │
 │                           onboarded at the counter                               │
 │     metric: % of ACTIVE members who install and link (target ≥40% by day 60)     │
 └───────────────┬──────────────────────────────────────────────────────────────────┘
                 ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 3 MEMBERS USE IT          check-in pass · dues/receipts · today's plan · food log│
 │     metric: weekly active / linked (target ≥50%); app check-ins / all check-ins  │
 └───────────────┬──────────────────────────────────────────────────────────────────┘
                 ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 4 ENGAGEMENT → GYM VALUE  "today's 5 calls" · renewals backed by progress ·      │
 │                           trainer sees adherence · challenges fill the gym       │
 │     metric: renewal rate and first-month visits vs the gym's own baseline        │
 └───────────────┬──────────────────────────────────────────────────────────────────┘
                 ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 5 GYM PUSHES HARDER       every new joiner onboarded in-app · challenges ·       │
 │                           gym-floor screen · gym-funded referrals                │
 │     metric: % of new joiners activated within 7 days (target ≥70%)               │
 └───────────────┬──────────────────────────────────────────────────────────────────┘
                 ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 6 MEMBERS SPREAD IT       share cards tagged with the gym · referrals · trainers │
 │                           moving gyms · owners talking to owners                 │
 │     metric: referred joiners per gym per month; gyms acquired via referral       │
 └───────────────┬──────────────────────────────────────────────────────────────────┘
                 └──────────► back to 1 (more gyms) and to 2 (more members per gym)
```

**[A]** The loop has two engines, and they are not equally strong:

- **Steps 2→5, inside one gym.** This engine is reinforced by the retention science and the Planet Fitness adoption evidence. It is the one to build first.
- **Step 6, across gyms.** This engine depends on owners referring owners and trainers moving between gyms. It is plausible but unproven ([H]), and the analog cases say it is slow [E §2][E].

### 6.2 How to make gym owners actively push the app

**[A]** The rule: **the owner should benefit in proportion to how many members are on the app**, and should see that in rupees.

| Lever | Mechanism | Why it works |
|---|---|---|
| **Make the app the workflow** | New joiners are onboarded at joining by scanning a QR code. Receipts, renewal notices, the trainer's plan and self check-in all live in the app. | No separate "please download our app" request, which is what failed for GymBook and DGymbook [A §2][A]. |
| **Show coverage as a gym health score** | "62% of your active members are on FitLog. Gyms above 50% collect dues 9 days faster" (once we have the data, [H]) | Owners respond to a number tied to money. |
| **Make the retention list better with coverage** | The "today's five calls" list is visibly richer for members on the app | Self-interest: more members on the app means better signals. |
| **Arm the trainers** | Trainers assign plans in the app. The owner's trainer table shows client activation. | Trainers are the people members listen to on the floor. |
| **Give owners marketing they can't get elsewhere** | Share cards carry the gym's name. The challenge leaderboard on the gym TV. Milestone review prompts. | Local discovery is the owner's growth channel. |
| **Tie paid features to coverage** | e.g. 3 months of Pro free when coverage passes 50% | Aligns our goal with theirs, at low cost to us. |
| **Pitch renewals, not "engagement"** | "Collect more renewals, keep new members past month three, get referrals" | A value gym's economics partly rely on no-shows (§3.2). Owners buy money outcomes, not "engagement". |

**Watch the WhatsApp template rules.** A utility message that carries promotion is re-classified as marketing [F §3][F]. A receipt that says "view your receipt and pass in the app" is a utility. A message that says "download FitLog, the best fitness app" is marketing. It costs 7× more, is capped per user, and may not be ours to send at all under purpose limitation (§13 R9). **[A]** Invites must be framed as the gym's service, sent in the gym's name, once.

### 6.3 Incentives for each party

| Party | Gets | Gives |
|---|---|---|
| **Owner** | Free operations software; more renewals and dues collected; the retention list; trainer visibility; local marketing; a "gym with an app" image | Time at onboarding; telling members; a little prize money for challenges |
| **Trainer** | Plans in two taps; clients' logs without asking; PT session counting; a portable professional record of clients helped (Phase 3) | Assigning plans; pointing members to the app |
| **Member** | The membership card, receipts and dues; check-in; the trainer's plan; honest Indian nutrition; progress they can see; challenges and prizes; gym-sponsored Premium | Installing, signing in with a phone OTP, and consenting to what they choose |
| **FitLog** | Members acquired at a fraction of the paid cost, if they activate (§6.8) | Free software, support, onboarding labour, AI and messaging costs |

### 6.4 Lowering onboarding friction: the channels

| Channel | Use | Friction | Notes |
|---|---|---|---|
| **Phone number as identity** | Every member record is keyed by phone; OTP sign-in auto-links the membership | Lowest | Needs phone-OTP auth (§1.1). Plan for family members sharing one phone (multiple profiles per number). |
| **QR at the counter / joining form** | New joiners scan during onboarding | Low | Gives 100% exposure to new members, the highest-intent moment |
| **Self check-in poster** | Members scan the gym's QR poster (A4); not a gate | Low after install | Weaker than a door key [C §4][C]; it works only because visits count for challenges and streaks (§15.1) |
| **WhatsApp invite in the gym's name** | One utility-framed message with a deep link | Low | One message, never repeated marketing (§6.2) |
| **Trainer during the session** | "Your plan is in the app; let me set it up" | Low (human-assisted) | Highest conversion, [H] |
| **Marked by owner or trainer** | One tap for members without the app | None | Keeps non-installers inside the gym's records |
| **Existing biometric reader** | Attendance imported (by hand in the pilot; automatic in Phase 2) | None | Owners keep their hardware, but these members never need the app, which works against our activation |
| **WhatsApp-only members** | Receipts, reminders and dues over WhatsApp, no install | None | Serves the gym fully. For us they are a *pending* user, not an active one. |

**Low-end Android is the real constraint.** Indian owners' reviews are full of crash reports on budget Oppo and Motorola phones [A §2][A]. The release APK must be measured on a ₹8–10k phone, not only the emulator and test phone used so far, and the install size kept small.

### 6.5 Members who already use other fitness apps

**[A]** Don't fight their app. Win the gym-specific jobs, and make switching free.

1. **The gym card works without logging.** A Hevy loyalist can use FitLog only for check-in and receipts. For the gym, that is still coverage.
2. **Import is built.** Strong, Hevy and MyFitnessPal CSV imports and Health Connect / Apple Health already exist. The pitch is "bring your history; your trainer can see it".
3. **The trainer link is the reason to switch logging.** A plan assigned by their trainer, with the trainer seeing their loads, is something Hevy can't do inside *this* gym. Hevy Coach targets online coaches [C §1][C].
4. **Power users are advocates, not obstacles.** They are the most likely to notice the 80.7 ms logger and the honest nutrition, and the most likely to post share cards.
5. **Phase 2:** read-only sync from other loggers' APIs where terms allow (Hevy has a public API). Strava's 2024 API restrictions are a warning not to *depend* on another platform's data [D §2][D].

### 6.6 Useful with only one gym in a city

**[A]** Everything in the MVP works at **n = 1 gym**:
- the owner tools;
- the gym card;
- the plan loop;
- gym challenges and leaderboards;
- gym-funded referrals;
- the retention list;
- FitLog's consumer features.

This is deliberate. Andrew Chen's "atomic network", "the smallest network needed that can stand on its own", is *one gym's members and trainers* [E §5][E]. A product that needed many gyms in a city before it was useful would be dead on arrival.

### 6.7 From one gym to a multi-gym network

| Stage | Threshold (guide, [H]) | What becomes possible | Owner-safety rule |
|---|---|---|---|
| **1 · Atomic** | 1 gym | Everything in the MVP | The gym's members see only their gym |
| **2 · Cluster** | 10–20 gyms in one city | Trainers carry FitLog to new gyms; fitness passport (D3); first inter-gym challenge | History moves only at the member's request |
| **3 · City** | 50+ gyms, or ~15–20% of a city's gyms | City events (D4); owner-safe discovery for people with **no** active membership (D5); verified-activity pilots with an insurer or employer (D6) | 30-day first right of win-back for the previous gym; **no commission on members a gym brings itself** |
| **4 · Platform** | Multi-city, 100k+ verified members | Benchmarks (D7); national partnerships; marketplace for coaching | Aggregated, anonymised, fiduciary-reviewed |

**The owner-safety charter.** It should be published, and written into the gym contract from day one, because it is cheaper to promise early than to repair trust later:

1. We never show another gym to a member with an active membership at yours.
2. We take no commission on members you bring, including through your own QR codes. Booksy's QR misattribution is the cautionary tale [E §1][E].
3. Your member data is yours. Export it at any time, free.
4. Inside the app, your members see your gym's name.
5. If a member leaves, we tell you, give you the tools to win them back, and show them no other gym for at least 30 days. §15.5 recommends making that permanent.

### 6.8 Is the channel actually cheaper than paid acquisition?

**[A]** Using the cost inputs in [F §6–7][F] and [B §3][B]. A 300-member gym, a ₹2,333 field-sales cost per gym, and SaaS-only serving at about ₹505 a month: the lean ₹600 core minus its ₹97 field-sales line, so sales aren't counted twice. AI and marketing WhatsApp are excluded, because they scale with usage that Premium and the gym should fund.

| | Paid installs (India H&F) | Gym channel @ 40% activation | @ 15% | @ 10% |
|---|---|---|---|---|
| Users acquired | 1 signup ≈ ₹195 (₹31/install ÷ 15.9%) | 120 per gym | 45 | 30 |
| Acquisition cost per user | ≈ ₹195 | ≈ ₹19 | ≈ ₹52 | ≈ ₹78 |
| First-year cost incl. serving the gym (₹2,333 + 12 × ₹505) | — | ≈ ₹70 | ≈ ₹187 | ≈ ₹280 |
| D30 retention | median ~5% of installs [E] [D §4][D] → **≈ ₹620 per user still active at day 30** (₹31 ÷ 5%) | [H] unknown; a door-key app is used weekly by design | | |

**[A] The verdict.** Including a year of serving the gym, the channel beats a paid *signup* (≈₹195) only above about 15% activation. Against a paid user still active at day 30 (≈₹620), it wins down to about 5%, **if** gym-linked members keep using the app. Between 5% and 15% the economics are marginal, and the thesis loses most of its point. **Activation is the number that decides the strategy** (§14).

### 6.9 Where the loop can fail, and how to prevent it

| # | Failure point | Early signal | Prevention |
|---|---|---|---|
| L1 | Owner signs up, never finishes setup | Not live 7 days after signing | White-glove setup by our rep (A1, E1); setup measured per rep |
| L2 | **Owner uses only the ledger and attendance; members never invited** | Coverage stuck under 10% | Invite built into joining, receipts and self check-in; a coverage score; absence alerts that get richer as coverage grows |
| L3 | **Members ignore the invite** | Under 15% install by day 30 | Value at the moment of invite (card, receipts, the trainer's plan); trainer-led setup; challenges that count only recorded visits |
| L4 | Members install but use it only as a door key | Weekly active of linked members under 25%; sessions under 1 minute | Plan loop (C1), weekly progress card (B5), challenges (D1). Door-key users still count for the owner. |
| L5 | **Trainers resist**: extra work, fear of exposure, fear the app replaces them | Trainers not assigning plans | Tools that save trainer time; the trainer stays the plan's authority; never sell AI plans to that gym's members; trainer performance shown positively |
| L6 | **Owner fears poaching or aggregation** | Owner objections; "Cult is safer" | The owner-safety charter (§6.7) in the contract; neutrality as a selling point |
| L7 | Gym closes or switches away | Gym churn | Members keep their FitLog accounts (T6); the gym leaves with a full export |
| L8 | **Owner sees no outcome** | No change in renewals or first-month visits after 90 days | Measure before and after in the pilot; cohort reporting; if still nothing, the paid tier will fail too (§14) |
| L9 | Costs scale faster than value | AI and WhatsApp per gym rising | Quotas; marketing broadcasts at the gym's cost; AI via Premium (§7.3) |
| L10 | Privacy complaint or regulatory action | Members asking "how did you get my number?" | Invite in the gym's name; separate member consent; data processing agreement (§13 R9) |
| L11 | A well-funded competitor bundles free software | Cult or FITPASS offering CRM to independents | Neutrality, speed in Tier-2, support quality (§12) |
| L12 | Shared phones and family members on one number | Wrong person checking in | Multiple profiles per phone number; photo on the pass |


---

## 7. The free gym-management strategy

> **Revised by §15.2–15.4.** The owner's Pro tier is **AI assistance only**, including AI calling priced by usage, and everything else is free for owners. Member Premium becomes **member Pro**, covering all AI. Ads and sponsorship come later. Marketing broadcasts become at-cost credits. Where this section differs, §15 wins.

### 7.1 Why would a gym owner switch?

**"Free" alone is a weak reason.** [A]
- The incumbent costs ₹2,000–3,000 a year (GoGym4U, GymBook) [A §1][A], so going free saves about ₹200 a month.
- Owners do get angry about a few hundred rupees, as the reaction to renewal price hikes shows [A §5][A]. That makes *free* a good door-opener, but it does not make it a reason to move 300 members.

**The real reasons, in order of strength [A][H]:**

| # | Reason to switch | Who it applies to | Strength |
|---|---|---|---|
| 1 | **"Collect more renewals and keep new members past month three"**, shown in rupees (A3, A5, C3) | Every owner | Strongest, if we can show it in the pilot |
| 2 | **"Your members will actually use this app"** (B1, B3, A4), unlike the member app no one installed | Owners who already tried a vendor app | Strong |
| 3 | **"We set it up for you in one visit"**, including the paper register (A1, E1) | Owners on registers or Excel, the majority outside the metros | Strong. The competitor here is habit, not another vendor. |
| 4 | **Trainer tools and visibility** (A6, C1) | Gyms with 2+ trainers and a PT business | Medium–strong |
| 5 | **Support that answers, in Hindi or English, and no lock-in** | Owners burned by a vendor | Medium. A trust gap, not a feature gap. |
| 6 | Free | Everyone | Weak on its own; removes an objection |

**Why an owner might not switch:**
- Inertia ("my app works").
- Fear of a new vendor disappearing.
- Fear that the platform will poach members, given Cult and the aggregators.
- Staff unwilling to learn.
- Members' reluctance to install.

The owner-safety charter (§6.7), white-glove setup, and keeping the biometric hardware they already own (A4) answer most of these.

### 7.2 What makes them stay?

[A] Switching costs build up in layers, and each one is legitimate rather than a trap:

1. **Members linked to the gym through their own phones.** Moving vendors means asking 150 members to change apps.
2. **Payment mandates** (Phase 2). Moving UPI Autopay mandates is real friction.
3. **Trainer workflows and plan libraries.**
4. **History.** Cohort reports and a member's progress only exist here.
5. **Outcomes.** The retention list visibly pays for itself.

**What we must *not* do** is add artificial lock-in such as export fees, annual contracts or price hikes. These are the top complaints about Western vendors [C §3][C], and they would break the trust positioning that is our edge against Cult (§12).

### 7.3 What it costs us to serve a gym

From the worked model in [F §7][F]: a gym of 300 members, 120 of them app users, 1,000 gyms on the platform, monthly figures. **[E]** These are assumptions-based estimates.

| Cost line (₹ per gym per month) | Lean | Base | Heavy | Notes |
|---|---|---|---|---|
| Infrastructure (Supabase, API, storage, transfer, monitoring) | 69 | 69 | 69 | Spread across 1,000 gyms |
| WhatsApp, including provider markup and 18% GST | 87 | 439 | 470 | The base includes one marketing broadcast to all members, about ₹350 |
| OTP | 0 | 24 | 24 | Lean sends OTPs as WhatsApp authentication templates (≈₹0.12 each), already counted in the WhatsApp line |
| Support (1 agent per 150 gyms) | 200 | 200 | 200 | |
| Field sales, spread over a 24-month gym life | 97 | 97 | 97 | ₹2,333 per gym |
| Compliance (data protection officer or counsel, security testing) | 150 | 150 | 150 | |
| **Core SaaS subtotal** | **≈ 600** | **≈ 980** | **≈ 1,010** | |
| AI food analysis (30 users × 2 photos a day) | 72 (Gemini Flash-Lite) | 832 (Claude Haiku 4.5) | 2,028 (Sonnet 5.5) | **The swing factor** |
| **Total** | **≈ 675** | **≈ 1,811** | **≈ 3,038** | |

**[A] What this means:**

1. **Even the core costs more to serve than incumbents charge.** At about ₹600–1,000 a month, it exceeds the ~₹200 a month GoGym4U and GymBook charge, and matches Okfit's lower tiers (₹500–1,000; Okfit runs to ₹3,000). "Free" is therefore a subsidy that something else must repay.
2. **AI must be metered, and its model chosen on evidence.**
   - The repo already has a food-*resolution* benchmark (`services/api/app/food/benchmark.py`). Extend it into an accuracy benchmark on **weighed Indian meals**.
   - Use the cheapest model that passes that benchmark. Gemini Flash-Lite is about 12× cheaper than Haiku per image [F §6][F].
   - Free members get a small daily allowance. Heavier use goes through Premium (member-paid or gym-paid).
3. **Marketing broadcasts are paid by the gym.** Each gym gets prepaid message credits.
4. **Never absorb payment-gateway fees.** Absorbing them would add about ₹3,540 per gym a month and swamp every other line [F §7][F].
5. **Support is the cost to engineer down.** Self-serve setup after the pilot, a WhatsApp help bot, and in-app guides in Hindi.
6. **GST works against software for gyms.** Since 22 Sep 2025, gym services are taxed at 5% *without* input tax credit [A §3][A]. A gym can no longer offset the 18% GST on software, so any paid tier costs them 18% more than its sticker price.

### 7.4 How we could make money: the options

| # | Model | How it earns | Evidence | Fit for India | Trade-offs | Verdict |
|---|---|---|---|---|---|---|
| **M1** | **Freemium gym SaaS** (free core, paid "Pro") | Pro at about ₹999–1,999 a month: automation at volume, broadcast credits, scored retention, cohort reports, PT packs, multi-branch, web console | Owners pay ₹2–12k a year today. Okfit's tiers run ₹500–3,000 a month. Owners say they "can pay extra" for specific modules [A §1, §5][A]. Petpooja and Vyapar show paid Indian vertical SaaS reaching about ₹70–100 cr in revenue [E §1][E]. | Proven | Too little in Pro and nobody pays; too much and the free tier is crippled | **Yes, the base revenue** |
| **M2** | Per-member pricing | Charge per active member | Zen Planner, TeamUp [C §1][C] | Owners dislike bills that change | **Punishes coverage.** Gyms would keep members *off* the app. | **No** on app-linked members. Acceptable only as size bands for Pro. |
| **M3** | **Payments** | Revenue share from a licensed payment aggregator on online collections; Autopay setup; an optional convenience fee | Toast: 82% of revenue from fintech. ABC processes $8.8B. PushPress Free is funded at 4.99% [E §3][E], [C §2][C]. | **Weak.** UPI has zero merchant fee below ₹2,000. From 15 Oct 2026 the fee is 0.4% above that, and it goes to the payments chain; gyms under ₹1 lakh a month of UPI are exempt. Gyms dodge fees with a static QR [F, correction note and §4][F]. | Compliance (aggregator rules); fee resistance | **Yes, as a supplement.** Perhaps ₹100–300 per gym a month, not a funding engine. |
| **M4** | **Member Premium bought by gyms** (B2B2C bundle) | The gym buys Premium seats (e.g. ₹49–99 per member a month) and sells a "membership + app" tier | Hevy Coach gives clients free Pro [C §1][C]. Indians pay for *access* and *people* more readily than for apps [B §3][B]. | Promising, untested | Gyms must see members value it. App-store rules for organisation-bought access need review: Apple 3.1.3(c) covers apps sold *only* to organisations, but ours is also sold to consumers [F §5][F]. | **Yes, test in Phase 2**, [H] |
| **M5** | **Consumer Premium** (in-app purchase) | About ₹99–199 a month or ₹799–1,499 a year: unlimited AI nutrition, progression suggestions, deeper analytics | Healthify: a "six-digit" number of payers out of 45M. India's price index is 0.3×. Health & Fitness download-to-paid is 2.9% globally [D §4][D]; an unverified secondary figure puts India and SE Asia near 0.7% [B §3][B]. | Weak alone | 15% store fee; low conversion | **Yes, to cover heavy AI users.** Not the business. |
| **M6** | Coaching marketplace | 10–20% commission when gym trainers sell online or hybrid coaching through FitLog | Fittr: ₹128 cr, 95% of it coaching [B §1.7][B] | Strong ("India pays for people") | Must not undercut the gym's in-house personal training | **Phase 3**, with the trainer's gym sharing in it |
| **M7** | Lead-generation marketplace | Pay per joined member, only for people with **no** current gym | Fresha, Booksy, Treatwell take 20–35% of a first visit. Mindbody takes 20% capped at $30. Indian aggregators took 5–10% in 2019 [E §1][E], [B §1.3][B]. | Medium | Channel conflict and attribution disputes [E §2][E] | **Phase 3**, under the owner-safety charter |
| **M8** | **Verified-activity partnerships** | Insurers and employers pay per verified active member | ABHI Activ Health; Wellpass; FITPASS corporate (§3.3 i) | Real buyers exist | Needs scale and a strong consent design (DPDP) | **Phase 3, high upside** |
| **M9** | Embedded finance | EMI on annual memberships through a lender; working-capital or equipment loans to gyms | Khatabook and OkCredit pivoted to lending, slowly [E §1][E] | Medium | Credit risk sits with partners; digital-lending rules | **Phase 3** |
| **M10** | Commerce and sponsorship | Supplement and brand sponsorship of challenges; affiliate supplements | Gyms already sell supplements [A §4][A]. Counterfeit claims exist but are weakly sourced. | Medium | Degrades trust if done badly | **Phase 3, cautiously** |

### 7.5 Should the core stay free forever?

**Recommendation [A]: yes, for the gym's core operations at one branch.**

**Free forever:**
- Members, plans and dues ledger.
- Receipts, and reminders at utility volume.
- QR check-in.
- Basic reports.
- The member app and gym card.
- Basic trainer tools.
- Gym challenges.
- Data export.

**Why free forever:**
1. That free core *is* the distribution engine (T1, T2).
2. Its marginal cost (about ₹600 a month) is low enough to recover from the layers above it.
3. "Free forever" in writing answers the renewal-price-hike complaint that dominates owner reviews.

**Paid:** anything that scales with the gym's ambition or our variable costs.
- Pro automation and scored retention.
- Marketing broadcasts.
- AI beyond the free allowance.
- Multi-branch and the web console.
- Payments convenience.
- Premium seats.

**An illustrative break-even [A][H].** Every input is a hypothesis for the pilot and Phase 2 to test. Per gym per month, averaged across all gyms:

| Source | Assumption | ₹ per gym per month |
|---|---|---|
| Pro | 25% of gyms convert at ₹1,299 | ≈ 325 |
| Payments share | Half of gyms collect online; ~₹200 share each | ≈ 100 |
| Gym-bought Premium seats | 20% of gyms buy 30 seats at ₹49 | ≈ 295 |
| Consumer Premium | 3% of 120 app users at ~₹110 net of store fees | ≈ 395 |
| **Revenue** | | **≈ 1,115** |
| **Cost** | Core ≈ 600–1,000, plus AI for the ~10 Premium users per gym (≈ ₹28 each a month on Haiku) | ≈ 870–1,270 |

**Conclusion.** Break-even only at the lean end of core cost. At the §14.8 target of 20% Pro conversion, revenue is ≈ ₹1,050. Viable, but thin, and it depends on Pro and Premium more than on payments. **This is why the free core must be lean, and why AI must sit behind quotas from day one.**

### 7.6 Could we charge gyms by member count?

**[A]** Not for members on the app. That makes coverage, the thing we need, cost the owner money. Two acceptable alternatives:

- **Pro priced in size bands** by *gym* size (up to 300 / 300–800 / 800+ active members), set on the gym's register rather than app use.
- **Charging per branch.**

### 7.7 Could we make money on the consumer side instead?

**[A]** Partly. Indian consumers pay for gym access, coaches and drugs, not for tracking apps [B §3][B].

**Most promising:** let the *gym* collect from the consumer. A "Gold membership: gym + FitLog Premium + monthly assessment" tier is priced inside a membership fee the member already pays. The gym earns margin, and we are paid by the gym (M4). Direct consumer Premium (M5) remains, mainly to cover heavy AI users and Structured Lifters.

### 7.8 The strategic options side by side

| Option | Description | Upside | Main risk | Assessment |
|---|---|---|---|---|
| **A · "PushPress India"** | Free SaaS funded by payments | Simple story | UPI economics; gyms avoid fees | **Does not work in India on its own** |
| **B · Freemium gym SaaS** | Free core, paid Pro | Proven in Indian SMB SaaS | Low revenue per gym; capped by gyms' willingness to pay | **The base. Do it.** |
| **C · Gym-led consumer platform** | B, plus gym-bought and member Premium, with FitLog as the member app | Higher revenue per gym; a consumer asset that outlasts gym churn | Members must activate (T3) | **The thesis. Validate first.** |
| **D · Network marketplace** | Discovery, coaching and verified activity | Large if density is achieved | Channel conflict; slow (Fresha took 11 years to reach ~10% of new clients) | **Phase 3 optionality** |

**Recommended: B + C now, a light version of A as a convenience, and D later under the owner-safety charter.**


---

## 8. Viral growth mechanisms

### 8.1 What makes fitness content spread, from the evidence

[F/C] [D §4–5][D]

- **What gets shared.** People share *peaks*: a personal record, a yearly recap, a finished challenge, a visible transformation. Hevy's Instagram/Facebook Stories cards lifted shares 42%, virality 25% and installs 12%. Its Year in Review week lifted sharing 59%. Spotify Wrapped produced about 1.2M tweets in 2019.
- **What lasts.** Competition persists. Pure support and collaboration fade (STEP UP). All gamification effects shrink once the intervention ends, so mechanisms must *recur*: monthly, not once.
- **Where community comes from.** Real places and events. Strava's segments and clubs, Orangetheory's studio screens, the CrossFit Open, Hyrox.
- **Activity spreads socially.** Exercise is measurably contagious between people who know each other (1.1M runners, *Nature Communications* 2017).

**[A] Design rule.** Every sharing mechanism needs:
1. a **trigger moment** with real emotion;
2. **identity value** for the sharer ("this says something good about me");
3. **a payoff for the gym**, so the owner amplifies it;
4. **a recruit path**, so the viewer can act: join the challenge, claim a trial.

### 8.2 The mechanisms

| # | Mechanism | Trigger | Why the user shares (the behaviour behind it) | How it loops | Phase |
|---|---|---|---|---|---|
| V1 | **PR and milestone share card**, branded with the gym, generated at E-11's PR celebration (built) | The PR moment, at peak pride | Showing competence and identity; a card costs no effort | Gym tag → local followers see a real gym → trial link | MVP |
| V2 | **Monthly recap and year-end "Wrapped"** | The 1st of the month; December | Self-presentation and nostalgia; the year as a story (Spotify, Hevy Year in Review +59%) | Seasonal reach spike; "my gym's 2026" | Monthly: Phase 2; year-end: first December |
| V3 | **Gym challenges and leagues** (D1) | Challenge start, mid-point and finish | Status inside a group you know; competition (the only arm with a lasting effect); recruiting teammates | "Join my team" brings friends into the gym and the app | MVP |
| V4 | **Gym-funded referral**: extra days for both people | After a PR, at renewal, at challenge end | Reciprocity plus a concrete reward; a friend makes the gym more fun (friends cut cancellations by 40%) | Each join is a new gym member *and* a new FitLog user | MVP (link) / Phase 2 (automated) |
| V5 | **Buddy streaks**: two members commit to 3 times a week | Training with a partner | A commitment device; fear of letting the friend down | Invite your training partner | Phase 2 |
| V6 | **Transformation story** with trainer-verified measurements, opt-in | Assessment day (C4) | Social proof; owners already post transformations on Instagram, now with trusted numbers | The gym's best marketing asset; the member is the hero | Phase 2 |
| V7 | **Trainer-shared client wins**, with the member's consent | A client milestone | Trainers in India build personal brands on Instagram; client results are their portfolio | Trainers recruit clients, and carry FitLog to their next gym | Phase 2 |
| V8 | **Gym-floor leaderboard screen** (D2) | Every visit | Public recognition in the room; "I'm not on the board unless I log" | Peer pressure to install and log | Phase 2 |
| V9 | **Kudos inside the gym**: reactions to PRs from people you actually train with | A PR is logged | Recognition from known people outweighs strangers' likes | Raises the value of being on the app at this gym | Phase 2 |
| V10 | **Gym-vs-gym city challenge** (D4) | City event month | In-group identity ("my gym"); owners promote it to win | Owners of non-member gyms see the event and ask to join (**gym acquisition**) | Phase 3 |
| V11 | **Weekly streak with a freeze** | Week end | Loss aversion (Duolingo) | Mostly retention, not virality; it feeds V1 and V2 | MVP |

### 8.3 What not to build, and why

**Avoid:**
- **A global social feed.** No evidence it improves activity [D §4][D], it costs a lot to moderate, and Hevy and Strava already own that space.
- **Global strength leaderboards.** Self-reported lifts across gyms, bodyweights and equipment aren't comparable, so they reward cheating [D §2][D].
- **Contact-list spam invites.** Purpose-limitation risk [F §1][F], and they are toxic for the brand.
- **Public gym rankings by activity.** Owners at the bottom would churn. Offer only positive, opt-in recognition.
- **Progress photos as default share content.** Privacy; consent must be explicit every time.

### 8.4 A realistic view of viral reach

**[A][H]** Illustrative only: per 100 active app members in a gym, over a month.

| Step | Assumption | Result |
|---|---|---|
| Share cards posted | 15 members post (PR, recap, challenge) | 15 posts |
| Reach | ~300 local viewers each | ~4,500 views |
| Trial claims | 0.1% | 4–5 trial claims |
| Joins | 30% convert | ~1.5 new members |
| Referral joins | V4 | +1–2 more |

- **Result:** 2–4 new gym members a month per 100 active app members.
- **For the gym, that is meaningful.** A 300-member value gym takes in roughly 20–30 joiners a month.
- **For FitLog, it is a bonus, not the engine.** At this level the *k-factor* (new users each user brings in) is well under 1. **Gym acquisition (§11) remains the engine. Virality lowers its cost.**

---

## 9. A portable fitness identity

### 9.1 What it would contain, and whose it is

The identity has two kinds of data: what the member logs, and what the gym *verifies*. They have different owners under Indian data-protection law, which has consequences [F §1][F].

| Element | Source | Whose record under DPDP (our reading; needs legal review) | Leaves with the member? |
|---|---|---|---|
| Workout history, PRs, e1RM, volume | Member logs in FitLog | The member's, with FitLog as fiduciary | Yes, always (export is built) |
| Nutrition, body measurements, progress photos | Member, sometimes recorded by the trainer | The member's, with FitLog as fiduciary; trainer access by consent | Yes |
| Gym attendance | Check-ins | The gym's business record (we are its processor). **But** a check-in made *in FitLog* can also sit in the member's own activity log, under the member's FitLog consent | The member's own copy: yes. The gym's record: stays with the gym. |
| Membership and payment history | Gym ledger | The gym's record | The member keeps their receipts |
| Trainer-attested lifts and measurements | Trainer | Gym and member jointly; needs a clear policy | Yes, as "verified by <gym>, <date>", with the gym's agreement in its contract |
| Challenges completed, achievements | Platform | The member's | Yes |

### 9.2 Is it actually valuable?

**For it [F/U]:**
- Lifters care about their history. Apps compete on importing it, and users cite it as a reason to stay ("they save all your food data from years ago"), though no study measures the effect [D §6][D].
- Strava and Garmin fought over who holds the data, a sign that holding the data is leverage [D §2][D].
- Verified activity has buyers: ABHI's premium-back programme counts partner-gym check-ins (§3.3 i).

**Against it [F/A]:**
1. **Most history is cheap to move.** CSV export is free in Strong and Hevy, and import is a weapon for newcomers. *Logged* history alone is not a moat for anyone, us included, and we deliberately offer export.
2. **The members who would benefit rarely move.** Indian gym members mostly *quit* rather than switch: 32% take a break and 32% go to home workouts [B §2][B]. A beginner with three months of logs places little value on "history".
3. **India's DPDP Act has no data-portability right.** Portability is a feature we choose to offer, not one the law requires.

### 9.3 Verdict

**[A]** Portable identity is **a retention enhancer and a foundation for Phase 3 revenue, not a moat by itself.** Three pieces make it more than a CSV:

1. **Verification.** Location-checked check-ins, biometric imports and trainer-attested measurements are *attestations*. A self-logged app can't produce them, and insurers and employers can use them (M8).
2. **Continuity through breaks** (B6). The account outlives the membership, so the 48% who would rejoin are still reachable, and their previous gym gets the first chance.
3. **A faster start at the next gym** (D3). A new trainer sees the history, with consent, on day one.

The slogan **"Your fitness history is yours: it follows you, wherever you train"** is good positioning for *members* and should be used. It must be paired with the owner-safety charter: the *member's* history moves; the *gym's* business records and relationships do not.

---

## 10. Product strategy: MVP, Phase 2, Phase 3

### 10.1 Scoring

**[A]** Each feature is scored 1–5 on the six criteria the brief named:

- **UV**: user value
- **BV**: business value
- **Diff**: differentiation
- **Ease**: 5 = easiest, the inverse of complexity
- **Net**: network-effect potential
- **Ret**: retention potential

The maximum score is 30. Features marked "built" score on their *extension* work. The scores are judgements; the reasoning is in §4–§9.

| Feature | UV | BV | Diff | Ease | Net | Ret | **Σ** | Phase |
|---|---|---|---|---|---|---|---|---|
| B1 Gym card in FitLog | 4 | 5 | 4 | 4 | 3 | 4 | **24** | MVP |
| A5 Retention list ("today's five calls") | 5 | 5 | 5 | 3 | 2 | 5 | **25** | MVP |
| C1 Plan loop: trainer → member → trainer | 5 | 4 | 5 | 3 | 4 | 5 | **26** | MVP |
| A3 Renewal and dues engine | 4 | 5 | 3 | 4 | 1 | 4 | **21** | MVP |
| C3 Renewal backed by progress | 4 | 5 | 5 | 5 | 1 | 4 | **24** | MVP |
| A4 Self check-in, imports, manual marking | 4 | 5 | 3 | 4 | 3 | 3 | **22** | MVP |
| B2 Phone-first join, pre-linked | 4 | 5 | 3 | 3 | 3 | 2 | **20** | MVP |
| C2 Member consent panel | 4 | 4 | 4 | 3 | 2 | 3 | **20** | MVP (non-negotiable) |
| D1 Gym challenges and leagues | 4 | 4 | 4 | 3 | 5 | 4 | **24** | MVP (attendance) |
| B4 Indian catalog and household units | 5 | 4 | 4 | 3 | 1 | 4 | **21** | MVP |
| A2 Ledger, receipts, plans | 4 | 5 | 1 | 3 | 1 | 2 | **16** | MVP (table stakes) |
| A6 Trainer workspace (basic) | 4 | 4 | 4 | 3 | 4 | 4 | **23** | MVP |
| A1 Setup and import (E1 register reader in Phase 2) | 3 | 5 | 3 | 3 | 1 | 1 | **16** | MVP (concierge at first) |
| B5 Weekly "one thing improved" | 4 | 3 | 3 | 5 | 2 | 4 | **21** | MVP |
| V1 PR share card with the gym's name | 3 | 4 | 3 | 5 | 4 | 2 | **21** | MVP |
| C5 Referral link | 3 | 4 | 2 | 4 | 4 | 2 | **19** | MVP (light) |
| A7 Online collection through a payment aggregator | 4 | 4 | 2 | 1 | 1 | 3 | **15** | Phase 2 |
| Member and gym-bought Premium | 3 | 5 | 3 | 3 | 1 | 3 | **18** | Phase 2 |
| D2 Gym-floor screen | 3 | 4 | 4 | 5 | 4 | 3 | **23** | Phase 2 (early) |
| E4 Trainer plan copilot | 4 | 3 | 4 | 3 | 2 | 3 | **19** | Phase 2 |
| E5 Diet-chart digitiser | 4 | 3 | 5 | 3 | 1 | 3 | **19** | Phase 2 |
| E3 Scored churn reasons and drafted message | 4 | 4 | 4 | 2 | 1 | 4 | **19** | Phase 2 |
| B6 Break mode | 3 | 3 | 4 | 4 | 1 | 4 | **19** | Phase 2 |
| D3 Fitness passport | 3 | 3 | 4 | 3 | 4 | 3 | **20** | Phase 2 |
| Web console and multi-branch | 3 | 4 | 1 | 2 | 1 | 2 | **13** | Phase 2 |
| Biometric log import | 3 | 4 | 2 | 2 | 1 | 2 | **14** | Phase 2 |
| D4 City inter-gym events | 4 | 4 | 5 | 3 | 5 | 3 | **24** | Phase 3 (needs density) |
| D6 Verified activity for insurers and employers | 3 | 5 | 5 | 1 | 4 | 3 | **21** | Phase 3 (needs scale) |
| D5 Owner-safe gym discovery | 3 | 4 | 2 | 2 | 4 | 2 | **17** | Phase 3 |
| M6 Coaching marketplace | 3 | 4 | 3 | 2 | 4 | 3 | **19** | Phase 3 |
| D7 Owner benchmarks | 2 | 3 | 3 | 3 | 3 | 1 | **15** | Phase 3 |
| Global social feed | 2 | 2 | 1 | 2 | 3 | 2 | **12** | **Don't build** |

**Phase is not just the score.** Some high scorers must wait for a precondition: D4 needs density and D6 needs scale. Some low scorers are table stakes that must ship anyway: A2, and C2 for compliance.

### 10.2 MVP: the smallest product that tests the business

**Goal [A].** Test T1–T4 (§2) with 5 pilot gyms, then 10–20. It is **not** a launch to the whole market.

**Step 0 · Before code (2–3 weeks)**

- Interview 20–30 gym owners and 30–50 members across the target segment (§11.1). Use the questions in §14.6.
- Run a *concierge* version with 2 gyms, doing by hand what the software will automate:
  - type in the register;
  - send renewal WhatsApps from a shared number in the gym's name;
  - give members FitLog accounts linked manually;
  - have a trainer assign plans with our help.
- Measure what members do.

**Step 1 · The MVP build (estimated 10–14 weeks for 2–3 engineers [A], building on the existing app and API)**

| Layer | In the MVP |
|---|---|
| **Platform** | Organisation model (gym, branch, staff roles: owner, manager, desk, trainer); phone-OTP sign-in; consent records (C2); data processing agreement and gym terms with the owner-safety charter; Pro entitlements (all AI behind Pro, with a 7-day trial; pilot members get Pro free so we can measure use); gym-level activation metrics |
| **Owner (role-based screens in the same Expo app; Hindi and English)** | Members, plans, memberships, freezes, dues and receipts ledger (A2); WhatsApp utility reminders and receipts (A3); self check-in poster with a location check, manual marking and biometric Excel import by hand (A4); free absence alerts and "today's five calls" from rules (A5); basic trainer workspace (A6); core reports; CSV export; exit-reason quick reply |
| **Member (existing FitLog)** | Phone join, pre-linked (B2); gym card (B1); today's plan from the trainer (B3); Indian catalog expansion and household units (B4); weekly "one thing improved" (B5); weekly streak with freeze; PR share card with the gym's name (V1) |
| **Shared** | Plan loop (C1); renewal backed by progress (C3); one attendance challenge per month (D1); referral link (C5) |
| **Explicitly out** | Online payments; web console; multi-branch; automatic biometric import; AI calling (pre-sold, Phase 2); ads; discovery; passport; floor screen; AI copilot; lead pipeline |

### 10.3 Phase 2: after validation

**Gate to enter Phase 2 [A].** Every §14.8 pilot signal is met as stated over the 10 weeks, and activation reaches ≥ 40% (minimum 25%) in at least 4 of the 5 gyms.

**Build, in this order:**

1. **Make it sellable without us in the room.** Self-serve setup with E1, the register reader. Web console and multi-branch. Biometric log import.
2. **Turn on revenue.** Pro tier (M1). Online collection through a licensed payment aggregator (A7, M3). Member and gym-bought Premium (M4, M5).
3. **Deepen the loop.** PT packs and trainer performance. Assessment day (C4). Gym-floor screen (D2). Kudos inside the gym. Buddy streaks. Monthly recaps.
4. **AI that saves real work.** Trainer copilot (E4). Diet-chart digitiser (E5). Scored churn reasons (E3). Portion memory (E2). Next-set progression (E6).
5. **Continuity.** Break mode (B6). Fitness passport (D3).
6. **Owner growth.** Lead pipeline. First-month cohort reports. Review prompts. Barcode scanning.

### 10.4 Phase 3: once there is significant adoption

**Gate [A].** 50+ gyms in one city, or 100k linked members, *and* gym churn under 2% a month.

- City events and inter-gym challenges (D4).
- Owner-safe discovery for people with no current gym (D5, M7).
- Verified-activity partnerships with insurers and employers (D6, M8).
- Coaching marketplace (M6).
- Embedded finance: membership EMI, loans to gyms (M9).
- Owner benchmarks (D7).
- WhatsApp assistant (E7).
- Supplement inventory and aggregator reconciliation.
- A second city, then multi-city.


---

## 11. Go-to-market in India

### 11.1 The beachhead: who first, and why

**Recommended beachhead [A]:** independent, owner-run gyms that fit this profile.

| Criterion | Target |
|---|---|
| Size | ~150–500 members |
| Member fees | ₹700–1,500 a month (value gyms and the lower end of premium) |
| Staff | At least 2 trainers, with a PT business |
| Current tools | A register, Excel or a cheap app |
| Cult.fit | Not a Cult partner, or an unhappy one |
| Location | A **single dense cluster in one city** the team can visit in person every week |

**Why this segment:**

1. **It is most of the market.** 80% of gyms and 78% of members are value gyms, and the segment also takes in the lower end of premium [A §3][A].
2. **One person decides.** The owner decides in one visit; there is no procurement.
3. **The pain is sharp.** Renewals and dues are the owner's daily problem [A §4][A].
4. **The plan loop needs trainers to exist.** Without them the loop (C1), our activation hook, cannot work.
5. **Members are reachable.** They are smartphone users; 28–35 is the core paying age [B §2][B].
6. **The big players ignore it.** Global consolidators (Daxko–FitnessForce, Playlist–EGYM) sell to chains, so this segment is underserved.

**Tier-1 versus Tier-2:**

| | Tier-1 metros (Bengaluru, Mumbai, Delhi-NCR, Hyderabad, Pune, Chennai) | Tier-2 large cities (e.g. Indore, Coimbatore, Chandigarh) |
|---|---|---|
| For | Higher fees and PT spend; members more app-savvy; dense gym clusters, so a network forms faster | 32,000 centres outside the top 10 [A §3][A]; more registers and Excel (greenfield, not switching); weaker Cult presence (90% of Cult's services revenue is in four metros [B §1.1][B]); cheaper field sales; Hindi-first fits a Hindi UI |
| Against | **Cult's stronghold** (30%+ of Bengaluru's gym market); members already on Hevy or Healthify; more vendor competition; higher sales cost | Lower willingness to pay for Pro; thinner PT economics; less data in our sources (Deloitte calls it "largely untapped") |

**Recommendation [A].**

- **Start in one city where the founding team lives.** Founder-led, in-person sales is the binding constraint, and cluster density matters more than which city it is.
- **Prefer a "Tier-1.5" market if there is a choice:** a large Tier-2 city in Deloitte's top 10 (Jaipur, Lucknow, Kochi), or the suburbs of a Tier-1 metro away from Cult's densest areas.
- **Avoid central Bengaluru for the pilot.** A Cult-dense area makes it hard to tell "the product didn't work" apart from "Cult won".

**Independent gyms versus chains [A]:**

- **Independents first.**
- **Small multi-branch owners (2–5 branches) in Phase 2.** They are often the most successful independents, and they need the web console.
- **Chains and franchises much later, if ever.** They:
  - already have chain-grade software (FitnessForce, now Daxko);
  - want white-label apps;
  - buy slowly;
  - and Cult's franchises run on Cult's tools.

### 11.2 How to approach gym owners

**Opening offer: the "dues and drop-off audit".** [A][H]

- Visit in the afternoon lull; gyms are busy from 6–10 am and 5–10 pm.
- Offer: "Give us your register or Excel. In 48 hours we'll show you, for free:
  - how much money is overdue;
  - which members stopped coming in the last 30 days;
  - how many of last quarter's joiners are still active."
- The owner gets value *before* any software, and we get the data to set them up.

**The pilot offer:**
- Free forever, in writing.
- We set everything up.
- A launch kit: QR standees, WhatsApp templates, a challenge poster.
- Challenge prizes are sponsored by us (₹2–3k a month) for pilot gyms.

**What we ask in return:**
- Every new joiner is onboarded in the app.
- Trainers assign plans in the app.
- 10 weeks of measurement, compared against the gym's own baseline.

### 11.3 The first 10 gyms

**Who sells.** Founder-led and in person. No paid ads.

**Where the leads come from:**
- Trainers, who know many gyms.
- Gym-equipment dealers and supplement distributors, who visit every gym.
- Local fitness influencers.
- Gym owners' WhatsApp groups.

**How to pick the 10 [A].** Choose gyms that *differ inside* the segment: register-based versus app-based, PT-heavy versus not, near Cult versus not. Then the pilot tells us which kind of gym the model works for.

**Cadence:**
- A weekly visit to every pilot gym.
- A shared WhatsApp group with each owner.
- Every gym live within 7 days of signing.

**Success.** The thresholds in §14.8.

### 11.4 The first 1,000 users

**The arithmetic [A].** 10 gyms × ~250 active members × 40% activation ≈ 1,000.

**What drives it:**
- Onboarding new joiners at the counter.
- Trainers setting up plans on members' phones.
- Getting members to scan the check-in poster (visits count for the challenge).
- The first monthly challenge with a prize.
- Renewal reminders that carry progress.

**Expected timing.** About 8–12 weeks after the gyms go live.

**[A] What this milestone teaches.** *Activation mechanics.* The pilot should log which channel each member came through (§6.4).

### 11.5 Reaching 10,000 users

**The arithmetic [A].** About 80–100 gyms in the same city cluster, at ~40% of ~275 members ≈ 110 users per gym.

**Requirements:**
- 2–3 field reps, each going live with ~10–15 gyms a month.
- 1–2 support staff.
- Self-serve register import (E1).
- A written activation playbook.

**Programmes:**

| Programme | How it works |
|---|---|
| **Trainer ambassadors** | A bounty (e.g. ₹500–1,000) for each gym a trainer brings that goes live and passes 30% coverage. Trainers change gyms often, so they spread the product naturally [H]. |
| **Owner-to-owner referral** | A free Pro quarter for each referred gym that goes live. |
| **First inter-gym challenge** | Run once the cluster passes ~20 gyms (D4 pilot). |
| **Case studies with real numbers** | From pilot gyms, shared in owners' WhatsApp groups and at owner breakfast meet-ups. |

**Timing.** About 6–9 months after the pilot.

### 11.6 Reaching 100,000 users

**The arithmetic [A].** About 900–1,000 gyms across 3–5 cities. That is about 2% of India's gyms.

**Playbook:**
- **City by city.** A city launch team of 3–5 reps, running the same playbook.
- **Inside sales by phone and video** for Tier-2 and Tier-3 cities.
- **Self-serve setup**, with Hindi video guides on YouTube.

**Channel partners:**

| Partner | Why | Arrangement |
|---|---|---|
| Biometric-device dealers and integrators | They sell to every new gym | Bundle FitLog with their device; revenue share on Pro |
| Gym-setup consultants and equipment dealers | Deloitte projects about 19,000 new facilities by 2030, roughly 3,000 a year. A new gym chooses its software at opening. | — |
| Licensed payment aggregators | Sub-merchant onboarding | Co-selling |

**Member pull at this scale:**
- City events.
- Gym-bought Premium.
- The first insurer or employer verified-activity partnership (D6).

**Timing.** About 18–30 months [A].

**Cost comparison [A].** About 1,000 gyms × (₹2,333 + 12 × ₹505) ≈ **₹84 lakh** in the first year, including serving the gyms (§6.8). Acquiring 100,000 users through paid installs would cost about **₹1.95 crore** at ~₹195 per signup [B §3][B], about 2.3× more, and most of them would be gone by day 30.

### 11.7 Sales motion: manual or self-serve?

**[A]** Manual first, self-serve later, and never self-serve only.

- **First ~100 gyms: white-glove.**
  - Activation is the make-or-break metric, and early on it needs a human in the gym.
  - Indian SMB owners build trust in person. The trust problems with the incumbents are about *support* [A §4][A].
- **Self-serve only once proven.** Turn it on once E1, the setup wizard and the activation playbook show self-served gyms reaching at least 70% of white-glove gyms' activation.
- **The warning from India's free SMB tools.** Khatabook and OkCredit reached tens of millions of installs self-serve, but not engaged, paying businesses [E §1][E]. Installs are not activation.

### 11.8 Partnerships, trainers, referrals, WhatsApp and community

| Lever | How we use it | When |
|---|---|---|
| **Trainer partnerships** | Ambassador bounties. A free trainer workspace that trainers keep when they change gyms. A **trainer-only mode** (Hevy-Coach-like) when the owner won't adopt, which gives the trainer a way into the gym. Trainer-certification academies could teach FitLog during courses [H]. | Trainer workspace from MVP; bounties, trainer-only mode and academies in Phase 2 |
| **Referrals** | Owner-to-owner (free Pro), trainer-to-gym (bounty), member-to-friend (gym-funded days, C5) | MVP (member) / Phase 2 (owner, trainer) |
| **WhatsApp acquisition** | **Owners:** case-study videos and audit offers in owners' and dealers' groups; a sales WhatsApp line. **Members:** a one-time invite in the gym's name; WhatsApp Channels for city challenges (Phase 3). **Never** cold marketing to member numbers (§13 R9). | MVP onwards |
| **Local community** | Owner breakfast meet-ups (15–20 owners). The city challenge as a local press story. Trainers' Instagram content featuring client wins (V7). | Phase 2 |
| **Payment aggregators** | Sub-merchant onboarding and co-marketing | Phase 2 |
| **Insurers and employers** | Verified-activity pilots | Phase 3 |

---

## 12. Competitive moat

**[A]** A moat is something a well-funded competitor *cannot* reproduce quickly by copying features. Most of what follows is not a moat, and saying so is the point of this section.

| Candidate | Is it a moat? | Why | What would strengthen it |
|---|---|---|---|
| **Within-gym network plus workflow switching costs** (owner, trainers and members on one system; members linked by their own phones; plan libraries; Autopay mandates in Phase 2) | **Yes, moderate, gym by gym** | A competitor must win each gym individually *and* get 150 members to switch apps. Every gym is its own small network, so the moat is real but local [E §5][E]. | Coverage above 50%; the trainer plan loop; payment mandates |
| **On-the-ground distribution in our cities** | **Moderate, temporary** | Field relationships and a working playbook take time to copy. Capital can buy them; Cult has a sales force. | Density in a few cities before expanding; partner channels (device dealers) |
| **Neutrality / the owner-safety charter** | **Positioning advantage** against Cult and the aggregators. **None** against neutral SaaS vendors. | Cult can't credibly promise not to steer members into cultpass, because that is its business. Aggregators are distrusted [B §1][B], [E §1][E]. | Keeping the promise, visibly, for years |
| **Verified activity and attestations** (location-checked check-ins, biometric imports, trainer-attested measurements) | **Potential, Phase 3** | Self-logging apps can't produce attestations. Insurers already pay for verified activity (§3.3 i). | Partner integrations; consent design; scale |
| **Member fitness history** | **Weak as a moat** (export is free everywhere, ours included) | It helps retention, not defensibility [D §6][D] | Verification turns it into an asset (above) |
| **Consumer product quality** (80.7 ms logger, honest Indian nutrition, offline sync) | **A barrier against Indian gym SaaS vendors** (consumer-grade apps are not in their DNA or budget). **Not** against Hevy or Healthify. | It took nine milestones to build, but it can be copied | Speed of iteration; Indian food depth |
| **Indian food data and the correction dataset** | **Weak to moderate** | IFCT is © NIN and can't be shipped; our dishes are USDA-derived, so members' corrections and portion memory are the only proprietary part | Volume of confirmed corrections; the accuracy benchmark |
| **AI personalisation** | **Weak** | The models are commodities. "Data moats" mostly erode [E §5][E]. | — |
| **Cross-gym network effects** | **Weak until there is density; then local and moderate** | Gym membership is single-homed; marketplace demand stays thin even for leaders [E §2][E] | City events; discovery under the charter |
| **Marketplace** | **Not yet** | No liquidity, and it risks channel conflict | Phase 3 |
| **Brand** | **Weak at first** | Could matter among trainers, who are a tight community | The trainer programme |
| **Integrations** (biometric devices, payment aggregators, Health Connect) | **Weak to moderate** | Useful for reducing friction, but replicable | — |

**Who could copy us, and how worried to be [A]:**

| Competitor | Threat | How it could hurt us | Our answer |
|---|---|---|---|
| **Cult.fit** | **The most dangerous** | Already pitches "digitised centre operations and CRM, personalised AI-led workouts" to independents, plus co-branding money and demand [A §1][A] | Neutrality. Cult is the independents' competitor. |
| **Indian gym SaaS vendors** (GymBook, GoGym4U, Okfit) | Low–medium | Could add a logger, but would struggle to build a consumer-grade one. Okfit is the nearest. | Partnership or acquisition targets later, not threats now |
| **Hevy (Hevy Coach)** | Medium | Could add gym features | Not focused on India; prices in dollars; no nutrition; no owner tools |
| **Healthify, Fittr** | Low–medium | Own consumers and coaches | Gym operations are not their DNA, and Healthify is pivoting towards GLP-1 |
| **Global consolidators** (Daxko–FitnessForce, Playlist–EGYM) | Low in our segment | — | A ₹2,000-a-year independent gym doesn't fit their sales model |

**The honest summary.** Our defensibility is **execution density**:
- many gyms in a few cities;
- high member coverage in each gym;
- trainers who carry us with them;
- a reputation for neutrality and support.

That is a ground-war moat, not a technology moat. It holds only if activation and gym retention are high.


---

## 13. Risks and failure modes

**Likelihood (L) and impact (I)** are rated **H**igh, **M**edium or **L**ow. All ratings are our judgement **[A]**.

### 13.1 Risk register

| # | Risk | L | I | Early signal | Mitigation |
|---|---|---|---|---|---|
| **R1** | **Gym owners don't care about software.** They run fine on registers and WhatsApp. | M | H | Owners agree to a pilot but never go live; "I'll see next month" | Lead with the dues-and-drop-off audit (money, not software); white-glove setup; target owners who feel renewal pain (§11.1) |
| **R2** | **Owners won't change existing systems** | M | M | Objections about staff retraining and lost data | Import everything (A1, E1); keep their biometric hardware (A4); run in parallel for 2 weeks |
| **R3** | **Members don't want another app** | **H** | **H** | Under 15% install by day 30 | Make the app the gym's workflow (card, check-in, receipts, plan); trainer-led setup; WhatsApp fallback so the gym never depends on installs. **This is the thesis risk.** §14 tests it first. |
| **R4** | **Low engagement after install** (door-key use only) | H | M | Sessions under 1 minute; weekly active under 25% of linked members | Plan loop, weekly progress card, challenges. Accept that door-key use still serves the gym; the consumer business needs only a subset of engaged users. |
| **R5** | **High onboarding friction** (OTP failures, low-end phones, shared numbers) | M | H | Drop-off between invite and link | Phone-first join; WhatsApp OTP; multiple profiles per number; test on ₹8–10k phones; small install size |
| **R6** | **Free users become expensive** (AI, WhatsApp, support) | M | H | Cost per gym above ₹1,000 a month without revenue | Quotas from day one; gym-paid broadcast credits; model chosen by the accuracy benchmark; self-serve support (§7.3) |
| **R7** | **Weak network effects** | **H** (across gyms) / L (within a gym) | M | No gym arrives through referral; under 5% of members do any cross-member action [E §6][E] | Build the within-gym network first; don't underwrite the business on the cross-gym network (§6.7) |
| **R8** | **Gyms use only attendance and payments** | H | M | Coverage under 10%; trainers inactive | Coverage score; Pro unlocked by coverage; trainer programme. If it persists, we have a SaaS business, not a platform: an outcome, not a disaster. |
| **R9** | **Privacy, data ownership and DPDP compliance** | M | **H** | "How did you get my number?" complaints; regulator or press attention | See §13.2 |
| **R10** | **Competition**: Cult bundles free software; a vendor copies the member app | M | H | Cult partner programme growing in our cities | Neutrality charter; density in a few cities; support quality (§12) |
| **R11** | **Operational complexity** (field sales, support, 3 user roles, 2 apps' worth of surface) | H | M | Support backlog; slow onboarding | One city at a time; playbooks; WhatsApp bot; resist Phase 3 features until the gates are met |
| **R12** | **Poor gym retention**: gyms leave, or close (independent gyms are fragile) | M | H | Gym churn over 3% a month | Owner outcomes visible monthly; members keep their accounts when a gym closes; target established gyms |
| **R13** | **Monetisation difficulty**: India's willingness to pay; UPI economics | **H** | H | Pro conversion under 10%; Premium under 1% | Several revenue layers (§7.4); test Pro and gym-bought Premium early in Phase 2; keep the cost base lean |
| **R14** | **Trainer resistance or attrition** | M | M | Trainers not assigning plans; trainers leaving | Tools that save trainer time; the trainer keeps a portable workspace; positive performance views |
| **R15** | **Focus split**: the existing consumer launch plan ([11-LAUNCH-PLAN](../11-LAUNCH-PLAN.md)) versus the gym pivot | H | M | Both moving slowly | Decide explicitly (§14.10). The consumer app's store launch is a prerequisite: members need it in the stores. |
| **R16** | **WhatsApp platform changes**: template re-classification; possible billing of service messages from 1 Oct 2026 [F §3][F] (provider claims, unconfirmed by Meta) | M | M | Rising message costs; templates rejected | Utility-only design; in-app push for anything non-urgent; cost alerts |
| **R17** | **App-store policy on gym-bought Premium** (Apple 3.1.3) | M | M | Rejection at review | Legal and App Review check before M4 ships; web-purchased seats; fall back to in-app purchase (§7.4) |
| **R18** | **AI nutrition accuracy and liability** | M | M | Members acting on wrong estimates | Estimates are always labelled (PRD guardrail D5); review step; no medical claims; benchmark on Indian meals |

### 13.2 R9 in depth: privacy, data ownership and DPDP

Legal interpretation from [F §1–2][F]. **This is not legal advice: get Indian counsel before the pilot.**

**Timeline**

- The DPDP Rules were notified on 13–14 Nov 2025.
- **Most obligations start on 13 May 2027**: notice, security, breach reporting, children's data, and data-principal rights.
- MeitY has proposed shortening this to 12 months, which would make the date **13 Nov 2026**.
- **Build to the Rules now.**

**Roles**

| Data | Gym's role | Our role |
|---|---|---|
| Gym-management data | Data fiduciary | Its **processor**, under a written data processing agreement |
| The member's FitLog account | — | **Independent fiduciary**, on the member's own consent |

**The risky step is the invitation.** If we use a gym's member list to promote *our* app, we have set our own purpose, without valid consent. The defensible design [F §1][F]:
1. The gym's enrolment notice names the member app as part of its service.
2. One invite goes out in the gym's name, and is never repeated as marketing.
3. The member gives fresh, separate consent to FitLog's features at sign-up.
4. The data processing agreement bars us from using gym data for our own purposes.
5. We never send our own marketing templates to numbers the gym supplied.

**Children (under 18)**

- These rules need verifiable parental consent and **prohibit "tracking or behavioural monitoring of children"**. Fitness apps get no exemption. The penalty reaches ₹200 crore.
- **Recommendation:**
  - The consumer app is **18+, with an age gate**.
  - The gym module holds teenage members' *gym* records only with parental consent; offer a parent OTP or DigiLocker flow.
  - Minors are excluded from analytics and from FitLog features.

**Aadhaar and biometrics**

- **Never collect Aadhaar numbers or copies** as member ID. The Aadhaar Act forbids private collection outside narrow routes.
- Fingerprint and face templates need specific consent, with QR or app check-in always offered as an alternative.
- **Keep templates on the device.** Never upload face images.
- No biometrics from minors.

**Security and breach**

- Encryption and access logging, with logs kept 1 year (Rule 6).
- Breach notification to affected people and the Board, with a detailed report **within 72 hours** (Rule 7).
- Penalties reach **₹250 crore** for failed safeguards.

**Cross-border**

- Sending food photos to a US AI provider is allowed today. Disclose it in the notice.
- Watch for restrictions on Significant Data Fiduciaries (SDFs).

**[A] The upside.** The member-controlled consent panel (C2) and the owner-safety charter are compliance requirements *and* our best trust messages to both sides. Treating them as product, not paperwork, is part of the strategy.

---

## 14. Final strategic assessment

### 14.1 Evidence that supports the opportunity

- **[E] A large, fragmented, growing market.** About 46,500 gyms rising to 65,500 by 2030. 80% are value gyms averaging about 258 members. 32,000 are outside the top 10 cities [A §3][A].
- **[F/U] The owner-side tools are cheap, commoditised and distrusted.** Complaints centre on support, renewal price hikes and bugs, not on missing features [A §4][A]. A trustworthy, free and better-supported product has room.
- **[F] Gym member apps go unused** (the counts are [F]; that the cause is offering members nothing is our reading, [A]).
  - GymBook's member app has 500+ installs against 50K+ for the owner app.
  - ABC's member app tracked 2M workouts against 57.5M check-ins.
  - Members complain that gym apps can't log training [A §2][A], [C §4][C].
  - FitLog's logger and nutrition tracker are exactly what those apps lack.
- **[F] Planet Fitness reached 40–60% adoption** [C §4][C]. **[A]** The app being the door key is the likely reason: utility drives adoption.
- **[F] Retention has measurable levers** that an owner-and-member system can work on: first-month visits, staff contact, social ties [C §5][C]. **[E]** In India, 48% of leavers would rejoin [B §2][B].
- **[C] Verified activity already has paying buyers in India** (ABHI Activ Health's partner-gym check-ins, from ABHI's own pages; outside the evidence briefs).
- **[A] The gym channel is cheaper than paid acquisition, if activation holds** (§6.8). India's paid installs are cheap but convert and retain poorly [B §3][B], [D §4][D].
- **[F] FitLog's consumer half is already built and tested:** 2,534 tests and 9 of 9 milestones.

### 14.2 Evidence that challenges it

- **[F] Gym-issued member apps get few installs** (GymBook, DGymbook, Total Fitness' 13% in month one) [A §2][A], [E §4][E]. **[A]** Members resist them unless the app is needed to use the gym.
- **[F/C] Cross-merchant networks stay thin and cause conflict.**
  - Mindbody: ~22k first purchases a month against 60M bookings.
  - Fresha: ~10% of new clients.
  - ClassPass converts ~6% of visitors into members, and studios have walked out.
  - Zomato Gold: ~2,000 restaurants logged out [E §1–2][E].
- **[A] Indian payment rails won't fund free SaaS**: UPI carries no merchant fee below ₹2,000, and 0.4% above it from 15 Oct 2026, which goes to the payments chain [F, correction note][F]. **[F] Free Indian SMB apps lost about as much as they earned:** Khatabook FY24 ₹102.7 cr revenue against a ₹116.2 cr loss; OkCredit FY25 ₹23.3 cr against ₹23.2 cr. Dukaan and Bikayi cut most of their staff and pivoted [E §1][E].
- **[E] India's willingness to pay is the lowest of any major market.** Price index 0.3×. Healthify has a "six-digit" number of payers out of 45M registered [B §3][B].
- **[E] Serving a free gym costs ₹600–1,000 a month before AI** (our cost model). That is more than incumbents charge (§7.3).
- **[F] Social features alone don't raise activity, and gamification fades** [D §4][D].
- **[F] Cult.fit already offers independents software plus demand**, with 202 marketplace gyms and an IPO in progress (a fresh issue of up to ₹950 cr plus an offer for sale) [B §1.1][B].
- **[F] The analogs took about a decade to work:** Fresha 11 years, Doctolib still loss-making, Practo 17 years to profit [E §2][E].

### 14.3 The strongest part of the concept

**[A]** The **shared system between trainer, member and owner inside each gym**: the plan loop, the gym card, retention backed by progress. It:
- solves a real, evidenced gap on both sides (§4.3);
- uses what FitLog has already built;
- works at n = 1 gym;
- creates the only network effect the evidence clearly supports.

### 14.4 The weakest part of the concept

**[A]** The original premise that **members will follow the platform from gym to gym and be "connected to another gym"**, producing a cross-gym network effect.

**Why it is weak:**
- Members mostly quit rather than switch.
- History is cheap to export.
- Every marketplace analog shows thin cross-merchant demand and owner hostility.

**What to do instead.** Keep it as Phase 3 optionality under strict owner-safety rules. Don't build the business case on it.

**Close second: monetisation.** "Free" must be paid for by Pro, Premium and later partnerships, all of them unproven in this segment.

### 14.5 The biggest unanswered assumptions

| # | Assumption | Why it matters | How to test |
|---|---|---|---|
| **H1** | ≥40% of *active* members install and link within 60 days when the gym runs through the app | Everything: the economics (§6.8) and the network | Pilot (§14.7) |
| **H2** | ≥25–50% of linked members use it weekly beyond check-in | Consumer value; Premium | Pilot |
| **H3** | Owners see renewal or first-month-attendance improvements they believe | Owner retention; Pro | Pilot, compared with each gym's own prior-year cohorts |
| **H4** | Trainers will assign plans in the app | The activation hook; the plan loop | Pilot: share of members with an assigned plan |
| **H5** | ≥20% of gyms will pay ~₹999–1,499 a month for Pro | Revenue | Phase 2 price test (pre-sell during the pilot) |
| **H6** | Gyms will buy Premium seats for members, or sell a "gym + app" tier | Revenue | Phase 2 test with 10 gyms |
| **H7** | Gym-linked members retain much better than paid-acquired users | The CAC advantage | Cohort comparison in the pilot |
| **H8** | Members keep using FitLog after their membership lapses | Portable identity; win-back | Track lapsed members for 90 days |
| **H9** | The invite design is DPDP-compliant | Legal ability to run the loop at all | Counsel review before the pilot |
| **H10** | A cheap model meets the accuracy bar on weighed Indian meals | The AI cost structure | Extend the food benchmark; weighed-meal test |

### 14.6 What to validate before investing heavily

**Before any new code (2–3 weeks):**

**1. Owner interviews (20–30), asking about the past, not hypotheticals:**
- "Walk me through last month's renewals. How many were late? How did you chase them?"
- "How many members who joined in July still come?" (Do they know at all?)
- "What software or app have you tried? Why did you stop?"
- "Have you ever asked members to install an app? What happened?"
- "Would you let your trainers put plans in an app? Would they?"
- "What did Cult or FITPASS offer you? What did you think?"
- "What would make you pay ₹1,000 a month?"

**2. Member interviews (30–50) in 4–5 gyms:**
- "What's on your phone for fitness? When did you last open it?"
- "How do you get your workout plan? Your diet chart?"
- "Would you scan a QR to check in instead of a fingerprint?"
- "What would make you stop going?"

**3. Counsel review** of the invite and consent design (H9).

**4. Weighed-meal accuracy test** on 50 common Indian dishes across 2–3 models (H10).

### 14.7 The most important experiment to run first

**The 5-gym, 10-week activation pilot.** It runs as a concierge setup first, then on the MVP.

| | |
|---|---|
| **Hypotheses** | H1, H2, H3, H4 (and early H7, H8) |
| **Set-up** | 5 independent gyms in one city cluster, chosen to differ (§11.3). Concierge throughout: we set up, import, send reminders and link members by hand. MVP parts are switched on as they ship (the full MVP is a 10–14-week build, §10.2). The member side runs on the existing FitLog app from day one. |
| **Treatment** | The gym card and self check-in poster are introduced to every *new* joiner and offered to existing members. Trainers assign plans. One attendance challenge a month. Renewal reminders backed by progress. "Today's five calls" for the owner. |
| **Control** | Each gym against its own previous-year cohorts (same months), plus members who don't link inside the same gym. Selection bias is acknowledged: linkers may be keener. |
| **Measures** | Install and link rate of active members (by channel); weekly active of linked members; check-ins through the app; renewal rate and days late; first-month visits for new joiners; owner and trainer actions (calls made, plans assigned); cost per gym; NPS from owners and members |
| **Decision** | See §14.8 and §14.9 |
| **Cost** | Founder time; ₹2–3k of challenge prizes per gym per month; WhatsApp and AI costs of perhaps ₹1,000–2,000 per gym per month (§7.3) |

**[A] Why this experiment first:**
- It tests the assumption with the most leverage (H1).
- It costs almost nothing.
- Much of it can run before the owner console is built.

If members don't come through the gym, no amount of gym software will save the platform thesis.

### 14.8 Metrics that would show product-market fit

**[A][H]** The thresholds are judgement calls anchored to the evidence cited. Revisit them after the pilot.

| Layer | Metric | Pilot signal (10 weeks) | Phase 2 PMF |
|---|---|---|---|
| **Gym** | Gyms live within 7 days of signing | 5 of 5 | ≥ 80% |
| | Owner or staff weekly active (opens the retention list or ledger 3+ days a week) | ≥ 4 of 5 gyms | ≥ 70% of gyms |
| | Gym retention | 5 of 5 continue after the pilot | ≥ 88% at 6 months (≈ 2% monthly churn) |
| | Owners referring other owners | ≥ 2 referrals | ≥ 25% of new gyms from referral |
| **Member** | Active members installed and linked, by day 60 | **≥ 40%** (minimum 25%) | ≥ 50% coverage; ≥ 70% of new joiners |
| | Weekly active / linked | ≥ 50% (any use, including check-in) | ≥ 50% |
| | Weekly *training* use (logs a workout or meal) / linked | ≥ 25% | ≥ 30% |
| | Members with a trainer-assigned plan | ≥ 30% of linked | ≥ 40% |
| | Still using FitLog 60 days after their membership lapsed | Measure only | ≥ 30% |
| **Outcome** | Renewal rate versus the gym's own baseline | Directionally up in ≥ 3 of 5 gyms | A statistically clear lift across ≥ 30 gyms |
| | New joiners with ≥ 4 visits in their first month | Up versus baseline | Up ≥ 10 points |
| **Economics** | Cost to serve per gym (core) | Within ±30% of the §7.3 model | Under ₹700 a month |
| | Pro conversion (pre-sell) | ≥ 2 of 5 say yes at the price | ≥ 20% of gyms within 6 months of launch |
| | Cost per activated member (acquisition plus first-year serving) | — | Under ₹150 (compare ~₹620 per day-30-retained paid user) |

### 14.9 Metrics that would mean we should pivot, and to what

| Signal (after 60–90 days, with the fixes tried) | What it means | Pivot |
|---|---|---|
| **Linked members under 15%**, even with QR check-in and trainers involved | Members won't come through gyms (H1 false) | **(a) Gym SaaS only**, paid, WhatsApp-first, with FitLog as a separate consumer product. Or **(b) consumer-first India**: FitLog as an honest Indian nutrition and training app, distributed through trainers and creators, not gyms. |
| Linked members high, but **weekly training use under 10%** | The app is a door key; consumer value isn't landing | Keep the gym SaaS (it works for owners) and rethink the member product (simpler, more trainer-led) before Premium |
| **Owners don't use the product beyond the ledger**; no outcome lift | Retention isn't their felt problem, or our tools don't move it | Re-position as a dues-and-collections tool (payments-led), or stop the gym line |
| **Trainers engage but owners don't** | The trainer is the real customer | **Trainer platform pivot**: a "Hevy Coach for India" with nutrition, billing and client apps (Fittr shows Indians pay for coaches) |
| **Pro conversion under 10% and Premium under 1%** after 6 months of Phase 2 | No revenue model at this cost | Charge for the core (₹999–1,999 a year, still the lowest in the market) and keep free only the member app |
| **Gym churn over 3% a month** | No lasting value, or the wrong gyms | Re-segment (PT-heavy or premium gyms), or stop |

### 14.10 Our overall assessment

**[A]**

**It can be more than a gym-management SaaS.** The way to get there is not a cross-gym marketplace. It is three things:

1. **A gym-anchored consumer platform**, where the gym is the place, the trainer is the authority, and FitLog is the member's own record.
2. **Owner software good enough to win gyms**, given away free.
3. **Verified, portable activity** that later earns money from insurers, employers and coaching.

The plan is credible because FitLog already has the consumer half and the evidence points to a real gap between the two halves. The risk is concentrated in one number, **member activation through the gym**, and that number is cheap to measure.

**Recommended decision sequence:**

1. **Ship the consumer app to the stores as planned** ([TODO](../TODO.md), [launch plan](../11-LAUNCH-PLAN.md)). The gym strategy needs it there, and it de-risks R15. Add **phone-OTP sign-in** and the **Indian catalog expansion** to launch scope, because both serve either path.
2. **In parallel, spend 2–3 weeks** on owner and member interviews, counsel review, and the weighed-meal accuracy test (§14.6).
3. **Run the 5-gym pilot** (§14.7). Start with the concierge version; build the gym MVP (§10.2) only as fast as the pilot needs it.
4. **Decide at week 10** against §14.8 and §14.9:
   - **scale** to Phase 2 and the 10,000-user plan (§11.5);
   - **fix and re-run** for one more cycle;
   - or **pivot**.
5. **Revise the charter's non-goals** (§1.2) only when step 4 says "scale". Until then, they remain the record of what FitLog is.

### 14.11 What we know, what we believe, what we're guessing

| Kind | Examples in this report |
|---|---|
| **Market facts [F]** | Cult's DRHP figures; RBI's e-mandate ₹15,000 limit; the NPCI UPI fee from 15 Oct 2026; DPDP Rules dates; the NIH photo-calorie study; Sperandei's attendance data; Planet Fitness's app adoption; Play Store install counts |
| **Competitor behaviour [C]** | Indian vendors' prices; PushPress's free plan funded by card fees; Mindbody's 20%/$30 marketplace fee; Cult's partner pitch; Fresha's marketplace share |
| **User feedback [U]** | Owner complaints about support and price hikes; member complaints about gym apps that can't log; Indian food inaccuracy; refund traps |
| **Estimates [E]** | Deloitte–HFA market size; India's app willingness-to-pay indices; our cost-to-serve model |
| **Our analysis [A]** | The within-gym network as the real network; payments as a supplement, not an engine; the beachhead choice; the moat ranking |
| **Hypotheses [H]** | H1–H10 (§14.5); progress-backed renewals lifting renewal rates; trainers as carriers between gyms; gym-bought Premium |

---

## 15. Owner decisions after review (2 October 2026)

The owner reviewed the first version of this report and made four decisions and asked one question. This section records them, assesses each against the evidence, and says what changes. **Where this section differs from §5–§14, this section wins.** Earlier sections have been edited where leaving them would mislead, and point here.

| # | Decision or question | Our assessment |
|---|---|---|
| 1 | The app **cannot be the entry checkpoint**: value gyms have no receptionist and no automated entry | **Agree.** It removes the strongest install driver, so the design has to replace it (§15.1) |
| 2 | **All AI is behind the Pro paywall**, for members and owners. For owners, almost everything else is free; Pro is only for AI assistance | **Agree, with three adjustments** (§15.2) |
| 3 | Later, earn from **relevant ads** (protein powder and similar), **never other gyms**; look at Google's ad network, but not at the start | **Agree as a top-up, not a revenue model** (§15.3) |
| 4 | **Free alerts** when a member stops coming (e.g. a week). **AI calling** of members is never free: a Pro feature, priced in tiers by usage | **Agree.** Best idea in the review; needs a data-quality rule and telecom compliance (§15.4) |
| 5 | What does "you get the first 30 days to win back a member who leaves" mean, and what is our role? | Explained, with a recommendation to make it permanent (§15.5) |

### 15.1 Decision 1: no app-gated entry; self check-in instead

**Why the decision is right [A].** Rotating QR codes, kiosks and turnstiles all need either a staffed desk or hardware. Most of the beachhead (§11.1) has neither, only an owner or trainer on the floor and sometimes a fingerprint reader. A check-in design that needs a receptionist would fail in exactly the gyms we target.

**What we lose [F/A].** Planet Fitness reached 40–60% app adoption *because* the app was the key [C §4][C]. Without that, members will install for the other reasons: fees and receipts, the trainer's plan, challenges, and progress. Optional gym apps reached about 13% in their first month (Total Fitness) [E §4][E]. **The activation risk (H1) is now higher.** The pilot thresholds stay as they are, but the *trainer* becomes the main activation channel and has to be measured as such.

**The new design: attendance without a gate.**

| Source | How it works | Cost to the gym | Phase |
|---|---|---|---|
| **Self check-in poster** | We supply a printed QR poster for the entrance. The member scans it in FitLog. The app checks the code belongs to their gym and, with permission, that the phone is within ~150 m of the gym. Without location it is recorded as "unverified". One check-in per few hours. | None | MVP |
| **Workout logged at the gym** | A workout logged while the phone is at the gym's location counts as a visit, even if the member forgot to scan | None | MVP |
| **Existing fingerprint or face reader** | eSSL and ZKTeco software exports attendance to Excel. In the pilot we upload that export weekly, by hand. Later, a direct import. | None | Pilot (by hand) → Phase 2 (automatic) |
| **Marked by owner or trainer** | One tap in the owner app, for members without smartphones | None | MVP |
| **Automatic check-in on arrival** | Opt-in background location. Android and iOS make background-location permission hard to justify and to get approved. | None | Phase 2, only if the others fall short |

**Why a member would scan without a gate [H].**
- Only scanned or verified visits count for streaks, the monthly challenge and the gym leaderboard.
- The trainer sees them.
- They feed the member's own visit history and Pro analytics.

The pilot should measure what share of real visits each source captures. Compare against the biometric reader, where a gym has one.

**The consequence for Decision 4.** Attendance will be *partial*. A member who visits but doesn't scan looks absent. That would make the absence alerts wrong exactly when they matter, so §15.4 adds a data-quality rule.

### 15.2 Decision 2: all AI is Pro; owners get the core free

**What becomes Pro.**

| | Free | Pro (AI assistance only) |
|---|---|---|
| **Member** | The whole non-AI app, which is most of what is built: the logger, programmes, history, analytics charts, manual food search, quick add, recipes, body tracking, imports and export, the gym card, challenges | **AI food analysis** (photo and text; the existing pipeline moves behind Pro). **AI workout logging** by typing or speaking ("bench 60 kilo, 3 sets of 8"). **An AI analytics agent**: a weekly review of training and food, grounded in the member's own data, with no medical advice (the PRD guardrail). Next-set progression suggestions. **No ads.** |
| **Owner** | Members, plans, fees and receipts, WhatsApp renewal reminders (utility), check-in, **absence alerts** (§15.4), reports, trainer workspace, challenges, export, and later multi-branch and the web console | **AI assistance:** why-this-member explanations and drafted messages; **AI calling** (§15.4, usage tiers); an owner Q&A assistant ("who hasn't paid?"); the trainer plan copilot; the diet-chart digitiser |

**Why it fits [A].** AI is the largest *variable* cost in the model, about ₹28 per food-logging member per month on Claude Haiku [F §7][F]. Putting all AI behind Pro means AI cost only arises for people who pay. The free tier's cost falls to the ~₹600-a-month core (§7.3).

**Three adjustments we recommend:**

1. **Let people try Pro before the wall: a 7-day trial at signup.**
   - Nobody pays for an AI feature they have never seen. "You cannot really see anything before you purchase" is a recorded complaint about Healthify [B §1.6][B].
   - Hard paywalls convert better than freemium: 10.7% against 2.1% in RevenueCat's 2026 data, with one-year retention "nearly identical" [D §4][D]. So a wall is not fatal, but a trial lets the product sell itself.
   - **Do it before the public launch.** AI food analysis is free in today's build. Taking away a feature people already use caused the MyFitnessPal barcode backlash [D §3][D]. Launching with the paywall avoids that.
2. **AI that wins us the gym stays free.** The register reader (E1) turns a paper register into a member list during onboarding. It is *our* sales cost, not a feature the owner buys. Paywalling it would slow the thing we most need: gyms going live.
3. **WhatsApp marketing broadcasts are not AI, but they cost real money.** About ₹350 per broadcast to 300 members [F §7][F]. Sell them as **at-cost message credits**, outside Pro, so the free tier isn't loaded with an open-ended cost. Utility reminders (renewals, receipts) stay free.

**Two cautions.**
- **Video workout logging is the hard one.** Recognising exercises and counting reps from video is unreliable; even Garmin's wrist-based rep counting draws complaints [D §1][D]. Video uploads also add storage and privacy weight. Ship text and voice first. Treat video as a research item. A photo of a handwritten workout notebook is a cheaper middle step that fits how many Indian members already train.
- **Store billing.**
  - Member Pro is a digital feature, so it must use Apple and Google in-app purchase (15%).
  - Owner Pro is business software. Sell it on the web or by invoice, with no purchase prompt in the app, because Google requires its billing for business software sold *inside* the app [F §5][F].

### 15.3 Decision 3: relevant ads later, never other gyms

**Terminology.** AdSense is Google's ad network for *websites*. For apps it is **AdMob** (or Google Ad Manager).

**The economics [E].** India has some of the lowest mobile ad rates. Reported AdMob eCPMs (revenue per 1,000 impressions) for India are roughly:
- banners: $0.1–1.2;
- interstitials: $0.7–1.5;
- rewarded ads: around $1.

These come from developer reports and vendor blogs, so they are low-reliability ([ReachEffect](https://reacheffect.com/blog/how-much-can-an-app-make-from-advertising/), [Kodular community](https://community.kodular.io/t/admob-revenue-in-india/119959)).

**[A] What that is worth.** A free user who sees ~20–30 non-intrusive impressions a month earns about **₹1–5 a month**. At 100,000 monthly active free users that is about ₹1–5 lakh a month: worth having, but not a business model.

**Direct sponsorship pays better than ad networks.** Examples: a nutrition brand sponsoring the monthly gym challenge, or a protein brand placed in the food diary. These are also more relevant and easier to control.

**Guardrails [A]:**
- **Never inside the logger or during a workout.** The 3-second set-logging budget is the product's core promise.
- **Contextual, not personal.** Show protein ads in the food diary. Do not target ads on a person's body, food or health data. Under DPDP that needs specific consent, and it is the kind of use that loses members' trust.
- **18+ only.** The consumer app is already 18+ (§13.2).
- **Verified brands only.** Counterfeit and mislabelled supplements are a widely reported problem in India; the figures are weakly sourced but the reputational risk is not. Advertising claims must also follow India's advertising self-regulator (ASCI) rules.
- **The gym's own supplement counter.** Many value gyms sell supplements [A §4][A]. A protein ad in the app competes with the owner's own counter. Let owners opt their gym out of supplement ads, or give them a revenue share on sales to their members.
- **Never other gyms**, in ads or anywhere else (this also settles promise 5, §15.5).
- **Pro removes ads.**

**When.** After the consumer app has real scale (say 50,000+ monthly active users). Not in the MVP or the pilot.

### 15.4 Decision 4: free absence alerts; AI calling is paid, by usage

**The free layer: alerts.** These are the "today's five calls" list (A5) made concrete.

- **Rules the owner can adjust:**
  - no visit in 7 days (5, 7 or 10);
  - a new member with fewer than 4 visits in their first 30 days;
  - a renewal due within 10 days, with attendance falling;
  - a lapsed member inside their first month.
- **Delivery:** a daily push notification to the owner, plus the ranked list.
- **Action:** one tap opens a drafted WhatsApp message in the owner's *own* WhatsApp, which costs nothing.

The evidence is strong. At-risk members who had a successful re-engagement contact were 45% less likely to cancel (IHRSA/TRP, 13,000+ UK members) [C §5][C].

**The data-quality rule** (needed because of Decision 1):
- Alert with confidence only for members whose attendance is reliably captured: those on a biometric import, or those who have been scanning regularly. For them, a gap really is a gap.
- For members who rarely scan, show the alert as "low confidence: may be visiting without scanning".
- Otherwise owners will phone members who did come, and stop trusting the alerts.

**The paid layer: AI calling (Pro, never free).**

**How it works:**
1. An alert fires.
2. The owner approves the call, or sets a rule to call automatically.
3. An AI voice agent calls in Hindi, Hinglish or English as "<Gym>'s assistant".
4. It opens by saying it is an automated call on the gym's behalf.
5. It checks in warmly, asks why they've been away, and offers to book a trainer slot or freeze the membership.
6. It records the reason against the member.
7. The result lands in the owner's list.

**What it costs us [E].**
- Quoted Indian voice-AI rates are about ₹2–12 a minute, most often ₹3–6. Bolna, for example, lists about $0.06 a minute.
- In production, a ₹3 quote typically lands at **₹6–9 a minute** once telephony, a Hindi-language surcharge and other fees are added ([eCorpIT, Jul 2026](https://ecorpit.com/ecorpit-ai-voice-agent-development-service-india-2026/); [Bolna](https://bolna.ai/pricing)).
- A 1–2 minute call therefore costs about ₹6–18.

**Pricing in usage tiers [A][H].** Illustrative, to be set after a cost test. Each tier should keep at least ~1.5–2× margin over the voice cost.

| Tier | Includes | Indicative price per month |
|---|---|---|
| **Pro Assist** | All owner AI except calls: explanations, drafted messages, Q&A, trainer copilot, diet-chart digitiser | ₹799 |
| **Pro Calls 100** | Assist + 100 call-minutes (≈ 60–80 calls) | ₹1,999 |
| **Pro Calls 400** | Assist + 400 call-minutes | ₹5,999 |
| Overage | Per extra minute | ₹15 |

- Prices are before 18% GST.
- Gyms can't reclaim that GST, because gym services are taxed at 5% with no input tax credit [A §3][A].

**Compliance. Get counsel to review this before AI calling launches.**

- **TRAI, Sept 2026.** Automated and pre-recorded calls must carry a **pre-declaration**, or they count as spam. A ₹0.05 termination charge now applies per automated call ([TRAI, via NewKerala, 18 Sep 2026](https://www.newkerala.com/news/a/trai-tightens-spam-rules-mandates-pre-declaration-robocalls-673.htm)).
- **Promotional calls** must come from DLT-registered 140-series numbers and be scrubbed against Do Not Disturb preferences ([Digit](https://www.digit.in/news/general/trai-vs-truecaller-regulator-clarifies-how-1600-and-140-numbers-should-be-handled.html)).
- **The open legal question.** Is a "we miss you" call a service call or a promotional one? A win-back *offer* is likely promotional.
- **DPDP.** The gym's enrolment consent must cover calls about attendance and membership. Recordings are personal data, so set retention limits. Never call minors.
- **Member experience.** A fixed calling window (e.g. 10 am–8 pm). At most one AI call per member every 14 days. A spoken opt-out ("say stop").

**Sequencing [A].**
- **MVP:** free alerts and drafted WhatsApp messages. Pre-sell Pro Assist and Pro Calls to pilot owners.
- **Phase 2:** launch AI calling once the pilot shows that owners act on alerts and say yes to the price.

### 15.5 Question 5: what "the first 30 days to win back a member" means, and our role

**What it guards against.** When a membership lapses, the person usually keeps their FitLog account, because it is their own app. A platform with a gym-discovery feature could start showing that person other gyms the day the membership ends. That is the poaching owners fear from aggregators (§3.3b, §6.7). The promise says we don't, and that their gym gets an exclusive window to bring them back.

**Our role in those 30 days:**

1. **Hold back.** No other gym is shown to the person, in ads, discovery or anything else.
2. **Tell the owner.** The member appears in the "lapsed" list with their exit reason, from the one-tap WhatsApp quick reply.
3. **Give the owner the tools:**
   - a drafted win-back message;
   - a rejoin link;
   - a "come back" offer shown in the member's app;
   - and, with Pro, an AI call.
4. **Keep the person training** (break mode, B6). They stay reachable and in the habit, which makes a return more likely. 38% of people who drop out return within 12 months, most of them in the first month [C §5][C].

**After 30 days.** The window only matters if we ever build gym discovery (D5, Phase 3). Decision 3 already rules out ads for other gyms.

**Recommendation [A]: make the promise permanent and drop gym discovery.** Rewrite promise 5 as *"We never point your members, current or former, to another gym. When one leaves, we tell you and help you win them back."*

- **What it costs:** the lead-generation marketplace (M7, D5). Every analog says that is thin and full of conflict (§3.3c, [E §2][E]).
- **What it buys:** a promise Cult.fit and the aggregators cannot match.

The documents now use the clearer 30-day wording. **Making it permanent is the owner's call.**

### 15.6 The revenue picture after these decisions

Illustrative, per gym per month. Same assumptions as §7.3 (300 members, 120 on the app). **[A][H]**: every input is a hypothesis.

| Layer | Assumption | Revenue | Its own cost |
|---|---|---|---|
| Owner Pro (AI) | 20% of gyms; average ₹1,500 | ≈ ₹300 | Voice minutes for the calling tiers (priced at ≥ 1.5–2× cost) |
| Member Pro (AI) | 3% of 120 app users at ~₹110 net of store fees | ≈ ₹396 | ≈ ₹100 of AI (₹28 per user) |
| Ads and sponsorship (later) | ~70 monthly active free users × ₹1–5 | ≈ ₹70–350 | Negligible |
| Message credits | At cost | ≈ ₹0 margin | Pass-through |
| Payments share (Phase 2) | Through a licensed aggregator | ~₹100–300 for gyms that use it | — |
| **Total, before payments** | | **≈ ₹766–1,046** | AI ≈ ₹100 + voice |
| **Free-core cost** | §7.3 lean | | **≈ ₹600** |

**[A] Verdict.**
- The free core is roughly covered when ~20% of gyms take an AI tier and ~3% of members take Pro. Ads and payments are the margin on top.
- **Pricing AI by usage is what keeps the model safe.** Every rupee of AI cost now has a paying customer behind it.
- What the model cannot survive is Pro conversion well below those assumptions. That is why the pilot pre-sells Pro (H5) before anything is built for it.

### 15.7 What changes in the plan

- **Check-in (A4), §6.4 and §10.2.** Now self check-in plus imports and manual marking. Earlier sections are edited.
- **Retention (A5).** Alerts are free and carry a data-quality rule. AI calling is a Pro tier (Phase 2).
- **AI (§5 E).** Every E feature is Pro, *except* the register reader (E1).
- **New Pro features.** AI workout logging (text and voice; video later) and the AI analytics agent are added.
- **Money (§7).** The owner's Pro tier is AI-only. Member Premium becomes member Pro. Ads and sponsorship are added for later. Broadcasts move to at-cost credits. Gym-bought seats (M4) stay possible as "Pro seats".
- **Pilot (§14.7).** Add these measures:
  - the share of real visits captured by each attendance source;
  - alert precision: how many alerted members really hadn't visited;
  - owner action on alerts;
  - Pro trial use and conversion among pilot members;
  - owners' yes or no to the Pro Calls price, pre-sold.
- **Promise 5.** Clearer wording now; permanence is the owner's decision (§15.5).


---

## Appendix: glossary

| Term | Meaning here |
|---|---|
| **Activation** | A gym member who has installed FitLog *and* linked it to their membership |
| **Coverage** | Activated members ÷ the gym's active members |
| **Atomic network** | The smallest group that makes the product useful on its own. Here, one gym's members and trainers |
| **B2B2C** | Selling to (or giving to) a business that brings its customers onto our consumer product |
| **Concierge pilot** | Doing by hand what the product will later automate, to learn before building |
| **DPDP** | India's Digital Personal Data Protection Act 2023 and Rules 2025 |
| **Data fiduciary / processor** | The party that decides why and how personal data is processed, and the party that processes it on that party's behalf |
| **PA** | Payment aggregator: an RBI-licensed entity that collects and settles payments for merchants |
| **MDR** | Merchant discount rate: the fee a merchant pays per card or UPI payment |
| **e1RM** | Estimated one-rep maximum |
| **PT** | Personal training |
| **Pro** | The paid AI tier (§15.2). For owners: AI assistance and usage-priced AI calling. For members: all AI features. "Member Premium" in §5–§14 means member Pro. |
| **Owner-safety charter** | The five written promises to gym owners in §6.7 |

<!-- Evidence briefs (reference-style links used throughout) -->
[A]: R3-evidence/A-india-gym-software.md
[B]: R3-evidence/B-india-consumer-fitness.md
[C]: R3-evidence/C-global-gym-software.md
[D]: R3-evidence/D-consumer-apps-and-virality.md
[E]: R3-evidence/E-b2b2c-analogs.md
[F]: R3-evidence/F-india-regulation-and-costs.md
