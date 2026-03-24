"""SQLAlchemy async engine and session configuration.

Supports two backends:
  - SQLite (default): set PROMPTVAULT_DB_PATH or leave default
  - MariaDB/MySQL:    set PROMPTVAULT_DB_ENGINE=mariadb and provide connection vars
"""

import os
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text


DB_ENGINE = os.environ.get("PROMPTVAULT_DB_ENGINE", "sqlite").lower()

if DB_ENGINE == "mariadb":
    # Build MariaDB URL from individual vars or a single URL
    DATABASE_URL = os.environ.get("PROMPTVAULT_DB_URL", "")
    if not DATABASE_URL:
        _host = os.environ.get("PROMPTVAULT_MARIADB_HOST", "127.0.0.1")
        _port = os.environ.get("PROMPTVAULT_MARIADB_PORT", "3306")
        _user = os.environ.get("PROMPTVAULT_MARIADB_USER", "promptvault")
        _password = os.environ.get("PROMPTVAULT_MARIADB_PASSWORD", "")
        _database = os.environ.get("PROMPTVAULT_MARIADB_DATABASE", "promptvault")
        DATABASE_URL = f"mysql+aiomysql://{_user}:{_password}@{_host}:{_port}/{_database}"
    DB_PATH = None
else:
    DB_PATH = os.environ.get(
        "PROMPTVAULT_DB_PATH",
        str(Path.home() / ".config" / "promptvault" / "promptvault.db"),
    )
    DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def is_mariadb() -> bool:
    """Return True if the active backend is MariaDB/MySQL."""
    return DB_ENGINE == "mariadb"


async def get_session() -> AsyncSession:
    """Yield an async database session."""
    async with async_session() as session:
        yield session


async def init_db():
    """Create all tables and initialize full-text search."""
    if DB_PATH is not None:
        db_dir = Path(DB_PATH).parent
        db_dir.mkdir(parents=True, exist_ok=True)

    async with engine.begin() as conn:
        from models.entry import Entry, Tag, EntryTag  # noqa: F401
        from models.bundle import Bundle, BundleEntry  # noqa: F401
        from models.project import Project  # noqa: F401

        await conn.run_sync(Base.metadata.create_all)

        if is_mariadb():
            await _init_mariadb_fts(conn)
        else:
            await _init_sqlite_fts(conn)

        # Schema version tracking (syntax works on both dialects)
        if is_mariadb():
            await conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS schema_version (
                        version INTEGER PRIMARY KEY,
                        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
            )
        else:
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


async def _init_sqlite_fts(conn):
    """Create FTS5 virtual table for SQLite full-text search."""
    await conn.execute(
        text(
            """
            CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts
            USING fts5(title, body, content='entries', content_rowid='rowid')
            """
        )
    )


async def _init_mariadb_fts(conn):
    """Add FULLTEXT index on entries(title, body) for MariaDB."""
    # Check if the index already exists before creating
    result = await conn.execute(
        text(
            """
            SELECT COUNT(*) FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'entries'
              AND index_name = 'ft_entries_title_body'
            """
        )
    )
    if result.scalar() == 0:
        await conn.execute(
            text(
                "ALTER TABLE entries ADD FULLTEXT INDEX ft_entries_title_body (title, body)"
            )
        )
