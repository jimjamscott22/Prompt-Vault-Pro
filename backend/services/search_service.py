"""Full-text search service backed by SQLite FTS5."""

import logging

from sqlalchemy import Select, func, select, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.entry import Entry
from models.project import Project

logger = logging.getLogger(__name__)


async def search_entries(
    session: AsyncSession,
    query: str,
    project_slug: str | None = None,
    language: str | None = None,
    entry_type: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[Entry], int]:
    """Search entries using full-text search, falling back to LIKE.

    The fallback only covers query-level failures (for example FTS5 syntax errors
    from user input such as an unbalanced quote). Other errors propagate.
    """
    try:
        return await _fts_search(session, query, project_slug, language, entry_type, page, per_page)
    except OperationalError as exc:
        logger.warning("Full-text search failed (%s); falling back to LIKE", exc.orig)
        return await _like_search(
            session, query, project_slug, language, entry_type, page, per_page
        )


def _apply_filters(
    stmt: Select,
    project_slug: str | None,
    language: str | None,
    entry_type: str | None,
) -> Select:
    """Add the optional project, language, and type filters to an entry query."""
    if project_slug:
        stmt = stmt.join(Project, Project.id == Entry.project_id).where(
            Project.slug == project_slug
        )
    if language:
        stmt = stmt.where(Entry.language == language)
    if entry_type:
        stmt = stmt.where(Entry.type == entry_type)
    return stmt


async def _load_in_order(session: AsyncSession, ids: list[str]) -> list[Entry]:
    """Load entries (with tags) for the given IDs, preserving the ID order."""
    if not ids:
        return []
    result = await session.execute(
        select(Entry).where(Entry.id.in_(ids)).options(selectinload(Entry.tags))
    )
    by_id = {e.id: e for e in result.scalars().all()}
    return [by_id[i] for i in ids if i in by_id]


async def _fts_search(
    session: AsyncSession,
    query: str,
    project_slug: str | None,
    language: str | None,
    entry_type: str | None,
    page: int,
    per_page: int,
) -> tuple[list[Entry], int]:
    """Search the FTS5 table with BM25 ranking; filtering and paging happen in SQL."""
    clauses = ["entries_fts MATCH :query"]
    params: dict[str, object] = {"query": query}
    joins = ""
    if project_slug:
        joins = "JOIN projects ON projects.id = entries.project_id"
        clauses.append("projects.slug = :project_slug")
        params["project_slug"] = project_slug
    if language:
        clauses.append("entries.language = :language")
        params["language"] = language
    if entry_type:
        clauses.append("entries.type = :entry_type")
        params["entry_type"] = entry_type

    base = (
        "FROM entries_fts JOIN entries ON entries.rowid = entries_fts.rowid "
        f"{joins} WHERE {' AND '.join(clauses)}"
    )
    total = (await session.execute(text(f"SELECT COUNT(*) {base}"), params)).scalar_one()
    if total == 0:
        return [], 0

    page_params = {**params, "limit": per_page, "offset": (page - 1) * per_page}
    rows = await session.execute(
        text(
            f"SELECT entries.id {base} "
            "ORDER BY bm25(entries_fts), entries.id LIMIT :limit OFFSET :offset"
        ),
        page_params,
    )
    return await _load_in_order(session, [r[0] for r in rows.fetchall()]), total


async def _like_search(
    session: AsyncSession,
    query: str,
    project_slug: str | None,
    language: str | None,
    entry_type: str | None,
    page: int,
    per_page: int,
) -> tuple[list[Entry], int]:
    """Fallback search using LIKE when the FTS query is malformed."""
    escaped = query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    like_pattern = f"%{escaped}%"
    match = Entry.title.ilike(like_pattern, escape="\\") | Entry.body.ilike(
        like_pattern, escape="\\"
    )

    count_stmt = _apply_filters(
        select(func.count(Entry.id)).where(match), project_slug, language, entry_type
    )
    total = (await session.execute(count_stmt)).scalar_one()

    ids_stmt = (
        _apply_filters(select(Entry.id).where(match), project_slug, language, entry_type)
        .order_by(Entry.updated_at.desc(), Entry.id)
        .limit(per_page)
        .offset((page - 1) * per_page)
    )
    ids = [r[0] for r in (await session.execute(ids_stmt)).all()]
    return await _load_in_order(session, ids), total
