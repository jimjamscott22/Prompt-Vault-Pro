"""Search FTS endpoint."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from schemas.common import DataResponse, Meta
from schemas.entry import EntryResponse
from services import search_service

router = APIRouter(tags=["search"])


@router.get("/search")
async def search(
    q: str = Query(..., min_length=1),
    project: str | None = None,
    lang: str | None = None,
    type: str | None = None,
    page: int = 1,
    per_page: int = 20,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Search entries using full-text search with optional filters."""
    entries, total = await search_service.search_entries(
        session,
        query=q,
        project_slug=project,
        language=lang,
        entry_type=type,
        page=page,
        per_page=per_page,
    )
    return DataResponse(
        data=[EntryResponse.model_validate(e) for e in entries],
        meta=Meta(page=page, per_page=per_page, total=total),
    )
