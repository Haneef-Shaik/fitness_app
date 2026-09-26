"""The container HEALTHCHECK — `python -m app.healthcheck` — for either process.

One image runs two processes (D25): `uvicorn app.main:app` and
`python -m app.worker`. The API answers `/health`; the worker serves no HTTP, so
a check that only knew `/health` would mark every healthy worker unhealthy. The
worker therefore touches a heartbeat file on every turn of its loop, and this
reads the file's age instead. A container that has a heartbeat is a worker; one
that does not is the API — no role variable for an operator to forget.

Standard library only: it runs every 30 s in every container.
"""
from __future__ import annotations

import os
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

HEARTBEAT = Path(tempfile.gettempdir()) / "fitlog-worker.heartbeat"

#: The worker's own lock timeout (`runner.LOCK_TIMEOUT_SECONDS`): a worker
#: silent for longer is one whose job the other workers would reclaim anyway.
#: A job — an AI call with its timeout — can hold one turn of the loop for
#: tens of seconds, so anything much shorter would flap.
MAX_HEARTBEAT_AGE_SECONDS = 300


def beat() -> None:
    """Called by the worker on every turn of its loop."""
    HEARTBEAT.touch()


def api_is_alive(port: int) -> bool:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=3) as response:
            return response.status == 200
    except (OSError, urllib.error.URLError):
        return False


def main() -> int:
    if HEARTBEAT.exists():
        age = time.time() - HEARTBEAT.stat().st_mtime
        return 0 if age <= MAX_HEARTBEAT_AGE_SECONDS else 1
    return 0 if api_is_alive(int(os.environ.get("PORT", "8000"))) else 1


if __name__ == "__main__":
    sys.exit(main())
