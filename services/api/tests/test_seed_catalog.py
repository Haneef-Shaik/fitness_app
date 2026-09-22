"""The seed must be idempotent and must satisfy the catalog's own invariants."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import Exercise, ExerciseMuscle, MuscleGroup, MuscleRole
from app.seed.catalog import MUSCLES, seed_catalog


async def _session(engine) -> AsyncSession:
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)()


async def test_seed_is_idempotent(engine):
    """The session fixture already seeded, so every further run must be a no-op.
    That is the property that lets any environment be rebuilt from scratch."""
    for _ in range(2):
        async with await _session(engine) as db:
            result = await seed_catalog(db)
            await db.commit()
            assert result == {"muscle_groups": 0, "exercises": 0}

    async with await _session(engine) as db:
        counts = {
            # Counted by SEEDED slug, not as a total row count. The suite shares
            # one database, so a test that legitimately adds a muscle group of
            # its own (G5 needs a three-level tree to prove "or a descendant")
            # would otherwise fail this file from a different one. What this
            # guards is that the seed produced every group exactly once, which
            # is what the slug filter measures.
            "muscle_groups": await db.scalar(
                select(func.count()).select_from(MuscleGroup)
                .where(MuscleGroup.slug.in_([slug for slug, _, _ in MUSCLES]))
            ),
            "exercises": await db.scalar(
                select(func.count()).select_from(Exercise).where(Exercise.owner_user_id.is_(None))
            ),
        }
    assert counts["muscle_groups"] == 22, counts
    assert counts["exercises"] == 29, counts


async def test_every_exercise_has_a_primary_muscle(engine):
    """W02.4 — without a primary muscle, muscle-group analytics and the
    previous-chest-day lookup cannot work."""
    async with await _session(engine) as db:
        await seed_catalog(db)
        await db.commit()

        rows = (await db.execute(
            select(Exercise.name)
            .outerjoin(
                ExerciseMuscle,
                (ExerciseMuscle.exercise_id == Exercise.id)
                & (ExerciseMuscle.role == MuscleRole.primary),
            )
            .where(Exercise.owner_user_id.is_(None))
            .group_by(Exercise.id, Exercise.name)
            .having(func.count(ExerciseMuscle.muscle_group_id) == 0)
        )).all()
        assert not rows, f"seeded exercises without a primary muscle: {[r[0] for r in rows]}"


async def test_every_exercise_tracks_at_least_one_field(engine):
    """A set needs reps, duration or distance — load alone is not a set (W04.7)."""
    async with await _session(engine) as db:
        await seed_catalog(db)
        await db.commit()
        bad = (await db.scalars(
            select(Exercise.name).where(
                Exercise.tracks_reps.is_(False),
                Exercise.tracks_duration.is_(False),
                Exercise.tracks_distance.is_(False),
            )
        )).all()
        assert not bad, f"exercises that could never hold a valid set: {list(bad)}"


async def test_muscle_hierarchy_resolves(engine):
    """Chest must have Upper Chest as a descendant — 'previous chest day' widens through it."""
    async with await _session(engine) as db:
        await seed_catalog(db)
        await db.commit()
        chest = await db.scalar(select(MuscleGroup).where(MuscleGroup.slug == "chest"))
        upper = await db.scalar(select(MuscleGroup).where(MuscleGroup.slug == "upper-chest"))
        assert chest.parent_id is None
        assert upper.parent_id == chest.id
