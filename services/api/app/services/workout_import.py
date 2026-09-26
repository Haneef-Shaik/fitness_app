"""Bringing workout history in from another app (launch plan, phase 6).

The parse is `app.imports.workout_csv`; this is the part that writes. Three
rules, each for the same reason — a switcher's history is the most valuable
thing they bring, and an importer that is wrong about it is worse than none:

  - **Exercises are matched, then created.** "Bench Press (Barbell)" is the
    catalog's Barbell Bench Press; a name nothing matches becomes the user's
    own custom exercise rather than being dropped or forced onto a guess.
  - **Re-importing is a no-op.** Each workout carries a stable key, unique per
    user, so the same file twice adds nothing the second time.
  - **Records come from the domain,** recomputed once at the end with the same
    code a finished workout uses (I3, I5) — an import cannot mint a PR the
    rules would not.
"""
from __future__ import annotations

import re
import uuid
from datetime import UTC, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.training import total_volume_kg
from app.imports.workout_csv import ImportedExercise, ParseResult
from app.models import (
    CatalogStatus,
    Equipment,
    Exercise,
    SessionExercise,
    SessionStatus,
    SetType,
    UserProfile,
    WorkoutSession,
    WorkoutSet,
)
from app.services import summaries
from app.services.sessions import annotate_set, recompute_records_for_exercise, to_domain

#: Strong and Hevy put the equipment in brackets after the name.
_EQUIPMENT_WORDS = {
    "barbell": "Barbell", "dumbbell": "Dumbbell", "machine": "Machine", "cable": "Cable",
    "kettlebell": "Kettlebell", "smith machine": "Smith Machine", "band": "Band",
    "ez bar": "EZ Bar", "bodyweight": None, "weighted": None, "assisted": None,
}


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip().lower())


def _split_bracket(name: str) -> tuple[str, str] | None:
    r"""`"Bench Press (Barbell)"` → `("Bench Press", "Barbell")`, by position.

    Not a regex: a lazy `^(.*?)\s*\(` backtracks quadratically on a long run of
    spaces, and one crafted name froze the API's event loop for seconds (G11
    security review). `rfind` is linear whatever the input.
    """
    stripped = name.rstrip()
    if not stripped.endswith(")"):
        return None
    open_at = stripped.rfind("(")
    if open_at <= 0:
        return None
    kit = stripped[open_at + 1:-1].strip()
    base = stripped[:open_at].strip()
    if not kit or not base or "(" in kit or ")" in kit:
        return None
    return base, kit


def candidates(name: str) -> list[str]:
    """Names to try, most specific first: as written, equipment-first, bare."""
    out = [_norm(name)]
    split = _split_bracket(name)
    if split:
        base, kit = split
        prefix = _EQUIPMENT_WORDS.get(_norm(kit), kit)
        if prefix:
            out.append(_norm(f"{prefix} {base}"))
        out.append(_norm(base))
    return list(dict.fromkeys(out))


def _tracks(ex: ImportedExercise) -> dict[str, bool]:
    return {
        "tracks_load": any(s.load_kg is not None for s in ex.sets),
        "tracks_reps": any(s.reps is not None for s in ex.sets),
        "tracks_duration": any(s.duration_seconds is not None for s in ex.sets),
        "tracks_distance": any(s.distance_m is not None for s in ex.sets),
    }


async def _index(db: AsyncSession, user_id: uuid.UUID) -> dict[str, Exercise]:
    rows = (await db.scalars(
        select(Exercise).where(
            Exercise.status == CatalogStatus.active,
            or_(Exercise.owner_user_id.is_(None), Exercise.owner_user_id == user_id),
        )
    )).all()
    index: dict[str, Exercise] = {}
    # The user's own first, so their custom "Bench Press" beats nothing else;
    # then the catalog; aliases last, never overriding a real name.
    for ex in sorted(rows, key=lambda e: e.owner_user_id is None):
        index.setdefault(_norm(ex.name), ex)
    for ex in rows:
        for alias in ex.aliases or []:
            index.setdefault(_norm(alias), ex)
    return index


def _match(index: dict[str, Exercise], name: str) -> Exercise | None:
    for c in candidates(name):
        if c in index:
            return index[c]
    return None


async def import_workouts(
    db: AsyncSession, user_id: uuid.UUID, parsed: ParseResult, *, dry_run: bool = False,
) -> dict:
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
    tz = profile.timezone if profile else "UTC"
    include_warmups = bool(profile.warmups_in_volume) if profile else False

    index = await _index(db, user_id)
    names = sorted({e.name for s in parsed.sessions for e in s.exercises})
    matched = {n: ex for n in names if (ex := _match(index, n)) is not None}
    to_create = [n for n in names if n not in matched]

    existing = set((await db.scalars(
        select(WorkoutSession.import_key).where(
            WorkoutSession.user_id == user_id, WorkoutSession.import_key.is_not(None)
        )
    )).all())
    new_sessions = [s for s in parsed.sessions if s.import_key not in existing]

    report = {
        "format": parsed.format,
        "sessions_found": len(parsed.sessions),
        "sessions_new": len(new_sessions),
        "sessions_already_imported": len(parsed.sessions) - len(new_sessions),
        "sets": sum(len(e.sets) for s in new_sessions for e in s.exercises),
        "exercises_matched": {n: matched[n].name for n in sorted(matched)},
        "exercises_to_create": to_create,
        "skipped_rows": parsed.skipped_rows,
        "dry_run": dry_run,
    }
    if dry_run or not new_sessions:
        return report

    # Custom exercises for names nothing matched — the user's own, editable later.
    first_seen = {e.name: e for s in parsed.sessions for e in s.exercises}
    for name in to_create:
        ex = Exercise(
            owner_user_id=user_id, is_custom=True, name=name[:120],
            equipment=Equipment.other, **_tracks(first_seen[name]),
        )
        db.add(ex)
        matched[name] = ex
    await db.flush()

    # Ids are chosen here and everything is added in one go and flushed once:
    # a flush per session and per exercise cost ~4 ms a row, so a large export
    # held a pooled connection for minutes (G11 security review).
    zone = ZoneInfo(tz)
    touched: set[uuid.UUID] = set()
    rows: list = []
    for imported in new_sessions:
        started = imported.started_at.replace(tzinfo=zone).astimezone(UTC)
        duration = imported.duration_seconds
        session = WorkoutSession(
            id=uuid.uuid4(), user_id=user_id, started_at=started,
            completed_at=started + timedelta(seconds=duration or 0),
            duration_seconds=duration, status=SessionStatus.completed,
            local_date=imported.started_at.date(), logged_timezone=tz,
            notes=(imported.notes or "")[:2000] or None, import_key=imported.import_key,
        )
        rows.append(session)

        domain_sets = []
        for order, ex in enumerate(imported.exercises):
            target = matched[ex.name]
            touched.add(target.id)
            se = SessionExercise(
                id=uuid.uuid4(), session_id=session.id, exercise_id=target.id, order_index=order,
                notes=(ex.notes or "")[:2000] or None,
            )
            rows.append(se)
            for i, s in enumerate(ex.sets):
                row = WorkoutSet(
                    session_exercise_id=se.id, set_index=i, set_type=SetType(s.set_type),
                    reps=s.reps, load_kg=s.load_kg, duration_seconds=s.duration_seconds,
                    distance_m=s.distance_m,
                    rpe=min(10.0, max(0.0, s.rpe)) if s.rpe is not None else None,
                    completed=True, performed_at=started, load_unit_entered="kg",
                    note=(s.note or "")[:500] or None,
                )
                annotate_set(row)
                rows.append(row)
                domain_sets.append(to_domain(row))
        session.total_volume_kg = round(total_volume_kg(domain_sets, include_warmups=include_warmups), 2)

    db.add_all(rows)
    await db.flush()

    for exercise_id in touched:
        await recompute_records_for_exercise(db, user_id, exercise_id)
    await summaries.invalidate_all(db, user_id)
    await db.flush()
    return {**report, "exercises_created": to_create}
