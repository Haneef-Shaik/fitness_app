"""`/account/delete` — deleting an account without the app (Google Play).

Google Play requires a web address where somebody can ask for their account
and data to be deleted without installing anything: a lost phone, an
uninstalled app, or simply not trusting an app with the job. This is that page.

**Proof by a code, not a password** (docs/14, S6). Step one takes an address
and has Supabase email it a one-time code; step two takes the code and the
typed confirmation. That works for every way of signing in — password, Google,
Apple — and asks for no password on a web form. Step one says the same thing
whether or not the address has an account.

**The same deletion as the app.** `app.services.account.purge_account`, the one
implementation, then the Supabase sign-in (`app.auth.admin`). Its rate limit is
keyed by the email typed here, the app's by the signed-in account — apart on
purpose: a budget anybody can spend by typing an address must not be one that
stops the owner deleting in the app.

**Why there is no CSRF token.** CSRF rides a credential the browser attaches on
its own — a cookie. This page sets none and reads none: the only credential is
the code typed into the form, in the same request. What a hostile page *can*
still do is frame this one and trick a click, so framing is forbidden
(`page.CSP`).
"""
from __future__ import annotations

import re
from urllib.parse import parse_qs

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

from app.api.deps import DbSession
from app.auth import admin
from app.core.errors import RateLimited, ServiceUnavailable
from app.core.ratelimit import enforce
from app.schemas.account import DELETE_CONFIRMATION
from app.services.account import purge_account
from app.web.page import esc, render

router = APIRouter(include_in_schema=False)

#: Three short fields fit in a fraction of this; anything larger is not the form.
MAX_FORM_BYTES = 4096

_TITLE = "Delete your FitLog account"


_INTRO = """
<h1>Delete your FitLog account</h1>
<p>This permanently deletes your FitLog account and everything in it: workouts,
meals, food analyses, body measurements, goals, progress photos and food photos.
It cannot be undone, and we cannot recover it for you afterwards.</p>
<p>Have the app? You can do this there too: <strong>Profile → Data and privacy →
Delete my account</strong>, where you can also download a copy of your data first.</p>
"""

#: Supabase's email one-time codes are six digits (`otp_length`).
_CODE = re.compile(r"^\d{6}$")


def _problem(error: str | None) -> str:
    return f'<p class="error" role="alert">{esc(error)}</p>' if error else ""


def _ask_email(email: str = "", error: str | None = None) -> str:
    return f"""{_INTRO}
<div class="card">
{_problem(error)}
<form method="post" action="/account/delete" novalidate>
<input type="hidden" name="step" value="send">
<label for="email">The email address you sign in with</label>
<input id="email" type="email" name="email" value="{esc(email)}" autocomplete="email"
 autocapitalize="none" spellcheck="false" required>
<p class="hint">We will email it a 6-digit code — whether you sign in with a password,
Google or Apple.</p>
<button type="submit">Email me a code</button>
</form>
</div>
<p>No longer have that inbox? Write to us at the contact address in our
<a href="/legal/privacy">privacy policy</a>; we will confirm the account is yours and delete it.
The policy also explains what we keep and for how long.</p>
"""


def _ask_code(email: str, error: str | None = None) -> str:
    return f"""{_INTRO}
<div class="card">
{_problem(error)}
<p>If an account uses <strong>{esc(email)}</strong>, we have emailed it a 6-digit code.
It can take a minute to arrive; check your spam folder too.</p>
<form method="post" action="/account/delete" novalidate>
<input type="hidden" name="step" value="delete">
<input type="hidden" name="email" value="{esc(email)}">
<label for="code">Code</label>
<input id="code" type="text" name="code" inputmode="numeric" autocomplete="one-time-code"
 maxlength="6" required>
<label for="confirmation">Type {DELETE_CONFIRMATION} to confirm</label>
<input id="confirmation" type="text" name="confirmation" autocomplete="off"
 autocapitalize="characters" spellcheck="false" aria-describedby="confirmation-hint" required>
<p class="hint" id="confirmation-hint">In capitals. This is the step that makes it permanent.</p>
<button type="submit">Delete my account permanently</button>
</form>
</div>
<p><a href="/account/delete">Use a different address, or send a new code</a></p>
"""


@router.get("/account/delete", response_class=HTMLResponse)
async def delete_page():
    return render(_TITLE, _ask_email())


def _fields(raw: bytes) -> dict[str, str] | None:
    """The form's fields, or None when the body is not a form this page made."""
    try:
        parsed = parse_qs(raw.decode("utf-8", errors="replace"), keep_blank_values=True,
                          max_num_fields=10)
    except ValueError:
        return None
    return {key: values[0] for key, values in parsed.items() if values}


def _declared_too_big(request: Request) -> bool:
    try:
        return int(request.headers.get("content-length", "0")) > MAX_FORM_BYTES
    except ValueError:
        return True


@router.post("/account/delete", response_class=HTMLResponse)
async def delete_from_the_web(request: Request, db: DbSession):
    content_type = request.headers.get("content-type", "").split(";")[0].strip()
    if content_type != "application/x-www-form-urlencoded":
        return render(_TITLE, _ask_email(error="Please use the form on this page."), status_code=415)

    # Refused on the declared size before a byte is read, and again on the
    # actual size for a body that did not declare one.
    too_big = render(_TITLE, _ask_email(error="That was not the form on this page."), status_code=413)
    if _declared_too_big(request):
        return too_big
    raw = await request.body()
    if len(raw) > MAX_FORM_BYTES:
        return too_big

    fields = _fields(raw)
    if fields is None:
        return render(_TITLE, _ask_email(error="That was not the form on this page."), status_code=400)
    email = fields.get("email", "").strip().lower()
    step = fields.get("step", "send")

    try:
        # Both steps draw on one budget per address typed (and per client
        # address): sending mails a stranger's inbox, deleting guesses a code.
        await enforce(db, request, "account_delete", account=email or None)
    except RateLimited as limited:
        page = _ask_code(email, limited.message) if step == "delete" and email else _ask_email(email, limited.message)
        return render(_TITLE, page, status_code=429, headers=limited.headers)

    if "@" not in email:
        return render(_TITLE, _ask_email(email, "Enter the email address you sign in with."),
                      status_code=422)

    if step != "delete":
        await admin.send_code(email)  # says nothing about whether the address exists
        return render(_TITLE, _ask_code(email))

    if fields.get("confirmation", "").strip() != DELETE_CONFIRMATION:
        return render(_TITLE, _ask_code(email, f"Type {DELETE_CONFIRMATION} in capitals to confirm."),
                      status_code=422)
    code = fields.get("code", "").strip()
    user_id = await admin.verify_code(email, code) if _CODE.match(code) else None
    if user_id is None:
        return render(_TITLE, _ask_code(email, "That code is wrong or has expired."), status_code=401)

    # FitLog's data first and committed, then the sign-in — see the app's
    # delete (app/api/routes/account.py) for why that order.
    await purge_account(db, user_id)
    await db.commit()
    try:
        await admin.delete_sign_in(user_id)
    except ServiceUnavailable as unavailable:
        return render(_TITLE, _ask_email(email, unavailable.message), status_code=503)
    return render("Account deleted", """
<h1>Your account has been deleted</h1>
<div class="card">
<p>Your FitLog account and everything in it — workouts, meals, analyses,
measurements, goals and photos — has been permanently deleted.</p>
<p>If the app is still installed on a phone, it will sign out the next time it
connects. You can uninstall it.</p>
</div>
""")
