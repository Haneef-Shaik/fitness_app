"""Push notifications through Expo's push service (launch plan, phase 6).

Only one message is sent today: a photo's meal estimate is ready (or could not
be made). A photo analysis takes seconds to tens of seconds, and H-07 lets the
user leave while it runs — without this, the result waited unseen.

Off unless configured (`PUSH_PROVIDER=expo`), like every paid or external
service here. A push that fails is logged and forgotten: it is a courtesy, and
nothing about the analysis depends on it (I14 in spirit — the notification can
fail without the thing it announces failing).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Protocol

import httpx

from app.config import get_settings

log = logging.getLogger("fitlog.push")

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


@dataclass(frozen=True, slots=True)
class PushMessage:
    token: str
    title: str
    body: str
    data: dict = field(default_factory=dict)


class PushSender(Protocol):
    async def send(self, messages: list[PushMessage]) -> list[str]:
        """Sends; returns the tokens the service says are no longer registered."""
        ...


class NullPushSender:
    async def send(self, messages: list[PushMessage]) -> list[str]:
        return []


class RecordingPushSender:
    """For the suite: remembers what would have been sent."""

    def __init__(self, dead: set[str] | None = None) -> None:
        self.sent: list[PushMessage] = []
        self._dead = dead or set()

    async def send(self, messages: list[PushMessage]) -> list[str]:
        self.sent.extend(messages)
        return [m.token for m in messages if m.token in self._dead]


class ExpoPushSender:
    def __init__(self, access_token: str = "", timeout: float = 10.0) -> None:
        self._headers = {"accept": "application/json", "content-type": "application/json"}
        if access_token:
            self._headers["authorization"] = f"Bearer {access_token}"
        self._timeout = timeout

    async def send(self, messages: list[PushMessage]) -> list[str]:
        if not messages:
            return []
        payload = [
            {"to": m.token, "title": m.title, "body": m.body, "data": m.data, "sound": "default"}
            for m in messages
        ]
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                res = await client.post(EXPO_PUSH_URL, json=payload, headers=self._headers)
            tickets = res.json().get("data", [])
        except (httpx.HTTPError, ValueError) as exc:
            log.warning("push send failed: %s", exc)
            return []
        dead = []
        for message, ticket in zip(messages, tickets, strict=False):
            if ticket.get("status") == "error":
                if (ticket.get("details") or {}).get("error") == "DeviceNotRegistered":
                    dead.append(message.token)
                else:
                    log.warning("push rejected: %s", ticket.get("message"))
        return dead


def get_push_sender() -> PushSender:
    s = get_settings()
    if s.push_provider == "expo":
        return ExpoPushSender(s.expo_access_token)
    return NullPushSender()
