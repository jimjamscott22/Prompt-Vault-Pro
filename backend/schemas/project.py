"""Pydantic request/response models for projects."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255, pattern=r"^[a-z0-9\-]+$")
    description: Optional[str] = None
    path: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255, pattern=r"^[a-z0-9\-]+$")
    description: Optional[str] = None
    path: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    path: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
