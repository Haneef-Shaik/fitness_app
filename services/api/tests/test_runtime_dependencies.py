"""What the production image installs, read from uv.lock — not from this venv.

The image runs `uv sync --frozen --no-dev` (Dockerfile), so it has the runtime
dependencies and nothing else. Supabase signs access tokens with ES256/RS256
(docs/14 S2), and PyJWT verifies those only with `cryptography`. The suite
always had it, because moto — a dev dependency — brings it: every test passed
while a production install refused every token. This walks the lock file's
runtime closure instead of trusting what happens to be importable here.
"""
from __future__ import annotations

import tomllib
from pathlib import Path

LOCK = Path(__file__).resolve().parents[1] / "uv.lock"


def runtime_closure() -> set[str]:
    """Every package `uv sync --no-dev` installs (markers ignored: a superset)."""
    packages = {p["name"]: p for p in tomllib.loads(LOCK.read_text())["package"]}
    wanted = [(d["name"], d.get("extra", [])) for d in packages["fitlog-api"]["dependencies"]]
    closure: set[str] = set()
    while wanted:
        name, extras = wanted.pop()
        package = packages[name]
        new_extras = [e for e in extras if (name, e) not in closure]
        if name in closure and not new_extras:
            continue
        closure.add(name)
        closure.update((name, e) for e in extras)
        wanted += [(d["name"], d.get("extra", [])) for d in package.get("dependencies", [])]
        for extra in extras:
            optional = package.get("optional-dependencies", {}).get(extra, [])
            wanted += [(d["name"], d.get("extra", [])) for d in optional]
    return {c for c in closure if isinstance(c, str)}


def test_production_can_verify_supabase_tokens():
    assert "cryptography" in runtime_closure()


def test_the_closure_is_the_runtime_one():
    # Sanity: had this walked the dev group too, the test above would pass
    # for the reason that hid the bug.
    closure = runtime_closure()
    assert "pyjwt" in closure
    assert "moto" not in closure and "pytest" not in closure
