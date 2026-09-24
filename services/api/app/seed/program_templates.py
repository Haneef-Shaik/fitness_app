"""The starter-program library — C-01, C-04 and onboarding's A-09.

Plain data, like the food catalog: a template is not a row anyone owns and is
never edited in place. Starting one deep-copies it into the user's own
programs (`POST /v1/program-templates/{key}/start`).

These are well-known programs, configured as their authors describe them:
days, exercises, sets, rep ranges, rest, and — in `progression` and day notes —
how load moves, since that is what makes a program a program rather than a
list. Prescriptions carry no load: the right starting load is the user's, and
the logger's previous-performance strip carries it forward from the first
session. Percentage-based programs (5/3/1, Texas Method) say so in their notes.

Every exercise is named by its catalog name; `test_program_templates.py`
fails if one is missing, so a typo here cannot reach a user as a broken copy.
"""
from __future__ import annotations

from dataclasses import dataclass, field

Level = str       # "beginner" | "intermediate" | "advanced"
Focus = str       # "strength" | "hypertrophy" | "general"
Equipment = str   # "full_gym" | "home_gym" | "dumbbells" | "bodyweight"


@dataclass(frozen=True)
class TemplateExercise:
    name: str
    sets: int
    reps_min: int | None
    reps_max: int | None
    rest_seconds: int
    duration_seconds: int | None = None


@dataclass(frozen=True)
class TemplateDay:
    name: str
    weekday: int | None                       # 0 = Mon … 6 = Sun; None = rotate
    exercises: tuple[TemplateExercise, ...]
    notes: str | None = None


@dataclass(frozen=True)
class ProgramTemplate:
    key: str
    name: str
    summary: str
    level: Level
    focus: Focus
    equipment: Equipment
    session_minutes: int
    #: How the days are run in a week — "Mon / Wed / Fri", "alternate A and B".
    schedule: str
    #: How the load goes up. The part that makes it a program.
    progression: str
    #: Who the program comes from, when it has a well-known origin.
    based_on: str | None
    days: tuple[TemplateDay, ...]
    #: Sessions a week, which can differ from len(days) for rotating programs.
    sessions_per_week: int = 0
    tags: tuple[str, ...] = field(default_factory=tuple)

    @property
    def per_week(self) -> int:
        return self.sessions_per_week or len(self.days)


def _e(name: str, sets: int, lo: int | None, hi: int | None = None, rest: int = 120,
       duration: int | None = None) -> TemplateExercise:
    return TemplateExercise(name, sets, lo, hi if hi is not None else lo, rest, duration)


def _d(name: str, weekday: int | None, *exercises: TemplateExercise, notes: str | None = None) -> TemplateDay:
    return TemplateDay(name, weekday, tuple(exercises), notes)


TEMPLATES: tuple[ProgramTemplate, ...] = (
    # ------------------------------------------------------------ beginner
    ProgramTemplate(
        key="stronglifts-5x5",
        name="5×5 Linear Progression",
        summary="Two alternating workouts of five sets of five. Add weight every session.",
        level="beginner", focus="strength", equipment="full_gym", session_minutes=45,
        schedule="Three days a week (e.g. Mon / Wed / Fri), alternating A and B",
        progression="Add 2.5 kg to every lift each session you complete all sets (5 kg on deadlift). "
                    "Fail a weight three sessions running: drop it 10% and build back up.",
        based_on="StrongLifts 5×5 (Mehdi Hadim)",
        sessions_per_week=3,
        days=(
            _d("Workout A", None,
               _e("Barbell Squat", 5, 5, rest=180), _e("Barbell Bench Press", 5, 5, rest=180),
               _e("Barbell Row", 5, 5, rest=180)),
            _d("Workout B", None,
               _e("Barbell Squat", 5, 5, rest=180), _e("Overhead Press", 5, 5, rest=180),
               _e("Deadlift", 1, 5, rest=180)),
        ),
    ),
    ProgramTemplate(
        key="starting-strength",
        name="Novice Strength (3×5)",
        summary="The classic novice barbell program: squat every session, three sets of five.",
        level="beginner", focus="strength", equipment="full_gym", session_minutes=60,
        schedule="Three days a week, alternating A and B",
        progression="Add weight every session: 2.5–5 kg on squat and deadlift, 1–2.5 kg on the presses.",
        based_on="Starting Strength (Mark Rippetoe)",
        sessions_per_week=3,
        days=(
            _d("Workout A", None,
               _e("Barbell Squat", 3, 5, rest=180), _e("Barbell Bench Press", 3, 5, rest=180),
               _e("Deadlift", 1, 5, rest=180)),
            _d("Workout B", None,
               _e("Barbell Squat", 3, 5, rest=180), _e("Overhead Press", 3, 5, rest=180),
               _e("Power Clean", 5, 3, rest=150)),
        ),
    ),
    ProgramTemplate(
        key="gzclp",
        name="GZCLP",
        summary="Four days of heavy (T1), volume (T2) and light (T3) work. Built for steady novice gains.",
        level="beginner", focus="strength", equipment="full_gym", session_minutes=60,
        schedule="Four days a week (e.g. Mon / Tue / Thu / Fri)",
        progression="T1: 5×3, the last set as many reps as possible; add weight each session. "
                    "When 5×3 fails, move to 6×2, then 10×1. T2: 3×10, then 3×8, then 3×6. "
                    "T3: add weight once the last set reaches 25 reps.",
        based_on="GZCLP (Cody Lefever)",
        days=(
            _d("Day 1 — Squat", 0,
               _e("Barbell Squat", 5, 3, rest=180), _e("Barbell Bench Press", 3, 10, rest=120),
               _e("Lat Pulldown", 3, 15, rest=60), notes="T1 squat · T2 bench · T3 pulldown"),
            _d("Day 2 — Overhead Press", 1,
               _e("Overhead Press", 5, 3, rest=180), _e("Deadlift", 3, 10, rest=120),
               _e("Dumbbell Row", 3, 15, rest=60), notes="T1 press · T2 deadlift · T3 row"),
            _d("Day 3 — Bench", 3,
               _e("Barbell Bench Press", 5, 3, rest=180), _e("Barbell Squat", 3, 10, rest=120),
               _e("Lat Pulldown", 3, 15, rest=60), notes="T1 bench · T2 squat · T3 pulldown"),
            _d("Day 4 — Deadlift", 4,
               _e("Deadlift", 5, 3, rest=180), _e("Overhead Press", 3, 10, rest=120),
               _e("Dumbbell Row", 3, 15, rest=60), notes="T1 deadlift · T2 press · T3 row"),
        ),
    ),
    ProgramTemplate(
        key="full-body-3",
        name="Full Body — 3 days",
        summary="Three whole-body sessions a week. The simplest place to start in a gym.",
        level="beginner", focus="general", equipment="full_gym", session_minutes=50,
        schedule="Mon / Wed / Fri",
        progression="Stay in the rep range. When every set reaches the top of it, add 2.5 kg next time.",
        based_on=None,
        days=(
            _d("Full Body A", 0,
               _e("Barbell Squat", 3, 5, 8, 180), _e("Barbell Bench Press", 3, 5, 8, 180),
               _e("Barbell Row", 3, 8, 10), _e("Plank", 3, None, None, 60, duration=45)),
            _d("Full Body B", 2,
               _e("Romanian Deadlift", 3, 6, 10, 180), _e("Overhead Press", 3, 5, 8, 150),
               _e("Lat Pulldown", 3, 8, 12), _e("Dumbbell Hammer Curl", 2, 10, 12, 90)),
            _d("Full Body C", 4,
               _e("Leg Press", 3, 8, 12), _e("Dumbbell Bench Press", 3, 8, 12),
               _e("Seated Cable Row", 3, 10, 12), _e("Hanging Leg Raise", 3, 8, 12, 60)),
        ),
    ),
    ProgramTemplate(
        key="dumbbell-full-body",
        name="Dumbbell Full Body — Home",
        summary="Three full-body sessions with nothing but a pair of adjustable dumbbells.",
        level="beginner", focus="general", equipment="dumbbells", session_minutes=45,
        schedule="Mon / Wed / Fri",
        progression="Reach the top of the rep range on every set, then use the next dumbbell up.",
        based_on=None,
        days=(
            _d("Home A", 0,
               _e("Goblet Squat", 3, 8, 12, 90), _e("Dumbbell Bench Press", 3, 8, 12, 90),
               _e("Dumbbell Row", 3, 8, 12, 90), _e("Dumbbell Curl", 2, 10, 15, 60),
               _e("Plank", 3, None, None, 60, duration=45)),
            _d("Home B", 2,
               _e("Dumbbell Romanian Deadlift", 3, 8, 12, 90), _e("Dumbbell Shoulder Press", 3, 8, 12, 90),
               _e("Dumbbell Walking Lunge", 3, 10, 12, 90), _e("Reverse Dumbbell Fly", 3, 12, 15, 60),
               _e("Push-up", 2, 10, 20, 60)),
            _d("Home C", 4,
               _e("Goblet Squat", 3, 10, 15, 90), _e("Dumbbell Fly", 3, 10, 12, 60),
               _e("Dumbbell Row", 3, 10, 12, 90), _e("Arnold Press", 3, 8, 12, 90),
               _e("Glute Bridge", 3, 12, 15, 60)),
        ),
    ),
    ProgramTemplate(
        key="bodyweight-recommended-routine",
        name="Bodyweight Routine",
        summary="Paired push, pull and leg progressions with a core finisher. No equipment beyond a bar.",
        level="beginner", focus="general", equipment="bodyweight", session_minutes=60,
        schedule="Three days a week (e.g. Mon / Wed / Fri)",
        progression="3 sets of 5–8. When you reach 3×8 with good form, move to the next, harder "
                    "variation of that movement.",
        based_on="The Recommended Routine (r/bodyweightfitness)",
        sessions_per_week=3,
        days=(
            _d("Full routine", None,
               _e("Pull-up", 3, 5, 8, 90), _e("Bodyweight Squat", 3, 5, 8, 90),
               _e("Dip", 3, 5, 8, 90), _e("Glute Bridge", 3, 5, 8, 90),
               _e("Inverted Row", 3, 5, 8, 90), _e("Push-up", 3, 5, 8, 90),
               _e("Hollow Body Hold", 3, None, None, 60, duration=30),
               _e("Side Plank", 3, None, None, 60, duration=30),
               notes="Pair the exercises (pull-up + squat, dip + bridge, row + push-up), resting "
                     "90 s between sets of a pair."),
        ),
    ),
    # --------------------------------------------------------- intermediate
    ProgramTemplate(
        key="push-pull-legs",
        name="Push / Pull / Legs — 3 days",
        summary="A classic three-day split: pressing, pulling, then legs.",
        level="intermediate", focus="hypertrophy", equipment="full_gym", session_minutes=60,
        schedule="Mon / Wed / Fri",
        progression="Top of the rep range on every set, then add 2.5 kg (1 kg on raises and curls).",
        based_on=None,
        days=(
            _d("Push — Chest, Shoulders & Triceps", 0,
               _e("Barbell Bench Press", 4, 6, 8, 180), _e("Incline Dumbbell Press", 3, 8, 10),
               _e("Overhead Press", 3, 6, 8, 150), _e("Dumbbell Lateral Raise", 3, 12, 15, 60),
               _e("Triceps Pushdown", 3, 10, 12, 60)),
            _d("Pull — Back & Biceps", 2,
               _e("Deadlift", 3, 3, 5, 210), _e("Pull-up", 3, 6, 10, 150),
               _e("Barbell Row", 3, 8, 10), _e("Face Pull", 3, 12, 15, 60),
               _e("Barbell Curl", 3, 10, 12, 60)),
            _d("Legs", 4,
               _e("Barbell Squat", 4, 6, 8, 180), _e("Romanian Deadlift", 3, 8, 10, 150),
               _e("Leg Press", 3, 10, 12), _e("Leg Curl", 3, 12, 15, 60),
               _e("Standing Calf Raise", 4, 12, 15, 60)),
        ),
    ),
    ProgramTemplate(
        key="reddit-ppl",
        name="Push / Pull / Legs — 6 days",
        summary="Each muscle twice a week: a heavy compound first, then hypertrophy work.",
        level="intermediate", focus="hypertrophy", equipment="full_gym", session_minutes=75,
        schedule="Six days a week, one rest day (e.g. Mon–Sat)",
        progression="Linear on the first lift: add 2.5 kg each session (deadlift 5 kg), last set as many "
                    "reps as possible. Accessories: top of the range on every set, then add weight.",
        based_on="Reddit PPL (u/Metallicadpa)",
        days=(
            _d("Pull A — Deadlift", 0,
               _e("Deadlift", 1, 5, rest=210), _e("Lat Pulldown", 3, 8, 12), _e("Seated Cable Row", 3, 8, 12),
               _e("Face Pull", 5, 15, 20, 60), _e("Dumbbell Hammer Curl", 4, 8, 12, 60),
               _e("Dumbbell Curl", 4, 8, 12, 60)),
            _d("Push A — Bench", 1,
               _e("Barbell Bench Press", 5, 5, rest=180), _e("Overhead Press", 3, 8, 12),
               _e("Incline Dumbbell Press", 3, 8, 12), _e("Triceps Pushdown", 3, 8, 12, 60),
               _e("Overhead Triceps Extension", 3, 8, 12, 60), _e("Dumbbell Lateral Raise", 6, 15, 20, 45)),
            _d("Legs A", 2,
               _e("Barbell Squat", 3, 5, rest=180), _e("Romanian Deadlift", 3, 8, 12, 150),
               _e("Leg Press", 3, 8, 12), _e("Leg Curl", 3, 8, 12, 60), _e("Standing Calf Raise", 5, 8, 12, 60)),
            _d("Pull B — Row", 3,
               _e("Barbell Row", 5, 5, rest=180), _e("Lat Pulldown", 3, 8, 12), _e("Seated Cable Row", 3, 8, 12),
               _e("Face Pull", 5, 15, 20, 60), _e("Dumbbell Hammer Curl", 4, 8, 12, 60),
               _e("Dumbbell Curl", 4, 8, 12, 60)),
            _d("Push B — Overhead Press", 4,
               _e("Overhead Press", 5, 5, rest=180), _e("Barbell Bench Press", 3, 8, 12),
               _e("Incline Dumbbell Press", 3, 8, 12), _e("Triceps Pushdown", 3, 8, 12, 60),
               _e("Overhead Triceps Extension", 3, 8, 12, 60), _e("Dumbbell Lateral Raise", 6, 15, 20, 45)),
            _d("Legs B", 5,
               _e("Barbell Squat", 3, 5, rest=180), _e("Romanian Deadlift", 3, 8, 12, 150),
               _e("Leg Press", 3, 8, 12), _e("Leg Curl", 3, 8, 12, 60), _e("Standing Calf Raise", 5, 8, 12, 60)),
        ),
    ),
    ProgramTemplate(
        key="upper-lower-4",
        name="Upper / Lower — 4 days",
        summary="Each half of the body twice a week, alternating upper and lower.",
        level="intermediate", focus="general", equipment="full_gym", session_minutes=60,
        schedule="Mon / Tue / Thu / Fri",
        progression="Top of the rep range on every set, then add 2.5 kg.",
        based_on=None,
        days=(
            _d("Upper A", 0,
               _e("Barbell Bench Press", 4, 5, 8, 180), _e("Barbell Row", 4, 6, 10, 150),
               _e("Overhead Press", 3, 8, 10), _e("Barbell Curl", 3, 10, 12, 60),
               _e("Overhead Triceps Extension", 3, 10, 12, 60)),
            _d("Lower A", 1,
               _e("Barbell Squat", 4, 5, 8, 180), _e("Romanian Deadlift", 3, 8, 10, 150),
               _e("Leg Curl", 3, 10, 12, 60), _e("Standing Calf Raise", 3, 12, 15, 60)),
            _d("Upper B", 3,
               _e("Incline Barbell Bench Press", 4, 6, 10, 150), _e("Pull-up", 4, 6, 10, 150),
               _e("Dumbbell Lateral Raise", 3, 12, 15, 60), _e("Face Pull", 3, 12, 15, 60),
               _e("Close-Grip Bench Press", 3, 8, 10)),
            _d("Lower B", 4,
               _e("Deadlift", 3, 3, 5, 210), _e("Bulgarian Split Squat", 3, 8, 10),
               _e("Leg Press", 3, 10, 12), _e("Hanging Leg Raise", 3, 10, 15, 60)),
        ),
    ),
    ProgramTemplate(
        key="phul",
        name="PHUL — Power Hypertrophy Upper Lower",
        summary="Two heavy days for strength and two higher-rep days for size, split upper and lower.",
        level="intermediate", focus="hypertrophy", equipment="full_gym", session_minutes=75,
        schedule="Mon / Tue / Thu / Fri",
        progression="Power days: 3–5 reps, add weight when the top of the range is hit on every set. "
                    "Hypertrophy days: 8–12 reps, same rule.",
        based_on="PHUL (Brandon Campbell)",
        days=(
            _d("Upper Power", 0,
               _e("Barbell Bench Press", 4, 3, 5, 180), _e("Incline Dumbbell Press", 3, 6, 10),
               _e("Barbell Row", 4, 3, 5, 180), _e("Lat Pulldown", 3, 6, 10),
               _e("Overhead Press", 3, 5, 8, 150), _e("Barbell Curl", 3, 6, 10, 90),
               _e("Skull Crusher", 3, 6, 10, 90)),
            _d("Lower Power", 1,
               _e("Barbell Squat", 4, 3, 5, 210), _e("Deadlift", 3, 3, 5, 210),
               _e("Leg Press", 4, 10, 15), _e("Leg Curl", 4, 6, 10, 90),
               _e("Standing Calf Raise", 4, 6, 10, 60)),
            _d("Upper Hypertrophy", 3,
               _e("Incline Barbell Bench Press", 4, 8, 12), _e("Dumbbell Fly", 4, 8, 12, 90),
               _e("Seated Cable Row", 4, 8, 12), _e("Dumbbell Row", 4, 8, 12),
               _e("Dumbbell Lateral Raise", 4, 8, 12, 60), _e("Preacher Curl", 4, 8, 12, 60),
               _e("Triceps Pushdown", 4, 8, 12, 60)),
            _d("Lower Hypertrophy", 4,
               _e("Front Squat", 4, 8, 12, 150), _e("Bulgarian Split Squat", 4, 8, 12),
               _e("Leg Extension", 4, 10, 15, 60), _e("Leg Curl", 4, 10, 15, 60),
               _e("Seated Calf Raise", 4, 8, 12, 60), _e("Standing Calf Raise", 4, 8, 12, 60)),
        ),
    ),
    ProgramTemplate(
        key="texas-method",
        name="Texas Method",
        summary="Volume, recovery and intensity days — for when adding weight every session stops working.",
        level="intermediate", focus="strength", equipment="full_gym", session_minutes=75,
        schedule="Mon (volume) / Wed (recovery) / Fri (intensity)",
        progression="Weekly: set a new 5-rep best on Friday, and add 2.5 kg to Monday's volume work.",
        based_on="Texas Method (Glenn Pendlay, Mark Rippetoe)",
        days=(
            _d("Volume day", 0,
               _e("Barbell Squat", 5, 5, rest=180), _e("Barbell Bench Press", 5, 5, rest=180),
               _e("Deadlift", 1, 5, rest=180), notes="All sets at about 90% of Friday's 5-rep weight."),
            _d("Recovery day", 2,
               _e("Barbell Squat", 2, 5, rest=150), _e("Overhead Press", 3, 5, rest=150),
               _e("Chin-up", 3, 5, 8, 120), _e("Back Extension", 3, 10, 15, 90),
               notes="Squat at about 80% of Monday's weight. Light on purpose."),
            _d("Intensity day", 4,
               _e("Barbell Squat", 1, 5, rest=240), _e("Barbell Bench Press", 1, 5, rest=240),
               _e("Power Clean", 5, 3, rest=150), notes="One all-out set of five: a new best each week."),
        ),
    ),
    ProgramTemplate(
        key="bro-split-5",
        name="Body-Part Split — 5 days",
        summary="One muscle group a day, lots of volume for each. The classic bodybuilding week.",
        level="intermediate", focus="hypertrophy", equipment="full_gym", session_minutes=60,
        schedule="Mon–Fri, weekends off",
        progression="Top of the rep range on every set, then add weight.",
        based_on=None,
        days=(
            _d("Chest", 0,
               _e("Barbell Bench Press", 4, 6, 10, 150), _e("Incline Dumbbell Press", 3, 8, 12),
               _e("Dumbbell Fly", 3, 10, 15, 60), _e("Cable Fly", 3, 12, 15, 60), _e("Dip", 3, 8, 12, 90)),
            _d("Back", 1,
               _e("Deadlift", 3, 5, 8, 180), _e("Pull-up", 4, 6, 10, 120), _e("Barbell Row", 3, 8, 10),
               _e("Seated Cable Row", 3, 10, 12), _e("Barbell Shrug", 3, 10, 15, 60)),
            _d("Shoulders", 2,
               _e("Overhead Press", 4, 6, 10, 150), _e("Arnold Press", 3, 8, 12),
               _e("Dumbbell Lateral Raise", 4, 12, 15, 45), _e("Reverse Dumbbell Fly", 3, 12, 15, 45),
               _e("Face Pull", 3, 15, 20, 45)),
            _d("Legs", 3,
               _e("Barbell Squat", 4, 6, 10, 180), _e("Leg Press", 3, 10, 12),
               _e("Romanian Deadlift", 3, 8, 10, 150), _e("Leg Extension", 3, 12, 15, 60),
               _e("Leg Curl", 3, 12, 15, 60), _e("Standing Calf Raise", 4, 12, 15, 60)),
            _d("Arms", 4,
               _e("Close-Grip Bench Press", 3, 8, 10), _e("Barbell Curl", 3, 8, 12, 90),
               _e("Skull Crusher", 3, 10, 12, 90), _e("Preacher Curl", 3, 10, 12, 90),
               _e("Triceps Pushdown", 3, 12, 15, 60), _e("Dumbbell Hammer Curl", 3, 12, 15, 60)),
        ),
    ),
    # ------------------------------------------------------------- advanced
    ProgramTemplate(
        key="531-bbb",
        name="5/3/1 Boring But Big",
        summary="One main lift a day on a four-week percentage wave, then five sets of ten of it.",
        level="advanced", focus="strength", equipment="full_gym", session_minutes=75,
        schedule="Four days a week (e.g. Mon / Tue / Thu / Fri)",
        progression="Work from a training max of 90% of your one-rep max. Week 1: 65/75/85% × 5. "
                    "Week 2: 70/80/90% × 3. Week 3: 75/85/95% × 5/3/1. Week 4: deload. Then add 2.5 kg "
                    "to the upper-body training maxes and 5 kg to the lower.",
        based_on="5/3/1 Boring But Big (Jim Wendler)",
        days=(
            _d("Overhead Press day", 0,
               _e("Overhead Press", 3, 1, 5, 180), _e("Overhead Press", 5, 10, rest=90),
               _e("Chin-up", 5, 10, rest=90), notes="3 working sets on the 5/3/1 wave, then 5×10 at 50%."),
            _d("Deadlift day", 1,
               _e("Deadlift", 3, 1, 5, 210), _e("Deadlift", 5, 10, rest=120),
               _e("Hanging Leg Raise", 5, 15, rest=60), notes="3 working sets on the 5/3/1 wave, then 5×10 at 50%."),
            _d("Bench day", 3,
               _e("Barbell Bench Press", 3, 1, 5, 180), _e("Barbell Bench Press", 5, 10, rest=90),
               _e("Dumbbell Row", 5, 10, rest=90), notes="3 working sets on the 5/3/1 wave, then 5×10 at 50%."),
            _d("Squat day", 4,
               _e("Barbell Squat", 3, 1, 5, 210), _e("Barbell Squat", 5, 10, rest=120),
               _e("Leg Curl", 5, 10, rest=60), notes="3 working sets on the 5/3/1 wave, then 5×10 at 50%."),
        ),
    ),
    ProgramTemplate(
        key="arnold-split",
        name="Arnold Split",
        summary="Chest and back, shoulders and arms, then legs — each twice a week, at high volume.",
        level="advanced", focus="hypertrophy", equipment="full_gym", session_minutes=90,
        schedule="Six days a week (Mon–Sat)",
        progression="Top of the rep range on every set, then add weight. Expect long sessions.",
        based_on="Arnold Schwarzenegger's training split",
        days=(
            _d("Chest & Back A", 0,
               _e("Barbell Bench Press", 4, 6, 10, 150), _e("Incline Barbell Bench Press", 4, 8, 10),
               _e("Dumbbell Fly", 3, 10, 12, 60), _e("Pull-up", 4, 8, 10), _e("Barbell Row", 4, 8, 10),
               _e("Seated Cable Row", 3, 10, 12)),
            _d("Shoulders & Arms A", 1,
               _e("Overhead Press", 4, 6, 10, 150), _e("Dumbbell Lateral Raise", 4, 10, 15, 45),
               _e("Reverse Dumbbell Fly", 3, 12, 15, 45), _e("Barbell Curl", 4, 8, 10, 90),
               _e("Skull Crusher", 4, 8, 10, 90), _e("Dumbbell Curl", 3, 10, 12, 60)),
            _d("Legs A", 2,
               _e("Barbell Squat", 5, 6, 10, 180), _e("Leg Press", 4, 10, 12),
               _e("Leg Curl", 4, 10, 12, 60), _e("Leg Extension", 3, 12, 15, 60),
               _e("Standing Calf Raise", 5, 10, 15, 60)),
            _d("Chest & Back B", 3,
               _e("Incline Dumbbell Press", 4, 8, 10), _e("Dip", 3, 8, 12, 90), _e("Cable Fly", 3, 12, 15, 60),
               _e("Deadlift", 3, 5, 8, 180), _e("Lat Pulldown", 4, 8, 12), _e("Dumbbell Row", 3, 10, 12)),
            _d("Shoulders & Arms B", 4,
               _e("Arnold Press", 4, 8, 10), _e("Push Press", 3, 5, 8, 150), _e("Face Pull", 3, 15, 20, 45),
               _e("Preacher Curl", 4, 8, 12, 60), _e("Close-Grip Bench Press", 4, 8, 10),
               _e("Dumbbell Hammer Curl", 3, 10, 12, 60)),
            _d("Legs B", 5,
               _e("Front Squat", 4, 6, 10, 180), _e("Romanian Deadlift", 4, 8, 10, 150),
               _e("Bulgarian Split Squat", 3, 8, 12), _e("Seated Calf Raise", 5, 12, 15, 60),
               _e("Cable Crunch", 3, 12, 15, 60)),
        ),
    ),
)

BY_KEY: dict[str, ProgramTemplate] = {t.key: t for t in TEMPLATES}
