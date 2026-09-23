"""The food resolution ladder (02 §5.2).

A model says "2 eggs". The catalog says "Whole Egg". Something has to get from
one to the other, and that something is **not** the resolver: the resolver
searches a catalog, and asking it to also understand "a bowl of" would tie the
interface to the shape of model output.

So the ladder lives here, above the interface and below the worker, and it
climbs down in decreasing confidence:

  1. the detected name, as given
  2. the name with quantities and filler words removed  ("2 eggs" → "eggs")
  3. its singular form                                   ("eggs"  → "egg")
  4. each remaining word on its own, longest first        ("chicken curry" → "chicken")

**Step 5 is deliberately "give up".** An unresolved item keeps the model's own
macros and is flagged in the UI, which is what makes home-cooked and regional
food loggable at all. A wrong match is worse than no match: it silently
substitutes somebody else's recipe for the one that was eaten.
"""
from __future__ import annotations

import re
import uuid
from typing import Protocol

#: Words that describe a portion rather than a food.
_FILLER = frozenset({
    "a", "an", "the", "of", "some", "with", "and", "my",
    "bowl", "plate", "cup", "glass", "piece", "pieces", "slice", "slices",
    "serving", "servings", "scoop", "scoops", "portion", "portions",
    "small", "medium", "large", "half", "whole", "fresh", "cooked", "raw",
    "homemade", "home", "made",
})

_QUANTITY = re.compile(r"\b\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|lb)?\b", re.IGNORECASE)
_NON_WORD = re.compile(r"[^a-z0-9\s]+")

#: A rung this short stops being a search and starts being a wildcard.
MIN_RUNG_LENGTH = 3


class _Searchable(Protocol):
    async def search(self, query: str, *, limit: int = 20) -> list: ...


def normalise(name: str) -> str:
    """Lowercase, no punctuation, no quantities, no filler."""
    stripped = _QUANTITY.sub(" ", name.lower())
    stripped = _NON_WORD.sub(" ", stripped)
    words = [w for w in stripped.split() if w and w not in _FILLER]
    return " ".join(words)


def _singular(word: str) -> str:
    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"
    if word.endswith("es") and len(word) > 3 and word[-3] in "sxzh":
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        return word[:-1]
    return word


def candidate_queries(detected_name: str) -> list[str]:
    """The ladder's rungs, in order, with no duplicates and nothing empty."""
    rungs: list[str] = [detected_name.strip()]

    normalised = normalise(detected_name)
    rungs.append(normalised)

    words = normalised.split()
    singular = " ".join(_singular(w) for w in words)
    rungs.append(singular)

    # Then each word on its own, longest first — the longest word is usually
    # the most specific one. Tried in order rather than picked, because
    # "Chicken Breast, skinless" makes "skinless" the longest and "chicken" the
    # one that matters.
    if len(words) > 1:
        rungs.extend(sorted((_singular(w) for w in words), key=len, reverse=True))

    seen: set[str] = set()
    # Anything shorter than this is match-hungry rather than specific: a rung of
    # "s" matches most of the catalog through a LIKE, and would resolve
    # "Nani's Sunday curry" to whatever happened to sort first.
    return [
        r for r in rungs
        if len(r) >= MIN_RUNG_LENGTH and not (r in seen or seen.add(r))
    ]


async def resolve_detected_name(resolver: _Searchable, detected_name: str) -> uuid.UUID | None:
    """The best canonical food for a detected name, or `None` for step 5."""
    for query in candidate_queries(detected_name):
        matches = await resolver.search(query, limit=5)
        if not matches:
            continue
        best = _best(matches, query)
        if best is not None:
            return best.ref.id
    return None


def _best(matches: list, query: str):
    """Prefer an exact normalised match; otherwise the shortest name.

    Shortest is a proxy for "least qualified": searching "egg" against
    "Whole Egg" and "Egg Noodles, dried" should land on the egg.
    """
    target = normalise(query)
    for candidate in matches:
        if normalise(candidate.name) == target:
            return candidate
    return min(matches, key=lambda c: len(c.name))
