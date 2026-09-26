"""Import workout history from Strong or Hevy (launch plan, phase 6).

Two steps from the app: a dry run that says what will happen — which
exercises matched what, what will be created, what was skipped and why — and
then the import itself. Nothing is written by the dry run.
"""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.errors import ValidationFailed
from app.core.ratelimit import enforce
from app.imports.nutrition_csv import parse_mfp
from app.imports.workout_csv import MAX_BYTES, ImportFormatError, parse
from app.schemas.envelope import Envelope
from app.services.nutrition_import import import_nutrition
from app.services.workout_import import import_workouts

router = APIRouter(prefix="/imports", tags=["imports"])


class WorkoutImportIn(BaseModel):
    csv: str = Field(min_length=1, max_length=MAX_BYTES)
    format: Literal["auto", "strong", "hevy"] = "auto"
    #: Strong exports weights in whatever unit the user had set, unlabelled.
    weight_unit: Literal["kg", "lb"] = "kg"
    dry_run: bool = True


@router.post("/workouts", response_model=Envelope[dict])
async def import_workout_history(
    body: WorkoutImportIn, request: Request, user: CurrentUser, db: DbSession,
):
    await enforce(db, request, "imports", account=str(user.id))
    try:
        # Off the event loop: parsing 8 MB is CPU work, and on the loop it stalls
        # every other request in the process for as long as it takes.
        parsed = await run_in_threadpool(parse, body.csv, body.format, body.weight_unit)
    except ImportFormatError as exc:
        raise ValidationFailed(str(exc), fields={"csv": str(exc)}) from exc
    if not parsed.sessions:
        raise ValidationFailed(
            "No workouts with sets were found in that file.",
            fields={"csv": "Nothing to import."},
        )
    return ok(await import_workouts(db, user.id, parsed, dry_run=body.dry_run))


class NutritionImportIn(BaseModel):
    csv: str = Field(min_length=1, max_length=MAX_BYTES)
    dry_run: bool = True


@router.post("/nutrition", response_model=Envelope[dict])
async def import_nutrition_history(
    body: NutritionImportIn, request: Request, user: CurrentUser, db: DbSession,
):
    await enforce(db, request, "imports", account=str(user.id))
    try:
        parsed = await run_in_threadpool(parse_mfp, body.csv)
    except ImportFormatError as exc:
        raise ValidationFailed(str(exc), fields={"csv": str(exc)}) from exc
    if not parsed.meals:
        raise ValidationFailed("No meals were found in that file.", fields={"csv": "Nothing to import."})
    return ok(await import_nutrition(db, user.id, parsed, dry_run=body.dry_run))
