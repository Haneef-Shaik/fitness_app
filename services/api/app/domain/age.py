"""Who may hold an account (A-07, Q9).

Q9 was decided by the owner on 25 Sep 2026: **16 and over**. The app keeps body
weight, measurements and progress photos, and 16 is the highest age of digital
consent in the EU, so no country's users need a parental-consent flow Volt does
not have. The client stops a younger person at onboarding; this is the rule the
server holds everyone to, whatever the client does.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

MIN_AGE_YEARS = 16


def age_on(birth: date, today: date) -> int:
    """Whole years, the way a birthday counts them."""
    return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))


def today_anywhere() -> date:
    """The latest calendar date on Earth right now (UTC+14).

    Judged against this, nobody who has turned 16 where they live is refused
    because the server's clock is a day behind theirs.
    """
    return (datetime.now(UTC) + timedelta(hours=14)).date()
