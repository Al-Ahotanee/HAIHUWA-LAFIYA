"""Referral REST router."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_roles
from app.auth.models import User
from app.common.enums import UserRole
from app.common.schemas import PaginatedResponse, PaginationParams
from app.database import get_db
from app.referrals.schemas import ReferralCreate, ReferralResponse, ReferralStatusUpdate
from app.referrals.service import ReferralService

router = APIRouter(prefix="/referrals", tags=["Referrals"])


@router.get("", response_model=PaginatedResponse[ReferralResponse])
async def list_referrals(
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    params: PaginationParams = Depends(),
    status: str | None = None,
    urgency: str | None = None,
) -> PaginatedResponse[ReferralResponse]:
    """List all referrals with pagination and filters."""
    service = ReferralService(db)
    return await service.list_referrals(params, status=status, urgency=urgency)


@router.post("", response_model=ReferralResponse, status_code=status.HTTP_201_CREATED)
async def initiate_referral(
    data: ReferralCreate,
    current_user: Annotated[User, Depends(require_roles([
        UserRole.MIDWIFE, UserRole.FACILITY_MANAGER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReferralResponse:
    """Initiate a formal patient referral between facilities."""
    service = ReferralService(db)
    referral = await service.initiate_referral(data, current_user)
    return ReferralResponse.model_validate(referral)


@router.patch("/{referral_id}/status", response_model=ReferralResponse)
async def update_referral_status(
    referral_id: uuid.UUID,
    data: ReferralStatusUpdate,
    current_user: Annotated[User, Depends(require_roles([
        UserRole.MIDWIFE, UserRole.FACILITY_MANAGER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReferralResponse:
    """Transition referral status (accepted, in_transit, completed, declined)."""
    service = ReferralService(db)
    referral = await service.transition_status(referral_id, data, current_user)
    return ReferralResponse.model_validate(referral)
