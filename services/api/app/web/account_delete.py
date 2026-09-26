"""`/account/delete` — deleting an account without the app (Google Play).

Google Play requires a web address where somebody can ask for their account
and data to be deleted without installing anything: a lost phone, an
uninstalled app, or simply not trusting an app with the job. This is that page.

**The same deletion as the app.** It calls `app.services.account.purge_account`,
the one implementation. Its per-account rate limit is keyed by the email typed
here and the app's by the signed-in account, deliberately apart: a budget
anybody can spend by typing an address must not be one that stops the owner
deleting in the app.

**Why there is no CSRF token.** CSRF works by riding a credential the browser
attaches on its own — a cookie. This page sets none and reads none: the only
credential is the password typed into the form, in the same request. A forged
cross-site post would have to contain the victim's password, and whoever has
that can delete the account directly. What a hostile page *can* still do is
frame this one and trick a click, so framing is forbidden (`page.CSP`).

It never says which of email or password was wrong, and never echoes the
password back.
"""
from __future__ import annotations

from urllib.parse import parse_qs

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from sqlalchemy import select

from app.api.deps import DbSession
from app.core.errors import RateLimited
from app.core.ratelimit import enforce
from app.core.security import hash_password, verify_password
from app.models import User
from app.schemas.account import DELETE_CONFIRMATION
from app.services.account import purge_account
from app.web.page import esc, render

router = APIRouter(include_in_schema=False)

#: Three short fields fit in a fraction of this; anything larger is not the form.
MAX_FORM_BYTES = 4096

_TITLE = "Delete your FitLog account"


def _form(email: str = "", error: str | None = None) -> str:
    problem = f'<p class="error" role="alert">{esc(error)}</p>' if error else ""
    return f"""
<h1>{_TITLE}</h1>
<p>This permanently deletes your FitLog account and everything in it: workouts,
meals, food analyses, body measurements, goals, progress photos and food photos.
It cannot be undone, and we cannot recover it for you afterwards.</p>
<p>Have the app? You can do this there too: <strong>Profile → Data and privacy →
Delete my account</strong>, where you can also download a copy of your data first.</p>
<div class="card">
{problem}
<form method="post" action="/account/delete" novalidate>
<label for="email">Email</label>
<input id="email" type="email" name="email" value="{esc(email)}" autocomplete="email"
 autocapitalize="none" spellcheck="false" required>
<label for="password">Password</label>
<input id="password" type="password" name="password" autocomplete="current-password" required>
<label for="confirmation">Type {DELETE_CONFIRMATION} to confirm</label>
<input id="confirmation" type="text" name="confirmation" autocomplete="off"
 autocapitalize="characters" spellcheck="false" aria-describedby="confirmation-hint" required>
<p class="hint" id="confirmation-hint">In capitals. This is the step that makes it permanent.</p>
<button type="submit">Delete my account permanently</button>
</form>
</div>
<p>Forgotten your password? Write to us at the contact address in our
<a href="/legal/privacy">privacy policy</a>; we will confirm the account is yours and delete it.
The policy also explains what we keep and for how long.</p>
"""


@router.get("/account/delete", response_class=HTMLResponse)
async def delete_page():
    return render(_TITLE, _form())


#: Verified against when the email is unknown, so an unknown address costs the
#: same hash as a wrong password and the time taken says nothing about which.
_NO_ACCOUNT_HASH = hash_password("no account has this password")


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
        return render(_TITLE, _form(error="Please use the form on this page."), status_code=415)

    # Refused on the declared size before a byte is read, and again on the
    # actual size for a body that did not declare one.
    too_big = render(_TITLE, _form(error="That was not the form on this page."), status_code=413)
    if _declared_too_big(request):
        return too_big
    raw = await request.body()
    if len(raw) > MAX_FORM_BYTES:
        return too_big

    fields = _fields(raw)
    if fields is None:
        return render(_TITLE, _form(error="That was not the form on this page."), status_code=400)
    email = fields.get("email", "").strip().lower()
    password = fields.get("password", "")

    try:
        # Keyed like the app's delete (by address, and by the account's email),
        # so the web and the app draw on one budget of guesses.
        await enforce(db, request, "account_delete", account=email or None)
    except RateLimited as limited:
        return render(_TITLE, _form(email, limited.message), status_code=429,
                      headers=limited.headers)

    if fields.get("confirmation", "").strip() != DELETE_CONFIRMATION:
        return render(_TITLE, _form(email, f"Type {DELETE_CONFIRMATION} in capitals to confirm."),
                      status_code=422)

    user = await db.scalar(select(User).where(User.email == email)) if email else None
    # One sentence, and one hash's worth of time, for an unknown email and a
    # wrong password alike.
    matches = verify_password(password, user.password_hash if user else _NO_ACCOUNT_HASH)
    if user is None or not matches:
        return render(_TITLE, _form(email, "Email or password is incorrect."), status_code=401)

    await purge_account(db, user.id)
    return render("Account deleted", """
<h1>Your account has been deleted</h1>
<div class="card">
<p>Your FitLog account and everything in it — workouts, meals, analyses,
measurements, goals and photos — has been permanently deleted.</p>
<p>If the app is still installed on a phone, it will sign out the next time it
connects. You can uninstall it.</p>
</div>
""")
