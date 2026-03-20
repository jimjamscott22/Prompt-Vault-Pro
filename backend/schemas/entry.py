"""Pydantic request/response models for entries."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TagResponse(BaseModel):
    id: str
    name: str

    model_config = {"from_attributes": True}


class EntryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)
    type: str = Field(default="prompt", pattern=r"^(prompt|snippet|context)$")
    language: Optional[str] = None
    project_id: Optional[str] = None
    tags: list[str] = Field(default_factory=list)


class EntryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    body: Optional[str] = Field(None, min_length=1)
    type: Optional[str] = Field(None, pattern=r"^(prompt|snippet|context)$")
    language: Optional[str] = None
    project_id: Optional[str] = None
    tags: Optional[list[str]] = None


class EntryResponse(BaseModel):
    id: str
    title: str
    body: str
    type: str
    language: Optional[str]
    project_id: Optional[str]
    tags: list[TagResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
