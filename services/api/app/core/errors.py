"""Error taxonomy. Every error carries a machine code AND a plain-language sentence
that states the fix — never a bare code, never a stack trace (docs/06 §10)."""
from __future__ import annotations


class AppError(Exception):
    status_code = 400
    code = "BAD_REQUEST"
    message = "That request could not be completed."

    def __init__(self, message: str | None = None, *, fields: dict[str, str] | None = None):
        self.message = message or self.message
        self.fields = fields or {}
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
    status_code, code = 429, "RATE_LIMITED"
    message = "Too many attempts. Try again shortly."


class QuotaExceeded(AppError):
    """The per-user daily AI cap (02 §5.4).

    Its own class rather than a `RateLimited` with different words: the UI
    states a quota **before** a photo is taken and offers manual entry, where a
    rate limit says "try again shortly". They are different sentences and
    different affordances.
    """

    status_code, code = 429, "QUOTA_EXCEEDED"
    message = "You have used all of today's food analyses."


class PayloadTooLarge(AppError):
    status_code, code = 413, "PAYLOAD_TOO_LARGE"
    message = "That file is larger than the upload it was signed for."
