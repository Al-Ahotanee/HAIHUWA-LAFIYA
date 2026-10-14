"""Clinical Assessment REST router."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessments.schemas import ClinicalAssessmentCreate, ClinicalAssessmentResponse
from app.assessments.service import ClinicalAssessmentService
from app.auth.dependencies import get_current_user, require_roles
from app.auth.models import User
from app.common.enums import UserRole
from app.common.schemas import PaginatedResponse, PaginationParams
from app.database import get_db

router = APIRouter(prefix="/assessments", tags=["Clinical Assessments"])


@router.get("", response_model=PaginatedResponse[ClinicalAssessmentResponse])
async def list_all_assessments(
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    params: PaginationParams = Depends(),
) -> PaginatedResponse[ClinicalAssessmentResponse]:
    """Retrieve all clinical assessments with pagination."""
    service = ClinicalAssessmentService(db)
    return await service.list_all_assessments(params)


@router.post("", response_model=ClinicalAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def record_clinical_assessment(
    data: ClinicalAssessmentCreate,
    current_user: Annotated[User, Depends(require_roles([
        UserRole.MIDWIFE, UserRole.FACILITY_MANAGER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ClinicalAssessmentResponse:
    """Record clinical observations, danger signs, and lab results."""
    service = ClinicalAssessmentService(db)
    assessment = await service.record_assessment(data, current_user)
    return ClinicalAssessmentResponse.model_validate(assessment)


@router.get("/pregnancy/{pregnancy_id}", response_model=list[ClinicalAssessmentResponse])
async def list_assessments(
    pregnancy_id: uuid.UUID,
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ClinicalAssessmentResponse]:
    """Retrieve full clinical timeline of assessments for a pregnancy."""
    service = ClinicalAssessmentService(db)
    records = await service.list_by_pregnancy(pregnancy_id)
    return [ClinicalAssessmentResponse.model_validate(r) for r in records]
