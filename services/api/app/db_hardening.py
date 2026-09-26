"""Supabase's Data API must not reach FitLog's tables (L1).

Supabase serves the `public` schema over its Data API (PostgREST) and grants its
`anon` and `authenticated` roles privileges on the tables created there. FitLog
signs in with Supabase Auth (docs/14) but reads and writes only through its own
API, never the Data API — so those grants would be a second door to every row
for anyone holding the project's publishable key, which the app ships with, or
a signed-in user's token (the `authenticated` role).

The runbook turns the Data API off (docs/12 §2). This is the other half, and it
does not depend on anyone remembering a dashboard switch: the release step
(`scripts/migrate.sh`) revokes the grants on every deploy, after the migrations,
together with the default privileges that would grant them again on the next
table a migration creates. On a database without those roles — development,
the suite, CI — it does nothing.

Not a migration on purpose: the grants are Supabase's platform state, not
FitLog's schema, and a hosted project can be given them back (a dashboard
toggle, a restore) at any time. A step that runs every release re-asserts it.
"""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

#: The roles Supabase's public API keys act as. `service_role` is left alone:
#: its key is secret, FitLog never holds it, and Supabase's own tooling uses it.
SUPABASE_API_ROLES: tuple[str, ...] = ("anon", "authenticated")

_OBJECTS = ("TABLES", "SEQUENCES", "FUNCTIONS")


async def revoke_data_api_grants(
    conn: AsyncConnection, roles: tuple[str, ...] = SUPABASE_API_ROLES
) -> list[str]:
    """Revokes every privilege `roles` hold in `public`, now and by default.
    Returns the roles that existed; the rest are skipped."""
    present = [
        role for role in roles
        if await conn.scalar(text("SELECT 1 FROM pg_roles WHERE rolname = :r"), {"r": role})
    ]
    for role in present:
        # Identifiers cannot be bound parameters. `role` is one of the names
        # above, never input, and is quoted regardless.
        quoted = '"' + role.replace('"', '""') + '"'
        for kind in _OBJECTS:
            await conn.execute(text(f"REVOKE ALL ON ALL {kind} IN SCHEMA public FROM {quoted}"))
            # For the role running the migrations — the one that will create
            # the next table.
            await conn.execute(text(
                f"ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON {kind} FROM {quoted}"
            ))
    return present
