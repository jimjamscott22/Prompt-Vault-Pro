"""Pydantic request/response models for bundles."""

from datetime import datetime

from pydantic import BaseModel, Field

from schemas.entry import EntryResponse


class BundleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    export_format: str = Field(
        default="markdown",
        pattern=r"^(claude_md|markdown|json|plaintext)$",
    )


class BundleUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    export_format: str | None = Field(
        None,
        pattern=r"^(claude_md|markdown|json|plaintext)$",
    )


class BundleAddEntry(BaseModel):
    entry_id: str
    position: int | None = None


class BundleResponse(BaseModel):
    id: str
    name: str
    description: str | None
    export_format: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BundleDetailResponse(BundleResponse):
    entries: list[EntryResponse] = []
