"""The global exercise library — plain data, seeded by `app.seed.catalog`.

**The first block is history.** Those entries existed before this file did, and
users' sessions, plans and PRs point at the rows they created. Their names,
equipment, muscles and tracked fields must never change here: the seed only
ever *adds* rows, and on an existing row it only fills what is missing
(instructions, extra aliases). Renaming "Barbell Squat" in this file would not
rename anybody's row — it would add a second exercise beside it.

**Muscles are the analytics.** Primary counts 1.0 and secondary 0.5 toward
weekly volume (decision D7), so a muscle is listed as secondary only when it
does real work, not whenever it is merely awake.

**`tracks` decides the logger** (W04.7/W04.8): which fields a set asks for,
and therefore which PR types exist. A space-separated subset of
`load reps duration distance`; at least one of reps/duration/distance.

**Instructions** are 2–4 plain sentences: set up, the movement, one cue that
prevents the most common mistake. They are written for someone who has seen
the exercise once, not as a coaching manual.
"""
from __future__ import annotations

from app.seed.exercise_library import (
    band,
    barbell,
    bodyweight,
    cable,
    cardio,
    dumbbell,
    history,
    kettlebell,
    machine,
    other,
)
from app.seed.exercise_library.model import TRACKABLE, ExerciseSeed

__all__ = ["LIBRARY", "TRACKABLE", "ExerciseSeed"]

#: Every global exercise, history first. The order is the seed order and
#: nothing else — no id depends on it.
LIBRARY: tuple[ExerciseSeed, ...] = (
    *history.EXERCISES,
    *barbell.EXERCISES,
    *dumbbell.EXERCISES,
    *machine.EXERCISES,
    *cable.EXERCISES,
    *bodyweight.EXERCISES,
    *kettlebell.EXERCISES,
    *band.EXERCISES,
    *cardio.EXERCISES,
    *other.EXERCISES,
)
