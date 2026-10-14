"""Pagination helpers for SQLAlchemy queries."""

from __future__ import annotations

from typing import Any, Sequence, TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.schemas import PaginatedResponse, PaginationParams

T = TypeVar("T")


async def paginate(
    session: AsyncSession,
    query: Select,
    params: PaginationParams,
    *,
    response_model: type[T] | None = None,
) -> PaginatedResponse[Any]:
    """Execute a query with pagination and return a PaginatedResponse.

    Args:
        session: Database session.
        query: The base SELECT query.
        params: Pagination parameters (page, page_size).
        response_model: Optional Pydantic model to convert rows.

    Returns:
        PaginatedResponse with items, total count, and page metadata.
    """
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    # Paginate
    paginated_query = query.offset(params.offset).limit(params.page_size)
    result = await session.execute(paginated_query)
    rows: Sequence = result.scalars().all()

    # Convert if needed
    if response_model is not None:
        items = [response_model.model_validate(row) for row in rows]
    else:
        items = list(rows)

    pages = max(1, (total + params.page_size - 1) // params.page_size)

    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=pages,
    )
