# FitLog × gyms — executive summary

| | |
|---|---|
| **Date** | 2 October 2026 |
| **Decision asked for** | Approve a 12–13-week validation (interviews plus a 5-gym pilot) before building the gym product. Not the full build. |
| **Revised** | After the owner's review (2 Oct 2026): no app-gated entry, all AI behind Pro, ads later, paid AI calling, promise 5 clarified ([report §15](R3-gym-b2b2c-strategy.md#15-owner-decisions-after-review-2-october-2026)) |
| **Read more** | [Full report](R3-gym-b2b2c-strategy.md) (§ numbers below point into it) · [Presentation](R3-presentation.html) · [Evidence](R3-evidence/README.md) |

---

## The question

Should FitLog give gym-management software to Indian gym owners for free, and use each gym to bring its members onto the FitLog app? And could that grow into a fitness platform rather than another gym-software business?

## The answer

**Yes, but in a narrower form than first imagined.**

- **What works.** The FitLog app becomes each gym's membership card, fee book and trainer's notebook.
  - Members install it because their gym runs through it: fees and receipts, the trainer's plan, and self check-in that counts for challenges. It is not an entry gate; value gyms have no receptionist.
  - They keep it because FitLog's workout logger and Indian-food nutrition tracking are better than anything a gym app offers.
- **What the evidence supports.** A network effect *inside each gym*: owner, trainers and members on one system.
- **What is optional upside for later.** A network *across* gyms: members carried from gym to gym, or a gym marketplace. It is also dangerous if owners see it as poaching their members.

## What the research found

**Labels:** **[F]** fact · **[C]** company claim · **[E]** estimate · **[A]** our analysis. Sources and dates are in the report.

1. **The market is large and long-tail.**
   - India has about 46,500 gyms and 12.3M members.
   - 80% are value gyms, each with about 258 members paying under ₹14,000 a year.
   - 32,000 gyms are outside the top 10 cities.
   - **[E]** Deloitte–HFA 2025 (§3.1).
2. **Gym software is cheap and commoditised.**
   - 40+ Indian apps sell member records, reminders and attendance for **₹2,000–12,000 a year**.
   - Owners complain about support, renewal price hikes and bugs, not missing features.
   - **[C]** Pricing pages and owner reviews (§3.3–3.4).
3. **Members skip gym apps unless they have to use them.**
   - GymBook's member app has 500+ installs; its owner app has 50,000+.
   - Planet Fitness reached 40%, then ~60%, adoption because its app is the door key.
   - **[F]** (§3.5).
4. **Networks across businesses stay small, even for the leaders.**
   - Mindbody's app produces ~22,000 first purchases a month, against 60M bookings.
   - Fresha's marketplace brings ~10% of new clients, after 11 years.
   - **[C]** (§3.3c, evidence E).
5. **India won't pay for "free" through payment fees.**
   - UPI payments under ₹2,000 carry no merchant fee.
   - From 15 Oct 2026, payments above ₹2,000 carry 0.4%, and that fee goes to the payments chain, not to us.
   - Free Indian small-business apps lost about as much as they earned (Khatabook FY24: ₹102.7 cr revenue, ₹116.2 cr loss).
   - **[F]** (§7.4).
6. **"Free" costs us money.**
   - Serving one gym costs **₹600–1,000 a month** before AI, and about ₹1,800 with heavy use of AI food photos.
   - Incumbents charge about ₹200 a month.
   - **[E]** Our cost model (§7.3).
7. **Retention science gives owners a reason to push the app.**
   - Four or more visits in the first month, contact with staff, and friends at the gym all predict staying.
   - 63% of new members stop coming before month 3.
   - In India, 48% of people who quit say they would rejoin.
   - **[F][E]** (§4.1).
8. **The gym channel beats paid ads only if members activate.**
   - First-year cost per activated member is about ₹70 at 40% activation, ₹187 at 15% and ₹280 at 10%.
   - Paid acquisition costs about ₹195 per signup, or about ₹620 per user still active at day 30.
   - **[A]** (§6.8).

## What we recommend

**Product: "FitLog for Gyms"** (§5, §10)

- **For the owner:**
  - fees, dues and receipts;
  - WhatsApp renewal reminders;
  - self check-in: members scan a QR poster, with a location check, plus imports from existing fingerprint readers and one-tap manual marking (no gate, no receptionist needed);
  - **free absence alerts** ("hasn't come in 7 days") and a daily *"today's five calls"* list built from retention science;
  - a workspace for trainers.
- **For the member (the existing FitLog app):**
  - a gym card with status, dues, receipts and self check-in;
  - the trainer's plan, opened in FitLog's logger;
  - honest Indian-food nutrition;
  - a weekly "one thing that improved".
- **Shared:**
  - the plan loop: trainer assigns, member logs, trainer adjusts;
  - consent the member controls;
  - renewal reminders that show the member's progress;
  - monthly gym challenges.

**Five written promises to gym owners** (§6.7). These are our edge over Cult.fit and the aggregators:

1. We never show another gym to your active members.
2. We take no commission on members you bring.
3. Your data is yours, with free export at any time.
4. Your members see your gym's name in the app.
5. If a member leaves, we tell you, give you the tools to win them back, and show them no other gym for at least 30 days. We recommend making that permanent and never building gym discovery ([report §15.5](R3-gym-b2b2c-strategy.md#155-question-5-what-the-first-30-days-to-win-back-a-member-means-and-our-role)).

**Money** (§15.2–15.6)

- **For owners, everything except AI is free.** That includes fees, reminders, check-in, absence alerts, reports and trainer tools.
- **All AI is Pro**, with a 7-day trial:
  - **Members:** AI food analysis (photo and text), AI workout logging by text and voice, and a weekly AI analytics agent.
  - **Owners:** AI assistance, plus **AI calling** to absent members. Calling is never free and is priced in tiers by usage. AI voice costs about ₹6–9 a minute in production.
  - Gyms can buy Pro seats for their members.
- **Later:**
  - relevant ads and brand sponsorship (never other gyms, never in the workout logger);
  - a share of payment fees;
  - insurers and employers paying for verified activity.
- **Illustrative economics:** about ₹766–1,046 revenue per gym per month against a ~₹600 free core. Every rupee of AI cost now has a paying user behind it. India's ad rates are low, so ads are a top-up, not a model.

**Changes to FitLog** (§1)

- Keep everything that is built.
- Add phone-number sign-in, Hindi/Hinglish UI, a trainer role, gym-scoped challenges and payment records.
- These reverse four charter decisions, but only if the pilot says "scale".
- Grow the 138 Indian dishes using USDA-derived recipes. The Indian food composition tables (IFCT) can't be licensed for the app.

**Not now:**

- a cross-gym marketplace;
- a global social feed;
- an "AI coach" chatbot;
- online payment collection (Phase 2);
- gym chains.

## Where it could fail

| Risk | Mitigation |
|---|---|
| **Members don't install** (the thesis risk, higher now that the app can't be the entry gate) | Make the app the gym's workflow: card, receipts, the trainer's plan, self check-in that counts for challenges. The trainer is the main activation channel. WhatsApp fallback for the rest. |
| **Owners use it only as a ledger** | Build the member invite into joining and receipts. Show the owner a coverage score. Absence alerts get better as more members join. |
| **Nobody pays** | AI only behind Pro, so cost follows revenue. Pre-sell owner Pro and AI calling in the pilot. Keep the free core lean. |
| **AI calling breaks telecom rules** | Automated calls must declare themselves (TRAI, Sept 2026). Promotional calls need registered 140-series numbers. Get counsel review before launch. |
| **Privacy and India's data law (DPDP)** | The invite is sent in the gym's name, once. The member gives separate consent. FitLog is 18+. No Aadhaar collection. Counsel review before the pilot. |
| **Cult.fit bundles free software** | Neutrality (the five promises), density in a few cities, support quality. |

## The decision we're asking for

**Approve the validation, not the build. Keep the consumer store launch going in parallel**, adding phone sign-in and more Indian dishes, which help either way.

**Weeks 0–3**

- Interview 20–30 gym owners and 30–50 members.
- Get counsel to review the invite and consent design.
- Test AI accuracy on weighed Indian meals.
- Run a hand-operated ("concierge") version with 2 gyms.

**Weeks 3–13**

- A **5-gym pilot** in one city.
- Gym MVP parts are switched on as they ship.

**Cost:** about **₹40–60k** in cash (challenge prizes, WhatsApp, AI), plus founder time.

**Decide at week 13:**

| Outcome | Condition |
|---|---|
| **Scale** | ≥ 40% of active members linked by day 60, **and** ≥ 25% of them logging a workout or meal weekly, **and** renewals up in ≥ 3 of 5 gyms, **and** ≥ 2 of 5 owners say yes to Pro |
| **Fix and re-run** | Short of these, but trending up |
| **Pivot** | Linked members under 15%. Options (§14.9): paid gym software only, a consumer-first app for India, or a trainer platform. |

---

*Our analysis of public sources. No gym owner has been interviewed yet; that is the first step above. The reading of India's data law (DPDP) is not legal advice.*
