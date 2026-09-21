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
