"""Pregnancy REST endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_roles
from app.auth.models import User
from app.common.enums import UserRole
from app.database import get_db
from app.pregnancies.schemas import PregnancyCreate, PregnancyResponse, PregnancyUpdate
from app.pregnancies.service import PregnancyService

router = APIRouter(prefix="/pregnancies", tags=["Pregnancies"])


@router.post("", response_model=PregnancyResponse, status_code=status.HTTP_201_CREATED)
async def register_pregnancy(
    data: PregnancyCreate,
    current_user: Annotated[User, Depends(require_roles([
        UserRole.CHW, UserRole.MIDWIFE, UserRole.DATA_OFFICER,
        UserRole.FACILITY_MANAGER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PregnancyResponse:
    """Register a new pregnancy linked to a mother."""
    service = PregnancyService(db)
    pregnancy = await service.register_pregnancy(data, current_user)
    return PregnancyResponse.model_validate(pregnancy)


@router.get("/{pregnancy_id}", response_model=PregnancyResponse)
async def get_pregnancy(
    pregnancy_id: uuid.UUID,
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PregnancyResponse:
    """Get single pregnancy record by ID."""
    service = PregnancyService(db)
    pregnancy = await service.get_pregnancy_by_id(pregnancy_id)
    return PregnancyResponse.model_validate(pregnancy)


@router.get("/mother/{mother_id}", response_model=list[PregnancyResponse])
async def list_mother_pregnancies(
    mother_id: uuid.UUID,
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[PregnancyResponse]:
    """Get longitudinal pregnancy history for a mother."""
    service = PregnancyService(db)
    pregnancies = await service.list_by_mother(mother_id)
    return [PregnancyResponse.model_validate(p) for p in pregnancies]


@router.patch("/{pregnancy_id}", response_model=PregnancyResponse)
async def update_pregnancy(
    pregnancy_id: uuid.UUID,
    data: PregnancyUpdate,
    _current_user: Annotated[User, Depends(require_roles([
        UserRole.MIDWIFE, UserRole.FACILITY_MANAGER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PregnancyResponse:
    """Update risk status or clinical outcome."""
    service = PregnancyService(db)
    pregnancy = await service.update_pregnancy(pregnancy_id, data)
    return PregnancyResponse.model_validate(pregnancy)
