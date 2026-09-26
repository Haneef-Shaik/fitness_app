"""The internal-catalog resolver — the implementation that works standalone.

Reads the `foods` table, which `app/seed/foods.py` seeds. No network, no
provider: Q1 was answered "internal catalog", so this is the resolver.

Scoping matches the exercise catalog: a user sees the global rows plus their own,
never anyone else's.

**Ranking.** With ~8,000 foods, "matches the query" is hundreds of rows for
"egg", and alphabetical order put "Egg custards, dry mix" first. A match is now
every query word appearing at the START of a word in the name or an alias
(so "egg" does not match "veggie"), and the matches are ordered by, in this
order of strength:

1. an alias or the whole name *is* the query          — "rice" → White Rice
2. the user's own food                                 — 02 §5.2 step 3
3. the name's first segment IS the query — USDA writes the food first and
   the qualifiers after commas ("Rice, white, cooked"), so this says "it is
   rice", which "Rice flour, white" is not; and, weaker, the name merely
   begins with the query or its first word
4. each query word matching a WHOLE word, not a prefix — "egg" ≠ "eggnog"
5. the seeded `search_weight`                          — staples before
   fast-food and branded rows
6. trigram similarity, then the shorter name           — the least
   qualified food wins a tie

A query that matches nothing falls back to trigram similarity (pg_trgm), so
"bannana" still finds bananas. The ladder never accepts one of those fuzzy
hits for an AI item: it checks that every word was actually matched.
"""
from __future__ import annotations

import uuid

from sqlalchemy import case, func, literal, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.food.resolver import Candidate, FoodRef
from app.food.text import PLURAL_SUFFIX, normalise, terms
from app.models import Food


def _as_candidate(food: Food) -> Candidate:
    return Candidate(
        ref=FoodRef(id=food.id, source="internal"),
        name=food.name,
        brand=food.brand,
        calories=float(food.calories) if food.calories is not None else None,
        protein_g=float(food.protein_g) if food.protein_g is not None else None,
        carbs_g=float(food.carbs_g) if food.carbs_g is not None else None,
        fat_g=float(food.fat_g) if food.fat_g is not None else None,
        serving_grams=float(food.serving_grams) if food.serving_grams is not None else None,
        serving_label=food.serving_label,
        aliases=tuple(food.aliases or ()),
        category=food.category,
    )


class InternalCatalogResolver:
    """Satisfies `FoodResolver` structurally — no inheritance needed."""

    def __init__(self, db: AsyncSession, user_id: uuid.UUID) -> None:
        self._db = db
        self._user_id = user_id

    def _visible(self):
        return select(Food).where(
            or_(Food.owner_user_id.is_(None), Food.owner_user_id == self._user_id),
            Food.archived.is_(False),
        )

    async def search(self, query: str, *, limit: int = 20) -> list[Candidate]:
        words = terms(query)
        if not words:
            return await self._browse(limit)
        rows = (await self._db.scalars(self._ranked(normalise(query), words, limit))).all()
        if not rows:
            rows = (await self._db.scalars(self._fuzzy(normalise(query), limit))).all()
        return [_as_candidate(f) for f in rows]

    async def resolve(self, ref: FoodRef) -> Candidate | None:
        if ref.id is None:
            return None
        food = await self._db.scalar(self._visible().where(Food.id == ref.id))
        return _as_candidate(food) if food is not None else None

    # ---------------------------------------------------------------- queries

    async def _browse(self, limit: int) -> list[Candidate]:
        """No query: the user's own foods, then the catalog's staples."""
        stmt = self._visible().order_by(
            Food.owner_user_id.is_(None), Food.search_weight.desc(), Food.name,
        ).limit(limit)
        return [_as_candidate(f) for f in (await self._db.scalars(stmt)).all()]

    def _ranked(self, phrase: str, words: list[str], limit: int):
        name = func.lower(Food.name)
        aliases = func.lower(func.array_to_string(Food.aliases, " | "))
        plain_name = func.trim(func.regexp_replace(name, "[^a-z0-9]+", " ", "g"))
        stemmed = " ".join(words)

        def prefix(w: str) -> str:
            return rf"\m{w}"

        def whole(w: str) -> str:
            return rf"\m{w}{PLURAL_SUFFIX}\M"

        exact = or_(
            Food.aliases.any(phrase), Food.aliases.any(stemmed),
            plain_name == phrase, plain_name == stemmed,
        )
        starts = or_(plain_name.startswith(phrase + " "),
                     name.op("~")(rf"^{words[0]}{PLURAL_SUFFIX}\M"))
        # "Rice, white, cooked" is rice; "Rice flour, white" is flour.
        head = r"\W+".join(f"{w}{PLURAL_SUFFIX}" for w in words)
        is_head = name.op("~")(rf"^{head}\s*(,|\(|$)")
        whole_words = sum(
            (case((or_(name.op("~")(whole(w)), aliases.op("~")(whole(w))), 40), else_=0)
             for w in words),
            literal(0),
        )
        score = (
            case((exact, 1000), else_=0)
            + case((Food.owner_user_id.is_not(None), 400), else_=0)
            + case((is_head, 150), else_=0)
            + case((starts, 100), else_=0)
            + whole_words
            + Food.search_weight * 4
            + func.similarity(name, phrase) * 100
            - func.length(Food.name)
        )
        stmt = self._visible()
        for w in words:
            stmt = stmt.where(or_(name.op("~")(prefix(w)), aliases.op("~")(prefix(w))))
        return stmt.order_by(score.desc(), func.length(Food.name), Food.name).limit(limit)

    def _fuzzy(self, phrase: str, limit: int):
        """Typos. `name %> phrase` is pg_trgm's word-similarity test at its
        default threshold (0.6) — the form the trigram index on `name` serves.
        Below that a hit is noise rather than a misspelling."""
        return (
            self._visible()
            .where(Food.name.op("%>")(phrase))
            .order_by(func.word_similarity(phrase, Food.name).desc(),
                      Food.search_weight.desc(), func.length(Food.name))
            .limit(limit)
        )
