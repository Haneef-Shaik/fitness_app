"""Every instant is stored UTC; every day-bucket uses the profile timezone (BRD §7)."""
from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo


def to_local_date(instant: datetime | str, time_zone: str) -> date:
    """The only way to derive a calendar date. Handles DST correctly via zoneinfo."""
    if isinstance(instant, str):
        instant = datetime.fromisoformat(instant)
    return instant.astimezone(ZoneInfo(time_zone)).date()
