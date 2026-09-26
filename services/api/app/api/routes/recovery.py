"""A-05 forgot / reset password, and A-06 verify email.

Both are "prove you hold the inbox" flows over one table (`account_tokens`), and
all but one are reachable without a session: a reset is for someone who cannot
sign in, and a verification link is often opened on a different device from the
one that asked for it. Resend is the exception — it acts on the signed-in
account.

**Verification never gates the product** (A-06). An unverified account logs,
reads, exports and signs in like any other; nothing outside this module and
`/auth/me` reads `email_verified_at`. A reset link goes to a verified and an
unverified address alike — refusing it would lock a person out of the account
they typed their address into at sign-up, and a typo there is already
unrecoverable either way. A-06's 7-day grace period, after which email-dependent
features lock, is deliberately NOT enforced: nothing is locked.

**Every handler that changes credentials commits before it answers.** The
session dependency commits only after the response has gone (FastAPI closes
request-scoped dependencies after sending), so "password reset" or "revoked: 2"
could otherwise be reported for a change a failed commit then threw away. The
same rule holds in `account_security.py` and for sign-out-others in `auth.py`.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, Request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.api.deps import CurrentUser, DbSession, Mailer, SessionFactory
from app.api.envelope import ok
from app.core.errors import LinkExpired, RateLimited, ValidationFailed
from app.core.ratelimit import account_at_address, enforce
from app.core.security import hash_password, password_problem
from app.email import messages
from app.email.base import EmailSender
from app.email.delivery import send_or_raise, send_quietly
from app.models import AccountToken, AccountTokenPurpose, User, UserStatus
from app.schemas.auth import (
    EmailVerifiedOut,
    ForgotPasswordIn,
    PasswordResetOut,
    RequestedOut,
    ResetPasswordIn,
    VerificationSentOut,
    VerifyEmailIn,
)
from app.schemas.envelope import Envelope
from app.services import account_tokens
from app.services.credentials import revoke_sessions

router = APIRouter(prefix="/auth", tags=["auth"])
log = logging.getLogger("fitlog.auth")

_EMAIL_LINKS = (AccountTokenPurpose.verify_email, AccountTokenPurpose.change_email)
TAKEN = "Another account now uses this email. Choose a different one."


def _usable(user: User | None) -> bool:
    return user is not None and user.deleted_at is None and user.status is UserStatus.active


async def _account_for(db: AsyncSession, link: AccountToken) -> User:
    """The account a spent link belongs to — if it may still be acted on.

    A link issued before the account was disabled or deleted is dead with it.
    """
    user = await db.scalar(select(User).where(User.id == link.user_id))
    if not _usable(user):
        raise LinkExpired()
    return user


@router.post("/password/forgot", response_model=Envelope[RequestedOut])
async def forgot_password(
    body: ForgotPasswordIn, request: Request, db: DbSession, sessions: SessionFactory,
    mailer: Mailer, background: BackgroundTasks,
):
    """Always the same 200 and the same body (A-05: existence is never disclosed).

    The handler does no work at all: the lookup, the new link and the mail all
    happen after the response, in `_send_reset_link`. So neither the answer nor
    its timing depends on whether the address has an account — a known one
    would otherwise take a delete, an insert and a commit longer to answer.
    """
    email = body.email.lower().strip()
    # Counted for every address alike, so a 429 says nothing about accounts.
    await enforce(db, request, "password_reset", account=account_at_address(request, email))
    await enforce(db, request, "password_reset_total", account=email, by_ip=False)
    background.add_task(_send_reset_link, sessions, mailer, email)
    return ok({"requested": True})


async def _send_reset_link(
    sessions: async_sessionmaker[AsyncSession], mailer: EmailSender, email: str
) -> None:
    """Only a live, active account is sent anything, at most once a minute — a
    second request inside the cooldown is dropped. Failures are logged by
    kind and never by address (02 §8)."""
    purpose = AccountTokenPurpose.password_reset
    try:
        async with sessions() as db:
            user = await db.scalar(select(User).where(User.email == email))
            if not _usable(user):
                return
            if await account_tokens.seconds_until_next(db, user.id, purpose) > 0:
                return
            token = await account_tokens.issue(db, user.id, purpose, user.email)
            await db.commit()  # the row exists before the link can arrive
    except SQLAlchemyError as exc:
        # The class only: a database error's text carries its bound parameters,
        # and one of them is the address (02 §8).
        log.error("password reset link not issued: %s", type(exc).__name__)
        return
    await send_quietly(mailer, messages.password_reset(user.email, token))


@router.post("/password/reset", response_model=Envelope[PasswordResetOut])
async def reset_password(body: ResetPasswordIn, request: Request, db: DbSession):
    """Sets the password and signs every device out (A-05).

    The link is checked first: an expired one needs a new email whatever the
    password, so it is the more useful thing to hear. A refused password raises
    after the link was spent, which rolls the spend back — the same link works
    on the next try.
    """
    await enforce(db, request, "password_reset")
    link = await account_tokens.redeem(db, body.token, (AccountTokenPurpose.password_reset,))
    user = await _account_for(db, link)
    # A link sent to an address the account has since left is not for this account.
    if user.email != link.email:
        raise LinkExpired()

    if (problem := password_problem(body.new_password)) is not None:
        raise ValidationFailed(problem, fields={"new_password": problem})

    user.password_hash = hash_password(body.new_password)
    # Opening the link proved the inbox, which is all verification proves.
    if user.email_verified_at is None:
        user.email_verified_at = link.used_at
    # People reset because someone else may have the password: every session
    # ends, this device's included — the app sends them to log in (A-05). A
    # pending email change dies too: if someone else asked for it, this reset
    # is the owner's answer, and the change link must not outlive it (K-02).
    await revoke_sessions(db, user.id)
    await account_tokens.revoke(
        db, user.id, AccountTokenPurpose.password_reset, AccountTokenPurpose.change_email
    )
    await db.commit()
    return ok({"password_reset": True})


@router.post("/email/verify", response_model=Envelope[EmailVerifiedOut])
async def verify_email(
    body: VerifyEmailIn, request: Request, db: DbSession, mailer: Mailer,
    background: BackgroundTasks,
):
    """Opens an A-06 link — or a K-02 change link, which moves the account.

    Needs no session: the link is often opened on another device, or after
    signing out, and the token is proof enough.
    """
    await enforce(db, request, "email_verify")
    link = await account_tokens.redeem(db, body.token, _EMAIL_LINKS)
    user = await _account_for(db, link)

    if link.purpose is AccountTokenPurpose.verify_email:
        # Sent to an address the account has since changed away from.
        if user.email != link.email:
            raise LinkExpired()
        user.email_verified_at = user.email_verified_at or link.used_at
        await db.commit()
        return ok({"email": user.email, "email_verified": True})

    # K-02: the change applies now, and only now the new inbox is proven.
    taken = await db.scalar(
        select(User.id).where(User.email == link.email, User.id != user.id)
    )
    if taken is not None:
        raise ValidationFailed(TAKEN, fields={"email": TAKEN})

    previous = user.email
    user.email = link.email
    user.email_verified_at = link.used_at
    try:
        # Flushed here so a sign-up that took the address a moment ago is a
        # sentence, not a unique-violation 500.
        await db.flush()
    except IntegrityError:
        raise ValidationFailed(TAKEN, fields={"email": TAKEN}) from None
    # Every link still out there was sent to the OLD inbox, or is this one.
    # Whoever reads that inbox next must not be able to reset this account.
    await account_tokens.revoke(db, user.id)
    # Committed before the old address is told, so the notice can never go
    # out for a change that did not land — see app/email/delivery.py.
    await db.commit()
    background.add_task(send_quietly, mailer, messages.email_changed(previous, user.email))
    return ok({"email": user.email, "email_verified": True})


@router.post("/email/resend", response_model=Envelope[VerificationSentOut])
async def resend_verification(user: CurrentUser, db: DbSession, mailer: Mailer):
    """A-06 "Resend link". Signed in, so a failure is allowed to say so."""
    if user.email_verified_at is not None:
        return ok({"sent": False, "email_verified": True})

    purpose = AccountTokenPurpose.verify_email
    if (wait := await account_tokens.seconds_until_next(db, user.id, purpose)) > 0:
        raise RateLimited(f"We just sent one. You can ask again in {wait} seconds.", retry_after=wait)

    token = await account_tokens.issue(db, user.id, purpose, user.email)
    # Inside the request: a failure rolls the new link (and its cooldown) back.
    await send_or_raise(mailer, messages.verify_email(user.email, token))
    await db.commit()
    return ok({"sent": True, "email_verified": False})
