"""Rate-limit counters (launch) — one row per bucket per fixed window.

In Postgres rather than in process memory because the API runs as several
instances behind a load balancer, and a counter each instance keeps for itself
is a limit multiplied by however many instances happen to be running. The
database is the one thing they already share, and an `INSERT … ON CONFLICT DO
UPDATE … RETURNING` is an atomic increment across all of them.

**Owned by no user**, deliberately: there is no `user_id` and no foreign key.
A bucket is an address or a keyed hash of an account, and counting an account
that does not exist yet (a sign-up, a login attempt at a guessed email) is the
whole point. Rows expire with their window and are swept by the limiter.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class RateLimitCounter(Base):
    __tablename__ = "rate_limit_counters"

    #: `<policy>:ip:<address or /64>` or `<policy>:account:<hmac>`.
    bucket: Mapped[str] = mapped_column(String(160), primary_key=True)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    count: Mapped[int] = mapped_column(Integer, nullable=False)
    #: The end of the window. Indexed because the sweep deletes by it.
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
