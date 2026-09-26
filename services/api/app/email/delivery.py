"""Sending now or sending later — and what a failed send is allowed to mean.

Two callers want opposite things from a failure:

* **Later, quietly** — A-05's anonymous "forgot password" and the verification
  mail at sign-up. The request has already been answered: for the reset, the
  answer must not depend on whether an account exists, so neither may its
  timing or its failure; for sign-up, the account exists whether or not the mail
  went. The failure is logged and goes no further.
* **Now, loudly** — a signed-in resend or email change. There is nothing to
  enumerate, and "sent" when nothing was is a lie the user acts on, so the
  failure becomes `EmailNotSent` and rolls the new link back with it.

Either way the log line names the kind of mail and the provider's reason — never
the address and never the body, which holds a live link (02 §8).

**Commit before queueing a later send.** FastAPI runs background tasks before it
closes the request's dependencies, so the session's own commit comes *after*
the send. Left to it, the transaction — and a pooled connection — would stay
open for the length of a provider call, and a link could arrive before its row
exists. The routes that send later commit first.
"""
from __future__ import annotations

import logging

from app.core.errors import EmailNotSent
from app.email.base import EmailMessage, EmailSender, EmailUnavailable

log = logging.getLogger("fitlog.email")


async def send_quietly(sender: EmailSender, message: EmailMessage) -> None:
    """For a background task, after the response has gone."""
    try:
        await sender.send(message)
    except EmailUnavailable as exc:
        log.error("email not sent (kind=%s): %s", message.kind, exc)


async def send_or_raise(sender: EmailSender, message: EmailMessage) -> None:
    """Inside the request, so the caller hears about a failure."""
    try:
        await sender.send(message)
    except EmailUnavailable as exc:
        log.error("email not sent (kind=%s): %s", message.kind, exc)
        raise EmailNotSent() from None
