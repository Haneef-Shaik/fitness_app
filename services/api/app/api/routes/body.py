"""Body metrics and `/analytics/body` (G9).

**Q5 is answered and enforced on the read**: the first weigh-in of a day is
canonical. There is no unique constraint stopping a second one, because a second
one really happened — refusing it would be lying about what the user did. The
series simply takes the earliest *measured* entry per day.

**I6** — kilograms and centimetres in storage. A caller may send pounds; what is
stored, charted and returned is canonical.
"""
from __future__ import annotations

import uuid
from collections import OrderedDict
from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, Header, Query
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.errors import Forbidden, NotFound, ValidationFailed
from app.domain.dates import to_local_date
from app.domain.units import in_to_cm, lb_to_kg
from app.models import BodyMetric, ProgressPhoto, UserProfile
from app.schemas.body import (
    BodyMetricIn,
    BodyMetricOut,
    BodyPointOut,
    BodySeriesOut,
    ProgressPhotoIn,
    ProgressPhotoOut,
)
from app.schemas.envelope import Envelope
from app.services import summaries
from app.storage.provider import get_store

router = APIRouter(tags=["body"])

#: A week is the shortest window over which a weight trend means anything.
MOVING_AVERAGE_DAYS = 7

#: Which canonical unit each kind of measurement is stored in.
CANONICAL_UNIT = {"body_weight": "kg", "waist_cm": "cm", "body_fat_pct": "%"}


def _to_canonical(value: float, unit: str) -> tuple[float, str]:
    """Convert on the way IN, once, so nothing downstream has to ask."""
    if unit == "lb":
        return lb_to_kg(value), "kg"
    if unit == "in":
        return in_to_cm(value), "cm"
    return value, unit


async def _timezone_of(db: DbSession, user_id: uuid.UUID) -> str:
    tz = await db.scalar(select(UserProfile.timezone).where(UserProfile.user_id == user_id))
    return tz or "UTC"


def _out(row: BodyMetric) -> dict:
    return BodyMetricOut(
        id=row.id, metric_key=row.metric_key, value=float(row.value), unit=row.unit,
        measured_at=row.measured_at, local_date=row.local_date, notes=row.notes,
    ).model_dump(mode="json")


@router.post("/body-metrics", status_code=201, response_model=Envelope[BodyMetricOut])
async def create_body_metric(
    body: BodyMetricIn,
    user: CurrentUser,
    db: DbSession,
    idempotency_key: Annotated[uuid.UUID | None, Header(alias="Idempotency-Key")] = None,
):
    """Records a measurement. Idempotent on `client_id` (**I8**).

    Stepping on a scale happens in a bathroom, which is where the signal is
    worst — so this rides the same outbox a set does, and a replayed write must
    not produce two weigh-ins.
    """
    if body.client_id is not None:
        existing = await db.scalar(
            select(BodyMetric).where(
                BodyMetric.user_id == user.id, BodyMetric.client_id == body.client_id
            )
        )
        if existing is not None:
            return ok(_out(existing), status_code=201)

    tz = await _timezone_of(db, user.id)
    measured_at = body.measured_at or datetime.now(UTC)
    if measured_at.tzinfo is None:
        measured_at = measured_at.replace(tzinfo=UTC)

    value, unit = _to_canonical(body.value, body.unit)
    local_date = to_local_date(measured_at, tz)

    row = BodyMetric(
        user_id=user.id, metric_key=body.metric_key, value=value, unit=unit,
        measured_at=measured_at, local_date=local_date, logged_timezone=tz,
        notes=body.notes, client_id=body.client_id,
    )
    db.add(row)
    # This may be the day's canonical weigh-in, so the day's summary is stale.
    await summaries.invalidate(db, user.id, local_date)
    await db.flush()
    return ok(_out(row), status_code=201)


@router.get("/body-metrics", response_model=Envelope[list[BodyMetricOut]])
async def list_body_metrics(
    user: CurrentUser,
    db: DbSession,
    metric_key: Annotated[str, Query()] = "body_weight",
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
):
    """**Every** entry, including the ones that are not canonical.

    I-01 shows a user what they actually logged. The chart shows one point per
    day; this shows the list.
    """
    stmt = select(BodyMetric).where(
        BodyMetric.user_id == user.id, BodyMetric.metric_key == metric_key
    )
    if date_from is not None:
        stmt = stmt.where(BodyMetric.local_date >= date_from)
    if date_to is not None:
        stmt = stmt.where(BodyMetric.local_date <= date_to)

    rows = (await db.scalars(stmt.order_by(BodyMetric.measured_at.desc()).limit(500))).all()
    return ok([_out(r) for r in rows])


@router.delete("/body-metrics/{metric_id}", response_model=Envelope[BodyMetricOut])
async def delete_body_metric(metric_id: uuid.UUID, user: CurrentUser, db: DbSession):
    row = await db.scalar(
        select(BodyMetric).where(BodyMetric.id == metric_id, BodyMetric.user_id == user.id)
    )
    if row is None:
        raise NotFound("That measurement no longer exists.")
    out = _out(row)
    # Removing the first entry of a day promotes the second to canonical.
    await summaries.invalidate(db, user.id, row.local_date)
    await db.delete(row)
    await db.flush()
    return ok(out)


@router.get("/analytics/body", response_model=Envelope[BodySeriesOut])
async def body_series(
    user: CurrentUser,
    db: DbSession,
    metric_key: Annotated[str, Query()] = "body_weight",
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
):
    """One point per day, plus a trailing average and the change across the range."""
    stmt = select(BodyMetric).where(
        BodyMetric.user_id == user.id, BodyMetric.metric_key == metric_key
    )
    if date_from is not None:
        stmt = stmt.where(BodyMetric.local_date >= date_from)
    if date_to is not None:
        stmt = stmt.where(BodyMetric.local_date <= date_to)

    rows = (await db.scalars(
        stmt.order_by(BodyMetric.local_date, BodyMetric.measured_at)
    )).all()

    # Q5 — first MEASURED entry of each day wins. Ordered by `measured_at`
    # above, so the first row seen for a date is the canonical one, whatever
    # order it was written in.
    canonical: OrderedDict[date, float] = OrderedDict()
    for row in rows:
        canonical.setdefault(row.local_date, float(row.value))

    values = list(canonical.values())
    points = [
        BodyPointOut(
            local_date=day, value=value,
            moving_average=_trailing_mean(values, index),
        )
        for index, (day, value) in enumerate(canonical.items())
    ]

    return ok(BodySeriesOut(
        metric_key=metric_key,
        unit=CANONICAL_UNIT.get(metric_key, "kg"),
        points=points,
        # None, never 0: a range with nothing in it has no change (I13).
        change=(values[-1] - values[0]) if len(values) >= 2 else None,
        latest=points[-1] if points else None,
    ).model_dump(mode="json"))


def _trailing_mean(values: list[float], index: int) -> float:
    window = values[max(0, index - MOVING_AVERAGE_DAYS + 1): index + 1]
    return sum(window) / len(window)


# ------------------------------------------------------- I-05 · photographs

def _photo_out(row: ProgressPhoto) -> dict:
    return ProgressPhotoOut(
        id=row.id, image_key=row.image_key, taken_at=row.taken_at,
        local_date=row.local_date, pose=row.pose, notes=row.notes,
    ).model_dump(mode="json")


@router.post("/progress-photos", status_code=201, response_model=Envelope[ProgressPhotoOut])
async def create_progress_photo(
    body: ProgressPhotoIn,
    user: CurrentUser,
    db: DbSession,
    idempotency_key: Annotated[uuid.UUID | None, Header(alias="Idempotency-Key")] = None,
):
    """Files an already-uploaded photograph.

    The image went through G8's signed upload, which stripped its EXIF on
    arrival. That matters more here than anywhere else in the app: a progress
    photo is taken in somebody's bathroom, and the coordinates of their home
    are in the file unless something removes them.
    """
    if body.client_id is not None:
        existing = await db.scalar(
            select(ProgressPhoto).where(
                ProgressPhoto.user_id == user.id, ProgressPhoto.client_id == body.client_id
            )
        )
        if existing is not None:
            return ok(_photo_out(existing), status_code=201)

    if not body.image_key.startswith(f"uploads/{user.id}/"):
        raise Forbidden("That image is not yours.")
    if not await get_store().exists(body.image_key):
        raise ValidationFailed("That image was never uploaded.",
                               fields={"image_key": body.image_key})

    tz = await _timezone_of(db, user.id)
    taken_at = body.taken_at or datetime.now(UTC)
    if taken_at.tzinfo is None:
        taken_at = taken_at.replace(tzinfo=UTC)

    row = ProgressPhoto(
        user_id=user.id, image_key=body.image_key, taken_at=taken_at,
        local_date=to_local_date(taken_at, tz), pose=body.pose,
        notes=body.notes, client_id=body.client_id,
    )
    db.add(row)
    await db.flush()
    return ok(_photo_out(row), status_code=201)


@router.get("/progress-photos", response_model=Envelope[list[ProgressPhotoOut]])
async def list_progress_photos(user: CurrentUser, db: DbSession):
    rows = (await db.scalars(
        select(ProgressPhoto)
        .where(ProgressPhoto.user_id == user.id)
        .order_by(ProgressPhoto.taken_at.desc())
        .limit(200)
    )).all()
    return ok([_photo_out(r) for r in rows])


@router.delete("/progress-photos/{photo_id}", response_model=Envelope[ProgressPhotoOut])
async def delete_progress_photo(photo_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Deletes the row **and the file**.

    Unlike an AI analysis there is nothing to audit here: it is the user's own
    picture of their own body, and when they take it back it goes.
    """
    row = await db.scalar(
        select(ProgressPhoto).where(
            ProgressPhoto.id == photo_id, ProgressPhoto.user_id == user.id
        )
    )
    if row is None:
        raise NotFound("That photo no longer exists.")

    out = _photo_out(row)
    await get_store().delete(row.image_key)
    await db.delete(row)
    await db.flush()
    return ok(out)
