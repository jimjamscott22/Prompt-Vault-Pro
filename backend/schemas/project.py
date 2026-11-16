"""Pydantic request/response models for projects."""

from datetime import datetime

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255, pattern=r"^[a-z0-9\-]+$")
    description: str | None = None
    path: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    slug: str | None = Field(None, min_length=1, max_length=255, pattern=r"^[a-z0-9\-]+$")
    description: str | None = None
    path: str | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    path: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
