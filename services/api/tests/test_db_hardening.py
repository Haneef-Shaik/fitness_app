"""Supabase's Data API cannot reach FitLog's tables (L1, docs/12 §2).

Supabase grants its `anon` and `authenticated` roles privileges on tables
created in `public`, and serves `public` over its Data API. FitLog keeps its own
auth and never uses that API, so the grants would be a second door to every row
— password hashes included — for anyone holding the project's anon key.

Each test runs inside one transaction that is rolled back: roles are
cluster-wide in Postgres, and a probe role must not outlive the test.
"""
from __future__ import annotations

import uuid

from sqlalchemy import text

from app.db_hardening import SUPABASE_API_ROLES, revoke_data_api_grants


async def _can(conn, role: str, table: str, privilege: str = "SELECT") -> bool:
    return bool(await conn.scalar(
        text("SELECT has_table_privilege(:role, :table, :privilege)"),
        {"role": role, "table": table, "privilege": privilege},
    ))


class TestTheRevoke:
    async def test_existing_grants_go(self, engine):
        role = f"fitlog_probe_{uuid.uuid4().hex[:8]}"
        async with engine.connect() as conn:
            trans = await conn.begin()
            try:
                await conn.execute(text(f'CREATE ROLE "{role}" NOLOGIN'))
                await conn.execute(text(f'GRANT ALL ON ALL TABLES IN SCHEMA public TO "{role}"'))
                assert await _can(conn, role, "users")  # otherwise this proves nothing

                revoked = await revoke_data_api_grants(conn, roles=(role,))

                assert revoked == [role]
                for table in ("users", "push_tokens", "progress_photos"):
                    for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE"):
                        assert not await _can(conn, role, table, privilege), (table, privilege)
            finally:
                await trans.rollback()

    async def test_a_table_created_afterwards_is_not_granted_either(self, engine):
        """The next migration's table must not arrive with the grant back."""
        role = f"fitlog_probe_{uuid.uuid4().hex[:8]}"
        async with engine.connect() as conn:
            trans = await conn.begin()
            try:
                await conn.execute(text(f'CREATE ROLE "{role}" NOLOGIN'))
                await conn.execute(text(
                    f'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "{role}"'
                ))

                await revoke_data_api_grants(conn, roles=(role,))
                await conn.execute(text("CREATE TABLE probe_after_revoke (id int)"))

                assert not await _can(conn, role, "probe_after_revoke")
            finally:
                await trans.rollback()

    async def test_a_database_without_the_roles_is_left_alone(self, engine):
        # Development, the suite and CI have no `anon` role.
        async with engine.connect() as conn:
            trans = await conn.begin()
            try:
                assert await revoke_data_api_grants(
                    conn, roles=(f"fitlog_absent_{uuid.uuid4().hex[:8]}",)
                ) == []
            finally:
                await trans.rollback()

    def test_the_roles_are_supabases_public_key_roles(self):
        assert SUPABASE_API_ROLES == ("anon", "authenticated")
