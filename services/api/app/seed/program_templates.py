"""Starter programs — the C-01 / C-04 templates.

Plain data, like the food catalog: a template is not a row anyone owns, and it
is never edited in place. Starting one deep-copies it into the user's own
programs (`POST /v1/program-templates/{key}/start`).

Every exercise is named by its catalog name, which is unique among global
exercises; `test_program_templates.py` fails if a name is missing from the
catalog, so a typo here cannot reach a user as a broken program.

Prescriptions are conventional starting points — sets and a rep range, no load,
because the right load is the user's and the logger's previous-performance
strip will carry it from the first session on.
"""
from __future__ import annotations

from dataclasses import dataclass


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
    weekday: int | None                      # 0 = Mon … 6 = Sun
    exercises: tuple[TemplateExercise, ...]


@dataclass(frozen=True)
class ProgramTemplate:
    key: str
    name: str
    summary: str
    level: str
    days: tuple[TemplateDay, ...]


def _e(name: str, sets: int, lo: int | None, hi: int | None, rest: int = 120,
       duration: int | None = None) -> TemplateExercise:
    return TemplateExercise(name, sets, lo, hi, rest, duration)


TEMPLATES: tuple[ProgramTemplate, ...] = (
    ProgramTemplate(
        key="full-body-3",
        name="Full Body — 3 days",
        summary="Three whole-body sessions a week. The simplest place to start.",
        level="Beginner",
        days=(
            TemplateDay("Full Body A", 0, (
                _e("Barbell Squat", 3, 5, 8, 180),
                _e("Barbell Bench Press", 3, 5, 8, 180),
                _e("Barbell Row", 3, 8, 10),
                _e("Plank", 3, None, None, 60, duration=45),
            )),
            TemplateDay("Full Body B", 2, (
                _e("Romanian Deadlift", 3, 6, 10, 180),
                _e("Overhead Press", 3, 5, 8, 150),
                _e("Lat Pulldown", 3, 8, 12),
                _e("Dumbbell Hammer Curl", 2, 10, 12, 90),
            )),
            TemplateDay("Full Body C", 4, (
                _e("Leg Press", 3, 8, 12),
                _e("Dumbbell Bench Press", 3, 8, 12),
                _e("Seated Cable Row", 3, 10, 12),
                _e("Hanging Leg Raise", 3, 8, 12, 60),
            )),
        ),
    ),
    ProgramTemplate(
        key="push-pull-legs",
        name="Push / Pull / Legs",
        summary="A classic three-day split: pressing, pulling, then legs.",
        level="Intermediate",
        days=(
            TemplateDay("Push — Chest, Shoulders & Triceps", 0, (
                _e("Barbell Bench Press", 4, 6, 8, 180),
                _e("Incline Dumbbell Press", 3, 8, 10),
                _e("Overhead Press", 3, 6, 8, 150),
                _e("Dumbbell Lateral Raise", 3, 12, 15, 60),
                _e("Triceps Pushdown", 3, 10, 12, 60),
            )),
            TemplateDay("Pull — Back & Biceps", 2, (
                _e("Deadlift", 3, 3, 5, 210),
                _e("Pull-up", 3, 6, 10, 150),
                _e("Barbell Row", 3, 8, 10),
                _e("Face Pull", 3, 12, 15, 60),
                _e("Barbell Curl", 3, 10, 12, 60),
            )),
            TemplateDay("Legs", 4, (
                _e("Barbell Squat", 4, 6, 8, 180),
                _e("Romanian Deadlift", 3, 8, 10, 150),
                _e("Leg Press", 3, 10, 12),
                _e("Leg Curl", 3, 12, 15, 60),
                _e("Standing Calf Raise", 4, 12, 15, 60),
            )),
        ),
    ),
    ProgramTemplate(
        key="upper-lower-4",
        name="Upper / Lower — 4 days",
        summary="Each half of the body twice a week, alternating upper and lower.",
        level="Intermediate",
        days=(
            TemplateDay("Upper A", 0, (
                _e("Barbell Bench Press", 4, 5, 8, 180),
                _e("Barbell Row", 4, 6, 10, 150),
                _e("Overhead Press", 3, 8, 10),
                _e("Barbell Curl", 3, 10, 12, 60),
                _e("Overhead Triceps Extension", 3, 10, 12, 60),
            )),
            TemplateDay("Lower A", 1, (
                _e("Barbell Squat", 4, 5, 8, 180),
                _e("Romanian Deadlift", 3, 8, 10, 150),
                _e("Leg Curl", 3, 10, 12, 60),
                _e("Standing Calf Raise", 3, 12, 15, 60),
            )),
            TemplateDay("Upper B", 3, (
                _e("Incline Barbell Bench Press", 4, 6, 10, 150),
                _e("Pull-up", 4, 6, 10, 150),
                _e("Dumbbell Lateral Raise", 3, 12, 15, 60),
                _e("Face Pull", 3, 12, 15, 60),
                _e("Close-Grip Bench Press", 3, 8, 10),
            )),
            TemplateDay("Lower B", 4, (
                _e("Deadlift", 3, 3, 5, 210),
                _e("Bulgarian Split Squat", 3, 8, 10),
                _e("Leg Press", 3, 10, 12),
                _e("Hanging Leg Raise", 3, 10, 15, 60),
            )),
        ),
    ),
)

BY_KEY: dict[str, ProgramTemplate] = {t.key: t for t in TEMPLATES}
