"""The real sender — Resend's HTTP API (https://resend.com/docs/api-reference).

One POST per message. What makes it production code rather than a snippet:

**A timeout on every call.** A provider that hangs must not hold a request, or
a background slot, until the process restarts.

**Errors that are safe to log.** `EmailUnavailable` names the status and
nothing else. The key, the address and the body — which holds a live link —
stay out of every exception and every log line.

The key comes from the environment and is validated at startup. It is never
logged, never returned in an envelope and never written to a database.
"""
from __future__ import annotations

import httpx

from app.email.base import EmailMessage, EmailUnavailable

API_URL = "https://api.resend.com/emails"


class ResendEmailSender:
    def __init__(
        self, *, api_key: str, sender: str, base_url: str = API_URL,
        timeout_seconds: float = 10.0, transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        if not api_key:
            raise RuntimeError("An email API key is required to use the Resend sender.")
        self._api_key = api_key
        self._sender = sender
        self._base_url = base_url
        self._timeout = timeout_seconds
        # Injected by the tests, which assert the request instead of sending it.
        self._transport = transport

    async def send(self, message: EmailMessage) -> None:
        try:
            async with httpx.AsyncClient(
                timeout=self._timeout, transport=self._transport
            ) as http:
                response = await http.post(
                    self._base_url,
                    headers={"authorization": f"Bearer {self._api_key}"},
                    json={
                        "from": self._sender,
                        "to": [message.to],
                        "subject": message.subject,
                        "text": message.text,
                    },
                )
        except httpx.HTTPError as exc:
            # The class name only: an httpx error's text can include the URL
            # and, for some transports, the request.
            raise EmailUnavailable(f"provider unreachable ({type(exc).__name__})") from None

        # 2xx only: a redirect (a proxy, a moved endpoint) is not a sent email.
        if not response.is_success:
            raise EmailUnavailable(f"provider returned {response.status_code}")
