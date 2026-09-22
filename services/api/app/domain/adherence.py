"""Adherence — **PRD W07.7**: `completed planned sessions ÷ planned sessions`.

Written here rather than in a route because G6's contract is explicit that a
number without a definition gets one in the domain module with a vector, not an
expression invented at the call site. `contracts/vectors/domain.json` pins it,
and `packages/domain/src/training/adherence.ts` is the other implementation.

Two judgements the ratio alone does not make, both of which matter on screen:

**No plan is undefined, never zero.** A user with no program has not failed to
adhere to anything. G-06 shows "no plan yet", not "0%".

**Trained more than planned is 1.0, not 1.25.** Adherence is "did you do what
you said you would", and an extra session is not partial credit towards a
different question. Uncapped, a keen week reads as >100% and the meter overruns.
"""
from __future__ import annotations

from datetime import date, timedelta


def adherence(completed_planned: int, planned: int) -> float | None:
    """`None` when nothing was planned — undefined, not zero."""
    if planned <= 0:
        return None
    return min(1.0, completed_planned / planned)


def planned_occurrences(weekdays: list[int], start: date, end: date) -> int:
    """How many times the scheduled weekdays fall in `[start, end]`, inclusive.

    `weekdays` uses the same convention as the plan tree: 0 = Sunday.

    Counted by walking the range rather than with arithmetic on week counts,
    because the arithmetic version is where the off-by-one lives: a range that
    starts and ends on the same scheduled day must count 1, and a reversed range
    must count 0 rather than something negative.
    """
    if not weekdays or end < start:
        return 0

    wanted = set(weekdays)
    count = 0
    day = start
    while day <= end:
        # Python: Monday == 0. The plan tree: Sunday == 0.
        if ((day.weekday() + 1) % 7) in wanted:
            count += 1
        day += timedelta(days=1)
    return count
