from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter
from sqlalchemy import select, update

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.config import get_settings
from app.core.errors import Unauthorized, ValidationFailed
from app.core.security import (
    create_access_token,
    hash_password,
    hash_refresh_token,
    new_refresh_token,
    password_problem,
    verify_password,
)
from app.models import RefreshToken, User, UserProfile, UserStatus
from app.schemas.auth import LoginIn, RefreshIn, RegisterIn

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


async def _issue_tokens(db: DbSession, user: User, family_id: uuid.UUID | None = None) -> dict:
    raw, token_hash = new_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            family_id=family_id or uuid.uuid4(),
            expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_ttl_days),
        )
    )
    await db.flush()
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": raw,
        "token_type": "Bearer",
        "expires_in": settings.access_token_ttl_minutes * 60,
    }


@router.post("/register", status_code=201)
async def register(body: RegisterIn, db: DbSession):
    if (problem := password_problem(body.password)) is not None:
        raise ValidationFailed(problem, fields={"password": problem})

    email = body.email.lower().strip()
    if await db.scalar(select(User).where(User.email == email)):
        raise ValidationFailed(
            "An account already uses this email. Log in instead.",
            fields={"email": "Already registered."},
        )

    user = User(email=email, password_hash=hash_password(body.password))
    db.add(user)
    await db.flush()
    # Profile is created up front so onboarding always has a row to PATCH.
    db.add(UserProfile(user_id=user.id, display_name=body.display_name))
    await db.flush()

    tokens = await _issue_tokens(db, user)
    return ok({"user": {"id": str(user.id), "email": user.email}, **tokens}, status_code=201)


@router.post("/login")
async def login(body: LoginIn, db: DbSession):
    email = body.email.lower().strip()
    user = await db.scalar(select(User).where(User.email == email))
    # Same response whether the account exists or the password is wrong — no enumeration.
    if user is None or user.deleted_at is not None or not verify_password(
        body.password, user.password_hash
    ):
        raise Unauthorized("Email or password is incorrect.")
    if user.status is not UserStatus.active:
        raise Unauthorized("This account is disabled.")

    tokens = await _issue_tokens(db, user)
    return ok({"user": {"id": str(user.id), "email": user.email}, **tokens})


@router.post("/refresh")
async def refresh(body: RefreshIn, db: DbSession):
    token_hash = hash_refresh_token(body.refresh_token)
    row = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if row is None:
        raise Unauthorized("That session has expired.")

    now = datetime.now(UTC)

    # Reuse detection: a revoked token being presented again means it leaked.
    # Revoke the whole family rather than just this token (BRD §18).
    if row.revoked_at is not None:
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == row.family_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        # MUST commit before raising: the session dependency rolls back on exception,
        # which would silently discard the revocation and leave the leaked family alive.
        await db.commit()
        raise Unauthorized("You were signed out for security.")

    if row.expires_at <= now:
        raise Unauthorized("That session has expired.")

    row.revoked_at = now  # rotate
    user = await db.scalar(select(User).where(User.id == row.user_id))
    if user is None or user.deleted_at is not None:
        raise Unauthorized()

    tokens = await _issue_tokens(db, user, family_id=row.family_id)
    return ok(tokens)


@router.post("/logout")
async def logout(body: RefreshIn, db: DbSession):
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == hash_refresh_token(body.refresh_token))
        .values(revoked_at=datetime.now(UTC))
    )
    return ok({"signed_out": True})


@router.get("/me")
async def me(user: CurrentUser):
    return ok({"id": str(user.id), "email": user.email, "status": user.status.value})
