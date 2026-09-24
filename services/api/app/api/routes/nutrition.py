"""Nutrition (G7) — foods, meals, meal items and the diary.

Three rules are enforced here rather than trusted to callers:

**Item macros are snapshotted** (02 §4.2 inv. 4). When an item references a
food, its macros are computed from that food ONCE, at write, and stored
absolutely. Nothing recomputes them on read, so correcting a food never rewrites
a meal already logged.

**Only `confirmed = true` counts** (I2 / D5). Enforced in ONE place — the day's
totals go through `app.domain.nutrition.day_totals`, which filters. No route
sums anything itself, so no future screen can forget.

**The day is the profile's day** (I7), resolved on write exactly as a session's
is. The client never computes its own "today".
"""
from __future__ import annotations

import uuid
from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, Header, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.errors import Forbidden, NotFound, ValidationFailed
from app.domain import nutrition as domain_nutrition
from app.domain.dates import to_local_date
from app.food.categories import assert_category
from app.food.internal import InternalCatalogResolver
from app.food.resolver import FoodResolver
from app.models import Food, FoodSource, ItemSource, Meal, MealItem, UserProfile
from app.schemas.envelope import CursorEnvelope, Envelope
from app.schemas.nutrition import (
    DayOut,
    FoodIn,
    FoodOut,
    FoodPatch,
    MealIn,
    MealItemOut,
    MealItemPatch,
    MealOut,
)
from app.services import summaries
from app.services import targets as targets_service

router = APIRouter(tags=["nutrition"])


def _resolver(db: DbSession, user_id: uuid.UUID) -> FoodResolver:
    """The only place a concrete resolver is named.

    Q1 is open. When it is answered, a provider implementation is chosen here
    and nothing above this function changes — that is the whole point of the
    interface, and it is why no route imports `InternalCatalogResolver`
    directly.
    """
    return InternalCatalogResolver(db, user_id)


async def _meal_day(db: DbSession, meal_id: uuid.UUID):
    """The local date a meal is filed under — the day an item edit changes."""
    return await db.scalar(select(Meal.local_date).where(Meal.id == meal_id))


async def _timezone_of(db: DbSession, user_id: uuid.UUID) -> str:
    tz = await db.scalar(select(UserProfile.timezone).where(UserProfile.user_id == user_id))
    return tz or "UTC"


def _food_out(food: Food) -> dict:
    return FoodOut(
        id=food.id, name=food.name, brand=food.brand,
        calories=_num(food.calories), protein_g=_num(food.protein_g),
        carbs_g=_num(food.carbs_g), fat_g=_num(food.fat_g), fiber_g=_num(food.fiber_g),
        serving_grams=_num(food.serving_grams), serving_label=food.serving_label,
        source=food.source.value if hasattr(food.source, "value") else str(food.source),
        is_custom=food.owner_user_id is not None,
    ).model_dump(mode="json")


def _num(v) -> float | None:
    return float(v) if v is not None else None


def _item_out(item: MealItem) -> dict:
    return MealItemOut(
        id=item.id, food_id=item.food_id, display_name=item.display_name,
        quantity_grams=_num(item.quantity_grams),
        calories=_num(item.calories), protein_g=_num(item.protein_g),
        carbs_g=_num(item.carbs_g), fat_g=_num(item.fat_g), fiber_g=_num(item.fiber_g),
        confirmed=item.confirmed, user_corrected=item.user_corrected,
        source=item.source.value if hasattr(item.source, "value") else str(item.source),
        analysis_item_id=item.analysis_item_id,
    ).model_dump(mode="json")


def meal_out(meal: Meal) -> dict:
    return MealOut(
        id=meal.id, meal_type=meal.meal_type,
        consumed_at=meal.consumed_at, local_date=meal.local_date,
        logged_timezone=meal.logged_timezone, notes=meal.notes,
        items=[MealItemOut.model_validate(_item_out(i)) for i in meal.items],
    ).model_dump(mode="json")


def _snapshot(food: Food | None, item_in, fallback_name: str) -> dict:
    """The macros to FREEZE onto the item.

    With a food, they are scaled from its per-100 g figures — computed once,
    here, and never read back from `foods`. Without one, the caller's own
    numbers are taken as given, because a quick-add IS the source.

    A caller's macros are ignored when a `food_id` is present, so a snapshot can
    never disagree with the food it claims to come from.
    """
    if food is None:
        return {
            "display_name": (item_in.display_name or fallback_name).strip(),
            "quantity_grams": item_in.quantity_grams,
            "calories": item_in.calories, "protein_g": item_in.protein_g,
            "carbs_g": item_in.carbs_g, "fat_g": item_in.fat_g,
            "fiber_g": item_in.fiber_g,
        }

    grams = item_in.quantity_grams
    if grams is None:
        grams = float(food.serving_grams) if food.serving_grams is not None else 100.0

    macros = domain_nutrition.scale_to_grams(
        domain_nutrition.Per100g(
            calories=_num(food.calories), protein_g=_num(food.protein_g),
            carbs_g=_num(food.carbs_g), fat_g=_num(food.fat_g),
        ),
        float(grams),
    )
    fiber = _num(food.fiber_g)
    return {
        "display_name": (item_in.display_name or food.name).strip(),
        "quantity_grams": grams,
        "calories": macros.calories, "protein_g": macros.protein_g,
        "carbs_g": macros.carbs_g, "fat_g": macros.fat_g,
        "fiber_g": None if fiber is None else fiber * (float(grams) / 100.0),
    }


# ----------------------------------------------------------------- foods

@router.get("/foods", response_model=CursorEnvelope[list[FoodOut]])
async def list_foods(
    user: CurrentUser,
    db: DbSession,
    q: Annotated[str | None, Query(max_length=80)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
):
    """H-03's picker, through the resolver.

    Counted before filtering so **I13** holds: "you have no foods" and "nothing
    matches this search" are different screens, and the second one offers to
    create what was typed.
    """
    resolver = _resolver(db, user.id)
    candidates = await resolver.search(q or "", limit=limit)

    total_unfiltered = await db.scalar(
        select(func.count()).select_from(Food).where(
            or_(Food.owner_user_id.is_(None), Food.owner_user_id == user.id),
            Food.archived.is_(False),
        )
    ) or 0

    ids = [c.ref.id for c in candidates if c.ref.id is not None]
    rows = []
    if ids:
        found = {f.id: f for f in (await db.scalars(select(Food).where(Food.id.in_(ids)))).all()}
        rows = [_food_out(found[i]) for i in ids if i in found]

    return ok(rows, meta={
        "limit": limit, "count": len(rows),
        "filtered": bool(q), "total_unfiltered": total_unfiltered,
        "has_more": False, "next_cursor": None,
    })


@router.get("/foods/{food_id}", response_model=Envelope[FoodOut])
async def get_food(food_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """One food by id.

    Added in G10 because H-05 was **looking its food up in the unfiltered list**
    — capped at 25 rows — so opening a food from search showed "not found" as
    soon as the catalog outgrew one page. Invisible in tests, where the catalog
    is small, and found the first time a device opened a real one.
    """
    food = await db.scalar(
        select(Food).where(
            Food.id == food_id,
            or_(Food.owner_user_id.is_(None), Food.owner_user_id == user.id),
        )
    )
    if food is None:
        raise NotFound("That food no longer exists.")
    return ok(_food_out(food))


@router.post("/foods", status_code=201, response_model=Envelope[FoodOut])
async def create_food(body: FoodIn, user: CurrentUser, db: DbSession):
    """A user's own food. `source=user`, so it is never mistaken for catalog."""
    food = Food(owner_user_id=user.id, source=FoodSource.user, **body.model_dump())
    db.add(food)
    await db.flush()
    return ok(_food_out(food), status_code=201)


@router.patch("/foods/{food_id}", response_model=Envelope[FoodOut])
async def patch_food(food_id: uuid.UUID, body: FoodPatch, user: CurrentUser, db: DbSession):
    """Corrects a food going FORWARD.

    Meals already logged from it do not move: their macros were snapshotted at
    write (02 §4.2 inv. 4). That is the behaviour, not a limitation.
    """
    food = await db.scalar(select(Food).where(Food.id == food_id))
    if food is None:
        raise NotFound("That food no longer exists.")
    if food.owner_user_id is None:
        raise Forbidden("This is a built-in food. Copy it to a custom food to edit it.")
    if food.owner_user_id != user.id:
        raise Forbidden()

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(food, key, value)
    await db.flush()
    return ok(_food_out(food))


@router.delete("/foods/{food_id}", response_model=Envelope[FoodOut])
async def delete_food(food_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Archives it. Items that referenced it keep their macros and their name —
    deleting a food must never delete what somebody ate."""
    food = await db.scalar(select(Food).where(Food.id == food_id))
    if food is None:
        raise NotFound("That food no longer exists.")
    if food.owner_user_id is None:
        raise Forbidden("Built-in foods cannot be deleted.")
    if food.owner_user_id != user.id:
        raise Forbidden()

    # The FK is SET NULL, so the items survive with their snapshot intact.
    await db.delete(food)
    await db.flush()
    return ok(_food_out(food))


# ----------------------------------------------------------------- meals

@router.post("/meals", status_code=201, response_model=Envelope[MealOut])
async def create_meal(
    body: MealIn,
    user: CurrentUser,
    db: DbSession,
    idempotency_key: Annotated[uuid.UUID | None, Header(alias="Idempotency-Key")] = None,
):
    """Logs a meal. **AC-07** — today's totals move immediately after this.

    Idempotent on `client_id` (**I8**), the same contract sets use, because
    meals ride the same outbox and a replayed flush must not double a day.
    """
    # The category must be one of this user's own. An unknown slug used to be
    # impossible (it was an enum); now that H-16 lets people add their own, the
    # check moved here rather than disappearing.
    await assert_category(db, user.id, body.meal_type)

    if body.client_id is not None:
        existing = await db.scalar(
            select(Meal)
            .where(Meal.user_id == user.id, Meal.client_id == body.client_id)
            .options(selectinload(Meal.items))
        )
        if existing is not None:
            # A replay, not a second meal.
            return ok(meal_out(existing), status_code=201)

    tz = await _timezone_of(db, user.id)
    consumed_at = body.consumed_at or datetime.now(UTC)
    if consumed_at.tzinfo is None:
        consumed_at = consumed_at.replace(tzinfo=UTC)

    meal = Meal(
        user_id=user.id,
        meal_type=body.meal_type,
        consumed_at=consumed_at,
        local_date=to_local_date(consumed_at, tz),
        logged_timezone=tz,
        notes=body.notes,
        client_id=body.client_id,
    )
    db.add(meal)
    await db.flush()

    food_ids = [i.food_id for i in body.items if i.food_id is not None]
    foods: dict[uuid.UUID, Food] = {}
    if food_ids:
        foods = {
            f.id: f for f in (await db.scalars(
                select(Food).where(
                    Food.id.in_(food_ids),
                    or_(Food.owner_user_id.is_(None), Food.owner_user_id == user.id),
                )
            )).all()
        }
        if missing := [i for i in food_ids if i not in foods]:
            raise ValidationFailed("One of those foods does not exist.",
                                   fields={"items": str(missing[0])})

    for item_in in body.items:
        food = foods.get(item_in.food_id) if item_in.food_id else None
        db.add(MealItem(
            meal_id=meal.id,
            food_id=item_in.food_id,
            confirmed=item_in.confirmed,
            source=ItemSource(item_in.source),
            client_id=item_in.client_id,
            **_snapshot(food, item_in, "Quick add"),
        ))

    await summaries.invalidate(db, user.id, meal.local_date)
    await db.flush()
    fresh = await db.scalar(
        select(Meal).where(Meal.id == meal.id).options(selectinload(Meal.items))
        .execution_options(populate_existing=True)
    )
    return ok(meal_out(fresh), status_code=201)


@router.get("/meals/{meal_id}", response_model=Envelope[MealOut])
async def get_meal(meal_id: uuid.UUID, user: CurrentUser, db: DbSession):
    meal = await db.scalar(
        select(Meal).where(Meal.id == meal_id, Meal.user_id == user.id)
        .options(selectinload(Meal.items))
    )
    if meal is None:
        raise NotFound("That meal no longer exists.")
    return ok(meal_out(meal))


@router.delete("/meals/{meal_id}", response_model=Envelope[MealOut])
async def delete_meal(meal_id: uuid.UUID, user: CurrentUser, db: DbSession):
    meal = await db.scalar(
        select(Meal).where(Meal.id == meal_id, Meal.user_id == user.id)
        .options(selectinload(Meal.items))
    )
    if meal is None:
        raise NotFound("That meal no longer exists.")
    out = meal_out(meal)
    await summaries.invalidate(db, user.id, meal.local_date)
    await db.delete(meal)
    await db.flush()
    return ok(out)


# ------------------------------------------------------------ meal items

@router.patch("/meal-items/{item_id}", response_model=Envelope[MealItemOut])
async def patch_meal_item(
    item_id: uuid.UUID, body: MealItemPatch, user: CurrentUser, db: DbSession
):
    """Edits one item.

    Changing the quantity **rescales from the food it came from**, rather than
    scaling the stored snapshot — scaling a snapshot compounds, so 200 g → 100 g
    → 200 g would not return to where it started.

    Any edit marks `user_corrected` (BRD §13 / **I12**): an estimate somebody
    touched is not the same as one they did not, and G8 leans on that.
    """
    item = await db.scalar(
        select(MealItem).join(Meal, Meal.id == MealItem.meal_id)
        .where(MealItem.id == item_id, Meal.user_id == user.id)
    )
    if item is None:
        raise NotFound("That item no longer exists.")

    changes = body.model_dump(exclude_unset=True)

    if "quantity_grams" in changes and item.food_id is not None:
        food = await db.scalar(select(Food).where(Food.id == item.food_id))
        if food is not None:
            grams = float(changes["quantity_grams"])
            macros = domain_nutrition.scale_to_grams(
                domain_nutrition.Per100g(
                    calories=_num(food.calories), protein_g=_num(food.protein_g),
                    carbs_g=_num(food.carbs_g), fat_g=_num(food.fat_g),
                ),
                grams,
            )
            item.calories = macros.calories
            item.protein_g = macros.protein_g
            item.carbs_g = macros.carbs_g
            item.fat_g = macros.fat_g
            fiber = _num(food.fiber_g)
            item.fiber_g = None if fiber is None else fiber * (grams / 100.0)

    for key, value in changes.items():
        setattr(item, key, value)

    # `confirmed` alone is an act of confirming, not of correcting.
    if any(k != "confirmed" for k in changes):
        item.user_corrected = True

    # Confirming an item moves a total, which is exactly why this matters here.
    await summaries.invalidate(db, user.id, await _meal_day(db, item.meal_id))
    await db.flush()
    return ok(_item_out(item))


@router.delete("/meal-items/{item_id}", response_model=Envelope[MealItemOut])
async def delete_meal_item(item_id: uuid.UUID, user: CurrentUser, db: DbSession):
    item = await db.scalar(
        select(MealItem).join(Meal, Meal.id == MealItem.meal_id)
        .where(MealItem.id == item_id, Meal.user_id == user.id)
    )
    if item is None:
        raise NotFound("That item no longer exists.")
    out = _item_out(item)
    await summaries.invalidate(db, user.id, await _meal_day(db, item.meal_id))
    await db.delete(item)
    await db.flush()
    return ok(out)


# ------------------------------------------------------------------- day

@router.get("/nutrition/day", response_model=Envelope[DayOut])
async def nutrition_day(
    user: CurrentUser,
    db: DbSession,
    day: Annotated[date | None, Query(alias="date")] = None,
):
    """H-01's diary. **AC-07**'s read side.

    Totals go through `domain_nutrition.day_totals`, which counts only confirmed
    items — the single place that rule is applied, so no screen can forget it
    and no "preview" can quietly include a pending row.
    """
    tz = await _timezone_of(db, user.id)
    target = day or to_local_date(datetime.now(UTC), tz)

    meals = (await db.scalars(
        select(Meal)
        .where(Meal.user_id == user.id, Meal.local_date == target)
        .options(selectinload(Meal.items))
        .order_by(Meal.consumed_at)
    )).all()

    totals = domain_nutrition.day_totals([
        domain_nutrition.MealItem(
            calories=_num(i.calories), protein_g=_num(i.protein_g),
            carbs_g=_num(i.carbs_g), fat_g=_num(i.fat_g), confirmed=i.confirmed,
        )
        for meal in meals for i in meal.items
    ])

    in_force = (await targets_service.history(db, user.id)).on(target)

    return ok(DayOut(
        local_date=target,
        targets=in_force.as_dict() if in_force else None,
        calories=totals.calories, protein_g=totals.protein_g,
        carbs_g=totals.carbs_g, fat_g=totals.fat_g,
        pending_count=totals.pending_count, incomplete=totals.incomplete,
        meals=[MealOut.model_validate(meal_out(m)) for m in meals],
    ).model_dump(mode="json"))
