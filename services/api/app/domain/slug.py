"""Slugs.

A slug is an **identity**, which is why it is generated once and then left
alone. Renaming "Lunch" to "Midday" changes a label; regenerating the slug would
orphan every lunch ever logged, because meals reference the slug (H-16).
"""
from __future__ import annotations

import re
import unicodedata

_NON_SLUG = re.compile(r"[^a-z0-9]+")


def slugify(value: str, *, max_length: int = 40) -> str:
    """Lowercase, ASCII, hyphen-separated.

    "Pre-workout", "Pre workout" and "PRE  WORKOUT" all collapse to the same
    slug on purpose — they are the same category, and letting them coexist is
    how a diary ends up with two half-filled "pre workout" rows.
    """
    ascii_only = (
        unicodedata.normalize("NFKD", value)
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    slug = _NON_SLUG.sub("-", ascii_only.lower()).strip("-")
    return slug[:max_length].strip("-")
