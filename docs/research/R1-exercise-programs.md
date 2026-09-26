# Research brief R1: Exercise programs, an expert reference and a program dataset

## Your role

Act as a senior strength-and-conditioning researcher. You are a coach with an exercise-science background who reads primary sources, knows the research literature, and can separate a program's marketing from its mechanics.

Produce two things:

1. **A reference.** An expert-grade, fully cited reference on established exercise programs. For each one, cover what it is, what it's best for, who should (and shouldn't) do it, and exactly how it is run.
2. **A dataset.** A machine-readable version of those programs that our engineers can import.

Don't ask clarifying questions. Where something is ambiguous, state your assumption in the report and carry on.

## Background

FitLog is a mobile app for logging workouts and nutrition. Its users are 16 and over. A user picks a starter program from our library, the app copies it into their own plan, and they log every set against it. We rank programs for each user by goal, experience, days per week, session length and equipment.

Our logger records sets × reps × load, or time, and supports supersets and circuits. It does not yet handle percentages of a max, RPE targets, AMRAP sets or prescriptions that change from week to week. Part of this research is finding out which of those we need.

The library holds 14 programs today:

| Key | Our display name | Based on | Level | Focus | Equipment | Days/wk | Min/session |
|---|---|---|---|---|---|---|---|
| stronglifts-5x5 | 5×5 Linear Progression | StrongLifts 5×5 (Mehdi Hadim) | beginner | strength | full_gym | 3 | 45 |
| starting-strength | Novice Strength (3×5) | Starting Strength (Mark Rippetoe) | beginner | strength | full_gym | 3 | 60 |
| gzclp | GZCLP | GZCLP (Cody Lefever) | beginner | strength | full_gym | 4 | 60 |
| full-body-3 | Full Body — 3 days | — | beginner | general | full_gym | 3 | 50 |
| dumbbell-full-body | Dumbbell Full Body — Home | — | beginner | general | dumbbells | 3 | 45 |
| bodyweight-recommended-routine | Bodyweight Routine | The Recommended Routine (r/bodyweightfitness) | beginner | general | bodyweight | 3 | 60 |
| push-pull-legs | Push / Pull / Legs — 3 days | — | intermediate | hypertrophy | full_gym | 3 | 60 |
| reddit-ppl | Push / Pull / Legs — 6 days | Reddit PPL (u/Metallicadpa) | intermediate | hypertrophy | full_gym | 6 | 75 |
| upper-lower-4 | Upper / Lower — 4 days | — | intermediate | general | full_gym | 4 | 60 |
| phul | PHUL — Power Hypertrophy Upper Lower | PHUL (Brandon Campbell) | intermediate | hypertrophy | full_gym | 4 | 75 |
| texas-method | Texas Method | Texas Method (Glenn Pendlay, Mark Rippetoe) | intermediate | strength | full_gym | 3 | 75 |
| bro-split-5 | Body-Part Split — 5 days | — | intermediate | hypertrophy | full_gym | 5 | 60 |
| 531-bbb | 5/3/1 Boring But Big | 5/3/1 Boring But Big (Jim Wendler) | advanced | strength | full_gym | 4 | 75 |
| arnold-split | Arnold Split | Arnold Schwarzenegger's training split | advanced | hypertrophy | full_gym | 6 | 90 |

We will use the research to:

1. **Verify.** Check those 14 against their authors' primary sources and correct what we got wrong, including the level, focus and schedule we assigned.
2. **Expand.** Grow the library across goals, experience levels, equipment setups and populations.
3. **Recommend.** Build the rules that match a user to a program.
4. **Publish.** Parts of the reference will appear in the app and publicly. So every claim needs a source, and for every program we need to know what we're allowed to reproduce.

The readers are our product team, who are sharp but not exercise scientists, and the engineers who will import the dataset. Define technical terms the first time you use them.

## Scope

### Tier 1: full depth

Each Tier 1 program needs a complete program card and a complete prescription in the dataset: every week that differs, every day and every exercise.

- **The 14 programs above.**
- **Mike Mentzer's Heavy Duty (High-Intensity Training, HIT).** Cover its roots in Arthur Jones's Nautilus-era HIT, Mentzer's original routines and his later "Ideal" and "Consolidated" routines. Include the intensity techniques (training to failure, rest-pause, negatives, forced reps, pre-exhaust) and the long recovery intervals. Report what current evidence says about low-volume, single-set, to-failure training.
- **Renaissance Periodization–style hypertrophy (Dr Mike Israetel).** Cover the volume-landmarks model (MV, MEV, MAV, MRV), mesocycles that ramp up volume and bring sets closer to failure, and deloads. RP's app is proprietary, so describe the published method and build a representative template. Don't reproduce the app's content.
- **Linear progression (LP).** Explain how novice linear progression works, why and when it stalls, and how programs reset or hand over to intermediate programming. Include Greyskull LP (John Sheaffer), Madcow 5×5, nSuns 5/3/1 LP and 5/3/1 for Beginners (Jim Wendler).
- **PHAT** (Layne Norton).
- **Couch to 5K.**
- **A minimum-effective-dose program for people who have never trained**, built on the WHO 2020 physical-activity guidelines and ACSM recommendations.

### Tier 2: card only

Tier 2 programs get a shorter card: identity, description, goal, who it's for and not for, structure, progression, evidence, rights and sources. Include the day-by-day prescription only when the author publishes it free and it is short.

- **Strength:** Candito 6-Week Strength, Sheiko (representative templates), Smolov and Smolov Jr, Westside / Conjugate, the Juggernaut Method, Bill Starr 5×5, Calgary Barbell 16-Week, Dan John's Easy Strength.
- **Bodybuilding and hypertrophy:** Dorian Yates's Blood & Guts, DC Training (Dante Trudel), German Volume Training, FST-7 (Hany Rambod), Y3T (Neil Hill), Arnold's Golden Six, Lyle McDonald's Generic Bulking Routine, Jeff Nippard's programs.
- **Bodyweight:** Convict Conditioning (Paul Wade), You Are Your Own Gym (Mark Lauren), and Overcoming Gravity (Steven Low) as a framework.
- **Kettlebell:** Simple & Sinister (Pavel Tsatsouline).
- **Endurance and conditioning:** Hal Higdon's running plans, 80/20 (polarized) training, Zone 2 training, Norwegian 4×4 intervals, the Tabata protocol, 12-3-30.
- **Hybrid and functional:** CrossFit (the methodology), HYROX preparation, concurrent strength-and-endurance training.
- **Popular home programs:** P90X, Insanity, Kayla Itsines's BBG / Sweat, Chloe Ting's challenges.
- **Mind-body and mobility:** yoga, Pilates and mobility routines, with one card per category rather than per brand.

You may also add programs that aren't listed. Add one only if it was widely used in 2024–2026 and its author has documented its structure clearly. Say why you added it.

**Out of scope:** team-sport programs, clinical rehabilitation protocols, and anything that assumes performance-enhancing drugs.

## What to deliver

Deliver one Markdown report with these sections, in this order:

1. **Executive summary** (one page at most). Describe the landscape and give the ten findings that matter most for a program library. Then give each of our 14 programs a verdict of *correct*, *corrected* (say what changes) or *unverifiable*. Our team will compare the exercise-level detail with your dataset.
2. **Taxonomy.** Explain how programs differ along these dimensions:
   - goal;
   - split: full body, upper/lower, push/pull/legs, body part;
   - progression model: linear, double progression, percentage waves, RPE/RIR autoregulation, volume ramps, failure-based;
   - periodization: linear, undulating, block, conjugate.

   Define experience levels objectively, by how quickly a person can still add load and by training age. Use those definitions everywhere in the report.
3. **What experts know.** Give a practical range, an evidence grade and sources for each of these training variables:
   - the mechanisms of muscle growth (mechanical tension, metabolic stress, muscle damage);
   - weekly volume per muscle;
   - frequency;
   - load and rep ranges;
   - proximity to failure (reps in reserve, RIR);
   - rest intervals;
   - progressive overload;
   - periodization and deloads;
   - exercise selection and order;
   - range of motion, including lengthened partials;
   - tempo;
   - warm-ups;
   - concurrent training (the interference effect);
   - detraining and retraining;
   - individual variation;
   - differences by sex and age.

   Keep what the evidence shows separate from coaching consensus.
4. **Program cards.** Tier 1 first, then Tier 2, grouped by goal.
5. **Comparison matrix.** One row per program, with these columns: goal, level, days/week, minutes/session, equipment, progression model, weekly hard sets for the major muscle groups, evidence grade and rights status.
6. **Selection guide.** Build a decision table and a decision tree. They take a user's inputs (goal, experience, days/week, minutes/session, equipment, injuries or limitations, age group) and return one to three recommended programs, each with a one-line reason. Say when someone should see a doctor or a qualified professional before starting, for example using the PAR-Q+ screening criteria.
7. **Populations.** Give practical, sourced guidance for older adults, 16–17-year-olds, pregnancy and postpartum, obesity, type 2 diabetes, hypertension, osteoporosis or low bone mass, common joint pain (knee, lower back), and people returning after a long break. Present this as guidance, not medical advice.
8. **Myths and controversies.** Cover, for example: one set to failure versus higher volume, "muscle confusion", spot reduction, "toning", soreness as a sign of growth, and women "getting bulky". Say what the evidence shows for each.
9. **Rights register.** A table covering every program (see "Rights and licensing").
10. **Gaps, conflicts and open questions** for our team, including every assumption you made.
11. **Bibliography.**
12. **Dataset.** The JSON described below, at the very end.

### The program card

For every program:

- **Identity:** canonical name, aliases and variants, author or originator, year first published, primary source (book and edition, or URL), and which version you treat as canonical.
- **Description:** what it is, in plain English, in 150 words or fewer.
- **Best for:** the goals and situations it suits.
- **Who should do it:** experience level by your definitions, prerequisites (for example, can squat to depth with good form), time needed and suitable populations.
- **Who shouldn't, and cautions:** who it's wrong for, and its injury and overuse risks.
- **Structure:** days per week, split, session length, weekly schedule, cycle length, and how long people usually run it.
- **Modules:** its building blocks (warm-up, main lifts, assistance work, conditioning, cool-down) and its blocks or phases, in order.
- **Prescription:** exercises, sets, reps, intensity (%1RM, % training max, RPE/RIR or to failure), rest, tempo, AMRAP sets, supersets and intensity techniques.
- **Progression:** the exact rule and its increments in kg, what to do after a failed session, the reset and deload rules, and when to move on and to what.
- **Weekly volume:** hard sets per muscle group per week. Calculate them from the prescription and compare them with the evidence-based ranges from section 3.
- **Equipment:** the minimum setup, and substitutions for missing equipment or common injuries.
- **Expected results:** realistic outcomes and a timeline, with an evidence grade.
- **Evidence:** what supports or contradicts the program's core ideas, graded.
- **Pros, cons and common mistakes.**
- **What an app must track to run it:** for example the training max, AMRAP reps, estimated 1RM, RPE or position in the cycle.
- **Rights:** see "Rights and licensing".
- **Sources:** numbered citations.

## The dataset

Deliver one JSON array with one object per program. Output strict JSON, with no comments and no trailing commas. The format extends our current template format, so keep the field names exactly as shown. For our 14 programs, keep our keys.

The annotated example below shows every field. The comments explain each field; your output must not contain any.

```jsonc
{
  "key": "starting-strength",               // kebab-case, unique; keep ours for our 14 programs
  "name": "Novice Strength (3×5)",          // a display name we can use safely
  "original_name": "Starting Strength",     // as the author publishes it
  "based_on": "Starting Strength (Mark Rippetoe)",
  "summary": "…",                           // at most 120 characters
  "description": "…",                       // at most 500 characters
  "level": "beginner",                      // beginner | intermediate | advanced
  "focus": "strength",                      // strength | hypertrophy | general
  "goals": ["strength"],                    // any of: strength, hypertrophy, power, endurance, fat_loss_support, general_health, mobility, sport
  "equipment": "full_gym",                  // the minimum setup: full_gym | home_gym | dumbbells | bodyweight
  "equipment_items": ["barbell"],           // any of: barbell, dumbbell, machine, cable, bodyweight, band, kettlebell, other
  "days_per_week": 3,
  "session_minutes": 60,                    // typical, including the warm-up
  "schedule": "Three non-consecutive days a week, alternating A and B",
  "cycle_weeks": 1,                         // length of one repeating cycle
  "typical_run_weeks": "…",                 // how long people usually run it, e.g. "12–24" or "ongoing"
  "progression_model": "linear",            // linear | double_progression | percentage_wave | rpe_autoregulated | volume_ramp | failure_based | time_or_distance | other
  "progression": "…",                       // the exact rule, with increments in kg
  "on_stall": "…",                          // what to do when progress stops
  "deload": "…",
  "who_for": ["…"],
  "not_for": ["…"],
  "prerequisites": ["…"],
  "next_programs": ["texas-method"],        // keys of programs in this dataset
  "weekly_hard_sets": { "quads": 0, "glutes": 0 },  // per muscle slug, averaged over the cycle
  "schema_gaps": ["warmup_sets"],
  "weeks": [
    {
      "week": 1,
      "days": [
        {
          "name": "Workout A",
          "weekday": null,                  // 0 = Mon … 6 = Sun; null when the days rotate
          "notes": "…",
          "exercises": [
            {
              "name": "Barbell Squat",
              "aliases": ["Back Squat"],
              "sets": 3,
              "reps_min": 5,
              "reps_max": 5,
              "rest_seconds": 240,
              "duration_seconds": null,
              "distance_m": null,
              "intensity": { "type": "load_progression", "value": null },  // type: percent_1rm | percent_training_max | rpe | rir | to_failure | load_progression | bodyweight | heart_rate_zone | pace
              "amrap_last_set": false,
              "superset_group": null,       // exercises sharing a number form one superset or circuit
              "technique": null,            // e.g. "rest-pause", "drop set", "negatives"
              "warmup": "…",
              "notes": "…"
            }
          ]
        }
      ]
    }
  ],
  "evidence": { "grade": "…", "summary": "…", "sources": [3, 7] },  // grade: Strong | Moderate | Limited | Expert opinion
  "rights": {
    "owner": "…",
    "name_trademark": "…",                  // registered | claimed | none_found | unknown
    "registries_checked": ["…"],
    "source_access": "…",                   // free | paid | mixed
    "reproduce": "…",                       // structure_and_text (openly licensed) | structure_only | summary_only
    "attribution": "Based on Starting Strength (Mark Rippetoe)"
  },
  "sources": [1, 2],                        // bibliography numbers
  "notes": "…"
}
```

Rules for the dataset:

- **Exercise names.** Use common, unambiguous English names, written the way ours are: Barbell Squat, Front Squat, Barbell Bench Press, Incline Dumbbell Press, Overhead Press, Deadlift, Romanian Deadlift, Barbell Row, Pull-up, Lat Pulldown, Seated Cable Row, Dumbbell Lateral Raise, Face Pull, Leg Press, Leg Curl, Standing Calf Raise, Dip, Skull Crusher, Cable Crunch. Put the author's own names for an exercise in `aliases`.
- **Muscle groups.** `weekly_hard_sets` uses these slugs: chest, upper-chest, lats, mid-back, lower-back, traps, front-delts, side-delts, rear-delts, biceps, triceps, forearms, quads, hamstrings, glutes, calves, adductors, hip-flexors, abs, obliques. Count 1 per working set where the muscle is a prime mover and 0.5 where it is a major synergist, averaged over the cycle.
- **`weeks`.** Give one entry if every week is the same. Otherwise give every distinct week, for example 5/3/1's four-week wave, Couch to 5K's nine weeks or a full RP mesocycle.
- **`schema_gaps`.** List what the program needs that a simple template can't hold. A simple template is sets × reps × rest, the same every week. Use these values: `percent_1rm`, `percent_training_max`, `amrap_sets`, `rpe_or_rir_targets`, `week_to_week_variation`, `to_failure_or_intensity_techniques`, `tempo`, `warmup_sets`, `rotating_days`, `distance_targets`, `heart_rate_or_pace_targets`, and `other` (explain it in `notes`).
- **Tier 2.** A Tier 2 program may leave `weeks` empty when no free day-by-day source exists. Say why in `notes`.
- **Our enums are narrow.** For `level`, `focus` and `equipment`, pick the closest value, and use `goals` and `equipment_items` for the full picture.

## Evidence and sources

Look for sources in this order:

1. **What a program is:** the author's own book, website or article. For community programs (Reddit PPL, nSuns, GZCLP, the Recommended Routine), use the original post or the official wiki.
2. **Whether it works:** systematic reviews and meta-analyses first, then randomised controlled trials, then other studies.
3. **Position stands and guidelines:** ACSM, NSCA, WHO, ACOG and national health bodies.
4. **Reputable secondary sources that cite research,** such as textbooks and evidence-based coaches. Use these as support, never as the only source for a claim.

Don't use content farms, AI-generated listicles, supplement-company blogs or influencer claims without citations. If a detail exists only in a forum post or a video, say so.

Rules:

- Cite every factual claim inline as [n]. The bibliography gives the author, title, year, publisher or journal, URL or DOI, and the date you accessed it.
- Grade the evidence with one of four grades:
  - **Strong:** consistent systematic reviews or meta-analyses, or several good RCTs.
  - **Moderate:** some RCTs, mostly consistent.
  - **Limited:** few or small studies, or mixed or indirect results.
  - **Expert opinion:** coaching consensus, author claims or anecdote.
- Label three things separately: what the author says, what the evidence shows, and your own judgement.
- When sources conflict or a program changed between editions, document the versions. Treat the version the author currently endorses as canonical and list the rest as variants.
- Never fill a gap with a plausible guess. Write "not specified by the author" or "unverified", and say where you looked.

## Rights and licensing

We will use this research commercially and may publish it, so we must be able to use it without IP conflicts.

- **Record the rights for each program:**
  - the owner;
  - whether its name is a registered or claimed trademark. Check the USPTO, the EUIPO and India's trade marks registry, and say which you checked. "None found" is not the same as "unknown";
  - whether the author publishes the program free or sells it;
  - what we can safely reproduce.
- **Use your own words.** Describe training methods and facts (sets, reps, schedules, progression rules) in your own words. Don't copy the author's text, tables or images.
- **Paid programs** (books, apps, PDFs): use only what the author or reputable reviewers publish free. Don't reconstruct paid content.
- **Names and attribution.** Where the original name may be protected, suggest a trademark-safe display name. Suggest an attribution line in our style: "Based on StrongLifts 5×5 (Mehdi Hadim)".
- **Flag risks, don't decide them.** This feeds our own legal review and is not legal advice.

## Working rules

- Finish Tier 1 completely before you start Tier 2.
- If you reach an output limit, stop at the end of a program card or a JSON object, never in the middle of one. End with `CONTINUE FROM: <section or program key>` and we'll ask you to continue.
- Use metric units (kg, m, s). Add pounds only where the author uses them.
- Write neutrally so the report can be published unchanged: no hype, no brand promotion and no medical claims. Open the report with a short safety note.

## Done means

- [ ] Every Tier 1 program has a full card and a full dataset entry, and every Tier 2 program has a card.
- [ ] Each of our 14 programs has a verdict: correct, corrected (with the changes) or unverifiable.
- [ ] Every program has a rights entry and at least one primary source.
- [ ] Every evidence claim has a grade and a citation.
- [ ] The JSON parses, and every key in `next_programs` exists in it.
- [ ] Every assumption, conflict and gap is listed in section 10.
