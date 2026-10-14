"""Shared Pydantic schemas for pagination, errors and common responses."""

from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Query parameters for paginated list endpoints."""

    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=25, ge=1, le=100, description="Items per page")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response envelope."""

    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class ErrorResponse(BaseModel):
    """Standard error response body."""

    detail: str
    code: str = "UNKNOWN_ERROR"


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "healthy"
    environment: str
    version: str = "1.0.0"
    timestamp: datetime
