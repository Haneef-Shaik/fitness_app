"""How a food query becomes search terms.

Shared by the resolver (which turns them into SQL) and its tests. Kept apart
from the ladder's `normalise`, which answers a different question: the ladder
strips *portion* words ("bowl", "slice") from what a model said; this strips
only grammar, because a person typing "cooked rice" into H-04 means "cooked".
"""
from __future__ import annotations

import re

_NON_WORD = re.compile(r"[^a-z0-9]+")

#: Words that carry no food. "a banana" is a banana.
STOPWORDS = frozenset({"a", "an", "the", "of", "with", "and", "in", "on", "for", "or"})

#: The plural endings a stem may take back when matched as a whole word, so
#: "egg" matches "Eggs" but not "Eggplant", and "berr" matches "berries".
PLURAL_SUFFIX = "(s|es|y|ies)?"


def normalise(text: str) -> str:
    """Lowercase alphanumerics, single-spaced — the form aliases are stored in."""
    return " ".join(_NON_WORD.sub(" ", text.lower()).split())


def stem(word: str) -> str:
    """A plural-insensitive prefix: "eggs" → "egg", "berries" → "berr",
    "tomatoes" → "tomato". Deliberately crude: it only has to make a word and
    its plural share a prefix, and a prefix match does the rest."""
    if len(word) > 4 and word.endswith("ies"):
        return word[:-3]
    if len(word) > 4 and word.endswith("oes"):
        return word[:-2]
    if len(word) > 4 and word.endswith(("ches", "shes", "xes", "zes")):
        return word[:-2]
    if len(word) > 3 and word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word


def terms(query: str) -> list[str]:
    """The words a query must match, stemmed, in order, without repeats.

    One-letter tokens are dropped: "nani's" leaves a stray "s", and a word
    that short matches most of the catalog.
    """
    seen: dict[str, None] = {}
    for word in normalise(query).split():
        if len(word) < 2 or word in STOPWORDS:
            continue
        seen.setdefault(stem(word), None)
    return list(seen)
