from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)
    display_name: str | None = Field(default=None, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class RefreshIn(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class UserRefOut(BaseModel):
    id: str
    email: str


class AuthOut(TokenPair):
    """Register and login return the new user alongside a fresh token pair."""

    user: UserRefOut


class MeOut(BaseModel):
    id: str
    email: str
    status: str
    #: A-06. Informational only — nothing in the API is gated on it.
    email_verified: bool
    #: K-02. The address a change is waiting on, until its link is opened.
    pending_email: str | None = None


class SignedOutOut(BaseModel):
    signed_out: bool


# ------------------------------------------------------------------ A-05


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class RequestedOut(BaseModel):
    """The same body whether or not an account exists (A-05 no enumeration)."""

    requested: bool


class ResetPasswordIn(BaseModel):
    #: The link's token, or the same string pasted from the email.
    token: str = Field(min_length=1, max_length=200)
    new_password: str = Field(min_length=1, max_length=200)


class PasswordResetOut(BaseModel):
    password_reset: bool


# ------------------------------------------------------------------ A-06


class VerifyEmailIn(BaseModel):
    token: str = Field(min_length=1, max_length=200)


class EmailVerifiedOut(BaseModel):
    """The account's address after the link — the new one, for a K-02 change."""

    email: str
    email_verified: bool


class VerificationSentOut(BaseModel):
    sent: bool
    email_verified: bool


# ------------------------------------------------------------------ K-02


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=200)
    new_password: str = Field(min_length=1, max_length=200)


class ChangeEmailIn(BaseModel):
    new_email: EmailStr
    #: Asked again: an email change reachable with a stolen session is a
    #: takeover — the next reset link would go to the thief.
    password: str = Field(min_length=1, max_length=200)


class EmailChangeOut(BaseModel):
    pending_email: str


class SessionsRevokedOut(BaseModel):
    """How many other devices were signed out."""

    revoked: int
