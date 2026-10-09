# OW-2 · Make the launch decisions

> **DRAFT, for the owner to review.** Prepared by owner-concierge on 10 Oct 2026. Every
> recommendation comes from the repo's own docs, which are cited. Where no doc gives an answer, the
> pack says so. Nothing here is legal or financial advice: prices and regions change, so check
> them on the provider's site on the day you sign up.

**Why it matters.** 66 goals wait on this one, and its chain is 19 goals long. Once it is Done,
four of your own goals open at once:
- **OW-3**, the platform accounts;
- **OW-4**, the store accounts;
- **OW-5**, the SMS and WhatsApp registrations, which take weeks, so start them early;
- **OW-8**, the beta testers.

Together with OW-1 it also opens DS-6 (icon and store art).

**How to answer (one sitting, about 20 minutes, plus the name search in Q5).**
- To accept every recommendation, write **go** on the line below.
- To change one, write your answer on that question's **Answer:** line. A blank line means "the
  recommended default".

**All as recommended:** ______

**What happens after you answer.**
1. A session records each answer in `docs/11-LAUNCH-PLAN.md` Phase 0 (an answer and date on rows
   L2–L8). The ones that are real decisions also go into charter §6 as new rows, D48 onwards. A
   proposed split is at the end of this pack.
2. Ticking the goal Done is yours: `node scripts/plan/status.mjs set OW-2 done --who You`, or the
   board.

**Where your users are.** Every question below assumes your launch users are in India. The plan is
built that way: docs/16 is subtitled "India first", with Hindi (G14), DLT SMS (OW-5) and DPDP for
age (Q33). If that is wrong, say so, because
it changes the answers to Q1 and Q7.

---

## Q1 · L2: where the API and the worker run

The API and the worker are two services from one Docker image (docs/12 §1, §7).

| Option | Consequence |
|---|---|
| **A. Render** | **Recommended.** Works with the existing `deploy.yml` "with no glue": each service has a deploy hook you paste into a GitHub secret (docs/12 §7 table). |
| B. Railway | It has no plain deploy hook. You need a small extra endpoint, or you redeploy by hand after each release (docs/12 §7). |
| C. Fly.io | It has no hook either. A session adds a `fly deploy` step with a `FLY_API_TOKEN` (docs/12 §7). |

**Region (part of the same answer).** The host and the Supabase project must be in the same region,
the one nearest your users, because every query crosses that gap (docs/12 §2 step 2, §7). No doc
names the region.
- *Suggested default (not from any doc):* the region nearest India that **both** Supabase and your
  host offer. With Render, that is likely Singapore for both; check both region lists when you sign
  up.

None of the three hosts has been tried yet (docs/12 §14). The first staging deploy (PL-2) is the
real test.

**Answer (host and region):** ______

---

## Q2 · L3: who sends the sign-up and password emails

Supabase Auth sends every auth email. It needs an outside SMTP service behind it (docs/11 L3,
docs/12 §2.1).

| Option | Consequence |
|---|---|
| **A. Resend** as Supabase's SMTP | **Recommended.** docs/11 Phase 3 already names Resend for A-05. PL-3 and OW-3 are written around it. |
| B. Postmark | It works the same way. The OW-3 checklist and PL-3 change one name. |

**Answer:** ______

---

## Q3 · L5: barcode scanning (H-17) at launch, or in v1.1

| Option | Consequence |
|---|---|
| **A. v1.1, after launch** | **Recommended.** On 25 Sep you closed Q1 with "barcode lookup (H-17) and branded products are out of v1" (charter §9 Q1). The plan already has barcode in M8, after launch (docs/23 §4, MS-8). |
| B. At launch | Adds Open Food Facts integration and its ODbL attribution work (docs/11 L5). A new goal lands before MS-5 and pushes the launch out. |

**Answer:** ______

---

## Q4 · L7: which v1.1 items move into the launch

Almost every [v1.1] item in docs/11 is already built. Only two are still open:
- **barcode scanning**, which Q3 decides;
- **exercise media**, which you made the very last goal on 7 Oct (docs/23 §3.5, OW-14).

Phone sign-in, Hindi and Pro are already in the launch (docs/23 §3.2, charter D33).

| Option | Consequence |
|---|---|
| **A. Nothing more moves in** | **Recommended.** The launch scope stays as the plan draws it (MS-5). |
| B. Move barcode in | The same as Q3 option B. |
| C. Move exercise media in | Reverses your 7 Oct decision. It needs a paid licence or the RepDB edition with credit (OW-14) before the launch. |

**Answer:** ______

---

## Q5 · L8: the name, brand and trademark check

This blocks the icon, the feature graphic and the gym posters (GOALS.md OW-2; docs/16 Q32). It is
partly a task. The check takes 1–2 weeks (docs/17 §9), so start it today even if you answer
everything else now.

**Steps (about 30 minutes to start):**
1. Search "FitLog" in the Google Play Store and the App Store. Note any app with the same or a very
   close name.
2. Search the India trade marks registry's public search for "FitLog" in classes 9 (software) and 42
   (online services). Then do the same at USPTO and EUIPO, the three registries the R1 research used
   (docs/research/R1-exercise-programs.md).
3. Write what you found on the Answer line: "none found", or the conflict.
4. Do the same for "FitLog for Gyms" (Q32) before any poster is printed.

| Option | Consequence |
|---|---|
| **A. Keep "FitLog" if the search finds no conflict.** Store title: *FitLog: Workout & Food Log* | **Recommended.** That store title is the fallback docs/13 already drafted (docs/13 §1). DS-6 can start drawing. |
| B. A different name | DS-6, the listing copy (docs/13) and the legal pages change. Better now than after the art exists. |

Only a trademark lawyer can say a name is clear. The search above only finds obvious conflicts.

**Answer (name, and what the search found):** ______

---

## Q6 · Point-in-time recovery (PITR) for the database

Supabase Pro keeps 7 days of daily backups. PITR is an add-on that also needs at least the Small
compute size. It turns "lose up to a day" into "lose a couple of minutes" (docs/12 §2 step 8).

| Option | Consequence |
|---|---|
| **A. Off on staging; on for production once there are real users** | **Recommended.** This is what docs/12 §12 says. Until users exist there is nothing to lose. |
| B. On for production from day one | Extra monthly cost before anyone uses it. |
| C. Never | After launch, a bad day can cost users up to a day of logged workouts. |

**Answer:** ______

---

## Q7 · Sentry data region (for crash reports)

The region **cannot be changed later** (docs/12 §8 step 1).

| Option | Consequence |
|---|---|
| **A. US (Sentry's default)** | **Recommended**, if your users are in India. docs/12 §8 asks for the EU region only "if your users are in the EU". |
| B. EU | Right if you expect many EU users. No difference for India. |

Crash reports carry no names, emails, bodies or IP addresses. The code strips them (docs/12 §8).

**Answer:** ______

---

## Q8 · The photo-backup gap

Database backups do not include the photos (food and progress photos in Storage). A deleted photo is
gone (docs/12 §2).

| Option | Consequence |
|---|---|
| **A. Accept the gap for v1** | **Recommended.** docs/12 §2 says "For v1 that is accepted". |
| B. A nightly copy of the photo bucket to a second provider (`rclone sync`) | One more account and bill. The PL lane adds the job and a step in the restore drill (docs/12 §2, §11). |

**Answer:** ______

---

## Q9 · Confirm that D33 closes L6 / Q6 (the paid tier)

Charter D33 (2 Oct): all AI sits behind Pro, with a 7-day store trial, and it "closes PRD v1 Q6".
docs/11 and TODO still list L6 as open (docs/23 §10 item 14).

| Option | Consequence |
|---|---|
| **A. Yes, D33 closes it** | **Recommended.** QA-2 marks L6 closed. The price itself is settled later, in OW-7 (default ₹149 a month, ₹999 a year). |
| B. No, reopen it | G15 (Pro) and the paywall wait for a new pricing decision. |

**Answer:** ______

---

## Q10 · Launch platforms: Android and iOS together, or Android first

| Option | Consequence |
|---|---|
| **A. Together** | **Recommended.** The plan is drawn this way: MS-5 is "live on Google Play and the App Store". It is the charter goal "MVP on iOS and Android" (docs/23 §4; GOALS.md PL-8). The Play 14-day test and iOS work run side by side. |
| B. Android first | You can put off the Apple fee and the iPhone, and launch sooner if iOS stalls. But the PL-8, QA-4, QA-5, QA-6 and MS-5 cards must change, and the charter goal stays unmet for longer. |

iOS has never been built. PL-8 needs a real iPhone from you (GOALS.md PL-8).

**Answer:** ______

---

## Proposed recording (for the session)

> DRAFT, for the owner to review. The numbers are a proposal. No doc assigns numbers after D47.

| Answer | Goes to |
|---|---|
| Q1 host and region | docs/11 L2, and charter **D48** |
| Q2 email | docs/11 L3, and charter **D49** |
| Q3 barcode, Q4 scope | docs/11 L5 and L7 |
| Q5 name | docs/11 L8, and charter **D50** once the search is done |
| Q6 PITR, Q7 Sentry region, Q8 photo backups | docs/11 Phase 0, as a note under the table (docs/12 §11 and §15 item 12 point there) |
| Q9 L6 | docs/11 L6 marked closed by D33 |
| Q10 platforms | docs/11 Phase 0, and charter **D51** |
