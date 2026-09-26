"""Who the bearer is. Everything else about signing in — sign-up, sign-in,
Google and Apple, refreshing, sign-out, password reset, email verification,
changing a password or an address, signing other devices out — is Supabase
Auth's, called by the app directly (docs/14-SUPABASE.md, S1–S9)."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import CurrentUser, Signin
from app.api.envelope import ok
from app.schemas.auth import MeOut
from app.schemas.envelope import Envelope

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=Envelope[MeOut])
async def me(user: CurrentUser, claims: Signin):
    """The first call after a sign-in, which also creates the FitLog account on
    a first sign-in (app/auth/provision.py)."""
    return ok(MeOut(
        id=str(user.id), email=user.email, status=user.status.value, provider=claims.provider,
    ).model_dump())
