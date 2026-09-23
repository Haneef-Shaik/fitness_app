"""Body metrics and the daily summary cache (G9).

**Q5 is answered: the first weigh-in of a day is canonical.** There is
deliberately **no unique constraint** on `(user_id, metric_key, local_date)` —
later entries that day are real measurements and refusing them would be lying
about what happened. The *read* picks the earliest by `measured_at`, so a
second weigh-in is recorded and is not canonical. Weight drifts a kilogram
across a day on water alone, and a chart built from "whenever somebody happened
to step on the scales" measures hydration, not progress.

`daily_summaries` is a **cache, never a source of truth** ([02 §4.4]). Every
figure in it must be reproducible from base tables, and a disagreement resolves
in favour of the base tables. It is **invalidated on write and recomputed on
read** — never updated in place, because an update means two pieces of code
computing the same number and only one of them being right.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.user import TimestampMixin


class BodyMetric(Base, TimestampMixin):
    __tablename__ = "body_metrics"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    #: `body_weight`, `waist_cm`, … The same key a `FitnessGoal` tracks, which
    #: is what lets a goal find its own current value without a second mapping.
    metric_key: Mapped[str] = mapped_column(String(40), default="body_weight", nullable=False)

    #: **I6 — canonical units in storage.** Kilograms and centimetres, always.
    #: Pounds and inches are converted on the way in and on the way out.
    value: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(16), default="kg", nullable=False)

    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    #: Resolved once, on write, from the profile's timezone (**I7**).
    local_date: Mapped[date] = mapped_column(Date, nullable=False)
    logged_timezone: Mapped[str] = mapped_column(String(64), nullable=False)

    notes: Mapped[str | None] = mapped_column(String(500))

    #: I8 — a weigh-in the outbox replayed is one weigh-in.
    client_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))

    __table_args__ = (
        # Ordered by `measured_at` because the canonical entry is the EARLIEST
        # measured, not the earliest written — somebody weighs themselves at
        # 07:30, forgets, and logs it after dinner.
        Index("ix_body_metrics_series", "user_id", "metric_key", "local_date", "measured_at"),
        UniqueConstraint("user_id", "client_id", name="uq_body_metric_client_id"),
    )


class DailySummary(Base):
    """One user, one local date, three domains — cached.

    No `TimestampMixin`: `computed_at` is the only time that means anything
    here, and an `updated_at` would imply the row is edited. It is not: it is
    deleted and rebuilt.
    """

    __tablename__ = "daily_summaries"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    local_date: Mapped[date] = mapped_column(Date, primary_key=True)

    # ---- training -------------------------------------------------------
    session_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    volume_kg: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)

    # ---- nutrition (confirmed only — I2 / D5) ---------------------------
    calories: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    protein_g: Mapped[float] = mapped_column(Numeric(9, 2), default=0, nullable=False)
    carbs_g: Mapped[float] = mapped_column(Numeric(9, 2), default=0, nullable=False)
    fat_g: Mapped[float] = mapped_column(Numeric(9, 2), default=0, nullable=False)
    meals_logged: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    #: Visible, and in no total. Carried so the dashboard can say so (**I12**).
    pending_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    #: A counted item was missing a macro, so the total is a floor.
    incomplete: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ---- body -----------------------------------------------------------
    #: The day's canonical weigh-in (Q5), or NULL if there was not one.
    body_weight_kg: Mapped[float | None] = mapped_column(Numeric(8, 2))

    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (Index("ix_daily_summaries_user", "user_id", "local_date"),)


class ProgressPhoto(Base, TimestampMixin):
    """A progress photograph (I-05).

    The image itself lives in the object store G8 built, behind the same signed
    upload and the same server-side EXIF strip — a photo taken in someone's
    bathroom carries the coordinates of their home, and this is the most
    personal thing the app stores.

    The row holds the key and the day; deleting the row deletes the photograph.
    Unlike an analysis, there is nothing to audit here: it is the user's own
    picture and they may take it back.
    """

    __tablename__ = "progress_photos"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    image_key: Mapped[str] = mapped_column(String(400), nullable=False)
    taken_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    local_date: Mapped[date] = mapped_column(Date, nullable=False)
    #: front | side | back — so I-05 can compare like with like.
    pose: Mapped[str] = mapped_column(String(20), default="front", nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500))
    client_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))

    __table_args__ = (
        Index("ix_progress_photos_user", "user_id", "local_date"),
        UniqueConstraint("user_id", "client_id", name="uq_progress_photo_client_id"),
    )
