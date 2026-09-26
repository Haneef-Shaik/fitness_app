"""Rate limiting (02 §8: "per-user and per-IP, tighter on auth and AI").

**Fixed windows, counted in Postgres.** The API runs as several instances, and
a counter held in process memory is a limit multiplied by however many of them
happen to be up. Postgres is the one thing they already share, and
`INSERT … ON CONFLICT DO UPDATE … RETURNING count` is an atomic increment across
all of them — no Redis to operate, which matters for a product whose standing
rule is fewer moving parts. A fixed window lets a burst straddle a boundary
(up to twice the limit across two adjacent windows); for "stop a script
guessing passwords" that is a fair trade for one row per bucket per window.

**The count is written on its own connection and committed at once.** A request
that fails — a wrong password is exactly that — raises, and the request's
transaction rolls back. A counter written inside it would roll back too, and
the attempts an attacker makes would be precisely the ones never counted. The
connection comes from the limiter's own small pool, never the request's (see
`_engine_of` for the pile-up that avoids).

**Two keys per request where there is an account to name.** The address stops
one machine trying many accounts; the account stops many machines trying one.
Accounts are stored as an HMAC, never as the email somebody typed (02 §8 keeps
emails out of places they do not need to be).

Handlers call `enforce` themselves, at the top, rather than through middleware:
the per-account key is inside the request body or behind the bearer token, and
a limit that is one visible line in the handler is one a reviewer can see is
there. `tests/test_rate_limits.py` drives every protected route to its 429.
"""
from __future__ import annotations

import hashlib
import hmac
import ipaddress
import logging
import math
import time
from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from starlette.requests import Request

from app import db as database
from app.config import Rule, get_settings, parse_rule
from app.core.errors import RateLimited
from app.db_engine import EngineOptions, options_from_settings
from app.models.ratelimit import RateLimitCounter

__all__ = ["POLICIES", "Rule", "client_ip", "enforce", "hit", "parse_rule"]

log = logging.getLogger(__name__)

#: The policies there are. Each has `rate_limit_<name>_ip` and
#: `rate_limit_<name>_account` in settings.
POLICIES = ("account_delete", "ai", "imports", "feedback")

#: Expired windows are swept once per this many hits, per process. Often enough
#: that the table stays the size of the traffic of the last day; rarely enough
#: that the sweep is not on every request's path.
PRUNE_EVERY = 500
_hits_since_prune = 0


def _now() -> float:
    """The limiter's clock. A function so the tests can hold it still."""
    return time.time()


# ------------------------------------------------------------------ addresses

def _strip_port(value: str) -> str:
    """`1.2.3.4:5678` → `1.2.3.4`, `[2001:db8::1]:443` → `2001:db8::1`.

    Some load balancers write the port too. Failing to parse that and falling
    back to the proxy's own address would put every client in one bucket.
    """
    value = value.strip()
    if value.startswith("["):
        return value[1:value.find("]")] if "]" in value else value
    if value.count(":") == 1:
        return value.split(":", 1)[0]
    return value


def _parse(value: str | None) -> ipaddress.IPv4Address | ipaddress.IPv6Address | None:
    if not value:
        return None
    try:
        address = ipaddress.ip_address(_strip_port(value))
    except ValueError:
        return None
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped:
        return address.ipv4_mapped
    return address


def client_ip(request: Request, trusted_proxies: int) -> str:
    """The address a request is counted against.

    With `trusted_proxies = N`, each of N proxies appended the address it
    received from, so the client is the N-th entry from the RIGHT of
    `X-Forwarded-For`. Everything to the left of it was written by the client
    and is ignored — reading the leftmost entry, as naive code does, lets any
    caller choose their own address.

    A chain shorter than N did not come through the proxies we were told
    about, so none of it is trusted and the direct peer is used instead.

    IPv6 is counted per /64: one subscriber is handed a whole /64, and
    counting single addresses would give them 2^64 budgets.
    """
    peer = request.client.host if request.client else None
    candidate = peer
    if trusted_proxies > 0:
        # Every header line, in order: a proxy that ADDS a line rather than
        # appending to the client's (HAProxy's `option forwardfor`) would
        # otherwise leave the forged first line as the one read.
        joined = ",".join(request.headers.getlist("x-forwarded-for"))
        chain = [p.strip() for p in joined.split(",") if p.strip()]
        if len(chain) >= trusted_proxies:
            candidate = chain[-trusted_proxies]

    address = _parse(candidate)
    if address is None and candidate != peer:
        # A trusted proxy wrote something that is not an address: the setup is
        # wrong, and every client now shares the proxy's bucket. Say so.
        log.warning("ratelimit: unparseable X-Forwarded-For entry; counting the peer instead")
    address = address or _parse(peer)
    if address is None:
        return "unknown"
    if address.version == 6:
        return str(ipaddress.ip_network(f"{address}/64", strict=False))
    return str(address)


def _account_key(account: str) -> str:
    """A keyed hash of the account, normalised the way the forms match emails.

    Keyed with a server secret (the upload-signing one, which production
    refuses to start without) so the table cannot be reversed with a list of
    likely emails. Rotating the secret resets the counts, which is harmless.
    """
    normalised = account.strip().lower().encode()
    secret = get_settings().upload_signing_secret.encode()
    return hmac.new(secret, normalised, hashlib.sha256).hexdigest()[:40]


# -------------------------------------------------------------------- counting

async def hit(engine: AsyncEngine, buckets: Sequence[tuple[str, Rule]], now: float) -> list[int]:
    """Counts one request against each bucket; returns each bucket's new count.

    One short transaction on its own connection, committed before the caller
    does anything else — see the module docstring for why that matters.
    """
    global _hits_since_prune
    counts: list[int] = []
    async with engine.begin() as conn:
        for bucket, rule in buckets:
            start = math.floor(now / rule.seconds) * rule.seconds
            stmt = (
                insert(RateLimitCounter)
                .values(
                    bucket=bucket,
                    window_start=datetime.fromtimestamp(start, UTC),
                    count=1,
                    expires_at=datetime.fromtimestamp(start + rule.seconds, UTC),
                )
                .on_conflict_do_update(
                    index_elements=[RateLimitCounter.bucket, RateLimitCounter.window_start],
                    set_={"count": RateLimitCounter.count + 1},
                )
                .returning(RateLimitCounter.count)
            )
            counts.append(int(await conn.scalar(stmt)))

        _hits_since_prune += 1
        if _hits_since_prune >= PRUNE_EVERY:
            _hits_since_prune = 0
            await conn.execute(
                delete(RateLimitCounter)
                .where(RateLimitCounter.expires_at <= datetime.fromtimestamp(now, UTC))
            )
    return counts


def _retry_after(rule: Rule, now: float) -> int:
    start = math.floor(now / rule.seconds) * rule.seconds
    return max(1, math.ceil(start + rule.seconds - now))


def _when(seconds: int) -> str:
    if seconds < 90:
        return "1 second" if seconds == 1 else f"{seconds} seconds"
    if seconds < 90 * 60:
        return f"{round(seconds / 60)} minutes"
    return f"{round(seconds / 3600)} hours"


#: The limiter's own connection pools, one per database. Small: a count is one
#: statement, held for a millisecond.
_ENGINES: dict[str, AsyncEngine] = {}
POOL_SIZE, MAX_OVERFLOW = 2, 8


def _engine_of(db: AsyncSession) -> AsyncEngine:
    """A pool of the limiter's own, on the same database as the request.

    **Never the request's pool.** A signed-in request already holds one of its
    connections when it is counted; taking the counter's from the same pool
    means a burst of such requests each holds one and waits for another, the
    pool drains, and they all time out — under exactly the load a limiter is
    for. The database is the request session's, which is how the test suite's
    own database is reached too.
    """
    bind = db.bind if isinstance(db.bind, AsyncEngine) else database.engine
    url = bind.url.render_as_string(hide_password=False)
    engine = _ENGINES.get(url)
    if engine is None:
        opts = limiter_options(url, from_app_engine=bind is database.get_engine())
        engine = create_async_engine(
            opts.url, connect_args=opts.connect_args, hide_parameters=True, **opts.pool,
        )
        _ENGINES[url] = engine
    return engine


def limiter_options(url: str, *, from_app_engine: bool) -> EngineOptions:
    """The limiter's engine is the app's, in all but pool size.

    Built from the bound engine's URL alone it lost what the URL does not
    carry: TLS (the app moves `?ssl=` into connect args) and transaction-pooler
    mode's disabled statement caches. Against Supabase with SSL enforced, every
    login would have failed at the limiter (G11 security review).
    """
    settings = get_settings()
    # The app's engine: its settings URL, which still carries the TLS mode the
    # bound URL lost. Any other engine (the suite's) is built from its own URL —
    # with the same pool mode, so a suite run through Supabase's transaction
    # pooler tests the limiter the way production runs it.
    opts = options_from_settings(settings) if from_app_engine else options_from_settings(settings, url=url)
    if "poolclass" in opts.pool:        # NullPool: transaction mode, keep it
        return opts
    return EngineOptions(url=opts.url, connect_args=opts.connect_args, pool={
        "pool_pre_ping": True, "pool_size": POOL_SIZE, "max_overflow": MAX_OVERFLOW,
    })


def account_at_address(request: Request, account: str) -> str:
    """An account key scoped to the caller's address.

    A per-account limit keyed by the email alone let anyone lock the owner out:
    six bad attempts a minute at their address and the owner's right password
    got a 429 too (G11 security review). Keyed by account AND address, a
    stranger only exhausts their own budget; a separate, looser per-account
    total still stops a botnet spreading guesses across addresses.
    """
    return f"{account}@{client_ip(request, get_settings().trusted_proxy_count)}"


async def enforce(
    db: AsyncSession,
    request: Request,
    policy: str,
    *,
    account: str | None = None,
    by_ip: bool = True,
) -> None:
    """Counts this request under `policy`; raises `RateLimited` once over.

    `account` is the email or user id the request is about, when there is one.
    `by_ip=False` counts only the account — for a second call once a handler
    has learned whose request it is (a refresh token names its user only after
    it is looked up).
    """
    settings = get_settings()
    if not settings.rate_limits_enabled:
        return

    buckets: list[tuple[str, Rule]] = []
    if by_ip:
        address = client_ip(request, settings.trusted_proxy_count)
        buckets.append((
            f"{policy}:ip:{address}", parse_rule(getattr(settings, f"rate_limit_{policy}_ip")),
        ))
    if account:
        buckets.append((
            f"{policy}:account:{_account_key(account)}",
            parse_rule(getattr(settings, f"rate_limit_{policy}_account")),
        ))
    if not buckets:
        return

    now = _now()
    counts = await hit(_engine_of(db), buckets, now)
    over = [rule for (_, rule), count in zip(buckets, counts, strict=True) if count > rule.count]
    if over:
        wait = max(_retry_after(rule, now) for rule in over)
        raise RateLimited(f"Too many attempts. Try again in {_when(wait)}.", retry_after=wait)
