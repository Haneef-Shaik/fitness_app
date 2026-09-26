"""Deleting what a user owns — one implementation, whichever door asks (launch).

Three doors reach it: the app's K-07 screen, the legacy `DELETE /v1/account`,
and the web page Google Play links to for people who no longer have the app.
Two deletion paths is how one of them ends up leaving behind rows the other
would have removed, so there is one, and `test_web_account_delete` re-runs the
table-by-table completeness check against the web door to prove it.

Moved here from `routes/account.py` unchanged in substance; the reasoning about
order and the append-only trigger travelled with it.
"""
from __future__ import annotations

import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FoodAnalysis, ProgressPhoto
from app.storage.provider import get_store

#: The order matters and the FKs enforce it. `meal_items` must lose its
#: reference to `food_analysis_items` before those rows can go, and the
#: append-only trigger has to be stood down for the length of the transaction —
#: the only place in the product where that is allowed.
#:
#: **Most of these are belt-and-braces over `ON DELETE CASCADE`**, and that is
#: deliberate rather than accidental: removing the `food_analyses` or
#: `daily_summaries` line leaves the tests green, because the FK from `users`
#: does the work. Mutation testing said so, and the list stays explicit anyway —
#: a "delete everything" that relies on FK behaviour nobody restates is one FK
#: edit away from being wrong, and `test_deleting_a_user_cascades_as_the_schema_promises`
#: is what would catch that edit.
#:
#: The lines that are **not** redundant, and would each leave rows behind:
#:   `food_analysis_items` — RESTRICT from `meal_items`, plus the trigger
#:   every child table whose parent is not the user (sets, items, plan days)
_DELETE_ORDER = (
    ("DELETE FROM workout_sets w USING session_exercises se, workout_sessions s"
     " WHERE w.session_exercise_id = se.id AND se.session_id = s.id AND s.user_id = :uid"),
    ("DELETE FROM session_exercises se USING workout_sessions s"
     " WHERE se.session_id = s.id AND s.user_id = :uid"),
    "DELETE FROM personal_records WHERE user_id = :uid",
    "DELETE FROM workout_sessions WHERE user_id = :uid",
    ("DELETE FROM plan_exercises pe USING workout_plan_days d, workout_programs p"
     " WHERE pe.plan_day_id = d.id AND d.program_id = p.id AND p.user_id = :uid"),
    ("DELETE FROM workout_plan_days d USING workout_programs p"
     " WHERE d.program_id = p.id AND p.user_id = :uid"),
    "DELETE FROM workout_programs WHERE user_id = :uid",
    ("DELETE FROM meal_items mi USING meals m"
     " WHERE mi.meal_id = m.id AND m.user_id = :uid"),
    "DELETE FROM meals WHERE user_id = :uid",
    ("DELETE FROM recipe_items ri USING recipes r"
     " WHERE ri.recipe_id = r.id AND r.user_id = :uid"),
    "DELETE FROM recipes WHERE user_id = :uid",
    "DELETE FROM meal_categories WHERE user_id = :uid",
    # Only now, with nothing referencing them.
    ("DELETE FROM food_analysis_items fai USING food_analyses fa"
     " WHERE fai.analysis_id = fa.id AND fa.user_id = :uid"),
    "DELETE FROM food_analyses WHERE user_id = :uid",
    "DELETE FROM foods WHERE owner_user_id = :uid",
    "DELETE FROM body_metrics WHERE user_id = :uid",
    "DELETE FROM progress_photos WHERE user_id = :uid",
    "DELETE FROM daily_summaries WHERE user_id = :uid",
    "DELETE FROM fitness_goals WHERE user_id = :uid",
    "DELETE FROM calorie_targets WHERE user_id = :uid",
    "DELETE FROM feedback WHERE user_id = :uid",
    "DELETE FROM push_tokens WHERE user_id = :uid",
    "DELETE FROM user_profiles WHERE user_id = :uid",
    "DELETE FROM users WHERE id = :uid",
)


def upload_prefix(user_id: uuid.UUID) -> str:
    """Where every file a user uploads lives (`app.storage.signing.new_key`)."""
    return f"uploads/{user_id}"


async def purge_account(db: AsyncSession, user_id: uuid.UUID) -> int:
    """Removes the account and everything in it. There is no undo.

    Returns how many progress photos went, which the app reports back. The
    caller has already established who is asking (a recent sign-in in the app,
    an emailed code on the web page); this does not ask again. The Supabase
    sign-in is removed by the caller, after this commits (app/auth/admin.py).
    """
    # The files, before the rows that name them — a row is how we know a file
    # exists, so losing the row first orphans the file forever.
    store = get_store()
    photos = (await db.scalars(
        select(ProgressPhoto).where(ProgressPhoto.user_id == user_id)
    )).all()
    for photo in photos:
        await store.delete(photo.image_key)
    await store.delete_prefix(upload_prefix(user_id))

    # The append-only trigger stands down for exactly this transaction. It is
    # the only place in the product that happens, and it is deliberate: a user
    # asking to be forgotten outranks an audit trail about them.
    await db.execute(text(
        "ALTER TABLE food_analysis_items DISABLE TRIGGER food_analysis_items_no_update"
    ))
    try:
        for statement in _DELETE_ORDER:
            await db.execute(text(statement), {"uid": str(user_id)})
    finally:
        await db.execute(text(
            "ALTER TABLE food_analysis_items ENABLE TRIGGER food_analysis_items_no_update"
        ))

    await db.flush()
    return len(photos)


async def delete_photos(db: AsyncSession, user_id: uuid.UUID) -> dict[str, int]:
    """K-07's "Delete my uploaded photos": every stored image, and what named it.

    * Progress photos lose their **rows** too — a progress photo is its image,
      and a row pointing at nothing is a broken tile on I-05.
    * Food analyses keep theirs, with the photo cleared: the record of what the
      model claimed is the user's audit trail (BRD §18, H-18), and a meal
      confirmed from it keeps its numbers, which live in `meal_items`.
    * Uploads that never became either go with the sweep of the folder.

    Idempotent: a second call finds nothing and reports zeros, so a retried
    request after a dropped connection is harmless.
    """
    progress = (await db.scalars(
        select(ProgressPhoto).where(ProgressPhoto.user_id == user_id)
    )).all()
    analyses = (await db.scalars(
        select(FoodAnalysis).where(
            FoodAnalysis.user_id == user_id, FoodAnalysis.image_key.is_not(None)
        )
    )).all()

    # Every key is under the user's prefix by construction (the upload and
    # attach routes both refuse anything else), so one sweep reaches them all.
    files = await get_store().delete_prefix(upload_prefix(user_id))

    for photo in progress:
        await db.delete(photo)
    for analysis in analyses:
        analysis.image_key = None
    await db.flush()

    return {
        "files_deleted": files,
        "progress_photos_deleted": len(progress),
        "analyses_kept": len(analyses),
    }
