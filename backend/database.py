"""SQLAlchemy async engine and session configuration (SQLite only)."""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

# Load .env from project root (one level up from backend/)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SCHEMA_VERSION = 1

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
    """Create all tables, initialize full-text search, and record the schema version."""
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

    async with engine.begin() as conn:
        from models.bundle import Bundle, BundleEntry  # noqa: F401
        from models.entry import Entry, EntryTag, Tag  # noqa: F401
        from models.project import Project  # noqa: F401

        await conn.run_sync(Base.metadata.create_all)
        await _init_sqlite_fts(conn)

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
        await conn.execute(
            text("INSERT OR IGNORE INTO schema_version (version) VALUES (:version)"),
            {"version": SCHEMA_VERSION},
        )


async def _init_sqlite_fts(conn):
    """Create the FTS5 virtual table, keep it in sync via triggers, and rebuild it.

    ``entries_fts`` is an external-content table, so SQLite does not update it when
    ``entries`` changes. The triggers below mirror every insert, update, and delete.
    The rebuild on startup repairs databases whose index is empty or stale (for
    example rows created before the triggers existed, or rowids renumbered by VACUUM).
    """
    await conn.execute(
        text(
            """
            CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts
            USING fts5(title, body, content='entries', content_rowid='rowid')
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE TRIGGER IF NOT EXISTS entries_fts_ai AFTER INSERT ON entries BEGIN
                INSERT INTO entries_fts(rowid, title, body)
                VALUES (new.rowid, new.title, new.body);
            END
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE TRIGGER IF NOT EXISTS entries_fts_ad AFTER DELETE ON entries BEGIN
                INSERT INTO entries_fts(entries_fts, rowid, title, body)
                VALUES ('delete', old.rowid, old.title, old.body);
            END
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE TRIGGER IF NOT EXISTS entries_fts_au AFTER UPDATE ON entries BEGIN
                INSERT INTO entries_fts(entries_fts, rowid, title, body)
                VALUES ('delete', old.rowid, old.title, old.body);
                INSERT INTO entries_fts(rowid, title, body)
                VALUES (new.rowid, new.title, new.body);
            END
            """
        )
    )
    await conn.execute(text("INSERT INTO entries_fts(entries_fts) VALUES ('rebuild')"))
