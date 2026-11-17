"""Test health endpoint."""

import pytest


@pytest.mark.asyncio
async def test_health(client):
    """Health endpoint returns ok."""
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_schema_version_recorded(client):
    """Startup records the current schema version exactly once."""
    from sqlalchemy import text

    from database import SCHEMA_VERSION, engine, init_db

    await init_db()  # idempotent
    async with engine.connect() as conn:
        rows = (await conn.execute(text("SELECT version FROM schema_version"))).fetchall()
    assert [r[0] for r in rows] == [SCHEMA_VERSION]
