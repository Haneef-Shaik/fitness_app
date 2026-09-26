"""Which catalog rows a user may use.

The global catalog (no owner) and their own custom exercises — never another
user's. Before G11 a session or plan could reference someone else's custom
exercise by id; the reference then blocked that user's account deletion (the
FK is RESTRICT), and the response carried their exercise's name.
"""
from __future__ import annotations

from sqlalchemy import or_

from app.models import Exercise, User


def visible_to(user: User):
    return or_(Exercise.owner_user_id.is_(None), Exercise.owner_user_id == user.id)
