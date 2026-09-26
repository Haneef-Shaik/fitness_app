"""The food catalog seed: idempotent, complete, attributed, and plausible.

The catalog is data somebody else published (USDA) plus data FitLog curated
(the Indian dishes). The first must say where it came from, because the
licence asks; the second must be traceable, because a number nobody can check
is a number nobody should trust.
"""
from __future__ import annotations

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import Food, FoodDataset, FoodPortion, FoodSource
from app.seed.foods import STARTER, catalog, seed_foods, starter_key


async def _session(engine) -> AsyncSession:
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)()


async def test_seeding_twice_adds_nothing(engine):
    for _ in range(2):
        async with await _session(engine) as db:
            added = await seed_foods(db)
            await db.commit()
        assert added == {"food_datasets": 0, "foods": 0, "food_portions": 0}, added


async def test_every_catalog_entry_is_seeded_exactly_once(engine):
    entries = catalog()
    keys = [e.key for e in entries]
    assert len(keys) == len(set(keys)), "two catalog entries share a key"

    async with await _session(engine) as db:
        rows = (await db.execute(
            select(Food.external_ref, func.count())
            .where(Food.owner_user_id.is_(None))
            .group_by(Food.external_ref)
        )).tuples().all()
    counts = dict(rows)
    assert all(counts.get(k) == 1 for k in keys), [k for k in keys if counts.get(k) != 1][:5]


async def test_the_catalog_is_the_size_it_claims_by_source(engine):
    async with await _session(engine) as db:
        by_dataset = dict((await db.execute(
            select(Food.dataset, func.count())
            .where(Food.owner_user_id.is_(None)).group_by(Food.dataset)
        )).tuples().all())
    assert by_dataset["fitlog_starter"] == len(STARTER) == 22
    assert by_dataset["usda_fdc_foundation"] >= 300
    assert by_dataset["usda_fdc_sr_legacy"] >= 7000
    assert by_dataset["fitlog_indian"] >= 130


async def test_every_catalog_food_says_where_its_numbers_came_from(engine):
    async with await _session(engine) as db:
        unattributed = (await db.scalars(
            select(Food.name).where(Food.owner_user_id.is_(None), Food.dataset.is_(None))
        )).all()
        assert not unattributed, unattributed[:5]

        # USDA rows are "provider" rows keyed by their FDC id, and every
        # curated Indian dish cites the record or the recipe behind it.
        bad_usda = await db.scalar(select(func.count()).where(
            Food.dataset.like("usda_%"),
            (Food.source != FoodSource.provider) | ~Food.external_ref.like("fdc:%"),
        ))
        uncited = await db.scalar(select(func.count()).where(
            Food.dataset == "fitlog_indian",
            Food.source_note.is_(None) | (func.length(Food.source_note) < 20),
        ))
        datasets = (await db.scalars(select(FoodDataset))).all()

    assert bad_usda == 0 and uncited == 0
    assert all(d.attribution and d.licence for d in datasets)
    usda = next(d for d in datasets if d.slug == "usda_fdc_sr_legacy")
    assert "FoodData Central" in usda.attribution and "CC0" in usda.licence


async def test_curated_figures_add_up(engine):
    """Energy must agree with the macros it came from (4/4/9 kcal per gram).

    Checked for what FitLog wrote — the starter foods and the Indian dishes —
    within 12% or 15 kcal. A typo in a recipe or a label figure shows up here;
    USDA's own rows use food-specific factors and are not second-guessed.
    """
    bad = []
    for entry in catalog():
        if entry.dataset not in ("fitlog_starter", "fitlog_indian"):
            continue
        kcal, p, c, f = (entry.nutrient(n) for n in ("calories", "protein_g", "carbs_g", "fat_g"))
        estimate = 4 * p + 4 * c + 9 * f
        if abs(kcal - estimate) > max(15, 0.12 * kcal):
            bad.append((entry.name, kcal, round(estimate)))
    assert not bad, bad


async def test_every_indian_dish_has_a_household_portion(engine):
    for entry in catalog():
        if entry.dataset == "fitlog_indian":
            assert entry.portions, entry.name
            assert all(0 < grams <= 600 for _, grams in entry.portions), entry.name


async def test_portions_are_seeded_for_the_food_they_belong_to(engine):
    async with await _session(engine) as db:
        roti = await db.scalar(select(Food).where(Food.external_ref == starter_key("Roti / Chapati")))
        labels = {(p.label, float(p.grams)) for p in roti.portions}
        orphans = await db.scalar(
            select(func.count()).select_from(FoodPortion).where(FoodPortion.grams <= 0)
        )
    assert ("1 roti", 40.0) in labels
    assert orphans == 0


async def test_a_starter_food_from_before_the_catalog_is_adopted_not_duplicated(engine):
    """v1 seeded the starter foods by name, with no key and no aliases. A
    deployment upgrading must adopt those rows — meal items point at them —
    rather than add a second "Banana" beside the first."""
    async with await _session(engine) as db:
        banana = await db.scalar(
            select(Food).where(Food.external_ref == starter_key("Banana"))
        )
        await db.execute(update(Food).where(Food.id == banana.id).values(
            external_ref=None, aliases=[], dataset=None, search_weight=0,
        ))
        await db.commit()

    async with await _session(engine) as db:
        added = await seed_foods(db)
        await db.commit()
        again = await db.scalar(select(Food).where(Food.id == banana.id))
        count = await db.scalar(select(func.count()).where(
            Food.owner_user_id.is_(None), Food.name == "Banana"
        ))

    assert added["foods"] == 0 and count == 1
    assert again.external_ref == starter_key("Banana")
    assert "kela" in again.aliases and again.dataset == "fitlog_starter"


async def test_a_seeded_figure_is_filled_but_never_overwritten(engine):
    async with await _session(engine) as db:
        oats = await db.scalar(select(Food).where(Food.external_ref == starter_key("Rolled Oats")))
        await db.execute(update(Food).where(Food.id == oats.id).values(
            calories=400, fiber_g=None,
        ))
        await db.commit()

    async with await _session(engine) as db:
        await seed_foods(db)
        await db.commit()
        after = await db.scalar(select(Food).where(Food.id == oats.id))
        # Read before restoring: the ORM update below syncs the loaded object.
        calories, fiber = float(after.calories), float(after.fiber_g)
        # Put the figure back for the rest of the suite.
        await db.execute(update(Food).where(Food.id == oats.id).values(calories=389))
        await db.commit()

    assert calories == 400, "a seeded figure was overwritten"
    assert fiber == 10.6, "a missing figure was not filled"
