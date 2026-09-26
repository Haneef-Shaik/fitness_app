"""The signed-in account, as the app sees it. Signing in, passwords, email
verification and sessions are Supabase Auth's (docs/14-SUPABASE.md); the API
only answers who the bearer is."""
from __future__ import annotations

from pydantic import BaseModel


class MeOut(BaseModel):
    id: str
    email: str
    status: str
    #: How this account signs in: "email", "google" or "apple" (Supabase's
    #: provider). The app hides the password screens for Google and Apple.
    provider: str | None = None
