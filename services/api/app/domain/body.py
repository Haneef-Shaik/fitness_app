"""Goal progress and the training streak (G9).

Both are numbers a user reads off a meter and draws a conclusion from, so both
are defined once per language and pinned by `contracts/vectors/domain.json`.
The TypeScript twin is `packages/domain/src/body/progress.ts`; if the two ever
disagree, a goal's progress would change after a sync, which is exactly the
class of bug the shared vectors exist to make unshippable.
"""
from __future__ import annotations

from datetime import date, timedelta

#: A "hold" goal has a zero-width target, so it needs a band rather than a
#: ratio. One percent of the target is roughly what a bathroom scale moves on
#: its own between two mornings.
HOLD_TOLERANCE = 0.01


def goal_progress(
    *, start: float | None, target: float, current: float | None, direction: str
) -> float | None:
    """How far along a goal is, from start to target.

    `None` when it cannot be known — no starting point, or nothing measured
    yet. **None is not zero**: "we have not weighed you" and "you have made no
    progress" are different statements, and a meter drawn at 0% makes the first
    read as the second.

    Overshoot caps at 1, because more than finished is still finished. Going the
    wrong way is **not** clamped: it returns a negative number and the UI shows
    it. Hiding a regression behind a 0% meter is how somebody finds out in three
    months.
    """
    if start is None or current is None:
        return None

    if direction == "hold":
        band = abs(target) * HOLD_TOLERANCE
        return 1.0 if abs(current - target) <= band else 0.0

    distance = target - start
    if distance == 0:
        return 1.0 if current == target else 0.0

    return min(1.0, (current - start) / distance)


def training_streak(today: date, days: list[date] | set[date]) -> int:
    """Consecutive days ending today — or yesterday.

    Yesterday counts because today is not over. A streak that resets at midnight
    punishes somebody for not having trained yet at 09:00, which is the opposite
    of what a streak is for.

    The dates are already in the profile's timezone. Nothing here parses a
    timestamp, because nothing here should be deciding which day anything
    happened on (**I7**).
    """
    trained = set(days)
    if not trained:
        return 0

    # A session dated ahead of the profile's "today" is a timezone edge, not a
    # reason to drop it: start from the latest day actually trained.
    latest = max(trained)
    cursor = max(today, latest)

    if cursor not in trained:
        cursor -= timedelta(days=1)
        if cursor not in trained:
            return 0

    streak = 0
    while cursor in trained:
        streak += 1
        cursor -= timedelta(days=1)
    return streak
