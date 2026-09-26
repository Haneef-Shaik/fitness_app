"""Signed, expiring upload URLs.

The signature covers the **key, the content type, the byte size and the owner**,
not just the key. Signing the key alone would let a caller re-point a valid
signature at a different object, or send a 40 MB file through a URL issued for a
thumbnail.

A **read** signature is a different payload from an upload one, so a URL issued
to GET a photo can never be replayed as a PUT that overwrites it, and the other
way round.

`_now` is a module-level function on purpose: a test that needs an expired
signature moves the clock rather than sleeping through the TTL.
"""
from __future__ import annotations

import base64
import hmac
import re
import time
import uuid
from hashlib import sha256

DEFAULT_TTL_SECONDS = 600


def _now() -> int:
    return int(time.time())


def new_key(user_id: uuid.UUID, extension: str) -> str:
    """A key nobody can guess and nobody else can collide with."""
    return f"uploads/{user_id}/{uuid.uuid4().hex}{extension}"


#: Exactly what `new_key` makes, and nothing else — no `..`, no sub-folders.
_OWN_KEY = re.compile(r"uploads/(?P<owner>[0-9a-f-]{36})/[0-9a-f]{32}\.(jpg|png)")


def is_own_key(key: str, user_id: uuid.UUID) -> bool:
    """Whether `key` is one the server could have issued to `user_id`.

    "Starts with uploads/<you>/" is not enough: `uploads/<you>/../<them>/…`
    starts with that too, and the store confines a key to its root, not to its
    owner's folder. Checked wherever a client hands a key back (launch review).
    """
    match = _OWN_KEY.fullmatch(key)
    return match is not None and match["owner"] == str(user_id)


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


def _read_payload(key: str, expires: int) -> bytes:
    # Starts with the verb: an upload payload starts with the key, which is
    # always `uploads/…`, so the two can never produce the same bytes.
    return f"GET\n{key}\n{expires}".encode()


def sign_read(
    *, key: str, secret: str, ttl_seconds: int = DEFAULT_TTL_SECONDS
) -> tuple[str, int]:
    expires = _now() + ttl_seconds
    return _digest(secret, _read_payload(key, expires)), expires


def verify_read(*, key: str, secret: str, expires: int, signature: str) -> bool:
    if _now() > expires:
        return False
    return hmac.compare_digest(_digest(secret, _read_payload(key, expires)), signature)


def _digest(secret: str, payload: bytes) -> str:
    digest = hmac.new(secret.encode(), payload, sha256).digest()
    return base64.urlsafe_b64encode(digest).decode().rstrip("=")


def _sign_at(
    *, key: str, content_type: str, byte_size: int, user_id: uuid.UUID,
    secret: str, expires: int,
) -> tuple[str, int]:
    return _digest(secret, _payload(key, content_type, byte_size, user_id, expires)), expires
