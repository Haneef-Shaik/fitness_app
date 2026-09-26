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


#: A real Argon2 hash of nothing anyone knows, made once per process.
_DECOY = _ph.hash("fitlog-decoy-" + __name__)


def spend_like_a_password_check(raw: str) -> None:
    """Costs what `verify_password` costs, and always fails.

    Sign-in answers "email or password is incorrect" either way, but an unknown
    email used to answer without hashing anything — measurably faster, which
    told a caller which addresses have accounts. Hashing against a decoy makes
    both paths take the same time.
    """
    verify_password(raw, _DECOY)


def password_problem(raw: str) -> str | None:
    """Returns a fixable message, or None. Mirrors the client rule in docs/wireframes/01."""
    if len(raw) < 10:
        return "Use at least 10 characters."
    if raw.lower() in COMMON_PASSWORDS:
        return "That password is too common."
    return None


def create_access_token(user_id: uuid.UUID, family_id: uuid.UUID | None = None) -> str:
    """`sid` names the refresh-token family this access token was issued from.

    It is how "sign out other devices" (K-02) knows which device is asking
    without the client sending its refresh token: a refresh keeps the family,
    so every access token a device is ever given carries the same `sid`.
    """
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=_settings.access_token_ttl_minutes)).timestamp()),
        "typ": "access",
    }
    if family_id is not None:
        payload["sid"] = str(family_id)
    return jwt.encode(payload, _settings.jwt_secret, algorithm=_settings.jwt_algorithm)


def _access_claims(token: str) -> dict | None:
    try:
        payload = jwt.decode(
            token, _settings.jwt_secret, algorithms=[_settings.jwt_algorithm]
        )
    except jwt.PyJWTError:
        return None
    return payload if payload.get("typ") == "access" else None


def decode_access_token(token: str) -> uuid.UUID | None:
    payload = _access_claims(token)
    try:
        return uuid.UUID(payload["sub"]) if payload else None
    except (KeyError, ValueError, TypeError):
        return None


def access_token_family(token: str) -> uuid.UUID | None:
    """The refresh-token family behind an access token, or None.

    None for a token minted before `sid` existed; those expire within the
    access TTL, and a refresh mints one that has it.
    """
    payload = _access_claims(token)
    try:
        return uuid.UUID(payload["sid"]) if payload else None
    except (KeyError, ValueError, TypeError):
        return None


def new_refresh_token() -> tuple[str, str]:
    """Returns (raw, sha256). Only the hash is stored — a DB leak yields nothing usable."""
    raw = secrets.token_urlsafe(48)
    return raw, hashlib.sha256(raw.encode()).hexdigest()


def hash_refresh_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def new_link_token() -> tuple[str, str]:
    """Returns (raw, sha256) for an emailed single-use link (A-05, A-06, K-02).

    256 bits, because the same string is also the code a user pastes when a
    phone will not open the link — and the reset endpoint is not told whose
    account it is for, so a shorter, typeable code would be guessable across
    every outstanding reset at once.
    """
    raw = secrets.token_urlsafe(32)
    return raw, hash_link_token(raw)


def hash_link_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
