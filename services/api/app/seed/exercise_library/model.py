"""The shape of one library entry. Separate from `__init__` so the data
modules can import it without importing each other."""
from __future__ import annotations

from dataclasses import dataclass

from app.models import Equipment

TRACKABLE = frozenset({"load", "reps", "duration", "distance"})


@dataclass(frozen=True, slots=True)
class ExerciseSeed:
    name: str
    equipment: Equipment
    pattern: str
    primary: tuple[str, ...]
    secondary: tuple[str, ...] = ()
    aliases: tuple[str, ...] = ()
    tracks: str = "load reps"
    instructions: str = ""

    @property
    def tracked(self) -> frozenset[str]:
        return frozenset(self.tracks.split())
