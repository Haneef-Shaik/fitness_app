"""AI food analysis (G8) — submit, poll, review, confirm.

**Nothing here calls a model.** Submitting creates a row and returns 202; the
worker does the rest in a separate process. A synchronous model call in a
request handler is fast in testing and takes the API down on a bad day, and it
is how **I14** — no AI failure touches training — stops being true.

**Confirming writes `meal_items` and touches the analysis exactly once**, to
record which meal it became. The model's output is append-only at the database
level, so AC-10's "byte-identical afterwards" is a property of the schema rather
than of anyone remembering.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, time, timedelta
from typing import Annotated

from fastapi import APIRouter, Header
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.api.routes.nutrition import meal_out
from app.config import get_settings
from app.core.errors import Conflict, NotFound, QuotaExceeded, ValidationFailed
from app.domain.dates import to_local_date
from app.food.categories import assert_category
from app.food.snapshot import num, snapshot_from_food
from app.models import (
    AnalysisInputType,
    AnalysisStatus,
    Food,
    FoodAnalysis,
    FoodAnalysisItem,
    ItemSource,
    Meal,
    MealItem,
    UserProfile,
)
from app.schemas.analysis import (
    AnalysisItemOut,
    AnalysisOut,
    ConfirmIn,
    ImageAnalysisIn,
    QuotaOut,
    TextAnalysisIn,
)
from app.schemas.envelope import Envelope
from app.schemas.nutrition import MealOut
from app.storage.provider import get_store

router = APIRouter(tags=["ai-nutrition"])


# ------------------------------------------------------------ presentation

def _item_out(item: FoodAnalysisItem, food_names: dict[uuid.UUID, str]) -> AnalysisItemOut:
    return AnalysisItemOut(
        id=item.id,
        detected_name=item.detected_name,
        estimated_quantity=num(item.estimated_quantity),
        estimated_unit=item.estimated_unit,
        confidence=num(item.confidence),
        proposed_calories=num(item.proposed_calories),
        proposed_protein_g=num(item.proposed_protein_g),
        proposed_carbs_g=num(item.proposed_carbs_g),
        proposed_fat_g=num(item.proposed_fat_g),
        resolved_food_id=item.resolved_food_id,
        resolved_food_name=food_names.get(item.resolved_food_id) if item.resolved_food_id else None,
        low_confidence=item.low_confidence,
    )


async def _analysis_out(db: DbSession, analysis: FoodAnalysis) -> dict:
    food_ids = [i.resolved_food_id for i in analysis.items if i.resolved_food_id]
    names: dict[uuid.UUID, str] = {}
    if food_ids:
        rows = (await db.scalars(select(Food).where(Food.id.in_(food_ids)))).all()
        names = {f.id: f.name for f in rows}

    return AnalysisOut(
        id=analysis.id,
        input_type=analysis.input_type.value,
        status=analysis.status.value,
        source_text=analysis.source_text,
        image_key=analysis.image_key,
        error_code=analysis.error_code.value if analysis.error_code else None,
        model_name=analysis.model_name,
        schema_version=analysis.schema_version,
        notes=analysis.notes,
        confirmed_meal_id=analysis.confirmed_meal_id,
        created_at=analysis.created_at,
        items=[_item_out(i, names) for i in analysis.items],
    ).model_dump(mode="json")


async def _load(db: DbSession, user_id: uuid.UUID, analysis_id: uuid.UUID) -> FoodAnalysis:
    analysis = await db.scalar(
        select(FoodAnalysis)
        .where(FoodAnalysis.id == analysis_id, FoodAnalysis.user_id == user_id)
        .options(selectinload(FoodAnalysis.items))
    )
    if analysis is None:
        raise NotFound("That analysis no longer exists.")
    return analysis


# -------------------------------------------------------------------- quota

async def _timezone_of(db: DbSession, user_id: uuid.UUID) -> str:
    tz = await db.scalar(select(UserProfile.timezone).where(UserProfile.user_id == user_id))
    return tz or "UTC"


async def _quota_state(db: DbSession, user_id: uuid.UUID) -> QuotaOut:
    """Today's usage, on the user's own day (**I7**).

    A quota that resets at UTC midnight resets in the middle of dinner for half
    the world.
    """
    tz = await _timezone_of(db, user_id)
    today = to_local_date(datetime.now(UTC), tz)
    start = datetime.combine(today, time.min).replace(tzinfo=UTC)

    used = await db.scalar(
        select(func.count()).select_from(FoodAnalysis)
        .where(FoodAnalysis.user_id == user_id, FoodAnalysis.created_at >= start)
    ) or 0
    limit = get_settings().ai_daily_quota

    return QuotaOut(
        used=used, limit=limit, remaining=max(0, limit - used),
        resets_at=datetime.combine(today + timedelta(days=1), time.min).replace(tzinfo=UTC),
    )


async def _assert_quota(db: DbSession, user_id: uuid.UUID) -> None:
    state = await _quota_state(db, user_id)
    if state.remaining <= 0:
        raise QuotaExceeded(
            f"You have used all {state.limit} food analyses for today. "
            "You can still add meals by hand."
        )


# ------------------------------------------------------------- submitting

async def _replay(db: DbSession, user_id: uuid.UUID, client_id: uuid.UUID | None):
    """I8 — a submission the outbox replayed is one job, not two."""
    if client_id is None:
        return None
    return await db.scalar(
        select(FoodAnalysis)
        .where(FoodAnalysis.user_id == user_id, FoodAnalysis.client_id == client_id)
        .options(selectinload(FoodAnalysis.items))
    )


@router.get("/food-analysis/quota", response_model=Envelope[QuotaOut])
async def read_quota(user: CurrentUser, db: DbSession):
    """H-06 and H-09 read this **before** offering the button, never after."""
    return ok((await _quota_state(db, user.id)).model_dump(mode="json"))


@router.post("/food-analysis/text", status_code=202, response_model=Envelope[AnalysisOut])
async def analyse_text(body: TextAnalysisIn, user: CurrentUser, db: DbSession):
    """**AC-08.** Returns 202 and an id; the worker does the rest."""
    if (existing := await _replay(db, user.id, body.client_id)) is not None:
        return ok(await _analysis_out(db, existing), status_code=202)

    await _assert_quota(db, user.id)

    analysis = FoodAnalysis(
        user_id=user.id, input_type=AnalysisInputType.text,
        source_text=body.text.strip(), status=AnalysisStatus.pending,
        client_id=body.client_id,
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis, ["items"])
    return ok(await _analysis_out(db, analysis), status_code=202)


@router.post("/food-analysis/image", status_code=202, response_model=Envelope[AnalysisOut])
async def analyse_image(body: ImageAnalysisIn, user: CurrentUser, db: DbSession):
    """**AC-09.** The key must be one this user uploaded and that exists."""
    if (existing := await _replay(db, user.id, body.client_id)) is not None:
        return ok(await _analysis_out(db, existing), status_code=202)

    # Keys are namespaced by owner, so this is both an existence check and an
    # ownership check.
    if not body.image_key.startswith(f"uploads/{user.id}/"):
        raise ValidationFailed("That image is not yours.", fields={"image_key": body.image_key})
    if not await get_store().exists(body.image_key):
        raise ValidationFailed("That image was never uploaded.",
                               fields={"image_key": body.image_key})

    await _assert_quota(db, user.id)

    analysis = FoodAnalysis(
        user_id=user.id, input_type=AnalysisInputType.image,
        image_key=body.image_key, status=AnalysisStatus.pending,
        client_id=body.client_id,
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis, ["items"])
    return ok(await _analysis_out(db, analysis), status_code=202)


@router.get("/food-analysis/{analysis_id}", response_model=Envelope[AnalysisOut])
async def get_analysis(analysis_id: uuid.UUID, user: CurrentUser, db: DbSession):
    return ok(await _analysis_out(db, await _load(db, user.id, analysis_id)))


@router.get("/food-analyses", response_model=Envelope[list[AnalysisOut]])
async def list_analyses(user: CurrentUser, db: DbSession):
    """H-18 — the audit trail (BRD §18)."""
    rows = (await db.scalars(
        select(FoodAnalysis)
        .where(FoodAnalysis.user_id == user.id)
        .options(selectinload(FoodAnalysis.items))
        .order_by(FoodAnalysis.created_at.desc())
        .limit(100)
    )).all()
    return ok([await _analysis_out(db, a) for a in rows])


@router.delete("/food-analyses/images", response_model=Envelope[dict])
async def delete_all_images(user: CurrentUser, db: DbSession):
    """H-18's "delete all photos".

    The photographs go; the **records stay**. What was analysed and what was
    saved is the audit trail, and deleting it would remove a user's own evidence
    of what the model claimed.
    """
    rows = (await db.scalars(
        select(FoodAnalysis).where(
            FoodAnalysis.user_id == user.id, FoodAnalysis.image_key.is_not(None)
        )
    )).all()

    removed = await get_store().delete_prefix(f"uploads/{user.id}")
    for analysis in rows:
        analysis.image_key = None
    await db.flush()

    return ok({"photos_deleted": removed, "analyses_kept": len(rows)})


# -------------------------------------------------------------- AC-10

def _corrected(item_in, source: FoodAnalysisItem) -> bool:
    """Whether the user actually changed something.

    Accepting what was proposed is not correcting it, and BRD §13 leans on the
    difference. Comparing against the ANALYSIS row rather than trusting a flag
    from the client means a client cannot claim a correction it did not make —
    or fail to report one it did.
    """
    if item_in.display_name is not None and item_in.display_name != source.detected_name:
        return True
    if item_in.food_id is not None and item_in.food_id != source.resolved_food_id:
        return True
    if item_in.quantity_grams is not None:
        proposed = num(source.estimated_quantity)
        if proposed is None or abs(item_in.quantity_grams - proposed) > 1e-9:
            return True
    return any(
        getattr(item_in, field) is not None
        for field in ("calories", "protein_g", "carbs_g", "fat_g")
    )


@router.post(
    "/food-analysis/{analysis_id}/confirm", status_code=201, response_model=Envelope[MealOut]
)
async def confirm_analysis(
    analysis_id: uuid.UUID,
    body: ConfirmIn,
    user: CurrentUser,
    db: DbSession,
    idempotency_key: Annotated[uuid.UUID | None, Header(alias="Idempotency-Key")] = None,
):
    """**AC-10.** Writes the meal; leaves the analysis byte-identical.

    Idempotent on the **analysis**, not on a client key: a double tap and a
    second device confirming the same review are the same event, and neither
    should produce two lunches.
    """
    analysis = await _load(db, user.id, analysis_id)

    if analysis.confirmed_meal_id is not None:
        existing = await db.scalar(
            select(Meal).where(Meal.id == analysis.confirmed_meal_id)
            .options(selectinload(Meal.items))
        )
        if existing is not None:
            return ok(meal_out(existing), status_code=201)

    if analysis.status != AnalysisStatus.completed:
        raise Conflict("That analysis has not finished yet.")

    await assert_category(db, user.id, body.meal_type)

    by_id = {i.id: i for i in analysis.items}
    chosen = [i for i in body.items if i.include]
    if unknown := [i.analysis_item_id for i in chosen if i.analysis_item_id not in by_id]:
        raise ValidationFailed("That item is not part of this analysis.",
                               fields={"items": str(unknown[0])})

    tz = await _timezone_of(db, user.id)
    consumed_at = body.consumed_at or datetime.now(UTC)
    if consumed_at.tzinfo is None:
        consumed_at = consumed_at.replace(tzinfo=UTC)

    meal = Meal(
        user_id=user.id, meal_type=body.meal_type, consumed_at=consumed_at,
        local_date=to_local_date(consumed_at, tz), logged_timezone=tz,
        client_id=body.client_id,
    )
    db.add(meal)
    await db.flush()

    source_kind = (
        ItemSource.image_ai if analysis.input_type == AnalysisInputType.image
        else ItemSource.text_ai
    )
    food_ids = [i.food_id or by_id[i.analysis_item_id].resolved_food_id for i in chosen]
    foods = {
        f.id: f for f in (await db.scalars(
            select(Food).where(Food.id.in_([f for f in food_ids if f]))
        )).all()
    } if any(food_ids) else {}

    for item_in in chosen:
        source = by_id[item_in.analysis_item_id]
        db.add(MealItem(
            meal_id=meal.id,
            analysis_item_id=source.id,
            source=source_kind,
            # I12 / Q7 — confirmation is an act, never a confidence threshold.
            # Every item written here was checked by a person on H-08.
            confirmed=True,
            user_corrected=_corrected(item_in, source),
            **_snapshot_for(item_in, source, foods),
        ))

    # The single write to the analysis row: which meal it became. The trigger
    # in migration m6 refuses anything else.
    analysis.confirmed_meal_id = meal.id
    await db.flush()

    fresh = await db.scalar(
        select(Meal).where(Meal.id == meal.id).options(selectinload(Meal.items))
        .execution_options(populate_existing=True)
    )
    return ok(meal_out(fresh), status_code=201)


def _snapshot_for(item_in, source: FoodAnalysisItem, foods: dict) -> dict:
    """The macros to freeze onto the meal item.

    Three cases, in order of authority:

    1. The user typed a macro — their numbers stand, unscaled ("using your
       numbers", H-08).
    2. A food is attached — macros come from the food at the chosen quantity,
       exactly as a manual log does, so an AI item and a manual one are the
       same shape afterwards (**H7.2**).
    3. Neither — the model's proposal, scaled to the chosen quantity. Ladder
       step 5, and what makes home-cooked food loggable.
    """
    grams = item_in.quantity_grams
    if grams is None:
        grams = num(source.estimated_quantity)

    display_name = (item_in.display_name or source.detected_name).strip()
    food_id = item_in.food_id or source.resolved_food_id
    food = foods.get(food_id) if food_id else None

    typed = {k: getattr(item_in, k) for k in ("calories", "protein_g", "carbs_g", "fat_g")}
    if any(v is not None for v in typed.values()):
        return {
            "food_id": food_id, "display_name": display_name, "quantity_grams": grams,
            "fiber_g": None, **{k: v for k, v in typed.items()},
        }

    if food is not None:
        return {
            "food_id": food_id, "display_name": display_name,
            "quantity_grams": grams,
            **snapshot_from_food(food, float(grams) if grams is not None else 100.0),
        }

    proposed = num(source.estimated_quantity)
    scale = (float(grams) / proposed) if grams is not None and proposed else 1.0
    return {
        "food_id": None, "display_name": display_name, "quantity_grams": grams,
        "calories": _scaled(source.proposed_calories, scale),
        "protein_g": _scaled(source.proposed_protein_g, scale),
        "carbs_g": _scaled(source.proposed_carbs_g, scale),
        "fat_g": _scaled(source.proposed_fat_g, scale),
        "fiber_g": None,
    }


def _scaled(value, scale: float) -> float | None:
    v = num(value)
    return None if v is None else v * scale
