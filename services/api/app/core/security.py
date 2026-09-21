from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.config import get_settings

_ph = PasswordHasher()
_settings = get_settings()

COMMON_PASSWORDS = {
    "password", "password1", "12345678", "123456789", "qwertyuiop",
    "letmein123", "iloveyou1", "admin12345", "welcome123", "passw0rd",
}


def hash_password(raw: str) -> str:
    return _ph.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    try:
        _ph.verify(hashed, raw)
        return True
    except VerifyMismatchError:
        return False


def password_problem(raw: str) -> str | None:
    """Returns a fixable message, or None. Mirrors the client rule in docs/wireframes/01."""
    if len(raw) < 10:
        return "Use at least 10 characters."
    if raw.lower() in COMMON_PASSWORDS:
        return "That password is too common."
    return None


def create_access_token(user_id: uuid.UUID) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=_settings.access_token_ttl_minutes)).timestamp()),
        "typ": "access",
    }
    return jwt.encode(payload, _settings.jwt_secret, algorithm=_settings.jwt_algorithm)


def decode_access_token(token: str) -> uuid.UUID | None:
    try:
        payload = jwt.decode(
            token, _settings.jwt_secret, algorithms=[_settings.jwt_algorithm]
        )
        if payload.get("typ") != "access":
            return None
        return uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def new_refresh_token() -> tuple[str, str]:
    """Returns (raw, sha256). Only the hash is stored — a DB leak yields nothing usable."""
    raw = secrets.token_urlsafe(48)
    return raw, hashlib.sha256(raw.encode()).hexdigest()


def hash_refresh_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
