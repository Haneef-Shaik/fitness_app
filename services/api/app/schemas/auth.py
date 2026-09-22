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


class SignedOutOut(BaseModel):
    signed_out: bool
