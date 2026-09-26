"""The image's HEALTHCHECK, for both processes one image runs (D25).

The API answers `/health`. The worker serves no HTTP, so a check that only knew
`/health` would call every healthy worker container unhealthy — and a check
nobody believes is a check nobody reads. The worker touches a heartbeat file on
every turn of its loop instead, and the check reads its age.
"""
from __future__ import annotations

import asyncio
import os
import time

import pytest

from app import healthcheck


@pytest.fixture
def heartbeat(tmp_path, monkeypatch):
    path = tmp_path / "worker.heartbeat"
    monkeypatch.setattr(healthcheck, "HEARTBEAT", path)
    return path


class TestTheWorkersHeartbeat:
    def test_a_fresh_heartbeat_is_alive(self, heartbeat):
        healthcheck.beat()

        assert healthcheck.main() == 0

    def test_a_heartbeat_older_than_the_lock_timeout_is_not(self, heartbeat):
        healthcheck.beat()
        stale = time.time() - healthcheck.MAX_HEARTBEAT_AGE_SECONDS - 5
        os.utime(heartbeat, (stale, stale))

        assert healthcheck.main() == 1

    def test_the_limit_is_the_workers_own_lock_timeout(self):
        # A worker silent for longer than this is one whose job the others
        # would already be reclaiming (runner.LOCK_TIMEOUT_SECONDS).
        from app.worker.runner import LOCK_TIMEOUT_SECONDS

        assert healthcheck.MAX_HEARTBEAT_AGE_SECONDS == LOCK_TIMEOUT_SECONDS

    async def test_the_loop_beats_even_when_there_is_no_work(self, worker):
        beats = 0

        def beat() -> None:
            nonlocal beats
            beats += 1
            if beats == 3:
                raise asyncio.CancelledError

        with pytest.raises(asyncio.CancelledError):
            await worker.run_forever(poll_seconds=0.01, heartbeat=beat)

        assert beats == 3

    async def test_a_failing_heartbeat_does_not_stop_the_work(self, worker, monkeypatch):
        """A full /tmp costs the health signal, never the jobs: the worker
        still takes work on every turn the heartbeat fails."""
        beats = jobs = 0

        def beat() -> None:
            nonlocal beats
            beats += 1
            if beats == 3:
                raise asyncio.CancelledError
            raise OSError("No space left on device")

        async def run_once() -> bool:
            nonlocal jobs
            jobs += 1
            return False

        monkeypatch.setattr(worker, "run_once", run_once)
        with pytest.raises(asyncio.CancelledError):
            await worker.run_forever(poll_seconds=0.01, heartbeat=beat)

        assert jobs == 2


class TestTheAPI:
    def test_without_a_heartbeat_the_api_is_asked(self, heartbeat, monkeypatch):
        asked: list[int] = []
        monkeypatch.setenv("PORT", "8123")
        monkeypatch.setattr(healthcheck, "api_is_alive", lambda port: asked.append(port) or True)

        assert healthcheck.main() == 0
        assert asked == [8123]

    def test_an_api_that_does_not_answer_is_unhealthy(self, heartbeat, monkeypatch):
        monkeypatch.setattr(healthcheck, "api_is_alive", lambda port: False)

        assert healthcheck.main() == 1

    def test_a_closed_port_is_not_alive(self):
        # Port 1 is never listening; this is the real urllib path.
        assert healthcheck.api_is_alive(1) is False
