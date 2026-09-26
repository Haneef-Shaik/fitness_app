"""Sending email, behind an interface (A-05, A-06, K-02).

The `ObjectStore` and `AIGateway` pattern again, for the same reasons: the
provider is a runtime dependency, the suite must never reach the network, and
swapping one provider for another should not reach above `provider.py`.

**A message body is a secret.** A reset link is a password for thirty minutes
and a verification link proves an inbox. So a sender never logs a body, an
address or a key outside development, and `EmailUnavailable` carries a status,
never the request that caused it — a caller is free to log it.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


class EmailUnavailable(Exception):
    """The provider could not be reached, or refused the message."""


@dataclass(frozen=True, slots=True)
class EmailMessage:
    to: str
    subject: str
    #: Plain text only. It renders everywhere, a link in it is still a link, and
    #: there is no HTML template to drift from what the text says.
    text: str
    #: What the mail is for — `password_reset`, `verify_email`… Safe to log,
    #: which is the point: it is how a failed send is traced without the body.
    kind: str


class EmailSender(Protocol):
    async def send(self, message: EmailMessage) -> None: ...
