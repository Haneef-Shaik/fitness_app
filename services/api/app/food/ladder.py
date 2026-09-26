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
  4. each remaining word on its own, longest first        ("egg bhurji" → "egg")

**Step 5 is deliberately "give up".** An unresolved item keeps the model's own
macros and is flagged in the UI, which is what makes home-cooked and regional
food loggable at all. A wrong match is worse than no match: it silently
substitutes somebody else's recipe for the one that was eaten.

**What a rung accepts** tightened when the catalog grew from 22 foods to
~8,000. With 22, anything a search returned was probably right; with 8,000,
"curry" also finds curry powder. So:

- rungs 1–3 take the resolver's best hit only if it contains every word of
  the rung (the resolver answers a typo with a fuzzy guess — fine for a
  person choosing from a list, not for an unattended match);
- step 4 takes a lone word only when it IS a food's name or alias
  ("naan" → Naan), never when it merely appears in one ("curry" → Curry
  powder). That is what keeps "Nani's Sunday curry" unresolved.

An exact name or alias match always beats the resolver's own ordering.

**A restaurant's menu item is never a loose match.** USDA carries fast-food and
restaurant rows ("McDONALD'S, Side Salad"), and "a side salad" covers every word
of one. Logging it would file somebody's own salad as a McDonald's one, so a
menu item is taken only when the name says so exactly ("McDonald's side salad").
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

#: Food groups that are a restaurant's menu, not a food (USDA's own groups).
MENU_CATEGORIES = frozenset({"Fast Foods", "Restaurant Foods"})

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


def _rungs(detected_name: str) -> list[tuple[str, bool]]:
    """(query, is_single_word_fallback), in order, deduplicated, none too short."""
    rungs: list[tuple[str, bool]] = [(detected_name.strip(), False)]

    normalised = normalise(detected_name)
    rungs.append((normalised, False))

    words = normalised.split()
    rungs.append((" ".join(_singular(w) for w in words), False))

    # Then each word on its own, longest first — the longest word is usually
    # the most specific one. Tried in order rather than picked, because
    # "Chicken Breast, skinless" makes "skinless" the longest and "chicken" the
    # one that matters.
    if len(words) > 1:
        singles = sorted((_singular(w) for w in words), key=len, reverse=True)
        rungs.extend((w, True) for w in singles)

    seen: set[str] = set()
    # Anything shorter than this is match-hungry rather than specific: a rung of
    # "s" matches most of the catalog through a LIKE, and would resolve
    # "Nani's Sunday curry" to whatever happened to sort first.
    return [
        (r, fallback) for r, fallback in rungs
        if len(r) >= MIN_RUNG_LENGTH and not (r in seen or seen.add(r))
    ]


def candidate_queries(detected_name: str) -> list[str]:
    """The ladder's rungs, in order, with no duplicates and nothing empty."""
    return [query for query, _ in _rungs(detected_name)]


async def resolve_detected_name(resolver: _Searchable, detected_name: str) -> uuid.UUID | None:
    """The best canonical food for a detected name, or `None` for step 5."""
    for query, word_fallback in _rungs(detected_name):
        matches = await resolver.search(query, limit=5)
        if not matches:
            continue
        best = _best(matches, query, exact_only=word_fallback)
        if best is not None:
            return best.ref.id
    return None


def _forms(text: str) -> set[str]:
    """A name as the ladder compares it: normalised, and its singular."""
    plain = normalise(text)
    return {plain, " ".join(_singular(w) for w in plain.split())} - {""}


def _names(candidate) -> set[str]:
    """Every form of the candidate's name and of its aliases."""
    forms = _forms(candidate.name)
    for alias in getattr(candidate, "aliases", ()) or ():
        forms |= _forms(alias)
    return forms


def _covers(candidate, query: str) -> bool:
    """Every word of the rung starts some word of the candidate's names."""
    words = {w for form in _names(candidate) for w in form.split()}
    wanted = [_singular(w) for w in normalise(query).split()]
    return bool(wanted) and all(any(w.startswith(q) for w in words) for q in wanted)


def _best(matches: list, query: str, *, exact_only: bool = False):
    """An exact normalised name or alias match first; otherwise the resolver's
    best hit that covers the query — unless only an exact match will do.

    Exact-first is what makes "2 eggs" land on "Whole Egg": "whole" is
    filler, so that food IS the query, whatever else merely mentions eggs.
    """
    target = _forms(query)
    for candidate in matches:
        if target & _names(candidate):
            return candidate
    if exact_only:
        return None
    return next(
        (c for c in matches
         if _covers(c, query) and getattr(c, "category", None) not in MENU_CATEGORIES),
        None,
    )
