> **R3 evidence brief F — Indian regulation, payments and unit costs.** Compiled on 2 Oct 2026 by an automated web-research agent for
> [R3 — Gym-led B2B2C strategy](../R3-gym-b2b2c-strategy.md). Tags and sources are as the agent recorded
> them; a claim tagged [ESTIMATE], [LEGAL INTERPRETATION] or [UNVERIFIED] has not been re-verified. Kept unedited
> so every number in the report can be traced to where it came from. **Not legal advice.**
>
> **Correction (2 Oct 2026, verified after this brief was written):** §4 says an MDR for large UPI merchants was
> "still only a proposal as of July 2026". NPCI has since issued it: from **15 Oct 2026**, 0.4% on person-to-merchant
> UPI payments above ₹2,000, capped at ₹300; small merchants under ₹1 lakh a month of UPI collections stay exempt; the
> fee may not be passed to customers ([Kotak Neo, 16 Sep 2026](https://www.kotakneo.com/news/regulations/upi-mdr-october-15-0-4-percent-charge-exemptions/)).
>
> **Correction 2 (2 Oct 2026, from the report's fact-check):** §7 prices one marketing broadcast to 300 members at
> "about ₹305". That leaves out the 15% provider markup that §7's own assumption 4 applies:
> 300 × ₹0.8631 × 1.15 × 1.18 ≈ **₹351**. The table's WhatsApp totals (₹87 lean, ₹439 base) already include the
> markup and are unaffected. Figures the report derives from this model, rather than quoting it, are worked in the
> report itself: §6.8 (₹505 a month to serve a gym, which is the lean core minus its ₹97 field-sales line, so sales
> aren't counted twice), §7.5 (≈₹270 of AI for Premium users) and §11.6 (≈₹84 lakh for 1,000 gyms' first year).

# India gym SaaS and consumer fitness app: regulation and unit-cost brief (as of 2 Oct 2026)

**How this was researched.** I ran 15 WebSearch queries. After that the session's shared search cap (200/200) ran out, so I stopped searching and fetched about 50 primary documents directly instead. I downloaded the Gazette PDFs of the DPDP Act and Rules and the Aadhaar Act (as amended) and read the text locally, and fetched RBI, Meta, Google, Apple, Anthropic, Supabase and vendor pricing pages. References in the form [S#] point to Section 8, which gives the URL and date for each. No files were written. This is not legal advice.

---

## 1) DPDP Act 2023 and DPDP Rules 2025: what it means when gym member data flows to us

**What is in force, and when**
- [FACT] The Rules are G.S.R. 846(E), Gazette No. 760, dated **13 Nov 2025** [S1]. PIB says "notified on 14 November 2025"; the Gazette's e-ID is dated 14 Nov 2025 [S1][S3].
- [FACT] Rule 1 sets the start dates [S1]:
  - Rules 1, 2 and 17–21 (the Data Protection Board) started on publication.
  - **Rule 4 (Consent Managers) starts one year later, on 13 Nov 2026.**
  - **Rules 3 and 5–16, 22 and 23 start 18 months later, on 13 May 2027.** These cover notice, security, breach reporting, retention, children, Significant Data Fiduciaries, data principal rights and cross-border transfer.
- [LEGAL INTERPRETATION] The start dates for the Act itself, per one commentary [S4]:
  - Sections 2, 18–26 and 35–43 started on 13 Nov 2025.
  - Sections 6(9) and 27(1)(d) start on 13 Nov 2026.
  - Sections 3–17 and 44(2) start on 13 May 2027.
  - The source's own table is inconsistent about s.44(2).
- [FACT, secondary] In January 2026 MeitY proposed cutting the compliance window to 12 months, which would make the deadline 13 Nov 2026. Comments were due by 4 Feb 2026 [S6]. A King Stubb & Kasiva article dated 14 Aug 2026 still gives 13 May 2027 [S5].
- [UNVERIFIED] I found no notified amendment that changes the timeline.
- **Net effect:** in Oct 2026 the main obligations are not yet enforceable, but the product should be built to them now.

**Who is the data fiduciary and who is the processor**
- [FACT] Definitions and liability [S2]:
  - A Data Fiduciary "alone or in conjunction with other persons determines the purpose and means" of processing (s.2(i)).
  - A Data Processor processes "on behalf of a Data Fiduciary" (s.2(k)).
  - The fiduciary is responsible for processing done by its processor "irrespective of any agreement to the contrary" (s.8(1)).
  - A processor may be engaged "only under a valid contract" (s.8(2)).
- [FACT] Rule 6(1)(f) requires security-safeguard clauses in the fiduciary–processor contract [S1]. The Act's penalty schedule applies to Data Fiduciaries [S2][S3].
- [LEGAL INTERPRETATION] How this maps to us:
  - **Gym-management module:** the gym is the fiduciary and we are its processor, under a data processing agreement.
  - **Consumer app:** we are an independent fiduciary for the account a member creates with us.
  - **The invitation step is the risk.** If we take a gym's uploaded member list and use it to promote *our* app, we are deciding a purpose ourselves. That makes us a fiduciary for that processing, without consent that covers it.
  - Benchmarking or analytics across gyms risks making us a **joint fiduciary**.

**Purpose limitation: can gym-provided data be used to market our app?**
- [FACT] What the law requires:
  - Consent must be "free, specific, informed, unconditional and unambiguous… for the specified purpose and be limited to such personal data as is necessary" (s.6(1)) [S2].
  - The Rule 3 notice must give an "itemised description" of the data, the "specified purpose" and a "specific description of the goods or services", plus easy withdrawal [S1].
  - The s.7(a) "legitimate use" ground covers only "the specified purpose for which the Data Principal has voluntarily provided" the data [S2].
- [LEGAL INTERPRETATION] Consent to a gym membership does not cover marketing a third party's app. A defensible design:
  1. The gym's enrolment notice names "member app operated by [Platform] on our behalf" as a purpose.
  2. One invitation is sent in the gym's name. No re-marketing to people who don't respond.
  3. When the member signs up, they give us a fresh, separate consent for AI nutrition, photos and measurements.
  4. The data processing agreement bars us from using gym data for our own purposes.
  5. We never send our own WhatsApp marketing templates to gym-supplied numbers.

**Children (gyms have teenage members)**
- [FACT] Under the Act [S2]:
  - A child is anyone under 18 (s.2(f)).
  - The fiduciary must get **verifiable parental consent** before processing a child's data (s.9(1)).
  - It may not process in a way that harms the child's well-being (s.9(2)).
  - It may not do **"tracking or behavioural monitoring of children or targeted advertising directed at children"** (s.9(3)).
- [FACT] Rule 10 [S1]:
  - The fiduciary must check the parent is an identifiable adult, using reliable details it already holds, or identity/age details or a "virtual token" from an authorised entity.
  - DigiLocker is explicitly allowed for this.
- [FACT] The Fourth Schedule exemptions [S1]:
  - Classes exempted: clinical establishments, healthcare and allied-health professionals, educational institutions, crèches, and child transport.
  - Purposes exempted: email-only accounts, real-time location for safety, and age verification.
  - **Gyms and fitness apps are not listed.**
- [FACT] The penalty for breaching child obligations is up to ₹200 crore [S2].
- [LEGAL INTERPRETATION] Food logs, body measurements, progress photos and workout analytics for a 16-year-old plausibly count as "behavioural monitoring". Recommended approach:
  - Make the consumer app **18+ with an age gate**.
  - In the gym module, the gym records minors only after it captures parental consent. We supply a parent OTP flow and a DigiLocker option.
  - Keep minors out of analytics and marketing.

**Health, fitness and biometric data**
- [FACT] The DPDP Act has **no "sensitive data" category**. Sensitivity appears only as one factor in designating Significant Data Fiduciaries (s.10(1)(a)) [S2].
- [FACT] Section 44(2)(a) deletes IT Act s.43A [S2]. Per [S4] that takes effect on 13 May 2027 [LEGAL INTERPRETATION]. Until then s.43A and the SPDI Rules 2011 still apply.
- [FACT] Aadhaar Act s.30 says biometric information is deemed "sensitive personal data or information" under the IT Act rules [S7].
- [UNVERIFIED in this session] SPDI Rule 3 lists health conditions, medical records and biometrics as sensitive, and Rule 5 requires written consent. I could not retrieve the primary text.

**Significant Data Fiduciary (SDF)**
- [FACT] The Central Government designates SDFs based on volume and sensitivity of data, risk to people's rights, sovereignty and integrity, electoral democracy and similar factors. The Act sets **no numeric threshold** [S2].
- [FACT] SDF duties (Rule 13) [S1]:
  - A data protection impact assessment and an audit every year.
  - Due diligence on algorithmic software.
  - Keeping government-specified data inside India.
- [FACT] The SDF penalty is up to ₹150 crore [S2].
- [UNVERIFIED] I found no SDF notification.

**Breach, security, retention, rights and penalties**
- [FACT] Rule 6 sets minimum security measures [S1]:
  - Encryption, masking or tokenisation.
  - Access control.
  - Logging and monitoring.
  - Backups.
  - Keeping logs for one year.
- [FACT] Rule 7 breach notification [S1]:
  - Each affected person must be told "without delay".
  - The Board must get an initial notice "without delay" and a detailed report **"within seventy-two hours"**.
- [FACT] Rule 8(3): fiduciaries and their processors must keep personal data, traffic data and logs for **at least one year** for the Seventh Schedule purposes (State access) [S1].
- [FACT] The Third Schedule's erasure after three years of inactivity applies only to e-commerce entities with at least 2 crore users, online gaming and social media [S1]. **It does not apply to us.**
- [FACT] Data must be erased when consent is withdrawn or the purpose is served (s.8(7)) [S2]. Grievances must be answered within 90 days (Rule 14(3)) [S1].
- [FACT] Maximum penalties [S2][S3]:
  - Security safeguards: **₹250 crore**.
  - Breach notification: ₹200 crore.
  - Children's data: ₹200 crore.
  - SDF duties: ₹150 crore.
  - Duties of data principals (individuals): ₹10,000.
  - Everything else: ₹50 crore.

**Consent managers and cross-border transfer**
- [FACT] Consent managers register with the Board from 13 Nov 2026. They must be Indian companies with net worth of at least ₹2 crore [S1][S3].
- [LEGAL INTERPRETATION] Using a consent manager is optional for a fiduciary.
- [FACT] Cross-border transfer [S2][S1]:
  - Transfers are allowed except to countries the government notifies (a negative list) (s.16).
  - Rule 15 adds conditions about making data available to foreign states.
  - Rule 13(4) can require SDFs to keep specified data in India.
- [LEGAL INTERPRETATION] Sending food photos to Anthropic in the US is allowed today; disclose it in the notice.
- [FACT, secondary] MeitY floated cross-border restrictions for SDFs in January 2026 [S6].

---

## 2) Aadhaar and biometrics

- [FACT] Section 57, the clause that allowed private use of Aadhaar, reads **"[Omitted.]"** in the Act as amended [S7]. It was struck down in *Puttaswamy* (2018) [S8].
- [FACT] Section 4(4): an entity may authenticate members with Aadhaar only if it meets UIDAI's privacy and security standards **and** either (i) a law of Parliament permits it, or (ii) the Central Government has prescribed the purpose "in the interest of State" [S7].
- [FACT] Section 4(6): an entity must offer "alternate and viable means of identification" and "shall not deny any service" to someone who won't authenticate with Aadhaar [S7].
- [FACT] On 31 Jan 2025 the Aadhaar Authentication for Good Governance Amendment Rules 2025 let non-government entities apply through a ministry. UIDAI reviews and MeitY approves. Critics call it re-legislating what *Puttaswamy* struck down [S8].
- [FACT] Offline verification (s.8A) [S7]:
  - The verifying entity needs consent and may use the data only for the verification.
  - It **"shall not… collect, use, or store an Aadhaar number or biometric information of any individual for any purpose."**
- [FACT] Other limits [S7]:
  - Section 29(3) limits identity information to purposes stated in writing.
  - Section 29(1) bars sharing or reusing core biometrics.
- [LEGAL INTERPRETATION] Neither gyms nor we should collect Aadhaar numbers or photocopies as member ID. Safer alternatives:
  - Phone OTP over SMS or WhatsApp.
  - DigiLocker, which Rule 10 already recognises, for age and parent checks [S1].
  - Looking at any government ID without storing it.
- [UNVERIFIED] I did not fetch UIDAI's masking and "Aadhaar Data Vault" regulations.
- **Biometric attendance** [LEGAL INTERPRETATION]:
  - Fingerprint and face templates are personal data and need specific consent under s.6.
  - For consent to be "free" and "unconditional", always offer QR, app or RFID check-in as an alternative.
  - Keep templates on the device. Do not upload face images to the cloud.
  - Apply the Rule 6 encryption and one-year log requirements [S1].
  - Until May 2027, biometrics are sensitive data under the IT Act regime (Aadhaar s.30) [S7].
  - Do not take biometrics from minors.
  - A failed safeguard can draw a penalty of up to ₹250 crore [S2].

---

## 3) WhatsApp and SMS: rules and prices

**WhatsApp Business Platform**
- [FACT] Pricing has been per message since 1 Jul 2025. A charge applies only when a template message is delivered [S9].
  - Messages that are not templates, sent inside an open 24-hour customer-service window, are free.
  - Utility templates sent inside an open window are free.
  - Free-entry-point windows stay open for 72 hours.
  - Utility and authentication templates get **volume tiers**; marketing does not [S9].
- [FACT] INR billing:
  - INR billing started on 1 Jan 2026 for businesses whose Sold-To country is India.
  - Accounts must move to INR by **31 Dec 2026**.
  - Non-INR accounts stop delivering messages from 1 Jan 2027 [S9][S10].
  - The India marketing rate went up on 1 Jan 2026, and the India "authentication-international" rate went up on 1 Apr 2026 [S10].
- [VENDOR PRICE, secondary; Meta's rate-card CSV was not retrievable] India Meta rates [S14]:
  - **Marketing: ₹0.8631** per message (₹0.7846 before 1 Jan 2026).
  - **Utility: ₹0.115.**
  - **Authentication: ₹0.115.**
  - Service messages: free.
- [UNVERIFIED, high impact] Several providers (WATI, Zoho, Gupshup, Darwin) say that **from 1 Oct 2026 Meta bills service messages and utility templates sent inside the window**, with about 1,000 free service messages a month [S15][S16][S17].
  - The 1,000 allowance is per WhatsApp Business Account according to WATI, but per number according to AiSensy [S19].
  - Meta's own pricing pages, fetched today, still say both are free [S9].
  - I modelled both cases.
- [FACT] Marketing frequency caps: WhatsApp "may limit the number of marketing template messages a WhatsApp user receives from any business in a given period". The limit adapts to the user's engagement and the number is not published [S11].
  - India is not exempted; only the EEA, UK, Japan and South Korea are.
  - Marketing messages sent inside a window the user opened do not count toward the cap [S11].
  - Undelivered messages return error **131049** [S12].
- [FACT] Template categories [S13]:
  - A template that mixes utility content with promotion is treated as **marketing**, and so is a vague one.
  - Meta can move a template from utility to marketing, usually with 24 hours' notice.
  - Each template is APPROVED, PENDING or REJECTED, and you have 60 days to ask for a category review.

**Provider (BSP) pricing** [VENDOR PRICE]

| Provider | Fixed fee | Marketing | Utility | Auth | Source |
|---|---|---|---|---|---|
| Gupshup | $0.001/msg platform fee + Meta at cost | Meta at actuals | Meta at actuals | Meta at actuals | [S17] |
| Interakt | Growth ₹2,799/mo; Advanced ₹3,799/mo | ₹0.949–0.970 | ₹0.140–0.160 | ₹0.127–0.129 | [S18] |
| AiSensy (rates "effective 1 Oct 2026") | Add-ons, e.g. ₹2,500/mo chatbot builder | ₹1.09 | ₹0.145 | ₹0.145 | [S19] |
| WATI | $29 / $79 / $199 per month; ₹999 pay-as-you-go | Not listed | Not listed | Not listed | [S20] |

- AiSensy also charges ₹0.145 per service message after the first 1,000 free each month.
- [VENDOR PRICE, secondary] Indian providers typically add a 10–30% markup, plus **18% GST** on both Meta and provider charges [S14].

**SMS and phone OTP**
- [FACT] Supabase's documentation warns that India's **TRAI DLT** rules apply to SMS senders [S26].
- [UNVERIFIED] The detailed TCCCPR-2018 rules (registering the business entity, sender headers and message templates) and the DLT registration fees: I could not fetch TRAI's primary documents; not found.
- [VENDOR PRICE] Per-SMS prices:
  - **MSG91:** ₹0.25 per SMS at 5,000 messages, falling to ₹0.16 at about 9.6 lakh; enterprise "up to ₹0.13" [S21].
  - **Twilio:** $0.0832 per SMS to India from international numbers, plus $0.001 per failed message [S22].
  - **Firebase / Google Identity Platform:** **India $0.07 per SMS**, first 10 SMS a day free, Blaze plan required. Sign-in accounts are free up to 50,000 monthly active users, then $0.0055 each (50k–100k) and $0.0046 each (100k–1M) [S23][S24].
  - **Supabase:** you pay your own SMS provider (Twilio, MessageBird, Vonage, or Textlocal, which is community-supported). The Phone MFA add-on costs $75 a month [S25][S26].

---

## 4) Payments: rules and prices

**Recurring payments (UPI Autopay and e-mandates)**
- [FACT] RBI's *Digital Payments – E-mandate Framework, 2026*, circular dated 21 Apr 2026, effective immediately, covers cards, prepaid instruments and UPI [S27]:
  - Registration needs additional factor authentication (AFA, an extra authentication step by the customer).
  - **Each later debit up to ₹15,000 needs no AFA.**
  - Insurance premiums, mutual funds and credit-card bills get ₹1 lakh.
  - The customer must be notified **at least 24 hours before each debit**.
  - Customers cannot be charged for the e-mandate facility.
  - **Gym renewals of ₹15,000 or less per debit can run on Autopay without AFA.**

**UPI merchant fees (MDR)**
- [FACT, secondary] UPI person-to-merchant payments and RuPay debit have had **zero MDR** since 1 Jan 2020 [S35].
- [FACT, secondary] The Taxation and Other Laws (Amendment) Bill 2026 changed PSS Act s.10A so the government designates which payment modes must stay fee-free [S35].
- [FACT, secondary] An MDR for large merchants was still only a proposal as of July 2026 [S35].
- [VENDOR PRICE] Razorpay's own wording on UPI: "Zero MDR — 2% platform fee applies", and "Razorpay's 2% applies as a platform/technology fee, not as MDR" [S31].

**Payment-gateway pricing** [VENDOR PRICE]
- **Razorpay** [S31]:
  - 2% on cards, netbanking and wallets.
  - UPI QR: 0.99%.
  - International cards: up to 3%.
  - Subscriptions: 0.9% plus the platform fee on cards; UPI subscriptions priced on request.
  - **Route (payment splitting): 0.1% plus the platform fee.**
  - 18% GST on fees; settlement T+1.
- **Cashfree** [S33]:
  - Cards 1.95%; Amex and Diners 2.95%; international cards 2.99%.
  - UPI "per applicable law".
  - **UPI Autopay: ₹7.50 per mandate plus ₹5 per debit under ₹1,000, or ₹15 per debit of ₹1,000 or more.**
  - Easy Split: 0.20–0.25%.
  - 0% platform fee on the first ₹20 lakh of sales for new merchants until 31 Mar 2027; 18% GST.
- **PhonePe PG:** 1.99% standard, no setup or annual fee [S34].
- **Paytm:** not fetched.

**Can a SaaS platform collect money on behalf of gyms?**
- [FACT] RBI Master Direction on Payment Aggregators, 15 Sep 2025 [S28]:
  - A **payment aggregator (PA)** "facilitates aggregation of payments… and subsequently settles the collected funds to such merchants".
  - A **payment gateway** provides technology "without any involvement in handling of funds".
  - A **merchant** includes a marketplace.
  - "A PA business shall not carry out marketplace business."
  - A PA "shall aggregate funds only for the merchant with whom it has a contractual relationship" and must ensure "a marketplace onboarded by it does not accept payments for a seller not onboarded on to the marketplace's platform".
  - Non-bank PAs need **₹15 crore net worth, rising to ₹25 crore by the third year**, and an escrow account at a scheduled commercial bank.
  - Merchants with turnover of ₹40 lakh or less get simpler due diligence.
- [FACT] Razorpay Route now requires domestic turnover above ₹40 lakh (per GSTR-3B) in FY25 or FY26, and the third parties being paid must deal "directly" with the customer [S32].
- [LEGAL INTERPRETATION] Three possible models:
  - **(a) Preferred.** Each gym gets its own merchant account with a licensed PA (partner or sub-merchant onboarding). Money settles straight to the gym. We are a non-custodial technology provider, so we need no PA licence and have no marketplace tax duties.
  - **(b)** We become a marketplace and collect through a licensed PA, splitting payments with Route or Easy Split. This works, but makes us an e-commerce operator for tax:
    - TDS under s.194-O at **0.1%** (since 1 Oct 2024), with a ₹5 lakh threshold for individual and HUF sellers [S36].
    - GST TCS under s.52 (rate [UNVERIFIED]).
  - **(c)** Collecting into our own bank account and paying gyms out is unauthorised payment aggregation. **Avoid.**
- [UNVERIFIED] Whether the Income-tax Act 2025, effective 1 Apr 2026, renumbered s.194-O.
- [UNVERIFIED] 18% GST on SaaS, and the cut in GST on gym services to 5% (without input tax credit) from 22 Sep 2025.

---

## 5) App-store fees in India

- [VENDOR PRICE] Google Play in India still uses the standard fees [S37]:
  - **15% on auto-renewing subscriptions.**
  - 15% on the first $1M of revenue, 30% above that.
  - **User-choice (alternative) billing in India: 4 percentage points lower.**
  - The new "10% + 5% billing fee" structure applies only in Australia, the EEA, Japan, the UK and the US.
- [FACT] Google Play Payments policy [S38]:
  - **Physical services are exempt, and "gym memberships" are named as an example.**
  - "Business productivity software" sold in-app *does* need Play billing. There is no B2B exemption.
  - Anti-steering rules apply.
  - **Implication:** keep the gym-owner app free in-app and sell or upsell on the web without in-app calls to action.
- [FACT] Apple App Store guidelines [S39]:
  - 3.1.1: digital features need in-app purchase (IAP).
  - **3.1.3(e): physical goods and services used outside the app *must not* use IAP.** Gym renewals through Razorpay are correct.
  - 3.1.3(c): apps sold only to organisations may unlock content without IAP, but "consumer, single user, or family sales must use in-app purchase".
  - 3.1.3(f): free companion apps to a paid web tool are allowed if there is no purchase or purchase call-to-action.
  - 3.1.3(d): one-to-one live fitness training may use other payment methods; one-to-few must use IAP.
  - No India-specific rules.
- [VENDOR PRICE] Apple's Small Business Program charges **15%** for developers earning up to $1M in proceeds [S40].
- **The AI-nutrition premium tier is digital, so it falls under IAP or Play billing.**
- [UNVERIFIED] The CCI's 2022 ₹936.44 crore penalty on Google, which the NCLAT reportedly cut to about ₹216.69 crore in 2025. I could only confirm that a CCI billing probe was opened in March 2024 (a MediaNama listing).

---

## 6) Unit-cost inputs

**AI food-photo analysis** [VENDOR PRICE] [S41][S42]

| Model | Input $/1M tokens | Output $/1M tokens | Notes |
|---|---|---|---|
| Claude Haiku 4.5 | 1 | 5 | |
| Claude Sonnet 5.5 | 2 | 10 | |
| Claude Sonnet 4.6 | 3 | 15 | |
| Claude Opus 5.5 | 4 | 20 | |

- Batch requests are half price. Cache reads cost 0.1× the input price (0.05× on Opus 5.5).
- Pinning inference to the US costs 1.1×.
- Claude 4.7 and later models use a tokenizer that produces about **30% more text tokens**.
- **Image tokens = ⌈width/28⌉ × ⌈height/28⌉.** A 1000×1000 image is **1,296 tokens**.
  - Standard tier: images capped at 1,568 px and 1,568 tokens.
  - Claude 4.7+ high-resolution tier: capped at 2,576 px and 4,784 tokens.
  - Anthropic's own example: Haiku costs about $1.30 per 1,000 one-megapixel images, input only.
- **Gemini** [S43][S44]:
  - 2.5 Flash-Lite: $0.10 / $0.40.
  - 2.5 Flash: $0.30 / $2.50.
  - "Gemini 3.8 Flash": $0.75 / $3.75 until 31 Dec 2026, then $1.50 / $7.50.
  - An image is 258 tokens if both sides are 384 px or less; larger images are cut into 768-px tiles of 258 tokens each.
- **OpenAI** [S45]:
  - GPT-4.1-mini: $0.40 / $1.60.
  - GPT-4.1-nano: $0.10 / $0.40.
  - GPT-4o-mini: $0.15 / $0.60.
  - GPT-5-mini: $0.25 / $2.00.
  - GPT-5-nano: $0.05 / $0.40.
  - Image-token formula: [UNVERIFIED].

**Estimated cost per food photo** [ESTIMATE]
- Assumptions: photo resized to 1000 px; a 1,500-token instruction prompt (shorter than caching usually needs, so not cached); a 400-token JSON answer.

| Model | Cost per image | ₹ per image | Per 1,000 images |
|---|---|---|---|
| Haiku 4.5 | $0.0048 | ₹0.46 | $4.80 |
| Sonnet 5.5, thinking off | $0.0117 | ₹1.13 | $11.70 |
| Sonnet 5.5, +1,000 thinking tokens | $0.0217 | ₹2.09 | $21.70 |
| Gemini 2.5 Flash-Lite | about $0.0004 | ₹0.04 | about $0.40 |
| Gemini 2.5 Flash, thinking off | about $0.0018 | ₹0.17 | about $1.80 |
| GPT-4.1-mini (image tokens assumed 1,500) | about $0.0018 | ₹0.18 | about $1.80 |

- Sonnet 5.5 needs `between_tools` to turn thinking off.

**Supabase** [VENDOR PRICE] [S25]
- Pro plan: **$25 a month**, including **100,000 monthly active users**, then $0.00325 per user.
- Database: 8 GB disk included, then $0.125/GB.
- Data transfer out: 250 GB included, then $0.09/GB; for CDN-cached transfer, 250 GB included, then $0.03/GB.
- File storage: 100 GB included, then **$0.0213/GB**.
- $10 a month of compute credit. Compute: Micro $10, Small $15, Medium $60, Large $110 (2 vCPU, 8 GB).
- Image transformations: $5 per 1,000 originals. Edge Functions: 2M calls included.
- Team plan: from $599 a month.
- [ESTIMATE] Running 100,000 monthly users costs about **$40–135 a month** (Pro plus Small-to-Large compute) before storage and data transfer. **Data transfer is the cost that swings.**

**Push notifications** [VENDOR PRICE] [S46][S24]
- Expo push is free ("no cost"), limited to 600 notifications per second per project.
- Firebase Cloud Messaging is free.

**People costs** [VENDOR PRICE / salary data]
- Field executive: about **₹20,401 a month** on average (Indeed, updated 13 Aug 2026; the page redirected to "Field Executive") [S48].
  - By city: Bengaluru ₹21,259, Mumbai ₹20,928, Pune ₹20,431, Hyderabad ₹19,770, Delhi ₹19,555 a month.
  - Tier-2 city figures: not found.
- PayScale: base pay ₹2.86 lakh a year; total pay ₹1.51–6.26 lakh (155 profiles, updated 9 Mar 2025) [S47].
- Customer-support coordinator: **₹2.15 lakh a year** on average (about ₹17,900 a month; Indeed, 3 Aug 2026) [S49].

**Exchange rate:** ₹96.38 per US$ on 2 Oct 2026 [S50].

---

## 7) Worked model: one gym, 300 members, 40% install the app (120 app users)

**Assumptions** [ESTIMATE unless tagged]
1. The platform has 1,000 gyms, so 120,000 app users plus 3,000 staff log in each month.
2. The gym SaaS is free. Members pay gym fees through the gym's own PA account, so we pay no gateway fees.
3. **AI usage:** 25% of app users (30 people) log food photos, 2 a day, 30 days, on Haiku 4.5. That is 1,800 analyses at ₹0.46 each.
4. **WhatsApp each month:**
   - 500 utility messages: 100 renewals × 3 reminders, plus 100 receipts, plus 100 notices.
   - 300 marketing messages: one gym broadcast.
   - 60 authentication messages.
   - Charged at Meta's India rates, plus a 15% provider markup and 18% GST that we cannot recover.
5. **OTP:** 120 SMS a month through MSG91 at ₹0.20 [VENDOR PRICE S21].
6. **Infrastructure**, shared across the 1,000 gyms:
   - Supabase Pro plus Large compute, minus the $10 credit: $125.
   - Monthly-user overage: $74.75.
   - Disk: $5.25.
   - Photo storage: about 3.9 TB after 12 months, $81.
   - Data transfer: 30 MB per user per month, half CDN-cached, $181.
   - FastAPI hosting: $150 (not sourced from a vendor page).
   - Monitoring: $100.
   - **Total: about $717 a month, or ₹69 per gym.**
7. **Support:** one agent costs ₹30,000 a month fully loaded (Indeed average plus PF, tools and phone) and handles 150 gyms.
8. **Sales:** one field executive costs ₹35,000 a month fully loaded and closes 15 gyms a month, a cost of ₹2,333 per gym. Spread over a 24-month gym lifetime, that is ₹97 a month.
9. **Compliance** (data protection officer or legal retainer, security testing, consent tooling): ₹1.5 lakh a month across the platform, or ₹150 per gym.

| Cost line (₹ per gym per month) | Lean | **Base** | Heavy |
|---|---|---|---|
| Infrastructure | 69 | **69** | 69 |
| AI food analysis | 72 (Gemini 2.5 Flash-Lite) | **832 (Haiku 4.5)** | 2,028 (Sonnet 5.5, thinking off) |
| WhatsApp, incl. markup and GST | 87 (utility and auth only) | **439** | 470 (adds about ₹31 if service messages are charged on one shared platform number) |
| OTP | 0 (sent over WhatsApp auth) | **24** | 24 |
| Support | 200 | **200** | 200 |
| Sales, spread over 24 months | 97 | **97** | 97 |
| Compliance | 150 | **150** | 150 |
| **Total** | **≈₹675** | **≈₹1,811 (≈$18.8)** | **≈₹3,038** |
| Per member (300) | ₹2.3 | **₹6.0** | ₹10.1 |
| Per app user (120) | ₹5.6 | **₹15.1** | ₹25.3 |

**What drives the numbers**
- **AI is the biggest cost:** about ₹28 per food-logging user per month on Haiku, against about ₹2.4 on Flash-Lite. Ways to bring it down:
  - Resize photos to 1000 px or less.
  - Use the cheapest model that passes your nutrition-accuracy test.
  - Cap free analyses per day.
- **Marketing WhatsApp:** one broadcast to all members costs about ₹305 after markup and GST. Compare utility messages at about ₹0.16 each.
- **Payment fees:** if we absorbed gateway fees on, say, ₹1.5 lakh a month of gym fees (100 renewals × ₹1,500), the 2% Razorpay fee plus GST would add about **₹3,540 per gym** and dominate everything else. Do not subsidise gateway fees.
- **Firebase SMS instead of MSG91** would cost about ₹810 per gym a month, against ₹24.

---

## 8) Sources (all accessed 2 Oct 2026; publication date where shown)

- **S1** DPDP Rules 2025, G.S.R. 846(E), Gazette dated 13 Nov 2025 — https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf
- **S2** DPDP Act 2023 (Gazette, 11 Aug 2023) — https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf
- **S3** PIB, "DPDP Rules, 2025 Notified", 17 Nov 2025 — https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf
- **S4** Cyberaube, Rule 4 commencement playbook (undated) — https://cyberaube.com/blog/dpdp-consent-manager-deadline-november-2026-data-fiduciary-playbook
- **S5** KSK via Mondaq, 14 Aug 2026 — https://www.mondaq.com/india/data-protection/1830402/dpdp-act-and-rules-2025-the-2026-compliance-milestones-businesses-cant-afford-to-miss
- **S6** Storyboard18 (Jan 2026), https://www.storyboard18.com/digital/meity-seeks-industry-views-on-fast-tracking-dpdp-act-rollout-proposes-12-month-compliance-timeline-88332.htm ; GoTrust, 9 Feb 2026, https://www.gotrust.tech/newsletter/meity-may-cut-dpdp-compliance-timeline-from-18-to-12-months ; Mondaq/S.S. Rana, https://www.mondaq.com/india/data-protection/1773554/
- **S7** Aadhaar Act 2016 as amended (UIDAI) — https://uidai.gov.in/images/Aadhaar_Act_2016_as_amended.pdf
- **S8** Scroll, 2 Feb 2025 — https://scroll.in/latest/1078654/it-ministry-notifies-rules-allowing-private-entities-to-carry-out-aadhaar-authentication
- **S9** Meta WhatsApp pricing — https://developers.facebook.com/docs/whatsapp/pricing ; https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- **S10** Meta pricing updates — https://developers.facebook.com/docs/whatsapp/pricing/updates-to-pricing
- **S11** Meta per-user marketing limits — https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/per-user-limits
- **S12** Meta error codes — https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
- **S13** Meta template category guidelines — https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines
- **S14** eCorpIT, updated 20 Jul 2026 — https://ecorpit.com/whatsapp-business-api-cost-india-d2c-2026/
- **S15** WATI support (2026) — https://support.wati.io/en/articles/16954666-whatsapp-business-platform-api-pricing-changes-service-messages-and-click-to-message-ads
- **S16** Zoho community — https://help.zoho.com/portal/en/community/topic/whatsapp-business-platform-message-pricing-guide ; Darwin (Aug 2026) — https://help.getdarwin.ai/en/articles/16516839-whatsapp-business-platform-pricing-changes-service-messages-billed-starting-october-2026
- **S17** Gupshup pricing — https://www.gupshup.ai/channels/self-serve/whatsapp/pricing
- **S18** Interakt pricing — https://www.interakt.shop/pricing/
- **S19** AiSensy pricing — https://www.aisensy.com/pricing
- **S20** WATI pricing — https://www.wati.io/pricing/
- **S21** MSG91 SMS pricing — https://msg91.com/in/pricing/sms
- **S22** Twilio India SMS pricing — https://www.twilio.com/en-us/sms/pricing/in
- **S23** Google Identity Platform pricing — https://cloud.google.com/identity-platform/pricing
- **S24** Firebase pricing — https://firebase.google.com/pricing
- **S25** Supabase pricing — https://supabase.com/pricing
- **S26** Supabase phone login docs — https://supabase.com/docs/guides/auth/phone-login
- **S27** SCC Online, 24 Apr 2026 (RBI E-mandate Framework, 21 Apr 2026) — https://www.scconline.com/blog/post/2026/04/24/rbi-issues-digital-payments-e-mandate-framework-2026/
- **S28** RBI Master Direction on Payment Aggregators, 15 Sep 2025 — https://rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12896
- **S29** IndiaCorpLaw, 9 Oct 2025 — https://indiacorplaw.in/2025/10/09/decoding-rbis-overhaul-of-the-payment-aggregator-directions/
- **S30** MediaNama, Sep 2025 — https://www.medianama.com/2025/09/223-explained-rbi-master-direction-payment-aggregators/
- **S31** Razorpay pricing — https://razorpay.com/pricing/
- **S32** Razorpay Route docs — https://razorpay.com/docs/payments/route/
- **S33** Cashfree pricing — https://www.cashfree.com/payment-gateway-charges/
- **S34** PhonePe PG pricing — https://www.phonepe.com/business-solutions/payment-gateway/pricing/
- **S35** UPI MDR 2026 (secondary) — https://allaboutfintech.beehiiv.com/p/upi-mdr-2026-what-bill-no-150-actually-changes ; https://www.outlookbusiness.com/news/will-upi-payments-above-2000-cost-more-what-we-know-so-far
- **S36** ClearTax, s.194-O — https://cleartax.in/s/section-194o
- **S37** Google Play service fees — https://support.google.com/googleplay/android-developer/answer/112622
- **S38** Google Play Payments policy — https://support.google.com/googleplay/android-developer/answer/9858738
- **S39** Apple App Review Guidelines — https://developer.apple.com/app-store/review/guidelines/
- **S40** Apple Small Business Program — https://developer.apple.com/app-store/small-business-program/
- **S41** Anthropic pricing — https://platform.claude.com/docs/en/about-claude/pricing
- **S42** Anthropic vision docs — https://platform.claude.com/docs/en/build-with-claude/vision
- **S43** Gemini API pricing — https://ai.google.dev/gemini-api/docs/pricing
- **S44** Gemini image understanding — https://ai.google.dev/gemini-api/docs/image-understanding
- **S45** OpenAI pricing — https://developers.openai.com/api/docs/pricing
- **S46** Expo push notifications FAQ — https://docs.expo.dev/push-notifications/faq/
- **S47** PayScale, updated 9 Mar 2025 — https://www.payscale.com/research/IN/Job=Field_Sales_Executive/Salary
- **S48** Indeed, updated 13 Aug 2026 — https://in.indeed.com/career/field-sales-executive/salaries
- **S49** Indeed, updated 3 Aug 2026 — https://in.indeed.com/career/customer-support-executive/salaries
- **S50** ExchangeRate-API, 2 Oct 2026 — https://open.er-api.com/v6/latest/USD

**Not found or unverified in this session:**
- TRAI DLT primary text and DLT registration fees.
- SPDI Rules 2011 text.
- UIDAI rules on masking and Aadhaar Data Vault.
- The GST TCS (s.52) rate, 18% GST on SaaS, and GST on gym services.
- The CCI and NCLAT Google Play figures.
- Meta's India rate-card CSV, and whether Meta itself confirms charging for service messages from 1 Oct 2026.
- OpenAI's image-token formula.
- Paytm PG pricing.
