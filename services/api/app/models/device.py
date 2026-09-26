"""Push tokens — where to tell a user their meal estimate is ready.

One row per device token. A token moves with the device, not the account: if
someone signs in as another person on the same phone, the token is reassigned,
so the first account's notifications stop arriving on a phone they left.
"""
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.user import TimestampMixin


class PushToken(Base, TimestampMixin):
    __tablename__ = "push_tokens"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    platform: Mapped[str] = mapped_column(String(16), nullable=False)   # ios|android
    #: The Supabase sign-in (`session_id`) that registered it. A token whose
    #: sign-in has ended — signed out, "sign out other devices", the account
    #: deleted — is never sent to, and is removed when found (app/notify/push.py),
    #: so a phone that is no longer signed in stops hearing about the account.
    session_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), index=True)
