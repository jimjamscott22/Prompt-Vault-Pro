"""Entry CRUD router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from schemas.common import DataResponse, Meta
from schemas.entry import EntryCreate, EntryUpdate, EntryResponse
from services import entry_service

router = APIRouter(tags=["entries"])


@router.get("/entries")
async def list_entries(
    page: int = 1,
    per_page: int = 20,
    project_id: str | None = None,
    type: str | None = None,
    language: str | None = None,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Return paginated entries with optional filters."""
    entries, total = await entry_service.list_entries(
        session, page=page, per_page=per_page,
        project_id=project_id, entry_type=type, language=language,
    )
    return DataResponse(
        data=[EntryResponse.model_validate(e) for e in entries],
        meta=Meta(page=page, per_page=per_page, total=total),
    )


@router.post("/entries", status_code=201)
async def create_entry(
    data: EntryCreate,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Create a new entry."""
    entry = await entry_service.create_entry(session, data)
    return DataResponse(data=EntryResponse.model_validate(entry))


@router.get("/entries/{entry_id}")
async def get_entry(
    entry_id: str,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Return a single entry by ID."""
    entry = await entry_service.get_entry(session, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Entry not found"}})
    return DataResponse(data=EntryResponse.model_validate(entry))


@router.put("/entries/{entry_id}")
async def update_entry(
    entry_id: str,
    data: EntryUpdate,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Update an existing entry."""
    entry = await entry_service.update_entry(session, entry_id, data)
    if not entry:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Entry not found"}})
    return DataResponse(data=EntryResponse.model_validate(entry))


@router.delete("/entries/{entry_id}", status_code=204)
async def delete_entry(
    entry_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Delete an entry by ID."""
    deleted = await entry_service.delete_entry(session, entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Entry not found"}})
