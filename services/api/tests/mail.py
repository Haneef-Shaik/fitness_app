"""Reading links out of a test's outbox (A-05, A-06, K-02).

Shared by the recovery, verification and account-security tests, which all
follow an emailed link the way a user would.
"""
from __future__ import annotations

import re
import uuid

from app.email.base import EmailMessage

PASSWORD = "correct-horse-battery"


def fresh_email(prefix: str = "user") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}@example.com"


def first_mail(outbox, to: str, kind: str) -> EmailMessage:
    """The first message of one kind sent to one address."""
    return next(m for m in outbox.to(to) if m.kind == kind)


def link_token(message: EmailMessage, route: str) -> str:
    """The token in the message's `fitlog://<route>?token=…` link."""
    match = re.search(rf"fitlog://{route}\?token=([A-Za-z0-9_-]+)", message.text)
    assert match, f"no {route} link in: {message.text}"
    return match.group(1)


async def register(client, email: str, password: str = PASSWORD) -> dict:
    r = await client.post("/v1/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.text
    return r.json()["data"]


def bearer(tokens: dict) -> dict[str, str]:
    return {"authorization": f"Bearer {tokens['access_token']}"}
