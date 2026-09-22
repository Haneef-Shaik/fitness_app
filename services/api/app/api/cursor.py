"""The cursor convention (**H5.1**). Every list endpoint after G5 copies this.

**Keyset, not offset.** History grows at the end a user reads from. `?offset=20`
means "skip 20 rows", so a session logged between page 1 and page 2 pushes the
boundary row down and the reader sees it twice; a deletion makes them miss one.
A keyset cursor names *where the last page stopped*, which neither insert nor
delete can move.

**The key is a pair, `(started_at, id)`.** `started_at` alone is not unique —
two sessions can start in the same second, and a cursor on time alone either
repeats them or skips them depending on which way the comparison leans. `id`
breaks the tie, and is stable.

**Opaque to the client.** It goes out as base64 and comes back unread. That is
what allows the key to change later — add a column, switch the sort — without a
client that parsed it silently breaking. Clients must never construct one, so an
unparseable cursor is a 422 rather than a silent rewind to the first page: a
"pagination quietly restarted" bug is very hard to see and produces duplicates
for ever.
"""
from __future__ import annotations

import base64
import binascii
import json
import uuid
from datetime import datetime

from app.core.errors import ValidationFailed

# Not secrecy — the client simply has no business reading it.
_ENCODING = "utf-8"


def encode_cursor(started_at: datetime, row_id: uuid.UUID) -> str:
    raw = json.dumps({"t": started_at.isoformat(), "i": str(row_id)}).encode(_ENCODING)
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def decode_cursor(cursor: str) -> tuple[datetime, uuid.UUID]:
    """Returns the `(started_at, id)` the last page stopped at.

    Raises `ValidationFailed` for anything this service did not issue. Treating a
    bad cursor as "start from the beginning" would turn a client bug into an
    infinite, duplicate-producing loop that looks like working pagination.
    """
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded).decode(_ENCODING))
        return datetime.fromisoformat(payload["t"]), uuid.UUID(payload["i"])
    except (
        binascii.Error, UnicodeDecodeError, json.JSONDecodeError,
        KeyError, TypeError, ValueError,
    ) as exc:
        raise ValidationFailed(
            "That page link is no longer valid. Start from the beginning.",
            fields={"cursor": "unreadable"},
        ) from exc
