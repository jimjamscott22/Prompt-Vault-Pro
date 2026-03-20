"""Bundle CRUD and export router."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from schemas.common import DataResponse, Meta
from schemas.bundle import BundleCreate, BundleUpdate, BundleAddEntry, BundleResponse, BundleDetailResponse
from schemas.entry import EntryResponse
from services import bundle_service

router = APIRouter(tags=["bundles"])


@router.get("/bundles")
async def list_bundles(
    page: int = 1,
    per_page: int = 20,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Return paginated bundles."""
    bundles, total = await bundle_service.list_bundles(session, page=page, per_page=per_page)
    return DataResponse(
        data=[BundleResponse.model_validate(b) for b in bundles],
        meta=Meta(page=page, per_page=per_page, total=total),
    )


@router.post("/bundles", status_code=201)
async def create_bundle(
    data: BundleCreate,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Create a new bundle."""
    bundle = await bundle_service.create_bundle(session, data)
    return DataResponse(data=BundleResponse.model_validate(bundle))


@router.get("/bundles/{bundle_id}")
async def get_bundle(
    bundle_id: str,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Return a single bundle by ID with its entries."""
    bundle = await bundle_service.get_bundle(session, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Bundle not found"}})

    entries = [
        EntryResponse.model_validate(be.entry)
        for be in sorted(bundle.bundle_entries, key=lambda be: be.position)
    ]
    response = BundleDetailResponse(
        id=bundle.id,
        name=bundle.name,
        description=bundle.description,
        export_format=bundle.export_format,
        created_at=bundle.created_at,
        updated_at=bundle.updated_at,
        entries=entries,
    )
    return DataResponse(data=response)


@router.put("/bundles/{bundle_id}")
async def update_bundle(
    bundle_id: str,
    data: BundleUpdate,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Update an existing bundle."""
    bundle = await bundle_service.update_bundle(session, bundle_id, data)
    if not bundle:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Bundle not found"}})
    return DataResponse(data=BundleResponse.model_validate(bundle))


@router.delete("/bundles/{bundle_id}", status_code=204)
async def delete_bundle(
    bundle_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Delete a bundle by ID."""
    deleted = await bundle_service.delete_bundle(session, bundle_id)
    if not deleted:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Bundle not found"}})


@router.post("/bundles/{bundle_id}/entries", status_code=201)
async def add_entry_to_bundle(
    bundle_id: str,
    data: BundleAddEntry,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Add an entry to a bundle."""
    added = await bundle_service.add_entry_to_bundle(
        session, bundle_id, data.entry_id, data.position,
    )
    if not added:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "Bundle or entry not found"}},
        )
    return DataResponse(data={"status": "added"})


@router.get("/bundles/{bundle_id}/export")
async def export_bundle(
    bundle_id: str,
    format: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Export a bundle in the specified format."""
    content = await bundle_service.export_bundle(session, bundle_id, format)
    if content is None:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Bundle not found"}})
    return PlainTextResponse(content=content)
