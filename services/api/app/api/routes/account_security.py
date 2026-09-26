"""K-02 · Account & security — change password, change email.

Both are reachable with a stolen *session*, so both ask again for the one thing a
stolen session does not carry: the current password. A wrong one is a 422 on
the field, not a 401 — the app treats a 401 as an expired session and would
refresh and retry a typo.

"Sign out other devices" lives with the other session routes in `auth.py`.
"""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Request
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, Mailer
from app.api.envelope import ok
from app.core.errors import RateLimited, ValidationFailed
from app.core.ratelimit import enforce
from app.core.security import hash_password, password_problem, verify_password
from app.email import messages
from app.email.delivery import send_or_raise, send_quietly
from app.models import AccountTokenPurpose, User
from app.schemas.auth import ChangeEmailIn, ChangePasswordIn, EmailChangeOut, TokenPair
from app.schemas.envelope import Envelope
from app.services import account_tokens
from app.services.credentials import issue_token_pair, revoke_sessions

router = APIRouter(prefix="/account", tags=["account"])

WRONG_PASSWORD = "That password is not right."


@router.post("/password", response_model=Envelope[TokenPair])
async def change_password(
    body: ChangePasswordIn, request: Request, user: CurrentUser, db: DbSession,
):
    """Signs every other device out and keeps this one, with a fresh pair.

    Every family is revoked — this device's too — and the caller gets a pair in
    a new family. That keeps the caller signed in without the server having to
    know which refresh token is theirs, and leaves nothing from before the
    change alive anywhere.
    """
    # A place to guess the password from a stolen session: limited like one.
    await enforce(db, request, "reauth", account=str(user.id))
    if not verify_password(body.current_password, user.password_hash):
        raise ValidationFailed(WRONG_PASSWORD, fields={"current_password": WRONG_PASSWORD})
    if (problem := password_problem(body.new_password)) is not None:
        raise ValidationFailed(problem, fields={"new_password": problem})
    if verify_password(body.new_password, user.password_hash):
        same = "That is your current password. Choose a new one."
        raise ValidationFailed(same, fields={"new_password": same})

    user.password_hash = hash_password(body.new_password)
    await revoke_sessions(db, user.id)
    # A reset link requested before the change must not undo it, and an email
    # change someone else asked for must not outlive the owner's reaction.
    await account_tokens.revoke(
        db, user.id, AccountTokenPurpose.password_reset, AccountTokenPurpose.change_email
    )
    tokens = await issue_token_pair(db, user)
    # Stored before the new pair is handed over — see app/api/routes/recovery.py.
    await db.commit()
    return ok(tokens)


@router.post("/email", response_model=Envelope[EmailChangeOut])
async def change_email(
    body: ChangeEmailIn, request: Request, user: CurrentUser, db: DbSession, mailer: Mailer,
    background: BackgroundTasks,
):
    """Sends a link to the NEW address; the account moves when it is opened.

    Applying on verification rather than at once is the safer of the two: a typo
    here would otherwise move the account to an inbox nobody reads — and with
    it every future reset link. Until then `/auth/me` reports `pending_email`.

    The CURRENT address is warned at once. Someone who has the password can ask
    for this; the warning reaches the owner while the change is still pending,
    and a reset, a password change or "sign out other devices" kills it.
    """
    await enforce(db, request, "reauth", account=str(user.id))
    if not verify_password(body.password, user.password_hash):
        raise ValidationFailed(WRONG_PASSWORD, fields={"password": WRONG_PASSWORD})

    new_email = body.new_email.lower().strip()
    if new_email == user.email:
        same = "That is already your email."
        raise ValidationFailed(same, fields={"new_email": same})
    if await db.scalar(select(User.id).where(User.email == new_email)):
        # The caller has proven the password, so this says no more than
        # sign-up already does about the same address.
        taken = "An account already uses this email."
        raise ValidationFailed(taken, fields={"new_email": taken})

    purpose = AccountTokenPurpose.change_email
    if (wait := await account_tokens.seconds_until_next(db, user.id, purpose)) > 0:
        # The same minute as every other link, so this form cannot be used to
        # send mail to arbitrary addresses faster than the reset form can.
        raise RateLimited(f"We just sent a link. You can ask again in {wait} seconds.", retry_after=wait)

    token = await account_tokens.issue(db, user.id, purpose, new_email)
    # Inside the request: a failure rolls the pending change back with it.
    await send_or_raise(mailer, messages.change_email(new_email, token))
    await db.commit()
    background.add_task(
        send_quietly, mailer, messages.email_change_requested(user.email, new_email)
    )
    return ok({"pending_email": new_email})
