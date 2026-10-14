"""Mother registration and management REST endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_roles
from app.auth.models import User
from app.common.enums import UserRole
from app.common.schemas import PaginatedResponse, PaginationParams
from app.database import get_db
from app.mothers.schemas import (
    DeduplicationCheckRequest,
    DeduplicationCheckResponse,
    MotherCreate,
    MotherResponse,
    MotherUpdate,
)
from app.mothers.service import MotherService

router = APIRouter(prefix="/mothers", tags=["Mothers"])


@router.post("", response_model=MotherResponse, status_code=status.HTTP_201_CREATED)
async def register_mother(
    data: MotherCreate,
    current_user: Annotated[User, Depends(require_roles([
        UserRole.CHW, UserRole.MIDWIFE, UserRole.DATA_OFFICER,
        UserRole.FACILITY_MANAGER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MotherResponse:
    """Register a new mother with deduplication and ID generation."""
    service = MotherService(db)
    mother = await service.create_mother(data, current_user)
    return MotherResponse.model_validate(mother)


@router.post("/check-duplicates", response_model=DeduplicationCheckResponse)
async def check_duplicates(
    data: DeduplicationCheckRequest,
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DeduplicationCheckResponse:
    """Check for potential duplicate registrations before submission."""
    service = MotherService(db)
    duplicates = await service.check_duplicates(data)
    matches = [MotherResponse.model_validate(m) for m in duplicates]
    return DeduplicationCheckResponse(
        potential_duplicates_found=len(matches) > 0,
        count=len(matches),
        matches=matches,
    )


@router.get("", response_model=PaginatedResponse[MotherResponse])
async def list_mothers(
    params: Annotated[PaginationParams, Depends()],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str | None = Query(None, description="Search by name, ID or phone"),
) -> PaginatedResponse[MotherResponse]:
    """List registered mothers scoped by geographic authorization."""
    service = MotherService(db)
    return await service.list_mothers(
        params,
        search=search,
        ward_id=current_user.ward_id,
        lga_id=current_user.lga_id,
    )


@router.get("/{mother_id}", response_model=MotherResponse)
async def get_mother(
    mother_id: uuid.UUID,
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MotherResponse:
    """Get single mother profile by UUID."""
    service = MotherService(db)
    mother = await service.get_mother_by_id(mother_id)
    return MotherResponse.model_validate(mother)
