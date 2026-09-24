"""Which starter program fits this person — onboarding's A-09 and the library.

Pure: takes the templates and what the user told onboarding, returns every
template in a recommended order with the reasons in words. Nothing is hidden —
a program that needs equipment the user lacks is listed after the ones that
fit, marked as not fitting, so the user can still choose it knowingly.

Equipment is the only hard constraint. Experience, days a week, the goal and
session length are preferences, weighted so that the level of a program
matters most: a beginner is never steered to an advanced program first.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.seed.program_templates import ProgramTemplate

LEVELS = ("beginner", "intermediate", "advanced")

#: What each setup can run. A home gym has a rack, a barbell and dumbbells, but
#: not the cables and machines the full-gym programs use.
_EQUIPMENT_RANK = {"bodyweight": 0, "dumbbells": 1, "home_gym": 2, "full_gym": 3}

_EQUIPMENT_WORDS = {
    "bodyweight": "no equipment", "dumbbells": "only dumbbells",
    "home_gym": "a home gym", "full_gym": "a full gym",
}

#: How well a program's focus serves a goal.
_FOCUS_FIT = {
    "strength": {"strength": 3, "general": 1},
    "muscle_gain": {"hypertrophy": 3, "general": 1},
    # Lifting heavy keeps muscle in a deficit: strength work serves fat loss too.
    "fat_loss": {"general": 2, "hypertrophy": 1, "strength": 1},
    "maintenance": {"general": 2, "hypertrophy": 1},
    "custom": {"general": 1},
}

_FOCUS_WORDS = {"strength": "Strength-focused", "hypertrophy": "Built for muscle", "general": "All-round"}


@dataclass(frozen=True)
class TrainingProfile:
    experience: str | None = None
    days_per_week: int | None = None
    equipment: str | None = None
    session_minutes: int | None = None
    goal: str | None = None


@dataclass(frozen=True)
class Ranked:
    template: ProgramTemplate
    fits: bool
    score: int
    reasons: tuple[str, ...]


def _level_score(template_level: str, experience: str | None) -> tuple[int, str | None]:
    if experience is None:
        return 0, None
    diff = LEVELS.index(template_level) - LEVELS.index(experience)
    if diff == 0:
        return 4, f"Right for {experience}s"
    if diff < 0:
        return (1 if diff == -1 else -1), None
    return (-4 if diff == 1 else -8), f"Written for {template_level} lifters"


def _days_score(per_week: int, days: int | None) -> tuple[int, str | None]:
    if days is None:
        return 0, None
    gap = abs(per_week - days)
    if gap == 0:
        return 4, f"Matches your {days} days a week"
    return (1, None) if gap == 1 else (-3, None)


def _fits(template: ProgramTemplate, equipment: str | None) -> bool:
    if equipment is None:
        return True
    return _EQUIPMENT_RANK[template.equipment] <= _EQUIPMENT_RANK[equipment]


def _equipment_use(template: ProgramTemplate, equipment: str | None) -> int:
    """A program that fits but leaves most of the kit unused is a worse pick:
    someone with a full gym was being offered the bodyweight routine."""
    if equipment is None or not _fits(template, equipment):
        return 0
    unused = _EQUIPMENT_RANK[equipment] - _EQUIPMENT_RANK[template.equipment]
    return 2 if unused == 0 else 0 if unused == 1 else -2


def score(template: ProgramTemplate, p: TrainingProfile) -> Ranked:
    reasons: list[str] = []
    total = 0

    s, why = _level_score(template.level, p.experience)
    total += s
    if why and s > 0:
        reasons.append(why)

    s, why = _days_score(template.per_week, p.days_per_week)
    total += s
    if why:
        reasons.append(why)

    if p.goal is not None:
        s = _FOCUS_FIT.get(p.goal, {}).get(template.focus, 0)
        total += s
        if s >= 2:
            reasons.append(f"{_FOCUS_WORDS[template.focus]}, like your goal")

    if p.session_minutes is not None:
        if template.session_minutes <= p.session_minutes:
            total += 1
            reasons.append(f"Fits in {p.session_minutes} minutes")
        elif template.session_minutes > p.session_minutes + 15:
            total -= 2

    total += _equipment_use(template, p.equipment)

    fits = _fits(template, p.equipment)
    if not fits:
        reasons = [f"Needs {_EQUIPMENT_WORDS[template.equipment]}"]
    else:
        # A warning, not a reason: this one asks for more than they said they have.
        _, too_hard = _level_score(template.level, p.experience)
        if too_hard and not too_hard.startswith("Right"):
            reasons.append(too_hard)
    return Ranked(template, fits, total, tuple(reasons))


def rank_templates(templates: tuple[ProgramTemplate, ...] | list[ProgramTemplate],
                   profile: TrainingProfile) -> list[Ranked]:
    """Every template, best first: fitting before not, then by score, then the
    easier program, then the library's own order — so the result is stable."""
    order = {t.key: i for i, t in enumerate(templates)}
    ranked = [score(t, profile) for t in templates]
    return sorted(ranked, key=lambda r: (
        not r.fits, -r.score, LEVELS.index(r.template.level), order[r.template.key],
    ))
