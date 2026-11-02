# CT-1 · Starter programmes: prescriptions, reviewer and date

Card box 2: "Three starter programmes with prescriptions exist, with the reviewer and date recorded in
`docs/evidence/CT-1/`." Source: `content/programmes/starter-programmes.json`, content version
`2026-10-27.1`.

## Reviewer and date

| Review | Reviewer | Date | Kind |
|---|---|---|---|
| Technical self-review | Claude Opus 5.5, the CT-1 implementer (AI). Not independent | **2026-10-27** | Technical only: bounds, logging-type fit, weekday spread, exercise references, no claims |
| Independent technical review | The coordinator's reviewer | — | Next phase |
| Qualified coaching review | A person, at **OW-13** | — | **Open. Not claimed** |

The same reviewer and date are recorded in each programme's `review.technical` entry. Each programme also
records `review.qualified = { status: pending, gate: OW-13 }`. No qualified review is claimed. Whether a
technical reviewer satisfies "the reviewer" in box 2 is for the verifier and the owner. If it does not,
box 2 stays open until OW-13 records a qualified reviewer.

## The three programmes

All loads are left unset (PRD §6.2 allows this). Members choose a load that fits the rep range. Timed
items use `repsMin = repsMax = 1` with a duration, as the domain contract requires reps on every
prescription. Weekdays use 0 = Sunday … 6 = Saturday (`extract(dow …)` in `refresh_schedule`).

### 1. Full body, three days (`full-body-three-day`, introductory): Mon, Wed, Fri

| Day | Exercise · sets × reps · rest |
|---|---|
| Full body 1 (Mon) | Goblet squat 3×8–12 · 90 s; Dumbbell bench press 3×8–12 · 90 s; Lat pulldown 3×8–12 · 90 s; Dumbbell Romanian deadlift 3×8–12 · 90 s; Plank 3×30 s · 60 s |
| Full body 2 (Wed) | Leg press 3×10–15 · 90 s; Seated cable row 3×8–12 · 90 s; Seated dumbbell shoulder press 3×8–12 · 90 s; Lying leg curl 3×10–15 · 60 s; Dead bug 3×8–12 · 60 s |
| Full body 3 (Fri) | Dumbbell reverse lunge 3×8–12 · 90 s; Machine chest press 3×8–12 · 90 s; One-arm dumbbell row 3×8–12 · 90 s; Dumbbell hip thrust 3×10–15 · 90 s; Side plank 2×30 s · 60 s |

### 2. Upper and lower, four days (`upper-lower-four-day`, intermediate): Mon, Tue, Thu, Fri

| Day | Exercise · sets × reps · rest |
|---|---|
| Upper 1 (Mon) | Barbell bench press 4×6–10 · 150 s; Barbell bent-over row 4×6–10 · 150 s; Seated dumbbell shoulder press 3×8–12 · 90 s; Lat pulldown 3×8–12 · 90 s; Dumbbell curl 2×10–15 · 60 s; Cable triceps pressdown 2×10–15 · 60 s |
| Lower 1 (Tue) | Barbell back squat 4×6–10 · 180 s; Barbell Romanian deadlift 3×8–10 · 150 s; Leg press 3×10–15 · 120 s; Seated leg curl 3×10–15 · 90 s; Standing calf raise machine 3×10–15 · 60 s; Hanging knee raise 3×8–12 · 60 s |
| Upper 2 (Thu) | Incline dumbbell bench press 3×8–12 · 120 s; Seated cable row 3×8–12 · 120 s; Assisted pull-up 3×6–10 · 120 s; Dumbbell lateral raise 3×12–15 · 60 s; Face pull 3×12–15 · 60 s; Hammer curl 2×10–12 · 60 s; Overhead cable triceps extension 2×10–12 · 60 s |
| Lower 2 (Fri) | Barbell deadlift 3×5–8 · 180 s; Dumbbell Bulgarian split squat 3×8–12 · 120 s; Leg extension 3×10–15 · 90 s; Lying leg curl 3×10–15 · 90 s; Seated calf raise 3×12–15 · 60 s; Kneeling cable crunch 3×10–15 · 60 s |

### 3. Home, bodyweight and dumbbells (`home-bodyweight-dumbbell-three-day`, introductory): Tue, Thu, Sat

| Day | Exercise · sets × reps · rest |
|---|---|
| Home 1 (Tue) | Bodyweight squat 3×12–20 · 60 s; Push-up 3×6–15 · 90 s; Bent-over dumbbell row 3×8–12 · 90 s; Glute bridge 3×12–20 · 60 s; Plank 3×30 s · 60 s |
| Home 2 (Thu) | Goblet squat 3×10–15 · 90 s; Dumbbell floor press 3×8–12 · 90 s; One-arm dumbbell row 3×8–12 · 90 s; Dumbbell Romanian deadlift 3×8–12 · 90 s; Dead bug 3×8–12 · 60 s |
| Home 3 (Sat) | Bodyweight reverse lunge 3×8–12 · 90 s; Pike push-up 3×5–10 · 90 s; Dumbbell curl 2×10–15 · 60 s; Overhead dumbbell triceps extension 2×10–15 · 60 s; Single-leg glute bridge 3×8–12 · 60 s; Side plank 2×30 s · 60 s |

Totals: 3 programmes, 10 days, 56 prescriptions (hand count; `build-seed.mjs check` reports the
authoritative numbers).

## What the technical review checked

- **PRD §6.2 bounds** on every prescription: sets 1–50, reps 1–1,000 with min ≤ max, rest 0–3,600 s,
  duration 1–86,400 s. The validator enforces all of them, and tests plant each violation.
- **Logging-type fit.** Timed exercises carry a duration. Resistance and bodyweight exercises carry none.
  Distance exercises would need a duration or a distance; no starter uses one.
- **Every exercise exists in the catalogue.** The template builder snapshots the exact seeded row,
  including its version, multiplier and load basis, so the `programmes` trigger can match it.
- **Schedulable.** Each day has at least one exercise and at least one weekday, and no weekday holds
  two days of the same programme.
- **No claims.** Descriptions describe the sessions and a double-progression rule ("when you reach the
  top of the range on every set, add a small amount of load next time"). None says it is safe, suitable
  for a condition or guarantees a result.

## For the qualified reviewer (OW-13)

- The rep ranges and rest periods are conventional resistance-training defaults. A reviewer may want to
  compare them with a primary reference. One candidate is the American College of Sports Medicine
  position stand "Progression models in resistance training for healthy adults" (*Medicine & Science in
  Sports & Exercise*, 2009). This session could not open it, so it is **unverified**. Nothing in the
  product cites it or depends on it.
- Points worth a coach's eye: the deadlift and back-squat volumes in "Upper and lower", and whether the
  "introductory" label and the home programme's push-up range (6–15) suit a new member. Any change is
  filed as one list against CT-1, as OW-13's card says.
