"""`/legal/privacy` and `/legal/terms` — the DRAFT policies (K-10, launch).

Both stores require a privacy-policy URL, and the app's About screen (K-10)
links to these unless `EXPO_PUBLIC_PRIVACY_URL` / `EXPO_PUBLIC_TERMS_URL` point
somewhere else. They are served by the API so the link works from the day the
API is hosted, with nothing else to deploy.

**The texts are drafts and say so on the page.** They live as HTML fragments in
`app/legal/` so the owner (and their counsel) edit prose, not Python. Every
`[OWNER: …]` marker is a decision nobody has made yet; the banner comes off
only when there are none left, and `test_legal_pages` holds that line.

Two values are filled in at request time rather than written into the text:
the support address (`SUPPORT_EMAIL`), and the addresses of the web deletion
page and the policy. Those come from `PUBLIC_BASE_URL` — **never from the
request**: `Host` is the caller's to write and these pages are cached publicly,
so a link built from it could be pointed anywhere, for everybody. Unset, they
are relative, which resolves against wherever the page was really served from.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

from app.config import get_settings
from app.web.page import esc, render

router = APIRouter(include_in_schema=False)

LEGAL_DIR = Path(__file__).resolve().parents[1] / "legal"

#: Published path → (file, page title).
DOCUMENTS = {
    "privacy": ("privacy.html", "Privacy Policy"),
    "terms": ("terms.html", "Terms of Service"),
}


@lru_cache
def _fragment(filename: str) -> str:
    return (LEGAL_DIR / filename).read_text(encoding="utf-8")


def _address(path: str) -> str:
    return get_settings().public_base_url.rstrip("/") + path


def _page(name: str) -> HTMLResponse:
    filename, title = DOCUMENTS[name]
    support = get_settings().support_email
    contact = (
        f'<a href="mailto:{esc(support)}">{esc(support)}</a>' if support
        else "[OWNER: set SUPPORT_EMAIL — a monitored contact address]"
    )
    body = (
        _fragment(filename)
        .replace("{{support_email}}", contact)
        .replace("{{delete_url}}", esc(_address("/account/delete")))
        .replace("{{privacy_url}}", esc(_address("/legal/privacy")))
    )
    # An hour's cache: these change rarely, and a policy that updates within
    # the hour is fine. The deletion form itself is never cached.
    return render(title, body, cache="public, max-age=3600")


@router.get("/legal/privacy", response_class=HTMLResponse)
async def privacy():
    return _page("privacy")


@router.get("/legal/terms", response_class=HTMLResponse)
async def terms():
    return _page("terms")
