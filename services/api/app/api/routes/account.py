"""Account export and deletion (G10).

**A legal surface as much as a feature**, and both halves have the same failure
mode: they look correct when they are wrong. An export that omits a domain still
downloads a file with data in it. A deletion that leaves rows behind still
returns 200. Nobody counts.

So both are built from **one list of domains**, and the tests assert
completeness against the schema's own table list rather than against a
hand-written copy of it.

**The trap the contract names.** `food_analysis_items` is append-only — a
trigger forbids UPDATE and DELETE — and `meal_items.analysis_item_id` references
it with `ON DELETE RESTRICT`. Nothing else in the codebase ever deletes from it,
which is exactly why an account delete forgets it. The order is explicit and
the trigger is dropped for the length of one transaction, which is the only
place in the product that is allowed to happen and is why it is written down.

**Deletion lives in `app/services/account.py`** since launch, because the web
page Google Play links to deletes too, and two implementations is how one of
them leaves rows behind. The routes here check who is asking; the service does
the deleting.
"""
from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Request
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.errors import ValidationFailed
from app.core.ratelimit import enforce
from app.core.security import verify_password
from app.models import (
    BodyMetric,
    CalorieTarget,
    Exercise,
    Feedback,
    FitnessGoal,
    Food,
    FoodAnalysis,
    Meal,
    MealCategory,
    PersonalRecord,
    ProgressPhoto,
    Recipe,
    User,
    UserProfile,
    WorkoutProgram,
    WorkoutSession,
)
from app.schemas.account import (
    DELETE_CONFIRMATION,
    AccountDeletedOut,
    AccountDeleteIn,
    PhotosDeletedOut,
)
from app.schemas.envelope import Envelope
from app.services.account import delete_photos as delete_photos_for
from app.services.account import purge_account

router = APIRouter(prefix="/account", tags=["account"])

#: Bumped when the shape changes. An archive with no version is an archive
#: nobody can write an importer for later.
EXPORT_FORMAT = "fitlog.export.v1"


def _enum(value):
    return value.value if hasattr(value, "value") else value


def _num(v) -> float | None:
    return float(v) if v is not None else None


def _iso(v) -> str | None:
    return v.isoformat() if v is not None else None


@router.get("/export", response_model=Envelope[dict])
async def export_account(user: CurrentUser, db: DbSession):
    """Everything the user owns, in one documented JSON document.

    Deliberately **not** paginated and deliberately not streamed: an export is
    a thing somebody downloads once, and a paginated export is one a user can
    take an incomplete copy of without noticing.
    """
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))

    sessions = (await db.scalars(
        select(WorkoutSession)
        .where(WorkoutSession.user_id == user.id)
        .options(selectinload(WorkoutSession.exercises))
        .order_by(WorkoutSession.started_at)
    )).all()

    programs = (await db.scalars(
        select(WorkoutProgram)
        .where(WorkoutProgram.user_id == user.id)
        .options(selectinload(WorkoutProgram.days))
        .order_by(WorkoutProgram.created_at)
    )).all()

    meals = (await db.scalars(
        select(Meal).where(Meal.user_id == user.id)
        .options(selectinload(Meal.items)).order_by(Meal.consumed_at)
    )).all()

    recipes = (await db.scalars(
        select(Recipe).where(Recipe.user_id == user.id)
        .options(selectinload(Recipe.items)).order_by(Recipe.name)
    )).all()

    analyses = (await db.scalars(
        select(FoodAnalysis).where(FoodAnalysis.user_id == user.id)
        .options(selectinload(FoodAnalysis.items))
        .order_by(FoodAnalysis.created_at)
    )).all()

    foods = (await db.scalars(
        select(Food).where(Food.owner_user_id == user.id).order_by(Food.name)
    )).all()
    categories = (await db.scalars(
        select(MealCategory).where(MealCategory.user_id == user.id)
        .order_by(MealCategory.sort_order)
    )).all()
    goals = (await db.scalars(
        select(FitnessGoal).where(FitnessGoal.user_id == user.id)
    )).all()
    metrics = (await db.scalars(
        select(BodyMetric).where(BodyMetric.user_id == user.id)
        .order_by(BodyMetric.measured_at)
    )).all()
    photos = (await db.scalars(
        select(ProgressPhoto).where(ProgressPhoto.user_id == user.id)
        .order_by(ProgressPhoto.taken_at)
    )).all()
    records = (await db.scalars(
        select(PersonalRecord).where(PersonalRecord.user_id == user.id)
    )).all()
    target_history = (await db.scalars(
        select(CalorieTarget).where(CalorieTarget.user_id == user.id)
        .order_by(CalorieTarget.effective_from)
    )).all()

    return ok({
        "format": EXPORT_FORMAT,
        "exported_at": datetime.now(UTC).isoformat(),
        # The account itself. NOT the password hash and NOT a refresh token —
        # an export is a file a user emails to themselves.
        "account": {"email": user.email, "created_at": _iso(user.created_at)},
        "profile": {
            "display_name": profile.display_name if profile else None,
            "timezone": profile.timezone if profile else "UTC",
            "preferred_unit_system": profile.preferred_unit_system.value
            if profile and hasattr(profile.preferred_unit_system, "value")
            else (profile.preferred_unit_system if profile else None),
            "height_cm": _num(profile.height_cm) if profile else None,
            "birth_date": _iso(profile.birth_date) if profile else None,
            "sex": profile.sex if profile else None,
            "daily_calorie_target": profile.daily_calorie_target if profile else None,
            "protein_g_target": profile.protein_g_target if profile else None,
            "carbs_g_target": profile.carbs_g_target if profile else None,
            "fat_g_target": profile.fat_g_target if profile else None,
            # What onboarding asks since G10.
            "activity_level": _enum(profile.activity_level) if profile else None,
            "training_experience": profile.training_experience if profile else None,
            "training_days_per_week": profile.training_days_per_week if profile else None,
            "session_minutes": profile.session_minutes if profile else None,
            "equipment": profile.equipment if profile else None,
            "checkin_interval_days": profile.checkin_interval_days if profile else None,
            "week_starts_on": profile.week_starts_on if profile else None,
            # K-04 (launch).
            "logging_preferences": {
                "warmups_in_volume": profile.warmups_in_volume,
                "show_rpe": profile.show_rpe, "show_rir": profile.show_rir,
                "default_rest_seconds": profile.default_rest_seconds,
                "load_step_kg": _num(profile.load_step_kg),
                "bar_weight_kg": _num(profile.bar_weight_kg),
                "plate_inventory_kg": profile.plate_inventory_kg,
            } if profile else None,
        },
        # Q8: every target, with the day it took effect.
        "calorie_targets": [
            {"effective_from": _iso(t.effective_from), "calories": t.calories,
             "protein_g": t.protein_g, "carbs_g": t.carbs_g, "fat_g": t.fat_g}
            for t in target_history
        ],
        "goals": [
            {
                "goal_type": g.goal_type.value if hasattr(g.goal_type, "value") else str(g.goal_type),
                "metric_key": g.metric_key, "direction": g.direction,
                "start_value": _num(g.start_value), "target_value": _num(g.target_value),
                "target_unit": g.target_unit, "start_date": _iso(g.start_date),
                "target_date": _iso(g.target_date),
                "status": g.status.value if hasattr(g.status, "value") else str(g.status),
            }
            for g in goals
        ],
        "programs": [
            {
                "name": p.name,
                "status": p.status.value if hasattr(p.status, "value") else str(p.status),
                "days": [
                    {
                        "name": d.name,
                        "day_index": d.day_index,
                        "scheduled_weekday": d.scheduled_weekday,
                        "notes": d.notes,
                        # Carried so `plan_exercises` is genuinely exported and
                        # not merely implied by its parent.
                        "exercises": [
                            {
                                "exercise_id": str(e.exercise_id),
                                "order_index": e.order_index,
                                "target_sets": e.target_sets,
                                "target_reps_min": e.target_reps_min,
                                "target_reps_max": e.target_reps_max,
                                "target_load": _num(e.target_load),
                                "target_duration_seconds": e.target_duration_seconds,
                                "target_distance_m": _num(e.target_distance_m),
                                "rest_seconds": e.rest_seconds,
                                "superset_group": e.superset_group,
                            }
                            for e in d.exercises
                        ],
                    }
                    for d in sorted(p.days, key=lambda x: x.day_index)
                ],
            }
            for p in programs
        ],
        "sessions": [
            {
                "started_at": _iso(s.started_at), "completed_at": _iso(s.completed_at),
                "local_date": _iso(s.local_date), "logged_timezone": s.logged_timezone,
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                "notes": s.notes, "total_volume_kg": _num(s.total_volume_kg),
                "exercises": [
                    {
                        "exercise_id": str(e.exercise_id),
                        "order_index": e.order_index,
                        "notes": e.notes, "skipped": e.skipped,
                        "superset_group": e.superset_group,
                        "sets": [
                            {
                                "set_index": w.set_index,
                                "set_type": w.set_type.value
                                if hasattr(w.set_type, "value") else str(w.set_type),
                                "load_kg": _num(w.load_kg), "reps": w.reps,
                                "completed": w.completed, "rpe": _num(w.rpe),
                                "rir": _num(w.rir), "note": w.note,
                                "duration_seconds": w.duration_seconds,
                                "distance_m": _num(w.distance_m),
                            }
                            for w in sorted(e.sets, key=lambda x: x.set_index)
                        ],
                    }
                    for e in sorted(s.exercises, key=lambda x: x.order_index)
                ],
            }
            for s in sessions
        ],
        "personal_records": [
            {
                "exercise_id": str(r.exercise_id),
                "record_type": r.record_type.value
                if hasattr(r.record_type, "value") else str(r.record_type),
                "value": _num(r.value), "achieved_at": _iso(r.achieved_at),
            }
            for r in records
        ],
        "foods": [
            {
                "name": f.name, "brand": f.brand, "calories": _num(f.calories),
                "protein_g": _num(f.protein_g), "carbs_g": _num(f.carbs_g),
                "fat_g": _num(f.fat_g), "fiber_g": _num(f.fiber_g),
                "serving_grams": _num(f.serving_grams), "serving_label": f.serving_label,
            }
            for f in foods
        ],
        "meal_categories": [
            {"slug": c.slug, "name": c.name, "sort_order": c.sort_order,
             "hidden": c.hidden, "is_default": c.is_default}
            for c in categories
        ],
        "meals": [
            {
                "meal_type": m.meal_type, "consumed_at": _iso(m.consumed_at),
                "local_date": _iso(m.local_date), "notes": m.notes,
                "items": [
                    {
                        "display_name": i.display_name,
                        "quantity_grams": _num(i.quantity_grams),
                        "calories": _num(i.calories), "protein_g": _num(i.protein_g),
                        "carbs_g": _num(i.carbs_g), "fat_g": _num(i.fat_g),
                        "confirmed": i.confirmed, "user_corrected": i.user_corrected,
                        "source": i.source.value if hasattr(i.source, "value") else str(i.source),
                    }
                    for i in m.items
                ],
            }
            for m in meals
        ],
        "recipes": [
            {
                "name": r.name, "servings": _num(r.servings), "notes": r.notes,
                "items": [
                    {"display_name": i.display_name,
                     "quantity_grams": _num(i.quantity_grams)}
                    for i in r.items
                ],
            }
            for r in recipes
        ],
        "body_metrics": [
            {"metric_key": b.metric_key, "value": _num(b.value), "unit": b.unit,
             "measured_at": _iso(b.measured_at), "local_date": _iso(b.local_date),
             "notes": b.notes}
            for b in metrics
        ],
        "progress_photos": [
            {"image_key": p.image_key, "taken_at": _iso(p.taken_at),
             "local_date": _iso(p.local_date), "pose": p.pose, "notes": p.notes}
            for p in photos
        ],
        # The raw AI output, exported as it was recorded. A user is entitled to
        # what was claimed on their behalf, not only to what they confirmed.
        "food_analyses": [
            {
                "input_type": a.input_type.value
                if hasattr(a.input_type, "value") else str(a.input_type),
                "status": a.status.value if hasattr(a.status, "value") else str(a.status),
                "source_text": a.source_text, "model_name": a.model_name,
                "schema_version": a.schema_version, "notes": a.notes,
                "created_at": _iso(a.created_at),
                "items": [
                    {
                        "detected_name": i.detected_name,
                        "estimated_quantity": _num(i.estimated_quantity),
                        "estimated_unit": i.estimated_unit,
                        "confidence": _num(i.confidence),
                        "proposed_calories": _num(i.proposed_calories),
                        "proposed_protein_g": _num(i.proposed_protein_g),
                        "proposed_carbs_g": _num(i.proposed_carbs_g),
                        "proposed_fat_g": _num(i.proposed_fat_g),
                    }
                    for i in a.items
                ],
            }
            for a in analyses
        ],
        # Their own exercises. Sessions reference exercises by id; without the
        # definitions, an export of custom or imported lifts is ids with no
        # names (G11 security review).
        "custom_exercises": [
            {
                "id": str(e.id), "name": e.name, "equipment": _enum(e.equipment),
                "movement_pattern": e.movement_pattern, "aliases": list(e.aliases or []),
                "instructions": getattr(e, "instructions", None),
                "tracks_load": e.tracks_load, "tracks_reps": e.tracks_reps,
                "tracks_duration": e.tracks_duration, "tracks_distance": e.tracks_distance,
                "status": _enum(e.status),
            }
            for e in (await db.scalars(
                select(Exercise).where(Exercise.owner_user_id == user.id).order_by(Exercise.name)
            )).all()
        ],
        # What they told us in "Send feedback" — theirs, like anything else.
        "feedback": [
            {"category": f.category, "message": f.message, "app_version": f.app_version,
             "platform": f.platform, "created_at": _iso(f.created_at)}
            for f in (await db.scalars(
                select(Feedback).where(Feedback.user_id == user.id).order_by(Feedback.created_at)
            )).all()
        ],
        #: Which tables this archive covers. The completeness test reads this
        #: and compares it against the schema, so a domain added later without
        #: an export entry fails a test rather than being discovered by a user
        #: who lost it.
        "_tables": sorted(EXPORTED_TABLES),
    })


#: Every table an export covers. `users`, `refresh_tokens`, `account_tokens`
#: and `push_tokens` are deliberately absent (credentials, not data — an emailed link is a
#: password while it lives); `daily_summaries` is a cache reproducible from the
#: rest.
EXPORTED_TABLES = {
    "user_profiles", "fitness_goals", "workout_programs", "workout_plan_days",
    "plan_exercises", "workout_sessions", "session_exercises", "workout_sets",
    "personal_records", "foods", "meal_categories", "meals", "meal_items",
    "recipes", "recipe_items", "body_metrics", "progress_photos",
    "food_analyses", "food_analysis_items", "calorie_targets", "feedback", "exercises",
}


async def _check_password(db: DbSession, user_id, password: str) -> User | None:
    account = await db.scalar(select(User).where(User.id == user_id))
    if account is None or not verify_password(password, account.password_hash):
        return None
    return account


@router.post("/delete", response_model=Envelope[AccountDeletedOut])
async def delete_account(body: AccountDeleteIn, request: Request, user: CurrentUser, db: DbSession):
    """Removes the account and everything in it. There is no undo.

    The password is required again: a delete reachable by a stolen session
    token is a delete somebody else can perform. It is rate limited like a
    login for the same reason — it is a place to guess a password — with the
    per-account half keyed by the **signed-in account's id**, not its email.
    The web page's budget is keyed by the email it is given, which anybody can
    type: sharing it would let a stranger post a few bogus attempts an hour and
    stop the owner deleting their account in the app, which both stores require.

    A wrong password is a **422 on the field**, not a 401: the session is
    fine, and a 401 would send the app to refresh it and resend the same
    wrong password.

    Immediate, not the 30-day grace K-07 sketches `[ASSUMPTION]`: a grace
    period needs a scheduled purge and a cancel-on-login path, and an account
    that says "deleted" while its data still exists is the worse failure.
    """
    await enforce(db, request, "account_delete", account=str(user.id))

    problems: dict[str, str] = {}
    if body.confirmation != DELETE_CONFIRMATION:
        problems["confirmation"] = f"Type {DELETE_CONFIRMATION} in capitals to confirm."
    if await _check_password(db, user.id, body.password) is None:
        problems["password"] = "That password is not right."
    if problems:
        raise ValidationFailed(next(iter(problems.values())), fields=problems)

    photos = await purge_account(db, user.id)
    return ok(AccountDeletedOut(deleted=True, photos_deleted=photos).model_dump())


@router.delete("/photos", response_model=Envelope[PhotosDeletedOut])
async def delete_photos(user: CurrentUser, db: DbSession):
    """K-07's "Delete my uploaded photos" — every stored image, idempotently.

    No password: nothing here is irreversible in a way the account delete is,
    the screen confirms first, and a person's own photos should be easy to
    take back.
    """
    return ok(await delete_photos_for(db, user.id))
