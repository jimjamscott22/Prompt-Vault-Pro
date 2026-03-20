"""Common response envelope schemas."""

from typing import Any, Optional

from pydantic import BaseModel


class Meta(BaseModel):
    page: int = 1
    per_page: int = 20
    total: int = 0


class DataResponse(BaseModel):
    data: Any
    meta: Optional[Meta] = None


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
