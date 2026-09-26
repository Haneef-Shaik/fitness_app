"""What each email says (A-05, A-06, K-02).

Plain text, one builder per kind. Every link mail carries the same token twice:
as a `fitlog://` link that opens the right screen, and on a line of its own to
paste — a phone that will not open the link (a webmail client that strips
custom schemes, a mail app on a laptop) still has a way in.

Each one says how long it lasts and what happens if it is ignored, because an
unexpected security email that does not say "ignore this" reads as phishing.
"""
from __future__ import annotations

from app.config import get_settings
from app.email.base import EmailMessage


def app_link(route: str, token: str) -> str:
    return f"{get_settings().app_link_base}{route}?token={token}"


def password_reset(to: str, token: str) -> EmailMessage:
    minutes = get_settings().password_reset_ttl_minutes
    return EmailMessage(
        to=to,
        subject="Reset your FitLog password",
        kind="password_reset",
        text=(
            "Someone asked to reset the password for your FitLog account.\n\n"
            "Open this link on your phone to choose a new one:\n"
            f"{app_link('reset-password', token)}\n\n"
            "Or open FitLog, choose \"I have a code\" and paste this:\n"
            f"{token}\n\n"
            f"It works once and expires in {minutes} minutes. If you didn't ask for "
            "this, ignore this email — your password has not changed.\n"
        ),
    )


def verify_email(to: str, token: str) -> EmailMessage:
    hours = get_settings().email_verify_ttl_hours
    return EmailMessage(
        to=to,
        subject="Confirm your email for FitLog",
        kind="verify_email",
        text=(
            "Confirm that this is your email address for FitLog.\n\n"
            "Open this link on your phone:\n"
            f"{app_link('verify-email', token)}\n\n"
            "Or paste this code into FitLog:\n"
            f"{token}\n\n"
            f"It expires in {hours} hours. If you didn't create a FitLog account, "
            "ignore this email.\n"
        ),
    )


def change_email(to: str, token: str) -> EmailMessage:
    """Sent to the NEW address. Opening it is what moves the account."""
    hours = get_settings().email_verify_ttl_hours
    return EmailMessage(
        to=to,
        subject="Confirm your new FitLog email",
        kind="change_email",
        text=(
            "Your FitLog sign-in email changes to this address once you confirm it.\n\n"
            "Open this link on your phone:\n"
            f"{app_link('verify-email', token)}\n\n"
            "Or paste this code into FitLog:\n"
            f"{token}\n\n"
            f"It expires in {hours} hours. If you didn't ask for this, ignore this "
            "email — nothing changes.\n"
        ),
    )


def email_change_requested(to: str, new_email: str) -> EmailMessage:
    """Sent to the CURRENT address when a change is asked for (K-02).

    Before the change applies, while the owner can still stop it: resetting
    the password from this inbox kills the pending change. No link in it — a
    warning is not something to click.
    """
    hours = get_settings().email_verify_ttl_hours
    return EmailMessage(
        to=to,
        subject="Someone asked to change your FitLog email",
        kind="email_change_requested",
        text=(
            f"Someone signed in to your FitLog account asked to move it to {new_email}. "
            f"It moves only if that address confirms within {hours} hours.\n\n"
            "If this was you, there is nothing to do.\n\n"
            "If it wasn't, someone else knows your password. Reset it now from the FitLog "
            "sign-in screen (\"Forgot password?\"): that cancels the change and signs "
            "everyone else out.\n"
        ),
    )


def email_changed(to: str, new_email: str) -> EmailMessage:
    """Sent to the OLD address once the change has applied (K-02)."""
    return EmailMessage(
        to=to,
        subject="Your FitLog email was changed",
        kind="email_changed",
        text=(
            f"The sign-in email for your FitLog account is now {new_email}.\n\n"
            "If you made this change, there is nothing to do.\n\n"
            "If you didn't, someone else may know your password. Contact FitLog "
            "support straight away.\n"
        ),
    )
