"""Pydantic request/response models for entries."""

from datetime import datetime

from pydantic import BaseModel, Field


class TagResponse(BaseModel):
    id: str
    name: str

    model_config = {"from_attributes": True}


class EntryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)
    type: str = Field(default="prompt", pattern=r"^(prompt|snippet|context)$")
    language: str | None = None
    project_id: str | None = None
    tags: list[str] = Field(default_factory=list)


class EntryUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    body: str | None = Field(None, min_length=1)
    type: str | None = Field(None, pattern=r"^(prompt|snippet|context)$")
    language: str | None = None
    project_id: str | None = None
    tags: list[str] | None = None


class EntryResponse(BaseModel):
    id: str
    title: str
    body: str
    type: str
    language: str | None
    project_id: str | None
    tags: list[TagResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
