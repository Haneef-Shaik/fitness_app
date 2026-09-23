"""Signed, expiring upload URLs.

The signature covers the **key, the content type, the byte size and the owner**,
not just the key. Signing the key alone would let a caller re-point a valid
signature at a different object, or send a 40 MB file through a URL issued for a
thumbnail.

`_now` is a module-level function on purpose: a test that needs an expired
signature moves the clock rather than sleeping through the TTL.
"""
from __future__ import annotations

import base64
import hmac
import time
import uuid
from hashlib import sha256

DEFAULT_TTL_SECONDS = 600


def _now() -> int:
    return int(time.time())


def new_key(user_id: uuid.UUID, extension: str) -> str:
    """A key nobody can guess and nobody else can collide with."""
    return f"uploads/{user_id}/{uuid.uuid4().hex}{extension}"


def _payload(key: str, content_type: str, byte_size: int, user_id: uuid.UUID, expires: int) -> bytes:
    return f"{key}\n{content_type}\n{byte_size}\n{user_id}\n{expires}".encode()


def sign(
    *, key: str, content_type: str, byte_size: int, user_id: uuid.UUID,
    secret: str, ttl_seconds: int = DEFAULT_TTL_SECONDS,
) -> tuple[str, int]:
    return _sign_at(
        key=key, content_type=content_type, byte_size=byte_size,
        user_id=user_id, secret=secret, expires=_now() + ttl_seconds,
    )


def verify(
    *, key: str, content_type: str, byte_size: int, user_id: uuid.UUID,
    secret: str, expires: int, signature: str,
) -> bool:
    if _now() > expires:
        return False
    expected, _ = _sign_at(
        key=key, content_type=content_type, byte_size=byte_size,
        user_id=user_id, secret=secret, expires=expires,
    )
    # Constant time: a leaky comparison here is a forgeable signature.
    return hmac.compare_digest(expected, signature)


def _sign_at(
    *, key: str, content_type: str, byte_size: int, user_id: uuid.UUID,
    secret: str, expires: int,
) -> tuple[str, int]:
    digest = hmac.new(
        secret.encode(), _payload(key, content_type, byte_size, user_id, expires), sha256
    ).digest()
    return base64.urlsafe_b64encode(digest).decode().rstrip("="), expires
