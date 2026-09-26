from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, BackgroundTasks, Request
from sqlalchemy import delete, select, update

from app.api.deps import CurrentFamily, CurrentUser, DbSession, Mailer
from app.api.envelope import ok
from app.core.errors import Unauthorized, ValidationFailed
from app.core.ratelimit import account_at_address, enforce
from app.core.security import (
    hash_password,
    hash_refresh_token,
    password_problem,
    spend_like_a_password_check,
    verify_password,
)
from app.email import messages
from app.email.delivery import send_quietly
from app.models import (
    AccountTokenPurpose,
    PushToken,
    RefreshToken,
    User,
    UserProfile,
    UserStatus,
)
from app.schemas.auth import (
    AuthOut,
    LoginIn,
    MeOut,
    RefreshIn,
    RegisterIn,
    SessionsRevokedOut,
    SignedOutOut,
    TokenPair,
)
from app.schemas.envelope import Envelope
from app.services import account_tokens
from app.services.credentials import issue_token_pair, lock_account, revoke_sessions

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=201, response_model=Envelope[AuthOut])
async def register(
    body: RegisterIn, request: Request, db: DbSession, mailer: Mailer, background: BackgroundTasks,
):
    email = body.email.lower().strip()
    # Before the duplicate check, so "already registered" cannot be used to
    # test a list of emails at speed.
    await enforce(db, request, "register", account=email)

    if (problem := password_problem(body.password)) is not None:
        raise ValidationFailed(problem, fields={"password": problem})

    if await db.scalar(select(User).where(User.email == email)):
        raise ValidationFailed(
            "An account already uses this email. Log in instead.",
            fields={"email": "Already registered."},
        )

    user = User(email=email, password_hash=hash_password(body.password))
    db.add(user)
    await db.flush()
    # Profile is created up front so onboarding always has a row to PATCH.
    db.add(UserProfile(user_id=user.id, display_name=body.display_name))
    await db.flush()

    # A-06: the link goes out after the response. The account exists whether or
    # not the mail does — a provider outage must not stop anyone signing up,
    # and "Resend" on K-01 is the way back.
    token = await account_tokens.issue(db, user.id, AccountTokenPurpose.verify_email, user.email)
    tokens = await issue_token_pair(db, user)
    await db.commit()  # before the send is queued — see app/email/delivery.py
    background.add_task(send_quietly, mailer, messages.verify_email(user.email, token))
    return ok({"user": {"id": str(user.id), "email": user.email}, **tokens}, status_code=201)


@router.post("/login", response_model=Envelope[AuthOut])
async def login(body: LoginIn, request: Request, db: DbSession):
    email = body.email.lower().strip()
    # Counted whether or not the password turns out to be right: the attempts
    # that fail are the ones the limit exists for. Per account AT this address
    # (a stranger cannot lock the owner out), plus a looser per-account total
    # across every address (a botnet cannot spread its guesses thin).
    await enforce(db, request, "login", account=account_at_address(request, email))
    await enforce(db, request, "login_total", account=email, by_ip=False)

    # Locked (services/credentials.py): a reset or password change committing
    # while this checks the OLD password must not be outlived by its session.
    user = await db.scalar(select(User).where(User.email == email).with_for_update())
    # Same response whether the account exists or the password is wrong — no
    # enumeration — and the same time: no account still costs one hash.
    if user is None or user.deleted_at is not None:
        spend_like_a_password_check(body.password)
        raise Unauthorized("Email or password is incorrect.")
    if not verify_password(body.password, user.password_hash):
        raise Unauthorized("Email or password is incorrect.")
    if user.status is not UserStatus.active:
        raise Unauthorized("This account is disabled.")

    tokens = await issue_token_pair(db, user)
    return ok({"user": {"id": str(user.id), "email": user.email}, **tokens})


@router.post("/refresh", response_model=Envelope[TokenPair])
async def refresh(body: RefreshIn, request: Request, db: DbSession):
    await enforce(db, request, "refresh")

    token_hash = hash_refresh_token(body.refresh_token)
    row = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if row is None:
        raise Unauthorized("That session has expired.")

    # Serialised with revocation on the account row (services/credentials.py),
    # then re-read: a revoke that committed while this waited must show here,
    # or the token minted below would be one the revoke never saw.
    await lock_account(db, row.user_id)
    await db.refresh(row)
    now = datetime.now(UTC)

    # Reuse detection: a revoked token being presented again means it leaked.
    # Revoke the whole family rather than just this token (BRD §18).
    if row.revoked_at is not None:
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == row.family_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        # MUST commit before raising: the session dependency rolls back on exception,
        # which would silently discard the revocation and leave the leaked family alive.
        await db.commit()
        raise Unauthorized("You were signed out for security.")

    # A token names its user only once it has been looked up, so the account
    # half is counted here rather than with the address above — and after the
    # reuse check, so a leaked family is revoked even by a caller over its limit.
    await enforce(db, request, "refresh", account=str(row.user_id), by_ip=False)

    if row.expires_at <= now:
        raise Unauthorized("That session has expired.")

    row.revoked_at = now  # rotate
    user = await db.scalar(select(User).where(User.id == row.user_id))
    if user is None or user.deleted_at is not None:
        raise Unauthorized()

    tokens = await issue_token_pair(db, user, family_id=row.family_id)
    return ok(tokens)


@router.post("/logout", response_model=Envelope[SignedOutOut])
async def logout(body: RefreshIn, db: DbSession):
    token_hash = hash_refresh_token(body.refresh_token)
    family = await db.scalar(select(RefreshToken.family_id).where(RefreshToken.token_hash == token_hash))
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == token_hash)
        .values(revoked_at=datetime.now(UTC))
    )
    if family is not None:
        # This phone stops hearing about the account it just signed out of.
        await db.execute(delete(PushToken).where(PushToken.family_id == family))
    return ok({"signed_out": True})


@router.get("/me", response_model=Envelope[MeOut])
async def me(user: CurrentUser, db: DbSession):
    return ok({
        "id": str(user.id),
        "email": user.email,
        "status": user.status.value,
        "email_verified": user.email_verified_at is not None,
        "pending_email": await account_tokens.pending_email(db, user.id),
    })


@router.post("/sessions/revoke-others", response_model=Envelope[SessionsRevokedOut])
async def revoke_other_sessions(user: CurrentUser, family: CurrentFamily, db: DbSession):
    """K-02 "Sign out other devices": every refresh-token family but the caller's.

    The caller's family comes from its access token's `sid`, not from a refresh
    token in the body — so the app can call this like any other authenticated
    route, and a 401 here refreshes and retries rather than ending the session.
    Local workout drafts on the other devices are untouched: they are on the
    devices, and upload when those devices sign back in.

    A pending email change dies with the other sessions: this is the button a
    worried owner presses, and a change link someone else asked for must not
    survive it (K-02).
    """
    revoked = await revoke_sessions(db, user.id, keep_family=family)
    await account_tokens.revoke(db, user.id, AccountTokenPurpose.change_email)
    # Stored before it is reported — see app/api/routes/recovery.py.
    await db.commit()
    return ok({"revoked": revoked})
