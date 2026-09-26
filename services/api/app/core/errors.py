"""Error taxonomy. Every error carries a machine code AND a plain-language sentence
that states the fix — never a bare code, never a stack trace (docs/06 §10)."""
from __future__ import annotations


class AppError(Exception):
    status_code = 400
    code = "BAD_REQUEST"
    message = "That request could not be completed."

    def __init__(
        self,
        message: str | None = None,
        *,
        fields: dict[str, str] | None = None,
        headers: dict[str, str] | None = None,
    ):
        self.message = message or self.message
        self.fields = fields or {}
        #: Response headers the error needs — `Retry-After` on a 429 is the one
        #: that exists. The body stays the one envelope either way.
        self.headers = headers or {}
        super().__init__(self.message)


class ValidationFailed(AppError):
    status_code, code = 422, "VALIDATION_FAILED"
    message = "Some details need fixing."


class Unauthorized(AppError):
    status_code, code = 401, "UNAUTHORIZED"
    message = "Log back in to carry on."


class Forbidden(AppError):
    status_code, code = 403, "FORBIDDEN"
    message = "You cannot open that."


class NotFound(AppError):
    status_code, code = 404, "NOT_FOUND"
    message = "We could not find that."


class Conflict(AppError):
    status_code, code = 409, "CONFLICT"
    message = "This was changed somewhere else."


class RateLimited(AppError):
    """Too many requests in a window (app/core/ratelimit.py).

    Carries `Retry-After`, so a client can wait the right amount rather than
    hammering its way through the rest of the window.
    """

    status_code, code = 429, "RATE_LIMITED"
    message = "Too many attempts. Try again shortly."

    def __init__(self, message: str | None = None, *, retry_after: int):
        self.retry_after = max(1, retry_after)
        super().__init__(message, headers={"Retry-After": str(self.retry_after)})


class QuotaExceeded(AppError):
    """The per-user daily AI cap (02 §5.4).

    Its own class rather than a `RateLimited` with different words: the UI
    states a quota **before** a photo is taken and offers manual entry, where a
    rate limit says "try again shortly". They are different sentences and
    different affordances.
    """

    status_code, code = 429, "QUOTA_EXCEEDED"
    message = "You have used all of today's food analyses."


class LinkExpired(AppError):
    """An emailed link (A-05, A-06, K-02) that cannot be used.

    One class and one sentence whether the token is unknown, used, superseded or
    past its expiry: telling them apart would tell a guesser which tokens once
    existed. The code is what lets the app offer "Request a new link".
    """

    status_code, code = 400, "LINK_EXPIRED"
    message = "This link has expired or was already used. Request a new one."


class EmailNotSent(AppError):
    """The provider refused or could not be reached, on a request that is ALLOWED
    to say so — a signed-in resend or email change. The anonymous "forgot
    password" never raises this: a failure only for real accounts would say
    which addresses have one."""

    status_code, code = 503, "EMAIL_UNAVAILABLE"
    message = "We couldn't send the email just now. Try again in a few minutes."


class PayloadTooLarge(AppError):
    status_code, code = 413, "PAYLOAD_TOO_LARGE"
    message = "That file is larger than the upload it was signed for."


class ServiceUnavailable(AppError):
    """A service the request depends on (Supabase Auth) could not be reached."""

    status_code, code = 503, "SERVICE_UNAVAILABLE"
    message = "That is unavailable right now. Try again shortly."


class ReauthRequired(AppError):
    """Deleting an account needs a recent sign-in (docs/14, S5). The app signs
    the person in again — password, Google or Apple — and retries."""

    status_code, code = 403, "REAUTH_REQUIRED"
    message = "Sign in again to confirm it's you."
