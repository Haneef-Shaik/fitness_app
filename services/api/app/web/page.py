"""One page shell for every HTML page the API serves (launch).

**No script, nothing fetched from anywhere else.** The CSS is inline and the
fonts are the phone's own, so a page works on a slow connection, cannot be
changed by a third-party host, and leaks no visit to one. The CSP says so to
the browser as well, which makes an injected `<script>` inert even if escaping
ever failed.

**Escaping is the caller's job, through `esc`.** Pages are small enough to be
f-strings, and every value a person typed goes through `esc` on its way in —
`test_web_account_delete` posts a `<script>` to prove it.
"""
from __future__ import annotations

from html import escape

from fastapi.responses import HTMLResponse

#: `default-src 'none'` forbids scripts, frames, fonts and fetches outright;
#: styles are allowed inline only. `form-action 'self'` keeps the deletion form
#: posting to us, and `frame-ancestors 'none'` stops the page being framed —
#: a page that deletes an account is exactly what clickjacking would frame.
CSP = (
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; "
    "frame-ancestors 'none'; base-uri 'none'"
)

SECURITY_HEADERS = {
    "Content-Security-Policy": CSP,
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
}

# The app's own page, ink and Iris accent (docs/design/tokens.css), light and
# dark. 16px inputs stop iOS zooming the page when a field takes focus; 48px
# controls clear the 44px touch target.
_CSS = """
:root{color-scheme:light dark;--bg:#F4F5F3;--card:#FFFFFF;--ink:#0B0C0D;--ink2:#52544F;
--line:#D9DBD6;--accent:#5A31C4;--crit:#B3261E;--warn-bg:#FFF4D6;--warn-ink:#5C4400}
@media (prefers-color-scheme:dark){:root{--bg:#0E0F11;--card:#17181B;--ink:#FFFFFF;--ink2:#B9BCC4;
--line:#2C2E33;--accent:#B0A4FF;--crit:#FFB4AB;--warn-bg:#3A2E00;--warn-ink:#FFE08A}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:40rem;margin:0 auto;padding:24px 16px 48px}
h1{font-size:1.6rem;line-height:1.25;margin:0 0 12px}
h2{font-size:1.15rem;margin:28px 0 8px}
h3{font-size:1rem;margin:20px 0 6px}
p,li{color:var(--ink2)}
a{color:var(--accent)}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px;margin:16px 0}
.draft{background:var(--warn-bg);color:var(--warn-ink);border-radius:10px;padding:12px 14px;
font-weight:600;margin:0 0 20px}
.error{color:var(--crit);font-weight:600}
label{display:block;font-weight:600;margin:16px 0 6px;color:var(--ink)}
.hint{font-size:.9rem;margin:4px 0 0}
input{width:100%;min-height:48px;font:inherit;font-size:16px;padding:10px 12px;border-radius:10px;
border:1px solid var(--line);background:var(--bg);color:var(--ink)}
button{margin-top:24px;width:100%;min-height:48px;font:inherit;font-weight:600;border:0;
border-radius:12px;background:var(--crit);color:var(--card);cursor:pointer}
:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
table{border-collapse:collapse;width:100%}
th,td{border-bottom:1px solid var(--line);padding:8px 6px;text-align:left;vertical-align:top}
"""


def esc(value: object) -> str:
    """HTML-escapes anything headed into a page, quotes included."""
    return escape(str(value), quote=True)


def render(
    title: str,
    body: str,
    *,
    status_code: int = 200,
    headers: dict[str, str] | None = None,
    cache: str = "no-store",
) -> HTMLResponse:
    """A complete page around `body`, which must already be escaped."""
    html = (
        "<!doctype html>\n"
        '<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f"<title>{esc(title)} · FitLog</title>\n"
        f"<style>{_CSS}</style>\n</head>\n<body>\n<main>\n{body}\n</main>\n</body>\n</html>\n"
    )
    return HTMLResponse(
        html,
        status_code=status_code,
        headers={**SECURITY_HEADERS, "Cache-Control": cache, **(headers or {})},
    )
