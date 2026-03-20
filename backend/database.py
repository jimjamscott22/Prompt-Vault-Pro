"""SQLAlchemy async engine and session configuration."""

import os
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

DB_PATH = os.environ.get(
    "PROMPTVAULT_DB_PATH",
    str(Path.home() / ".config" / "promptvault" / "promptvault.db"),
)
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncSession:
    """Yield an async database session."""
    async with async_session() as session:
        yield session


async def init_db():
    """Create all tables and initialize FTS5 if not present."""
    # Ensure the directory exists
    db_dir = Path(DB_PATH).parent
    db_dir.mkdir(parents=True, exist_ok=True)

    async with engine.begin() as conn:
        from models.entry import Entry, Tag, EntryTag  # noqa: F401
        from models.bundle import Bundle, BundleEntry  # noqa: F401
        from models.project import Project  # noqa: F401

        await conn.run_sync(Base.metadata.create_all)

        # Create FTS5 virtual table for full-text search on entries
        await conn.execute(
            text(
                """
                CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts
                USING fts5(title, body, content='entries', content_rowid='rowid')
                """
            )
        )

        # Schema version tracking
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS schema_version (
                    version INTEGER PRIMARY KEY,
                    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
                )
                """
            )
        )
