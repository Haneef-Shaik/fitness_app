"""The food resolver interface — **Q1's answer to "can we start?"**.

Q1 (which nutrition database provider) is still open, and it carries a
licensing attribution requirement that is a product decision rather than an
engineering one. It does not have to block this goal.

Everything above this line talks to `FoodResolver`. A provider becomes *one more
implementation*, not a rewrite — the same shape `app/seed/catalog.py` already
uses for exercises: a seeded internal source that works standalone.

**A provider's identifier is never the identity of a row.** `Food.external_ref`
holds it as an attribute, so swapping providers does not orphan a user's diary.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass(frozen=True, slots=True)
class FoodRef:
    """How to ask for one food.

    Either a row we already own, or a provider's reference we have not imported
    yet. Both are legitimate; only the first has an `id`.
    """

    id: uuid.UUID | None = None
    source: str = "internal"
    external_ref: str | None = None


@dataclass(frozen=True, slots=True)
class Candidate:
    """A search hit, before anyone commits to it.

    Deliberately NOT a `Food`: a provider hit has not been imported, and forcing
    it into the ORM shape would mean writing rows for every search result.
    """

    ref: FoodRef
    name: str
    brand: str | None
    calories: float | None
    protein_g: float | None
    carbs_g: float | None
    fat_g: float | None
    serving_grams: float | None = None
    serving_label: str | None = None
    #: Other names for the same food. The ladder needs them to tell an exact
    #: match ("chapati" is an alias of "Roti / Chapati") from a partial one.
    aliases: tuple[str, ...] = ()


@runtime_checkable
class FoodResolver(Protocol):
    """Two questions, and nothing else.

    A Protocol rather than a base class so a test double is a plain object with
    two methods — the point of the interface is that substituting it is easy
    enough that nobody reaches past it.
    """

    async def search(self, query: str, *, limit: int = 20) -> list[Candidate]:
        """Candidates matching `query`, best first. Empty is an answer."""
        ...

    async def resolve(self, ref: FoodRef) -> Candidate | None:
        """One candidate, or `None` when the reference no longer exists."""
        ...
