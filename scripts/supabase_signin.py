#!/usr/bin/env python3
"""A Supabase access token for a script: seeds, the acceptance checks, the
containment and alert drills (docs/14-SUPABASE.md).

Signing in is Supabase Auth's, so a script signs in the way the app does — a
password grant against the project — and calls the FitLog API with the token.
`create=True` makes the account first when it does not exist, confirmed, with
the project's secret key (the Admin API), which is how the demo, store and
review accounts come to exist.

Where the project is: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (or the legacy
`SUPABASE_ANON_KEY`) and, to create, `SUPABASE_SECRET_KEY`. With none of them
set, the local stack is asked (`pnpm supabase status`), so nothing here holds a
key — not even the local stack's well-known ones, which secret scanners flag.

Standard library only: scripts/assert_ac.py runs on the system Python.

    python3 scripts/supabase_signin.py demo@fitlog.app fitlogdemo1234 [--create]
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def project() -> tuple[str, str, str]:
    """(url, publishable key, secret key); the secret may be empty."""
    url = os.environ.get("SUPABASE_URL", "")
    publishable = os.environ.get("SUPABASE_PUBLISHABLE_KEY") or os.environ.get("SUPABASE_ANON_KEY", "")
    secret = os.environ.get("SUPABASE_SECRET_KEY", "")
    if url and publishable:
        return url.rstrip("/"), publishable, secret
    local = _local_stack()
    return (url or local.get("API_URL", "")).rstrip("/"), publishable or local.get("PUBLISHABLE_KEY", ""), \
        secret or local.get("SECRET_KEY", "")


def _local_stack() -> dict[str, str]:
    try:
        out = subprocess.run(["pnpm", "exec", "supabase", "status", "-o", "env"], cwd=ROOT,
                             capture_output=True, text=True, timeout=60, check=True).stdout
    except (OSError, subprocess.SubprocessError) as exc:
        raise SystemExit("No SUPABASE_URL set and no local Supabase answering "
                         "(pnpm supabase start).") from exc
    values = {}
    for line in out.splitlines():
        key, sep, value = line.partition("=")
        if sep:
            values[key.strip()] = value.strip().strip('"')
    return values


def _post(url: str, key: str, body: dict, *, admin: bool = False) -> tuple[int, dict]:
    request = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST", headers={
        "apikey": key, "content-type": "application/json",
    })
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status, json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as err:
        return err.code, json.loads(err.read() or b"{}")


def access_token(email: str, password: str, *, create: bool = False,
                 metadata: dict | None = None) -> str:
    url, publishable, secret = project()
    if not url or not publishable:
        raise SystemExit("No Supabase project: set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.")
    status, body = _post(f"{url}/auth/v1/token?grant_type=password", publishable,
                         {"email": email, "password": password})
    if status == 200:
        return body["access_token"]
    if not create:
        raise SystemExit(f"Could not sign in as {email}: {body.get('error_code') or status}")
    if not secret:
        raise SystemExit("Creating an account needs SUPABASE_SECRET_KEY.")
    status, body = _post(f"{url}/auth/v1/admin/users", secret, {
        "email": email, "password": password, "email_confirm": True,
        "user_metadata": metadata or {},
    })
    if status not in (200, 201):
        raise SystemExit(f"Could not create {email}: {body.get('msg') or body.get('error_code') or status}")
    return access_token(email, password)


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 2:
        raise SystemExit(__doc__.split("\n\n")[-1])
    print(access_token(args[0], args[1], create="--create" in sys.argv))
