"""The analysis worker — **a separate process from the API** (02 §5, G8 scope 2).

Why this is not a background task inside the API: a model call takes seconds and
sometimes takes the timeout. Doing it in a request handler means one slow plate
photograph occupies a worker that a set-commit needs, and **I14** — no AI
failure touches training — stops being true the first time the provider is slow.

The queue is Postgres, not Redis. `SELECT … FOR UPDATE SKIP LOCKED` is the
correct primitive for exactly this, the database is already there, and adding a
broker to run one job type would be infrastructure bought on credit.

Run it with:

    uv run python -m app.worker
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from collections.abc import Callable
from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app import healthcheck
from app.ai.gateway import (
    AIGateway,
    AIInvalidOutput,
    AIUnavailable,
    AnalysisResult,
)
from app.ai.provider import get_gateway
from app.config import get_settings
from app.db_engine import build_engine
from app.food.internal import InternalCatalogResolver
from app.food.ladder import resolve_detected_name
from app.models import (
    AnalysisErrorCode,
    AnalysisInputType,
    AnalysisStatus,
    FoodAnalysis,
    FoodAnalysisItem,
    PushToken,
)
from app.notify.push import PushMessage, PushSender, get_push_sender
from app.observability.crash_reporting import init_crash_reporting
from app.observability.metrics import registry
from app.storage.base import ObjectStore
from app.storage.provider import get_store

log = logging.getLogger("fitlog.worker")

#: How long a job may sit locked before another worker may take it. A worker
#: that is killed mid-job must not strand the work forever.
LOCK_TIMEOUT_SECONDS = 300
MAX_ATTEMPTS = 3


class AnalysisWorker:
    def __init__(
        self,
        session_factory: async_sessionmaker[AsyncSession],
        *,
        gateway: AIGateway | None = None,
        store: ObjectStore | None = None,
        low_confidence_threshold: float | None = None,
        push: PushSender | None = None,
    ) -> None:
        self._sessions = session_factory
        self._push = push or get_push_sender()
        self._gateway = gateway or get_gateway()
        self._store = store or get_store()
        self._threshold = (
            low_confidence_threshold
            if low_confidence_threshold is not None
            else get_settings().ai_low_confidence_threshold
        )

    # ------------------------------------------------------------- the loop

    async def run_forever(
        self,
        poll_seconds: float | None = None,
        *,
        heartbeat: Callable[[], None] | None = None,
    ) -> None:
        """`heartbeat` is called on every turn, idle or not — the container's
        HEALTHCHECK reads it, because the worker serves no `/health`."""
        delay = poll_seconds or get_settings().worker_poll_seconds
        log.info("analysis worker started, polling every %.1fs", delay)
        while True:
            if heartbeat is not None:
                try:
                    heartbeat()
                except OSError as exc:
                    # Its own guard: a full /tmp costs the health signal, and
                    # must never cost the jobs. A warning, not an error: the
                    # stale heartbeat already marks the container unhealthy,
                    # and an error every poll would flood the crash reports.
                    log.warning("worker heartbeat failed: %s", exc)
            try:
                did_work = await self.run_once()
            except Exception:  # a worker that dies is worse than one that logs
                log.exception("worker iteration failed")
                did_work = False
            if not did_work:
                await asyncio.sleep(delay)

    async def drain(self, limit: int = 100) -> int:
        """Process everything currently queued, then stop.

        Used by the suite — "the queue has settled" is a deterministic line in a
        test, where a sleep is flaky on a loaded machine — and by an operator
        who wants to clear a backlog without leaving a process running.

        `run_once` deliberately claims the **globally** oldest job, because that
        is what a fleet of workers should do. A test that called it once would
        therefore process whichever job happened to be first, not its own.
        """
        done = 0
        while done < limit and await self.run_once():
            done += 1
        return done

    async def run_once(self) -> bool:
        """Claim and process one job. Returns whether there was one."""
        async with self._sessions() as session:
            analysis = await self._claim(session)
            if analysis is None:
                return False
            analysis_id = analysis.id
            await session.commit()

        async with self._sessions() as session:
            await self._process(session, analysis_id)
            await session.commit()

        # After the commit, so the analysis a notification opens is the finished one.
        try:
            await self._notify(analysis_id)
        except Exception:  # a courtesy must never become a failed job
            log.exception("analysis %s: notification failed", analysis_id)
        return True

    async def _notify(self, analysis_id: uuid.UUID) -> None:
        """A PHOTO's estimate is announced; a text one is back before anyone
        leaves the screen, and a notification for it would only be noise."""
        async with self._sessions() as session:
            analysis = await session.get(FoodAnalysis, analysis_id)
            if analysis is None or analysis.input_type != AnalysisInputType.image:
                return
            tokens = (await session.scalars(
                select(PushToken.token).where(PushToken.user_id == analysis.user_id)
            )).all()
            if not tokens:
                return
            done = analysis.status == AnalysisStatus.completed
            messages = [PushMessage(
                token=t,
                title="Your meal estimate is ready" if done else "Couldn't estimate that meal",
                body=("Review it and confirm before it counts." if done
                      else "Add it by hand, or try another photo."),
                data={"type": "analysis", "analysis_id": str(analysis_id)},
            ) for t in tokens]
            dead = await self._push.send(messages)
            if dead:
                await session.execute(delete(PushToken).where(PushToken.token.in_(dead)))
                await session.commit()

    # ------------------------------------------------------------- claiming

    async def _claim(self, session: AsyncSession) -> FoodAnalysis | None:
        """One job, locked for this worker, invisible to the others.

        `SKIP LOCKED` is what makes running several workers safe: a row another
        worker holds is passed over rather than waited on.
        """
        stale_before = datetime.now(UTC).timestamp() - LOCK_TIMEOUT_SECONDS

        analysis = await session.scalar(
            select(FoodAnalysis)
            .where(FoodAnalysis.status == AnalysisStatus.pending)
            .order_by(FoodAnalysis.created_at)
            .limit(1)
            .with_for_update(skip_locked=True)
        )
        if analysis is None:
            # A job whose worker died mid-flight. Reclaimed, not stranded.
            analysis = await session.scalar(
                select(FoodAnalysis)
                .where(
                    FoodAnalysis.status == AnalysisStatus.processing,
                    FoodAnalysis.attempts < MAX_ATTEMPTS,
                    FoodAnalysis.locked_at
                    < datetime.fromtimestamp(stale_before, UTC),
                )
                .order_by(FoodAnalysis.created_at)
                .limit(1)
                .with_for_update(skip_locked=True)
            )
        if analysis is None:
            return None

        analysis.status = AnalysisStatus.processing
        analysis.locked_at = datetime.now(UTC)
        analysis.attempts += 1
        await session.flush()
        return analysis

    # ----------------------------------------------------------- processing

    async def _process(self, session: AsyncSession, analysis_id: uuid.UUID) -> None:
        analysis = await session.get(FoodAnalysis, analysis_id)
        if analysis is None:
            return

        # Queued to finished, which is what a user waits through — not just the
        # model call. 02 §9 alerts on the p95 of this.
        started = (analysis.created_at or datetime.now(UTC)).timestamp()

        try:
            result = await self._analyse(analysis)
        except AIUnavailable as exc:
            log.warning("analysis %s: gateway unavailable: %s", analysis_id, exc)
            return await self._fail(session, analysis, AnalysisErrorCode.ai_unavailable)
        except AIInvalidOutput as exc:
            log.warning("analysis %s: invalid model output: %s", analysis_id, exc)
            return await self._fail(session, analysis, AnalysisErrorCode.ai_invalid_output)
        except FileNotFoundError:
            return await self._fail(session, analysis, AnalysisErrorCode.image_unreadable)
        except (TimeoutError, OSError) as exc:
            # A transport failure that did not arrive as AIUnavailable. Same
            # user-facing meaning: the service did not answer.
            log.warning("analysis %s: transport failure: %s", analysis_id, exc)
            return await self._fail(session, analysis, AnalysisErrorCode.ai_unavailable)

        await self._persist(session, analysis, result)
        registry.record_analysis("completed", datetime.now(UTC).timestamp() - started)

    async def _analyse(self, analysis: FoodAnalysis) -> AnalysisResult:
        if analysis.input_type == AnalysisInputType.text:
            return await self._gateway.analyse_text(analysis.source_text or "")

        if not analysis.image_key:
            raise FileNotFoundError("the image was deleted before it was analysed")
        image = await self._store.read(analysis.image_key)
        content_type = "image/png" if image.startswith(b"\x89PNG") else "image/jpeg"
        return await self._gateway.analyse_image(image, content_type)

    async def _persist(
        self, session: AsyncSession, analysis: FoodAnalysis, result: AnalysisResult
    ) -> None:
        """Write the items ONCE, in one transaction.

        Re-running a job overwrites nothing (02 §5.3): the rows are append-only
        at the database level, so a second write would be refused rather than
        silently doubling the list.
        """
        resolver = InternalCatalogResolver(session, analysis.user_id)

        for index, item in enumerate(result.items):
            # H7.1 — the AI path resolves THROUGH the resolver, not around it.
            # Unresolved is a legitimate answer (ladder step 5), not a failure.
            resolved = await resolve_detected_name(resolver, item.detected_name)
            # A high unresolved rate is a data-coverage problem, and the one Q1
            # would close (02 §9).
            registry.record_resolution(resolved is not None)

            session.add(FoodAnalysisItem(
                analysis_id=analysis.id,
                order_index=index,
                detected_name=item.detected_name,
                estimated_quantity=item.estimated_quantity,
                estimated_unit=item.estimated_unit,
                confidence=item.confidence,
                proposed_calories=item.proposed_calories,
                proposed_protein_g=item.proposed_protein_g,
                proposed_carbs_g=item.proposed_carbs_g,
                proposed_fat_g=item.proposed_fat_g,
                resolved_food_id=resolved,
                low_confidence=(
                    item.confidence is not None and item.confidence < self._threshold
                ),
            ))

        analysis.status = AnalysisStatus.completed
        analysis.model_name = result.model_name
        analysis.schema_version = result.schema_version
        analysis.notes = result.notes
        analysis.completed_at = datetime.now(UTC)
        await session.flush()

    async def _fail(
        self, session: AsyncSession, analysis: FoodAnalysis, code: AnalysisErrorCode
    ) -> None:
        """A failure is terminal for the user and leaves the meal alone.

        No automatic retry: 02 §5.3 offers the retry to the *user*, because a
        loop against a paid API is a bill and an outage at once.
        """
        analysis.status = AnalysisStatus.failed
        analysis.error_code = code
        analysis.completed_at = datetime.now(UTC)
        registry.record_analysis("failed")
        await session.flush()


def _session_factory() -> async_sessionmaker[AsyncSession]:
    # The API's builder, not a copy of it: a pooler setting only the API had
    # would be a worker that fails on the hosted database and nowhere else.
    engine = build_engine(get_settings())
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s"
    )
    # Validated before anything else, as the API does at import: a worker with
    # a bad configuration should fail to start, not fail every job.
    settings = get_settings()
    # Its own client, tagged "worker": `log.exception` in the loop becomes a
    # report, an expected AI failure (a warning) does not.
    init_crash_reporting(settings, process="worker")
    await AnalysisWorker(_session_factory()).run_forever(heartbeat=healthcheck.beat)


if __name__ == "__main__":
    asyncio.run(main())
