"""The sender with no provider: an outbox in memory.

The default, and what the suite uses. A test follows the link out of the
message the same way a user would, rather than reading a token out of the
database — where only its hash is.

In development it also echoes each message to the log, which is the only way a
developer with no mail provider can open a reset link. `echo` is off in every
other environment — belt and braces in production, which refuses to start on
this sender at all (`config.validate_settings`).
"""
from __future__ import annotations

import logging
from collections import deque

from app.email.base import EmailMessage

log = logging.getLogger("fitlog.email")


class ConsoleEmailSender:
    def __init__(self, *, echo: bool = True, keep: int = 100) -> None:
        self._echo = echo
        # Bounded: a development server left running for a week must not keep
        # every message it ever "sent".
        self._outbox: deque[EmailMessage] = deque(maxlen=keep)

    @property
    def messages(self) -> list[EmailMessage]:
        """Oldest first. A copy, so a reader cannot rewrite what was sent."""
        return list(self._outbox)

    def to(self, address: str) -> list[EmailMessage]:
        return [m for m in self._outbox if m.to == address]

    async def send(self, message: EmailMessage) -> None:
        self._outbox.append(message)
        if self._echo:
            # WARNING, not INFO: the API configures no logging, so under uvicorn
            # only warnings reach the terminal — and a development link nobody
            # can see is no link. It is also true: nothing was really sent.
            log.warning(
                "email (%s) to %s, NOT SENT (console provider): %s\n%s",
                message.kind, message.to, message.subject, message.text,
            )
