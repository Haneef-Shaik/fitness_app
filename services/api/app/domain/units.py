"""Canonical in, canonical out. Conversion happens at the presentation edge only."""
from __future__ import annotations

KG_PER_LB = 0.45359237   # exact by definition
CM_PER_IN = 2.54         # exact by definition


def kg_to_lb(kg: float) -> float:
    return kg / KG_PER_LB


def lb_to_kg(lb: float) -> float:
    return lb * KG_PER_LB


def cm_to_in(cm: float) -> float:
    return cm / CM_PER_IN


def in_to_cm(inches: float) -> float:
    return inches * CM_PER_IN
