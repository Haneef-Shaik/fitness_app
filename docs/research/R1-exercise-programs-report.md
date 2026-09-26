# R1 Exercise Programs: interim report (verification pass 1)

**Brief:** [R1-exercise-programs.md](R1-exercise-programs.md)
**Status:** partial. This pass covers 5 of the 14 current programs and 4 evidence topics. It does not include the program cards, the selection guide, the population section, the rights register or the JSON dataset the brief asks for. See [Coverage against the brief](#coverage-against-the-brief).
**Date:** 26 September 2026. All sources were accessed on that date.

## How this was produced

We ran an automated multi-agent research pass:

1. Five web-search angles: program primary sources, dose-response meta-analyses, the low-volume/HIT debate, guidelines and populations, and trademark status.
2. We fetched 25 sources and extracted 115 claims from them.
3. The 25 most central claims went through **adversarial verification**. Three independent checkers each tried to refute the claim against the source and other evidence. A claim was dropped if two of the three refuted it.
4. 21 claims survived and 4 were refuted. After near-duplicate claims were merged, 14 findings remain.

This report uses three labels throughout:

- **Verified.** The claim survived the three-vote check. The vote is shown, e.g. (3-0).
- **Lead.** The claim was taken from a primary source but did not go through the three-vote check. Use leads to aim the next pass. Don't publish them yet.
- **Refuted.** The claim failed the check. Don't use it.

The brief asks us to separate what the author says from what the evidence shows. Program facts below are **author statements**. Their evidence grade is *Expert opinion* unless research is cited.

## Safety note

This material describes training methods. It is not medical advice. Anyone with a health condition, symptoms during exercise, or who is pregnant or postpartum should get guidance from a qualified professional before starting a program. The PAR-Q+ is a standard pre-exercise screen [22].

---

## 1. Verdicts for the current library

Verdict key:

- **Correct:** our entry matches the author's primary source on the fields checked.
- **Corrected:** the primary source contradicts a field in our entry.
- **Partly verified:** some fields check out and others are unresolved.
- **Unverifiable:** no primary source was checked in this pass.

| Key | Verdict | What changes / why |
|---|---|---|
| `stronglifts-5x5` | **Correct** (level, focus, days) | Beginner, strength and 3 days/week match the author [2]. The minimum equipment is a barbell, plates, rack and bench, so `home_gym` is enough and `full_gym` is more than needed. 45 min/session is unverified. The structure vote was 2-1, not unanimous. |
| `reddit-ppl` | **Corrected** | Level changes from **intermediate** to **beginner**. The author titles it a linear-progression program *for beginners* and says intermediate lifters can't progress on it [1] (3-0). Author handle: most sources spell it u/Metallicadpa; the wiki archive spells it "Metallicdpa", probably a typo [1]. |
| `texas-method` | **Correct** (level, focus, days); **attribution needs review** | Rippetoe calls it an intermediate program with weekly progression, run 3 days a week [9] (3-0). His article traces it to Doug Hepburn via Bill Starr and does not mention Glenn Pendlay [9], so our "Glenn Pendlay, Mark Rippetoe" credit is unconfirmed. The long rests he allows suggest 75 min may be low (unverified). |
| `gzclp` | **Partly verified** | Day layout, tiers and progression are confirmed [6] (3-0). Days per week is **unresolved**: the r/Fitness wiki says 3 or 4 [10] (lead), and a checker read the author's example calendar as 3 days a week, but the claim that this contradicts our 4-day listing was refuted (1-2). Author name: the source spells it "LeFever" [6], not "Lefever". |
| `531-bbb` | **Partly verified** | 4 days/week matches the author's layout, but he also endorses 3 days [7] (3-0). The **advanced** level was not verified. Leads: the author and the r/Fitness wiki describe BBB as good for size as well as strength, which argues for adding `hypertrophy` to `goals` [7][10]. |
| `starting-strength` | Unverifiable | Not researched in this pass. |
| `full-body-3` | Unverifiable | Generic program with no author source. It can only be checked against the evidence ranges. |
| `dumbbell-full-body` | Unverifiable | Generic, as above. |
| `bodyweight-recommended-routine` | Unverifiable | Not researched in this pass. |
| `push-pull-legs` | Unverifiable | Generic, as above. |
| `upper-lower-4` | Unverifiable | Generic, as above. |
| `phul` | Unverifiable | Not researched in this pass. |
| `bro-split-5` | Unverifiable | Generic, as above. |
| `arnold-split` | Unverifiable | Not researched in this pass. Lead: the r/Fitness wiki lists two 6-day variants. It says the "advanced" label comes from a secondary source (muscleandstrength.com), not from Arnold [10]. |

### Findings that matter most for the library

1. **Most of the programs checked need more than sets × reps × load.** Of the five programs verified, only StrongLifts runs on plain sets × reps × load (plus alternating A/B days). The other four need AMRAP sets, percentages of a max, or rep schemes that change after a failed session. See [Logger gaps](#logger-gaps-shown-by-the-verified-programs).
2. **Two authors define experience level in the same objective way.** A beginner can still add load every session; an intermediate needs about a week per increase [1][9] (3-0). This gives the recommender a testable rule. It is still an author definition (*Expert opinion*), not a research threshold.
3. **Weekly sets per muscle drive results; frequency matters little for size.** See section 3.
4. **The brief's 1 / 0.5 set-counting rule has direct research support** [11] (3-0).
5. **Training to failure isn't needed for strength** [12] (3-0). This matters for how we present Heavy Duty/HIT.

---

## 2. Experience levels (verified definition)

**Novice (beginner).** Can add load from one session to the next, and recovers fully between sessions [1][9].

**Intermediate.** Needs about a week of training to support each increase in load. Novice linear progression ("LP", adding a fixed amount of weight every session) stalls when recovery between sessions can no longer support session-to-session increases [1][9].

Rippetoe says this typically happens after about five months of simple LP, when progress drops to about a third of its earlier pace [9]. Both authors name weekly-progression programs such as the Texas Method as the next step [1][9].

- **Grade:** Expert opinion. Both are coaching definitions (3-0, merged).
- **Not yet defined:** a training-age threshold (how long someone has trained) and the advanced level.

---

## 3. What the evidence shows (partial)

### Verified findings

| Variable | Practical reading | Grade | Source |
|---|---|---|---|
| **Weekly volume** | Muscle size and strength both rise with weekly sets, with diminishing returns. Strength levels off at about 4 fractional sets a week. Size shows no clear plateau, but uncertainty is wide at high volumes, so a plateau or inverted U is possible. Most included studies used moderate volumes (means of about 13 sets a week for size and about 8 for strength). | Moderate | [11] (3-0) |
| **Frequency** | Once weekly volume is equal, how often a muscle is trained has a negligible or uncertain effect on size. Strength rose with frequency in this analysis, but that conflicts with earlier meta-analyses and may partly reflect more practice of the tested lift. In practice, pick the split for convenience and set weekly volume for size. | Moderate (size); Limited (strength) | [11] (3-0) |
| **Counting sets** | Count 1 per set where the muscle is the prime mover and 0.5 where it is a meaningful synergist ("fractional" counting). This predicted outcomes better than counting indirect sets as 1 or as 0. The authors call 0.5 a heuristic, not a standard. | Moderate | [11] (3-0) |
| **Proximity to failure: strength** | Strength gains were similar across a wide range of reps in reserve (RIR, the reps a lifter could still have done when the set ended). Training to failure isn't needed for strength. | Moderate | [12] (3-0) |
| **Proximity to failure: size** | Not settled by this pass. The stronger claim that every model showed a clear benefit from going closer to failure was refuted (0-3). | Unresolved | [12] |

**Caveats on these papers.** The volume/frequency paper and the RIR paper [11][12] come from overlapping author groups who disclose roles in the fitness industry. Both report modest model fit. Both draw mostly on young, male and often untrained participants. The volume/frequency paper was published online in December 2025 and has had little independent scrutiny. RIR in [12] was estimated after the fact.

### Leads (from primary sources, not yet three-vote checked)

- **ACSM 2026 position stand** [17]. This overview of 137 systematic reviews replaces the 2009 ACSM progression-models stand. It reports:
  - Strength benefits from:
    - loads of at least 80% of the one-rep max (1RM, the most weight a person can lift once);
    - full range of motion;
    - 2-3 sets per exercise;
    - doing the lift early in the session;
    - at least 2 sessions a week.
  - Muscle growth was greater with at least 10 sets per week and with eccentric overload.
  - These did not consistently change outcomes: training to failure, periodization, set structure and time under tension.
  - This is the highest-priority source to verify next.
- **Load** [14]. When sets were taken to failure, muscle growth was similar with low, moderate and high loads. Strength was load-dependent: high and moderate loads beat low loads.
- **Rest intervals** [15]. Resting more than 60 s between sets gave a small benefit for size over resting 60 s or less. Resting longer than 90 s gave no appreciable further benefit. All credible intervals crossed zero, so this is likely *Limited*.
- **Range of motion** [16]. Full range of motion beat partial range by a trivial amount, and the interval crossed zero. Partial reps at long muscle lengths ("lengthened partials") *may* help size, but the interval includes zero.
- **Failure vs non-failure** [13]. No significant difference for strength or size. In trained lifters, failure gave a small size advantage (ES 0.15). ES, effect size, is a standardised measure of how large a difference is.
- **Guidelines** [18][19][20][21][22]:
  - **WHO 2020 [18].** Adults 18-64 should do 150-300 min of moderate or 75-150 min of vigorous aerobic activity a week, plus muscle-strengthening on at least 2 days. Adults 65+ should add balance and strength work on at least 3 days. Ages 5-17 should average at least 60 min a day. Activity of any duration now counts.
  - **ACSM, type 2 diabetes [19].** 8-10 resistance exercises, 1-3 sets of 10-15 reps, 2-3 non-consecutive days a week.
  - **NSCA, older adults [20].** Build up to 2-3 sets of 6-12 reps at 50-85% of 1RM, 2-3 times a week. Beginners and frail adults start with 1 set of 10-15 reps. Training to failure isn't needed.
  - **ACOG, pregnancy and postpartum [21].** At least 150 min a week of moderate activity. Use a rating of perceived exertion (RPE) of 13-14 or the talk test rather than heart rate. Avoid lying on the back for long periods after 20 weeks.
  - **PAR-Q+ [22].** A NO to all seven page-1 questions clears the person for unrestricted activity. A YES leads to follow-up questions and possibly the ePARmed-X+.

Not covered yet: mechanisms of muscle growth, progressive overload, periodization and deloads, exercise selection and order, tempo, warm-ups, concurrent training, detraining, individual variation, and differences by sex and age.

---

## 4. Program findings (verified)

These are verified facts for the five programs, not full program cards. The brief's card fields are still missing: description, weekly-volume calculation, equipment substitutions, expected results, pros and cons, and rights.

### Reddit PPL (`reddit-ppl`)

Source: author's post, archived on the r/Fitness wiki [1]. Voted 3-0 on all four merged claims.

- **Schedule.** 6 days a week, as PPLRPPL or PPLPPLR (P = push or pull, L = legs, R = rest). The author prefers the order pull, push, legs.
- **Main lifts.** Each day opens with a barbell lift whose last set is AMRAP ("as many reps as possible"):
  - **Pull days** alternate Deadlift 1×5+ with Barbell Row 4×5 plus 1×5+.
  - **Push days** alternate Barbell Bench Press 4×5 plus 1×5+ with Overhead Press 4×5 plus 1×5+, then do the other press for 3×8-12.
  - **Leg days:** Barbell Squat 2×5 plus 1×5+.
- **Accessories.** Mostly 3×8-12. The exceptions are Face Pull 5×15-20, curls 4×8-12 and calf raises 5×8-12. Triceps work is supersetted with Dumbbell Lateral Raise 3×15-20.
- **Progression.**
  - Main lifts: +2.5 kg per session (bench, row, overhead press, squat) and +5 kg (deadlift).
  - Accessories use double progression: add weight once all three sets reach 12 reps, and reduce it if a set falls below 8.
- **Rest.** 3-5 min on the first exercise, 1-3 min on the rest.
- **Stall rule.** Three failed sessions in a row at the same weight, caused by strength rather than poor recovery, means taking 10% off that lift and building back up.
- **Next programs** (author's list): Texas Method, Madcow 5×5, 5/3/1, PHAT, PHUL.

### StrongLifts 5×5 (`stronglifts-5x5`)

Source: author's site [2][3][4][5].

- **Structure** (2-1). Two workouts alternate on three non-consecutive days, typically Mon/Wed/Fri.
  - **A:** Barbell Squat 5×5, Barbell Bench Press 5×5, Barbell Row 5×5.
  - **B:** Barbell Squat 5×5, Overhead Press 5×5, Deadlift 1×5.
  - Assistance work is optional [3]. The author also offers a 2-day option.
- **Progression** (3-0). Add weight to an exercise only if all sets of 5 were completed; otherwise repeat the weight.
  - Default increments: +2.5 kg on squat, bench, overhead press and row; +5 kg on deadlift for the first few weeks, for men.
  - Increments drop to about 1.25 kg when progress slows, and many women use that from the start.
- **Deload** [4]. After three failed workouts at the same weight, cut about 10% and work back up.
- **Leads, not voted:** [2]
  - **Start weights:** empty 20 kg bar on squat, bench and overhead press; 30-40 kg on row and deadlift.
  - **Rest:** about 3 min between work sets, 1-2 min after easy sets, 5 min after hard ones.
  - **Warm-up:** 2×5 with the empty bar, then heavier sets of 5.

### GZCLP (`gzclp`)

Source: author's 2016 blog post [6] (3-0).

- **Structure.** Four workouts, each pairing a tier-1 main lift (T1), a tier-2 secondary lift (T2) and a tier-3 accessory (T3):

  | Workout | T1 | T2 | T3 |
  |---|---|---|---|
  | A1 | Squat | Bench | Lat Pulldown |
  | B1 | Overhead Press | Deadlift | Dumbbell Row |
  | A2 | Bench | Squat | Lat Pulldown |
  | B2 | Deadlift | Overhead Press | Dumbbell Row |

  The author writes schemes as weight × reps × sets. They are converted to the usual sets × reps below.
- **T1.**
  - Start at 5×3 with the last set AMRAP, and add weight every workout.
  - If the 15-rep base is missed, move to 6×2+ (12-rep base), then 10×1+ (10-rep base).
  - After failing 10×1+, rest 2-3 days, test a 5-rep max (5RM) and restart at 85% of it.
- **T2.** Start at 3×10 (30-rep base), then 3×8 and 3×6 (18-rep base). Then restart at 3×10 no more than 9 kg heavier than last cycle, for 2-3 more cycles.
- **T3.** The last set is AMRAP. Add weight once that set reaches 25 reps.
- **Increments.** At most 2.5-4.5 kg per workout for novices and early intermediates.
- **Rest.** T1 3-5 min, T2 2-3 min, T3 60-90 s. This is general GZCL advice, not GZCLP-specific.
- **AMRAP sets.** Stop with 1-2 reps in reserve, not at failure (lead).

### 5/3/1 Boring But Big (`531-bbb`)

Source: author's site [7][8] (3-0).

- **Structure.** After the day's 5/3/1 main lift, do 5×10 supplemental sets. The rule of thumb is 50-60% of the Training Max (TM, a working max set below the true 1RM); Wendler says the real goal is completing 5×10. Lat or ab work follows. He warns against adding more volume (lead).
- **Two templates.**
  - **Example 1:** the 5×10 uses the same lift as that day's main lift.
  - **Example 2:** the 5×10 uses the paired lift (press with bench, deadlift with squat), so each main lift is trained twice a week.
- **Schedule.** Laid out over four days, but the author says it is best used in a 3- or 4-day program.
- **Author-endorsed variant.** The BBB 3-Month Challenge runs the 5×10 at 50%, then 60%, then 70% of TM by month, with no extra reps on the main sets [8]. Later book versions (*Beyond 5/3/1*, *Forever*) were not reviewed.

### Texas Method (`texas-method`)

Source: Rippetoe's 2013 article, read via the Wayback Machine because the live page blocks automated access [9] (3-0).

- **Monday (volume day).**
  - Barbell Squat 5×5 at about 90% of 5RM.
  - Bench and overhead press alternate by week, each 5×5 at about 90% of 5RM.
  - One heavy set of 5 deadlifts, the only deadlift of the week.
  - Loads are set so all sets can be finished with no more than 8-10 min between sets.
- **Wednesday (light day).**
  - Squat 2×5 at 80% of Monday's weight.
  - The other press for 3 sets, a little lighter than its last 5×5. The author doesn't specify the rep count.
  - Chin-ups 3 sets to failure, 5 min rest.
  - Back extensions or glute-ham raises 5×10, which can be skipped when tired.
- **Friday (intensity day).**
  - Squat and the press each work up through doubles or singles to one set of 5 at a new 5RM, or within about 2% of one.
  - Then Power Clean 5×3 or Power Snatch 6×2.

### Logger gaps shown by the verified programs

This is an engineering synthesis of the verified prescriptions above (medium confidence). It maps onto the brief's `schema_gaps` values.

| Need | Programs | `schema_gaps` value |
|---|---|---|
| AMRAP last set | GZCLP T1/T3, Reddit PPL main lifts, 5/3/1 | `amrap_sets` |
| % of training max | BBB 5×10 at 50-60% TM | `percent_training_max` |
| % of a rep max | Texas Method (90%/80% of 5RM), GZCLP restart at 85% of 5RM | `percent_1rm` / `other` (5RM-based) |
| Alternating or rotating days | StrongLifts A/B, Reddit PPL, Texas Method bench/press swap, GZCLP A1/B1/A2/B2 | `rotating_days` |
| Rep scheme that steps down on failure | GZCLP 5×3→6×2→10×1 and 3×10→3×8→3×6 | `week_to_week_variation` / `other` |
| Test a max and reset | GZCLP 5RM test | `other` |
| Sets to failure | Texas Method chin-ups | `to_failure_or_intensity_techniques` |
| Supersets | Reddit PPL | already supported |

The GZCLP question (3 or 4 days) also raises a design question: should rotating programs be stored as an ordered list of sessions rather than fixed weekdays?

---

## 9. Rights leads (not verified; not legal advice)

We checked only the USPTO. **The EUIPO and India's trade marks registry were not checked for any name.** Every other program's rights status is **unknown**.

| Name | Finding | Source |
|---|---|---|
| StrongLifts | **Registered (US).** Reg. 7606704 is a stylized design mark ("STRONG" above "LIFTS") covering workout app software in Class 009, the same category as FitLog. It was registered 17 Dec 2024. The owner is Stronglifts Limited (Hong Kong), not Mehdi Hadim personally. Earlier live word-mark registrations exist, including No. 5037641 (2016, owner Hadim Mehdi, fitness app). | [23] |
| Starting Strength | **Registered (US).** Reg. 4072828, a standard-character mark in Classes 009 and 041. The current owner of record is Asgaard Funding, L.L.C. The Section 15 declaration was accepted, which makes it incontestable. A notice of suit was recorded in 2021. A renewal was filed in 2021, but its outcome isn't shown. | [24] |
| CrossFit | **Registered, per the owner's guidelines.** Unlicensed products may not use the mark "on or in connection with" their goods or services. The owner lists generic alternatives: "functional fitness", "high intensity fitness training", "strength and conditioning", "cross training". The owner actively polices use. | [25] |
| PAR-Q+ | All rights reserved by the PAR-Q+ Collaboration. There is no explicit licence to reproduce it. Link to the official form rather than copying the questions. | [22] |

Our current display names ("5×5 Linear Progression", "Novice Strength (3×5)") already avoid the marks in their titles. Legal review should confirm whether "Based on StrongLifts 5×5 (Mehdi Hadim)" and "Based on Starting Strength (Mark Rippetoe)" are acceptable descriptive uses, given that the StrongLifts registrations cover fitness apps.

---

## Refuted claims: don't use

| Claim | Vote | Why it matters |
|---|---|---|
| The original GZCLP is scheduled 3 days a week, which contradicts FitLog's 4-day listing | 1-2 | GZCLP days/week stays open (see section 1). |
| Wendler prescribes a 30%/45%/60% TM ramp over three cycles for beginners on BBB | 1-2 | Don't build this ramp into the BBB entry. |
| Every best-fit model showed muscle growth rising as sets end closer to failure, with intervals excluding zero [12] | 0-3 | The size-vs-failure relationship stays unresolved. |
| Refalo et al. 2023: no significant size advantage for failure, ES 0.12 [26] | 0-3 | Don't cite this figure. Recheck the paper before using any of it. |

---

## Coverage against the brief

| "Done means" item | Status |
|---|---|
| Every Tier 1 program has a full card and dataset entry | **Not done.** Partial facts for 5 of 20 Tier 1 programs. No cards and no JSON. |
| Every Tier 2 program has a card | **Not started.** |
| Each of the 14 programs has a verdict | **Done**, but 9 are *unverifiable* and 2 are *partly verified*. |
| Every program has a rights entry and a primary source | **Not done.** Rights leads for 2 programs; primary sources for 5. |
| Every evidence claim has a grade and citation | **Done** for what's here. |
| The JSON parses and `next_programs` keys resolve | **Not started.** |
| Every assumption, conflict and gap is listed | Listed below for this pass. |

### Not yet researched

- **Current library:** `starting-strength`, `bodyweight-recommended-routine`, `phul`, `arnold-split`, and the five generic programs, which can only be checked against the evidence ranges.
- **Tier 1 additions:** Heavy Duty/HIT; RP-style hypertrophy (volume landmarks); Greyskull LP; Madcow 5×5; nSuns; 5/3/1 for Beginners; PHAT; Couch to 5K; the WHO/ACSM minimum-dose program.
  - Leads from the r/Fitness wiki [10]: PHAT is 5 days; nSuns has 4-, 5- and 6-day variants; 5/3/1 for Beginners is 3 lifting days with conditioning on off days.
- **All of Tier 2.**
- **Report sections:** taxonomy beyond experience levels, the comparison matrix, the selection guide, populations (beyond the guideline leads), and myths.
- **Rights:** trademark checks for every program other than StrongLifts, Starting Strength and CrossFit, and EUIPO/India checks for all of them.
- **Program details:** session minutes for every program, and weekly hard-set counts.

### Conflicts and open questions

1. **GZCLP days per week.** Canonical GZCLP may be 3 days (rotating four workouts across weeks) or 4 days.
2. **Canonical 5/3/1 BBB version.** The candidates are the original article, the 3-Month Challenge, *Beyond 5/3/1* and *Forever*. Is "advanced" the right level?
3. **Texas Method attribution.** Is Glenn Pendlay a documented co-author? This needs *Practical Programming* (3rd ed.) and Pendlay's own writing.
4. **Failure and muscle size.** How strongly does muscle growth depend on proximity to failure? The answer decides how we grade Heavy Duty/HIT and RP-style RIR ramps, and whether RIR/RPE targets need to be first-class logger fields.
5. **Stored sessions vs weekdays.** Should rotating programs be stored as ordered sessions rather than weekdays?

### Assumptions and source weaknesses

- **GZCLP** rests on one 2016 author blog post [6]. It is primary but blog-level.
- **Reddit PPL** comes from a 2023 wiki archive of a 2015 post [1].
- **Texas Method** was read from a 2013 article via the Wayback Machine [9]. The book version wasn't checked.
- **The BBB page** is undated [7].
- **StrongLifts deload rule.** It sits on a separate page [4] and was confirmed only in a checker's note.
- **Unit conversions** follow the authors' own rounded kg/lb pairs, so 2.5 lb appears as 1.25 kg, not 1.13 kg.
- **Author outcome examples** are illustrations and grade as *Expert opinion*, e.g. Rippetoe's 315 → 405 lb in a year.

---

## 11. Bibliography

All accessed 26 September 2026.

1. Metallicadpa (Reddit user). "A Linear Progression Based PPL Program for Beginners." r/Fitness, 2015; archived on the r/Fitness wiki, 15 Jun 2023. https://thefitness.wiki/reddit-archive/a-linear-progression-based-ppl-program-for-beginners/
2. Hadim M. "StrongLifts 5×5 Workout Program." stronglifts.com, updated 4 Mar 2024. https://stronglifts.com/stronglifts-5x5/workout-program/
3. Hadim M. "Assistance Work." stronglifts.com. https://stronglifts.com/stronglifts-5x5/assistance-work/
4. Hadim M. "Failure." stronglifts.com. https://stronglifts.com/stronglifts-5x5/failure/
5. Hadim M. "Progress." stronglifts.com. https://stronglifts.com/stronglifts-5x5/progress/
6. LeFever C. "GZCL Applications & Adaptations." *Swole at Every Height* (blog), 5 Feb 2016. https://swoleateveryheight.blogspot.com/2016/02/gzcl-applications-adaptations.html
7. Wendler J. "Boring But Big." jimwendler.com, undated. https://www.jimwendler.com/blogs/jimwendler-com/101077382-boring-but-big
8. Wendler J. "Boring But Big 3-Month Challenge." jimwendler.com, undated. https://www.jimwendler.com/blogs/jimwendler-com/boring-but-big-3-month-challenge
9. Rippetoe M. "The Texas Method." startingstrength.com, 1 May 2013. https://startingstrength.com/article/the_texas_method (read via http://web.archive.org/web/20260801025514/https://startingstrength.com/article/the_texas_method)
10. r/Fitness wiki. "Strength Training & Muscle Building Routines." thefitness.wiki, last modified 30 Sep 2024. https://thefitness.wiki/routines/strength-training-muscle-building/ (secondary)
11. Pelland JC, Remmert JF, Robinson ZP, et al. "The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains." *Sports Med.* 2026;56(2):481-505. doi:10.1007/s40279-025-02344-w
12. Robinson ZP, Pelland JC, Remmert JF, et al. "Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy: A Series of Meta-Regressions." *Sports Med.* 2024;54(9):2209-2231. doi:10.1007/s40279-024-02069-2
13. Grgic J, Schoenfeld BJ, Orazem J, et al. "Effects of resistance training performed to repetition failure or non-failure on muscular strength and hypertrophy: A systematic review and meta-analysis." *J Sport Health Sci.* 2022;11(2):202-211. doi:10.1016/j.jshs.2021.01.007
14. Lopez P, Radaelli R, Taaffe DR, et al. "Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic Review and Network Meta-analysis." *Med Sci Sports Exerc.* 2021;53(6):1206-1216. doi:10.1249/MSS.0000000000002585
15. Singer A, Wolf M, Generoso L, et al. "Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy." *Front Sports Act Living.* 2024;6. doi:10.3389/fspor.2024.1429789
16. Wolf M, Androulakis-Korakakis P, Fisher J, et al. "Partial Vs Full Range of Motion Resistance Training: A Systematic Review and Meta-Analysis." *Int J Strength Cond.* 2023;3(1). doi:10.47206/ijsc.v3i1.182
17. Currier BS, D'Souza AC, Singh MAF, et al. "American College of Sports Medicine Position Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews." *Med Sci Sports Exerc.* 2026;58(4):851-872. doi:10.1249/MSS.0000000000003897
18. Bull FC, Al-Ansari SS, Biddle S, et al. "World Health Organization 2020 guidelines on physical activity and sedentary behaviour." *Br J Sports Med.* 2020;54(24):1451-1462. doi:10.1136/bjsports-2020-102955
19. Kanaley JA, Colberg SR, Corcoran MH, et al. "Exercise/Physical Activity in Individuals with Type 2 Diabetes: A Consensus Statement from the American College of Sports Medicine." *Med Sci Sports Exerc.* 2022;54(2):353-368. doi:10.1249/MSS.0000000000002800
20. National Strength and Conditioning Association. "Resistance Training for Older Adults" (position statement), Aug 2019. https://www.nsca.com/about-us/position-statements/resistance-training-for-older-adults/
21. American College of Obstetricians and Gynecologists. "Physical Activity and Exercise During Pregnancy and the Postpartum Period." Committee Opinion No. 804, *Obstet Gynecol.* 2020;135:e178-88; reaffirmed 2023. https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period
22. PAR-Q+ Collaboration. *PAR-Q+* (2025 edition) and *ePARmed-X+*. https://eparmedx.com/
23. USPTO TSDR. Serial No. 98323782 / Reg. No. 7606704 (STRONGLIFTS, stylized). https://tsdr.uspto.gov/statusview/sn98323782
24. Justia Trademarks. Serial No. 85146322 / Reg. No. 4072828 (STARTING STRENGTH), read via Wayback snapshot of 15 Aug 2025. https://trademarks.justia.com/851/46/starting-strength-85146322.html
25. CrossFit, LLC. *CrossFit Trademark Guidelines*, revised Oct 2020. https://mainsite-assets.crossfit.com/iptheft/CrossFit_Trademark_Guidelines_revised_Oct_2020.pdf
26. Refalo MC, Helms ER, Trexler ET, et al. "Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy: A Systematic Review with Meta-analysis." *Sports Med.* 2023;53(3):649-665. doi:10.1007/s40279-022-01784-y (cited only for the refuted claim)
