"""Shared test fixtures."""

import os

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Use in-memory SQLite for tests
os.environ["PROMPTVAULT_DB_ENGINE"] = "sqlite"
os.environ["PROMPTVAULT_DB_PATH"] = ":memory:"

from database import init_db  # noqa: E402
from main import app  # noqa: E402


@pytest_asyncio.fixture
async def client():
    """Provide an async test client."""
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
