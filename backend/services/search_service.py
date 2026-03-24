"""Full-text search service — SQLite FTS5 or MariaDB FULLTEXT."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from database import is_mariadb
from models.entry import Entry


async def search_entries(
    session: AsyncSession,
    query: str,
    project_slug: str | None = None,
    language: str | None = None,
    entry_type: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[Entry], int]:
    """Search entries using full-text search, falling back to LIKE."""
    try:
        if is_mariadb():
            return await _mariadb_fts_search(
                session, query, project_slug, language, entry_type, page, per_page
            )
        return await _fts_search(session, query, project_slug, language, entry_type, page, per_page)
    except Exception:
        return await _like_search(session, query, project_slug, language, entry_type, page, per_page)


async def _fts_search(
    session: AsyncSession,
    query: str,
    project_slug: str | None,
    language: str | None,
    entry_type: str | None,
    page: int,
    per_page: int,
) -> tuple[list[Entry], int]:
    """Search using SQLite FTS5 virtual table with BM25 ranking."""
    fts_query = text(
        """
        SELECT entries.id, bm25(entries_fts) as rank
        FROM entries_fts
        JOIN entries ON entries.rowid = entries_fts.rowid
        WHERE entries_fts MATCH :query
        ORDER BY rank
        """
    )
    result = await session.execute(fts_query, {"query": query})
    matched_ids = [row[0] for row in result.fetchall()]

    if not matched_ids:
        return [], 0

    stmt = select(Entry).where(Entry.id.in_(matched_ids)).options(selectinload(Entry.tags))

    if project_slug:
        from models.project import Project

        stmt = stmt.join(Entry.project).where(Project.slug == project_slug)
    if language:
        stmt = stmt.where(Entry.language == language)
    if entry_type:
        stmt = stmt.where(Entry.type == entry_type)

    entries_result = await session.execute(stmt)
    entries = list(entries_result.scalars().all())

    # Preserve FTS ranking order
    id_order = {id_: i for i, id_ in enumerate(matched_ids)}
    entries.sort(key=lambda e: id_order.get(e.id, 0))

    total = len(entries)
    start = (page - 1) * per_page
    return entries[start : start + per_page], total


async def _mariadb_fts_search(
    session: AsyncSession,
    query: str,
    project_slug: str | None,
    language: str | None,
    entry_type: str | None,
    page: int,
    per_page: int,
) -> tuple[list[Entry], int]:
    """Search using MariaDB FULLTEXT with MATCH … AGAINST relevance ranking."""
    fts_query = text(
        """
        SELECT id, MATCH(title, body) AGAINST(:query IN NATURAL LANGUAGE MODE) AS relevance
        FROM entries
        WHERE MATCH(title, body) AGAINST(:query IN NATURAL LANGUAGE MODE)
        ORDER BY relevance DESC
        """
    )
    result = await session.execute(fts_query, {"query": query})
    matched_ids = [row[0] for row in result.fetchall()]

    if not matched_ids:
        return [], 0

    stmt = select(Entry).where(Entry.id.in_(matched_ids)).options(selectinload(Entry.tags))

    if project_slug:
        from models.project import Project

        stmt = stmt.join(Entry.project).where(Project.slug == project_slug)
    if language:
        stmt = stmt.where(Entry.language == language)
    if entry_type:
        stmt = stmt.where(Entry.type == entry_type)

    entries_result = await session.execute(stmt)
    entries = list(entries_result.scalars().all())

    # Preserve FULLTEXT ranking order
    id_order = {id_: i for i, id_ in enumerate(matched_ids)}
    entries.sort(key=lambda e: id_order.get(e.id, 0))

    total = len(entries)
    start = (page - 1) * per_page
    return entries[start : start + per_page], total


async def _like_search(
    session: AsyncSession,
    query: str,
    project_slug: str | None,
    language: str | None,
    entry_type: str | None,
    page: int,
    per_page: int,
) -> tuple[list[Entry], int]:
    """Fallback search using LIKE when FTS5 is unavailable."""
    like_pattern = f"%{query}%"
    stmt = (
        select(Entry)
        .where((Entry.title.ilike(like_pattern)) | (Entry.body.ilike(like_pattern)))
        .options(selectinload(Entry.tags))
    )

    if project_slug:
        from models.project import Project

        stmt = stmt.join(Entry.project).where(Project.slug == project_slug)
    if language:
        stmt = stmt.where(Entry.language == language)
    if entry_type:
        stmt = stmt.where(Entry.type == entry_type)

    stmt = stmt.order_by(Entry.updated_at.desc())

    result = await session.execute(stmt)
    all_entries = list(result.scalars().all())

    total = len(all_entries)
    start = (page - 1) * per_page
    return all_entries[start : start + per_page], total
